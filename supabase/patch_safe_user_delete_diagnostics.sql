-- Eliminacion real de usuarios con backup y diagnostico de login.
-- Ejecutar en Supabase SQL Editor.

create table if not exists public.user_deletion_backups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text,
  full_name text,
  role text,
  status text,
  province text,
  community text,
  raw_profile_json jsonb,
  raw_auth_json jsonb,
  related_data_json jsonb not null default '{}'::jsonb,
  deleted_by uuid references public.profiles(id),
  deleted_at timestamptz not null default now(),
  deletion_reason text
);

alter table public.user_deletion_backups enable row level security;

drop policy if exists "Solo administradores ven backups de eliminacion" on public.user_deletion_backups;
create policy "Solo administradores ven backups de eliminacion"
on public.user_deletion_backups for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'aprobado'
      and profiles.role = 'administrador'
  )
);

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

create or replace function public.admin_backup_and_delete_user_ids(
  p_user_ids uuid[],
  p_reason text default 'Eliminacion segura desde panel administrador'
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
  target_id uuid;
  auth_record jsonb;
  profile_record jsonb;
  related jsonb;
  backup_row_id uuid;
  target_email text;
  target_full_name text;
  target_role text;
  target_status text;
  target_province text;
  target_community text;
  ref record;
  ref_rows jsonb;
begin
  if not public.current_user_is_administrator() then
    raise exception 'Solo Administrador puede eliminar usuarios y liberar correos';
  end if;

  if p_user_ids is null or array_length(p_user_ids, 1) is null then
    raise exception 'No se encontraron usuarios para eliminar';
  end if;

  if exists (
    select 1
    from public.profiles
    where id = any(p_user_ids)
      and role = 'administrador'
  ) then
    raise exception 'No se permite eliminar usuarios Administrador';
  end if;

  foreach target_id in array p_user_ids loop
    select to_jsonb(au), au.email
    into auth_record, target_email
    from auth.users au
    where au.id = target_id;

    select to_jsonb(p), p.full_name, p.role::text, p.status::text, pr.name, p.community_name
    into profile_record, target_full_name, target_role, target_status, target_province, target_community
    from public.profiles p
    left join public.provinces pr on pr.id = p.province_id
    where p.id = target_id;

    related := '{}'::jsonb;
    for ref in
      select table_schema, table_name, column_name, is_nullable
      from information_schema.columns
      where table_schema in ('public', 'auth')
        and column_name in (
          'user_id', 'sender_id', 'created_by', 'updated_by', 'resolved_by', 'approved_by',
          'actor_id', 'manager_profile_id', 'managed_profile_id', 'author_id', 'closed_by',
          'moderated_by', 'reporter_id', 'responded_by', 'target_user_id',
          'animator_profile_id', 'coordinator_profile_id', 'diocesan_vocal_profile_id'
        )
        and not (table_schema = 'public' and table_name in ('profiles', 'user_deletion_backups'))
    loop
      execute format(
        'select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from %I.%I t where %I = $1',
        ref.table_schema,
        ref.table_name,
        ref.column_name
      )
      using target_id
      into ref_rows;

      if jsonb_array_length(ref_rows) > 0 then
        related := jsonb_set(
          related,
          array[ref.table_schema || '.' || ref.table_name || '.' || ref.column_name],
          ref_rows,
          true
        );
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
      related_data_json,
      deleted_by,
      deletion_reason
    )
    values (
      target_id,
      target_email,
      target_full_name,
      target_role,
      target_status,
      target_province,
      target_community,
      profile_record,
      auth_record,
      related,
      auth.uid(),
      coalesce(p_reason, 'Eliminacion segura desde panel administrador')
    )
    returning id into backup_row_id;

    for ref in
      select table_schema, table_name, column_name, is_nullable
      from information_schema.columns
      where table_schema = 'public'
        and column_name in (
          'user_id', 'sender_id', 'created_by', 'updated_by', 'resolved_by', 'approved_by',
          'actor_id', 'manager_profile_id', 'managed_profile_id', 'author_id', 'closed_by',
          'moderated_by', 'reporter_id', 'responded_by', 'target_user_id',
          'animator_profile_id', 'coordinator_profile_id', 'diocesan_vocal_profile_id'
        )
        and table_name not in ('profiles', 'user_deletion_backups')
    loop
      if ref.is_nullable = 'YES' then
        execute format('update %I.%I set %I = null where %I = $1', ref.table_schema, ref.table_name, ref.column_name, ref.column_name)
        using target_id;
      else
        execute format('delete from %I.%I where %I = $1', ref.table_schema, ref.table_name, ref.column_name)
        using target_id;
      end if;
    end loop;

    delete from public.profile_role_relationships
    where manager_profile_id = target_id
       or managed_profile_id = target_id;

    delete from public.device_push_tokens
    where user_id = target_id;

    delete from public.user_requests
    where user_id = target_id
       or resolved_by = target_id;

    delete from public.profiles
    where id = target_id
      and role <> 'administrador';

    delete from auth.identities
    where user_id = target_id;

    delete from auth.users
    where id = target_id;

    insert into public.audit_logs (actor_id, action, metadata)
    values (
      auth.uid(),
      'admin_delete_user_completely',
      jsonb_build_object('user_id', target_id, 'email', target_email, 'backup_id', backup_row_id)
    );

    deleted_user_id := target_id;
    deleted_email := target_email;
    backup_id := backup_row_id;
    result_message := 'Usuario eliminado y correo liberado correctamente.';
    return next;
  end loop;
end;
$$;

grant execute on function public.admin_backup_and_delete_user_ids(uuid[], text) to authenticated;

drop function if exists public.admin_delete_user_completely(uuid);
create or replace function public.admin_delete_user_completely(p_profile_id uuid)
returns table (
  deleted_user_id uuid,
  deleted_email text,
  backup_id uuid,
  result_message text
)
language sql
security definer
set search_path = public
as $$
  select *
  from public.admin_backup_and_delete_user_ids(array[p_profile_id], 'Eliminacion segura desde panel administrador');
$$;

grant execute on function public.admin_delete_user_completely(uuid) to authenticated;

drop function if exists public.admin_delete_user_by_email(text, text);
create or replace function public.admin_delete_user_by_email(
  p_email text,
  p_reason text default 'Liberacion manual de correo desde panel administrador'
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
  normalized_email text := lower(trim(p_email));
  ids uuid[];
begin
  if not public.current_user_is_administrator() then
    raise exception 'Solo Administrador puede eliminar usuarios y liberar correos';
  end if;

  if normalized_email is null or normalized_email = '' then
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

  if ids is null or array_length(ids, 1) is null then
    insert into public.audit_logs (actor_id, action, metadata)
    values (auth.uid(), 'admin_delete_user_by_email_no_match', jsonb_build_object('email', normalized_email));

    deleted_user_id := null;
    deleted_email := normalized_email;
    backup_id := null;
    result_message := 'No existe usuario con ese email en Auth/Identities. El correo ya deberia estar libre.';
    return next;
    return;
  end if;

  return query
  select *
  from public.admin_backup_and_delete_user_ids(ids, coalesce(p_reason, 'Liberacion manual de correo desde panel administrador'));
end;
$$;

grant execute on function public.admin_delete_user_by_email(text, text) to authenticated;

drop function if exists public.admin_diagnose_user_login(text);
create or replace function public.admin_diagnose_user_login(p_email text)
returns table (
  searched_email text,
  auth_exists boolean,
  auth_user_id uuid,
  email_confirmed_at timestamptz,
  profile_exists boolean,
  profile_id uuid,
  profile_user_id uuid,
  profile_email text,
  status text,
  role text,
  province text,
  community text,
  has_duplicates boolean,
  auth_count integer,
  profile_count integer,
  inconsistencies text[],
  possible_cause text,
  recommended_action text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized_email text := lower(trim(p_email));
  auth_ids uuid[];
  profile_ids uuid[];
  first_auth auth.users%rowtype;
  first_profile public.profiles%rowtype;
  issues text[] := array[]::text[];
begin
  if not public.current_user_is_administrator() then
    raise exception 'Solo Administrador puede diagnosticar usuarios';
  end if;

  if normalized_email is null or normalized_email = '' then
    normalized_email := '';
    issues := array_append(issues, 'Email vacio');
  end if;

  select array_agg(distinct user_id)
  into auth_ids
  from (
    select id as user_id
    from auth.users
    where lower(email) = normalized_email
    union
    select user_id
    from auth.identities
    where lower(coalesce(identity_data->>'email', provider_id, '')) = normalized_email
  ) matches;

  auth_count := coalesce(array_length(auth_ids, 1), 0);

  if auth_count > 0 then
    select *
    into first_auth
    from auth.users
    where id = auth_ids[1];

    select array_agg(id)
    into profile_ids
    from public.profiles
    where id = any(auth_ids);
  else
    profile_ids := array[]::uuid[];
  end if;

  profile_count := coalesce(array_length(profile_ids, 1), 0);

  if profile_count > 0 then
    select *
    into first_profile
    from public.profiles
    where id = profile_ids[1];
  end if;

  if auth_count = 0 then
    issues := array_append(issues, 'No existe en Auth ni en identities');
  end if;
  if auth_count > 1 then
    issues := array_append(issues, 'Hay duplicados en Auth/identities para ese email');
  end if;
  if auth_count > 0 and profile_count = 0 then
    issues := array_append(issues, 'Existe en Auth pero no tiene profile asociado');
  end if;
  if auth_count = 0 and profile_count > 0 then
    issues := array_append(issues, 'Existe profile sin Auth asociado');
  end if;
  if profile_count > 1 then
    issues := array_append(issues, 'Hay mas de un profile asociado a coincidencias de Auth');
  end if;
  if auth_count > 0 and first_auth.email_confirmed_at is null then
    issues := array_append(issues, 'Email sin confirmar');
  end if;
  if profile_count > 0 and first_profile.status in ('pendiente'::public.user_status, 'bloqueado'::public.user_status) then
    issues := array_append(issues, 'Profile no aprobado');
  end if;

  searched_email := normalized_email;
  auth_exists := auth_count > 0;
  auth_user_id := case when auth_count > 0 then first_auth.id else null end;
  email_confirmed_at := case when auth_count > 0 then first_auth.email_confirmed_at else null end;
  profile_exists := profile_count > 0;
  profile_id := case when profile_count > 0 then first_profile.id else null end;
  profile_user_id := profile_id;
  profile_email := case when auth_count > 0 then first_auth.email else null end;
  status := case when profile_count > 0 then first_profile.status::text else null end;
  role := case when profile_count > 0 then first_profile.role::text else null end;
  select pr.name into province
  from public.provinces pr
  where pr.id = first_profile.province_id;
  community := case when profile_count > 0 then first_profile.community_name else null end;
  has_duplicates := auth_count > 1 or profile_count > 1;
  inconsistencies := issues;
  possible_cause := case
    when 'Email vacio' = any(issues) then 'No se puede diagnosticar sin email.'
    when 'No existe en Auth ni en identities' = any(issues) then 'El correo no esta registrado o ya fue liberado.'
    when 'Hay duplicados en Auth/identities para ese email' = any(issues) then 'Supabase Auth tiene mas de una referencia para el mismo email.'
    when 'Existe en Auth pero no tiene profile asociado' = any(issues) then 'El login puede autenticar, pero la app no encuentra perfil.'
    when 'Email sin confirmar' = any(issues) then 'Auth rechaza o limita el ingreso porque el email no esta confirmado.'
    when 'Profile no aprobado' = any(issues) then 'La app carga el usuario pero lo mantiene pendiente/bloqueado.'
    else 'No se detecta conflicto evidente en Auth/Profile.'
  end;
  recommended_action := case
    when 'No existe en Auth ni en identities' = any(issues) then 'Crear cuenta nueva desde la app.'
    when 'Existe en Auth pero no tiene profile asociado' = any(issues) then 'Usar Reparar usuario para crear profile y confirmar email.'
    when 'Email sin confirmar' = any(issues) or 'Profile no aprobado' = any(issues) then 'Usar Reparar usuario para confirmar email y aprobar profile.'
    when has_duplicates then 'Usar Eliminar y liberar mail, luego crear la cuenta desde cero.'
    else 'Si sigue fallando, liberar el correo y registrar la cuenta nuevamente.'
  end;

  return next;
end;
$$;

grant execute on function public.admin_diagnose_user_login(text) to authenticated;

drop function if exists public.admin_repair_user_login(text);
create or replace function public.admin_repair_user_login(p_email text)
returns table (
  repaired_user_id uuid,
  result_message text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized_email text := lower(trim(p_email));
  target_auth auth.users%rowtype;
begin
  if not public.current_user_is_administrator() then
    raise exception 'Solo Administrador puede reparar usuarios';
  end if;

  select *
  into target_auth
  from auth.users
  where lower(email) = normalized_email
  order by created_at desc
  limit 1;

  if target_auth.id is null then
    raise exception 'No existe usuario en Auth para reparar. Libera el correo o crea una cuenta nueva.';
  end if;

  update auth.users
  set email_confirmed_at = coalesce(email_confirmed_at, now()),
      confirmed_at = default
  where id = target_auth.id;

  insert into public.profiles (id, full_name, status, role, approved_at, approved_by)
  values (
    target_auth.id,
    coalesce(target_auth.raw_user_meta_data->>'full_name', target_auth.email, 'Usuario Palestra'),
    'aprobado'::public.user_status,
    'palestrista'::public.user_role,
    now(),
    auth.uid()
  )
  on conflict (id) do update
  set status = 'aprobado'::public.user_status,
      role = case
        when public.profiles.role = 'administrador'::public.user_role then public.profiles.role
        else public.profiles.role
      end,
      approved_at = coalesce(public.profiles.approved_at, now()),
      approved_by = coalesce(public.profiles.approved_by, auth.uid());

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_repair_user_login', jsonb_build_object('user_id', target_auth.id, 'email', normalized_email));

  repaired_user_id := target_auth.id;
  result_message := 'Usuario reparado: email confirmado, profile creado/aprobado.';
  return next;
end;
$$;

grant execute on function public.admin_repair_user_login(text) to authenticated;
