-- Patch beta movil: preferencias por usuario y tokens push.
-- Ejecutar en Supabase SQL Editor despues del patch estructural.

create table if not exists public.user_agenda_preferences (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  item_key text not null,
  preference_type text not null check (preference_type in ('favorite', 'reminder')),
  item_title text,
  item_date date,
  item_source text,
  created_at timestamptz not null default now(),
  primary key (user_id, item_key, preference_type)
);

alter table public.user_agenda_preferences enable row level security;

drop policy if exists "Cada usuario ve sus preferencias de agenda" on public.user_agenda_preferences;
create policy "Cada usuario ve sus preferencias de agenda"
on public.user_agenda_preferences for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Cada usuario crea sus preferencias de agenda" on public.user_agenda_preferences;
create policy "Cada usuario crea sus preferencias de agenda"
on public.user_agenda_preferences for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Cada usuario actualiza sus preferencias de agenda" on public.user_agenda_preferences;
create policy "Cada usuario actualiza sus preferencias de agenda"
on public.user_agenda_preferences for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Cada usuario borra sus preferencias de agenda" on public.user_agenda_preferences;
create policy "Cada usuario borra sus preferencias de agenda"
on public.user_agenda_preferences for delete
to authenticated
using (user_id = auth.uid());

create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null unique,
  platform text,
  device_name text,
  app_version text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.device_push_tokens enable row level security;

drop policy if exists "Cada usuario ve sus tokens push" on public.device_push_tokens;
create policy "Cada usuario ve sus tokens push"
on public.device_push_tokens for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Cada usuario registra sus tokens push" on public.device_push_tokens;
create policy "Cada usuario registra sus tokens push"
on public.device_push_tokens for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Cada usuario actualiza sus tokens push" on public.device_push_tokens;
create policy "Cada usuario actualiza sus tokens push"
on public.device_push_tokens for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create or replace function public.register_push_token(
  p_expo_push_token text,
  p_platform text default null,
  p_device_name text default null,
  p_app_version text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuario no autenticado';
  end if;

  insert into public.device_push_tokens (
    user_id,
    expo_push_token,
    platform,
    device_name,
    app_version,
    last_seen_at
  )
  values (
    auth.uid(),
    p_expo_push_token,
    p_platform,
    p_device_name,
    p_app_version,
    now()
  )
  on conflict (expo_push_token)
  do update set
    user_id = excluded.user_id,
    platform = excluded.platform,
    device_name = excluded.device_name,
    app_version = excluded.app_version,
    last_seen_at = now();
end;
$$;

grant execute on function public.register_push_token(text, text, text, text) to authenticated;
