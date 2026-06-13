# RPC: admin_update_user

## Estado

Hay definiciones SQL candidatas versionadas en el repositorio. Su vigencia en Supabase remoto esta pendiente de verificar.

> Esta ficha es documental. No es una migracion y no debe ejecutarse.

## Criticidad

**Critico**.

## Proposito

Actualizar datos, estado y rango de un usuario dentro del alcance permitido.

## Uso desde frontend

- `src/lib/profiles.ts:574`

## Parametros enviados por el frontend

- `p_community_name`
- `p_display_role_label`
- `p_email`
- `p_full_name`
- `p_password`
- `p_phone`
- `p_profile_id`
- `p_province`
- `p_role`
- `p_status`

Contrato documentado previamente:

- Parametros: `p_profile_id`, `p_email`, `p_password`, `p_full_name`, `p_phone`, `p_province`, `p_community_name`, `p_status`, `p_role`, `p_display_role_label`.

## Respuesta esperada

Mutacion

## Tablas afectadas o consultadas

- `audit_logs` (detectada en SQL versionado).
- `profiles` (detectada en SQL versionado).
- `provinces` (detectada en SQL versionado).

## Referencias SQL versionadas

- `supabase/migrations/20260606110000_safe_admin_user_edit.sql:173`
- `supabase/patch_admin_users.sql:37`
- `supabase/patch_beta_functional_stability.sql:315`
- `supabase/patch_beta_user_role_management.sql:127`
- `supabase/patch_community_images_dynamic_roles.sql:452`
- `supabase/patch_critical_role_hierarchy.sql:270`
- `supabase/patch_mobile_errors_and_request_roles.sql:81`
- `supabase/patch_national_coordinator_replacement.sql:182`
- `supabase/patch_requests_and_admin_auth.sql:148`
- `supabase/patch_structural_admin_coherence.sql:71`

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
