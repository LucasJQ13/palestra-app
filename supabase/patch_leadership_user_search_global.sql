-- Permite que rangos dirigenciales consulten usuarios globalmente para busqueda/visualizacion.
-- La edicion sigue protegida por current_user_can_edit_profile/admin_update_user.

drop function if exists public.admin_get_users();

create or replace function public.admin_get_users()
returns table (
  id uuid,
  email text,
  full_name text,
  avatar_url text,
  phone text,
  province text,
  community_name text,
  status text,
  role text,
  display_role_label text,
  gender_preference text,
  nickname text,
  use_nickname_in_greetings boolean,
  credential_name_mode text,
  perseverance_start_year integer,
  personal_pm_type text,
  personal_pm_number integer,
  personal_pm_province text,
  personal_pm_motto text,
  pm_motto text,
  email_confirmed_at timestamptz
)
language sql
security definer
set search_path = public, auth
as $$
  with actor as (
    select profiles.*
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'aprobado'
      and profiles.role in ('asesor', 'vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador')
  )
  select
    au.id,
    au.email::text,
    p.full_name,
    p.avatar_url,
    p.phone,
    pr.name as province,
    p.community_name,
    coalesce(p.status::text, 'sin_profile') as status,
    coalesce(p.role::text, 'sin_profile') as role,
    p.display_role_label,
    p.gender_preference::text,
    p.nickname,
    coalesce(p.use_nickname_in_greetings, false) as use_nickname_in_greetings,
    p.credential_name_mode::text,
    p.perseverance_start_year,
    p.personal_pm_type::text,
    p.personal_pm_number,
    pm_pr.name as personal_pm_province,
    p.personal_pm_motto,
    p.pm_motto,
    au.email_confirmed_at
  from auth.users au
  left join public.profiles p on p.id = au.id
  left join public.provinces pr on pr.id = p.province_id
  left join public.provinces pm_pr on pm_pr.id = p.personal_pm_province_id
  where exists (select 1 from actor)
    and coalesce(p.role::text, 'sin_profile') <> 'administrador'
  order by pr.name nulls last, p.full_name nulls last, au.email
  limit 1000;
$$;

grant execute on function public.admin_get_users() to authenticated;
