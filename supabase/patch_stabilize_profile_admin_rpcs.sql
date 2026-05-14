create or replace function public.current_user_can_manage_profiles()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'aprobado'
      and profiles.role in ('vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador')
  );
$$;

grant execute on function public.current_user_can_manage_profiles() to authenticated;

create or replace function public.admin_get_pending_profiles()
returns table (
  id uuid,
  full_name text,
  status text,
  role text,
  community_name text
)
language sql
security definer
set search_path = public
as $$
  select
    profiles.id,
    profiles.full_name,
    profiles.status::text,
    profiles.role::text,
    profiles.community_name
  from public.profiles
  where profiles.status = 'pendiente'
    and public.current_user_can_manage_profiles()
  order by profiles.created_at desc
  limit 50;
$$;

grant execute on function public.admin_get_pending_profiles() to authenticated;

create or replace function public.admin_approve_profile(
  p_profile_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_can_manage_profiles() then
    raise exception 'No autorizado';
  end if;

  update public.profiles
  set
    status = 'aprobado',
    role = p_role::public.user_role,
    approved_at = now(),
    approved_by = auth.uid()
  where id = p_profile_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_approve_profile', jsonb_build_object('profile_id', p_profile_id, 'role', p_role));
end;
$$;

grant execute on function public.admin_approve_profile(uuid, text) to authenticated;

drop policy if exists "Dirigentes ven perfiles pendientes" on public.profiles;
create policy "Dirigentes ven perfiles pendientes"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.current_user_can_manage_profiles()
);

drop policy if exists "Dirigentes aprueban perfiles" on public.profiles;
create policy "Dirigentes aprueban perfiles"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or public.current_user_can_manage_profiles()
)
with check (
  id = auth.uid()
  or public.current_user_can_manage_profiles()
);
