-- Create the projects table
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  is_billable boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.projects enable row level security;

-- Policy: Anyone can select
create policy "Anyone can view projects" on public.projects
  for select
  using (true);

-- Policy: Only admins can insert, update, delete
create policy "Admins can manage projects" on public.projects
  for all
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