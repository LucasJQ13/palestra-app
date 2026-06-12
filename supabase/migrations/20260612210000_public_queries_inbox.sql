-- Issue #65: consultas publicas e institucionales separadas del buzon privado.

create table if not exists public.public_queries (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid references public.profiles(id) on delete set null,
  sender_name text not null,
  sender_contact text,
  message text not null check (char_length(message) between 1 and 1000),
  destination_type text not null check (destination_type in ('comunidad', 'diocesano', 'nacional', 'otro')),
  origin text not null,
  community_id uuid references public.communities(id) on delete set null,
  province_id uuid references public.provinces(id) on delete set null,
  target_user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'nueva' check (status in ('nueva', 'leida', 'respondida', 'archivada')),
  response text,
  responded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  read_at timestamptz,
  responded_at timestamptz,
  archived_at timestamptz,
  legacy_message_id uuid unique references public.community_contact_messages(id) on delete set null
);

create index if not exists public_queries_destination_idx
  on public.public_queries (destination_type, community_id, province_id, created_at desc);
create index if not exists public_queries_target_user_idx
  on public.public_queries (target_user_id, created_at desc);

alter table public.public_queries enable row level security;

create or replace function public.current_user_can_access_public_query(p_query_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.public_queries queries
    left join public.communities communities on communities.id = queries.community_id
    join public.profiles actor on actor.id = auth.uid()
    where queries.id = p_query_id
      and actor.status::text = 'aprobado'
      and (
        actor.role::text = 'administrador'
        or queries.target_user_id = actor.id
        or (
          queries.destination_type = 'comunidad'
          and actor.role::text in ('animador_comunidad', 'coordinador_comunidad')
          and actor.community_name = communities.name
          and actor.province_id = communities.province_id
        )
        or (
          queries.destination_type = 'diocesano'
          and actor.role::text in ('vocal', 'coordinador_diocesano')
          and actor.province_id = queries.province_id
        )
        or (
          queries.destination_type = 'nacional'
          and actor.role::text in ('vocal_nacional', 'coordinador_nacional')
        )
      )
  );
$$;

grant execute on function public.current_user_can_access_public_query(uuid) to authenticated;

drop policy if exists "Consultas visibles para responsables" on public.public_queries;
create policy "Consultas visibles para responsables"
on public.public_queries
for select
to authenticated
using (public.current_user_can_access_public_query(id));

drop function if exists public.create_public_query(uuid, uuid, text, text, text, text, text);
create or replace function public.create_public_query(
  p_community_id uuid default null,
  p_target_user_id uuid default null,
  p_sender_name text default null,
  p_sender_contact text default null,
  p_message text default null,
  p_destination_type text default 'comunidad',
  p_origin text default 'comunidad'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  actor public.profiles%rowtype;
  target public.profiles%rowtype;
  target_province_id uuid;
  resolved_name text;
begin
  if p_destination_type not in ('comunidad', 'diocesano', 'nacional', 'otro') then
    raise exception 'Destino de consulta no valido.';
  end if;
  if nullif(trim(coalesce(p_message, '')), '') is null or char_length(trim(p_message)) > 1000 then
    raise exception 'La consulta debe tener entre 1 y 1000 caracteres.';
  end if;

  select * into actor from public.profiles where id = auth.uid();
  resolved_name := coalesce(nullif(trim(coalesce(p_sender_name, '')), ''), nullif(trim(actor.full_name), ''), 'Consulta externa');

  if auth.uid() is null and (
    nullif(trim(coalesce(p_sender_name, '')), '') is null
    or nullif(trim(coalesce(p_sender_contact, '')), '') is null
  ) then
    raise exception 'Deja tu nombre y un contacto para poder responderte.';
  end if;

  if p_destination_type = 'comunidad' then
    select communities.province_id into target_province_id
    from public.communities
    where communities.id = p_community_id
      and communities.archived_at is null;
    if target_province_id is null then
      raise exception 'Comunidad no encontrada.';
    end if;
  elsif p_destination_type in ('diocesano', 'nacional') then
    select * into target
    from public.profiles
    where id = p_target_user_id
      and status::text = 'aprobado';
    if target.id is null then
      raise exception 'No se encontro el destino institucional.';
    end if;
    if p_destination_type = 'diocesano' and target.role::text not in ('vocal', 'coordinador_diocesano') then
      raise exception 'El destino no pertenece al equipo diocesano.';
    end if;
    if p_destination_type = 'nacional' and target.role::text not in ('vocal_nacional', 'coordinador_nacional') then
      raise exception 'El destino no pertenece al equipo nacional.';
    end if;
    target_province_id := target.province_id;
  end if;

  insert into public.public_queries (
    sender_user_id, sender_name, sender_contact, message, destination_type,
    origin, community_id, province_id, target_user_id
  )
  values (
    auth.uid(),
    left(resolved_name, 160),
    nullif(left(trim(coalesce(p_sender_contact, actor.phone, '')), 240), ''),
    left(trim(p_message), 1000),
    p_destination_type,
    left(coalesce(nullif(trim(p_origin), ''), p_destination_type), 80),
    p_community_id,
    target_province_id,
    p_target_user_id
  )
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.create_public_query(uuid, uuid, text, text, text, text, text) to anon, authenticated;

create or replace function public.create_community_contact_message(
  p_community_id uuid,
  p_sender_name text,
  p_sender_contact text,
  p_message text
)
returns uuid
language sql
security definer
set search_path = public
as $$
  select public.create_public_query(
    p_community_id, null, p_sender_name, p_sender_contact, p_message, 'comunidad', 'comunidad'
  );
$$;

grant execute on function public.create_community_contact_message(uuid, text, text, text) to anon, authenticated;

drop function if exists public.create_institutional_query(uuid, text, text, text, text);
create or replace function public.create_institutional_query(
  p_target_user_id uuid,
  p_sender_name text,
  p_sender_contact text,
  p_message text,
  p_origin text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role text;
  destination text;
begin
  select role::text into target_role
  from public.profiles
  where id = p_target_user_id
    and status::text = 'aprobado';

  destination := case
    when target_role in ('vocal_nacional', 'coordinador_nacional') then 'nacional'
    when target_role in ('vocal', 'coordinador_diocesano') then 'diocesano'
    else null
  end;
  if destination is null then
    raise exception 'No se encontro el destino institucional.';
  end if;

  return public.create_public_query(
    null, p_target_user_id, p_sender_name, p_sender_contact, p_message,
    destination,
    coalesce(nullif(trim(p_origin), ''), case when destination = 'nacional' then 'equipo_nacional' else 'equipo_diocesano' end)
  );
end;
$$;

grant execute on function public.create_institutional_query(uuid, text, text, text, text) to anon, authenticated;

-- Conserva las consultas historicas sin duplicarlas.
insert into public.public_queries (
  sender_user_id, sender_name, sender_contact, message, destination_type, origin,
  community_id, province_id, target_user_id, status, response, created_at,
  updated_at, read_at, responded_at, archived_at, legacy_message_id
)
select
  messages.sender_id,
  coalesce(nullif(messages.sender_name, ''), 'Consulta externa'),
  messages.sender_contact,
  messages.message,
  case
    when messages.community_id is not null then 'comunidad'
    when target.role::text in ('vocal_nacional', 'coordinador_nacional') then 'nacional'
    else 'diocesano'
  end,
  case
    when messages.community_id is not null then 'comunidad'
    when target.role::text in ('vocal_nacional', 'coordinador_nacional') then 'equipo_nacional'
    else 'equipo_diocesano'
  end,
  messages.community_id,
  coalesce(communities.province_id, messages.target_province_id, target.province_id),
  messages.target_user_id,
  case
    when messages.status = 'respondido' then 'respondida'
    when messages.status in ('cerrado', 'archivado') then 'archivada'
    when messages.status = 'leido' then 'leida'
    else 'nueva'
  end,
  messages.response,
  messages.created_at,
  messages.updated_at,
  messages.read_at,
  messages.responded_at,
  messages.closed_at,
  messages.id
from public.community_contact_messages messages
left join public.communities communities on communities.id = messages.community_id
left join public.profiles target on target.id = messages.target_user_id
where (
  messages.community_id is not null
  or (
    messages.target_scope = 'user'
    and target.role::text in ('vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional')
  )
)
on conflict (legacy_message_id) do nothing;

drop function if exists public.get_my_public_queries();
create or replace function public.get_my_public_queries()
returns table (
  id uuid,
  sender_user_id uuid,
  sender_name text,
  sender_contact text,
  message text,
  destination_type text,
  destination_name text,
  origin text,
  community_id uuid,
  community_name text,
  province text,
  target_user_id uuid,
  target_user_name text,
  status text,
  response text,
  created_at timestamptz,
  read_at timestamptz,
  responded_at timestamptz,
  archived_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    queries.id,
    queries.sender_user_id,
    queries.sender_name,
    queries.sender_contact,
    queries.message,
    queries.destination_type,
    coalesce(
      communities.name,
      case
        when queries.destination_type = 'nacional' then 'Equipo Nacional'
        when queries.destination_type = 'diocesano' then 'Equipo Diocesano - ' || coalesce(provinces.name, '')
        else 'Consulta institucional'
      end
    )::text,
    queries.origin,
    queries.community_id,
    communities.name::text,
    provinces.name::text,
    queries.target_user_id,
    coalesce(target.full_name, target.nickname)::text,
    queries.status,
    queries.response,
    queries.created_at,
    queries.read_at,
    queries.responded_at,
    queries.archived_at
  from public.public_queries queries
  left join public.communities communities on communities.id = queries.community_id
  left join public.provinces provinces on provinces.id = queries.province_id
  left join public.profiles target on target.id = queries.target_user_id
  where public.current_user_can_access_public_query(queries.id)
  order by queries.created_at desc;
$$;

grant execute on function public.get_my_public_queries() to authenticated;

drop function if exists public.set_public_query_status(uuid, text);
create or replace function public.set_public_query_status(p_query_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_can_access_public_query(p_query_id) then
    raise exception 'No autorizado.';
  end if;
  if p_status not in ('nueva', 'leida', 'respondida', 'archivada') then
    raise exception 'Estado no valido.';
  end if;

  update public.public_queries
  set status = p_status,
      read_at = case when p_status in ('leida', 'respondida', 'archivada') then coalesce(read_at, now()) else read_at end,
      archived_at = case when p_status = 'archivada' then now() else null end,
      updated_at = now()
  where id = p_query_id;
end;
$$;

grant execute on function public.set_public_query_status(uuid, text) to authenticated;

drop function if exists public.respond_public_query(uuid, text);
create or replace function public.respond_public_query(p_query_id uuid, p_response text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_can_access_public_query(p_query_id) then
    raise exception 'No autorizado.';
  end if;
  if nullif(trim(coalesce(p_response, '')), '') is null or char_length(trim(p_response)) > 1000 then
    raise exception 'La respuesta debe tener entre 1 y 1000 caracteres.';
  end if;

  update public.public_queries
  set response = trim(p_response),
      status = 'respondida',
      responded_by = auth.uid(),
      responded_at = now(),
      read_at = coalesce(read_at, now()),
      archived_at = null,
      updated_at = now()
  where id = p_query_id;
end;
$$;

grant execute on function public.respond_public_query(uuid, text) to authenticated;

-- El buzon queda reservado a mensajes directos entre usuarios registrados.
create or replace function public.get_my_mailbox_messages()
returns table (
  source text, mailbox_folder text, id uuid, community_id uuid, community_name text,
  province text, sender_id uuid, sender_name text, sender_contact text, recipient_id uuid,
  recipient_name text, recipient_names text, subject text, message text, response text,
  status text, created_at timestamptz, responded_at timestamptz, read_at timestamptz,
  closed_at timestamptz, deleted_at timestamptz, can_respond boolean
)
language sql
security definer
set search_path = public
as $$
  with direct_received as (
    select
      'direct'::text, case when r.deleted_at is null then 'entrada' else 'eliminados' end,
      m.id, null::uuid, 'Mensaje directo'::text, sender_province.name::text,
      m.sender_id, coalesce(sender.full_name, sender.nickname, 'Palestrista')::text,
      null::text, r.recipient_id, coalesce(recipient.full_name, recipient.nickname, 'Palestrista')::text,
      coalesce(recipient.full_name, recipient.nickname, 'Palestrista')::text,
      m.subject, m.body, null::text,
      case when r.read_at is null then 'nuevo' else 'leido' end::text,
      m.created_at, null::timestamptz, r.read_at, null::timestamptz, r.deleted_at, false
    from public.direct_message_recipients r
    join public.direct_messages m on m.id = r.message_id
    join public.profiles sender on sender.id = m.sender_id
    left join public.provinces sender_province on sender_province.id = sender.province_id
    join public.profiles recipient on recipient.id = r.recipient_id
    where r.recipient_id = auth.uid()
  ),
  direct_sent as (
    select
      'direct'::text, case when m.sender_deleted_at is null then 'enviados' else 'eliminados' end,
      m.id, null::uuid, 'Mensaje directo'::text, recipient_province.name::text,
      m.sender_id, coalesce(sender.full_name, sender.nickname, 'Palestrista')::text,
      null::text, r.recipient_id, coalesce(recipient.full_name, recipient.nickname, 'Palestrista')::text,
      coalesce(recipient.full_name, recipient.nickname, 'Palestrista')::text,
      m.subject, m.body, null::text, 'enviado'::text,
      m.created_at, null::timestamptz, r.read_at, null::timestamptz, m.sender_deleted_at, false
    from public.direct_messages m
    join public.profiles sender on sender.id = m.sender_id
    join public.direct_message_recipients r on r.message_id = m.id
    join public.profiles recipient on recipient.id = r.recipient_id
    left join public.provinces recipient_province on recipient_province.id = recipient.province_id
    where m.sender_id = auth.uid()
  )
  select * from direct_received
  union all
  select * from direct_sent
  order by created_at desc;
$$;

grant execute on function public.get_my_mailbox_messages() to authenticated;
