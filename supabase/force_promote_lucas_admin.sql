-- Fuerza el usuario de Lucas como administrador real.
-- Ejecutar desde Supabase SQL Editor.

with target_user as (
  select id, email
  from auth.users
  where lower(email) = lower('lucasjquiroga13@gmail.com')
  limit 1
)
insert into public.profiles (
  id,
  full_name,
  status,
  role,
  approved_at
)
select
  target_user.id,
  target_user.email,
  'aprobado',
  'administrador',
  now()
from target_user
on conflict (id) do update
set
  status = 'aprobado',
  role = 'administrador',
  approved_at = now();

select
  auth.users.id,
  auth.users.email,
  auth.users.email_confirmed_at,
  profiles.full_name,
  profiles.status,
  profiles.role,
  profiles.community_name
from auth.users
left join public.profiles on profiles.id = auth.users.id
where lower(auth.users.email) = lower('lucasjquiroga13@gmail.com');
