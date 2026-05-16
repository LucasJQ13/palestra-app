-- Soporte para Descargas PDF, mensajes a comunidades y Periodo Motivador.
-- Ejecutar despues de los parches actuales de administracion.

alter table public.materials
  add column if not exists category text,
  add column if not exists visibility text not null default 'interno',
  add column if not exists file_url text,
  add column if not exists sort_order integer not null default 100,
  add column if not exists archived_at timestamptz;

alter table public.materials
  drop constraint if exists materials_visibility_check;

alter table public.materials
  add constraint materials_visibility_check
  check (visibility in ('publico', 'interno', 'reservado', 'administrador', 'desde_rango', 'solo_rango'));

create table if not exists public.community_contact_messages (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references public.communities(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  sender_name text,
  message text not null check (char_length(message) <= 500),
  status text not null default 'pendiente' check (status in ('pendiente', 'leido', 'respondido', 'archivado')),
  created_at timestamptz not null default now()
);

create table if not exists public.motivador_periods (
  id uuid primary key default gen_random_uuid(),
  province_id uuid references public.provinces(id) on delete set null,
  gender text not null check (gender in ('masculino', 'femenino')),
  pm_number integer not null,
  starts_on date not null,
  ends_on date not null,
  retreat_house text not null,
  address text not null,
  description text,
  place_photo_url text,
  flyer_url text,
  visible_to_lower_roles boolean not null default false,
  is_visible boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.community_contact_messages enable row level security;
alter table public.motivador_periods enable row level security;

drop policy if exists "Mensajes de contacto propios o dirigenciales" on public.community_contact_messages;
create policy "Mensajes de contacto propios o dirigenciales"
on public.community_contact_messages
for select
to authenticated
using (
  sender_id = auth.uid()
  or exists (
    select 1
    from public.profiles
    join public.communities on communities.id = community_contact_messages.community_id
    where profiles.id = auth.uid()
      and profiles.status = 'aprobado'
      and (
        profiles.role in ('administrador', 'vocal_nacional', 'coordinador_nacional')
        or (profiles.role in ('animador_comunidad', 'coordinador_comunidad') and profiles.community_name = communities.name)
        or (profiles.role in ('vocal', 'asesor', 'coordinador_diocesano') and profiles.province_id = communities.province_id)
      )
  )
);

drop policy if exists "Crear mensajes de contacto comunidad" on public.community_contact_messages;
create policy "Crear mensajes de contacto comunidad"
on public.community_contact_messages
for insert
with check (char_length(message) <= 500);

drop policy if exists "PM visibles por alcance y rango" on public.motivador_periods;
create policy "PM visibles por alcance y rango"
on public.motivador_periods
for select
using (
  is_visible = true
  and (
    visible_to_lower_roles = true
    or exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.status = 'aprobado'
        and profiles.role in ('sedimentador', 'animador_comunidad', 'coordinador_comunidad', 'vocal', 'asesor', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador')
        and (public.current_user_can_see_all_provinces() or profiles.province_id = motivador_periods.province_id or motivador_periods.province_id is null)
    )
  )
);

drop policy if exists "PM gestionables por dirigencia" on public.motivador_periods;
create policy "PM gestionables por dirigencia"
on public.motivador_periods
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'aprobado'
      and (
        profiles.role in ('administrador', 'vocal_nacional', 'coordinador_nacional')
        or (profiles.role in ('vocal', 'asesor', 'coordinador_diocesano') and profiles.province_id = motivador_periods.province_id)
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'aprobado'
      and (
        profiles.role in ('administrador', 'vocal_nacional', 'coordinador_nacional')
        or (profiles.role in ('vocal', 'asesor', 'coordinador_diocesano') and profiles.province_id = motivador_periods.province_id)
      )
  )
);
