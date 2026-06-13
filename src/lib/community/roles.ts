import { Role, Session } from '../../types/auth';
import { CommunityInternalRole, CommunityScope } from './types';

const internalRoleByAppRole: Partial<Record<Role, CommunityInternalRole>> = {
  animador_comunidad: 'animator',
  coordinador_comunidad: 'coordinator',
  asesor: 'advisor'
};

function normalizeTerritory(value?: string | null) {
  return (value ?? '').trim().toLocaleLowerCase('es');
}

export function belongsToCommunity(session: Session | null, scope: CommunityScope) {
  if (!session || session.status !== 'aprobado' || session.role === 'invitado') {
    return false;
  }

  const communityName = normalizeTerritory(scope.name);
  const province = normalizeTerritory(scope.province);
  const sameCommunity = Boolean(communityName)
    && normalizeTerritory(session.communityOfOrigin) === communityName;
  const sameProvince = !province || normalizeTerritory(session.province) === province;

  return sameCommunity && sameProvince;
}

export function resolveCommunityInternalRole(
  session: Session | null,
  scope: CommunityScope
): CommunityInternalRole | null {
  if (!session || session.status !== 'aprobado' || session.role === 'invitado') {
    return null;
  }

  if (!belongsToCommunity(session, scope)) {
    return null;
  }

  if (session.role === 'asesor' && !scope.advisorAssigned) {
    return null;
  }

  return internalRoleByAppRole[session.role] ?? 'member';
}

export function isCommunityOperationalLeader(role: CommunityInternalRole | null) {
  return role === 'animator' || role === 'coordinator';
}

export function isCommunityVisibleReferenceRole(role?: string | null) {
  return role === 'animador_comunidad'
    || role === 'coordinador_comunidad'
    || role === 'asesor';
}
