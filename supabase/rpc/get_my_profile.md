# RPC: get_my_profile

## Estado

Plantilla documental. No contiene SQL ejecutable.

## Propósito

Obtener el perfil extendido del usuario autenticado para construir la sesión interna de Palestra App.

Esta RPC es crítica porque alimenta:

- login,
- sesión persistente,
- perfil,
- rol,
- permisos,
- provincia,
- comunidad,
- navegación privada,
- estado pendiente/aprobado/bloqueado.

## Módulos afectados

- `src/lib/authProfile.ts`
- `App.tsx`
- `src/screens/auth/AuthFlow.tsx`
- `src/screens/ProfileScreen.tsx`
- permisos y navegación privada

## Parámetros esperados

Pendiente de confirmar contra SQL real vigente.

Posibles formas usadas históricamente:

- sin parámetros, usando `auth.uid()`.
- con email como parámetro.
- con datos derivados del usuario autenticado.

## Retorno esperado por frontend

Debe devolver una sesión/perfil compatible con `Session` en `src/types/auth.ts`.

Campos funcionales esperados:

- `id` o `user_id`.
- `email`.
- `fullName` / `full_name`.
- `avatarUrl` / `avatar_url`.
- `role`.
- `permissions`.
- `status`.
- `province`.
- `communityName` / `community_name`.
- `genderPreference` / `gender_preference`.
- `nickname`.
- `useNicknameInGreetings`.
- `credentialNameMode`.
- `perseveranceStartYear`.
- `personalPmType`.
- `personalPmNumber`.
- `personalPmProvince`.
- `personalPmMotto`.
- `displayRoleLabel`.
- `subroleKey`.

## Tablas relacionadas

- `profiles`.
- `role_permissions`.
- `provinces`.
- `communities`.
- tablas de etiquetas/alias de roles si aplican.

## Permisos esperados

Debe permitir que un usuario autenticado lea únicamente su propio perfil extendido.

No debe permitir:

- leer perfil privado de otro usuario,
- elevar rol desde cliente,
- devolver permisos no vigentes,
- devolver usuarios bloqueados como activos.

## Validaciones internas recomendadas

La función debería validar:

1. `auth.uid()` existe.
2. Hay fila en `profiles` asociada.
3. Estado del usuario.
4. Rol vigente.
5. Permisos vigentes.
6. Normalización de provincia/comunidad.

## Riesgo

Crítico.

Si esta RPC falla o cambia de forma, pueden romperse:

- login,
- recuperación de sesión,
- acceso a contenido privado,
- panel dirigencial,
- perfil,
- redirecciones.

## Historial / parches relacionados

Según auditoría previa, esta función fue redefinida varias veces.

Patches mencionados:

- `patch_auth_onboarding_profile_fields.sql`
- `patch_profile_photos.sql`
- `patch_profile_perseverance_preferences.sql`
- `patch_get_my_profile_rpc.sql`
- `patch_news_scope_email_requests_community_coords.sql`
- `patch_email_confirmation_and_personal_pm.sql`
- `patch_community_images_dynamic_roles.sql`

Versión a respetar según auditoría actual:

- `patch_email_confirmation_and_personal_pm.sql`, salvo que se cree un patch específico nuevo de perfil.

## Pruebas manuales mínimas

1. Iniciar sesión con usuario aprobado.
2. Iniciar sesión con usuario pendiente.
3. Intentar sesión con usuario bloqueado.
4. Confirmar que el rol visible coincide con Supabase.
5. Confirmar que provincia y comunidad aparecen bien.
6. Confirmar que la app no queda en bucle de perfil incompleto.
7. Confirmar que panel dirigencial aparece solo si corresponde.

## Pendiente de completar

- Copiar SQL real vigente desde Supabase.
- Confirmar firma exacta.
- Confirmar retorno exacto.
- Confirmar si usa `security definer`.
- Confirmar `set search_path = public`.
- Confirmar grants/permisos.
