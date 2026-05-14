create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  province_id uuid not null references public.provinces(id) on delete cascade,
  name text not null,
  group_type text not null default 'jovenes' check (group_type in ('jovenes', 'adultos')),
  address text not null,
  phone text,
  meeting_day text,
  meeting_time text,
  description text,
  image_url text,
  created_at timestamptz not null default now(),
  unique (province_id, name)
);

create table if not exists public.community_news (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  title text not null,
  body text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.user_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  request_type text not null,
  details text,
  status text not null default 'pendiente' check (status in ('pendiente', 'aprobada', 'rechazada', 'observada')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id)
);

create table if not exists public.internal_messages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  province_id uuid references public.provinces(id),
  community_id uuid references public.communities(id),
  min_role public.user_role,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.communities enable row level security;
alter table public.community_news enable row level security;
alter table public.user_requests enable row level security;
alter table public.internal_messages enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Comunidades publicas" on public.communities;
create policy "Comunidades publicas" on public.communities for select using (true);

drop policy if exists "Noticias comunidad para usuarios aprobados" on public.community_news;
create policy "Noticias comunidad para usuarios aprobados" on public.community_news for select to authenticated using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'aprobado'
  )
);

drop policy if exists "Cada usuario ve sus solicitudes" on public.user_requests;
create policy "Cada usuario ve sus solicitudes" on public.user_requests for select to authenticated using (user_id = auth.uid());

drop policy if exists "Cada usuario crea sus solicitudes" on public.user_requests;
create policy "Cada usuario crea sus solicitudes" on public.user_requests for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Mensajes para aprobados" on public.internal_messages;
create policy "Mensajes para aprobados" on public.internal_messages for select to authenticated using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.status = 'aprobado'
  )
);

drop policy if exists "Auditoria para administradores" on public.audit_logs;
create policy "Auditoria para administradores" on public.audit_logs for select to authenticated using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('administrador', 'coordinador_nacional', 'vocal_nacional')
      and profiles.status = 'aprobado'
  )
);

insert into public.communities (province_id, name, group_type, address, phone, meeting_day, meeting_time, description, image_url)
select p.id, 'Comunidad Salta ' || n, 'jovenes', 'Direccion ficticia ' || n || ', Salta', '+54 387 400-' || lpad(n::text, 4, '0'), case when n % 2 = 0 then 'Sabado' else 'Domingo' end, case when n % 2 = 0 then '18:00' else '17:30' end, 'Comunidad ficticia de Salta para pruebas.', 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png'
from public.provinces p cross join generate_series(1, 29) n
where p.name = 'Salta'
on conflict (province_id, name) do nothing;

insert into public.communities (province_id, name, group_type, address, phone, meeting_day, meeting_time, description, image_url)
select p.id, 'Comunidad Jujuy ' || n, 'jovenes', 'Direccion ficticia ' || n || ', Jujuy', '+54 388 400-' || lpad(n::text, 4, '0'), case when n % 2 = 0 then 'Viernes' else 'Sabado' end, case when n % 2 = 0 then '20:00' else '18:30' end, 'Comunidad ficticia de Jujuy para pruebas.', 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png'
from public.provinces p cross join generate_series(1, 25) n
where p.name = 'Jujuy'
on conflict (province_id, name) do nothing;

insert into public.communities (province_id, name, group_type, address, phone, meeting_day, meeting_time, description, image_url)
select p.id, case when n > 16 then 'Comunidad Adultos Tucuman ' || (n - 16) else 'Comunidad Tucuman ' || n end, case when n > 16 then 'adultos' else 'jovenes' end, 'Direccion ficticia ' || n || ', Tucuman', '+54 381 400-' || lpad(n::text, 4, '0'), case when n > 16 then 'Jueves' when n % 2 = 0 then 'Sabado' else 'Miercoles' end, case when n > 16 then '20:30' when n % 2 = 0 then '19:00' else '21:00' end, 'Comunidad ficticia de Tucuman para pruebas.', 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png'
from public.provinces p cross join generate_series(1, 19) n
where p.name = 'Tucuman'
on conflict (province_id, name) do nothing;

insert into public.communities (province_id, name, group_type, address, phone, meeting_day, meeting_time, description, image_url)
select p.id, case when n > 17 then 'Comunidad Adultos Catamarca ' || (n - 17) else 'Comunidad Catamarca ' || n end, case when n > 17 then 'adultos' else 'jovenes' end, 'Direccion ficticia ' || n || ', Catamarca', '+54 383 400-' || lpad(n::text, 4, '0'), case when n > 17 then 'Martes' when n % 2 = 0 then 'Domingo' else 'Sabado' end, case when n > 17 then '20:00' when n % 2 = 0 then '18:00' else '20:00' end, 'Comunidad ficticia de Catamarca para pruebas.', 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png'
from public.provinces p cross join generate_series(1, 20) n
where p.name = 'Catamarca'
on conflict (province_id, name) do nothing;

insert into public.communities (province_id, name, group_type, address, phone, meeting_day, meeting_time, description, image_url)
select p.id, 'Comunidad Cordoba ' || n, 'jovenes', 'Direccion ficticia ' || n || ', Cordoba', '+54 351 400-' || lpad(n::text, 4, '0'), 'Sabado', '18:30', 'Comunidad ficticia de Cordoba para pruebas.', 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png'
from public.provinces p cross join generate_series(1, 2) n
where p.name = 'Cordoba'
on conflict (province_id, name) do nothing;

insert into public.communities (province_id, name, group_type, address, phone, meeting_day, meeting_time, description, image_url)
select p.id, 'Comunidad San Luis ' || n, 'jovenes', 'Direccion ficticia ' || n || ', San Luis', '+54 266 400-' || lpad(n::text, 4, '0'), 'Viernes', '20:30', 'Comunidad ficticia de San Luis para pruebas.', 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png'
from public.provinces p cross join generate_series(1, 3) n
where p.name = 'San Luis'
on conflict (province_id, name) do nothing;

insert into public.community_news (community_id, title, body)
select c.id, 'Reunion semanal de la comunidad', 'Noticia interna ficticia para probar publicaciones por comunidad.'
from public.communities c
where c.name in ('Comunidad Tucuman 1', 'Comunidad Cordoba 1', 'Comunidad Catamarca 2')
on conflict do nothing;
