alter table if exists public.app_tabs
  drop constraint if exists app_tabs_section_type_check;

alter table if exists public.app_tabs
  add constraint app_tabs_section_type_check
  check (section_type is null or section_type in ('simple', 'library', 'links', 'image_text', 'form', 'internal', 'formation_path'));

create table if not exists public.formation_path_stations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  short_description text,
  image_url text,
  icon_name text,
  color text,
  sort_order integer not null default 100,
  young_content text,
  leader_content text,
  visible_roles text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  updated_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.formation_path_station_materials (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.formation_path_stations(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  unique (station_id, material_id)
);

create index if not exists formation_path_stations_active_order_idx
  on public.formation_path_stations (is_active, sort_order, created_at)
  where archived_at is null;

create index if not exists formation_path_station_materials_station_idx
  on public.formation_path_station_materials (station_id, sort_order);

alter table public.formation_path_stations enable row level security;
alter table public.formation_path_station_materials enable row level security;

drop policy if exists "Formation stations are readable" on public.formation_path_stations;
create policy "Formation stations are readable"
  on public.formation_path_stations
  for select
  using (
    archived_at is null
    and is_active = true
    and (
      visible_roles is null
      or cardinality(visible_roles) = 0
      or exists (
        select 1
        from public.profiles viewer
        where viewer.id = auth.uid()
          and viewer.role::text = any(visible_roles)
      )
    )
  );

drop policy if exists "Formation materials are readable" on public.formation_path_station_materials;
create policy "Formation materials are readable"
  on public.formation_path_station_materials
  for select
  using (
    exists (
      select 1
      from public.formation_path_stations station
      where station.id = formation_path_station_materials.station_id
        and station.archived_at is null
        and station.is_active = true
    )
  );

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
        and public.current_user_can_manage_profiles()
      )
    )
    and (
      p_include_inactive = true
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
  station_id uuid;
  material_id uuid;
  material_index integer := 0;
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
    returning id into station_id;
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
    returning formation_path_stations.id into station_id;
  end if;

  if station_id is null then
    raise exception 'No se encontro la estacion.';
  end if;

  delete from public.formation_path_station_materials
  where formation_path_station_materials.station_id = station_id;

  if p_material_ids is not null then
    foreach material_id in array p_material_ids loop
      material_index := material_index + 1;
      insert into public.formation_path_station_materials (station_id, material_id, sort_order)
      values (station_id, material_id, material_index)
      on conflict (station_id, material_id) do update
        set sort_order = excluded.sort_order;
    end loop;
  end if;

  return station_id;
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
  if not public.current_user_can_manage_profiles() then
    raise exception 'No tenes permisos para editar el Proceso Educativo.';
  end if;

  update public.formation_path_stations
  set is_active = coalesce(p_is_active, is_active),
      updated_at = now(),
      updated_by = auth.uid()
  where id = p_station_id
    and archived_at is null;
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
  if not public.current_user_can_manage_profiles() then
    raise exception 'No tenes permisos para editar el Proceso Educativo.';
  end if;

  update public.formation_path_stations
  set archived_at = now(),
      is_active = false,
      updated_at = now(),
      updated_by = auth.uid()
  where id = p_station_id
    and archived_at is null;
end;
$$;

grant execute on function public.admin_archive_formation_path_station(uuid) to authenticated;

insert into public.app_tabs (key, label, icon_name, section_type, is_visible, sort_order, visible_roles)
values ('proceso_educativo', 'Proceso Educativo', 'map-outline', 'formation_path', true, 70, null)
on conflict (key) do update
set label = excluded.label,
    icon_name = excluded.icon_name,
    section_type = excluded.section_type,
    is_visible = excluded.is_visible;

insert into public.app_content (tab_key, title, body, blocks)
values (
  'proceso_educativo',
  'Proceso Educativo',
  'Un camino de crecimiento para vivir Palestra con profundidad, comunidad y mision.',
  '[]'::jsonb
)
on conflict (tab_key) do nothing;

with seed(title, subtitle, short_description, icon_name, color, sort_order, young_content, leader_content) as (
  values
    ('El llamado', 'Dios sale al encuentro', 'El inicio del camino: reconocer que la vida tiene una vocacion y una respuesta posible.', 'sparkles-outline', '#2d8dc8', 1, 'Escuchar el llamado es abrir el corazon a una pregunta: que quiere Dios hacer conmigo y con mi historia.', 'Acompanar esta etapa implica ayudar a que cada joven nombre su busqueda sin forzar procesos.'),
    ('Periodo Motivador', 'Una experiencia que despierta', 'El PM como impulso inicial para descubrir comunidad, fe y perseverancia.', 'flame-outline', '#f28a00', 2, 'El Periodo Motivador invita a mirar la vida con Cristo y animarse a caminar con otros.', 'La dirigencia cuida el clima, la gradualidad y la continuidad posterior al PM.'),
    ('Comunidad', 'Caminar con otros', 'La comunidad sostiene, corrige, celebra y ayuda a perseverar.', 'people-outline', '#3b8f5a', 3, 'La comunidad no es una reunion mas: es un lugar donde se aprende a vivir la fe en amistad.', 'El dirigente anima pertenencia, escucha y procesos concretos de integracion.'),
    ('Perseverancia', 'Elegir de nuevo', 'La fe madura cuando se vuelve decision cotidiana.', 'heart-outline', '#8f5bd8', 4, 'Perseverar es volver a elegir el camino incluso cuando cuesta.', 'Acompanar perseverancia requiere propuestas posibles, seguimiento y testimonio cercano.'),
    ('Servicio', 'La fe se vuelve entrega', 'Servir ordena los dones y los pone al servicio del Reino.', 'construct-outline', '#d84a4a', 5, 'Servir es descubrir que lo recibido se multiplica cuando se entrega.', 'El servicio se discierne, se prepara y se evalua para que forme y no desgaste.'),
    ('Dirigencia', 'Cuidar el camino de otros', 'La dirigencia como responsabilidad espiritual, comunitaria y pedagogica.', 'trail-sign-outline', '#1b6f8f', 6, 'Ser dirigente es aprender a mirar al otro con responsabilidad y esperanza.', 'La dirigencia forma equipos, criterios, procesos y cultura de cuidado.'),
    ('Misión', 'Salir al encuentro', 'El proceso desemboca en anuncio, presencia y compromiso.', 'earth-outline', '#2f6f4f', 7, 'La mision es llevar lo vivido hacia la vida real, la Iglesia y el mundo.', 'Toda planificacion formativa debe abrir a una mision concreta, discernida y evaluable.')
)
insert into public.formation_path_stations (
  title,
  subtitle,
  short_description,
  icon_name,
  color,
  sort_order,
  young_content,
  leader_content,
  is_active
)
select seed.title, seed.subtitle, seed.short_description, seed.icon_name, seed.color, seed.sort_order, seed.young_content, seed.leader_content, true
from seed
where not exists (
  select 1
  from public.formation_path_stations existing
  where lower(existing.title) = lower(seed.title)
    and existing.archived_at is null
);
