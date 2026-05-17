create table if not exists public.app_library_items (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('oraciones', 'cancionero', 'himno')),
  title text not null,
  subtitle text,
  body text not null,
  image_url text,
  category text,
  source text,
  item_date date,
  status text not null default 'publicado' check (status in ('publicado', 'borrador')),
  sort_order integer not null default 100,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

alter table public.app_library_items enable row level security;

grant select on public.app_library_items to anon, authenticated;

create index if not exists app_library_items_section_sort_idx
on public.app_library_items (section, sort_order, updated_at desc)
where archived_at is null;

update public.app_library_items
set status = 'publicado'
where section in ('oraciones', 'cancionero', 'himno')
and status <> 'publicado';

create or replace function public.current_user_can_publish_library_item(p_section text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
begin
  select profiles.role::text into actor_role
  from public.profiles
  where profiles.id = auth.uid()
  and profiles.status = 'aprobado';

  if actor_role = 'administrador' then
    return true;
  end if;

  return actor_role in (
    'sedimentador',
    'animador_comunidad',
    'coordinador_comunidad',
    'vocal',
    'asesor',
    'coordinador_diocesano',
    'vocal_nacional',
    'coordinador_nacional'
  );
end;
$$;

grant execute on function public.current_user_can_publish_library_item(text) to authenticated;

create or replace function public.current_user_can_edit_library_item(p_section text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.current_user_can_publish_library_item(p_section);
$$;

grant execute on function public.current_user_can_edit_library_item(text) to authenticated;

create or replace function public.current_user_can_manage_library_item(p_item_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  target_author uuid;
begin
  select profiles.role::text into actor_role
  from public.profiles
  where profiles.id = auth.uid()
  and profiles.status = 'aprobado';

  select created_by into target_author
  from public.app_library_items
  where id = p_item_id
  and archived_at is null;

  if target_author = auth.uid() then
    return true;
  end if;

  return actor_role in ('vocal', 'asesor', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador');
end;
$$;

grant execute on function public.current_user_can_manage_library_item(uuid) to authenticated;

drop policy if exists "Biblioteca publicada visible para todos" on public.app_library_items;
create policy "Biblioteca publicada visible para todos"
on public.app_library_items
for select
using (
  archived_at is null
  and status = 'publicado'
);

create or replace function public.admin_upsert_library_item(
  p_id uuid,
  p_section text,
  p_title text,
  p_subtitle text,
  p_body text,
  p_image_url text,
  p_category text,
  p_source text,
  p_item_date date,
  p_status text,
  p_sort_order integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_id uuid;
  target_exists boolean;
  actor_role text;
  actor_status text;
begin
  select profiles.role::text, profiles.status::text
  into actor_role, actor_status
  from public.profiles
  where profiles.id = auth.uid();

  if auth.uid() is null then
    raise exception 'Tenes que iniciar sesion para publicar.';
  end if;

  if actor_role is null then
    raise exception 'No existe un perfil asociado a esta sesion.';
  end if;

  if actor_status <> 'aprobado' then
    raise exception 'Tu perfil debe estar aprobado para publicar.';
  end if;

  select exists (
    select 1
    from public.app_library_items
    where id = p_id
    and archived_at is null
  ) into target_exists;

  if target_exists then
    if not public.current_user_can_manage_library_item(p_id) then
      raise exception 'No tenes permisos para editar este contenido.';
    end if;
  elsif actor_role not in (
    'sedimentador',
    'animador_comunidad',
    'coordinador_comunidad',
    'vocal',
    'asesor',
    'coordinador_diocesano',
    'vocal_nacional',
    'coordinador_nacional',
    'administrador'
  ) then
    raise exception 'No tenes permisos para publicar en esta seccion. Rol detectado: %, estado: %, seccion: %.', actor_role, actor_status, p_section;
  end if;

  if p_section not in ('oraciones', 'cancionero', 'himno') then
    raise exception 'Seccion invalida.';
  end if;

  if nullif(trim(p_title), '') is null or nullif(trim(p_body), '') is null then
    raise exception 'Titulo y contenido son obligatorios.';
  end if;

  insert into public.app_library_items (
    id,
    section,
    title,
    subtitle,
    body,
    image_url,
    category,
    source,
    item_date,
    status,
    sort_order,
    created_by,
    updated_by,
    updated_at,
    archived_at
  )
  values (
    coalesce(p_id, gen_random_uuid()),
    p_section,
    trim(p_title),
    nullif(trim(coalesce(p_subtitle, '')), ''),
    trim(p_body),
    nullif(trim(coalesce(p_image_url, '')), ''),
    null,
    null,
    null,
    'publicado',
    coalesce(p_sort_order, 100),
    auth.uid(),
    auth.uid(),
    now(),
    null
  )
  on conflict (id) do update set
    section = excluded.section,
    title = excluded.title,
    subtitle = excluded.subtitle,
    body = excluded.body,
    image_url = excluded.image_url,
    category = null,
    source = null,
    item_date = null,
    status = 'publicado',
    sort_order = excluded.sort_order,
    updated_by = auth.uid(),
    updated_at = now(),
    archived_at = null
  returning id into saved_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (
    auth.uid(),
    'admin_upsert_library_item',
    jsonb_build_object('id', saved_id, 'section', p_section, 'title', p_title, 'status', 'publicado')
  );

  return saved_id;
end;
$$;

grant execute on function public.admin_upsert_library_item(uuid, text, text, text, text, text, text, text, date, text, integer) to authenticated;

create or replace function public.admin_archive_library_item(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
begin
  if not exists (select 1 from public.app_library_items where id = p_id and archived_at is null) then
    raise exception 'Contenido no encontrado.';
  end if;

  if not public.current_user_can_manage_library_item(p_id) then
    raise exception 'No tenes permisos para eliminar este contenido.';
  end if;

  update public.app_library_items
  set archived_at = now(), updated_by = auth.uid(), updated_at = now()
  where id = p_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_archive_library_item', jsonb_build_object('id', p_id));
end;
$$;

grant execute on function public.admin_archive_library_item(uuid) to authenticated;

insert into storage.buckets (id, name, public)
values ('library-images', 'library-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Imagenes de biblioteca visibles" on storage.objects;
create policy "Imagenes de biblioteca visibles"
on storage.objects
for select
using (bucket_id = 'library-images');

drop policy if exists "Editores cargan imagenes de biblioteca" on storage.objects;
create policy "Editores cargan imagenes de biblioteca"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'library-images'
  and public.current_user_can_publish_library_item((storage.foldername(name))[1])
);

drop policy if exists "Editores actualizan imagenes de biblioteca" on storage.objects;
create policy "Editores actualizan imagenes de biblioteca"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'library-images'
  and public.current_user_can_publish_library_item((storage.foldername(name))[1])
)
with check (
  bucket_id = 'library-images'
  and public.current_user_can_publish_library_item((storage.foldername(name))[1])
);
