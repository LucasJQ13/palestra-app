# Notificaciones de mensajes

Fecha: 2026-06-20

## Flujo aplicado

Cuando se envia un mensaje directo desde el Buzon, la app toma el `message_id` devuelto por `send_direct_message_with_moderation` y llama a:

```text
create_direct_message_notification_intents(message_id)
```

Esa RPC crea una intencion de notificacion por destinatario real del mensaje. Luego la app entrega cada intencion con la Edge Function:

```text
send-push-notifications
```

## Payload de mensaje

Cada notificacion de mensaje queda preparada con:

```text
action: open-conversation
conversationId: user:[sender_id]
messageId
senderId
senderName
senderAvatarUrl
fallbackLargeIconAsset: assets/notification-icon.png
tab: perfil
tabKey: perfil
profilePanel: buzon
```

La Edge Function usa:

- `senderName` como titulo visible.
- fragmento del mensaje como cuerpo.
- canal Android `default`.
- small icon global corregido por la configuracion Android/Expo.

## Navegacion

La app escucha el tap en la notificacion y acepta payloads con `tabKey`, `tab` o `action`.

Para mensajes:

- abre `Perfil`;
- fuerza el panel `Buzon`;
- intenta seleccionar la conversacion con `conversationId`, `messageId` o `senderId`.

Si no encuentra la conversacion localmente, al menos queda abierto el Buzon correcto.

## Avatar y large icon

El payload incluye `senderAvatarUrl` para dejar disponible la foto del remitente, pero no se envia como large icon nativo en esta etapa.

Motivo: con el mecanismo actual de Expo Push usado por la app, no hay una validacion real en APK/dev build de que un avatar remoto o large icon remoto se renderice de forma consistente en Android. Agregar campos no soportados o no verificados puede generar payloads ignorados o comportamiento distinto por version de Android.

Fallback institucional documentado:

```text
assets/notification-icon.png
```

Ese asset queda como fuente oficial para identidad visual a color en una futura capa de large icon/imagen/avatar, no como small icon monocromatico.

## Validacion pendiente

La apariencia final debe validarse en dev build o APK real. Expo Go no sirve para validar el small icon, canal, large icon ni render final de Android.
