-- 1. Create the users table
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text check (role in ('employee', 'manager', 'admin')) not null default 'employee',
  start_date date,
  end_date date,
  gender text,
  position text,
  phone text,                
  date_of_birth date,        
  is_active boolean default true, 
  manager_id uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Enable Row Level Security
alter table public.users enable row level security;

-- 3. Add a trigger to auto-create a user row on signup
-- See Supabase docs for trigger example if you want to automate this step.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- If user already exists in public.users by email, update their id to match auth.users.id
  if exists (select 1 from public.users where email = new.email) then
    update public.users
    set id = new.id,
        full_name = coalesce(new.raw_user_meta_data->>'full_name', full_name),
        email = new.email
    where email = new.email;

  -- Else insert a new user row
  else
    insert into public.users (
      id, email, full_name, role, start_date, end_date, gender, position, manager_id
    )
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', ''),
      'employee',
      null,
      null,
      null,
      null,
      null
    );
  end if;

  return new;
end;
$$;

-- 4. Create a trigger to call the function on user creation
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();