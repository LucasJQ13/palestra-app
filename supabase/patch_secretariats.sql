-- Secretariados publicos y contacto interno.
-- Ejecutar en Supabase SQL Editor.

create or replace function public.get_secretariat_members(p_scope text default 'nacional', p_province text default null)
returns table (
  id uuid,
  full_name text,
  province text,
  community_name text,
  role text,
  subrole_key text,
  display_role_label text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.province,
    p.community_name,
    p.role,
    p.subrole_key,
    p.display_role_label,
    p.avatar_url
  from public.profiles p
  where p.status = 'aprobado'
    and (
      (p_scope = 'nacional' and p.role in ('vocal_nacional', 'coordinador_nacional'))
      or (
        p_scope = 'provincia'
        and p.role in ('vocal', 'coordinador_diocesano')
        and p.province = p_province
      )
    )
  order by
    case p.role
      when 'coordinador_nacional' then 1
      when 'vocal_nacional' then 2
      when 'coordinador_diocesano' then 3
      when 'vocal' then 4
      else 9
    end,
    p.full_name;
$$;

grant execute on function public.get_secretariat_members(text, text) to anon, authenticated;

create or replace function public.create_secretariat_message(p_target_user_id uuid, p_message text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor public.profiles%rowtype;
  target public.profiles%rowtype;
  new_id uuid;
begin
  select * into actor from public.profiles where id = auth.uid();
  if actor.id is null or actor.status <> 'aprobado' then
    raise exception 'Necesitas iniciar sesion para enviar mensajes.';
  end if;

  select * into target from public.profiles where id = p_target_user_id and status = 'aprobado';
  if target.id is null or target.role not in ('vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional') then
    raise exception 'No se encontro el destinatario del Secretariado.';
  end if;

  if nullif(trim(p_message), '') is null or char_length(trim(p_message)) > 500 then
    raise exception 'El mensaje debe tener entre 1 y 500 caracteres.';
  end if;

  insert into public.community_contact_messages (
    sender_id,
    sender_name,
    sender_contact,
    message,
    status,
    target_scope,
    target_user_id,
    target_province_id,
    created_at,
    updated_at
  )
  values (
    auth.uid(),
    coalesce(nullif(trim(actor.full_name), ''), 'Palestrista'),
    actor.email,
    left(trim(p_message), 500),
    'nuevo',
    'user',
    target.id,
    target.province_id,
    now(),
    now()
  )
  returning id into new_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'create_secretariat_message', jsonb_build_object('message_id', new_id, 'target_user_id', target.id));

  return new_id;
end;
$$;

grant execute on function public.create_secretariat_message(uuid, text) to authenticated;
