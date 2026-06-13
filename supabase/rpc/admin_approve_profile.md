# RPC: admin_approve_profile

## Estado

Hay definiciones SQL candidatas versionadas en el repositorio. Su vigencia en Supabase remoto esta pendiente de verificar.

> Esta ficha es documental. No es una migracion y no debe ejecutarse.

## Criticidad

**Critico**.

## Proposito

Operacion administrativa: approve profile.

## Uso desde frontend

- `src/lib/profiles.ts:513`

## Parametros enviados por el frontend

- `p_profile_id`
- `p_role`

Contrato documentado previamente:

- Parametros: `p_profile_id`, `p_role`.

## Respuesta esperada

Mutacion

## Tablas afectadas o consultadas

- `audit_logs` (detectada en SQL versionado).
- `profiles` (detectada en SQL versionado).

## Referencias SQL versionadas

- `supabase/migrations/20260606110000_safe_admin_user_edit.sql:400`
- `supabase/patch_stabilize_profile_admin_rpcs.sql:45`

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
