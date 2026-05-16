-- Control de accesos desde administracion e Instagram editable por coordinacion nacional.

create or replace function public.admin_set_tab_position(
  p_key text,
  p_label text,
  p_is_visible boolean,
  p_sort_order integer,
  p_visible_roles text[] default null
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

  insert into public.app_tabs (key, label, is_visible, sort_order, visible_roles)
  values (p_key, p_label, p_is_visible, p_sort_order, p_visible_roles)
  on conflict (key) do update
  set
    label = excluded.label,
    is_visible = excluded.is_visible,
    sort_order = excluded.sort_order,
    visible_roles = excluded.visible_roles,
    updated_at = now();

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_set_tab_position', jsonb_build_object('key', p_key, 'sort_order', p_sort_order));
end;
$$;

grant execute on function public.admin_set_tab_position(text, text, boolean, integer, text[]) to authenticated;

create or replace function public.admin_update_instagram(p_instagram text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_role text;
  next_config jsonb;
begin
  select role::text into current_role
  from public.profiles
  where id = auth.uid()
    and status = 'aprobado';

  if current_role not in ('coordinador_nacional', 'administrador') then
    raise exception 'No autorizado';
  end if;

  select jsonb_set(
    coalesce(config, '{}'::jsonb),
    '{contact,instagram}',
    to_jsonb(nullif(trim(p_instagram), '')),
    true
  )
  into next_config
  from public.admin_config
  where id = true;

  insert into public.admin_config (id, config, updated_by, updated_at)
  values (true, coalesce(next_config, jsonb_build_object('contact', jsonb_build_object('instagram', p_instagram))), auth.uid(), now())
  on conflict (id) do update
  set
    config = excluded.config,
    updated_by = excluded.updated_by,
    updated_at = now();

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_instagram', jsonb_build_object('instagram', p_instagram));
end;
$$;

grant execute on function public.admin_update_instagram(text) to authenticated;

update public.admin_config
set
  config = jsonb_set(
    coalesce(config, '{}'::jsonb),
    '{contact,instagram}',
    to_jsonb('https://www.instagram.com/infopalestra.argentina?igsh=MXB2aGcwZG9qeGpvOA=='::text),
    true
  ),
  updated_at = now()
where id = true;
