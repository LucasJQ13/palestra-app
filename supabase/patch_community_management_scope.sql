-- Gestion segura de comunidades por jerarquia.
-- Comunidades son publicas para lectura; creacion/edicion/baja quedan por RPC y RLS.

alter table public.communities
add column if not exists is_active boolean not null default true,
add column if not exists archived_at timestamptz,
add column if not exists updated_at timestamptz,
add column if not exists updated_by uuid references public.profiles(id);

create or replace function public.current_user_can_manage_community(p_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles actor
    join public.communities target on target.id = p_community_id
    where actor.id = auth.uid()
      and actor.status = 'aprobado'
      and (
        actor.role in ('vocal_nacional', 'coordinador_nacional', 'administrador')
        or (
          actor.role in ('vocal', 'asesor', 'coordinador_diocesano')
          and actor.province_id = target.province_id
        )
      )
  )
$$;

create or replace function public.current_user_can_manage_community_province(p_province_id uuid)
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
        actor.role in ('vocal_nacional', 'coordinador_nacional', 'administrador')
        or (
          actor.role in ('vocal', 'asesor', 'coordinador_diocesano')
          and actor.province_id = p_province_id
        )
      )
  )
$$;

grant execute on function public.current_user_can_manage_community(uuid) to authenticated;
grant execute on function public.current_user_can_manage_community_province(uuid) to authenticated;

drop policy if exists "Comunidades publicas" on public.communities;
create policy "Comunidades publicas"
on public.communities
for select
using (
  archived_at is null
  and (
    is_active = true
    or public.current_user_can_manage_community(id)
  )
);

drop policy if exists "Dirigencia crea comunidades por alcance" on public.communities;
create policy "Dirigencia crea comunidades por alcance"
on public.communities
for insert
to authenticated
with check (public.current_user_can_manage_community_province(province_id));

drop policy if exists "Dirigencia actualiza comunidades por alcance" on public.communities;
create policy "Dirigencia actualiza comunidades por alcance"
on public.communities
for update
to authenticated
using (public.current_user_can_manage_community(id))
with check (public.current_user_can_manage_community(id));

create or replace function public.admin_create_community(
  p_province text,
  p_name text,
  p_group_type text,
  p_address text,
  p_phone text,
  p_meeting_day text,
  p_meeting_time text,
  p_description text,
  p_is_active boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_province_id uuid;
  new_id uuid;
begin
  select id
  into selected_province_id
  from public.provinces
  where lower(name) = lower(trim(p_province))
  limit 1;

  if selected_province_id is null then
    raise exception 'Provincia no encontrada';
  end if;

  if not public.current_user_can_manage_community_province(selected_province_id) then
    raise exception 'No autorizado';
  end if;

  if nullif(trim(p_name), '') is null then
    raise exception 'El nombre de la comunidad es obligatorio';
  end if;

  if exists (
    select 1
    from public.communities
    where province_id = selected_province_id
      and lower(name) = lower(trim(p_name))
      and archived_at is null
  ) then
    raise exception 'Ya existe una comunidad con ese nombre en esta provincia';
  end if;

  insert into public.communities (
    province_id, name, group_type, address, phone, meeting_day, meeting_time,
    description, is_active, updated_by, updated_at
  )
  values (
    selected_province_id,
    left(trim(p_name), 160),
    case when p_group_type in ('jovenes', 'adultos') then p_group_type else 'jovenes' end,
    coalesce(nullif(trim(p_address), ''), 'Direccion pendiente'),
    nullif(trim(p_phone), ''),
    nullif(trim(p_meeting_day), ''),
    nullif(trim(p_meeting_time), ''),
    nullif(trim(p_description), ''),
    coalesce(p_is_active, true),
    auth.uid(),
    now()
  )
  returning id into new_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_create_community', jsonb_build_object('community_id', new_id, 'province_id', selected_province_id, 'name', p_name));

  return new_id;
end;
$$;

grant execute on function public.admin_create_community(text, text, text, text, text, text, text, text, boolean) to authenticated;

create or replace function public.admin_update_community(
  p_community_id uuid,
  p_name text,
  p_address text,
  p_phone text,
  p_meeting_day text,
  p_meeting_time text,
  p_description text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_name text;
  new_name text;
begin
  if not public.current_user_can_manage_community(p_community_id) then
    raise exception 'No autorizado';
  end if;

  select name into old_name from public.communities where id = p_community_id;
  new_name := coalesce(nullif(trim(p_name), ''), old_name);

  update public.communities
  set
    name = new_name,
    address = coalesce(nullif(trim(p_address), ''), address),
    phone = nullif(trim(p_phone), ''),
    meeting_day = nullif(trim(p_meeting_day), ''),
    meeting_time = nullif(trim(p_meeting_time), ''),
    description = nullif(trim(p_description), ''),
    updated_by = auth.uid(),
    updated_at = now()
  where id = p_community_id;

  update public.profiles
  set community_name = new_name
  where community_name = old_name;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_community', jsonb_build_object('community_id', p_community_id, 'old_name', old_name, 'new_name', new_name));
end;
$$;

grant execute on function public.admin_update_community(uuid, text, text, text, text, text, text) to authenticated;

create or replace function public.admin_set_community_status(
  p_community_id uuid,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_can_manage_community(p_community_id) then
    raise exception 'No autorizado';
  end if;

  update public.communities
  set is_active = coalesce(p_is_active, true), updated_by = auth.uid(), updated_at = now()
  where id = p_community_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_set_community_status', jsonb_build_object('community_id', p_community_id, 'is_active', p_is_active));
end;
$$;

grant execute on function public.admin_set_community_status(uuid, boolean) to authenticated;

create or replace function public.admin_archive_community(p_community_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_can_manage_community(p_community_id) then
    raise exception 'No autorizado';
  end if;

  update public.communities
  set archived_at = now(), is_active = false, updated_by = auth.uid(), updated_at = now()
  where id = p_community_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_archive_community', jsonb_build_object('community_id', p_community_id));
end;
$$;

grant execute on function public.admin_archive_community(uuid) to authenticated;

create or replace function public.create_community_publication(
  p_kind text,
  p_title text,
  p_body text,
  p_event_date date default null,
  p_visibility text default 'publica',
  p_poll_options text[] default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  author public.profiles%rowtype;
  target_community_id uuid;
  new_id uuid;
  final_visibility text;
  clean_options text[];
begin
  select * into author from public.profiles where id = auth.uid();

  if author.id is null or author.status <> 'aprobado' or author.role not in ('animador_comunidad', 'coordinador_comunidad', 'administrador') then
    raise exception 'No autorizado';
  end if;

  target_community_id := coalesce(
    author.managed_community_id,
    author.community_id,
    (select communities.id from public.communities where communities.name = author.community_name and communities.archived_at is null limit 1)
  );

  if target_community_id is null then
    raise exception 'No hay comunidad asignada';
  end if;

  if author.role in ('animador_comunidad', 'coordinador_comunidad')
    and not exists (
      select 1
      from public.communities
      where id = target_community_id
        and name = author.community_name
        and archived_at is null
        and is_active = true
    ) then
    raise exception 'No autorizado para publicar fuera de tu comunidad';
  end if;

  final_visibility := case
    when author.role = 'animador_comunidad' then 'publica'
    when p_visibility in ('publica', 'registrados', 'sedimentadores') then p_visibility
    else 'publica'
  end;

  select array_agg(option_text)
  into clean_options
  from (
    select distinct nullif(trim(option_text), '') as option_text
    from unnest(coalesce(p_poll_options, '{}')) option_text
    where nullif(trim(option_text), '') is not null
    limit 8
  ) options;

  if p_kind = 'encuesta' and coalesce(array_length(clean_options, 1), 0) < 2 then
    raise exception 'La encuesta necesita al menos 2 opciones';
  end if;

  insert into public.community_publications (community_id, created_by, kind, title, body, event_date, visibility, poll_options)
  values (target_community_id, auth.uid(), p_kind, left(trim(p_title), 120), left(trim(p_body), 2000), p_event_date, final_visibility, coalesce(clean_options, '{}'))
  returning id into new_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'create_community_publication', jsonb_build_object('publication_id', new_id, 'community_id', target_community_id, 'kind', p_kind));

  return new_id;
end;
$$;

grant execute on function public.create_community_publication(text, text, text, date, text, text[]) to authenticated;
