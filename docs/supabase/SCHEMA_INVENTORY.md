# Inventario del esquema Supabase

Fecha de auditoria: 2026-06-13

Issue relacionada: GitHub #20 - Supabase Fase 1.

## 1. Alcance

Este documento inventaria el contrato que el frontend actual espera de Supabase. La auditoria cubre todos los archivos de `src/lib` y `src/screens` que llaman a `supabase.from(...)`, `supabase.rpc(...)` o `supabase.storage.from(...)`.

Resultado observado en codigo:

- 20 tablas consultadas o modificadas directamente.
- 5 buckets de Storage.
- 138 RPC.
- 21 archivos con acceso directo a Supabase.

No se modifico la base de datos ni el codigo funcional. La existencia real de columnas, firmas, RLS, grants, triggers y tipos de retorno debe considerarse **pendiente de verificar en Supabase**.

## 2. Archivos auditados

- `src/lib/activeCoordinations.ts`
- `src/lib/authProfile.ts`
- `src/lib/community/advisors.ts`
- `src/lib/constants.ts`
- `src/lib/dailyGospel.ts`
- `src/lib/forum.ts`
- `src/lib/honorLevels.ts`
- `src/lib/library.ts`
- `src/lib/permissions.ts`
- `src/lib/profiles.ts`
- `src/lib/queries/publicQueries.ts`
- `src/lib/remoteData.ts`
- `src/lib/runtimeConfig.ts`
- `src/lib/uploads.ts`
- `src/screens/IntentionsScreen.tsx`
- `src/screens/LibrarySectionScreen.tsx`
- `src/screens/MaterialsScreen.tsx`
- `src/screens/NotilestraScreen.tsx`
- `src/screens/profile/useMailboxController.ts`
- `src/screens/ProfileScreen.tsx`
- `src/screens/StaticScreens.tsx`

Los usos de `Array.from(...)` encontrados en varios de estos archivos no son accesos a Supabase. `src/lib/uploads.ts` usa un nombre de bucket dinamico; sus consumidores actuales estan incluidos en el inventario de Storage.

## 3. Tablas y columnas esperadas

Las columnas listadas son las que el frontend selecciona, escribe, filtra o consume mediante sus tipos. No prueban que la base remota tenga exactamente esa estructura.

| Tabla | Columnas esperadas por el frontend |
|---|---|
| `app_content` | `tab_key`, `title`, `body`, `blocks`, `updated_at` |
| `app_library_items` | `id`, `section`, `title`, `subtitle`, `body`, `image_url`, `category`, `source`, `item_date`, `status`, `sort_order`, `created_by`, `created_at`, `updated_at`, `archived_at` |
| `app_runtime_config` | `id`, `min_supported_version`, `recommended_version`, `maintenance_mode`, `global_message`, `feature_flags`, `catholic_news`, `updated_at` |
| `app_tabs` | `key`, `label`, `icon_name`, `section_type`, `is_visible`, `sort_order`, `visible_roles` |
| `church_document_buttons` | `id`, `title`, `logo_url`, `target_url`, `enabled`, `sort_order`, `archived_at`, `created_at`, `updated_at` |
| `communities` | `id`, `province_id`, `name`, `group_type`, `address`, `phone`, `meeting_day`, `meeting_time`, `description`, `image_url`, `latitude`, `longitude`, `is_active`, `archived_at`; relacion `provinces(name, region, logo_url, is_active, archived_at)` |
| `community_contact_messages` | `community_id`, `sender_name`, `sender_contact`, `message`, `response`, `status`, `created_at`, `responded_at`, `read_at`, `closed_at` |
| `community_publications` | `id`, `community_id`, `kind`, `title`, `subtitle`, `body`, `body_format`, `event_date`, `visibility`, `poll_options`, `poll_results`, `status`, `created_by`, `created_at`, `image_url`, `link_label`, `link_url`, `archived_at`; relaciones `profiles(full_name, role)` y `communities(name, provinces(name))` |
| `daily_gospel` | `id`, `date`, `title`, `citation`, `gospel_text`, `reflection_title`, `reflection_text`, `prayer_text`, `source_name`, `source_url`, `reflection_source_url`, `fetched_at` |
| `events` | `id`, `title`, `description`, `starts_at`, `is_public`, `archived_at`, `province_id`; relacion `provinces(name)` |
| `forum_categories` | `id`, `scope`, `province_id`, `name`, `description`, `sort_order`, `is_active` |
| `materials` | `id`, `title`, `description`, `category`, `visibility`, `required_permission`, `file_url`, `file_path`, `sort_order`, `archived_at`, `created_at`, `created_by`, `province_id` |
| `motivador_periods` | `id`, `province_id`, `gender`, `pm_number`, `selected_dates`, `starts_on`, `ends_on`, `retreat_house`, `address`, `opening_time`, `closing_time`, `description`, `place_photo_url`, `flyer_url`, `visible_to_lower_roles`, `is_visible`, `status`, `created_by`, `updated_by`, `created_at`, `updated_at`; relacion `provinces(name)` |
| `news` | `id`, `title`, `body`, `image_url`, `is_public`, `created_at`, `archived_at`, `province_id`; relacion `provinces(name)` |
| `news_drafts` | `id`, `title`, `body`, `category`, `image_url`, `is_featured`, `status`, `created_at`, `updated_at` |
| `profiles` | `id`, `user_id`, `email`, `email_confirmed_at`, `full_name`, `avatar_url`, `phone`, `province`, `province_id`, `community_name`, `community_id`, `status`, `role`, `subrole_key`, `display_role_label`, `gender_preference`, `nickname`, `use_nickname_in_greetings`, `credential_name_mode`, `perseverance_start_year`, `personal_pm_type`, `personal_pm_number`, `personal_pm_province`, `personal_pm_motto`, `pm_motto`, `personal_greeting_color`, `deleted_at` |
| `province_community_sections` | `province_id`, `group_type`, `is_enabled`; relacion `provinces(name)` |
| `provinces` | `id`, `name`, `region`, `logo_url`, `is_active`, `archived_at` |
| `publication_comments` | `id`, `publication_id`, `user_id`, `body`, `created_at`; relacion `profiles(full_name, role, avatar_url, community_name, provinces(name))` |
| `role_permissions` | `role`, `permission_key`, `enabled` |
| `user_agenda_preferences` | `user_id`, `item_key`, `preference_type`, `item_title`, `item_date`, `item_source`, `created_at`; conflicto esperado en `user_id,item_key,preference_type` |

### 3.1 Observaciones de relaciones

- El frontend mezcla relaciones normalizadas (`province_id`, `community_id`) con campos legacy de texto (`province`, `community_name`).
- Varias consultas esperan relaciones PostgREST con `provinces(...)`, `communities(...)` y `profiles(...)`.
- La tabla `profiles` se escribe directamente solo para `subrole_key`; el resto de sus datos se obtiene o modifica principalmente mediante RPC.
- `community_contact_messages` tiene dos caminos de insercion: RPC con `community_id` y formulario dinamico con insercion directa sin comunidad.
- Todas las columnas, claves foraneas e indices quedan pendientes de verificar en Supabase.

## 4. Buckets de Storage

| Bucket | Uso actual | Verificacion pendiente |
|---|---|---|
| `community-images` | Imagenes y logos de comunidades/provincias | RLS, MIME, limite y limpieza |
| `content-images` | Imagenes de contenido e intenciones | RLS, MIME, limite y limpieza |
| `library-images` | Portadas de biblioteca | RLS, MIME, limite y limpieza |
| `materials` | Archivos y portadas de materiales | RLS, MIME, limite y limpieza |
| `profile-photos` | Avatares | RLS, MIME, limite y limpieza |

`src/lib/uploads.ts` acepta el bucket como parametro. Cualquier bucket futuro enviado a ese helper debe agregarse a este contrato.

## 5. Convencion de respuestas RPC

La columna "Respuesta esperada" describe lo que consume el frontend:

- **Mutacion**: el cliente necesita un `PostgrestResponse` sin `error`; el contenido de `data` no se interpreta de forma estable.
- **Lista `Tipo`**: el cliente convierte `data` a una lista con esa forma.
- **Registro `Tipo`**: el cliente toma la primera fila o un objeto unico.
- **Pendiente**: el cliente devuelve el resultado crudo y el formato real debe verificarse en Supabase.

## 6. RPC y firmas esperadas

### 6.1 A-C

| RPC | Parametros enviados | Respuesta esperada |
|---|---|---|
| `accept_coordinator_request` | `p_request_id` | Mutacion |
| `add_qr_activity_member` | `p_list_id`, `p_user_id` | Mutacion |
| `add_qr_activity_members_by_scope` | `p_list_id`, `p_province`, `p_community_name` | Mutacion |
| `admin_approve_profile` | `p_profile_id`, `p_role` | Mutacion |
| `admin_archive_community` | `p_community_id` | Mutacion |
| `admin_archive_event` | `p_event_id` | Mutacion |
| `admin_archive_formation_path_station` | `p_station_id` | Mutacion |
| `admin_archive_library_item` | `p_id` | Mutacion |
| `admin_archive_material` | `p_id` | Mutacion |
| `admin_archive_news` | `p_news_id` | Mutacion |
| `admin_archive_prayer_intention` | `p_intention_id` | Mutacion |
| `admin_archive_province` | `p_name` | Mutacion |
| `admin_confirm_user_email` | `p_user_id` | Mutacion; fallback de Edge Function |
| `admin_create_basic_user` | `p_email`, `p_password` | Mutacion; identidad/perfil creado |
| `admin_create_community` | `p_province`, `p_name`, `p_group_type`, `p_address`, `p_phone`, `p_meeting_day`, `p_meeting_time`, `p_description`, `p_latitude`, `p_longitude`, `p_is_active` | Mutacion |
| `admin_create_event` | `p_title`, `p_description`, `p_starts_at`, `p_is_public` | Mutacion |
| `admin_create_news` | `p_title`, `p_body`, `p_is_public`, `p_province`, `p_image_url` | Mutacion |
| `admin_create_province` | `p_name`, `p_region`, `p_logo_url` | Mutacion |
| `admin_create_tab` | `p_key`, `p_label`, `p_visible_roles`, `p_icon_name`, `p_section_type` | Mutacion |
| `admin_delete_tab` | `p_key` | Mutacion |
| `admin_delete_user_by_email` | `p_email`, `p_reason` | Mutacion |
| `admin_delete_user_completely` | `p_profile_id` | Mutacion |
| `admin_diagnose_user_login` | `p_email` | Registro `AdminUserLoginDiagnostic` |
| `admin_force_release_user_email` | `p_email`, `p_reason` | Mutacion |
| `admin_get_materials` | sin parametros | Lista `AppMaterialRecord` |
| `admin_get_motivador_periods` | sin parametros | Lista `MotivadorPeriodRecord` |
| `admin_get_pending_profiles` | sin parametros | Lista `PendingProfile` |
| `admin_get_prayer_intentions` | sin parametros | Lista `PrayerIntentionRecord` |
| `admin_get_requests` | sin parametros | Lista `UserRequestRecord` |
| `admin_get_role_permissions` | `p_role` | Lista `RolePermissionRecord` |
| `admin_get_users` | sin parametros | Lista `AdminUser` |
| `admin_repair_user_login` | `p_email` | Mutacion |
| `admin_resolve_user_request` | `p_request_id`, `p_status`, `p_admin_message`, `p_assign_role` | Mutacion |
| `admin_restore_default_tabs` | sin parametros | Mutacion |
| `admin_save_formation_path_station` | `p_id`, `p_title`, `p_subtitle`, `p_short_description`, `p_image_url`, `p_icon_name`, `p_color`, `p_sort_order`, `p_young_content`, `p_leader_content`, `p_visible_roles`, `p_is_active`, `p_material_ids` | Mutacion |
| `admin_save_province_role_label` | `p_province`, `p_role_key`, `p_display_label`, `p_description`, `p_is_active` | Mutacion |
| `admin_save_role_alias` | `p_alias_id`, `p_base_role`, `p_display_label`, `p_province`, `p_is_active` | Mutacion |
| `admin_save_role_permissions` | `p_role`, `p_permission_keys` | Mutacion |
| `admin_set_community_status` | `p_community_id`, `p_is_active` | Mutacion |
| `admin_set_formation_path_station_status` | `p_station_id`, `p_is_active` | Mutacion |
| `admin_set_motivador_period_status` | `p_id`, `p_status` | Mutacion |
| `admin_set_province_community_section` | `p_province`, `p_group_type`, `p_is_enabled` | Mutacion |
| `admin_set_province_status` | `p_name`, `p_is_active` | Mutacion |
| `admin_set_role_alias_status` | `p_alias_id`, `p_is_active` | Mutacion |
| `admin_set_tab_position` | `p_key`, `p_label`, `p_is_visible`, `p_sort_order`, `p_visible_roles`, `p_icon_name`, `p_section_type` | Mutacion |
| `admin_update_app_content` | `p_tab_key`, `p_title`, `p_body`, `p_blocks` | Mutacion |
| `admin_update_community` | `p_community_id`, `p_name`, `p_address`, `p_phone`, `p_meeting_day`, `p_meeting_time`, `p_description`, `p_image_url`, `p_latitude`, `p_longitude`, `p_group_type` | Mutacion |
| `admin_update_config` | `p_config` | Mutacion |
| `admin_update_event` | `p_event_id`, `p_title`, `p_description`, `p_starts_at`, `p_is_public` | Mutacion |
| `admin_update_instagram` | `p_instagram` | Mutacion |
| `admin_update_news` | `p_news_id`, `p_title`, `p_body`, `p_image_url`, `p_is_public` | Mutacion |
| `admin_update_profile_details_v2` | `p_profile_id`, `p_nickname`, `p_use_nickname_in_greetings`, `p_credential_name_mode`, `p_perseverance_start_year`, `p_personal_pm_type`, `p_personal_pm_number`, `p_personal_pm_province`, `p_personal_pm_motto` | Mutacion |
| `admin_update_province_logo` | `p_name`, `p_logo_url` | Mutacion |
| `admin_update_tab` | `p_key`, `p_label`, `p_is_visible`, `p_visible_roles`, `p_icon_name`, `p_section_type` | Mutacion |
| `admin_update_user` | `p_profile_id`, `p_email`, `p_password`, `p_full_name`, `p_phone`, `p_province`, `p_community_name`, `p_status`, `p_role`, `p_display_role_label` | Mutacion |
| `admin_upsert_library_item` | `p_id`, `p_section`, `p_title`, `p_subtitle`, `p_body`, `p_image_url`, `p_category`, `p_source`, `p_item_date`, `p_status`, `p_sort_order` | Mutacion |
| `admin_upsert_material` | `p_id`, `p_title`, `p_description`, `p_category`, `p_visibility`, `p_required_permission`, `p_file_url`, `p_file_path`, `p_sort_order` | Mutacion |
| `admin_upsert_motivador_period` | `p_id`, `p_province`, `p_gender`, `p_pm_number`, `p_selected_dates`, `p_retreat_house`, `p_address`, `p_opening_time`, `p_closing_time`, `p_description`, `p_place_photo_url`, `p_flyer_url`, `p_visible_to_lower_roles`, `p_status` | Mutacion |
| `admin_upsert_news_draft` | `p_id`, `p_title`, `p_body`, `p_category`, `p_image_url`, `p_is_featured`, `p_status` | Mutacion |
| `archive_community_publication` | `p_publication_id` | Mutacion |
| `archive_forum_comment` | `p_comment_id` | Mutacion |
| `archive_forum_topic` | `p_topic_id` | Mutacion |
| `archive_qr_activity_list` | `p_list_id` | Mutacion |
| `assign_community_advisor` | `p_community_id`, `p_advisor_user_id` | Mutacion |
| `check_registration_email_available` | `p_email` | Registro `{ available, reason }` |
| `create_community_contact_message` | `p_community_id`, `p_sender_name`, `p_sender_contact`, `p_message` | Mutacion |
| `create_community_publication` | `p_kind`, `p_title`, `p_body`, `p_subtitle`, `p_body_format`, `p_image_url`, `p_link_label`, `p_link_url`, `p_event_date`, `p_visibility`, `p_poll_options` | Mutacion |
| `create_email_confirmation_request` | `p_user_id`, `p_email`, `p_full_name`, `p_province`, `p_community_name`, `p_contact` | Mutacion |
| `create_forum_comment` | `p_topic_id`, `p_body` | Mutacion |
| `create_forum_topic` | `p_category_id`, `p_title`, `p_body`, `p_min_role` | Mutacion |
| `create_institutional_query` | `p_target_user_id`, `p_sender_name`, `p_sender_contact`, `p_message`, `p_origin` | Mutacion |
| `create_leadership_change_request` | `p_successor_user_id`, `p_successor_role`, `p_details` | Mutacion |
| `create_mailbox_message` | `p_target_mode`, `p_message`, `p_community_id`, `p_province`, `p_role`, `p_user_id` | Mutacion |
| `create_notification_intent` | `p_notification_type`, `p_title`, `p_body`, `p_target_kind`, `p_target_value`, `p_target_scope`, `p_province`, `p_community`, `p_min_role`, `p_tab_key`, `p_source_type`, `p_source_id` | Registro con identificador de intencion; forma pendiente |
| `create_prayer_intention` | `p_body`, `p_is_anonymous` | Mutacion |
| `create_publication_comment` | `p_publication_id`, `p_body` | Mutacion |
| `create_qr_activity_list` | `p_title`, `p_province`, `p_community_name` | Mutacion |
| `create_secretariat_message` | `p_target_user_id`, `p_message` | Mutacion |
| `create_user_request` | `p_request_type`, `p_details` | Mutacion |

### 6.2 D-R

| RPC | Parametros enviados | Respuesta esperada |
|---|---|---|
| `debug_my_library_permission` | sin parametros | Registro `LibraryPermissionDebug` |
| `delete_message_for_me` | `p_message_id`, `p_source` | Mutacion |
| `get_admin_config` | sin parametros | Registro JSON `AdminConfigRecord` |
| `get_assignable_role_aliases` | sin parametros | Lista `RoleAliasRecord` |
| `get_community_advisor_assignments` | `p_community_id` | Lista `CommunityAdvisorAssignment` |
| `get_formation_path_stations` | `p_include_inactive` | Lista `FormationPathStationRecord` |
| `get_forum_comments` | `p_topic_id` | Lista `ForumComment` |
| `get_forum_topics` | `p_category_id` | Lista `ForumTopic` |
| `get_moderation_queue` | sin parametros | Lista `MessageModerationRecord` |
| `get_my_community_advisors` | sin parametros | Lista `CommunityAdvisorAssignment` |
| `get_my_community_members` | sin parametros | Lista `CommunityMember` |
| `get_my_community_publications` | sin parametros | Lista de publicaciones comunitarias |
| `get_my_mailbox_messages` | sin parametros | Lista `MailboxMessageRecord` |
| `get_my_prayer_intentions` | sin parametros | Lista `PrayerIntentionRecord` |
| `get_my_prayer_removal_notices` | sin parametros | Lista `PrayerRemovalNoticeRecord` |
| `get_my_profile` | sin parametros | Registro de sesion/perfil normalizado |
| `get_my_public_queries` | sin parametros | Lista `PublicQueryRecord` |
| `get_my_requests` | sin parametros | Lista `UserRequestRecord` |
| `get_province_role_labels` | sin parametros | Lista `ProvinceRoleLabelRecord` |
| `get_public_profile` | `p_profile_id` | Registro `PublicProfileRecord` |
| `get_public_user_directory` | sin parametros | Lista `PublicUserDirectoryRecord` |
| `get_qr_activity_attendance` | `p_list_id` | Lista `QrActivityAttendanceRecord` |
| `get_qr_activity_list_shares` | `p_list_id` | Lista `QrActivityListShareRecord` |
| `get_qr_activity_lists` | sin parametros | Lista `QrActivityListRecord` |
| `get_qr_activity_members` | `p_list_id` | Lista `QrActivityMemberRecord` |
| `get_random_prayer_intention` | `p_exclude_ids` | Lista de hasta una `PrayerIntentionRecord` |
| `get_secretariat_members` | `p_scope`, `p_province` | Lista `SecretariatMemberRecord` |
| `issue_profile_credential` | sin parametros | Registro `CredentialQrRecord` |
| `mark_message_as_read` | `p_message_id`, `p_source` | Mutacion |
| `mark_prayer_removal_notices_seen` | `p_notice_ids` | Mutacion |
| `react_to_publication` | `p_publication_id`, `p_reaction` | Mutacion |
| `record_prayer_for_intention` | `p_intention_id` | Registro `PrayerIntentionResult` |
| `register_push_token` | `p_expo_push_token`, `p_platform`, `p_device_id`, `p_device_name`, `p_app_version`, `p_is_active` | Mutacion |
| `remove_community_advisor` | `p_assignment_id` | Mutacion |
| `remove_qr_activity_member` | `p_list_id`, `p_user_id` | Mutacion |
| `report_message` | `p_message_id`, `p_source`, `p_reason`, `p_comment` | Mutacion |
| `report_publication` | `p_publication_id`, `p_reason` | Mutacion |
| `resolve_profile_honor_level` | `p_profile_id` | Registro `{ role_key, level_key, display_name, description, perseverance_years }` |
| `respond_community_contact_message` | `p_message_id`, `p_response` | Mutacion |
| `respond_public_query` | `p_query_id`, `p_response` | Mutacion |
| `restore_message_for_me` | `p_message_id`, `p_source` | Mutacion |
| `restore_user_messaging` | `p_user_id` | Mutacion |
| `restrict_user_messaging` | `p_user_id`, `p_reason`, `p_days` | Mutacion |
| `review_message_report` | `p_report_id`, `p_status`, `p_action_taken` | Mutacion |

### 6.3 S-Z

| RPC | Parametros enviados | Respuesta esperada |
|---|---|---|
| `send_direct_message_with_moderation` | `p_recipient_ids`, `p_body`, `p_subject` | Mutacion; puede incluir resultado de moderacion, pendiente |
| `set_community_contact_message_status` | `p_message_id`, `p_status` | Mutacion |
| `set_forum_topic_status` | `p_topic_id`, `p_status` | Mutacion |
| `set_public_query_status` | `p_query_id`, `p_status` | Mutacion |
| `share_qr_activity_list` | `p_list_id`, `p_user_ids`, `p_roles` | Mutacion |
| `update_community_publication` | `p_publication_id`, `p_title`, `p_body`, `p_subtitle`, `p_body_format`, `p_image_url`, `p_link_label`, `p_link_url`, `p_status` | Mutacion |
| `update_forum_topic` | `p_topic_id`, `p_title`, `p_body`, `p_min_role` | Mutacion |
| `update_my_avatar` | `p_avatar_url` | Mutacion |
| `update_my_community_details` | `p_description`, `p_image_url` | Mutacion |
| `update_my_profile` | `p_full_name`, `p_phone`, `p_province`, `p_community_name`, `p_gender_preference` | Mutacion |
| `update_my_profile_details_v2` | `p_nickname`, `p_use_nickname_in_greetings`, `p_credential_name_mode`, `p_perseverance_start_year`, `p_personal_pm_type`, `p_personal_pm_number`, `p_personal_pm_province`, `p_personal_pm_motto`, `p_personal_greeting_color` | Mutacion |
| `update_qr_activity_list` | `p_list_id`, `p_title`, `p_province`, `p_community_name` | Mutacion |
| `validate_profile_credential` | `p_token` | Registro `CredentialValidationRecord` |
| `validate_qr_activity_attendance` | `p_list_id`, `p_token` | Registro de validacion/asistencia; forma pendiente |
| `vote_community_poll` | `p_publication_id`, `p_option` | Mutacion |

## 7. Compensaciones y fallbacks detectados

Estos puntos permiten que el frontend sobreviva a esquemas antiguos, pero ocultan diferencias entre entornos:

| Ubicacion | Compensacion actual | Riesgo |
|---|---|---|
| `src/lib/remoteData.ts` - provincias | Si falla la seleccion de `logo_url`, `is_active` o `archived_at`, repite solo con `id`, `name`, `region` | Estados y logos pueden desaparecer silenciosamente |
| `src/lib/remoteData.ts` - comunidades | Si falla la consulta con coordenadas y metadatos de provincia, repite sin `latitude`, `longitude` ni metadatos ampliados | Geolocalizacion puede quedar inoperante sin error visible |
| `src/lib/remoteData.ts` - noticias | Si falta `image_url`, repite la consulta sin esa columna | Imagenes se omiten y el esquema viejo sigue activo |
| `src/lib/remoteData.ts` - publicaciones | Primero intenta `get_my_community_publications`; si falla, lee tablas directamente | RLS y forma de datos pueden variar entre caminos |
| `src/lib/remoteData.ts` - publicaciones | Si falta `image_url` u otra columna detectada por mensaje, repite una seleccion reducida | Subtitulo, formato, imagen y enlaces pueden perderse |
| `src/lib/remoteData.ts` - actualizar noticias | Reintenta `admin_update_news` sin `p_image_url` ante funcion antigua/schema cache | Firma RPC duplicada |
| `src/lib/profiles.ts` - crear noticias | Reintenta `admin_create_news` sin `p_image_url` | Firma RPC duplicada |
| `src/lib/profiles.ts` - pestañas | Si falla `icon_name` o `section_type`, vuelve a leer el contrato antiguo | La navegacion puede degradarse silenciosamente |
| `src/lib/profiles.ts` - materiales | Si falla `admin_get_materials`, consulta `materials` directamente | El alcance administrativo depende de dos contratos |
| `src/lib/profiles.ts` - comunidades | Reintenta `admin_update_community` sin `p_group_type` | Firma RPC legacy mantenida |
| `src/lib/profiles.ts` - provincias | Reintenta `admin_create_province` sin `p_logo_url` | Firma RPC legacy mantenida |
| `src/lib/profiles.ts` - usuarios | Actualiza `subrole_key` directamente y tolera error de columna inexistente | Un guardado puede terminar parcialmente aplicado |
| `src/lib/profiles.ts` - confirmar email | Intenta Edge Function `admin-confirm-email` y luego RPC | Dos implementaciones para la misma accion |
| `src/lib/profiles.ts` - liberar email | Intenta `admin_force_release_user_email` y luego `admin_delete_user_by_email` | Semanticas potencialmente distintas |
| `src/screens/StaticScreens.tsx` | Inserta directamente en `community_contact_messages` sin `community_id` | Contrato distinto al helper RPC |
| Lecturas generales | Muchos `catch` retornan `[]` o `null` | Un error de esquema puede verse como "sin datos" |

No se encontraron nombres de tabla dinamicos en el cliente. El unico acceso dinamico relevante es el bucket recibido por `src/lib/uploads.ts`.

## 8. Elementos relacionados fuera de tablas/RPC

El frontend tambien depende de:

- Edge Function `admin-confirm-email`.
- Edge Function `send-push-notifications`.
- Edge Function `debug-push-notification`.
- Auth: `getUser`, `signUp`, `signInWithPassword`, `signOut`, `resetPasswordForEmail`, `updateUser`.
- Relaciones PostgREST y sus claves foraneas.
- Policies de Storage.

Su configuracion, despliegue, secretos y permisos quedan pendientes de verificar en Supabase.

## 9. Pendientes de verificacion remota

1. Exportar el esquema real de produccion.
2. Comparar las 20 tablas y todas sus columnas con la seccion 3.
3. Comparar las 138 firmas RPC, incluidos defaults y tipos SQL.
4. Confirmar si cada RPC retorna objeto, fila, lista, UUID, boolean o `void`.
5. Confirmar RLS, grants y `security definer` de cada operacion.
6. Confirmar claves foraneas necesarias para las relaciones PostgREST.
7. Confirmar indices, restricciones unicas y triggers.
8. Confirmar buckets, policies, MIME y limites.
9. Elegir un contrato canonico para provincia/comunidad y retirar campos legacy solo mediante migracion.
10. Retirar cada fallback unicamente despues de alinear y probar la base remota.

## 10. Conclusión

El frontend actual no depende de un esquema pequeño: mantiene un contrato de 20 tablas, 5 buckets y 138 RPC. El principal riesgo no es la falta de funcionalidades, sino la coexistencia de firmas y columnas legacy que el cliente compensa con reintentos o retornos vacios.

La siguiente fase debe contrastar este inventario con un export real de Supabase antes de modificar SQL, RLS o funciones.
