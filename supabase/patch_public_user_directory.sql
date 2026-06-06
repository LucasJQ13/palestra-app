-- Directorio publico minimo para busqueda global y destinatarios del buzon.
-- No reemplaza admin_get_users ni habilita edicion: solo expone datos publicos.

drop function if exists public.get_public_user_directory();

create or replace function public.get_public_user_directory()
returns table (
  id uuid,
  full_name text,
  avatar_url text,
  province text,
  community_name text,
  status text,
  role text,
  subrole_key text,
  display_role_label text,
  gender_preference text,
  nickname text,
  credential_name_mode text,
  perseverance_start_year integer,
  personal_pm_type text,
  personal_pm_number integer,
  personal_pm_province text,
  personal_pm_motto text,
  pm_motto text
)
language sql
security definer
set search_path = public, auth
as $$
  with actor as (
    select p.role::text as role
    from public.profiles p
    where p.id = auth.uid()
      and p.status::text = 'aprobado'
      and p.role::text <> 'invitado'
    limit 1
  )
  select
    p.id,
    p.full_name,
    p.avatar_url,
    pr.name as province,
    p.community_name,
    p.status::text as status,
    p.role::text as role,
    p.subrole_key,
    p.display_role_label,
    p.gender_preference::text,
    p.nickname,
    p.credential_name_mode::text,
    p.perseverance_start_year,
    p.personal_pm_type::text,
    p.personal_pm_number,
    pm_pr.name as personal_pm_province,
    p.personal_pm_motto,
    p.pm_motto
  from public.profiles p
  left join public.provinces pr on pr.id = p.province_id
  left join public.provinces pm_pr on pm_pr.id = p.personal_pm_province_id
  where exists (select 1 from actor)
    and p.status::text = 'aprobado'
    and p.role::text <> 'invitado'
    and ((select actor.role from actor) = 'administrador' or p.role::text <> 'administrador')
  order by pr.name nulls last, p.community_name nulls last, p.full_name nulls last
  limit 1500;
$$;

grant execute on function public.get_public_user_directory() to authenticated;
