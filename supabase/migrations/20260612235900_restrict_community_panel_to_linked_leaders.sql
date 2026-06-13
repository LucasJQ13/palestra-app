-- The Community Panel belongs only to leaders linked to their own community.
-- Global administration remains available through the separate admin community RPCs.

create or replace function public.current_user_can_publish_community_notice(p_community_id uuid)
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
      and actor.role in ('animador_comunidad', 'coordinador_comunidad', 'asesor')
      and p_community_id = public.current_user_internal_community_id()
  )
$$;

grant execute on function public.current_user_can_publish_community_notice(uuid) to authenticated;

drop policy if exists "Dirigentes crean publicaciones comunitarias" on public.community_publications;
create policy "Dirigentes crean publicaciones comunitarias"
on public.community_publications
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.current_user_can_publish_community_notice(community_id)
);

create or replace function public.current_user_can_manage_community_publication(p_publication_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_publications publications
    join public.profiles actor on actor.id = auth.uid()
    where publications.id = p_publication_id
      and actor.status = 'aprobado'
      and publications.community_id = public.current_user_internal_community_id()
      and (
        actor.role in ('animador_comunidad', 'coordinador_comunidad')
        or (
          actor.role = 'asesor'
          and publications.created_by = auth.uid()
        )
      )
  );
$$;

grant execute on function public.current_user_can_manage_community_publication(uuid) to authenticated;

drop function if exists public.create_community_publication(text, text, text, text, text, text, text, text, date, text, text[]);

create function public.create_community_publication(
  p_kind text,
  p_title text,
  p_body text,
  p_subtitle text default null,
  p_body_format text default 'normal',
  p_image_url text default null,
  p_link_label text default null,
  p_link_url text default null,
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
  clean_image_url text;
  clean_link_url text;
  clean_body_format text;
begin
  select * into author
  from public.profiles
  where id = auth.uid();

  target_community_id := public.current_user_internal_community_id();

  if author.id is null
    or not public.current_user_can_publish_community_notice(target_community_id) then
    raise exception 'No autorizado para publicar en esta comunidad';
  end if;

  if target_community_id is null then
    raise exception 'No hay una comunidad asignada al usuario';
  end if;

  if not exists (
    select 1
    from public.communities
    where id = target_community_id
      and archived_at is null
      and is_active = true
  ) then
    raise exception 'La comunidad asignada no se encuentra activa';
  end if;

  if nullif(trim(p_body), '') is null then
    raise exception 'El contenido del aviso es obligatorio';
  end if;

  if p_kind not in ('aviso', 'noticia', 'fecha', 'encuesta') then
    raise exception 'Tipo de publicación inválido';
  end if;

  final_visibility := case
    when author.role = 'animador_comunidad' then 'publica'
    when p_visibility in ('publica', 'registrados', 'sedimentadores') then p_visibility
    else 'publica'
  end;

  clean_body_format := case
    when p_body_format in ('bold', 'underline') then p_body_format
    else 'normal'
  end;
  clean_image_url := nullif(trim(p_image_url), '');
  clean_link_url := nullif(trim(p_link_url), '');

  if clean_image_url is not null and clean_image_url !~* '^https?://' then
    raise exception 'La imagen debe usar un enlace HTTPS válido';
  end if;

  if clean_link_url is not null and clean_link_url !~* '^https?://' then
    raise exception 'El enlace debe usar HTTP o HTTPS';
  end if;

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

  insert into public.community_publications (
    community_id,
    created_by,
    kind,
    title,
    subtitle,
    body,
    body_format,
    image_url,
    link_label,
    link_url,
    event_date,
    visibility,
    poll_options
  )
  values (
    target_community_id,
    auth.uid(),
    p_kind,
    left(coalesce(nullif(trim(p_title), ''), 'Aviso comunitario'), 120),
    case when p_kind = 'aviso' then left(nullif(trim(p_subtitle), ''), 160) else null end,
    left(trim(p_body), 4000),
    case when p_kind = 'aviso' then clean_body_format else 'normal' end,
    case when p_kind = 'aviso' then clean_image_url else null end,
    case when p_kind = 'aviso' then left(nullif(trim(p_link_label), ''), 80) else null end,
    case when p_kind = 'aviso' then clean_link_url else null end,
    p_event_date,
    final_visibility,
    coalesce(clean_options, '{}')
  )
  returning id into new_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (
    auth.uid(),
    'create_community_notice',
    jsonb_build_object(
      'publication_id', new_id,
      'community_id', target_community_id,
      'community_role', author.role,
      'has_image', clean_image_url is not null,
      'has_link', clean_link_url is not null
    )
  );

  return new_id;
end;
$$;

grant execute on function public.create_community_publication(text, text, text, text, text, text, text, text, date, text, text[]) to authenticated;

create or replace function public.update_my_community_details(
  p_description text,
  p_image_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor public.profiles%rowtype;
  target_community_id uuid;
begin
  select * into actor
  from public.profiles
  where id = auth.uid();

  target_community_id := public.current_user_internal_community_id();

  if actor.id is null
    or actor.status <> 'aprobado'
    or actor.role not in ('animador_comunidad', 'coordinador_comunidad')
    or target_community_id is null then
    raise exception 'No autorizado para editar datos de la comunidad';
  end if;

  update public.communities
  set description = left(coalesce(trim(p_description), ''), 1000),
      image_url = nullif(trim(p_image_url), ''),
      updated_by = auth.uid(),
      updated_at = now()
  where id = target_community_id
    and archived_at is null
    and is_active = true;

  if not found then
    raise exception 'No se encontró una comunidad activa para actualizar';
  end if;

  insert into public.audit_logs (actor_id, action, metadata)
  values (
    auth.uid(),
    'update_my_community_details',
    jsonb_build_object('community_id', target_community_id)
  );

  return target_community_id;
end;
$$;

grant execute on function public.update_my_community_details(text, text) to authenticated;
