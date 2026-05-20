# Push remoto en APK Android

El push local puede funcionar aunque el push remoto falle. Para que una APK standalone reciba push remoto por Expo Push API en Android, la app necesita dos configuraciones externas:

1. `google-services.json` dentro del proyecto, para que Android inicialice Firebase/FCM.
2. Credencial FCM V1 cargada en EAS, para que Expo pueda entregar el push a Firebase.

## Estado esperado del proyecto

- Package Android: `org.palestra.argentina`
- EAS projectId: `ae3f9e9c-fa3d-4273-a840-e5796b9734d6`
- Archivo requerido por `app.json`: `./google-services.json`
- Build beta: `npm run build:apk`

## Pasos en Firebase

1. Entrar a Firebase Console.
2. Crear o abrir el proyecto de Firebase de Palestra.
3. Agregar una app Android con package name exacto:

   ```text
   org.palestra.argentina
   ```

4. Descargar el archivo `google-services.json`.
5. Colocarlo en:

   ```text
   C:\Users\Juan Carlos\Documents\New project\palestra-app\google-services.json
   ```

## Pasos en EAS / Expo

1. Desde CMD, entrar al proyecto:

   ```bat
   cd "C:\Users\Juan Carlos\Documents\New project\palestra-app"
   ```

2. Cargar la credencial FCM V1:

   ```bat
   npx eas-cli credentials -p android
   ```

3. Elegir Android.
4. Elegir el proyecto `palestra-argentina`.
5. Ir a la opcion de credenciales de push / Google Service Account / FCM V1.
6. Subir el JSON privado de Service Account generado desde Firebase Project settings > Service accounts > Generate new private key.

Ese archivo privado NO debe subirse a GitHub.

## Build limpio

Despues de agregar `google-services.json` y cargar FCM V1 en EAS:

```bat
npm run build:apk
```

Luego instalar la APK nueva. Una APK vieja no toma cambios nativos de Firebase.

## Verificacion en la app

1. Entrar como Administrador.
2. Ir a Perfil > Configuracion.
3. Tocar `Solicitar permiso`.
4. Verificar en debug:
   - Runtime distinto de Expo Go.
   - ProjectId correcto.
   - Token generado.
   - Guardado Supabase: si.
   - Sin error `Default FirebaseApp is not initialized`.
5. Tocar `Enviar notificacion de prueba a este dispositivo`.

Si el error `Default FirebaseApp is not initialized` sigue apareciendo, la APK instalada fue generada sin `google-services.json` valido o con un package name distinto.
