# RPC: admin_get_users

## Estado

Plantilla documental. No contiene SQL ejecutable.

## Propósito

Obtener listado administrativo de usuarios para el panel dirigencial o administrador.

Esta RPC es crítica porque permite revisar usuarios, estados, roles, comunidad, provincia y datos necesarios para gestión interna.

## Módulos afectados

- `src/lib/profiles.ts`
- `src/screens/ProfileScreen.tsx`
- Panel dirigencial
- Gestión de usuarios
- Solicitudes y aprobaciones

## Parámetros esperados

Pendiente de confirmar contra SQL real vigente.

Posibles parámetros funcionales:

- filtros de búsqueda.
- provincia.
- comunidad.
- estado.
- rol.
- paginación.
- alcance según usuario autenticado.

## Retorno esperado por frontend

Listado de usuarios con campos administrativos.

Campos funcionales esperados:

- `id` / `user_id`.
- `email`.
- `full_name`.
- `avatar_url`.
- `phone`.
- `province`.
- `community_name`.
- `status`.
- `role`.
- `subrole_key`.
- `display_role_label`.
- `gender_preference`.
- `email_confirmed_at`.
- `created_at`.
- campos PM/personales si el panel los muestra.

## Tablas relacionadas

- `profiles`.
- `auth.users`, si la función cruza datos de autenticación.
- `provinces`.
- `communities`.
- `role_permissions`.
- tablas de alias/etiquetas de rol si aplican.

## Permisos esperados

Debe validar internamente que quien llama tiene permiso para listar usuarios.

Reglas esperadas:

- Administrador: puede listar todos.
- Coordinador nacional / vocal nacional: puede listar alcance nacional si su rol lo permite.
- Coordinador diocesano / vocal / asesor: puede listar su provincia si corresponde.
- Coordinador o animador de comunidad: como máximo su comunidad si corresponde.
- Usuario común: no debería listar usuarios.
- Visitante: no debería acceder.

## Validaciones internas recomendadas

1. Usuario autenticado.
2. Perfil aprobado.
3. Rol suficiente.
4. Alcance territorial.
5. No exponer datos sensibles innecesarios.
6. No devolver usuarios eliminados salvo que sea un modo diagnóstico explícito.

## Riesgo

Crítico.

Puede exponer datos personales si las reglas de acceso están mal definidas.

También puede romper el panel dirigencial si el retorno cambia.

## Historial / parches relacionados

Según auditoría previa, esta RPC fue redefinida varias veces.

Patches mencionados:

- `patch_admin_users.sql`
- `patch_beta_user_role_management.sql`
- `patch_profile_photos.sql`
- `patch_user_auth_cleanup_v2.sql`
- `patch_profile_perseverance_preferences.sql`
- `patch_public_profile_gender_labels.sql`
- `patch_email_confirmation_and_personal_pm.sql`
- `patch_community_images_dynamic_roles.sql`

Versión a respetar según auditoría actual:

- `patch_email_confirmation_and_personal_pm.sql`, cuidando no perder campos de imagen/comunidad.

## Pruebas manuales mínimas

1. Entrar como administrador y listar usuarios.
2. Entrar como dirigente provincial y verificar alcance limitado.
3. Entrar como dirigente comunitario y verificar alcance limitado.
4. Entrar como usuario común y confirmar que no accede al listado.
5. Verificar usuarios pendientes, aprobados y bloqueados.
6. Verificar que emails y nombres se ven correctamente.
7. Verificar que no se exponen datos técnicos innecesarios.

## Pendiente de completar

- Copiar SQL real vigente desde Supabase.
- Confirmar firma exacta.
- Confirmar retorno exacto.
- Confirmar paginación si existe.
- Confirmar validación de alcance territorial.
- Confirmar si usa `security definer`.
- Confirmar `set search_path = public`.
