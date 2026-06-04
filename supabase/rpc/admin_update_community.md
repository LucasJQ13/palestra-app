# RPC: admin_update_community

## Estado

Plantilla documental. No contiene SQL ejecutable.

## Propósito

Actualizar datos de una comunidad existente: nombre, provincia, grupo, dirección, contacto, horario, descripción, imagen, coordenadas, estado y datos visibles en la pantalla de Comunidades.

## Módulos afectados

- `src/lib/profiles.ts`
- `src/lib/remoteData.ts`
- `src/screens/ProfileScreen.tsx`
- Pantalla Comunidades
- Registro/onboarding
- Perfil/Mi Comunidad
- Panel dirigencial

## Parámetros esperados

Pendiente de confirmar contra SQL real vigente.

Posibles parámetros funcionales:

- id de comunidad.
- nombre.
- provincia o `province_id`.
- grupo/tipo de comunidad.
- dirección.
- teléfono/contacto.
- día de reunión.
- horario.
- descripción.
- imagen.
- latitud.
- longitud.
- estado activo/inactivo.

## Retorno esperado por frontend

Debe devolver resultado de actualización y, si es posible, la comunidad actualizada.

Campos funcionales esperados:

- `id`.
- `name`.
- `province` o `province_id`.
- `group_type`.
- `address`.
- `phone`.
- `meeting_day`.
- `meeting_time`.
- `description`.
- `image_url`.
- `latitude`.
- `longitude`.
- `is_active`.
- `archived_at`.

## Tablas relacionadas

- `communities`.
- `provinces`.
- `province_community_sections`.
- posibles tablas de auditoría.

## Permisos esperados

Reglas esperadas:

- Administrador puede editar todas las comunidades.
- Dirigente nacional puede editar según permisos nacionales.
- Dirigente provincial puede editar comunidades de su provincia.
- Dirigente comunitario puede editar solo su comunidad si está permitido.
- Usuario común no puede editar comunidades.
- Visitante no puede editar comunidades.

## Validaciones internas recomendadas

1. Usuario autenticado.
2. Perfil aprobado.
3. Rol o permiso suficiente.
4. Comunidad objetivo existe.
5. Provincia destino existe y está activa.
6. Actor tiene alcance sobre la provincia/comunidad.
7. No permitir duplicados peligrosos de nombre dentro de la misma provincia/grupo.
8. Registrar auditoría del cambio.

## Riesgo

Alto.

Errores posibles:

- comunidad movida a provincia incorrecta,
- usuario pierde Mi Comunidad,
- registro deja de listar comunidades,
- pantalla Comunidades queda incompleta,
- coordenadas o contacto se pierden,
- dirigente edita comunidad fuera de alcance.

## Historial / parches relacionados

Patches mencionados en auditoría:

- `patch_admin_community_rpc.sql`
- `patch_community_management_scope.sql`
- `patch_profile_cooldown_and_blocks.sql`
- `patch_news_scope_email_requests_community_coords.sql`
- `patch_community_images_dynamic_roles.sql`
- `patch_restore_communities_admin_management.sql`

Versión a respetar según auditoría:

- `patch_restore_communities_admin_management.sql` si la herramienta de Comunidades vuelve a fallar.

## Pruebas manuales mínimas

1. Admin edita comunidad y se refleja en pantalla pública.
2. Editar dirección/contacto/horario.
3. Editar imagen de comunidad.
4. Editar coordenadas y probar botón Maps si aplica.
5. Dirigente provincial edita comunidad de su provincia.
6. Dirigente provincial no puede editar otra provincia.
7. Usuario común no accede a edición.
8. Registro sigue listando provincia/comunidad correctamente.
9. Mi Comunidad sigue resolviendo la comunidad del usuario.

## Pendiente de completar

- Copiar SQL real vigente desde Supabase.
- Confirmar firma exacta.
- Confirmar retorno exacto.
- Confirmar validación territorial.
- Confirmar auditoría.
- Confirmar si usa `security definer`.
- Confirmar `set search_path = public`.
