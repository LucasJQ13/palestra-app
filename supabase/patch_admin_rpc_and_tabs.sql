create table if not exists public.app_tabs (
  key text primary key,
  label text not null,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_tabs enable row level security;

drop policy if exists "Pestanas visibles para todos" on public.app_tabs;
create policy "Pestanas visibles para todos"
on public.app_tabs
for select
using (true);

insert into public.app_tabs (key, label, is_visible, sort_order)
values
  ('inicio', 'Inicio', true, 10),
  ('notilestra', 'Notilestra', true, 20),
  ('materiales', 'Materiales', true, 30),
  ('comunidades', 'Comunidades', true, 40),
  ('historia', 'Historia', true, 50),
  ('contacto', 'Contacto', true, 60),
  ('perfil', 'Perfil', true, 70)
on conflict (key) do nothing;

create or replace function public.current_user_is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'aprobado'
      and profiles.role in ('administrador', 'coordinador_nacional', 'vocal_nacional')
  );
$$;

grant execute on function public.current_user_is_admin() to authenticated;

create or replace function public.admin_create_news(
  p_title text,
  p_body text,
  p_is_public boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  insert into public.news (title, body, is_public, created_by)
  values (p_title, p_body, p_is_public, auth.uid())
  returning id into new_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_create_news', jsonb_build_object('title', p_title));

  return new_id;
end;
$$;

grant execute on function public.admin_create_news(text, text, boolean) to authenticated;

create or replace function public.admin_create_event(
  p_title text,
  p_description text,
  p_starts_at timestamptz,
  p_is_public boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  insert into public.events (title, description, starts_at, is_public, created_by)
  values (p_title, p_description, p_starts_at, p_is_public, auth.uid())
  returning id into new_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_create_event', jsonb_build_object('title', p_title, 'starts_at', p_starts_at));

  return new_id;
end;
$$;

grant execute on function public.admin_create_event(text, text, timestamptz, boolean) to authenticated;

create or replace function public.admin_update_tab(
  p_key text,
  p_label text,
  p_is_visible boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  update public.app_tabs
  set
    label = p_label,
    is_visible = p_is_visible,
    updated_at = now()
  where key = p_key;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_tab', jsonb_build_object('key', p_key, 'label', p_label, 'is_visible', p_is_visible));
end;
$$;

grant execute on function public.admin_update_tab(text, text, boolean) to authenticated;
