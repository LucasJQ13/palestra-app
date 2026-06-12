import { Session } from '../../types/auth';
import { resolveCommunityInternalRole, isCommunityOperationalLeader } from './roles';
import { CommunityCapabilities, CommunityScope } from './types';

const noCommunityCapabilities: CommunityCapabilities = {
  role: null,
  canView: false,
  canViewMembers: false,
  canMessageMembers: false,
  canOpenPanel: false,
  canPublishNotices: false,
  canManageAllNotices: false,
  canManageOwnNotices: false,
  canEditCommunityDetails: false,
  canManageMembers: false,
  canNotifyMembers: false
};

export function getCommunityCapabilities(
  session: Session | null,
  scope: CommunityScope
): CommunityCapabilities {
  const role = resolveCommunityInternalRole(session, scope);
  if (!role) {
    return noCommunityCapabilities;
  }

  const isAdministrator = role === 'administrator';
  const isOperationalLeader = isCommunityOperationalLeader(role);
  const isAdvisor = role === 'advisor';

  return {
    role,
    canView: true,
    canViewMembers: true,
    canMessageMembers: true,
    canOpenPanel: isAdministrator || isOperationalLeader || isAdvisor,
    canPublishNotices: isAdministrator || isOperationalLeader || isAdvisor,
    canManageAllNotices: isAdministrator || isOperationalLeader,
    canManageOwnNotices: isAdministrator || isOperationalLeader || isAdvisor,
    canEditCommunityDetails: isAdministrator || isOperationalLeader,
    canManageMembers: isAdministrator || isOperationalLeader,
    canNotifyMembers: isAdministrator || isOperationalLeader
  };
}

export function canManageCommunityNotice(
  session: Session | null,
  scope: CommunityScope,
  authorId?: string | null
) {
  const capabilities = getCommunityCapabilities(session, scope);
  if (capabilities.canManageAllNotices) {
    return true;
  }
  return Boolean(
    capabilities.canManageOwnNotices
    && authorId
    && session?.id
    && authorId === session.id
  );
}
