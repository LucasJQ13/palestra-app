-- Diagnostico y eliminacion definitiva de usuarios/Auth/Profile.
-- Ejecutar en Supabase SQL Editor. Reemplaza la version anterior de diagnostico/eliminacion.

alter table public.user_deletion_backups
  add column if not exists raw_identity_json jsonb,
  add column if not exists cleanup_result_json jsonb not null default '{}'::jsonb;

create or replace function public.current_user_is_administrator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'aprobado'
      and role = 'administrador'
  );
$$;

grant execute on function public.current_user_is_administrator() to authenticated;

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
  select
    au.id,
    au.email::text,
    p.full_name,
    p.avatar_url,
    p.phone,
    pr.name as province,
    p.community_name,
    coalesce(p.status::text, 'sin_profile') as status,
    coalesce(p.role::text, 'sin_profile') as role,
    au.email_confirmed_at
  from auth.users au
  left join public.profiles p on p.id = au.id
  left join public.provinces pr on pr.id = p.province_id
  where public.current_user_is_administrator()
  order by au.created_at desc
  limit 1000;
$$;

grant execute on function public.admin_get_users() to authenticated;

drop function if exists public.admin_diagnose_user_login(text);
create or replace function public.admin_diagnose_user_login(p_email text)
returns table (
  searched_email text,
  auth_exists boolean,
  auth_user_id uuid,
  auth_email text,
  auth_created_at timestamptz,
  email_confirmed_at timestamptz,
  identity_exists boolean,
  identities_provider text,
  identities_user_id uuid,
  profile_exists boolean,
  profile_id uuid,
  profile_user_id uuid,
  profile_email text,
  profile_status text,
  profile_role text,
  profile_deleted_at timestamptz,
  province text,
  community text,
  user_requests_exists boolean,
  pending_profiles_exists boolean,
  device_push_tokens_exists boolean,
  internal_messages_exists boolean,
  backups_exists boolean,
  backup_count integer,
  has_duplicates boolean,
  auth_count integer,
  identities_count integer,
  profile_count integer,
  matches_by_email_count integer,
  matches_by_user_id_count integer,
  inconsistencies text[],
  possible_cause text,
  recommended_action text,
  affected_tables text[],
  active_user_exists boolean
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized_email text := lower(trim(coalesce(p_email, '')));
  candidate_ids uuid[] := array[]::uuid[];
  first_auth auth.users%rowtype;
  first_identity record;
  first_profile public.profiles%rowtype;
  issues text[] := array[]::text[];
  tables text[] := array[]::text[];
  has_profile_deleted_at boolean := false;
begin
  if not public.current_user_is_administrator() then
    raise exception 'Solo Administrador puede diagnosticar usuarios';
  end if;

  searched_email := normalized_email;

  if normalized_email = '' then
    issues := array_append(issues, 'Email vacio');
  end if;

  select count(*)::integer
  into auth_count
  from auth.users
  where lower(email) = normalized_email;

  select count(*)::integer
  into identities_count
  from auth.identities
  where lower(coalesce(identity_data->>'email', provider_id, '')) = normalized_email;

  select array_agg(distinct user_id)
  into candidate_ids
  from (
    select id as user_id
    from auth.users
    where lower(email) = normalized_email
    union
    select user_id
    from auth.identities
    where lower(coalesce(identity_data->>'email', provider_id, '')) = normalized_email
  ) matches;

  candidate_ids := coalesce(candidate_ids, array[]::uuid[]);

  select *
  into first_auth
  from auth.users
  where lower(email) = normalized_email
     or id = any(candidate_ids)
  order by created_at desc
  limit 1;

  select provider, user_id
  into first_identity
  from auth.identities
  where lower(coalesce(identity_data->>'email', provider_id, '')) = normalized_email
     or user_id = any(candidate_ids)
  order by created_at desc
  limit 1;

  select count(*)::integer
  into profile_count
  from public.profiles
  where id = any(candidate_ids);

  select *
  into first_profile
  from public.profiles
  where id = any(candidate_ids)
  order by created_at desc
  limit 1;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'deleted_at'
  ) into has_profile_deleted_at;

  select count(*)::integer
  into backup_count
  from public.user_deletion_backups
  where lower(coalesce(email, '')) = normalized_email
     or user_id = any(candidate_ids);

  auth_exists := auth_count > 0;
  auth_user_id := first_auth.id;
  auth_email := first_auth.email::text;
  auth_created_at := first_auth.created_at;
  email_confirmed_at := first_auth.email_confirmed_at;
  identity_exists := identities_count > 0;
  identities_provider := first_identity.provider;
  identities_user_id := first_identity.user_id;
  profile_exists := profile_count > 0;
  profile_id := first_profile.id;
  profile_user_id := first_profile.id;
  profile_email := first_auth.email::text;
  profile_status := first_profile.status::text;
  profile_role := first_profile.role::text;
  profile_deleted_at := null;
  province := null;
  community := first_profile.community_name;
  backups_exists := backup_count > 0;
  has_duplicates := auth_count > 1 or identities_count > 1 or profile_count > 1;
  matches_by_email_count := auth_count + identities_count + backup_count;
  matches_by_user_id_count := coalesce(array_length(candidate_ids, 1), 0) + profile_count;
  active_user_exists := auth_exists or identity_exists or profile_exists;

  if first_profile.province_id is not null then
    select name into province from public.provinces where id = first_profile.province_id;
  end if;

  if has_profile_deleted_at and first_profile.id is not null then
    execute 'select deleted_at from public.profiles where id = $1'
    using first_profile.id
    into profile_deleted_at;
  end if;

  user_requests_exists := exists (
    select 1 from public.user_requests
    where user_id = any(candidate_ids)
       or resolved_by = any(candidate_ids)
  );
  pending_profiles_exists := false;
  device_push_tokens_exists := exists (
    select 1 from public.device_push_tokens where user_id = any(candidate_ids)
  );
  internal_messages_exists := exists (
    select 1 from public.internal_messages
    where created_by = any(candidate_ids)
  ) or exists (
    select 1 from public.community_contact_messages
    where sender_id = any(candidate_ids)
  );

  if auth_exists then tables := array_append(tables, 'auth.users'); end if;
  if identity_exists then tables := array_append(tables, 'auth.identities'); end if;
  if profile_exists then tables := array_append(tables, 'public.profiles'); end if;
  if user_requests_exists then tables := array_append(tables, 'public.user_requests'); end if;
  if device_push_tokens_exists then tables := array_append(tables, 'public.device_push_tokens'); end if;
  if internal_messages_exists then tables := array_append(tables, 'mensajes'); end if;
  if backups_exists then tables := array_append(tables, 'public.user_deletion_backups'); end if;
  affected_tables := coalesce(tables, array[]::text[]);

  if normalized_email = '' then
    issues := array_append(issues, 'Email vacio');
  end if;
  if not auth_exists and not identity_exists and not profile_exists and backups_exists then
    issues := array_append(issues, 'Solo existe backup, no usuario activo');
  end if;
  if not auth_exists and not identity_exists and not profile_exists and not backups_exists then
    issues := array_append(issues, 'No hay rastro del usuario');
  end if;
  if auth_exists and not profile_exists then
    issues := array_append(issues, 'Existe en Auth pero no en profiles; por eso no tiene perfil funcional');
  end if;
  if identity_exists and not auth_exists then
    issues := array_append(issues, 'Existe en identities pero no en auth.users');
  end if;
  if profile_exists and not auth_exists and not identity_exists then
    issues := array_append(issues, 'Existe profile huerfano sin Auth');
  end if;
  if auth_exists and first_auth.email_confirmed_at is null then
    issues := array_append(issues, 'Email sin confirmar');
  end if;
  if profile_exists and first_profile.status <> 'aprobado'::public.user_status then
    issues := array_append(issues, 'No aparece/funciona correctamente porque el profile no esta aprobado');
  end if;
  if profile_deleted_at is not null then
    issues := array_append(issues, 'Existe como soft deleted');
  end if;
  if has_duplicates then
    issues := array_append(issues, 'Hay duplicados por email o user_id');
  end if;

  inconsistencies := issues;
  possible_cause := case
    when 'Solo existe backup, no usuario activo' = any(issues) then 'El usuario activo fue eliminado; el diagnostico solo encontro historial de backup.'
    when 'No hay rastro del usuario' = any(issues) then 'El correo esta libre en las tablas revisadas.'
    when 'Existe en Auth pero no en profiles; por eso no tiene perfil funcional' = any(issues) then 'El listado/perfil puede fallar porque Auth tiene el correo pero la app no tiene datos de profile.'
    when 'Existe en identities pero no en auth.users' = any(issues) then 'Auth quedo inconsistente: identities conserva el email aunque auth.users no tenga fila equivalente.'
    when 'Existe profile huerfano sin Auth' = any(issues) then 'El profile quedo sin usuario real de Auth.'
    when 'Email sin confirmar' = any(issues) then 'El login puede fallar por confirmacion de email.'
    when 'No aparece/funciona correctamente porque el profile no esta aprobado' = any(issues) then 'El usuario existe pero el estado/rol impide experiencia normal.'
    else 'No se detecta conflicto activo evidente.'
  end;
  recommended_action := case
    when not active_user_exists and backups_exists then 'No eliminar mas: el correo deberia estar libre; crear cuenta nueva.'
    when not active_user_exists then 'Crear cuenta nueva desde cero.'
    when has_duplicates or identity_exists or auth_exists or profile_exists then 'Usar Eliminar y liberar mail; luego diagnosticar nuevamente. Debe quedar solo backup o sin rastro activo.'
    else 'Revisar manualmente si Supabase Auth sigue rechazando el correo.'
  end;

  return next;
end;
$$;

grant execute on function public.admin_diagnose_user_login(text) to authenticated;

create or replace function public.admin_delete_user_by_email(
  p_email text,
  p_reason text default 'Liberacion completa de correo desde panel administrador'
)
returns table (
  deleted_user_id uuid,
  deleted_email text,
  backup_id uuid,
  result_message text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized_email text := lower(trim(coalesce(p_email, '')));
  target_id uuid;
  ids uuid[];
  auth_record jsonb;
  identity_record jsonb;
  profile_record jsonb;
  related jsonb;
  cleanup jsonb;
  backup_row_id uuid;
  target_email text;
  target_full_name text;
  target_role text;
  target_status text;
  target_province text;
  target_community text;
  ref record;
  affected_count integer;
begin
  if not public.current_user_is_administrator() then
    raise exception 'Solo Administrador puede eliminar usuarios y liberar correos';
  end if;

  if normalized_email = '' then
    raise exception 'Email requerido';
  end if;

  select array_agg(distinct user_id)
  into ids
  from (
    select id as user_id
    from auth.users
    where lower(email) = normalized_email
    union
    select user_id
    from auth.identities
    where lower(coalesce(identity_data->>'email', provider_id, '')) = normalized_email
  ) matches;

  ids := coalesce(ids, array[]::uuid[]);

  if array_length(ids, 1) is null then
    deleted_user_id := null;
    deleted_email := normalized_email;
    backup_id := null;
    result_message := case
      when exists (select 1 from public.user_deletion_backups where lower(coalesce(email, '')) = normalized_email)
      then 'No existe usuario activo. Solo queda backup; el correo deberia estar libre.'
      else 'No existe usuario activo con ese email. El correo deberia estar libre.'
    end;
    return next;
    return;
  end if;

  if exists (select 1 from public.profiles where id = any(ids) and role = 'administrador') then
    raise exception 'No se permite eliminar usuarios Administrador';
  end if;

  foreach target_id in array ids loop
    select to_jsonb(au), au.email
    into auth_record, target_email
    from auth.users au
    where au.id = target_id;

    select coalesce(jsonb_agg(to_jsonb(i)), '[]'::jsonb)
    into identity_record
    from auth.identities i
    where i.user_id = target_id;

    select to_jsonb(p), p.full_name, p.role::text, p.status::text, pr.name, p.community_name
    into profile_record, target_full_name, target_role, target_status, target_province, target_community
    from public.profiles p
    left join public.provinces pr on pr.id = p.province_id
    where p.id = target_id;

    related := '{}'::jsonb;
    cleanup := '{}'::jsonb;

    for ref in
      select table_schema, table_name, column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name <> 'user_deletion_backups'
        and column_name in (
          'user_id', 'sender_id', 'created_by', 'updated_by', 'resolved_by', 'approved_by',
          'actor_id', 'manager_profile_id', 'managed_profile_id', 'author_id', 'closed_by',
          'moderated_by', 'reporter_id', 'responded_by', 'target_user_id',
          'animator_profile_id', 'coordinator_profile_id', 'diocesan_vocal_profile_id'
        )
    loop
      execute format('select count(*) from %I.%I where %I = $1', ref.table_schema, ref.table_name, ref.column_name)
      using target_id
      into affected_count;
      if affected_count > 0 then
        related := jsonb_set(related, array[ref.table_schema || '.' || ref.table_name || '.' || ref.column_name], to_jsonb(affected_count), true);
      end if;
    end loop;

    insert into public.user_deletion_backups (
      user_id,
      email,
      full_name,
      role,
      status,
      province,
      community,
      raw_profile_json,
      raw_auth_json,
      raw_identity_json,
      related_data_json,
      cleanup_result_json,
      deleted_by,
      deletion_reason
    )
    values (
      target_id,
      coalesce(target_email, normalized_email),
      target_full_name,
      target_role,
      target_status,
      target_province,
      target_community,
      profile_record,
      auth_record,
      identity_record,
      related,
      cleanup,
      auth.uid(),
      coalesce(p_reason, 'Liberacion completa de correo desde panel administrador')
    )
    returning id into backup_row_id;

    for ref in
      select table_schema, table_name, column_name, is_nullable
      from information_schema.columns
      where table_schema = 'public'
        and table_name <> 'user_deletion_backups'
        and column_name in (
          'user_id', 'sender_id', 'created_by', 'updated_by', 'resolved_by', 'approved_by',
          'actor_id', 'manager_profile_id', 'managed_profile_id', 'author_id', 'closed_by',
          'moderated_by', 'reporter_id', 'responded_by', 'target_user_id',
          'animator_profile_id', 'coordinator_profile_id', 'diocesan_vocal_profile_id'
        )
    loop
      if ref.is_nullable = 'YES' then
        execute format('update %I.%I set %I = null where %I = $1', ref.table_schema, ref.table_name, ref.column_name, ref.column_name)
        using target_id;
      else
        execute format('delete from %I.%I where %I = $1', ref.table_schema, ref.table_name, ref.column_name)
        using target_id;
      end if;
    end loop;

    for ref in
      select table_name, column_name
      from information_schema.columns
      where table_schema = 'auth'
        and table_name <> 'users'
        and column_name = 'user_id'
    loop
      execute format('delete from auth.%I where %I = $1', ref.table_name, ref.column_name)
      using target_id;
    end loop;

    delete from public.profiles where id = target_id and role <> 'administrador';
    delete from auth.users where id = target_id;

    insert into public.audit_logs (actor_id, action, metadata)
    values (
      auth.uid(),
      'admin_delete_user_by_email_v2',
      jsonb_build_object('user_id', target_id, 'email', coalesce(target_email, normalized_email), 'backup_id', backup_row_id)
    );

    deleted_user_id := target_id;
    deleted_email := coalesce(target_email, normalized_email);
    backup_id := backup_row_id;
    result_message := 'Usuario eliminado de Auth/Profile/relaciones y correo liberado. Ejecuta diagnostico nuevamente: debe quedar solo backup o sin usuario activo.';
    return next;
  end loop;
end;
$$;

grant execute on function public.admin_delete_user_by_email(text, text) to authenticated;

create or replace function public.admin_delete_user_completely(p_profile_id uuid)
returns table (
  deleted_user_id uuid,
  deleted_email text,
  backup_id uuid,
  result_message text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_email text;
begin
  select email into target_email from auth.users where id = p_profile_id;

  if target_email is null then
    raise exception 'No existe Auth user para ese id. Usa diagnostico por email para confirmar si solo queda backup/profile huerfano.';
  end if;

  return query
  select *
  from public.admin_delete_user_by_email(target_email, 'Eliminacion completa desde usuario seleccionado');
end;
$$;

grant execute on function public.admin_delete_user_completely(uuid) to authenticated;
