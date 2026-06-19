# Provincias vigentes

Regla definida para vistas publicas y de usuario:

Una provincia aparece y cuenta en Home, Registro, Perfil y Comunidades solo si:

- `provinces.is_active` no es `false`;
- `provinces.archived_at` es `null`;
- tiene al menos una comunidad visible;
- la comunidad visible tiene `communities.is_active` distinto de `false`;
- la comunidad visible tiene `communities.archived_at` en `null`.

Esto evita que una provincia de prueba archivada, inhabilitada o sin comunidades activas siga sumando en el contador de Home.

## Administracion

El panel de Provincias usa un inventario ampliado para poder ver provincias sin comunidades o deshabilitadas y rehabilitarlas. Ese inventario se mantiene separado de la lista vigente usada por Home, Registro, Perfil, QR y los selectores comunes.

Gestion de Comunidades solo permite seleccionar provincias vigentes. Si una provincia se archiva o deshabilita, sus comunidades asociadas se conservan en Supabase para mantener la integridad historica, pero dejan de aparecer en los selectores y conteos comunes. La app no mezcla el inventario administrativo con el fallback local ni borra registros hijos automaticamente.

Si una comunidad queda sin relacion a una fila de `provinces`, se considera huerfana y tampoco se publica como una provincia ficticia `Sin provincia`. El registro permanece intacto para diagnostico o reparacion administrativa.

## Diagnostico Supabase

```sql
select id, name, region, is_active, archived_at
from public.provinces
order by name;
```

```sql
select
  c.id,
  c.name as community_name,
  c.is_active,
  c.archived_at,
  p.name as province_name,
  p.is_active as province_is_active,
  p.archived_at as province_archived_at
from public.communities c
left join public.provinces p on p.id = c.province_id
order by p.name, c.name;
```
