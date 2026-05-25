-- Botones dinamicos para "Documentos de la Iglesia" en Descargas.

create table if not exists public.church_document_buttons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  logo_url text,
  target_url text not null,
  enabled boolean not null default true,
  sort_order integer not null default 100,
  archived_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.church_document_buttons enable row level security;

drop policy if exists "Documentos Iglesia visibles" on public.church_document_buttons;
create policy "Documentos Iglesia visibles"
on public.church_document_buttons for select
using (archived_at is null and enabled = true);

drop policy if exists "Administradores gestionan documentos Iglesia" on public.church_document_buttons;
create policy "Administradores gestionan documentos Iglesia"
on public.church_document_buttons for all to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create index if not exists church_document_buttons_order_idx
on public.church_document_buttons (enabled, sort_order, created_at)
where archived_at is null;

insert into public.church_document_buttons (
  title,
  logo_url,
  target_url,
  enabled,
  sort_order
)
values (
  'Enciclica Papa Leon XIV',
  'https://upload.wikimedia.org/wikipedia/commons/0/00/Emblem_of_the_Holy_See_%28vatican.va%29.svg',
  'https://www.vatican.va/content/leo-xiv/es/encyclicals/documents/20260515-magnifica-humanitas.html',
  true,
  1
)
on conflict do nothing;

grant select on public.church_document_buttons to anon, authenticated;
