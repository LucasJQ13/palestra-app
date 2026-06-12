-- Issue #63: official community notices with controlled enrichment and no reply model.

alter table public.community_publications
  add column if not exists subtitle text,
  add column if not exists body_format text not null default 'normal',
  add column if not exists image_url text,
  add column if not exists link_label text,
  add column if not exists link_url text;

alter table public.community_publications
  drop constraint if exists community_publications_body_format_check;

alter table public.community_publications
  add constraint community_publications_body_format_check
  check (body_format in ('normal', 'bold', 'underline'));

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
      and (
        actor.role = 'administrador'
        or (
          actor.role in ('animador_comunidad', 'coordinador_comunidad', 'asesor')
          and p_community_id = public.current_user_internal_community_id()
        )
      )
  )
$$;

grant execute on function public.current_user_can_publish_community_notice(uuid) to authenticated;

drop policy if exists "Dirigencia sube imagenes de comunidades" on storage.objects;
create policy "Dirigencia sube imagenes de comunidades"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'community-images'
  and (
    public.current_user_can_manage_community(((storage.foldername(name))[1])::uuid)
    or public.current_user_can_publish_community_notice(((storage.foldername(name))[1])::uuid)
  )
);

drop policy if exists "Dirigencia actualiza imagenes de comunidades" on storage.objects;
create policy "Dirigencia actualiza imagenes de comunidades"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'community-images'
  and (
    public.current_user_can_manage_community(((storage.foldername(name))[1])::uuid)
    or public.current_user_can_publish_community_notice(((storage.foldername(name))[1])::uuid)
  )
)
with check (
  bucket_id = 'community-images'
  and (
    public.current_user_can_manage_community(((storage.foldername(name))[1])::uuid)
    or public.current_user_can_publish_community_notice(((storage.foldername(name))[1])::uuid)
  )
);

drop policy if exists "Publicaciones comunitarias por visibilidad" on public.community_publications;
create policy "Publicaciones comunitarias por visibilidad"
on public.community_publications
for select
using (
  archived_at is null
  and (
    (
      kind = 'aviso'
      and auth.uid() is not null
      and (
        exists (
          select 1
          from public.profiles viewer
          where viewer.id = auth.uid()
            and viewer.status = 'aprobado'
            and viewer.role = 'administrador'
        )
        or community_id = public.current_user_internal_community_id()
      )
    )
    or (
      kind <> 'aviso'
      and public.current_user_can_see_publication(id)
    )
  )
);

drop function if exists public.create_community_publication(text, text, text, date, text, text[]);
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

  if author.id is null
    or author.status <> 'aprobado'
    or author.role not in ('animador_comunidad', 'coordinador_comunidad', 'asesor', 'administrador') then
    raise exception 'No autorizado para publicar en esta comunidad';
  end if;

  target_community_id := public.current_user_internal_community_id();

  if target_community_id is null then
    raise exception 'No hay una comunidad asignada al usuario';
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

drop function if exists public.update_community_publication(uuid, text, text, text);
drop function if exists public.update_community_publication(uuid, text, text, text, text, text, text, text, text);

create function public.update_community_publication(
  p_publication_id uuid,
  p_title text,
  p_body text,
  p_subtitle text default null,
  p_body_format text default 'normal',
  p_image_url text default null,
  p_link_label text default null,
  p_link_url text default null,
  p_status text default 'activo'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_image_url text := nullif(trim(p_image_url), '');
  clean_link_url text := nullif(trim(p_link_url), '');
begin
  if not public.current_user_can_manage_community_publication(p_publication_id) then
    raise exception 'No autorizado para editar este aviso';
  end if;

  if nullif(trim(p_body), '') is null then
    raise exception 'El contenido del aviso es obligatorio';
  end if;

  if clean_image_url is not null and clean_image_url !~* '^https?://' then
    raise exception 'La imagen debe usar un enlace HTTPS válido';
  end if;

  if clean_link_url is not null and clean_link_url !~* '^https?://' then
    raise exception 'El enlace debe usar HTTP o HTTPS';
  end if;

  update public.community_publications
  set title = left(coalesce(nullif(trim(p_title), ''), 'Aviso comunitario'), 120),
      subtitle = left(nullif(trim(p_subtitle), ''), 160),
      body = left(trim(p_body), 4000),
      body_format = case when p_body_format in ('bold', 'underline') then p_body_format else 'normal' end,
      image_url = clean_image_url,
      link_label = left(nullif(trim(p_link_label), ''), 80),
      link_url = clean_link_url,
      status = case when p_status = 'cerrado' then 'cerrado' else 'activo' end,
      closed_at = case when p_status = 'cerrado' then now() else null end,
      updated_at = now()
  where id = p_publication_id
    and kind = 'aviso'
    and archived_at is null;

  if not found then
    raise exception 'No se encontró un aviso activo para actualizar';
  end if;

  insert into public.audit_logs (actor_id, action, metadata)
  values (
    auth.uid(),
    'update_community_notice',
    jsonb_build_object('publication_id', p_publication_id)
  );
end;
$$;

grant execute on function public.update_community_publication(uuid, text, text, text, text, text, text, text, text) to authenticated;

drop function if exists public.get_my_community_publications();

create function public.get_my_community_publications()
returns table (
  id uuid,
  kind text,
  title text,
  subtitle text,
  body text,
  body_format text,
  image_url text,
  link_label text,
  link_url text,
  event_date date,
  visibility text,
  poll_options text[],
  poll_results jsonb,
  status text,
  created_by uuid,
  created_at timestamptz,
  author_name text,
  author_role text,
  community_id uuid,
  community_name text,
  province text
)
language sql
stable
security definer
set search_path = public
as $$
  with viewer as (
    select *
    from public.profiles
    where id = auth.uid()
      and status = 'aprobado'
  )
  select
    publications.id,
    publications.kind,
    publications.title,
    publications.subtitle,
    publications.body,
    publications.body_format,
    publications.image_url,
    publications.link_label,
    publications.link_url,
    publications.event_date,
    publications.visibility,
    publications.poll_options,
    publications.poll_results,
    publications.status,
    publications.created_by,
    publications.created_at,
    coalesce(author.full_name, 'Palestrista') as author_name,
    coalesce(author.role::text, 'palestrista') as author_role,
    communities.id as community_id,
    communities.name as community_name,
    provinces.name as province
  from public.community_publications publications
  join public.communities on communities.id = publications.community_id
  left join public.provinces on provinces.id = communities.province_id
  left join public.profiles author on author.id = publications.created_by
  join viewer on true
  where publications.archived_at is null
    and (
      viewer.role = 'administrador'
      or communities.id = public.current_user_internal_community_id()
    )
    and (
      publications.visibility <> 'sedimentadores'
      or viewer.role in (
        'sedimentador',
        'animador_comunidad',
        'coordinador_comunidad',
        'vocal',
        'asesor',
        'coordinador_diocesano',
        'vocal_nacional',
        'coordinador_nacional',
        'administrador'
      )
    )
  order by publications.created_at desc;
$$;

grant execute on function public.get_my_community_publications() to authenticated;

drop policy if exists "Usuarios aprobados comentan publicaciones visibles" on public.publication_comments;
create policy "Usuarios aprobados comentan publicaciones visibles"
on public.publication_comments
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'aprobado'
  )
  and exists (
    select 1
    from public.community_publications
    where community_publications.id = publication_comments.publication_id
      and community_publications.kind <> 'aviso'
  )
  and public.current_user_can_see_publication(publication_id)
);

drop policy if exists "Usuarios reaccionan publicaciones visibles" on public.publication_reactions;
create policy "Usuarios reaccionan publicaciones visibles"
on public.publication_reactions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'aprobado'
  )
  and exists (
    select 1
    from public.community_publications
    where community_publications.id = publication_reactions.publication_id
      and community_publications.kind <> 'aviso'
  )
  and public.current_user_can_see_publication(publication_id)
);

drop policy if exists "Usuarios actualizan sus reacciones" on public.publication_reactions;
create policy "Usuarios actualizan sus reacciones"
on public.publication_reactions
for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.community_publications
    where community_publications.id = publication_reactions.publication_id
      and community_publications.kind <> 'aviso'
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.community_publications
    where community_publications.id = publication_reactions.publication_id
      and community_publications.kind <> 'aviso'
  )
  and public.current_user_can_see_publication(publication_id)
);

create or replace function public.create_publication_comment(
  p_publication_id uuid,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  if exists (
    select 1
    from public.community_publications
    where id = p_publication_id
      and kind = 'aviso'
  ) then
    raise exception 'Los avisos comunitarios son comunicados de solo lectura';
  end if;

  if not public.current_user_can_see_publication(p_publication_id) then
    raise exception 'No autorizado';
  end if;

  insert into public.publication_comments (publication_id, user_id, body)
  values (p_publication_id, auth.uid(), left(trim(p_body), 500))
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.create_publication_comment(uuid, text) to authenticated;

create or replace function public.react_to_publication(
  p_publication_id uuid,
  p_reaction text default 'amen'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_reaction text := coalesce(nullif(trim(p_reaction), ''), 'amen');
begin
  if clean_reaction not in ('amen', 'me_gusta', 'acompanio') then
    raise exception 'Reacción inválida';
  end if;

  if exists (
    select 1
    from public.community_publications
    where id = p_publication_id
      and kind = 'aviso'
  ) then
    raise exception 'Los avisos comunitarios no admiten reacciones';
  end if;

  if not public.current_user_can_see_publication(p_publication_id) then
    raise exception 'No autorizado';
  end if;

  insert into public.publication_reactions (publication_id, user_id, reaction)
  values (p_publication_id, auth.uid(), clean_reaction)
  on conflict (publication_id, user_id)
  do update set reaction = excluded.reaction, created_at = now();
end;
$$;

grant execute on function public.react_to_publication(uuid, text) to authenticated;
