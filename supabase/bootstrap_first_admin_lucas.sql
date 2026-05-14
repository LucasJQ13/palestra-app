-- Bootstrap del primer administrador.
-- Usar solo para el primer admin real del proyecto.

update auth.users
set
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  confirmed_at = coalesce(confirmed_at, now())
where email = 'lucasjquiroga13@gmail.com';

insert into public.profiles (id, full_name, status, role)
select
  auth.users.id,
  coalesce(auth.users.raw_user_meta_data->>'full_name', auth.users.email, 'Administrador'),
  'aprobado',
  'administrador'
from auth.users
where auth.users.email = 'lucasjquiroga13@gmail.com'
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
  profiles.role
from auth.users
left join public.profiles on profiles.id = auth.users.id
where auth.users.email = 'lucasjquiroga13@gmail.com';
