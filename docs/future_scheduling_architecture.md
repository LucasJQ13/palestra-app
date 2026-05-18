# Arquitectura propuesta para agenda, eventos y avisos programados

Esta propuesta evita duplicar `news`, `agenda_events`, `motivador_periods` y `community_publications`. La idea es sumar una capa comun de calendario que pueda referenciar contenidos ya existentes.

## Tablas a usar primero

- `agenda_events`: eventos y noticias con fecha que ya aparecen en Notilestra.
- `motivador_periods`: Periodos Motivadores, con `selected_dates`, provincia, privacidad y estado.
- `community_publications`: avisos, fechas y encuestas de comunidad.
- `notification_intents`: nueva cola de intenciones para futuras push notifications.
- `device_push_tokens`: dispositivos asociados a usuarios.
- `user_agenda_preferences`: favoritos y recordatorios por usuario.

## Nueva tabla recomendada para la siguiente etapa

`calendar_entries`

Campos sugeridos:

- `id`
- `source_type`: `agenda_event`, `motivador_period`, `community_publication`, `manual`
- `source_id`
- `date`
- `starts_at`
- `ends_at`
- `title`
- `visibility_role`
- `province_id`
- `community_id`
- `status`
- `created_by`

## Relaciones

- Un PM puede generar varias filas en `calendar_entries`, una por cada fecha seleccionada.
- Una publicacion comunitaria tipo `fecha` puede generar una fila.
- Un evento institucional puede generar una fila.
- Las notificaciones se relacionan por `source_type` y `source_id`, sin acoplarse a una sola tabla.

## Como convive con PMs y Noticias

- PM sigue siendo la fuente oficial para Periodo Motivador.
- Notilestra sigue mostrando eventos y noticias.
- El calendario consulta una vista unificada, pero cada modulo conserva su tabla original.
- La privacidad se calcula por rol, provincia y comunidad antes de mostrar cada entrada.

## Archivos afectados cuando se implemente

- `src/lib/remoteData.ts`: lectura unificada de calendario.
- `src/lib/profiles.ts`: RPC administrativas.
- `App.tsx`: render de calendario y formularios admin.
- `supabase/*.sql`: tabla, vista/RPC y politicas RLS.

## Regla para no duplicar

No copiar texto de una noticia o PM a otra tabla salvo campos de busqueda/cache. La tabla unificada debe funcionar como indice de calendario, no como repositorio paralelo de contenido.
