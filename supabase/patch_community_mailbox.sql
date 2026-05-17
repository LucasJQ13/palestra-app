alter table public.community_contact_messages
  add column if not exists sender_contact text,
  add column if not exists response text,
  add column if not exists responded_by uuid references public.profiles(id),
  add column if not exists responded_at timestamptz,
  add column if not exists read_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.community_contact_messages
  drop constraint if exists community_contact_messages_status_check;

alter table public.community_contact_messages
  add constraint community_contact_messages_status_check
  check (status in ('nuevo', 'leido', 'respondido', 'cerrado', 'archivado', 'pendiente'));

update public.community_contact_messages
set status = 'nuevo'
where status = 'pendiente';

create or replace function public.current_user_can_access_community_message(p_message_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_contact_messages messages
    join public.communities communities on communities.id = messages.community_id
    left join public.profiles actor on actor.id = auth.uid()
    where messages.id = p_message_id
      and (
        messages.sender_id = auth.uid()
        or (
          actor.status = 'aprobado'
          and (
            actor.role in ('coordinador_nacional', 'administrador')
            or (
              actor.role in ('animador_comunidad', 'coordinador_comunidad')
              and actor.community_name = communities.name
            )
            or (
              actor.role in ('vocal', 'coordinador_diocesano')
              and actor.province_id = communities.province_id
            )
          )
        )
      )
  );
$$;

grant execute on function public.current_user_can_access_community_message(uuid) to authenticated;

drop policy if exists "Mensajes de contacto propios o dirigenciales" on public.community_contact_messages;
create policy "Mensajes de contacto propios o dirigenciales"
on public.community_contact_messages
for select
to authenticated
using (public.current_user_can_access_community_message(id));

drop policy if exists "Crear mensajes de contacto comunidad" on public.community_contact_messages;
create policy "Crear mensajes de contacto comunidad"
on public.community_contact_messages
for insert
with check (char_length(message) <= 500);

create or replace function public.create_community_contact_message(
  p_community_id uuid,
  p_sender_name text,
  p_sender_contact text,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  resolved_name text;
begin
  if not exists (select 1 from public.communities where id = p_community_id and archived_at is null) then
    raise exception 'Comunidad no encontrada.';
  end if;

  if nullif(trim(p_message), '') is null or char_length(trim(p_message)) > 500 then
    raise exception 'El mensaje debe tener entre 1 y 500 caracteres.';
  end if;

  select profiles.full_name into resolved_name
  from public.profiles
  where profiles.id = auth.uid();

  insert into public.community_contact_messages (
    community_id,
    sender_id,
    sender_name,
    sender_contact,
    message,
    status,
    created_at,
    updated_at
  )
  values (
    p_community_id,
    auth.uid(),
    coalesce(nullif(trim(p_sender_name), ''), resolved_name, 'Consulta externa'),
    nullif(trim(coalesce(p_sender_contact, '')), ''),
    left(trim(p_message), 500),
    'nuevo',
    now(),
    now()
  )
  returning id into new_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'create_community_contact_message', jsonb_build_object('message_id', new_id, 'community_id', p_community_id));

  return new_id;
end;
$$;

grant execute on function public.create_community_contact_message(uuid, text, text, text) to anon, authenticated;

create or replace function public.get_my_mailbox_messages()
returns table (
  id uuid,
  community_id uuid,
  community_name text,
  province text,
  sender_id uuid,
  sender_name text,
  sender_contact text,
  message text,
  response text,
  status text,
  created_at timestamptz,
  responded_at timestamptz,
  read_at timestamptz,
  closed_at timestamptz,
  can_respond boolean
)
language sql
security definer
set search_path = public
as $$
  select
    messages.id,
    messages.community_id,
    communities.name,
    provinces.name,
    messages.sender_id,
    messages.sender_name,
    messages.sender_contact,
    messages.message,
    messages.response,
    messages.status,
    messages.created_at,
    messages.responded_at,
    messages.read_at,
    messages.closed_at,
    exists (
      select 1
      from public.profiles actor
      where actor.id = auth.uid()
        and actor.status = 'aprobado'
        and (
          actor.role in ('coordinador_nacional', 'administrador')
          or (actor.role in ('animador_comunidad', 'coordinador_comunidad') and actor.community_name = communities.name)
          or (actor.role in ('vocal', 'coordinador_diocesano') and actor.province_id = communities.province_id)
        )
    ) as can_respond
  from public.community_contact_messages messages
  join public.communities communities on communities.id = messages.community_id
  left join public.provinces on provinces.id = communities.province_id
  where public.current_user_can_access_community_message(messages.id)
  order by messages.created_at desc;
$$;

grant execute on function public.get_my_mailbox_messages() to authenticated;

create or replace function public.respond_community_contact_message(
  p_message_id uuid,
  p_response text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(trim(p_response), '') is null or char_length(trim(p_response)) > 1000 then
    raise exception 'La respuesta debe tener entre 1 y 1000 caracteres.';
  end if;

  if not public.current_user_can_access_community_message(p_message_id) then
    raise exception 'No autorizado.';
  end if;

  if not exists (
    select 1
    from public.community_contact_messages messages
    join public.communities communities on communities.id = messages.community_id
    join public.profiles actor on actor.id = auth.uid()
    where messages.id = p_message_id
      and actor.status = 'aprobado'
      and (
        actor.role in ('coordinador_nacional', 'administrador')
        or (actor.role in ('animador_comunidad', 'coordinador_comunidad') and actor.community_name = communities.name)
        or (actor.role in ('vocal', 'coordinador_diocesano') and actor.province_id = communities.province_id)
      )
  ) then
    raise exception 'No tenes permisos para responder este mensaje.';
  end if;

  update public.community_contact_messages
  set response = left(trim(p_response), 1000),
      responded_by = auth.uid(),
      responded_at = now(),
      status = 'respondido',
      updated_at = now()
  where id = p_message_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'respond_community_contact_message', jsonb_build_object('message_id', p_message_id));
end;
$$;

grant execute on function public.respond_community_contact_message(uuid, text) to authenticated;

create or replace function public.set_community_contact_message_status(
  p_message_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('nuevo', 'leido', 'respondido', 'cerrado', 'archivado') then
    raise exception 'Estado invalido.';
  end if;

  if not public.current_user_can_access_community_message(p_message_id) then
    raise exception 'No autorizado.';
  end if;

  update public.community_contact_messages
  set status = p_status,
      read_at = case when p_status in ('leido', 'respondido', 'cerrado') then coalesce(read_at, now()) else read_at end,
      closed_at = case when p_status = 'cerrado' then now() else closed_at end,
      updated_at = now()
  where id = p_message_id;
end;
$$;

grant execute on function public.set_community_contact_message_status(uuid, text) to authenticated;

create or replace function public.current_user_can_manage_community_province(p_province_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.status = 'aprobado'
      and (
        actor.role in ('coordinador_nacional', 'administrador')
        or (
          actor.role in ('vocal', 'coordinador_diocesano')
          and actor.province_id = p_province_id
        )
      )
  )
$$;

grant execute on function public.current_user_can_manage_community_province(uuid) to authenticated;
