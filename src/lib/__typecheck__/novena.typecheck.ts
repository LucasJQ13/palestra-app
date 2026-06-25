/**
 * Type Validation Test
 *
 * Verifies that novena types compile without errors.
 * This file is excluded from bundling and only runs during typecheck.
 *
 * Run: npm run typecheck
 */

import {
  AppNovena,
  NovenaDay,
  NovenaDraft,
  NovenaScope,
  NovenaStatus,
  RemoteNovenaRow,
  FetchNovenasOptions,
  NovenaOperationResult,
  NOVENA_SCOPE_RULES,
} from '../types/novena';

import {
  normalizeNovenaRow,
  normalizeNovenaRows,
  draftToPayload,
  canSeeNovena,
  canManageNovenas,
  canManageProvinceNovenas,
  filterVisibleNovenas,
  findActiveNovena,
  isValidNovenaDays,
  validateNovenaDraft,
  createEmptyNovenaDraft,
  novenatoDraft,
  formatNovenaDateRange,
  successNovenaOperation,
  errorNovenaOperation,
} from '../lib/novena';

import { Session } from '../types/auth';

// ============================================================================
// Type Tests
// ============================================================================

// Test: RemoteNovenaRow can be normalized
const mockRemoteRow: RemoteNovenaRow = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Test Novena',
  description: 'Test description',
  banner_url: 'https://example.com/banner.jpg',
  scope: 'nacional',
  province_id: undefined,
  province_name: undefined,
  status: 'borrador',
  starts_at: '2026-07-01',
  ends_at: '2026-07-09',
  days: Array.from({ length: 9 }, (_, i) => ({
    dayNumber: (i + 1) as any,
    title: `Día ${i + 1}`,
    prayer: 'Prayer text',
    reflection: 'Reflection text',
    intention: 'Intention text',
    action: { label: 'Action', description: 'Action description' },
  })),
  quiz_config: { enabled: false },
  notification_config: { enabled: true, suggested_time: '09:00' },
  participation_config: { enabled: true },
  visible_roles: ['palestrista', 'sedimentador'],
  is_active: true,
  created_at: '2026-06-25T00:00:00Z',
  updated_at: '2026-06-25T00:00:00Z',
  archived_at: null,
};

const appNovena: AppNovena = normalizeNovenaRow(mockRemoteRow);
console.log('✓ normalizeNovenaRow compiles');

// Test: Multiple rows normalization
const appNovenas: AppNovena[] = normalizeNovenaRows([mockRemoteRow]);
console.log('✓ normalizeNovenaRows compiles');

// Test: Draft creation and validation
const draft: NovenaDraft = createEmptyNovenaDraft();
const validationError: string | null = validateNovenaDraft(draft);
console.log('✓ createEmptyNovenaDraft and validateNovenaDraft compile');

// Test: Draft to payload conversion
const payload = draftToPayload(draft);
console.log('✓ draftToPayload compiles');

// Test: Novena to draft conversion
const draftFromNovena: NovenaDraft = novenatoDraft(appNovena);
console.log('✓ novenatoDraft compiles');

// Test: Session and visibility checks
const mockSession: Session = {
  id: 'user-123',
  fullName: 'Test User',
  email: 'test@example.com',
  emailConfirmedAt: null,
  avatarUrl: null,
  province: 'Buenos Aires',
  contact: 'test@example.com',
  communityOfOrigin: 'Test Community',
  role: 'palestrista',
  status: 'aprobado',
  permissions: [],
};

const canSee: boolean = canSeeNovena(mockSession, appNovena);
console.log('✓ canSeeNovena compiles');

const canManage: boolean = canManageNovenas(mockSession);
console.log('✓ canManageNovenas compiles');

const canManageProvince: boolean = canManageProvinceNovenas(mockSession);
console.log('✓ canManageProvinceNovenas compiles');

// Test: Filter and find
const filtered: AppNovena[] = filterVisibleNovenas([appNovena], mockSession);
console.log('✓ filterVisibleNovenas compiles');

const active: AppNovena | null = findActiveNovena([appNovena], mockSession);
console.log('✓ findActiveNovena compiles');

// Test: Days validation
const daysValid: boolean = isValidNovenaDays(draft.days);
console.log('✓ isValidNovenaDays compiles');

// Test: Date formatting
const formatted: string = formatNovenaDateRange('2026-07-01', '2026-07-09');
console.log('✓ formatNovenaDateRange compiles');

// Test: Operation results
const successResult: NovenaOperationResult = successNovenaOperation(appNovena);
console.log('✓ successNovenaOperation compiles');

const errorResult: NovenaOperationResult = errorNovenaOperation('Test error');
console.log('✓ errorNovenaOperation compiles');

// Test: Constants
const scopeRules = NOVENA_SCOPE_RULES;
console.log('✓ NOVENA_SCOPE_RULES compiles');

// Test: Options type
const options: FetchNovenasOptions = {
  includeInactive: false,
  includeArchived: false,
  scope: 'nacional',
  onlyActive: true,
};
console.log('✓ FetchNovenasOptions compiles');

// Test: Scope and Status enums
const scope: NovenaScope = 'nacional';
const status: NovenaStatus = 'borrador';
console.log('✓ NovenaScope and NovenaStatus compile');

console.log('\n✅ All type validations passed!');
