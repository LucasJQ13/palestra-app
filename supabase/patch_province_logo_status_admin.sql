-- Provincias: logo, estado y archivado administrable.
-- Ejecutar en Supabase SQL Editor.

alter table public.provinces
  add column if not exists logo_url text,
  add column if not exists is_active boolean not null default true,
  add column if not exists archived_at timestamptz;

create or replace function public.admin_create_province(
  p_name text,
  p_region text default null,
  p_logo_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_name text := trim(coalesce(p_name, ''));
  normalized_region text := nullif(trim(coalesce(p_region, '')), '');
  created_id uuid;
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'administrador'
      and profiles.status = 'aprobado'
  ) then
    raise exception 'Solo Administrador puede crear provincias';
  end if;

  if normalized_name = '' then
    raise exception 'El nombre de la provincia es obligatorio';
  end if;

  insert into public.provinces (name, region, logo_url, is_active, archived_at)
  values (normalized_name, coalesce(normalized_region, 'Sin region'), nullif(trim(coalesce(p_logo_url, '')), ''), true, null)
  on conflict (name) do update
  set
    region = coalesce(excluded.region, public.provinces.region),
    logo_url = coalesce(excluded.logo_url, public.provinces.logo_url),
    is_active = true,
    archived_at = null
  returning id into created_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_create_province', jsonb_build_object(
    'province_id', created_id,
    'name', normalized_name,
    'region', coalesce(normalized_region, 'Sin region')
  ));

  return created_id;
end;
$$;

create or replace function public.admin_update_province_logo(
  p_name text,
  p_logo_url text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  if not exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'administrador'
      and profiles.status = 'aprobado'
  ) then
    raise exception 'Solo Administrador puede editar logos de provincias';
  end if;

  update public.provinces
  set logo_url = nullif(trim(coalesce(p_logo_url, '')), '')
  where name = trim(coalesce(p_name, ''))
  returning id into target_id;

  if target_id is null then
    raise exception 'Provincia no encontrada';
  end if;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_province_logo', jsonb_build_object('province_id', target_id, 'name', p_name));
end;
$$;

create or replace function public.admin_set_province_status(
  p_name text,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  if not exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'administrador'
      and profiles.status = 'aprobado'
  ) then
    raise exception 'Solo Administrador puede cambiar el estado de provincias';
  end if;

  update public.provinces
  set is_active = coalesce(p_is_active, true)
  where name = trim(coalesce(p_name, ''))
    and archived_at is null
  returning id into target_id;

  if target_id is null then
    raise exception 'Provincia no encontrada';
  end if;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_set_province_status', jsonb_build_object('province_id', target_id, 'name', p_name, 'is_active', p_is_active));
end;
$$;

create or replace function public.admin_archive_province(
  p_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  if not exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'administrador'
      and profiles.status = 'aprobado'
  ) then
    raise exception 'Solo Administrador puede eliminar provincias';
  end if;

  update public.provinces
  set is_active = false,
      archived_at = now()
  where name = trim(coalesce(p_name, ''))
  returning id into target_id;

  if target_id is null then
    raise exception 'Provincia no encontrada';
  end if;

  update public.communities
  set is_active = false
  where province_id = target_id
    and archived_at is null;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_archive_province', jsonb_build_object('province_id', target_id, 'name', p_name));
end;
$$;

grant execute on function public.admin_create_province(text, text, text) to authenticated;
grant execute on function public.admin_update_province_logo(text, text) to authenticated;
grant execute on function public.admin_set_province_status(text, boolean) to authenticated;
grant execute on function public.admin_archive_province(text) to authenticated;
