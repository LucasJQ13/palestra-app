# Prueba de migracion en staging

## 1. Estado

Fecha de revision: **14 de junio de 2026**.

Migracion candidata:

- `supabase/migrations/20260613210000_safe_schema_alignment.sql`

Decision actual: **PRUEBA BLOQUEADA - NO APTA PARA PRODUCCION**.

La migracion no fue ejecutada. No existe un entorno de prueba, copia o staging
configurado y restaurable que cumpla las precondiciones de la Issue 79.

No se modifico Supabase de produccion, no se ejecutaron migraciones, no se
modificaron datos, RLS, policies ni RPC, y no se compilo una APK.

## 2. Verificaciones de preparacion

| Requisito | Estado | Evidencia |
| --- | --- | --- |
| Proyecto Supabase de staging separado | No disponible | `app.json` contiene una sola URL Supabase, la misma usada por la app actual. No hay una segunda referencia de proyecto en el repo o variables de entorno. |
| Variables de entorno separadas | No disponible | No existen archivos `.env`; tampoco estan definidas `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF`, `EXPO_PUBLIC_SUPABASE_URL` o `SUPABASE_URL`. |
| Backup/export reciente | No disponible | No se encontro dump, snapshot o backup de esquema/datos fuera de la documentacion generada. |
| Datos representativos en staging | No verificable | No existe proyecto staging al cual consultar. |
| Rollback probado | No disponible | No hay backup restaurado ni entorno donde ensayar reversión. |
| App configurable contra staging | No preparada | La URL y clave publicable estan fijadas en `app.json`; no hay perfil staging ni override documentado. |
| Supabase local | No disponible | No existe `supabase/config.toml`; `supabase status` no encuentra stack local. |
| Docker local | No disponible | El comando `docker` no esta instalado o accesible en este equipo. |
| Acceso administrativo Supabase | No disponible | Supabase CLI no esta autenticado y no hay password de base. |

La unica configuracion remota disponible apunta al proyecto real. Usarla para
esta prueba violaria la regla principal de la Issue 79.

## 3. Dependencias revisadas

### Issue 77

`MIGRATION_REVIEW_20260613.md` concluye que el SQL es aditivo en su intencion,
pero no esta certificado para produccion sin export, comparacion y staging.

### Issue 78

`REMOTE_SCHEMA_COMPARISON_20260613.md` confirmo mediante APIs publicas que:

- las 21 tablas inventariadas existen;
- 67 de las 76 columnas propuestas ya existen;
- solo 9 columnas de la migracion faltan;
- hay sobrecargas RPC legacy y relaciones PostgREST ambiguas;
- tipos, defaults, indices, triggers, RLS, policies y grants no pudieron
  inspeccionarse sin acceso administrativo.

Por este resultado, incluso en staging no conviene aplicar a ciegas el archivo
completo. Primero debe obtenerse un dump y preparar una migracion ajustada.

## 4. Ejecucion de la migracion

| Paso | Resultado |
| --- | --- |
| Backup previo | No ejecutado: falta entorno y acceso administrativo |
| Restauracion en staging | No ejecutada: no existe staging |
| Aplicacion de migracion | No ejecutada |
| Consultas SQL posteriores | No ejecutadas |
| Medicion de bloqueos y tiempo | No ejecutada |
| Rollback | No ejecutado |

No se intento sustituir staging por produccion ni por una base local vacia. Una
base vacia no representaria las 67 columnas existentes, datos legacy, RPC,
policies y relaciones observadas en el proyecto real.

## 5. Pruebas funcionales

Ninguna prueba funcional posterior a migracion puede marcarse como aprobada
porque la migracion no fue aplicada fuera de produccion.

| Flujo | Resultado | Motivo |
| --- | --- | --- |
| Login | No ejecutado | Sin staging |
| Registro | No ejecutado | Sin staging |
| Perfil | No ejecutado | Sin staging |
| Provincias | No ejecutado | Sin staging |
| Comunidades | No ejecutado | Sin staging |
| Mi Comunidad | No ejecutado | Sin staging |
| Panel Comunitario | No ejecutado | Sin staging |
| Consultas | No ejecutado | Sin staging |
| Asesores comunitarios | No ejecutado | Sin staging |
| Noticias | No ejecutado | Sin staging |
| Materiales | No ejecutado | Sin staging |
| Descargas | No ejecutado | Sin staging |
| PM | No ejecutado | Sin staging |
| Buzon | No ejecutado | Sin staging |
| Busqueda global | No ejecutado | Sin staging |
| Modo oscuro | No ejecutado | Sin staging |
| Carga de imagenes | No ejecutado | Sin staging y sin Storage separado |

Estos estados significan "pendiente", no "fallido".

## 6. Verificaciones SQL pendientes

Las consultas de verificacion incluidas al final de la migracion no fueron
ejecutadas. Quedan pendientes:

- columnas y tipos resultantes;
- indices creados;
- coordenadas parciales;
- subrangos vacios;
- fila de configuracion runtime;
- conteos y checksums antes/despues;
- tiempos de bloqueo y tamaño de indices.

## 7. Preparacion requerida para desbloquear la prueba

### 7.1 Crear el entorno

1. Crear un proyecto Supabase separado para staging o disponer una copia
   controlada del proyecto.
2. Usar un nombre y referencia inequívocos que no puedan confundirse con
   produccion.
3. Registrar propietario, region y fecha de creacion.
4. No reutilizar service-role, secretos o credenciales de produccion.

### 7.2 Obtener y restaurar respaldo

1. Exportar esquema completo de produccion:
   tablas, tipos, funciones, vistas, triggers, policies, grants e indices.
2. Exportar datos necesarios para pruebas y anonimizarlos.
3. Restaurar en staging.
4. Comparar conteos por tabla y comprobar que no se copiaron secretos o datos
   personales innecesarios.
5. Ensayar una restauracion completa antes de aplicar la migracion.

### 7.3 Separar configuracion de la app

Preparar variables distintas para desarrollo/staging, como minimo:

- URL Supabase staging;
- clave publicable staging;
- URL de callback de autenticacion;
- configuracion de notificaciones y Edge Functions;
- identificacion visual o log que confirme el entorno activo.

No debe reemplazarse manualmente la URL productiva en un commit. La seleccion
de entorno debe ser explicita y reversible.

### 7.4 Ajustar la migracion candidata

Antes de probar:

1. comparar tipos y defaults de las 67 columnas existentes;
2. decidir las 9 columnas ausentes;
3. separar `profiles.deleted_at`, `profiles.updated_at` y
   `provinces.updated_at`;
4. revisar las 6 columnas anulables candidatas;
5. revisar los 8 indices contra indices equivalentes y volumen real;
6. agregar preflight que falle si falta una tabla o columna base;
7. crear una migracion minima nueva en lugar de asumir que el archivo completo
   sigue siendo el candidato correcto.

### 7.5 Preparar usuarios de prueba

Staging debe tener cuentas no reales para:

- visitante;
- usuario pendiente;
- palestrista aprobado;
- coordinador o animador comunitario;
- vocal o coordinador diocesano;
- rango nacional;
- administrador.

Cada rol debe incluir casos con y sin provincia, comunidad, imagen, subrango y
datos PM cuando corresponda.

## 8. Procedimiento de prueba cuando exista staging

1. Registrar referencia del proyecto y commit probado.
2. Guardar export previo y checksums.
3. Apuntar una instancia local de la app a staging.
4. Ejecutar preflight SQL de solo lectura.
5. Aplicar solo la migracion ajustada y revisada.
6. Ejecutar las verificaciones SQL posteriores.
7. Completar todos los flujos de la seccion 5.
8. Probar web y un dispositivo de desarrollo, sin compilar release.
9. Comparar logs, errores, conteos y tiempos.
10. Ejecutar y documentar rollback.
11. Repetir pruebas principales tras rollback.

## 9. Criterio para declarar apta la migracion

La decision solo puede cambiar a "apta para produccion" si:

- existe staging separado y restaurable;
- el backup y rollback fueron probados;
- la migracion final coincide con el dump real;
- todas las verificaciones SQL pasan;
- todos los flujos funcionales pasan;
- no hay regresiones de permisos, territorio, contenido o Storage;
- los fallos encontrados tienen issues separadas y estan resueltos;
- una revision humana aprueba expresamente el despliegue.

## 10. Rollback previsto

En esta etapa no existe un rollback ejecutable porque no hay entorno ni backup.

El rollback obligatorio para la futura prueba debe ser:

1. detener la app de staging;
2. restaurar el backup previo en un proyecto limpio o restaurable;
3. verificar conteos, funciones, policies e indices;
4. apuntar nuevamente la app al staging restaurado;
5. repetir login, perfil, comunidades y contenido;
6. conservar logs y tiempos de restauracion.

No se recomienda un rollback basado en `drop column`, porque puede ser mas
riesgoso que restaurar una copia verificada.

## 11. Decision

**NO APTA PARA PRODUCCION.**

La Issue 79 no puede cerrarse como completada porque no se cumplieron sus
criterios de aceptación: no existe un entorno de prueba y la migracion no fue
aplicada ni validada fuera de produccion.

El siguiente paso no es ejecutar SQL. Es crear y preparar staging con un backup
anonimizado y restaurable.
