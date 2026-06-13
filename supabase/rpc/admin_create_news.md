# RPC: admin_create_news

## Estado

Hay definiciones SQL candidatas versionadas en el repositorio. Su vigencia en Supabase remoto esta pendiente de verificar.

> Esta ficha es documental. No es una migracion y no debe ejecutarse.

## Criticidad

**Alto**.

## Proposito

Crear news.

## Uso desde frontend

- `src/lib/profiles.ts:1463`
- `src/lib/profiles.ts:1476`

## Parametros enviados por el frontend

- `p_body`
- `p_image_url`
- `p_is_public`
- `p_province`
- `p_title`

Contrato documentado previamente:

- Parametros: `p_title`, `p_body`, `p_is_public`, `p_province`, `p_image_url`.

## Respuesta esperada

Mutacion

## Tablas afectadas o consultadas

- `audit_logs` (detectada en SQL versionado).
- `news` (detectada en SQL versionado).
- `profiles` (detectada en SQL versionado).
- `provinces` (detectada en SQL versionado).

## Referencias SQL versionadas

- `supabase/patch_admin_rpc_and_tabs.sql:46`
- `supabase/patch_beta_content_permissions.sql:69`
- `supabase/patch_news_optional_images.sql:4`
- `supabase/patch_news_scope_email_requests_community_coords.sql:117`

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
