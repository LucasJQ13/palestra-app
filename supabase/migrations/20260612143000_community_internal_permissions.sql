-- Canonical community permissions for Mi Comunidad.
-- Community management is territorial and does not derive from global hierarchy.

create or replace function public.current_user_internal_community_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select case
    when profiles.role in ('animador_comunidad', 'coordinador_comunidad') then
      coalesce(
        profiles.managed_community_id,
        profiles.community_id,
        (
          select communities.id
          from public.communities
          where communities.name = profiles.community_name
            and (profiles.province_id is null or communities.province_id = profiles.province_id)
            and communities.archived_at is null
          limit 1
        )
      )
    else
      coalesce(
        profiles.community_id,
        (
          select communities.id
          from public.communities
          where communities.name = profiles.community_name
            and (profiles.province_id is null or communities.province_id = profiles.province_id)
            and communities.archived_at is null
          limit 1
        )
      )
    end
  from public.profiles
  where profiles.id = auth.uid()
    and profiles.status = 'aprobado'
  limit 1
$$;

grant execute on function public.current_user_internal_community_id() to authenticated;

drop policy if exists "Dirigentes crean publicaciones comunitarias" on public.community_publications;
create policy "Dirigentes crean publicaciones comunitarias"
on public.community_publications
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.status = 'aprobado'
      and actor.role in ('animador_comunidad', 'coordinador_comunidad', 'asesor', 'administrador')
      and (
        actor.role = 'administrador'
        or community_publications.community_id = public.current_user_internal_community_id()
      )
  )
);

drop function if exists public.create_community_publication(text, text, text, date, text);

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

  if author.role <> 'administrador'
    and not exists (
      select 1
      from public.communities
      where id = target_community_id
        and archived_at is null
        and is_active = true
    ) then
    raise exception 'La comunidad asignada no se encuentra activa';
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

  insert into public.community_publications (
    community_id,
    created_by,
    kind,
    title,
    body,
    event_date,
    visibility,
    poll_options
  )
  values (
    target_community_id,
    auth.uid(),
    p_kind,
    left(trim(p_title), 120),
    left(trim(p_body), 2000),
    p_event_date,
    final_visibility,
    coalesce(clean_options, '{}')
  )
  returning id into new_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (
    auth.uid(),
    'create_community_publication',
    jsonb_build_object(
      'publication_id', new_id,
      'community_id', target_community_id,
      'community_role', author.role,
      'kind', p_kind
    )
  );

  return new_id;
end;
$$;

grant execute on function public.create_community_publication(text, text, text, date, text, text[]) to authenticated;

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
      and (
        actor.role = 'administrador'
        or (
          publications.community_id = public.current_user_internal_community_id()
          and (
            actor.role in ('animador_comunidad', 'coordinador_comunidad')
            or (
              actor.role = 'asesor'
              and publications.created_by = auth.uid()
            )
          )
        )
      )
  );
$$;

grant execute on function public.current_user_can_manage_community_publication(uuid) to authenticated;
