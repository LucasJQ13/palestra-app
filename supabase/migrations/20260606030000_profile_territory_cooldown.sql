alter table public.profiles
  add column if not exists province_community_changed_at timestamptz;

create or replace function public.role_is_province_bound(p_role public.user_role)
returns boolean
language sql
immutable
as $$
  select p_role in ('animador_comunidad', 'coordinador_comunidad', 'vocal', 'asesor', 'coordinador_diocesano')
$$;

create or replace function public.role_is_community_bound(p_role public.user_role)
returns boolean
language sql
immutable
as $$
  select p_role in ('animador_comunidad', 'coordinador_comunidad')
$$;

grant execute on function public.role_is_province_bound(public.user_role) to anon, authenticated;
grant execute on function public.role_is_community_bound(public.user_role) to anon, authenticated;

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
  personal_pm_type text,
  personal_pm_number integer,
  personal_pm_province text,
  personal_pm_motto text,
  pm_motto text,
  personal_greeting_color text,
  province_community_changed_at timestamptz
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
    case when public.role_rank(profiles.role) >= public.role_rank('sedimentador'::public.user_role) then profiles.personal_pm_type else null end,
    case when public.role_rank(profiles.role) >= public.role_rank('sedimentador'::public.user_role) then profiles.personal_pm_number else null end,
    case when public.role_rank(profiles.role) >= public.role_rank('sedimentador'::public.user_role) then pm_provinces.name else null end,
    case when public.role_rank(profiles.role) >= public.role_rank('sedimentador'::public.user_role) then coalesce(profiles.personal_pm_motto, profiles.pm_motto) else null end,
    case when public.role_rank(profiles.role) >= public.role_rank('sedimentador'::public.user_role) then coalesce(profiles.personal_pm_motto, profiles.pm_motto) else null end,
    profiles.personal_greeting_color,
    profiles.province_community_changed_at
  from public.profiles
  join auth.users on auth.users.id = profiles.id
  left join public.provinces on provinces.id = profiles.province_id
  left join public.provinces pm_provinces on pm_provinces.id = profiles.personal_pm_province_id
  where profiles.id = auth.uid()
  limit 1;
$$;

grant execute on function public.get_my_profile() to authenticated;

drop function if exists public.update_my_profile(text, text, text, text);
drop function if exists public.update_my_profile(text, text, text, text, text);

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
  territorial_changed boolean;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  select
    profiles.province_id,
    profiles.community_name,
    profiles.role,
    profiles.subrole_key,
    profiles.province_community_changed_at
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
  territorial_changed := province_changed or community_changed;

  if territorial_changed
    and current_profile.province_id is not null
    and nullif(trim(coalesce(current_profile.community_name, '')), '') is not null
    and current_profile.province_community_changed_at is not null
    and current_profile.province_community_changed_at > now() - interval '15 days'
  then
    raise exception 'Provincia y comunidad solo pueden editarse cada 15 dias. El resto del perfil sigue editable.';
  end if;

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
    province_community_changed_at = case when territorial_changed then now() else profiles.province_community_changed_at end
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
      'territorial_cooldown_days', 15
    )
  );
end;
$$;

grant execute on function public.update_my_profile(text, text, text, text, text) to authenticated;
