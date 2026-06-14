# Comparacion del esquema remoto de Supabase

## 1. Estado de la comparacion

Fecha de consulta remota: **14 de junio de 2026**.

Proyecto consultado: el proyecto Supabase configurado actualmente en
`app.json`.

Resultado general:

- se consulto el proyecto real mediante sus APIs publicas de PostgREST y
  Storage;
- no se ejecuto ninguna migracion;
- no se modificaron tablas, datos, RLS, policies, RPC ni buckets;
- no se uso `supabase db push`;
- no se dispone de token administrativo, password de base ni export SQL
  reciente;
- por esa limitacion no fue posible inspeccionar tipos exactos, defaults,
  indices, triggers, propietarios, grants ni definiciones de policies.

Esta comparacion es evidencia real del contrato expuesto por la API, pero no
reemplaza un dump administrativo de esquema.

## 2. Metodo utilizado

Las verificaciones fueron deliberadamente no mutantes:

1. Consultas PostgREST con `limit=0` para confirmar tablas y columnas sin leer
   filas.
2. Consultas PostgREST anonimas con `limit=1` para distinguir superficies con
   filas publicamente visibles, sin imprimir contenidos.
3. Resolucion de firmas RPC mediante los nombres de parametros documentados.
   Las funciones administrativas rechazaron la llamada por falta de
   autorizacion, datos inexistentes o tipos de prueba antes de realizar una
   operacion.
4. Listado de un maximo de un objeto por bucket para confirmar existencia y
   acceso anonimo de listado, sin registrar nombres de archivos.

No se pudo usar:

- Supabase CLI remoto, porque no hay `SUPABASE_ACCESS_TOKEN`;
- OpenAPI PostgREST, porque el proyecto exige una secret key;
- GraphQL introspection, porque `pg_graphql` no esta habilitado;
- consultas a `pg_catalog`, `information_schema`, `pg_policies` o
  `storage.buckets`, porque requieren acceso administrativo.

## 3. Resumen de diferencias

| Area | Documentado | Observado remotamente | Resultado |
| --- | ---: | ---: | --- |
| Tablas inventariadas | El encabezado indica 20, pero la tabla documental enumera 21 | Las 21 rutas existen en PostgREST | Corregir el total documental a 21 |
| Columnas esperadas por frontend | 214 | 207 presentes, 7 ausentes | Hay campos legacy/documentales que no existen |
| Columnas de la migracion | 76 | 67 presentes, 9 ausentes | La mayor parte de la migracion ya es no-op |
| RPC criticas probadas | 26 | Los 26 conjuntos de parametros resuelven | Tipos, defaults y retornos siguen pendientes |
| Buckets esperados | 5 | Los 5 responden | El listado anonimo esta habilitado |
| Indices propuestos | 8 | No verificables sin dump administrativo | No aprobar todavia |

## 4. Tablas reales

Las 21 tablas enumeradas en `SCHEMA_INVENTORY.md` existen y aceptan una
consulta PostgREST anonima con `limit=0`:

| Tabla | Existe | Columnas inventariadas |
| --- | --- | --- |
| `app_content` | Si | 5 de 5 |
| `app_library_items` | Si | 15 de 15 |
| `app_runtime_config` | Si | 8 de 8 |
| `app_tabs` | Si | 7 de 7 |
| `church_document_buttons` | Si | 9 de 9 |
| `communities` | Si | 14 de 14 |
| `community_contact_messages` | Si | 10 de 10 |
| `community_publications` | Si | 18 de 18 |
| `daily_gospel` | Si | 12 de 12 |
| `events` | Si | 7 de 7 |
| `forum_categories` | Si | 7 de 7 |
| `materials` | Si | 13 de 13 |
| `motivador_periods` | Si | 21 de 21 |
| `news` | Si | 8 de 8 |
| `news_drafts` | Si | 9 de 9 |
| `profiles` | Si | 21 de 27 |
| `province_community_sections` | Si | 3 de 3 |
| `provinces` | Si | 6 de 6 |
| `publication_comments` | Si | 5 de 5 |
| `role_permissions` | Si | 2 de 3 |
| `user_agenda_preferences` | Si | 7 de 7 |

No se detecto ninguna tabla inventariada ausente.

### Correccion documental necesaria

`SCHEMA_INVENTORY.md` declara 20 tablas, pero su propia lista contiene 21. El
numero correcto observado en esta comparacion es 21.

## 5. Columnas ausentes respecto del inventario

### `profiles`

Estas columnas inventariadas no existen como columnas fisicas expuestas:

| Columna ausente | Interpretacion |
| --- | --- |
| `user_id` | Coincide con el esquema canonico: `profiles.id` debe ser la identidad y las RPC pueden proyectarlo como `user_id`. No agregar una segunda identidad. |
| `email` | El esquema canonico define Supabase Auth como fuente. No agregarla sin decidir sincronizacion y privacidad. |
| `email_confirmed_at` | Debe provenir de Auth o de una proyeccion RPC administrativa. |
| `province` | Campo textual legacy. La base real ya usa `province_id`; no conviene reintroducirlo sin un plan de compatibilidad. |
| `personal_pm_province` | La estructura real tiene `personal_pm_province_id`. La app debe recibir el nombre mediante RPC o relacion. |
| `deleted_at` | Es la unica ausencia de esta lista que tambien propone la migracion. Requiere revisar todas las RPC de baja/eliminacion antes de agregarla. |

Las cinco primeras ausencias no justifican una migracion. Indican que el
inventario mezcla columnas fisicas con campos proyectados por RPC y
compatibilidad historica.

### `role_permissions`

`role_permissions.enabled` no existe.

Esto coincide con `CANONICAL_SCHEMA.md`, que define que la presencia de la fila
habilita el permiso y su ausencia lo deshabilita. El frontend dinamico ya
selecciona solo `permission_key`.

Decision recomendada: corregir el inventario y no agregar `enabled` a la tabla.
La RPC administrativa puede devolver un campo calculado si la interfaz lo
necesita.

## 6. Comparacion exacta con la migracion local

Migracion comparada:

- `supabase/migrations/20260613210000_safe_schema_alignment.sql`

### Columnas ya existentes

De las 76 columnas que intenta agregar, **67 ya existen**.

| Tabla | Ya existen | Faltan |
| --- | ---: | ---: |
| `provinces` | 3 | 2 |
| `communities` | 8 | 0 |
| `profiles` | 18 | 2 |
| `news` | 4 | 1 |
| `events` | 3 | 2 |
| `community_publications` | 8 | 1 |
| `app_tabs` | 3 | 1 |
| `app_content` | 3 | 0 |
| `materials` | 9 | 0 |
| `app_runtime_config` | 8 | 0 |

La migracion completa no debe aplicarse solo porque use
`add column if not exists`: ese modificador no detecta tipos, defaults,
nulabilidad o constraints divergentes en las 67 columnas existentes.

### Nueve columnas realmente ausentes

| Tabla | Columna | Definicion propuesta | Evaluacion |
| --- | --- | --- | --- |
| `provinces` | `updated_at` | `timestamptz default now()` | Esperar. El default modifica el valor observable de las filas existentes y requiere revisar triggers. |
| `provinces` | `updated_by` | `uuid` | Candidata para staging como columna anulable, tras definir si referencia `profiles(id)`. |
| `profiles` | `deleted_at` | `timestamptz` | Esperar. Afecta baja logica, filtros, login y RPC destructivas. |
| `profiles` | `updated_at` | `timestamptz default now()` | Esperar. Puede alterar auditoria y logica de edicion/cooldown. |
| `news` | `updated_by` | `uuid` | Candidata para staging como columna anulable, tras definir FK y escritura. |
| `events` | `ends_at` | `timestamptz` | Candidata para staging como columna anulable. Debe probarse agenda y PM. |
| `events` | `updated_by` | `uuid` | Candidata para staging como columna anulable, tras definir FK. |
| `community_publications` | `updated_by` | `uuid` | Candidata para staging como columna anulable, tras definir FK y alcance. |
| `app_tabs` | `updated_by` | `uuid` | Candidata para staging como columna anulable, tras definir FK. |

### Bloques que no necesitan columnas nuevas

No se justifica volver a agregar columnas en:

- `communities`;
- `app_content`;
- `materials`;
- `app_runtime_config`.

`app_runtime_config` ademas contiene una fila visible con `id = 'default'`.

### Campos adicionales ya existentes

La base real ya contiene `subrole_key` en:

- `news`;
- `events`;
- `community_publications`;
- `materials`.

Estas columnas aparecen en la migracion, pero no en el inventario de campos
consumidos por el frontend ni en el resumen canonico de esas tablas. Debe
decidirse si son contrato vigente o estructura futura antes de consolidarlas.
No deben eliminarse durante esta fase.

## 7. Relaciones PostgREST

Relaciones que resolvieron correctamente:

- `communities -> provinces`;
- `events -> provinces`;
- `motivador_periods -> provinces`;
- `news -> provinces`;
- `province_community_sections -> provinces`;
- `community_publications -> communities -> provinces`.

### Relaciones ambiguas detectadas

La seleccion documental y los fallbacks actuales usan relaciones sin nombre:

```text
community_publications -> profiles
publication_comments -> profiles -> provinces
```

La base real tiene mas de una FK posible y PostgREST devuelve `PGRST201`.

Para resolverlas se requieren nombres explicitos:

- `profiles!community_publications_created_by_fkey`;
- `profiles!publication_comments_user_id_fkey`;
- `provinces!profiles_province_id_fkey`.

Esto afecta las consultas directas de fallback en:

- `src/lib/remoteData.ts` para publicaciones comunitarias;
- `src/lib/remoteData.ts` para comentarios.

No se corrigio el frontend en esta issue. Debe abrirse un cambio funcional
separado y probarse con RPC, RLS y datos reales.

## 8. RPC remotas

Se probaron los conjuntos de parametros documentados para 26 RPC criticas de
perfil, usuarios, noticias, comunidades, roles y permisos.

El proyecto remoto resolvio los 26 nombres y conjuntos de parametros. Ninguno
respondio `PGRST202`, que indicaria firma ausente.

Entre las funciones confirmadas se encuentran:

- `get_my_profile`;
- `get_my_community_publications`;
- `admin_get_materials`;
- `admin_create_news`;
- `admin_update_news`;
- `admin_update_community`;
- `admin_create_province`;
- `admin_get_users`;
- `admin_get_pending_profiles`;
- `admin_approve_profile`;
- `admin_update_user`;
- `admin_update_profile_details_v2`;
- `admin_confirm_user_email`;
- `admin_create_basic_user`;
- funciones de diagnostico, reparacion y eliminacion de usuarios;
- `admin_get_role_permissions`;
- `admin_save_role_permissions`;
- funciones de alias y etiquetas de rango.

Las llamadas administrativas de prueba fueron rechazadas por falta de
autorizacion, IDs inexistentes o valores de prueba. No se modificaron datos.

### Sobrecargas legacy confirmadas

PostgREST confirmo candidatos duplicados para:

| RPC | Firmas visibles |
| --- | --- |
| `admin_create_news` | Con 4 parametros legacy y con `p_image_url` |
| `admin_update_news` | Con 4 parametros legacy y con `p_image_url` |
| `admin_create_province` | Con 2 parametros legacy y con `p_logo_url` |

`admin_update_community` resolvio tanto el payload actual con `p_group_type`
como el payload legacy sin ese parametro. Un export de `pg_proc` debe confirmar
si se trata de dos sobrecargas o de defaults.

Estas duplicaciones explican FB-05, FB-06, FB-11 y FB-12. No conviene retirar
los fallbacks hasta elegir una firma canonica y probar una version soportada de
la app.

### Limites de la verificacion RPC

Sin acceso a `pg_proc` no se confirmaron:

- tipos SQL exactos;
- parametros con default;
- volatilidad;
- tipo y columnas de retorno;
- `security definer`;
- `search_path`;
- owner y grants;
- cuerpo SQL desplegado.

Por lo tanto las RPC existen, pero aun no estan completamente versionadas
contra produccion.

## 9. RLS, policies y exposicion anonima

No fue posible leer `pg_policies` ni confirmar si RLS esta activado tabla por
tabla.

La prueba anonima permite afirmar:

- las 21 tablas aceptan una operacion `select` por PostgREST;
- RLS puede seguir filtrando las filas aunque el endpoint responda 200;
- no se probaron escrituras anonimas.

### Tablas con filas visibles para `anon`

Sin registrar contenidos, se observaron filas anonimamente visibles en:

- `app_content`;
- `app_library_items`;
- `app_runtime_config`;
- `app_tabs`;
- `church_document_buttons`;
- `communities`;
- `daily_gospel`;
- `events`;
- `forum_categories`;
- `news`;
- `province_community_sections`;
- `provinces`.

Esta exposicion parece compatible con contenido publico, pero debe compararse
con las policies reales.

### Tablas que devolvieron cero filas para `anon`

- `community_contact_messages`;
- `community_publications`;
- `materials`;
- `motivador_periods`;
- `news_drafts`;
- `profiles`;
- `publication_comments`;
- `role_permissions`;
- `user_agenda_preferences`.

Un resultado vacio no permite distinguir tabla vacia de filtrado RLS. Deben
probarse con un usuario aprobado, un dirigente y un administrador en staging.

Las RPC de lectura `admin_get_users` y `admin_get_pending_profiles` devolvieron
listas vacias a `anon`; no expusieron usuarios durante esta comprobacion.

## 10. Storage

Los cinco buckets esperados responden en el proyecto real:

| Bucket | Existe / responde | Listado anonimo |
| --- | --- | --- |
| `community-images` | Si | Permitido |
| `content-images` | Si | Permitido |
| `library-images` | Si | Permitido |
| `materials` | Si | Permitido |
| `profile-photos` | Si | Permitido |

No se imprimieron nombres ni contenidos.

El hecho de que el listado anonimo responda 200 en los cinco buckets debe
revisarse. Puede ser intencional para imagenes publicas, pero `materials` y
`profile-photos` requieren confirmar:

- flag publico/privado del bucket;
- policies de `select`, `insert`, `update` y `delete`;
- separacion por usuario, provincia o rango;
- MIME y limite de archivo;
- imposibilidad de sobrescribir archivos ajenos.

No se probaron subidas, modificaciones ni eliminaciones.

## 11. Que coincide con el contrato

- Todas las tablas enumeradas existen.
- 207 de 214 columnas inventariadas existen.
- Las columnas territoriales, coordenadas e imagenes de comunidades existen.
- Las columnas enriquecidas de publicaciones comunitarias existen.
- Las columnas de pestañas, contenido, materiales y configuracion existen.
- La fila `app_runtime_config.id = 'default'` existe.
- Las RPC criticas consultadas resuelven los parametros actuales.
- Los cinco buckets esperados existen y responden.

## 12. Que falta o diverge

- El inventario cuenta 20 tablas, pero enumera y el remoto expone 21.
- Siete columnas documentadas no existen; seis son legacy/proyecciones y una es
  `profiles.deleted_at`.
- Nueve columnas de la migracion todavia faltan.
- Hay firmas RPC legacy duplicadas.
- Dos relaciones PostgREST usadas por fallbacks son ambiguas.
- La migracion contiene 67 adiciones que ya existen y no valida divergencias.
- No se verificaron tipos, defaults, constraints, indices, triggers, RLS,
  policies, grants ni cuerpos RPC.
- El listado anonimo de todos los buckets requiere una auditoria de seguridad.

## 13. Que no conviene tocar

Hasta disponer de un dump administrativo:

- no agregar `profiles.user_id`, `profiles.email`,
  `profiles.email_confirmed_at`, `profiles.province` ni
  `profiles.personal_pm_province`;
- no agregar `role_permissions.enabled`;
- no borrar `subrole_key` de tablas de contenido;
- no eliminar sobrecargas RPC;
- no modificar RLS o policies;
- no aplicar los ocho indices;
- no retirar fallbacks;
- no ejecutar la migracion completa.

## 14. Evaluacion de aplicabilidad

### Produccion

**Ningun bloque esta aprobado para produccion.**

La migracion completa debe esperar porque:

- 67 columnas ya existen sin comparacion de tipo/default;
- tres de las nueve ausencias afectan auditoria o baja de perfiles;
- los ocho indices no fueron comparados;
- faltan RLS, policies, grants, triggers y volumen real.

### Candidatos para una migracion aislada de staging

Despues de obtener un dump y confirmar FKs/consumidores, pueden prepararse en
una migracion separada:

- `provinces.updated_by`;
- `news.updated_by`;
- `events.ends_at`;
- `events.updated_by`;
- `community_publications.updated_by`;
- `app_tabs.updated_by`.

Todas son anulables en la propuesta. Aun asi, no deben aplicarse desde este
documento.

### Deben esperar una revision funcional

- `profiles.deleted_at`;
- `profiles.updated_at`;
- `provinces.updated_at`.

Tambien deben esperar los ocho indices.

## 15. Checklist previo a staging

- [ ] Obtener `pg_dump --schema-only` o export equivalente.
- [ ] Exportar `pg_proc`, `pg_policies`, grants, triggers e indices.
- [ ] Confirmar tipos/defaults de las 67 columnas ya existentes.
- [ ] Confirmar las nueve columnas ausentes con sus consumidores.
- [ ] Revisar los ocho indices y detectar equivalentes con otro nombre.
- [ ] Medir filas y bloqueos potenciales por tabla.
- [ ] Corregir el total de tablas en `SCHEMA_INVENTORY.md`.
- [ ] Corregir el inventario de campos fisicos versus proyecciones RPC.
- [ ] Elegir firmas canonicas para las cuatro RPC con compatibilidad legacy.
- [ ] Definir nombres explicitos de relaciones PostgREST ambiguas.
- [ ] Auditar policies de los cinco buckets.
- [ ] Restaurar un backup reciente en staging.
- [ ] Probar app publicada y app en desarrollo contra staging.
- [ ] Ensayar rollback.

## 16. Conclusion

La base real esta mas avanzada que la migracion local: 67 de las 76 columnas
propuestas ya existen. Aplicar el archivo completo no aportaria una alineacion
verificable y podria ocultar divergencias de tipos, defaults o indices.

La comparacion permite reducir el siguiente paso a nueve columnas, pero ninguna
debe llegar aun a produccion. Primero se necesita un export administrativo,
corregir las ambiguedades RPC/PostgREST y probar un parche minimo en staging.

Estado final: **NO APLICAR MIGRACIONES TODAVIA**.
