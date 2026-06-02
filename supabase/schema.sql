create type public.user_status as enum ('pendiente', 'aprobado', 'bloqueado');
create type public.user_role as enum (
  'invitado',
  'palestrista',
  'sedimentador',
  'coordinador_comunidad',
  'animador_comunidad',
  'vocal',
  'coordinador_diocesano',
  'asesor',
  'vocal_nacional',
  'coordinador_nacional',
  'administrador'
);

create table public.provinces (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  region text not null,
  logo_url text,
  is_active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  province_id uuid references public.provinces(id),
  community_name text,
  status public.user_status not null default 'pendiente',
  role public.user_role not null default 'invitado',
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id)
);

create table public.permissions (
  key text primary key,
  label text not null,
  description text
);

create table public.role_permissions (
  role public.user_role not null,
  permission_key text not null references public.permissions(key) on delete cascade,
  primary key (role, permission_key)
);

create table public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  province_id uuid references public.provinces(id),
  is_public boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  starts_at timestamptz not null,
  province_id uuid references public.provinces(id),
  is_public boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  file_path text,
  required_permission text references public.permissions(key),
  is_public boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

insert into public.provinces (name, region) values
  ('Salta', 'NOA'),
  ('Jujuy', 'NOA'),
  ('Tucuman', 'NOA'),
  ('Catamarca', 'NOA'),
  ('Cordoba', 'Centro'),
  ('San Luis', 'Cuyo');

insert into public.permissions (key, label, description) values
  ('ver_inicio', 'Ver inicio', 'Acceso a la pantalla inicial.'),
  ('ver_noticias', 'Ver noticias', 'Acceso a avisos y Notilestra.'),
  ('ver_comunidades', 'Ver comunidades', 'Acceso al listado de comunidades.'),
  ('ver_historia', 'Ver historia', 'Acceso a la historia del movimiento.'),
  ('ver_contacto', 'Ver contacto', 'Acceso a canales de contacto.'),
  ('ver_materiales_internos', 'Ver materiales internos', 'Acceso a documentos para miembros aprobados.'),
  ('descargar_archivos', 'Descargar archivos', 'Permite descargar archivos generales.'),
  ('descargar_archivos_exclusivos', 'Descargar archivos exclusivos', 'Permite descargar archivos para sedimentadores y dirigentes.'),
  ('ver_fechas_privadas', 'Ver fechas privadas', 'Permite ver fechas no publicas.'),
  ('ver_noticias_comunidad', 'Ver noticias de comunidad', 'Permite ver noticias internas de la comunidad de origen.'),
  ('subir_noticias_comunidad', 'Subir noticias de comunidad', 'Permite publicar noticias en la comunidad propia.'),
  ('gestionar_comunidad', 'Gestionar comunidad', 'Permite gestionar horarios y fechas especiales de una comunidad.'),
  ('enviar_mensajes_comunidad', 'Enviar mensajes de comunidad', 'Permite enviar mensajes a miembros de una comunidad.'),
  ('aprobar_sedimentadores', 'Aprobar sedimentadores', 'Permite aprobar sedimentadores.'),
  ('otorgar_roles_provincia', 'Otorgar roles provincia', 'Permite otorgar roles dentro de la provincia.'),
  ('otorgar_roles_diocesanos', 'Otorgar roles diocesanos', 'Permite otorgar roles como Vocal o Asesor.'),
  ('ver_seccion_asesores', 'Ver seccion asesores', 'Acceso a seccion exclusiva de asesores.'),
  ('gestionar_permisos', 'Gestionar permisos', 'Permite administrar permisos de roles.'),
  ('gestionar_sistema', 'Gestionar sistema', 'Permite administrar configuracion global del sistema.'),
  ('gestionar_roles_globales', 'Gestionar roles globales', 'Permite crear, editar o quitar roles.'),
  ('gestionar_pestanas', 'Gestionar pestanas', 'Permite crear, ocultar o quitar pestanas.'),
  ('gestionar_comunidades_global', 'Gestionar comunidades global', 'Permite modificar comunidades en todas las provincias.'),
  ('enviar_notificaciones', 'Enviar notificaciones', 'Permite enviar avisos a usuarios.'),
  ('gestionar_contenido', 'Gestionar contenido', 'Permite crear y editar noticias, eventos y materiales.');

insert into public.role_permissions (role, permission_key) values
  ('invitado', 'ver_inicio'),
  ('invitado', 'ver_noticias'),
  ('invitado', 'ver_comunidades'),
  ('invitado', 'ver_historia'),
  ('invitado', 'ver_contacto'),
  ('palestrista', 'ver_inicio'),
  ('palestrista', 'ver_noticias'),
  ('palestrista', 'ver_comunidades'),
  ('palestrista', 'ver_historia'),
  ('palestrista', 'ver_contacto'),
  ('palestrista', 'ver_materiales_internos'),
  ('palestrista', 'descargar_archivos'),
  ('palestrista', 'ver_noticias_comunidad'),
  ('sedimentador', 'descargar_archivos_exclusivos'),
  ('sedimentador', 'ver_fechas_privadas'),
  ('coordinador_comunidad', 'subir_noticias_comunidad'),
  ('coordinador_comunidad', 'gestionar_comunidad'),
  ('coordinador_comunidad', 'enviar_mensajes_comunidad'),
  ('animador_comunidad', 'subir_noticias_comunidad'),
  ('animador_comunidad', 'gestionar_comunidad'),
  ('animador_comunidad', 'enviar_mensajes_comunidad'),
  ('vocal', 'aprobar_sedimentadores'),
  ('vocal', 'otorgar_roles_provincia'),
  ('vocal', 'gestionar_contenido'),
  ('coordinador_diocesano', 'otorgar_roles_diocesanos'),
  ('asesor', 'ver_seccion_asesores'),
  ('vocal_nacional', 'gestionar_contenido'),
  ('vocal_nacional', 'enviar_notificaciones'),
  ('coordinador_nacional', 'gestionar_permisos'),
  ('coordinador_nacional', 'gestionar_contenido'),
  ('administrador', 'gestionar_sistema'),
  ('administrador', 'gestionar_roles_globales'),
  ('administrador', 'gestionar_pestanas'),
  ('administrador', 'gestionar_comunidades_global'),
  ('administrador', 'gestionar_permisos'),
  ('administrador', 'gestionar_contenido'),
  ('administrador', 'enviar_notificaciones');

alter table public.provinces enable row level security;
alter table public.profiles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.news enable row level security;
alter table public.events enable row level security;
alter table public.materials enable row level security;

create policy "Provincias publicas" on public.provinces for select using (true);
create policy "Permisos visibles para usuarios" on public.permissions for select to authenticated using (true);
create policy "Permisos por rol visibles para usuarios" on public.role_permissions for select to authenticated using (true);

create policy "Noticias publicas" on public.news for select using (is_public = true);
create policy "Noticias internas para aprobados" on public.news for select to authenticated using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'aprobado'
  )
);

create policy "Eventos publicos" on public.events for select using (is_public = true);
create policy "Eventos internos para aprobados" on public.events for select to authenticated using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'aprobado'
  )
);

create policy "Materiales publicos" on public.materials for select using (is_public = true);
create policy "Materiales internos por permiso" on public.materials for select to authenticated using (
  required_permission is null
  or exists (
    select 1
    from public.profiles
    join public.role_permissions on role_permissions.role = profiles.role
    where profiles.id = auth.uid()
      and profiles.status = 'aprobado'
      and role_permissions.permission_key = materials.required_permission
  )
);

create policy "Cada usuario ve su perfil" on public.profiles for select to authenticated using (id = auth.uid());
create policy "Cada usuario crea su perfil" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "Cada usuario actualiza datos basicos" on public.profiles for update to authenticated using (id = auth.uid());
