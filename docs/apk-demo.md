# APK DEMO de Palestra

Estado actual: el proyecto esta preparado para generar una APK DEMO privada de Android usando Expo/EAS.

## Opcion recomendada para esta etapa

Usar EAS Build en modo interno:

```bash
npm run build:apk
```

Ese comando ejecuta:

```bash
npx eas-cli build -p android --profile demo-apk
```

## Antes de ejecutar

1. Tener una cuenta de Expo.
2. Iniciar sesion:

```bash
npx eas-cli login
```

3. Confirmar que el proyecto compila TypeScript:

```bash
npm run typecheck
```

## Donde queda la APK

EAS Build compila en la nube y al terminar muestra un enlace de descarga. Desde ese enlace se baja el archivo `.apk`.

## Instalacion en Android

1. Descargar la APK en el celular.
2. Abrir el archivo.
3. Android va a pedir permitir instalacion desde fuente desconocida.
4. Aceptar solo para esta instalacion.
5. Instalar y abrir Palestra.

## Configuracion actual lista

- Nombre de app: Palestra.
- Icono: `assets/logo-palestra.png`.
- Splash screen: configurado con el logo y fondo `#E6F3F5`.
- Android package: `org.palestra.argentina`.
- Version demo visible en la app: `DEMO 0.1.0`.
- Perfil de APK interna: `demo-apk` en `eas.json`.

## Advertencias para la demo

- Esta APK no es Play Store ni version final.
- Algunas funciones dependen de internet y Supabase.
- El modo offline parcial todavia no esta implementado como cache formal.
- La primera build de EAS puede pedir configurar credenciales Android automaticamente.
- Para testing privado conviene APK interna, no release final.
- Si Android bloquea la instalacion, habilitar "instalar apps desconocidas" para el navegador o gestor de archivos usado.

## Alternativa local

Tambien se puede generar una APK debug local, pero requiere Android Studio, Java/JDK y Android SDK configurados. Para esta etapa es mas simple y estable usar EAS Build.
