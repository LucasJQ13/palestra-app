# RPC: admin_upsert_material

## Estado

Hay definiciones SQL candidatas versionadas en el repositorio. Su vigencia en Supabase remoto esta pendiente de verificar.

> Esta ficha es documental. No es una migracion y no debe ejecutarse.

## Criticidad

**Alto**.

## Proposito

Operacion administrativa: upsert material.

## Uso desde frontend

- `src/lib/profiles.ts:1825`

## Parametros enviados por el frontend

- `p_category`
- `p_description`
- `p_file_path`
- `p_file_url`
- `p_id`
- `p_required_permission`
- `p_sort_order`
- `p_title`
- `p_visibility`

Contrato documentado previamente:

- Parametros: `p_id`, `p_title`, `p_description`, `p_category`, `p_visibility`, `p_required_permission`, `p_file_url`, `p_file_path`, `p_sort_order`.

## Respuesta esperada

Mutacion

## Tablas afectadas o consultadas

- `audit_logs` (detectada en SQL versionado).
- `materials` (detectada en SQL versionado).
- `profiles` (detectada en SQL versionado).
- `provinces` (detectada en SQL versionado).

## Referencias SQL versionadas

- `supabase/patch_admin_persistence_config_materials_drafts.sql:140`
- `supabase/patch_beta_baseline.sql:120`
- `supabase/patch_material_author_editing.sql:23`
- `supabase/patch_material_upload_permissions_fix.sql:122`

Estas referencias pueden representar versiones historicas distintas. No se copia un cuerpo como canonico porque el repositorio no certifica cual esta desplegado actualmente.

## Validaciones que deben confirmarse

- Usuario autenticado cuando la operacion no sea publica.
- Estado aprobado cuando accede a datos internos.
- Rol o permiso suficiente.
- Alcance de comunidad/provincia cuando corresponda.
- `security definer` y `set search_path = public` si eleva privilegios.
- Grants limitados a los roles necesarios.
- Retorno y errores compatibles con el frontend.

## Pendiente de verificacion remota

- Firma SQL exacta desplegada.
- Cuerpo SQL vigente.
- Grants y propietario de la funcion.
- Policies y tablas relacionadas.
- Pruebas positivas y negativas por rol.
