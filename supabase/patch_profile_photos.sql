alter table public.profiles
add column if not exists avatar_url text;

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Fotos de perfil visibles" on storage.objects;
create policy "Fotos de perfil visibles"
on storage.objects
for select
using (bucket_id = 'profile-photos');

drop policy if exists "Cada usuario sube su foto" on storage.objects;
create policy "Cada usuario sube su foto"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Cada usuario actualiza su foto" on storage.objects;
create policy "Cada usuario actualiza su foto"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop function if exists public.get_my_profile();

create or replace function public.get_my_profile()
returns table (
  user_id uuid,
  email text,
  full_name text,
  avatar_url text,
  phone text,
  province text,
  community_name text,
  status public.user_status,
  role public.user_role
)
language sql
security definer
set search_path = public
as $$
  select
    auth.users.id as user_id,
    auth.users.email::text as email,
    profiles.full_name,
    profiles.avatar_url,
    profiles.phone,
    provinces.name as province,
    profiles.community_name,
    profiles.status,
    profiles.role
  from auth.users
  left join public.profiles on profiles.id = auth.users.id
  left join public.provinces on provinces.id = profiles.province_id
  where auth.users.id = auth.uid()
  limit 1;
$$;

grant execute on function public.get_my_profile() to authenticated;

create or replace function public.update_my_avatar(p_avatar_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set avatar_url = nullif(trim(p_avatar_url), '')
  where id = auth.uid();
end;
$$;

grant execute on function public.update_my_avatar(text) to authenticated;

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
  email_confirmed_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    auth.users.id,
    auth.users.email::text,
    profiles.full_name,
    profiles.avatar_url,
    profiles.phone,
    provinces.name as province,
    profiles.community_name,
    profiles.status::text,
    profiles.role::text,
    auth.users.email_confirmed_at
  from auth.users
  left join public.profiles on profiles.id = auth.users.id
  left join public.provinces on provinces.id = profiles.province_id
  where public.current_user_is_admin()
  order by auth.users.created_at desc
  limit 500;
$$;

grant execute on function public.admin_get_users() to authenticated;
