select
  auth.users.id,
  auth.users.email,
  auth.users.email_confirmed_at,
  profiles.full_name,
  profiles.status,
  profiles.role,
  profiles.community_name,
  provinces.name as province
from auth.users
left join public.profiles on profiles.id = auth.users.id
left join public.provinces on provinces.id = profiles.province_id
where auth.users.email = 'lucasjquiroga13@gmail.com';
