# Mensajeria bilateral

Issue #29 agrega mensajeria directa entre usuarios registrados sin reemplazar el buzon comunitario existente.

## Supabase

La migracion versionada es:

```text
supabase/migrations/20260606010000_direct_user_messaging.sql
```

Incluye:

- `direct_messages`
- `direct_message_recipients`
- indices por emisor/receptor
- RLS de lectura para participantes
- `send_direct_message`
- `get_my_mailbox_messages`
- `mark_message_as_read`
- `delete_message_for_me`
- `restore_message_for_me`

El borrado es logico y separado:

- si borra el emisor, se marca `direct_messages.sender_deleted_at`;
- si borra un receptor, se marca `direct_message_recipients.deleted_at`;
- no se borra fisicamente el mensaje ni desaparece para la otra parte.

## UI

`Mi Perfil -> Buzon de mensajes` muestra:

- `entrada`
- `enviados`
- `eliminados`

El envio directo usa el directorio publico de usuarios aprobado en el issue #38 y permite seleccionar uno o varios destinatarios.

## Prueba manual

1. Iniciar sesion con Usuario A.
2. Abrir `Mi Perfil -> Buzon de mensajes`.
3. Crear mensaje a Usuario B.
4. Confirmar que Usuario A lo ve en `enviados`.
5. Iniciar sesion como Usuario B.
6. Confirmar que aparece en `entrada`.
7. Abrirlo y verificar que pasa a leido.
8. Eliminarlo como Usuario B.
9. Confirmar que aparece en `eliminados` para Usuario B.
10. Volver a Usuario A y confirmar que sigue en `enviados`.
