-- Basic, territorial editing for the dedicated Community Panel.

create or replace function public.update_my_community_details(
  p_description text,
  p_image_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor public.profiles%rowtype;
  target_community_id uuid;
begin
  select * into actor
  from public.profiles
  where id = auth.uid();

  if actor.id is null
    or actor.status <> 'aprobado'
    or actor.role not in ('animador_comunidad', 'coordinador_comunidad', 'administrador') then
    raise exception 'No autorizado para editar datos de la comunidad';
  end if;

  target_community_id := public.current_user_internal_community_id();

  if target_community_id is null then
    raise exception 'No hay una comunidad asignada al usuario';
  end if;

  update public.communities
  set description = left(coalesce(trim(p_description), ''), 1000),
      image_url = nullif(trim(p_image_url), ''),
      updated_by = auth.uid(),
      updated_at = now()
  where id = target_community_id
    and archived_at is null;

  if not found then
    raise exception 'No se encontró una comunidad activa para actualizar';
  end if;

  insert into public.audit_logs (actor_id, action, metadata)
  values (
    auth.uid(),
    'update_my_community_details',
    jsonb_build_object('community_id', target_community_id)
  );

  return target_community_id;
end;
$$;

grant execute on function public.update_my_community_details(text, text) to authenticated;
