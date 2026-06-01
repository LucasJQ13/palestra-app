-- Eliminacion robusta de usuarios: limpia FKs reales hacia profiles/auth.users.
-- Ejecutar en Supabase SQL Editor si eliminar usuario o liberar mail no funciona.

create or replace function public.admin_cleanup_user_foreign_keys(p_target_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  ref record;
  affected integer;
  result jsonb := '{}'::jsonb;
begin
  if p_target_id is null then
    return result;
  end if;

  for ref in
    select
      nsp.nspname as table_schema,
      cls.relname as table_name,
      att.attname as column_name,
      att.attnotnull as not_null,
      conf_nsp.nspname as foreign_schema,
      conf_cls.relname as foreign_table
    from pg_constraint con
    join pg_class cls on cls.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    join pg_class conf_cls on conf_cls.oid = con.confrelid
    join pg_namespace conf_nsp on conf_nsp.oid = conf_cls.relnamespace
    join unnest(con.conkey) with ordinality as key(attnum, ord) on true
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = key.attnum
    where con.contype = 'f'
      and nsp.nspname in ('public', 'auth')
      and not (nsp.nspname = 'public' and cls.relname = 'user_deletion_backups')
      and not (nsp.nspname = 'public' and cls.relname = 'profiles' and att.attname = 'id')
      and (
        (conf_nsp.nspname = 'public' and conf_cls.relname = 'profiles')
        or (conf_nsp.nspname = 'auth' and conf_cls.relname = 'users')
      )
  loop
    if ref.not_null then
      execute format('delete from %I.%I where %I = $1', ref.table_schema, ref.table_name, ref.column_name)
      using p_target_id;
    else
      execute format('update %I.%I set %I = null where %I = $1', ref.table_schema, ref.table_name, ref.column_name, ref.column_name)
      using p_target_id;
    end if;

    get diagnostics affected = row_count;
    if affected > 0 then
      result := jsonb_set(
        result,
        array[ref.table_schema || '.' || ref.table_name || '.' || ref.column_name],
        to_jsonb(affected),
        true
      );
    end if;
  end loop;

  return result;
end;
$$;

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
  cleanup jsonb;
  backup_row_id uuid;
  target_email text;
  target_full_name text;
  target_role text;
  target_status text;
  target_province text;
  target_community text;
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
    result_message := 'No existe usuario activo con ese email. El correo deberia estar libre.';
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

    cleanup := public.admin_cleanup_user_foreign_keys(target_id);

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
      cleanup,
      cleanup,
      auth.uid(),
      coalesce(p_reason, 'Liberacion completa de correo desde panel administrador')
    )
    returning id into backup_row_id;

    delete from auth.identities where user_id = target_id;
    delete from public.profiles where id = target_id and role <> 'administrador';
    delete from auth.users where id = target_id;

    insert into public.audit_logs (actor_id, action, metadata)
    values (
      auth.uid(),
      'admin_delete_user_by_email_fk_cleanup',
      jsonb_build_object('user_id', target_id, 'email', coalesce(target_email, normalized_email), 'backup_id', backup_row_id, 'cleanup', cleanup)
    );

    deleted_user_id := target_id;
    deleted_email := coalesce(target_email, normalized_email);
    backup_id := backup_row_id;
    result_message := 'Usuario eliminado y correo liberado. Ejecuta diagnostico nuevamente para verificar.';
    return next;
  end loop;
end;
$$;

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
    raise exception 'No existe Auth user para ese id. Usa diagnostico por email.';
  end if;

  return query
  select *
  from public.admin_delete_user_by_email(target_email, 'Eliminacion completa desde usuario seleccionado');
end;
$$;

grant execute on function public.admin_cleanup_user_foreign_keys(uuid) to authenticated;
grant execute on function public.admin_delete_user_by_email(text, text) to authenticated;
grant execute on function public.admin_delete_user_completely(uuid) to authenticated;
