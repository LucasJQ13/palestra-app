# RPC: check_registration_email_available

## Estado

Hay definiciones SQL candidatas versionadas en el repositorio. Su vigencia en Supabase remoto esta pendiente de verificar.

> Esta ficha es documental. No es una migracion y no debe ejecutarse.

## Criticidad

**Moderado**.

## Proposito

Operacion remota: check registration email available.

## Uso desde frontend

- `src/lib/profiles.ts:680`

## Parametros enviados por el frontend

- `p_email`

Contrato documentado previamente:

- Parametros: `p_email`.

## Respuesta esperada

Registro `{ available, reason }`

## Tablas afectadas o consultadas

- Pendiente de completar desde Supabase o desde una definicion SQL canonica.

## Referencias SQL versionadas

- `supabase/patch_material_upload_permissions_fix.sql:248`

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
