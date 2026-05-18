-- Base real para push notifications: tokens con dispositivo activo e intenciones segmentables.
-- No envia notificaciones por si sola. El envio debe hacerlo una Edge Function/backend seguro.

alter table public.device_push_tokens
  add column if not exists device_id text,
  add column if not exists is_active boolean not null default true,
  add column if not exists deactivated_at timestamptz;

create index if not exists device_push_tokens_user_active_idx
on public.device_push_tokens (user_id, is_active);

create or replace function public.register_push_token(
  p_expo_push_token text,
  p_platform text default null,
  p_device_id text default null,
  p_device_name text default null,
  p_app_version text default null,
  p_is_active boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuario no autenticado';
  end if;

  insert into public.device_push_tokens (
    user_id,
    expo_push_token,
    platform,
    device_id,
    device_name,
    app_version,
    is_active,
    deactivated_at,
    last_seen_at
  )
  values (
    auth.uid(),
    p_expo_push_token,
    p_platform,
    p_device_id,
    p_device_name,
    p_app_version,
    coalesce(p_is_active, true),
    case when coalesce(p_is_active, true) then null else now() end,
    now()
  )
  on conflict (expo_push_token)
  do update set
    user_id = excluded.user_id,
    platform = excluded.platform,
    device_id = excluded.device_id,
    device_name = excluded.device_name,
    app_version = excluded.app_version,
    is_active = excluded.is_active,
    deactivated_at = excluded.deactivated_at,
    last_seen_at = now();
end;
$$;

grant execute on function public.register_push_token(text, text, text, text, text, boolean) to authenticated;

alter table public.notification_intents
  add column if not exists target_scope text,
  add column if not exists province text,
  add column if not exists community text,
  add column if not exists min_role text,
  add column if not exists tab_key text,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists sent_at timestamptz;

create index if not exists notification_intents_status_idx
on public.notification_intents (status, created_at);

create or replace function public.create_notification_intent(
  p_notification_type text,
  p_title text,
  p_body text,
  p_target_kind text,
  p_target_value text default null,
  p_target_scope text default null,
  p_province text default null,
  p_community text default null,
  p_min_role text default null,
  p_tab_key text default null,
  p_source_type text default null,
  p_source_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_status text;
  v_intent_id uuid;
begin
  select role, status into v_role, v_status
  from public.profiles
  where id = auth.uid();

  if auth.uid() is null or v_status <> 'aprobado' then
    raise exception 'Usuario no autorizado para notificar';
  end if;

  if v_role not in ('vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador', 'coordinador_comunidad', 'animador_comunidad') then
    raise exception 'Tu rango no puede preparar notificaciones';
  end if;

  insert into public.notification_intents (
    created_by,
    notification_type,
    title,
    body,
    target_kind,
    target_value,
    target_scope,
    province,
    community,
    min_role,
    tab_key,
    source_type,
    source_id,
    payload
  )
  values (
    auth.uid(),
    p_notification_type,
    p_title,
    left(p_body, 220),
    p_target_kind,
    p_target_value,
    p_target_scope,
    p_province,
    p_community,
    p_min_role,
    p_tab_key,
    p_source_type,
    p_source_id,
    jsonb_build_object(
      'source_type', p_source_type,
      'source_id', p_source_id,
      'tab', p_tab_key,
      'target_kind', p_target_kind,
      'target_value', p_target_value,
      'province', p_province,
      'community', p_community,
      'min_role', p_min_role,
      'created_at', now()
    )
  )
  returning id into v_intent_id;

  return v_intent_id;
end;
$$;

grant execute on function public.create_notification_intent(text, text, text, text, text, text, text, text, text, text, text, uuid) to authenticated;
