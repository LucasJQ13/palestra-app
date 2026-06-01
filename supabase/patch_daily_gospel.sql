-- Arquitectura para Evangelio del Dia automatico.
-- Ejecutar en Supabase SQL Editor antes de desplegar la Edge Function fetch-daily-gospel.

create table if not exists public.daily_gospel (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  title text not null default 'Evangelio del Dia',
  citation text,
  gospel_text text not null,
  reflection_title text,
  reflection_text text,
  prayer_text text,
  source_name text not null default 'Don Bosco Argentina',
  source_url text not null,
  reflection_source_url text,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.daily_gospel enable row level security;

drop policy if exists "Evangelio diario visible para todos" on public.daily_gospel;
create policy "Evangelio diario visible para todos"
on public.daily_gospel
for select
to anon, authenticated
using (true);

drop policy if exists "Solo servicio administra evangelio diario" on public.daily_gospel;
create policy "Solo servicio administra evangelio diario"
on public.daily_gospel
for all
to service_role
using (true)
with check (true);

create or replace function public.touch_daily_gospel_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_daily_gospel_updated_at on public.daily_gospel;
create trigger trg_daily_gospel_updated_at
before update on public.daily_gospel
for each row
execute function public.touch_daily_gospel_updated_at();
