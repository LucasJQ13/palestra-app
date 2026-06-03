# Plan de continuidad sin Plus ni Codex - Palestra App

## 1. Objetivo

Este documento deja ordenado cómo continuar el proyecto Palestra App aunque no haya acceso inmediato a ChatGPT Plus, Codex o asistentes con capacidad de modificar código directamente.

La idea es que el proyecto no quede frenado ni dependa de memoria personal. Todo debe quedar suficientemente claro para que Lucas, otro asistente de IA, un desarrollador externo o una versión futura de Codex puedan retomar el trabajo sin romper la app.

## 2. Estado actual del proyecto

La app ya cuenta con documentación importante creada en la carpeta `docs`:

- `INFORME_PRESENTACION_APP.md`: presentación general de la app.
- `INCONSISTENCIAS_Y_RIESGOS.md`: riesgos técnicos e inconsistencias detectadas.
- `PROYECCION_FUTURA_Y_HERRAMIENTAS.md`: visión futura y posibles herramientas.

Además, el README fue actualizado para reflejar el estado real del proyecto.

También existen issues ordenadas por fases para optimizar frontend, Supabase, documentación y flujo de trabajo.

## 3. Principio principal

No intentar arreglar todo junto.

La app ya tiene muchas funciones. El mayor riesgo no es que falten ideas, sino tocar demasiado y romper lo que ya funciona.

La regla de oro es:

> Una tarea chica, un cambio verificable, una prueba concreta.

## 4. Orden recomendado de trabajo

### Bloque A - Documentar y proteger el proyecto

Estas tareas no deberían romper nada porque son de documentación o inventario.

1. Issue #2 - Registrar estado técnico actual antes de modificar.
2. Issue #3 - Actualizar README con estado real del proyecto.
3. Issue #4 - Documentar contrato Supabase usado por la app.
4. Issue #5 - Crear checklist manual de pruebas para beta APK.
5. Issue #19 - Agregar guía de trabajo para asistentes de IA.

Si todavía no están completas, estas son prioridad absoluta.

### Bloque B - Ordenar Supabase antes de tocar lógica sensible

Estas tareas son clave para dejar de emparchar la app.

1. Issue #20 - Inventariar esquema real de base de datos.
2. Issue #21 - Diseñar esquema canónico y plan de migración.
3. Issue #22 - Crear carpeta de migraciones versionadas.
4. Issue #23 - Auditar consultas con fallback.
5. Issue #25 - Auditar reglas de acceso por tabla y rol.
6. Issue #26 - Versionar funciones remotas usadas por la app.
7. Issue #24 - Crear migración inicial de alineación segura.
8. Issue #27 - Crear plan para eliminar fallbacks del frontend.

Importante: no ejecutar migraciones reales sin backup y revisión manual.

### Bloque C - Modularizar App.tsx sin cambiar comportamiento

Estas tareas reducen riesgo futuro.

1. Issue #6 - Extraer lógica de tema y preferencias.
2. Issue #7 - Extraer lógica de puntero táctil.
3. Issue #8 - Extraer carga inicial y refresh de contenido.
4. Issue #9 - Extraer manejo de sesión y enlaces internos.
5. Issue #10 - Extraer búsqueda global.
6. Issue #11 - Extraer navegación local e historial.
7. Issue #12 - Extraer Drawer principal.
8. Issue #13 - Extraer modal de búsqueda global.

Regla: cada extracción debe mantener la app igual visual y funcionalmente.

### Bloque D - Modularizar ProfileScreen.tsx

1. Issue #14 - Dividir ProfileScreen por paneles sin cambiar comportamiento.
2. Issue #15 - Centralizar mensajes de error y éxito reutilizables.
3. Issue #18 - Revisar y limpiar imports no usados.

Esta etapa debe hacerse con mucho cuidado porque `ProfileScreen.tsx` concentra perfil, panel dirigencial, usuarios, permisos, comunidades y QR.

## 5. Qué puede hacer Lucas sin Codex

Aunque no haya Codex, Lucas puede avanzar en tareas importantes:

### Desde GitHub

- Leer issues.
- Ordenar prioridades.
- Agregar comentarios a cada issue con observaciones.
- Marcar cuáles son urgentes.
- Copiar una issue y pegarla a otro asistente de IA.
- Pedirle a una IA que genere cambios puntuales para copiar manualmente.

### Desde la PC

- Ejecutar `npm install`.
- Ejecutar `npm run typecheck`.
- Ejecutar `npm run start`.
- Probar la app en web o Android.
- Sacar captura de errores.
- Pegar errores a una IA para análisis.

### Desde Supabase

- Revisar tablas.
- Exportar estructura.
- Copiar funciones SQL.
- Revisar políticas de acceso.
- No ejecutar migraciones destructivas sin backup.

### Desde Android

- Probar APK.
- Probar registro.
- Probar login.
- Probar confirmación por enlace.
- Probar perfil.
- Probar permisos.
- Probar notificaciones.
- Probar navegación.

## 6. Qué NO conviene hacer sin asistencia fuerte

Evitar:

- Reescribir `App.tsx` completo.
- Reescribir `ProfileScreen.tsx` completo.
- Cambiar roles y permisos sin auditoría.
- Borrar fallbacks de Supabase sin verificar la base.
- Cambiar nombres de tablas o columnas.
- Cambiar deep links sin probar APK real.
- Cambiar `app.json` sin entender impacto en build.
- Actualizar muchas dependencias juntas.
- Ejecutar SQL destructivo.
- Compilar APK sin antes correr typecheck y checklist.

## 7. Prompts útiles para usar con otra IA

### Prompt para trabajar una issue

```text
Voy a pasarte una issue de GitHub de mi app Expo React Native con Supabase. Necesito que trabajes solo sobre esa issue, sin resolver cosas fuera de alcance. Primero explícame qué archivos tocarías y por qué. Después dame un plan paso a paso. No reescribas archivos completos salvo que sea imprescindible. Mantén el comportamiento actual. Al final indica cómo probar manualmente y qué comando correr.

Issue:
[PEGAR ISSUE COMPLETA]
```

### Prompt para revisar un error

```text
Estoy trabajando en una app Expo React Native con TypeScript y Supabase. Corrí este comando y apareció este error. Analiza la causa probable, dime si es error de código, dependencia, configuración o Supabase. No propongas cambios grandes. Dame la corrección mínima y cómo verificarla.

Comando:
[PEGAR COMANDO]

Error:
[PEGAR ERROR]
```

### Prompt para modificar código manualmente

```text
Necesito modificar manualmente un archivo de mi app. Dame instrucciones exactas: archivo, función, bloque a buscar, qué reemplazar y por qué. No me des un refactor completo. Quiero el cambio mínimo para resolver esta issue.

Issue:
[PEGAR ISSUE]

Archivo actual:
[PEGAR BLOQUE DEL ARCHIVO]
```

### Prompt para Supabase

```text
Estoy ordenando Supabase para una app React Native. No quiero ejecutar SQL todavía. Necesito que analices este uso del frontend y me digas qué tabla, columnas, relaciones, índices, políticas y funciones remotas debería documentar. Separa estado actual, riesgos y esquema recomendado.

Código o consulta:
[PEGAR CÓDIGO]
```

### Prompt para revisión antes de aplicar un cambio

```text
Revisa este cambio antes de que lo aplique. Dime si puede romper login, navegación, permisos, Supabase, notificaciones, deep links o build Android. Sé crítico. Si ves riesgo, propone una alternativa más segura.

Cambio propuesto:
[PEGAR CAMBIO]
```

## 8. Checklist mínima antes de aceptar un cambio

Antes de aceptar cualquier modificación:

1. ¿La tarea corresponde a una issue concreta?
2. ¿El cambio toca pocos archivos?
3. ¿Se entiende qué comportamiento mantiene?
4. ¿Se corrió o se puede correr `npm run typecheck`?
5. ¿Hay prueba manual clara?
6. ¿No toca Supabase sin documentación?
7. ¿No cambia permisos sin auditoría?
8. ¿No elimina fallbacks sin plan?
9. ¿No cambia deep links sin probar APK?
10. ¿Se puede revertir fácilmente?

Si alguna respuesta es no, conviene frenar.

## 9. Checklist mínima antes de compilar APK

Antes de compilar:

1. `npm install` sin errores críticos.
2. `npm run typecheck` revisado.
3. App inicia con `npm run start`.
4. Inicio carga correctamente.
5. Drawer abre y cierra.
6. Navegación básica funciona.
7. Login funciona.
8. Registro funciona o se conoce su estado.
9. Perfil carga.
10. Usuario aprobado ve contenido privado.
11. Invitado no ve contenido privado.
12. Comunidades cargan.
13. Materiales cargan.
14. Notilestra carga.
15. No hay pantalla blanca.
16. No hay bucle de navegación.
17. Deep link probado si se tocó autenticación.
18. Notificaciones probadas si se tocó ese módulo.

## 10. Qué pedirle a un desarrollador externo

Si se contrata o consulta a alguien, no pedir “arreglar toda la app”.

Pedir una de estas tareas:

- Ejecutar baseline técnico.
- Documentar Supabase.
- Crear migraciones versionadas.
- Refactorizar solo App.tsx fase por fase.
- Refactorizar solo ProfileScreen.tsx por paneles.
- Auditar permisos.
- Probar APK y generar reporte.

Una tarea grande debe dividirse en PRs chicos.

## 11. Prioridad máxima si hay poco tiempo

Si queda muy poco tiempo, el orden más valioso es:

1. Completar `docs/QA_CHECKLIST.md`.
2. Completar `docs/supabase/SCHEMA_INVENTORY.md`.
3. Crear `AGENTS.md` o `docs/AI_WORKFLOW.md`.
4. Ejecutar `npm run typecheck` y guardar resultado en `docs/BASELINE.md`.
5. Crear backup/export de Supabase.
6. Guardar capturas o notas de flujos que hoy funcionan.

Eso deja el proyecto retomable.

## 12. Conclusión

La app no está perdida si se acaba Plus o Codex. Lo importante es que el conocimiento del proyecto quede en la repo y no solo en conversaciones.

La mejor estrategia es:

- documentar
- auditar
- ordenar issues
- evitar cambios gigantes
- probar manualmente
- avanzar por fases

Palestra App ya tiene una base muy potente. Ahora necesita disciplina técnica para que pueda seguir creciendo sin romper lo construido.
