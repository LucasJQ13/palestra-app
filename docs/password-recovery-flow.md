# Flujo de recuperacion de contrasena

El boton **Olvide mi contrasena** de la app usa Supabase Auth con:

```text
https://lucasjq13.github.io/palestra-app/reset-password.html
```

Ese valor debe estar permitido en Supabase porque la app lo envia como `redirectTo` al llamar a `resetPasswordForEmail`.

## Configuracion requerida en Supabase

1. Ir a **Authentication -> URL Configuration**.
2. Verificar el `Site URL` del proyecto.
3. Agregar esta URL en **Redirect URLs**:

```text
https://lucasjq13.github.io/palestra-app/reset-password.html
```

4. Ir a **Authentication -> Email Templates**.
5. Revisar la plantilla de recuperacion de contrasena y confirmar que usa el enlace generado por Supabase.
6. Confirmar en **Auth settings** que el proveedor email y la recuperacion por email estan habilitados.

## Prueba manual

1. Abrir la app y tocar **Olvide mi contrasena**.
2. Probar un mail invalido y confirmar que muestra advertencia.
3. Probar un mail valido registrado.
4. Confirmar que el mensaje de la app no revela si la cuenta existe.
5. Abrir el correo recibido.
6. Verificar que el enlace abre `reset-password.html`.
7. Guardar una contrasena nueva.
8. Volver a la app e iniciar sesion con la nueva contrasena.
