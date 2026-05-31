-- Bloques 3 y 4: permisos reales + subrangos dirigenciales.
-- Ejecutar en Supabase SQL Editor antes de exigir persistencia remota de subrole_key.

alter table public.profiles
  add column if not exists subrole_key text;

alter table public.profiles
  drop constraint if exists profiles_subrole_key_check;

alter table public.profiles
  add constraint profiles_subrole_key_check
  check (
    subrole_key is null
    or subrole_key in (
      'proceso_educativo',
      'formacion_espiritualidad',
      'retaguardia_finanzas',
      'pastoral',
      'secretario'
    )
  );

alter table public.news
  add column if not exists subrole_key text;

alter table public.events
  add column if not exists subrole_key text;

alter table public.materials
  add column if not exists subrole_key text;

alter table public.community_publications
  add column if not exists subrole_key text;

create index if not exists profiles_subrole_key_idx on public.profiles(subrole_key);
create index if not exists news_subrole_key_idx on public.news(subrole_key);
create index if not exists events_subrole_key_idx on public.events(subrole_key);
create index if not exists materials_subrole_key_idx on public.materials(subrole_key);
create index if not exists community_publications_subrole_key_idx on public.community_publications(subrole_key);

comment on column public.profiles.subrole_key is 'Subrango dirigencial. No reemplaza role; complementa permisos y filtros.';
comment on column public.news.subrole_key is 'Filtro opcional por subrango dirigencial.';
comment on column public.events.subrole_key is 'Filtro opcional por subrango dirigencial.';
comment on column public.materials.subrole_key is 'Filtro opcional por subrango dirigencial.';
comment on column public.community_publications.subrole_key is 'Filtro opcional por subrango dirigencial.';
