-- Encuestas comunitarias, votos e historial de publicaciones.

alter table public.community_publications
  add column if not exists poll_options text[] not null default '{}',
  add column if not exists poll_results jsonb not null default '{}'::jsonb;

create table if not exists public.community_poll_votes (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.community_publications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  option_text text not null,
  created_at timestamptz not null default now(),
  unique (publication_id, user_id)
);

alter table public.community_poll_votes enable row level security;

drop policy if exists "Usuarios ven votos propios" on public.community_poll_votes;
create policy "Usuarios ven votos propios"
on public.community_poll_votes
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('animador_comunidad', 'coordinador_comunidad', 'vocal', 'coordinador_diocesano', 'administrador')
  )
);

drop policy if exists "Usuarios votan encuestas visibles" on public.community_poll_votes;
create policy "Usuarios votan encuestas visibles"
on public.community_poll_votes
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.community_publications publications
    join public.communities on communities.id = publications.community_id
    join public.profiles voters on voters.id = auth.uid()
    where publications.id = community_poll_votes.publication_id
      and publications.kind = 'encuesta'
      and voters.community_name = communities.name
  )
);

drop policy if exists "Publicaciones comunitarias por visibilidad" on public.community_publications;
create policy "Publicaciones comunitarias por visibilidad"
on public.community_publications
for select
using (
  exists (
    select 1
    from public.communities
    where communities.id = community_publications.community_id
  )
  and (
    exists (
      select 1
      from public.profiles viewer
      join public.communities on communities.id = community_publications.community_id
      where viewer.id = auth.uid()
        and (
          viewer.role in ('administrador', 'vocal_nacional', 'coordinador_nacional')
          or viewer.community_name = communities.name
          or viewer.province_id = communities.province_id
            and viewer.role in ('vocal', 'asesor', 'coordinador_diocesano')
        )
        and (
          community_publications.visibility <> 'sedimentadores'
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
  select * into author from public.profiles where id = auth.uid();

  if author.id is null or author.status <> 'aprobado' or author.role not in ('animador_comunidad', 'coordinador_comunidad', 'administrador') then
    raise exception 'No autorizado';
  end if;

  target_community_id := coalesce(
    author.managed_community_id,
    author.community_id,
    (select communities.id from public.communities where communities.name = author.community_name limit 1)
  );

  if target_community_id is null then
    raise exception 'No hay comunidad asignada';
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

  return new_id;
end;
$$;

grant execute on function public.create_community_publication(text, text, text, date, text, text[]) to authenticated;

create or replace function public.vote_community_poll(
  p_publication_id uuid,
  p_option text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_option text := nullif(trim(p_option), '');
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  if clean_option is null then
    raise exception 'Opcion invalida';
  end if;

  if not exists (
    select 1
    from public.community_publications publications
    join public.communities on communities.id = publications.community_id
    join public.profiles voter on voter.id = auth.uid()
    where publications.id = p_publication_id
      and publications.kind = 'encuesta'
      and clean_option = any(publications.poll_options)
      and voter.community_name = communities.name
  ) then
    raise exception 'No autorizado para votar esta encuesta';
  end if;

  insert into public.community_poll_votes (publication_id, user_id, option_text)
  values (p_publication_id, auth.uid(), clean_option)
  on conflict (publication_id, user_id)
  do update set option_text = excluded.option_text, created_at = now();

  update public.community_publications
  set poll_results = coalesce((
    select jsonb_object_agg(option_text, total)
    from (
      select option_text, count(*) as total
      from public.community_poll_votes
      where publication_id = p_publication_id
      group by option_text
      order by count(*) desc, option_text
    ) vote_counts
  ), '{}'::jsonb)
  where id = p_publication_id;
end;
$$;

grant execute on function public.vote_community_poll(uuid, text) to authenticated;
