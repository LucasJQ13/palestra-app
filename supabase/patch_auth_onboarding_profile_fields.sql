alter table public.profiles
add column if not exists first_name text,
add column if not exists last_name text,
add column if not exists nickname text,
add column if not exists birth_date date,
add column if not exists gender_preference text check (gender_preference in ('male', 'female'));

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_province_id uuid;
begin
  select provinces.id
  into selected_province_id
  from public.provinces
  where provinces.name = new.raw_user_meta_data->>'province'
  limit 1;

  insert into public.profiles (
    id,
    full_name,
    first_name,
    last_name,
    nickname,
    birth_date,
    gender_preference,
    phone,
    province_id,
    community_name,
    status,
    role
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email, 'Usuario nuevo'),
    nullif(new.raw_user_meta_data->>'first_name', ''),
    nullif(new.raw_user_meta_data->>'last_name', ''),
    nullif(new.raw_user_meta_data->>'nickname', ''),
    nullif(new.raw_user_meta_data->>'birth_date', '')::date,
    nullif(new.raw_user_meta_data->>'gender_preference', ''),
    new.raw_user_meta_data->>'phone',
    selected_province_id,
    new.raw_user_meta_data->>'community_name',
    'pendiente',
    'palestrista'
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    nickname = excluded.nickname,
    birth_date = excluded.birth_date,
    gender_preference = excluded.gender_preference,
    phone = excluded.phone,
    province_id = excluded.province_id,
    community_name = excluded.community_name,
    role = case
      when profiles.role = 'invitado' then 'palestrista'::public.user_role
      else profiles.role
    end;

  return new;
end;
$$;

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
  role public.user_role,
  display_role_label text,
  gender_preference text
)
language sql
security definer
set search_path = public
as $$
  select
    profiles.id as user_id,
    auth.users.email,
    profiles.full_name,
    profiles.avatar_url,
    profiles.phone,
    provinces.name as province,
    profiles.community_name,
    profiles.status,
    profiles.role,
    profiles.display_role_label,
    profiles.gender_preference
  from public.profiles
  join auth.users on auth.users.id = profiles.id
  left join public.provinces on provinces.id = profiles.province_id
  where profiles.id = auth.uid();
$$;

grant execute on function public.get_my_profile() to authenticated;
