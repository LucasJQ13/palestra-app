# Supabase

Proyecto configurado:

- URL: `https://lqnwdoehandtzxfzeghc.supabase.co`
- Clave usada en la app: `anon public key`

## Cargar base de datos

1. Entrar al panel de Supabase.
2. Abrir `SQL Editor`.
3. Crear un nuevo query.
4. Pegar el contenido de `supabase/schema.sql`.
5. Ejecutar el query.

## Autenticacion

La app ya tiene un bloque de acceso real en `Perfil`:

- Iniciar sesion con email/contrasena.
- Registrarse con email/contrasena.
- Crear perfil inicial como `invitado` y `pendiente`.

## Parche de perfiles

Si el esquema ya fue ejecutado antes de agregar la politica de insercion de perfiles, correr tambien:

```sql
drop policy if exists "Cada usuario crea su perfil" on public.profiles;
drop policy if exists "Cada usuario actualiza datos basicos" on public.profiles;

create policy "Cada usuario crea su perfil"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "Cada usuario actualiza datos basicos"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
```

## Importante

No usar claves secretas dentro de la app. La `anon public key` si puede estar en la aplicacion movil.

## Perfil automatico al registrarse

Para que cada usuario tenga perfil apenas se registra, ejecutar:

```sql
create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, status, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email, 'Usuario nuevo'),
    'pendiente',
    'invitado'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;

create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row
execute function public.create_profile_for_new_user();
```

## Datos reales de la app

Para crear comunidades, solicitudes, mensajes y auditoria, ejecutar:

- `supabase/patch_app_data.sql`

Para que dirigentes puedan ver y aprobar perfiles pendientes, ejecutar:

- `supabase/patch_admin_profiles.sql`

Para cargar noticias y eventos iniciales:

- `supabase/patch_seed_news_events.sql`
