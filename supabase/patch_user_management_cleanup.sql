-- Gestion segura de usuarios y diagnostico de conflicto Auth/Profile.
-- Ejecutar en Supabase SQL Editor.

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
      and (
        actor.role = 'administrador'
        or (
          actor.role in ('vocal', 'asesor', 'coordinador_diocesano')
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

create or replace function public.admin_soft_delete_user(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_can_manage_user(p_profile_id) then
    raise exception 'No autorizado para eliminar este usuario';
  end if;

  update public.profiles
  set
    status = 'bloqueado',
    role = case when role = 'administrador' then role else 'invitado'::public.user_role end,
    approved_at = null
  where id = p_profile_id
    and role <> 'administrador';

  insert into public.audit_logs (actor_id, action, metadata)
  values (
    auth.uid(),
    'admin_soft_delete_user',
    jsonb_build_object('profile_id', p_profile_id)
  );
end;
$$;

grant execute on function public.admin_soft_delete_user(uuid) to authenticated;

create or replace function public.admin_diagnose_user_login(p_email text)
returns table (
  auth_user_id uuid,
  auth_email text,
  auth_confirmed_at timestamptz,
  profile_id uuid,
  profile_email text,
  profile_status text,
  profile_role text,
  profile_province text,
  profile_community text,
  issue text
)
language sql
security definer
set search_path = public, auth
as $$
  with actor as (
    select role, status
    from public.profiles
    where id = auth.uid()
  ),
  auth_match as (
    select id, email, email_confirmed_at
    from auth.users
    where lower(email) = lower(p_email)
  ),
  profile_match as (
    select p.id, au.email, p.status, p.role, pr.name as province, p.community_name
    from public.profiles p
    left join auth.users au on au.id = p.id
    left join public.provinces pr on pr.id = p.province_id
    where lower(coalesce(au.email, '')) = lower(p_email)
       or lower(coalesce(p.full_name, '')) = lower(p_email)
  )
  select
    a.id,
    a.email,
    a.email_confirmed_at,
    p.id,
    p.email,
    p.status::text,
    p.role::text,
    p.province,
    p.community_name,
    case
      when a.id is null then 'No existe usuario en Supabase Auth'
      when p.id is null then 'Existe en Auth pero no tiene profile asociado'
      when a.id <> p.id then 'Auth y profile no coinciden'
      when a.email_confirmed_at is null then 'Email sin confirmar'
      when p.status = 'bloqueado' then 'Perfil bloqueado/eliminado'
      when p.status = 'pendiente' then 'Perfil pendiente de aprobacion'
      else 'Sin conflicto evidente'
    end
  from actor
  left join auth_match a on true
  left join profile_match p on p.id = a.id
  where actor.status = 'aprobado'
    and actor.role in ('administrador', 'coordinador_nacional', 'vocal_nacional')
  limit 20;
$$;

grant execute on function public.admin_diagnose_user_login(text) to authenticated;
