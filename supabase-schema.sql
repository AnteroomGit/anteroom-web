-- Run this in Supabase's SQL Editor (Project → SQL Editor → New query)
-- after creating your project. This creates the three real tables AnteRoom
-- needs, matching the fields the UI already collects.

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
  tags text[]
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
    insert into public.practitioners (id, name, firm, practitioner_type, registration_number)
    values (
      new.id,
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'firm',
      new.raw_user_meta_data->>'practitioner_type',
      new.raw_user_meta_data->>'registration_number'
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
