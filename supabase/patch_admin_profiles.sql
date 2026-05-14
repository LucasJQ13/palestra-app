drop policy if exists "Dirigentes ven perfiles pendientes" on public.profiles;
create policy "Dirigentes ven perfiles pendientes"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.status = 'aprobado'
      and actor.role in ('vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador')
  )
);

drop policy if exists "Dirigentes aprueban perfiles" on public.profiles;
create policy "Dirigentes aprueban perfiles"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.status = 'aprobado'
      and actor.role in ('vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador')
  )
)
with check (
  id = auth.uid()
  or exists (
    select 1
    from public.profiles actor
    where actor.id = auth.uid()
      and actor.status = 'aprobado'
      and actor.role in ('vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador')
  )
);
