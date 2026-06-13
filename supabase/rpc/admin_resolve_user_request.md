# RPC: admin_resolve_user_request

## Estado

Hay definiciones SQL candidatas versionadas en el repositorio. Su vigencia en Supabase remoto esta pendiente de verificar.

> Esta ficha es documental. No es una migracion y no debe ejecutarse.

## Criticidad

**Critico**.

## Proposito

Operacion administrativa: resolve user request.

## Uso desde frontend

- `src/lib/profiles.ts:751`

## Parametros enviados por el frontend

- `p_admin_message`
- `p_assign_role`
- `p_request_id`
- `p_status`

Contrato documentado previamente:

- Parametros: `p_request_id`, `p_status`, `p_admin_message`, `p_assign_role`.

## Respuesta esperada

Mutacion

## Tablas afectadas o consultadas

- `communities` (detectada en SQL versionado).
- `profiles` (detectada en SQL versionado).
- `user_requests` (detectada en SQL versionado).

## Referencias SQL versionadas

- `supabase/migrations/20260607093000_restrict_admin_tool_permissions.sql:328`
- `supabase/patch_community_leadership_flow.sql:344`
- `supabase/patch_requests_and_admin_auth.sql:104`

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
