# RPC: get_my_mailbox_messages

## Estado

Hay definiciones SQL candidatas versionadas en el repositorio. Su vigencia en Supabase remoto esta pendiente de verificar.

> Esta ficha es documental. No es una migracion y no debe ejecutarse.

## Criticidad

**Moderado**.

## Proposito

Consultar my mailbox messages.

## Uso desde frontend

- `src/lib/profiles.ts:925`

## Parametros enviados por el frontend

- Sin parametros en las llamadas detectadas.

Contrato documentado previamente:

- Parametros: sin parametros.

## Respuesta esperada

Lista `MailboxMessageRecord`

## Tablas afectadas o consultadas

- `communities` (detectada en SQL versionado).
- `community_contact_messages` (detectada en SQL versionado).
- `direct_message_recipients` (detectada en SQL versionado).
- `direct_messages` (detectada en SQL versionado).
- `profiles` (detectada en SQL versionado).
- `provinces` (detectada en SQL versionado).

## Referencias SQL versionadas

- `supabase/migrations/20260606010000_direct_user_messaging.sql:143`
- `supabase/migrations/20260607133000_mailbox_conversation_rows.sql:1`
- `supabase/migrations/20260612210000_public_queries_inbox.sql:391`
- `supabase/patch_beta_functional_stability.sql:704`
- `supabase/patch_community_mailbox.sql:126`

Estas referencias pueden representar versiones historicas distintas. No se copia un cuerpo como canonico porque el repositorio no certifica cual esta desplegado actualmente.

## Validaciones que deben confirmarse

- Usuario autenticado cuando la operacion no sea publica.
- Estado aprobado cuando accede a datos internos.
- Rol o permiso suficiente.
- Alcance de comunidad/provincia cuando corresponda.
- `security definer` y `set search_path = public` si eleva privilegios.
- Grants limitados a los roles necesarios.
- Retorno y errores compatibles con el frontend.

## Pendiente de verificacion remota

- Firma SQL exacta desplegada.
- Cuerpo SQL vigente.
- Grants y propietario de la funcion.
- Policies y tablas relacionadas.
- Pruebas positivas y negativas por rol.
