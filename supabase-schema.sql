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
  client_id uuid references clients(id) on delete cascade,
  practitioner_id uuid references practitioners(id) on delete set null,
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
    insert into public.practitioners (id, name, firm, practitioner_type, registration_number, specialties, phone, contact_preference)
    values (
      new.id,
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'firm',
      new.raw_user_meta_data->>'practitioner_type',
      new.raw_user_meta_data->>'registration_number',
      (select array(select jsonb_array_elements_text(new.raw_user_meta_data->'specialties'))),
      new.raw_user_meta_data->>'phone',
      coalesce(new.raw_user_meta_data->>'contact_preference', 'either')
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

-- Bookings previously only ever stored a bare time-of-day ('9:00 AM'),
-- never an actual calendar date -- meaning there was no way to know
-- which day any consultation was actually for. Needed before a real
-- calendar view of appointments means anything.
alter table appointments add column if not exists appointment_date date;

-- The contact form (previously pointed at a Web3Forms key that was
-- still a literal placeholder, meaning it silently failed on every real
-- submission) now stores messages here instead. Insert-only from the
-- client side, on purpose -- no select policy for anon or authenticated
-- roles, so a visitor can send a message but never read anyone else's.
-- Jack reads these directly in Table Editor, which uses the dashboard's
-- own elevated access rather than going through these policies at all.
create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  email text not null,
  message text not null
);

alter table contact_messages enable row level security;

create policy "Anyone can submit a contact message"
  on contact_messages for insert
  with check (true);

-- A real photo (pasted as a link the practitioner already hosts
-- somewhere, not a file upload -- see the profile page comments for
-- why) instead of the blank circle every real practitioner got before
-- tonight, since the card's initials field never actually existed on
-- live data.
alter table practitioners add column if not exists avatar_url text;

-- No phone field existed anywhere for practitioners before this (only
-- clients had `mobile`) -- added alongside the preference itself, since
-- a "call me" preference is meaningless with nothing to call.
alter table practitioners add column if not exists phone text;
alter table practitioners add column if not exists contact_preference text default 'either';
-- 'email' | 'call' | 'either'

-- ASIC's own official register of liquidators (Series 4A, updated to 31
-- July 2026), imported for automated registration checks at signup.
-- Public data -- ASIC publishes this specifically for anyone to check
-- against -- so a public read policy is appropriate here, unlike every
-- other table in this schema.
create table asic_liquidators (
  id uuid primary key default gen_random_uuid(),
  registration_number text not null,
  name text not null,
  official_liquidator_no text,
  restricted_to_restructuring boolean default false,
  has_condition boolean default false,
  principal_place_of_practice text,
  firm text,
  region text
);
create index if not exists asic_liquidators_reg_no_idx on asic_liquidators (registration_number);

alter table asic_liquidators enable row level security;

create policy "Anyone can read the ASIC liquidator register"
  on asic_liquidators for select
  using (true);

-- Jack's own outreach list, seeded from the same ASIC data -- NOT the
-- verification check itself, and deliberately has no RLS policies
-- granting anon or authenticated access at all, so it's invisible to
-- everyone except the Supabase dashboard (which uses the postgres role,
-- bypassing RLS) -- exactly where Jack already works through everything
-- else tonight. contact_status is updated by hand as calls happen;
-- claimed_by/claimed_at are filled in automatically by the signup
-- verification route when someone who matches a lead actually signs up,
-- purely so Jack can see which calls converted, not as a security check.
create table practitioner_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  registration_number text not null,
  name text not null,
  firm text,
  principal_place_of_practice text,
  region text,
  contact_status text default 'not_contacted', -- 'not_contacted' | 'contacted' | 'interested' | 'declined' | 'claimed'
  notes text,
  claimed_by uuid references practitioners(id) on delete set null,
  claimed_at timestamptz
);
alter table practitioner_leads enable row level security;
-- No policies added on purpose -- see comment above.

insert into practitioner_leads (registration_number, name, firm, principal_place_of_practice, region)
select registration_number, name, firm, principal_place_of_practice, region from asic_liquidators;

-- The actual "already used" guarantee -- enforced by the database
-- itself, not just checked in application code, so it holds even
-- against a bug or a race condition elsewhere. NULLs don't conflict
-- with each other under a standard unique constraint, so this is safe
-- to add even if some existing rows have no registration number yet.
-- If this fails, it means two existing rows already share the same
-- real (non-null) registration number -- the error will name the
-- conflicting value, which needs resolving by hand before this can
-- apply, likely just old test data (see the message after this block).
alter table practitioners add constraint practitioners_registration_number_unique unique (registration_number);

-- Real gap worth closing while building this: the existing "Practitioners
-- can view and edit their own record" policy (using auth.uid() = id, for
-- all operations) technically lets a practitioner set verified = true on
-- themselves directly via the Supabase client, from browser dev tools,
-- with zero actual checking -- the profile page never exposed this as an
-- editable field, but RLS never actually stopped the column itself from
-- being writable. This revokes UPDATE on that one column specifically
-- for logged-in users, leaving every other column (name, firm, bio, etc.)
-- exactly as writable as before. Only a service-role context (the new
-- verify-registration route below, or Jack directly in the dashboard)
-- can set verified from here on.
revoke update (verified) on public.practitioners from authenticated;

-- The original appointments table (from the very start of this project)
-- never had cascade delete on its client reference, unlike every table
-- added since. Without this, deleting a client who's ever booked an
-- appointment fails outright with a foreign key error -- a real
-- blocker for the account-deletion feature below. Postgres auto-names
-- an unnamed foreign key as <table>_<column>_fkey, which is what's
-- being dropped and recreated here.
alter table appointments drop constraint appointments_client_id_fkey;
alter table appointments add constraint appointments_client_id_fkey
  foreign key (client_id) references clients(id) on delete cascade;

-- Two more foreign keys referencing practitioners with no delete
-- behavior specified, found while building account deletion. Both get
-- SET NULL rather than CASCADE, deliberately different from the client-
-- side cascade above: an appointment or a claimed lead is at least
-- partly someone else's record (the client's appointment history, or
-- Jack's own outreach tracking), so a practitioner deleting their own
-- account shouldn't delete data that isn't only theirs -- it should
-- just clear the link to an account that no longer exists.
alter table appointments drop constraint appointments_practitioner_id_fkey;
alter table appointments add constraint appointments_practitioner_id_fkey
  foreign key (practitioner_id) references practitioners(id) on delete set null;

alter table practitioner_leads drop constraint practitioner_leads_claimed_by_fkey;
alter table practitioner_leads add constraint practitioner_leads_claimed_by_fkey
  foreign key (claimed_by) references practitioners(id) on delete set null;

-- A practitioner's own private observations on a case, separate from
-- anything the client submitted. Deliberately its own table rather than
-- a column on appointments: RLS is row-level, not column-level, so a
-- column here would need every client-facing query to remember never to
-- select it, an easy thing to get wrong once, versus a separate table
-- whose own policy makes it structurally impossible for a client to
-- ever read, regardless of what any future query asks for. One row per
-- appointment (unique), a note to revise, not a growing log.
create table appointment_notes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) on delete cascade unique,
  practitioner_id uuid references practitioners(id) on delete cascade,
  note text,
  updated_at timestamptz default now()
);
alter table appointment_notes enable row level security;

create policy "Practitioners manage their own case notes"
  on appointment_notes for all
  using (auth.uid() = practitioner_id);
