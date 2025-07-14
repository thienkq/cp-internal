-- Create a helper function to get the user's role without causing recursion
create or replace function public.get_user_role(user_id uuid)
returns text
language plpgsql
security definer
-- Set a secure search path
set search_path = public
as $$
declare
  user_role text;
begin
  select role into user_role from public.users where id = user_id;
  return user_role;
end;
$$;

-- Drop existing policies if they exist, to allow for idempotent script
drop policy if exists "Admins can perform all actions on users" on public.users;
drop policy if exists "Authenticated users can view other users" on public.users;
drop policy if exists "Users can update their own profile" on public.users;

-- 1. Admin Full Access Policy
-- This policy allows users with the 'admin' role to perform any action on the users table.
-- It uses the get_user_role() function to avoid recursion.
create policy "Admins can perform all actions on users"
on public.users for all
using ( public.get_user_role(auth.uid()) = 'admin' )
with check ( public.get_user_role(auth.uid()) = 'admin' );

-- 2. Authenticated Users Read Access
-- This policy allows any authenticated user to view all records in the users table.
-- This is necessary for features like selecting a manager from a dropdown.
create policy "Authenticated users can view other users"
on public.users for select
to authenticated
using (true);

-- 3. Users can update their own profile
-- This policy allows an authenticated user to update their own record.
create policy "Users can update their own profile"
on public.users for update
to authenticated
using ( auth.uid() = id )
with check ( auth.uid() = id );
