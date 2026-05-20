-- Beta: solicitudes de reemplazo para Coordinador Diocesano y Coordinador Nacional.
-- Ejecutar despues de supabase/patch_beta_user_role_management.sql.

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

  if actor.id is null or actor.status <> 'aprobado' or target.id is null then
    raise exception 'No autorizado';
  end if;

  if actor.id = target.id then
    raise exception 'No podes proponerte a vos mismo';
  end if;

  if p_target_role not in ('coordinador_diocesano', 'coordinador_nacional') then
    raise exception 'Rol no requiere aceptacion';
  end if;

  if not public.current_user_can_edit_profile(p_target_user_id)
    or not public.current_user_can_assign_role(p_target_role, target.province_id) then
    raise exception 'No autorizado para proponer este rango';
  end if;

  if p_target_role = 'coordinador_diocesano'
    and actor.role not in ('coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador') then
    raise exception 'No autorizado para proponer Coordinador Diocesano';
  end if;

  if p_target_role = 'coordinador_nacional'
    and actor.role not in ('coordinador_nacional', 'administrador') then
    raise exception 'Solo Coordinador Nacional o Administrador pueden proponer Coordinador Nacional';
  end if;

  if exists (
    select 1
    from public.user_requests
    where target_user_id = p_target_user_id
      and target_role = p_target_role
      and status = 'pendiente'
  ) then
    raise exception 'Ya existe una solicitud pendiente para este usuario';
  end if;

  insert into public.user_requests (user_id, request_type, details, target_user_id, target_role)
  values (
    auth.uid(),
    case
      when p_target_role = 'coordinador_nacional' then 'Solicitud de Coordinacion Nacional'
      else 'Solicitud de Coordinacion Diocesana'
    end,
    coalesce(nullif(trim(p_details), ''), 'Solicitud pendiente de aceptacion del usuario.'),
    p_target_user_id,
    p_target_role
  )
  returning id into new_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'request_coordinator_acceptance', jsonb_build_object(
    'request_id', new_id,
    'target_user_id', p_target_user_id,
    'target_role', p_target_role,
    'province_id', target.province_id
  ));

  return new_id;
end;
$$;

grant execute on function public.request_coordinator_acceptance(uuid, public.user_role, text) to authenticated;

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
  previous_name text;
  target_name text;
  message_to_previous text;
begin
  select * into request_row
  from public.user_requests
  where id = p_request_id;

  if request_row.id is null
    or request_row.status <> 'pendiente'
    or request_row.target_user_id <> auth.uid()
    or request_row.target_role not in ('coordinador_diocesano', 'coordinador_nacional') then
    raise exception 'Solicitud invalida';
  end if;

  select * into target from public.profiles where id = auth.uid();
  target_name := coalesce(target.full_name, 'El usuario elegido');

  if request_row.target_role = 'coordinador_nacional' then
    select id, full_name into previous_id, previous_name
    from public.profiles
    where id <> target.id
      and role = 'coordinador_nacional'
      and status = 'aprobado'
    limit 1;
  else
    select id, full_name into previous_id, previous_name
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

    message_to_previous := target_name || ' es el nuevo coordinador. Ahora pasas a ser Sedimentador.';

    insert into public.user_requests (
      user_id,
      request_type,
      details,
      status,
      admin_message,
      resolved_at,
      resolved_by,
      target_user_id,
      target_role
    )
    values (
      previous_id,
      'Cambio de coordinacion',
      message_to_previous,
      'aprobada',
      message_to_previous,
      now(),
      auth.uid(),
      target.id,
      request_row.target_role
    );
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
    'new_user_name', target_name,
    'previous_user_id', previous_id,
    'previous_user_name', previous_name,
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
