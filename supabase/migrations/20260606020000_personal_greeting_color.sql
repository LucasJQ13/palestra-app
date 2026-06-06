alter table public.profiles
  add column if not exists personal_greeting_color text;

alter table public.profiles
  drop constraint if exists profiles_personal_greeting_color_check;

alter table public.profiles
  add constraint profiles_personal_greeting_color_check
  check (
    personal_greeting_color is null
    or personal_greeting_color ~ '^#[0-9A-Fa-f]{6}$'
  );

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
  personal_greeting_color text
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
    profiles.personal_greeting_color
  from public.profiles
  join auth.users on auth.users.id = profiles.id
  left join public.provinces on provinces.id = profiles.province_id
  left join public.provinces pm_provinces on pm_provinces.id = profiles.personal_pm_province_id
  where profiles.id = auth.uid()
  limit 1;
$$;

grant execute on function public.get_my_profile() to authenticated;

drop function if exists public.update_my_profile_details_v2(text, boolean, text, integer, text, integer, text, text);
drop function if exists public.update_my_profile_details_v2(text, boolean, text, integer, text, integer, text, text, text);

create or replace function public.update_my_profile_details_v2(
  p_nickname text default null,
  p_use_nickname_in_greetings boolean default false,
  p_credential_name_mode text default 'name',
  p_perseverance_start_year integer default null,
  p_personal_pm_type text default null,
  p_personal_pm_number integer default null,
  p_personal_pm_province text default null,
  p_personal_pm_motto text default null,
  p_personal_greeting_color text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role public.user_role;
  selected_pm_province_id uuid;
  normalized_greeting_color text;
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
    raise exception 'Anio de inicio invalido';
  end if;

  if p_personal_greeting_color is not null then
    normalized_greeting_color := upper(trim(p_personal_greeting_color));
    if nullif(normalized_greeting_color, '') is not null and normalized_greeting_color !~ '^#[0-9A-F]{6}$' then
      raise exception 'Color personal invalido';
    end if;
  end if;

  if nullif(trim(coalesce(p_personal_pm_province, '')), '') is not null then
    select id into selected_pm_province_id
    from public.provinces
    where lower(name) = lower(trim(p_personal_pm_province))
    limit 1;

    if selected_pm_province_id is null then
      raise exception 'Provincia de PM invalida';
    end if;
  end if;

  update public.profiles
  set
    nickname = coalesce(nullif(trim(coalesce(p_nickname, '')), ''), profiles.nickname),
    use_nickname_in_greetings = coalesce(p_use_nickname_in_greetings, false),
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
    end,
    personal_greeting_color = case
      when p_personal_greeting_color is null then profiles.personal_greeting_color
      when nullif(normalized_greeting_color, '') is null then null
      else normalized_greeting_color
    end
  where id = auth.uid();

  insert into public.audit_logs (actor_id, action, metadata)
  values (
    auth.uid(),
    'update_my_profile_details_v2',
    jsonb_build_object(
      'perseverance_start_year', p_perseverance_start_year,
      'personal_pm_type', p_personal_pm_type,
      'personal_greeting_color_changed', p_personal_greeting_color is not null
    )
  );
end;
$$;

grant execute on function public.update_my_profile_details_v2(text, boolean, text, integer, text, integer, text, text, text) to authenticated;
