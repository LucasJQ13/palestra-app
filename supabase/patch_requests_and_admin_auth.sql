alter table public.user_requests
add column if not exists admin_message text;

create or replace function public.create_user_request(
  p_request_type text,
  p_details text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  insert into public.user_requests (user_id, request_type, details)
  values (auth.uid(), p_request_type, left(p_details, 500))
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.create_user_request(text, text) to authenticated;

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
  resolved_by_name text
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
    resolver.full_name as resolved_by_name
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
  resolved_by_name text
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
    resolver.full_name as resolved_by_name
  from public.user_requests requests
  join public.profiles requester on requester.id = requests.user_id
  left join public.profiles resolver on resolver.id = requests.resolved_by
  where public.current_user_is_admin()
  order by requests.created_at asc;
$$;

grant execute on function public.admin_get_requests() to authenticated;

create or replace function public.admin_resolve_user_request(
  p_request_id uuid,
  p_status text,
  p_admin_message text,
  p_assign_role text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  select user_id into target_user_id
  from public.user_requests
  where id = p_request_id;

  update public.user_requests
  set
    status = p_status,
    admin_message = nullif(trim(p_admin_message), ''),
    resolved_at = now(),
    resolved_by = auth.uid()
  where id = p_request_id;

  if p_status = 'aprobada' and p_assign_role is not null then
    update public.profiles
    set
      role = p_assign_role::public.user_role,
      status = 'aprobado',
      approved_at = coalesce(approved_at, now()),
      approved_by = coalesce(approved_by, auth.uid())
    where id = target_user_id;
  end if;
end;
$$;

grant execute on function public.admin_resolve_user_request(uuid, text, text, text) to authenticated;

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
set search_path = public
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
      else crypt(p_password, gen_salt('bf'))
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
