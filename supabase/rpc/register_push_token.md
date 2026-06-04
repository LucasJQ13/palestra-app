# RPC: register_push_token

## Estado

Plantilla documental. No contiene SQL ejecutable.

## Propósito

Registrar o actualizar el token push de un dispositivo asociado a un usuario autenticado.

Esta RPC permite que la app guarde tokens de Expo Push Notifications para posteriores envíos remotos.

## Módulos afectados

- `src/lib/notificationHelpers.ts`
- `src/lib/profiles.ts`
- Panel de notificaciones
- Edge Function `send-push-notifications`
- Edge Function `debug-push-notification`

## Parámetros esperados

Pendiente de confirmar contra SQL real vigente.

Parámetros funcionales esperados:

- token push.
- plataforma.
- device id.
- nombre de dispositivo.
- versión de app.
- estado activo.

## Retorno esperado por frontend

Debe devolver éxito/error.

Idealmente:

- token registrado.
- device id.
- estado activo.
- mensaje de error si falla.

## Tablas relacionadas

- `device_push_tokens`.
- `profiles`.
- posibles tablas de auditoría o logs de notificaciones.

## Permisos esperados

Reglas esperadas:

- Usuario autenticado puede registrar token propio.
- Usuario no puede registrar token para otro usuario.
- Usuario bloqueado no debería quedar activo para push.
- Visitante no registra token persistente.

## Validaciones internas recomendadas

1. `auth.uid()` existe.
2. Perfil existe.
3. Usuario no está bloqueado.
4. Token tiene formato razonable.
5. Device id existe.
6. Upsert por `user_id + device_id` o por token según diseño vigente.
7. Marcar tokens antiguos como inactivos si corresponde.

## Riesgo

Medio/alto.

Errores posibles:

- tokens duplicados,
- notificaciones a usuarios bloqueados,
- token asociado a usuario equivocado,
- pérdida de token al reinstalar,
- éxito visual sin capacidad real de enviar push.

## Historial / parches relacionados

Patches mencionados:

- `patch_beta_mobile_persistence_notifications.sql`
- `patch_push_notification_delivery_foundation.sql`

Versión a respetar según auditoría:

- `patch_push_notification_delivery_foundation.sql`.

## Pruebas manuales mínimas

1. Usuario aprobado activa notificaciones.
2. Android solicita permiso correctamente.
3. Token se genera y se guarda.
4. Reabrir app no duplica tokens innecesariamente.
5. Cerrar sesión y entrar con otro usuario no mezcla tokens.
6. Usuario bloqueado no debería recibir notificaciones.
7. Prueba push admin/debug si existe.

## Pendiente de completar

- Copiar SQL real vigente desde Supabase.
- Confirmar firma exacta.
- Confirmar constraint de upsert.
- Confirmar manejo de tokens inactivos.
- Confirmar si usa `security definer`.
- Confirmar `set search_path = public`.
