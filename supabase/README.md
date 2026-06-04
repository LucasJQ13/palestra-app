# Supabase - Palestra App

## 1. Objetivo

Esta carpeta debe contener la documentación técnica y migraciones versionadas de Supabase para Palestra App.

La intención es dejar de depender de parches sueltos o históricos sin orden claro, y pasar a un sistema más controlado, revisable y seguro.

## 2. Regla principal

No ejecutar SQL directamente en producción sin:

1. leer la documentación relacionada,
2. hacer backup o export del esquema actual,
3. revisar impacto en frontend,
4. confirmar que la migración es idempotente,
5. probar manualmente el flujo afectado.

## 3. Estructura recomendada

```text
supabase/
  README.md
  schema_current.sql
  migrations/
    YYYYMMDDHHMM_descripcion.sql
  rpc/
    nombre_funcion.md
  edge-functions/
    nombre_funcion.md
```

## 4. Migraciones

Toda migración debe ir en:

```text
supabase/migrations/
```

Formato de nombre recomendado:

```text
YYYYMMDDHHMM_descripcion_corta.sql
```

Ejemplo:

```text
202606031200_add_profiles_community_id.sql
```

## 5. Reglas para migraciones nuevas

Preferir operaciones idempotentes:

```sql
alter table public.profiles add column if not exists community_id uuid;
create index if not exists idx_profiles_community_id on public.profiles(community_id);
```

Para policies:

```sql
drop policy if exists "policy_name" on public.table_name;
create policy "policy_name" on public.table_name ...;
```

Para funciones con cambio de firma:

```sql
drop function if exists public.function_name(...);
create or replace function public.function_name(...)
returns ...
language plpgsql
security definer
set search_path = public
as $$
begin
  ...
end;
$$;
```

## 6. Prohibiciones salvo aprobación explícita

No usar sin revisión manual:

- `drop table`.
- `drop column`.
- `truncate`.
- `delete` masivo.
- cambios de tipo en columnas con datos.
- renombres de columnas usadas por el frontend.
- cambios en `auth.users`.
- eliminación de policies sin crear reemplazo.

## 7. Requisitos mínimos de cada migración

Cada archivo SQL debe incluir comentarios al inicio:

```sql
-- Objetivo:
-- Riesgo:
-- Módulos afectados:
-- Precondiciones:
-- Verificación manual:
-- Rollback sugerido:
```

## 8. RPCs

Toda RPC usada por la app debe estar documentada en `supabase/rpc/` o en documentación equivalente.

Cada archivo debe indicar:

- nombre de función,
- propósito,
- parámetros,
- retorno esperado,
- tablas afectadas,
- roles autorizados,
- si usa `security definer`,
- fecha de última revisión.

## 9. Snapshot actual

El archivo futuro `supabase/schema_current.sql` debería representar la base actual consolidada.

Debe incluir:

- tablas,
- columnas,
- índices,
- constraints,
- RLS,
- policies,
- funciones vigentes,
- triggers,
- buckets y policies de Storage si se exportan.

Este archivo no debe generarse a mano inventando estructura. Debe salir de una revisión/export real.

## 10. Documentación relacionada

Leer antes de tocar Supabase:

- `docs/SUPABASE_CONTRACT.md`.
- `docs/sql_database_audit.md`.
- `docs/supabase/SCHEMA_INVENTORY.md`.
- `docs/supabase/CANONICAL_SCHEMA.md`.
- `docs/supabase/FALLBACK_AUDIT.md`.
- `docs/supabase/ACCESS_RULES_AUDIT.md`.
- `docs/supabase/FALLBACK_REMOVAL_PLAN.md`.

## 11. Conclusión

Supabase debe tratarse como parte versionada del proyecto, no como configuración invisible externa.

Toda mejora futura debe dejar rastro en Git y ser reversible.
