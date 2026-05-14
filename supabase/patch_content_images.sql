insert into storage.buckets (id, name, public)
values ('content-images', 'content-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Imagenes de contenido visibles" on storage.objects;
create policy "Imagenes de contenido visibles"
on storage.objects
for select
using (bucket_id = 'content-images');

drop policy if exists "Administradores suben imagenes de contenido" on storage.objects;
create policy "Administradores suben imagenes de contenido"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'content-images'
  and public.current_user_is_admin()
);

drop policy if exists "Administradores actualizan imagenes de contenido" on storage.objects;
create policy "Administradores actualizan imagenes de contenido"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'content-images'
  and public.current_user_is_admin()
)
with check (
  bucket_id = 'content-images'
  and public.current_user_is_admin()
);
