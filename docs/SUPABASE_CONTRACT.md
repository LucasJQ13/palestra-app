# Contrato Supabase usado por la app

Fecha: 2026-06-03

Issue relacionada: GitHub #4 - Fase 2.

## Objetivo

Documentar el contrato actual entre Palestra APP y Supabase para saber que tablas, buckets, RPCs y llamadas de Auth no deben romperse al tocar base de datos, RLS o funciones.

Este documento es descriptivo. No modifica codigo ni configura Supabase.

## Alcance y advertencia

- Inventario generado desde usos directos en `src` y `scripts`.
- Se consideran llamadas `supabase.from(...)`, `supabase.rpc(...)`, `supabase.storage.from(...)` y `supabase.auth.*`.
- Las columnas exactas, policies RLS y permisos reales quedan como: `pendiente de verificar en Supabase`.
- Que una tabla/RPC aparezca definida en archivos SQL del repo no garantiza que esa sea la version final aplicada en la base remota.

## Configuracion externa del cliente

La configuracion de Supabase que usa el cliente se lee desde `Constants.expoConfig.extra` en `src/lib/supabase.ts`.

Valores esperados en `extra`:

| Clave | Uso en cliente | Obligatoria para Supabase | Observacion |
|---|---|---:|---|
| `supabaseUrl` | URL del proyecto Supabase usada por `createClient`. | si | Si falta, el cliente usa `https://example.supabase.co` como fallback tecnico para evitar crash de inicializacion, pero `hasSupabaseConfig` queda en `false`. |
| `supabaseAnonKey` | Clave anon/publicable usada por `createClient`. | si | Si falta, el cliente usa `missing-anon-key` como fallback tecnico; no permite operar contra Supabase real. |
| `eas.projectId` | Identificador de proyecto EAS/Expo. | no para Supabase | Se usa por Expo/EAS y notificaciones; no reemplaza configuracion de Supabase. |

El archivo `app.json` actualmente declara estos valores bajo `expo.extra`. Esta auditoria no modifica credenciales ni configuracion.

Comportamiento comprobado en `src/lib/supabase.ts`:

- `hasSupabaseConfig` es `true` solo cuando existen `supabaseUrl` y `supabaseAnonKey`.
- La sesion de Auth se persiste con `AsyncStorage`.
- `autoRefreshToken` y `persistSession` estan activos.
- `detectSessionInUrl` esta desactivado.
- `storageKey` es `palestra.supabase.auth`.

Reglas externas que deben verificarse fuera del repo:

- RLS por tabla en el Dashboard de Supabase.
- Grants/permiso de ejecucion de RPCs para `authenticated` y, cuando corresponda, `anon`.
- Policies de Storage para buckets usados por la app.
- Configuracion de Auth: confirmacion de email, redirect URLs y deep links `palestra://auth/callback`.
- Edge Functions publicadas y sus secrets/configuracion.
- Configuracion externa de Expo/EAS/Firebase para push notifications, incluyendo `google-services.json`.

Verificaciones pendientes fuera del repo:

1. Confirmar que `supabaseUrl` apunta al proyecto productivo correcto.
2. Confirmar que `supabaseAnonKey` corresponde al proyecto de `supabaseUrl` y no esta vencida/revocada.
3. Confirmar que las credenciales publicables usadas en `app.json` coinciden con el panel de Supabase.
4. Confirmar que la app instalada en Android recibe la misma configuracion `extra` que localhost/Expo.
5. Confirmar que las reglas de acceso reales estan validadas en Supabase y no dependen solo del frontend.
6. Confirmar que ningun cambio de entorno externo queda pendiente antes de publicar una build.

## Resumen

- Tablas usadas directamente desde cliente: 20.
- Buckets Storage usados directamente: 5.
- RPCs usadas directamente: 115.
- Llamadas Supabase Auth usadas: 6.
- RPCs usadas sin definicion detectada en SQL del repo: 0.
- Tablas usadas sin `create table` detectado en SQL del repo: 0.
- Buckets usados sin alta detectada en SQL del repo: 0.

## Tablas consultadas o modificadas desde cliente

| Tabla | Definida en SQL del repo | Archivos que la usan | RLS/permisos |
|---|---:|---|---|
| `app_content` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `app_library_items` | si | `src/lib/library.ts` | pendiente de verificar en Supabase |
| `app_runtime_config` | si | `src/lib/runtimeConfig.ts` | pendiente de verificar en Supabase |
| `app_tabs` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `church_document_buttons` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `communities` | si | `src/lib/remoteData.ts` | pendiente de verificar en Supabase |
| `community_contact_messages` | si | `src/screens/StaticScreens.tsx` | pendiente de verificar en Supabase |
| `community_publications` | si | `src/lib/remoteData.ts` | pendiente de verificar en Supabase |
| `daily_gospel` | si | `src/lib/dailyGospel.ts` | pendiente de verificar en Supabase |
| `events` | si | `src/lib/remoteData.ts` | pendiente de verificar en Supabase |
| `forum_categories` | si | `src/lib/forum.ts` | pendiente de verificar en Supabase |
| `motivador_periods` | si | `src/lib/remoteData.ts` | pendiente de verificar en Supabase |
| `news` | si | `src/lib/remoteData.ts` | pendiente de verificar en Supabase |
| `news_drafts` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `profiles` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `province_community_sections` | si | `src/lib/remoteData.ts` | pendiente de verificar en Supabase |
| `provinces` | si | `src/lib/remoteData.ts` | pendiente de verificar en Supabase |
| `publication_comments` | si | `src/lib/remoteData.ts` | pendiente de verificar en Supabase |
| `role_permissions` | si | `src/lib/permissions.ts` | pendiente de verificar en Supabase |
| `user_agenda_preferences` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |

## Buckets de Storage usados

| Bucket | Definido en SQL del repo | Archivos que lo usan | Policies/permisos |
|---|---:|---|---|
| `community-images` | si | `src/screens/ProfileScreen.tsx` | pendiente de verificar en Supabase |
| `content-images` | si | `src/components/EditableIntro.tsx`<br>`src/lib/uploads.ts`<br>`src/screens/IntentionsScreen.tsx` | pendiente de verificar en Supabase |
| `library-images` | si | `src/screens/LibrarySectionScreen.tsx` | pendiente de verificar en Supabase |
| `materials` | si | `src/screens/MaterialsScreen.tsx`<br>`src/screens/ProfileScreen.tsx` | pendiente de verificar en Supabase |
| `profile-photos` | si | `src/screens/ProfileScreen.tsx` | pendiente de verificar en Supabase |

## RPCs usadas desde cliente

| RPC | Definida en SQL del repo | Archivos que la usan | Permisos/RLS |
|---|---:|---|---|
| `accept_coordinator_request` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `add_qr_activity_member` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `add_qr_activity_members_by_scope` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_approve_profile` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_archive_community` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_archive_event` | si | `src/lib/remoteData.ts` | pendiente de verificar en Supabase |
| `admin_archive_library_item` | si | `src/lib/library.ts` | pendiente de verificar en Supabase |
| `admin_archive_material` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_archive_news` | si | `src/lib/remoteData.ts` | pendiente de verificar en Supabase |
| `admin_archive_prayer_intention` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_archive_province` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_confirm_user_email` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_create_basic_user` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_create_community` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_create_event` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_create_news` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_create_province` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_create_tab` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_delete_tab` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_delete_user_by_email` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_delete_user_completely` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_diagnose_user_login` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_force_release_user_email` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_get_materials` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_get_motivador_periods` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_get_pending_profiles` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_get_prayer_intentions` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_get_requests` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_get_role_permissions` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_get_users` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_repair_user_login` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_resolve_user_request` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_restore_default_tabs` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_save_province_role_label` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_save_role_alias` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_save_role_permissions` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_set_community_status` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_set_motivador_period_status` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_set_province_community_section` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_set_province_status` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_set_role_alias_status` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_set_tab_position` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_update_app_content` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_update_community` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_update_config` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_update_event` | si | `src/lib/remoteData.ts` | pendiente de verificar en Supabase |
| `admin_update_instagram` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_update_news` | si | `src/lib/remoteData.ts` | pendiente de verificar en Supabase |
| `admin_update_profile_details_v2` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_update_province_logo` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_update_tab` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_update_user` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_upsert_library_item` | si | `src/lib/library.ts` | pendiente de verificar en Supabase |
| `admin_upsert_material` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_upsert_motivador_period` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `admin_upsert_news_draft` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `archive_community_publication` | si | `src/lib/remoteData.ts` | pendiente de verificar en Supabase |
| `archive_forum_comment` | si | `src/lib/forum.ts` | pendiente de verificar en Supabase |
| `archive_forum_topic` | si | `src/lib/forum.ts` | pendiente de verificar en Supabase |
| `archive_qr_activity_list` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `check_registration_email_available` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `create_community_contact_message` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `create_community_publication` | si | `src/lib/remoteData.ts` | pendiente de verificar en Supabase |
| `create_email_confirmation_request` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `create_forum_comment` | si | `src/lib/forum.ts` | pendiente de verificar en Supabase |
| `create_forum_topic` | si | `src/lib/forum.ts` | pendiente de verificar en Supabase |
| `create_leadership_change_request` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `create_mailbox_message` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `create_notification_intent` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `create_prayer_intention` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `create_publication_comment` | si | `src/lib/remoteData.ts` | pendiente de verificar en Supabase |
| `create_qr_activity_list` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `create_secretariat_message` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `create_user_request` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `debug_my_library_permission` | si | `src/lib/library.ts` | pendiente de verificar en Supabase |
| `get_admin_config` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `get_assignable_role_aliases` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `get_forum_comments` | si | `src/lib/forum.ts` | pendiente de verificar en Supabase |
| `get_forum_topics` | si | `src/lib/forum.ts` | pendiente de verificar en Supabase |
| `get_my_community_members` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `get_my_community_publications` | si | `src/lib/remoteData.ts` | pendiente de verificar en Supabase |
| `get_my_mailbox_messages` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `get_my_prayer_intentions` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `get_my_prayer_removal_notices` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `get_my_profile` | si | `src/lib/authProfile.ts` | pendiente de verificar en Supabase |
| `get_my_requests` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `get_province_role_labels` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `get_public_profile` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `get_qr_activity_attendance` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `get_qr_activity_list_shares` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `get_qr_activity_lists` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `get_qr_activity_members` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `get_random_prayer_intention` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `get_secretariat_members` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `issue_profile_credential` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `mark_prayer_removal_notices_seen` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `react_to_publication` | si | `src/lib/remoteData.ts` | pendiente de verificar en Supabase |
| `record_prayer_for_intention` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `register_push_token` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `remove_qr_activity_member` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `report_publication` | si | `src/lib/remoteData.ts` | pendiente de verificar en Supabase |
| `resolve_profile_honor_level` | si | `src/lib/honorLevels.ts` | pendiente de verificar en Supabase |
| `respond_community_contact_message` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `set_community_contact_message_status` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `set_forum_topic_status` | si | `src/lib/forum.ts` | pendiente de verificar en Supabase |
| `share_qr_activity_list` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `update_community_publication` | si | `src/lib/remoteData.ts` | pendiente de verificar en Supabase |
| `update_forum_topic` | si | `src/lib/forum.ts` | pendiente de verificar en Supabase |
| `update_my_avatar` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `update_my_profile` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `update_my_profile_details_v2` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `update_qr_activity_list` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `validate_profile_credential` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `validate_qr_activity_attendance` | si | `src/lib/profiles.ts` | pendiente de verificar en Supabase |
| `vote_community_poll` | si | `src/lib/remoteData.ts` | pendiente de verificar en Supabase |

## Supabase Auth usado desde cliente

| Metodo Auth | Archivos que lo usan | Observacion |
|---|---|---|
| `getUser` | `src/screens/LibrarySectionScreen.tsx`<br>`src/screens/ProfileScreen.tsx` | pendiente de verificar en Supabase |
| `resetPasswordForEmail` | `src/screens/auth/AuthFlow.tsx` | pendiente de verificar en Supabase |
| `signInWithPassword` | `src/screens/auth/AuthFlow.tsx`<br>`src/screens/ProfileScreen.tsx` | pendiente de verificar en Supabase |
| `signOut` | `src/screens/auth/AuthFlow.tsx`<br>`src/screens/ProfileScreen.tsx` | pendiente de verificar en Supabase |
| `signUp` | `src/screens/auth/AuthFlow.tsx`<br>`src/screens/ProfileScreen.tsx` | pendiente de verificar en Supabase |
| `updateUser` | `src/screens/ProfileScreen.tsx` | pendiente de verificar en Supabase |

## Contratos sensibles por modulo

### Autenticacion y perfil

No romper:

- `get_my_profile`
- `profiles`
- `supabase.auth.signInWithPassword`
- `supabase.auth.signUp`
- `supabase.auth.signOut`
- `supabase.auth.resetPasswordForEmail`
- `supabase.auth.updateUser`

RLS/permisos: pendiente de verificar en Supabase.

### Usuarios y administracion

No romper:

- `admin_get_users`
- `admin_update_user`
- `admin_create_basic_user`
- `admin_confirm_user_email`
- `admin_diagnose_user_login`
- `admin_delete_user_by_email`
- `admin_delete_user_completely`
- `admin_force_release_user_email`
- `admin_repair_user_login`

Riesgo: estas RPCs tienen historial de redefiniciones en parches SQL. Ver `docs/sql_database_audit.md`.

### Comunidades

No romper:

- `provinces`
- `communities`
- `province_community_sections`
- `admin_create_community`
- `admin_update_community`
- `admin_set_community_status`
- `admin_archive_community`
- `admin_set_province_community_section`
- `get_secretariat_members`
- `create_secretariat_message`

RLS/permisos: pendiente de verificar en Supabase.

### Noticias, agenda y PM

No romper:

- `news`
- `events`
- `motivador_periods`
- `admin_create_news`
- `admin_update_news`
- `admin_archive_news`
- `admin_create_event`
- `admin_update_event`
- `admin_archive_event`
- `admin_get_motivador_periods`
- `admin_upsert_motivador_period`
- `admin_set_motivador_period_status`

RLS/permisos: pendiente de verificar en Supabase.

### Materiales y descargas

No romper:

- `materials` tabla
- `materials` bucket
- `church_document_buttons`
- `admin_get_materials`
- `admin_upsert_material`
- `admin_archive_material`

RLS/permisos: pendiente de verificar en Supabase.

### Contenido editable y navegacion

No romper:

- `app_content`
- `app_tabs`
- `admin_config` via RPC `get_admin_config` / `admin_update_config`
- `app_runtime_config`
- `admin_update_app_content`
- `admin_update_tab`
- `admin_create_tab`
- `admin_delete_tab`
- `admin_restore_default_tabs`

RLS/permisos: pendiente de verificar en Supabase.

### Foro, biblioteca e interacciones

No romper:

- `forum_categories`
- `app_library_items`
- `community_publications`
- `publication_comments`
- `get_forum_topics`
- `get_forum_comments`
- `create_forum_topic`
- `create_forum_comment`
- `create_community_publication`
- `update_community_publication`
- `archive_community_publication`
- `react_to_publication`
- `report_publication`

RLS/permisos: pendiente de verificar en Supabase.

### Notificaciones

No romper:

- `register_push_token`
- `create_notification_intent`
- Edge Function `send-push-notifications`
- Edge Function `debug-push-notification`

Tablas involucradas por SQL: `device_push_tokens` y `notification_intents`, aunque el cliente mayormente accede por RPC.

RLS/permisos: pendiente de verificar en Supabase.

### Evangelio diario

No romper:

- `daily_gospel`
- Edge Function `fetch-daily-gospel`

RLS/permisos: pendiente de verificar en Supabase.

## Pendientes de auditoria

1. Confirmar en Supabase remoto que todas las RPC listadas tienen la version esperada.
2. Consolidar RPCs con multiples redefiniciones historicas.
3. Auditar RLS real por tabla y no solo por archivos SQL.
4. Revisar buckets y policies Storage desde el Dashboard.
5. Generar `schema_current.sql` como snapshot limpio de la base actual.
6. Separar scripts historicos, scripts activos y scripts de emergencia.

## Regla para futuros cambios

Antes de modificar Supabase, revisar este documento y confirmar que ninguna tabla/RPC/bucket usado por la app se elimina, cambia de firma o cambia permisos sin actualizar tambien el cliente.
