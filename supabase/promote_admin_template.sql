-- Reemplazar TU_EMAIL_REAL@DOMINIO.COM por el email registrado en Supabase Auth.
update public.profiles
set
  status = 'aprobado',
  role = 'administrador',
  approved_at = now()
where id = (
  select id
  from auth.users
  where email = 'TU_EMAIL_REAL@DOMINIO.COM'
);

select
  profiles.id,
  auth.users.email,
  profiles.full_name,
  profiles.status,
  profiles.role
from public.profiles
join auth.users on auth.users.id = profiles.id
where auth.users.email = 'TU_EMAIL_REAL@DOMINIO.COM';
