-- Alcance real de noticias, pedidos de confirmacion de mail y coordenadas de comunidades.
-- Ejecutar despues de los parches de roles, solicitudes y comunidades.

alter table public.communities
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

drop function if exists public.get_my_profile();
create or replace function public.get_my_profile()
returns table (
  user_id uuid,
  email text,
  email_confirmed_at timestamptz,
  full_name text,
  avatar_url text,
  phone text,
  province text,
  community_name text,
  status public.user_status,
  role public.user_role,
  display_role_label text,
  gender_preference text
)
language sql
security definer
set search_path = public
as $$
  select
    profiles.id as user_id,
    auth.users.email,
    auth.users.email_confirmed_at,
    profiles.full_name,
    profiles.avatar_url,
    profiles.phone,
    provinces.name as province,
    profiles.community_name,
    profiles.status,
    profiles.role,
    profiles.display_role_label,
    profiles.gender_preference
  from public.profiles
  join auth.users on auth.users.id = profiles.id
  left join public.provinces on provinces.id = profiles.province_id
  where profiles.id = auth.uid()
  limit 1;
$$;

grant execute on function public.get_my_profile() to authenticated;

create or replace function public.admin_update_community(
  p_community_id uuid,
  p_name text,
  p_address text,
  p_phone text,
  p_meeting_day text,
  p_meeting_time text,
  p_description text,
  p_image_url text,
  p_latitude double precision,
  p_longitude double precision
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
    raise exception 'No autorizado para editar esta comunidad';
  end if;

  select name into old_name from public.communities where id = p_community_id;
  if old_name is null then
    raise exception 'Comunidad no encontrada';
  end if;

  new_name := coalesce(nullif(trim(p_name), ''), old_name);

  update public.communities
  set
    name = new_name,
    address = coalesce(nullif(trim(p_address), ''), address),
    phone = nullif(trim(p_phone), ''),
    meeting_day = nullif(trim(p_meeting_day), ''),
    meeting_time = nullif(trim(p_meeting_time), ''),
    description = nullif(trim(p_description), ''),
    image_url = coalesce(nullif(trim(p_image_url), ''), image_url),
    latitude = p_latitude,
    longitude = p_longitude,
    updated_by = auth.uid(),
    updated_at = now()
  where id = p_community_id;

  update public.profiles
  set community_name = new_name
  where community_name = old_name;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_community', jsonb_build_object(
    'community_id', p_community_id,
    'old_name', old_name,
    'new_name', new_name,
    'image_url_changed', nullif(trim(coalesce(p_image_url, '')), '') is not null,
    'latitude', p_latitude,
    'longitude', p_longitude
  ));
end;
$$;

grant execute on function public.admin_update_community(uuid, text, text, text, text, text, text, text, double precision, double precision) to authenticated;

drop function if exists public.admin_create_news(text, text, boolean);
drop function if exists public.admin_create_news(text, text, boolean, text);
create or replace function public.admin_create_news(
  p_title text,
  p_body text,
  p_is_public boolean default true,
  p_province text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor public.profiles%rowtype;
  selected_province_id uuid;
  selected_province_name text;
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  select * into actor
  from public.profiles
  where id = auth.uid()
    and status = 'aprobado';

  if actor.id is null or actor.role not in ('vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador') then
    raise exception 'No autorizado para publicar noticias';
  end if;

  if actor.role in ('vocal', 'coordinador_diocesano') then
    selected_province_id := actor.province_id;
  elsif nullif(trim(coalesce(p_province, '')), '') is not null and lower(trim(p_province)) not in ('nacional', 'argentina', 'todos') then
    select id, name into selected_province_id, selected_province_name
    from public.provinces
    where name = trim(p_province)
    limit 1;

    if selected_province_id is null then
      raise exception 'Provincia no encontrada';
    end if;
  else
    selected_province_id := null;
  end if;

  insert into public.news (title, body, is_public, province_id, created_by)
  values (left(trim(p_title), 120), left(trim(p_body), 2000), coalesce(p_is_public, true), selected_province_id, auth.uid())
  returning id into new_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_create_news', jsonb_build_object(
    'news_id', new_id,
    'title', p_title,
    'scope', case when selected_province_id is null then 'nacional' else 'provincial' end,
    'province_id', selected_province_id
  ));

  return new_id;
end;
$$;

grant execute on function public.admin_create_news(text, text, boolean, text) to authenticated;

create or replace function public.create_email_confirmation_request(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_province text,
  p_community_name text,
  p_contact text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if p_user_id is null then
    raise exception 'Usuario invalido';
  end if;

  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'No autorizado';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Perfil no encontrado. Intenta iniciar sesion nuevamente.';
  end if;

  insert into public.user_requests (user_id, request_type, details)
  values (
    p_user_id,
    'Confirmacion de mail',
    concat_ws(E'\n',
      'El usuario no pudo confirmar el mail y solicita ayuda del Administrador.',
      'Mail: ' || coalesce(nullif(trim(p_email), ''), 'Sin mail'),
      'Nombre: ' || coalesce(nullif(trim(p_full_name), ''), 'Sin nombre'),
      'Provincia: ' || coalesce(nullif(trim(p_province), ''), 'Sin provincia'),
      'Comunidad: ' || coalesce(nullif(trim(p_community_name), ''), 'Sin comunidad'),
      'Contacto: ' || coalesce(nullif(trim(p_contact), ''), 'Sin contacto')
    )
  )
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.create_email_confirmation_request(uuid, text, text, text, text, text) to anon, authenticated;

drop function if exists public.admin_get_requests();
create or replace function public.admin_get_requests()
returns table (
  id uuid,
  user_id uuid,
  title text,
  requester text,
  definition text,
  created_at timestamptz,
  status text,
  admin_message text,
  resolved_at timestamptz,
  resolved_by_name text,
  resolved_by_role text,
  target_user_id uuid,
  target_user_name text,
  target_role text,
  community_name text
)
language sql
security definer
set search_path = public
as $$
  select
    requests.id,
    requests.user_id,
    requests.request_type as title,
    requester.full_name as requester,
    coalesce(requests.details, '') as definition,
    requests.created_at,
    requests.status,
    requests.admin_message,
    requests.resolved_at,
    resolver.full_name as resolved_by_name,
    resolver.role::text as resolved_by_role,
    requests.target_user_id,
    target.full_name as target_user_name,
    requests.target_role::text,
    coalesce(communities.name, requester.community_name) as community_name
  from public.user_requests requests
  join public.profiles requester on requester.id = requests.user_id
  left join public.profiles resolver on resolver.id = requests.resolved_by
  left join public.profiles target on target.id = requests.target_user_id
  left join public.communities on communities.id = requests.community_id
  where exists (
    select 1
    from public.profiles approver
    where approver.id = auth.uid()
      and approver.status = 'aprobado'
      and (
        approver.role = 'administrador'
        or (
          requests.request_type <> 'Confirmacion de mail'
          and approver.role in ('vocal', 'coordinador_diocesano')
          and approver.province_id = requester.province_id
        )
      )
  )
  order by requests.created_at asc;
$$;

grant execute on function public.admin_get_requests() to authenticated;
