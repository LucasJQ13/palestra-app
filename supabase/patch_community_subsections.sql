-- Comunidades: subsecciones fijas por provincia.
-- Ejecutar una sola vez desde Supabase SQL Editor.

alter table public.communities drop constraint if exists communities_group_type_check;

update public.communities
set group_type = 'jovenes'
where group_type is null
   or group_type not in ('jovenes', 'adultos', 'jovenes_adultos');

update public.communities
set group_type = 'jovenes'
where province_id in (
  select id
  from public.provinces
  where lower(name) in ('salta', 'jujuy', 'san luis')
);

alter table public.communities
  add constraint communities_group_type_check
  check (group_type in ('jovenes', 'adultos', 'jovenes_adultos'));

create table if not exists public.province_community_sections (
  id uuid primary key default gen_random_uuid(),
  province_id uuid not null references public.provinces(id) on delete cascade,
  group_type text not null check (group_type in ('jovenes', 'adultos', 'jovenes_adultos')),
  is_enabled boolean not null default false,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  unique (province_id, group_type)
);

alter table public.province_community_sections enable row level security;

drop policy if exists "Todos leen subsecciones de comunidades" on public.province_community_sections;
create policy "Todos leen subsecciones de comunidades"
on public.province_community_sections
for select
to anon, authenticated
using (true);

drop policy if exists "Solo admin modifica subsecciones de comunidades" on public.province_community_sections;
create policy "Solo admin modifica subsecciones de comunidades"
on public.province_community_sections
for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

insert into public.province_community_sections (province_id, group_type, is_enabled)
select
  provinces.id,
  sections.group_type,
  case
    when lower(provinces.name) in ('tucuman', 'tucumán', 'catamarca') and sections.group_type in ('jovenes', 'adultos') then true
    when lower(provinces.name) in ('salta', 'jujuy', 'san luis') and sections.group_type = 'jovenes' then true
    else false
  end as is_enabled
from public.provinces
cross join (
  values
    ('jovenes'),
    ('adultos'),
    ('jovenes_adultos')
) as sections(group_type)
on conflict (province_id, group_type)
do update set
  is_enabled = excluded.is_enabled,
  updated_at = now()
where public.province_community_sections.updated_by is null;

drop function if exists public.admin_set_province_community_section(text, text, boolean);
create or replace function public.admin_set_province_community_section(
  p_province text,
  p_group_type text,
  p_is_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_province_id uuid;
  normalized_group text;
begin
  if not public.current_user_is_admin() then
    raise exception 'Solo Administrador puede configurar subsecciones de comunidades';
  end if;

  normalized_group := case
    when p_group_type in ('jovenes', 'adultos', 'jovenes_adultos') then p_group_type
    else null
  end;

  if normalized_group is null then
    raise exception 'Subseccion de comunidad invalida';
  end if;

  select id
  into selected_province_id
  from public.provinces
  where lower(name) = lower(trim(p_province))
  limit 1;

  if selected_province_id is null then
    raise exception 'Provincia no encontrada';
  end if;

  insert into public.province_community_sections (
    province_id, group_type, is_enabled, updated_by, updated_at
  )
  values (
    selected_province_id, normalized_group, coalesce(p_is_enabled, false), auth.uid(), now()
  )
  on conflict (province_id, group_type)
  do update set
    is_enabled = excluded.is_enabled,
    updated_by = auth.uid(),
    updated_at = now();

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_set_province_community_section', jsonb_build_object(
    'province_id', selected_province_id,
    'group_type', normalized_group,
    'is_enabled', coalesce(p_is_enabled, false)
  ));
end;
$$;

grant execute on function public.admin_set_province_community_section(text, text, boolean) to authenticated;

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
    raise exception 'No autorizado';
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

drop function if exists public.admin_update_community(uuid, text, text, text, text, text, text);
drop function if exists public.admin_update_community(uuid, text, text, text, text, text, text, text);
drop function if exists public.admin_update_community(uuid, text, text, text, text, text, text, text, double precision, double precision);
drop function if exists public.admin_update_community(uuid, text, text, text, text, text, text, text, double precision, double precision, text);
create or replace function public.admin_update_community(
  p_community_id uuid,
  p_name text,
  p_address text,
  p_phone text,
  p_meeting_day text,
  p_meeting_time text,
  p_description text,
  p_image_url text default null,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_group_type text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_name text;
  new_name text;
  selected_group_type text;
begin
  if not public.current_user_can_manage_community(p_community_id) then
    raise exception 'No autorizado para editar esta comunidad';
  end if;

  select name, group_type
  into old_name, selected_group_type
  from public.communities
  where id = p_community_id;

  if old_name is null then
    raise exception 'Comunidad no encontrada';
  end if;

  new_name := coalesce(nullif(trim(p_name), ''), old_name);
  selected_group_type := case
    when p_group_type in ('jovenes', 'adultos', 'jovenes_adultos') then p_group_type
    else selected_group_type
  end;

  update public.communities
  set
    name = new_name,
    group_type = selected_group_type,
    address = coalesce(nullif(trim(p_address), ''), address),
    phone = nullif(trim(p_phone), ''),
    meeting_day = nullif(trim(p_meeting_day), ''),
    meeting_time = nullif(trim(p_meeting_time), ''),
    description = nullif(trim(p_description), ''),
    image_url = coalesce(nullif(trim(p_image_url), ''), image_url),
    latitude = p_latitude,
    longitude = p_longitude,
    updated_by = auth.uid(),
    updated_at = now()
  where id = p_community_id;

  update public.profiles
  set community_name = new_name
  where community_name = old_name;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_community', jsonb_build_object(
    'community_id', p_community_id,
    'old_name', old_name,
    'new_name', new_name,
    'group_type', selected_group_type,
    'image_url_changed', nullif(trim(coalesce(p_image_url, '')), '') is not null
  ));
end;
$$;

grant execute on function public.admin_update_community(uuid, text, text, text, text, text, text, text, double precision, double precision, text) to authenticated;
