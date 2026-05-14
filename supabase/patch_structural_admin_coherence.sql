alter table public.app_tabs
add column if not exists visible_roles text[];

create or replace function public.admin_update_tab(
  p_key text,
  p_label text,
  p_is_visible boolean,
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

  update public.app_tabs
  set
    label = p_label,
    is_visible = p_is_visible,
    visible_roles = p_visible_roles,
    updated_at = now()
  where key = p_key;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_tab', jsonb_build_object('key', p_key, 'label', p_label, 'is_visible', p_is_visible, 'visible_roles', p_visible_roles));
end;
$$;

grant execute on function public.admin_update_tab(text, text, boolean, text[]) to authenticated;

create or replace function public.admin_create_tab(
  p_key text,
  p_label text,
  p_visible_roles text[] default null
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

  select coalesce(max(sort_order), 0) + 10 into next_order
  from public.app_tabs;

  insert into public.app_tabs (key, label, is_visible, sort_order, visible_roles)
  values (p_key, p_label, true, next_order, p_visible_roles)
  on conflict (key) do update
  set
    label = excluded.label,
    is_visible = true,
    visible_roles = excluded.visible_roles,
    updated_at = now();

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_create_tab', jsonb_build_object('key', p_key, 'label', p_label, 'visible_roles', p_visible_roles));
end;
$$;

grant execute on function public.admin_create_tab(text, text, text[]) to authenticated;

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
set search_path = public, extensions
as $$
declare
  selected_province_id uuid;
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  select id into selected_province_id
  from public.provinces
  where name = p_province
  limit 1;

  update auth.users
  set
    email = coalesce(nullif(trim(p_email), ''), email),
    encrypted_password = case
      when nullif(p_password, '') is null then encrypted_password
      else extensions.crypt(p_password, extensions.gen_salt('bf'))
    end,
    updated_at = now()
  where id = p_profile_id;

  update public.profiles
  set
    full_name = nullif(trim(p_full_name), ''),
    phone = nullif(trim(p_phone), ''),
    province_id = selected_province_id,
    community_name = nullif(trim(p_community_name), ''),
    status = p_status::public.user_status,
    role = p_role::public.user_role,
    approved_at = case when p_status = 'aprobado' then coalesce(approved_at, now()) else approved_at end,
    approved_by = case when p_status = 'aprobado' then coalesce(approved_by, auth.uid()) else approved_by end
  where id = p_profile_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_user', jsonb_build_object('profile_id', p_profile_id, 'status', p_status, 'role', p_role));
end;
$$;

grant execute on function public.admin_update_user(uuid, text, text, text, text, text, text, text, text) to authenticated;
