-- Demo accounts for local development.
-- Passwords are bcrypt hashes of "Password123!" for both accounts.
-- To add these accounts to a hosted Supabase project, create users via the
-- Supabase dashboard or CLI: `supabase auth create-user --email admin@roadwatch.local --password Password123!`
-- then update the profile role to 'admin' in the profiles table.

insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  aud,
  role
) values
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'admin@roadwatch.local',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin User"}',
    now(),
    now(),
    'authenticated',
    'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'nmc@roadwatch.local',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"NMC Officer"}',
    now(),
    now(),
    'authenticated',
    'authenticated'
  )
on conflict (id) do nothing;

-- Ensure profiles exist and set roles
insert into public.profiles (id, full_name, role)
values
  ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'NMC Officer', 'user')
on conflict (id) do update
  set role = excluded.role,
      full_name = excluded.full_name;
