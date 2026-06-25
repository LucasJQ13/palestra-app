## Contrato de Datos - Novenas Interactivas

**Issue:** #115  
**Componente:** Formación y espiritualidad  
**Creado:** 2026-06-25  
**Estado:** Propuesta de arquitectura base  

---

## 1. Entidades Principales

### 1.1 Novena (public.novenas)

Entidad raíz que representa una novena interactiva de 9 días.

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | No | Identificador único (PK) |
| `title` | text | No | Título de la novena, ej. "Novena a San José" |
| `description` | text | Sí | Descripción breve, propósito, contexto |
| `banner_url` | text | Sí | URL a imagen/banner de la novena |
| `scope` | enum ('nacional' \| 'provincial') | No | Alcance geográfico |
| `province_id` | UUID FK | Sí | Referencia a provincia (obligatoria si scope='provincial') |
| `status` | enum ('borrador' \| 'activa' \| 'archivada') | No | Ciclo de vida |
| `starts_at` | date | No | Fecha de inicio de la novena |
| `ends_at` | date | No | Fecha de fin (validación: `ends_at > starts_at`) |
| `is_active` | boolean | No | Flag de publicación (debe ser true para ser visible) |
| `config` | JSONB | No | Configuración unificada (ver sección 2) |
| `visible_roles` | text[] | Sí | Roles permitidos (NULL = sin restricción de rol) |
| `created_at` | timestamptz | No | Timestamp de creación |
| `updated_at` | timestamptz | No | Timestamp de última modificación (auto-actualizado) |
| `archived_at` | timestamptz | Sí | Timestamp de archivado (NULL = no archivada) |
| `created_by` | UUID FK | Sí | Perfil que creó |
| `updated_by` | UUID FK | Sí | Perfil que actualizó |

**Índices:**
- `novenas_scope_active_idx`: (scope, is_active, archived_at) para queries por alcance
- `novenas_province_active_idx`: (province_id, is_active, archived_at) para novenas provinciales
- `novenas_status_idx`: (status) para filtrado administrativo
- `novenas_created_at_idx`: (created_at desc) para ordenamientos cronológicos

**Validaciones:**
- Una novena **no puede tener dos instancias activas del mismo scope sin resolución de prioridad**
- Si scope='provincial', province_id **debe estar definido**
- Si scope='nacional', province_id **debe ser NULL**
- `starts_at` **siempre anterior a** `ends_at`

---

### 1.2 NovenaDay (dentro de config.days)

Estructura dentro del campo JSONB `config.days` (array de 9 elementos).

```typescript
{
  dayNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,  // Día 1 al 9
  title: string,                // "Día 1", "Día de reflexión", etc.
  prayer: string,               // Oración del día (contenido)
  reflection: string,           // Reflexión breve
  intention: string,            // Intención del día
  action: {
    label: string,             // "Acción concreta del día"
    description?: string       // Detalles de la acción
  }
}
```

**Validaciones:**
- Array **debe contener exactamente 9 elementos**
- `dayNumber` **debe ser único y cobertura 1-9**
- Todos los campos **obligatorios excepto** `action.description`

---

### 1.3 NovenaParticipation (public.novena_participations)

Rastreo de participación de usuarios en novenas.  
Registra "Ya recé este día" por usuario/día.

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | No | Identificador único (PK) |
| `novena_id` | UUID FK | No | Referencia a novena |
| `profile_id` | UUID FK | No | Referencia a perfil/usuario |
| `day_number` | smallint | No | Día de la novena (1-9) |
| `participated_at` | timestamptz | No | Cuándo participó (creado automáticamente) |

**Restricciones:**
- Clave única: `(novena_id, profile_id, day_number)` - Un usuario marca un día **solo una vez**
- `day_number` validado: `>= 1 AND <= 9`

**Índices:**
- `novena_participations_novena_idx`: (novena_id)
- `novena_participations_profile_idx`: (profile_id)
- `novena_participations_day_idx`: (day_number)
- `novena_participations_participated_at_idx`: (participated_at desc)

---

## 2. Estructura JSONB: config

Campo unificado `novenas.config` que contiene toda la configuración flexible.

```json
{
  "days": [
    {
      "dayNumber": 1,
      "title": "Día 1",
      "prayer": "...",
      "reflection": "...",
      "intention": "...",
      "action": { "label": "...", "description": "..." }
    },
    // ... 8 días más (9 total)
  ],
  "quiz_config": {
    "enabled": false,
    "quiz_id": null,
    "mode": "por_novena"  // "por_novena" | "por_dia"
  },
  "notification_config": {
    "enabled": true,
    "suggested_time": "09:00",
    "time_zone": "America/Argentina/Buenos_Aires"
  },
  "participation_config": {
    "enabled": true,
    "button_label": "Ya recé este día"
  }
}
```

**Ventajas:**
- Flexibilidad para agregar campos sin migración
- Retrocompatibilidad: nuevas versiones de app ignoran campos desconocidos
- Respeta el enfoque de `remoteData.ts` (ver `contentBlocks`, etc.)

---

## 3. Reglas de Alcance y Visibilidad

### 3.1 Alcance Nacional vs Provincial

| Scope | Visible a | Regla |
|-------|-----------|-------|
| `nacional` | Todos los usuarios | Si `is_active=true` y `archived_at=null` |
| `provincial` | Usuarios de esa provincia | Si `is_active=true`, `archived_at=null`, y `province_id` coincide |

### 3.2 Prioridad (Scope Rules)

1. Si existe novena **provincial activa** → usuario ve la de su provincia
2. Si **no existe provincial activa** → usuario ve novena nacional activa (si existe)
3. **No debe haber** más de una novena activa del mismo alcance sin resolución manual

**Implementación en frontend:**
- `filterVisibleNovenas()` en `src/lib/novena.ts` aplica estas reglas
- `canSeeNovena()` valida acceso individual

### 3.3 Restricción por Rol

Campo `visible_roles`:
- **NULL o []** → sin restricción de rol (todos ven si tienen alcance)
- **['sedimentador', 'palestrista']** → solo esos roles ven
- Restricción **adicional** a las reglas de alcance

---

## 4. Ciclo de Vida (Status)

| Status | Descripción | Visible | Editable |
|--------|-------------|---------|----------|
| `borrador` | Creada, no publicada | Solo admin | Sí |
| `activa` | Publicada y en vigencia | Según alcance | Solo admin/coordinador |
| `archivada` | Finalizada o descontinuada | No (salvo admin) | No |

**Transiciones válidas:**
- `borrador` → `activa` (publicar)
- `activa` → `archivada` (archivar / finalizar)
- `borrador` → `archivada` (descartar borrador)
- Las transiciones se manejan en RPC, no directamente en columnas

---

## 5. Persistencia y Estrategia de Datos

### 5.1 Opción Seleccionada: Supabase con Migración

- **Tabla en Supabase** con estructura SQL (no temporal)
- **JSONB para config** (flexible para future extensions)
- **RLS policies** para acceso basado en roles
- **Migración versionada** en `supabase/migrations/`

### 5.2 Ventajas

✅ Persistencia segura  
✅ Consultas relacionales (alcance, provincia, estado)  
✅ Row-Level Security integrada  
✅ Auditoría: `created_by`, `updated_by`, timestamps  
✅ Soporte para participaciones de usuarios  
✅ Escalabilidad: índices optimizados  

---

## 6. Contratos RPC (Futuros)

Estos RPCs se implementarán en migraciones posteriores:

### 6.1 Lectura

```sql
get_active_novena(p_profile_id UUID)
  → AppNovena | null
  -- Retorna la novena activa visible para el usuario (con prioridad provincial)

get_novenas(p_include_inactive BOOLEAN, p_scope TEXT)
  → AppNovena[]
  -- Lista novenas con filtros (admin)

get_novena_days(p_novena_id UUID, p_day_number INT)
  → NovenaDay | null
  -- Detalle de un día específico

get_novena_participation_status(p_novena_id UUID, p_profile_id UUID)
  → { days_prayed: INT[], days_pending: INT[] }
  -- Estado de participación del usuario en novena
```

### 6.2 Escritura

```sql
admin_create_novena(p_title, p_description, p_scope, p_province_id, p_config JSONB)
  → novena_id UUID

admin_update_novena(p_novena_id, p_title, p_description, p_config JSONB, p_status)
  → boolean

admin_publish_novena(p_novena_id UUID)
  → boolean
  -- Valida que no haya conflicto de alcance antes de activar

admin_archive_novena(p_novena_id UUID)
  → boolean

record_novena_participation(p_novena_id UUID, p_profile_id UUID, p_day_number INT)
  → boolean
  -- Registra "Ya recé este día"
```

---

## 7. Validaciones

### 7.1 Frontend (src/lib/novena.ts)

- `validateNovenaDraft()`: valida estructura de draft antes de RPC
- `isValidNovenaDays()`: verifica 9 días, dayNumber 1-9, campos requeridos
- `canManageNovenas()`: check de permisos (admin, coordinador_nacional)

### 7.2 Database (Constraints SQL)

- `novena_dates_valid`: `ends_at > starts_at`
- `scope IN ('nacional', 'provincial')`
- `status IN ('borrador', 'activa', 'archivada')`
- `day_number >= 1 AND <= 9`
- Unique: `(novena_id, profile_id, day_number)` en participations
- FK: referencial integrity on delete

---

## 8. Ejemplos de Uso

### 8.1 Crear novena (draft)

```typescript
// Frontend
const draft = createEmptyNovenaDraft();
draft.title = "Novena a la Virgen María";
draft.scope = "nacional";
draft.days[0].prayer = "Ave María...";
// ... completar 9 días

const error = validateNovenaDraft(draft);
if (error) throw error;

const payload = draftToPayload(draft);
const result = await supabase.rpc('admin_create_novena', payload);
```

### 8.2 Obtener novena activa para usuario

```typescript
// Frontend
const session = getCurrentSession();
const allNovenas = await fetchNovenas();
const active = findActiveNovena(allNovenas, session);
// → retorna novena provincial si existe, sino nacional
```

### 8.3 Registrar participación

```typescript
// Frontend
await supabase.rpc('record_novena_participation', {
  p_novena_id: noveId,
  p_profile_id: session.id,
  p_day_number: 3  // Día 3
});
```

---

## 9. Notas de Implementación

### 9.1 Versión Actual

- **Modelo definido en TypeScript** (`src/types/novena.ts`)
- **Helpers de normalización** (`src/lib/novena.ts`)
- **Migración SQL propuesta** (no ejecutada en producción)
- **RLS policies incluidas** (listas para aplicar)
- **Sin UI pública aún** (scope permitido: modelo + helpers)

### 9.2 Próximos Pasos

1. ✅ Revisar tipos y helpers con el equipo
2. ⏳ Definir timestamp format para notificaciones (ISO 8601, timezone)
3. ⏳ Crear RPC en migración separada (con tests)
4. ⏳ Agregar endpoints de fetch en `src/lib/profiles.ts`
5. ⏳ Implementar UI en screens (Future Issue)
6. ⏳ Configurar quiz association (Future Issue)
7. ⏳ Configurar notificaciones diarias (Future Issue)

### 9.3 Consideraciones

- **JSONB vs Columnas:** JSONB elegido para flexibility sin romper migración anterior
- **Auditoría:** `created_by`, `updated_by`, `created_at`, `updated_at` permiten rastrear cambios
- **Borrado lógico:** `archived_at` instead de DELETE (preserva datos históricos)
- **Timezone:** Stored in config per-novena, app responsable de conversión a usuario

---

## 10. Checklist de Aceptación (Issue #115)

- ✅ Existe modelo claro para novenas (tipos + helpers)
- ✅ Soporta 9 días con estructura definida
- ✅ Soporta alcance nacional/provincial
- ✅ Preparada para quiz (config.quiz_config)
- ✅ Preparada para notificaciones (config.notification_config)
- ✅ Preparada para participación (tabla + tracking)
- ✅ Documentado contrato de datos (este archivo)
- ✅ `npm run typecheck` sin errores
- ⏳ SQL migración listo, no ejecutado en producción

---

## Referencias

- Issue: [#115 - Formación y espiritualidad - Crear modelo base para novenas interactivas](https://github.com/LucasJQ13/palestra-app/issues/115)
- Tipos: `src/types/novena.ts`
- Helpers: `src/lib/novena.ts`
- SQL Propuesto: `supabase/migrations/20260625_novenas_base_model.sql`
- Guía Supabase: `supabase/README.md`
