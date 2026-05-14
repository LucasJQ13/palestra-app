create policy "Cada usuario crea su perfil"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "Cada usuario puede completar su perfil"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());
