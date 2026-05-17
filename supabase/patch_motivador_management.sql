alter table public.motivador_periods
  add column if not exists selected_dates date[],
  add column if not exists opening_time text,
  add column if not exists closing_time text,
  add column if not exists status text not null default 'activo',
  add column if not exists updated_by uuid references public.profiles(id),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists archived_at timestamptz;

alter table public.motivador_periods
  drop constraint if exists motivador_periods_status_check;

alter table public.motivador_periods
  add constraint motivador_periods_status_check
  check (status in ('activo', 'inactivo', 'borrador', 'archivado'));

update public.motivador_periods
set selected_dates = array[starts_on, ends_on],
    status = case when is_visible then 'activo' else 'inactivo' end,
    updated_at = coalesce(updated_at, created_at)
where selected_dates is null;

create or replace function public.current_user_can_manage_motivador(p_province_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'aprobado'
      and (
        profiles.role = 'administrador'
        or (
          profiles.role in ('vocal', 'coordinador_diocesano')
          and profiles.province_id = p_province_id
        )
      )
  );
$$;

grant execute on function public.current_user_can_manage_motivador(uuid) to authenticated;

drop policy if exists "PM visibles por alcance y rango" on public.motivador_periods;
create policy "PM visibles por alcance y rango"
on public.motivador_periods
for select
using (
  archived_at is null
  and status = 'activo'
  and is_visible = true
  and (
    visible_to_lower_roles = true
    or exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.status = 'aprobado'
        and profiles.role in ('sedimentador', 'animador_comunidad', 'coordinador_comunidad', 'vocal', 'asesor', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador')
        and (
          profiles.role in ('administrador', 'vocal_nacional', 'coordinador_nacional')
          or profiles.province_id = motivador_periods.province_id
          or motivador_periods.province_id is null
        )
    )
  )
);

drop policy if exists "PM gestionables por dirigencia" on public.motivador_periods;
create policy "PM gestionables por dirigencia"
on public.motivador_periods
for all
to authenticated
using (public.current_user_can_manage_motivador(province_id))
with check (public.current_user_can_manage_motivador(province_id));

create or replace function public.admin_get_motivador_periods()
returns table (
  id uuid,
  province text,
  gender text,
  pm_number integer,
  selected_dates date[],
  starts_on date,
  ends_on date,
  retreat_house text,
  address text,
  opening_time text,
  closing_time text,
  description text,
  place_photo_url text,
  flyer_url text,
  visible_to_lower_roles boolean,
  status text,
  created_by uuid,
  created_by_name text,
  updated_by uuid,
  updated_by_name text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    periods.id,
    provinces.name,
    periods.gender,
    periods.pm_number,
    periods.selected_dates,
    periods.starts_on,
    periods.ends_on,
    periods.retreat_house,
    periods.address,
    periods.opening_time,
    periods.closing_time,
    periods.description,
    periods.place_photo_url,
    periods.flyer_url,
    periods.visible_to_lower_roles,
    periods.status,
    periods.created_by,
    creator.full_name,
    periods.updated_by,
    updater.full_name,
    periods.created_at,
    periods.updated_at
  from public.motivador_periods periods
  left join public.provinces on provinces.id = periods.province_id
  left join public.profiles creator on creator.id = periods.created_by
  left join public.profiles updater on updater.id = periods.updated_by
  where periods.archived_at is null
    and public.current_user_can_manage_motivador(periods.province_id)
  order by periods.starts_on desc, periods.created_at desc;
$$;

grant execute on function public.admin_get_motivador_periods() to authenticated;

create or replace function public.admin_upsert_motivador_period(
  p_id uuid,
  p_province text,
  p_gender text,
  p_pm_number integer,
  p_selected_dates date[],
  p_retreat_house text,
  p_address text,
  p_opening_time text,
  p_closing_time text,
  p_description text,
  p_place_photo_url text,
  p_flyer_url text,
  p_visible_to_lower_roles boolean,
  p_status text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_province_id uuid;
  saved_id uuid;
  normalized_dates date[];
  first_date date;
  last_date date;
begin
  select provinces.id into selected_province_id
  from public.provinces
  where lower(provinces.name) = lower(trim(p_province))
  limit 1;

  if selected_province_id is null then
    raise exception 'Provincia invalida.';
  end if;

  if not public.current_user_can_manage_motivador(selected_province_id) then
    raise exception 'No tenes permisos para gestionar PM de esta provincia.';
  end if;

  if p_gender not in ('masculino', 'femenino') then
    raise exception 'Tipo de PM invalido.';
  end if;

  if coalesce(p_pm_number, 0) <= 0 then
    raise exception 'El numero de PM es obligatorio.';
  end if;

  if p_selected_dates is null or cardinality(p_selected_dates) = 0 then
    raise exception 'Selecciona al menos una fecha.';
  end if;

  select array_agg(distinct selected_day order by selected_day)
  into normalized_dates
  from unnest(p_selected_dates) as selected_dates(selected_day);

  first_date := normalized_dates[1];
  last_date := normalized_dates[array_length(normalized_dates, 1)];

  if nullif(trim(p_retreat_house), '') is null or nullif(trim(p_address), '') is null then
    raise exception 'Casa de retiro y direccion son obligatorias.';
  end if;

  if nullif(trim(p_opening_time), '') is null or nullif(trim(p_closing_time), '') is null then
    raise exception 'Los horarios de apertura y clausura son obligatorios.';
  end if;

  if coalesce(p_status, 'activo') not in ('activo', 'inactivo', 'borrador', 'archivado') then
    raise exception 'Estado invalido.';
  end if;

  insert into public.motivador_periods (
    id,
    province_id,
    gender,
    pm_number,
    selected_dates,
    starts_on,
    ends_on,
    retreat_house,
    address,
    opening_time,
    closing_time,
    description,
    place_photo_url,
    flyer_url,
    visible_to_lower_roles,
    is_visible,
    status,
    created_by,
    updated_by,
    updated_at,
    archived_at
  )
  values (
    coalesce(p_id, gen_random_uuid()),
    selected_province_id,
    p_gender,
    p_pm_number,
    normalized_dates,
    first_date,
    last_date,
    trim(p_retreat_house),
    trim(p_address),
    trim(p_opening_time),
    trim(p_closing_time),
    nullif(trim(coalesce(p_description, '')), ''),
    nullif(trim(coalesce(p_place_photo_url, '')), ''),
    nullif(trim(coalesce(p_flyer_url, '')), ''),
    coalesce(p_visible_to_lower_roles, false),
    coalesce(p_status, 'activo') = 'activo',
    coalesce(p_status, 'activo'),
    auth.uid(),
    auth.uid(),
    now(),
    case when coalesce(p_status, 'activo') = 'archivado' then now() else null end
  )
  on conflict (id) do update set
    province_id = excluded.province_id,
    gender = excluded.gender,
    pm_number = excluded.pm_number,
    selected_dates = excluded.selected_dates,
    starts_on = excluded.starts_on,
    ends_on = excluded.ends_on,
    retreat_house = excluded.retreat_house,
    address = excluded.address,
    opening_time = excluded.opening_time,
    closing_time = excluded.closing_time,
    description = excluded.description,
    place_photo_url = excluded.place_photo_url,
    flyer_url = excluded.flyer_url,
    visible_to_lower_roles = excluded.visible_to_lower_roles,
    is_visible = excluded.is_visible,
    status = excluded.status,
    updated_by = auth.uid(),
    updated_at = now(),
    archived_at = excluded.archived_at
  returning id into saved_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (
    auth.uid(),
    'admin_upsert_motivador_period',
    jsonb_build_object('id', saved_id, 'province', p_province, 'gender', p_gender, 'pm_number', p_pm_number, 'status', p_status)
  );

  return saved_id;
end;
$$;

grant execute on function public.admin_upsert_motivador_period(uuid, text, text, integer, date[], text, text, text, text, text, text, text, boolean, text) to authenticated;

create or replace function public.admin_set_motivador_period_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_province_id uuid;
begin
  select province_id into target_province_id
  from public.motivador_periods
  where id = p_id
  and archived_at is null;

  if target_province_id is null then
    raise exception 'PM no encontrado.';
  end if;

  if not public.current_user_can_manage_motivador(target_province_id) then
    raise exception 'No tenes permisos para modificar este PM.';
  end if;

  if p_status not in ('activo', 'inactivo', 'borrador', 'archivado') then
    raise exception 'Estado invalido.';
  end if;

  update public.motivador_periods
  set status = p_status,
      is_visible = p_status = 'activo',
      archived_at = case when p_status = 'archivado' then now() else null end,
      updated_by = auth.uid(),
      updated_at = now()
  where id = p_id;

  insert into public.audit_logs (actor_id, action, metadata)
  values (auth.uid(), 'admin_set_motivador_period_status', jsonb_build_object('id', p_id, 'status', p_status));
end;
$$;

grant execute on function public.admin_set_motivador_period_status(uuid, text) to authenticated;
