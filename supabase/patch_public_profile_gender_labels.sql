alter table public.profiles
  add column if not exists display_role_label text,
  add column if not exists gender_preference text check (gender_preference in ('male', 'female'));

drop function if exists public.get_public_profile(uuid);
create or replace function public.get_public_profile(p_profile_id uuid)
returns table (
  id uuid,
  full_name text,
  avatar_url text,
  phone text,
  province text,
  community_name text,
  role text,
  display_role_label text,
  gender_preference text
)
language sql
security definer
set search_path = public
as $$
  select
    profiles.id,
    profiles.full_name,
    profiles.avatar_url,
    profiles.phone,
    provinces.name,
    profiles.community_name,
    profiles.role::text,
    profiles.display_role_label,
    profiles.gender_preference
  from public.profiles
  left join public.provinces on provinces.id = profiles.province_id
  where profiles.id = p_profile_id
    and profiles.status = 'aprobado'
  limit 1;
$$;

grant execute on function public.get_public_profile(uuid) to authenticated;

drop function if exists public.get_my_community_members();
create or replace function public.get_my_community_members()
returns table (
  id uuid,
  full_name text,
  email text,
  role text,
  community_name text,
  province text,
  avatar_url text,
  gender_preference text
)
language sql
security definer
set search_path = public
as $$
  with me as (
    select profiles.community_name, profiles.province_id
    from public.profiles
    where profiles.id = auth.uid()
  )
  select
    profiles.id,
    profiles.full_name,
    auth.users.email,
    profiles.role::text,
    profiles.community_name,
    provinces.name,
    profiles.avatar_url,
    profiles.gender_preference
  from public.profiles
  join me on me.community_name = profiles.community_name and me.province_id = profiles.province_id
  left join auth.users on auth.users.id = profiles.id
  left join public.provinces on provinces.id = profiles.province_id
  where profiles.status = 'aprobado'
  order by profiles.full_name nulls last, auth.users.email;
$$;

grant execute on function public.get_my_community_members() to authenticated;

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
  email_confirmed_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    profiles.id,
    auth.users.email,
    profiles.full_name,
    profiles.avatar_url,
    profiles.phone,
    provinces.name as province,
    profiles.community_name,
    profiles.status::text,
    profiles.role::text,
    profiles.display_role_label,
    profiles.gender_preference,
    auth.users.email_confirmed_at
  from public.profiles
  left join auth.users on auth.users.id = profiles.id
  left join public.provinces on provinces.id = profiles.province_id
  where public.current_user_can_edit_profile(profiles.id)
     or public.current_user_is_admin()
  order by provinces.name nulls last, profiles.full_name;
$$;

grant execute on function public.admin_get_users() to authenticated;
