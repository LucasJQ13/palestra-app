-- Capa de proteccion y moderacion para mensajeria interna.
-- No habilita imagenes; agrega filtro preventivo, reportes, auditoria y restricciones de envio.

create table if not exists public.moderation_rules (
  id uuid primary key default gen_random_uuid(),
  rule_type text not null default 'text',
  pattern text not null,
  severity text not null default 'media' check (severity in ('baja', 'media', 'alta', 'critica')),
  action text not null default 'revisar' check (action in ('advertir', 'bloquear', 'revisar')),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rule_type, pattern)
);

create table if not exists public.message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null,
  source text not null default 'direct' check (source in ('direct', 'community')),
  reported_by uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  comment text,
  status text not null default 'pendiente' check (status in ('pendiente', 'en_revision', 'resuelto', 'descartado')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  action_taken text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (message_id, source, reported_by)
);

create table if not exists public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid references public.profiles(id) on delete set null,
  message_id uuid,
  report_id uuid references public.message_reports(id) on delete set null,
  source text check (source in ('direct', 'community')),
  severity text check (severity in ('baja', 'media', 'alta', 'critica')),
  action_taken text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_messaging_restrictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  restriction_type text not null default 'send_blocked',
  reason text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists moderation_rules_active_idx on public.moderation_rules (is_active, rule_type);
create index if not exists message_reports_status_idx on public.message_reports (status, created_at desc);
create index if not exists moderation_events_created_idx on public.moderation_events (created_at desc);
create index if not exists user_messaging_restrictions_user_active_idx on public.user_messaging_restrictions (user_id, is_active);

alter table public.moderation_rules enable row level security;
alter table public.message_reports enable row level security;
alter table public.moderation_events enable row level security;
alter table public.user_messaging_restrictions enable row level security;

create or replace function public.current_user_can_moderate_messages()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.status::text = 'aprobado'
      and actor.role::text in ('administrador', 'coordinador_nacional', 'vocal_nacional', 'coordinador_diocesano')
  );
$$;

grant execute on function public.current_user_can_moderate_messages() to authenticated;

drop policy if exists "Moderation rules visible to moderators" on public.moderation_rules;
create policy "Moderation rules visible to moderators"
on public.moderation_rules
for select
to authenticated
using (public.current_user_can_moderate_messages());

drop policy if exists "Message reports visible to reporter or moderators" on public.message_reports;
create policy "Message reports visible to reporter or moderators"
on public.message_reports
for select
to authenticated
using (reported_by = auth.uid() or public.current_user_can_moderate_messages());

drop policy if exists "Moderation events visible to moderators" on public.moderation_events;
create policy "Moderation events visible to moderators"
on public.moderation_events
for select
to authenticated
using (public.current_user_can_moderate_messages());

drop policy if exists "Messaging restrictions visible to self or moderators" on public.user_messaging_restrictions;
create policy "Messaging restrictions visible to self or moderators"
on public.user_messaging_restrictions
for select
to authenticated
using (user_id = auth.uid() or public.current_user_can_moderate_messages());

create or replace function public.normalize_moderation_text(p_text text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    translate(lower(coalesce(p_text, '')), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'),
    '[^a-z0-9]+',
    '',
    'g'
  );
$$;

create or replace function public.check_message_moderation(p_body text)
returns table (
  allowed boolean,
  action text,
  severity text,
  matched_pattern text,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_body text := public.normalize_moderation_text(p_body);
  matched public.moderation_rules%rowtype;
begin
  select rules.* into matched
  from public.moderation_rules rules
  where rules.is_active
    and rules.rule_type = 'text'
    and normalized_body like '%' || public.normalize_moderation_text(rules.pattern) || '%'
  order by
    case rules.action when 'bloquear' then 3 when 'revisar' then 2 else 1 end desc,
    case rules.severity when 'critica' then 4 when 'alta' then 3 when 'media' then 2 else 1 end desc
  limit 1;

  if matched.id is null then
    return query select true, 'permitir'::text, null::text, null::text, null::text;
    return;
  end if;

  return query select
    (matched.action <> 'bloquear'),
    matched.action,
    matched.severity,
    matched.pattern,
    case matched.action
      when 'bloquear' then 'El mensaje contiene lenguaje no permitido y no fue enviado.'
      when 'revisar' then 'El mensaje fue enviado y quedo marcado para revision.'
      else 'El mensaje fue enviado con advertencia de uso responsable.'
    end;
end;
$$;

grant execute on function public.check_message_moderation(text) to authenticated;

create or replace function public.user_has_active_messaging_restriction(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_messaging_restrictions restrictions
    where restrictions.user_id = p_user_id
      and restrictions.is_active
      and restrictions.starts_at <= now()
      and (restrictions.ends_at is null or restrictions.ends_at > now())
  );
$$;

grant execute on function public.user_has_active_messaging_restriction(uuid) to authenticated;

drop function if exists public.send_direct_message_with_moderation(uuid[], text, text);
create or replace function public.send_direct_message_with_moderation(
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
  moderation_result record;
begin
  select * into actor
  from public.profiles
  where id = auth.uid();

  if actor.id is null or actor.status::text <> 'aprobado' or actor.role::text = 'invitado' then
    raise exception 'No autorizado';
  end if;

  if public.user_has_active_messaging_restriction(auth.uid()) then
    raise exception 'Tu mensajeria se encuentra restringida temporalmente.';
  end if;

  if nullif(trim(p_body), '') is null or char_length(trim(p_body)) > 1000 then
    raise exception 'El mensaje debe tener entre 1 y 1000 caracteres.';
  end if;

  select * into moderation_result
  from public.check_message_moderation(p_body)
  limit 1;

  if moderation_result.allowed is false then
    insert into public.moderation_events (event_type, user_id, source, severity, action_taken, metadata, created_by)
    values (
      'message_blocked_by_filter',
      auth.uid(),
      'direct',
      moderation_result.severity,
      'bloquear',
      jsonb_build_object('matched_pattern', moderation_result.matched_pattern, 'body_preview', left(trim(p_body), 160)),
      auth.uid()
    );
    raise exception '%', moderation_result.message;
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
  values (auth.uid(), 'send_direct_message_with_moderation', jsonb_build_object('message_id', new_id, 'recipient_count', recipient_count));

  if moderation_result.action in ('advertir', 'revisar') then
    insert into public.moderation_events (event_type, user_id, message_id, source, severity, action_taken, metadata, created_by)
    values (
      case when moderation_result.action = 'revisar' then 'message_marked_for_review' else 'message_warning' end,
      auth.uid(),
      new_id,
      'direct',
      moderation_result.severity,
      moderation_result.action,
      jsonb_build_object('matched_pattern', moderation_result.matched_pattern, 'recipient_count', recipient_count),
      auth.uid()
    );
  end if;

  return new_id;
end;
$$;

grant execute on function public.send_direct_message_with_moderation(uuid[], text, text) to authenticated;

drop function if exists public.send_direct_message(uuid[], text, text);
create or replace function public.send_direct_message(
  p_recipient_ids uuid[],
  p_body text,
  p_subject text default null
)
returns uuid
language sql
security definer
set search_path = public
as $$
  select public.send_direct_message_with_moderation(p_recipient_ids, p_body, p_subject);
$$;

grant execute on function public.send_direct_message(uuid[], text, text) to authenticated;

drop function if exists public.report_message(uuid, text, text, text);
create or replace function public.report_message(
  p_message_id uuid,
  p_source text default 'direct',
  p_reason text default 'otro',
  p_comment text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  report_id uuid;
  reported_id uuid;
begin
  if p_source = 'direct' then
    select messages.sender_id into reported_id
    from public.direct_messages messages
    join public.direct_message_recipients recipients on recipients.message_id = messages.id
    where messages.id = p_message_id
      and recipients.recipient_id = auth.uid();
  else
    select messages.sender_id into reported_id
    from public.community_contact_messages messages
    where messages.id = p_message_id
      and messages.sender_id is distinct from auth.uid()
      and public.current_user_can_access_community_message(messages.id);
  end if;

  if reported_id is null then
    raise exception 'No puedes reportar este mensaje.';
  end if;

  insert into public.message_reports (message_id, source, reported_by, reported_user_id, reason, comment)
  values (p_message_id, coalesce(nullif(p_source, ''), 'direct'), auth.uid(), reported_id, coalesce(nullif(trim(p_reason), ''), 'otro'), nullif(trim(coalesce(p_comment, '')), ''))
  on conflict (message_id, source, reported_by)
  do update set
    reason = excluded.reason,
    comment = excluded.comment,
    status = 'pendiente',
    updated_at = now()
  returning id into report_id;

  insert into public.moderation_events (event_type, user_id, message_id, report_id, source, severity, action_taken, metadata, created_by)
  values ('message_reported', reported_id, p_message_id, report_id, p_source, 'media', 'reportar', jsonb_build_object('reason', p_reason), auth.uid());

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'report_message', jsonb_build_object('report_id', report_id, 'message_id', p_message_id, 'source', p_source));

  return report_id;
end;
$$;

grant execute on function public.report_message(uuid, text, text, text) to authenticated;

drop function if exists public.get_moderation_queue();
create or replace function public.get_moderation_queue()
returns table (
  id uuid,
  item_type text,
  message_id uuid,
  source text,
  reporter_id uuid,
  reporter_name text,
  reported_user_id uuid,
  reported_user_name text,
  reason text,
  comment text,
  status text,
  severity text,
  action_taken text,
  message_preview text,
  created_at timestamptz,
  reviewed_by_name text,
  reviewed_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with actor as (
    select profiles.*
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.status::text = 'aprobado'
      and profiles.role::text in ('administrador', 'coordinador_nacional', 'vocal_nacional', 'coordinador_diocesano')
  ),
  report_rows as (
    select
      reports.id,
      'report'::text as item_type,
      reports.message_id,
      reports.source,
      reports.reported_by as reporter_id,
      coalesce(reporter.full_name, reporter.nickname, 'Palestrista')::text as reporter_name,
      reports.reported_user_id,
      coalesce(reported.full_name, reported.nickname, 'Palestrista')::text as reported_user_name,
      reports.reason,
      reports.comment,
      reports.status,
      null::text as severity,
      reports.action_taken,
      case
        when reports.source = 'direct' then left(coalesce(direct_messages.body, ''), 180)
        else left(coalesce(community_messages.message, ''), 180)
      end::text as message_preview,
      reports.created_at,
      coalesce(reviewer.full_name, reviewer.nickname)::text as reviewed_by_name,
      reports.reviewed_at,
      reported.province_id
    from public.message_reports reports
    left join public.profiles reporter on reporter.id = reports.reported_by
    left join public.profiles reported on reported.id = reports.reported_user_id
    left join public.profiles reviewer on reviewer.id = reports.reviewed_by
    left join public.direct_messages on direct_messages.id = reports.message_id and reports.source = 'direct'
    left join public.community_contact_messages community_messages on community_messages.id = reports.message_id and reports.source = 'community'
  ),
  event_rows as (
    select
      events.id,
      'event'::text as item_type,
      events.message_id,
      events.source,
      events.created_by as reporter_id,
      coalesce(actor_profile.full_name, actor_profile.nickname, 'Sistema')::text as reporter_name,
      events.user_id as reported_user_id,
      coalesce(reported.full_name, reported.nickname, 'Palestrista')::text as reported_user_name,
      events.event_type as reason,
      (events.metadata ->> 'matched_pattern')::text as comment,
      'pendiente'::text as status,
      events.severity,
      events.action_taken,
      left(coalesce(events.metadata ->> 'body_preview', direct_messages.body, ''), 180)::text as message_preview,
      events.created_at,
      null::text as reviewed_by_name,
      null::timestamptz as reviewed_at,
      reported.province_id
    from public.moderation_events events
    left join public.profiles actor_profile on actor_profile.id = events.created_by
    left join public.profiles reported on reported.id = events.user_id
    left join public.direct_messages on direct_messages.id = events.message_id
    where events.event_type in ('message_blocked_by_filter', 'message_marked_for_review')
  ),
  unioned as (
    select * from report_rows
    union all
    select * from event_rows
  )
  select
    unioned.id,
    unioned.item_type,
    unioned.message_id,
    unioned.source,
    unioned.reporter_id,
    unioned.reporter_name,
    unioned.reported_user_id,
    unioned.reported_user_name,
    unioned.reason,
    unioned.comment,
    unioned.status,
    unioned.severity,
    unioned.action_taken,
    unioned.message_preview,
    unioned.created_at,
    unioned.reviewed_by_name,
    unioned.reviewed_at
  from unioned
  join actor on true
  where actor.role::text in ('administrador', 'coordinador_nacional', 'vocal_nacional')
     or unioned.province_id = actor.province_id
  order by unioned.created_at desc
  limit 200;
$$;

grant execute on function public.get_moderation_queue() to authenticated;

drop function if exists public.review_message_report(uuid, text, text);
create or replace function public.review_message_report(
  p_report_id uuid,
  p_status text,
  p_action_taken text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  report_row public.message_reports%rowtype;
begin
  if not public.current_user_can_moderate_messages() then
    raise exception 'No autorizado.';
  end if;

  select * into report_row
  from public.message_reports
  where id = p_report_id;

  if report_row.id is null then
    raise exception 'Reporte no encontrado.';
  end if;

  update public.message_reports
  set status = case when p_status in ('pendiente', 'en_revision', 'resuelto', 'descartado') then p_status else 'en_revision' end,
      action_taken = nullif(trim(coalesce(p_action_taken, '')), ''),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_report_id;

  insert into public.moderation_events (event_type, user_id, message_id, report_id, source, action_taken, metadata, created_by)
  values ('message_report_reviewed', report_row.reported_user_id, report_row.message_id, p_report_id, report_row.source, p_action_taken, jsonb_build_object('status', p_status), auth.uid());
end;
$$;

grant execute on function public.review_message_report(uuid, text, text) to authenticated;

drop function if exists public.restrict_user_messaging(uuid, text, integer);
create or replace function public.restrict_user_messaging(
  p_user_id uuid,
  p_reason text,
  p_days integer default 7
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  restriction_id uuid;
begin
  if not public.current_user_can_moderate_messages() then
    raise exception 'No autorizado.';
  end if;

  insert into public.user_messaging_restrictions (user_id, reason, ends_at, created_by)
  values (p_user_id, coalesce(nullif(trim(p_reason), ''), 'Revision de moderacion'), now() + make_interval(days => greatest(coalesce(p_days, 7), 1)), auth.uid())
  returning id into restriction_id;

  insert into public.moderation_events (event_type, user_id, severity, action_taken, metadata, created_by)
  values ('user_messaging_restricted', p_user_id, 'alta', 'restringir_mensajeria', jsonb_build_object('days', p_days, 'reason', p_reason), auth.uid());

  return restriction_id;
end;
$$;

grant execute on function public.restrict_user_messaging(uuid, text, integer) to authenticated;

drop function if exists public.restore_user_messaging(uuid);
create or replace function public.restore_user_messaging(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_can_moderate_messages() then
    raise exception 'No autorizado.';
  end if;

  update public.user_messaging_restrictions
  set is_active = false,
      updated_at = now()
  where user_id = p_user_id
    and is_active;

  insert into public.moderation_events (event_type, user_id, severity, action_taken, created_by)
  values ('user_messaging_restored', p_user_id, 'media', 'restaurar_mensajeria', auth.uid());
end;
$$;

grant execute on function public.restore_user_messaging(uuid) to authenticated;

insert into public.moderation_rules (rule_type, pattern, severity, action)
values
  ('text', 'amenaza', 'alta', 'revisar'),
  ('text', 'matar', 'critica', 'bloquear'),
  ('text', 'suicid', 'critica', 'revisar'),
  ('text', 'sexo', 'alta', 'bloquear'),
  ('text', 'porno', 'critica', 'bloquear'),
  ('text', 'puta', 'alta', 'bloquear'),
  ('text', 'puto', 'alta', 'bloquear'),
  ('text', 'mierda', 'media', 'advertir'),
  ('text', 'idiota', 'media', 'advertir'),
  ('text', 'acos', 'alta', 'revisar')
on conflict (rule_type, pattern) do nothing;
