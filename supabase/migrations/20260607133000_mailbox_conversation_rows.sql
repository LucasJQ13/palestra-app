create or replace function public.get_my_mailbox_messages()
returns table (
  source text,
  mailbox_folder text,
  id uuid,
  community_id uuid,
  community_name text,
  province text,
  sender_id uuid,
  sender_name text,
  sender_contact text,
  recipient_id uuid,
  recipient_name text,
  recipient_names text,
  subject text,
  message text,
  response text,
  status text,
  created_at timestamptz,
  responded_at timestamptz,
  read_at timestamptz,
  closed_at timestamptz,
  deleted_at timestamptz,
  can_respond boolean
)
language sql
security definer
set search_path = public
as $$
  with direct_received as (
    select
      'direct'::text as source,
      case when r.deleted_at is null then 'entrada' else 'eliminados' end as mailbox_folder,
      m.id,
      null::uuid as community_id,
      'Mensaje directo'::text as community_name,
      sender_province.name::text as province,
      m.sender_id,
      coalesce(sender.full_name, sender.nickname, 'Palestrista')::text as sender_name,
      null::text as sender_contact,
      r.recipient_id,
      coalesce(recipient.full_name, recipient.nickname, 'Palestrista')::text as recipient_name,
      coalesce(recipient.full_name, recipient.nickname, 'Palestrista')::text as recipient_names,
      m.subject,
      m.body as message,
      null::text as response,
      case when r.read_at is null then 'nuevo' else 'leido' end::text as status,
      m.created_at,
      null::timestamptz as responded_at,
      r.read_at,
      null::timestamptz as closed_at,
      r.deleted_at,
      false as can_respond
    from public.direct_message_recipients r
    join public.direct_messages m on m.id = r.message_id
    join public.profiles sender on sender.id = m.sender_id
    left join public.provinces sender_province on sender_province.id = sender.province_id
    join public.profiles recipient on recipient.id = r.recipient_id
    where r.recipient_id = auth.uid()
  ),
  direct_sent as (
    select
      'direct'::text as source,
      case when m.sender_deleted_at is null then 'enviados' else 'eliminados' end as mailbox_folder,
      m.id,
      null::uuid as community_id,
      'Mensaje directo'::text as community_name,
      recipient_province.name::text as province,
      m.sender_id,
      coalesce(sender.full_name, sender.nickname, 'Palestrista')::text as sender_name,
      null::text as sender_contact,
      r.recipient_id,
      coalesce(recipient.full_name, recipient.nickname, 'Palestrista')::text as recipient_name,
      coalesce(recipient.full_name, recipient.nickname, 'Palestrista')::text as recipient_names,
      m.subject,
      m.body as message,
      null::text as response,
      'enviado'::text as status,
      m.created_at,
      null::timestamptz as responded_at,
      r.read_at,
      null::timestamptz as closed_at,
      m.sender_deleted_at as deleted_at,
      false as can_respond
    from public.direct_messages m
    join public.profiles sender on sender.id = m.sender_id
    join public.direct_message_recipients r on r.message_id = m.id
    join public.profiles recipient on recipient.id = r.recipient_id
    left join public.provinces recipient_province on recipient_province.id = recipient.province_id
    where m.sender_id = auth.uid()
  ),
  legacy_messages as (
    select
      'community'::text as source,
      case
        when messages.sender_id = auth.uid() and messages.sender_deleted_at is not null then 'eliminados'
        when messages.sender_id = auth.uid() then 'enviados'
        when messages.recipient_deleted_at is not null then 'eliminados'
        else 'entrada'
      end as mailbox_folder,
      messages.id,
      messages.community_id,
      coalesce(communities.name, case
        when messages.target_scope = 'all' then 'Todos los usuarios'
        when messages.target_scope = 'user' then 'Mensaje directo'
        when messages.target_scope = 'role' then 'Rango: ' || coalesce(messages.target_role, '')
        when messages.target_scope = 'province' then 'Provincia'
        when messages.target_scope = 'role_province' then 'Rango y provincia'
        when messages.target_scope = 'diocesan_leadership' then 'Dirigencia diocesana'
        when messages.target_scope = 'province_communities' then 'Comunidades de provincia'
        else 'Mensaje directo'
      end)::text as community_name,
      coalesce(provinces.name, target_province.name)::text as province,
      messages.sender_id,
      messages.sender_name,
      messages.sender_contact,
      messages.target_user_id as recipient_id,
      coalesce(target_profile.full_name, target_profile.nickname)::text as recipient_name,
      coalesce(target_profile.full_name, target_profile.nickname)::text as recipient_names,
      null::text as subject,
      messages.message,
      messages.response,
      messages.status,
      messages.created_at,
      messages.responded_at,
      messages.read_at,
      messages.closed_at,
      case when messages.sender_id = auth.uid() then messages.sender_deleted_at else messages.recipient_deleted_at end as deleted_at,
      exists (
        select 1
        from public.profiles actor
        where actor.id = auth.uid()
          and actor.status::text = 'aprobado'
          and messages.sender_id is distinct from auth.uid()
          and public.current_user_can_access_community_message(messages.id)
      ) as can_respond
    from public.community_contact_messages messages
    left join public.communities communities on communities.id = messages.community_id
    left join public.provinces on provinces.id = communities.province_id
    left join public.provinces target_province on target_province.id = messages.target_province_id
    left join public.profiles target_profile on target_profile.id = messages.target_user_id
    where public.current_user_can_access_community_message(messages.id)
  )
  select * from direct_received
  union all
  select * from direct_sent
  union all
  select * from legacy_messages
  order by created_at desc;
$$;

grant execute on function public.get_my_mailbox_messages() to authenticated;
