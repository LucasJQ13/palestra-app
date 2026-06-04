# Orden consolidado de parches SQL

## 1. Objetivo

Este documento consolida el criterio de orden, vigencia y riesgo de los parches SQL existentes en Supabase para Palestra App.

No ejecuta SQL ni reemplaza la revisión manual. Su finalidad es evitar que se apliquen parches históricos fuera de orden y terminen pisando funciones, policies o permisos más nuevos.

Documentos relacionados:

- `docs/sql-execution-order.md`
- `docs/sql-stability-audit.md`
- `docs/sql_database_audit.md`
- `docs/SUPABASE_CONTRACT.md`
- `docs/supabase/SCHEMA_INVENTORY.md`
- `docs/supabase/CANONICAL_SCHEMA.md`

## 2. Regla principal

No ejecutar parches antiguos al azar sobre una base que ya funciona.

Muchos archivos SQL usan:

- `create or replace function`
- `drop policy if exists`
- `create policy`
- `alter table`
- `update auth.users`

Eso significa que un parche viejo puede reemplazar una RPC nueva o reinstalar una policy anterior.

## 3. Diferencia entre base nueva y base existente

### Base nueva

Para una base completamente nueva, el punto de partida documentado sigue siendo:

1. `supabase/schema.sql`
2. `supabase/patch_app_data.sql`
3. `supabase/seed_beta_institutional_content.sql`

Después se aplican los parches vigentes por módulo, en orden controlado.

### Base existente/beta actual

Para una base que ya viene funcionando, no conviene reejecutar todo.

En una base existente se debe:

1. identificar el módulo afectado,
2. revisar qué patch vigente corresponde,
3. verificar si ese patch redefine RPCs críticas,
4. aplicar solo lo necesario,
5. probar el flujo afectado.

## 4. Orden recomendado para base nueva

Este orden toma como base `docs/sql-execution-order.md`, pero agrega advertencias de riesgo.

### 4.1 Base inicial

1. `supabase/schema.sql`
2. `supabase/patch_app_data.sql`
3. `supabase/seed_beta_institutional_content.sql`

Objetivo:

- Crear estructura inicial.
- Cargar datos institucionales base.

Riesgo:

- `schema.sql` puede estar desactualizado frente a parches posteriores.
- No debe asumirse como snapshot vigente de producción/beta.

### 4.2 Roles, permisos y usuarios

4. `supabase/patch_role_hierarchy_scope.sql`
5. `supabase/patch_dynamic_role_permissions.sql`
6. `supabase/patch_community_images_dynamic_roles.sql`
7. `supabase/patch_user_auth_cleanup_v2.sql`
8. `supabase/patch_news_scope_email_requests_community_coords.sql`

Objetivo:

- Jerarquía de roles.
- Permisos dinámicos.
- Correcciones de usuario/auth.
- Campos de comunidad, imágenes, noticias y coordenadas.

Riesgo:

- Esta tanda toca perfil, usuarios, permisos y comunidades.
- Puede redefinir `get_my_profile`, `admin_get_users` y `admin_update_user`.

### 4.3 Navegación, contenido y configuración

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
19. `supabase/patch_email_confirmation_and_personal_pm.sql`
20. `supabase/patch_material_upload_permissions_fix.sql`

Objetivo:

- Navegación dinámica.
- Tipos de sección.
- Configuración remota.
- PM.
- Descargas/materiales.
- Documentos de Iglesia.
- Perfil extendido.
- Confirmación de email.

Riesgo:

- `patch_email_confirmation_and_personal_pm.sql` es especialmente sensible porque redefine funciones de perfil y administración de usuarios.
- `patch_material_upload_permissions_fix.sql` debe quedar como referencia vigente para materiales/storage.

## 5. Patches vigentes por módulo

Estos son los patches que deben considerarse referencia actual por módulo, según la auditoría existente.

| Módulo | Patch vigente recomendado | Motivo |
|---|---|---|
| Orden base | `docs/sql-execution-order.md` | Orden documentado para base nueva. |
| Perfil, mail confirmado y PM personal | `supabase/patch_email_confirmation_and_personal_pm.sql` | Versión más nueva para perfil, confirmación y PM personal. |
| Materiales / Descargas / Storage | `supabase/patch_material_upload_permissions_fix.sql` | Corrige subida, edición y permisos de materiales. |
| Visibilidad admin de materiales | `supabase/patch_admin_materials_visibility.sql` + `supabase/patch_material_upload_permissions_fix.sql` | Primero lectura admin, luego corrección de subida/edición. |
| Comunidades admin estable | `supabase/patch_restore_communities_admin_management.sql` | Patch de recuperación si comunidades admin se rompe. |
| Navegación dinámica | `supabase/patch_navigation_section_types_deep_link.sql` | Versión vigente con tipos de sección y deep link. |
| Runtime config | `supabase/patch_app_runtime_config.sql` | Configuración remota, mantenimiento, versiones y noticias externas. |
| PM / Periodo Motivador | `supabase/patch_motivador_management.sql` | Gestión y visibilidad de PMs. |
| Solicitudes y panel admin | `supabase/patch_email_confirmation_and_personal_pm.sql` sobre patches previos | Evita mezclar confirmación de mail con aprobación dirigencial. |
| Notificaciones | `supabase/patch_push_notification_delivery_foundation.sql` + `supabase/patch_notification_intents.sql` | Token/device e intenciones. Requiere backend/Edge para envío real. |

## 6. Funciones críticas y patch a respetar

| RPC / función | Riesgo | Patch a respetar actualmente |
|---|---|---|
| `get_my_profile` | Crítico: login, sesión, perfil | `patch_email_confirmation_and_personal_pm.sql` salvo nuevo patch específico. |
| `admin_get_users` | Crítico: panel usuarios | `patch_email_confirmation_and_personal_pm.sql`, cuidando campos de imagen/comunidad. |
| `admin_update_user` | Crítico: roles, provincia, comunidad | No tocar sin consolidación específica. Revisar todas sus versiones. |
| `admin_upsert_material` | Alto: materiales | `patch_material_upload_permissions_fix.sql`. |
| `admin_archive_material` | Alto: materiales | `patch_material_upload_permissions_fix.sql`. |
| `current_user_can_manage_content` | Alto: permisos de contenido | `patch_material_upload_permissions_fix.sql`. |
| `admin_update_community` | Alto: comunidades | `patch_restore_communities_admin_management.sql` si hay falla. |
| `admin_create_tab` | Medio/alto: navegación | `patch_navigation_section_types_deep_link.sql`. |
| `admin_update_tab` | Medio/alto: navegación | `patch_navigation_section_types_deep_link.sql`. |
| `admin_update_app_content` | Medio/alto: contenido | Mantener compatible con `blocks`; revisar firma antes de tocar. |
| `admin_confirm_user_email` | Alto: Auth | Preferir Edge Function `admin-confirm-email`; RPC como respaldo. |
| `register_push_token` | Medio/alto: push | `patch_push_notification_delivery_foundation.sql`. |
| `create_notification_intent` | Medio/alto: push | Revisar firma entre `patch_notification_intents.sql` y `patch_push_notification_delivery_foundation.sql`. |

## 7. Patches históricos que no conviene reejecutar sin revisión

Estos scripts pueden seguir siendo útiles como referencia histórica, pero no deberían aplicarse sobre una base actual sin entender qué pisan.

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

Regla:

Si se ejecuta alguno por necesidad, después hay que revisar si corresponde reaplicar el patch vigente del módulo afectado.

## 8. Patches de recuperación o emergencia

Estos no son parte normal de una instalación limpia. Deben usarse solo cuando se entiende el problema concreto.

### Comunidades

- `supabase/patch_restore_communities_admin_management.sql`

Uso:

- Recuperar gestión de comunidades si una mejora posterior rompe el panel.

### Eliminación / reparación de usuarios

- `supabase/patch_force_release_user_email.sql`
- `supabase/patch_sql_editor_force_release_email.sql`
- `supabase/patch_safe_user_delete_diagnostics.sql`
- `supabase/patch_user_delete_foreign_keys.sql`
- `supabase/patch_user_auth_cleanup_v2.sql`

Uso:

- Diagnóstico, liberación, reparación o eliminación controlada de usuarios.

Riesgo:

- Pueden tocar `auth.users` o relaciones sensibles.
- No usar sin backup o revisión manual.

### Perfil / QR / recuperación

- `supabase/patch_emergency_profile_qr_recovery.sql`

Uso:

- Recuperación puntual de perfil/QR.

Riesgo:

- No usar como patch normal de evolución.

## 9. Patches por dominio funcional

Esta sección sirve para encontrar el patch correcto según el módulo afectado.

### Auth, usuarios y perfil

- `patch_auth_profile_trigger.sql`
- `patch_registration_metadata.sql`
- `patch_user_auth_cleanup_v2.sql`
- `patch_profile_photos.sql`
- `patch_profile_perseverance_preferences.sql`
- `patch_email_confirmation_and_personal_pm.sql`
- `patch_stabilize_profile_admin_rpcs.sql`
- `patch_admin_users.sql`
- `patch_safe_user_delete_diagnostics.sql`
- `patch_user_delete_foreign_keys.sql`

Referencia vigente:

- Perfil/login: `patch_email_confirmation_and_personal_pm.sql`.
- Consolidación futura: crear patch único específico de perfil/usuarios.

### Roles y permisos

- `patch_role_hierarchy_scope.sql`
- `patch_dynamic_role_permissions.sql`
- `patch_beta_province_role_labels.sql`
- `patch_role_aliases` si existe en SQL histórico.
- `patch_national_coordinator_replacement.sql`
- `patch_structural_admin_coherence.sql`

Referencia vigente:

- Revisar con `src/lib/roles.ts`, `src/lib/permissions.ts` y `src/lib/sessionAccess.ts`.

### Comunidades y provincias

- `patch_create_provinces.sql`
- `patch_admin_community_rpc.sql`
- `patch_community_management_scope.sql`
- `patch_community_subsections.sql`
- `patch_community_images_dynamic_roles.sql`
- `patch_news_scope_email_requests_community_coords.sql`
- `patch_restore_communities_admin_management.sql`
- `patch_secretariats.sql`

Referencia vigente:

- `patch_restore_communities_admin_management.sql` como recuperación estable.
- Consolidación futura necesaria.

### Navegación y contenido

- `patch_admin_app_content.sql`
- `patch_admin_navigation_manager.sql`
- `patch_admin_rpc_and_tabs.sql`
- `patch_navigation_section_types_deep_link.sql`
- `patch_published_content_management.sql`
- `patch_beta_content_permissions.sql`

Referencia vigente:

- Navegación: `patch_navigation_section_types_deep_link.sql`.
- Contenido: revisar compatibilidad con `blocks`.

### Materiales, biblioteca y descargas

- `patch_beta_baseline.sql`
- `patch_admin_persistence_config_materials_drafts.sql`
- `patch_admin_materials_visibility.sql`
- `patch_material_author_editing.sql`
- `patch_material_upload_permissions_fix.sql`
- `patch_library_items.sql`

Referencia vigente:

- `patch_material_upload_permissions_fix.sql`.

### Noticias, eventos y PM

- `patch_motivador_management.sql`
- `patch_news_scope_email_requests_community_coords.sql`
- `patch_published_content_management.sql`
- `patch_content_pm_downloads_messages.sql`

Referencia vigente:

- PM: `patch_motivador_management.sql`.
- Noticias/contenido publicado: revisar patch más nuevo antes de tocar.

### Foro, publicaciones e interacciones

- `patch_forum_scope_rules.sql`
- `patch_forum_comments_reactions.sql`
- `patch_public_profile_and_forum_fix.sql`
- `patch_community_polls_visibility.sql`

Referencia vigente:

- Revisar contra `src/lib/forum.ts` y `src/lib/remoteData.ts`.

### Notificaciones

- `patch_push_notification_delivery_foundation.sql`
- `patch_notification_intents.sql`
- Edge Functions:
  - `send-push-notifications`
  - `debug-push-notification`

Referencia vigente:

- Revisar firmas antes de agregar nuevos campos.
- No prometer envío real si Edge/backend no está activo.

### Evangelio diario

- Edge Function `fetch-daily-gospel`.
- Tabla `daily_gospel`.

Referencia vigente:

- Revisar `docs/daily-gospel.md` si se modifica.

## 10. Orden para nuevos parches futuros

Todo patch nuevo debe seguir esta regla:

1. Un módulo por patch.
2. Nombre explícito.
3. Comentario inicial con objetivo y funciones reemplazadas.
4. Idempotencia cuando sea posible.
5. Validación de permisos dentro de RPCs.
6. Actualizar este documento.
7. Actualizar `docs/sql-stability-audit.md` si reemplaza una función crítica.

Formato sugerido:

```text
supabase/migrations/YYYYMMDDHHMM_modulo_objetivo.sql
```

Ejemplo:

```text
supabase/migrations/202606031430_profiles_rpc_consolidation.sql
```

## 11. Plantilla mínima para patch nuevo

```sql
-- Objetivo:
-- Modulo afectado:
-- Reemplaza funciones/policies:
-- Riesgo:
-- Precondiciones:
-- Verificacion manual:
-- Rollback sugerido:

begin;

-- Cambios SQL aqui

commit;
```

Para funciones administrativas:

```sql
create or replace function public.nombre_funcion(...)
returns ...
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Validar usuario autenticado
  -- Validar perfil aprobado
  -- Validar rol/permiso
  -- Ejecutar accion
end;
$$;
```

## 12. Qué falta para cerrar esta etapa

Para que el orden de parches quede realmente sólido falta:

1. Generar `supabase/schema_current.sql` desde la base real.
2. Clasificar todos los SQL históricos en activo / histórico / emergencia / obsoleto.
3. Crear plantillas por RPC crítica en `supabase/rpc/`.
4. Consolidar `get_my_profile`, `admin_get_users` y `admin_update_user`.
5. Auditar policies RLS desde Supabase real, no solo desde archivos.

## 13. Conclusión

El proyecto ya tiene mucho SQL acumulado. El riesgo no está en que falten parches, sino en aplicar uno incorrecto en el momento incorrecto.

A partir de ahora, ningún parche viejo debería ejecutarse sin revisar este documento, la auditoría de estabilidad y el contrato Supabase.
