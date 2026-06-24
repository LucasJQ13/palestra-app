-- Objetivo: restaurar la persistencia de Identidad y habilitar un bucket dedicado para logos de partner.
-- Contexto: Issue #91 reabierta; admin_update_config podia revertir el guardado al auditar jsonb_object_keys como escalar y el logo dependia del bucket generico content-images.
-- Issue: #91.
-- Dependencias: public.profiles, public.audit_logs, public.current_user_is_admin() y el esquema storage de Supabase.
-- Tablas o funciones afectadas: public.admin_config, public.get_admin_config(), public.admin_update_config(jsonb), storage.buckets y policies de storage.objects.
-- Riesgo: medio; redefine una RPC administrativa y agrega un bucket publico con escritura exclusiva para administradores.
-- Compatibilidad: conserva la firma RPC consumida por la app y el JSON previo; solo completa claves nuevas de identity cuando faltan.
-- Rollback manual sugerido:
--   restaurar la version anterior validada de public.admin_update_config(jsonb);
--   drop policy if exists "Logos de partner visibles" on storage.objects;
--   drop policy if exists "Administradores suben logos de partner" on storage.objects;
--   drop policy if exists "Administradores actualizan logos de partner" on storage.objects;
--   drop policy if exists "Administradores eliminan logos de partner" on storage.objects;
--   no eliminar el bucket hasta respaldar sus objetos.
-- Verificacion:
--   select config -> 'identity' from public.admin_config where id = true;
--   select id, public from storage.buckets where id = 'partner-branding';
--   select public.get_admin_config() -> 'identity';

create table if not exists public.admin_config (
  id boolean primary key default true,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id),
  constraint admin_config_singleton check (id = true)
);

alter table public.admin_config enable row level security;

drop policy if exists "Admin config visible para todos" on public.admin_config;
create policy "Admin config visible para todos"
on public.admin_config
for select
using (true);

insert into public.admin_config (id, config)
values (true, '{}'::jsonb)
on conflict (id) do nothing;

update public.admin_config
set config = jsonb_set(
  coalesce(config, '{}'::jsonb),
  '{identity}',
  coalesce(config -> 'identity', '{}'::jsonb) || jsonb_build_object(
    'partnerLogoUrl', coalesce(config #> '{identity,partnerLogoUrl}', '""'::jsonb),
    'partnerLinkUrl', coalesce(config #> '{identity,partnerLinkUrl}', '""'::jsonb),
    'partnerLogoVisible', coalesce(config #> '{identity,partnerLogoVisible}', 'false'::jsonb),
    'partnerLogoAlt', coalesce(config #> '{identity,partnerLogoAlt}', '""'::jsonb)
  ),
  true
)
where id = true;

create or replace function public.get_admin_config()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select config
  from public.admin_config
  where id = true;
$$;

revoke all on function public.get_admin_config() from public;
grant execute on function public.get_admin_config() to anon, authenticated;

create or replace function public.admin_update_config(p_config jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  config_keys jsonb;
begin
  if not public.current_user_is_admin() then
    raise exception 'No autorizado';
  end if;

  if p_config is null or jsonb_typeof(p_config) <> 'object' then
    raise exception 'La configuracion debe ser un objeto JSON';
  end if;

  select coalesce(jsonb_agg(key order by key), '[]'::jsonb)
  into config_keys
  from jsonb_object_keys(p_config) as config_key(key);

  insert into public.admin_config (id, config, updated_by, updated_at)
  values (true, p_config, auth.uid(), now())
  on conflict (id) do update
  set
    config = excluded.config,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at;

  insert into public.audit_logs (actor_id, action, metadata)
  values (
    auth.uid(),
    'admin_update_config',
    jsonb_build_object('keys', config_keys)
  );
end;
$$;

revoke all on function public.admin_update_config(jsonb) from public;
grant execute on function public.admin_update_config(jsonb) to authenticated;

insert into storage.buckets (id, name, public)
values ('partner-branding', 'partner-branding', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Logos de partner visibles" on storage.objects;
create policy "Logos de partner visibles"
on storage.objects
for select
using (bucket_id = 'partner-branding');

drop policy if exists "Administradores suben logos de partner" on storage.objects;
create policy "Administradores suben logos de partner"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'partner-branding'
  and public.current_user_is_admin()
);

drop policy if exists "Administradores actualizan logos de partner" on storage.objects;
create policy "Administradores actualizan logos de partner"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'partner-branding'
  and public.current_user_is_admin()
)
with check (
  bucket_id = 'partner-branding'
  and public.current_user_is_admin()
);

drop policy if exists "Administradores eliminan logos de partner" on storage.objects;
create policy "Administradores eliminan logos de partner"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'partner-branding'
  and public.current_user_is_admin()
);

notify pgrst, 'reload schema';
