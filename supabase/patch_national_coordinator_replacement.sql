-- Reemplazo por propuesta/aceptacion para Coordinador Nacional.
-- Ejecutar despues de supabase/patch_critical_role_hierarchy.sql.

create or replace function public.request_coordinator_acceptance(
  p_target_user_id uuid,
  p_target_role public.user_role,
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

  if p_target_role not in ('coordinador_diocesano', 'coordinador_nacional') then
    raise exception 'Rol no requiere este flujo de aceptacion';
  end if;

  if target.role = 'administrador' then
    raise exception 'No se puede modificar un Administrador';
  end if;

  if not public.current_user_can_edit_profile(p_target_user_id) then
    raise exception 'No autorizado';
  end if;

  if not public.current_user_can_assign_role(p_target_role, target.province_id) then
    raise exception 'No autorizado para proponer este rango';
  end if;

  if p_target_role = 'coordinador_nacional'
    and actor.role not in ('coordinador_nacional', 'administrador') then
    raise exception 'Solo Coordinador Nacional o Administrador pueden proponer Coordinador Nacional';
  end if;

  if p_target_role = 'coordinador_diocesano'
    and actor.role not in ('coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador') then
    raise exception 'No autorizado para proponer Coordinador Diocesano';
  end if;

  if exists (
    select 1
    from public.user_requests
    where target_user_id = p_target_user_id
      and target_role = p_target_role
      and status = 'pendiente'
  ) then
    raise exception 'Ya existe una propuesta pendiente para este usuario';
  end if;

  insert into public.user_requests (user_id, request_type, details, target_user_id, target_role)
  values (
    auth.uid(),
    case
      when p_target_role = 'coordinador_nacional' then 'Propuesta Coordinador Nacional'
      else 'Propuesta Coordinador Diocesano'
    end,
    coalesce(nullif(trim(p_details), ''), 'Propuesta pendiente de aceptacion del usuario.'),
    p_target_user_id,
    p_target_role
  )
  returning id into new_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'request_coordinator_acceptance', jsonb_build_object('request_id', new_id, 'target_user_id', p_target_user_id, 'target_role', p_target_role, 'province_id', target.province_id));

  return new_id;
end;
$$;

grant execute on function public.request_coordinator_acceptance(uuid, public.user_role, text) to authenticated;

create or replace function public.request_diocesan_coordinator_acceptance(
  p_target_user_id uuid,
  p_details text default null
)
returns uuid
language sql
security definer
set search_path = public
as $$
  select public.request_coordinator_acceptance(p_target_user_id, 'coordinador_diocesano'::public.user_role, p_details)
$$;

grant execute on function public.request_diocesan_coordinator_acceptance(uuid, text) to authenticated;

create or replace function public.accept_coordinator_request(p_request_id uuid)
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
    or request_row.target_role not in ('coordinador_diocesano', 'coordinador_nacional') then
    raise exception 'Solicitud invalida';
  end if;

  select * into target from public.profiles where id = auth.uid();

  if request_row.target_role = 'coordinador_nacional' then
    select id into previous_id
    from public.profiles
    where id <> target.id
      and role = 'coordinador_nacional'
      and status = 'aprobado'
    limit 1;
  else
    select id into previous_id
    from public.profiles
    where id <> target.id
      and role = 'coordinador_diocesano'
      and status = 'aprobado'
      and province_id = target.province_id
    limit 1;
  end if;

  if previous_id is not null then
    update public.profiles
    set role = 'sedimentador'
    where id = previous_id;
  end if;

  update public.profiles
  set role = request_row.target_role,
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
  values (auth.uid(), 'accept_coordinator_request', jsonb_build_object(
    'request_id', p_request_id,
    'target_role', request_row.target_role,
    'new_user_id', target.id,
    'previous_user_id', previous_id,
    'province_id', target.province_id,
    'proposed_by', request_row.user_id
  ));
end;
$$;

grant execute on function public.accept_coordinator_request(uuid) to authenticated;

create or replace function public.accept_diocesan_coordinator_request(p_request_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  select public.accept_coordinator_request(p_request_id)
$$;

grant execute on function public.accept_diocesan_coordinator_request(uuid) to authenticated;

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
  previous_replaced_id uuid;
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

  if requested_role in ('coordinador_diocesano', 'coordinador_nacional') and actor.role <> 'administrador' then
    perform public.request_coordinator_acceptance(p_profile_id, requested_role, 'Propuesta generada desde panel de usuarios.');
    insert into public.audit_logs (actor_id, action, metadata)
    values (auth.uid(), 'admin_update_user_coordinator_requires_acceptance', jsonb_build_object('profile_id', p_profile_id, 'target_role', requested_role, 'province_id', selected_province_id));
    return;
  end if;

  if requested_role = 'coordinador_nacional' and actor.role = 'administrador' and requested_status = 'aprobado' then
    select id into previous_replaced_id
    from public.profiles
    where id <> p_profile_id
      and role = 'coordinador_nacional'
      and status = 'aprobado'
    limit 1;

    if previous_replaced_id is not null then
      update public.profiles set role = 'sedimentador' where id = previous_replaced_id;
    end if;
  elsif requested_role = 'coordinador_diocesano' and actor.role = 'administrador' and requested_status = 'aprobado' then
    select id into previous_replaced_id
    from public.profiles
    where id <> p_profile_id
      and role = 'coordinador_diocesano'
      and status = 'aprobado'
      and province_id = selected_province_id
    limit 1;

    if previous_replaced_id is not null then
      update public.profiles set role = 'sedimentador' where id = previous_replaced_id;
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
    'previous_replaced_id', previous_replaced_id
  ));
end;
$$;

grant execute on function public.admin_update_user(uuid, text, text, text, text, text, text, text, text) to authenticated;
