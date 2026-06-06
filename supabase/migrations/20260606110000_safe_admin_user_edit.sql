-- Issue 42: admin user edit must load complete data and avoid accidental overwrites.

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
  );
$$;

grant execute on function public.current_user_is_strict_administrator() to authenticated;

create or replace function public.current_user_can_assign_role(
  p_target_role public.user_role,
  p_target_province_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.status = 'aprobado'
      and (
        actor.role = 'administrador'
        or (
          p_target_role <> 'administrador'
          and (
            (
              actor.role = 'vocal'
              and actor.province_id = p_target_province_id
              and p_target_role in ('palestrista', 'sedimentador', 'animador_comunidad', 'coordinador_comunidad')
            )
            or (
              actor.role = 'coordinador_diocesano'
              and actor.province_id = p_target_province_id
              and p_target_role in ('palestrista', 'sedimentador', 'animador_comunidad', 'coordinador_comunidad', 'vocal', 'asesor', 'coordinador_diocesano')
            )
            or (
              actor.role = 'vocal_nacional'
              and p_target_role in ('palestrista', 'sedimentador', 'animador_comunidad', 'coordinador_comunidad', 'vocal', 'asesor', 'coordinador_diocesano')
            )
            or (
              actor.role = 'coordinador_nacional'
              and p_target_role in ('palestrista', 'sedimentador', 'animador_comunidad', 'coordinador_comunidad', 'vocal', 'asesor', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional')
            )
          )
        )
      )
  );
$$;

grant execute on function public.current_user_can_assign_role(public.user_role, uuid) to authenticated;

create or replace function public.current_user_can_manage_user(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with actor as (
    select id, role, status, province_id
    from public.profiles
    where id = auth.uid()
  ),
  target as (
    select id, role, province_id
    from public.profiles
    where id = p_profile_id
  )
  select exists (
    select 1
    from actor, target
    where actor.status = 'aprobado'
      and target.role <> 'administrador'
      and actor.role not in ('animador_comunidad', 'coordinador_comunidad')
      and (
        actor.role = 'administrador'
        or (
          actor.role in ('vocal', 'coordinador_diocesano')
          and actor.province_id = target.province_id
          and target.role in ('palestrista', 'sedimentador', 'animador_comunidad', 'coordinador_comunidad')
        )
        or (
          actor.role in ('vocal_nacional', 'coordinador_nacional')
          and target.role not in ('administrador', 'coordinador_nacional')
        )
      )
  );
$$;

grant execute on function public.current_user_can_manage_user(uuid) to authenticated;

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
  pm_motto text,
  personal_greeting_color text,
  email_confirmed_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    u.email,
    p.full_name,
    p.avatar_url,
    p.phone,
    province.name as province,
    p.community_name,
    p.status::text,
    p.role::text,
    p.subrole_key,
    p.display_role_label,
    p.gender_preference,
    p.nickname,
    coalesce(p.use_nickname_in_greetings, false),
    coalesce(p.credential_name_mode, 'name'),
    p.perseverance_start_year,
    p.personal_pm_type,
    p.personal_pm_number,
    pm_province.name as personal_pm_province,
    p.personal_pm_motto,
    p.pm_motto,
    p.personal_greeting_color,
    u.email_confirmed_at
  from public.profiles p
  left join auth.users u on u.id = p.id
  left join public.provinces province on province.id = p.province_id
  left join public.provinces pm_province on pm_province.id = p.personal_pm_province_id
  where public.current_user_can_manage_user(p.id)
     or public.current_user_is_strict_administrator()
  order by province.name nulls last, p.full_name nulls last, u.email nulls last;
$$;

grant execute on function public.admin_get_users() to authenticated;

create or replace function public.admin_update_user(
  p_profile_id uuid,
  p_email text,
  p_password text,
  p_full_name text,
  p_phone text,
  p_province text,
  p_community_name text,
  p_status text,
  p_role text,
  p_display_role_label text default null
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  target_profile public.profiles%rowtype;
  selected_province_id uuid;
  requested_role public.user_role;
  requested_status public.user_status;
begin
  select *
  into target_profile
  from public.profiles
  where id = p_profile_id;

  if target_profile.id is null then
    raise exception 'Perfil no encontrado';
  end if;

  if not public.current_user_can_manage_user(p_profile_id) and not public.current_user_is_strict_administrator() then
    raise exception 'No podes editar usuarios de rango superior o fuera de tu alcance';
  end if;

  requested_role := coalesce(nullif(trim(coalesce(p_role, '')), '')::public.user_role, target_profile.role);
  requested_status := coalesce(nullif(trim(coalesce(p_status, '')), '')::public.user_status, target_profile.status);
  selected_province_id := target_profile.province_id;

  if nullif(trim(coalesce(p_province, '')), '') is not null then
    select id
    into selected_province_id
    from public.provinces
    where lower(name) = lower(trim(p_province))
    limit 1;

    if selected_province_id is null then
      raise exception 'Provincia no encontrada';
    end if;
  end if;

  if requested_role = 'administrador' and not public.current_user_is_strict_administrator() then
    raise exception 'Solo Administrador puede otorgar Administrador';
  end if;

  if not public.current_user_is_strict_administrator()
     and not public.current_user_can_assign_role(requested_role, selected_province_id) then
    raise exception 'No podes asignar un rango superior al tuyo o fuera de tu alcance';
  end if;

  if public.current_user_is_strict_administrator() then
    update auth.users
    set
      email = coalesce(nullif(trim(coalesce(p_email, '')), ''), auth.users.email),
      encrypted_password = case
        when nullif(p_password, '') is null then auth.users.encrypted_password
        else extensions.crypt(p_password, extensions.gen_salt('bf'))
      end,
      updated_at = now()
    where id = p_profile_id;
  end if;

  update public.profiles
  set
    full_name = coalesce(nullif(trim(coalesce(p_full_name, '')), ''), profiles.full_name),
    phone = coalesce(nullif(trim(coalesce(p_phone, '')), ''), profiles.phone),
    province_id = selected_province_id,
    community_name = coalesce(nullif(trim(coalesce(p_community_name, '')), ''), profiles.community_name),
    status = requested_status,
    role = requested_role,
    subrole_key = case when requested_role = profiles.role then profiles.subrole_key else null end,
    display_role_label = coalesce(nullif(trim(coalesce(p_display_role_label, '')), ''), profiles.display_role_label),
    approved_at = case when requested_status = 'aprobado' then coalesce(profiles.approved_at, now()) else profiles.approved_at end,
    approved_by = case when requested_status = 'aprobado' then coalesce(profiles.approved_by, auth.uid()) else profiles.approved_by end
  where id = p_profile_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_user_safe', jsonb_build_object(
    'profile_id', p_profile_id,
    'status', requested_status,
    'role', requested_role,
    'province_changed', target_profile.province_id is distinct from selected_province_id
  ));
end;
$$;

grant execute on function public.admin_update_user(uuid, text, text, text, text, text, text, text, text, text) to authenticated;

create or replace function public.admin_update_profile_details_v2(
  p_profile_id uuid,
  p_nickname text default null,
  p_use_nickname_in_greetings boolean default null,
  p_credential_name_mode text default null,
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
  target_profile public.profiles%rowtype;
  selected_pm_province_id uuid;
  next_pm_type text;
begin
  select *
  into target_profile
  from public.profiles
  where id = p_profile_id;

  if target_profile.id is null then
    raise exception 'Perfil no encontrado';
  end if;

  if not public.current_user_can_manage_user(p_profile_id) and not public.current_user_is_strict_administrator() then
    raise exception 'No autorizado';
  end if;

  if p_perseverance_start_year is not null
     and (p_perseverance_start_year < 1961 or p_perseverance_start_year > extract(year from now())::integer) then
    raise exception 'Anio de inicio invalido';
  end if;

  selected_pm_province_id := target_profile.personal_pm_province_id;

  if nullif(trim(coalesce(p_personal_pm_province, '')), '') is not null then
    select id
    into selected_pm_province_id
    from public.provinces
    where lower(name) = lower(trim(p_personal_pm_province))
    limit 1;

    if selected_pm_province_id is null then
      raise exception 'Provincia de PM invalida';
    end if;
  end if;

  next_pm_type := case
    when p_personal_pm_type in ('pmm', 'pmf') then p_personal_pm_type
    else target_profile.personal_pm_type
  end;

  update public.profiles
  set
    nickname = coalesce(nullif(trim(coalesce(p_nickname, '')), ''), profiles.nickname),
    use_nickname_in_greetings = coalesce(p_use_nickname_in_greetings, profiles.use_nickname_in_greetings, false),
    credential_name_mode = case
      when p_credential_name_mode in ('name', 'nickname', 'both') then p_credential_name_mode
      else coalesce(profiles.credential_name_mode, 'name')
    end,
    perseverance_start_year = coalesce(p_perseverance_start_year, profiles.perseverance_start_year),
    personal_pm_type = next_pm_type,
    personal_pm_number = coalesce(p_personal_pm_number, profiles.personal_pm_number),
    personal_pm_province_id = selected_pm_province_id,
    personal_pm_motto = coalesce(nullif(trim(coalesce(p_personal_pm_motto, '')), ''), profiles.personal_pm_motto),
    pm_motto = coalesce(nullif(trim(coalesce(p_personal_pm_motto, '')), ''), profiles.pm_motto)
  where id = p_profile_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_profile_details_v2_safe', jsonb_build_object(
    'profile_id', p_profile_id,
    'perseverance_start_year_changed', p_perseverance_start_year is not null,
    'personal_pm_changed', p_personal_pm_type is not null or p_personal_pm_number is not null or p_personal_pm_province is not null or p_personal_pm_motto is not null
  ));
end;
$$;

grant execute on function public.admin_update_profile_details_v2(uuid, text, boolean, text, integer, text, integer, text, text) to authenticated;

drop function if exists public.admin_get_pending_profiles();
create or replace function public.admin_get_pending_profiles()
returns table (
  id uuid,
  email text,
  email_confirmed_at timestamptz,
  full_name text,
  status text,
  role text,
  community_name text
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    u.email,
    u.email_confirmed_at,
    p.full_name,
    p.status::text,
    p.role::text,
    p.community_name
  from public.profiles p
  left join auth.users u on u.id = p.id
  where p.status = 'pendiente'
    and exists (
      select 1
      from public.profiles actor
      where actor.id = auth.uid()
        and actor.status = 'aprobado'
        and actor.role in ('vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador')
        and (
          actor.role in ('vocal_nacional', 'coordinador_nacional', 'administrador')
          or actor.province_id = p.province_id
        )
    )
  order by p.created_at desc
  limit 50;
$$;

grant execute on function public.admin_get_pending_profiles() to authenticated;

create or replace function public.admin_approve_profile(
  p_profile_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile public.profiles%rowtype;
  requested_role public.user_role;
begin
  select *
  into target_profile
  from public.profiles
  where id = p_profile_id;

  if target_profile.id is null then
    raise exception 'Perfil no encontrado';
  end if;

  if not public.current_user_is_strict_administrator()
     and not exists (
       select 1
       from public.profiles actor
       where actor.id = auth.uid()
         and actor.status = 'aprobado'
         and actor.role in ('vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador')
         and (
           actor.role in ('vocal_nacional', 'coordinador_nacional', 'administrador')
           or actor.province_id = target_profile.province_id
         )
     ) then
    raise exception 'No autorizado';
  end if;

  requested_role := coalesce(nullif(trim(coalesce(p_role, '')), '')::public.user_role, 'palestrista'::public.user_role);

  if requested_role = 'administrador' and not public.current_user_is_strict_administrator() then
    raise exception 'Solo Administrador puede otorgar Administrador';
  end if;

  if not public.current_user_is_strict_administrator()
     and not public.current_user_can_assign_role(requested_role, target_profile.province_id) then
    raise exception 'No podes asignar ese rango';
  end if;

  update public.profiles
  set
    status = 'aprobado',
    role = requested_role,
    approved_at = now(),
    approved_by = auth.uid()
  where id = p_profile_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_approve_profile_safe', jsonb_build_object('profile_id', p_profile_id, 'role', requested_role));
end;
$$;

grant execute on function public.admin_approve_profile(uuid, text) to authenticated;
