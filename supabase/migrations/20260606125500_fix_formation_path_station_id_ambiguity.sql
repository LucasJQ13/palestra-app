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
  if not public.current_user_can_manage_profiles() then
    raise exception 'No tenes permisos para editar el Proceso Educativo.';
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
    update public.formation_path_stations
    set
      title = trim(p_title),
      subtitle = nullif(trim(coalesce(p_subtitle, '')), ''),
      short_description = nullif(trim(coalesce(p_short_description, '')), ''),
      image_url = nullif(trim(coalesce(p_image_url, '')), ''),
      icon_name = nullif(trim(coalesce(p_icon_name, '')), ''),
      color = nullif(trim(coalesce(p_color, '')), ''),
      sort_order = coalesce(p_sort_order, formation_path_stations.sort_order),
      young_content = nullif(trim(coalesce(p_young_content, '')), ''),
      leader_content = nullif(trim(coalesce(p_leader_content, '')), ''),
      visible_roles = p_visible_roles,
      is_active = coalesce(p_is_active, formation_path_stations.is_active),
      updated_at = now(),
      updated_by = auth.uid()
    where formation_path_stations.id = p_id
      and formation_path_stations.archived_at is null
    returning formation_path_stations.id into v_station_id;
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
