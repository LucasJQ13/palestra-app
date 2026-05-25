-- Preferencias de perfil, apodo y perseverancia.
-- Ejecutar despues de los parches de perfiles y usuarios.

alter table public.profiles
  add column if not exists use_nickname_in_greetings boolean not null default false,
  add column if not exists credential_name_mode text not null default 'name',
  add column if not exists perseverance_start_year integer,
  add column if not exists pm_motto text;

alter table public.profiles
  drop constraint if exists profiles_credential_name_mode_check;

alter table public.profiles
  add constraint profiles_credential_name_mode_check
  check (credential_name_mode in ('name', 'nickname', 'both'));

alter table public.profiles
  drop constraint if exists profiles_perseverance_start_year_check;

alter table public.profiles
  add constraint profiles_perseverance_start_year_check
  check (perseverance_start_year is null or (perseverance_start_year between 1961 and extract(year from now())::integer));

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

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_province_id uuid;
  requested_start_year integer;
begin
  select provinces.id
  into selected_province_id
  from public.provinces
  where provinces.name = new.raw_user_meta_data->>'province'
  limit 1;

  requested_start_year := case
    when coalesce(new.raw_user_meta_data->>'perseverance_start_year', '') ~ '^[0-9]{4}$'
      then (new.raw_user_meta_data->>'perseverance_start_year')::integer
    else null
  end;

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
    perseverance_start_year,
    use_nickname_in_greetings,
    credential_name_mode,
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
    case when requested_start_year between 1961 and extract(year from now())::integer then requested_start_year else null end,
    false,
    'name',
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
    perseverance_start_year = coalesce(excluded.perseverance_start_year, profiles.perseverance_start_year),
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
  email_confirmed_at timestamptz,
  full_name text,
  avatar_url text,
  phone text,
  province text,
  community_name text,
  status public.user_status,
  role public.user_role,
  display_role_label text,
  gender_preference text,
  nickname text,
  use_nickname_in_greetings boolean,
  credential_name_mode text,
  perseverance_start_year integer,
  pm_motto text
)
language sql
security definer
set search_path = public
as $$
  select
    profiles.id as user_id,
    auth.users.email,
    auth.users.email_confirmed_at,
    profiles.full_name,
    profiles.avatar_url,
    profiles.phone,
    provinces.name as province,
    profiles.community_name,
    profiles.status,
    profiles.role,
    profiles.display_role_label,
    profiles.gender_preference,
    profiles.nickname,
    profiles.use_nickname_in_greetings,
    profiles.credential_name_mode,
    profiles.perseverance_start_year,
    case when public.role_rank(profiles.role) >= public.role_rank('sedimentador'::public.user_role) then profiles.pm_motto else null end
  from public.profiles
  join auth.users on auth.users.id = profiles.id
  left join public.provinces on provinces.id = profiles.province_id
  where profiles.id = auth.uid()
  limit 1;
$$;

grant execute on function public.get_my_profile() to authenticated;

create or replace function public.update_my_profile_details(
  p_nickname text default null,
  p_use_nickname_in_greetings boolean default false,
  p_credential_name_mode text default 'name',
  p_perseverance_start_year integer default null,
  p_pm_motto text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role public.user_role;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  select role
  into actor_role
  from public.profiles
  where id = auth.uid();

  if actor_role is null then
    raise exception 'Perfil no encontrado';
  end if;

  if p_perseverance_start_year is not null and (p_perseverance_start_year < 1961 or p_perseverance_start_year > extract(year from now())::integer) then
    raise exception 'Año de inicio invalido';
  end if;

  update public.profiles
  set
    nickname = nullif(trim(coalesce(p_nickname, '')), ''),
    use_nickname_in_greetings = coalesce(p_use_nickname_in_greetings, false),
    credential_name_mode = case when p_credential_name_mode in ('name', 'nickname', 'both') then p_credential_name_mode else 'name' end,
    perseverance_start_year = p_perseverance_start_year,
    pm_motto = case
      when public.role_rank(actor_role) >= public.role_rank('sedimentador'::public.user_role) then nullif(trim(coalesce(p_pm_motto, '')), '')
      else null
    end
  where id = auth.uid();

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'update_my_profile_details', jsonb_build_object('perseverance_start_year', p_perseverance_start_year));
end;
$$;

grant execute on function public.update_my_profile_details(text, boolean, text, integer, text) to authenticated;

create or replace function public.admin_update_profile_details(
  p_profile_id uuid,
  p_nickname text default null,
  p_use_nickname_in_greetings boolean default false,
  p_credential_name_mode text default 'name',
  p_perseverance_start_year integer default null,
  p_pm_motto text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role public.user_role;
begin
  if not public.current_user_can_edit_profile(p_profile_id) and not public.current_user_is_strict_administrator() then
    raise exception 'No autorizado';
  end if;

  select role
  into target_role
  from public.profiles
  where id = p_profile_id;

  if target_role is null then
    raise exception 'Perfil no encontrado';
  end if;

  if p_perseverance_start_year is not null and (p_perseverance_start_year < 1961 or p_perseverance_start_year > extract(year from now())::integer) then
    raise exception 'Año de inicio invalido';
  end if;

  update public.profiles
  set
    nickname = nullif(trim(coalesce(p_nickname, '')), ''),
    use_nickname_in_greetings = coalesce(p_use_nickname_in_greetings, false),
    credential_name_mode = case when p_credential_name_mode in ('name', 'nickname', 'both') then p_credential_name_mode else 'name' end,
    perseverance_start_year = p_perseverance_start_year,
    pm_motto = case
      when public.role_rank(target_role) >= public.role_rank('sedimentador'::public.user_role) then nullif(trim(coalesce(p_pm_motto, '')), '')
      else null
    end
  where id = p_profile_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_profile_details', jsonb_build_object('profile_id', p_profile_id, 'perseverance_start_year', p_perseverance_start_year));
end;
$$;

grant execute on function public.admin_update_profile_details(uuid, text, boolean, text, integer, text) to authenticated;

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
  pm_motto text,
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
    profiles.nickname,
    profiles.use_nickname_in_greetings,
    profiles.credential_name_mode,
    profiles.perseverance_start_year,
    case when public.role_rank(profiles.role) >= public.role_rank('sedimentador'::public.user_role) then profiles.pm_motto else null end,
    auth.users.email_confirmed_at
  from public.profiles
  left join auth.users on auth.users.id = profiles.id
  left join public.provinces on provinces.id = profiles.province_id
  where public.current_user_can_edit_profile(profiles.id)
     or public.current_user_is_strict_administrator()
  order by provinces.name nulls last, profiles.full_name;
$$;

grant execute on function public.admin_get_users() to authenticated;

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
  gender_preference text,
  nickname text,
  credential_name_mode text,
  perseverance_start_year integer,
  pm_motto text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    profiles.id,
    profiles.full_name,
    profiles.avatar_url,
    profiles.phone,
    provinces.name as province,
    profiles.community_name,
    profiles.role::text,
    profiles.display_role_label,
    profiles.gender_preference,
    profiles.nickname,
    profiles.credential_name_mode,
    profiles.perseverance_start_year,
    case when public.role_rank(profiles.role) >= public.role_rank('sedimentador'::public.user_role) then profiles.pm_motto else null end
  from public.profiles
  left join public.provinces on provinces.id = profiles.province_id
  where profiles.id = p_profile_id
    and (
      profiles.status = 'aprobado'
      or profiles.id = auth.uid()
      or public.current_user_is_strict_administrator()
    )
  limit 1;
$$;

grant execute on function public.get_public_profile(uuid) to authenticated;
