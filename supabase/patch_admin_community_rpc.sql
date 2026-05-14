create or replace function public.admin_update_community(
  p_community_id uuid,
  p_name text,
  p_address text,
  p_phone text,
  p_meeting_day text,
  p_meeting_time text,
  p_description text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  update public.communities
  set
    name = coalesce(nullif(trim(p_name), ''), name),
    address = coalesce(nullif(trim(p_address), ''), address),
    phone = nullif(trim(p_phone), ''),
    meeting_day = nullif(trim(p_meeting_day), ''),
    meeting_time = nullif(trim(p_meeting_time), ''),
    description = nullif(trim(p_description), '')
  where id = p_community_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_update_community', jsonb_build_object('community_id', p_community_id, 'name', p_name));
end;
$$;

grant execute on function public.admin_update_community(uuid, text, text, text, text, text, text) to authenticated;
