# Auditoria SQL y base de datos

Fecha: 2026-06-02

## Estado general

La base Supabase de Palestra APP funciona, pero el repositorio acumula una historia larga de parches SQL incrementales. Eso fue util para avanzar rapido, pero ahora aumenta el riesgo de:

- ejecutar parches viejos fuera de orden,
- redefinir RPCs con versiones anteriores,
- perder claridad sobre cual es la version vigente de cada funcion,
- duplicar politicas RLS,
- romper diagnostico de usuarios o permisos por aplicar un archivo obsoleto.

## Metricas iniciales

- Archivos SQL en `supabase`: 92.
- Funciones SQL unicas detectadas: 170.
- RPC usadas por el frontend: 115.
- RPC usadas por el frontend sin definicion en archivos SQL: 0.
- Tablas unicas detectadas en SQL: 48.
- Politicas RLS unicas detectadas: 102.
- Edge Functions detectadas: 4.

Edge Functions actuales:

- `admin-confirm-email`
- `debug-push-notification`
- `fetch-daily-gospel`
- `send-push-notifications`

## Hallazgos principales

### 1. Hay muchas RPC redefinidas varias veces

Las funciones con mas versiones historicas son:

- `admin_get_users`: 9 definiciones.
- `admin_update_user`: 9 definiciones.
- `get_my_profile`: 8 definiciones.
- `admin_update_community`: 7 definiciones.
- `update_my_profile`: 6 definiciones.

Esto indica que usuarios, perfiles y comunidades son las zonas mas sensibles. No significa que esten rotas, pero si que conviene consolidarlas antes de seguir creciendo.

### 2. `schema.sql` quedo desactualizado frente a los parches

`schema.sql` contiene una base inicial, pero muchas tablas, columnas, politicas y funciones reales viven solo en parches posteriores.

Riesgo: si se reconstruye una base desde cero usando solo `schema.sql`, la app no quedaria igual que la base actual.

### 3. Hay funciones `security definer` sin `set search_path`

Muchas funciones usan `security definer`. En Supabase/Postgres esto es normal para RPC administrativas, pero conviene que tengan:

```sql
security definer
set search_path = public
```

Riesgo: una funcion con `security definer` y `search_path` implicito puede ser mas fragil y menos segura.

### 4. Hay SQL que toca `auth.users`

Existen parches que hacen `update auth.users` o `delete from auth.users`, especialmente en:

- confirmacion de emails,
- eliminacion/liberacion de usuarios,
- limpieza de cuentas inconsistentes,
- promocion inicial de administrador.

Riesgo: son funciones necesarias, pero deben quedar aisladas, documentadas y no mezcladas con parches normales.

### 5. Hay politicas RLS duplicadas por evolucion

Algunas politicas se repiten en varios parches, por ejemplo:

- perfiles pendientes,
- comunidades publicas,
- publicaciones comunitarias por visibilidad,
- materiales visibles por rango,
- imagenes de contenido.

Riesgo: si se corre un parche viejo despues de uno nuevo, puede reinstalar una politica menos completa.

## Prioridades de saneamiento

### Prioridad 1: congelar el orden de parches activos

Crear un archivo:

```text
docs/sql_patch_order.md
```

Debe listar el orden correcto de ejecucion y marcar:

- parches activos,
- parches historicos,
- parches peligrosos,
- parches de emergencia que no deben ejecutarse salvo necesidad.

### Prioridad 2: generar un snapshot actual consolidado

Crear un archivo nuevo:

```text
supabase/schema_current.sql
```

Este archivo deberia representar la base actual completa:

- tablas,
- columnas,
- indices,
- RLS,
- policies,
- funciones vigentes,
- triggers,
- buckets/policies de storage.

No reemplaza inmediatamente los parches, pero se vuelve la referencia limpia para futuras instalaciones.

### Prioridad 3: consolidar RPC criticas

Primera tanda de RPC a revisar:

- `get_my_profile`
- `update_my_profile`
- `admin_get_users`
- `admin_update_user`
- `admin_delete_user_by_email`
- `admin_diagnose_user_login`
- `admin_update_community`
- `admin_create_community`

Objetivo: dejar una sola version vigente por RPC y documentar cuales archivos viejos quedan obsoletos.

### Prioridad 4: auditar RLS por modulo

Orden recomendado:

1. `profiles` / usuarios.
2. `communities` / comunidades / secretariados.
3. `news`, `events`, `materials`.
4. `community_publications`, foro, comentarios.
5. `notification_intents`, `device_push_tokens`.
6. `app_content`, `admin_config`, `app_tabs`.

### Prioridad 5: revisar indices de performance

Hay indices en varios parches, pero falta una revision global por consultas reales de la app.

Areas probables para indices:

- `profiles(role, province, community_name, status)`
- `communities(province_id, is_active, archived_at)`
- `community_publications(community_id, province_id, created_at, visibility)`
- `news(created_at, scope, province_id, community_id)`
- `materials(sort_order, visibility, province_id)`
- `internal_messages(recipient_id, status, created_at)`
- `notification_intents(status, created_at)`
- `device_push_tokens(user_id, is_active)`

## Plan de trabajo recomendado

### Tanda A: inventario limpio

- Crear `docs/sql_patch_order.md`.
- Clasificar los 92 SQL.
- Marcar los parches que no deben volver a ejecutarse manualmente.

### Tanda B: RPC usuarios/perfiles

- Comparar todas las versiones de `get_my_profile`, `admin_get_users`, `admin_update_user`.
- Elegir version vigente.
- Crear parche consolidado solo si hay mejora real.

### Tanda C: RPC comunidades

- Consolidar `admin_update_community`, `admin_create_community`, `get_secretariat_members`.
- Confirmar que subsecciones `Jovenes`, `Adultos`, `Jovenes Adultos` conviven bien con comunidades existentes.

### Tanda D: RLS

- Revisar policies de tablas sensibles.
- Eliminar duplicaciones peligrosas con `drop policy if exists` + policy vigente.

### Tanda E: snapshot

- Generar `schema_current.sql`.
- Documentar como levantar una base desde cero.

## Reglas para avanzar sin romper

- No ejecutar parches historicos sin revisar.
- Todo parche nuevo debe ser idempotente: `if not exists`, `drop policy if exists`, `drop function if exists` cuando cambie firma.
- Toda RPC administrativa debe validar rol real desde base, no solo desde UI.
- Toda funcion `security definer` nueva debe usar `set search_path = public`.
- Separar scripts de emergencia de scripts normales.

