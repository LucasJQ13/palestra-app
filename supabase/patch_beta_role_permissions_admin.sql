-- Beta: administracion de permisos por rango.
-- Ejecutar en Supabase SQL Editor.

create or replace function public.admin_get_role_permissions(p_role public.user_role)
returns table (
  role text,
  permission_key text,
  permission_label text,
  permission_description text,
  enabled boolean
)
language sql
security definer
set search_path = public
as $$
  select
    p_role::text as role,
    permissions.key as permission_key,
    permissions.label as permission_label,
    permissions.description as permission_description,
    exists (
      select 1
      from public.role_permissions role_permissions
      where role_permissions.role = p_role
        and role_permissions.permission_key = permissions.key
    ) as enabled
  from public.permissions permissions
  where public.current_user_is_admin()
  order by permissions.label;
$$;

grant execute on function public.admin_get_role_permissions(public.user_role) to authenticated;

create or replace function public.admin_save_role_permissions(
  p_role public.user_role,
  p_permission_keys text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'Solo Administrador puede modificar permisos de rangos';
  end if;

  if p_role = 'administrador' then
    raise exception 'Los permisos del Administrador no se modifican desde la app';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_permission_keys, array[]::text[])) as permission_key
    where not exists (
      select 1
      from public.permissions
      where permissions.key = permission_key
    )
  ) then
    raise exception 'La lista contiene permisos inexistentes';
  end if;

  delete from public.role_permissions
  where role = p_role;

  insert into public.role_permissions (role, permission_key)
  select distinct p_role, permission_key
  from unnest(coalesce(p_permission_keys, array[]::text[])) as permission_key;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_save_role_permissions', jsonb_build_object(
    'role', p_role,
    'permission_keys', p_permission_keys
  ));
end;
$$;

grant execute on function public.admin_save_role_permissions(public.user_role, text[]) to authenticated;
