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

create or replace function public.update_my_profile(
  p_full_name text,
  p_phone text,
  p_province text,
  p_community_name text,
  p_gender_preference text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_province_id uuid;
  current_profile record;
  next_role public.user_role;
  province_changed boolean;
  community_changed boolean;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  select profiles.province_id, profiles.community_name, profiles.role, profiles.last_profile_edit_at
  into current_profile
  from public.profiles
  where profiles.id = auth.uid();

  if current_profile is null then
    raise exception 'Perfil no encontrado';
  end if;

  if current_profile.last_profile_edit_at is not null and current_profile.last_profile_edit_at > now() - interval '5 days' then
    raise exception 'El perfil solo puede editarse una vez cada 5 dias';
  end if;

  select id
  into selected_province_id
  from public.provinces
  where name = p_province
  limit 1;

  if selected_province_id is null then
    raise exception 'Provincia no encontrada';
  end if;

  province_changed := current_profile.province_id is distinct from selected_province_id;
  community_changed := coalesce(trim(current_profile.community_name), '') is distinct from coalesce(trim(p_community_name), '');
  next_role := current_profile.role;

  if province_changed and public.role_is_province_bound(current_profile.role) then
    next_role := 'sedimentador';
  elsif community_changed and public.role_is_community_bound(current_profile.role) then
    next_role := 'sedimentador';
  end if;

  update public.profiles
  set
    full_name = nullif(trim(p_full_name), ''),
    phone = nullif(trim(p_phone), ''),
    province_id = selected_province_id,
    community_name = nullif(trim(p_community_name), ''),
    gender_preference = case
      when p_gender_preference in ('male', 'female') then p_gender_preference
      else gender_preference
    end,
    role = next_role,
    last_profile_edit_at = now()
  where id = auth.uid();

  insert into public.audit_logs (actor_id, action, metadata)
  values (
    auth.uid(),
    'update_my_profile',
    jsonb_build_object(
      'province_changed', province_changed,
      'community_changed', community_changed,
      'previous_role', current_profile.role,
      'next_role', next_role,
      'gender_preference', p_gender_preference
    )
  );
end;
$$;

grant execute on function public.update_my_profile(text, text, text, text, text) to authenticated;
