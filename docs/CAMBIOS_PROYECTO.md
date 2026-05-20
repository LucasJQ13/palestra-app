# Cambios del proyecto Palestra

Este documento resume decisiones y cambios relevantes para continuar el proyecto desde cualquier PC sin depender de memoria de conversacion.

## 2026-05-19

### Push remoto Android

- La app sigue usando Supabase como backend principal.
- Para APK standalone Android, Expo Push necesita FCM como canal nativo de entrega.
- Se agrego `google-services.json` al proyecto para inicializar Firebase/FCM en Android.
- Se cargo en EAS la credencial FCM V1 para `org.palestra.argentina`.
- Queda pendiente generar una APK nueva cuando haya cupo de EAS o usando build local con Android Studio.
- El error crudo de Firebase/FCM ya no deberia mostrarse a usuarios comunes; queda como detalle tecnico en debug admin.

### GitHub

- Todo quedo subido a `main`.
- Ultimo commit antes de navegación dedicada: `77923ce chore: add android firebase config`.

### Navegacion

- Se inicio una mejora para que la herramienta `Navegacion` del panel administrador funcione como pantalla dedicada.
- Criterio: no duplicar rutas, no romper `app_tabs`, mantener persistencia Supabase y restringir uso a Administrador.

## 2026-05-20

### Version Beta

- La etiqueta visual de la app paso a `BETA 0.1.0`.
- La version visible queda centralizada en `App.tsx` con `appStageLabel`, `appBetaVersion` y `appVersionLabel`.
- Los scripts de build APK ahora usan el perfil `beta-apk`.
- Los accesos de prueba quedan nombrados como internos/de prueba, no como maqueta publica.

### Modal Comunidades

- Se reemplazo el wrapper tactil del panel por un `View` para que el `ScrollView` interno reciba gestos de un dedo sin conflicto.
- El backdrop del modal queda separado con `Pressable`, evitando que capture el scroll del contenido.
- Se reforzo el scroll con `keyboardShouldPersistTaps`, `keyboardDismissMode`, `nestedScrollEnabled` y altura controlada.

### Usuarios y jerarquia

- La herramienta `Usuarios` queda habilitada para Asesor, Vocal Diocesano, Coordinador Diocesano, Vocal Nacional, Coordinador Nacional y Administrador.
- Se agrego `supabase/patch_beta_user_role_management.sql` para actualizar RPC de usuarios con alcance por provincia/nacion y reglas de jerarquia.
- El buscador de usuarios se simplifico a busqueda por nombre.
- Confirmar emails, crear usuarios basicos y eliminar/liberar mails siguen reservados al Administrador.

### Solicitudes de coordinacion

- Se agrego `supabase/patch_beta_coordinator_acceptance.sql` para reemplazo por solicitud/aceptacion de Coordinador Diocesano y Coordinador Nacional.
- La app reconoce las solicitudes `Solicitud de Coordinacion Diocesana` y `Solicitud de Coordinacion Nacional` en el perfil del usuario elegido.
- Al aceptar, el coordinador anterior baja automaticamente a Sedimentador y queda registro en `audit_logs`.

### Permisos administrables

- Se agrego modulo admin `Permisos` para que Administrador seleccione un rango, vea permisos y active/desactive opciones.
- Se agrego `supabase/patch_beta_role_permissions_admin.sql` con RPC `admin_get_role_permissions` y `admin_save_role_permissions`.
- Esta etapa deja persistencia y arquitectura base; las pantallas existentes aun conservan parte de la logica local mientras se migra progresivamente a permisos remotos.

### APK con GitHub Actions

- Se agrego workflow alternativo `.github/workflows/android-apk.yml` para compilar APK debug sin EAS Cloud.
- Documentacion: `docs/github_actions_apk.md`.
- El flujo EAS sigue disponible con `npm run build:apk`.

### Confirmaciones de guardado

- Se agrego un toast reutilizable de exito con el texto `Cambios guardados`.
- El toast se muestra solo cuando las acciones devuelven el mensaje interno `Cambio realizado...`, es decir, despues de una respuesta de guardado correcta.
- Los errores se siguen mostrando aparte para evitar exitos falsos.

### Usuarios para rangos superiores

- La herramienta `Usuarios` conserva acciones tecnicas solo para Administrador: crear usuarios, confirmar mails, diagnosticar login, reparar, eliminar y liberar correo.
- Asesor, Vocal Diocesano, Coordinador Diocesano, Vocal Nacional y Coordinador Nacional ven una edicion reducida enfocada en datos de perfil, provincia, comunidad, estado y rol permitido.
- Los rangos nacionales ahora pueden asignar rangos inferiores a su propio rango desde la app, manteniendo Administrador protegido.

### Etiquetas visibles de rangos

- Se agrego `supabase/patch_beta_province_role_labels.sql` con la tabla `province_role_labels` y RPC para leer/guardar etiquetas visibles por provincia.
- Se agrego la herramienta admin `Etiquetas` para elegir provincia, rango interno y nombre visible.
- La personalizacion solo cambia visualizacion; los permisos siguen usando el `role_key` interno.
- Documentacion tecnica: `docs/roles_architecture.md`.

### Limpieza visual de Beta

- Se cambio el titulo del panel de administracion a `Panel Dirigencial`.
- Se quito el aviso de Home que indicaba que el usuario ya estaba aprobado.
- Se corrigieron textos visibles con tildes y `ñ` en login, perfil, panel dirigencial y contenido base.
- Se retiro la leyenda visual de potestad absoluta del rol Administrador.

### Ver como

- Se quitaron los accesos de prueba del login publico.
- Se agrego `Ver como` dentro del `Panel Dirigencial` solo para Administrador.
- La simulacion no persiste, no modifica Supabase y muestra una barra para volver al Administrador real.

### Privacidad de mails y credenciales

- Los listados comunes dejan de usar emails como dato visible principal.
- En `Usuarios`, el email queda visible solo para Administrador dentro de gestion tecnica.
- La credencial digital usa etiquetas visibles de rango por provincia mediante `roleLabelForProvince`.

### Solicitudes de perfil

- `Solicitudes` ahora se abre como boton dentro del perfil.
- `Solicitud de Perseverancia` solo aparece para rangos inferiores a Sedimentador.
- `Solicitud Especial` queda disponible para contactar dirigencia diocesana.
- El envio espera confirmacion real de Supabase antes de mostrar exito.

### Contenido Publicado

- Se agrego la herramienta `Contenido` al Panel Dirigencial.
- Muestra paginas editables de Supabase y contenido base/fallback local.
- El Administrador puede ocultar o restaurar contenido fallback; la decision se guarda en `admin_config.settings.hiddenFallbackContent`.
- Home, Noticias/Agenda y calendario respetan esa lista para evitar que contenido demo aparezca como real.

## Recomendacion operativa

- Antes de trabajar desde otra PC: `git pull --ff-only`.
- Despues de cambios importantes: `npm run typecheck`, commit y push.
- No subir claves privadas como `firebase-adminsdk-*.json`.
