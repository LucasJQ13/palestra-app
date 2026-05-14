drop policy if exists "Cada usuario crea su perfil" on public.profiles;
drop policy if exists "Cada usuario actualiza datos basicos" on public.profiles;

create policy "Cada usuario crea su perfil"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "Cada usuario actualiza datos basicos"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
