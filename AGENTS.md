# AGENTS.md - Instrucciones para asistentes de IA

## 1. Contexto del proyecto

Este repositorio contiene `palestra-app`, una aplicación Expo + React Native + TypeScript para el movimiento católico Palestra en Argentina.

La app no es un prototipo simple. Actualmente incluye autenticación, perfiles, roles, permisos, comunidades, materiales, noticias, agenda, PM, intenciones, QR, notificaciones, configuración remota, panel dirigencial y contenido dinámico respaldado por Supabase.

Antes de modificar código, leer como mínimo:

- `README.md`
- `docs/BASELINE.md`
- `docs/QA_CHECKLIST.md`
- `docs/INFORME_PRESENTACION_APP.md`
- `docs/INCONSISTENCIAS_Y_RIESGOS.md`
- `docs/PLAN_CONTINUIDAD_SIN_PLUS.md`

Si el trabajo toca Supabase, leer también cualquier archivo existente en:

- `docs/supabase/`
- `supabase/`

## 2. Regla principal

No hacer cambios grandes sin necesidad.

Trabajar siempre con este criterio:

> Una issue concreta, un cambio chico, una verificación clara.

No reescribir archivos completos si alcanza con extraer una función, mover un bloque o corregir una parte puntual.

## 3. Comandos útiles

Instalar dependencias:

```bash
npm install
```

Correr chequeo TypeScript:

```bash
npm run typecheck
```

Iniciar Expo:

```bash
npm run start
```

Iniciar web local:

```bash
npm run local
```

No compilar APK salvo pedido explícito del usuario.

## 4. Restricciones importantes

No hacer estas acciones salvo que la issue lo pida explícitamente:

- No compilar APK.
- No ejecutar migraciones SQL contra Supabase.
- No borrar tablas, columnas ni datos.
- No cambiar nombres de tablas o columnas.
- No modificar `app.json` sin explicar impacto en build, deep links y notificaciones.
- No modificar roles o permisos sin auditar consecuencias.
- No eliminar fallbacks de Supabase sin verificar que la base real ya cumple el contrato.
- No cambiar `authDeepLinkBaseUrl` sin probar APK real.
- No actualizar muchas dependencias juntas.
- No introducir librerías nuevas sin justificación fuerte.
- No reemplazar la navegación actual por otra librería.

## 5. Archivos sensibles

Tratar con especial cuidado:

- `App.tsx`
- `src/screens/ProfileScreen.tsx`
- `src/lib/profiles.ts`
- `src/lib/remoteData.ts`
- `src/lib/authProfile.ts`
- `src/lib/permissions.ts`
- `src/lib/sessionAccess.ts`
- `src/lib/roles.ts`
- `src/lib/supabase.ts`
- `src/lib/runtimeConfig.ts`
- `app.json`
- `eas.json`

Estos archivos concentran lógica de sesión, permisos, Supabase, navegación, panel dirigencial, deep links, build o configuración remota.

## 6. Supabase

La seguridad real no debe depender del frontend.

Si una tarea toca Supabase:

1. Identificar tablas afectadas.
2. Identificar RPCs afectadas.
3. Identificar columnas esperadas por el frontend.
4. Identificar roles que leen o modifican esos datos.
5. Verificar si hay fallback existente.
6. Documentar riesgos antes de cambiar.
7. No ejecutar SQL destructivo.

Migraciones permitidas solo si la issue lo pide y deben ser no destructivas por defecto:

- `create table if not exists`
- `alter table add column if not exists`
- `create index if not exists`
- `create or replace function`

Evitar sin aprobación explícita:

- `drop table`
- `drop column`
- `truncate`
- cambios de tipo sobre columnas con datos
- renombres de columnas usadas por el frontend

## 7. Fallbacks

El proyecto tiene lógica de compatibilidad para tolerar diferencias de esquema en Supabase.

No eliminar fallbacks solo porque parecen redundantes.

Antes de eliminar uno:

1. Documentar qué problema cubre.
2. Verificar que la base real ya tiene la estructura esperada.
3. Crear prueba manual.
4. Eliminar solo ese fallback.
5. Correr `npm run typecheck`.
6. Probar el flujo afectado.

## 8. Roles y permisos

La app usa roles jerárquicos y permisos dinámicos.

Antes de cambiar permisos, revisar:

- `src/types/auth.ts`
- `src/lib/roles.ts`
- `src/lib/permissions.ts`
- `src/lib/sessionAccess.ts`
- funciones RPC relacionadas con perfiles y permisos

No asumir que ocultar un botón en frontend alcanza como seguridad.

Toda acción sensible debe validarse también en Supabase.

## 9. Deep links y autenticación

La app usa:

```text
palestra://auth/callback
```

Este flujo depende de:

- `app.json`
- `src/lib/constants.ts`
- `App.tsx`
- `src/screens/auth/AuthFlow.tsx`
- configuración externa de Supabase Auth
- APK instalada real

No modificar este flujo sin prueba manual en Android.

## 10. Notificaciones

Las notificaciones dependen de Expo, EAS, Android, permisos del dispositivo, token push y configuración externa.

No mostrar éxito falso al usuario si solo se creó una intención pero no se verificó entrega real.

Separar mentalmente:

- permiso local concedido
- token generado
- token guardado
- intención creada
- push enviado
- push recibido

## 11. Estilo de trabajo recomendado

Para cada issue:

1. Leer la issue completa.
2. Identificar archivos a tocar.
3. Explicar plan antes de editar.
4. Hacer el cambio mínimo.
5. Correr `npm run typecheck` si el entorno lo permite.
6. Indicar pruebas manuales.
7. Informar archivos modificados.
8. Informar riesgos o pendientes.

## 12. Criterios de aceptación generales

Un cambio es aceptable si:

- responde a una issue concreta,
- toca pocos archivos,
- mantiene comportamiento existente salvo que la issue pida cambiarlo,
- no rompe typecheck,
- tiene prueba manual clara,
- no modifica Supabase sin documentación,
- no cambia permisos sin auditoría,
- no elimina compatibilidad sin plan,
- puede revertirse fácilmente.

## 13. Qué hacer si aparece un error

No adivinar ni aplicar cambios grandes.

Primero clasificar el error:

- TypeScript.
- Dependencias.
- Expo.
- Android/build.
- Supabase.
- Auth/deep link.
- Permisos/roles.
- Notificaciones.
- UI/layout.

Después proponer la corrección mínima.

## 14. Orden sugerido de trabajo

Prioridad documental y seguridad:

1. Mantener actualizado `docs/BASELINE.md`.
2. Mantener actualizado `docs/QA_CHECKLIST.md`.
3. Completar documentación Supabase.
4. Auditar permisos.
5. Recién después modularizar.

Prioridad técnica:

1. Extraer lógica de `App.tsx` por hooks pequeños.
2. Extraer componentes visuales grandes.
3. Dividir `ProfileScreen.tsx` por paneles.
4. Limpiar imports.
5. Eliminar fallbacks solo después de estabilizar Supabase.

## 15. Reporte final esperado

Al terminar una tarea, responder con este formato:

```text
Resumen:
- ...

Archivos modificados:
- ...

Validación:
- npm run typecheck: OK / No ejecutado / Falló
- Pruebas manuales sugeridas: ...

Riesgos o pendientes:
- ...
```

## 16. Nota final

La prioridad del proyecto es conservar lo que ya funciona y hacerlo más mantenible.

No buscar una app más elegante a costa de romper flujos reales.

Primero estabilidad, después modularización, después nuevas funciones.
