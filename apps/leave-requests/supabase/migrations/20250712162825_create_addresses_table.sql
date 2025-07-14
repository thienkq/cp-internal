-- Create the addresses table
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  address_line text not null,
  city text,
  state text,
  postal_code text,
  country text,
  type text, -- e.g. 'home', 'work', etc.
  is_primary boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure only one primary address per user
create unique index one_primary_address_per_user
on public.addresses (user_id)
where is_primary = true;