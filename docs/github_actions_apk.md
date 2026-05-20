# APK Beta con GitHub Actions

Esta es una alternativa a EAS Cloud cuando se agota el cupo mensual. No reemplaza EAS: conviven los dos caminos.

## Viabilidad

Es viable generar una APK **debug** desde GitHub Actions usando el repo. El workflow crea el proyecto nativo Android con `expo prebuild` y luego compila con Gradle.

Archivo creado:

```text
.github/workflows/android-apk.yml
```

## Que genera

- APK debug instalable para pruebas internas.
- Artifact descargable desde GitHub Actions.
- No publica en Play Store.
- No consume cupo de EAS Build.

## Que necesita

- `google-services.json` en el repo para que Android inicialice FCM.
- No necesita keystore propia para APK debug.
- No necesita Android Studio local.
- No necesita secretos para la version debug actual.

## Release APK

Para APK release firmada se necesita:

- keystore,
- alias,
- contrasena de keystore,
- contrasena de key,
- secrets de GitHub Actions.

Por ahora conviene usar debug APK para testing familiar/comunitario.

## Como ejecutarlo

1. Entrar al repo en GitHub.
2. Ir a la pestaña **Actions**.
3. Elegir workflow **Android APK Beta**.
4. Tocar **Run workflow**.
5. Esperar que termine.
6. Entrar al run terminado.
7. Descargar el artifact:

```text
palestra-beta-debug-apk
```

Dentro estará:

```text
app-debug.apk
```

## Limitaciones frente a EAS Build

- Puede fallar si alguna dependencia Expo requiere configuración nativa que EAS resuelve mejor.
- `expo prebuild --clean` genera Android en cada ejecución.
- La APK debug pesa más y no está optimizada como release.
- No conviene distribuirla masivamente.
- Para Play Store sigue conviniendo EAS o una pipeline release firmada.

## Riesgos

- Si `google-services.json` cambia, hay que subirlo al repo.
- No subir nunca claves privadas tipo `firebase-adminsdk-*.json`.
- Si el build falla por una dependencia nativa, revisar logs de GitHub Actions y comparar con EAS.
