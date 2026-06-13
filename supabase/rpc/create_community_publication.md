# RPC: create_community_publication

## Estado

Hay definiciones SQL candidatas versionadas en el repositorio. Su vigencia en Supabase remoto esta pendiente de verificar.

> Esta ficha es documental. No es una migracion y no debe ejecutarse.

## Criticidad

**Alto**.

## Proposito

Crear community publication.

## Uso desde frontend

- `src/lib/remoteData.ts:366`

## Parametros enviados por el frontend

- `p_body`
- `p_body_format`
- `p_event_date`
- `p_image_url`
- `p_kind`
- `p_link_label`
- `p_link_url`
- `p_poll_options`
- `p_subtitle`
- `p_title`
- `p_visibility`

Contrato documentado previamente:

- Parametros: `p_kind`, `p_title`, `p_body`, `p_subtitle`, `p_body_format`, `p_image_url`, `p_link_label`, `p_link_url`, `p_event_date`, `p_visibility`, `p_poll_options`.

## Respuesta esperada

Mutacion

## Tablas afectadas o consultadas

- `audit_logs` (detectada en SQL versionado).
- `communities` (detectada en SQL versionado).
- `community_publications` (detectada en SQL versionado).
- `profiles` (detectada en SQL versionado).

## Referencias SQL versionadas

- `supabase/migrations/20260612143000_community_internal_permissions.sql:68`
- `supabase/migrations/20260612193000_enriched_community_notices.sql:105`
- `supabase/migrations/20260612235900_restrict_community_panel_to_linked_leaders.sql:60`
- `supabase/patch_community_leadership_flow.sql:135`
- `supabase/patch_community_management_scope.sql:263`
- `supabase/patch_community_polls_visibility.sql:93`

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
