-- Restauracion estable de administracion de comunidades.
-- Quita la variante experimental con coordenadas y deja el RPC compatible con la app.

drop function if exists public.admin_update_community(uuid, text, text, text, text, text, text, text, double precision, double precision);

create or replace function public.admin_update_community(
  p_community_id uuid,
  p_name text,
  p_address text,
  p_phone text,
  p_meeting_day text,
  p_meeting_time text,
  p_description text,
  p_image_url text default null
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

grant execute on function public.admin_update_community(uuid, text, text, text, text, text, text, text) to authenticated;
