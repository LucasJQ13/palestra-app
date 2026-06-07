create or replace function public.current_user_can_manage_formation_path()
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
      and actor.role = 'administrador'
  );
$$;

grant execute on function public.current_user_can_manage_formation_path() to authenticated;

create or replace function public.current_user_can_manage_requests(
  p_requester_id uuid,
  p_request_type text
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
    join public.profiles requester on requester.id = p_requester_id
    where actor.id = auth.uid()
      and actor.status = 'aprobado'
      and (
        actor.role = 'administrador'
        or (
          coalesce(p_request_type, '') <> 'Confirmacion de mail'
          and actor.role in ('vocal_nacional', 'coordinador_nacional')
        )
        or (
          coalesce(p_request_type, '') <> 'Confirmacion de mail'
          and actor.role in ('vocal', 'coordinador_diocesano')
          and actor.province_id = requester.province_id
        )
      )
  );
$$;

grant execute on function public.current_user_can_manage_requests(uuid, text) to authenticated;

create or replace function public.get_formation_path_stations(p_include_inactive boolean default false)
returns table (
  id uuid,
  title text,
  subtitle text,
  short_description text,
  image_url text,
  icon_name text,
  color text,
  sort_order integer,
  young_content text,
  leader_content text,
  visible_roles text[],
  is_active boolean,
  material_ids uuid[],
  created_at timestamptz,
  updated_at timestamptz,
  archived_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    station.id,
    station.title,
    station.subtitle,
    station.short_description,
    station.image_url,
    station.icon_name,
    station.color,
    station.sort_order,
    station.young_content,
    station.leader_content,
    station.visible_roles,
    station.is_active,
    coalesce(
      array_agg(link.material_id order by link.sort_order, link.created_at) filter (where link.material_id is not null),
      '{}'::uuid[]
    ) as material_ids,
    station.created_at,
    station.updated_at,
    station.archived_at
  from public.formation_path_stations station
  left join public.formation_path_station_materials link on link.station_id = station.id
  where station.archived_at is null
    and (
      station.is_active = true
      or (
        p_include_inactive = true
        and public.current_user_can_manage_formation_path()
      )
    )
    and (
      (
        p_include_inactive = true
        and public.current_user_can_manage_formation_path()
      )
      or station.visible_roles is null
      or cardinality(station.visible_roles) = 0
      or exists (
        select 1
        from public.profiles viewer
        where viewer.id = auth.uid()
          and viewer.role::text = any(station.visible_roles)
      )
    )
  group by station.id
  order by station.sort_order, station.created_at;
$$;

grant execute on function public.get_formation_path_stations(boolean) to anon, authenticated;

create or replace function public.admin_save_formation_path_station(
  p_id uuid,
  p_title text,
  p_subtitle text,
  p_short_description text,
  p_image_url text,
  p_icon_name text,
  p_color text,
  p_sort_order integer,
  p_young_content text,
  p_leader_content text,
  p_visible_roles text[],
  p_is_active boolean,
  p_material_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_station_id uuid;
  v_material_id uuid;
  v_material_index integer := 0;
begin
  if not public.current_user_can_manage_formation_path() then
    raise exception 'Solo Administrador puede editar el Proceso Educativo.';
  end if;

  if nullif(trim(coalesce(p_title, '')), '') is null then
    raise exception 'El titulo de la estacion es obligatorio.';
  end if;

  if p_id is null then
    insert into public.formation_path_stations (
      title,
      subtitle,
      short_description,
      image_url,
      icon_name,
      color,
      sort_order,
      young_content,
      leader_content,
      visible_roles,
      is_active,
      updated_by
    )
    values (
      trim(p_title),
      nullif(trim(coalesce(p_subtitle, '')), ''),
      nullif(trim(coalesce(p_short_description, '')), ''),
      nullif(trim(coalesce(p_image_url, '')), ''),
      nullif(trim(coalesce(p_icon_name, '')), ''),
      nullif(trim(coalesce(p_color, '')), ''),
      coalesce(p_sort_order, 100),
      nullif(trim(coalesce(p_young_content, '')), ''),
      nullif(trim(coalesce(p_leader_content, '')), ''),
      p_visible_roles,
      coalesce(p_is_active, true),
      auth.uid()
    )
    returning id into v_station_id;
  else
    update public.formation_path_stations station
    set
      title = trim(p_title),
      subtitle = nullif(trim(coalesce(p_subtitle, '')), ''),
      short_description = nullif(trim(coalesce(p_short_description, '')), ''),
      image_url = nullif(trim(coalesce(p_image_url, '')), ''),
      icon_name = nullif(trim(coalesce(p_icon_name, '')), ''),
      color = nullif(trim(coalesce(p_color, '')), ''),
      sort_order = coalesce(p_sort_order, station.sort_order),
      young_content = nullif(trim(coalesce(p_young_content, '')), ''),
      leader_content = nullif(trim(coalesce(p_leader_content, '')), ''),
      visible_roles = p_visible_roles,
      is_active = coalesce(p_is_active, station.is_active),
      updated_at = now(),
      updated_by = auth.uid()
    where station.id = p_id
      and station.archived_at is null
    returning station.id into v_station_id;
  end if;

  if v_station_id is null then
    raise exception 'No se encontro la estacion.';
  end if;

  delete from public.formation_path_station_materials link
  where link.station_id = v_station_id;

  if p_material_ids is not null then
    foreach v_material_id in array p_material_ids loop
      v_material_index := v_material_index + 1;
      insert into public.formation_path_station_materials (station_id, material_id, sort_order)
      values (v_station_id, v_material_id, v_material_index)
      on conflict (station_id, material_id) do update
        set sort_order = excluded.sort_order;
    end loop;
  end if;

  return v_station_id;
end;
$$;

grant execute on function public.admin_save_formation_path_station(uuid, text, text, text, text, text, text, integer, text, text, text[], boolean, uuid[]) to authenticated;

create or replace function public.admin_set_formation_path_station_status(p_station_id uuid, p_is_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_can_manage_formation_path() then
    raise exception 'Solo Administrador puede editar el Proceso Educativo.';
  end if;

  update public.formation_path_stations station
  set is_active = coalesce(p_is_active, station.is_active),
      updated_at = now(),
      updated_by = auth.uid()
  where station.id = p_station_id
    and station.archived_at is null;
end;
$$;

grant execute on function public.admin_set_formation_path_station_status(uuid, boolean) to authenticated;

create or replace function public.admin_archive_formation_path_station(p_station_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_can_manage_formation_path() then
    raise exception 'Solo Administrador puede editar el Proceso Educativo.';
  end if;

  update public.formation_path_stations station
  set archived_at = now(),
      is_active = false,
      updated_at = now(),
      updated_by = auth.uid()
  where station.id = p_station_id
    and station.archived_at is null;
end;
$$;

grant execute on function public.admin_archive_formation_path_station(uuid) to authenticated;

drop function if exists public.admin_get_requests();
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
    coalesce(communities.name, requester.community_name) as community_name
  from public.user_requests requests
  join public.profiles requester on requester.id = requests.user_id
  left join public.profiles resolver on resolver.id = requests.resolved_by
  left join public.profiles target on target.id = requests.target_user_id
  left join public.communities on communities.id = requests.community_id
  where public.current_user_can_manage_requests(requests.user_id, requests.request_type)
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
  request_row public.user_requests%rowtype;
  final_role public.user_role;
  final_target uuid;
begin
  select * into request_row from public.user_requests where id = p_request_id;

  if request_row.id is null then
    raise exception 'Solicitud inexistente';
  end if;

  if not public.current_user_can_manage_requests(request_row.user_id, request_row.request_type) then
    raise exception 'No autorizado';
  end if;

  update public.user_requests
  set
    status = p_status,
    admin_message = nullif(trim(p_admin_message), ''),
    resolved_at = now(),
    resolved_by = auth.uid()
  where id = p_request_id;

  if p_status = 'aprobada' then
    final_role := coalesce(request_row.target_role, nullif(p_assign_role, '')::public.user_role);
    final_target := coalesce(request_row.target_user_id, request_row.user_id);

    if final_role is not null then
      update public.profiles
      set
        role = final_role,
        status = 'aprobado',
        managed_community_id = case
          when final_role in ('animador_comunidad', 'coordinador_comunidad') then request_row.community_id
          else managed_community_id
        end,
        community_id = coalesce(community_id, request_row.community_id),
        approved_at = coalesce(approved_at, now()),
        approved_by = coalesce(approved_by, auth.uid())
      where id = final_target;

      if final_role = 'animador_comunidad' then
        update public.communities set animator_profile_id = final_target where id = request_row.community_id;
      elsif final_role = 'coordinador_comunidad' then
        update public.communities set coordinator_profile_id = final_target where id = request_row.community_id;
      end if;
    end if;
  end if;
end;
$$;

grant execute on function public.admin_resolve_user_request(uuid, text, text, text) to authenticated;
