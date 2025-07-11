-- Create ENUM type for domain rule classification
do $$ begin
  create type public.signup_email_domain_type as enum ('allow', 'deny');
exception
  when duplicate_object then null;
end $$;

-- Create the signup_email_domains table
create table if not exists public.signup_email_domains (
  id serial primary key,
  domain text not null unique,
  type public.signup_email_domain_type not null,
  reason text default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create a trigger to maintain updated_at
create or replace function public.update_signup_email_domains_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_signup_email_domains_set_updated_at on public.signup_email_domains;

create trigger trg_signup_email_domains_set_updated_at
before update on public.signup_email_domains
for each row
execute procedure public.update_signup_email_domains_updated_at();

-- Seed example data
insert into public.signup_email_domains (domain, type, reason) values
  ('coderpush.com', 'allow', 'Internal signups')
on conflict (domain) do nothing;

-- Create the function
create or replace function public.hook_restrict_signup_by_email_domain(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  email text;
  domain_part text;
  allow_list_exists boolean;
  is_allowed boolean;
begin
  email := event->'user'->>'email';
  domain_part := split_part(email, '@', 2);

  -- Check if any 'allow' rules exist in the table.
  select exists (select 1 from public.signup_email_domains where type = 'allow') into allow_list_exists;

  -- If an allow list exists, we must enforce it.
  if allow_list_exists then
    -- Check if the user's domain is in the allow list.
    select exists (
      select 1
      from public.signup_email_domains
      where type = 'allow' and lower(domain) = lower(domain_part)
    ) into is_allowed;

    if is_allowed then
      -- Domain is in the allow list, so permit the signup.
      return '{}'::jsonb;
    else
      -- Domain is not in the allow list, so reject the signup.
      return jsonb_build_object(
        'error', jsonb_build_object(
          'message', 'Signups from this email domain are not allowed.',
          'http_code', 403
        )
      );
    end if;
  end if;

  -- If no 'allow' rules are configured, allow all signups by default.
  return '{}'::jsonb;
end;
$$;

-- Permissions
grant usage on schema public to supabase_auth_admin;

grant select
  on table public.signup_email_domains
  to supabase_auth_admin;

grant execute
  on function public.hook_restrict_signup_by_email_domain
  to supabase_auth_admin;

revoke execute
  on function public.hook_restrict_signup_by_email_domain
  from authenticated, anon, public;