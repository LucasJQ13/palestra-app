# Revision manual de migracion Supabase 20260613

## 1. Veredicto ejecutivo

Archivo revisado:

- `supabase/migrations/20260613210000_safe_schema_alignment.sql`

Resultado de la revision estatica:

- no contiene `drop table`, `drop column`, `rename`, cambios de tipo, DML,
  redefiniciones de RPC, cambios de RLS ni cambios de policies;
- propone agregar 76 columnas mediante `add column if not exists`;
- propone crear 8 indices mediante `create index if not exists`;
- agrupa todo en una transaccion;
- no crea tablas ausentes y no completa datos o relaciones existentes.

La migracion es **aditiva y no destructiva en su intencion**, pero **todavia no
esta aprobada para ejecutarse**. No puede considerarse segura para produccion
hasta comparar cada tabla, columna, tipo, default, indice y dependencia contra
un export de la base real.

No se ejecuto SQL, no se modifico Supabase, no se aplico la migracion y no se
uso `supabase db push` durante esta revision.

## 2. Archivos revisados

| Archivo | Uso en la revision |
| --- | --- |
| `docs/supabase/SCHEMA_INVENTORY.md` | Contrato que el frontend consume: 20 tablas directas, 5 buckets, 138 RPC y 21 archivos con acceso directo. |
| `docs/supabase/CANONICAL_SCHEMA.md` | Modelo deseado, relaciones, restricciones, indices y orden de migracion gradual. |
| `docs/supabase/FALLBACK_AUDIT.md` | Riesgos que hoy son absorbidos por reintentos, consultas alternativas y defaults locales. |
| `docs/supabase/FALLBACK_REMOVAL_PLAN.md` | Precondiciones y pruebas necesarias antes de retirar compatibilidad. |
| `supabase/migrations/20260613210000_safe_schema_alignment.sql` | Migracion aditiva bajo revision. |

La documentacion describe el contrato esperado, no certifica el estado de la
base desplegada. Esa diferencia es el principal bloqueo.

## 3. Comprobacion de operaciones prohibidas

| Operacion | Detectada | Observacion |
| --- | --- | --- |
| Borrar tablas o columnas | No | No hay sentencias `drop`. |
| Renombrar tablas o columnas | No | No hay sentencias `rename`. |
| Cambiar tipos existentes | No | No hay `alter column ... type`. |
| Redefinir RPC o triggers | No | No hay `create function`, `create or replace function` ni triggers. |
| Modificar filas con DML | No | No hay `insert`, `update`, `delete`, `truncate` ni backfill. |
| Activar o modificar RLS | No | No hay `enable row level security`. |
| Crear o modificar policies | No | No hay `create policy`, `alter policy` ni `drop policy`. |
| Modificar grants | No | No hay `grant` ni `revoke`. |
| Agregar columnas | Si | 76 columnas en 10 tablas, todas con `if not exists`. |
| Crear indices | Si | 8 indices no unicos, todos con `if not exists`. |

Esta comprobacion solo describe el texto SQL. No demuestra que los tipos y
defaults que ya existen en produccion coincidan con el contrato esperado.

## 4. Cambios propuestos por bloque

| Bloque | Cambios propuestos | Riesgo antes de verificar la base real |
| --- | --- | --- |
| `provinces` | 5 columnas: logo, estado, archivo y auditoria. Indice por estado y nombre. | Alto. `is_active default true` puede hacer activas todas las filas legacy al agregar la columna. El indice presupone que `name` existe y es indexable. |
| `communities` | 8 columnas: grupo, imagen, coordenadas, estado, archivo y auditoria. Indice por provincia, estado y nombre. | Alto. `group_type default 'jovenes'` clasifica filas antiguas sin revision; no agrega checks de coordenadas, grupo ni FK. El indice presupone `province_id` y `name`. |
| `profiles` | 20 columnas de avatar, territorio, subrango, preferencias, PM, cooldown, baja logica y auditoria. Dos indices de alcance/subrango. | Critico. Afecta identidad, permisos y territorio. No agrega FKs, checks ni backfill. `updated_at default now()` puede hacer que perfiles antiguos parezcan editados en la fecha de migracion. |
| `news` | 5 columnas: imagen, subrango, auditoria y archivo. Indice provincial por fecha. | Moderado. Debe confirmarse si `subrole_key` forma parte del contrato real; el inventario y el resumen canonico no lo enumeran para esta tabla. |
| `events` | 5 columnas: fin, subrango, auditoria y archivo. Indice provincial por inicio. | Moderado. El indice presupone `province_id` y `starts_at`; `subrole_key` requiere justificacion contractual. |
| `community_publications` | 9 columnas de contenido enriquecido, subrango, auditoria y archivo. Indice por comunidad, visibilidad y fecha. | Alto. Debe verificarse la forma real de publicaciones, RLS y alcance. El indice presupone `community_id`, `visibility` y `created_at`. |
| `app_tabs` | 4 columnas: icono, tipo y auditoria. | Moderado. Los defaults pueden presentar pestañas legacy como `simple` aunque su comportamiento real sea otro. |
| `app_content` | 3 columnas: bloques y auditoria. | Moderado. `blocks default []` no migra el contenido legacy a cards; solo crea un contenedor vacio. |
| `materials` | 9 columnas de categoria, visibilidad, archivo, orden, provincia, subrango y auditoria. Indice de alcance. | Alto. `visibility default 'interno'` puede ocultar o cambiar el alcance observable de materiales legacy. Deben verificarse Storage, RLS y RPC administrativas. |
| `app_runtime_config` | 8 columnas de versiones, mantenimiento, mensaje, flags, noticias y auditoria. | Critico. No crea la tabla ni la fila `default`. `maintenance_mode default false` puede desactivar semanticamente un estado no migrado y `recommended_version '0.1.38'` quedara obsoleta. |

## 5. Riesgos transversales detectados

### 5.1 `if exists` puede ocultar una migracion incompleta

`alter table if exists` omite silenciosamente una tabla ausente. La transaccion
puede terminar correctamente aunque una o varias de las 10 tablas no hayan sido
alineadas.

Antes de cualquier prueba debe confirmarse la existencia exacta de:

- `provinces`;
- `communities`;
- `profiles`;
- `news`;
- `events`;
- `community_publications`;
- `app_tabs`;
- `app_content`;
- `materials`;
- `app_runtime_config`.

Una tabla ausente requiere otra migracion basada en el export real. No debe
crearse por suposicion.

### 5.2 `if not exists` no valida columnas existentes

Si una columna ya existe con otro tipo, default o nulabilidad, PostgreSQL la
omite. La migracion puede finalizar sin corregir la divergencia.

Para cada una de las 76 columnas debe compararse:

- tipo SQL y tipo subyacente si es enum;
- nulabilidad;
- default;
- constraints y checks;
- FK y regla de borrado;
- uso actual por RPC, vistas, triggers y policies.

### 5.3 Los defaults cambian valores observables

No hay sentencias `update`, pero agregar una columna con default hace que las
filas anteriores expongan ese valor. Esto es especialmente sensible en:

- `provinces.is_active = true`;
- `communities.group_type = 'jovenes'`;
- `communities.is_active = true`;
- `profiles.use_nickname_in_greetings = false`;
- `profiles.credential_name_mode = 'name'`;
- `app_tabs.section_type = 'simple'`;
- `materials.visibility = 'interno'`;
- `app_runtime_config.maintenance_mode = false`;
- todos los `updated_at default now()`.

Estos valores requieren un informe previo de filas legacy y una decision de
backfill. `updated_at` no debe confundirse con una edicion real del usuario.

### 5.4 Los indices tienen dependencias no garantizadas

La migracion agrega algunas columnas usadas por los indices, pero presupone que
otras ya existen. Como minimo deben verificarse:

- `provinces.name`;
- `communities.province_id` y `communities.name`;
- `profiles.status`, `profiles.role` y `profiles.province_id`;
- `news.province_id` y `news.created_at`;
- `events.province_id` y `events.starts_at`;
- `community_publications.community_id`, `visibility` y `created_at`.

Si falta una dependencia, el bloque `do` falla y la transaccion completa se
revierte. Si ya existe un indice equivalente con otro nombre, se puede crear un
duplicado innecesario.

### 5.5 Impacto operativo en produccion

Aunque sea aditiva, la migracion no es operacionalmente neutra:

- `alter table` adquiere bloqueos sobre cada tabla;
- `create index` no usa `concurrently` y puede bloquear escrituras;
- el tiempo y espacio requerido dependen del volumen real;
- una transaccion larga puede aumentar espera, WAL y riesgo de rollback costoso.

Por eso la primera ejecucion, cuando corresponda, debe ser en una copia o
staging con datos representativos y medicion de tiempos. No debe probarse
directamente en produccion.

### 5.6 La migracion no completa el esquema canonico

Por diseño no agrega:

- FKs;
- checks de coordenadas, roles, genero, PM o formatos;
- uniques;
- triggers de `updated_at`;
- policies, grants o RLS;
- RPC canonicas;
- filas de configuracion;
- backfill territorial o de identidad.

Aplicarla no autoriza retirar fallbacks y no demuestra que la app haya quedado
alineada.

### 5.7 Inconsistencia documental por resolver

La migracion agrega `subrole_key` a `news`, `events`, `materials` y
`community_publications`. Esa columna no aparece en el inventario de campos
directamente consumidos ni en el resumen de esas tablas del esquema canonico.

Antes de aprobarla debe decidirse si:

1. es parte del contrato futuro y se actualiza la documentacion; o
2. no tiene consumidores confirmados y se retira de esta migracion.

No debe agregarse solo porque haya existido en un parche historico.

## 6. Verificacion obligatoria contra Supabase real

Estas comprobaciones deben realizarse antes de aprobar una prueba de la
migracion. En esta issue no fueron ejecutadas.

### Estructura

- [ ] Obtener export de esquema de produccion con fecha y checksum.
- [ ] Confirmar las 10 tablas objetivo y sus schemas.
- [ ] Comparar las 76 columnas una por una.
- [ ] Identificar columnas existentes con tipo, default o nulabilidad distinta.
- [ ] Confirmar PK, uniques, FKs, checks y reglas de borrado actuales.
- [ ] Revisar enums usados por `profiles.status` y `profiles.role`.
- [ ] Inventariar indices equivalentes aunque tengan otro nombre.
- [ ] Revisar triggers y vistas dependientes de las tablas objetivo.

### Seguridad y contratos

- [ ] Exportar RLS, policies, grants y propietarios sin modificarlos.
- [ ] Confirmar relaciones PostgREST requeridas por el frontend.
- [ ] Comparar las RPC que leen o escriben las columnas propuestas.
- [ ] Confirmar que ninguna policy depende de ausencia, nulabilidad o default de
      las columnas nuevas.
- [ ] Revisar policies de los 5 buckets de Storage relacionados.

### Datos

- [ ] Contar filas por tabla y estimar tiempo de bloqueo/indice.
- [ ] Identificar provincias y comunidades cuyo estado real no sea conocido.
- [ ] Clasificar `group_type` de comunidades legacy antes de usar un default.
- [ ] Detectar coordenadas parciales o fuera de rango.
- [ ] Detectar perfiles sin correspondencia territorial y subrangos invalidos.
- [ ] Determinar visibilidad real de materiales legacy.
- [ ] Verificar contenido que requiere conversion a `app_content.blocks`.
- [ ] Confirmar si existe exactamente una fila de configuracion `default`.

### Compatibilidad

- [ ] Probar la version publicada de la app y la version en desarrollo.
- [ ] Mantener todos los fallbacks durante esta fase.
- [ ] No cambiar firmas RPC ni tipos de retorno.
- [ ] No asumir que una consulta vacia significa migracion correcta.

## 7. Secuencia segura antes de produccion

### Paso 0 - Congelar y respaldar

1. Pausar cambios manuales de esquema durante la revision.
2. Exportar esquema, funciones, triggers, policies, grants y configuracion de
   Storage.
3. Generar backup de datos y comprobar restauracion en un entorno aislado.

Salida requerida: backup restaurable y export versionado para comparar.

### Paso 1 - Generar reporte de diferencias

1. Comparar el export con las 76 columnas propuestas.
2. Clasificar cada columna como ausente, compatible, divergente o legacy.
3. Revisar dependencias de los 8 indices.
4. Resolver la decision sobre `subrole_key` en tablas de contenido.
5. Separar de esta migracion cualquier bloque que no pueda certificarse.

Salida requerida: matriz firmada de diferencias, sin ejecutar cambios.

### Paso 2 - Preparar una migracion ajustada

1. Conservar solo columnas realmente faltantes y verificadas.
2. Revisar defaults sensibles y separar los que requieren backfill.
3. Definir estrategia de indices segun volumen y ventanas de bloqueo.
4. Agregar consultas de preflight que fallen explicitamente ante tablas o
   columnas base ausentes, evitando omisiones silenciosas.

Salida requerida: nueva revision del SQL y aprobacion humana.

### Paso 3 - Probar en copia o staging

Solo despues de completar los pasos anteriores:

1. restaurar una copia anonimizada y representativa;
2. medir duracion, bloqueos, WAL y espacio de indices;
3. comparar conteos y valores antes/despues;
4. ejecutar pruebas funcionales por modulo;
5. restaurar el backup para demostrar rollback.

Esto no autoriza aplicar en produccion.

### Paso 4 - Pruebas funcionales minimas

- Comunidades: listado, edicion, geolocalizacion y alcance provincial.
- Perfil: login, lectura, edicion, rol, subrango y cooldown territorial.
- Noticias y publicaciones: contenido con y sin imagen/enlace.
- Navegacion: iconos, tipos, orden y visibilidad de pestañas.
- Materiales: visibilidad, archivo, descarga y alcance por rango/provincia.
- Configuracion: mantenimiento, flags y ausencia de fila `default`.
- Roles: visitante, usuario aprobado, comunidad, diocesano, nacional y
  administrador.

### Paso 5 - Puerta de produccion

Produccion solo puede considerarse cuando:

- staging pasa todas las pruebas;
- el SQL final fue revisado nuevamente;
- existe backup reciente y rollback ensayado;
- se definio ventana de mantenimiento y monitoreo;
- no se mezclan cambios de RLS, RPC, datos o fallbacks en el mismo despliegue;
- una persona responsable aprueba expresamente la ejecucion.

## 8. Acciones que siguen prohibidas

Hasta completar la verificacion remota:

- no ejecutar esta migracion en Supabase;
- no ejecutar `supabase db push`;
- no pegar el archivo completo en el SQL Editor;
- no modificar RLS, policies, grants o RPC como parte de esta issue;
- no retirar fallbacks del frontend;
- no compilar ni publicar una APK basandose en esta migracion;
- no marcar el esquema como alineado solo porque el SQL sea idempotente.

## 9. Conclusion

La migracion revisada evita operaciones destructivas explicitas y constituye
una base razonable para una **propuesta** de alineacion aditiva. Sin embargo, no
es todavia una migracion certificada:

- omite tablas ausentes silenciosamente;
- no valida divergencias de columnas ya existentes;
- aplica defaults con impacto observable sobre filas legacy;
- crea indices con posibles bloqueos y dependencias no comprobadas;
- no cubre constraints, relaciones, seguridad, RPC ni backfill.

Estado final de esta revision: **NO EJECUTAR TODAVIA**. El siguiente paso es
obtener y comparar el export real, no aplicar SQL.
