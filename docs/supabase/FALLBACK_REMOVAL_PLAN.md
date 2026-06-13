# Plan de eliminacion gradual de fallbacks

## 1. Objetivo y limites

Este documento transforma `FALLBACK_AUDIT.md` en un plan ejecutable para retirar
compatibilidad temporal del frontend cuando Supabase tenga contratos estables.

Esta fase es exclusivamente documental:

- no elimina fallbacks;
- no cambia consultas, RPC, Edge Functions ni pantallas;
- no ejecuta SQL ni modifica la base real;
- no considera un fallback eliminable solo porque exista una migracion local.

La fuente de verdad para los IDs, el riesgo y el comportamiento actual es
`docs/supabase/FALLBACK_AUDIT.md`.

## 2. Reglas de trabajo

1. Retirar un solo ID por cambio, salvo que dos IDs formen una unica ruta
   indivisible y la justificacion quede documentada.
2. Verificar el contrato desplegado en Supabase, no solo los archivos SQL del
   repositorio.
3. Crear primero observabilidad cuando el comportamiento actual convierte un
   error en `[]`, `null` o contenido local.
4. No sustituir seguridad de backend por filtros de interfaz.
5. Probar lista con datos, lista vacia valida, falta de permisos y error real.
6. Ejecutar `npm run typecheck` y conservar una forma concreta de rollback.
7. Probar en web y dispositivo los flujos que usan camara, ubicacion, descarga,
   Storage, enlaces externos o autenticacion.

## 3. Estados del plan

| Estado | Significado |
| --- | --- |
| Retirable pronto | Contrato acotado. Puede abrirse una issue de implementacion tras verificar Supabase y completar la prueba indicada. |
| Requiere consolidacion | Hay contratos historicos, alcance territorial, permisos o efectos administrativos que deben unificarse primero. |
| Requiere observabilidad | Antes de retirar el fallback debe distinguirse error, falta de permiso, carga y resultado vacio. |
| Mantener por compatibilidad | Sigue siendo necesario mientras haya contenido o instalaciones que dependan de una ruta anterior. |
| Mantener intencionalmente | Es resiliencia o presentacion valida y no es deuda de esquema. |

## 4. Precondiciones globales

Antes de implementar cualquier retiro:

- disponer de un export o snapshot reciente del esquema remoto;
- comparar firmas remotas con `supabase/rpc` y las migraciones candidatas;
- confirmar columnas, nulabilidad, FKs, grants, RLS y propietario de funciones;
- tener datos de prueba para todos los roles y territorios afectados;
- confirmar que la aplicacion puede mostrar un error sin confundirlo con una
  lista vacia;
- registrar entorno, fecha y version de Supabase verificada;
- definir rollback: restaurar el bloque retirado o revertir el commit;
- no mezclar el retiro con refactors visuales o cambios de negocio.

## 5. Plan por modulo

### 5.1 Comunidades, provincias y territorio

| ID | Estado | Precondicion para retirar | Prueba manual obligatoria |
| --- | --- | --- | --- |
| FB-01 | Requiere consolidacion | `provinces` remoto expone `id`, `name`, `region`, `logo_url`, `is_active` y `archived_at`; RLS permite la lectura prevista; existen provincias activas e inactivas de prueba. | Como visitante y usuario registrado, abrir registro, perfil y Comunidades; comprobar nombres, logos y que provincias archivadas/inactivas no aparezcan donde no corresponde. |
| FB-02 | Requiere consolidacion | `communities` tiene coordenadas, estado, imagen, grupo y FK valida a `provinces`; las policies respetan lectura publica y alcance dirigencial. | Probar registro, edicion de perfil, Mi Comunidad, comunidad cercana y panel diocesano con dos provincias; confirmar que no hay cruces territoriales. |
| FB-03 | Requiere observabilidad | `province_community_sections` existe para todas las provincias aplicables o la ausencia tiene semantica documentada; la consulta distingue fila ausente de error. | Probar provincia con configuracion, sin configuracion intencional y con acceso denegado; verificar que cada caso produce la visibilidad esperada y un diagnostico diferente. |
| FB-11 | Requiere consolidacion | `admin_update_community` tiene una unica firma con `p_group_type`, valida joven/adulto y guarda todos los campos atomica y autorizadamente. | Editar una comunidad joven y otra adulta como dirigente habilitado y administrador; recargar y comprobar grupo, provincia, imagen, coordenadas y estado. |
| FB-12 | Retirable pronto | `admin_create_province` remoto acepta `p_logo_url` anulable; Storage y edicion posterior del logo funcionan. | Crear una provincia sin logo y otra con logo; recargar listados, editar el logo y comprobar registro y creacion de comunidades. |
| FB-20 | Requiere consolidacion | Existe una RPC publica canonica para contacto que valida destino, completa territorio y tiene RLS/grants minimos; el insert directo deja de ser necesario. | Enviar consultas como visitante y usuario desde dos provincias; comprobar destinatario, comunidad, respuesta y que no se puedan forzar IDs fuera de alcance. |

Orden interno recomendado: FB-12, FB-03, FB-01, FB-02, FB-11, FB-20.

### 5.2 Noticias, contenido y navegacion

| ID | Estado | Precondicion para retirar | Prueba manual obligatoria |
| --- | --- | --- | --- |
| FB-04 | Retirable pronto | `news.image_url` existe en todos los entornos, es anulable y la API remota la devuelve sin error de cache. | Abrir noticias con imagen, sin imagen y lista vacia; refrescar como visitante y usuario. |
| FB-05 | Retirable pronto | `admin_update_news` tiene una unica firma con `p_image_url`; la ficha RPC coincide con la funcion desplegada. | Editar una noticia agregando, reemplazando y quitando imagen; recargar Home y Notilestra. |
| FB-06 | Retirable pronto | `admin_create_news` tiene una unica firma con `p_image_url` anulable y permisos administrativos comprobados. | Crear noticias con y sin imagen, verificar lectura publica/privada y posterior edicion. |
| FB-09 | Retirable pronto | `app_tabs.icon_name` y `section_type` existen, tienen defaults validos y todas las filas legacy fueron completadas. | Abrir todas las pestañas, editar icono/tipo, cambiar orden/visibilidad y restaurar defaults. |
| FB-19 | Mantener por compatibilidad | Cada pantalla candidata tiene contenido remoto publicado, estado vacio deliberado y el administrador ya no depende de `hiddenFallbackContent`; el retiro se divide por seccion. | Por cada seccion, probar contenido remoto, estado vacio, ocultamiento, visitante y usuario. Confirmar que Home, historia, agenda y contacto no quedan accidentalmente en blanco. |

Orden interno recomendado: FB-04, FB-05, FB-06, FB-09 y luego una issue
independiente por cada seccion de FB-19.

### 5.3 Publicaciones comunitarias

| ID | Estado | Precondicion para retirar | Prueba manual obligatoria |
| --- | --- | --- | --- |
| FB-07 | Requiere consolidacion | `get_my_community_publications` es la unica ruta, aplica alcance en backend y fue probada contra usuarios de comunidad, dirigentes diocesanos, nacionales y administrador. | Crear publicaciones en dos comunidades y dos provincias; verificar para cada rol que solo recibe su alcance y que una lista vacia valida no activa otra fuente. |
| FB-08 | Requiere consolidacion | La tabla tiene subtitulo, formato, imagen y enlace con nulabilidad definida; los datos legacy fueron normalizados y FB-07 ya usa el contrato canonico. | Crear y leer publicaciones con todos los campos y con opcionales vacios; comprobar orden, visibilidad, edicion y archivo en web y dispositivo. |

Retirar FB-07 antes que FB-08, salvo que una migracion atomica y sus pruebas
demuestren que ambas rutas son indivisibles.

### 5.4 Materiales y descargas

| ID | Estado | Precondicion para retirar | Prueba manual obligatoria |
| --- | --- | --- | --- |
| FB-10 | Requiere consolidacion | `admin_get_materials` diferencia error de lista vacia, devuelve ocultos/archivados segun permiso y es la unica ruta administrativa. | Probar administrador, dirigente y usuario comun con materiales visibles, ocultos, archivados y ninguna fila; descargar/abrir en Android. |
| FB-18 | Requiere observabilidad | `DownloadsAdminPanel` recibe estados separados de carga, error, vacio y contenido local; `length === 0` deja de indicar fallo. | Simular carga, error, lista remota vacia y lista con datos; comprobar que el contenido local solo aparece bajo una regla explicita y etiquetada. |

Resolver FB-18 antes de retirar FB-10 para que una falla de la RPC no se vea
como una lista legitima o como contenido compilado.

### 5.5 Usuarios, roles y operaciones administrativas

| ID | Estado | Precondicion para retirar | Prueba manual obligatoria |
| --- | --- | --- | --- |
| FB-13 | Requiere consolidacion | Rol y `subrole_key` se guardan en una RPC/transaccion canonica con autorizacion y rollback; no queda update directo parcial. | Cambiar rol y cada subrango permitido; provocar un valor invalido y confirmar que no se guarda parcialmente; revisar visibilidad externa del Administrador. |
| FB-14 | Requiere consolidacion | Se elige Edge Function o RPC como ruta canonica; ambas implementaciones fueron comparadas en autorizacion, `auth.users`, perfil, errores y auditoria. | Confirmar correo pendiente, ya confirmado e inexistente como administrador y no administrador; verificar estado tras cerrar y reabrir sesion. |
| FB-15 | Requiere consolidacion critica | Se documenta la diferencia entre liberar email y eliminar usuario; una sola operacion tiene semantica no ambigua, doble confirmacion y auditoria. | Probar usuario normal, registro incompleto, perfil huerfano, email reutilizable y usuario inexistente; confirmar exactamente que filas y credenciales sobreviven. |
| FB-16 | Requiere consolidacion critica | Se define si `role_permissions` reemplaza o complementa permisos base; todos los roles tienen filas completas y RLS aplica la seguridad real. | Recorrer visitante, palestrista, sedimentador, comunidad, diocesano, nacional, asesor y administrador; verificar UI y llamadas directas no autorizadas. |
| FB-24 | Mantener intencionalmente | Los defaults se limitan a campos visuales anulables y existe diagnostico para perfiles incompletos; ningun valor fallback decide permisos o territorio. | Abrir perfiles completos e incompletos; confirmar que los textos sustitutos no conceden acceso, rol, provincia ni comunidad. |

Orden interno recomendado: definir FB-16, consolidar FB-13 y FB-14, y dejar
FB-15 para una issue aislada con respaldo y auditoria explicita. FB-24 no se
elimina como parte de esta limpieza.

### 5.6 Configuracion de ejecucion

| ID | Estado | Precondicion para retirar | Prueba manual obligatoria |
| --- | --- | --- | --- |
| FB-17 | Requiere consolidacion critica | Existe la fila `default`, se distingue ausencia de error, hay observabilidad y se define una politica segura si no puede leerse mantenimiento o un flag critico. | Probar configuracion valida, fila ausente, JSON invalido, red desconectada y permiso denegado; confirmar conducta de mantenimiento y recuperacion. |
| FB-25 | Mantener intencionalmente | El merge profundo conserva compatibilidad de claves nuevas y solo completa configuracion, sin anular restricciones remotas. | Agregar una clave nueva, cargar configuracion parcial y comprobar que no se pierden valores existentes. |
| FB-28 | Mantener intencionalmente | `hasSupabaseConfig` impide usar credenciales ficticias como backend real y el error de configuracion es visible. | Iniciar sin variables y con variables validas; confirmar que el primer caso no realiza operaciones remotas. |

FB-17 puede reducirse, pero debe conservar un arranque controlado. FB-25 y FB-28
son defensas de compatibilidad, no candidatos de eliminacion.

### 5.7 PM, agenda y solicitudes administrativas

FB-22 agrupa varios loaders, incluyendo agenda, solicitudes, materiales y
contenido. No debe abrirse una unica issue para todo el ID.

| ID | Estado | Precondicion para retirar | Prueba manual obligatoria |
| --- | --- | --- | --- |
| FB-22 | Requiere observabilidad | Cada loader devuelve o mantiene por separado `loading`, `data`, `error` y motivo de ausencia; se inventarian primero sus funciones concretas. | Para cada loader, probar datos, vacio, permiso denegado, error de red y contrato remoto roto; verificar mensaje y diagnostico administrativo. |

Subdividir FB-22 por dominio en este orden: solicitudes/usuarios, materiales,
PM/agenda, contenido y configuracion no critica.

### 5.8 Foro, biblioteca, asesores, honor y consultas

| ID | Estado | Precondicion para retirar | Prueba manual obligatoria |
| --- | --- | --- | --- |
| FB-23 | Requiere observabilidad | `forum.ts`, `library.ts`, `community/advisors.ts`, `honorLevels.ts` y `queries/publicQueries.ts` adoptan un contrato de resultado comun o equivalente, sin convertir todo error en lista vacia. | Por modulo, probar datos, vacio, sin permiso y error; confirmar que la UI sigue estable y que el administrador puede identificar el origen. |

Dividir FB-23 en cinco issues independientes. La primera debe definir el patron
de resultado y las siguientes reutilizarlo sin alterar contratos de negocio.

### 5.9 Degradaciones transversales

| ID | Estado | Precondicion para retirar | Prueba manual obligatoria |
| --- | --- | --- | --- |
| FB-21 | Requiere observabilidad prioritaria | Comunidades, noticias y publicaciones exponen `data`, `error` y `source`; el ultimo origen exitoso es diagnosticable y una lista vacia valida no se trata como fallo. | Forzar exito primario, retry legacy, vacio y error total en cada modulo; comprobar que la pantalla y el panel administrativo distinguen los cuatro estados. |

FB-21 es una precondicion transversal para retirar FB-01, FB-02, FB-04, FB-07
y FB-08 con evidencia suficiente.

### 5.10 Integraciones y defaults que se conservan

| ID | Estado | Condicion de mantenimiento | Prueba de regresion |
| --- | --- | --- | --- |
| FB-26 | Mantener intencionalmente | Las fuentes catolicas externas siguen siendo opcionales y una caida no bloquea Home; se registra el origen que fallo. | Deshabilitar una fuente y luego todas; comprobar que Home abre y que el diagnostico conserva el error. |
| FB-27 | Mantener intencionalmente | Cache `daily_gospel` y Edge Function conservan semantica de cache/refresco; los errores no se presentan como evangelio actualizado. | Probar cache vigente, cache vencido con Edge disponible y Edge fallida; verificar fecha y fuente mostradas. |
| FB-29 | Mantener intencionalmente | Placeholders y textos por campos anulables no participan en permisos, identidad interna ni decisiones territoriales. | Revisar perfiles y cards sin imagen/contacto; confirmar accesibilidad visual y ausencia de cambios de autorizacion. |

## 6. Orden global recomendado

### Fase 0 - Observabilidad

1. FB-21.
2. FB-18.
3. FB-22, dividido por dominio.
4. FB-23, dividido por modulo.

Resultado exigido: errores, vacios y fallbacks tienen estados distinguibles.

### Fase 1 - Contratos acotados

1. FB-04.
2. FB-05.
3. FB-06.
4. FB-09.
5. FB-12.

Son los primeros candidatos de retiro real, siempre en commits separados.

### Fase 2 - Territorio y contenido estructural

1. FB-03.
2. FB-01.
3. FB-02.
4. FB-11.
5. FB-07.
6. FB-08.
7. FB-20.

No avanzar sin pruebas de alcance entre provincias y comunidades.

### Fase 3 - Materiales

1. FB-10, una vez resuelto FB-18.

### Fase 4 - Administracion y seguridad

1. Definir el contrato de FB-16.
2. FB-13.
3. FB-14.
4. FB-15 en aislamiento.
5. FB-17 con politica de fallo seguro.

Esta fase requiere pruebas negativas y revision de efectos remotos.

### Fase 5 - Contenido local

1. FB-19 por pantalla y nunca de forma global.

### Fase permanente - No retirar

Mantener FB-24, FB-25, FB-26, FB-27, FB-28 y FB-29 mientras sigan cumpliendo
las condiciones documentadas. Revisarlos periodicamente para asegurar que no
empiecen a ocultar datos obligatorios o errores criticos.

## 7. Candidatos inmediatos y bloqueados

### Pueden prepararse pronto

- FB-04: lectura de `news.image_url`.
- FB-05: firma de `admin_update_news`.
- FB-06: firma de `admin_create_news`.
- FB-09: columnas visuales de `app_tabs`.
- FB-12: logo anulable al crear provincias.

Esto significa que puede abrirse una issue individual de verificacion y retiro;
no significa que ya sea seguro borrar el codigo.

### Deben mantenerse por compatibilidad actual

- FB-19 hasta migrar contenido por pantalla.
- FB-24 mientras existan perfiles con campos visuales anulables.
- FB-25 a FB-29 por resiliencia y defaults intencionales.

### Bloqueados por alto riesgo

- FB-07 y FB-10 por rutas alternativas de acceso a datos.
- FB-13 a FB-17 por usuarios, permisos, operaciones destructivas y
  configuracion critica.
- FB-01, FB-02, FB-11 y FB-20 hasta validar territorio, RLS y contratos remotos.

## 8. Plantilla para cada retiro

```md
## Fallback
ID:
Archivo y funcion:
Comportamiento que se elimina:

## Contrato remoto verificado
- Entorno y fecha:
- Tabla/RPC/Edge Function:
- Firma o columnas:
- RLS/grants:
- Datos de prueba:

## Precondiciones
- [ ] Se cumplen las precondiciones especificas del plan.
- [ ] Existe estado visible para vacio y error.
- [ ] El cambio afecta un solo fallback.
- [ ] Rollback definido.

## Prueba manual
1. Caso con datos.
2. Caso vacio valido.
3. Caso sin permiso.
4. Caso de error.
5. Roles, territorios y dispositivo aplicables.

## Validacion
- [ ] `npm run typecheck`.
- [ ] Prueba manual completada.
- [ ] Sin cambios de contrato no documentados.
- [ ] Resultado registrado en la issue.
```

## 9. Criterio de cierre de la limpieza

La limpieza se considera completa cuando:

- no quedan retries por firmas o columnas historicas;
- las rutas administrativas y territoriales tienen una unica fuente autorizada;
- los errores no se convierten silenciosamente en listas vacias;
- el contenido local restante esta identificado como plantilla o resiliencia
  intencional;
- cada fallback conservado tiene motivo, prueba y responsable de revision;
- Supabase remoto, la documentacion versionada y el frontend comparten el mismo
  contrato observable.
