# RPC: admin_set_tab_position

## Estado

Hay definiciones SQL candidatas versionadas en el repositorio. Su vigencia en Supabase remoto esta pendiente de verificar.

> Esta ficha es documental. No es una migracion y no debe ejecutarse.

## Criticidad

**Alto**.

## Proposito

Operacion administrativa: set tab position.

## Uso desde frontend

- `src/lib/profiles.ts:1557`

## Parametros enviados por el frontend

- `p_icon_name`
- `p_is_visible`
- `p_key`
- `p_label`
- `p_section_type`
- `p_sort_order`
- `p_visible_roles`

Contrato documentado previamente:

- Parametros: `p_key`, `p_label`, `p_is_visible`, `p_sort_order`, `p_visible_roles`, `p_icon_name`, `p_section_type`.

## Respuesta esperada

Mutacion

## Tablas afectadas o consultadas

- `app_tabs` (detectada en SQL versionado).
- `audit_logs` (detectada en SQL versionado).

## Referencias SQL versionadas

- `supabase/patch_admin_navigation_instagram.sql:3`
- `supabase/patch_admin_navigation_manager.sql:103`
- `supabase/patch_navigation_section_types_deep_link.sql:141`

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
