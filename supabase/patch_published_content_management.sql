alter table public.news
  add column if not exists updated_at timestamptz,
  add column if not exists archived_at timestamptz;

alter table public.events
  add column if not exists updated_at timestamptz,
  add column if not exists archived_at timestamptz;

create or replace function public.current_user_can_manage_published_content()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'aprobado'
      and role in ('vocal_nacional', 'coordinador_nacional', 'administrador')
  );
$$;

grant execute on function public.current_user_can_manage_published_content() to authenticated;

create or replace function public.admin_update_news(
  p_news_id uuid,
  p_title text,
  p_body text,
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
      is_public = p_is_public,
      updated_at = now()
  where id = p_news_id
    and archived_at is null;

  if not found then
    raise exception 'Publicacion no encontrada';
  end if;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_news', jsonb_build_object('news_id', p_news_id));
end;
$$;

grant execute on function public.admin_update_news(uuid, text, text, boolean) to authenticated;

create or replace function public.admin_archive_news(p_news_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_can_manage_published_content() then
    raise exception 'No autorizado para eliminar publicaciones';
  end if;

  update public.news
  set archived_at = now(),
      updated_at = now()
  where id = p_news_id
    and archived_at is null;

  if not found then
    raise exception 'Publicacion no encontrada';
  end if;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_archive_news', jsonb_build_object('news_id', p_news_id));
end;
$$;

grant execute on function public.admin_archive_news(uuid) to authenticated;

create or replace function public.admin_update_event(
  p_event_id uuid,
  p_title text,
  p_description text,
  p_starts_at timestamptz,
  p_is_public boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_can_manage_published_content() then
    raise exception 'No autorizado para editar eventos';
  end if;

  if nullif(trim(p_title), '') is null or nullif(trim(p_description), '') is null then
    raise exception 'Completa titulo y contenido';
  end if;

  update public.events
  set title = trim(p_title),
      description = trim(p_description),
      starts_at = p_starts_at,
      is_public = p_is_public,
      updated_at = now()
  where id = p_event_id
    and archived_at is null;

  if not found then
    raise exception 'Entrada no encontrada';
  end if;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_event', jsonb_build_object('event_id', p_event_id));
end;
$$;

grant execute on function public.admin_update_event(uuid, text, text, timestamptz, boolean) to authenticated;

create or replace function public.admin_archive_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_can_manage_published_content() then
    raise exception 'No autorizado para eliminar eventos';
  end if;

  update public.events
  set archived_at = now(),
      updated_at = now()
  where id = p_event_id
    and archived_at is null;

  if not found then
    raise exception 'Entrada no encontrada';
  end if;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_archive_event', jsonb_build_object('event_id', p_event_id));
end;
$$;

grant execute on function public.admin_archive_event(uuid) to authenticated;
