-- Funcion de emergencia para SQL Editor.
-- No se concede a anon/authenticated: usar solo desde Supabase SQL Editor.

create or replace function public.sql_editor_force_release_user_email(
  p_email text,
  p_reason text default 'Liberacion forzada desde SQL Editor'
)
returns table (
  step text,
  detail text,
  affected_count integer
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized_email text := lower(trim(coalesce(p_email, '')));
  ids uuid[] := array[]::uuid[];
  target_id uuid;
  backup_row_id uuid;
  auth_json jsonb;
  identities_json jsonb;
  profile_json jsonb;
  related_json jsonb;
  ref record;
  affected integer;
begin
  if normalized_email = '' then
    raise exception 'Email requerido';
  end if;

  select array_agg(distinct matched_id)
  into ids
  from (
    select id as matched_id
    from auth.users
    where lower(email) = normalized_email
    union
    select user_id as matched_id
    from auth.identities
    where lower(coalesce(identity_data->>'email', provider_id, '')) = normalized_email
    union
    select identities.user_id as matched_id
    from auth.identities
    join auth.users on auth.users.id = identities.user_id
    where lower(auth.users.email) = normalized_email
  ) matches;

  ids := coalesce(ids, array[]::uuid[]);

  step := 'buscar';
  detail := 'ids encontrados para ' || normalized_email;
  affected_count := coalesce(array_length(ids, 1), 0);
  return next;

  if array_length(ids, 1) is null then
    step := 'resultado';
    detail := 'No hay usuario activo en Auth/Identities para ese correo. Si queda backup, no bloquea el mail.';
    affected_count := 0;
    return next;
    return;
  end if;

  if exists (select 1 from public.profiles where id = any(ids) and role = 'administrador') then
    raise exception 'No se permite eliminar usuarios Administrador';
  end if;

  foreach target_id in array ids loop
    select to_jsonb(au)
    into auth_json
    from auth.users au
    where au.id = target_id;

    select coalesce(jsonb_agg(to_jsonb(ai)), '[]'::jsonb)
    into identities_json
    from auth.identities ai
    where ai.user_id = target_id;

    select to_jsonb(p)
    into profile_json
    from public.profiles p
    where p.id = target_id;

    related_json := '{}'::jsonb;

    for ref in
      select table_schema, table_name, column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name <> 'user_deletion_backups'
        and column_name in (
          'id',
          'user_id',
          'sender_id',
          'created_by',
          'updated_by',
          'resolved_by',
          'approved_by',
          'actor_id',
          'manager_profile_id',
          'managed_profile_id',
          'author_id',
          'closed_by',
          'moderated_by',
          'reporter_id',
          'responded_by',
          'target_user_id',
          'animator_profile_id',
          'coordinator_profile_id',
          'diocesan_vocal_profile_id'
        )
    loop
      execute format('select count(*) from %I.%I where %I = $1', ref.table_schema, ref.table_name, ref.column_name)
      using target_id
      into affected;

      if affected > 0 then
        related_json := jsonb_set(
          related_json,
          array[ref.table_schema || '.' || ref.table_name || '.' || ref.column_name],
          to_jsonb(affected),
          true
        );
      end if;
    end loop;

    insert into public.user_deletion_backups (
      user_id,
      email,
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
      normalized_email,
      profile_json,
      auth_json,
      identities_json,
      related_json,
      '{}'::jsonb,
      null,
      coalesce(p_reason, 'Liberacion forzada desde SQL Editor')
    )
    returning id into backup_row_id;

    step := 'backup';
    detail := 'backup creado para ' || target_id::text;
    affected_count := 1;
    return next;

    update public.communities set animator_profile_id = null where animator_profile_id = target_id;
    get diagnostics affected = row_count;
    if affected > 0 then step := 'cleanup'; detail := 'communities.animator_profile_id'; affected_count := affected; return next; end if;

    update public.communities set coordinator_profile_id = null where coordinator_profile_id = target_id;
    get diagnostics affected = row_count;
    if affected > 0 then step := 'cleanup'; detail := 'communities.coordinator_profile_id'; affected_count := affected; return next; end if;

    update public.communities set diocesan_vocal_profile_id = null where diocesan_vocal_profile_id = target_id;
    get diagnostics affected = row_count;
    if affected > 0 then step := 'cleanup'; detail := 'communities.diocesan_vocal_profile_id'; affected_count := affected; return next; end if;

    delete from public.profile_role_relationships where manager_profile_id = target_id or managed_profile_id = target_id;
    get diagnostics affected = row_count;
    if affected > 0 then step := 'cleanup'; detail := 'profile_role_relationships'; affected_count := affected; return next; end if;

    delete from public.device_push_tokens where user_id = target_id;
    get diagnostics affected = row_count;
    if affected > 0 then step := 'cleanup'; detail := 'device_push_tokens'; affected_count := affected; return next; end if;

    delete from public.user_requests where user_id = target_id or resolved_by = target_id or target_user_id = target_id;
    get diagnostics affected = row_count;
    if affected > 0 then step := 'cleanup'; detail := 'user_requests'; affected_count := affected; return next; end if;

    update public.community_contact_messages set sender_id = null where sender_id = target_id;
    get diagnostics affected = row_count;
    if affected > 0 then step := 'cleanup'; detail := 'community_contact_messages.sender_id'; affected_count := affected; return next; end if;

    update public.audit_logs set actor_id = null where actor_id = target_id;
    get diagnostics affected = row_count;
    if affected > 0 then step := 'cleanup'; detail := 'audit_logs.actor_id'; affected_count := affected; return next; end if;

    for ref in
      select table_schema, table_name, column_name, is_nullable
      from information_schema.columns
      where table_schema = 'public'
        and table_name not in ('profiles', 'user_deletion_backups', 'audit_logs', 'communities')
        and column_name in ('user_id', 'created_by', 'updated_by', 'author_id', 'closed_by', 'moderated_by', 'reporter_id', 'responded_by', 'target_user_id')
    loop
      if ref.is_nullable = 'YES' then
        execute format('update %I.%I set %I = null where %I = $1', ref.table_schema, ref.table_name, ref.column_name, ref.column_name)
        using target_id;
      else
        execute format('delete from %I.%I where %I = $1', ref.table_schema, ref.table_name, ref.column_name)
        using target_id;
      end if;
      get diagnostics affected = row_count;
      if affected > 0 then step := 'cleanup'; detail := ref.table_schema || '.' || ref.table_name || '.' || ref.column_name; affected_count := affected; return next; end if;
    end loop;

    delete from auth.identities where user_id = target_id;
    get diagnostics affected = row_count;
    step := 'auth';
    detail := 'auth.identities';
    affected_count := affected;
    return next;

    for ref in
      select table_name, column_name
      from information_schema.columns
      where table_schema = 'auth'
        and table_name not in ('users', 'identities')
        and column_name = 'user_id'
    loop
      execute format('delete from auth.%I where %I = $1', ref.table_name, ref.column_name)
      using target_id;
      get diagnostics affected = row_count;
      if affected > 0 then step := 'auth'; detail := 'auth.' || ref.table_name || '.' || ref.column_name; affected_count := affected; return next; end if;
    end loop;

    delete from public.profiles where id = target_id and role <> 'administrador';
    get diagnostics affected = row_count;
    step := 'public';
    detail := 'public.profiles';
    affected_count := affected;
    return next;

    delete from auth.users where id = target_id;
    get diagnostics affected = row_count;
    step := 'auth';
    detail := 'auth.users';
    affected_count := affected;
    return next;
  end loop;

  step := 'verificacion';
  detail := 'auth.users restantes';
  select count(*)::integer into affected_count from auth.users where lower(email) = normalized_email;
  return next;

  step := 'verificacion';
  detail := 'auth.identities restantes';
  select count(*)::integer into affected_count from auth.identities where lower(coalesce(identity_data->>'email', provider_id, '')) = normalized_email;
  return next;

  step := 'resultado';
  detail := case
    when exists (select 1 from auth.users where lower(email) = normalized_email)
      or exists (select 1 from auth.identities where lower(coalesce(identity_data->>'email', provider_id, '')) = normalized_email)
    then 'No se pudo liberar completamente: aun queda Auth/Identity activo.'
    else 'Correo liberado de Auth/Identity. Solo puede quedar backup interno.'
  end;
  affected_count := 0;
  return next;
end;
$$;

revoke all on function public.sql_editor_force_release_user_email(text, text) from public;
revoke all on function public.sql_editor_force_release_user_email(text, text) from anon;
revoke all on function public.sql_editor_force_release_user_email(text, text) from authenticated;
