-- Jerarquia territorial y relaciones operativas.
-- Ejecutar despues de schema.sql, patch_app_data.sql y los parches de administracion.

alter table public.profiles
  add column if not exists community_id uuid references public.communities(id),
  add column if not exists managed_community_id uuid references public.communities(id);

alter table public.communities
  add column if not exists animator_profile_id uuid references public.profiles(id),
  add column if not exists coordinator_profile_id uuid references public.profiles(id),
  add column if not exists diocesan_vocal_profile_id uuid references public.profiles(id);

create table if not exists public.profile_role_relationships (
  id uuid primary key default gen_random_uuid(),
  manager_profile_id uuid not null references public.profiles(id) on delete cascade,
  managed_profile_id uuid not null references public.profiles(id) on delete cascade,
  province_id uuid references public.provinces(id) on delete cascade,
  community_id uuid references public.communities(id) on delete cascade,
  relation_type text not null check (
    relation_type in (
      'animador_comunidad',
      'coordinador_comunidad',
      'vocal_animador',
      'vocal_coordinador_comunidad',
      'coordinador_diocesano_vocal',
      'nacional_diocesano'
    )
  ),
  created_at timestamptz not null default now(),
  unique (manager_profile_id, managed_profile_id, relation_type)
);

alter table public.profile_role_relationships enable row level security;

create or replace function public.role_rank(p_role public.user_role)
returns integer
language sql
stable
as $$
  select case p_role
    when 'invitado' then 0
    when 'palestrista' then 1
    when 'sedimentador' then 2
    when 'animador_comunidad' then 3
    when 'coordinador_comunidad' then 4
    when 'vocal' then 5
    when 'asesor' then 6
    when 'coordinador_diocesano' then 7
    when 'vocal_nacional' then 8
    when 'coordinador_nacional' then 9
    when 'administrador' then 10
    else 0
  end
$$;

create or replace function public.current_user_can_see_all_provinces()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'aprobado'
      and profiles.role in ('vocal_nacional', 'coordinador_nacional', 'administrador')
  )
$$;

create or replace function public.current_user_can_access_province(p_province_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_province_id is null
    or public.current_user_can_see_all_provinces()
    or exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.status = 'aprobado'
        and profiles.province_id = p_province_id
    )
$$;

create or replace function public.current_user_can_approve_role(p_target_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles approver
    where approver.id = auth.uid()
      and approver.status = 'aprobado'
      and (
        approver.role = 'administrador'
        or (p_target_role in ('sedimentador', 'animador_comunidad', 'coordinador_comunidad') and approver.role in ('vocal', 'coordinador_diocesano'))
        or (p_target_role in ('vocal', 'asesor') and approver.role = 'coordinador_diocesano')
        or (p_target_role = 'coordinador_diocesano' and approver.role in ('coordinador_diocesano', 'vocal_nacional'))
        or (p_target_role = 'vocal_nacional' and approver.role = 'coordinador_nacional')
        or (p_target_role = 'coordinador_nacional' and approver.role = 'coordinador_nacional')
      )
  )
$$;

drop policy if exists "Relaciones visibles por alcance" on public.profile_role_relationships;
create policy "Relaciones visibles por alcance"
on public.profile_role_relationships
for select
to authenticated
using (
  manager_profile_id = auth.uid()
  or managed_profile_id = auth.uid()
  or public.current_user_can_access_province(province_id)
);

drop policy if exists "Relaciones gestionables por rango" on public.profile_role_relationships;
create policy "Relaciones gestionables por rango"
on public.profile_role_relationships
for all
to authenticated
using (
  public.current_user_can_see_all_provinces()
  or manager_profile_id = auth.uid()
)
with check (
  public.current_user_can_see_all_provinces()
  or manager_profile_id = auth.uid()
);

drop policy if exists "Noticias publicas" on public.news;
drop policy if exists "Noticias internas para aprobados" on public.news;
drop policy if exists "Noticias por alcance territorial" on public.news;
create policy "Noticias por alcance territorial" on public.news for select using (
  is_public = true
  or public.current_user_can_access_province(province_id)
);

drop policy if exists "Eventos publicos" on public.events;
drop policy if exists "Eventos internos para aprobados" on public.events;
drop policy if exists "Eventos por alcance territorial" on public.events;
create policy "Eventos por alcance territorial" on public.events for select using (
  is_public = true
  or public.current_user_can_access_province(province_id)
);
