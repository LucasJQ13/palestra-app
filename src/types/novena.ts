/**
 * Novena Types
 *
 * Base model for interactive novenas within "Formación y espiritualidad" section.
 * Issue: #115
 *
 * This module defines TypeScript types for novenas with support for:
 * - National and provincial scope
 * - 9-day structure with daily prayers, reflections, and actions
 * - Quiz association
 * - Daily notification configuration
 * - Multiple statuses (draft, active, archived)
 */

import { Role } from './auth';

/**
 * Scope of a novena: national or provincial.
 * Used to determine visibility rules across users.
 */
export type NovenaScope = 'nacional' | 'provincial';

/**
 * Status of a novena: draft, active, or archived.
 * - draft: not published, editing in progress
 * - activa: published and visible to users
 * - archivada: no longer visible, historical
 */
export type NovenaStatus = 'borrador' | 'activa' | 'archivada';

/**
 * Configuration for a daily action within a novena day.
 */
export type NovenaActionConfig = {
  label: string;           // "Acción concreta del día"
  description?: string;    // Details about the action
};

/**
 * Configuration for quiz associated with a novena.
 * Can have one quiz per novena or per day.
 */
export type NovenaQuizConfig = {
  enabled: boolean;
  quizId?: string | null;  // Reference to quiz entity (to be defined separately)
  mode?: 'por_novena' | 'por_dia';  // Quiz per entire novena or per day
};

/**
 * Configuration for daily notifications.
 */
export type NovenaNotificationConfig = {
  enabled: boolean;
  suggestedTime?: string;  // HH:mm format, e.g. "09:00"
  timeZone?: string;       // IANA timezone, e.g. "America/Argentina/Buenos_Aires"
};

/**
 * Participation tracking for a novena.
 * Tracks user engagement: "Ya recé este día" button.
 */
export type NovenaParticipationConfig = {
  enabled: boolean;
  buttonLabel?: string;    // Custom label for participation button
};

/**
 * Daily content within a novena.
 * Each novena has 9 days with the same structure.
 */
export type NovenaDay = {
  dayNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  title: string;              // Day title, e.g. "Día 1"
  prayer: string;             // Prayer text
  reflection: string;         // Brief reflection
  intention: string;          // Daily intention
  action: NovenaActionConfig; // Concrete action for the day
};

/**
 * Remote representation of a novena row from Supabase.
 * Snake_case field names match database schema.
 */
export type RemoteNovenaRow = {
  id: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  scope: NovenaScope;
  province_id?: string | null;
  province_name?: string | null;
  status: NovenaStatus;
  starts_at: string;  // ISO date or timestamp
  ends_at: string;    // ISO date or timestamp
  days: NovenaDay[];  // Array of 9 days
  quiz_config?: NovenaQuizConfig | null;
  notification_config?: NovenaNotificationConfig | null;
  participation_config?: NovenaParticipationConfig | null;
  visible_roles?: string[] | null;  // Roles that can see this novena
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  archived_at?: string | null;
};

/**
 * Application representation of a novena.
 * Normalized camelCase field names for frontend use.
 */
export type AppNovena = {
  id: string;
  title: string;
  description?: string | null;
  bannerUrl?: string | null;
  scope: NovenaScope;
  provinceName?: string | null;
  provinceId?: string | null;
  status: NovenaStatus;
  startsAt: string;
  endsAt: string;
  days: NovenaDay[];
  quizConfig?: NovenaQuizConfig | null;
  notificationConfig?: NovenaNotificationConfig | null;
  participationConfig?: NovenaParticipationConfig | null;
  visibleRoles?: Role[] | null;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  archivedAt?: string | null;
};

/**
 * Draft representation for novena creation/editing.
 * All fields optional for partial updates.
 */
export type NovenaDraft = {
  id?: string | null;
  title: string;
  description?: string | null;
  bannerUrl?: string | null;
  scope: NovenaScope;
  provinceName?: string | null;
  provinceId?: string | null;
  status?: NovenaStatus;
  startsAt?: string;
  endsAt?: string;
  days: NovenaDay[];
  suggestedPrayerTime?: string;  // HH:mm
  quizEnabled?: boolean;
  quizId?: string | null;
  notificationEnabled?: boolean;
  participationEnabled?: boolean;
  visibleRoles?: Role[] | null;
  isActive?: boolean;
};

/**
 * Scope rules for novena visibility.
 *
 * Rules:
 * - If active provincial novena exists for user's province, show it.
 * - If not, show active national novena if it exists.
 * - Only one active novena per scope without conflict resolution.
 *
 * Persistence strategy (Issue #115):
 * - To be determined: Supabase migration vs. remote config vs. local temp structure.
 */
export const NOVENA_SCOPE_RULES = {
  PROVINCIAL_PRIORITY: true,  // Provincial novenas override national
  MAX_ACTIVE_PER_SCOPE: 1,    // Only one active novena per scope
} as const;

/**
 * Novena fetch options for filtering and visibility.
 */
export type FetchNovenasOptions = {
  includeInactive?: boolean;
  includeArchived?: boolean;
  scope?: NovenaScope;
  provinceName?: string;
  onlyActive?: boolean;
};

/**
 * Response type for novena operations.
 * Consistent with backend response patterns.
 */
export type NovenaOperationResult = {
  data: AppNovena | null;
  error: { message: string } | null;
};
