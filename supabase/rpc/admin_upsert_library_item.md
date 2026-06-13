# RPC: admin_upsert_library_item

## Estado

Hay definiciones SQL candidatas versionadas en el repositorio. Su vigencia en Supabase remoto esta pendiente de verificar.

> Esta ficha es documental. No es una migracion y no debe ejecutarse.

## Criticidad

**Alto**.

## Proposito

Operacion administrativa: upsert library item.

## Uso desde frontend

- `src/lib/library.ts:65`

## Parametros enviados por el frontend

- `p_body`
- `p_category`
- `p_id`
- `p_image_url`
- `p_item_date`
- `p_section`
- `p_sort_order`
- `p_source`
- `p_status`
- `p_subtitle`
- `p_title`

Contrato documentado previamente:

- Parametros: `p_id`, `p_section`, `p_title`, `p_subtitle`, `p_body`, `p_image_url`, `p_category`, `p_source`, `p_item_date`, `p_status`, `p_sort_order`.

## Respuesta esperada

Mutacion

## Tablas afectadas o consultadas

- `app_library_items` (detectada en SQL versionado).
- `audit_logs` (detectada en SQL versionado).
- `profiles` (detectada en SQL versionado).

## Referencias SQL versionadas

- `supabase/patch_library_items.sql:116`
- `supabase/patch_library_publish_permissions_fix.sql:72`

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
