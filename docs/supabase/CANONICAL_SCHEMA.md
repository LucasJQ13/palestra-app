# Esquema canónico Supabase - Palestra App

## 1. Objetivo

Este documento define el esquema canónico deseado para Supabase en Palestra App.

No es una migración ejecutable. Es una guía de diseño para ordenar la base actual, consolidar parches históricos y evitar que el frontend siga dependiendo de estructuras ambiguas o fallbacks.

## 2. Principios del esquema canónico

1. Toda entidad importante debe tener `id` estable.
2. Las relaciones deben usar ids, no nombres de texto.
3. Los nombres visibles deben separarse de los identificadores técnicos.
4. Toda tabla sensible debe tener RLS clara.
5. Toda RPC administrativa debe validar permisos dentro de la base.
6. Toda modificación importante debe dejar trazabilidad.
7. Toda migración debe ser versionada, idempotente y revisable.
8. Los campos legacy pueden mantenerse durante transición, pero no deben ser la base de nuevas funciones.

## 3. Dominios principales

El esquema canónico se organiza por dominios:

- Identidad y usuarios.
- Provincias y comunidades.
- Roles y permisos.
- Contenido y navegación.
- Noticias, agenda y PM.
- Materiales y biblioteca.
- Comunidad e interacciones.
- Notificaciones.
- QR y credenciales.
- Auditoría.
- Configuración remota.

## 4. Identidad y usuarios

### 4.1 `profiles`

Tabla central del perfil extendido del usuario.

Campos canónicos recomendados:

- `id uuid primary key`.
- `user_id uuid unique not null` vinculado a `auth.users.id`.
- `email text`.
- `full_name text`.
- `first_name text`.
- `last_name text`.
- `nickname text`.
- `phone text`.
- `birth_date date`.
- `avatar_url text`.
- `province_id uuid null`.
- `community_id uuid null`.
- `province text` legacy.
- `community_name text` legacy.
- `status text not null default 'pendiente'`.
- `role text not null default 'palestrista'`.
- `subrole_key text null`.
- `display_role_label text null`.
- `gender_preference text null`.
- `use_nickname_in_greetings boolean default false`.
- `credential_name_mode text default 'name'`.
- `perseverance_start_year integer null`.
- `personal_pm_type text null`.
- `personal_pm_number integer null`.
- `personal_pm_province text null`.
- `personal_pm_motto text null`.
- `pm_motto text null`.
- `created_at timestamptz default now()`.
- `updated_at timestamptz default now()`.
- `deleted_at timestamptz null`.

### 4.2 Regla de transición

Durante transición, mantener `province` y `community_name` porque el frontend actual los usa. Las nuevas relaciones deberían apoyarse progresivamente en `province_id` y `community_id`.

## 5. Provincias y comunidades

### 5.1 `provinces`

Campos canónicos recomendados:

- `id uuid primary key`.
- `slug text unique not null`.
- `name text not null`.
- `display_name text not null`.
- `region text null`.
- `logo_url text null`.
- `instagram_url text null`.
- `is_active boolean default true`.
- `archived_at timestamptz null`.
- `created_at timestamptz default now()`.
- `updated_at timestamptz default now()`.

Ejemplo:

- `slug`: `cordoba`.
- `name`: `Cordoba`.
- `display_name`: `Córdoba`.

### 5.2 `communities`

Campos canónicos recomendados:

- `id uuid primary key`.
- `province_id uuid not null references provinces(id)`.
- `slug text not null`.
- `name text not null`.
- `group_type text not null`.
- `address text null`.
- `phone text null`.
- `meeting_day text null`.
- `meeting_time text null`.
- `description text null`.
- `image_url text null`.
- `latitude numeric null`.
- `longitude numeric null`.
- `is_active boolean default true`.
- `archived_at timestamptz null`.
- `created_at timestamptz default now()`.
- `updated_at timestamptz default now()`.

Constraint recomendada:

- `unique(province_id, slug)`.

### 5.3 `province_community_sections`

Campos canónicos recomendados:

- `id uuid primary key`.
- `province_id uuid not null references provinces(id)`.
- `group_type text not null`.
- `is_enabled boolean default true`.
- `updated_at timestamptz default now()`.

Constraint recomendada:

- `unique(province_id, group_type)`.

## 6. Roles y permisos

### 6.1 `role_permissions`

Campos canónicos recomendados:

- `id uuid primary key`.
- `role text not null`.
- `permission_key text not null`.
- `enabled boolean default true`.
- `created_at timestamptz default now()`.
- `updated_at timestamptz default now()`.

Constraint recomendada:

- `unique(role, permission_key)`.

### 6.2 `province_role_labels`

Campos canónicos recomendados:

- `id uuid primary key`.
- `province_id uuid null references provinces(id)`.
- `role_key text not null`.
- `display_label text not null`.
- `description text null`.
- `is_active boolean default true`.
- `updated_at timestamptz default now()`.

### 6.3 `role_aliases`

Campos canónicos recomendados:

- `id uuid primary key`.
- `base_role text not null`.
- `display_label text not null`.
- `province_id uuid null references provinces(id)`.
- `province text null` legacy.
- `is_active boolean default true`.
- `updated_at timestamptz default now()`.

## 7. Contenido y navegación

### 7.1 `app_tabs`

Campos canónicos recomendados:

- `id uuid primary key`.
- `key text unique not null`.
- `label text not null`.
- `icon_name text not null`.
- `section_type text not null`.
- `is_visible boolean default true`.
- `sort_order integer default 999`.
- `visible_roles text[] null`.
- `created_at timestamptz default now()`.
- `updated_at timestamptz default now()`.

### 7.2 `app_content`

Campos canónicos recomendados:

- `id uuid primary key`.
- `tab_key text not null`.
- `title text null`.
- `body text null`.
- `image_url text null`.
- `blocks jsonb default '[]'`.
- `updated_by uuid null`.
- `updated_at timestamptz default now()`.

### 7.3 `admin_config`

Configuración institucional amplia. Puede mantenerse como JSON central si la app ya funciona así.

Campos recomendados:

- `id text primary key default 'default'`.
- `config jsonb not null`.
- `updated_by uuid null`.
- `updated_at timestamptz default now()`.

### 7.4 `app_runtime_config`

Campos recomendados:

- `id text primary key default 'default'`.
- `min_supported_version text`.
- `recommended_version text`.
- `maintenance_mode boolean default false`.
- `global_message text null`.
- `feature_flags jsonb default '{}'`.
- `catholic_news jsonb default '{}'`.
- `updated_at timestamptz default now()`.

## 8. Noticias, eventos y PM

### 8.1 `news`

Campos recomendados:

- `id uuid primary key`.
- `title text not null`.
- `body text not null`.
- `image_url text null`.
- `is_public boolean default true`.
- `province_id uuid null references provinces(id)`.
- `community_id uuid null references communities(id)`.
- `created_by uuid null`.
- `created_at timestamptz default now()`.
- `updated_at timestamptz default now()`.
- `archived_at timestamptz null`.

### 8.2 `events`

Campos recomendados:

- `id uuid primary key`.
- `title text not null`.
- `body text null`.
- `event_date date not null`.
- `start_time time null`.
- `end_time time null`.
- `province_id uuid null references provinces(id)`.
- `community_id uuid null references communities(id)`.
- `image_url text null`.
- `map_url text null`.
- `created_by uuid null`.
- `archived_at timestamptz null`.

### 8.3 `motivador_periods`

Campos recomendados:

- `id uuid primary key`.
- `title text not null`.
- `body text null`.
- `province_id uuid null references provinces(id)`.
- `community_id uuid null references communities(id)`.
- `start_date date null`.
- `end_date date null`.
- `date_group_key text null`.
- `motto text null`.
- `image_url text null`.
- `status text default 'draft'`.
- `created_by uuid null`.
- `updated_at timestamptz default now()`.
- `archived_at timestamptz null`.

## 9. Materiales y biblioteca

### 9.1 `materials`

Campos recomendados:

- `id uuid primary key`.
- `title text not null`.
- `description text null`.
- `category text null`.
- `visibility text not null default 'public'`.
- `required_permission text null`.
- `file_url text null`.
- `storage_path text null`.
- `image_url text null`.
- `sort_order integer default 999`.
- `province_id uuid null references provinces(id)`.
- `community_id uuid null references communities(id)`.
- `created_by uuid null`.
- `archived_at timestamptz null`.

### 9.2 `app_library_items`

Campos recomendados:

- `id uuid primary key`.
- `title text not null`.
- `description text null`.
- `category text null`.
- `image_url text null`.
- `file_url text null`.
- `external_url text null`.
- `visibility text default 'public'`.
- `sort_order integer default 999`.
- `archived_at timestamptz null`.

## 10. Comunidad e interacciones

### 10.1 `community_publications`

Campos recomendados:

- `id uuid primary key`.
- `community_id uuid null references communities(id)`.
- `province_id uuid null references provinces(id)`.
- `author_id uuid null`.
- `title text not null`.
- `body text not null`.
- `image_url text null`.
- `visibility text default 'community'`.
- `created_at timestamptz default now()`.
- `updated_at timestamptz default now()`.
- `archived_at timestamptz null`.

### 10.2 `publication_comments`

Campos recomendados:

- `id uuid primary key`.
- `publication_id uuid not null`.
- `author_id uuid null`.
- `body text not null`.
- `created_at timestamptz default now()`.
- `archived_at timestamptz null`.

### 10.3 `community_contact_messages`

Campos recomendados:

- `id uuid primary key`.
- `community_id uuid null references communities(id)`.
- `sender_id uuid null`.
- `sender_name text null`.
- `sender_contact text null`.
- `message text not null`.
- `response text null`.
- `status text default 'nuevo'`.
- `created_at timestamptz default now()`.
- `read_at timestamptz null`.
- `responded_at timestamptz null`.
- `closed_at timestamptz null`.

## 11. Notificaciones

### 11.1 `device_push_tokens`

Campos recomendados:

- `id uuid primary key`.
- `user_id uuid not null`.
- `token text not null`.
- `platform text null`.
- `device_id text null`.
- `device_name text null`.
- `app_version text null`.
- `is_active boolean default true`.
- `created_at timestamptz default now()`.
- `updated_at timestamptz default now()`.

Constraint recomendada:

- `unique(user_id, device_id)` o `unique(token)` según estrategia vigente.

### 11.2 `notification_intents`

Campos recomendados:

- `id uuid primary key`.
- `notification_type text not null`.
- `title text not null`.
- `body text not null`.
- `target_kind text not null`.
- `target_value text null`.
- `province_id uuid null`.
- `community_id uuid null`.
- `source_type text null`.
- `source_id text null`.
- `status text default 'pending'`.
- `created_by uuid null`.
- `created_at timestamptz default now()`.
- `delivered_at timestamptz null`.
- `error text null`.

## 12. Auditoría

### 12.1 `audit_logs`

Tabla recomendada para acciones sensibles.

Campos:

- `id uuid primary key`.
- `actor_id uuid null`.
- `action text not null`.
- `entity_type text not null`.
- `entity_id text null`.
- `old_value jsonb null`.
- `new_value jsonb null`.
- `reason text null`.
- `created_at timestamptz default now()`.

Acciones que deberían auditarse:

- aprobación de usuario.
- cambio de rol.
- cambio de comunidad/provincia.
- edición de contenido institucional.
- archivado de comunidad.
- eliminación o reparación de usuario.
- cambios de permisos.
- cambios de configuración global.

## 13. Índices recomendados

Prioritarios:

```sql
profiles(role, province, community_name, status)
profiles(user_id)
communities(province_id, is_active, archived_at)
news(created_at, archived_at)
events(event_date, archived_at)
motivador_periods(start_date, province_id, status)
community_publications(community_id, created_at, archived_at)
materials(visibility, sort_order, archived_at)
device_push_tokens(user_id, is_active)
notification_intents(status, created_at)
```

Ajustar nombres exactos según esquema real.

## 14. Plan de migración gradual

### Etapa 1 - Congelar estado actual

- Exportar esquema actual.
- Crear `supabase/schema_current.sql`.
- Clasificar parches históricos.

### Etapa 2 - Normalizar sin romper

- Agregar columnas faltantes con `add column if not exists`.
- Agregar índices seguros.
- Agregar constraints solo si no rompen datos existentes.
- Mantener campos legacy.

### Etapa 3 - Migrar relaciones

- Poblar `province_id` y `community_id` desde nombres actuales.
- Mantener nombres legacy durante una o más versiones.
- Adaptar frontend gradualmente.

### Etapa 4 - Consolidar RPCs

- Elegir una versión vigente por RPC crítica.
- Versionar SQL de cada RPC.
- Asegurar `security definer set search_path = public` donde corresponda.
- Validar permisos dentro de la función.

### Etapa 5 - Reducir fallbacks frontend

- Eliminar un fallback por vez.
- Probar flujo afectado.
- Mantener rollback simple.

## 15. Conclusión

El esquema canónico no debe imponerse de golpe. Debe guiar migraciones pequeñas, seguras y verificables.

La prioridad es que Supabase deje de ser una suma de parches y pase a ser una base gobernada, documentada y versionada.
