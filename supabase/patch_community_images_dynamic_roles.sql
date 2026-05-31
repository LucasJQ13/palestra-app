-- Community images, scoped community editing and assignable role aliases.
-- Ejecutar completo en Supabase SQL Editor.

alter table public.profiles
  add column if not exists display_role_label text;

alter table public.communities
  add column if not exists image_url text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists is_active boolean not null default true,
  add column if not exists archived_at timestamptz,
  add column if not exists updated_at timestamptz,
  add column if not exists updated_by uuid references public.profiles(id);

insert into storage.buckets (id, name, public)
values ('community-images', 'community-images', true)
on conflict (id) do update set public = true;

create table if not exists public.role_aliases (
  id uuid primary key default gen_random_uuid(),
  base_role public.user_role not null,
  display_label text not null,
  province_id uuid references public.provinces(id) on delete cascade,
  is_active boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (base_role, display_label, province_id)
);

alter table public.role_aliases enable row level security;

drop policy if exists "Alias de rangos visibles" on public.role_aliases;
create policy "Alias de rangos visibles"
on public.role_aliases
for select
using (true);

drop policy if exists "Solo admin gestiona alias de rangos" on public.role_aliases;
create policy "Solo admin gestiona alias de rangos"
on public.role_aliases
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create or replace function public.current_user_can_manage_community(p_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles actor
    join public.communities target on target.id = p_community_id
    where actor.id = auth.uid()
      and actor.status = 'aprobado'
      and (
        actor.role = 'administrador'
        or (
          actor.role in ('vocal', 'coordinador_diocesano')
          and actor.province_id = target.province_id
        )
        or (
          actor.role = 'coordinador_comunidad'
          and actor.province_id = target.province_id
          and lower(coalesce(actor.community_name, '')) = lower(target.name)
        )
      )
  );
$$;

create or replace function public.current_user_can_manage_community_province(p_province_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.status = 'aprobado'
      and (
        actor.role = 'administrador'
        or (
          actor.role in ('vocal', 'coordinador_diocesano')
          and actor.province_id = p_province_id
        )
      )
  );
$$;

grant execute on function public.current_user_can_manage_community(uuid) to authenticated;
grant execute on function public.current_user_can_manage_community_province(uuid) to authenticated;

drop policy if exists "Dirigencia actualiza comunidades por alcance" on public.communities;
create policy "Dirigencia actualiza comunidades por alcance"
on public.communities
for update
to authenticated
using (public.current_user_can_manage_community(id))
with check (public.current_user_can_manage_community(id));

drop policy if exists "Imagenes de comunidades visibles" on storage.objects;
create policy "Imagenes de comunidades visibles"
on storage.objects
for select
using (bucket_id = 'community-images');

drop policy if exists "Dirigencia sube imagenes de comunidades" on storage.objects;
create policy "Dirigencia sube imagenes de comunidades"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'community-images'
  and public.current_user_can_manage_community(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "Dirigencia actualiza imagenes de comunidades" on storage.objects;
create policy "Dirigencia actualiza imagenes de comunidades"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'community-images'
  and public.current_user_can_manage_community(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'community-images'
  and public.current_user_can_manage_community(((storage.foldername(name))[1])::uuid)
);

drop function if exists public.admin_update_community(uuid, text, text, text, text, text, text);
drop function if exists public.admin_update_community(uuid, text, text, text, text, text, text, text);
create or replace function public.admin_update_community(
  p_community_id uuid,
  p_name text,
  p_address text,
  p_phone text,
  p_meeting_day text,
  p_meeting_time text,
  p_description text,
  p_image_url text default null,
  p_latitude double precision default null,
  p_longitude double precision default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_name text;
  new_name text;
begin
  if not public.current_user_can_manage_community(p_community_id) then
    raise exception 'No autorizado para editar esta comunidad';
  end if;

  select name into old_name from public.communities where id = p_community_id;
  if old_name is null then
    raise exception 'Comunidad no encontrada';
  end if;

  new_name := coalesce(nullif(trim(p_name), ''), old_name);

  update public.communities
  set
    name = new_name,
    address = coalesce(nullif(trim(p_address), ''), address),
    phone = nullif(trim(p_phone), ''),
    meeting_day = nullif(trim(p_meeting_day), ''),
    meeting_time = nullif(trim(p_meeting_time), ''),
    description = nullif(trim(p_description), ''),
    image_url = coalesce(nullif(trim(p_image_url), ''), image_url),
    latitude = p_latitude,
    longitude = p_longitude,
    updated_by = auth.uid(),
    updated_at = now()
  where id = p_community_id;

  update public.profiles
  set community_name = new_name
  where community_name = old_name;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_community', jsonb_build_object(
    'community_id', p_community_id,
    'old_name', old_name,
    'new_name', new_name,
    'image_url_changed', nullif(trim(coalesce(p_image_url, '')), '') is not null
  ));
end;
$$;

grant execute on function public.admin_update_community(uuid, text, text, text, text, text, text, text, double precision, double precision) to authenticated;

create or replace function public.get_assignable_role_aliases()
returns table (
  id uuid,
  base_role public.user_role,
  display_label text,
  province text,
  is_active boolean,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    aliases.id,
    aliases.base_role,
    aliases.display_label,
    provinces.name as province,
    aliases.is_active,
    aliases.updated_at
  from public.role_aliases aliases
  left join public.provinces on provinces.id = aliases.province_id
  order by aliases.base_role::text, aliases.display_label;
$$;

create or replace function public.admin_save_role_alias(
  p_alias_id uuid,
  p_base_role public.user_role,
  p_display_label text,
  p_province text default null,
  p_is_active boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_province_id uuid;
  saved_id uuid;
begin
  if not public.current_user_is_admin() then
    raise exception 'Solo Administrador puede duplicar rangos';
  end if;

  if p_base_role in ('invitado', 'administrador') then
    raise exception 'Este rango no puede duplicarse';
  end if;

  if nullif(trim(p_display_label), '') is null then
    raise exception 'El nombre visible del alias es obligatorio';
  end if;

  if nullif(trim(coalesce(p_province, '')), '') is not null then
    select id into selected_province_id
    from public.provinces
    where lower(name) = lower(trim(p_province))
    limit 1;

    if selected_province_id is null then
      raise exception 'Provincia no encontrada';
    end if;
  end if;

  if p_alias_id is not null then
    update public.role_aliases
    set
      base_role = p_base_role,
      display_label = trim(p_display_label),
      province_id = selected_province_id,
      is_active = coalesce(p_is_active, true),
      updated_by = auth.uid(),
      updated_at = now()
    where id = p_alias_id
    returning id into saved_id;
  else
    insert into public.role_aliases (base_role, display_label, province_id, is_active, updated_by, updated_at)
    values (p_base_role, trim(p_display_label), selected_province_id, coalesce(p_is_active, true), auth.uid(), now())
    on conflict (base_role, display_label, province_id) do update
    set
      is_active = excluded.is_active,
      updated_by = excluded.updated_by,
      updated_at = now()
    returning id into saved_id;
  end if;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_save_role_alias', jsonb_build_object(
    'alias_id', saved_id,
    'base_role', p_base_role,
    'display_label', p_display_label,
    'province_id', selected_province_id
  ));

  return saved_id;
end;
$$;

create or replace function public.admin_set_role_alias_status(
  p_alias_id uuid,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'Solo Administrador puede modificar alias';
  end if;

  update public.role_aliases
  set is_active = coalesce(p_is_active, true), updated_by = auth.uid(), updated_at = now()
  where id = p_alias_id;
end;
$$;

grant select on public.role_aliases to authenticated;
grant execute on function public.get_assignable_role_aliases() to authenticated;
grant execute on function public.admin_save_role_alias(uuid, public.user_role, text, text, boolean) to authenticated;
grant execute on function public.admin_set_role_alias_status(uuid, boolean) to authenticated;

drop function if exists public.get_my_profile();
create or replace function public.get_my_profile()
returns table (
  user_id uuid,
  email text,
  full_name text,
  avatar_url text,
  phone text,
  province text,
  community_name text,
  status public.user_status,
  role public.user_role,
  display_role_label text
)
language sql
security definer
set search_path = public
as $$
  select
    profiles.id as user_id,
    auth.users.email,
    profiles.full_name,
    profiles.avatar_url,
    profiles.phone,
    provinces.name as province,
    profiles.community_name,
    profiles.status,
    profiles.role,
    profiles.display_role_label
  from public.profiles
  join auth.users on auth.users.id = profiles.id
  left join public.provinces on provinces.id = profiles.province_id
  where profiles.id = auth.uid();
$$;

grant execute on function public.get_my_profile() to authenticated;

drop function if exists public.admin_get_users();
create or replace function public.admin_get_users()
returns table (
  id uuid,
  email text,
  full_name text,
  avatar_url text,
  phone text,
  province text,
  community_name text,
  status text,
  role text,
  display_role_label text,
  email_confirmed_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    profiles.id,
    auth.users.email,
    profiles.full_name,
    profiles.avatar_url,
    profiles.phone,
    provinces.name as province,
    profiles.community_name,
    profiles.status::text,
    profiles.role::text,
    profiles.display_role_label,
    auth.users.email_confirmed_at
  from public.profiles
  left join auth.users on auth.users.id = profiles.id
  left join public.provinces on provinces.id = profiles.province_id
  where public.current_user_can_edit_profile(profiles.id)
     or public.current_user_is_admin()
  order by provinces.name nulls last, profiles.full_name;
$$;

grant execute on function public.admin_get_users() to authenticated;

create or replace function public.admin_update_user(
  p_profile_id uuid,
  p_email text,
  p_password text,
  p_full_name text,
  p_phone text,
  p_province text,
  p_community_name text,
  p_status text,
  p_role text,
  p_display_role_label text default null
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  selected_province_id uuid;
  requested_role public.user_role;
begin
  if not public.current_user_can_edit_profile(p_profile_id) and not public.current_user_is_admin() then
    raise exception 'No podes editar usuarios de rango superior o fuera de tu alcance';
  end if;

  if p_role = 'administrador' then
    raise exception 'El rol Administrador no puede asignarse desde la app';
  end if;

  requested_role := p_role::public.user_role;

  select id into selected_province_id
  from public.provinces
  where name = p_province
  limit 1;

  if not public.current_user_can_assign_role(requested_role, selected_province_id) and not public.current_user_is_admin() then
    raise exception 'No podes asignar un rango superior al tuyo o fuera de tu alcance';
  end if;

  if public.current_user_is_admin() then
    update auth.users
    set
      email = coalesce(nullif(trim(p_email), ''), email),
      encrypted_password = case
        when nullif(p_password, '') is null then encrypted_password
        else extensions.crypt(p_password, extensions.gen_salt('bf'))
      end,
      updated_at = now()
    where id = p_profile_id;
  end if;

  update public.profiles
  set
    full_name = nullif(trim(p_full_name), ''),
    phone = nullif(trim(p_phone), ''),
    province_id = selected_province_id,
    community_name = nullif(trim(p_community_name), ''),
    status = p_status::public.user_status,
    role = requested_role,
    display_role_label = nullif(trim(coalesce(p_display_role_label, '')), ''),
    approved_at = case when p_status = 'aprobado' then coalesce(approved_at, now()) else approved_at end,
    approved_by = case when p_status = 'aprobado' then coalesce(approved_by, auth.uid()) else approved_by end
  where id = p_profile_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_user', jsonb_build_object(
    'profile_id', p_profile_id,
    'status', p_status,
    'role', p_role,
    'display_role_label', p_display_role_label
  ));
end;
$$;

grant execute on function public.admin_update_user(uuid, text, text, text, text, text, text, text, text, text) to authenticated;
