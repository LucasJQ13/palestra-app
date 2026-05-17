-- Beta: completar perfil obligatorio, creacion basica de usuarios por administrador
-- y downgrade territorial seguro al cambiar provincia/comunidad.

alter table public.profiles
add column if not exists last_profile_edit_at timestamptz;

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

create or replace function public.update_my_profile(
  p_full_name text,
  p_phone text,
  p_province text,
  p_community_name text
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
      'next_role', next_role
    )
  );
end;
$$;

grant execute on function public.update_my_profile(text, text, text, text) to authenticated;

create or replace function public.admin_create_basic_user(
  p_email text,
  p_password text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  new_user_id uuid := gen_random_uuid();
  normalized_email text := lower(trim(p_email));
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  if normalized_email = '' or normalized_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Mail invalido';
  end if;

  if length(coalesce(p_password, '')) < 6 then
    raise exception 'La contrasena debe tener al menos 6 caracteres';
  end if;

  if exists (select 1 from auth.users where lower(email) = normalized_email) then
    raise exception 'Ya existe un usuario con ese mail';
  end if;

  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    normalized_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('created_by_admin', true),
    now(),
    now()
  );

  insert into public.profiles (id, full_name, role, status, province_id, community_name, approved_at, approved_by)
  values (new_user_id, normalized_email, 'palestrista', 'aprobado', null, null, now(), auth.uid())
  on conflict (id) do update
  set
    status = 'aprobado',
    role = 'palestrista',
    approved_at = coalesce(profiles.approved_at, now()),
    approved_by = coalesce(profiles.approved_by, auth.uid());

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_create_basic_user', jsonb_build_object('user_id', new_user_id, 'email', normalized_email));

  return new_user_id;
end;
$$;

grant execute on function public.admin_create_basic_user(text, text) to authenticated;
