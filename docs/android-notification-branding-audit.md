# Auditoria de iconos y apariencia de notificaciones Android

Fecha: 2026-06-20

Alcance: revision de configuracion Expo/Android, uso de `expo-notifications`, assets de iconos, canales Android y payloads locales/remotos. No se implementaron cambios de comportamiento, Supabase ni build APK.

## Resumen

La app ya declara un icono de notificacion y un color de acento en `app.json`, y tambien crea canales Android para push y recordatorios. El problema principal es el asset configurado como small icon: `assets/notification-icon.png` es un PNG RGBA de 1024x1024 con colores y semitransparencias. Android no usa ese icono como logo a color en la barra de estado; lo procesa como mascara monocromatica. Por eso puede verse generico, plano o incorrecto.

Para identidad visual real en Android conviene separar tres niveles:

- Small icon: silueta blanca sobre fondo transparente, simple y reconocible. Es el icono obligatorio de la barra de estado y del encabezado.
- Color de acento: `#2d8dc8` ya esta definido y ayuda a tintar partes de la notificacion, pero no reemplaza al logo.
- Large icon, imagen o avatar: estrategia futura para mostrar identidad a color dentro del cuerpo expandido de la notificacion, siempre que el flujo de Expo/dev build/APK lo soporte.

## Tabla de auditoria

| Elemento | Estado actual | Problema | Recomendacion |
| --- | --- | --- | --- |
| Configuracion `notification.icon` | `app.json` apunta a `./assets/notification-icon.png`. | Existe, pero el asset no cumple bien el rol de small icon Android. | Reemplazarlo por un small icon dedicado, blanco y transparente. No usar logo a color como small icon. |
| Configuracion `notification.color` | `app.json` define `#2d8dc8`. | El color esta bien configurado, pero solo actua como acento visual. No convierte el small icon en logo a color. | Mantenerlo y alinearlo con la identidad primaria de la app. |
| Icono principal de la app | `app.json` usa `./assets/logo-palestra.png` como icono general y adaptive icon. | El launcher icon no resuelve la apariencia de notificaciones. Android trata small icon y launcher icon como recursos distintos. | Conservar launcher icon para la app. Crear un recurso separado para notificaciones. |
| `assets/notification-icon.png` | PNG 1024x1024 RGBA. Analisis local: contiene pixeles a color, pixeles semitransparentes y no es blanco puro sobre transparente. | Android small icon requiere una forma monocromatica. Un asset colorido termina aplanado o se ve generico. | Crear `assets/notification-small-icon.png` con silueta blanca, transparencia real y trazos simples. |
| `assets/1.png` | PNG 96x96 RGBA, blanco sobre transparente segun analisis de pixeles. No esta configurado. | Podria estar mas cerca del formato correcto, pero no esta validado visualmente como marca de Palestra ni esta declarado en `app.json`. | Revisarlo visualmente. Si representa bien la marca, puede servir como base para el small icon. |
| Android nativo | `android/app/src/main/AndroidManifest.xml` no declara meta-data especifica para icono/color de notificacion. Solo usa launcher icons y permisos. | La carpeta Android no esta forzando un override propio para notificaciones. La app depende de la config Expo y de lo que genere el build. | Si se mantiene Android nativo en el repo, verificar despues de prebuild/build que el recurso final de notificacion se genere correctamente. |
| Permiso Android 13+ | `POST_NOTIFICATIONS` esta declarado en `app.json` y en `AndroidManifest.xml`. | No es un problema de permiso de manifiesto. La apariencia generica viene por icono/asset/canales, no por ausencia del permiso. | Mantener permiso y seguir solicitandolo en runtime donde corresponda. |
| Canal push principal | `src/lib/notificationHelpers.ts` crea canal `default` con nombre `Palestra`, importancia `MAX`, sonido, vibracion y `lightColor: #2d8dc8`. | El canal existe, pero los canales Android no definen el small icon. | Mantener canal. No esperar que el canal corrija el logo. |
| Push remoto | `supabase/functions/send-push-notifications/index.ts` envia `channelId: 'default'`. `debug-push-notification` tambien usa `default`. | Usa el canal correcto para push, pero no manda large icon, imagen ni avatar. Depende del icono global de la app. | Primero corregir small icon. Luego evaluar large icon/imagen para notificaciones importantes. |
| Recordatorios locales | `src/lib/agendaHelpers.ts` crea canal `reminders` y agenda notificaciones con `channelId: 'reminders'`. | No usa el mismo canal que push remoto. Esto no rompe la marca si ambos canales usan el mismo small icon global, pero separa ajustes de usuario por tipo. | Mantener canales separados si se quiere control por categoria. Documentar que ambos dependen del mismo small icon global. |
| Prueba local de notificacion | `ProfileScreen.tsx` crea canal `default` para diagnostico y agenda una notificacion inmediata. | La prueba valida permiso/canal, pero no prueba large icon ni imagen. | Para auditorias futuras, agregar una prueba explicita de canal/icono en dev build o APK, no en Expo Go. |
| `src/lib/dailyGospelNotifications.ts` | No existe en el arbol actual. El Evangelio del Dia tiene fetch/display, pero no se encontro un scheduler de notificaciones diario con ese nombre. | No hay flujo especifico que auditar ahi. | Si se crea notificacion diaria de Evangelio, reutilizar la misma estrategia de canales/icono y documentarla. |
| Expo Go | Expo Go puede mostrar identidad limitada o la del contenedor Expo. | No es una prueba confiable para validar el icono final de una app standalone. | Validar iconos en dev build o APK real generado despues del cambio de assets/config. |
| Dev build / APK real | Dev build y APK usan recursos embebidos al construir. | Cambios de icono/config no se ven hasta reconstruir. | Luego de corregir assets/config, hacer build nuevo y validar en dispositivo Android real. No alcanza con refrescar Metro. |

## Respuesta directa a los puntos de la issue

- Icono actual de notificacion Android: `./assets/notification-icon.png`, declarado en `app.json`.
- Existe `notification.icon`: si, en `app.json`.
- El asset cumple requisitos de small icon Android: no. Es un PNG grande y colorido; debe ser una silueta blanca/transparente.
- La app tiene canales Android: si. `default` para push/diagnostico y `reminders` para recordatorios locales.
- La app usa color de acento: si. `notification.color` y `lightColor` usan `#2d8dc8`.
- Local y push usan el mismo canal: no siempre. Push remoto usa `default`; recordatorios locales usan `reminders`; diagnostico local usa `default`.
- Cambia entre Expo Go, dev build y APK: si. Expo Go no es prueba confiable para iconos finales; dev build/APK real requieren rebuild para reflejar assets/config.

## Estrategia recomendada

1. Crear un small icon nuevo, blanco sobre transparente, simple y legible en tamano pequeno.
2. Configurar `app.json` para apuntar a ese small icon dedicado.
3. Mantener `notification.color: "#2d8dc8"` como color de acento.
4. Conservar canales `default` y `reminders` si se quiere separar push general de recordatorios.
5. Evaluar large icon, imagen o avatar para notificaciones donde sea importante mostrar identidad a color.
6. Validar en dev build o APK real, no en Expo Go.
