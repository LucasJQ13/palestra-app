drop policy if exists "Administradores insertan noticias" on public.news;
create policy "Administradores insertan noticias"
on public.news
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.status = 'aprobado'
      and actor.role in ('vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador')
  )
);

drop policy if exists "Administradores insertan eventos" on public.events;
create policy "Administradores insertan eventos"
on public.events
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.status = 'aprobado'
      and actor.role in ('vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador')
  )
);

drop policy if exists "Administradores actualizan comunidades" on public.communities;
create policy "Administradores actualizan comunidades"
on public.communities
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.status = 'aprobado'
      and actor.role in ('vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador')
  )
)
with check (
  exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.status = 'aprobado'
      and actor.role in ('vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador')
  )
);
