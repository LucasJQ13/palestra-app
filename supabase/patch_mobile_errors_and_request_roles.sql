create extension if not exists pgcrypto with schema extensions;

create or replace function public.get_my_requests()
returns table (
  id uuid,
  user_id uuid,
  title text,
  requester text,
  definition text,
  created_at timestamptz,
  status text,
  admin_message text,
  resolved_at timestamptz,
  resolved_by_name text,
  resolved_by_role text
)
language sql
security definer
set search_path = public
as $$
  select
    requests.id,
    requests.user_id,
    requests.request_type as title,
    requester.full_name as requester,
    coalesce(requests.details, '') as definition,
    requests.created_at,
    requests.status,
    requests.admin_message,
    requests.resolved_at,
    resolver.full_name as resolved_by_name,
    resolver.role::text as resolved_by_role
  from public.user_requests requests
  join public.profiles requester on requester.id = requests.user_id
  left join public.profiles resolver on resolver.id = requests.resolved_by
  where requests.user_id = auth.uid()
  order by requests.created_at desc;
$$;

grant execute on function public.get_my_requests() to authenticated;

create or replace function public.admin_get_requests()
returns table (
  id uuid,
  user_id uuid,
  title text,
  requester text,
  definition text,
  created_at timestamptz,
  status text,
  admin_message text,
  resolved_at timestamptz,
  resolved_by_name text,
  resolved_by_role text
)
language sql
security definer
set search_path = public
as $$
  select
    requests.id,
    requests.user_id,
    requests.request_type as title,
    requester.full_name as requester,
    coalesce(requests.details, '') as definition,
    requests.created_at,
    requests.status,
    requests.admin_message,
    requests.resolved_at,
    resolver.full_name as resolved_by_name,
    resolver.role::text as resolved_by_role
  from public.user_requests requests
  join public.profiles requester on requester.id = requests.user_id
  left join public.profiles resolver on resolver.id = requests.resolved_by
  where public.current_user_is_admin()
  order by requests.created_at asc;
$$;

grant execute on function public.admin_get_requests() to authenticated;

create or replace function public.admin_update_user(
  p_profile_id uuid,
  p_email text,
  p_password text,
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
set search_path = public, extensions
as $$
declare
  selected_province_id uuid;
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  select id into selected_province_id
  from public.provinces
  where name = p_province
  limit 1;

  update auth.users
  set
    email = coalesce(nullif(trim(p_email), ''), email),
    encrypted_password = case
      when nullif(p_password, '') is null then encrypted_password
      else extensions.crypt(p_password, extensions.gen_salt('bf'))
    end,
    updated_at = now()
  where id = p_profile_id;

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
end;
$$;

grant execute on function public.admin_update_user(uuid, text, text, text, text, text, text, text, text) to authenticated;
