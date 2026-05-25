# Confirmacion de mail sin localhost

La app ya tiene pantalla interna y deep link:

```text
palestra://auth/callback?preview=mail-confirmed
```

Preview en Android con la app instalada:

```bash
npm run preview:mail-confirmed
```

## Supabase Dashboard

En `Authentication > URL Configuration` configurar:

- `Site URL`: `https://lqnwdoehandtzxfzeghc.supabase.co`
- `Redirect URLs`:
  - `palestra://auth/callback`
  - `palestra://auth/callback?preview=mail-confirmed`
  - `palestra://auth/callback?flow=password-reset`

Si `Site URL` queda en `http://localhost:3000` o el deep link no esta en allowlist, Supabase confirma el mail pero redirige a localhost.
La app procesa tanto callbacks con `code` como callbacks con `access_token`/`refresh_token` para que la pantalla `Mail confirmado` no sea solo visual: despues del callback vuelve a consultar Supabase Auth y refresca el perfil real.

## Uso desde la app

Registro usa:

```ts
emailRedirectTo: 'palestra://auth/callback?preview=mail-confirmed'
```

Recuperacion de contrasena usa:

```ts
redirectTo: 'palestra://auth/callback?flow=password-reset'
```

Para prueba real:

1. Instalar una APK que incluya el scheme `palestra`.
2. Registrar un usuario nuevo.
3. Abrir el mail de confirmacion desde el telefono.
4. El link debe abrir la app y mostrar `Mail confirmado`.
5. Si abre localhost, revisar `Site URL` y `Redirect URLs` en Supabase.
