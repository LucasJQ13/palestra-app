-- Etiquetas visibles de rangos por provincia.
-- No cambia roles internos, permisos ni jerarquia: solo personaliza el nombre mostrado.

create table if not exists public.province_role_labels (
  id uuid primary key default gen_random_uuid(),
  province_id uuid not null references public.provinces(id) on delete cascade,
  role_key public.user_role not null,
  display_label text not null,
  description text,
  is_active boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (province_id, role_key)
);

alter table public.province_role_labels enable row level security;

drop policy if exists "Etiquetas de rangos visibles" on public.province_role_labels;
create policy "Etiquetas de rangos visibles"
on public.province_role_labels
for select
using (true);

drop policy if exists "Solo admin gestiona etiquetas de rangos" on public.province_role_labels;
create policy "Solo admin gestiona etiquetas de rangos"
on public.province_role_labels
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create or replace function public.get_province_role_labels()
returns table (
  id uuid,
  province_id uuid,
  province text,
  role_key public.user_role,
  display_label text,
  description text,
  is_active boolean,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    labels.id,
    labels.province_id,
    provinces.name as province,
    labels.role_key,
    labels.display_label,
    labels.description,
    labels.is_active,
    labels.updated_at
  from public.province_role_labels labels
  join public.provinces on provinces.id = labels.province_id
  order by provinces.name, labels.role_key::text;
$$;

create or replace function public.admin_save_province_role_label(
  p_province text,
  p_role_key public.user_role,
  p_display_label text,
  p_description text default null,
  p_is_active boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_province_id uuid;
  saved_id uuid;
begin
  if not public.current_user_is_admin() then
    raise exception 'Solo Administrador puede editar etiquetas de rangos';
  end if;

  select provinces.id
  into selected_province_id
  from public.provinces
  where lower(provinces.name) = lower(trim(p_province))
  limit 1;

  if selected_province_id is null then
    raise exception 'Provincia no encontrada';
  end if;

  if trim(coalesce(p_display_label, '')) = '' then
    raise exception 'El nombre visible no puede estar vacio';
  end if;

  insert into public.province_role_labels (
    province_id,
    role_key,
    display_label,
    description,
    is_active,
    updated_by,
    updated_at
  )
  values (
    selected_province_id,
    p_role_key,
    trim(p_display_label),
    nullif(trim(coalesce(p_description, '')), ''),
    coalesce(p_is_active, true),
    auth.uid(),
    now()
  )
  on conflict (province_id, role_key) do update
  set
    display_label = excluded.display_label,
    description = excluded.description,
    is_active = excluded.is_active,
    updated_by = excluded.updated_by,
    updated_at = now()
  returning id into saved_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (
    auth.uid(),
    'admin_save_province_role_label',
    jsonb_build_object('province_id', selected_province_id, 'role_key', p_role_key, 'display_label', p_display_label)
  );

  return saved_id;
end;
$$;

grant select on public.province_role_labels to anon, authenticated;
grant execute on function public.get_province_role_labels() to anon, authenticated;
grant execute on function public.admin_save_province_role_label(text, public.user_role, text, text, boolean) to authenticated;
