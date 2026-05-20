# Arquitectura de rangos y etiquetas visibles

## Principio actual

Palestra APP mantiene roles internos fijos para no romper permisos, RLS, RPC ni jerarquia. Ejemplos:

- `animador_comunidad`
- `coordinador_comunidad`
- `vocal`
- `coordinador_diocesano`
- `vocal_nacional`
- `coordinador_nacional`

Estos `role_key` internos son los que usa Supabase y la app para decidir permisos reales. No deben cambiarse solo por una diferencia de nombre entre provincias.

## Etiquetas visibles por provincia

Se agrega la tabla `province_role_labels` para personalizar como se muestra un rango en una provincia concreta.

Campos principales:

- `province_id`: provincia donde aplica la etiqueta.
- `role_key`: rango interno fijo.
- `display_label`: nombre visible para esa provincia.
- `description`: nota interna opcional.
- `is_active`: si esta apagado, se usa el nombre estandar.
- `updated_by` y `updated_at`: auditoria basica.

Ejemplo:

- `role_key`: `coordinador_comunidad`
- Provincia: Salta
- `display_label`: Animador del Sedimentador

Resultado: usuarios de Salta con `coordinador_comunidad` ven `Animador del Sedimentador`, pero sus permisos siguen siendo los de `coordinador_comunidad`.

## Resolucion del nombre visible

La app usa esta prioridad:

1. Si existe etiqueta activa para `provincia + role_key`, muestra `display_label`.
2. Si no existe etiqueta, o esta inactiva, muestra el nombre estandar del rango.
3. La logica interna sigue usando `role_key`.

## Que no cambia

- No cambia la jerarquia.
- No cambia RLS.
- No cambia la asignacion real de roles.
- No cambia quien puede editar, aprobar, publicar o gestionar usuarios.
- No crea roles nuevos.

## Riesgos de rangos dinamicos

Crear o duplicar rangos reales requiere un refactor mas profundo porque actualmente:

- TypeScript usa el tipo fijo `Role`.
- Supabase usa el enum `public.user_role`.
- Muchas RPC y politicas RLS comparan roles por clave fija.
- La UI tiene reglas de jerarquia y visibilidad basadas en esos valores.

Crear roles dinamicos sin migrar esa base podria romper permisos o dejar usuarios con roles que la app no entiende.

## Etapa futura recomendada para crear/duplicar rangos

1. Mantener roles criticos fijos y usar etiquetas visibles por provincia.
2. Crear una tabla `role_definitions` administrable con permisos, jerarquia, alcance y estado visible/asignable.
3. Migrar gradualmente helpers de TypeScript para leer definiciones remotas.
4. Migrar RPC/RLS desde comparaciones fijas a permisos normalizados.
5. Recien ahi habilitar una herramienta segura para duplicar o crear rangos.

Hasta completar esa migracion, la opcion segura es personalizar nombres visibles sin cambiar `role_key`.
