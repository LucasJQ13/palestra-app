# Auditoria de fallbacks Supabase

## 1. Objetivo y alcance

Este documento identifica los parches de compatibilidad que el frontend usa para
seguir funcionando ante diferencias entre el contrato esperado y el esquema real
de Supabase.

La auditoria cubre:

- consultas que se reintentan con menos columnas;
- RPC o Edge Functions que se reemplazan por otra operacion;
- errores que se convierten silenciosamente en `[]`, `null` o configuracion local;
- contenido local que sustituye contenido remoto;
- valores por defecto que pueden ocultar datos faltantes.

Esta issue es exclusivamente documental. No elimina fallbacks, no modifica SQL,
no cambia RLS y no altera el comportamiento de la aplicacion.

## 2. Criterio de clasificacion

La prioridad indica el riesgo de retirar hoy el fallback:

- **Seguro**: es resiliencia intencional o un default de presentacion. No necesita
  eliminarse; como maximo requiere telemetria.
- **Moderado**: puede retirarse despues de verificar columnas, datos y pruebas del
  flujo afectado.
- **Riesgoso**: protege autenticacion, autorizacion, territorio, administracion o
  configuracion critica. No debe retirarse sin consolidar primero el contrato.

Tambien se distingue el tipo de fallback:

- **Compatibilidad temporal**: soporta dos versiones del esquema o de una RPC.
- **Degradacion silenciosa**: oculta un error devolviendo una respuesta vacia o
  local.
- **Resiliencia intencional**: mantiene operativa una integracion opcional.
- **Default permanente**: completa campos anulables para presentar la UI.

## 3. Inventario de fallbacks de compatibilidad

| ID | Riesgo | Archivo / funcion | Tabla, RPC o servicio | Comportamiento actual | Causa probable | Contrato esperado | Accion recomendada |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FB-01 | Riesgoso | `src/lib/remoteData.ts` / `fetchCommunities` | `provinces` | Si falla la seleccion completa, reintenta solo `id, name, region`; si vuelve a fallar usa `[]`. | Base sin `logo_url`, `is_active` o `archived_at`, o cache de esquema desactualizada. | `provinces` expone todas las columnas canonicas y RLS permite la lectura publica necesaria. | Verificar la migracion de provincias y retirar primero el segundo select, nunca junto con otros fallbacks territoriales. |
| FB-02 | Riesgoso | `src/lib/remoteData.ts` / `fetchCommunities` | `communities` + relacion `provinces` | Ante error reintenta sin coordenadas y sin metadatos nuevos de provincia. | Columnas territoriales agregadas por parches sucesivos. | `communities` contiene `latitude`, `longitude`, estado, imagen, grupo y relacion estable por `province_id`. | Alinear tabla, FK y policies; probar registro, perfil, geolocalizacion y panel diocesano antes de retirarlo. |
| FB-03 | Moderado | `src/lib/remoteData.ts` / `fetchCommunities` | `province_community_sections` | Si la consulta falla, aplica `defaultCommunitySectionVisibility`. | Tabla o filas de configuracion territorial ausentes. | Una fila valida por provincia o una regla explicita de ausencia. | Distinguir "sin configuracion" de "consulta fallida" y registrar el error antes de retirar el default remoto. |
| FB-04 | Moderado | `src/lib/remoteData.ts` / `fetchNews` | `news.image_url` | Reintenta el listado de noticias sin `image_url` cuando la columna no existe. | Despliegue parcial de la columna de imagen. | `news.image_url` existe y puede ser `null`. | Verificar columna y datos en todos los entornos; retirar este retry de forma aislada. |
| FB-05 | Moderado | `src/lib/remoteData.ts` / `updateNewsEntry` | RPC `admin_update_news` | Si la firma no acepta `p_image_url`, repite la RPC sin ese argumento. | Coexisten versiones historicas de la RPC. | Una unica firma canonica con `p_image_url`. | Consolidar y versionar la RPC; comprobar edicion con y sin imagen antes de retirar el retry. |
| FB-06 | Moderado | `src/lib/profiles.ts` / `createNews` | RPC `admin_create_news` | Si la firma no acepta `p_image_url`, repite la RPC sin ese argumento. | Coexisten versiones historicas de la RPC. | Una unica firma canonica con `p_image_url`. | Mismo criterio que FB-05, con prueba de alta y posterior lectura. |
| FB-07 | Riesgoso | `src/lib/remoteData.ts` / `fetchCommunityPublications` | RPC `get_my_community_publications` -> tabla `community_publications` | Si la RPC falla, lee directamente la tabla y reproduce filtros de rol, provincia y comunidad en el cliente. | RPC ausente, firma inestable o permisos incompletos. | La RPC es la fuente unica y aplica alcance territorial en backend/RLS. | Consolidar RPC y tests de autorizacion por rol. No retirar hasta demostrar que ningun usuario obtiene publicaciones fuera de alcance. |
| FB-08 | Riesgoso | `src/lib/remoteData.ts` / `fetchCommunityPublications` | `community_publications` | La lectura directa se reintenta sin subtitulo, formato, imagen y enlace cuando faltan columnas. | Tabla anterior al constructor de contenido enriquecido. | Todas las columnas canonicas existen y son anulables cuando corresponde. | Migrar columnas y datos; retirar despues de FB-07 o junto a una version cerrada del contrato de publicaciones. |
| FB-09 | Moderado | `src/lib/profiles.ts` / `fetchAppTabs` | `app_tabs` | Si falla el select con `icon_name` y `section_type`, repite una consulta legacy. | Pestañas creadas antes de la configuracion visual/dinamica. | `icon_name` y `section_type` existen con defaults validos. | Completar migracion y probar navegacion/restauracion de pestañas antes de retirar. |
| FB-10 | Riesgoso | `src/lib/profiles.ts` / `fetchAppMaterials` | RPC `admin_get_materials` -> tabla `materials` | Para admin, si la RPC falla o no devuelve datos, lee la tabla directamente. | RPC administrativa no desplegada o policies inconsistentes. | La RPC administrativa es estable y distingue correctamente lista vacia de error. | Mantener una sola ruta autorizada; validar materiales ocultos, archivados y alcance provincial antes de retirar. |
| FB-11 | Riesgoso | `src/lib/profiles.ts` / `updateCommunity` | RPC `admin_update_community` | Si la firma rechaza `p_group_type`, reintenta sin guardar ese campo. | Version antigua de la RPC. | Firma canonica con `p_group_type` y validacion del valor. | Consolidar RPC y evitar guardados parciales; probar comunidad joven/adulta y edicion territorial. |
| FB-12 | Moderado | `src/lib/profiles.ts` / `createProvince` | RPC `admin_create_province` | Si la firma rechaza `p_logo_url`, crea la provincia sin logo. | Version antigua de la RPC. | Firma canonica con logo anulable. | Verificar alta, Storage y edicion posterior del logo; luego retirar el retry. |
| FB-13 | Riesgoso | `src/lib/profiles.ts` / `updateAdminUser` | `profiles.subrole_key` | Actualiza el subrango directamente y tolera errores de columna faltante, por lo que el resto del perfil puede quedar guardado sin subrango. | `subrole_key` fue agregado despues de la RPC principal. | La actualizacion administrativa guarda rol y subrango atomica y autorizadamente. | Mover el campo a una RPC canonica/transaccion y eliminar la tolerancia solo despues de verificar todos los subrangos. |
| FB-14 | Riesgoso | `src/lib/profiles.ts` / `confirmAdminUserEmail` | Edge Function `admin-confirm-email` -> RPC `admin_confirm_user_email` | Si la funcion Edge devuelve error, intenta una RPC alternativa. | Dos implementaciones historicas para confirmar correo. | Un unico servicio administrativo auditado, con la misma autorizacion en todos los entornos. | Elegir una ruta canonica y comparar efectos sobre `auth.users`, perfil y auditoria antes de retirar la otra. |
| FB-15 | Riesgoso | `src/lib/profiles.ts` / `deleteAdminUserByEmail` | RPC `admin_force_release_user_email` -> `admin_delete_user_by_email` | Si falla la liberacion forzada, ejecuta una RPC de eliminacion alternativa. | Evolucion del diagnostico/liberacion de login. | Una unica operacion con semantica, autorizacion y auditoria inequívocas. | No retirar ni combinar sin probar usuarios existentes, huérfanos y correos reutilizables. El fallback puede cambiar el alcance destructivo. |
| FB-16 | Riesgoso | `src/lib/permissions.ts` / `getDynamicPermissionsForRole` | `role_permissions` -> `rolePermissions` local | Si la consulta falla usa permisos compilados en la app; si responde una lista vacia, devuelve cero permisos. | Fuente de verdad de permisos no definida completamente. | Backend y frontend comparten una politica explicita: reemplazo total o complemento controlado. | Resolver primero la semantica, completar todos los roles y probar RLS. La UI nunca debe ser la barrera de seguridad. |
| FB-17 | Riesgoso | `src/lib/runtimeConfig.ts` / `fetchAppRuntimeConfig` | `app_runtime_config` -> `defaultRuntimeConfig` | Error o fila ausente activa defaults locales, incluido `maintenanceMode: false`. | Configuracion remota no inicializada o inaccesible. | Fila `default` obligatoria, observable y validada. | Separar "sin fila" de "error"; conservar defaults de arranque, pero definir una politica segura para mantenimiento y flags criticos. |
| FB-18 | Moderado | `src/screens/profile/DownloadsAdminPanel.tsx` / `DownloadsAdminPanel` | `materials` -> contenido local | Si `adminMaterials` esta vacio, muestra `fallbackMaterials`, aunque la lista remota vacia sea legitima. | No se conserva estado de carga/error junto con los datos. | La UI distingue `loading`, `error`, lista vacia y contenido local. | Introducir estado explicito antes de retirar o etiquetar el contenido local. No asumir que `length === 0` significa fallo. |
| FB-19 | Moderado | `src/screens/HomeScreen.tsx`, `NotilestraScreen.tsx`, `StaticScreens.tsx` | `app_content`, `news`, contenido local | Home, agenda, historia y contacto pueden mostrar contenido compilado cuando el remoto no existe; el admin puede ocultar parte mediante `hiddenFallbackContent`. | Migracion gradual desde contenido estatico. | Cada seccion define si el contenido local es plantilla, respaldo o contenido definitivo. | Migrar seccion por seccion. Retirar solo cuando exista contenido remoto publicado y una prueba de pantalla vacia. |
| FB-20 | Moderado | `src/screens/StaticScreens.tsx` / formulario de contacto | Insert directo en `community_contact_messages` | El formulario publico inserta un contrato reducido, mientras otros flujos usan RPCs y campos territoriales. | Ruta legacy anterior al buzon y al alcance por comunidad. | Una RPC publica canonica valida destino y completa `community_id`/metadatos necesarios. | Migrar a una unica operacion antes de endurecer constraints o RLS. |

## 4. Degradaciones silenciosas que requieren diagnostico

Estos casos no siempre contienen una consulta alternativa, pero convierten un
fallo real en una pantalla vacia. No deben eliminarse sin reemplazarlos por un
estado de error visible y registrable.

| ID | Riesgo | Archivo / funciones principales | Contrato afectado | Resultado silencioso | Accion recomendada |
| --- | --- | --- | --- | --- | --- |
| FB-21 | Riesgoso | `src/lib/remoteData.ts` / `fetchCommunities`, `fetchNews`, `fetchCommunityPublications` | Territorio y contenido | `[]` despues del ultimo error. | Retornar estado estructurado `{ data, error, source }` y mostrar diagnostico administrativo. |
| FB-22 | Moderado | `src/lib/profiles.ts` / multiples loaders, entre ellos agenda, solicitudes, materiales y contenido | Varias tablas/RPC administrativas | `[]` o `null` en `catch`. | Priorizar flujos administrativos y distinguir sin datos, sin permiso y error de red/esquema. |
| FB-23 | Moderado | `src/lib/forum.ts`, `src/lib/library.ts`, `src/lib/community/advisors.ts`, `src/lib/honorLevels.ts`, `src/lib/queries/publicQueries.ts` | Modulos internos y publicos | Listas vacias ante error. | Estandarizar un resultado de consulta y telemetria; conservar UI estable. |
| FB-24 | Moderado | `src/lib/authProfile.ts` / `getMyProfileSession` | RPC `get_my_profile` | Los campos anulables se completan con textos locales; el error de RPC si se propaga. | Mantener defaults visuales, pero auditar perfiles incompletos y no usarlos para decisiones de autorizacion. |

## 5. Fallbacks intencionales que no deben tratarse como deuda de esquema

| ID | Riesgo | Archivo / funcion | Motivo para conservar |
| --- | --- | --- | --- |
| FB-25 | Seguro | `src/lib/appConfig.ts` / `normalizeAdminConfig` | El merge profundo permite agregar claves de configuracion sin romper instalaciones anteriores. Es un default permanente, no una segunda version de Supabase. |
| FB-26 | Seguro | `src/lib/externalNews.ts` / `fetchExternalCatholicNews` | Las fuentes RSS/HTML son externas y opcionales; una fuente caida no debe romper Home. Conviene agregar observabilidad, no hacerla obligatoria. |
| FB-27 | Seguro | `src/lib/dailyGospel.ts` / `fetchDailyGospel` | El cache de `daily_gospel` seguido de la Edge Function es una estrategia valida de cache/refresco, no una consulta de esquema reducido. Debe conservar propagacion clara de errores. |
| FB-28 | Seguro | `src/lib/supabase.ts` / inicializacion del cliente | La URL y clave ficticias evitan una excepcion al importar cuando falta configuracion. `hasSupabaseConfig` debe impedir tratarlas como backend valido. |
| FB-29 | Seguro | Defaults de presentacion (`Sin provincia`, `Sin contacto`, imagen placeholder, campos anulables) | Son necesarios para datos opcionales. Solo deben revisarse si ocultan un campo obligatorio o alimentan decisiones de permisos. |

## 6. Orden de eliminacion recomendado

### Fase 0 - Observabilidad

1. Estandarizar resultados con `data`, `error` y `source`.
2. Registrar ultimo origen exitoso: RPC, tabla, retry legacy o local.
3. Diferenciar lista vacia valida de fallo.
4. Exponer diagnostico solo a administradores.

Sin esta fase, retirar un fallback puede cambiar una pantalla vacia por otra sin
permitir saber cual contrato fallo.

### Fase 1 - Columnas y firmas de impacto acotado

Orden sugerido: FB-04, FB-05, FB-06, FB-09 y FB-12.

Son cambios moderados y verificables mediante alta, edicion y lectura. Cada
fallback debe retirarse en un cambio independiente.

### Fase 2 - Territorio y contenido estructural

Orden sugerido: FB-01, FB-02, FB-03, FB-08, FB-11 y FB-20.

Precondiciones:

- migraciones aplicadas en todos los entornos;
- FKs y RLS verificadas;
- datos reales con coordenadas, grupo y estado;
- pruebas de visitante, usuario, comunidad, diocesano y administrador.

### Fase 3 - Rutas autorizadas

Orden sugerido: FB-07, FB-10, FB-13, FB-14 y FB-15.

Las RPC/Edge Functions deben consolidarse antes de retirar rutas alternativas.
Especialmente FB-15 requiere confirmar que ambas RPC no tienen efectos
destructivos distintos.

### Fase 4 - Permisos y configuracion critica

Orden sugerido: FB-16 y FB-17.

No avanzar hasta definir:

- si `role_permissions` reemplaza o complementa permisos base;
- que fuente aplica la seguridad real;
- que ocurre cuando no se puede leer el modo mantenimiento;
- como se recupera una configuracion remota invalida.

### Fase 5 - Contenido local

Orden sugerido: FB-18 y FB-19.

El contenido local se retira por pantalla, nunca de forma global. Cada seccion
debe tener contenido remoto real, estado vacio intencional y rollback.

## 7. Checklist para una issue de eliminacion

- [ ] Se eligio un unico ID de esta auditoria.
- [ ] Tabla, columnas o firma RPC verificadas en Supabase real.
- [ ] Migracion correspondiente aplicada y documentada.
- [ ] RLS/policies verificadas para todos los roles afectados.
- [ ] Datos reales y caso vacio disponibles.
- [ ] Prueba manual definida para web y dispositivo cuando corresponda.
- [ ] Error visible o diagnostico reemplaza la degradacion silenciosa.
- [ ] `npm run typecheck` pasa.
- [ ] Existe una forma clara de rollback.

## 8. Conclusion

Los fallbacks mas urgentes de consolidar son los que pueden cambiar permisos,
alcance territorial o efectos administrativos: FB-07, FB-10, FB-13, FB-14,
FB-15, FB-16 y FB-17.

Los defaults visuales y las fuentes externas opcionales no deben eliminarse por
el solo hecho de ser fallbacks. El objetivo no es dejar la app sin red de
seguridad, sino reemplazar compatibilidad opaca por contratos estables,
observables y probados.
