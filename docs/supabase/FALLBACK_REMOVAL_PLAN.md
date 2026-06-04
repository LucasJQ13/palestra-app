# Plan de eliminación gradual de fallbacks

## 1. Objetivo

Definir un plan seguro para reducir fallbacks del frontend una vez que Supabase esté documentado, alineado y probado.

Este documento no autoriza eliminar fallbacks inmediatamente. Define el orden y las condiciones mínimas para hacerlo sin romper la app.

## 2. Regla principal

No eliminar más de un fallback por cambio.

Cada eliminación debe tener:

- precondición clara,
- prueba manual,
- typecheck,
- posibilidad de rollback,
- confirmación de que Supabase real cumple el contrato.

## 3. Precondiciones generales

Antes de eliminar fallbacks se debe contar con:

1. `docs/supabase/SCHEMA_INVENTORY.md` completo.
2. `docs/supabase/CANONICAL_SCHEMA.md` revisado.
3. `docs/supabase/FALLBACK_AUDIT.md` revisado.
4. Export o snapshot de base actual.
5. Confirmación de columnas reales.
6. Confirmación de RPCs vigentes.
7. Confirmación de RLS/policies.
8. APK o entorno de prueba listo.
9. `npm run typecheck` pasando.

## 4. Orden recomendado

### Etapa 1 - Fallbacks de bajo riesgo

Pueden limpiarse primero si la base está alineada.

Ejemplos:

- fallback de icono inválido en navegación si ya hay validación admin,
- valores visuales default duplicados,
- fallback de textos institucionales ya migrados a `app_content`,
- fallback de fuentes externas opcionales si hay diagnóstico.

Prueba manual:

- abrir secciones públicas,
- verificar texto e imágenes,
- refrescar contenido,
- probar modo visitante.

### Etapa 2 - Configuración remota

Objetivo:

- diferenciar fallback normal de error real.

Precondición:

- `app_runtime_config` existe con fila `default`,
- `admin_config` o RPC equivalente responde correctamente,
- administrador puede ver última sincronización o estado.

Prueba manual:

- cambiar mensaje global,
- activar/desactivar feature flag no crítica,
- refrescar app,
- verificar que no cae silenciosamente al default.

### Etapa 3 - Comunidades y provincias

Precondición:

- `provinces` tiene ids, nombres y estado correctos,
- `communities` tiene `province_id`, nombre, grupo, estado y datos mínimos,
- `province_community_sections` está cargada,
- usuarios de prueba tienen provincia/comunidad válidas.

No eliminar fallback local de comunidades hasta que:

- registro liste provincias desde Supabase,
- pantalla Comunidades cargue desde Supabase,
- perfil resuelva comunidad correctamente,
- panel dirigencial no pierda alcance territorial.

Prueba manual:

- abrir Comunidades como visitante,
- registrar usuario seleccionando provincia/comunidad,
- ingresar como usuario aprobado,
- abrir Mi Comunidad,
- probar dirigente de comunidad,
- probar dirigente provincial.

### Etapa 4 - Noticias, eventos y PM

Precondición:

- `news`, `events` y `motivador_periods` tienen columnas completas,
- existen datos de prueba,
- reglas de visibilidad están claras,
- PM no depende de eventos fallback.

Prueba manual:

- abrir Notilestra,
- abrir agenda,
- abrir PM con rol suficiente,
- crear/editar noticia como admin,
- crear/editar PM como admin,
- probar visitante vs sedimentador.

### Etapa 5 - Materiales y Storage

Precondición:

- tabla `materials` tiene contrato estable,
- bucket `materials` tiene policies correctas,
- visibilidad por rol fue probada,
- descarga funciona en Android real.

Prueba manual:

- visitante ve solo material público,
- usuario interno ve material permitido,
- admin sube material,
- archivo se descarga/abre,
- material archivado deja de verse.

### Etapa 6 - Permisos dinámicos

Esta etapa es crítica.

No tocar hasta definir si permisos remotos:

- reemplazan permisos base,
- complementan permisos base,
- o son fuente única obligatoria.

Precondición:

- `role_permissions` completo para todos los roles,
- prueba de todos los roles principales,
- fallback base documentado.

Prueba manual:

- visitante,
- palestrista,
- sedimentador,
- animador/coordinador comunidad,
- vocal/coordinador diocesano,
- nacional,
- administrador.

### Etapa 7 - Perfil y usuarios

Última etapa por riesgo alto.

Precondición:

- `get_my_profile` consolidado,
- `admin_get_users` consolidado,
- `admin_update_user` consolidado,
- perfiles reales verificados,
- usuarios bloqueados, pendientes y aprobados probados.

Prueba manual:

- login usuario aprobado,
- login bloqueado,
- usuario pendiente,
- edición de perfil,
- aprobación de usuario,
- cambio de rol,
- cambio de comunidad,
- reparación/diagnóstico si aplica.

## 5. Formato de issue para eliminar un fallback

Cada issue futura debería tener este formato:

```md
## Objetivo
Eliminar un fallback específico ya cubierto por Supabase estable.

## Fallback a eliminar
Archivo:
Función:
Motivo original:

## Precondiciones verificadas
- [ ] Tabla/RPC verificada.
- [ ] Columnas esperadas existen.
- [ ] Datos de prueba existen.
- [ ] RLS/policies revisadas.
- [ ] QA manual definido.

## Cambio permitido
Eliminar solo este fallback.

## Prueba manual
1.
2.
3.

## Criterios de aceptación
- Typecheck OK.
- Flujo afectado probado.
- Sin cambios fuera de alcance.
```

## 6. Señales de que NO debe eliminarse un fallback

No eliminar si:

- no se conoce el estado real de Supabase,
- no hay datos de prueba,
- la función/RPC tiene versiones históricas sin consolidar,
- el fallback afecta login o usuarios,
- no hay prueba manual,
- el cambio exige tocar varios módulos a la vez,
- no se puede revertir fácilmente.

## 7. Conclusión

Los fallbacks no deben verse como basura a borrar, sino como muletas temporales.

La meta es retirarlas cuando la base pueda caminar sola: esquema estable, policies claras, RPCs consolidadas y pruebas reales.
