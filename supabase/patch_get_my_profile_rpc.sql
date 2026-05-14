create or replace function public.get_my_profile()
returns table (
  user_id uuid,
  email text,
  full_name text,
  phone text,
  province text,
  community_name text,
  status public.user_status,
  role public.user_role
)
language sql
security definer
set search_path = public
as $$
  select
    auth.users.id as user_id,
    auth.users.email::text as email,
    profiles.full_name,
    profiles.phone,
    provinces.name as province,
    profiles.community_name,
    profiles.status,
    profiles.role
  from auth.users
  left join public.profiles on profiles.id = auth.users.id
  left join public.provinces on provinces.id = profiles.province_id
  where auth.users.id = auth.uid()
  limit 1;
$$;

grant execute on function public.get_my_profile() to authenticated;
