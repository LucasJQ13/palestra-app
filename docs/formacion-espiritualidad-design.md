# Formación y espiritualidad - Diseño técnico inicial

Fecha: 2026-06-20

## Objetivo

Crear la base funcional de una nueva sección de `Formación y espiritualidad` sin implementar pantallas todavía. La primera versión debe mostrar únicamente una Novena interactiva con un test sencillo y un Termómetro espiritual de acompañamiento.

Esta auditoría toma como referencia módulos ya existentes en la app: navegación dinámica, Proceso Educativo, PM, Evangelio del Día, Materiales, notificaciones, permisos por rango/subrango, configuración remota y storage de imágenes.

## Decisiones base

- La sección debe ser un módulo propio: `formacion_espiritualidad`.
- No conviene reutilizar el tab actual `proceso_educativo` como contenedor principal, porque ese módulo ya representa una ruta formativa por estaciones y materiales. Se puede reutilizar parte de su patrón técnico, pero el dominio pastoral debe quedar separado.
- La primera versión debe tener solo Novena, Quiz simple y Termómetro espiritual.
- El Termómetro espiritual no debe medir santidad, rendimiento ni comparación entre usuarios. La pregunta central debe ser: `¿Cómo viene tu camino hoy?`
- La sección debe estar disponible para usuarios aprobados desde `palestrista` en adelante. `invitado` no debe acceder al contenido interno.
- La gestión debe usar `role` y `subrole_key`; no se deben crear rangos nuevos.

## Ubicación en navegación

Recomendación: agregar `formacion_espiritualidad` como pestaña principal después de `intenciones` y antes de `proceso_educativo`.

Motivo:

- `Intenciones` y `Formación y espiritualidad` comparten tono espiritual y de oración.
- `Proceso Educativo` queda luego como módulo formativo más estructurado.
- Evita mezclar Novena con estaciones del camino formativo.

Propuesta de tab:

```ts
{
  key: 'formacion_espiritualidad',
  label: 'Formación',
  icon: 'sparkles-outline',
  sectionType: 'internal',
  visible: true,
  visibleRoles: null
}
```

La visibilidad real debe aplicarse con `canAccessPrivate(session)`: usuario aprobado y distinto de `invitado`.

## Auditoría de módulos reutilizables

| Módulo actual | Reutilización recomendada | Límite |
| --- | --- | --- |
| `formation_path` / Proceso Educativo | Reutilizar patrón de estación, orden, visibilidad por roles, admin panel colapsable y materiales vinculados. | No usar la misma tabla para Novenas; el dominio y el progreso son distintos. |
| PM / `periodo_motivador` | Reutilizar alcance nacional/provincial, estados `activo/inactivo/borrador/archivado` y filtros por provincia. | No reutilizar su modelo de fechas; la Novena necesita días 1-9 y progreso por usuario. |
| Evangelio del Día | Reutilizar patrón de configuración remota, fuente externa, carga manual y fallback. | No depender del scraping de Evangelio para Novenas. La Novena debe ser contenido administrable. |
| Notificaciones | Reutilizar `notification_intents`, `deliverNotificationIntent`, canales push y recordatorios locales como base futura. | Primera versión no debe disparar notificaciones automáticas salvo que se cree una issue específica. |
| Materiales/documentos | Reutilizar `materials`, `AppMaterialRecord` y botones/documentos como anexos futuros. | La primera versión no debe convertirse en biblioteca documental. |
| Permisos de vocales | Reutilizar `role` + `subrole_key`, especialmente `formacion_espiritualidad`. | No crear rangos nuevos como "Vocal de Novena". |
| Configuración remota | Reutilizar `AppAdminConfig` para feature flag y opciones globales simples. | El contenido de la Novena debe persistir en tablas, no en JSON de configuración. |
| Paneles administrativos | Reutilizar estructura visual y lógica de `FormationPathAdminPanel`, `DailyGospelAdminPanel` y `DownloadsAdminPanel`. | Crear un panel propio para evitar mezclar administración de secciones. |
| Storage de imágenes | Reutilizar `uploadPickedImageToPublicUrl`, bucket `materials` o bucket nuevo si se decide ordenar por dominio. | Evitar guardar base64 o imágenes locales persistentes. |

## Alcance de primera versión

La primera versión debe incluir:

- Lista de Novenas disponibles.
- Detalle de Novena con días 1 al 9.
- Contenido por día: título, texto bíblico opcional, reflexión, oración, gesto/acción sugerida opcional e imagen opcional.
- Quiz/test simple por día o por Novena, con preguntas pastorales no calificadas.
- Termómetro espiritual interactivo con opciones de acompañamiento.
- Progreso personal por usuario: días completados, fecha de avance, respuesta del Termómetro y respuestas del Quiz si se decide persistirlas.
- Panel administrativo mínimo para crear, editar, activar/desactivar y ordenar Novenas.

No debe incluir en esta etapa:

- Biblioteca completa de documentos eclesiales.
- Ranking, puntajes, medallas o comparaciones espirituales.
- Notificaciones automáticas.
- Exportaciones.
- Moderación pública de respuestas.
- Compilación APK.

## Termómetro espiritual

La interfaz debe presentar la pregunta:

```text
¿Cómo viene tu camino hoy?
```

Opciones sugeridas:

- `necesito_pausa`: Necesito una pausa.
- `en_camino`: Sigo caminando.
- `con_animo`: Hoy camino con ánimo.
- `acompanando`: Hoy puedo acompañar a otros.

Reglas pastorales:

- No mostrar porcentajes de santidad.
- No usar rojo/verde como juicio moral.
- No hablar de aprobado/desaprobado.
- No mostrar rankings ni comparaciones.
- Mostrar devolución breve de acompañamiento, por ejemplo: `Gracias por registrar tu camino. Sigamos rezando juntos.`

## Modelo de datos sugerido

Crear tablas nuevas en una migración futura. No ejecutar SQL en esta issue.

### `formation_spirituality_resources`

Representa una Novena o futuro recurso espiritual.

Campos sugeridos:

- `id uuid primary key`
- `type text not null` con valor inicial `novena`
- `scope text not null` con valores `nacional` o `provincial`
- `province_id uuid null`
- `title text not null`
- `slug text not null`
- `description text null`
- `cover_image_url text null`
- `starts_on date null`
- `ends_on date null`
- `status text not null` con valores `borrador`, `activo`, `inactivo`, `archivado`
- `sort_order integer not null default 100`
- `visible_roles text[] null`
- `created_by uuid null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- `archived_at timestamptz null`

### `formation_novena_days`

Representa cada día de una Novena.

Campos sugeridos:

- `id uuid primary key`
- `resource_id uuid not null`
- `day_number integer not null` entre 1 y 9
- `title text not null`
- `biblical_text text null`
- `reflection text null`
- `prayer text not null`
- `action_prompt text null`
- `image_url text null`
- `quiz jsonb null`
- `sort_order integer not null default 100`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### `formation_novena_progress`

Representa el avance personal de cada usuario.

Campos sugeridos:

- `id uuid primary key`
- `user_id uuid not null`
- `resource_id uuid not null`
- `day_number integer not null`
- `completed_at timestamptz null`
- `thermometer_key text null`
- `quiz_answers jsonb null`
- `private_note text null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Restricción recomendada:

```sql
unique (user_id, resource_id, day_number)
```

## Nacional vs provincial

La distinción debe resolverse con `scope` y `province_id`:

- `scope = nacional` y `province_id = null`: visible para todas las provincias.
- `scope = provincial` y `province_id = X`: visible solo para usuarios de esa provincia, además de rangos nacionales y administrador.

Regla de conflicto:

- Si una Novena nacional y una provincial están activas, mostrar ambas, pero priorizar visualmente la provincial para usuarios de esa provincia.
- El administrador puede filtrar por `Todas`, `Nacional` o provincia específica.
- Rangos nacionales pueden crear o editar solo recursos nacionales, salvo decisión explícita posterior para permitir intervención provincial.

## Permisos iniciales

| Rango | Permiso recomendado |
| --- | --- |
| `administrador` | Crea, edita, archiva, activa/desactiva y ve todo. |
| `coordinador_nacional` | Gestiona recursos nacionales y ve recursos provinciales. |
| `vocal_nacional` con `subrole_key = formacion_espiritualidad` | Gestiona recursos nacionales y acompaña recursos provinciales de su área. |
| `vocal_nacional` sin ese subrol | Puede ver; no gestiona por defecto. |
| `coordinador_diocesano` | Gestiona recursos de su provincia. |
| `vocal` con `subrole_key = formacion_espiritualidad` | Gestiona recursos de su provincia. |
| `vocal` con otro subrol | Puede ver; no gestiona por defecto. |
| `asesor` | Puede ver. Cualquier permiso de revisión pastoral debe definirse en otra issue. |
| `animador_comunidad` / `coordinador_comunidad` | Puede ver y usar. No administra en primera versión. |
| `sedimentador` / `palestrista` | Puede ver y usar. |
| `invitado` | Sin acceso al módulo interno. |

Helper sugerido:

```ts
export function canManageFormationSpirituality(session: Session | null, province?: string | null) {
  if (!session) return false;
  if (session.role === 'administrador') return true;
  if (session.role === 'coordinador_nacional') return true;
  if (session.role === 'vocal_nacional') return session.subroleKey === 'formacion_espiritualidad';
  if (session.role === 'coordinador_diocesano') return province === session.province;
  if (session.role === 'vocal') return session.subroleKey === 'formacion_espiritualidad' && province === session.province;
  return false;
}
```

## Persistencia local vs remota

Debe persistirse en Supabase:

- Novenas.
- Días de Novena.
- Estado activo/inactivo/archivado.
- Alcance nacional/provincial.
- Progreso del usuario si se quiere continuidad entre dispositivos.
- Respuestas del Quiz si aportan valor pastoral o de continuidad.
- Respuesta del Termómetro si se usa para historial personal.

Puede quedar local:

- Estado visual del popup.
- Día seleccionado actualmente.
- Draft no guardado del Quiz.
- Preferencias temporales de UI.

Recomendación de privacidad:

- Persistir `thermometer_key`, no textos sensibles largos por defecto.
- Si se habilita `private_note`, debe quedar visible solo para el usuario y administrador técnico solo si hay una política explícita. Para primera versión, conviene no incluir notas privadas.

## Componentes y helpers sugeridos

Archivos frontend:

- `src/screens/FormationSpiritualityScreen.tsx`
- `src/screens/profile/FormationSpiritualityAdminPanel.tsx`
- `src/components/formation/NovenaList.tsx`
- `src/components/formation/NovenaDayCard.tsx`
- `src/components/formation/NovenaQuiz.tsx`
- `src/components/formation/SpiritualThermometer.tsx`

Helpers:

- `src/lib/formationSpirituality.ts`
- `src/lib/spiritualThermometer.ts`

Tipos:

- `FormationSpiritualityResourceRecord`
- `FormationNovenaDayRecord`
- `FormationNovenaProgressRecord`
- `FormationResourceScope`
- `SpiritualThermometerKey`

Módulo admin sugerido:

```ts
{ key: 'formacion_espiritualidad', label: 'Formación', icon: 'sparkles-outline' }
```

## Reutilización del sistema actual de contenidos

Se puede reutilizar:

- Editor de página para título/intro/imagen de la sección.
- `AppContentBlock` como portada o texto introductorio.
- Navegación dinámica para registrar el tab.
- `visible_roles` como control general de visibilidad.

No conviene usar solo `AppContentBlock` para la Novena porque:

- Se necesita progreso por usuario.
- Se necesita estructura día 1-9.
- Se necesita Quiz por día.
- Se necesita Termómetro espiritual.
- Se necesita distinguir nacional/provincial con RLS clara.

## Riesgos técnicos

- Duplicar el dominio con `proceso_educativo`: mitigación, crear módulo propio y reutilizar solo patrones.
- RLS provincial/nacional incompleta: mitigación, diseñar funciones RPC antes de pantalla.
- Subroles mal aplicados: mitigación, centralizar permisos en helper único y testear vocal nacional/diocesano.
- Persistir información espiritual sensible: mitigación, guardar claves simples y evitar notas privadas en primera versión.
- Notificaciones prematuras: mitigación, dejarlas fuera de primera versión.
- Crecimiento del admin panel: mitigación, crear archivo propio desde el inicio.
- Storage desordenado: mitigación, usar carpeta `formation-spirituality/` dentro del bucket elegido o bucket propio documentado.
- Contenido externo variable: mitigación, Novenas administrables en Supabase; no depender de scraping.

## Plan de implementación por issues

1. Navegación y feature flag:
   - Agregar tab `formacion_espiritualidad`.
   - Agregar módulo admin.
   - Agregar helper de acceso.
   - Sin pantalla funcional todavía.

2. Supabase schema y RLS:
   - Crear tablas propuestas.
   - Crear RPC de lectura por alcance.
   - Crear RPC de administración con validación de rango/subrango.
   - Agregar índices y constraints.

3. Pantalla de Novena read-only:
   - Listar Novenas activas.
   - Abrir detalle.
   - Mostrar días 1-9 sin progreso todavía.

4. Progreso personal:
   - Completar día.
   - Guardar avance remoto.
   - Restaurar progreso al abrir desde otro dispositivo.

5. Quiz y Termómetro espiritual:
   - Implementar Quiz no calificatorio.
   - Implementar Termómetro con copy pastoral.
   - Guardar solo claves/respuestas necesarias.

6. Panel administrativo:
   - Crear/editar Novena.
   - Crear/editar días.
   - Activar/desactivar/archivar.
   - Filtrar nacional/provincial según permisos.

7. QA y copy pastoral:
   - Revisar textos.
   - Revisar permisos por rango.
   - Revisar provincias.
   - Revisar celular y localhost.

8. Notificaciones opcionales:
   - Solo si se define una issue posterior.
   - Recordatorios locales o push deben tener consentimiento del usuario.

## Fuera de alcance para versiones futuras

- Biblioteca eclesial completa.
- Cursos por niveles.
- Certificados.
- Métricas pastorales agregadas.
- Recomendaciones automáticas.
- Moderación avanzada de respuestas personales.
- Sincronización offline compleja.
- Integración con calendario externo.
- Ranking, competencia o medición espiritual.

## Conclusión técnica

La app ya tiene piezas suficientes para construir este módulo sin volver a crear un archivo monolítico: navegación dinámica, configuración remota, permisos, subroles, admin panels, storage, notificaciones y materiales. La decisión segura es crear un módulo propio `formacion_espiritualidad`, reutilizar patrones existentes y agregar tablas nuevas para Novena/progreso cuando se implemente la fase de Supabase.

La primera versión debe ser deliberadamente pequeña: Novena activa, días 1-9, Quiz simple, Termómetro espiritual no evaluativo y progreso personal. Eso reduce riesgo técnico y evita que el módulo nazca mezclado con Proceso Educativo, Materiales o Evangelio.
