create table company_settings (
  id serial primary key,
  carryover_expiry_day integer not null,   -- e.g., 31
  carryover_expiry_month integer not null, -- e.g., 1 (January)
  tenure_accrual_rules jsonb not null, -- e.g., {"1":12,"2":13,"3":15,"4":18,"5":22}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table company_settings enable row level security;

-- Policy: Allow read for all authenticated users
create policy "Allow read to all authenticated users"
  on company_settings
  for select
  using (auth.role() = 'authenticated');

-- Policy: Admins can insert, update, delete
create policy "Admins can modify company_settings"
  on company_settings
  for all
  using (auth.jwt() ->> 'role' = 'admin');

-- Policy: Service role can modify
create policy "Service role can modify"
  on company_settings
  for all
  using (auth.role() = 'service_role');