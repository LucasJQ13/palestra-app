alter table public.news
  add column if not exists image_url text;

create or replace function public.admin_create_news(
  p_title text,
  p_body text,
  p_is_public boolean default true,
  p_province text default null,
  p_image_url text default null
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

  if nullif(trim(p_title), '') is null or nullif(trim(p_body), '') is null then
    raise exception 'Completa titulo y contenido';
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

  insert into public.news (title, body, image_url, is_public, province_id, created_by)
  values (
    left(trim(p_title), 120),
    left(trim(p_body), 2000),
    nullif(trim(coalesce(p_image_url, '')), ''),
    coalesce(p_is_public, true),
    selected_province_id,
    auth.uid()
  )
  returning id into new_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_create_news', jsonb_build_object(
    'news_id', new_id,
    'title', p_title,
    'has_image', nullif(trim(coalesce(p_image_url, '')), '') is not null,
    'scope', case when selected_province_id is null then 'nacional' else 'provincial' end,
    'province_id', selected_province_id
  ));

  return new_id;
end;
$$;

grant execute on function public.admin_create_news(text, text, boolean, text, text) to authenticated;

create or replace function public.admin_update_news(
  p_news_id uuid,
  p_title text,
  p_body text,
  p_image_url text default null,
  p_is_public boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_can_manage_published_content() then
    raise exception 'No autorizado para editar publicaciones';
  end if;

  if nullif(trim(p_title), '') is null or nullif(trim(p_body), '') is null then
    raise exception 'Completa titulo y contenido';
  end if;

  update public.news
  set title = trim(p_title),
      body = trim(p_body),
      image_url = nullif(trim(coalesce(p_image_url, '')), ''),
      is_public = p_is_public,
      updated_at = now()
  where id = p_news_id
    and archived_at is null;

  if not found then
    raise exception 'Publicacion no encontrada';
  end if;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_news', jsonb_build_object(
    'news_id', p_news_id,
    'has_image', nullif(trim(coalesce(p_image_url, '')), '') is not null
  ));
end;
$$;

grant execute on function public.admin_update_news(uuid, text, text, text, boolean) to authenticated;
