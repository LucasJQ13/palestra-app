-- Foro/Muro comunitario sobre community_publications.
-- Agrega comentarios, reacciones y reportes sin duplicar el modelo actual.

alter table public.community_publications
  add column if not exists archived_at timestamptz,
  add column if not exists moderated_by uuid references public.profiles(id),
  add column if not exists moderated_at timestamptz;

create table if not exists public.publication_comments (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.community_publications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  archived_at timestamptz,
  moderated_by uuid references public.profiles(id),
  moderated_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.publication_reactions (
  publication_id uuid not null references public.community_publications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null default 'amen' check (reaction in ('amen', 'me_gusta', 'acompanio')),
  created_at timestamptz not null default now(),
  primary key (publication_id, user_id)
);

create table if not exists public.publication_reports (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid references public.community_publications(id) on delete cascade,
  comment_id uuid references public.publication_comments(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 300),
  status text not null default 'pendiente' check (status in ('pendiente', 'revisado', 'descartado')),
  created_at timestamptz not null default now(),
  check (publication_id is not null or comment_id is not null)
);

alter table public.publication_comments enable row level security;
alter table public.publication_reactions enable row level security;
alter table public.publication_reports enable row level security;

create or replace function public.current_user_can_see_publication(p_publication_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_publications publications
    join public.communities on communities.id = publications.community_id
    left join public.profiles viewer on viewer.id = auth.uid()
    where publications.id = p_publication_id
      and publications.archived_at is null
      and (
        publications.visibility = 'publica'
        or (
          publications.visibility = 'registrados'
          and viewer.id is not null
          and viewer.status = 'aprobado'
        )
        or (
          publications.visibility = 'sedimentadores'
          and viewer.id is not null
          and viewer.status = 'aprobado'
          and viewer.role in (
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
      and (
        publications.visibility = 'publica'
        or viewer.role in ('administrador', 'vocal_nacional', 'coordinador_nacional')
        or viewer.community_name = communities.name
        or (
          viewer.province_id = communities.province_id
          and viewer.role in ('vocal', 'asesor', 'coordinador_diocesano')
        )
      )
  )
$$;

grant execute on function public.current_user_can_see_publication(uuid) to anon, authenticated;

create or replace function public.current_user_can_moderate_publication(p_publication_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_publications publications
    join public.communities on communities.id = publications.community_id
    join public.profiles moderator on moderator.id = auth.uid()
    where publications.id = p_publication_id
      and moderator.status = 'aprobado'
      and (
        moderator.role in ('administrador', 'vocal_nacional', 'coordinador_nacional')
        or (
          moderator.role in ('vocal', 'asesor', 'coordinador_diocesano')
          and moderator.province_id = communities.province_id
        )
        or (
          moderator.role in ('animador_comunidad', 'coordinador_comunidad')
          and moderator.community_name = communities.name
        )
      )
  )
$$;

grant execute on function public.current_user_can_moderate_publication(uuid) to authenticated;

drop policy if exists "Comentarios visibles por publicacion" on public.publication_comments;
create policy "Comentarios visibles por publicacion"
on public.publication_comments
for select
using (
  archived_at is null
  and public.current_user_can_see_publication(publication_id)
);

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
  and public.current_user_can_see_publication(publication_id)
);

drop policy if exists "Reacciones visibles por publicacion" on public.publication_reactions;
create policy "Reacciones visibles por publicacion"
on public.publication_reactions
for select
using (public.current_user_can_see_publication(publication_id));

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
  and public.current_user_can_see_publication(publication_id)
);

drop policy if exists "Usuarios actualizan sus reacciones" on public.publication_reactions;
create policy "Usuarios actualizan sus reacciones"
on public.publication_reactions
for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and public.current_user_can_see_publication(publication_id)
);

drop policy if exists "Reportes propios o moderacion" on public.publication_reports;
create policy "Reportes propios o moderacion"
on public.publication_reports
for select
to authenticated
using (
  reporter_id = auth.uid()
  or public.current_user_can_moderate_publication(publication_id)
  or exists (
    select 1
    from public.publication_comments comments
    where comments.id = publication_reports.comment_id
      and public.current_user_can_moderate_publication(comments.publication_id)
  )
);

drop policy if exists "Usuarios reportan contenido visible" on public.publication_reports;
create policy "Usuarios reportan contenido visible"
on public.publication_reports
for insert
to authenticated
with check (
  reporter_id = auth.uid()
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'aprobado'
  )
  and (
    (publication_id is not null and public.current_user_can_see_publication(publication_id))
    or exists (
      select 1
      from public.publication_comments comments
      where comments.id = publication_reports.comment_id
        and public.current_user_can_see_publication(comments.publication_id)
    )
  )
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
    raise exception 'Reaccion invalida';
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

create or replace function public.report_publication(
  p_publication_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if not public.current_user_can_see_publication(p_publication_id) then
    raise exception 'No autorizado';
  end if;

  insert into public.publication_reports (publication_id, reporter_id, reason)
  values (p_publication_id, auth.uid(), left(trim(p_reason), 300))
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.report_publication(uuid, text) to authenticated;
