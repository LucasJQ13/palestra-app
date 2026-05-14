# Palestra Argentina

Aplicacion movil inicial para el movimiento catolico Palestra en Argentina.

## Objetivo del MVP

- Distribucion inicial como APK instalable.
- Contenido publico para visitantes.
- Registro e inicio de sesion.
- Usuarios con estado pendiente/aprobado.
- Roles y permisos para secciones privadas.
- Provincias iniciales: Salta, Jujuy, Tucuman, Catamarca, Cordoba y San Luis.

## Stack elegido

- Expo + React Native + TypeScript.
- Supabase en plan gratis para usuarios, base de datos y archivos.

## Proximo paso tecnico

Instalar Node.js LTS completo en la PC para tener `npm` y poder ejecutar:

```bash
npm install
npm run start
```

## Configuracion Supabase

Cuando exista el proyecto gratis en Supabase, completar `app.json`:

```json
"extra": {
  "supabaseUrl": "https://TU-PROYECTO.supabase.co",
  "supabaseAnonKey": "TU_ANON_KEY_PUBLICA"
}
```
