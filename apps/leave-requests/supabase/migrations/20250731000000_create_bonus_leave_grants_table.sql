-- Create the bonus_leave_grants table
create table public.bonus_leave_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  year integer not null check (year >= 2020 and year <= 2030),
  days_granted integer not null check (days_granted > 0),
  days_used integer default 0 check (days_used >= 0),
  reason text,
  granted_by uuid references public.users(id),
  granted_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Allow multiple bonus leave records per user per year for better audit trail
  -- No unique constraint - admins can grant multiple bonuses per year

  -- Ensure days_used cannot exceed days_granted
  check (days_used <= days_granted)
);

-- Create indexes for performance
create index idx_bonus_leave_grants_user_id on public.bonus_leave_grants(user_id);
create index idx_bonus_leave_grants_year on public.bonus_leave_grants(year);
create index idx_bonus_leave_grants_granted_by on public.bonus_leave_grants(granted_by);

-- Enable Row Level Security
alter table public.bonus_leave_grants enable row level security;

-- Policy: Users can view their own bonus leave grants
create policy "Users can view own bonus leave grants" on public.bonus_leave_grants
  for select
  using (auth.uid() = user_id);

-- Policy: Admins can view all bonus leave grants
create policy "Admins can view all bonus leave grants" on public.bonus_leave_grants
  for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- Policy: Only admins can insert bonus leave grants
create policy "Admins can insert bonus leave grants" on public.bonus_leave_grants
  for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- Policy: Only admins can update bonus leave grants
create policy "Admins can update bonus leave grants" on public.bonus_leave_grants
  for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- Policy: Only admins can delete bonus leave grants
create policy "Admins can delete bonus leave grants" on public.bonus_leave_grants
  for delete
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger handle_bonus_leave_grants_updated_at
  before update on public.bonus_leave_grants
  for each row
  execute function public.handle_updated_at(); 