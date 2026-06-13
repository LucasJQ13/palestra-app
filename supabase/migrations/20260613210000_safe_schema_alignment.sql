-- Initial non-destructive schema alignment for Palestra APP.
--
-- IMPORTANT:
-- - Review this file before running it in Supabase.
-- - This migration is intentionally not executed by Codex.
-- - It does not delete or rename columns, change existing column types,
--   redefine RPCs, add foreign keys, enable RLS, or modify stored data.
-- - Missing tables are skipped. Their creation belongs to a migration based on
--   a verified export of the real database.
--
-- Related documentation:
-- - docs/supabase/SCHEMA_INVENTORY.md
-- - docs/supabase/CANONICAL_SCHEMA.md
-- - docs/supabase/FALLBACK_AUDIT.md

begin;

-- ---------------------------------------------------------------------------
-- Territory
-- Covers FB-01 and part of FB-02 without changing existing province records.
-- ---------------------------------------------------------------------------

alter table if exists public.provinces
  add column if not exists logo_url text,
  add column if not exists is_active boolean default true,
  add column if not exists archived_at timestamptz,
  add column if not exists updated_at timestamptz default now(),
  add column if not exists updated_by uuid;

-- Community fields are nullable where legacy rows may not contain data.
-- group_type and is_active receive defaults only for future inserts.
alter table if exists public.communities
  add column if not exists group_type text default 'jovenes',
  add column if not exists image_url text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists is_active boolean default true,
  add column if not exists archived_at timestamptz,
  add column if not exists updated_at timestamptz default now(),
  add column if not exists updated_by uuid;

-- ---------------------------------------------------------------------------
-- Profiles
-- Covers the structural part of FB-13 and fields consumed by get_my_profile.
-- UUID relationship columns remain nullable and have no new FK in this phase.
-- ---------------------------------------------------------------------------

alter table if exists public.profiles
  add column if not exists avatar_url text,
  add column if not exists community_id uuid,
  add column if not exists managed_community_id uuid,
  add column if not exists subrole_key text,
  add column if not exists display_role_label text,
  add column if not exists gender_preference text,
  add column if not exists nickname text,
  add column if not exists use_nickname_in_greetings boolean default false,
  add column if not exists credential_name_mode text default 'name',
  add column if not exists perseverance_start_year integer,
  add column if not exists personal_pm_type text,
  add column if not exists personal_pm_number integer,
  add column if not exists personal_pm_province_id uuid,
  add column if not exists personal_pm_motto text,
  add column if not exists pm_motto text,
  add column if not exists personal_greeting_color text,
  add column if not exists province_community_changed_at timestamptz,
  add column if not exists last_profile_edit_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists updated_at timestamptz default now();

-- ---------------------------------------------------------------------------
-- Published content
-- Covers FB-04 and the column-level portion of FB-08.
-- ---------------------------------------------------------------------------

alter table if exists public.news
  add column if not exists image_url text,
  add column if not exists subrole_key text,
  add column if not exists updated_at timestamptz default now(),
  add column if not exists updated_by uuid,
  add column if not exists archived_at timestamptz;

alter table if exists public.events
  add column if not exists ends_at timestamptz,
  add column if not exists subrole_key text,
  add column if not exists updated_at timestamptz default now(),
  add column if not exists updated_by uuid,
  add column if not exists archived_at timestamptz;

alter table if exists public.community_publications
  add column if not exists subtitle text,
  add column if not exists body_format text default 'normal',
  add column if not exists image_url text,
  add column if not exists link_label text,
  add column if not exists link_url text,
  add column if not exists subrole_key text,
  add column if not exists updated_at timestamptz default now(),
  add column if not exists updated_by uuid,
  add column if not exists archived_at timestamptz;

-- ---------------------------------------------------------------------------
-- Navigation, editable content, materials and runtime configuration
-- Covers the structural parts of FB-09, FB-10 and FB-17.
-- ---------------------------------------------------------------------------

alter table if exists public.app_tabs
  add column if not exists icon_name text default 'document-text-outline',
  add column if not exists section_type text default 'simple',
  add column if not exists updated_at timestamptz default now(),
  add column if not exists updated_by uuid;

alter table if exists public.app_content
  add column if not exists blocks jsonb default '[]'::jsonb,
  add column if not exists updated_at timestamptz default now(),
  add column if not exists updated_by uuid;

alter table if exists public.materials
  add column if not exists category text default 'General',
  add column if not exists visibility text default 'interno',
  add column if not exists file_url text,
  add column if not exists sort_order integer default 100,
  add column if not exists province_id uuid,
  add column if not exists subrole_key text,
  add column if not exists updated_at timestamptz default now(),
  add column if not exists updated_by uuid,
  add column if not exists archived_at timestamptz;

-- The table is not created here. If it is absent, verify the real schema and
-- apply a dedicated table-creation migration based on that export.
alter table if exists public.app_runtime_config
  add column if not exists min_supported_version text default '0.1.0',
  add column if not exists recommended_version text default '0.1.38',
  add column if not exists maintenance_mode boolean default false,
  add column if not exists global_message text,
  add column if not exists feature_flags jsonb default '{}'::jsonb,
  add column if not exists catholic_news jsonb default '{}'::jsonb,
  add column if not exists updated_at timestamptz default now(),
  add column if not exists updated_by uuid;

-- ---------------------------------------------------------------------------
-- Non-destructive indexes
-- Each block skips the index when its table is absent. All referenced columns
-- are established above when the corresponding table exists.
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.provinces') is not null then
    execute 'create index if not exists provinces_active_name_idx
      on public.provinces (is_active, name)
      where archived_at is null';
  end if;

  if to_regclass('public.communities') is not null then
    execute 'create index if not exists communities_province_active_name_idx
      on public.communities (province_id, is_active, name)
      where archived_at is null';
  end if;

  if to_regclass('public.profiles') is not null then
    execute 'create index if not exists profiles_active_scope_idx
      on public.profiles (status, role, province_id, community_id)
      where deleted_at is null';
    execute 'create index if not exists profiles_subrole_key_idx
      on public.profiles (subrole_key)
      where subrole_key is not null and deleted_at is null';
  end if;

  if to_regclass('public.news') is not null then
    execute 'create index if not exists news_province_created_idx
      on public.news (province_id, created_at desc)
      where archived_at is null';
  end if;

  if to_regclass('public.events') is not null then
    execute 'create index if not exists events_province_starts_idx
      on public.events (province_id, starts_at)
      where archived_at is null';
  end if;

  if to_regclass('public.materials') is not null then
    execute 'create index if not exists materials_scope_order_idx
      on public.materials (province_id, visibility, sort_order)
      where archived_at is null';
  end if;

  if to_regclass('public.community_publications') is not null then
    execute 'create index if not exists community_publications_scope_created_idx
      on public.community_publications (community_id, visibility, created_at desc)
      where archived_at is null';
  end if;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- Manual verification (do not uncomment until the migration is reviewed).
-- Run these queries separately after applying the migration in Supabase.
-- ---------------------------------------------------------------------------

-- 1. Confirm that the expected columns exist and inspect their actual types:
--
-- select table_name, column_name, data_type, is_nullable, column_default
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name in (
--     'provinces',
--     'communities',
--     'profiles',
--     'news',
--     'events',
--     'community_publications',
--     'app_tabs',
--     'app_content',
--     'materials',
--     'app_runtime_config'
--   )
-- order by table_name, ordinal_position;

-- 2. Confirm that this migration did not introduce invalid existing values:
--
-- select count(*) as communities_with_partial_coordinates
-- from public.communities
-- where (latitude is null) <> (longitude is null);
--
-- select count(*) as profiles_with_unknown_subrole
-- from public.profiles
-- where subrole_key is not null
--   and btrim(subrole_key) = '';

-- 3. Confirm that the new indexes are present:
--
-- select schemaname, tablename, indexname, indexdef
-- from pg_indexes
-- where schemaname = 'public'
--   and indexname in (
--     'provinces_active_name_idx',
--     'communities_province_active_name_idx',
--     'profiles_active_scope_idx',
--     'profiles_subrole_key_idx',
--     'news_province_created_idx',
--     'events_province_starts_idx',
--     'materials_scope_order_idx',
--     'community_publications_scope_created_idx'
--   )
-- order by indexname;

-- 4. Functional checks to perform manually after schema verification:
--
-- - Open Communities and confirm coordinates, image and status still load.
-- - Open profile and verify role/subrole and territorial data.
-- - Create and edit a news item with an optional image.
-- - Open community publications containing subtitle, image and link.
-- - Open dynamic tabs and confirm icon_name/section_type are returned.
-- - Open Materials as administrator and as a regular approved user.
-- - Read app_runtime_config and verify the row with id = 'default' separately.
