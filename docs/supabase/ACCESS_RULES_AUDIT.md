# Auditoria de reglas de acceso Supabase

Fecha de auditoria: 2026-06-13

Issue relacionada: GitHub #25 - Supabase Fase 6.

## 1. Objetivo y limites

Este documento compara el acceso esperado por tabla, rol y alcance territorial
con las policies, grants y RPC versionadas en `supabase/`.

Esta auditoria:

- no modifica codigo funcional;
- no crea ni reemplaza policies;
- no ejecuta SQL;
- no confirma que todos los parches del repositorio esten aplicados en la base
  remota;
- no considera la visibilidad de botones React como una barrera de seguridad.

El estado real solo puede confirmarse con un export de `pg_policies`, grants,
funciones y buckets desde el proyecto Supabase activo.

## 2. Roles agrupados

| Codigo | Grupo | Roles incluidos |
| --- | --- | --- |
| V | Visitante | Sin sesion o `invitado` |
| U | Usuario aprobado | `palestrista`, `sedimentador` |
| C | Dirigente comunitario | `animador_comunidad`, `coordinador_comunidad` |
| P | Dirigente provincial | `vocal`, `asesor`, `coordinador_diocesano` |
| N | Dirigente nacional | `vocal_nacional`, `coordinador_nacional` |
| A | Administrador | `administrador` |

`asesor` pertenece al grupo provincial para alcance territorial, pero no debe
heredar automaticamente herramientas operativas que lo excluyen expresamente,
como el escaner QR.

## 3. Leyenda de acceso esperado

| Codigo | Significado |
| --- | --- |
| `R` | Lectura publica o del registro habilitado |
| `O` | Solo registros propios |
| `C` | Alcance de la comunidad propia/asignada |
| `P` | Alcance de la provincia propia |
| `N` | Alcance nacional |
| `A` | Administracion global |
| `M` | Mutacion dentro del alcance indicado |
| `RPC` | Sin acceso directo; solo mediante una RPC validada |
| `-` | Sin acceso |

Los codigos combinados se leen como `R/C` (lectura comunitaria) o `M/P`
(mutacion dentro de la provincia).

## 4. Principios obligatorios

1. RLS o una RPC autorizada debe proteger toda tabla expuesta por PostgREST.
2. Un perfil debe estar `aprobado` para acceder a datos internos.
3. Los roles comunitarios solo operan sobre su comunidad.
4. Los roles provinciales solo operan sobre su provincia, salvo excepcion
   nacional documentada.
5. Los roles nacionales ven alcance nacional, pero no reciben facultades
   tecnicas de administrador por defecto.
6. `display_role_label`, alias y subrangos nunca otorgan permisos por si solos.
7. Una RPC `security definer` debe validar `auth.uid()`, estado, rol, alcance y
   usar `set search_path = public`.
8. Las policies permisivas de PostgreSQL se combinan con `OR`. Una policy antigua
   mas amplia puede anular una policy nueva mas estricta.
9. `service_role` solo pertenece a procesos backend controlados.

## 5. Matriz de identidad, territorio y autorizacion

| Tabla | V | U | C | P | N | A | Acceso esperado / via | Evidencia versionada |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `profiles` | - | O | R/C | R/P | R/N | A | Propio por RPC; listados y cambios sensibles por RPC territorial. | RLS propio y policies dirigenciales legacy; RPC modernas aplican alcance. Estado **conflictivo** por update directo amplio. |
| `provinces` | R | R | R | R/P | R/N | A | Leer activas; crear/estado/logo solo por funciones autorizadas. | Policy publica `using (true)` no filtra archivadas; la UI filtra. Mutaciones por RPC. |
| `communities` | R | R | R + M/C | R + M/P | R + M/N | A | Lectura publica de activas; escritura por alcance. | Policy `Comunidades publicas` fue redefinida con estado/archivo y helpers territoriales. |
| `province_community_sections` | R | R | R | R | R | A | Lectura para construir UI; administracion global. | Select anon/autenticado; mutacion `current_user_is_admin()`. |
| `permissions` | - | R | R | R | R | A | Catalogo legible por autenticados; mutacion administrativa. | Select autenticado. No se localizo policy directa de escritura. |
| `role_permissions` | - | R | R | R | R/M si tiene permiso | A | Lectura autenticada para UI; cambios por RPC administrativa. | Select autenticado; `admin_save_role_permissions` debe ser la unica escritura. |
| `role_aliases` | R | R | R | R | R | A | Etiquetas visibles; no controlan seguridad. | Select publico y gestion con `current_user_is_admin()`. |
| `province_role_labels` | R | R | R | R | R | A | Etiquetas visibles; no controlan seguridad. | Select publico y gestion administrativa. |
| `honor_level_definitions` | R | R | R | R | R | A | Catalogo visible; administracion global. | Policies de lectura activa y gestion admin. |
| `profile_role_relationships` | - | O | R/C | R/P + M/P | R/N + M/N | A | Relaciones visibles a participantes y dirigentes por alcance. | Helpers de provincia; requiere verificar que escritura nacional/admin sea la deseada. |
| `community_advisors` | - | RPC | RPC/C | RPC/P | RPC/N | RPC/A | Ningun acceso directo; asignacion y lectura por RPC. | RLS habilitado, `revoke all` a anon/authenticated y RPC con validacion. **Bien cerrado en repositorio**. |

## 6. Matriz de configuracion, navegacion y contenido

| Tabla | V | U | C | P | N | A | Acceso esperado / via | Evidencia versionada |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `app_tabs` | R visibles | R/rol | R/rol | R/rol | R/rol + M | A | Solo pestañas visibles y permitidas; gestion con permiso. | Policy actual `using (true)` expone tambien ocultas/roles; el filtro queda en cliente. **Inconsistente**. |
| `app_content` | R publico | R/rol | R/rol + M | R/rol + M | R/N + M | A | Lectura condicionada por la pestaña; edicion por permiso. | Policy `using (true)` no enlaza visibilidad de `app_tabs`. **Inconsistente**. |
| `app_runtime_config` | R segura | R segura | R segura | R segura | R segura | A | Lectura de claves publicas; escritura tecnica. | Select publico y gestion admin. Debe confirmarse que el JSON nunca contenga secretos. |
| `app_settings` | R segura | R segura | R segura | R segura | R segura | A | Solo valores aptos para cliente. | Policy publica sobre JSON completo. **No verificable** si contiene datos internos. |
| `admin_config` | R segura | R segura | R segura | R segura | R segura | A | La app consume identidad/contenido, pero el registro no debe alojar secretos. | Policy publica `using (true)` sobre config completa. **Riesgo de diseño**. |
| `app_library_items` | R publicados | R/rol | R/rol + M | R/rol + M | R/N + M | A | Publicados visibles; borradores/archivo solo editores. | Policy publica exige `status = publicado` y no archivado; mutacion por RPC. |
| `church_document_buttons` | R habilitados | R | R | R | R | A | Botones activos publicos; gestion administrativa. | Lectura activa publica; policy all con helper admin. |
| `formation_path_stations` | R/rol | R/rol | R/rol | R/rol + M | R/rol + M | A | Visibilidad por `visible_roles`; gestion con permiso. | RLS consulta roles. Mutaciones por RPC; revisar helper vigente. |
| `formation_path_station_materials` | R/rol | R/rol | R/rol | R/rol | R/rol | A | Visible solo si la estacion padre es visible. | Policy enlazada a estacion. Escritura por RPC de estaciones. |
| `daily_gospel` | R | R | R | R | R | R | Lectura publica; escritura exclusiva del servicio backend. | Policies anon/authenticated read y `service_role` all. **Bien definido**. |

## 7. Matriz de noticias, agenda, PM y materiales

| Tabla | V | U | C | P | N | A | Acceso esperado / via | Evidencia versionada |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `news` | R publicas | R/alcance | R/C + M/C | R/P + M/P | R/N + M/N | A | Publico o alcance territorial; escritura por contenido autorizado. | Parches modernos eliminan policies legacy y crean alcance territorial. Estado remoto **no verificable** por orden manual de parches. |
| `events` | R publicos | R/alcance | R/C + M/C | R/P + M/P | R/N + M/N | A | Igual criterio territorial que noticias. | Misma situacion que `news`. |
| `motivador_periods` | R si visible | R/rol | R/rol | R/P + M/P | R/N + M/N | A | Estado, rango y provincia; gestion provincial/nacional segun regla final. | Policies detalladas, pero helper de gestion versionado excluye algunos nacionales. **Revisar regla de negocio**. |
| `materials` | R publicos | R/permiso | R/C + M/C | R/P + M/P | R/N + M/N | A | Visibilidad, permiso, provincia y autor. | `patch_beta_baseline` elimina policies legacy; otros parches vuelven a definir acceso. Verificar policies efectivas remotas. |
| `news_drafts` | - | - | O si se habilita | R/P si se habilita | R/N | A | Borradores por autor/alcance, no publicos. | Policy versionada solo usa `current_user_is_admin()`. Puede significar admin amplio, no estrictamente administrador. |

## 8. Matriz comunitaria, foro y consultas

| Tabla | V | U | C | P | N | A | Acceso esperado / via | Evidencia versionada |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `community_publications` | R publicas definidas | R/C/visibilidad | R/C + M/C | R/P + moderar | R/N + moderar | A | Comunidad, estado, tipo y visibilidad deben resolverse en backend. | Policy fue redefinida varias veces. La migracion mas reciente restringe avisos y comunidad; confirmar orden aplicado. |
| `publication_comments` | R si publicacion visible | R + M/O | R/C + moderar | R/P + moderar | R/N + moderar | A | Hereda visibilidad de publicacion. | Helper `current_user_can_see_publication`; insercion exige aprobado. |
| `publication_reactions` | R si publicacion visible | O + M/O | O | O | O | A | Propias para escritura; lectura ligada a publicacion. | Policies coherentes con helper de publicacion. |
| `publication_reports` | - | O + M/O | O + moderar/C | moderar/P | moderar/N | A | Reportante ve lo suyo; moderadores ven alcance. | Policies usan helper de moderacion. |
| `community_poll_votes` | - | O | O + R/C | R/P | R/N | A | Usuario vota una encuesta visible; resultados agregados, no votos ajenos. | Policy permite a varios dirigentes leer votos sin filtro territorial explicito. **Inconsistente**. |
| `forum_categories` | R activas | R | R | R | R | A | Categorias activas; gestion por permiso. | Solo se localizo select. Gestion se realiza por SQL/RPC a verificar. |
| `forum_topics` | R/rol | R/rol + M/O | R/C + moderar | R/P + moderar | R/N + moderar | A | Minimo rango, scope y provincia. | Lectura mediante helper; mutaciones por RPC. |
| `forum_comments` | R/tema | R/tema + M/O | R/C + moderar | R/P + moderar | R/N + moderar | A | Hereda acceso del tema. | Policy enlazada al helper de tema. |
| `community_contact_messages` | M limitada | O | R/C + responder | R/P + responder | R/N | A | Visitante puede crear; lectura solo responsables y remitente cuando aplique. | Insercion directa permite mensaje sin comunidad y solo limita longitud. Ruta legacy **debe migrarse** a `public_queries`. |
| `public_queries` | M limitada | O | R/C + responder | R/P + responder | R/N + responder | A | Destino estructurado y acceso por responsable. | Policy usa helper territorial; parche posterior endurece lider comunitario. |
| `community_news` | - | R aprobados | R/C | R/P | R/N | A | Tabla legacy, sin nuevas funciones. | Policy da lectura de todas las filas a cualquier aprobado, sin comunidad. **Legacy riesgoso**. |

## 9. Matriz de mensajeria, moderacion y notificaciones

| Tabla | V | U | C | P | N | A | Acceso esperado / via | Evidencia versionada |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `direct_messages` | - | O/participante | O/participante | O/participante | O/participante | O/participante | Solo emisor y destinatarios; envio por RPC moderada. | RLS de participantes y RPC con moderacion. |
| `direct_message_recipients` | - | O/participante | O/participante | O/participante | O/participante | O/participante | Destinatario y emisor relacionado. | Policy de participantes. |
| `internal_messages` | - | R aprobados | R | R | R | A | Tabla legacy; deberia retirarse tras migrar historial. | Policy da lectura global a aprobados. No usar para datos nuevos. |
| `message_reports` | - | O | O + moderar si corresponde | moderar | moderar | A | Reportante o moderador. | Policy coherente; moderador incluye coordinador diocesano y nacionales. |
| `moderation_rules` | - | - | - | R si moderador | R | A | Solo moderadores. | Helper excluye vocal provincial y asesor; confirmar intencion. |
| `moderation_events` | - | - | - | R si moderador | R | A | Auditoria de moderacion. | Mismo helper. |
| `user_messaging_restrictions` | - | O | O | O + moderar | O + moderar | A | Usuario ve propia; moderadores ven alcance. | Policy no expresa alcance territorial del moderador. **Revisar**. |
| `notification_intents` | - | - | O si crea | O + R/P | O + R/N | A | Creador y dirigentes segun alcance. | Policy permite a roles listados ver intenciones globalmente, sin filtro territorial. **Inconsistente**. |
| `device_push_tokens` | - | O + M/O | O | O | O | A excepcional | Solo propietario; backend usa service role para entrega. | Policies propias coherentes. Falta confirmar revocacion/delete. |

## 10. Matriz de QR, intenciones, solicitudes y datos personales

| Tabla | V | U | C | P | N | A | Acceso esperado / via | Evidencia versionada |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `profile_credentials` | - | O/RPC | O/RPC | validar RPC | validar RPC | validar RPC | Token opaco; emision propia y validacion autorizada por RPC. | Select propio; emision/validacion `security definer`. Confirmar roles habilitados dentro de la ultima funcion. |
| `qr_activity_lists` | - | RPC compartida | RPC compartida | RPC/P | RPC/N | RPC/A | Sin lectura directa; helpers de creador, compartido, rol y territorio. | RLS habilitado sin policies directas; acceso por RPC. **Buen patron si grants remotos coinciden**. |
| `qr_activity_members` | - | RPC | RPC/C | RPC/P | RPC/N | RPC/A | Solo usuarios que pueden acceder/gestionar lista. | Igual patron RPC. |
| `qr_activity_attendance` | - | RPC | RPC/C | RPC/P | RPC/N | RPC/A | Validacion y exportacion por alcance. | Igual patron RPC. |
| `qr_activity_list_shares` | - | RPC | RPC/C | RPC/P | RPC/N | RPC/A | Gestion por creador/gestor autorizado. | Igual patron RPC. |
| `prayer_intentions` | - | R + M/O | R + M/O | R | R | A | Aprobados leen activas; autor crea; admin modera aun si anonima. | RLS de lectura/insert. Moderacion por RPC administrativa. |
| `prayer_intention_prayers` | - | O/RPC | O/RPC | O/RPC | O/RPC | A/RPC | Usuario solo ve sus registros; conteos por RPC. | Select propio. Escritura por RPC. |
| `prayer_intention_removal_notices` | - | O | O | O | O | A/RPC | Aviso privado y de una sola visualizacion. | Select propio; marcado por RPC. |
| `user_requests` | - | O + M/O | O + R/C si corresponde | R/P | R/N | A | Propias; resolucion por helper de alcance y tipo. | Policies base solo propio; panel administrativo usa RPC. |
| `user_agenda_preferences` | - | O + M/O | O | O | O | O | Preferencias siempre personales. | CRUD propio completo. **Bien definido**. |
| `user_deletion_backups` | - | - | - | - | - | A | Solo administrador estricto y service role. | Policy administrativa localizada; confirmar grants. |

## 11. Matriz de auditoria y tablas auxiliares

| Tabla | V | U | C | P | N | A | Acceso esperado / via | Evidencia versionada |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `audit_logs` | - | - | - | R/P limitada | R/N | A | Lectura solo responsables autorizados; insert desde RPC/backend. | Policy legacy permite vocal nacional, coordinador nacional y admin, sin vocal provincial. Correcto si es intencional. |
| `admin_config` / `app_settings` | R segura | R segura | R segura | R segura | R segura | A | Repetidas aqui por su sensibilidad: ningun secreto debe persistirse. | Lectura publica completa; requiere inventario de claves. |

## 12. Storage

| Bucket | Lectura esperada | Escritura esperada | Evidencia / riesgo |
| --- | --- | --- | --- |
| `profile-photos` | Publica si la foto forma parte del perfil publico. | Usuario solo bajo carpeta `auth.uid()`; admin por flujo separado si se define. | Policies por carpeta propia. No hay delete versionado. |
| `content-images` | Publica para contenido publicado. | Administrador o permiso canonico de contenido. | Version inicial usa `current_user_is_admin()`; otros parches pueden ampliar editores. Confirmar policy efectiva. |
| `community-images` | Publica. | Gestor de la comunidad indicada por la primera carpeta UUID. | Helpers territoriales; conversion UUID puede fallar si existen rutas legacy. |
| `library-images` | Publica solo para recursos publicados. | Editor autorizado por seccion. | El bucket es publico: una URL conocida evita RLS de tabla. No guardar material privado aqui. |
| `materials` | Debe respetar la visibilidad del material. | Gestor autorizado; documentos eclesiales solo administrador estricto. | El bucket se marca `public = true`. **Critico**: cualquier URL conocida puede exponer archivos internos aunque la tabla tenga RLS. |

## 13. Inconsistencias y riesgos encontrados

### AR-01 - Update propio de `profiles` no limita columnas

Riesgo: **critico**.

La policy `Cada usuario actualiza datos basicos` limita la fila por `id =
auth.uid()`, pero no limita columnas. Si el rol `authenticated` conserva
privilegio SQL de `update` sobre la tabla, un cliente podria intentar modificar
`role`, `status`, provincia u otros campos sensibles directamente.

Accion futura:

- revocar update directo amplio;
- exponer solo RPC de perfil;
- o conceder update por columnas estrictamente personales;
- probar intento negativo de cambio de rol/status.

### AR-02 - Navegacion y contenido oculto son publicamente legibles

Riesgo: **alto**.

`app_tabs` y `app_content` usan `using (true)`. `is_visible` y `visible_roles`
solo se filtran en frontend, por lo que una pestaña oculta o restringida puede
consultarse directamente.

Accion futura: crear policies/RPC que unan contenido con la visibilidad efectiva
de la pestaña.

### AR-03 - Configuraciones JSON completas son publicas

Riesgo: **alto si se agregan secretos**.

`admin_config`, `app_settings` y `app_runtime_config` son legibles publicamente.
Hoy contienen configuracion de UI, pero el modelo permite agregar claves
arbitrarias.

Accion futura: separar `public_app_config` de configuracion operativa privada y
prohibir secretos en JSON cliente.

### AR-04 - Policies historicas pueden ampliar acceso

Riesgo: **critico**.

Noticias, eventos, materiales, comunidades y perfiles tienen varias
redefiniciones. Los parches correctivos eliminan algunos nombres antiguos, pero
la base real puede haber recibido archivos en distinto orden. Policies
permisivas coexistentes se combinan con `OR`.

Accion futura: exportar `pg_policies`, comparar por nombre/expresion y crear una
migracion de consolidacion que elimine explicitamente policies obsoletas.

### AR-05 - Alcance territorial incompleto en moderacion y notificaciones

Riesgo: **alto**.

`notification_intents`, votos de encuestas y restricciones de mensajeria
permiten acceso por rol sin filtrar siempre provincia/comunidad.

Accion futura: centralizar helpers `can_access_*` que reciban el registro objetivo
y validen alcance.

### AR-06 - Buckets publicos pueden evadir visibilidad de tabla

Riesgo: **critico para `materials`**.

RLS de `materials` protege metadatos, pero el bucket esta configurado como
publico. Una URL conocida puede descargar el archivo sin consultar la tabla.

Accion futura: bucket privado, paths no predecibles y URLs firmadas emitidas
despues de validar permiso.

### AR-07 - Tablas legacy conservan acceso global

Riesgo: **moderado/alto**.

`community_news` e `internal_messages` permiten lectura global a cualquier
usuario aprobado. Deben permanecer solo por historial y no recibir datos nuevos.

Accion futura: migrar historial y retirar consumidores antes de eliminar tablas.

### AR-08 - Estado remoto no verificable

Riesgo: **operativo**.

El repositorio contiene 58 tablas declaradas y multiples parches manuales. No
existe evidencia versionada de que produccion tenga exactamente esas policies,
grants y firmas.

Accion futura: generar snapshot remoto y una prueba automatizada de contrato.

## 14. Consultas para verificacion manual

No se ejecutaron estas consultas. Deben correrse manualmente en el proyecto
Supabase correcto.

```sql
-- RLS y policies efectivas.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

-- Tablas publicas sin RLS.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'r'
  and n.nspname = 'public'
order by c.relname;

-- Grants directos sobre tablas.
select grantee, table_schema, table_name, privilege_type
from information_schema.role_table_grants
where table_schema in ('public', 'storage')
  and grantee in ('anon', 'authenticated', 'service_role')
order by table_schema, table_name, grantee, privilege_type;

-- Funciones elevadas y search_path.
select
  n.nspname as schema_name,
  p.proname,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  p.proconfig
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
order by p.proname, arguments;

-- Buckets y caracter publico.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;
```

## 15. Pruebas negativas prioritarias

1. Usuario aprobado intenta actualizar `profiles.role` y `profiles.status`.
2. Usuario consulta una pestaña oculta directamente por PostgREST.
3. Usuario de una provincia consulta noticias/eventos privados de otra.
4. Dirigente provincial lista o edita perfiles de otra provincia.
5. Dirigente comunitario publica o sube imagen para otra comunidad.
6. Usuario sin permiso descarga una URL conocida del bucket `materials`.
7. Vocal provincial consulta moderacion o notificaciones de otra provincia.
8. Usuario no compartido consulta miembros/asistencia de una lista QR.
9. Usuario comun ejecuta una RPC administrativa concedida a `authenticated`.
10. Visitante lee configuraciones JSON buscando claves no destinadas al cliente.

## 16. Orden recomendado de ajustes futuros

1. Exportar policies, grants, funciones y buckets reales.
2. Cerrar update directo de `profiles`.
3. Convertir `materials` en bucket privado con URLs firmadas.
4. Consolidar policies duplicadas de noticias, eventos y materiales.
5. Aplicar visibilidad real a `app_tabs` y `app_content`.
6. Separar configuracion publica y privada.
7. Agregar alcance territorial a moderacion/notificaciones.
8. Retirar rutas legacy de `community_news`, `internal_messages` y contacto.
9. Crear pruebas automatizadas por rol y provincia.

## 17. Conclusion

El repositorio contiene buenas defensas en RPC recientes, especialmente para
usuarios, comunidades, asesores, QR y consultas publicas. El mayor riesgo no es
la ausencia total de reglas, sino la coexistencia de policies historicas, grants
directos y buckets publicos que pueden ampliar el acceso esperado.

Ningun ajuste debe aplicarse hasta contrastar esta auditoria con el estado remoto
y preparar pruebas positivas y negativas por rol.
