# Auditoría de fallbacks Supabase

## 1. Objetivo

Identificar patrones de compatibilidad, degradación silenciosa y fallbacks usados por el frontend para tolerar diferencias entre el esquema esperado y el esquema real de Supabase.

Este documento no elimina fallbacks. Solo los registra y propone una estrategia gradual para reemplazarlos por un esquema estable.

## 2. Por qué existen fallbacks

Durante el crecimiento de la app se agregaron columnas, RPCs, tablas, buckets y módulos nuevos mediante parches progresivos.

Los fallbacks permitieron que la app siguiera funcionando aunque:

- una columna todavía no existiera,
- una tabla estuviera incompleta,
- una RPC devolviera un formato anterior,
- un bucket no tuviera policy lista,
- una configuración remota no estuviera cargada,
- una fuente externa fallara.

Eso fue útil para avanzar rápido, pero en etapa de consolidación puede ocultar errores reales.

## 3. Tipos de fallback detectados

### 3.1 Fallback por consulta reducida

Patrón:

1. Se consulta una tabla con columnas nuevas.
2. Si falla por columna inexistente, se reintenta con menos columnas.
3. La app sigue funcionando con datos parciales.

Riesgo:

- La base puede parecer estable aunque le falten columnas.
- La UI puede mostrar contenido incompleto.
- El error real queda oculto.

Módulos donde puede aparecer:

- Comunidades.
- Noticias.
- Provincias.
- Contenido dinámico.
- Materiales.

### 3.2 Fallback a datos locales

Patrón:

1. Se intenta cargar información remota.
2. Si no hay datos, se usan datos de `src/data/content.ts` o valores internos.

Riesgo:

- El usuario puede ver información vieja.
- El administrador puede creer que modificó datos en Supabase, pero la app muestra fallback.
- Puede haber diferencias entre web/local/APK.

Módulos afectados:

- Comunidades.
- Contenido institucional.
- Contacto.
- Oraciones.
- Historia.
- Cancionero.

### 3.3 Fallback a configuración por defecto

Patrón:

1. Se consulta configuración remota.
2. Si falla o no existe, se usa configuración local default.

Riesgo:

- Modo mantenimiento puede no aplicarse.
- Feature flags pueden quedar activas/desactivadas incorrectamente.
- Mensajes globales pueden no aparecer.
- Administradores no detectan que la carga remota falló.

Módulo principal:

- `app_runtime_config`.
- `admin_config`.

### 3.4 Fallback de permisos

Patrón:

1. Se consultan permisos remotos en `role_permissions`.
2. Si falla, se usan permisos base definidos en el frontend.

Riesgo:

- Si la tabla remota está incompleta, puede bloquear funciones.
- Si falla la consulta, puede permitir permisos base no alineados con Supabase.
- Puede haber diferencia entre seguridad visual y seguridad real.

Módulos afectados:

- Panel dirigencial.
- Materiales.
- Contenido editable.
- Usuarios.
- Roles.

### 3.5 Fallback por errores silenciosos

Patrón:

1. Una fuente externa, RPC o consulta falla.
2. El catch devuelve arreglo vacío, configuración default o mensaje genérico.

Riesgo:

- No se distingue entre “no hay datos” y “falló la consulta”.
- El administrador no puede diagnosticar.
- Los usuarios ven secciones vacías sin explicación.

Módulos afectados:

- Noticias católicas externas.
- Evangelio diario.
- Notificaciones.
- Comunidades.
- Biblioteca.

## 4. Fallbacks prioritarios a revisar

### 4.1 Comunidades y provincias

Riesgo: alto.

Motivo:

- La app usa comunidades para navegación, registro, perfil, permisos territoriales y panel dirigencial.
- Hay dependencia de nombres de provincia y comunidad.
- Conviene migrar hacia ids estables.

Acción recomendada:

- Verificar columnas reales de `provinces`, `communities`, `province_community_sections`.
- Asegurar `logo_url`, `is_active`, `archived_at`, `latitude`, `longitude`.
- Mantener fallback local hasta completar migración.

### 4.2 Perfil y usuarios

Riesgo: crítico.

Motivo:

- `get_my_profile`, `admin_get_users` y `admin_update_user` tienen historial de múltiples redefiniciones.
- El login depende del perfil extendido.
- Un cambio puede bloquear acceso a usuarios reales.

Acción recomendada:

- Consolidar versión vigente de RPCs críticas.
- Documentar retorno exacto de cada RPC.
- No eliminar compatibilidad hasta probar usuarios reales.

### 4.3 Permisos dinámicos

Riesgo: crítico.

Motivo:

- `role_permissions` puede reemplazar los permisos base del frontend.
- Una tabla incompleta puede generar perfiles sin accesos.

Acción recomendada:

- Definir si permisos remotos reemplazan o complementan permisos base.
- Auditar tabla remota.
- Probar todos los roles principales.

### 4.4 App runtime config

Riesgo: medio/alto.

Motivo:

- Si falla la carga, la app usa defaults sin alertar claramente.
- Puede ocultar fallas de mantenimiento, flags o mensajes globales.

Acción recomendada:

- Agregar diagnóstico administrativo futuro.
- Registrar última carga correcta.
- Diferenciar “no configurado” de “falló Supabase”.

### 4.5 Materiales y Storage

Riesgo: alto.

Motivo:

- Depende de tabla, bucket, URL/path, visibilidad y permisos.
- Puede funcionar para admins y fallar para usuarios comunes por policies.

Acción recomendada:

- Auditar bucket `materials`.
- Definir visibilidad por rol.
- Verificar descarga en APK real.

### 4.6 Noticias, eventos y PM

Riesgo: medio/alto.

Motivo:

- Notilestra, agenda y PM mezclan contenido dinámico, eventos y motivador periods.
- Si una fuente falla, pueden quedar feeds vacíos o duplicados.

Acción recomendada:

- Consolidar contrato de `news`, `events`, `motivador_periods`.
- Definir campos obligatorios mínimos.
- Documentar reglas de visibilidad.

## 5. Clasificación de fallbacks

### Seguros de mantener

- Noticias externas opcionales.
- Evangelio diario si falla fuente externa.
- Configuración visual default.
- Datos locales de presentación pública mientras no haya carga remota definitiva.

### Moderados

- Comunidades locales como respaldo.
- Configuración remota default sin diagnóstico.
- Materiales vacíos si falla Supabase.
- Agenda vacía si falla consulta.

### Riesgosos

- Permisos base reemplazando permisos remotos sin política clara.
- RPCs administrativas con versiones históricas.
- Perfil creado parcialmente.
- Usuarios sin provincia/comunidad válidas.
- Fallbacks que esconden columnas faltantes en tablas críticas.

## 6. Estrategia de eliminación gradual

No eliminar fallbacks directamente.

Orden recomendado:

1. Documentar esquema real.
2. Crear esquema canónico.
3. Crear migración no destructiva para columnas faltantes.
4. Probar APK con base alineada.
5. Eliminar un fallback de bajo riesgo.
6. Probar flujo afectado.
7. Repetir.

## 7. Criterios para eliminar un fallback

Un fallback puede eliminarse solo si:

- La tabla o RPC real fue verificada.
- La columna o retorno esperado existe.
- Hay datos reales de prueba.
- Hay prueba manual documentada.
- `npm run typecheck` pasa.
- Se puede revertir el cambio fácilmente.
- El usuario aprueba tocar ese módulo.

## 8. Conclusión

Los fallbacks actuales son una señal de que la app evolucionó rápido. No son necesariamente errores, pero sí deuda técnica.

La prioridad es convertirlos en una lista controlada y luego eliminarlos por fases, nunca de golpe.
