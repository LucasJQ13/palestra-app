-- EMERGENCIA: recupera perfil completo/narrativa y corrige QR "user_id is ambiguous".
-- Ejecutar completo en Supabase SQL Editor.

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists subrole_key text,
  add column if not exists display_role_label text,
  add column if not exists gender_preference text,
  add column if not exists nickname text,
  add column if not exists use_nickname_in_greetings boolean not null default false,
  add column if not exists credential_name_mode text not null default 'name',
  add column if not exists perseverance_start_year integer,
  add column if not exists pm_motto text,
  add column if not exists personal_pm_type text,
  add column if not exists personal_pm_number integer,
  add column if not exists personal_pm_province_id uuid references public.provinces(id) on delete set null,
  add column if not exists personal_pm_motto text;

alter table public.profiles
  drop constraint if exists profiles_gender_preference_check,
  add constraint profiles_gender_preference_check
  check (gender_preference is null or gender_preference in ('male', 'female'));

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
  subrole_key text,
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
    profiles.subrole_key,
    profiles.display_role_label,
    profiles.gender_preference,
    profiles.nickname,
    coalesce(profiles.use_nickname_in_greetings, false),
    profiles.credential_name_mode,
    profiles.perseverance_start_year,
    case when public.role_rank(profiles.role) >= public.role_rank('sedimentador'::public.user_role) then profiles.personal_pm_type else null end,
    case when public.role_rank(profiles.role) >= public.role_rank('sedimentador'::public.user_role) then profiles.personal_pm_number else null end,
    case when public.role_rank(profiles.role) >= public.role_rank('sedimentador'::public.user_role) then pm_provinces.name else null end,
    case when public.role_rank(profiles.role) >= public.role_rank('sedimentador'::public.user_role) then coalesce(profiles.personal_pm_motto, profiles.pm_motto) else null end,
    case when public.role_rank(profiles.role) >= public.role_rank('sedimentador'::public.user_role) then coalesce(profiles.personal_pm_motto, profiles.pm_motto) else null end
  from public.profiles
  join auth.users on auth.users.id = profiles.id
  left join public.provinces on provinces.id = profiles.province_id
  left join public.provinces pm_provinces on pm_provinces.id = profiles.personal_pm_province_id
  where profiles.id = auth.uid()
  limit 1;
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

  select id into selected_province_id
  from public.provinces
  where lower(name) = lower(trim(p_province))
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
    full_name = coalesce(nullif(trim(coalesce(p_full_name, '')), ''), profiles.full_name),
    phone = coalesce(nullif(trim(coalesce(p_phone, '')), ''), profiles.phone),
    province_id = selected_province_id,
    community_name = coalesce(nullif(trim(coalesce(p_community_name, '')), ''), profiles.community_name),
    gender_preference = case when p_gender_preference in ('male', 'female') then p_gender_preference else profiles.gender_preference end,
    role = next_role,
    subrole_key = case when next_role = current_profile.role then profiles.subrole_key else null end,
    last_profile_edit_at = now()
  where id = auth.uid();
end;
$$;

grant execute on function public.update_my_profile(text, text, text, text, text) to authenticated;

create or replace function public.update_my_profile_details_v2(
  p_nickname text default null,
  p_use_nickname_in_greetings boolean default false,
  p_credential_name_mode text default 'name',
  p_perseverance_start_year integer default null,
  p_personal_pm_type text default null,
  p_personal_pm_number integer default null,
  p_personal_pm_province text default null,
  p_personal_pm_motto text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role public.user_role;
  selected_pm_province_id uuid;
begin
  select role into actor_role from public.profiles where id = auth.uid();
  if actor_role is null then
    raise exception 'Perfil no encontrado';
  end if;

  if p_perseverance_start_year is not null and (p_perseverance_start_year < 1961 or p_perseverance_start_year > extract(year from now())::integer) then
    raise exception 'Año de inicio invalido';
  end if;

  if nullif(trim(coalesce(p_personal_pm_province, '')), '') is not null then
    select id into selected_pm_province_id
    from public.provinces
    where lower(name) = lower(trim(p_personal_pm_province))
    limit 1;
  end if;

  update public.profiles
  set
    nickname = coalesce(nullif(trim(coalesce(p_nickname, '')), ''), profiles.nickname),
    use_nickname_in_greetings = coalesce(p_use_nickname_in_greetings, profiles.use_nickname_in_greetings, false),
    credential_name_mode = case when p_credential_name_mode in ('name', 'nickname', 'both') then p_credential_name_mode else profiles.credential_name_mode end,
    perseverance_start_year = coalesce(p_perseverance_start_year, profiles.perseverance_start_year),
    personal_pm_type = case
      when public.role_rank(actor_role) >= public.role_rank('sedimentador'::public.user_role) and p_personal_pm_type in ('pmm', 'pmf') then p_personal_pm_type
      else profiles.personal_pm_type
    end,
    personal_pm_number = case
      when public.role_rank(actor_role) >= public.role_rank('sedimentador'::public.user_role) then coalesce(p_personal_pm_number, profiles.personal_pm_number)
      else profiles.personal_pm_number
    end,
    personal_pm_province_id = case
      when public.role_rank(actor_role) >= public.role_rank('sedimentador'::public.user_role) then coalesce(selected_pm_province_id, profiles.personal_pm_province_id)
      else profiles.personal_pm_province_id
    end,
    personal_pm_motto = case
      when public.role_rank(actor_role) >= public.role_rank('sedimentador'::public.user_role) then coalesce(nullif(trim(coalesce(p_personal_pm_motto, '')), ''), profiles.personal_pm_motto)
      else profiles.personal_pm_motto
    end,
    pm_motto = case
      when public.role_rank(actor_role) >= public.role_rank('sedimentador'::public.user_role) then coalesce(nullif(trim(coalesce(p_personal_pm_motto, '')), ''), profiles.pm_motto)
      else profiles.pm_motto
    end
  where id = auth.uid();
end;
$$;

grant execute on function public.update_my_profile_details_v2(text, boolean, text, integer, text, integer, text, text) to authenticated;

create table if not exists public.profile_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  version integer not null default 1,
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.issue_profile_credential()
returns table (
  credential_id uuid,
  token text,
  user_id uuid,
  issued_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  version integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.profiles%rowtype;
  current_credential public.profile_credentials%rowtype;
begin
  select * into current_profile from public.profiles where id = auth.uid();
  if current_profile.id is null then
    raise exception 'No existe perfil para esta sesion.';
  end if;

  update public.profile_credentials
  set revoked_at = now()
  where profile_credentials.user_id = current_profile.id
    and revoked_at is null;

  insert into public.profile_credentials (user_id, expires_at, version)
  values (
    current_profile.id,
    now() + interval '365 days',
    coalesce((select max(pc2.version) + 1 from public.profile_credentials pc2 where pc2.user_id = current_profile.id), 1)
  )
  returning * into current_credential;

  credential_id := current_credential.id;
  token := current_credential.token;
  issue_profile_credential.user_id := current_credential.user_id;
  issued_at := current_credential.issued_at;
  expires_at := current_credential.expires_at;
  revoked_at := current_credential.revoked_at;
  version := current_credential.version;
  return next;
end;
$$;

grant execute on function public.issue_profile_credential() to authenticated;
