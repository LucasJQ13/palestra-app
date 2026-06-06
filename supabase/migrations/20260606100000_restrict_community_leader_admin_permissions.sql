create or replace function public.current_user_can_manage_profiles()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'aprobado'
      and profiles.role in ('vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador')
  );
$$;

grant execute on function public.current_user_can_manage_profiles() to authenticated;

create or replace function public.current_user_can_manage_user(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with actor as (
    select id, role, status, province_id
    from public.profiles
    where id = auth.uid()
  ),
  target as (
    select id, role, province_id
    from public.profiles
    where id = p_profile_id
  )
  select exists (
    select 1
    from actor, target
    where actor.status = 'aprobado'
      and target.role <> 'administrador'
      and actor.role not in ('animador_comunidad', 'coordinador_comunidad')
      and (
        actor.role = 'administrador'
        or (
          actor.role in ('vocal', 'coordinador_diocesano')
          and actor.province_id = target.province_id
          and target.role in ('palestrista', 'sedimentador', 'animador_comunidad', 'coordinador_comunidad')
        )
        or (
          actor.role in ('vocal_nacional', 'coordinador_nacional')
          and target.role not in ('administrador', 'coordinador_nacional')
        )
      )
  );
$$;

grant execute on function public.current_user_can_manage_user(uuid) to authenticated;

create or replace function public.current_user_can_manage_community(p_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles actor
    join public.communities target on target.id = p_community_id
    where actor.id = auth.uid()
      and actor.status = 'aprobado'
      and (
        actor.role in ('vocal_nacional', 'coordinador_nacional', 'administrador')
        or (
          actor.role in ('vocal', 'coordinador_diocesano')
          and actor.province_id = target.province_id
        )
        or (
          actor.role in ('animador_comunidad', 'coordinador_comunidad')
          and actor.province_id = target.province_id
          and lower(coalesce(actor.community_name, '')) = lower(target.name)
        )
      )
  );
$$;

create or replace function public.current_user_can_manage_community_province(p_province_id uuid)
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
      and (
        actor.role in ('vocal_nacional', 'coordinador_nacional', 'administrador')
        or (
          actor.role in ('vocal', 'coordinador_diocesano')
          and actor.province_id = p_province_id
        )
      )
  );
$$;

grant execute on function public.current_user_can_manage_community(uuid) to authenticated;
grant execute on function public.current_user_can_manage_community_province(uuid) to authenticated;

drop function if exists public.admin_create_community(text, text, text, text, text, text, text, text, boolean);
drop function if exists public.admin_create_community(text, text, text, text, text, text, text, text, double precision, double precision, boolean);
create or replace function public.admin_create_community(
  p_province text,
  p_name text,
  p_group_type text,
  p_address text,
  p_phone text,
  p_meeting_day text,
  p_meeting_time text,
  p_description text,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_is_active boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_province_id uuid;
  selected_group_type text;
  new_id uuid;
begin
  select id
  into selected_province_id
  from public.provinces
  where lower(name) = lower(trim(p_province))
  limit 1;

  if selected_province_id is null then
    raise exception 'Provincia no encontrada';
  end if;

  if not public.current_user_can_manage_community_province(selected_province_id) then
    raise exception 'No autorizado para crear comunidades';
  end if;

  if nullif(trim(p_name), '') is null then
    raise exception 'El nombre de la comunidad es obligatorio';
  end if;

  if exists (
    select 1
    from public.communities
    where province_id = selected_province_id
      and lower(name) = lower(trim(p_name))
      and archived_at is null
  ) then
    raise exception 'Ya existe una comunidad con ese nombre en esta provincia';
  end if;

  selected_group_type := case
    when p_group_type in ('jovenes', 'adultos', 'jovenes_adultos') then p_group_type
    else 'jovenes'
  end;

  insert into public.communities (
    province_id, name, group_type, address, phone, meeting_day, meeting_time,
    description, latitude, longitude, is_active, updated_by, updated_at
  )
  values (
    selected_province_id,
    left(trim(p_name), 160),
    selected_group_type,
    coalesce(nullif(trim(p_address), ''), 'Direccion pendiente'),
    nullif(trim(p_phone), ''),
    nullif(trim(p_meeting_day), ''),
    nullif(trim(p_meeting_time), ''),
    nullif(trim(p_description), ''),
    p_latitude,
    p_longitude,
    coalesce(p_is_active, true),
    auth.uid(),
    now()
  )
  returning id into new_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_create_community', jsonb_build_object(
    'community_id', new_id,
    'province_id', selected_province_id,
    'name', p_name,
    'group_type', selected_group_type
  ));

  return new_id;
end;
$$;

grant execute on function public.admin_create_community(text, text, text, text, text, text, text, text, double precision, double precision, boolean) to authenticated;

create or replace function public.admin_set_community_status(
  p_community_id uuid,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_province_id uuid;
begin
  select province_id into target_province_id
  from public.communities
  where id = p_community_id;

  if target_province_id is null then
    raise exception 'Comunidad no encontrada';
  end if;

  if not public.current_user_can_manage_community_province(target_province_id) then
    raise exception 'No autorizado para cambiar el estado de comunidades';
  end if;

  update public.communities
  set is_active = coalesce(p_is_active, true), updated_by = auth.uid(), updated_at = now()
  where id = p_community_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_set_community_status', jsonb_build_object('community_id', p_community_id, 'is_active', p_is_active));
end;
$$;

grant execute on function public.admin_set_community_status(uuid, boolean) to authenticated;

create or replace function public.admin_archive_community(p_community_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_province_id uuid;
begin
  select province_id into target_province_id
  from public.communities
  where id = p_community_id;

  if target_province_id is null then
    raise exception 'Comunidad no encontrada';
  end if;

  if not public.current_user_can_manage_community_province(target_province_id) then
    raise exception 'No autorizado para archivar comunidades';
  end if;

  update public.communities
  set archived_at = now(), is_active = false, updated_by = auth.uid(), updated_at = now()
  where id = p_community_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_archive_community', jsonb_build_object('community_id', p_community_id));
end;
$$;

grant execute on function public.admin_archive_community(uuid) to authenticated;
