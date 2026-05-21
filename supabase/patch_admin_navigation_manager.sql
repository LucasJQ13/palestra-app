-- Gestor visual de navegacion inferior.
-- Ejecutar en Supabase SQL Editor antes de usar la herramienta Navegacion del panel admin.

alter table public.app_tabs
  add column if not exists icon_name text;

update public.app_tabs
set icon_name = case key
  when 'inicio' then 'home-outline'
  when 'notilestra' then 'newspaper-outline'
  when 'materiales' then 'document-text-outline'
  when 'oraciones' then 'heart-outline'
  when 'cancionero' then 'musical-notes-outline'
  when 'himno' then 'flag-outline'
  when 'comunidades' then 'people-outline'
  when 'historia' then 'book-outline'
  when 'contacto' then 'chatbubbles-outline'
  when 'periodo_motivador' then 'flame-outline'
  when 'perfil' then 'person-circle-outline'
  else coalesce(icon_name, 'document-text-outline')
end
where icon_name is null;

create or replace function public.admin_update_tab(
  p_key text,
  p_label text,
  p_is_visible boolean,
  p_visible_roles text[] default null,
  p_icon_name text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  if nullif(trim(p_label), '') is null then
    raise exception 'El nombre visible no puede estar vacio';
  end if;

  update public.app_tabs
  set
    label = trim(p_label),
    icon_name = coalesce(nullif(trim(p_icon_name), ''), icon_name, 'document-text-outline'),
    is_visible = p_is_visible,
    visible_roles = p_visible_roles,
    updated_at = now()
  where key = p_key;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_tab', jsonb_build_object('key', p_key, 'label', p_label, 'is_visible', p_is_visible, 'visible_roles', p_visible_roles, 'icon_name', p_icon_name));
end;
$$;

grant execute on function public.admin_update_tab(text, text, boolean, text[], text) to authenticated;

create or replace function public.admin_create_tab(
  p_key text,
  p_label text,
  p_visible_roles text[] default null,
  p_icon_name text default 'document-text-outline'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  next_order integer;
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  if nullif(trim(p_key), '') is null or nullif(trim(p_label), '') is null then
    raise exception 'Clave interna y nombre visible son obligatorios';
  end if;

  select coalesce(max(sort_order), 0) + 10 into next_order
  from public.app_tabs;

  insert into public.app_tabs (key, label, icon_name, is_visible, sort_order, visible_roles)
  values (trim(p_key), trim(p_label), coalesce(nullif(trim(p_icon_name), ''), 'document-text-outline'), true, next_order, p_visible_roles)
  on conflict (key) do update
  set
    label = excluded.label,
    icon_name = excluded.icon_name,
    is_visible = true,
    visible_roles = excluded.visible_roles,
    updated_at = now();

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_create_tab', jsonb_build_object('key', p_key, 'label', p_label, 'visible_roles', p_visible_roles, 'icon_name', p_icon_name));
end;
$$;

grant execute on function public.admin_create_tab(text, text, text[], text) to authenticated;

create or replace function public.admin_set_tab_position(
  p_key text,
  p_label text,
  p_is_visible boolean,
  p_sort_order integer,
  p_visible_roles text[] default null,
  p_icon_name text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  insert into public.app_tabs (key, label, icon_name, is_visible, sort_order, visible_roles)
  values (p_key, p_label, coalesce(nullif(trim(p_icon_name), ''), 'document-text-outline'), p_is_visible, p_sort_order, p_visible_roles)
  on conflict (key) do update
  set
    label = excluded.label,
    icon_name = excluded.icon_name,
    is_visible = excluded.is_visible,
    sort_order = excluded.sort_order,
    visible_roles = excluded.visible_roles,
    updated_at = now();

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_set_tab_position', jsonb_build_object('key', p_key, 'sort_order', p_sort_order, 'icon_name', p_icon_name));
end;
$$;

grant execute on function public.admin_set_tab_position(text, text, boolean, integer, text[], text) to authenticated;

create or replace function public.admin_delete_tab(p_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  if p_key in ('inicio', 'perfil') then
    raise exception 'Esta seccion es critica y no puede eliminarse';
  end if;

  if p_key in ('notilestra', 'materiales', 'oraciones', 'cancionero', 'himno', 'comunidades', 'historia', 'contacto', 'periodo_motivador') then
    raise exception 'Esta seccion base puede ocultarse, pero no eliminarse';
  end if;

  delete from public.app_tabs where key = p_key;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_delete_tab', jsonb_build_object('key', p_key));
end;
$$;

grant execute on function public.admin_delete_tab(text) to authenticated;

create or replace function public.admin_restore_default_tabs()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  insert into public.app_tabs (key, label, icon_name, is_visible, sort_order, visible_roles)
  values
    ('inicio', 'Inicio', 'home-outline', true, 10, null),
    ('notilestra', 'Notilestra', 'newspaper-outline', true, 20, null),
    ('materiales', 'Materiales', 'document-text-outline', true, 30, null),
    ('oraciones', 'Oraciones', 'heart-outline', true, 40, array['palestrista','sedimentador','animador_comunidad','coordinador_comunidad','vocal','coordinador_diocesano','asesor','vocal_nacional','coordinador_nacional','administrador']),
    ('cancionero', 'Cancionero', 'musical-notes-outline', true, 50, array['palestrista','sedimentador','animador_comunidad','coordinador_comunidad','vocal','coordinador_diocesano','asesor','vocal_nacional','coordinador_nacional','administrador']),
    ('himno', 'Himno', 'flag-outline', true, 60, array['palestrista','sedimentador','animador_comunidad','coordinador_comunidad','vocal','coordinador_diocesano','asesor','vocal_nacional','coordinador_nacional','administrador']),
    ('comunidades', 'Comunidades', 'people-outline', true, 70, null),
    ('historia', 'Historia', 'book-outline', true, 80, null),
    ('contacto', 'Contacto', 'chatbubbles-outline', true, 90, null),
    ('periodo_motivador', 'PM', 'flame-outline', true, 100, array['sedimentador','animador_comunidad','coordinador_comunidad','vocal','coordinador_diocesano','asesor','vocal_nacional','coordinador_nacional','administrador']),
    ('perfil', 'Perfil', 'person-circle-outline', true, 110, null)
  on conflict (key) do update
  set
    label = excluded.label,
    icon_name = excluded.icon_name,
    is_visible = excluded.is_visible,
    sort_order = excluded.sort_order,
    visible_roles = excluded.visible_roles,
    updated_at = now();

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_restore_default_tabs', '{}'::jsonb);
end;
$$;

grant execute on function public.admin_restore_default_tabs() to authenticated;
