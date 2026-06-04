# RPC: create_notification_intent

## Estado

Plantilla documental. No contiene SQL ejecutable.

## Propósito

Crear una intención de notificación para que usuarios alcanzados reciban un aviso relacionado con noticia, evento, PM, comunidad, mensaje o comunicación institucional.

Esta RPC no necesariamente envía el push por sí misma. Puede dejar una intención para que una Edge Function o proceso externo la procese.

## Módulos afectados

- `src/lib/profiles.ts`
- `src/lib/notificationHelpers.ts`
- Noticias
- Agenda
- PM
- Comunidad
- Panel dirigencial
- Edge Function `send-push-notifications`
- Edge Function `debug-push-notification`

## Parámetros esperados

Pendiente de confirmar contra SQL real vigente.

Parámetros funcionales esperados:

- tipo de notificación.
- título.
- cuerpo.
- target kind.
- target value.
- provincia.
- comunidad.
- source type.
- source id.
- datos extra.

## Retorno esperado por frontend

Debe devolver:

- id de intención creada.
- estado inicial.
- mensaje de éxito/error.

Importante: el frontend no debe interpretar intención creada como push efectivamente recibido por usuarios.

## Tablas relacionadas

- `notification_intents`.
- `device_push_tokens`.
- `profiles`.
- posibles tablas fuente: `news`, `events`, `motivador_periods`, `community_publications`, mensajes.

## Permisos esperados

Reglas esperadas:

- Solo roles con permiso `enviar_notificaciones` deberían crear notificaciones generales.
- Dirigentes comunitarios solo deberían notificar su comunidad si está permitido.
- Dirigentes provinciales solo su provincia si corresponde.
- Nacionales según alcance.
- Administrador con alcance global.
- Usuario común no debe crear notificaciones masivas.

## Validaciones internas recomendadas

1. Usuario autenticado.
2. Perfil aprobado.
3. Permiso de notificar.
4. Alcance territorial válido.
5. Tipo de notificación permitido.
6. Fuente existente si se referencia `source_id`.
7. Título y cuerpo no vacíos.
8. Registro de actor creador.

## Riesgo

Medio/alto.

Errores posibles:

- notificar usuarios equivocados,
- crear intención sin envío real,
- éxito falso en UI,
- spam accidental,
- alcance provincial/comunitario incorrecto,
- exponer mensajes privados a público incorrecto.

## Historial / parches relacionados

Patches mencionados:

- `patch_notification_intents.sql`
- `patch_push_notification_delivery_foundation.sql`

Versión actual:

- Revisar firmas antes de agregar campos nuevos de push.

## Pruebas manuales mínimas

1. Admin crea notificación nacional.
2. Dirigente provincial crea notificación provincial si corresponde.
3. Dirigente comunitario crea aviso comunitario si corresponde.
4. Usuario común no puede crear notificación.
5. Se crea intención en Supabase.
6. Edge Function procesa o debug muestra estado.
7. No mostrar éxito de entrega si solo se creó intención.
8. Verificar que usuarios fuera de alcance no reciban aviso.

## Pendiente de completar

- Copiar SQL real vigente desde Supabase.
- Confirmar firma exacta.
- Confirmar estructura de `notification_intents`.
- Confirmar proceso real de envío.
- Confirmar Edge Function asociada.
- Confirmar auditoría.
- Confirmar si usa `security definer`.
- Confirmar `set search_path = public`.
