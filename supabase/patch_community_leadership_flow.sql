-- Flujo de dirigencia comunitaria: sucesores, publicaciones y solicitudes privadas.

alter table public.user_requests
  add column if not exists target_user_id uuid references public.profiles(id),
  add column if not exists target_role public.user_role,
  add column if not exists community_id uuid references public.communities(id);

create table if not exists public.community_publications (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  kind text not null check (kind in ('aviso', 'noticia', 'fecha', 'encuesta')),
  title text not null,
  body text not null,
  event_date date,
  visibility text not null default 'publica' check (visibility in ('publica', 'registrados', 'sedimentadores')),
  created_at timestamptz not null default now()
);

alter table public.community_publications enable row level security;

drop policy if exists "Publicaciones comunitarias por visibilidad" on public.community_publications;
create policy "Publicaciones comunitarias por visibilidad"
on public.community_publications
for select
using (
  visibility = 'publica'
  or (
    visibility = 'registrados'
    and auth.uid() is not null
  )
  or (
    visibility = 'sedimentadores'
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.status = 'aprobado'
        and profiles.role in (
          'sedimentador',
          'animador_comunidad',
          'coordinador_comunidad',
          'vocal',
          'asesor',
          'coordinador_diocesano',
          'vocal_nacional',
          'coordinador_nacional',
          'administrador'
        )
    )
  )
);

drop policy if exists "Dirigentes crean publicaciones comunitarias" on public.community_publications;
create policy "Dirigentes crean publicaciones comunitarias"
on public.community_publications
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'aprobado'
      and profiles.role in ('animador_comunidad', 'coordinador_comunidad', 'administrador')
      and (
        profiles.role = 'administrador'
        or profiles.managed_community_id = community_publications.community_id
        or profiles.community_id = community_publications.community_id
        or profiles.community_name = (
          select communities.name
          from public.communities
          where communities.id = community_publications.community_id
        )
      )
  )
);

create or replace function public.get_my_managed_community_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    profiles.managed_community_id,
    profiles.community_id,
    (
      select communities.id
      from public.communities
      where communities.name = profiles.community_name
      limit 1
    )
  )
  from public.profiles
  where profiles.id = auth.uid()
  limit 1
$$;

create or replace function public.get_my_community_members()
returns table (
  id uuid,
  full_name text,
  email text,
  role text,
  community_name text,
  province text
)
language sql
security definer
set search_path = public
as $$
  select
    profiles.id,
    profiles.full_name,
    auth.users.email::text as email,
    profiles.role::text,
    profiles.community_name,
    provinces.name as province
  from public.profiles
  join auth.users on auth.users.id = profiles.id
  left join public.provinces on provinces.id = profiles.province_id
  where profiles.status = 'aprobado'
    and profiles.community_name = (
      select me.community_name
      from public.profiles me
      where me.id = auth.uid()
    )
  order by profiles.full_name nulls last, auth.users.email;
$$;

grant execute on function public.get_my_community_members() to authenticated;

create or replace function public.create_community_publication(
  p_kind text,
  p_title text,
  p_body text,
  p_event_date date default null,
  p_visibility text default 'publica'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  author public.profiles%rowtype;
  target_community_id uuid;
  new_id uuid;
  final_visibility text;
begin
  select * into author from public.profiles where id = auth.uid();

  if author.id is null or author.status <> 'aprobado' or author.role not in ('animador_comunidad', 'coordinador_comunidad', 'administrador') then
    raise exception 'No autorizado';
  end if;

  target_community_id := coalesce(
    author.managed_community_id,
    author.community_id,
    (select communities.id from public.communities where communities.name = author.community_name limit 1)
  );

  if target_community_id is null then
    raise exception 'No hay comunidad asignada';
  end if;

  final_visibility := case
    when author.role = 'animador_comunidad' then 'publica'
    when p_visibility in ('publica', 'registrados', 'sedimentadores') then p_visibility
    else 'publica'
  end;

  insert into public.community_publications (community_id, created_by, kind, title, body, event_date, visibility)
  values (target_community_id, auth.uid(), p_kind, left(trim(p_title), 120), left(trim(p_body), 2000), p_event_date, final_visibility)
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.create_community_publication(text, text, text, date, text) to authenticated;

create or replace function public.create_leadership_change_request(
  p_successor_user_id uuid,
  p_successor_role text,
  p_details text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  requester public.profiles%rowtype;
  successor public.profiles%rowtype;
  target_community_id uuid;
  new_id uuid;
begin
  select * into requester from public.profiles where id = auth.uid();
  select * into successor from public.profiles where id = p_successor_user_id;

  if requester.id is null or requester.status <> 'aprobado' or requester.role not in ('animador_comunidad', 'coordinador_comunidad') then
    raise exception 'No autorizado';
  end if;

  if p_successor_role not in ('animador_comunidad', 'coordinador_comunidad') then
    raise exception 'Rol sucesor invalido';
  end if;

  if successor.id is null or successor.community_name is distinct from requester.community_name then
    raise exception 'El sucesor debe pertenecer a la misma comunidad';
  end if;

  target_community_id := coalesce(
    requester.managed_community_id,
    requester.community_id,
    (select communities.id from public.communities where communities.name = requester.community_name limit 1)
  );

  insert into public.user_requests (user_id, request_type, details, target_user_id, target_role, community_id)
  values (auth.uid(), 'Cambio de dirigencia', left(p_details, 500), p_successor_user_id, p_successor_role::public.user_role, target_community_id)
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.create_leadership_change_request(uuid, text, text) to authenticated;

drop function if exists public.get_my_requests();
drop function if exists public.admin_get_requests();

create or replace function public.get_my_requests()
returns table (
  id uuid,
  user_id uuid,
  title text,
  requester text,
  definition text,
  created_at timestamptz,
  status text,
  admin_message text,
  resolved_at timestamptz,
  resolved_by_name text,
  resolved_by_role text,
  target_user_id uuid,
  target_user_name text,
  target_role text,
  community_name text
)
language sql
security definer
set search_path = public
as $$
  select
    requests.id,
    requests.user_id,
    requests.request_type as title,
    requester.full_name as requester,
    coalesce(requests.details, '') as definition,
    requests.created_at,
    requests.status,
    requests.admin_message,
    requests.resolved_at,
    resolver.full_name as resolved_by_name,
    resolver.role::text as resolved_by_role,
    requests.target_user_id,
    target.full_name as target_user_name,
    requests.target_role::text,
    communities.name as community_name
  from public.user_requests requests
  join public.profiles requester on requester.id = requests.user_id
  left join public.profiles resolver on resolver.id = requests.resolved_by
  left join public.profiles target on target.id = requests.target_user_id
  left join public.communities on communities.id = requests.community_id
  where requests.user_id = auth.uid()
  order by requests.created_at desc;
$$;

grant execute on function public.get_my_requests() to authenticated;

create or replace function public.admin_get_requests()
returns table (
  id uuid,
  user_id uuid,
  title text,
  requester text,
  definition text,
  created_at timestamptz,
  status text,
  admin_message text,
  resolved_at timestamptz,
  resolved_by_name text,
  resolved_by_role text,
  target_user_id uuid,
  target_user_name text,
  target_role text,
  community_name text
)
language sql
security definer
set search_path = public
as $$
  select
    requests.id,
    requests.user_id,
    requests.request_type as title,
    requester.full_name as requester,
    coalesce(requests.details, '') as definition,
    requests.created_at,
    requests.status,
    requests.admin_message,
    requests.resolved_at,
    resolver.full_name as resolved_by_name,
    resolver.role::text as resolved_by_role,
    requests.target_user_id,
    target.full_name as target_user_name,
    requests.target_role::text,
    communities.name as community_name
  from public.user_requests requests
  join public.profiles requester on requester.id = requests.user_id
  left join public.profiles resolver on resolver.id = requests.resolved_by
  left join public.profiles target on target.id = requests.target_user_id
  left join public.communities on communities.id = requests.community_id
  left join public.provinces on provinces.id = requester.province_id
  where exists (
    select 1
    from public.profiles approver
    where approver.id = auth.uid()
      and approver.status = 'aprobado'
      and (
        approver.role = 'administrador'
        or approver.role in ('vocal', 'coordinador_diocesano')
          and approver.province_id = requester.province_id
      )
  )
  order by requests.created_at asc;
$$;

grant execute on function public.admin_get_requests() to authenticated;

create or replace function public.admin_resolve_user_request(
  p_request_id uuid,
  p_status text,
  p_admin_message text,
  p_assign_role text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.user_requests%rowtype;
  approver public.profiles%rowtype;
  final_role public.user_role;
  final_target uuid;
begin
  select * into request_row from public.user_requests where id = p_request_id;
  select * into approver from public.profiles where id = auth.uid();

  if request_row.id is null then
    raise exception 'Solicitud inexistente';
  end if;

  if approver.id is null or approver.status <> 'aprobado' or not (
    approver.role = 'administrador'
    or approver.role in ('vocal', 'coordinador_diocesano')
      and approver.province_id = (select profiles.province_id from public.profiles where profiles.id = request_row.user_id)
  ) then
    raise exception 'No autorizado';
  end if;

  update public.user_requests
  set
    status = p_status,
    admin_message = nullif(trim(p_admin_message), ''),
    resolved_at = now(),
    resolved_by = auth.uid()
  where id = p_request_id;

  if p_status = 'aprobada' then
    final_role := coalesce(request_row.target_role, nullif(p_assign_role, '')::public.user_role);
    final_target := coalesce(request_row.target_user_id, request_row.user_id);

    if final_role is not null then
      update public.profiles
      set
        role = final_role,
        status = 'aprobado',
        managed_community_id = case
          when final_role in ('animador_comunidad', 'coordinador_comunidad') then request_row.community_id
          else managed_community_id
        end,
        community_id = coalesce(community_id, request_row.community_id),
        approved_at = coalesce(approved_at, now()),
        approved_by = coalesce(approved_by, auth.uid())
      where id = final_target;

      if final_role = 'animador_comunidad' then
        update public.communities set animator_profile_id = final_target where id = request_row.community_id;
      elsif final_role = 'coordinador_comunidad' then
        update public.communities set coordinator_profile_id = final_target where id = request_row.community_id;
      end if;
    end if;
  end if;
end;
$$;

grant execute on function public.admin_resolve_user_request(uuid, text, text, text) to authenticated;
