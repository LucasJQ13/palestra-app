-- Configuracion remota minima para controlar la app sin recompilar APK.

create table if not exists public.app_runtime_config (
  id text primary key default 'default',
  min_supported_version text not null default '0.1.0',
  recommended_version text not null default '0.1.32',
  maintenance_mode boolean not null default false,
  global_message text,
  feature_flags jsonb not null default '{}'::jsonb,
  catholic_news jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.app_runtime_config
  add column if not exists catholic_news jsonb not null default '{}'::jsonb;

alter table public.app_runtime_config enable row level security;

drop policy if exists "Config runtime visible" on public.app_runtime_config;
create policy "Config runtime visible"
on public.app_runtime_config for select
using (true);

drop policy if exists "Administradores gestionan config runtime" on public.app_runtime_config;
create policy "Administradores gestionan config runtime"
on public.app_runtime_config for all to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

insert into public.app_runtime_config (
  id,
  min_supported_version,
  recommended_version,
  maintenance_mode,
  global_message,
  feature_flags,
  catholic_news
)
values (
  'default',
  '0.1.0',
  '0.1.32',
  false,
  null,
  jsonb_build_object(
    'externalCatholicNews', true,
    'dynamicNavigation', true,
    'honorLevels', true
  ),
  jsonb_build_object(
    'enabled', true,
    'maxItems', 3,
    'sourceOrder', jsonb_build_array('vatican', 'episcopado', 'aci'),
    'sources', jsonb_build_object(
      'vatican', true,
      'episcopado', true,
      'aci', true
    )
  )
)
on conflict (id) do update
set
  recommended_version = excluded.recommended_version,
  feature_flags = public.app_runtime_config.feature_flags || excluded.feature_flags,
  catholic_news = coalesce(nullif(public.app_runtime_config.catholic_news, '{}'::jsonb), excluded.catholic_news),
  updated_at = now();

grant select on public.app_runtime_config to anon, authenticated;
