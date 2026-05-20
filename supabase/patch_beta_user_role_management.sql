-- Beta: gestion de usuarios por jerarquia real.
-- Ejecutar en Supabase SQL Editor.

create or replace function public.current_user_can_edit_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles actor
    join public.profiles target on target.id = p_profile_id
    where actor.id = auth.uid()
      and actor.status = 'aprobado'
      and actor.id <> target.id
      and actor.role <> 'invitado'
      and target.role <> 'administrador'
      and (
        actor.role = 'administrador'
        or (
          actor.role in ('asesor', 'vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional')
          and public.role_rank(actor.role) >= public.role_rank(target.role)
          and (
            actor.role in ('vocal_nacional', 'coordinador_nacional')
            or actor.province_id = target.province_id
          )
        )
      )
  )
$$;

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
      and p_target_role <> 'administrador'
      and (
        actor.role = 'administrador'
        or (
          actor.role = 'vocal'
          and actor.province_id = p_target_province_id
          and p_target_role in ('sedimentador', 'animador_comunidad', 'coordinador_comunidad')
        )
        or (
          actor.role = 'coordinador_diocesano'
          and actor.province_id = p_target_province_id
          and p_target_role in ('sedimentador', 'animador_comunidad', 'coordinador_comunidad', 'vocal', 'asesor', 'coordinador_diocesano')
        )
        or (
          actor.role = 'vocal_nacional'
          and p_target_role in ('sedimentador', 'animador_comunidad', 'coordinador_comunidad', 'vocal', 'asesor', 'coordinador_diocesano')
        )
        or (
          actor.role = 'coordinador_nacional'
          and p_target_role in ('sedimentador', 'animador_comunidad', 'coordinador_comunidad', 'vocal', 'asesor', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional')
        )
      )
  )
$$;

grant execute on function public.current_user_can_edit_profile(uuid) to authenticated;
grant execute on function public.current_user_can_assign_role(public.user_role, uuid) to authenticated;

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
set search_path = public, auth
as $$
  with actor as (
    select profiles.*
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'aprobado'
      and profiles.role in ('asesor', 'vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador')
  )
  select
    users.id,
    users.email::text,
    profiles.full_name,
    profiles.avatar_url,
    profiles.phone,
    provinces.name as province,
    profiles.community_name,
    profiles.status::text,
    profiles.role::text,
    users.email_confirmed_at
  from auth.users users
  join public.profiles profiles on profiles.id = users.id
  left join public.provinces on provinces.id = profiles.province_id
  cross join actor
  where profiles.role <> 'administrador'
    and (
      actor.role in ('vocal_nacional', 'coordinador_nacional', 'administrador')
      or actor.province_id = profiles.province_id
    )
  order by provinces.name nulls last, profiles.full_name nulls last, users.email
  limit 500;
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
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  selected_province_id uuid;
  actor public.profiles%rowtype;
  target public.profiles%rowtype;
  requested_role public.user_role;
  requested_status public.user_status;
  normalized_email text := lower(trim(coalesce(p_email, '')));
  previous_replaced_id uuid;
begin
  select * into actor from public.profiles where id = auth.uid();

  if actor.id is null or actor.status <> 'aprobado' then
    raise exception 'No autorizado';
  end if;

  if actor.id = p_profile_id then
    raise exception 'No podes autoasignarte rangos desde esta herramienta';
  end if;

  if not exists (select 1 from auth.users where id = p_profile_id) then
    raise exception 'Usuario de autenticacion no encontrado';
  end if;

  insert into public.profiles (id, full_name, role, status, approved_at)
  values (p_profile_id, nullif(trim(p_full_name), ''), 'palestrista', 'aprobado', now())
  on conflict (id) do nothing;

  select * into target from public.profiles where id = p_profile_id;

  if target.role = 'administrador' or p_role = 'administrador' then
    raise exception 'El rol Administrador no puede modificarse ni asignarse desde la aplicacion';
  end if;

  if not public.current_user_can_edit_profile(p_profile_id) then
    raise exception 'No podes editar usuarios de rango superior o fuera de tu alcance';
  end if;

  requested_role := p_role::public.user_role;
  requested_status := p_status::public.user_status;

  select id into selected_province_id
  from public.provinces
  where name = p_province
  limit 1;

  if not public.current_user_can_assign_role(requested_role, selected_province_id) then
    raise exception 'No podes asignar ese rango o esta fuera de tu alcance';
  end if;

  if requested_role in ('coordinador_diocesano', 'coordinador_nacional') and actor.role <> 'administrador' then
    perform public.request_coordinator_acceptance(p_profile_id, requested_role, 'Propuesta generada desde panel de usuarios.');
    insert into public.audit_logs (actor_id, action, metadata)
    values (auth.uid(), 'admin_update_user_coordinator_requires_acceptance', jsonb_build_object('profile_id', p_profile_id, 'target_role', requested_role, 'province_id', selected_province_id));
    return;
  end if;

  if actor.role = 'administrador' then
    if normalized_email = '' or normalized_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
      raise exception 'Mail invalido';
    end if;

    if exists (
      select 1
      from auth.users
      where lower(email) = normalized_email
        and id <> p_profile_id
    ) then
      raise exception 'Ya existe otro usuario con ese mail';
    end if;
  end if;

  if requested_role = 'coordinador_nacional' and actor.role = 'administrador' and requested_status = 'aprobado' then
    select id into previous_replaced_id
    from public.profiles
    where id <> p_profile_id
      and role = 'coordinador_nacional'
      and status = 'aprobado'
    limit 1;

    if previous_replaced_id is not null then
      update public.profiles set role = 'sedimentador' where id = previous_replaced_id;
    end if;
  elsif requested_role = 'coordinador_diocesano' and actor.role = 'administrador' and requested_status = 'aprobado' then
    select id into previous_replaced_id
    from public.profiles
    where id <> p_profile_id
      and role = 'coordinador_diocesano'
      and status = 'aprobado'
      and province_id = selected_province_id
    limit 1;

    if previous_replaced_id is not null then
      update public.profiles set role = 'sedimentador' where id = previous_replaced_id;
    end if;
  else
    perform public.ensure_unique_role_assignment(p_profile_id, requested_role, requested_status, selected_province_id);
  end if;

  if actor.role = 'administrador' then
    update auth.users
    set
      email = normalized_email,
      encrypted_password = case
        when nullif(p_password, '') is null then encrypted_password
        else crypt(p_password, gen_salt('bf'))
      end,
      updated_at = now()
    where id = p_profile_id;

    insert into auth.identities (
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      p_profile_id::text,
      p_profile_id,
      jsonb_build_object('sub', p_profile_id::text, 'email', normalized_email, 'email_verified', true),
      'email',
      now(),
      now(),
      now()
    )
    on conflict (provider, provider_id) do update
    set identity_data = jsonb_build_object('sub', p_profile_id::text, 'email', normalized_email, 'email_verified', true),
        updated_at = now();
  end if;

  update public.profiles
  set
    full_name = nullif(trim(p_full_name), ''),
    phone = nullif(trim(p_phone), ''),
    province_id = selected_province_id,
    community_name = nullif(trim(p_community_name), ''),
    status = requested_status,
    role = requested_role,
    approved_at = case when requested_status = 'aprobado' then coalesce(approved_at, now()) else approved_at end,
    approved_by = case when requested_status = 'aprobado' then coalesce(approved_by, auth.uid()) else approved_by end
  where id = p_profile_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_user', jsonb_build_object(
    'profile_id', p_profile_id,
    'status', p_status,
    'role', p_role,
    'previous_replaced_id', previous_replaced_id
  ));
end;
$$;

grant execute on function public.admin_update_user(uuid, text, text, text, text, text, text, text, text) to authenticated;
