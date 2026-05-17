create or replace function public.get_public_profile(p_profile_id uuid)
returns table (
  id uuid,
  full_name text,
  avatar_url text,
  phone text,
  province text,
  community_name text,
  role text
)
language sql
security definer
set search_path = public
as $$
  select
    profiles.id,
    profiles.full_name,
    profiles.avatar_url,
    profiles.phone,
    provinces.name,
    profiles.community_name,
    profiles.role::text
  from public.profiles
  left join public.provinces on provinces.id = profiles.province_id
  where profiles.id = p_profile_id
    and profiles.status = 'aprobado'
  limit 1;
$$;

grant execute on function public.get_public_profile(uuid) to authenticated;

drop function if exists public.get_my_community_members();

create or replace function public.get_my_community_members()
returns table (
  id uuid,
  full_name text,
  email text,
  role text,
  community_name text,
  province text,
  avatar_url text
)
language sql
security definer
set search_path = public
as $$
  select
    profiles.id,
    profiles.full_name,
    auth.users.email::text as email,
    profiles.role::text,
    profiles.community_name,
    provinces.name as province,
    profiles.avatar_url
  from public.profiles
  join auth.users on auth.users.id = profiles.id
  left join public.provinces on provinces.id = profiles.province_id
  where profiles.status = 'aprobado'
    and profiles.community_name = (
      select me.community_name
      from public.profiles me
      where me.id = auth.uid()
    )
  order by profiles.full_name nulls last, auth.users.email;
$$;

grant execute on function public.get_my_community_members() to authenticated;

grant execute on function public.create_forum_topic(uuid, text, text, public.user_role) to authenticated;
grant execute on function public.update_forum_topic(uuid, text, text, public.user_role) to authenticated;
grant execute on function public.create_forum_comment(uuid, text) to authenticated;
grant execute on function public.archive_forum_comment(uuid) to authenticated;

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

  if nullif(trim(p_title), '') is null or nullif(trim(p_body), '') is null then
    raise exception 'Titulo y contenido son obligatorios.';
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

grant execute on function public.create_forum_topic(uuid, text, text, public.user_role) to authenticated;

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
  select status into topic_status from public.forum_topics where id = p_topic_id and archived_at is null;

  if actor.id is null or actor.status <> 'aprobado' then
    raise exception 'No autorizado';
  end if;

  if nullif(trim(p_body), '') is null then
    raise exception 'El comentario no puede estar vacio.';
  end if;

  if topic_status is null then
    raise exception 'Tema no encontrado';
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

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'create_forum_comment', jsonb_build_object('comment_id', new_id, 'topic_id', p_topic_id));

  return new_id;
end;
$$;

grant execute on function public.create_forum_comment(uuid, text) to authenticated;
