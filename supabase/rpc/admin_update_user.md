# RPC: admin_update_user

## Estado

Plantilla documental. No contiene SQL ejecutable.

## Propósito

Actualizar datos administrativos de un usuario: rol, estado, provincia, comunidad, etiquetas o datos de perfil según permisos del operador.

Es una de las RPC más sensibles del proyecto porque puede cambiar accesos reales dentro de la app.

## Módulos afectados

- `src/lib/profiles.ts`
- `src/screens/ProfileScreen.tsx`
- Panel dirigencial
- Gestión de usuarios
- Roles y permisos
- Comunidades y provincias

## Parámetros esperados

Pendiente de confirmar contra SQL real vigente.

Posibles parámetros funcionales:

- id del usuario objetivo.
- nuevo estado.
- nuevo rol.
- provincia.
- comunidad.
- subrol o etiqueta visible.
- datos de perfil editables.
- motivo o comentario administrativo.

## Retorno esperado por frontend

Resultado de actualización.

Idealmente debería devolver:

- éxito/error.
- usuario actualizado.
- mensaje legible.
- datos mínimos para refrescar panel.

## Tablas relacionadas

- `profiles`.
- `role_permissions`.
- `provinces`.
- `communities`.
- posibles tablas de auditoría.
- `auth.users` solo si la función toca datos de Auth, lo cual debe estar extremadamente controlado.

## Permisos esperados

Debe validar internamente:

- quién llama,
- qué rol tiene,
- qué alcance territorial tiene,
- qué rol intenta modificar,
- si intenta editar a alguien superior,
- si intenta editarse a sí mismo,
- si intenta asignar un rol no permitido.

Reglas esperadas:

- Administrador puede modificar con mayor alcance, salvo restricciones internas definidas.
- Dirigente nacional puede modificar dentro de alcance nacional si tiene permiso.
- Dirigente provincial solo dentro de su provincia.
- Dirigente comunitario solo dentro de su comunidad si aplica.
- Usuario común no puede modificar usuarios.

## Validaciones internas recomendadas

1. `auth.uid()` existe.
2. Perfil del actor existe y está aprobado.
3. Actor tiene permiso administrativo.
4. Usuario objetivo existe.
5. Actor no modifica rol superior sin permiso.
6. Actor no asigna rol fuera de su alcance.
7. Provincia/comunidad destino existen y están activas.
8. Cambio queda registrado en auditoría.

## Riesgo

Crítico.

Errores posibles:

- escalamiento indebido de rol,
- dirigente editando otra provincia,
- usuario común accediendo por RPC,
- pérdida de comunidad/provincia,
- bloqueo accidental de administradores,
- inconsistencia entre Auth y `profiles`.

## Historial / parches relacionados

Según auditoría previa, esta RPC fue redefinida muchas veces.

Patches mencionados:

- `patch_admin_users.sql`
- `patch_beta_functional_stability.sql`
- `patch_critical_role_hierarchy.sql`
- `patch_beta_user_role_management.sql`
- `patch_national_coordinator_replacement.sql`
- `patch_structural_admin_coherence.sql`
- `patch_requests_and_admin_auth.sql`
- `patch_mobile_errors_and_request_roles.sql`
- `patch_community_images_dynamic_roles.sql`

Versión actual:

- Revisar antes de tocar. Es candidata principal a consolidación en un patch único futuro.

## Pruebas manuales mínimas

1. Admin cambia estado de un usuario pendiente a aprobado.
2. Admin cambia rol de usuario común a rol dirigencial.
3. Dirigente provincial intenta editar usuario de su provincia.
4. Dirigente provincial intenta editar usuario de otra provincia y debe fallar.
5. Usuario común no puede acceder a esta acción.
6. No se puede degradar/eliminar administrador accidentalmente.
7. Cambios se reflejan al cerrar e iniciar sesión.
8. Panel refresca datos correctamente.

## Pendiente de completar

- Copiar SQL real vigente desde Supabase.
- Confirmar firma exacta.
- Confirmar validaciones internas.
- Confirmar jerarquía de roles aplicada.
- Confirmar auditoría.
- Confirmar si usa `security definer`.
- Confirmar `set search_path = public`.
