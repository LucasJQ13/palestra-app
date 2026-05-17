-- Correcciones Beta funcional:
-- foro visible por RPC, usuarios creados por admin con Auth utilizable,
-- reparacion de perfil y buzon con mensajes dirigidos por jerarquia.

create or replace function public.role_is_province_bound(p_role public.user_role)
returns boolean
language sql
immutable
as $$
  select p_role in ('animador_comunidad', 'coordinador_comunidad', 'vocal', 'asesor', 'coordinador_diocesano')
$$;

create or replace function public.role_is_community_bound(p_role public.user_role)
returns boolean
language sql
immutable
as $$
  select p_role in ('animador_comunidad', 'coordinador_comunidad')
$$;

grant execute on function public.role_is_province_bound(public.user_role) to anon, authenticated;
grant execute on function public.role_is_community_bound(public.user_role) to anon, authenticated;

create or replace function public.get_forum_topics(p_category_id uuid)
returns table (
  id uuid,
  category_id uuid,
  author_id uuid,
  title text,
  body text,
  min_role public.user_role,
  author_role public.user_role,
  author_name text,
  author_province text,
  status text,
  created_at timestamptz,
  reply_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    topics.id,
    topics.category_id,
    topics.author_id,
    topics.title,
    topics.body,
    topics.min_role,
    topics.author_role,
    coalesce(author.full_name, auth_users.email::text, 'Palestrista') as author_name,
    provinces.name as author_province,
    topics.status,
    topics.created_at,
    count(comments.id) filter (where comments.archived_at is null) as reply_count
  from public.forum_topics topics
  join public.forum_categories categories on categories.id = topics.category_id
  left join public.profiles author on author.id = topics.author_id
  left join auth.users auth_users on auth_users.id = topics.author_id
  left join public.provinces on provinces.id = author.province_id
  left join public.forum_comments comments on comments.topic_id = topics.id
  where topics.category_id = p_category_id
    and topics.archived_at is null
    and categories.is_active = true
    and public.current_user_can_access_forum_category(categories.id)
    and public.current_user_can_see_forum_topic(topics.id)
  group by topics.id, categories.id, author.full_name, auth_users.email, provinces.name
  order by topics.created_at desc
  limit 100;
$$;

grant execute on function public.get_forum_topics(uuid) to anon, authenticated;

create or replace function public.get_forum_comments(p_topic_id uuid)
returns table (
  id uuid,
  topic_id uuid,
  author_id uuid,
  body text,
  author_role public.user_role,
  author_name text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    comments.id,
    comments.topic_id,
    comments.author_id,
    comments.body,
    comments.author_role,
    coalesce(author.full_name, auth_users.email::text, 'Palestrista') as author_name,
    comments.created_at
  from public.forum_comments comments
  left join public.profiles author on author.id = comments.author_id
  left join auth.users auth_users on auth_users.id = comments.author_id
  where comments.topic_id = p_topic_id
    and comments.archived_at is null
    and public.current_user_can_see_forum_topic(comments.topic_id)
  order by comments.created_at asc;
$$;

grant execute on function public.get_forum_comments(uuid) to anon, authenticated;

create or replace function public.update_my_profile(
  p_full_name text,
  p_phone text,
  p_province text,
  p_community_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_province_id uuid;
  current_profile record;
  next_role public.user_role;
  province_changed boolean;
  community_changed boolean;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  select id
  into selected_province_id
  from public.provinces
  where name = p_province
  limit 1;

  if selected_province_id is null then
    raise exception 'Provincia no encontrada';
  end if;

  insert into public.profiles (id, full_name, role, status, province_id, community_name, approved_at)
  values (
    auth.uid(),
    nullif(trim(p_full_name), ''),
    'palestrista',
    'aprobado',
    selected_province_id,
    nullif(trim(p_community_name), ''),
    now()
  )
  on conflict (id) do nothing;

  select profiles.province_id, profiles.community_name, profiles.role, profiles.last_profile_edit_at
  into current_profile
  from public.profiles
  where profiles.id = auth.uid();

  if current_profile.last_profile_edit_at is not null and current_profile.last_profile_edit_at > now() - interval '5 days' then
    raise exception 'El perfil solo puede editarse una vez cada 5 dias';
  end if;

  province_changed := current_profile.province_id is distinct from selected_province_id;
  community_changed := coalesce(trim(current_profile.community_name), '') is distinct from coalesce(trim(p_community_name), '');
  next_role := current_profile.role;

  if province_changed and public.role_is_province_bound(current_profile.role) then
    next_role := 'sedimentador';
  elsif community_changed and public.role_is_community_bound(current_profile.role) then
    next_role := 'sedimentador';
  end if;

  update public.profiles
  set
    full_name = nullif(trim(p_full_name), ''),
    phone = nullif(trim(p_phone), ''),
    province_id = selected_province_id,
    community_name = nullif(trim(p_community_name), ''),
    role = next_role,
    status = coalesce(status, 'aprobado'),
    last_profile_edit_at = now()
  where id = auth.uid();

  insert into public.audit_logs (actor_id, action, metadata)
  values (
    auth.uid(),
    'update_my_profile',
    jsonb_build_object('province_changed', province_changed, 'community_changed', community_changed, 'previous_role', current_profile.role, 'next_role', next_role)
  );
end;
$$;

grant execute on function public.update_my_profile(text, text, text, text) to authenticated;

create or replace function public.admin_create_basic_user(
  p_email text,
  p_password text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  new_user_id uuid := gen_random_uuid();
  normalized_email text := lower(trim(p_email));
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  if normalized_email = '' or normalized_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Mail invalido';
  end if;

  if length(coalesce(p_password, '')) < 6 then
    raise exception 'La contrasena debe tener al menos 6 caracteres';
  end if;

  if exists (select 1 from auth.users where lower(email) = normalized_email) then
    raise exception 'Ya existe un usuario con ese mail';
  end if;

  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    normalized_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('created_by_admin', true),
    now(),
    now()
  );

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    new_user_id::text,
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', normalized_email, 'email_verified', true),
    'email',
    now(),
    now(),
    now()
  )
  on conflict (provider, provider_id) do nothing;

  insert into public.profiles (id, full_name, role, status, province_id, community_name, approved_at, approved_by)
  values (new_user_id, normalized_email, 'palestrista', 'aprobado', null, null, now(), auth.uid())
  on conflict (id) do update
  set
    status = 'aprobado',
    role = case when profiles.role = 'administrador' then profiles.role else 'palestrista' end,
    approved_at = coalesce(profiles.approved_at, now()),
    approved_by = coalesce(profiles.approved_by, auth.uid());

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_create_basic_user', jsonb_build_object('user_id', new_user_id, 'email', normalized_email));

  return new_user_id;
end;
$$;

grant execute on function public.admin_create_basic_user(text, text) to authenticated;

insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  users.id::text,
  users.id,
  jsonb_build_object('sub', users.id::text, 'email', users.email::text, 'email_verified', users.email_confirmed_at is not null),
  'email',
  now(),
  coalesce(users.created_at, now()),
  now()
from auth.users users
where users.email is not null
  and not exists (
    select 1
    from auth.identities identities
    where identities.provider = 'email'
      and identities.user_id = users.id
  )
on conflict (provider, provider_id) do nothing;

create or replace function public.admin_update_user(
  p_profile_id uuid,
  p_email text,
  p_password text,
  p_full_name text,
  p_phone text,
  p_province text,
  p_community_name text,
  p_status text,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  selected_province_id uuid;
  actor public.profiles%rowtype;
  target public.profiles%rowtype;
  requested_role public.user_role;
  requested_status public.user_status;
  normalized_email text := lower(trim(coalesce(p_email, '')));
  previous_replaced_id uuid;
begin
  select * into actor from public.profiles where id = auth.uid();

  if actor.id is null or actor.status <> 'aprobado' then
    raise exception 'No autorizado';
  end if;

  if not exists (select 1 from auth.users where id = p_profile_id) then
    raise exception 'Usuario de autenticacion no encontrado';
  end if;

  insert into public.profiles (id, full_name, role, status, approved_at)
  values (p_profile_id, nullif(trim(p_full_name), ''), 'palestrista', 'aprobado', now())
  on conflict (id) do nothing;

  select * into target from public.profiles where id = p_profile_id;

  if target.role = 'administrador' or p_role = 'administrador' then
    raise exception 'El rol Administrador no puede modificarse ni asignarse desde la aplicacion';
  end if;

  requested_role := p_role::public.user_role;
  requested_status := p_status::public.user_status;

  select id into selected_province_id
  from public.provinces
  where name = p_province
  limit 1;

  if actor.role <> 'administrador' then
    if public.role_rank(actor.role) < public.role_rank(target.role) then
      raise exception 'No podes editar usuarios de rango superior';
    end if;

    if public.role_rank(requested_role) > public.role_rank(actor.role) then
      raise exception 'No podes asignar un rango superior al tuyo';
    end if;

    if actor.role not in ('vocal_nacional', 'coordinador_nacional')
      and actor.province_id is distinct from selected_province_id then
      raise exception 'No podes editar usuarios fuera de tu provincia';
    end if;

    if requested_role in ('coordinador_diocesano', 'coordinador_nacional') then
      perform public.request_coordinator_acceptance(p_profile_id, requested_role, 'Propuesta generada desde panel de usuarios.');
      insert into public.audit_logs (actor_id, action, metadata)
      values (auth.uid(), 'admin_update_user_coordinator_requires_acceptance', jsonb_build_object('profile_id', p_profile_id, 'target_role', requested_role, 'province_id', selected_province_id));
      return;
    end if;
  end if;

  if normalized_email = '' or normalized_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Mail invalido';
  end if;

  if exists (
    select 1
    from auth.users
    where lower(email) = normalized_email
      and id <> p_profile_id
  ) then
    raise exception 'Ya existe otro usuario con ese mail';
  end if;

  if requested_role = 'coordinador_nacional' and requested_status = 'aprobado' then
    select id into previous_replaced_id
    from public.profiles
    where id <> p_profile_id
      and role = 'coordinador_nacional'
      and status = 'aprobado'
    limit 1;

    if previous_replaced_id is not null then
      update public.profiles set role = 'sedimentador' where id = previous_replaced_id;
    end if;
  elsif requested_role = 'coordinador_diocesano' and requested_status = 'aprobado' then
    select id into previous_replaced_id
    from public.profiles
    where id <> p_profile_id
      and role = 'coordinador_diocesano'
      and status = 'aprobado'
      and province_id = selected_province_id
    limit 1;

    if previous_replaced_id is not null then
      update public.profiles set role = 'sedimentador' where id = previous_replaced_id;
    end if;
  end if;

  update auth.users
  set
    email = normalized_email,
    encrypted_password = case
      when nullif(p_password, '') is null then encrypted_password
      else crypt(p_password, gen_salt('bf'))
    end,
    updated_at = now()
  where id = p_profile_id;

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    p_profile_id::text,
    p_profile_id,
    jsonb_build_object('sub', p_profile_id::text, 'email', normalized_email, 'email_verified', true),
    'email',
    now(),
    now(),
    now()
  )
  on conflict (provider, provider_id) do update
  set identity_data = jsonb_build_object('sub', p_profile_id::text, 'email', normalized_email, 'email_verified', true),
      updated_at = now();

  update public.profiles
  set
    full_name = nullif(trim(p_full_name), ''),
    phone = nullif(trim(p_phone), ''),
    province_id = selected_province_id,
    community_name = nullif(trim(p_community_name), ''),
    status = requested_status,
    role = requested_role,
    approved_at = case when requested_status = 'aprobado' then coalesce(approved_at, now()) else approved_at end,
    approved_by = case when requested_status = 'aprobado' then coalesce(approved_by, auth.uid()) else approved_by end
  where id = p_profile_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_user', jsonb_build_object(
    'profile_id', p_profile_id,
    'email', normalized_email,
    'status', p_status,
    'role', p_role,
    'previous_replaced_id', previous_replaced_id
  ));
end;
$$;

grant execute on function public.admin_update_user(uuid, text, text, text, text, text, text, text, text) to authenticated;

create or replace function public.admin_confirm_user_email(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'Usuario de autenticacion no encontrado';
  end if;

  update auth.users
  set
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    confirmed_at = coalesce(confirmed_at, now()),
    updated_at = now()
  where id = p_user_id;

  update auth.identities
  set identity_data = identity_data || jsonb_build_object('email_verified', true),
      updated_at = now()
  where user_id = p_user_id
    and provider = 'email';

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_confirm_user_email', jsonb_build_object('user_id', p_user_id));
end;
$$;

grant execute on function public.admin_confirm_user_email(uuid) to authenticated;

alter table public.community_contact_messages
  add column if not exists target_scope text,
  add column if not exists target_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists target_role text,
  add column if not exists target_province_id uuid references public.provinces(id) on delete set null;

create or replace function public.current_user_can_access_community_message(p_message_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_contact_messages messages
    left join public.communities communities on communities.id = messages.community_id
    left join public.profiles actor on actor.id = auth.uid()
    where messages.id = p_message_id
      and (
        messages.sender_id = auth.uid()
        or messages.target_user_id = auth.uid()
        or (
          actor.status = 'aprobado'
          and (
            actor.role in ('administrador')
            or (
              messages.target_scope = 'all'
              and actor.id is not null
            )
            or (
              messages.target_scope = 'role'
              and actor.role::text = messages.target_role
            )
            or (
              messages.target_scope = 'province'
              and actor.province_id = messages.target_province_id
            )
            or (
              messages.target_scope = 'role_province'
              and actor.role::text = messages.target_role
              and actor.province_id = messages.target_province_id
            )
            or (
              messages.target_scope = 'diocesan_leadership'
              and actor.role in ('vocal', 'coordinador_diocesano')
              and (messages.target_province_id is null or actor.province_id = messages.target_province_id)
            )
            or (
              messages.target_scope = 'province_communities'
              and actor.role in ('animador_comunidad', 'coordinador_comunidad')
              and actor.province_id = messages.target_province_id
            )
            or (
              messages.community_id is not null
              and actor.role in ('coordinador_nacional', 'administrador')
            )
            or (
              messages.community_id is not null
              and actor.role in ('animador_comunidad', 'coordinador_comunidad')
              and actor.community_name = communities.name
            )
            or (
              messages.community_id is not null
              and actor.role in ('vocal', 'coordinador_diocesano')
              and actor.province_id = communities.province_id
            )
          )
        )
      )
  );
$$;

grant execute on function public.current_user_can_access_community_message(uuid) to authenticated;

create or replace function public.create_mailbox_message(
  p_target_mode text,
  p_message text,
  p_community_id uuid default null,
  p_province text default null,
  p_role text default null,
  p_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor public.profiles%rowtype;
  selected_province_id uuid;
  selected_community public.communities%rowtype;
  new_id uuid;
begin
  select * into actor from public.profiles where id = auth.uid();

  if actor.id is null or actor.status <> 'aprobado' then
    raise exception 'No autorizado';
  end if;

  if nullif(trim(p_message), '') is null or char_length(trim(p_message)) > 500 then
    raise exception 'El mensaje debe tener entre 1 y 500 caracteres.';
  end if;

  if p_province is not null then
    select id into selected_province_id from public.provinces where name = p_province limit 1;
  end if;

  if p_community_id is not null then
    select * into selected_community from public.communities where id = p_community_id and archived_at is null;
    if selected_community.id is null then
      raise exception 'Comunidad no encontrada.';
    end if;
  end if;

  if p_target_mode = 'my_community' then
    if selected_community.id is null or selected_community.name <> actor.community_name then
      raise exception 'No hay responsables asignados para tu comunidad actualmente.';
    end if;
  elsif p_target_mode = 'community' then
    if actor.role not in ('vocal', 'coordinador_diocesano', 'administrador') then
      raise exception 'No autorizado';
    end if;
    if actor.role in ('vocal', 'coordinador_diocesano') and selected_community.province_id <> actor.province_id then
      raise exception 'No podes enviar mensajes fuera de tu provincia.';
    end if;
  elsif p_target_mode = 'province_communities' then
    if actor.role not in ('vocal', 'coordinador_diocesano', 'administrador') then
      raise exception 'No autorizado';
    end if;
    selected_province_id := coalesce(selected_province_id, actor.province_id);
    if actor.role in ('vocal', 'coordinador_diocesano') and selected_province_id <> actor.province_id then
      raise exception 'No podes enviar mensajes fuera de tu provincia.';
    end if;
  elsif p_target_mode = 'diocesan_leadership' then
    if actor.role not in ('vocal_nacional', 'coordinador_nacional', 'administrador') then
      raise exception 'No autorizado';
    end if;
  elsif p_target_mode in ('all', 'user', 'role', 'province', 'role_province') then
    if actor.role <> 'administrador' then
      raise exception 'Solo Administrador puede usar este destino.';
    end if;
  else
    raise exception 'Destino invalido.';
  end if;

  insert into public.community_contact_messages (
    community_id,
    sender_id,
    sender_name,
    sender_contact,
    message,
    status,
    target_scope,
    target_user_id,
    target_role,
    target_province_id,
    created_at,
    updated_at
  )
  values (
    case when p_target_mode in ('my_community', 'community') then p_community_id else null end,
    auth.uid(),
    coalesce(nullif(trim(actor.full_name), ''), 'Palestrista'),
    null,
    left(trim(p_message), 500),
    'nuevo',
    p_target_mode,
    case when p_target_mode = 'user' then p_user_id else null end,
    case when p_target_mode in ('role', 'role_province') then p_role else null end,
    case when p_target_mode in ('province', 'role_province', 'province_communities', 'diocesan_leadership') then selected_province_id else null end,
    now(),
    now()
  )
  returning id into new_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'create_mailbox_message', jsonb_build_object('message_id', new_id, 'target_mode', p_target_mode));

  return new_id;
end;
$$;

grant execute on function public.create_mailbox_message(text, text, uuid, text, text, uuid) to authenticated;

create or replace function public.get_my_mailbox_messages()
returns table (
  id uuid,
  community_id uuid,
  community_name text,
  province text,
  sender_id uuid,
  sender_name text,
  sender_contact text,
  message text,
  response text,
  status text,
  created_at timestamptz,
  responded_at timestamptz,
  read_at timestamptz,
  closed_at timestamptz,
  can_respond boolean
)
language sql
security definer
set search_path = public
as $$
  select
    messages.id,
    messages.community_id,
    coalesce(communities.name, case
      when messages.target_scope = 'all' then 'Todos los usuarios'
      when messages.target_scope = 'user' then 'Mensaje directo'
      when messages.target_scope = 'role' then 'Rango: ' || coalesce(messages.target_role, '')
      when messages.target_scope = 'province' then 'Provincia'
      when messages.target_scope = 'role_province' then 'Rango y provincia'
      when messages.target_scope = 'diocesan_leadership' then 'Dirigencia diocesana'
      when messages.target_scope = 'province_communities' then 'Comunidades de provincia'
      else 'Mensaje directo'
    end) as community_name,
    coalesce(provinces.name, target_province.name) as province,
    messages.sender_id,
    messages.sender_name,
    messages.sender_contact,
    messages.message,
    messages.response,
    messages.status,
    messages.created_at,
    messages.responded_at,
    messages.read_at,
    messages.closed_at,
    exists (
      select 1
      from public.profiles actor
      where actor.id = auth.uid()
        and actor.status = 'aprobado'
        and messages.sender_id is distinct from auth.uid()
        and public.current_user_can_access_community_message(messages.id)
    ) as can_respond
  from public.community_contact_messages messages
  left join public.communities communities on communities.id = messages.community_id
  left join public.provinces on provinces.id = communities.province_id
  left join public.provinces target_province on target_province.id = messages.target_province_id
  where public.current_user_can_access_community_message(messages.id)
  order by messages.created_at desc;
$$;

grant execute on function public.get_my_mailbox_messages() to authenticated;

create or replace function public.respond_community_contact_message(
  p_message_id uuid,
  p_response text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(trim(p_response), '') is null or char_length(trim(p_response)) > 1000 then
    raise exception 'La respuesta debe tener entre 1 y 1000 caracteres.';
  end if;

  if not public.current_user_can_access_community_message(p_message_id) then
    raise exception 'No autorizado.';
  end if;

  if exists (
    select 1
    from public.community_contact_messages
    where id = p_message_id
      and sender_id = auth.uid()
  ) then
    raise exception 'El remitente no puede responder su propio mensaje desde el buzon.';
  end if;

  update public.community_contact_messages
  set response = left(trim(p_response), 1000),
      responded_by = auth.uid(),
      responded_at = now(),
      status = 'respondido',
      updated_at = now()
  where id = p_message_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'respond_community_contact_message', jsonb_build_object('message_id', p_message_id));
end;
$$;

grant execute on function public.respond_community_contact_message(uuid, text) to authenticated;

alter table public.community_publications
  add column if not exists status text not null default 'activo',
  add column if not exists closed_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists updated_at timestamptz;

alter table public.community_publications
  drop constraint if exists community_publications_status_check;

alter table public.community_publications
  add constraint community_publications_status_check
  check (status in ('activo', 'cerrado'));

create or replace function public.current_user_can_manage_community_publication(p_publication_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_publications publications
    join public.communities communities on communities.id = publications.community_id
    join public.profiles actor on actor.id = auth.uid()
    where publications.id = p_publication_id
      and actor.status = 'aprobado'
      and (
        publications.created_by = auth.uid()
        or actor.role in ('administrador', 'coordinador_nacional', 'vocal_nacional')
        or (
          actor.role in ('vocal', 'coordinador_diocesano')
          and actor.province_id = communities.province_id
        )
      )
  );
$$;

grant execute on function public.current_user_can_manage_community_publication(uuid) to authenticated;

create or replace function public.update_community_publication(
  p_publication_id uuid,
  p_title text,
  p_body text,
  p_status text default 'activo'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_can_manage_community_publication(p_publication_id) then
    raise exception 'No autorizado';
  end if;

  if nullif(trim(p_title), '') is null or nullif(trim(p_body), '') is null then
    raise exception 'Titulo y contenido son obligatorios';
  end if;

  update public.community_publications
  set title = left(trim(p_title), 120),
      body = left(trim(p_body), 2000),
      status = case when p_status = 'cerrado' then 'cerrado' else 'activo' end,
      closed_at = case when p_status = 'cerrado' then now() else null end,
      updated_at = now()
  where id = p_publication_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'update_community_publication', jsonb_build_object('publication_id', p_publication_id, 'status', p_status));
end;
$$;

grant execute on function public.update_community_publication(uuid, text, text, text) to authenticated;

create or replace function public.archive_community_publication(p_publication_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_can_manage_community_publication(p_publication_id) then
    raise exception 'No autorizado';
  end if;

  update public.community_publications
  set archived_at = now(),
      updated_at = now()
  where id = p_publication_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'archive_community_publication', jsonb_build_object('publication_id', p_publication_id));
end;
$$;

grant execute on function public.archive_community_publication(uuid) to authenticated;
