alter table public.profiles
add column if not exists last_profile_edit_at timestamptz;

alter table public.app_content
add column if not exists blocks jsonb not null default '[]'::jsonb;

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
  last_edit timestamptz;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  select profiles.last_profile_edit_at
  into last_edit
  from public.profiles
  where profiles.id = auth.uid();

  if last_edit is not null and last_edit > now() - interval '5 days' then
    raise exception 'El perfil solo puede editarse una vez cada 5 dias';
  end if;

  select id
  into selected_province_id
  from public.provinces
  where name = p_province
  limit 1;

  if selected_province_id is null then
    raise exception 'Provincia no encontrada';
  end if;

  update public.profiles
  set
    full_name = nullif(trim(p_full_name), ''),
    phone = nullif(trim(p_phone), ''),
    province_id = selected_province_id,
    community_name = nullif(trim(p_community_name), ''),
    last_profile_edit_at = now()
  where id = auth.uid();
end;
$$;

grant execute on function public.update_my_profile(text, text, text, text) to authenticated;

create or replace function public.admin_update_community(
  p_community_id uuid,
  p_name text,
  p_address text,
  p_phone text,
  p_meeting_day text,
  p_meeting_time text,
  p_description text
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
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  select name into old_name from public.communities where id = p_community_id;
  new_name := coalesce(nullif(trim(p_name), ''), old_name);

  update public.communities
  set
    name = new_name,
    address = coalesce(nullif(trim(p_address), ''), address),
    phone = nullif(trim(p_phone), ''),
    meeting_day = nullif(trim(p_meeting_day), ''),
    meeting_time = nullif(trim(p_meeting_time), ''),
    description = nullif(trim(p_description), '')
  where id = p_community_id;

  update public.profiles
  set community_name = new_name
  where community_name = old_name;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_community', jsonb_build_object('community_id', p_community_id, 'old_name', old_name, 'new_name', new_name));
end;
$$;

grant execute on function public.admin_update_community(uuid, text, text, text, text, text, text) to authenticated;

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
  if not public.current_user_is_admin() then
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
