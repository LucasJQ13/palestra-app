create table if not exists public.community_advisors (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  advisor_user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id),
  assigned_at timestamptz not null default now(),
  active boolean not null default true,
  removed_at timestamptz,
  removed_by uuid references public.profiles(id)
);

create unique index if not exists community_advisors_active_unique
on public.community_advisors (community_id, advisor_user_id)
where active;

alter table public.community_advisors enable row level security;
revoke all on public.community_advisors from anon, authenticated;

create or replace function public.current_user_can_manage_community_advisors(p_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles actor
    join public.communities community on community.id = p_community_id
    where actor.id = auth.uid()
      and actor.status = 'aprobado'
      and community.archived_at is null
      and (
        actor.role = 'administrador'
        or (
          actor.role = 'vocal'
          and actor.province_id = community.province_id
        )
        or (
          actor.role = 'coordinador_comunidad'
          and p_community_id = public.current_user_internal_community_id()
        )
      )
  )
$$;

grant execute on function public.current_user_can_manage_community_advisors(uuid) to authenticated;

create or replace function public.get_community_advisor_assignments(p_community_id uuid)
returns table (
  id uuid,
  community_id uuid,
  community_name text,
  province text,
  advisor_user_id uuid,
  advisor_name text,
  advisor_avatar_url text,
  assigned_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_can_manage_community_advisors(p_community_id) then
    raise exception 'No autorizado para administrar asesores de esta comunidad';
  end if;

  return query
  select
    assignment.id,
    assignment.community_id,
    community.name,
    province.name,
    assignment.advisor_user_id,
    coalesce(advisor.full_name, 'Asesor'),
    advisor.avatar_url,
    assignment.assigned_at
  from public.community_advisors assignment
  join public.communities community on community.id = assignment.community_id
  join public.provinces province on province.id = community.province_id
  join public.profiles advisor on advisor.id = assignment.advisor_user_id
  where assignment.community_id = p_community_id
    and assignment.active
  order by assignment.assigned_at, advisor.full_name;
end;
$$;

grant execute on function public.get_community_advisor_assignments(uuid) to authenticated;

create or replace function public.get_my_community_advisor_assignments()
returns table (
  id uuid,
  community_id uuid,
  community_name text,
  province text,
  advisor_user_id uuid,
  advisor_name text,
  advisor_avatar_url text,
  assigned_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    assignment.id,
    assignment.community_id,
    community.name,
    province.name,
    assignment.advisor_user_id,
    coalesce(advisor.full_name, 'Asesor'),
    advisor.avatar_url,
    assignment.assigned_at
  from public.community_advisors assignment
  join public.communities community on community.id = assignment.community_id
  join public.provinces province on province.id = community.province_id
  join public.profiles advisor on advisor.id = assignment.advisor_user_id
  where assignment.advisor_user_id = auth.uid()
    and assignment.active
    and advisor.status = 'aprobado'
    and advisor.role = 'asesor'
  order by assignment.assigned_at
$$;

grant execute on function public.get_my_community_advisor_assignments() to authenticated;

create or replace function public.get_my_community_advisors()
returns table (
  id uuid,
  community_id uuid,
  community_name text,
  province text,
  advisor_user_id uuid,
  advisor_name text,
  advisor_avatar_url text,
  assigned_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with actor as (
    select
      profile.id,
      profile.community_id,
      profile.community_name,
      profile.province_id
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.status = 'aprobado'
    limit 1
  ),
  actor_community as (
    select coalesce(
      actor.community_id,
      (
        select community.id
        from public.communities community
        where community.name = actor.community_name
          and (actor.province_id is null or community.province_id = actor.province_id)
          and community.archived_at is null
        limit 1
      )
    ) as id
    from actor
  )
  select
    assignment.id,
    assignment.community_id,
    community.name,
    province.name,
    assignment.advisor_user_id,
    coalesce(advisor.full_name, 'Asesor'),
    advisor.avatar_url,
    assignment.assigned_at
  from public.community_advisors assignment
  join actor_community on actor_community.id = assignment.community_id
  join public.communities community on community.id = assignment.community_id
  join public.provinces province on province.id = community.province_id
  join public.profiles advisor on advisor.id = assignment.advisor_user_id
  where assignment.active
    and advisor.status = 'aprobado'
    and advisor.role = 'asesor'
  order by assignment.assigned_at
$$;

grant execute on function public.get_my_community_advisors() to authenticated;

create or replace function public.assign_community_advisor(
  p_community_id uuid,
  p_advisor_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  target public.profiles%rowtype;
  target_province_id uuid;
begin
  if not public.current_user_can_manage_community_advisors(p_community_id) then
    raise exception 'No autorizado para asignar asesores a esta comunidad';
  end if;

  perform 1
  from public.communities
  where id = p_community_id
    and archived_at is null
    and is_active = true
  for update;

  if not found then
    raise exception 'La comunidad no se encuentra activa';
  end if;

  select * into target
  from public.profiles
  where id = p_advisor_user_id;

  select province_id into target_province_id
  from public.communities
  where id = p_community_id;

  if target.id is null
    or target.status <> 'aprobado'
    or target.role <> 'asesor'
    or target.province_id is distinct from target_province_id then
    raise exception 'Solo se puede asignar un asesor aprobado de la provincia';
  end if;

  if exists (
    select 1
    from public.community_advisors
    where community_id = p_community_id
      and advisor_user_id = p_advisor_user_id
      and active
  ) then
    raise exception 'El asesor ya se encuentra asignado';
  end if;

  if (
    select count(*)
    from public.community_advisors
    where community_id = p_community_id
      and active
  ) >= 2 then
    raise exception 'No se pudo completar la asignacion';
  end if;

  insert into public.community_advisors (
    community_id,
    advisor_user_id,
    assigned_by
  )
  values (
    p_community_id,
    p_advisor_user_id,
    auth.uid()
  )
  returning id into new_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (
    auth.uid(),
    'assign_community_advisor',
    jsonb_build_object(
      'assignment_id', new_id,
      'community_id', p_community_id,
      'advisor_user_id', p_advisor_user_id
    )
  );

  return new_id;
end;
$$;

grant execute on function public.assign_community_advisor(uuid, uuid) to authenticated;

create or replace function public.remove_community_advisor(p_assignment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  assignment public.community_advisors%rowtype;
begin
  select * into assignment
  from public.community_advisors
  where id = p_assignment_id
    and active;

  if assignment.id is null
    or not public.current_user_can_manage_community_advisors(assignment.community_id) then
    raise exception 'No autorizado para quitar esta asignacion';
  end if;

  update public.community_advisors
  set active = false,
      removed_at = now(),
      removed_by = auth.uid()
  where id = p_assignment_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (
    auth.uid(),
    'remove_community_advisor',
    jsonb_build_object(
      'assignment_id', p_assignment_id,
      'community_id', assignment.community_id,
      'advisor_user_id', assignment.advisor_user_id
    )
  );
end;
$$;

grant execute on function public.remove_community_advisor(uuid) to authenticated;

create or replace function public.current_user_internal_community_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select case
    when profiles.role in ('animador_comunidad', 'coordinador_comunidad') then
      coalesce(
        profiles.managed_community_id,
        profiles.community_id,
        (
          select communities.id
          from public.communities
          where communities.name = profiles.community_name
            and (profiles.province_id is null or communities.province_id = profiles.province_id)
            and communities.archived_at is null
          limit 1
        )
      )
    when profiles.role = 'asesor' then
      (
        select assignment.community_id
        from public.community_advisors assignment
        join public.communities community on community.id = assignment.community_id
        where assignment.advisor_user_id = profiles.id
          and assignment.active
          and community.archived_at is null
          and community.name = profiles.community_name
          and (profiles.province_id is null or community.province_id = profiles.province_id)
        order by assignment.assigned_at
        limit 1
      )
    else
      coalesce(
        profiles.community_id,
        (
          select communities.id
          from public.communities
          where communities.name = profiles.community_name
            and (profiles.province_id is null or communities.province_id = profiles.province_id)
            and communities.archived_at is null
          limit 1
        )
      )
    end
  from public.profiles
  where profiles.id = auth.uid()
    and profiles.status = 'aprobado'
  limit 1
$$;

grant execute on function public.current_user_internal_community_id() to authenticated;
