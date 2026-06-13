# RPC: send_direct_message_with_moderation

## Estado

Hay definiciones SQL candidatas versionadas en el repositorio. Su vigencia en Supabase remoto esta pendiente de verificar.

> Esta ficha es documental. No es una migracion y no debe ejecutarse.

## Criticidad

**Alto**.

## Proposito

Operacion remota: send direct message with moderation.

## Uso desde frontend

- `src/lib/profiles.ts:849`

## Parametros enviados por el frontend

- `p_body`
- `p_recipient_ids`
- `p_subject`

Contrato documentado previamente:

- Parametros: `p_recipient_ids`, `p_body`, `p_subject`.

## Respuesta esperada

Mutacion; puede incluir resultado de moderacion, pendiente

## Tablas afectadas o consultadas

- `audit_logs` (detectada en SQL versionado).
- `check_message_moderation` (detectada en SQL versionado).
- `direct_message_recipients` (detectada en SQL versionado).
- `direct_messages` (detectada en SQL versionado).
- `moderation_events` (detectada en SQL versionado).
- `profiles` (detectada en SQL versionado).

## Referencias SQL versionadas

- `supabase/migrations/20260607143000_message_moderation.sql:194`

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
