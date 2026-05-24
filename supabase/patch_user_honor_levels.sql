-- Estructura inicial de grados/niveles honorificos.
-- No reemplaza roles/rangos: los complementa con titulos visibles y años de perseverancia.

create table if not exists public.honor_level_definitions (
  id uuid primary key default gen_random_uuid(),
  role_key text not null,
  level_key text not null,
  display_name text not null,
  description text,
  min_years integer not null default 0,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (role_key, level_key)
);

alter table public.honor_level_definitions enable row level security;

drop policy if exists "Niveles honorificos visibles" on public.honor_level_definitions;
create policy "Niveles honorificos visibles"
on public.honor_level_definitions for select
using (is_active = true);

drop policy if exists "Administradores gestionan niveles honorificos" on public.honor_level_definitions;
create policy "Administradores gestionan niveles honorificos"
on public.honor_level_definitions for all to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

alter table public.profiles
  add column if not exists perseverance_started_on date,
  add column if not exists honor_level_id uuid references public.honor_level_definitions(id);

insert into public.honor_level_definitions (role_key, level_key, display_name, description, min_years, sort_order)
values
  ('palestrista', 'inicio', 'Palestrista en camino', 'Primer tramo de participacion y pertenencia.', 0, 10),
  ('sedimentador', 'semilla', 'Sedimentador Semilla', 'Sedimentador en primeros años de perseverancia.', 0, 20),
  ('sedimentador', 'raiz', 'Sedimentador Raiz', 'Sedimentador con camino sostenido en la comunidad.', 3, 30),
  ('sedimentador', 'testimonio', 'Sedimentador Testimonio', 'Sedimentador con perseverancia prolongada y referencia comunitaria.', 7, 40),
  ('animador_comunidad', 'servicio', 'Animador en servicio', 'Nivel honorifico para animadores activos.', 0, 50),
  ('coordinador_comunidad', 'guia', 'Guia comunitario', 'Nivel honorifico para coordinadores de comunidad.', 0, 60)
on conflict (role_key, level_key) do update
set
  display_name = excluded.display_name,
  description = excluded.description,
  min_years = excluded.min_years,
  sort_order = excluded.sort_order,
  updated_at = now();

create or replace function public.resolve_profile_honor_level(p_profile_id uuid)
returns table (
  role_key text,
  level_key text,
  display_name text,
  description text,
  perseverance_years integer
)
language sql
stable
security definer
set search_path = public
as $$
  with profile_data as (
    select
      profiles.role,
      coalesce(profiles.perseverance_started_on, profiles.created_at::date) as started_on,
      profiles.honor_level_id
    from public.profiles
    where profiles.id = p_profile_id
  ),
  years_data as (
    select
      role,
      greatest(0, date_part('year', age(current_date, started_on))::integer) as years,
      honor_level_id
    from profile_data
  )
  select
    levels.role_key,
    levels.level_key,
    levels.display_name,
    levels.description,
    years_data.years as perseverance_years
  from years_data
  join public.honor_level_definitions levels
    on levels.id = coalesce(
      years_data.honor_level_id,
      (
        select candidate.id
        from public.honor_level_definitions candidate
        where candidate.role_key = years_data.role
          and candidate.is_active = true
          and candidate.min_years <= years_data.years
        order by candidate.min_years desc, candidate.sort_order asc
        limit 1
      )
    );
$$;

grant select on public.honor_level_definitions to authenticated;
grant execute on function public.resolve_profile_honor_level(uuid) to authenticated;
