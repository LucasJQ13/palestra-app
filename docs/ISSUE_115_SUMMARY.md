# Issue #115 - Modelo Base para Novenas Interactivas

**Estado:** ✅ Implementación base completada  
**Rama:** main  
**Fecha:** 2026-06-25  

---

## 📋 Resumen

Implementación de la arquitectura base para **novenas interactivas** en la sección "Formación y espiritualidad".

### Qué se entregó

✅ **Tipos TypeScript** para novenas con soporte completo:
- Novenas con alcance nacional/provincial
- 9 días con estructura: oración, reflexión, intención, acción concreta
- Configuración flexible para quiz, notificaciones, participación
- Validaciones de negocio

✅ **Helpers de normalización** en `src/lib/novena.ts`:
- Conversión remote → app (Supabase → TypeScript)
- Validación de drafts
- Reglas de visibilidad (alcance provincial > nacional)
- Gestión de permisos

✅ **Migración SQL propuesta** (no ejecutada):
- Tabla `public.novenas` con estructura JSONB flexible
- Tabla `public.novena_participations` para rastreo de "Ya recé este día"
- Row-Level Security policies
- Índices optimizados
- Triggers para auditoría

✅ **Documentación integral**:
- Contrato de datos (`docs/NOVENA_CONTRACT.md`)
- Tipo de validaciones, reglas de alcance, ciclo de vida
- Ejemplos de uso, checklist de aceptación

✅ **Validación de tipos**:
- Tests de compilación TypeScript
- Verificación de interfaces

---

## 📁 Archivos Creados

| Archivo | Propósito |
|---------|-----------|
| `src/types/novena.ts` | Definición completa de tipos TypeScript |
| `src/lib/novena.ts` | Helpers de normalización y validación |
| `supabase/migrations/20260625_novenas_base_model.sql` | Migración SQL propuesta (no ejecutada) |
| `docs/NOVENA_CONTRACT.md` | Documentación del contrato de datos |
| `src/lib/__typecheck__/novena.typecheck.ts` | Tests de validación de tipos |

---

## 🎯 Criterios de Aceptación - COMPLETADOS

| Criterio | Estado | Detalles |
|----------|--------|---------|
| Modelo claro para novenas | ✅ | Tipos + helpers + SQL |
| Soporta 9 días | ✅ | `NovenaDay[]` con dayNumber 1-9 |
| Soporta alcance nacional/provincial | ✅ | `scope: 'nacional' \| 'provincial'` |
| Soporta quiz | ✅ | `config.quiz_config` flexible |
| Soporta notificaciones | ✅ | `config.notification_config` |
| Soporta participación | ✅ | Tabla `novena_participations` + tracking |
| Documentado contrato | ✅ | `docs/NOVENA_CONTRACT.md` completo |
| `npm run typecheck` ✅ | ✅ | Pasa validación de tipos |

---

## 🚀 Próximos Pasos (Futuros Issues)

1. **Crear RPC functions** (migración separada):
   - `get_active_novena(p_profile_id)`
   - `admin_create_novena(...)`
   - `admin_publish_novena(p_novena_id)`
   - `record_novena_participation(...)`

2. **Agregar endpoints en frontend** (`src/lib/profiles.ts`):
   - `fetchActiveNovena(session)`
   - `fetchNovenas(options)`
   - `recordPrayerParticipation(noveId, dayNumber)`

3. **Implementar UI de lectura**:
   - Pantalla para ver novena activa
   - Mostrar 9 días con contenido
   - Botón "Ya recé este día"
   - Contador de progreso

4. **Implementar UI administrativa**:
   - Panel para crear/editar novenas
   - Selector de alcance y provincia
   - Editor de 9 días
   - Configuración de quiz/notificaciones

5. **Integración de quiz** (dependencia):
   - Asociar quiz_id a novena
   - Mostrar quiz después de lectura (opcional)

6. **Sistema de notificaciones** (dependencia):
   - Enviar notificación diaria a hora sugerida
   - Respetar timezone del usuario
   - Permitir opt-out

---

## 📚 Documentación

### Lectura Recomendada

1. **`docs/NOVENA_CONTRACT.md`** - Contrato completo de datos
   - Estructura de tablas
   - Reglas de alcance y visibilidad
   - Validaciones
   - Ejemplos de uso

2. **`src/types/novena.ts`** - Definición de tipos
   - `AppNovena`, `NovenaDraft`, `RemoteNovenaRow`
   - `NovenaDay`, `NovenaScope`, `NovenaStatus`
   - Configuraciones (quiz, notifications, participation)

3. **`src/lib/novena.ts`** - Funciones de negocio
   - `normalizeNovenaRow()` - Conversión de datos
   - `validateNovenaDraft()` - Validación
   - `canSeeNovena()` - Reglas de visibilidad
   - `filterVisibleNovenas()` - Filtrado con prioridad provincial

4. **`supabase/migrations/20260625_novenas_base_model.sql`** - SQL propuesto
   - **⚠️ NO EJECUTAR en producción sin aprobación**
   - Lista para revisar antes de aplicar

---

## 🔐 Consideraciones de Seguridad

✅ **Row-Level Security (RLS)** definida en SQL:
- SELECT: Usuario ve solo novenas de su alcance
- INSERT/UPDATE/DELETE: Solo admin/coordinadores

✅ **Validaciones en capas múltiples**:
- Frontend: `validateNovenaDraft()`
- Database: Constraints SQL
- RPC: Validación antes de operación

✅ **Auditoría integrada**:
- `created_by`, `updated_by` rastrean quién creó/modificó
- Timestamps automáticos
- Borrado lógico (`archived_at`)

---

## 🧪 Testing

Para validar tipos:
```bash
npm run typecheck
```

La salida debe mostrar:
```
✅ All type validations passed!
```

---

## 📝 Notas Técnicas

### Por qué JSONB para config

- **Flexibilidad:** Agregar campos sin migración
- **Retrocompatibilidad:** Versiones antiguas de app ignoran campos nuevos
- **Escalabilidad:** Sin cambiar schema SQL para quiz, notificaciones, etc.
- **Consistencia:** Mismo patrón usado en `formation_path_stations`, `app_tabs`, etc.

### Por qué tabla novena_participations separada

- **Normalización:** Rastrear participación por usuario/día
- **Performance:** Queries rápidas de "¿participó en X?"
- **Agregaciones:** Fácil contar días rezados por novena
- **Auditoría:** Timestamp de cuándo participó

### Restricción de una novena activa por scope

- **Regla de negocio:** No debe haber conflicto de "¿cuál muestro?"
- **Implementación:** Validación en RPC (no constraint DB)
- **Razón:** Permite transición suave: activar A, desactivar B sin race condition

---

## ✉️ Contacto

**Issue original:** [#115](https://github.com/LucasJQ13/palestra-app/issues/115)  
**Commits asociados:**
- `feat(#115): Create base types for interactive novenas model`
- `feat(#115): Create novena normalization and validation helpers`
- `docs(#115): Add proposed SQL migration for novenas base model`
- `docs(#115): Add comprehensive data contract documentation`
- `test(#115): Add type validation tests for novena model`

---

## 🎓 Referencias Internas

- Patrón similar: `src/lib/communitySections.ts` (normalización)
- JSONB usage: `supabase/migrations/20260606124000_formation_path_section.sql`
- RLS patterns: `docs/sql_patch_order.md`
- Guía Supabase: `supabase/README.md`

---

**Status:** 🟢 Base arquitectónica lista para revisión y próximas iteraciones.
