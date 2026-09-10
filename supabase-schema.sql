-- Run this in Supabase's SQL Editor (Project → SQL Editor → New query)
-- This is the complete, current schema -- run it once, top to bottom,
-- in a fresh/empty project. Consolidates everything the app actually
-- needs as of this version, including the specialties column the
-- practitioner signup form sends that earlier versions of this file
-- were missing.

-- Supabase's built-in auth.users table handles email, password, and
-- verification automatically — these tables link to it by user id
-- rather than storing passwords or emails themselves.

create table clients (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  first_name text,
  last_name text,
  mobile text,
  reasons text[]  -- e.g. {'money','ato'} — matches the REASONS ids in constants.js
);

create table practitioners (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  name text,
  firm text,
  practitioner_type text,  -- 'Liquidator' | 'Small Business Restructuring Practitioner' | 'Accountant' | 'Lawyer'
  registration_number text,
  verified boolean default false,  -- true only once you've manually checked their registration
  bio text,
  suburb text,
  lat float8,
  lng float8,
  tags text[],
  specialties text[]  -- checkboxes selected on the practitioner signup form
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  client_id uuid references clients(id),
  practitioner_id uuid references practitioners(id),
  slot_time text,
  notice_type text,
  notice_date date,
  notes text,
  status text default 'New',  -- 'New' | 'Consulted' | 'Engaged — SBR' | etc, matches practitioner appointments page
  pathway text,           -- 'sbr' | 'va' | 'cvl' | 'mvl' | 'simple-close' | null — the computed recommendation, kept as its own column so it's filterable later, not buried in free text
  triage_answers jsonb,   -- every question the client actually answered, in full
  triage_summary text     -- the plain-English result shown to the client, for a quick read
);

-- Row Level Security: without this, anyone with your public key could
-- read every client's and practitioner's data. This restricts each
-- person to their own row, and appointments to the two people on it.

alter table clients enable row level security;
alter table practitioners enable row level security;
alter table appointments enable row level security;

-- Automatically create the matching profile row the moment someone signs
-- up, before they've verified their email (so there's no authenticated
-- session yet to satisfy the RLS policies above). SECURITY DEFINER lets
-- this one function bypass RLS for this specific, controlled purpose.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.raw_user_meta_data->>'account_type' = 'client' then
    insert into public.clients (id, first_name, last_name, mobile, reasons)
    values (
      new.id,
      new.raw_user_meta_data->>'first_name',
      new.raw_user_meta_data->>'last_name',
      new.raw_user_meta_data->>'mobile',
      (select array(select jsonb_array_elements_text(new.raw_user_meta_data->'reasons')))
    );
  elsif new.raw_user_meta_data->>'account_type' = 'practitioner' then
    insert into public.practitioners (id, name, firm, practitioner_type, registration_number, specialties)
    values (
      new.id,
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'firm',
      new.raw_user_meta_data->>'practitioner_type',
      new.raw_user_meta_data->>'registration_number',
      (select array(select jsonb_array_elements_text(new.raw_user_meta_data->'specialties')))
    );
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create policy "Clients can view and edit their own record"
  on clients for all
  using (auth.uid() = id);

create policy "Practitioners can view and edit their own record"
  on practitioners for all
  using (auth.uid() = id);

create policy "Anyone can view verified practitioner profiles"
  on practitioners for select
  using (verified = true);

create policy "Clients and practitioners can view their own appointments"
  on appointments for select
  using (auth.uid() = client_id or auth.uid() = practitioner_id);

create policy "Clients can create appointments"
  on appointments for insert
  with check (auth.uid() = client_id);

create policy "Practitioners can update their own appointment statuses"
  on appointments for update
  using (auth.uid() = practitioner_id);

-- Lets a practitioner see the name of a client they actually have an
-- appointment with, without opening up client records more broadly than that.
create policy "Practitioners can view clients they have an appointment with"
  on clients for select
  using (
    exists (
      select 1 from appointments
      where appointments.client_id = clients.id
      and appointments.practitioner_id = auth.uid()
    )
  );

-- Accounting-software integration (Xero / MYOB / Manager.io). A client
-- connects their own books; a practitioner never queries this table
-- directly (no policy grants them access) -- they only ever see the
-- *generated report text*, stored separately on appointments below, via
-- the generate-report API route, which reads this table with the service
-- role specifically so raw tokens/API keys never reach the browser or any
-- RLS-governed client-facing query.
create table financial_connections (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  client_id uuid references clients(id) on delete cascade,
  provider text not null,        -- 'xero' | 'myob' | 'manager'
  access_token text,             -- Xero/MYOB only; null for Manager.io
  refresh_token text,            -- Xero/MYOB only
  token_expires_at timestamptz,  -- Xero/MYOB only
  tenant_id text,                -- Xero organisation ID, or MYOB company file URI/GUID
  subdomain text,                -- Manager.io only -- e.g. 'northwind' for northwind.manager.io
  api_key text,                  -- Manager.io only -- generated by the client inside their own Manager.io account, not OAuth
  org_name text,                 -- display name of the connected business, shown back to the client
  last_synced_at timestamptz,
  unique (client_id, provider)   -- one connection per provider per client; reconnecting overwrites rather than duplicating
);

alter table financial_connections enable row level security;

create policy "Clients manage their own financial connections"
  on financial_connections for all
  using (auth.uid() = client_id);

-- Where the generated liquidator briefing actually lands -- reuses the
-- existing appointments RLS (client + practitioner on that appointment
-- can already select it), so no new policy is needed for reading it.
alter table appointments add column if not exists financial_report jsonb;
alter table appointments add column if not exists financial_report_generated_at timestamptz;

-- A logged-in client's latest self-reported situation, saved the moment
-- they reach a result -- independent of whether they ever book a
-- consultation. Booking already saves a full copy onto that specific
-- appointment row, but until now nothing was saved for someone who
-- completes the check and doesn't book, so returning clients had no
-- "your last result" to see and no on-file record for a report later.
-- One row per client (not a history log) -- always overwritten with
-- their most recent answers, same "latest snapshot" shape as everywhere
-- else in the app.
create table triage_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  answers jsonb,
  summary text,
  pathway text
);

alter table triage_sessions enable row level security;

create policy "Clients manage their own triage sessions"
  on triage_sessions for all
  using (auth.uid() = client_id);
