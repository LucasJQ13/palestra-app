-- Lectura completa de materiales para Administrador.
-- Ejecutar despues de los parches de materiales.

create or replace function public.current_user_is_strict_administrator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'aprobado'
      and profiles.role = 'administrador'
  )
$$;

grant execute on function public.current_user_is_strict_administrator() to authenticated;

drop policy if exists "Materiales visibles por rango y alcance" on public.materials;
create policy "Materiales visibles por rango y alcance"
on public.materials
for select
using (
  archived_at is null
  and (
    public.current_user_is_strict_administrator()
    or visibility = 'publico'
    or exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.status = 'aprobado'
        and public.current_user_can_access_province(materials.province_id)
        and (
          visibility in ('interno', 'reservado')
          or (visibility = 'administrador' and profiles.role = 'administrador')
          or (
            visibility = 'desde_rango'
            and public.role_rank(profiles.role) >= public.material_required_role_rank(materials.required_permission)
          )
          or (
            visibility = 'solo_rango'
            and (
              public.role_rank(profiles.role) = public.material_required_role_rank(materials.required_permission)
              or (
                public.material_required_role_rank(materials.required_permission) = public.role_rank('sedimentador'::public.user_role)
                and public.role_rank(profiles.role) >= public.role_rank('sedimentador'::public.user_role)
              )
            )
          )
        )
    )
  )
);

create or replace function public.admin_get_materials()
returns table (
  id uuid,
  title text,
  description text,
  category text,
  visibility text,
  required_permission text,
  file_url text,
  file_path text,
  sort_order integer,
  archived_at timestamptz,
  created_at timestamptz,
  created_by uuid,
  province_id uuid
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_strict_administrator() then
    raise exception 'Solo Administrador puede ver todos los materiales';
  end if;

  return query
    select
      m.id,
      m.title,
      m.description,
      m.category,
      m.visibility,
      m.required_permission,
      m.file_url,
      m.file_path,
      m.sort_order,
      m.archived_at,
      m.created_at,
      m.created_by,
      m.province_id
    from public.materials m
    where m.archived_at is null
    order by coalesce(m.sort_order, 100) asc, m.created_at desc;
end;
$$;

grant execute on function public.admin_get_materials() to authenticated;
