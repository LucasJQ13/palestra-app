# RPC: admin_diagnose_user_login

## Estado

Hay definiciones SQL candidatas versionadas en el repositorio. Su vigencia en Supabase remoto esta pendiente de verificar.

> Esta ficha es documental. No es una migracion y no debe ejecutarse.

## Criticidad

**Critico**.

## Proposito

Operacion administrativa: diagnose user login.

## Uso desde frontend

- `src/lib/profiles.ts:1118`

## Parametros enviados por el frontend

- `p_email`

Contrato documentado previamente:

- Parametros: `p_email`.

## Respuesta esperada

Registro `AdminUserLoginDiagnostic`

## Tablas afectadas o consultadas

- `community_contact_messages` (detectada en SQL versionado).
- `device_push_tokens` (detectada en SQL versionado).
- `internal_messages` (detectada en SQL versionado).
- `profiles` (detectada en SQL versionado).
- `provinces` (detectada en SQL versionado).
- `user_deletion_backups` (detectada en SQL versionado).
- `user_requests` (detectada en SQL versionado).

## Referencias SQL versionadas

- `supabase/patch_safe_user_delete_diagnostics.sql:313`
- `supabase/patch_user_auth_cleanup_v2.sql:65`
- `supabase/patch_user_management_cleanup.sql:73`

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
