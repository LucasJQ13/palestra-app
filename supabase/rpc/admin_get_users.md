# RPC: admin_get_users

## Estado

Hay definiciones SQL candidatas versionadas en el repositorio. Su vigencia en Supabase remoto esta pendiente de verificar.

> Esta ficha es documental. No es una migracion y no debe ejecutarse.

## Criticidad

**Critico**.

## Proposito

Listar usuarios que el actor puede administrar.

## Uso desde frontend

- `src/lib/profiles.ts:521`

## Parametros enviados por el frontend

- Sin parametros en las llamadas detectadas.

Contrato documentado previamente:

- Parametros: sin parametros.

## Respuesta esperada

Lista `AdminUser`

## Tablas afectadas o consultadas

- `profiles` (detectada en SQL versionado).
- `provinces` (detectada en SQL versionado).

## Referencias SQL versionadas

- `supabase/migrations/20260606110000_safe_admin_user_edit.sql:108`
- `supabase/patch_admin_users.sql:1`
- `supabase/patch_beta_user_role_management.sql:77`
- `supabase/patch_community_images_dynamic_roles.sql:389`
- `supabase/patch_email_confirmation_and_personal_pm.sql:249`
- `supabase/patch_leadership_user_search_global.sql:6`
- `supabase/patch_profile_perseverance_preferences.sql:275`
- `supabase/patch_profile_photos.sql:92`
- `supabase/patch_public_profile_gender_labels.sql:82`
- `supabase/patch_user_auth_cleanup_v2.sql:26`

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
