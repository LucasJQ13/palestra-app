create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_province_id uuid;
begin
  select provinces.id
  into selected_province_id
  from public.provinces
  where provinces.name = new.raw_user_meta_data->>'province'
  limit 1;

  insert into public.profiles (
    id,
    full_name,
    phone,
    province_id,
    community_name,
    status,
    role
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email, 'Usuario nuevo'),
    new.raw_user_meta_data->>'phone',
    selected_province_id,
    new.raw_user_meta_data->>'community_name',
    'pendiente',
    'palestrista'
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    phone = excluded.phone,
    province_id = excluded.province_id,
    community_name = excluded.community_name,
    role = case
      when profiles.role = 'invitado' then 'palestrista'::public.user_role
      else profiles.role
    end;

  return new;
end;
$$;
