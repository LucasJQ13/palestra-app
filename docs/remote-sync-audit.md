# Auditoria de sincronizacion remota y retrocompatibilidad

Fecha: 2026-05-23

Este diagnostico separa codigo de contenido operativo. Una APK vieja solo puede usar pantallas, logica y dependencias que ya trae compiladas, pero debe poder recibir contenido nuevo desde Supabase cuando el modulo ya existe y el esquema sigue siendo compatible.

## Que requiere nueva APK

- Herramientas nuevas, pantallas nuevas o rutas nuevas.
- Cambios de logica de negocio, jerarquia, permisos o navegacion estructural.
- Cambios nativos, nuevas dependencias, Storage/buckets usados por codigo nuevo.
- Cambios visuales profundos o nuevos componentes que una APK anterior no sabe renderizar.
- Nuevos tipos de datos que no tengan fallback en las pantallas existentes.

## Que no deberia requerir nueva APK

- Noticias, PM, eventos, agenda, avisos comunitarios, descargas, imagenes y comunidades.
- Textos de Home, contacto, contenido navegable y configuracion general.
- Modulos visibles cuando la APK ya conoce ese modulo.
- Permisos y etiquetas de roles si se mantienen las mismas claves internas.

## Fuentes remotas actuales

| Area | Fuente oficial actual | Consumo |
| --- | --- | --- |
| PM | `motivador_periods` | `fetchMotivadorPeriods`, `fetchAdminMotivadorPeriods`, `admin_upsert_motivador_period` |
| Noticias | `news`, `news_drafts` | `fetchNews`, `admin_create_news`, `admin_update_news`, `admin_archive_news`, `admin_upsert_news_draft` |
| Home | `app_admin_config.home`, `app_content`, `news`, `community_publications` | Home usa config remota, contenido editable y feed remoto con fallback local |
| Agenda/eventos | `events`, `motivador_periods`, preferencias en `user_agenda_preferences` | Notilestra y agenda leen eventos/PM; hay fallback local de `src/data/content.ts` |
| Descargas | `materials` + Storage `materials` | `fetchAppMaterials`, `admin_upsert_material`; ahora documentos visibles pueden descargarse si tienen `file_url` o `file_path` |
| Comunidades | `communities`, `provinces` + Storage `community-images` | `fetchCommunities`, `admin_create_community`, `admin_update_community` |
| Avisos | `community_publications`, `publication_comments` | RPC `get_my_community_publications` y acciones de comentarios/reacciones/encuestas |
| Contacto | `app_admin_config.contact`, mensajes por RPC | `admin_update_config`, `create_community_contact_message`, mailbox RPC |
| Navegacion | `app_tabs` | `fetchAppTabs`, `admin_create_tab`, `admin_update_tab`, posiciones y restauracion |
| Permisos | `permissions`, `role_permissions` | `getDynamicPermissionsForRole`, `admin_get_role_permissions`, `admin_save_role_permissions` |
| Roles visibles | alias/etiquetas por RPC | `get_assignable_role_aliases`, `admin_save_role_alias`, `get_province_role_labels` |
| Contenido editable | `app_content` + Storage `content-images` | `fetchAppContent`, `admin_update_app_content` |
| Biblioteca/links | `app_library_items` + Storage `library-images` | `src/lib/library.ts` |
| Foro | `forum_categories`, topics/comments por RPC | `src/lib/forum.ts` |
| Perfil/usuarios | perfiles por RPC | `get_my_profile`, `admin_get_users`, `get_public_profile`, `update_my_profile` |

## Datos locales o hardcodeados

- `src/data/content.ts` mantiene fallback de noticias, eventos, comunidades, materiales, historia, textos institucionales y herramientas base.
- La estructura de tabs conocidas, iconos, componentes, permisos esperados y navegacion interna vive en la APK.
- El modo "Ver como" es simulacion local para revisar UI; no cambia permisos reales.
- Estados de filtros, modales, borradores, secciones expandidas y busquedas viven en memoria.
- Preferencias locales: tema, puntero tactil, device id de push y favoritos/recordatorios de Notilestra se guardan en `AsyncStorage`.
- La sesion Supabase tambien usa `AsyncStorage` mediante el cliente de Supabase.

## Herramientas con persistencia real

- Configuracion general/Home/Contacto: `admin_update_config`.
- Navegacion: `admin_create_tab`, `admin_update_tab`, `admin_set_tab_position`, `admin_delete_tab`, `admin_restore_default_tabs`.
- Contenido editable: `admin_update_app_content`.
- Noticias y borradores: RPC de news y `admin_upsert_news_draft`.
- PM: `admin_upsert_motivador_period`.
- Eventos: `admin_create_event`, `admin_update_event`, `admin_archive_event`.
- Materiales: Storage `materials` + `admin_upsert_material`.
- Comunidades: Storage `community-images` + RPC de comunidad.
- Permisos: `admin_save_role_permissions`.
- Alias/etiquetas de rangos: RPC de role aliases y province role labels.
- Usuarios, solicitudes, mailbox y push: RPC dedicadas.

## Herramientas o partes que eran solo UI/local

- El selector conceptual de tipos de navegacion no tiene renderizadores separados por tipo; actualmente la navegacion funcional es tab + contenido editable generico. Si se quieren "Biblioteca", "Links", "Formulario" o "Modulo interno", hay que agregar esquema y renderer reales.
- Los toggles de modulos visibles impactaban el guardado remoto, pero Home no aplicaba todos los modulos en runtime. Se corrigio para filtrar tiles, resumen, agenda y noticias segun `adminConfig.home.visibleModules`.
- Estados de revision como filtros, previews y mensajes de formulario no son persistencia.

## Pull-to-refresh

El refresh custom con logo fue retirado del flujo funcional. El root vuelve a usar `RefreshControl` nativo.

Al arrastrar, `refreshAppContent` ejecuta:

- `reloadTabSettings()` -> `app_tabs`.
- `reloadAppContent()` -> `app_content`.
- `reloadAdminConfig()` -> config remota.
- `hydrateRealSession()` -> perfil/permisos reales.
- Incrementa `contentVersion` para que las pantallas con `refreshKey` vuelvan a consultar.

Pantallas que refrescan con esa clave:

- Home: noticias y avisos comunitarios.
- Notilestra/PM: eventos y periodos motivadores.
- Materiales/descargas.
- Comunidades.
- Perfil/paneles que ya tienen efectos dependientes de refresh o botones propios.

No hay realtime activo encontrado (`channel`/`postgres_changes` no se usa). Por eso el refresh y los efectos de pantalla son el mecanismo principal de sincronizacion.

## Compatibilidad entre APKs

Una APK anterior vera contenido nuevo si:

- La tabla/RPC ya existe en esa APK.
- Los campos requeridos por esa APK siguen presentes.
- Las claves de rol, permisos y tabs no cambian semanticamente.
- Los nuevos campos son aditivos y opcionales.
- El contenido nuevo usa tipos que la APK vieja sabe renderizar.

Rompe retrocompatibilidad:

- Renombrar o borrar columnas/RPC/tab keys usados por APKs instaladas.
- Cambiar firmas de RPC sin mantener wrapper compatible.
- Cambiar claves internas de roles/permisos sin fallback.
- Crear un tipo de contenido que la APK vieja no sabe pintar.
- Mover datos a otra tabla sin mantener lectura antigua.
- Hacer privado un bucket sin cambiar el cliente a URLs firmadas.

## Propuesta de configuracion remota

Implementar de forma aditiva, sin reemplazar lo actual de golpe.

### `app_runtime_config`

Campos sugeridos:

- `id uuid primary key`
- `environment text default 'production'`
- `min_supported_version text`
- `recommended_version text`
- `update_message text`
- `maintenance_mode boolean default false`
- `maintenance_message text`
- `active_modules jsonb default '{}'`
- `feature_flags jsonb default '{}'`
- `settings jsonb default '{}'`
- `last_sync_at timestamptz`
- `updated_by uuid`
- `updated_at timestamptz default now()`

Uso:

- Cargar al iniciar la app despues de hidratar sesion.
- Guardar ultima config valida en `AsyncStorage`.
- Refrescar tambien con pull-to-refresh.
- Si falla red: usar cache local; si no hay cache, usar defaults compilados.

### `app_content_versions`

Campos:

- `domain text primary key` (`home`, `news`, `pm`, `materials`, etc.)
- `version integer`
- `content_hash text`
- `min_app_version text`
- `backwards_compatible boolean default true`
- `published_at timestamptz`
- `changed_by uuid`

Uso:

- Saber que dominios cambiaron sin bajar todo.
- Mostrar aviso si un dominio necesita APK nueva.

### `feature_flags`

Campos:

- `key text primary key`
- `enabled boolean`
- `roles text[]`
- `provinces text[]`
- `min_app_version text`
- `max_app_version text`
- `payload jsonb`
- `updated_at timestamptz`

Uso:

- Activar modulos gradualmente sin recompilar cuando el codigo ya existe.

### `remote_config`

Tabla simple `namespace`, `key`, `value_json`, `public`, `updated_at` para valores de configuracion no criticos.

### `sync_logs`

Campos: `user_id`, `device_id`, `app_version`, `domain`, `status`, `error_message`, `started_at`, `ended_at`.

Uso:

- Diagnosticar APKs viejas, errores de sync y versiones fuera de soporte.

## Regla operativa recomendada

1. Todo cambio de contenido debe ser aditivo y publicarse en la tabla actual correspondiente.
2. Toda migracion debe mantener RPC/columnas viejas mientras haya APKs instaladas que las usen.
3. Si se agrega una herramienta nueva, agregar feature flag pero asumir que requiere APK.
4. Si se agrega un campo nuevo, hacerlo nullable y con fallback en cliente.
5. El pull-to-refresh debe refrescar runtime config, contenido, permisos y perfil.
