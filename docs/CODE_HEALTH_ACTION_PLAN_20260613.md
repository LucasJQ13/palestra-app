# Plan de acción técnico - Palestra App

Fecha: 2026-06-13

## Objetivo

Ordenar la siguiente etapa de optimización técnica de la app sin romper la APK ni alterar flujos funcionales ya estables.

Este plan surge de revisar la estructura actual del repo, documentación técnica existente, `App.tsx`, `ProfileScreen.tsx`, Supabase, UI, navegación, fallbacks y workflow Android.

## Principio rector

No hacer una gran reescritura. La app se optimiza por tandas pequeñas, verificables y reversibles.

Regla obligatoria para cada tarea:

```text
Cambios pequeños → typecheck → prueba manual → reporte claro
```

## Hallazgos principales

1. `App.tsx` todavía concentra navegación, sesión, drawer, tema, deep links, búsqueda global, push, refresh y render de pantallas.
2. `ProfileScreen.tsx` concentra demasiadas herramientas internas y mantiene un estado muy grande con muchas responsabilidades de perfil, usuarios, QR, comunidad, materiales, noticias, PM, permisos y configuración.
3. `src/lib/profiles.ts` funciona como módulo gigante de RPC y operaciones administrativas.
4. Persisten loaders y consultas que devuelven listas vacías ante errores, lo que puede ocultar fallas reales.
5. Ya existe sistema de UI parcialmente centralizado, pero todavía hay botones y estilos locales dispersos.
6. El proyecto necesita una checklist QA estable antes de cada APK.
7. Los cambios de Supabase deben seguir el bloque de seguridad #77-#80 antes de tocar producción.

## Orden recomendado

1. Baseline de complejidad.
2. Reducción segura de `App.tsx`.
3. Reducción segura de `ProfileScreen.tsx`.
4. División gradual de `src/lib/profiles.ts`.
5. Observabilidad de fallbacks.
6. Permisos y matriz de roles.
7. QA y release checklist.
8. Mejoras de Storage, configuración remota y diagnóstico admin.

## Issues creadas desde este plan

- #81 - Code Health - Crear baseline de tamaño y complejidad de archivos críticos.
- #82 - Refactor - Reducir App.tsx extrayendo renderizado y navegación.
- #83 - Refactor - Extraer notificaciones, buzón flotante y efectos laterales de App.tsx.
- #84 - Refactor - Reducir ProfileScreen extrayendo lógica QR y credenciales.
- #85 - Refactor - Reducir ProfileScreen extrayendo administración de usuarios, roles y permisos.
- #86 - Refactor - Reducir ProfileScreen extrayendo paneles de contenido, materiales, PM y configuración.
- #87 - Refactor - Dividir src/lib/profiles.ts por dominios sin romper imports existentes.
- #88 - Data Safety - Estandarizar resultado de consultas críticas en remoteData.
- #89 - Data Safety - Aplicar patrón de resultado a módulos secundarios.
- #90 - Permissions - Crear matriz técnica de roles, subroles y permisos efectivos.
- #91 - QA - Crear checklist obligatoria antes de compilar o distribuir APK.
- #92 - Storage - Robustecer nombres de archivos subidos y política de limpieza.

## Restricción final

Ninguna issue de este plan debe modificar Supabase producción ni compilar APK salvo pedido explícito del usuario.
