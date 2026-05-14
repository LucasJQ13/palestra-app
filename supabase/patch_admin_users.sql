create or replace function public.admin_get_users()
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  province text,
  community_name text,
  status text,
  role text,
  email_confirmed_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    auth.users.id,
    auth.users.email::text,
    profiles.full_name,
    profiles.phone,
    provinces.name as province,
    profiles.community_name,
    profiles.status::text,
    profiles.role::text,
    auth.users.email_confirmed_at
  from auth.users
  left join public.profiles on profiles.id = auth.users.id
  left join public.provinces on provinces.id = profiles.province_id
  where public.current_user_is_admin()
  order by auth.users.created_at desc
  limit 200;
$$;

grant execute on function public.admin_get_users() to authenticated;

create or replace function public.admin_update_user(
  p_profile_id uuid,
  p_full_name text,
  p_phone text,
  p_province text,
  p_community_name text,
  p_status text,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_province_id uuid;
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  select id
  into selected_province_id
  from public.provinces
  where name = p_province
  limit 1;

  update public.profiles
  set
    full_name = nullif(trim(p_full_name), ''),
    phone = nullif(trim(p_phone), ''),
    province_id = selected_province_id,
    community_name = nullif(trim(p_community_name), ''),
    status = p_status::public.user_status,
    role = p_role::public.user_role,
    approved_at = case when p_status = 'aprobado' then coalesce(approved_at, now()) else approved_at end,
    approved_by = case when p_status = 'aprobado' then coalesce(approved_by, auth.uid()) else approved_by end
  where id = p_profile_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_user', jsonb_build_object('profile_id', p_profile_id, 'status', p_status, 'role', p_role));
end;
$$;

grant execute on function public.admin_update_user(uuid, text, text, text, text, text, text) to authenticated;

create or replace function public.admin_confirm_user_email(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  update auth.users
  set
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    confirmed_at = default
  where id = p_user_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_confirm_user_email', jsonb_build_object('user_id', p_user_id));
end;
$$;

grant execute on function public.admin_confirm_user_email(uuid) to authenticated;
