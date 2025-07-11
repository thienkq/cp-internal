-- Seed example data
insert into public.signup_email_domains (domain, type, reason) values
  ('coderpush.com', 'allow', 'Internal signups')
on conflict (domain) do nothing;

-- Create a test user with email 'test@coderpush.com' and password '123456'
-- This requires the pgcrypto extension to be enabled.
-- with new_user as (
--   insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
--   values
--     (
--       '00000000-0000-0000-0000-000000000000',
--       uuid_generate_v4(),
--       'authenticated',
--       'authenticated',
--       'test@coderpush.com',
--       crypt('123456', gen_salt('bf')),
--       now(),
--       '{"provider":"email","providers":["email"]}',
--       '{}'
--     )
--   returning id, email
-- )
-- insert into auth.identities (id, user_id, provider_id, provider, identity_data)
--   select id, id, email, 'email', jsonb_build_object('sub', id::text, 'email', email) from new_user;