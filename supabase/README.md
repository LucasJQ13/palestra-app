# Supabase - Palestra APP

## 1. Propósito

Esta carpeta versiona la estructura, las migraciones y la documentación técnica de Supabase.

El objetivo es que cada cambio de base de datos sea:

- identificable;
- revisable antes de ejecutarse;
- aplicable en un orden inequívoco;
- verificable después de ejecutarse;
- reversible mediante un procedimiento conocido.

La existencia de un archivo SQL en el repositorio no confirma que haya sido aplicado en producción.

## 2. Estructura

```text
supabase/
  README.md
  schema.sql
  migrations/
    YYYYMMDDHHMMSS_descripcion_corta.sql
  rpc/
    documentacion_de_funciones.md
  functions/
    edge-functions/
```

### Directorios

- `migrations/`: único destino para migraciones nuevas y ordenadas.
- `rpc/`: documentación complementaria de funciones remotas.
- `functions/`: Edge Functions versionadas.

### SQL históricos

Los archivos `patch_*.sql`, scripts de diagnóstico, promoción o emergencia ubicados directamente en `supabase/` son históricos. No deben copiarse, renombrarse ni ejecutarse como si fueran migraciones pendientes.

Antes de usar un SQL histórico, consultar `docs/sql_patch_order.md` y revisar su impacto completo.

## 3. Convención de nombres

Las migraciones nuevas deben usar:

```text
YYYYMMDDHHMMSS_descripcion_corta.sql
```

Ejemplo:

```text
20260613184500_add_profiles_community_index.sql
```

Reglas:

- usar fecha y hora UTC;
- incluir 14 dígitos: año, mes, día, hora, minuto y segundo;
- usar `snake_case`;
- describir el resultado, no el número de issue;
- no usar espacios, acentos ni mayúsculas;
- no reutilizar un timestamp;
- no renombrar una migración que ya fue aplicada o compartida.

Si dos cambios dependen entre sí, sus timestamps deben reflejar el orden de ejecución.

## 4. Cabecera obligatoria

Toda migración nueva debe comenzar con:

```sql
-- Objetivo:
-- Contexto:
-- Issue:
-- Dependencias:
-- Tablas o funciones afectadas:
-- Riesgo:
-- Compatibilidad:
-- Rollback manual sugerido:
-- Verificación:
```

La cabecera debe explicar:

- qué problema resuelve;
- qué estructura modifica;
- qué migración o parche debe existir antes;
- qué versiones de la app siguen siendo compatibles;
- cómo volver al estado anterior;
- cómo demostrar que el cambio quedó correcto.

El rollback sugerido es documentación. No debe ejecutarse automáticamente ni incluirse al final de la migración principal.

## 5. Plantilla

```sql
-- Objetivo: agregar un índice para acelerar búsquedas de perfiles activos.
-- Contexto: la consulta filtra por estado y provincia.
-- Issue: #000
-- Dependencias: profiles y provinces existentes.
-- Tablas o funciones afectadas: public.profiles.
-- Riesgo: bajo; creación de índice no destructiva.
-- Compatibilidad: no cambia columnas ni contratos RPC.
-- Rollback manual sugerido:
--   drop index if exists public.profiles_active_province_idx;
-- Verificación:
--   select indexname
--   from pg_indexes
--   where schemaname = 'public'
--     and indexname = 'profiles_active_province_idx';

create index if not exists profiles_active_province_idx
  on public.profiles (status, province_id)
  where deleted_at is null;
```

La plantilla es ilustrativa y no debe copiarse sin validar que las columnas existan en la base real.

## 6. Reglas de implementación

### Cambios aditivos

Preferir:

```sql
alter table public.table_name
  add column if not exists new_column text;

create index if not exists table_name_new_column_idx
  on public.table_name (new_column);
```

Las columnas nuevas deben comenzar como opcionales cuando requieren backfill. Agregar `not null` solo después de verificar todos los datos.

### Constraints

- usar nombres explícitos;
- revisar datos existentes antes de agregar el constraint;
- considerar `not valid` y `validate constraint` para cambios grandes;
- no reemplazar una restricción sin documentar compatibilidad.

### Policies RLS

Cuando una policy cambia:

```sql
drop policy if exists "policy_name" on public.table_name;

create policy "policy_name"
  on public.table_name
  for select
  using (...);
```

La migración debe documentar qué roles pueden y no pueden realizar la operación.

### RPC

Toda función con privilegios elevados debe incluir:

```sql
security definer
set search_path = public
```

Además:

- validar `auth.uid()`;
- validar estado, rango y alcance territorial en la base;
- evitar nombres ambiguos entre parámetros, variables y columnas;
- declarar grants explícitos;
- conservar temporalmente la firma anterior si una app instalada todavía la usa.

Si cambia la firma:

```sql
drop function if exists public.function_name(tipo_parametro);
```

No usar un `drop function` sin enumerar los tipos de la firma que se quiere retirar.

### Transacciones

Usar una transacción cuando todas las operaciones puedan revertirse juntas:

```sql
begin;

-- cambios

commit;
```

No envolver operaciones que PostgreSQL no permita dentro de una transacción. Los backfills grandes deben dividirse y probarse en staging.

## 7. Cambios destructivos

Requieren issue separada, backup verificado y aprobación explícita:

- `drop table`;
- `drop column`;
- `truncate`;
- `delete` o `update` masivo;
- cambio de tipo con datos existentes;
- renombre de columnas o funciones consumidas por la app;
- modificación o eliminación de datos en `auth.users`;
- eliminación de policy sin reemplazo;
- cambio de una clave primaria o relación de identidad.

Una migración destructiva debe indicar cantidad estimada de filas, ventana de mantenimiento y estrategia de restauración.

## 8. Flujo de trabajo

1. Leer:
   - `docs/supabase/SCHEMA_INVENTORY.md`;
   - `docs/supabase/CANONICAL_SCHEMA.md`;
   - `docs/SUPABASE_CONTRACT.md`;
   - `docs/sql_patch_order.md`.
2. Exportar o inspeccionar el esquema real del ambiente objetivo.
3. Crear un único archivo nuevo en `supabase/migrations/`.
4. Completar la cabecera obligatoria.
5. Revisar dependencias con migraciones anteriores.
6. Probar primero en una base local o staging restaurable.
7. Ejecutar verificaciones de estructura, datos, RLS y RPC.
8. Probar el flujo afectado en la app.
9. Registrar dónde y cuándo fue aplicada.
10. Aplicar en producción solo con backup y rollback preparados.

No editar una migración ya aplicada para “corregirla”. Crear una migración posterior.

## 9. Verificación mínima

Cada migración debe incluir verificaciones de solo lectura para lo que corresponda:

- existencia y tipo de columnas;
- constraints e índices;
- firmas RPC;
- grants;
- RLS y policies;
- conteos antes/después de un backfill;
- filas huérfanas;
- consistencia entre claves UUID y campos legacy;
- comportamiento permitido y denegado por rol.

También deben ejecutarse los chequeos del proyecto que correspondan, como:

```powershell
npm.cmd run typecheck
```

No ejecutar compilación APK como parte de este flujo.

## 10. Rollback

El rollback debe ser manual, específico y seguro.

Debe responder:

- qué objetos se retiran o restauran;
- si hay datos que no pueden recuperarse sin backup;
- qué versión de RPC o policy debe reinstalarse;
- qué versión de la app es compatible después de revertir;
- qué consulta confirma que la reversión terminó bien.

Para migraciones aditivas, puede ser más seguro deshabilitar el uso de la estructura nueva que borrarla inmediatamente.

## 11. Estado de la carpeta

`supabase/migrations/` ya contiene migraciones versionadas con timestamps de 14 dígitos. Los archivos existentes son parte del historial y no deben modificarse retroactivamente para adaptar sus comentarios a esta guía.

El archivo `.gitkeep` solo corresponde cuando la carpeta está vacía. No debe coexistir con migraciones reales.

## 12. Snapshot consolidado

El futuro `supabase/schema_current.sql` debe generarse desde un esquema real verificado, no redactarse manualmente.

Debe representar:

- tablas y columnas;
- tipos y constraints;
- índices;
- triggers;
- RLS y policies;
- funciones vigentes;
- grants;
- buckets y policies de Storage cuando sea posible.

Las migraciones cuentan la historia. El snapshot describe el resultado consolidado.
