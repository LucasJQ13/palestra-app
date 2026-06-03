# Palestra Argentina

Aplicación móvil para el movimiento católico Palestra en Argentina, desarrollada con Expo, React Native, TypeScript y Supabase.

La app está pensada como una herramienta institucional y comunitaria para centralizar información, fortalecer la comunicación interna, ordenar contenidos formativos y facilitar la gestión de usuarios, comunidades, materiales, noticias, agenda y roles dirigenciales.

## Estado actual

El proyecto superó la etapa de MVP básico. Actualmente funciona como una beta avanzada distribuible por APK, con arquitectura orientada a:

- Contenido público para visitantes.
- Registro e ingreso de usuarios.
- Confirmación de correo mediante enlace interno de la app.
- Usuarios con estado pendiente, aprobado o bloqueado.
- Sistema de roles y permisos.
- Provincias, comunidades y alcance territorial.
- Panel de perfil y panel dirigencial.
- Administración de contenido publicado.
- Noticias, agenda y publicaciones comunitarias.
- Materiales descargables y biblioteca interna.
- Intenciones, PM, comunidades, contacto, historia, oraciones, cancionero e himno.
- Notificaciones locales y push, según configuración disponible.
- Credenciales y funciones QR en módulos internos.
- Personalización visual mediante configuración remota.

## Stack técnico

- Expo SDK 54.
- React Native.
- TypeScript.
- Supabase para autenticación, base de datos, funciones remotas y almacenamiento.
- AsyncStorage para persistencia local.
- Expo Notifications para avisos/notificaciones.
- Expo Camera para lectura QR.
- Expo Image Picker y Document Picker para selección de archivos.
- EAS Build para generar APK de prueba y AAB de producción.

## Comandos disponibles

Instalar dependencias:

```bash
npm install
```

Iniciar Expo:

```bash
npm run start
```

Iniciar Android:

```bash
npm run android
```

Iniciar Web:

```bash
npm run web
```

Iniciar Web local en puerto 8085:

```bash
npm run local
```

Ejecutar chequeo de TypeScript:

```bash
npm run typecheck
```

Generar APK beta con EAS:

```bash
npm run build:apk
```

Generar APK beta sin limpiar caché:

```bash
npm run build:apk:fast
```

Generar APK beta limpiando caché:

```bash
npm run build:apk:clean
```

## Build y distribución

El archivo `eas.json` define tres perfiles principales:

- `beta-apk`: genera APK para distribución interna.
- `preview`: genera APK para pruebas internas.
- `production`: genera Android App Bundle para publicación formal.

La app está configurada con paquete Android:

```text
org.palestra.argentina
```

## Deep link de autenticación

La app usa el esquema:

```text
palestra://auth/callback
```

Este enlace interno se utiliza para procesar confirmaciones y retornos de autenticación dentro de la aplicación instalada.

En Android, el intent filter está configurado en `app.json` con:

- `scheme`: `palestra`
- `host`: `auth`
- `pathPrefix`: `/callback`

Para que funcione correctamente en APK real, la configuración externa de autenticación también debe permitir ese enlace de retorno.

## Supabase

La configuración de Supabase se lee desde `app.json`, dentro de `expo.extra`.

La app espera encontrar:

```json
"extra": {
  "supabaseUrl": "...",
  "supabaseAnonKey": "..."
}
```

Importante: la seguridad no debe depender de ocultar valores públicos del cliente. La seguridad real debe estar garantizada mediante reglas, políticas y funciones del servicio externo correspondiente.

Antes de producción pública se debe auditar:

- Políticas de acceso por tabla.
- Funciones remotas utilizadas por la app.
- Alcance real de cada rol.
- Permisos de lectura, escritura y administración.
- Operaciones sensibles del panel dirigencial.

## Roles principales

La app contempla una jerarquía de roles:

- Invitado.
- Palestrista.
- Sedimentador.
- Animador de comunidad.
- Coordinador de comunidad.
- Vocal.
- Asesor.
- Coordinador diocesano.
- Vocal nacional.
- Coordinador nacional.
- Administrador.

Los permisos determinan qué secciones puede ver o gestionar cada usuario.

## Módulos funcionales

La navegación principal contempla secciones como:

- Inicio.
- Notilestra.
- Materiales.
- Oraciones.
- Cancionero.
- Himno.
- Comunidades.
- Intenciones.
- Historia.
- Contacto.
- PM.
- Perfil.

Además, el sistema admite pestañas configurables y secciones dinámicas de distintos tipos: páginas simples, biblioteca, enlaces, imagen con texto, formularios y módulos internos.

## Reglas de trabajo recomendadas

Para evitar romper la app:

1. Hacer cambios pequeños y verificables.
2. No reescribir archivos grandes completos si no es necesario.
3. Ejecutar `npm run typecheck` después de cada refactor.
4. No modificar configuración externa sin una tarea específica.
5. No cambiar permisos, roles ni Supabase sin auditoría previa.
6. No compilar APK automáticamente salvo pedido explícito.
7. Documentar cada cambio importante.

## Estado recomendado antes de producción

Antes de una publicación amplia se recomienda completar:

- Documentación del contrato Supabase.
- Checklist manual de pruebas beta.
- Auditoría de permisos frontend/backend.
- Modularización gradual de `App.tsx`.
- Modularización gradual de `ProfileScreen.tsx`.
- Limpieza de imports y reducción de duplicaciones.
- Validación completa de deep links, registro, sesión y notificaciones.

## Documentación adicional

Ver:

- `docs/INFORME_PRESENTACION_APP.md`: informe de presentación funcional, institucional y técnico de la app.
