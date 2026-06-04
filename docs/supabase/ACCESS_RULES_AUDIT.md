# Auditoría de reglas de acceso Supabase

## 1. Objetivo

Este documento define el acceso esperado por tabla, rol y módulo para Palestra App.

No confirma las policies reales aplicadas en Supabase. Sirve como guía para revisar RLS, RPCs y Storage antes de producción.

## 2. Principio central

La seguridad real debe vivir en Supabase.

El frontend puede ocultar botones, tabs o acciones, pero eso no alcanza como control de seguridad. Toda lectura o escritura sensible debe validarse en:

- policies RLS,
- RPCs,
- funciones `security definer` bien controladas,
- Storage policies,
- Edge Functions si corresponde.

## 3. Roles operativos agrupados

Para auditar acceso se agrupan los roles así:

| Grupo | Roles incluidos |
|---|---|
| Visitante | sin sesión / invitado |
| Usuario común | palestrista, sedimentador |
| Dirigente comunitario | animador_comunidad, coordinador_comunidad |
| Dirigente provincial | vocal, asesor, coordinador_diocesano |
| Dirigente nacional | vocal_nacional, coordinador_nacional |
| Administrador técnico | administrador |

## 4. Reglas generales esperadas

### Visitante

Puede leer contenido público.

No debería poder:

- leer datos privados de perfiles,
- escribir noticias,
- subir materiales,
- ver panel dirigencial,
- ver mensajes internos,
- registrar tokens push asociados a otros usuarios,
- acceder a publicaciones privadas.

### Usuario común

Puede leer contenido habilitado para su rol, provincia o comunidad.

Puede editar solo su propio perfil dentro de campos permitidos.

No debería poder:

- aprobar usuarios,
- cambiar roles,
- editar comunidades,
- publicar contenido institucional,
- ver datos de otras provincias si no corresponde.

### Dirigente comunitario

Puede gestionar contenido y miembros de su propia comunidad, según permisos.

No debería poder:

- gestionar comunidades ajenas,
- cambiar roles provinciales o nacionales,
- editar configuración global.

### Dirigente provincial

Puede gestionar usuarios, comunidades y contenido dentro de su provincia según rol y permiso.

No debería poder:

- gestionar otras provincias,
- asignar roles nacionales sin permiso,
- modificar configuración técnica global.

### Dirigente nacional

Puede ver alcance nacional y gestionar según permisos nacionales.

Debe tener límites respecto a administrador técnico si la función es puramente de sistema.

### Administrador

Puede gestionar configuración técnica y global.

Aun así, las acciones críticas deben auditarse.

## 5. Acceso esperado por tabla

| Tabla | Visitante | Usuario común | Dirigente comunitario | Dirigente provincial | Dirigente nacional | Administrador |
|---|---|---|---|---|---|---|
| `profiles` | no leer listado | leer propio / datos públicos limitados | leer miembros de su comunidad | leer usuarios de su provincia | leer alcance nacional | leer y administrar |
| `provinces` | leer activas | leer activas | leer activas | gestionar su provincia si corresponde | leer/gestionar según rol | gestionar |
| `communities` | leer activas públicas | leer activas | gestionar propia si corresponde | gestionar provincia | gestionar alcance nacional | gestionar |
| `province_community_sections` | leer si afecta UI pública | leer | gestionar si corresponde | gestionar provincia | gestionar nacional | gestionar |
| `role_permissions` | no | no directo | no directo | no directo salvo permiso | gestionar si tiene permiso | gestionar |
| `app_tabs` | leer visibles públicas | leer visibles según rol | leer según rol | gestionar si tiene permiso | gestionar si tiene permiso | gestionar |
| `app_content` | leer público | leer según rol | editar si tiene permiso | editar si tiene permiso | editar si tiene permiso | editar |
| `app_runtime_config` | leer valores necesarios | leer valores necesarios | no editar | no editar salvo permiso | editar si corresponde | editar |
| `news` | leer públicas | leer según alcance | crear/editar comunidad si aplica | crear/editar provincia | crear/editar nacional | gestionar |
| `events` | leer públicos | leer según alcance | crear/editar comunidad si aplica | crear/editar provincia | crear/editar nacional | gestionar |
| `motivador_periods` | no o limitado | leer si rol suficiente | leer/gestionar según permiso | gestionar provincia | gestionar nacional | gestionar |
| `materials` | leer públicos | leer según permiso | gestionar comunidad si aplica | gestionar provincia si aplica | gestionar nacional | gestionar |
| `news_drafts` | no | no | propios si aplica | provincia si aplica | nacional si aplica | gestionar |
| `community_publications` | públicas si existen | leer según comunidad/provincia | crear/editar propia comunidad | moderar provincia | moderar nacional | gestionar |
| `publication_comments` | leer públicos si aplica | crear según permiso | moderar comunidad | moderar provincia | moderar nacional | gestionar |
| `community_contact_messages` | crear mensaje limitado | crear/leer propios si aplica | leer/responder comunidad propia | leer/responder provincia | leer según alcance | gestionar |
| `user_agenda_preferences` | no | leer/escribir propias | propias | propias | propias | administrar si necesario |
| `forum_categories` | leer públicas | leer | gestionar según permiso | gestionar según permiso | gestionar según permiso | gestionar |
| `daily_gospel` | leer | leer | no editar | editar si permiso | editar si permiso | editar |
| `app_library_items` | leer públicos | leer según rol | gestionar si permiso | gestionar si permiso | gestionar si permiso | gestionar |

## 6. Acceso esperado por Storage

| Bucket | Lectura esperada | Escritura esperada | Riesgo |
|---|---|---|---|
| `profile-photos` | pública o autenticada según política de privacidad | usuario sobre su propia foto / admin | exposición de fotos o subida indebida |
| `content-images` | pública si son imágenes de contenido publicado | administradores/con permisos | contenido roto o subida no autorizada |
| `community-images` | pública | dirigentes autorizados/admin | edición de identidad comunitaria |
| `library-images` | según visibilidad de biblioteca | admin/con permiso | recursos invisibles o expuestos |
| `materials` | según visibilidad/rol | admin/con permiso | exposición de material interno |

## 7. RPCs administrativas

Toda RPC administrativa debería validar dentro de la función:

1. Usuario autenticado.
2. Perfil existente.
3. Estado aprobado.
4. Rol o permiso suficiente.
5. Alcance territorial.
6. Que no edite un rol superior si no corresponde.
7. Que registre auditoría si cambia datos sensibles.

RPCs críticas:

- `admin_get_users`.
- `admin_update_user`.
- `admin_approve_profile`.
- `admin_create_basic_user`.
- `admin_confirm_user_email`.
- `admin_delete_user_by_email`.
- `admin_delete_user_completely`.
- `admin_repair_user_login`.
- `admin_update_community`.
- `admin_create_community`.
- `admin_update_config`.
- `admin_save_role_permissions`.

## 8. Funciones con `security definer`

Toda función `security definer` debería usar:

```sql
security definer
set search_path = public
```

Y validar rol internamente.

Riesgo si no se valida:

- el usuario puede ejecutar una función con privilegios elevados,
- una policy visual del frontend puede ser esquivada,
- una función puede quedar expuesta a roles no esperados.

## 9. Auditoría esperada

Acciones que deberían registrarse en `audit_logs` o equivalente:

- aprobar usuario,
- bloquear usuario,
- cambiar rol,
- cambiar provincia/comunidad,
- editar comunidad,
- archivar comunidad,
- editar noticia institucional,
- editar material,
- modificar permisos,
- modificar configuración global,
- reparar usuario,
- eliminar usuario,
- confirmar email manualmente.

## 10. Verificaciones pendientes en Supabase remoto

Pendiente revisar manualmente en Dashboard o SQL:

1. RLS habilitado en tablas sensibles.
2. Policies existentes por tabla.
3. Grants sobre RPCs.
4. Funciones `security definer` con `search_path` explícito.
5. Storage policies por bucket.
6. Acceso anónimo real a tablas públicas.
7. Acceso autenticado real a tablas privadas.
8. Restricciones por provincia/comunidad.
9. Restricciones por rol.
10. Auditoría de acciones administrativas.

## 11. Conclusión

El modelo de permisos de la app es potente, pero debe cerrarse desde Supabase.

Antes de producción amplia, la prioridad es verificar que cada acción visible en frontend tenga una regla equivalente en base de datos o RPC.
