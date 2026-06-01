-- Link an existing auth.users row to public.users as teacher (admin invite recovery).
create or replace function public.admin_ensure_teacher(
  p_email text,
  p_display_name text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text := lower(trim(p_email));
  v_name  text := trim(p_display_name);
  v_auth_id uuid;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  if v_email = '' or position('@' in v_email) = 0 then
    raise exception 'invalid email';
  end if;

  select id into v_auth_id
  from auth.users
  where lower(email) = v_email
  limit 1;

  if v_auth_id is null then
    return null;
  end if;

  if exists (
    select 1 from public.users
    where lower(email) = v_email and id <> v_auth_id
  ) then
    raise exception 'email already linked to another user';
  end if;

  insert into public.users (id, email, role, display_name)
  values (v_auth_id, v_email, 'teacher', coalesce(nullif(v_name, ''), ''))
  on conflict (id) do update
    set
      email = excluded.email,
      display_name = excluded.display_name,
      role = 'teacher';

  return v_auth_id;
end;
$$;

grant execute on function public.admin_ensure_teacher(text, text) to authenticated;
