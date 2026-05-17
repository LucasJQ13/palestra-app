-- Reglas de alcance del foro por provincia y jerarquia.
-- Ejecutar despues de supabase/patch_forum_topics.sql.

create or replace function public.current_user_can_access_forum_category(p_category_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.forum_categories categories
    left join public.profiles actor on actor.id = auth.uid()
    where categories.id = p_category_id
      and categories.is_active = true
      and (
        categories.scope = 'nacional'
        or (
          actor.id is not null
          and actor.status = 'aprobado'
          and (
            actor.role in ('asesor', 'vocal_nacional', 'coordinador_nacional', 'administrador')
            or actor.province_id = categories.province_id
          )
        )
      )
  )
$$;

create or replace function public.current_user_can_publish_forum_category(p_category_id uuid)
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
        or actor.role in ('asesor', 'vocal_nacional', 'coordinador_nacional', 'administrador')
        or actor.province_id = categories.province_id
      )
  )
$$;

create or replace function public.current_user_can_choose_forum_min_role(
  p_category_id uuid,
  p_min_role public.user_role
)
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
      and actor.status = 'aprobado'
      and (
        public.role_rank(p_min_role) <= public.role_rank(actor.role)
        or actor.role in ('vocal_nacional', 'coordinador_nacional', 'administrador')
        or (
          categories.scope = 'provincia'
          and actor.role in ('vocal', 'coordinador_diocesano')
          and actor.province_id = categories.province_id
        )
      )
  )
$$;

grant execute on function public.current_user_can_access_forum_category(uuid) to anon, authenticated;
grant execute on function public.current_user_can_publish_forum_category(uuid) to authenticated;
grant execute on function public.current_user_can_choose_forum_min_role(uuid, public.user_role) to authenticated;

drop policy if exists "Categorias foro visibles" on public.forum_categories;
create policy "Categorias foro visibles"
on public.forum_categories
for select
using (public.current_user_can_access_forum_category(id));

create or replace function public.current_user_can_use_forum_category(p_category_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_can_publish_forum_category(p_category_id)
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
      and public.current_user_can_access_forum_category(categories.id)
      and (
        topics.min_role = 'invitado'
        or (
          viewer.id is not null
          and viewer.status = 'aprobado'
          and public.role_rank(viewer.role) >= public.role_rank(topics.min_role)
        )
      )
  )
$$;

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

  if not public.current_user_can_publish_forum_category(p_category_id) then
    raise exception 'No autorizado para esta categoria';
  end if;

  if not public.current_user_can_choose_forum_min_role(p_category_id, p_min_role) then
    raise exception 'No podes publicar para ese rango en esta categoria';
  end if;

  insert into public.forum_topics (category_id, author_id, title, body, min_role, author_role)
  values (p_category_id, auth.uid(), left(trim(p_title), 140), left(trim(p_body), 3000), p_min_role, actor.role)
  returning id into new_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'create_forum_topic', jsonb_build_object('topic_id', new_id, 'category_id', p_category_id, 'min_role', p_min_role));

  return new_id;
end;
$$;

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
  topic_category_id uuid;
begin
  select category_id into topic_category_id
  from public.forum_topics
  where id = p_topic_id;

  if not public.current_user_can_moderate_forum_topic(p_topic_id) then
    raise exception 'No autorizado';
  end if;

  if not public.current_user_can_choose_forum_min_role(topic_category_id, p_min_role) then
    raise exception 'No podes publicar para ese rango en esta categoria';
  end if;

  update public.forum_topics
  set title = left(trim(p_title), 140), body = left(trim(p_body), 3000), min_role = p_min_role, updated_at = now()
  where id = p_topic_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'update_forum_topic', jsonb_build_object('topic_id', p_topic_id));
end;
$$;
