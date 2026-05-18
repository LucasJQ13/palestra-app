-- Sincronizacion robusta de avisos comunitarios y soporte de envio push real.
-- Ejecutar en Supabase SQL Editor y desplegar supabase/functions/send-push-notifications.

drop policy if exists "Publicaciones comunitarias por visibilidad" on public.community_publications;
create policy "Publicaciones comunitarias por visibilidad"
on public.community_publications
for select
to authenticated
using (
  archived_at is null
  and exists (
    select 1
    from public.profiles viewer
    join public.communities community on community.id = community_publications.community_id
    where viewer.id = auth.uid()
      and viewer.status = 'aprobado'
      and (
        viewer.role in ('administrador', 'vocal_nacional', 'coordinador_nacional')
        or viewer.community_id = community_publications.community_id
        or viewer.managed_community_id = community_publications.community_id
        or lower(trim(viewer.community_name)) = lower(trim(community.name))
        or (
          viewer.role in ('vocal', 'asesor', 'coordinador_diocesano')
          and viewer.province_id = community.province_id
        )
      )
      and (
        community_publications.visibility <> 'sedimentadores'
        or viewer.role in (
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

create or replace function public.get_my_community_publications()
returns table (
  id uuid,
  kind text,
  title text,
  body text,
  event_date date,
  visibility text,
  poll_options text[],
  poll_results jsonb,
  status text,
  created_by uuid,
  created_at timestamptz,
  author_name text,
  author_role text,
  community_id uuid,
  community_name text,
  province text
)
language sql
stable
security definer
set search_path = public
as $$
  with viewer as (
    select *
    from public.profiles
    where id = auth.uid()
      and status = 'aprobado'
  )
  select
    publications.id,
    publications.kind,
    publications.title,
    publications.body,
    publications.event_date,
    publications.visibility,
    publications.poll_options,
    publications.poll_results,
    publications.status,
    publications.created_by,
    publications.created_at,
    coalesce(author.full_name, 'Palestrista') as author_name,
    coalesce(author.role::text, 'palestrista') as author_role,
    communities.id as community_id,
    communities.name as community_name,
    provinces.name as province
  from public.community_publications publications
  join public.communities on communities.id = publications.community_id
  left join public.provinces on provinces.id = communities.province_id
  left join public.profiles author on author.id = publications.created_by
  join viewer on true
  where publications.archived_at is null
    and (
      viewer.role in ('administrador', 'vocal_nacional', 'coordinador_nacional')
      or viewer.community_id = communities.id
      or viewer.managed_community_id = communities.id
      or lower(trim(viewer.community_name)) = lower(trim(communities.name))
      or (
        viewer.role in ('vocal', 'asesor', 'coordinador_diocesano')
        and viewer.province_id = communities.province_id
      )
    )
    and (
      publications.visibility <> 'sedimentadores'
      or viewer.role in (
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
  order by publications.created_at desc;
$$;

grant execute on function public.get_my_community_publications() to authenticated;

alter table public.notification_intents
  add column if not exists sent_count integer not null default 0,
  add column if not exists failed_count integer not null default 0,
  add column if not exists error_message text,
  add column if not exists processed_at timestamptz;

create index if not exists notification_intents_source_idx
on public.notification_intents (source_type, source_id);

create or replace function public.get_notification_recipients(p_intent_id uuid)
returns table (
  expo_push_token text,
  user_id uuid
)
language sql
stable
security definer
set search_path = public
as $$
  with intent as (
    select *
    from public.notification_intents
    where id = p_intent_id
      and status in ('pendiente', 'fallida')
    limit 1
  )
  select distinct tokens.expo_push_token, profiles.id
  from intent
  join public.device_push_tokens tokens on tokens.is_active = true
  join public.profiles profiles on profiles.id = tokens.user_id
  left join public.provinces provinces on provinces.id = profiles.province_id
  where profiles.status = 'aprobado'
    and tokens.expo_push_token is not null
    and (
      intent.min_role is null
      or public.role_rank(profiles.role) >= public.role_rank(intent.min_role::public.user_role)
    )
    and (
      intent.target_kind in ('nacional', 'all')
      or intent.target_kind is null
      or (intent.target_kind = 'provincia' and lower(coalesce(provinces.name, profiles.community_name, '')) = lower(coalesce(intent.target_value, intent.province, '')))
      or (intent.target_kind = 'comunidad' and lower(trim(profiles.community_name)) = lower(trim(coalesce(intent.target_value, intent.community, ''))))
      or (intent.target_kind = 'usuario' and profiles.id::text = intent.target_value)
      or (intent.target_kind = 'rol' and profiles.role::text = intent.target_value)
    );
$$;

grant execute on function public.get_notification_recipients(uuid) to authenticated, service_role;
