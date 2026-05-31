-- Sistema de QR verificable para credenciales Palestra APP.
-- Ejecutar en Supabase SQL Editor. No expone datos privados en el QR:
-- el QR contiene credential_id + token, y la validacion se resuelve contra Supabase.

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists subrole_key text;

create table if not exists public.profile_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  version integer not null default 1,
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists profile_credentials_user_idx on public.profile_credentials(user_id);
create index if not exists profile_credentials_token_idx on public.profile_credentials(token);

alter table public.profile_credentials enable row level security;

drop policy if exists "Usuarios leen sus credenciales" on public.profile_credentials;
create policy "Usuarios leen sus credenciales"
  on public.profile_credentials
  for select
  to authenticated
  using (profile_credentials.user_id = auth.uid());

create or replace function public.issue_profile_credential()
returns table (
  credential_id uuid,
  token text,
  user_id uuid,
  issued_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  version integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.profiles%rowtype;
  current_credential public.profile_credentials%rowtype;
begin
  select *
    into current_profile
  from public.profiles
  where id = auth.uid();

  if current_profile.id is null then
    raise exception 'No existe perfil para esta sesion.';
  end if;

  update public.profile_credentials
  set revoked_at = now()
  where profile_credentials.user_id = current_profile.id
    and revoked_at is null;

  insert into public.profile_credentials (user_id, expires_at, version)
  values (
    current_profile.id,
    now() + interval '365 days',
    coalesce((select max(pc2.version) + 1 from public.profile_credentials pc2 where pc2.user_id = current_profile.id), 1)
  )
  returning * into current_credential;

  credential_id := current_credential.id;
  token := current_credential.token;
  issue_profile_credential.user_id := current_credential.user_id;
  issued_at := current_credential.issued_at;
  expires_at := current_credential.expires_at;
  revoked_at := current_credential.revoked_at;
  version := current_credential.version;
  return next;
end;
$$;

create or replace function public.validate_profile_credential(p_token text)
returns table (
  status text,
  message text,
  credential_id uuid,
  user_id uuid,
  full_name text,
  role text,
  subrole_key text,
  province text,
  community_name text,
  user_status text,
  issued_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  credential public.profile_credentials%rowtype;
  profile_row public.profiles%rowtype;
begin
  select *
    into credential
  from public.profile_credentials pc
  where pc.token = p_token
  limit 1;

  if credential.id is null then
    status := 'invalid';
    message := 'Credencial no valida';
    return next;
    return;
  end if;

  select *
    into profile_row
  from public.profiles
  where profiles.id = credential.user_id;

  credential_id := credential.id;
  validate_profile_credential.user_id := credential.user_id;
  issued_at := credential.issued_at;
  expires_at := credential.expires_at;

  if credential.revoked_at is not null then
    status := 'revoked';
    message := 'Credencial revocada';
    return next;
    return;
  end if;

  if credential.expires_at is not null and credential.expires_at <= now() then
    status := 'expired';
    message := 'Credencial vencida';
    return next;
    return;
  end if;

  if profile_row.id is null or profile_row.status <> 'aprobado' then
    status := 'invalid';
    message := 'Credencial no valida';
    user_status := profile_row.status::text;
    return next;
    return;
  end if;

  status := 'valid';
  message := 'Credencial valida';
  full_name := profile_row.full_name;
  role := profile_row.role::text;
  subrole_key := profile_row.subrole_key;
  province := (
    select provinces.name
    from public.provinces
    where provinces.id = profile_row.province_id
  );
  community_name := profile_row.community_name;
  user_status := profile_row.status::text;
  return next;
end;
$$;

grant execute on function public.issue_profile_credential() to authenticated;
grant execute on function public.validate_profile_credential(text) to authenticated;
