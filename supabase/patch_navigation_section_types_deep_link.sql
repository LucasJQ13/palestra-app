-- Navegacion dinamica con tipos reales de seccion.
-- Ejecutar en Supabase SQL Editor antes de crear secciones nuevas por tipo.
-- Es retrocompatible: conserva las firmas RPC anteriores y agrega nuevas firmas con p_section_type.

alter table public.app_tabs
  add column if not exists section_type text not null default 'simple';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'app_tabs_section_type_check'
      and conrelid = 'public.app_tabs'::regclass
  ) then
    alter table public.app_tabs
      add constraint app_tabs_section_type_check
      check (section_type in ('simple', 'library', 'links', 'image_text', 'form', 'internal'));
  end if;
end;
$$;

update public.app_tabs
set section_type = 'internal'
where key in (
  'inicio',
  'notilestra',
  'materiales',
  'oraciones',
  'cancionero',
  'himno',
  'comunidades',
  'historia',
  'contacto',
  'periodo_motivador',
  'perfil'
);

create or replace function public.admin_update_tab(
  p_key text,
  p_label text,
  p_is_visible boolean,
  p_visible_roles text[],
  p_icon_name text,
  p_section_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_type text := coalesce(nullif(trim(p_section_type), ''), 'simple');
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  if nullif(trim(p_label), '') is null then
    raise exception 'El nombre visible no puede estar vacio';
  end if;

  if normalized_type not in ('simple', 'library', 'links', 'image_text', 'form', 'internal') then
    raise exception 'Tipo de seccion invalido';
  end if;

  update public.app_tabs
  set
    label = trim(p_label),
    icon_name = coalesce(nullif(trim(p_icon_name), ''), icon_name, 'document-text-outline'),
    section_type = normalized_type,
    is_visible = p_is_visible,
    visible_roles = p_visible_roles,
    updated_at = now()
  where key = p_key;

  insert into public.audit_logs (actor_id, action, metadata)
  values (
    auth.uid(),
    'admin_update_tab',
    jsonb_build_object('key', p_key, 'label', p_label, 'is_visible', p_is_visible, 'visible_roles', p_visible_roles, 'icon_name', p_icon_name, 'section_type', normalized_type)
  );
end;
$$;

grant execute on function public.admin_update_tab(text, text, boolean, text[], text, text) to authenticated;

create or replace function public.admin_create_tab(
  p_key text,
  p_label text,
  p_visible_roles text[],
  p_icon_name text,
  p_section_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  next_order integer;
  normalized_type text := coalesce(nullif(trim(p_section_type), ''), 'simple');
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  if nullif(trim(p_key), '') is null or nullif(trim(p_label), '') is null then
    raise exception 'Clave interna y nombre visible son obligatorios';
  end if;

  if normalized_type not in ('simple', 'library', 'links', 'image_text', 'form', 'internal') then
    raise exception 'Tipo de seccion invalido';
  end if;

  select coalesce(max(sort_order), 0) + 10 into next_order
  from public.app_tabs;

  insert into public.app_tabs (key, label, icon_name, section_type, is_visible, sort_order, visible_roles)
  values (trim(p_key), trim(p_label), coalesce(nullif(trim(p_icon_name), ''), 'document-text-outline'), normalized_type, true, next_order, p_visible_roles)
  on conflict (key) do update
  set
    label = excluded.label,
    icon_name = excluded.icon_name,
    section_type = excluded.section_type,
    is_visible = true,
    visible_roles = excluded.visible_roles,
    updated_at = now();

  insert into public.audit_logs (actor_id, action, metadata)
  values (
    auth.uid(),
    'admin_create_tab',
    jsonb_build_object('key', p_key, 'label', p_label, 'visible_roles', p_visible_roles, 'icon_name', p_icon_name, 'section_type', normalized_type)
  );
end;
$$;

grant execute on function public.admin_create_tab(text, text, text[], text, text) to authenticated;

create or replace function public.admin_set_tab_position(
  p_key text,
  p_label text,
  p_is_visible boolean,
  p_sort_order integer,
  p_visible_roles text[],
  p_icon_name text,
  p_section_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_type text := coalesce(nullif(trim(p_section_type), ''), 'simple');
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  if normalized_type not in ('simple', 'library', 'links', 'image_text', 'form', 'internal') then
    raise exception 'Tipo de seccion invalido';
  end if;

  insert into public.app_tabs (key, label, icon_name, section_type, is_visible, sort_order, visible_roles)
  values (p_key, p_label, coalesce(nullif(trim(p_icon_name), ''), 'document-text-outline'), normalized_type, p_is_visible, p_sort_order, p_visible_roles)
  on conflict (key) do update
  set
    label = excluded.label,
    icon_name = excluded.icon_name,
    section_type = excluded.section_type,
    is_visible = excluded.is_visible,
    sort_order = excluded.sort_order,
    visible_roles = excluded.visible_roles,
    updated_at = now();

  insert into public.audit_logs (actor_id, action, metadata)
  values (
    auth.uid(),
    'admin_set_tab_position',
    jsonb_build_object('key', p_key, 'sort_order', p_sort_order, 'icon_name', p_icon_name, 'section_type', normalized_type)
  );
end;
$$;

grant execute on function public.admin_set_tab_position(text, text, boolean, integer, text[], text, text) to authenticated;

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

  insert into public.app_tabs (key, label, icon_name, section_type, is_visible, sort_order, visible_roles)
  values
    ('inicio', 'Inicio', 'home-outline', 'internal', true, 10, null),
    ('notilestra', 'Notilestra', 'newspaper-outline', 'internal', true, 20, null),
    ('materiales', 'Materiales', 'document-text-outline', 'internal', true, 30, null),
    ('oraciones', 'Oraciones', 'heart-outline', 'internal', true, 40, array['palestrista','sedimentador','animador_comunidad','coordinador_comunidad','vocal','coordinador_diocesano','asesor','vocal_nacional','coordinador_nacional','administrador']),
    ('cancionero', 'Cancionero', 'musical-notes-outline', 'internal', true, 50, array['palestrista','sedimentador','animador_comunidad','coordinador_comunidad','vocal','coordinador_diocesano','asesor','vocal_nacional','coordinador_nacional','administrador']),
    ('himno', 'Himno', 'flag-outline', 'internal', true, 60, array['palestrista','sedimentador','animador_comunidad','coordinador_comunidad','vocal','coordinador_diocesano','asesor','vocal_nacional','coordinador_nacional','administrador']),
    ('comunidades', 'Comunidades', 'people-outline', 'internal', true, 70, null),
    ('historia', 'Historia', 'book-outline', 'internal', true, 80, null),
    ('contacto', 'Contacto', 'chatbubbles-outline', 'internal', true, 90, null),
    ('periodo_motivador', 'PM', 'flame-outline', 'internal', true, 100, array['sedimentador','animador_comunidad','coordinador_comunidad','vocal','coordinador_diocesano','asesor','vocal_nacional','coordinador_nacional','administrador']),
    ('perfil', 'Perfil', 'person-circle-outline', 'internal', true, 110, null)
  on conflict (key) do update
  set
    label = excluded.label,
    icon_name = excluded.icon_name,
    section_type = excluded.section_type,
    is_visible = excluded.is_visible,
    sort_order = excluded.sort_order,
    visible_roles = excluded.visible_roles,
    updated_at = now();

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_restore_default_tabs', '{}'::jsonb);
end;
$$;

grant execute on function public.admin_restore_default_tabs() to authenticated;
