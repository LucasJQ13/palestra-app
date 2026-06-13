# RPC: admin_update_community

## Estado

Hay definiciones SQL candidatas versionadas en el repositorio. Su vigencia en Supabase remoto esta pendiente de verificar.

> Esta ficha es documental. No es una migracion y no debe ejecutarse.

## Criticidad

**Alto**.

## Proposito

Actualizar community.

## Uso desde frontend

- `src/lib/profiles.ts:2063`
- `src/lib/profiles.ts:2066`

## Parametros enviados por el frontend

- `[payload dinamico: legacyPayload]`
- `[payload dinamico: payload]`

Contrato documentado previamente:

- Parametros: `p_community_id`, `p_name`, `p_address`, `p_phone`, `p_meeting_day`, `p_meeting_time`, `p_description`, `p_image_url`, `p_latitude`, `p_longitude`, `p_group_type`.

## Respuesta esperada

Mutacion

## Tablas afectadas o consultadas

- `audit_logs` (detectada en SQL versionado).
- `communities` (detectada en SQL versionado).
- `profiles` (detectada en SQL versionado).

## Referencias SQL versionadas

- `supabase/patch_admin_community_rpc.sql:1`
- `supabase/patch_community_images_dynamic_roles.sql:139`
- `supabase/patch_community_management_scope.sql:168`
- `supabase/patch_community_subsections.sql:230`
- `supabase/patch_news_scope_email_requests_community_coords.sql:50`
- `supabase/patch_profile_cooldown_and_blocks.sql:58`
- `supabase/patch_restore_communities_admin_management.sql:6`

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
