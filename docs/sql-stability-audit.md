# Auditoria de estabilidad SQL

Este documento congela el mapa actual de riesgo de los SQL de Palestra APP. No cambia la base de datos ni la app; sirve para evitar que una correccion nueva pise una funcion vieja o que un patch antiguo deshaga una solucion reciente.

## Regla principal

No reejecutar patches antiguos al azar en una base que ya tiene los ultimos cambios. Muchos scripts usan `create or replace function` y pueden reemplazar una RPC nueva por una version anterior. Cuando haya dudas, ejecutar solo el patch vigente del modulo afectado.

## Patches vigentes por modulo

| Modulo | Patch vigente recomendado | Motivo |
| --- | --- | --- |
| Orden base | `docs/sql-execution-order.md` | Es el orden de instalacion para base nueva. |
| Materiales / Descargas / Storage | `supabase/patch_material_upload_permissions_fix.sql` | Restaura subida de PDFs para dirigencia autorizada y deja Documentos de la Iglesia solo para Administrador. |
| Visibilidad admin de materiales | `supabase/patch_admin_materials_visibility.sql` seguido por `supabase/patch_material_upload_permissions_fix.sql` | El primero agrega lectura admin; el segundo corrige permisos de subida/edicion. |
| Perfil, confirmacion de mail y PM personal | `supabase/patch_email_confirmation_and_personal_pm.sql` | Es el patch mas nuevo que redefine `get_my_profile`, `admin_get_users` y pendientes con email confirmado. |
| Comunidades admin estable | `supabase/patch_restore_communities_admin_management.sql` | Debe usarse si una mejora posterior rompe la gestion de comunidades. |
| Navegacion dinamica por tipo | `supabase/patch_navigation_section_types_deep_link.sql` | Agrega `section_type` y firmas nuevas para tabs. |
| Runtime config | `supabase/patch_app_runtime_config.sql` | Fuente de configuracion remota, mantenimiento, versiones y noticias catolicas. |
| PM / Periodo Motivador | `supabase/patch_motivador_management.sql` | Gestion y visibilidad de PMs. |
| Solicitudes y panel admin | `supabase/patch_email_confirmation_and_personal_pm.sql` sobre los patches previos de solicitudes | Evita mezclar confirmacion de mail con aprobacion dirigencial. |
| Notificaciones | `supabase/patch_push_notification_delivery_foundation.sql` y luego `supabase/patch_notification_intents.sql` | Token/device e intenciones. Requiere procesador externo/Edge para push remoto masivo. |

## Funciones criticas redefinidas varias veces

Estas funciones son sensibles. Si se reejecuta un patch viejo que las contiene, puede romper comportamiento ya corregido.

| Funcion/RPC | Patches que la redefinen | Version a respetar ahora |
| --- | --- | --- |
| `get_my_profile` | `patch_auth_onboarding_profile_fields.sql`, `patch_profile_photos.sql`, `patch_profile_perseverance_preferences.sql`, `patch_get_my_profile_rpc.sql`, `patch_news_scope_email_requests_community_coords.sql`, `patch_email_confirmation_and_personal_pm.sql`, `patch_community_images_dynamic_roles.sql` | `patch_email_confirmation_and_personal_pm.sql` salvo que se cree un patch nuevo especifico de perfil. |
| `admin_get_users` | `patch_admin_users.sql`, `patch_beta_user_role_management.sql`, `patch_profile_photos.sql`, `patch_user_auth_cleanup_v2.sql`, `patch_profile_perseverance_preferences.sql`, `patch_public_profile_gender_labels.sql`, `patch_email_confirmation_and_personal_pm.sql`, `patch_community_images_dynamic_roles.sql` | `patch_email_confirmation_and_personal_pm.sql`, con cuidado de no perder campos de imagen/comunidad si se reordena. |
| `admin_update_user` | `patch_admin_users.sql`, `patch_beta_functional_stability.sql`, `patch_critical_role_hierarchy.sql`, `patch_beta_user_role_management.sql`, `patch_national_coordinator_replacement.sql`, `patch_structural_admin_coherence.sql`, `patch_requests_and_admin_auth.sql`, `patch_mobile_errors_and_request_roles.sql`, `patch_community_images_dynamic_roles.sql` | Revisar antes de tocar. Es candidata a consolidacion en un patch unico futuro. |
| `admin_upsert_material` | `patch_beta_baseline.sql`, `patch_admin_persistence_config_materials_drafts.sql`, `patch_material_author_editing.sql`, `patch_material_upload_permissions_fix.sql` | `patch_material_upload_permissions_fix.sql`. |
| `admin_archive_material` | `patch_beta_baseline.sql`, `patch_admin_persistence_config_materials_drafts.sql`, `patch_material_author_editing.sql`, `patch_material_upload_permissions_fix.sql` | `patch_material_upload_permissions_fix.sql`. |
| `current_user_can_manage_content` | `patch_beta_baseline.sql`, `patch_material_upload_permissions_fix.sql` | `patch_material_upload_permissions_fix.sql`. |
| `admin_update_community` | `patch_admin_community_rpc.sql`, `patch_community_management_scope.sql`, `patch_profile_cooldown_and_blocks.sql`, `patch_news_scope_email_requests_community_coords.sql`, `patch_community_images_dynamic_roles.sql`, `patch_restore_communities_admin_management.sql` | `patch_restore_communities_admin_management.sql` si la herramienta Comunidades vuelve a fallar. |
| `admin_update_tab` / `admin_create_tab` | `patch_admin_rpc_and_tabs.sql`, `patch_admin_navigation_manager.sql`, `patch_structural_admin_coherence.sql`, `patch_navigation_section_types_deep_link.sql` | `patch_navigation_section_types_deep_link.sql`. |
| `admin_update_app_content` | `patch_admin_app_content.sql`, `patch_beta_content_permissions.sql`, `patch_profile_cooldown_and_blocks.sql` | Mantener compatible con `blocks`; revisar firma antes de tocar Navegacion/Contenido. |
| `admin_confirm_user_email` | `patch_admin_users.sql`, `patch_beta_functional_stability.sql`, Edge Function `supabase/functions/admin-confirm-email/index.ts` | Preferir Edge Function para confirmar Auth real; RPC como fallback. |
| `register_push_token` | `patch_beta_mobile_persistence_notifications.sql`, `patch_push_notification_delivery_foundation.sql` | `patch_push_notification_delivery_foundation.sql`. |
| `create_notification_intent` | `patch_notification_intents.sql`, `patch_push_notification_delivery_foundation.sql` | Revisar firmas antes de agregar campos nuevos de push. |

## Patches que no conviene reejecutar sin necesidad

Estos scripts son utiles historicamente, pero pueden pisar funciones nuevas si se ejecutan despues de los patches vigentes:

- `supabase/patch_admin_users.sql`
- `supabase/patch_beta_functional_stability.sql`
- `supabase/patch_critical_role_hierarchy.sql`
- `supabase/patch_beta_user_role_management.sql`
- `supabase/patch_structural_admin_coherence.sql`
- `supabase/patch_requests_and_admin_auth.sql`
- `supabase/patch_mobile_errors_and_request_roles.sql`
- `supabase/patch_admin_persistence_config_materials_drafts.sql`
- `supabase/patch_beta_baseline.sql`
- `supabase/patch_profile_photos.sql`
- `supabase/patch_profile_perseverance_preferences.sql`
- `supabase/patch_community_images_dynamic_roles.sql`

Si alguno de estos debe ejecutarse por una razon puntual, luego reejecutar el patch vigente del modulo afectado.

## Riesgos concretos por modulo

### Usuarios, Auth y perfiles

Riesgo alto. `admin_update_user`, `admin_get_users` y `get_my_profile` estan muy reutilizadas por login, perfil, panel admin, solicitudes y busqueda global. Un cambio debe ser pequeno y con prueba manual de:

- login de usuario aprobado
- usuario pendiente con mail confirmado
- usuario pendiente sin mail confirmado
- editar usuario como Administrador
- editar usuario como rol dirigencial permitido

### Materiales y descargas

Riesgo medio/alto. Hay RLS en `public.materials` y en `storage.objects`. La UI puede mostrar "Subir contenido", pero Storage puede rechazar por policy. Patch vigente: `patch_material_upload_permissions_fix.sql`.

### Comunidades

Riesgo alto por la mezcla de provincia, comunidad, imagen, permisos por rango y coordenadas. Si una mejora avanzada rompe el panel, volver a `patch_restore_communities_admin_management.sql` antes de seguir.

### Navegacion dinamica

Riesgo medio. Ya existe `section_type`, pero `admin_update_tab` tuvo varias firmas. No agregar nuevos tipos sin actualizar app, RPC y contenido inicial juntos.

### Notificaciones

Riesgo medio. La app registra tokens y crea intenciones, pero el envio remoto requiere procesamiento fuera de la app. No prometer push remoto masivo si no existe Edge/backend activo.

## Protocolo para nuevos patches

1. Un patch por modulo.
2. Nombre explicito con fecha o tema, por ejemplo `patch_2026_05_materials_policy_v2.sql`.
3. Al inicio del patch, comentar que funciones reemplaza.
4. Agregarlo al orden oficial si es parte de la base nueva.
5. Actualizar este documento indicando si reemplaza a otro patch.
6. No mezclar Auth, RLS de materiales y navegacion en el mismo SQL.

## Candidatos a consolidacion futura

Cuando la beta este estable, conviene crear un baseline nuevo y dejar los patches viejos como historicos:

- `supabase/current_schema_beta.sql`
- `supabase/current_policies_beta.sql`
- `supabase/current_functions_beta.sql`
- `supabase/current_seed_beta.sql`

Eso reduciria el riesgo de ejecutar 60+ scripts en orden incorrecto.
