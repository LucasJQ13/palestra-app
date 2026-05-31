-- Seccion Intenciones: pedidos de oracion, rezo aleatorio y notificacion al autor.

create table if not exists public.prayer_intentions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  is_anonymous boolean not null default false,
  prayer_count integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prayer_intention_prayers (
  id uuid primary key default gen_random_uuid(),
  intention_id uuid not null references public.prayer_intentions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists prayer_intentions_active_idx
on public.prayer_intentions (archived_at, created_at);

create index if not exists prayer_intention_prayers_intention_idx
on public.prayer_intention_prayers (intention_id, created_at);

alter table public.prayer_intentions enable row level security;
alter table public.prayer_intention_prayers enable row level security;

drop policy if exists "Usuarios aprobados leen intenciones activas" on public.prayer_intentions;
create policy "Usuarios aprobados leen intenciones activas"
on public.prayer_intentions for select
to authenticated
using (
  archived_at is null
  and exists (
    select 1 from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.status = 'aprobado'
  )
);

drop policy if exists "Usuarios crean sus intenciones" on public.prayer_intentions;
create policy "Usuarios crean sus intenciones"
on public.prayer_intentions for insert
to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.status = 'aprobado'
  )
);

drop policy if exists "Usuarios leen sus oraciones registradas" on public.prayer_intention_prayers;
create policy "Usuarios leen sus oraciones registradas"
on public.prayer_intention_prayers for select
to authenticated
using (user_id = auth.uid());

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'notification_intents'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) like '%notification_type%'
  loop
    execute format('alter table public.notification_intents drop constraint if exists %I', constraint_name);
  end loop;
end $$;

alter table public.notification_intents
  add constraint notification_intents_notification_type_check
  check (notification_type in (
    'mensaje_comunidad',
    'mensaje_privado',
    'recordatorio_usuario',
    'aviso_dirigencial',
    'recordatorio_evento',
    'periodo_motivador',
    'intencion_rezada'
  ));

insert into public.app_tabs (key, label, icon_name, section_type, is_visible, sort_order, visible_roles)
values (
  'intenciones',
  'Intenciones',
  'flame-outline',
  'internal',
  true,
  coalesce((select max(sort_order) + 1 from public.app_tabs), 9),
  null
)
on conflict (key) do update set
  label = excluded.label,
  icon_name = excluded.icon_name,
  section_type = excluded.section_type,
  is_visible = true;

insert into public.app_content (tab_key, title, body, blocks)
values (
  'intenciones',
  'Intenciones',
  'Crea una intencion o acompana en oracion una intencion de otro usuario.',
  '[]'::jsonb
)
on conflict (tab_key) do nothing;

create or replace function public.create_prayer_intention(
  p_body text,
  p_is_anonymous boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuario no autenticado';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = auth.uid()
      and status = 'aprobado'
  ) then
    raise exception 'Usuario no aprobado';
  end if;

  if length(trim(coalesce(p_body, ''))) = 0 then
    raise exception 'La intencion no puede estar vacia';
  end if;

  insert into public.prayer_intentions (author_id, body, is_anonymous)
  values (auth.uid(), left(trim(p_body), 800), coalesce(p_is_anonymous, false))
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.create_prayer_intention(text, boolean) to authenticated;

create or replace function public.get_random_prayer_intention(
  p_exclude_ids uuid[] default '{}'::uuid[]
)
returns table (
  id uuid,
  body text,
  is_anonymous boolean,
  author_name text,
  prayer_count integer,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    intentions.id,
    intentions.body,
    intentions.is_anonymous,
    case when intentions.is_anonymous then null else coalesce(author.full_name, 'Palestrista') end as author_name,
    intentions.prayer_count,
    intentions.created_at
  from public.prayer_intentions intentions
  join public.profiles author on author.id = intentions.author_id
  join public.profiles viewer on viewer.id = auth.uid()
  where intentions.archived_at is null
    and viewer.status = 'aprobado'
    and author.status = 'aprobado'
    and intentions.author_id <> auth.uid()
    and not (intentions.id = any(coalesce(p_exclude_ids, '{}'::uuid[])))
  order by random()
  limit 1;
$$;

grant execute on function public.get_random_prayer_intention(uuid[]) to authenticated;

create or replace function public.record_prayer_for_intention(
  p_intention_id uuid
)
returns table (
  prayer_count integer,
  notification_intent_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_intention public.prayer_intentions%rowtype;
  next_count integer;
  new_intent_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuario no autenticado';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = auth.uid()
      and status = 'aprobado'
  ) then
    raise exception 'Usuario no aprobado';
  end if;

  select * into target_intention
  from public.prayer_intentions
  where id = p_intention_id
    and archived_at is null
  for update;

  if target_intention.id is null then
    raise exception 'Intencion no encontrada';
  end if;

  if target_intention.author_id = auth.uid() then
    raise exception 'No se puede registrar una oracion sobre una intencion propia';
  end if;

  insert into public.prayer_intention_prayers (intention_id, user_id)
  values (p_intention_id, auth.uid());

  update public.prayer_intentions
  set prayer_count = prayer_count + 1,
      updated_at = now()
  where id = p_intention_id
  returning prayer_count into next_count;

  insert into public.notification_intents (
    created_by,
    notification_type,
    title,
    body,
    target_kind,
    target_value,
    tab_key,
    source_type,
    source_id,
    payload
  )
  values (
    auth.uid(),
    'intencion_rezada',
    'Rezaron por tu intencion',
    next_count::text || ' personas rezaron por tu intencion',
    'usuario',
    target_intention.author_id::text,
    'intenciones',
    'prayer_intention',
    target_intention.id,
    jsonb_build_object('prayer_count', next_count, 'intention_id', target_intention.id)
  )
  returning id into new_intent_id;

  prayer_count := next_count;
  notification_intent_id := new_intent_id;
  return next;
end;
$$;

grant execute on function public.record_prayer_for_intention(uuid) to authenticated;

create or replace function public.get_my_prayer_intentions()
returns table (
  id uuid,
  body text,
  is_anonymous boolean,
  author_name text,
  prayer_count integer,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    intentions.id,
    intentions.body,
    intentions.is_anonymous,
    coalesce(author.full_name, 'Palestrista') as author_name,
    intentions.prayer_count,
    intentions.created_at
  from public.prayer_intentions intentions
  join public.profiles author on author.id = intentions.author_id
  where intentions.author_id = auth.uid()
    and intentions.archived_at is null
  order by intentions.created_at desc;
$$;

grant execute on function public.get_my_prayer_intentions() to authenticated;

create or replace function public.admin_get_prayer_intentions()
returns table (
  id uuid,
  body text,
  is_anonymous boolean,
  author_name text,
  prayer_count integer,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    intentions.id,
    intentions.body,
    intentions.is_anonymous,
    coalesce(author.full_name, author.email, 'Palestrista') as author_name,
    intentions.prayer_count,
    intentions.created_at
  from public.prayer_intentions intentions
  join public.profiles admin_profile on admin_profile.id = auth.uid()
  join public.profiles author on author.id = intentions.author_id
  where admin_profile.role = 'administrador'
    and admin_profile.status = 'aprobado'
    and intentions.archived_at is null
  order by intentions.created_at desc;
$$;

grant execute on function public.admin_get_prayer_intentions() to authenticated;
