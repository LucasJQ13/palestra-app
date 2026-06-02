-- Herramienta administrativa para crear provincias.
-- Ejecutar en Supabase SQL Editor.

create or replace function public.admin_create_province(
  p_name text,
  p_region text default null
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

  insert into public.provinces (name, region)
  values (normalized_name, coalesce(normalized_region, 'Sin region'))
  on conflict (name) do update
  set region = coalesce(excluded.region, public.provinces.region)
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

grant execute on function public.admin_create_province(text, text) to authenticated;
