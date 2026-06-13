# RPC: update_my_profile

## Estado

Hay definiciones SQL candidatas versionadas en el repositorio. Su vigencia en Supabase remoto esta pendiente de verificar.

> Esta ficha es documental. No es una migracion y no debe ejecutarse.

## Criticidad

**Critico**.

## Proposito

Actualizar my profile.

## Uso desde frontend

- `src/lib/profiles.ts:1033`

## Parametros enviados por el frontend

- `p_community_name`
- `p_full_name`
- `p_gender_preference`
- `p_phone`
- `p_province`

Contrato documentado previamente:

- Parametros: `p_full_name`, `p_phone`, `p_province`, `p_community_name`, `p_gender_preference`.

## Respuesta esperada

Mutacion

## Tablas afectadas o consultadas

- `audit_logs` (detectada en SQL versionado).
- `profiles` (detectada en SQL versionado).
- `provinces` (detectada en SQL versionado).

## Referencias SQL versionadas

- `supabase/migrations/20260606030000_profile_territory_cooldown.sql:91`
- `supabase/patch_auth_onboarding_profile_fields.sql:110`
- `supabase/patch_beta_functional_stability.sql:107`
- `supabase/patch_emergency_profile_qr_recovery.sql:88`
- `supabase/patch_profile_completion_admin_users_downgrade.sql:26`
- `supabase/patch_profile_cooldown_and_blocks.sql:7`
- `supabase/patch_profile_rpc_fix.sql:1`

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
