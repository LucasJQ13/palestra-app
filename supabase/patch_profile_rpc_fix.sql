create or replace function public.update_my_profile(
  p_full_name text,
  p_phone text,
  p_province text,
  p_community_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_province_id uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  select id
  into selected_province_id
  from public.provinces
  where name = p_province
  limit 1;

  if selected_province_id is null then
    raise exception 'Provincia no encontrada';
  end if;

  update public.profiles
  set
    full_name = nullif(trim(p_full_name), ''),
    phone = nullif(trim(p_phone), ''),
    province_id = selected_province_id,
    community_name = nullif(trim(p_community_name), '')
  where id = auth.uid();
end;
$$;

grant execute on function public.update_my_profile(text, text, text, text) to authenticated;

create or replace function public.current_user_can_manage_profiles()
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
      and profiles.role in ('vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador')
  );
$$;

grant execute on function public.current_user_can_manage_profiles() to authenticated;

drop policy if exists "Dirigentes ven perfiles pendientes" on public.profiles;
create policy "Dirigentes ven perfiles pendientes"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.current_user_can_manage_profiles()
);

drop policy if exists "Dirigentes aprueban perfiles" on public.profiles;
create policy "Dirigentes aprueban perfiles"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or public.current_user_can_manage_profiles()
)
with check (
  id = auth.uid()
  or public.current_user_can_manage_profiles()
);
