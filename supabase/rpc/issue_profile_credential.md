# RPC: issue_profile_credential

## Estado

Hay definiciones SQL candidatas versionadas en el repositorio. Su vigencia en Supabase remoto esta pendiente de verificar.

> Esta ficha es documental. No es una migracion y no debe ejecutarse.

## Criticidad

**Critico**.

## Proposito

Emitir una nueva credencial QR opaca para el usuario autenticado.

## Uso desde frontend

- `src/lib/profiles.ts:352`

## Parametros enviados por el frontend

- Sin parametros en las llamadas detectadas.

Contrato documentado previamente:

- Parametros: sin parametros.

## Respuesta esperada

Registro `CredentialQrRecord`

## Tablas afectadas o consultadas

- `profile_credentials` (detectada en SQL versionado).
- `profiles` (detectada en SQL versionado).

## Referencias SQL versionadas

- `supabase/patch_credential_qr_validation.sql:33`
- `supabase/patch_emergency_profile_qr_recovery.sql:233`

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
