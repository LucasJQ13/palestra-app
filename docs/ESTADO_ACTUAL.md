# Estado actual

## Ya conectado a Supabase

- Proyecto: `https://lqnwdoehandtzxfzeghc.supabase.co`
- Provincias cargadas.
- Comunidades cargadas:
  - Salta: 29
  - Jujuy: 25
  - Tucuman: 19
  - Catamarca: 20
  - Cordoba: 2
  - San Luis: 3
- Noticias iniciales cargadas.
- Eventos iniciales cargados.
- Registro/login preparado desde la pantalla Perfil.
- Perfil editable preparado para guardar en Supabase.
- Panel de aprobacion preparado para usuarios pendientes.
- Recuperacion automatica de sesion real al abrir la app.
- Cierre de sesion real desde Perfil.
- Mensajes visuales para perfiles pendientes, aprobados y bloqueados.

## Pendiente tecnico inmediato

1. Esperar enfriamiento del limite de email de Supabase y probar registro real desde la app.
2. Crear un usuario dirigente real y promoverlo desde Supabase para probar aprobaciones.
3. Reemplazar la preview HTML por pruebas directas en Expo/Android.
4. Preparar APK interna.

## Archivos importantes

- `App.tsx`: app principal.
- `src/lib/supabase.ts`: cliente Supabase.
- `src/lib/remoteData.ts`: lectura remota con fallback local.
- `src/lib/profiles.ts`: perfiles pendientes y aprobacion.
- `supabase/`: parches SQL y esquema.
- `preview/`: maqueta navegable web.
