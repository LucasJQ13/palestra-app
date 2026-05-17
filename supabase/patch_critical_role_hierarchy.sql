-- Reglas criticas de jerarquia, administradores y coordinaciones unicas.
-- Ejecutar despues de los parches de roles, solicitudes y administracion.

create or replace function public.current_user_can_edit_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles actor
    join public.profiles target on target.id = p_profile_id
    where actor.id = auth.uid()
      and actor.status = 'aprobado'
      and target.role <> 'administrador'
      and actor.role <> 'invitado'
      and public.role_rank(actor.role) >= public.role_rank(target.role)
      and (
        actor.role in ('vocal_nacional', 'coordinador_nacional', 'administrador')
        or actor.province_id = target.province_id
      )
  )
$$;

create or replace function public.current_user_can_assign_role(
  p_target_role public.user_role,
  p_target_province_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.status = 'aprobado'
      and p_target_role <> 'administrador'
      and public.role_rank(p_target_role) <= public.role_rank(actor.role)
      and (
        actor.role in ('vocal_nacional', 'coordinador_nacional', 'administrador')
        or actor.province_id = p_target_province_id
      )
  )
$$;

grant execute on function public.current_user_can_edit_profile(uuid) to authenticated;
grant execute on function public.current_user_can_assign_role(public.user_role, uuid) to authenticated;

create or replace function public.ensure_unique_role_assignment(
  p_profile_id uuid,
  p_role public.user_role,
  p_status public.user_status,
  p_province_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status <> 'aprobado' then
    return;
  end if;

  if p_role = 'coordinador_nacional' and exists (
    select 1
    from public.profiles
    where id <> p_profile_id
      and role = 'coordinador_nacional'
      and status = 'aprobado'
  ) then
    raise exception 'Ya existe un Coordinador Nacional activo. Para asignar uno nuevo, primero debe definirse un proceso de reemplazo.';
  end if;

  if p_role = 'coordinador_diocesano' and exists (
    select 1
    from public.profiles
    where id <> p_profile_id
      and role = 'coordinador_diocesano'
      and status = 'aprobado'
      and province_id = p_province_id
  ) then
    raise exception 'Ya existe un Coordinador Diocesano activo en esta provincia.';
  end if;
end;
$$;

grant execute on function public.ensure_unique_role_assignment(uuid, public.user_role, public.user_status, uuid) to authenticated;

create or replace function public.request_diocesan_coordinator_acceptance(
  p_target_user_id uuid,
  p_details text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor public.profiles%rowtype;
  target public.profiles%rowtype;
  new_id uuid;
begin
  select * into actor from public.profiles where id = auth.uid();
  select * into target from public.profiles where id = p_target_user_id;

  if actor.id is null or target.id is null then
    raise exception 'Usuario inexistente';
  end if;

  if target.role = 'administrador' then
    raise exception 'No se puede modificar un Administrador';
  end if;

  if not public.current_user_can_edit_profile(p_target_user_id) then
    raise exception 'No autorizado';
  end if;

  if not public.current_user_can_assign_role('coordinador_diocesano'::public.user_role, target.province_id) then
    raise exception 'No autorizado para proponer este rango';
  end if;

  if exists (
    select 1
    from public.user_requests
    where target_user_id = p_target_user_id
      and target_role = 'coordinador_diocesano'
      and status = 'pendiente'
  ) then
    raise exception 'Ya existe una propuesta pendiente para este usuario';
  end if;

  insert into public.user_requests (user_id, request_type, details, target_user_id, target_role)
  values (
    auth.uid(),
    'Propuesta Coordinador Diocesano',
    coalesce(nullif(trim(p_details), ''), 'Propuesta pendiente de aceptacion del usuario.'),
    p_target_user_id,
    'coordinador_diocesano'
  )
  returning id into new_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'request_diocesan_coordinator_acceptance', jsonb_build_object('request_id', new_id, 'target_user_id', p_target_user_id, 'province_id', target.province_id));

  return new_id;
end;
$$;

grant execute on function public.request_diocesan_coordinator_acceptance(uuid, text) to authenticated;

create or replace function public.accept_diocesan_coordinator_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.user_requests%rowtype;
  target public.profiles%rowtype;
  previous_id uuid;
begin
  select * into request_row from public.user_requests where id = p_request_id;

  if request_row.id is null
    or request_row.status <> 'pendiente'
    or request_row.target_user_id <> auth.uid()
    or request_row.target_role <> 'coordinador_diocesano' then
    raise exception 'Solicitud invalida';
  end if;

  select * into target from public.profiles where id = auth.uid();

  select id into previous_id
  from public.profiles
  where id <> target.id
    and role = 'coordinador_diocesano'
    and status = 'aprobado'
    and province_id = target.province_id
  limit 1;

  if previous_id is not null then
    update public.profiles
    set role = 'sedimentador'
    where id = previous_id;
  end if;

  update public.profiles
  set role = 'coordinador_diocesano',
      status = 'aprobado',
      approved_at = coalesce(approved_at, now()),
      approved_by = request_row.user_id
  where id = target.id;

  update public.user_requests
  set status = 'aprobada',
      resolved_at = now(),
      resolved_by = auth.uid(),
      admin_message = 'Rango aceptado por el usuario.'
  where id = p_request_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'accept_diocesan_coordinator_request', jsonb_build_object(
    'request_id', p_request_id,
    'new_user_id', target.id,
    'previous_user_id', previous_id,
    'province_id', target.province_id,
    'proposed_by', request_row.user_id
  ));
end;
$$;

grant execute on function public.accept_diocesan_coordinator_request(uuid) to authenticated;

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
  resolved_by_role text,
  target_user_id uuid,
  target_user_name text,
  target_role text,
  community_name text
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
    resolver.role::text as resolved_by_role,
    requests.target_user_id,
    target.full_name as target_user_name,
    requests.target_role::text,
    communities.name as community_name
  from public.user_requests requests
  join public.profiles requester on requester.id = requests.user_id
  left join public.profiles resolver on resolver.id = requests.resolved_by
  left join public.profiles target on target.id = requests.target_user_id
  left join public.communities on communities.id = requests.community_id
  where requests.user_id = auth.uid()
     or requests.target_user_id = auth.uid()
  order by requests.created_at desc;
$$;

grant execute on function public.get_my_requests() to authenticated;

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
  actor public.profiles%rowtype;
  target public.profiles%rowtype;
  requested_role public.user_role;
  requested_status public.user_status;
  previous_diocesan_id uuid;
begin
  select * into actor from public.profiles where id = auth.uid();
  select * into target from public.profiles where id = p_profile_id;

  if actor.id is null or actor.status <> 'aprobado' or target.id is null then
    raise exception 'No autorizado';
  end if;

  if target.role = 'administrador' or p_role = 'administrador' then
    raise exception 'El rol Administrador no puede modificarse ni asignarse desde la aplicacion';
  end if;

  if not public.current_user_can_edit_profile(p_profile_id) then
    raise exception 'No podes editar usuarios de rango superior o fuera de tu alcance';
  end if;

  requested_role := p_role::public.user_role;
  requested_status := p_status::public.user_status;

  select id into selected_province_id
  from public.provinces
  where name = p_province
  limit 1;

  if not public.current_user_can_assign_role(requested_role, selected_province_id) then
    raise exception 'No podes asignar un rango superior al tuyo o fuera de tu alcance';
  end if;

  if requested_role = 'coordinador_diocesano' and actor.role <> 'administrador' then
    perform public.request_diocesan_coordinator_acceptance(p_profile_id, 'Propuesta generada desde panel de usuarios.');
    insert into public.audit_logs (actor_id, action, metadata)
    values (auth.uid(), 'admin_update_user_diocesan_requires_acceptance', jsonb_build_object('profile_id', p_profile_id, 'province_id', selected_province_id));
    return;
  end if;

  if requested_role = 'coordinador_nacional' then
    perform public.ensure_unique_role_assignment(p_profile_id, requested_role, requested_status, selected_province_id);
  end if;

  if requested_role = 'coordinador_diocesano' and actor.role = 'administrador' and requested_status = 'aprobado' then
    select id into previous_diocesan_id
    from public.profiles
    where id <> p_profile_id
      and role = 'coordinador_diocesano'
      and status = 'aprobado'
      and province_id = selected_province_id
    limit 1;

    if previous_diocesan_id is not null then
      update public.profiles
      set role = 'sedimentador'
      where id = previous_diocesan_id;
    end if;
  else
    perform public.ensure_unique_role_assignment(p_profile_id, requested_role, requested_status, selected_province_id);
  end if;

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
    status = requested_status,
    role = requested_role,
    approved_at = case when requested_status = 'aprobado' then coalesce(approved_at, now()) else approved_at end,
    approved_by = case when requested_status = 'aprobado' then coalesce(approved_by, auth.uid()) else approved_by end
  where id = p_profile_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_user', jsonb_build_object(
    'profile_id', p_profile_id,
    'status', p_status,
    'role', p_role,
    'previous_diocesan_id', previous_diocesan_id
  ));
end;
$$;

grant execute on function public.admin_update_user(uuid, text, text, text, text, text, text, text, text) to authenticated;
