create table leave_types (
  id serial primary key,
  name text not null unique,
  description text,
  is_paid boolean not null default true,
  supports_carryover boolean not null default false,
  supports_half_day boolean not null default false,
  quota integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table leave_types enable row level security;

-- Policy: Allow read for all authenticated users
create policy "Allow read to all authenticated users"
  on leave_types
  for select
  using (auth.role() = 'authenticated');

-- Policy: Admins can insert, update, delete
create policy "Admins can modify leave_types"
  on leave_types
  for all
  using (auth.jwt() ->> 'role' = 'admin');

-- Policy: Service role can modify
create policy "Service role can modify"
  on leave_types
  for all
  using (auth.role() = 'service_role');

