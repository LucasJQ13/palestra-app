# Inventario de esquema Supabase

## 1. Objetivo

Este documento organiza el inventario del esquema Supabase usado por Palestra App.

Complementa `docs/SUPABASE_CONTRACT.md`, que ya lista tablas, buckets, RPCs y llamadas Auth utilizadas por el cliente.

La finalidad de este archivo es servir como mapa operativo para estabilizar la base de datos, reducir parches históricos y evitar que el frontend dependa de estructuras ambiguas.

## 2. Fuentes usadas

Este inventario se apoya en:

- `docs/SUPABASE_CONTRACT.md`.
- `docs/sql_database_audit.md`.
- Usos directos detectados en `src/lib/*` y `src/screens/*`.
- Documentación funcional existente en `README.md` y `docs/INFORME_PRESENTACION_APP.md`.

Este documento no confirma el estado real del dashboard remoto de Supabase. Todo lo indicado como estructura actual debe verificarse contra la base real antes de ejecutar migraciones.

## 3. Estado general detectado

Según la auditoría existente:

- La app usa Supabase para autenticación, perfiles, roles, permisos, comunidades, noticias, eventos, PM, materiales, contenido dinámico, biblioteca, foro, publicaciones comunitarias, notificaciones, QR y configuración remota.
- Existen múltiples parches SQL históricos.
- Existen RPCs redefinidas varias veces.
- `schema.sql` no debe asumirse como representación completa de la base actual.
- Hay al menos 115 RPCs usadas por el frontend.
- Hay al menos 20 tablas usadas directamente desde cliente.
- Hay buckets de Storage usados desde cliente.
- Hay Edge Functions relacionadas con push y evangelio diario.

## 4. Tablas usadas directamente desde el cliente

Estas tablas aparecen como usadas directamente desde el frontend o helpers de cliente.

| Tabla | Módulo principal | Uso esperado | Riesgo si cambia |
|---|---|---|---|
| `profiles` | autenticación, perfil, usuarios | Perfil extendido del usuario, rol, estado, provincia, comunidad | Crítico: rompe login, perfil y permisos |
| `provinces` | comunidades, administración | Provincias activas, región, logo, estado | Alto: rompe filtrado territorial |
| `communities` | comunidades, perfil, administración | Comunidades, ubicación, contacto, grupo, provincia | Alto: rompe comunidad y permisos locales |
| `province_community_sections` | comunidades | Visibilidad de subsecciones por provincia | Medio: rompe organización visual |
| `role_permissions` | permisos | Permisos dinámicos por rol | Crítico: puede bloquear accesos |
| `app_tabs` | navegación dinámica | Pestañas, orden, visibilidad, tipo de sección | Alto: puede romper navegación |
| `app_content` | contenido editable | Contenido publicado por pestaña | Alto: afecta páginas públicas/internas |
| `app_runtime_config` | configuración remota | Versión, mantenimiento, flags, noticias externas | Medio/alto: puede ocultar fallos por defaults |
| `news` | noticias | Noticias nacionales/provinciales | Medio: afecta Notilestra |
| `events` | agenda | Eventos y actividades | Medio: afecta agenda y recordatorios |
| `motivador_periods` | PM | PMs, fechas, información motivadora | Alto en módulo PM |
| `materials` | descargas | Materiales descargables internos/públicos | Alto: afecta biblioteca/materiales |
| `news_drafts` | administración noticias | Borradores de noticias | Medio |
| `church_document_buttons` | documentos/enlaces | Botones de documentos eclesiales | Bajo/medio |
| `community_publications` | comunidad | Avisos/publicaciones comunitarias | Alto en Mi Comunidad |
| `publication_comments` | comunidad/interacciones | Comentarios en publicaciones | Medio |
| `community_contact_messages` | contacto/comunidades | Mensajes enviados a comunidad | Alto si se usa como buzón |
| `user_agenda_preferences` | agenda | Favoritos/recordatorios por usuario | Medio |
| `forum_categories` | foro | Categorías del foro | Medio/futuro |
| `daily_gospel` | evangelio diario | Evangelio y reflexión | Bajo/medio |
| `app_library_items` | biblioteca | Biblioteca dinámica | Medio |

## 5. Buckets de Storage usados

| Bucket | Uso esperado | Riesgo |
|---|---|---|
| `profile-photos` | fotos de perfil | Alto: afecta avatar y perfil público |
| `content-images` | imágenes de contenido editable, intenciones, páginas | Medio/alto |
| `community-images` | imágenes o logos de comunidades/provincias | Medio |
| `library-images` | imágenes de biblioteca | Medio |
| `materials` | archivos/materiales descargables | Alto |

Pendiente de verificar en Supabase:

- Policies de lectura pública/privada.
- Policies de subida por rol.
- Tamaño máximo permitido.
- Tipos MIME permitidos.
- Estrategia de limpieza de archivos huérfanos.

## 6. RPCs críticas agrupadas por dominio

El detalle completo está en `docs/SUPABASE_CONTRACT.md`. Este inventario agrupa las más sensibles.

### 6.1 Autenticación y perfil

- `get_my_profile`
- `update_my_profile`
- `update_my_profile_details_v2`
- `update_my_avatar`
- `check_registration_email_available`
- `create_email_confirmation_request`

Riesgo: cualquier cambio de firma o retorno puede romper login, perfil o onboarding.

### 6.2 Administración de usuarios

- `admin_get_users`
- `admin_get_pending_profiles`
- `admin_approve_profile`
- `admin_update_user`
- `admin_create_basic_user`
- `admin_confirm_user_email`
- `admin_diagnose_user_login`
- `admin_repair_user_login`
- `admin_delete_user_by_email`
- `admin_delete_user_completely`
- `admin_force_release_user_email`

Riesgo: área con múltiples redefiniciones históricas. Requiere consolidación antes de producción.

### 6.3 Comunidades y provincias

- `admin_create_province`
- `admin_archive_province`
- `admin_set_province_status`
- `admin_update_province_logo`
- `admin_create_community`
- `admin_update_community`
- `admin_archive_community`
- `admin_set_community_status`
- `admin_set_province_community_section`
- `get_secretariat_members`
- `create_secretariat_message`

Riesgo: impacto directo en alcance territorial, comunidad de usuario y gestión provincial.

### 6.4 Noticias, agenda y PM

- `admin_create_news`
- `admin_update_news`
- `admin_archive_news`
- `admin_create_event`
- `admin_update_event`
- `admin_archive_event`
- `admin_get_motivador_periods`
- `admin_upsert_motivador_period`
- `admin_set_motivador_period_status`

Riesgo: afecta Notilestra, agenda y PM.

### 6.5 Contenido dinámico y navegación

- `get_admin_config`
- `admin_update_config`
- `admin_update_app_content`
- `admin_create_tab`
- `admin_update_tab`
- `admin_delete_tab`
- `admin_set_tab_position`
- `admin_restore_default_tabs`
- `admin_update_instagram`

Riesgo: puede romper navegación, páginas o identidad visual.

### 6.6 Materiales y biblioteca

- `admin_get_materials`
- `admin_upsert_material`
- `admin_archive_material`
- `admin_upsert_library_item`
- `admin_archive_library_item`
- `debug_my_library_permission`

Riesgo: afecta descargas, visibilidad por rol y biblioteca.

### 6.7 Comunidad, publicaciones y foro

- `create_community_publication`
- `update_community_publication`
- `archive_community_publication`
- `get_my_community_publications`
- `create_publication_comment`
- `react_to_publication`
- `report_publication`
- `get_forum_topics`
- `get_forum_comments`
- `create_forum_topic`
- `create_forum_comment`
- `archive_forum_topic`
- `archive_forum_comment`
- `set_forum_topic_status`

Riesgo: afecta publicaciones internas y moderación.

### 6.8 Notificaciones

- `register_push_token`
- `create_notification_intent`
- Edge Function `send-push-notifications`
- Edge Function `debug-push-notification`

Tablas relacionadas por SQL: `device_push_tokens`, `notification_intents`.

Riesgo: mostrar éxito falso si solo se crea intención pero no se confirma entrega.

### 6.9 QR y credenciales

- `issue_profile_credential`
- `validate_profile_credential`
- `create_qr_activity_list`
- `update_qr_activity_list`
- `archive_qr_activity_list`
- `get_qr_activity_lists`
- `get_qr_activity_members`
- `add_qr_activity_member`
- `add_qr_activity_members_by_scope`
- `remove_qr_activity_member`
- `share_qr_activity_list`
- `get_qr_activity_attendance`
- `validate_qr_activity_attendance`

Riesgo: afecta validación de identidad y asistencia.

## 7. Columnas esperadas por dominio

Esta sección define expectativas funcionales. Deben verificarse contra Supabase antes de migrar.

### 7.1 `profiles`

Campos esperados por la app:

- `user_id` o identificador vinculado a Auth.
- `email`.
- `email_confirmed_at`.
- `full_name`.
- `avatar_url`.
- `phone`.
- `province`.
- `community_name`.
- `status`.
- `role`.
- `subrole_key`.
- `display_role_label`.
- `gender_preference`.
- `nickname`.
- `use_nickname_in_greetings`.
- `credential_name_mode`.
- `perseverance_start_year`.
- `personal_pm_type`.
- `personal_pm_number`.
- `personal_pm_province`.
- `personal_pm_motto`.
- `pm_motto`.
- `deleted_at` o equivalente si existe baja lógica.

Recomendación futura: migrar relaciones por texto hacia `province_id` y `community_id`, conservando campos de texto como compatibilidad.

### 7.2 `provinces`

Campos esperados:

- `id`.
- `name`.
- `region`.
- `logo_url`.
- `is_active`.
- `archived_at`.

Recomendación futura:

- agregar/validar `slug` único sin acentos.
- usar `display_name` si se necesita nombre con acento.

### 7.3 `communities`

Campos esperados:

- `id`.
- `province_id`.
- `name`.
- `group_type`.
- `address`.
- `phone`.
- `meeting_day`.
- `meeting_time`.
- `description`.
- `image_url`.
- `latitude`.
- `longitude`.
- `is_active`.
- `archived_at`.

Recomendación futura:

- no usar `community_name` como clave de relación principal.
- usar siempre `community_id` para permisos y relaciones.

### 7.4 `news`, `events`, `motivador_periods`

Campos funcionales esperados:

- identificador.
- título.
- cuerpo/descripción.
- fecha o rango de fechas.
- provincia/comunidad o alcance.
- visibilidad.
- imagen opcional.
- estado activo/archivado.
- creador/editor si existe trazabilidad.

### 7.5 `materials` y biblioteca

Campos funcionales esperados:

- título.
- descripción.
- categoría.
- visibilidad.
- permiso requerido.
- URL o path de archivo.
- imagen opcional.
- orden.
- estado activo/archivado.

### 7.6 `app_tabs` y `app_content`

Campos funcionales esperados:

- key de pestaña.
- label visible.
- icono.
- tipo de sección.
- visibilidad.
- orden.
- roles visibles.
- título.
- cuerpo.
- bloques de contenido.

## 8. Puntos pendientes de verificación real

Antes de ejecutar cualquier migración:

1. Exportar esquema actual desde Supabase.
2. Confirmar columnas reales de cada tabla crítica.
3. Confirmar versión vigente de cada RPC crítica.
4. Confirmar policies RLS reales.
5. Confirmar buckets y storage policies.
6. Confirmar triggers existentes.
7. Confirmar si hay datos legacy que dependen de columnas antiguas.

## 9. Conclusión

La app ya tiene un contrato Supabase amplio y funcional, pero todavía necesita consolidación.

La prioridad no es crear tablas nuevas, sino:

1. saber exactamente qué existe,
2. decidir cuál será el esquema canónico,
3. versionar migraciones,
4. consolidar RPCs críticas,
5. auditar reglas de acceso,
6. eliminar fallbacks solo cuando la base esté alineada.
