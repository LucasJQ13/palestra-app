# Orden recomendado de SQL

Ejecutar en Supabase SQL Editor. Los scripts son idempotentes cuando usan `create table if not exists`, `create or replace function`, `drop policy if exists` u `on conflict`.

## Base inicial

1. `supabase/schema.sql`
2. `supabase/patch_app_data.sql`
3. `supabase/seed_beta_institutional_content.sql`

## Permisos, roles y usuarios

4. `supabase/patch_role_hierarchy_scope.sql`
5. `supabase/patch_dynamic_role_permissions.sql`
6. `supabase/patch_community_images_dynamic_roles.sql`
7. `supabase/patch_user_auth_cleanup_v2.sql`
8. `supabase/patch_news_scope_email_requests_community_coords.sql`

## Contenido dinamico

9. `supabase/patch_admin_navigation_manager.sql`
10. `supabase/patch_navigation_section_types_deep_link.sql`
11. `supabase/patch_admin_persistence_config_materials_drafts.sql`
12. `supabase/patch_content_pm_downloads_messages.sql`
13. `supabase/patch_motivador_management.sql`
14. `supabase/patch_app_runtime_config.sql`
15. `supabase/patch_church_document_buttons.sql`
16. `supabase/patch_user_honor_levels.sql`
17. `supabase/patch_admin_materials_visibility.sql`
18. `supabase/patch_profile_perseverance_preferences.sql`

## Reaplicar si algo queda desactualizado

- Comunidades admin: `supabase/patch_restore_communities_admin_management.sql`
- Notificaciones: `supabase/patch_notification_intents.sql`
- Contenido publicado: `supabase/patch_published_content_management.sql`

Si una funcion falla por firma antigua, ejecutar primero el patch mas nuevo del modulo correspondiente.
