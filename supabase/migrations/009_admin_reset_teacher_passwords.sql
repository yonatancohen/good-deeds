-- Admin: reset passwords for existing teachers (never admins).
-- Uses bcrypt via pgcrypto so GoTrue/signInWithPassword accepts the new hash.

create extension if not exists pgcrypto with schema extensions;

create or replace function public.admin_reset_teacher_passwords(
  p_password text default 'Bi123456'
)
returns integer
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_password text := coalesce(nullif(trim(p_password), ''), 'Bi123456');
  v_count integer := 0;
  r record;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  if char_length(v_password) < 8 then
    raise exception 'password must be at least 8 characters';
  end if;

  for r in
    select u.id
    from public.users u
    where u.role = 'teacher'
      and u.deleted_at is null
  loop
    update auth.users
    set
      encrypted_password = crypt(v_password, gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = r.id;

    if found then
      v_count := v_count + 1;
      -- Drop sessions so teachers must sign in with the new password
      delete from auth.sessions where user_id = r.id;
      if to_regclass('auth.refresh_tokens') is not null then
        execute 'delete from auth.refresh_tokens where user_id = $1' using r.id;
      end if;
    end if;
  end loop;

  return v_count;
end;
$$;

grant execute on function public.admin_reset_teacher_passwords(text) to authenticated;

-- Also support calling with no args (uses Bi123456)
create or replace function public.admin_reset_teacher_passwords()
returns integer
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  return public.admin_reset_teacher_passwords('Bi123456');
end;
$$;

grant execute on function public.admin_reset_teacher_passwords() to authenticated;

create or replace function public.admin_reset_teacher_password(
  p_user_id uuid,
  p_password text default 'Bi123456'
)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_password text := coalesce(nullif(trim(p_password), ''), 'Bi123456');
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  if char_length(v_password) < 8 then
    raise exception 'password must be at least 8 characters';
  end if;

  if not exists (
    select 1 from public.users
    where id = p_user_id and role = 'teacher' and deleted_at is null
  ) then
    raise exception 'teacher not found';
  end if;

  update auth.users
  set
    encrypted_password = crypt(v_password, gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    updated_at = now()
  where id = p_user_id;

  if not found then
    raise exception 'auth user not found';
  end if;

  delete from auth.sessions where user_id = p_user_id;
  if to_regclass('auth.refresh_tokens') is not null then
    execute 'delete from auth.refresh_tokens where user_id = $1' using p_user_id;
  end if;
end;
$$;

grant execute on function public.admin_reset_teacher_password(uuid, text) to authenticated;
