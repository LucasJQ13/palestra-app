-- Notificaciones reales para mensajes directos del buzon.
-- Crea una intencion push por destinatario con payload navegable.
-- Ejecutar en Supabase SQL Editor antes de validar #112/#113 en APK real.

alter table public.notification_intents
  add column if not exists target_scope text,
  add column if not exists province text,
  add column if not exists community text,
  add column if not exists min_role text,
  add column if not exists tab_key text,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists sent_at timestamptz,
  add column if not exists sent_count integer not null default 0,
  add column if not exists failed_count integer not null default 0,
  add column if not exists processed_at timestamptz;

create index if not exists notification_intents_source_idx
on public.notification_intents (source_type, source_id);

drop function if exists public.create_direct_message_notification_intents(uuid);
create or replace function public.create_direct_message_notification_intents(
  p_message_id uuid
)
returns uuid[]
language plpgsql
security definer
set search_path = public
as $$
declare
  actor public.profiles%rowtype;
  message_row public.direct_messages%rowtype;
  sender_name text;
  intent_ids uuid[];
begin
  if auth.uid() is null then
    raise exception 'Usuario no autenticado.';
  end if;

  select *
  into actor
  from public.profiles
  where id = auth.uid();

  if actor.id is null or actor.status::text <> 'aprobado' or actor.role::text = 'invitado' then
    raise exception 'No autorizado para notificar mensajes.';
  end if;

  select *
  into message_row
  from public.direct_messages
  where id = p_message_id
    and sender_id = auth.uid();

  if message_row.id is null then
    raise exception 'Mensaje no encontrado o no autorizado.';
  end if;

  sender_name := coalesce(
    nullif(trim(actor.full_name), ''),
    nullif(trim(actor.nickname), ''),
    'Palestrista'
  );

  with recipients as (
    select distinct recipients.recipient_id
    from public.direct_message_recipients recipients
    join public.profiles recipient_profile on recipient_profile.id = recipients.recipient_id
    where recipients.message_id = message_row.id
      and recipients.recipient_id is not null
      and recipients.recipient_id <> auth.uid()
      and recipient_profile.status::text = 'aprobado'
      and recipient_profile.role::text <> 'invitado'
  ),
  existing as (
    select intents.id, intents.target_value, intents.status
    from public.notification_intents intents
    join recipients on recipients.recipient_id::text = intents.target_value
    where intents.notification_type = 'mensaje_privado'
      and intents.source_type = 'direct_message'
      and intents.source_id = message_row.id
      and intents.target_kind = 'usuario'
  ),
  inserted as (
    insert into public.notification_intents (
      created_by,
      notification_type,
      title,
      body,
      target_kind,
      target_value,
      target_scope,
      min_role,
      tab_key,
      source_type,
      source_id,
      payload
    )
    select
      auth.uid(),
      'mensaje_privado',
      sender_name,
      left(trim(message_row.body), 220),
      'usuario',
      recipients.recipient_id::text,
      'usuario',
      null,
      'perfil',
      'direct_message',
      message_row.id,
      jsonb_build_object(
        'action', 'open-conversation',
        'conversationId', 'user:' || auth.uid()::text,
        'messageId', message_row.id,
        'senderId', auth.uid(),
        'senderName', sender_name,
        'senderAvatarUrl', nullif(trim(coalesce(actor.avatar_url, '')), ''),
        'fallbackLargeIconAsset', 'assets/notification-icon.png',
        'tab', 'perfil',
        'tabKey', 'perfil',
        'profilePanel', 'buzon',
        'source_type', 'direct_message',
        'source_id', message_row.id,
        'recipientId', recipients.recipient_id,
        'created_at', now()
      )
    from recipients
    where not exists (
      select 1
      from existing
      where existing.target_value = recipients.recipient_id::text
    )
    returning id, target_value
  ),
  all_intents as (
    select id from existing where status in ('pendiente', 'fallida')
    union all
    select id from inserted
  )
  select coalesce(array_agg(id), '{}'::uuid[])
  into intent_ids
  from all_intents;

  return intent_ids;
end;
$$;

grant execute on function public.create_direct_message_notification_intents(uuid) to authenticated;
