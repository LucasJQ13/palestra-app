# RPC: get_my_profile

## Estado

Hay definiciones SQL candidatas versionadas en el repositorio. Su vigencia en Supabase remoto esta pendiente de verificar.

> Esta ficha es documental. No es una migracion y no debe ejecutarse.

## Criticidad

**Critico**.

## Proposito

Obtener el perfil normalizado de la sesion autenticada.

## Uso desde frontend

- `src/lib/authProfile.ts:33`

## Parametros enviados por el frontend

- Sin parametros en las llamadas detectadas.

Contrato documentado previamente:

- Parametros: sin parametros.

## Respuesta esperada

Registro de sesion/perfil normalizado

## Tablas afectadas o consultadas

- `profiles` (detectada en SQL versionado).
- `provinces` (detectada en SQL versionado).

## Referencias SQL versionadas

- `supabase/migrations/20260606020000_personal_greeting_color.sql:15`
- `supabase/migrations/20260606030000_profile_territory_cooldown.sql:24`
- `supabase/patch_auth_onboarding_profile_fields.sql:72`
- `supabase/patch_community_images_dynamic_roles.sql:326`
- `supabase/patch_email_confirmation_and_personal_pm.sql:23`
- `supabase/patch_emergency_profile_qr_recovery.sql:26`
- `supabase/patch_get_my_profile_rpc.sql:1`
- `supabase/patch_news_scope_email_requests_community_coords.sql:9`
- `supabase/patch_profile_perseverance_preferences.sql:120`
- `supabase/patch_profile_photos.sql:40`

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
