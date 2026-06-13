# RPC: update_my_profile_details_v2

## Estado

Hay definiciones SQL candidatas versionadas en el repositorio. Su vigencia en Supabase remoto esta pendiente de verificar.

> Esta ficha es documental. No es una migracion y no debe ejecutarse.

## Criticidad

**Critico**.

## Proposito

Actualizar my profile details v2.

## Uso desde frontend

- `src/lib/profiles.ts:1043`
- `src/lib/profiles.ts:1068`

## Parametros enviados por el frontend

- `p_credential_name_mode`
- `p_nickname`
- `p_perseverance_start_year`
- `p_personal_greeting_color`
- `p_personal_pm_motto`
- `p_personal_pm_number`
- `p_personal_pm_province`
- `p_personal_pm_type`
- `p_use_nickname_in_greetings`

Contrato documentado previamente:

- Parametros: `p_nickname`, `p_use_nickname_in_greetings`, `p_credential_name_mode`, `p_perseverance_start_year`, `p_personal_pm_type`, `p_personal_pm_number`, `p_personal_pm_province`, `p_personal_pm_motto`, `p_personal_greeting_color`.

## Respuesta esperada

Mutacion

## Tablas afectadas o consultadas

- `audit_logs` (detectada en SQL versionado).
- `profiles` (detectada en SQL versionado).
- `provinces` (detectada en SQL versionado).

## Referencias SQL versionadas

- `supabase/migrations/20260606020000_personal_greeting_color.sql:80`
- `supabase/patch_email_confirmation_and_personal_pm.sql:83`
- `supabase/patch_emergency_profile_qr_recovery.sql:155`

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
