# Confirmacion de mail por deep link

## Configuracion actual en la app

- Scheme configurado en `app.json`: `palestra`
- Android package: `org.palestra.argentina`
- Intent filter Android: `palestra://auth/callback`
- Redirect usado por registro: `palestra://auth/callback`
- Deep link visual de prueba: `palestra://auth/callback?preview=mail-confirmed`

La pantalla interna se llama `MailConfirmedScreen` y muestra:

- logo de Palestra
- `Mail confirmado`
- `Tu correo fue confirmado correctamente. Ya podés ingresar a Palestra APP.`
- boton `Ingresar`

## Comando de prueba visual

Con la app instalada en Android:

```bash
npm run preview:mail-confirmed
```

Alternativa con `uri-scheme`:

```bash
npx uri-scheme open "palestra://auth/callback?preview=mail-confirmed" --android
```

Ese link solo prueba la pantalla visual. No procesa tokens ni intenta confirmar un mail real.

## Callback real de Supabase

La app procesa `palestra://auth/callback` en estos formatos:

- `?code=...`: ejecuta `supabase.auth.exchangeCodeForSession(code)`.
- `#access_token=...&refresh_token=...`: ejecuta `supabase.auth.setSession(...)`.
- `?type=recovery` o `?flow=password-reset`: abre recuperacion de contraseña.
- `error` o `error_description`: muestra un error amigable.

El registro ya no usa `localhost` ni el preview visual. Usa:

```ts
emailRedirectTo: 'palestra://auth/callback'
```

La recuperacion de contraseña usa:

```ts
redirectTo: 'palestra://auth/callback?flow=password-reset'
```

## Supabase Dashboard

En `Authentication > URL Configuration` configurar:

- `Site URL`: usar una URL web estable si existe una web publica. Para esta etapa no debe depender de `localhost`.
- `Redirect URLs`: agregar exactamente:

```text
palestra://auth/callback
palestra://auth/callback?flow=password-reset
```

Si Supabase no acepta un esquema custom en tu proyecto, usar como fallback una URL web intermedia HTTPS propia que redirija a `palestra://auth/callback`. Esta tarea no crea pagina web externa.

## Prueba real con mail

1. Instalar una APK que incluya el scheme `palestra`.
2. Registrar un usuario nuevo desde Palestra APP.
3. Abrir el mail enviado por Supabase desde el celular.
4. Tocar el link de confirmacion.
5. Verificar que no abre `localhost`.
6. Verificar que Android abre Palestra APP.
7. Verificar que aparece `Mail confirmado`.
8. En Supabase Auth, revisar que `email_confirmed_at` tenga fecha.
9. Iniciar sesion desde el boton `Ingresar`.

Si falla:

- A: Supabase sigue mandando `localhost`: falta corregir `Site URL`, redirect allowlist o plantilla del Dashboard.
- B: Supabase redirige a `palestra://...`, pero Android no abre la app: falta APK instalada con scheme/intent filter actualizado.
- C: Android abre la app, pero no procesa callback: revisar `handleDeepLinkUrl`.
- D: La app procesa callback, pero no actualiza estado visual: revisar session/profile.
- E: El mail confirma, pero profile queda pendiente: revisar trigger/RPC de perfiles.
