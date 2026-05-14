-- Corrige usuarios registrados antes del cambio de criterio:
-- Invitado es solo quien usa la app sin cuenta; toda cuenta registrada empieza como Palestrista.

update public.profiles
set role = 'palestrista'
where role = 'invitado'
  and id in (select id from auth.users);

-- Mantiene a Lucas como administrador si ese usuario existe.
with target_user as (
  select id
  from auth.users
  where lower(email) = lower('lucasjquiroga13@gmail.com')
  limit 1
)
update public.profiles
set
  status = 'aprobado',
  role = 'administrador',
  approved_at = now()
where id in (select id from target_user);

select
  auth.users.email,
  profiles.status,
  profiles.role
from auth.users
join public.profiles on profiles.id = auth.users.id
where lower(auth.users.email) = lower('lucasjquiroga13@gmail.com');
