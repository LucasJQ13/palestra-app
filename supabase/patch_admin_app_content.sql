create table if not exists public.app_content (
  tab_key text primary key references public.app_tabs(key) on delete cascade,
  title text not null,
  body text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

alter table public.app_content enable row level security;

drop policy if exists "Contenido de pestanas visible para todos" on public.app_content;
create policy "Contenido de pestanas visible para todos"
on public.app_content
for select
using (true);

insert into public.app_content (tab_key, title, body)
values
  ('inicio', 'Bienvenidos a Palestra', 'Espacio nacional para comunicar avisos importantes, novedades y vida comunitaria.'),
  ('notilestra', 'Noticias y agenda del movimiento', 'Publicaciones, fechas y recordatorios para acompanar el camino de las comunidades.'),
  ('materiales', 'Biblioteca de recursos', 'Documentos y materiales disponibles segun el rango y los permisos de cada usuario.'),
  ('comunidades', 'Comunidades de Argentina', 'Mapa vivo de comunidades por provincia, con datos de contacto, horarios y presentacion.'),
  ('historia', 'Memoria e identidad', 'Historia, preguntas frecuentes y textos institucionales del movimiento.'),
  ('contacto', 'Estamos para ayudarte', 'Canales para encontrar una comunidad, pedir ayuda o colaborar con el movimiento.')
on conflict (tab_key) do nothing;

create or replace function public.admin_update_app_content(
  p_tab_key text,
  p_title text,
  p_body text
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

  insert into public.app_content (tab_key, title, body, updated_by, updated_at)
  values (p_tab_key, p_title, p_body, auth.uid(), now())
  on conflict (tab_key) do update
  set
    title = excluded.title,
    body = excluded.body,
    updated_by = excluded.updated_by,
    updated_at = now();

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_app_content', jsonb_build_object('tab_key', p_tab_key, 'title', p_title));
end;
$$;

grant execute on function public.admin_update_app_content(text, text, text) to authenticated;
