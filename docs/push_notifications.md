# Push notifications

La app ya puede pedir permisos, obtener Expo Push Token y guardar el token asociado al usuario en Supabase.

## Tablas usadas

- `device_push_tokens`: tokens Expo por usuario/dispositivo.
- `notification_intents`: cola de intenciones de notificacion.

## Flujo actual

1. El usuario inicia sesion.
2. La app solicita permiso de notificaciones o permite activarlo desde Perfil > Configuracion.
3. Si el permiso es aceptado, se obtiene un Expo Push Token.
4. El token se registra con usuario, plataforma, device id local, version y estado activo.
5. Cuando un dirigente publica con `Notificar usuarios` activo, se crea una fila en `notification_intents`.

## Envio real

El envio real no debe hacerse desde el cliente porque requiere una clave/entorno seguro y control de segmentacion. La siguiente etapa debe ser una Supabase Edge Function o backend seguro que:

- lea `notification_intents` en estado `pendiente`;
- resuelva destinatarios segun provincia, comunidad y rol minimo;
- consulte `device_push_tokens` activos;
- envie a Expo Push API;
- marque `procesada` o `fallida`.

## No hacer desde frontend

- No exponer secretos.
- No enviar campañas masivas desde el celular del administrador.
- No saltar filtros de visibilidad por rol/provincia/comunidad.
