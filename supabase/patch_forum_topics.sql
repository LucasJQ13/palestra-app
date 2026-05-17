-- Foro real de Palestra: categorias, temas, comentarios y moderacion por jerarquia.
-- No reemplaza community_publications, que queda para avisos internos de comunidad.

create table if not exists public.forum_categories (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('nacional', 'provincia')),
  province_id uuid references public.provinces(id) on delete cascade,
  name text not null,
  description text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (scope, province_id),
  check ((scope = 'nacional' and province_id is null) or (scope = 'provincia' and province_id is not null))
);

create table if not exists public.forum_topics (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.forum_categories(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 140),
  body text not null check (char_length(body) between 3 and 3000),
  min_role public.user_role not null default 'invitado',
  author_role public.user_role not null,
  status text not null default 'abierto' check (status in ('abierto', 'cerrado')),
  closed_at timestamptz,
  closed_by uuid references public.profiles(id),
  archived_at timestamptz,
  updated_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.forum_topics(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1500),
  author_role public.user_role not null,
  archived_at timestamptz,
  updated_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.forum_categories enable row level security;
alter table public.forum_topics enable row level security;
alter table public.forum_comments enable row level security;

insert into public.forum_categories (scope, province_id, name, description, sort_order)
values ('nacional', null, 'Nacional', 'Foro nacional de Palestra Argentina.', 0)
on conflict (scope, province_id) do update
set name = excluded.name, description = excluded.description, is_active = true;

insert into public.forum_categories (scope, province_id, name, description, sort_order)
select 'provincia', provinces.id, provinces.name, 'Foro provincial de ' || provinces.name || '.', 10
from public.provinces
on conflict (scope, province_id) do update
set name = excluded.name, description = excluded.description, is_active = true;

create or replace function public.current_user_can_use_forum_category(p_category_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.forum_categories categories
    join public.profiles actor on actor.id = auth.uid()
    where categories.id = p_category_id
      and categories.is_active = true
      and actor.status = 'aprobado'
      and (
        categories.scope = 'nacional'
        or actor.role in ('vocal_nacional', 'coordinador_nacional', 'administrador')
        or actor.province_id = categories.province_id
      )
  )
$$;

create or replace function public.current_user_can_see_forum_topic(p_topic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.forum_topics topics
    join public.forum_categories categories on categories.id = topics.category_id
    left join public.profiles viewer on viewer.id = auth.uid()
    where topics.id = p_topic_id
      and topics.archived_at is null
      and categories.is_active = true
      and (
        topics.min_role = 'invitado'
        or (
          viewer.id is not null
          and viewer.status = 'aprobado'
          and public.role_rank(viewer.role) >= public.role_rank(topics.min_role)
        )
      )
      and (
        categories.scope = 'nacional'
        or viewer.role in ('vocal_nacional', 'coordinador_nacional', 'administrador')
        or viewer.province_id = categories.province_id
      )
  )
$$;

create or replace function public.current_user_can_moderate_forum_topic(p_topic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.forum_topics topics
    join public.forum_categories categories on categories.id = topics.category_id
    join public.profiles actor on actor.id = auth.uid()
    where topics.id = p_topic_id
      and actor.status = 'aprobado'
      and (
        topics.author_id = auth.uid()
        or (
          public.role_rank(actor.role) > public.role_rank(topics.author_role)
          and (
            actor.role in ('vocal_nacional', 'coordinador_nacional', 'administrador')
            or (categories.scope = 'provincia' and actor.province_id = categories.province_id and actor.role in ('vocal', 'asesor', 'coordinador_diocesano'))
          )
        )
      )
  )
$$;

grant execute on function public.current_user_can_use_forum_category(uuid) to authenticated;
grant execute on function public.current_user_can_see_forum_topic(uuid) to anon, authenticated;
grant execute on function public.current_user_can_moderate_forum_topic(uuid) to authenticated;

drop policy if exists "Categorias foro visibles" on public.forum_categories;
create policy "Categorias foro visibles"
on public.forum_categories
for select
using (is_active = true);

drop policy if exists "Temas foro visibles por rango" on public.forum_topics;
create policy "Temas foro visibles por rango"
on public.forum_topics
for select
using (public.current_user_can_see_forum_topic(id));

drop policy if exists "Comentarios foro visibles por tema" on public.forum_comments;
create policy "Comentarios foro visibles por tema"
on public.forum_comments
for select
using (archived_at is null and public.current_user_can_see_forum_topic(topic_id));

create or replace function public.create_forum_topic(
  p_category_id uuid,
  p_title text,
  p_body text,
  p_min_role public.user_role
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor public.profiles%rowtype;
  new_id uuid;
begin
  select * into actor from public.profiles where id = auth.uid();

  if actor.id is null or actor.status <> 'aprobado' then
    raise exception 'No autorizado';
  end if;

  if not public.current_user_can_use_forum_category(p_category_id) then
    raise exception 'No autorizado para esta categoria';
  end if;

  if public.role_rank(p_min_role) > public.role_rank(actor.role) then
    raise exception 'No podes publicar para rangos superiores al tuyo';
  end if;

  insert into public.forum_topics (category_id, author_id, title, body, min_role, author_role)
  values (p_category_id, auth.uid(), left(trim(p_title), 140), left(trim(p_body), 3000), p_min_role, actor.role)
  returning id into new_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'create_forum_topic', jsonb_build_object('topic_id', new_id, 'category_id', p_category_id, 'min_role', p_min_role));

  return new_id;
end;
$$;

grant execute on function public.create_forum_topic(uuid, text, text, public.user_role) to authenticated;

create or replace function public.update_forum_topic(
  p_topic_id uuid,
  p_title text,
  p_body text,
  p_min_role public.user_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role public.user_role;
begin
  select role into actor_role from public.profiles where id = auth.uid() and status = 'aprobado';

  if not public.current_user_can_moderate_forum_topic(p_topic_id) then
    raise exception 'No autorizado';
  end if;

  if public.role_rank(p_min_role) > public.role_rank(actor_role) then
    raise exception 'No podes publicar para rangos superiores al tuyo';
  end if;

  update public.forum_topics
  set title = left(trim(p_title), 140), body = left(trim(p_body), 3000), min_role = p_min_role, updated_at = now()
  where id = p_topic_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'update_forum_topic', jsonb_build_object('topic_id', p_topic_id));
end;
$$;

grant execute on function public.update_forum_topic(uuid, text, text, public.user_role) to authenticated;

create or replace function public.set_forum_topic_status(p_topic_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_can_moderate_forum_topic(p_topic_id) then
    raise exception 'No autorizado';
  end if;

  update public.forum_topics
  set status = case when p_status = 'cerrado' then 'cerrado' else 'abierto' end,
      closed_at = case when p_status = 'cerrado' then now() else null end,
      closed_by = case when p_status = 'cerrado' then auth.uid() else null end,
      updated_at = now()
  where id = p_topic_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'set_forum_topic_status', jsonb_build_object('topic_id', p_topic_id, 'status', p_status));
end;
$$;

grant execute on function public.set_forum_topic_status(uuid, text) to authenticated;

create or replace function public.archive_forum_topic(p_topic_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_can_moderate_forum_topic(p_topic_id) then
    raise exception 'No autorizado';
  end if;

  update public.forum_topics set archived_at = now(), updated_at = now() where id = p_topic_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'archive_forum_topic', jsonb_build_object('topic_id', p_topic_id));
end;
$$;

grant execute on function public.archive_forum_topic(uuid) to authenticated;

create or replace function public.create_forum_comment(p_topic_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor public.profiles%rowtype;
  topic_status text;
  new_id uuid;
begin
  select * into actor from public.profiles where id = auth.uid();
  select status into topic_status from public.forum_topics where id = p_topic_id;

  if actor.id is null or actor.status <> 'aprobado' then
    raise exception 'No autorizado';
  end if;

  if topic_status <> 'abierto' then
    raise exception 'El tema esta cerrado';
  end if;

  if not public.current_user_can_see_forum_topic(p_topic_id) then
    raise exception 'No autorizado';
  end if;

  insert into public.forum_comments (topic_id, author_id, body, author_role)
  values (p_topic_id, auth.uid(), left(trim(p_body), 1500), actor.role)
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.create_forum_comment(uuid, text) to authenticated;

create or replace function public.archive_forum_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_topic uuid;
  target_author uuid;
begin
  select topic_id, author_id into target_topic, target_author
  from public.forum_comments
  where id = p_comment_id;

  if target_author <> auth.uid() and not public.current_user_can_moderate_forum_topic(target_topic) then
    raise exception 'No autorizado';
  end if;

  update public.forum_comments
  set archived_at = now(), updated_at = now()
  where id = p_comment_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'archive_forum_comment', jsonb_build_object('comment_id', p_comment_id, 'topic_id', target_topic));
end;
$$;

grant execute on function public.archive_forum_comment(uuid) to authenticated;
