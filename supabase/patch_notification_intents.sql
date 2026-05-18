-- Arquitectura base de notificaciones.
-- Esta etapa NO envia push masivos: registra la intencion para que un backend/edge function la procese luego.

create table if not exists public.notification_intents (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null check (notification_type in (
    'mensaje_comunidad',
    'mensaje_privado',
    'recordatorio_usuario',
    'aviso_dirigencial',
    'recordatorio_evento',
    'periodo_motivador'
  )),
  title text not null,
  body text not null,
  target_kind text not null check (target_kind in (
    'usuario',
    'comunidad',
    'provincia',
    'rol',
    'nacional',
    'recordatorio_usuario'
  )),
  target_value text,
  source_type text,
  source_id uuid,
  status text not null default 'pendiente' check (status in ('pendiente', 'procesada', 'fallida', 'cancelada')),
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.notification_intents enable row level security;

drop policy if exists "Dirigentes ven intenciones propias o globales" on public.notification_intents;
create policy "Dirigentes ven intenciones propias o globales"
on public.notification_intents for select
to authenticated
using (
  created_by = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador')
      and p.status = 'aprobado'
  )
);

create or replace function public.create_notification_intent(
  p_notification_type text,
  p_title text,
  p_body text,
  p_target_kind text,
  p_target_value text default null,
  p_source_type text default null,
  p_source_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_status text;
  v_intent_id uuid;
begin
  select role, status into v_role, v_status
  from public.profiles
  where id = auth.uid();

  if auth.uid() is null or v_status <> 'aprobado' then
    raise exception 'Usuario no autorizado para notificar';
  end if;

  if v_role not in ('vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador', 'coordinador_comunidad', 'animador_comunidad') then
    raise exception 'Tu rango no puede preparar notificaciones';
  end if;

  insert into public.notification_intents (
    created_by,
    notification_type,
    title,
    body,
    target_kind,
    target_value,
    source_type,
    source_id
  )
  values (
    auth.uid(),
    p_notification_type,
    p_title,
    p_body,
    p_target_kind,
    p_target_value,
    p_source_type,
    p_source_id
  )
  returning id into v_intent_id;

  return v_intent_id;
end;
$$;

grant execute on function public.create_notification_intent(text, text, text, text, text, text, uuid) to authenticated;
