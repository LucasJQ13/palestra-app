import { Permission, Role, Session } from '../types/auth';
import { AdminUser } from './profiles';
import { canAccessProvince, roleRank } from './roles';
import { canManageSubrole } from './subroles';

type TabKey = string;

export function canAccessPrivate(session: Session | null) {
  return session?.status === 'aprobado' && session.role !== 'invitado';
}

export function hasPermission(session: Session | null, permission: Permission) {
  return Boolean(session?.permissions.includes(permission));
}

export function canManagePublishedContent(session: Session | null) {
  return hasPermission(session, 'gestionar_contenido');
}

export function canManageNewsContent(session: Session | null) {
  return hasPermission(session, 'gestionar_contenido');
}

export function canManageNationalPublishedContent(session: Session | null) {
  return Boolean(session && ['vocal_nacional', 'coordinador_nacional', 'administrador'].includes(session.role));
}

export function isCommunityLeaderRole(session: Session | null) {
  return Boolean(session && ['animador_comunidad', 'coordinador_comunidad'].includes(session.role));
}

export function canCreateOrAdministrateCommunities(session: Session | null) {
  return Boolean(session && (
    hasPermission(session, 'gestionar_comunidades_global')
    || ['vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador'].includes(session.role)
  ));
}

export function canUseCommunityAdmin(session: Session | null) {
  return Boolean(session && (hasPermission(session, 'gestionar_comunidad') || hasPermission(session, 'gestionar_comunidades_global') || ['animador_comunidad', 'coordinador_comunidad', 'vocal', 'coordinador_diocesano'].includes(session.role)));
}

export function canManageMotivadorPanel(session: Session | null) {
  return hasPermission(session, 'gestionar_contenido') || hasPermission(session, 'gestionar_sistema');
}

export function canEditAdminUser(session: Session | null, user?: AdminUser | null) {
  if (!session || !user) {
    return false;
  }
  if (user.id === session.id) {
    return false;
  }
  const targetRole = (user.role || 'palestrista') as Role;
  if (targetRole === 'administrador' && session.role !== 'administrador') {
    return false;
  }
  if (!canAccessProvince(session, user.province)) {
    return false;
  }
  if (!canManageSubrole(session.role, session.subroleKey, targetRole, user.subrole_key)) {
    return false;
  }
  return roleRank(session.role) >= roleRank(targetRole);
}

export function canManageUsersPanel(session: Session | null) {
  if (isCommunityLeaderRole(session)) {
    return false;
  }
  return hasPermission(session, 'aprobar_sedimentadores') || hasPermission(session, 'otorgar_roles_provincia') || hasPermission(session, 'otorgar_roles_diocesanos') || hasPermission(session, 'gestionar_roles_globales');
}

export function leadershipPanelTitle(session: Session | null) {
  if (!session) {
    return 'Panel Dirigencial';
  }
  if (['animador_comunidad', 'coordinador_comunidad'].includes(session.role)) {
    return `Comunidad ${session.communityOfOrigin || 'asignada'}`;
  }
  if (['vocal', 'coordinador_diocesano'].includes(session.role)) {
    return `Secretariado de ${session.province || 'tu provincia'}`;
  }
  if (['vocal_nacional', 'coordinador_nacional'].includes(session.role)) {
    return 'Secretariado Nacional';
  }
  return 'Panel Dirigencial';
}

export function canEditStaticInstitutionalPage(session: Session | null) {
  return Boolean(session && ['coordinador_nacional', 'administrador'].includes(session.role));
}

export function canManageGlobalInstagram(session: Session | null) {
  return Boolean(session && ['coordinador_nacional', 'administrador'].includes(session.role));
}

export function canEditPageContent(session: Session | null, key: TabKey) {
  return hasPermission(session, 'gestionar_pestanas') || hasPermission(session, 'gestionar_contenido') || session?.role === 'administrador';
}
