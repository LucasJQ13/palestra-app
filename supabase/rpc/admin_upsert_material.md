# RPC: admin_upsert_material

## Estado

Plantilla documental. No contiene SQL ejecutable.

## Propósito

Crear o actualizar materiales descargables o consultables dentro de Palestra App.

Esta RPC sostiene la sección de Materiales/Descargas y puede afectar recursos públicos, internos o exclusivos por rol.

## Módulos afectados

- `src/lib/profiles.ts`
- `src/screens/MaterialsScreen.tsx`
- `src/screens/ProfileScreen.tsx`
- Storage bucket `materials`
- permisos de descarga y administración

## Parámetros esperados

Pendiente de confirmar contra SQL real vigente.

Posibles parámetros funcionales:

- id de material, si se actualiza.
- título.
- descripción.
- categoría.
- visibilidad.
- permiso requerido.
- URL o path de archivo.
- imagen opcional.
- orden.
- provincia/comunidad si aplica.
- estado activo/archivado.

## Retorno esperado por frontend

Debe devolver resultado de creación/actualización y, si es posible, el material actualizado.

Campos funcionales esperados:

- `id`.
- `title`.
- `description`.
- `category`.
- `visibility`.
- `required_permission`.
- `file_url` o `storage_path`.
- `image_url`.
- `sort_order`.
- `archived_at`.

## Tablas relacionadas

- `materials`.
- posibles tablas de auditoría.
- Storage `materials`.

## Permisos esperados

Reglas esperadas:

- Administrador puede crear/editar todos los materiales.
- Dirigente nacional puede gestionar materiales si tiene permiso.
- Dirigente provincial puede gestionar materiales de su alcance si está permitido.
- Dirigente comunitario solo si hay permiso específico.
- Usuario común no puede crear ni editar materiales.
- Visitante no puede crear ni editar materiales.

## Validaciones internas recomendadas

1. Usuario autenticado.
2. Perfil aprobado.
3. Permiso para gestionar contenido/materiales.
4. Validar visibilidad permitida.
5. Validar que archivo o URL sea coherente.
6. Validar alcance territorial si aplica.
7. Registrar auditoría.

## Riesgo

Alto.

Errores posibles:

- exposición de material interno a visitantes,
- bloqueo de materiales para usuarios correctos,
- subida de archivo aceptada por UI pero rechazada por Storage,
- pérdida de referencias a archivos,
- materiales archivados visibles,
- permisos distintos entre tabla y bucket.

## Historial / parches relacionados

Patches mencionados:

- `patch_beta_baseline.sql`
- `patch_admin_persistence_config_materials_drafts.sql`
- `patch_material_author_editing.sql`
- `patch_material_upload_permissions_fix.sql`

Versión a respetar según auditoría:

- `patch_material_upload_permissions_fix.sql`.

## Pruebas manuales mínimas

1. Admin crea material público.
2. Visitante puede ver solo material público.
3. Usuario interno ve material permitido.
4. Admin crea material interno/exclusivo.
5. Usuario sin permiso no ve material restringido.
6. Subida/descarga de archivo funciona en Android real.
7. Archivado oculta material.
8. No aparece mensaje de éxito falso si Storage falla.

## Pendiente de completar

- Copiar SQL real vigente desde Supabase.
- Confirmar firma exacta.
- Confirmar retorno exacto.
- Confirmar relación con Storage.
- Confirmar policies de bucket `materials`.
- Confirmar auditoría.
- Confirmar si usa `security definer`.
- Confirmar `set search_path = public`.
