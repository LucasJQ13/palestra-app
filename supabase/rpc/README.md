# Catalogo de funciones remotas

Este directorio documenta todas las RPC invocadas por el frontend.

> Los archivos son documentales. No son migraciones ejecutables.

## Estado del catalogo

- RPC usadas por frontend: **138**.
- Con una o mas definiciones SQL candidatas en el repo: **138**.
- Pendientes de obtener desde Supabase: **0**.
- Marcadas con criticidad critica: **35**.
- Edge Functions invocadas: **4**.

Una definicion SQL versionada no prueba que sea la version desplegada en produccion. Las funciones con multiples referencias requieren comparar el export remoto antes de elegir una firma canonica.

## RPC

| Funcion | Criticidad | SQL en repo | Ficha |
| --- | --- | --- | --- |
| `accept_coordinator_request` | Alto | 2 referencia(s) | [Abrir](./accept_coordinator_request.md) |
| `add_qr_activity_member` | Moderado | 1 referencia(s) | [Abrir](./add_qr_activity_member.md) |
| `add_qr_activity_members_by_scope` | Moderado | 1 referencia(s) | [Abrir](./add_qr_activity_members_by_scope.md) |
| `admin_approve_profile` | Critico | 2 referencia(s) | [Abrir](./admin_approve_profile.md) |
| `admin_archive_community` | Alto | 2 referencia(s) | [Abrir](./admin_archive_community.md) |
| `admin_archive_event` | Alto | 1 referencia(s) | [Abrir](./admin_archive_event.md) |
| `admin_archive_formation_path_station` | Alto | 2 referencia(s) | [Abrir](./admin_archive_formation_path_station.md) |
| `admin_archive_library_item` | Alto | 1 referencia(s) | [Abrir](./admin_archive_library_item.md) |
| `admin_archive_material` | Alto | 4 referencia(s) | [Abrir](./admin_archive_material.md) |
| `admin_archive_news` | Alto | 1 referencia(s) | [Abrir](./admin_archive_news.md) |
| `admin_archive_prayer_intention` | Alto | 1 referencia(s) | [Abrir](./admin_archive_prayer_intention.md) |
| `admin_archive_province` | Alto | 1 referencia(s) | [Abrir](./admin_archive_province.md) |
| `admin_confirm_user_email` | Critico | 2 referencia(s) | [Abrir](./admin_confirm_user_email.md) |
| `admin_create_basic_user` | Critico | 2 referencia(s) | [Abrir](./admin_create_basic_user.md) |
| `admin_create_community` | Alto | 3 referencia(s) | [Abrir](./admin_create_community.md) |
| `admin_create_event` | Alto | 2 referencia(s) | [Abrir](./admin_create_event.md) |
| `admin_create_news` | Alto | 4 referencia(s) | [Abrir](./admin_create_news.md) |
| `admin_create_province` | Alto | 2 referencia(s) | [Abrir](./admin_create_province.md) |
| `admin_create_tab` | Alto | 3 referencia(s) | [Abrir](./admin_create_tab.md) |
| `admin_delete_tab` | Critico | 1 referencia(s) | [Abrir](./admin_delete_tab.md) |
| `admin_delete_user_by_email` | Critico | 3 referencia(s) | [Abrir](./admin_delete_user_by_email.md) |
| `admin_delete_user_completely` | Critico | 3 referencia(s) | [Abrir](./admin_delete_user_completely.md) |
| `admin_diagnose_user_login` | Critico | 3 referencia(s) | [Abrir](./admin_diagnose_user_login.md) |
| `admin_force_release_user_email` | Critico | 1 referencia(s) | [Abrir](./admin_force_release_user_email.md) |
| `admin_get_materials` | Alto | 1 referencia(s) | [Abrir](./admin_get_materials.md) |
| `admin_get_motivador_periods` | Alto | 1 referencia(s) | [Abrir](./admin_get_motivador_periods.md) |
| `admin_get_pending_profiles` | Critico | 3 referencia(s) | [Abrir](./admin_get_pending_profiles.md) |
| `admin_get_prayer_intentions` | Alto | 1 referencia(s) | [Abrir](./admin_get_prayer_intentions.md) |
| `admin_get_requests` | Alto | 5 referencia(s) | [Abrir](./admin_get_requests.md) |
| `admin_get_role_permissions` | Critico | 1 referencia(s) | [Abrir](./admin_get_role_permissions.md) |
| `admin_get_users` | Critico | 10 referencia(s) | [Abrir](./admin_get_users.md) |
| `admin_repair_user_login` | Critico | 1 referencia(s) | [Abrir](./admin_repair_user_login.md) |
| `admin_resolve_user_request` | Critico | 3 referencia(s) | [Abrir](./admin_resolve_user_request.md) |
| `admin_restore_default_tabs` | Alto | 2 referencia(s) | [Abrir](./admin_restore_default_tabs.md) |
| `admin_save_formation_path_station` | Alto | 3 referencia(s) | [Abrir](./admin_save_formation_path_station.md) |
| `admin_save_province_role_label` | Critico | 1 referencia(s) | [Abrir](./admin_save_province_role_label.md) |
| `admin_save_role_alias` | Critico | 1 referencia(s) | [Abrir](./admin_save_role_alias.md) |
| `admin_save_role_permissions` | Critico | 1 referencia(s) | [Abrir](./admin_save_role_permissions.md) |
| `admin_set_community_status` | Alto | 2 referencia(s) | [Abrir](./admin_set_community_status.md) |
| `admin_set_formation_path_station_status` | Alto | 2 referencia(s) | [Abrir](./admin_set_formation_path_station_status.md) |
| `admin_set_motivador_period_status` | Alto | 1 referencia(s) | [Abrir](./admin_set_motivador_period_status.md) |
| `admin_set_province_community_section` | Alto | 1 referencia(s) | [Abrir](./admin_set_province_community_section.md) |
| `admin_set_province_status` | Alto | 1 referencia(s) | [Abrir](./admin_set_province_status.md) |
| `admin_set_role_alias_status` | Critico | 1 referencia(s) | [Abrir](./admin_set_role_alias_status.md) |
| `admin_set_tab_position` | Alto | 3 referencia(s) | [Abrir](./admin_set_tab_position.md) |
| `admin_update_app_content` | Alto | 3 referencia(s) | [Abrir](./admin_update_app_content.md) |
| `admin_update_community` | Alto | 7 referencia(s) | [Abrir](./admin_update_community.md) |
| `admin_update_config` | Alto | 1 referencia(s) | [Abrir](./admin_update_config.md) |
| `admin_update_event` | Alto | 1 referencia(s) | [Abrir](./admin_update_event.md) |
| `admin_update_instagram` | Alto | 1 referencia(s) | [Abrir](./admin_update_instagram.md) |
| `admin_update_news` | Alto | 2 referencia(s) | [Abrir](./admin_update_news.md) |
| `admin_update_profile_details_v2` | Critico | 2 referencia(s) | [Abrir](./admin_update_profile_details_v2.md) |
| `admin_update_province_logo` | Alto | 1 referencia(s) | [Abrir](./admin_update_province_logo.md) |
| `admin_update_tab` | Alto | 4 referencia(s) | [Abrir](./admin_update_tab.md) |
| `admin_update_user` | Critico | 10 referencia(s) | [Abrir](./admin_update_user.md) |
| `admin_upsert_library_item` | Alto | 2 referencia(s) | [Abrir](./admin_upsert_library_item.md) |
| `admin_upsert_material` | Alto | 4 referencia(s) | [Abrir](./admin_upsert_material.md) |
| `admin_upsert_motivador_period` | Alto | 1 referencia(s) | [Abrir](./admin_upsert_motivador_period.md) |
| `admin_upsert_news_draft` | Alto | 1 referencia(s) | [Abrir](./admin_upsert_news_draft.md) |
| `archive_community_publication` | Alto | 1 referencia(s) | [Abrir](./archive_community_publication.md) |
| `archive_forum_comment` | Alto | 1 referencia(s) | [Abrir](./archive_forum_comment.md) |
| `archive_forum_topic` | Alto | 1 referencia(s) | [Abrir](./archive_forum_topic.md) |
| `archive_qr_activity_list` | Alto | 1 referencia(s) | [Abrir](./archive_qr_activity_list.md) |
| `assign_community_advisor` | Alto | 1 referencia(s) | [Abrir](./assign_community_advisor.md) |
| `check_registration_email_available` | Moderado | 1 referencia(s) | [Abrir](./check_registration_email_available.md) |
| `create_community_contact_message` | Alto | 2 referencia(s) | [Abrir](./create_community_contact_message.md) |
| `create_community_publication` | Alto | 6 referencia(s) | [Abrir](./create_community_publication.md) |
| `create_email_confirmation_request` | Critico | 1 referencia(s) | [Abrir](./create_email_confirmation_request.md) |
| `create_forum_comment` | Alto | 2 referencia(s) | [Abrir](./create_forum_comment.md) |
| `create_forum_topic` | Alto | 3 referencia(s) | [Abrir](./create_forum_topic.md) |
| `create_institutional_query` | Alto | 1 referencia(s) | [Abrir](./create_institutional_query.md) |
| `create_leadership_change_request` | Alto | 1 referencia(s) | [Abrir](./create_leadership_change_request.md) |
| `create_mailbox_message` | Alto | 1 referencia(s) | [Abrir](./create_mailbox_message.md) |
| `create_notification_intent` | Alto | 2 referencia(s) | [Abrir](./create_notification_intent.md) |
| `create_prayer_intention` | Alto | 1 referencia(s) | [Abrir](./create_prayer_intention.md) |
| `create_publication_comment` | Alto | 2 referencia(s) | [Abrir](./create_publication_comment.md) |
| `create_qr_activity_list` | Alto | 1 referencia(s) | [Abrir](./create_qr_activity_list.md) |
| `create_secretariat_message` | Alto | 1 referencia(s) | [Abrir](./create_secretariat_message.md) |
| `create_user_request` | Critico | 1 referencia(s) | [Abrir](./create_user_request.md) |
| `debug_my_library_permission` | Critico | 1 referencia(s) | [Abrir](./debug_my_library_permission.md) |
| `delete_message_for_me` | Critico | 1 referencia(s) | [Abrir](./delete_message_for_me.md) |
| `get_admin_config` | Moderado | 1 referencia(s) | [Abrir](./get_admin_config.md) |
| `get_assignable_role_aliases` | Critico | 1 referencia(s) | [Abrir](./get_assignable_role_aliases.md) |
| `get_community_advisor_assignments` | Moderado | 1 referencia(s) | [Abrir](./get_community_advisor_assignments.md) |
| `get_formation_path_stations` | Moderado | 2 referencia(s) | [Abrir](./get_formation_path_stations.md) |
| `get_forum_comments` | Moderado | 1 referencia(s) | [Abrir](./get_forum_comments.md) |
| `get_forum_topics` | Moderado | 1 referencia(s) | [Abrir](./get_forum_topics.md) |
| `get_moderation_queue` | Moderado | 1 referencia(s) | [Abrir](./get_moderation_queue.md) |
| `get_my_community_advisors` | Moderado | 1 referencia(s) | [Abrir](./get_my_community_advisors.md) |
| `get_my_community_members` | Moderado | 3 referencia(s) | [Abrir](./get_my_community_members.md) |
| `get_my_community_publications` | Moderado | 2 referencia(s) | [Abrir](./get_my_community_publications.md) |
| `get_my_mailbox_messages` | Moderado | 5 referencia(s) | [Abrir](./get_my_mailbox_messages.md) |
| `get_my_prayer_intentions` | Moderado | 1 referencia(s) | [Abrir](./get_my_prayer_intentions.md) |
| `get_my_prayer_removal_notices` | Moderado | 1 referencia(s) | [Abrir](./get_my_prayer_removal_notices.md) |
| `get_my_profile` | Critico | 10 referencia(s) | [Abrir](./get_my_profile.md) |
| `get_my_public_queries` | Moderado | 1 referencia(s) | [Abrir](./get_my_public_queries.md) |
| `get_my_requests` | Moderado | 4 referencia(s) | [Abrir](./get_my_requests.md) |
| `get_province_role_labels` | Critico | 1 referencia(s) | [Abrir](./get_province_role_labels.md) |
| `get_public_profile` | Critico | 4 referencia(s) | [Abrir](./get_public_profile.md) |
| `get_public_user_directory` | Critico | 1 referencia(s) | [Abrir](./get_public_user_directory.md) |
| `get_qr_activity_attendance` | Moderado | 1 referencia(s) | [Abrir](./get_qr_activity_attendance.md) |
| `get_qr_activity_list_shares` | Moderado | 1 referencia(s) | [Abrir](./get_qr_activity_list_shares.md) |
| `get_qr_activity_lists` | Moderado | 1 referencia(s) | [Abrir](./get_qr_activity_lists.md) |
| `get_qr_activity_members` | Moderado | 1 referencia(s) | [Abrir](./get_qr_activity_members.md) |
| `get_random_prayer_intention` | Moderado | 1 referencia(s) | [Abrir](./get_random_prayer_intention.md) |
| `get_secretariat_members` | Moderado | 1 referencia(s) | [Abrir](./get_secretariat_members.md) |
| `issue_profile_credential` | Critico | 2 referencia(s) | [Abrir](./issue_profile_credential.md) |
| `mark_message_as_read` | Moderado | 1 referencia(s) | [Abrir](./mark_message_as_read.md) |
| `mark_prayer_removal_notices_seen` | Moderado | 1 referencia(s) | [Abrir](./mark_prayer_removal_notices_seen.md) |
| `react_to_publication` | Moderado | 2 referencia(s) | [Abrir](./react_to_publication.md) |
| `record_prayer_for_intention` | Moderado | 1 referencia(s) | [Abrir](./record_prayer_for_intention.md) |
| `register_push_token` | Alto | 2 referencia(s) | [Abrir](./register_push_token.md) |
| `remove_community_advisor` | Alto | 1 referencia(s) | [Abrir](./remove_community_advisor.md) |
| `remove_qr_activity_member` | Alto | 1 referencia(s) | [Abrir](./remove_qr_activity_member.md) |
| `report_message` | Moderado | 1 referencia(s) | [Abrir](./report_message.md) |
| `report_publication` | Moderado | 1 referencia(s) | [Abrir](./report_publication.md) |
| `resolve_profile_honor_level` | Critico | 1 referencia(s) | [Abrir](./resolve_profile_honor_level.md) |
| `respond_community_contact_message` | Alto | 2 referencia(s) | [Abrir](./respond_community_contact_message.md) |
| `respond_public_query` | Alto | 1 referencia(s) | [Abrir](./respond_public_query.md) |
| `restore_message_for_me` | Alto | 1 referencia(s) | [Abrir](./restore_message_for_me.md) |
| `restore_user_messaging` | Critico | 1 referencia(s) | [Abrir](./restore_user_messaging.md) |
| `restrict_user_messaging` | Critico | 1 referencia(s) | [Abrir](./restrict_user_messaging.md) |
| `review_message_report` | Alto | 1 referencia(s) | [Abrir](./review_message_report.md) |
| `send_direct_message_with_moderation` | Alto | 1 referencia(s) | [Abrir](./send_direct_message_with_moderation.md) |
| `set_community_contact_message_status` | Alto | 1 referencia(s) | [Abrir](./set_community_contact_message_status.md) |
| `set_forum_topic_status` | Alto | 1 referencia(s) | [Abrir](./set_forum_topic_status.md) |
| `set_public_query_status` | Alto | 1 referencia(s) | [Abrir](./set_public_query_status.md) |
| `share_qr_activity_list` | Alto | 1 referencia(s) | [Abrir](./share_qr_activity_list.md) |
| `update_community_publication` | Alto | 2 referencia(s) | [Abrir](./update_community_publication.md) |
| `update_forum_topic` | Alto | 2 referencia(s) | [Abrir](./update_forum_topic.md) |
| `update_my_avatar` | Alto | 1 referencia(s) | [Abrir](./update_my_avatar.md) |
| `update_my_community_details` | Alto | 2 referencia(s) | [Abrir](./update_my_community_details.md) |
| `update_my_profile` | Critico | 7 referencia(s) | [Abrir](./update_my_profile.md) |
| `update_my_profile_details_v2` | Critico | 3 referencia(s) | [Abrir](./update_my_profile_details_v2.md) |
| `update_qr_activity_list` | Alto | 1 referencia(s) | [Abrir](./update_qr_activity_list.md) |
| `validate_profile_credential` | Critico | 1 referencia(s) | [Abrir](./validate_profile_credential.md) |
| `validate_qr_activity_attendance` | Alto | 1 referencia(s) | [Abrir](./validate_qr_activity_attendance.md) |
| `vote_community_poll` | Moderado | 1 referencia(s) | [Abrir](./vote_community_poll.md) |

## Edge Functions

| Funcion | Implementacion versionada | Uso frontend |
| --- | --- | --- |
| `admin-confirm-email` | [`index.ts`](../functions/admin-confirm-email/index.ts) | `src/lib/profiles.ts:1002` |
| `debug-push-notification` | [`index.ts`](../functions/debug-push-notification/index.ts) | `src/lib/profiles.ts:1354` |
| `fetch-daily-gospel` | [`index.ts`](../functions/fetch-daily-gospel/index.ts) | `src/lib/dailyGospel.ts:43` |
| `send-push-notifications` | [`index.ts`](../functions/send-push-notifications/index.ts) | `src/lib/profiles.ts:1243` |

## Regeneracion

```powershell
node scripts/generate-rpc-catalog.js
```

El generador toma las llamadas del frontend, el inventario documental y las definiciones SQL del repositorio. No consulta ni modifica Supabase.
