-- Issue #68: la bandeja Consultas pertenece exclusivamente a responsables
-- operativos de la comunidad. El historial permanece vinculado a community_id.

create or replace function public.current_user_can_access_public_query(p_query_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.public_queries queries
    join public.communities communities on communities.id = queries.community_id
    join public.profiles actor on actor.id = auth.uid()
    where queries.id = p_query_id
      and queries.destination_type = 'comunidad'
      and queries.community_id is not null
      and actor.status::text = 'aprobado'
      and actor.role::text in ('animador_comunidad', 'coordinador_comunidad')
      and actor.community_name = communities.name
      and actor.province_id = communities.province_id
  );
$$;

grant execute on function public.current_user_can_access_public_query(uuid) to authenticated;

drop policy if exists "Consultas visibles para responsables" on public.public_queries;
create policy "Consultas visibles para responsables"
on public.public_queries
for select
to authenticated
using (public.current_user_can_access_public_query(id));
