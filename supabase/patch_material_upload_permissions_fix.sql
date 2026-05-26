-- Restaura permisos de carga de materiales generales para dirigencia autorizada.
-- La gestion de "Documentos de la Iglesia" queda solo para Administrador.

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
          profiles.role in ('vocal', 'coordinador_diocesano')
          and p_province_id is not null
          and profiles.province_id = p_province_id
        )
      )
  )
$$;

grant execute on function public.current_user_can_manage_content(uuid) to authenticated;

create or replace function public.current_user_can_upload_material()
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
      and profiles.role in ('vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador')
  )
$$;

grant execute on function public.current_user_can_upload_material() to authenticated;

insert into storage.buckets (id, name, public)
values ('materials', 'materials', true)
on conflict (id) do update set public = true;

drop policy if exists "Dirigentes suben materiales PDF" on storage.objects;
drop policy if exists "Dirigentes actualizan materiales PDF" on storage.objects;
drop policy if exists "Dirigentes suben materiales generales" on storage.objects;
drop policy if exists "Dirigentes actualizan materiales generales" on storage.objects;

create policy "Dirigentes suben materiales generales"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'materials'
  and (
    (
      lower(name) like 'church-documents/%'
      and public.current_user_is_strict_administrator()
    )
    or (
      lower(right(name, 4)) = '.pdf'
      and public.current_user_can_upload_material()
    )
  )
);

create policy "Dirigentes actualizan materiales generales"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'materials'
  and (
    public.current_user_can_upload_material()
    or public.current_user_is_strict_administrator()
  )
)
with check (
  bucket_id = 'materials'
  and (
    (
      lower(name) like 'church-documents/%'
      and public.current_user_is_strict_administrator()
    )
    or (
      lower(right(name, 4)) = '.pdf'
      and public.current_user_can_upload_material()
    )
  )
);

drop policy if exists "Dirigentes insertan materiales via app" on public.materials;
create policy "Dirigentes insertan materiales via app"
on public.materials
for insert
to authenticated
with check (
  public.current_user_can_manage_content(province_id)
);

drop policy if exists "Dirigentes actualizan materiales via app" on public.materials;
create policy "Dirigentes actualizan materiales via app"
on public.materials
for update
to authenticated
using (
  created_by = auth.uid()
  or public.current_user_can_manage_content(province_id)
)
with check (
  created_by = auth.uid()
  or public.current_user_can_manage_content(province_id)
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
  existing_province_id uuid;
  normalized_visibility text;
begin
  select role, province_id
  into actor_role, actor_province_id
  from public.profiles
  where id = auth.uid()
    and status = 'aprobado';

  if actor_role is null or actor_role not in ('vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador') then
    raise exception 'No autorizado';
  end if;

  select province_id
  into existing_province_id
  from public.materials
  where id = p_id;

  if p_id is not null and not public.current_user_can_manage_material(p_id) then
    raise exception 'No autorizado';
  end if;

  select id
  into selected_province_id
  from public.provinces
  where lower(name) = lower(nullif(trim(coalesce(p_category, '')), ''))
  limit 1;

  if actor_role in ('vocal', 'coordinador_diocesano') then
    selected_province_id := coalesce(existing_province_id, actor_province_id);
  end if;

  if p_id is null and not public.current_user_can_manage_content(selected_province_id) then
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
    file_url = coalesce(excluded.file_url, materials.file_url),
    file_path = coalesce(excluded.file_path, materials.file_path),
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
begin
  if not public.current_user_can_manage_material(p_id) then
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

create or replace function public.check_registration_email_available(p_email text)
returns table (
  available boolean,
  reason text
)
language sql
stable
security definer
set search_path = public, auth
as $$
  with normalized as (
    select lower(trim(coalesce(p_email, ''))) as email
  )
  select
    case
      when normalized.email = '' or normalized.email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then false
      when exists (select 1 from auth.users where lower(auth.users.email) = normalized.email) then false
      when exists (
        select 1
        from auth.identities
        where lower(auth.identities.identity_data->>'email') = normalized.email
      ) then false
      else true
    end as available,
    case
      when normalized.email = '' or normalized.email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then 'Mail invalido.'
      when exists (select 1 from auth.users where lower(auth.users.email) = normalized.email) then 'Este mail ya se encuentra registrado.'
      when exists (
        select 1
        from auth.identities
        where lower(auth.identities.identity_data->>'email') = normalized.email
      ) then 'Este mail ya se encuentra registrado.'
      else null
    end as reason
  from normalized;
$$;

grant execute on function public.check_registration_email_available(text) to anon, authenticated;
