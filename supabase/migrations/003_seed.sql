-- ============================================================
-- Good Deeds App — Seed Data
-- ============================================================
-- Run this ONCE after creating the project (SQL editor, service role).
-- Admin login: admin@school.com / Admin1234!
-- IMPORTANT: Change the password after first login.
-- ============================================================

-- Step 1: Create auth user
select auth.create_user(
  '{
    "email": "admin@school.com",
    "password": "Admin1234!",
    "email_confirm": true
  }'::jsonb
);

-- Step 2: Fix NULL token fields (GoTrue requires empty strings, not NULL)
update auth.users set
  confirmation_token         = coalesce(confirmation_token, ''),
  recovery_token             = coalesce(recovery_token, ''),
  email_change_token_new     = coalesce(email_change_token_new, ''),
  email_change               = coalesce(email_change, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change               = coalesce(phone_change, ''),
  phone_change_token         = coalesce(phone_change_token, ''),
  reauthentication_token     = coalesce(reauthentication_token, '')
where email = 'admin@school.com';

-- Step 3: Create the identity record (required for email/password login)
insert into auth.identities (id, user_id, provider, identity_data, provider_id, created_at, updated_at, last_sign_in_at)
select
  gen_random_uuid(),
  u.id,
  'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  u.email,
  now(), now(), now()
from auth.users u
where u.email = 'admin@school.com'
on conflict do nothing;

-- Step 3: Insert into public.users
insert into public.users (id, email, role, display_name)
select id, email, 'admin', 'מנהל'
from auth.users
where email = 'admin@school.com'
on conflict (id) do nothing;

-- Step 4: Seed default good deeds
insert into public.deeds (name, amount) values
  ('עזרה לחבר', 2),
  ('ניקיון הכיתה', 3),
  ('השלמת שיעורי בית', 1),
  ('עזרה למורה', 2),
  ('מעשה טוב מיוחד', 5)
on conflict do nothing;
