-- Sistema de mensajeria bilateral entre usuarios registrados.
-- Mantiene compatibilidad con community_contact_messages y agrega mensajes directos con borrado por participante.

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  subject text,
  body text not null check (char_length(body) between 1 and 1000),
  sender_deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.direct_message_recipients (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.direct_messages(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (message_id, recipient_id)
);

create index if not exists direct_messages_sender_created_idx
  on public.direct_messages (sender_id, created_at desc);

create index if not exists direct_message_recipients_recipient_created_idx
  on public.direct_message_recipients (recipient_id, created_at desc);

alter table public.direct_messages enable row level security;
alter table public.direct_message_recipients enable row level security;

drop policy if exists "Direct messages visible to participants" on public.direct_messages;
create policy "Direct messages visible to participants"
on public.direct_messages
for select
to authenticated
using (
  sender_id = auth.uid()
  or exists (
    select 1
    from public.direct_message_recipients r
    where r.message_id = direct_messages.id
      and r.recipient_id = auth.uid()
  )
);

drop policy if exists "Direct recipients visible to participants" on public.direct_message_recipients;
create policy "Direct recipients visible to participants"
on public.direct_message_recipients
for select
to authenticated
using (
  recipient_id = auth.uid()
  or exists (
    select 1
    from public.direct_messages m
    where m.id = direct_message_recipients.message_id
      and m.sender_id = auth.uid()
  )
);

alter table public.community_contact_messages
  add column if not exists sender_deleted_at timestamptz,
  add column if not exists recipient_deleted_at timestamptz;

drop function if exists public.send_direct_message(uuid[], text, text);
create or replace function public.send_direct_message(
  p_recipient_ids uuid[],
  p_body text,
  p_subject text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor public.profiles%rowtype;
  new_id uuid;
  recipient_count integer;
begin
  select * into actor
  from public.profiles
  where id = auth.uid();

  if actor.id is null or actor.status::text <> 'aprobado' or actor.role::text = 'invitado' then
    raise exception 'No autorizado';
  end if;

  if nullif(trim(p_body), '') is null or char_length(trim(p_body)) > 1000 then
    raise exception 'El mensaje debe tener entre 1 y 1000 caracteres.';
  end if;

  if p_recipient_ids is null or cardinality(p_recipient_ids) = 0 then
    raise exception 'Selecciona al menos un destinatario.';
  end if;

  with requested as (
    select distinct recipient_id
    from unnest(p_recipient_ids) as requested(recipient_id)
    where recipient_id is not null
      and recipient_id <> auth.uid()
  ),
  valid as (
    select requested.recipient_id
    from requested
    join public.profiles p on p.id = requested.recipient_id
    where p.status::text = 'aprobado'
      and p.role::text <> 'invitado'
  )
  select count(*) into recipient_count from valid;

  if recipient_count = 0 then
    raise exception 'No hay destinatarios validos.';
  end if;

  insert into public.direct_messages (sender_id, subject, body)
  values (auth.uid(), nullif(trim(coalesce(p_subject, '')), ''), left(trim(p_body), 1000))
  returning id into new_id;

  insert into public.direct_message_recipients (message_id, recipient_id)
  select new_id, valid.recipient_id
  from (
    select distinct requested.recipient_id
    from unnest(p_recipient_ids) as requested(recipient_id)
    join public.profiles p on p.id = requested.recipient_id
    where requested.recipient_id is not null
      and requested.recipient_id <> auth.uid()
      and p.status::text = 'aprobado'
      and p.role::text <> 'invitado'
  ) valid;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'send_direct_message', jsonb_build_object('message_id', new_id, 'recipient_count', recipient_count));

  return new_id;
end;
$$;

grant execute on function public.send_direct_message(uuid[], text, text) to authenticated;

drop function if exists public.get_my_mailbox_messages();
create or replace function public.get_my_mailbox_messages()
returns table (
  source text,
  mailbox_folder text,
  id uuid,
  community_id uuid,
  community_name text,
  province text,
  sender_id uuid,
  sender_name text,
  sender_contact text,
  recipient_id uuid,
  recipient_name text,
  recipient_names text,
  subject text,
  message text,
  response text,
  status text,
  created_at timestamptz,
  responded_at timestamptz,
  read_at timestamptz,
  closed_at timestamptz,
  deleted_at timestamptz,
  can_respond boolean
)
language sql
security definer
set search_path = public
as $$
  with direct_received as (
    select
      'direct'::text as source,
      case when r.deleted_at is null then 'entrada' else 'eliminados' end as mailbox_folder,
      m.id,
      null::uuid as community_id,
      'Mensaje directo'::text as community_name,
      sender_province.name::text as province,
      m.sender_id,
      coalesce(sender.full_name, sender.nickname, 'Palestrista')::text as sender_name,
      null::text as sender_contact,
      r.recipient_id,
      coalesce(recipient.full_name, recipient.nickname, 'Palestrista')::text as recipient_name,
      null::text as recipient_names,
      m.subject,
      m.body as message,
      null::text as response,
      case when r.read_at is null then 'nuevo' else 'leido' end::text as status,
      m.created_at,
      null::timestamptz as responded_at,
      r.read_at,
      null::timestamptz as closed_at,
      r.deleted_at,
      false as can_respond
    from public.direct_message_recipients r
    join public.direct_messages m on m.id = r.message_id
    join public.profiles sender on sender.id = m.sender_id
    left join public.provinces sender_province on sender_province.id = sender.province_id
    join public.profiles recipient on recipient.id = r.recipient_id
    where r.recipient_id = auth.uid()
  ),
  direct_sent as (
    select
      'direct'::text as source,
      case when m.sender_deleted_at is null then 'enviados' else 'eliminados' end as mailbox_folder,
      m.id,
      null::uuid as community_id,
      'Mensaje directo'::text as community_name,
      sender_province.name::text as province,
      m.sender_id,
      coalesce(sender.full_name, sender.nickname, 'Palestrista')::text as sender_name,
      null::text as sender_contact,
      null::uuid as recipient_id,
      null::text as recipient_name,
      string_agg(coalesce(recipient.full_name, recipient.nickname, 'Palestrista'), ', ' order by recipient.full_name)::text as recipient_names,
      m.subject,
      m.body as message,
      null::text as response,
      'enviado'::text as status,
      m.created_at,
      null::timestamptz as responded_at,
      max(r.read_at) as read_at,
      null::timestamptz as closed_at,
      m.sender_deleted_at as deleted_at,
      false as can_respond
    from public.direct_messages m
    join public.profiles sender on sender.id = m.sender_id
    left join public.provinces sender_province on sender_province.id = sender.province_id
    join public.direct_message_recipients r on r.message_id = m.id
    join public.profiles recipient on recipient.id = r.recipient_id
    where m.sender_id = auth.uid()
    group by m.id, sender_province.name, sender.full_name, sender.nickname
  ),
  legacy_messages as (
    select
      'community'::text as source,
      case
        when messages.sender_id = auth.uid() and messages.sender_deleted_at is not null then 'eliminados'
        when messages.sender_id = auth.uid() then 'enviados'
        when messages.recipient_deleted_at is not null then 'eliminados'
        else 'entrada'
      end as mailbox_folder,
      messages.id,
      messages.community_id,
      coalesce(communities.name, case
        when messages.target_scope = 'all' then 'Todos los usuarios'
        when messages.target_scope = 'user' then 'Mensaje directo'
        when messages.target_scope = 'role' then 'Rango: ' || coalesce(messages.target_role, '')
        when messages.target_scope = 'province' then 'Provincia'
        when messages.target_scope = 'role_province' then 'Rango y provincia'
        when messages.target_scope = 'diocesan_leadership' then 'Dirigencia diocesana'
        when messages.target_scope = 'province_communities' then 'Comunidades de provincia'
        else 'Mensaje directo'
      end)::text as community_name,
      coalesce(provinces.name, target_province.name)::text as province,
      messages.sender_id,
      messages.sender_name,
      messages.sender_contact,
      messages.target_user_id as recipient_id,
      coalesce(target_profile.full_name, target_profile.nickname)::text as recipient_name,
      coalesce(target_profile.full_name, target_profile.nickname)::text as recipient_names,
      null::text as subject,
      messages.message,
      messages.response,
      messages.status,
      messages.created_at,
      messages.responded_at,
      messages.read_at,
      messages.closed_at,
      case when messages.sender_id = auth.uid() then messages.sender_deleted_at else messages.recipient_deleted_at end as deleted_at,
      exists (
        select 1
        from public.profiles actor
        where actor.id = auth.uid()
          and actor.status::text = 'aprobado'
          and messages.sender_id is distinct from auth.uid()
          and public.current_user_can_access_community_message(messages.id)
      ) as can_respond
    from public.community_contact_messages messages
    left join public.communities communities on communities.id = messages.community_id
    left join public.provinces on provinces.id = communities.province_id
    left join public.provinces target_province on target_province.id = messages.target_province_id
    left join public.profiles target_profile on target_profile.id = messages.target_user_id
    where public.current_user_can_access_community_message(messages.id)
  )
  select * from direct_received
  union all
  select * from direct_sent
  union all
  select * from legacy_messages
  order by created_at desc;
$$;

grant execute on function public.get_my_mailbox_messages() to authenticated;

drop function if exists public.mark_message_as_read(uuid, text);
create or replace function public.mark_message_as_read(
  p_message_id uuid,
  p_source text default 'direct'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_source = 'direct' then
    update public.direct_message_recipients
    set read_at = coalesce(read_at, now())
    where message_id = p_message_id
      and recipient_id = auth.uid();

    if not found then
      raise exception 'No autorizado.';
    end if;
    return;
  end if;

  if not public.current_user_can_access_community_message(p_message_id) then
    raise exception 'No autorizado.';
  end if;

  update public.community_contact_messages
  set status = case when status = 'nuevo' then 'leido' else status end,
      read_at = coalesce(read_at, now()),
      updated_at = now()
  where id = p_message_id
    and sender_id is distinct from auth.uid();
end;
$$;

grant execute on function public.mark_message_as_read(uuid, text) to authenticated;

drop function if exists public.delete_message_for_me(uuid, text);
create or replace function public.delete_message_for_me(
  p_message_id uuid,
  p_source text default 'direct'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_source = 'direct' then
    update public.direct_messages
    set sender_deleted_at = now()
    where id = p_message_id
      and sender_id = auth.uid();

    if found then
      return;
    end if;

    update public.direct_message_recipients
    set deleted_at = now()
    where message_id = p_message_id
      and recipient_id = auth.uid();

    if not found then
      raise exception 'No autorizado.';
    end if;
    return;
  end if;

  if not public.current_user_can_access_community_message(p_message_id) then
    raise exception 'No autorizado.';
  end if;

  update public.community_contact_messages
  set sender_deleted_at = case when sender_id = auth.uid() then now() else sender_deleted_at end,
      recipient_deleted_at = case when sender_id is distinct from auth.uid() then now() else recipient_deleted_at end,
      updated_at = now()
  where id = p_message_id;
end;
$$;

grant execute on function public.delete_message_for_me(uuid, text) to authenticated;

drop function if exists public.restore_message_for_me(uuid, text);
create or replace function public.restore_message_for_me(
  p_message_id uuid,
  p_source text default 'direct'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_source = 'direct' then
    update public.direct_messages
    set sender_deleted_at = null
    where id = p_message_id
      and sender_id = auth.uid();

    if found then
      return;
    end if;

    update public.direct_message_recipients
    set deleted_at = null
    where message_id = p_message_id
      and recipient_id = auth.uid();

    if not found then
      raise exception 'No autorizado.';
    end if;
    return;
  end if;

  if not public.current_user_can_access_community_message(p_message_id) then
    raise exception 'No autorizado.';
  end if;

  update public.community_contact_messages
  set sender_deleted_at = case when sender_id = auth.uid() then null else sender_deleted_at end,
      recipient_deleted_at = case when sender_id is distinct from auth.uid() then null else recipient_deleted_at end,
      updated_at = now()
  where id = p_message_id;
end;
$$;

grant execute on function public.restore_message_for_me(uuid, text) to authenticated;
