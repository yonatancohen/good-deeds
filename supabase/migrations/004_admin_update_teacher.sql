-- Admin: update teacher display name + email (public.users + auth.users)
create or replace function public.admin_update_teacher(
  p_user_id uuid,
  p_display_name text,
  p_email text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text := lower(trim(p_email));
  v_name  text := trim(p_display_name);
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  if v_name = '' then
    raise exception 'display_name required';
  end if;

  if v_email = '' or position('@' in v_email) = 0 then
    raise exception 'invalid email';
  end if;

  if exists (
    select 1 from public.users
    where lower(email) = v_email and id <> p_user_id
  ) then
    raise exception 'email already in use';
  end if;

  update public.users
  set display_name = v_name, email = v_email
  where id = p_user_id and role = 'teacher' and deleted_at is null;

  if not found then
    raise exception 'teacher not found';
  end if;

  update auth.users
  set
    email = v_email,
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object('display_name', v_name)
  where id = p_user_id;

  update auth.identities
  set
    identity_data = jsonb_set(
      coalesce(identity_data, '{}'::jsonb),
      '{email}',
      to_jsonb(v_email)
    ),
    provider_id = v_email
  where user_id = p_user_id and provider = 'email';
end;
$$;

grant execute on function public.admin_update_teacher(uuid, text, text) to authenticated;
