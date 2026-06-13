# RPC: get_random_prayer_intention

## Estado

Hay definiciones SQL candidatas versionadas en el repositorio. Su vigencia en Supabase remoto esta pendiente de verificar.

> Esta ficha es documental. No es una migracion y no debe ejecutarse.

## Criticidad

**Moderado**.

## Proposito

Consultar random prayer intention.

## Uso desde frontend

- `src/lib/profiles.ts:1264`

## Parametros enviados por el frontend

- `p_exclude_ids`

Contrato documentado previamente:

- Parametros: `p_exclude_ids`.

## Respuesta esperada

Lista de hasta una `PrayerIntentionRecord`

## Tablas afectadas o consultadas

- `prayer_intentions` (detectada en SQL versionado).
- `profiles` (detectada en SQL versionado).

## Referencias SQL versionadas

- `supabase/patch_prayer_intentions.sql:185`

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
