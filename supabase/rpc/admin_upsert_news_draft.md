# RPC: admin_upsert_news_draft

## Estado

Hay definiciones SQL candidatas versionadas en el repositorio. Su vigencia en Supabase remoto esta pendiente de verificar.

> Esta ficha es documental. No es una migracion y no debe ejecutarse.

## Criticidad

**Alto**.

## Proposito

Operacion administrativa: upsert news draft.

## Uso desde frontend

- `src/lib/profiles.ts:2001`

## Parametros enviados por el frontend

- `p_body`
- `p_category`
- `p_id`
- `p_image_url`
- `p_is_featured`
- `p_status`
- `p_title`

Contrato documentado previamente:

- Parametros: `p_id`, `p_title`, `p_body`, `p_category`, `p_image_url`, `p_is_featured`, `p_status`.

## Respuesta esperada

Mutacion

## Tablas afectadas o consultadas

- `audit_logs` (detectada en SQL versionado).
- `news_drafts` (detectada en SQL versionado).

## Referencias SQL versionadas

- `supabase/patch_admin_persistence_config_materials_drafts.sql:229`

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
