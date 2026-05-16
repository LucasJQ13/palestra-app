-- Baseline incremental para Beta real.
-- No borra tablas ni datos. Consolida persistencia y Storage usados por la app actual.

alter table public.materials
  add column if not exists category text,
  add column if not exists visibility text not null default 'interno',
  add column if not exists file_url text,
  add column if not exists sort_order integer not null default 100,
  add column if not exists archived_at timestamptz,
  add column if not exists updated_by uuid references public.profiles(id),
  add column if not exists updated_at timestamptz,
  add column if not exists province_id uuid references public.provinces(id);

alter table public.materials
  drop constraint if exists materials_visibility_check;

alter table public.materials
  add constraint materials_visibility_check
  check (visibility in ('publico', 'interno', 'reservado', 'administrador', 'desde_rango', 'solo_rango'));

insert into public.permissions (key, label, description)
values
  ('rango_palestrista', 'Visible desde Palestrista', 'Contenido visible desde el rango Palestrista.'),
  ('rango_sedimentador', 'Visible desde Sedimentador', 'Contenido visible desde el rango Sedimentador.'),
  ('rango_animador_comunidad', 'Visible desde Animador', 'Contenido visible desde el rango Animador.'),
  ('rango_coordinador_comunidad', 'Visible desde Coordinador de Comunidad', 'Contenido visible desde el rango Coordinador de Comunidad.'),
  ('rango_vocal', 'Visible desde Vocal Diocesano', 'Contenido visible desde el rango Vocal Diocesano.'),
  ('rango_asesor', 'Visible desde Asesor', 'Contenido visible desde el rango Asesor.'),
  ('rango_coordinador_diocesano', 'Visible desde Coordinador Diocesano', 'Contenido visible desde el rango Coordinador Diocesano.'),
  ('rango_vocal_nacional', 'Visible desde Vocal Nacional', 'Contenido visible desde el rango Vocal Nacional.'),
  ('rango_coordinador_nacional', 'Visible desde Coordinador Nacional', 'Contenido visible desde el rango Coordinador Nacional.'),
  ('rango_administrador', 'Visible para Administrador', 'Contenido visible para Administrador.')
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description;

create or replace function public.current_user_can_manage_content(p_province_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'aprobado'
      and (
        profiles.role in ('administrador', 'vocal_nacional', 'coordinador_nacional')
        or (
          profiles.role in ('vocal', 'asesor', 'coordinador_diocesano')
          and p_province_id is not null
          and profiles.province_id = p_province_id
        )
      )
  )
$$;

grant execute on function public.current_user_can_manage_content(uuid) to authenticated;
grant execute on function public.current_user_can_see_all_provinces() to anon, authenticated;
grant execute on function public.current_user_can_access_province(uuid) to anon, authenticated;
grant execute on function public.role_rank(public.user_role) to anon, authenticated;

create or replace function public.material_required_role_rank(p_required_permission text)
returns integer
language sql
stable
as $$
  select case p_required_permission
    when 'rango_palestrista' then public.role_rank('palestrista'::public.user_role)
    when 'rango_sedimentador' then public.role_rank('sedimentador'::public.user_role)
    when 'rango_animador_comunidad' then public.role_rank('animador_comunidad'::public.user_role)
    when 'rango_coordinador_comunidad' then public.role_rank('coordinador_comunidad'::public.user_role)
    when 'rango_vocal' then public.role_rank('vocal'::public.user_role)
    when 'rango_asesor' then public.role_rank('asesor'::public.user_role)
    when 'rango_coordinador_diocesano' then public.role_rank('coordinador_diocesano'::public.user_role)
    when 'rango_vocal_nacional' then public.role_rank('vocal_nacional'::public.user_role)
    when 'rango_coordinador_nacional' then public.role_rank('coordinador_nacional'::public.user_role)
    when 'rango_administrador' then public.role_rank('administrador'::public.user_role)
    else 0
  end
$$;

grant execute on function public.material_required_role_rank(text) to anon, authenticated;

drop policy if exists "Materiales publicos" on public.materials;
drop policy if exists "Materiales internos por permiso" on public.materials;
drop policy if exists "Materiales visibles por rango y alcance" on public.materials;
create policy "Materiales visibles por rango y alcance"
on public.materials
for select
using (
  archived_at is null
  and (
    visibility = 'publico'
    or exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.status = 'aprobado'
        and public.current_user_can_access_province(materials.province_id)
        and (
          visibility in ('interno', 'reservado')
          or (visibility = 'administrador' and profiles.role = 'administrador')
          or (
            visibility = 'desde_rango'
            and public.role_rank(profiles.role) >= public.material_required_role_rank(materials.required_permission)
          )
          or (
            visibility = 'solo_rango'
            and public.role_rank(profiles.role) = public.material_required_role_rank(materials.required_permission)
          )
        )
    )
  )
);

create or replace function public.admin_upsert_material(
  p_id uuid,
  p_title text,
  p_description text,
  p_category text,
  p_visibility text,
  p_required_permission text,
  p_file_url text,
  p_file_path text,
  p_sort_order integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  material_id uuid;
  actor_role public.user_role;
  actor_province_id uuid;
  selected_province_id uuid;
  normalized_visibility text;
begin
  select role, province_id
  into actor_role, actor_province_id
  from public.profiles
  where id = auth.uid()
    and status = 'aprobado';

  if actor_role is null then
    raise exception 'No autorizado';
  end if;

  select id
  into selected_province_id
  from public.provinces
  where lower(name) = lower(nullif(trim(coalesce(p_category, '')), ''))
  limit 1;

  if actor_role not in ('administrador', 'vocal_nacional', 'coordinador_nacional') then
    selected_province_id := actor_province_id;
  end if;

  if not public.current_user_can_manage_content(selected_province_id) then
    raise exception 'No autorizado';
  end if;

  normalized_visibility := coalesce(nullif(trim(p_visibility), ''), 'interno');
  material_id := coalesce(p_id, gen_random_uuid());

  insert into public.materials (
    id, title, description, category, visibility, required_permission, file_url, file_path,
    is_public, sort_order, province_id, created_by, updated_by, updated_at
  )
  values (
    material_id,
    p_title,
    p_description,
    coalesce(nullif(trim(p_category), ''), 'General'),
    normalized_visibility,
    nullif(trim(coalesce(p_required_permission, '')), ''),
    nullif(trim(coalesce(p_file_url, '')), ''),
    nullif(trim(coalesce(p_file_path, '')), ''),
    normalized_visibility = 'publico',
    coalesce(p_sort_order, 100),
    selected_province_id,
    auth.uid(),
    auth.uid(),
    now()
  )
  on conflict (id) do update
  set
    title = excluded.title,
    description = excluded.description,
    category = excluded.category,
    visibility = excluded.visibility,
    required_permission = excluded.required_permission,
    file_url = excluded.file_url,
    file_path = excluded.file_path,
    is_public = excluded.is_public,
    sort_order = excluded.sort_order,
    province_id = excluded.province_id,
    updated_by = auth.uid(),
    updated_at = now();

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_upsert_material', jsonb_build_object('material_id', material_id, 'title', p_title, 'province_id', selected_province_id));

  return material_id;
end;
$$;

grant execute on function public.admin_upsert_material(uuid, text, text, text, text, text, text, text, integer) to authenticated;

create or replace function public.admin_archive_material(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_province_id uuid;
begin
  select province_id
  into target_province_id
  from public.materials
  where id = p_id;

  if not public.current_user_can_manage_content(target_province_id) then
    raise exception 'No autorizado';
  end if;

  update public.materials
  set archived_at = now(), updated_by = auth.uid(), updated_at = now()
  where id = p_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_archive_material', jsonb_build_object('material_id', p_id));
end;
$$;

grant execute on function public.admin_archive_material(uuid) to authenticated;

insert into storage.buckets (id, name, public)
values ('materials', 'materials', true)
on conflict (id) do update set public = true;

drop policy if exists "Materiales PDF visibles" on storage.objects;
create policy "Materiales PDF visibles"
on storage.objects
for select
using (bucket_id = 'materials');

drop policy if exists "Dirigentes suben materiales PDF" on storage.objects;
create policy "Dirigentes suben materiales PDF"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'materials'
  and lower(right(name, 4)) = '.pdf'
  and (
    public.current_user_can_see_all_provinces()
    or exists (
      select 1
      from public.profiles
      join public.provinces on provinces.id = profiles.province_id
      where profiles.id = auth.uid()
        and profiles.status = 'aprobado'
        and profiles.role in ('vocal', 'asesor', 'coordinador_diocesano')
        and lower((storage.foldername(name))[1]) = lower(provinces.name)
    )
  )
);

drop policy if exists "Dirigentes actualizan materiales PDF" on storage.objects;
create policy "Dirigentes actualizan materiales PDF"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'materials'
  and (
    public.current_user_can_see_all_provinces()
    or exists (
      select 1
      from public.profiles
      join public.provinces on provinces.id = profiles.province_id
      where profiles.id = auth.uid()
        and profiles.status = 'aprobado'
        and profiles.role in ('vocal', 'asesor', 'coordinador_diocesano')
        and lower((storage.foldername(name))[1]) = lower(provinces.name)
    )
  )
)
with check (
  bucket_id = 'materials'
  and lower(right(name, 4)) = '.pdf'
  and (
    public.current_user_can_see_all_provinces()
    or exists (
      select 1
      from public.profiles
      join public.provinces on provinces.id = profiles.province_id
      where profiles.id = auth.uid()
        and profiles.status = 'aprobado'
        and profiles.role in ('vocal', 'asesor', 'coordinador_diocesano')
        and lower((storage.foldername(name))[1]) = lower(provinces.name)
    )
  )
);
