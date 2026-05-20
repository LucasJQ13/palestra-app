# Cambios del proyecto Palestra

Este documento resume decisiones y cambios relevantes para continuar el proyecto desde cualquier PC sin depender de memoria de conversacion.

## 2026-05-19

### Push remoto Android

- La app sigue usando Supabase como backend principal.
- Para APK standalone Android, Expo Push necesita FCM como canal nativo de entrega.
- Se agrego `google-services.json` al proyecto para inicializar Firebase/FCM en Android.
- Se cargo en EAS la credencial FCM V1 para `org.palestra.argentina`.
- Queda pendiente generar una APK nueva cuando haya cupo de EAS o usando build local con Android Studio.
- El error crudo de Firebase/FCM ya no deberia mostrarse a usuarios comunes; queda como detalle tecnico en debug admin.

### GitHub

- Todo quedo subido a `main`.
- Ultimo commit antes de navegación dedicada: `77923ce chore: add android firebase config`.

### Navegacion

- Se inicio una mejora para que la herramienta `Navegacion` del panel administrador funcione como pantalla dedicada.
- Criterio: no duplicar rutas, no romper `app_tabs`, mantener persistencia Supabase y restringir uso a Administrador.

## 2026-05-20

### Version Beta

- La etiqueta visual de la app paso a `BETA 0.1.0`.
- La version visible queda centralizada en `App.tsx` con `appStageLabel`, `appBetaVersion` y `appVersionLabel`.
- Los scripts de build APK ahora usan el perfil `beta-apk`.
- Los accesos de prueba quedan nombrados como internos/de prueba, no como maqueta publica.

## Recomendacion operativa

- Antes de trabajar desde otra PC: `git pull --ff-only`.
- Despues de cambios importantes: `npm run typecheck`, commit y push.
- No subir claves privadas como `firebase-adminsdk-*.json`.
