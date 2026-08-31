-- Run this in Supabase's SQL Editor (Project → SQL Editor → New query)
-- after creating your project. This creates the three real tables Anteroom
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
  status text default 'New'  -- 'New' | 'Consulted' | 'Engaged — SBR' | etc, matches practitioner appointments page
);

-- Row Level Security: without this, anyone with your public key could
-- read every client's and practitioner's data. This restricts each
-- person to their own row, and appointments to the two people on it.

alter table clients enable row level security;
alter table practitioners enable row level security;
alter table appointments enable row level security;

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
