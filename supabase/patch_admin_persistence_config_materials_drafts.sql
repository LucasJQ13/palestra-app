-- Persistencia base para Panel Administrador Palestra
-- Ejecutar completo en Supabase SQL Editor. Es idempotente.

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

create table if not exists public.admin_config (
  id boolean primary key default true,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id),
  constraint admin_config_singleton check (id = true)
);

alter table public.materials
  add column if not exists category text not null default 'General',
  add column if not exists visibility text not null default 'interno',
  add column if not exists file_url text,
  add column if not exists sort_order integer not null default 100,
  add column if not exists archived_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid references public.profiles(id);

create table if not exists public.news_drafts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text not null default 'General',
  image_url text,
  province_id uuid references public.provinces(id),
  is_featured boolean not null default false,
  status text not null default 'borrador' check (status in ('borrador', 'publicada', 'archivada')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_news_id uuid references public.news(id)
);

alter table public.app_settings enable row level security;
alter table public.admin_config enable row level security;
alter table public.news_drafts enable row level security;

drop policy if exists "Configuracion visible para todos" on public.app_settings;
create policy "Configuracion visible para todos"
on public.app_settings for select using (true);

drop policy if exists "Admin config visible para todos" on public.admin_config;
create policy "Admin config visible para todos"
on public.admin_config for select using (true);

drop policy if exists "Borradores visibles para administradores" on public.news_drafts;
create policy "Borradores visibles para administradores"
on public.news_drafts for select to authenticated
using (public.current_user_is_admin());

insert into public.admin_config (id, config)
values (
  true,
  jsonb_build_object(
    'identity', jsonb_build_object(
      'appName', 'Palestra',
      'subtitle', 'Movimiento Catolico',
      'description', 'Movimiento catolico juvenil y comunitario presente en Argentina.',
      'logoUrl', '',
      'heroImageUrl', '',
      'primaryColor', '#2d8dc8',
      'secondaryColor', '#5da7db'
    ),
    'home', jsonb_build_object(
      'heroTitle', 'Una app para caminar juntos.',
      'heroText', 'Noticias, agenda, materiales y comunicacion interna para las comunidades de Palestra.',
      'featuredBanner', 'Agenda comunitaria',
      'visibleModules', jsonb_build_array('noticias', 'comunidades', 'materiales', 'perfil')
    ),
    'contact', jsonb_build_object(
      'email', 'contacto@palestra.org.ar',
      'phone', '+54 9 387 000-0000',
      'instagram', '@palestra.argentina',
      'helpText', 'Te ayudamos a encontrar una comunidad cercana o responder consultas sobre el movimiento.',
      'donationText', 'Si queres colaborar, escribinos y te contamos las formas disponibles.'
    ),
    'settings', jsonb_build_object(
      'maintenanceMode', false,
      'globalMessage', '',
      'futureForumEnabled', false,
      'futureChatEnabled', false
    ),
    'periodoMotivador', jsonb_build_object(
      'active', false,
      'title', 'PM',
      'body', 'Espacio de preparacion, materiales y textos asociados al PM.',
      'imageUrl', ''
    )
  )
)
on conflict (id) do nothing;

create or replace function public.get_admin_config()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select config from public.admin_config where id = true;
$$;

grant execute on function public.get_admin_config() to anon, authenticated;

create or replace function public.admin_update_config(p_config jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  insert into public.admin_config (id, config, updated_by, updated_at)
  values (true, p_config, auth.uid(), now())
  on conflict (id) do update
  set
    config = excluded.config,
    updated_by = excluded.updated_by,
    updated_at = now();

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_config', jsonb_build_object('keys', jsonb_object_keys(p_config)));
end;
$$;

grant execute on function public.admin_update_config(jsonb) to authenticated;

create or replace function public.admin_upsert_material(
  p_id uuid,
  p_title text,
  p_description text,
  p_category text,
  p_visibility text,
  p_required_permission text,
  p_file_url text,
  p_file_path text,
  p_sort_order integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  material_id uuid;
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  material_id := coalesce(p_id, gen_random_uuid());

  insert into public.materials (
    id, title, description, category, visibility, required_permission, file_url, file_path,
    is_public, sort_order, created_by, updated_by, updated_at
  )
  values (
    material_id,
    p_title,
    p_description,
    coalesce(nullif(trim(p_category), ''), 'General'),
    coalesce(nullif(trim(p_visibility), ''), 'interno'),
    nullif(trim(coalesce(p_required_permission, '')), ''),
    nullif(trim(coalesce(p_file_url, '')), ''),
    nullif(trim(coalesce(p_file_path, '')), ''),
    coalesce(p_visibility, 'interno') = 'publico',
    coalesce(p_sort_order, 100),
    auth.uid(),
    auth.uid(),
    now()
  )
  on conflict (id) do update
  set
    title = excluded.title,
    description = excluded.description,
    category = excluded.category,
    visibility = excluded.visibility,
    required_permission = excluded.required_permission,
    file_url = excluded.file_url,
    file_path = excluded.file_path,
    is_public = excluded.is_public,
    sort_order = excluded.sort_order,
    updated_by = auth.uid(),
    updated_at = now();

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_upsert_material', jsonb_build_object('material_id', material_id, 'title', p_title));

  return material_id;
end;
$$;

grant execute on function public.admin_upsert_material(uuid, text, text, text, text, text, text, text, integer) to authenticated;

create or replace function public.admin_archive_material(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  update public.materials
  set archived_at = now(), updated_by = auth.uid(), updated_at = now()
  where id = p_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_archive_material', jsonb_build_object('material_id', p_id));
end;
$$;

grant execute on function public.admin_archive_material(uuid) to authenticated;

create or replace function public.admin_upsert_news_draft(
  p_id uuid,
  p_title text,
  p_body text,
  p_category text,
  p_image_url text,
  p_is_featured boolean,
  p_status text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  draft_id uuid;
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  draft_id := coalesce(p_id, gen_random_uuid());

  insert into public.news_drafts (id, title, body, category, image_url, is_featured, status, created_by, updated_at)
  values (
    draft_id,
    p_title,
    p_body,
    coalesce(nullif(trim(p_category), ''), 'General'),
    nullif(trim(coalesce(p_image_url, '')), ''),
    coalesce(p_is_featured, false),
    coalesce(nullif(trim(p_status), ''), 'borrador'),
    auth.uid(),
    now()
  )
  on conflict (id) do update
  set
    title = excluded.title,
    body = excluded.body,
    category = excluded.category,
    image_url = excluded.image_url,
    is_featured = excluded.is_featured,
    status = excluded.status,
    updated_at = now();

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_upsert_news_draft', jsonb_build_object('draft_id', draft_id, 'status', p_status));

  return draft_id;
end;
$$;

grant execute on function public.admin_upsert_news_draft(uuid, text, text, text, text, boolean, text) to authenticated;
