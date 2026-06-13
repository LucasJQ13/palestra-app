# RPC: get_my_community_members

## Estado

Hay definiciones SQL candidatas versionadas en el repositorio. Su vigencia en Supabase remoto esta pendiente de verificar.

> Esta ficha es documental. No es una migracion y no debe ejecutarse.

## Criticidad

**Moderado**.

## Proposito

Consultar my community members.

## Uso desde frontend

- `src/lib/profiles.ts:723`

## Parametros enviados por el frontend

- Sin parametros en las llamadas detectadas.

Contrato documentado previamente:

- Parametros: sin parametros.

## Respuesta esperada

Lista `CommunityMember`

## Tablas afectadas o consultadas

- `profiles` (detectada en SQL versionado).
- `provinces` (detectada en SQL versionado).

## Referencias SQL versionadas

- `supabase/patch_community_leadership_flow.sql:101`
- `supabase/patch_public_profile_and_forum_fix.sql:34`
- `supabase/patch_public_profile_gender_labels.sql:42`

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
