# QA visual de notificaciones Android

Fecha: 2026-06-20

## Estado

La QA visual de la issue #113 queda preparada pero no completada en este entorno.

Motivo: la validacion obligatoria requiere Android real con dev build o APK real generado despues de #111/#112. En este entorno no hay `adb` disponible ni dispositivo Android accesible desde Codex. Tampoco se compilo APK porque la issue indica no compilar salvo pedido explicito.

## Preflight tecnico verificado

| Elemento | Estado |
| --- | --- |
| Rama local | `main`, sincronizada con `origin/main` antes de iniciar |
| APK/dev build nuevo | No generado desde Codex |
| Dispositivo Android real | No accesible desde este entorno |
| `adb` | No disponible en PATH |
| Expo Go | No usado para validar, porque no es evidencia valida para esta issue |
| `notification.icon` | `./assets/notification-small-icon.png` |
| Fuente oficial de marca | `assets/notification-icon.png` |
| Variante tecnica small icon | `assets/notification-small-icon.png`, derivada desde `assets/notification-icon.png` |
| Recurso Android nativo | `@drawable/notification_icon` |
| Color Android nativo | `@color/notification_icon_color` = `#2d8dc8` |
| Canal push/diagnostico | `default` |
| Canal recordatorios locales | `reminders` |
| Mensajes internos | Payload con `senderName`, `messageId`, `senderId`, `senderAvatarUrl`, `conversationId`, `tab/profilePanel` |
| Large icon/avatar | No implementado como imagen nativa; `senderAvatarUrl` viaja en data para futura validacion/implementacion |

## Matriz de QA requerida

| Caso | Canal | Resultado esperado | Resultado real | Captura/evidencia | Observaciones |
| --- | --- | --- | --- | --- | --- |
| Diagnostico push remoto | `default` | Small icon blanco/transparente visible, nombre Palestra, acento `#2d8dc8` si Android lo muestra, sin icono generico vacio | Pendiente Android real | Pendiente captura colapsada y expandida | Debe probarse desde Ajustes > Diagnostico de Notificaciones en APK/dev build real |
| Push general dirigencial | `default` | Titulo claro, cuerpo claro, small icon corregido, tap abre destino segun `tab`/`tabKey` | Pendiente Android real | Pendiente captura | La app ya acepta `tab` y `tabKey` en el listener de respuestas |
| Recordatorio local | `reminders` | Recordatorio local con small icon global corregido, sin icono generico vacio | Pendiente Android real | Pendiente captura | Se agenda desde Notilestra/recordatorios; el canal `reminders` se crea en `src/lib/agendaHelpers.ts` |
| Evangelio del Dia | Pendiente de flujo | Titulo y cuerpo del Evangelio, identidad Palestra, tap abre Evangelio/Home | No ejecutable actualmente | Pendiente evidencia funcional | En el codigo actual hay fetch/display de Evangelio, pero no se encontro scheduler/notificacion diaria de Evangelio. Requiere implementar o identificar el disparador antes de QA visual |
| Mensaje directo con avatar | `default` | Titulo con nombre del remitente, cuerpo con fragmento, tap abre Buzon/conversacion, avatar si el entorno lo soporta | Pendiente Android real | Pendiente captura colapsada/expandida | #112 envia `senderAvatarUrl` en data, pero no lo renderiza como large icon nativo |
| Mensaje directo sin avatar | `default` | Titulo con nombre del remitente, cuerpo con fragmento, fallback visual correcto, sin circulo vacio | Pendiente Android real | Pendiente captura colapsada/expandida | Fallback institucional documentado: `assets/notification-icon.png`; small icon tecnico deriva del mismo asset |

## Evidencia visual pendiente

Para cerrar #113 se necesitan capturas desde Android real con APK/dev build actualizado:

- Notificacion Palestra junto a otra app para comparar presencia visual.
- Notificacion colapsada.
- Notificacion expandida.
- Diagnostico push remoto por canal `default`.
- Recordatorio local por canal `reminders`.
- Mensaje directo con foto de remitente si existe.
- Mensaje directo sin foto de remitente.
- Evangelio del Dia solo si existe un disparador real de notificacion.

## Bloqueos

1. No hay acceso a Android real desde este entorno.
2. `adb` no esta disponible.
3. No se genero APK/dev build por restriccion explicita de la issue.
4. No se encontro una notificacion diaria real del Evangelio del Dia; solo esta el modulo de carga/visualizacion del Evangelio.

## Criterio para cerrar

No cerrar esta issue hasta adjuntar evidencia visual real en Android con build actualizado posterior a:

- #111: small icon dedicado y branding Android.
- #112: payload/navegacion de mensajes.
