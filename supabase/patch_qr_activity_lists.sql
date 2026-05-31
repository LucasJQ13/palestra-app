-- Listas de actividad con validacion por QR.
-- Ejecutar en Supabase SQL Editor despues del patch de credenciales QR.

create extension if not exists pgcrypto;

create table if not exists public.qr_activity_lists (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  province text not null,
  community_name text,
  created_by uuid references public.profiles(id) on delete set null,
  created_by_role text,
  status text not null default 'activa' check (status in ('activa', 'cerrada', 'archivada')),
  created_at timestamptz not null default now()
);

create table if not exists public.qr_activity_members (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.qr_activity_lists(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  added_by uuid references public.profiles(id) on delete set null,
  added_at timestamptz not null default now(),
  unique (list_id, user_id)
);

create table if not exists public.qr_activity_attendance (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.qr_activity_lists(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  validated_by uuid references public.profiles(id) on delete set null,
  validated_at timestamptz not null default now(),
  unique (list_id, user_id)
);

alter table public.qr_activity_lists
  alter column province drop not null;

alter table public.qr_activity_lists enable row level security;
alter table public.qr_activity_members enable row level security;
alter table public.qr_activity_attendance enable row level security;

create or replace function public.current_profile_role()
returns text language sql security definer set search_path = public as $$
  select role::text from public.profiles where id = auth.uid()
$$;

create or replace function public.current_profile_province()
returns text language sql security definer set search_path = public as $$
  select p.name from public.profiles pr left join public.provinces p on p.id = pr.province_id where pr.id = auth.uid()
$$;

create or replace function public.current_profile_community()
returns text language sql security definer set search_path = public as $$
  select community_name from public.profiles where id = auth.uid()
$$;

create or replace function public.can_access_qr_activity_list(row_province text, row_community text, row_created_by_role text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  my_role text := public.current_profile_role();
  my_province text := public.current_profile_province();
  my_community text := public.current_profile_community();
begin
  if my_role = 'administrador' then
    return true;
  end if;
  if my_role in ('vocal_nacional', 'coordinador_nacional') then
    return row_created_by_role in ('vocal_nacional', 'coordinador_nacional', 'administrador');
  end if;
  if my_role in ('vocal', 'coordinador_diocesano') then
    return row_province = my_province;
  end if;
  if my_role in ('animador_comunidad', 'coordinador_comunidad') then
    return row_province = my_province and (row_community is null or row_community = my_community);
  end if;
  return false;
end;
$$;

create or replace function public.get_qr_activity_lists()
returns table (
  id uuid,
  title text,
  province text,
  community_name text,
  created_by uuid,
  created_by_name text,
  created_by_role text,
  status text,
  created_at timestamptz
)
language sql security definer set search_path = public as $$
  select l.id, l.title, l.province, l.community_name, l.created_by, p.full_name, l.created_by_role, l.status, l.created_at
  from public.qr_activity_lists l
  left join public.profiles p on p.id = l.created_by
  where l.status <> 'archivada'
    and public.can_access_qr_activity_list(l.province, l.community_name, l.created_by_role)
  order by l.created_at desc
$$;

create or replace function public.create_qr_activity_list(p_title text, p_province text, p_community_name text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  my_role text := public.current_profile_role();
  new_id uuid;
begin
  if my_role not in ('vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador') then
    raise exception 'Tu rango no puede crear listas QR.';
  end if;
  insert into public.qr_activity_lists (title, province, community_name, created_by, created_by_role)
  values (trim(p_title), nullif(trim(coalesce(p_province, '')), ''), nullif(trim(coalesce(p_community_name, '')), ''), auth.uid(), my_role)
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.update_qr_activity_list(p_list_id uuid, p_title text, p_province text default null, p_community_name text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  list_row public.qr_activity_lists%rowtype;
  my_role text := public.current_profile_role();
begin
  select * into list_row from public.qr_activity_lists where id = p_list_id;
  if list_row.id is null or not public.can_access_qr_activity_list(list_row.province, list_row.community_name, list_row.created_by_role) then
    raise exception 'Lista QR no disponible.';
  end if;
  if my_role not in ('vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador') then
    raise exception 'Tu rango no puede editar listas QR.';
  end if;
  update public.qr_activity_lists
  set title = trim(p_title),
      province = nullif(trim(coalesce(p_province, '')), ''),
      community_name = nullif(trim(coalesce(p_community_name, '')), '')
  where id = p_list_id;
end;
$$;

create or replace function public.archive_qr_activity_list(p_list_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  list_row public.qr_activity_lists%rowtype;
  my_role text := public.current_profile_role();
begin
  select * into list_row from public.qr_activity_lists where id = p_list_id;
  if list_row.id is null or not public.can_access_qr_activity_list(list_row.province, list_row.community_name, list_row.created_by_role) then
    raise exception 'Lista QR no disponible.';
  end if;
  if my_role not in ('vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador') then
    raise exception 'Tu rango no puede eliminar listas QR.';
  end if;
  update public.qr_activity_lists set status = 'archivada' where id = p_list_id;
end;
$$;

create or replace function public.get_qr_activity_members(p_list_id uuid)
returns table (
  id uuid,
  list_id uuid,
  user_id uuid,
  full_name text,
  role text,
  province text,
  community_name text,
  added_by uuid,
  added_at timestamptz
)
language sql security definer set search_path = public as $$
  select m.id, m.list_id, m.user_id, p.full_name, p.role::text, pr.name, p.community_name, m.added_by, m.added_at
  from public.qr_activity_members m
  join public.qr_activity_lists l on l.id = m.list_id
  join public.profiles p on p.id = m.user_id
  left join public.provinces pr on pr.id = p.province_id
  where m.list_id = p_list_id
    and public.can_access_qr_activity_list(l.province, l.community_name, l.created_by_role)
  order by p.full_name asc
$$;

create or replace function public.get_qr_activity_attendance(p_list_id uuid)
returns table (
  id uuid,
  list_id uuid,
  user_id uuid,
  full_name text,
  role text,
  province text,
  community_name text,
  validated_by uuid,
  validated_at timestamptz
)
language sql security definer set search_path = public as $$
  select a.id, a.list_id, a.user_id, p.full_name, p.role::text, pr.name, p.community_name, a.validated_by, a.validated_at
  from public.qr_activity_attendance a
  join public.qr_activity_lists l on l.id = a.list_id
  join public.profiles p on p.id = a.user_id
  left join public.provinces pr on pr.id = p.province_id
  where a.list_id = p_list_id
    and public.can_access_qr_activity_list(l.province, l.community_name, l.created_by_role)
  order by a.validated_at desc
$$;

create or replace function public.add_qr_activity_member(p_list_id uuid, p_user_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  list_row public.qr_activity_lists%rowtype;
  user_province text;
  user_community text;
  my_role text := public.current_profile_role();
begin
  select * into list_row from public.qr_activity_lists where id = p_list_id;
  if list_row.id is null or not public.can_access_qr_activity_list(list_row.province, list_row.community_name, list_row.created_by_role) then
    raise exception 'Lista QR no disponible.';
  end if;

  select pr.name, p.community_name into user_province, user_community
  from public.profiles p left join public.provinces pr on pr.id = p.province_id
  where p.id = p_user_id;

  if list_row.province is not null and user_province <> list_row.province then
    raise exception 'El usuario no pertenece a la provincia de la lista.';
  end if;
  if list_row.community_name is not null and user_community <> list_row.community_name then
    raise exception 'El usuario no pertenece a la comunidad de la lista.';
  end if;
  if my_role in ('animador_comunidad', 'coordinador_comunidad') and user_community <> public.current_profile_community() then
    raise exception 'Solo puedes cargar miembros de tu comunidad.';
  end if;

  insert into public.qr_activity_members (list_id, user_id, added_by)
  values (p_list_id, p_user_id, auth.uid())
  on conflict (list_id, user_id) do nothing;
end;
$$;

create or replace function public.add_qr_activity_members_by_scope(p_list_id uuid, p_province text default null, p_community_name text default null)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  list_row public.qr_activity_lists%rowtype;
  inserted_count integer := 0;
  my_role text := public.current_profile_role();
begin
  select * into list_row from public.qr_activity_lists where id = p_list_id;
  if list_row.id is null or not public.can_access_qr_activity_list(list_row.province, list_row.community_name, list_row.created_by_role) then
    raise exception 'Lista QR no disponible.';
  end if;
  insert into public.qr_activity_members (list_id, user_id, added_by)
  select p_list_id, p.id, auth.uid()
  from public.profiles p
  left join public.provinces pr on pr.id = p.province_id
  where p.status = 'aprobado'
    and (coalesce(p_province, list_row.province) is null or pr.name = coalesce(p_province, list_row.province))
    and (coalesce(p_community_name, list_row.community_name) is null or p.community_name = coalesce(p_community_name, list_row.community_name))
    and (my_role not in ('animador_comunidad', 'coordinador_comunidad') or p.community_name = public.current_profile_community())
  on conflict (list_id, user_id) do nothing;
  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.remove_qr_activity_member(p_list_id uuid, p_user_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  list_row public.qr_activity_lists%rowtype;
begin
  select * into list_row from public.qr_activity_lists where id = p_list_id;
  if list_row.id is null or not public.can_access_qr_activity_list(list_row.province, list_row.community_name, list_row.created_by_role) then
    raise exception 'Lista QR no disponible.';
  end if;
  delete from public.qr_activity_attendance where list_id = p_list_id and user_id = p_user_id;
  delete from public.qr_activity_members where list_id = p_list_id and user_id = p_user_id;
end;
$$;

create or replace function public.validate_qr_activity_attendance(p_list_id uuid, p_token text)
returns table (
  status text,
  message text,
  credential_id uuid,
  user_id uuid,
  full_name text,
  role text,
  subrole_key text,
  province text,
  community_name text,
  user_status text,
  issued_at timestamptz,
  expires_at timestamptz
)
language plpgsql security definer set search_path = public as $$
declare
  validated record;
  is_member boolean;
  list_row public.qr_activity_lists%rowtype;
begin
  select * into list_row from public.qr_activity_lists where id = p_list_id;
  if list_row.id is null or not public.can_access_qr_activity_list(list_row.province, list_row.community_name, list_row.created_by_role) then
    raise exception 'Lista QR no disponible.';
  end if;

  select * into validated from public.validate_profile_credential(p_token) limit 1;
  if validated.status <> 'valid' then
    return query select validated.status, validated.message, validated.credential_id, validated.user_id, validated.full_name, validated.role, validated.subrole_key, validated.province, validated.community_name, validated.user_status, validated.issued_at, validated.expires_at;
    return;
  end if;

  select exists (
    select 1 from public.qr_activity_members m where m.list_id = p_list_id and m.user_id = validated.user_id
  ) into is_member;

  if not is_member then
    return query select 'invalid'::text, 'Usuario no Registrado para esta actividad'::text, validated.credential_id, validated.user_id, validated.full_name, validated.role, validated.subrole_key, validated.province, validated.community_name, validated.user_status, validated.issued_at, validated.expires_at;
    return;
  end if;

  insert into public.qr_activity_attendance (list_id, user_id, validated_by)
  values (p_list_id, validated.user_id, auth.uid())
  on conflict (list_id, user_id) do update set validated_at = excluded.validated_at, validated_by = excluded.validated_by;

  return query select 'valid'::text, 'Credencial valida para esta actividad'::text, validated.credential_id, validated.user_id, validated.full_name, validated.role, validated.subrole_key, validated.province, validated.community_name, validated.user_status, validated.issued_at, validated.expires_at;
end;
$$;

grant execute on function public.get_qr_activity_lists() to authenticated;
grant execute on function public.create_qr_activity_list(text, text, text) to authenticated;
grant execute on function public.update_qr_activity_list(uuid, text, text, text) to authenticated;
grant execute on function public.archive_qr_activity_list(uuid) to authenticated;
grant execute on function public.get_qr_activity_members(uuid) to authenticated;
grant execute on function public.get_qr_activity_attendance(uuid) to authenticated;
grant execute on function public.add_qr_activity_member(uuid, uuid) to authenticated;
grant execute on function public.add_qr_activity_members_by_scope(uuid, text, text) to authenticated;
grant execute on function public.remove_qr_activity_member(uuid, uuid) to authenticated;
grant execute on function public.validate_qr_activity_attendance(uuid, text) to authenticated;
