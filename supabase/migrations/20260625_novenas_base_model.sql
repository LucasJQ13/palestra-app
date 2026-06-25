-- Objetivo: Crear tabla base para novenas interactivas en "Formación y espiritualidad"
-- Contexto: Soporte para novenas de 9 días con alcance nacional/provincial, quiz, notificaciones
-- Issue: #115
-- Dependencias: provinces (existente), profiles (existente)
-- Tablas o funciones afectadas: Creación de public.novenas, public.novena_participations
-- Riesgo: Bajo; creación de nuevas tablas sin impacto en datos existentes
-- Compatibilidad: No cambia contratos RPC existentes. Requiere frontend >= 0.1.39
-- Rollback manual sugerido:
--   drop table if exists public.novena_participations cascade;
--   drop table if exists public.novenas cascade;
-- Verificación:
--   select tablename from pg_tables where schemaname = 'public' and tablename in ('novenas', 'novena_participations');
--   select count(*) from information_schema.columns where table_name = 'novenas' and table_schema = 'public';

begin;

-- ============================================================================
-- Tabla: public.novenas
-- ============================================================================
-- Entidad principal para novenas interactivas.
-- Estructura mínima según Issue #115.

create table if not exists public.novenas (
  id uuid primary key default gen_random_uuid(),
  
  -- Contenido base
  title text not null,
  description text,
  banner_url text,
  
  -- Alcance y provincia
  scope text not null check (scope in ('nacional', 'provincial')),
  province_id uuid references public.provinces(id) on delete restrict,
  
  -- Ciclo de vida
  status text not null default 'borrador' check (status in ('borrador', 'activa', 'archivada')),
  starts_at date not null,
  ends_at date not null,
  
  -- Fechas de control
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  
  -- Datos de configuración (JSONB para flexibilidad)
  -- Estructura esperada:
  -- {
  --   "days": [
  --     {
  --       "dayNumber": 1,
  --       "title": "Día 1",
  --       "prayer": "...",
  --       "reflection": "...",
  --       "intention": "...",
  --       "action": { "label": "...", "description": "..." }
  --     },
  --     ...9 días total
  --   ],
  --   "quiz_config": { "enabled": false, "quiz_id": null, "mode": "por_novena" },
  --   "notification_config": { "enabled": true, "suggested_time": "09:00", "time_zone": "America/Argentina/Buenos_Aires" },
  --   "participation_config": { "enabled": true, "button_label": "Ya recé este día" }
  -- }
  config jsonb not null default '{"days": [], "quiz_config": {}, "notification_config": {}, "participation_config": {}}',
  
  -- Roles visibles
  visible_roles text[] default null,
  
  constraint novena_dates_valid check (ends_at > starts_at),
  constraint novena_active_one_per_scope check (true) -- Validación en aplicación + RPC
);

create index novenas_scope_active_idx on public.novenas (scope, is_active, archived_at) where archived_at is null;
create index novenas_province_active_idx on public.novenas (province_id, is_active, archived_at) where scope = 'provincial' and archived_at is null;
create index novenas_status_idx on public.novenas (status);
create index novenas_created_at_idx on public.novenas (created_at desc);

-- ============================================================================
-- Tabla: public.novena_participations
-- ============================================================================
-- Rastreo de participación de usuarios en novenas.
-- Registra cuándo un usuario marcó "Ya recé este día".

create table if not exists public.novena_participations (
  id uuid primary key default gen_random_uuid(),
  
  novena_id uuid not null references public.novenas(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  day_number smallint not null check (day_number >= 1 and day_number <= 9),
  
  -- Marca temporal de participación
  participated_at timestamptz not null default now(),
  
  -- Deduplicación: un usuario puede marcar un día solo una vez
  unique(novena_id, profile_id, day_number),
  
  constraint novena_participation_valid_day check (day_number >= 1 and day_number <= 9)
);

create index novena_participations_novena_idx on public.novena_participations (novena_id);
create index novena_participations_profile_idx on public.novena_participations (profile_id);
create index novena_participations_day_idx on public.novena_participations (day_number);
create index novena_participations_participated_at_idx on public.novena_participations (participated_at desc);

-- ============================================================================
-- Triggers
-- ============================================================================
-- Actualizar updated_at en novenas

create or replace function public.update_novena_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists novenas_update_updated_at_trigger on public.novenas;
create trigger novenas_update_updated_at_trigger
  before update on public.novenas
  for each row
  execute function public.update_novena_updated_at();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================
-- Políticas de acceso para novenas

alter table public.novenas enable row level security;

-- SELECT: Usuario puede ver novena si es pública (nacional activa) o si pertenece a su provincia
create policy "novenas_select_public"
  on public.novenas
  for select
  using (
    (scope = 'nacional' and is_active = true and archived_at is null)
    or (
      scope = 'provincial'
      and is_active = true
      and archived_at is null
      and province_id in (
        select id from public.provinces
        where name = (select province from public.profiles where id = auth.uid())
      )
    )
    or (
      select role from public.profiles where id = auth.uid()
    ) in ('administrador', 'coordinador_nacional', 'vocal_nacional', 'coordinador_diocesano', 'asesor')
  );

-- INSERT/UPDATE/DELETE: Solo admin o coordinadores pueden modificar
create policy "novenas_insert_admin"
  on public.novenas
  for insert
  with check (
    (select role from public.profiles where id = auth.uid())
    in ('administrador', 'coordinador_nacional', 'vocal_nacional')
  );

create policy "novenas_update_admin"
  on public.novenas
  for update
  using (
    (select role from public.profiles where id = auth.uid())
    in ('administrador', 'coordinador_nacional', 'vocal_nacional', 'coordinador_diocesano')
  )
  with check (
    (select role from public.profiles where id = auth.uid())
    in ('administrador', 'coordinador_nacional', 'vocal_nacional', 'coordinador_diocesano')
  );

create policy "novenas_delete_admin"
  on public.novenas
  for delete
  using (
    (select role from public.profiles where id = auth.uid())
    in ('administrador', 'coordinador_nacional', 'vocal_nacional')
  );

-- ============================================================================
-- Row Level Security para participations
-- ============================================================================

alter table public.novena_participations enable row level security;

-- SELECT: Usuario ve sus propias participaciones + admin
create policy "novena_participations_select"
  on public.novena_participations
  for select
  using (
    profile_id = auth.uid()
    or (select role from public.profiles where id = auth.uid()) in ('administrador', 'coordinador_nacional')
  );

-- INSERT: Usuario registra su propia participación
create policy "novena_participations_insert"
  on public.novena_participations
  for insert
  with check (
    profile_id = auth.uid()
    and novena_id in (
      select id from public.novenas where is_active = true and archived_at is null
    )
  );

-- DELETE: Usuario puede borrar su propia participación
create policy "novena_participations_delete"
  on public.novena_participations
  for delete
  using (
    profile_id = auth.uid()
  );

-- ============================================================================
-- Comentarios para documentación
-- ============================================================================

comment on table public.novenas is 'Novenas interactivas para sección "Formación y espiritualidad". Soporta 9 días, alcance nacional/provincial, quiz, notificaciones.';
comment on column public.novenas.scope is 'Alcance: nacional (visible a todos) o provincial (visible solo en esa provincia)';
comment on column public.novenas.status is 'Estado: borrador (no publicada), activa (publicada), archivada (histórica)';
comment on column public.novenas.config is 'JSONB con estructura: {days, quiz_config, notification_config, participation_config}';
comment on column public.novenas.visible_roles is 'Array de roles que pueden ver la novena. NULL = todos con acceso';

comment on table public.novena_participations is 'Rastreo de participación en novenas. Registra cuando un usuario marcó "Ya recé este día".';
comment on column public.novena_participations.day_number is 'Día de la novena (1-9) en el que el usuario participó';

commit;
