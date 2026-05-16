-- Permisos Beta para contenido editable, noticias y eventos.
-- Alinea las RPC reales con los permisos que la app ya muestra en la interfaz.

create or replace function public.current_user_can_edit_app_content(p_tab_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'aprobado'
      and (
        profiles.role = 'administrador'
        or (
          p_tab_key in ('historia', 'contacto')
          and profiles.role in ('coordinador_nacional', 'administrador')
        )
        or (
          p_tab_key = 'himno'
          and profiles.role = 'administrador'
        )
        or (
          p_tab_key in ('inicio', 'notilestra', 'materiales', 'oraciones', 'cancionero', 'comunidades', 'periodo_motivador')
          and profiles.role in ('vocal', 'asesor', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador')
        )
      )
  )
$$;

grant execute on function public.current_user_can_edit_app_content(text) to authenticated;

create or replace function public.admin_update_app_content(
  p_tab_key text,
  p_title text,
  p_body text,
  p_blocks jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_can_edit_app_content(p_tab_key) then
    raise exception 'No autorizado';
  end if;

  insert into public.app_content (tab_key, title, body, blocks, updated_by, updated_at)
  values (p_tab_key, p_title, p_body, coalesce(p_blocks, '[]'::jsonb), auth.uid(), now())
  on conflict (tab_key) do update
  set
    title = excluded.title,
    body = excluded.body,
    blocks = excluded.blocks,
    updated_by = excluded.updated_by,
    updated_at = now();

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_app_content', jsonb_build_object('tab_key', p_tab_key, 'title', p_title));
end;
$$;

grant execute on function public.admin_update_app_content(text, text, text, jsonb) to authenticated;

create or replace function public.admin_create_news(
  p_title text,
  p_body text,
  p_is_public boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  actor_role public.user_role;
  actor_province_id uuid;
begin
  select role, province_id
  into actor_role, actor_province_id
  from public.profiles
  where id = auth.uid()
    and status = 'aprobado';

  if actor_role not in ('administrador', 'vocal', 'asesor', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional') then
    raise exception 'No autorizado';
  end if;

  insert into public.news (title, body, province_id, is_public, created_by)
  values (
    p_title,
    p_body,
    case when actor_role in ('vocal', 'asesor', 'coordinador_diocesano') then actor_province_id else null end,
    p_is_public,
    auth.uid()
  )
  returning id into new_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_create_news', jsonb_build_object('title', p_title));

  return new_id;
end;
$$;

grant execute on function public.admin_create_news(text, text, boolean) to authenticated;

create or replace function public.admin_create_event(
  p_title text,
  p_description text,
  p_starts_at timestamptz,
  p_is_public boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  actor_role public.user_role;
  actor_province_id uuid;
begin
  select role, province_id
  into actor_role, actor_province_id
  from public.profiles
  where id = auth.uid()
    and status = 'aprobado';

  if actor_role not in ('administrador', 'vocal', 'asesor', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional') then
    raise exception 'No autorizado';
  end if;

  insert into public.events (title, description, starts_at, province_id, is_public, created_by)
  values (
    p_title,
    p_description,
    p_starts_at,
    case when actor_role in ('vocal', 'asesor', 'coordinador_diocesano') then actor_province_id else null end,
    p_is_public,
    auth.uid()
  )
  returning id into new_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_create_event', jsonb_build_object('title', p_title, 'starts_at', p_starts_at));

  return new_id;
end;
$$;

grant execute on function public.admin_create_event(text, text, timestamptz, boolean) to authenticated;

drop policy if exists "Administradores suben imagenes de contenido" on storage.objects;
create policy "Administradores suben imagenes de contenido"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'content-images'
  and public.current_user_can_edit_app_content((storage.foldername(name))[1])
);

drop policy if exists "Administradores actualizan imagenes de contenido" on storage.objects;
create policy "Administradores actualizan imagenes de contenido"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'content-images'
  and public.current_user_can_edit_app_content((storage.foldername(name))[1])
)
with check (
  bucket_id = 'content-images'
  and public.current_user_can_edit_app_content((storage.foldername(name))[1])
);
