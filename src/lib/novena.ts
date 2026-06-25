/**
 * Novena Helpers
 *
 * Normalization, conversion, and utility functions for novenas.
 * Issue: #115
 *
 * Provides:
 * - Remote row to app type conversion
 * - Draft to database payload conversion
 * - Scope visibility rules
 * - Validation helpers
 */

import { AppNovena, FetchNovenasOptions, NovenaDraft, NovenaDay, NovenaOperationResult, NovenaStatus, RemoteNovenaRow } from '../types/novena';
import { Session } from '../types/auth';

/**
 * Normalize a remote novena row from Supabase to app representation.
 * Converts snake_case to camelCase and applies type conversions.
 */
export function normalizeNovenaRow(row: RemoteNovenaRow): AppNovena {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    bannerUrl: row.banner_url ?? null,
    scope: row.scope,
    provinceName: row.province_name ?? null,
    provinceId: row.province_id ?? null,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    days: row.days ?? [],
    quizConfig: row.quiz_config ?? null,
    notificationConfig: row.notification_config ?? null,
    participationConfig: row.participation_config ?? null,
    visibleRoles: (row.visible_roles ?? []) as any[],
    isActive: row.is_active,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    archivedAt: row.archived_at ?? null,
  };
}

/**
 * Normalize novena rows from remote data.
 */
export function normalizeNovenaRows(rows: RemoteNovenaRow[]): AppNovena[] {
  return rows.map(normalizeNovenaRow);
}

/**
 * Convert draft to database insert/update payload.
 * Converts camelCase to snake_case for Supabase RPC calls.
 */
export function draftToPayload(draft: NovenaDraft) {
  return {
    p_id: draft.id ?? null,
    p_title: draft.title,
    p_description: draft.description ?? null,
    p_banner_url: draft.bannerUrl ?? null,
    p_scope: draft.scope,
    p_province_id: draft.provinceId ?? null,
    p_status: draft.status ?? 'borrador',
    p_starts_at: draft.startsAt ?? new Date().toISOString(),
    p_ends_at: draft.endsAt ?? new Date().toISOString(),
    p_days: draft.days ?? [],
    p_quiz_enabled: draft.quizEnabled ?? false,
    p_quiz_id: draft.quizId ?? null,
    p_notification_enabled: draft.notificationEnabled ?? false,
    p_suggested_prayer_time: draft.suggestedPrayerTime ?? '09:00',
    p_participation_enabled: draft.participationEnabled ?? true,
    p_visible_roles: draft.visibleRoles ?? [],
    p_is_active: draft.isActive ?? false,
  };
}

/**
 * Check if a user can see a novena based on scope and province.
 *
 * Rules:
 * - All users see national novenas (if they have permission)
 * - Users see provincial novenas matching their province
 * - Visibility can be further restricted by role
 */
export function canSeeNovena(session: Session | null, novena: AppNovena): boolean {
  if (!novena.isActive) {
    return false;
  }

  // Check provincial scope
  if (novena.scope === 'provincial') {
    const userProvince = session?.province ?? null;
    if (!userProvince || userProvince !== novena.provinceName) {
      return false;
    }
  }

  // Check role visibility
  if (novena.visibleRoles && novena.visibleRoles.length > 0) {
    const userRole = session?.role ?? 'invitado';
    if (!novena.visibleRoles.includes(userRole)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if user can manage novenas (admin or specific role).
 * Should be tied to permission system.
 */
export function canManageNovenas(session: Session | null): boolean {
  if (!session) {
    return false;
  }
  // Permissions to be defined in auth.ts
  // For now: admin, coordinador_nacional, vocal_nacional
  const managerRoles = ['administrador', 'coordinador_nacional', 'vocal_nacional'];
  return managerRoles.includes(session.role);
}

/**
 * Check if user can manage novenas for their province.
 */
export function canManageProvinceNovenas(session: Session | null): boolean {
  if (!session) {
    return false;
  }
  // Provincial coordinators, diocesan coordinators, advisors
  const roles = ['coordinador_diocesano', 'asesor', 'vocal'];
  return roles.includes(session.role);
}

/**
 * Determine which novenas should be visible given a session.
 * Applies scope priority rules.
 *
 * Rules:
 * - Provincial novenas have priority over national
 * - User sees max one novena: either their provincial or national
 */
export function filterVisibleNovenas(novenas: AppNovena[], session: Session | null): AppNovena[] {
  const visible = novenas.filter((novena) => canSeeNovena(session, novena));

  if (visible.length === 0) {
    return [];
  }

  const userProvince = session?.province ?? null;

  // Separate by scope
  const provincial = visible.filter((n) => n.scope === 'provincial' && n.provinceName === userProvince);
  const national = visible.filter((n) => n.scope === 'nacional');

  // Provincial has priority if available
  if (provincial.length > 0) {
    return provincial;
  }

  return national;
}

/**
 * Find the active novena for a user.
 * Returns at most one novena (provincial priority).
 */
export function findActiveNovena(novenas: AppNovena[], session: Session | null): AppNovena | null {
  const visible = filterVisibleNovenas(novenas, session);
  return visible.length > 0 ? visible[0] : null;
}

/**
 * Validate novena days structure.
 * Ensures all 9 days are present and properly structured.
 */
export function isValidNovenaDays(days: NovenaDay[] | undefined): boolean {
  if (!days || !Array.isArray(days)) {
    return false;
  }
  if (days.length !== 9) {
    return false;
  }
  // Check all day numbers 1-9 present
  const dayNumbers = new Set(days.map((d) => d.dayNumber));
  if (dayNumbers.size !== 9) {
    return false;
  }
  // Verify each day has required fields
  return days.every((day) => {
    return (
      day.dayNumber >= 1 &&
      day.dayNumber <= 9 &&
      day.title &&
      day.prayer &&
      day.reflection &&
      day.intention &&
      day.action
    );
  });
}

/**
 * Validate draft before persistence.
 * Returns error message if invalid, null if valid.
 */
export function validateNovenaDraft(draft: NovenaDraft): string | null {
  if (!draft.title || draft.title.trim().length === 0) {
    return 'El título de la novena es obligatorio.';
  }

  if (!isValidNovenaDays(draft.days)) {
    return 'La novena debe contener exactamente 9 días con todos los campos requeridos.';
  }

  if (!draft.startsAt || !draft.endsAt) {
    return 'Las fechas de inicio y fin son obligatorias.';
  }

  try {
    const start = new Date(draft.startsAt);
    const end = new Date(draft.endsAt);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Las fechas no tienen un formato válido.';
    }
    if (start >= end) {
      return 'La fecha de inicio debe ser anterior a la de fin.';
    }
  } catch {
    return 'Error al validar las fechas.';
  }

  if (draft.scope === 'provincial' && !draft.provinceId) {
    return 'Debe seleccionar una provincia para una novena provincial.';
  }

  return null;
}

/**
 * Create an empty novena draft template.
 * Initializes structure for a new novena.
 */
export function createEmptyNovenaDraft(): NovenaDraft {
  return {
    title: '',
    description: '',
    bannerUrl: '',
    scope: 'nacional',
    provinceId: null,
    provinceName: null,
    status: 'borrador',
    startsAt: new Date().toISOString().split('T')[0],
    endsAt: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    days: Array.from({ length: 9 }, (_, i) => ({
      dayNumber: (i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
      title: `Día ${i + 1}`,
      prayer: '',
      reflection: '',
      intention: '',
      action: { label: '', description: '' },
    })),
    suggestedPrayerTime: '09:00',
    quizEnabled: false,
    notificationEnabled: true,
    participationEnabled: true,
    visibleRoles: [],
    isActive: false,
  };
}

/**
 * Convert app novena back to draft for editing.
 */
export function novenatoDraft(novena: AppNovena): NovenaDraft {
  return {
    id: novena.id,
    title: novena.title,
    description: novena.description ?? '',
    bannerUrl: novena.bannerUrl ?? '',
    scope: novena.scope,
    provinceId: novena.provinceId ?? null,
    provinceName: novena.provinceName ?? null,
    status: novena.status,
    startsAt: novena.startsAt,
    endsAt: novena.endsAt,
    days: novena.days,
    suggestedPrayerTime: novena.notificationConfig?.suggestedTime ?? '09:00',
    quizEnabled: novena.quizConfig?.enabled ?? false,
    quizId: novena.quizConfig?.quizId ?? null,
    notificationEnabled: novena.notificationConfig?.enabled ?? false,
    participationEnabled: novena.participationConfig?.enabled ?? true,
    visibleRoles: novena.visibleRoles ?? [],
    isActive: novena.isActive,
  };
}

/**
 * Format novena date range in Spanish.
 * Example: "del 1 de junio al 9 de junio del 2026"
 */
export function formatNovenaDateRange(startsAt: string, endsAt: string): string {
  try {
    const start = new Date(`${startsAt}T00:00:00`);
    const end = new Date(`${endsAt}T00:00:00`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Fechas a confirmar';
    }

    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const startDay = start.getDate();
    const startMonth = months[start.getMonth()];
    const startYear = start.getFullYear();

    const endDay = end.getDate();
    const endMonth = months[end.getMonth()];
    const endYear = end.getFullYear();

    if (start.toDateString() === end.toDateString()) {
      return `${startDay} de ${startMonth} del ${startYear}`;
    }

    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `del ${startDay} al ${endDay} de ${startMonth} del ${startYear}`;
    }

    if (start.getFullYear() === end.getFullYear()) {
      return `del ${startDay} de ${startMonth} al ${endDay} de ${endMonth} del ${startYear}`;
    }

    return `del ${startDay} de ${startMonth} del ${startYear} al ${endDay} de ${endMonth} del ${endYear}`;
  } catch {
    return 'Fechas a confirmar';
  }
}

/**
 * Create a success operation result.
 */
export function successNovenaOperation(novena: AppNovena): NovenaOperationResult {
  return { data: novena, error: null };
}

/**
 * Create an error operation result.
 */
export function errorNovenaOperation(message: string): NovenaOperationResult {
  return { data: null, error: { message } };
}
