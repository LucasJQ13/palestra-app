# Branding visual de notificaciones Android

Fecha: 2026-06-20

## Cambio aplicado

Se reemplazo el icono de notificacion Android por un small icon dedicado:

```text
assets/notification-small-icon.png
```

El asset se genero desde `assets/1.png`, que ya era una marca blanca sobre fondo transparente. El archivo anterior `assets/notification-icon.png` queda disponible como logo a color, pero ya no se usa como small icon porque Android no renderiza ese recurso como imagen a color en la barra de notificaciones.

## Configuracion Expo

`app.json` ahora apunta a:

```text
notification.icon: ./assets/notification-small-icon.png
notification.color: #2d8dc8
```

El color de acento se mantiene para conservar identidad visual secundaria.

## Configuracion Android nativa

Como el repositorio mantiene carpeta `android`, tambien se dejaron alineados los recursos nativos:

```text
android/app/src/main/res/drawable-mdpi/notification_icon.png
android/app/src/main/res/drawable-hdpi/notification_icon.png
android/app/src/main/res/drawable-xhdpi/notification_icon.png
android/app/src/main/res/drawable-xxhdpi/notification_icon.png
android/app/src/main/res/drawable-xxxhdpi/notification_icon.png
```

El manifiesto declara el recurso para FCM y para notificaciones locales de Expo:

```text
com.google.firebase.messaging.default_notification_icon
expo.modules.notifications.default_notification_icon
```

Tambien se agrego el color:

```text
android/app/src/main/res/values/colors.xml -> notification_icon_color: #2d8dc8
```

## Canales

No se unificaron canales.

- Push remoto y diagnostico: `default`.
- Recordatorios locales: `reminders`.

Ambos dependen del mismo small icon global de Android.

## Limites de Android

El small icon debe ser monocromatico. No corresponde usar el logo a color completo como small icon porque Android lo procesa como mascara. Si se necesita identidad visual a color dentro del cuerpo de la notificacion, debe resolverse en otra capa: large icon, imagen, avatar o estilo enriquecido. Esa parte no se implemento en esta issue porque implicaria modificar payloads y contenido funcional de notificaciones.

## Validacion pendiente

Este cambio no se puede validar correctamente en Expo Go ni con solo refrescar Metro. La validacion visual debe hacerse con dev build o APK real nuevo, como queda previsto para la issue de validacion posterior.

