import { Role, Session } from '../types/auth';

export type RoleDefinition = {
  role: Role;
  label: string;
  rank: number;
  scope: 'publico' | 'comunidad' | 'provincia' | 'nacional' | 'sistema';
  description: string;
  approval: string;
  approverRoles: Role[];
};

export const roleHierarchy: RoleDefinition[] = [
  {
    role: 'invitado',
    label: 'Invitado',
    rank: 0,
    scope: 'publico',
    description: 'Persona sin usuario. Solo navega contenido publico.',
    approval: 'No requiere aprobacion porque no tiene cuenta.',
    approverRoles: []
  },
  {
    role: 'palestrista',
    label: 'Palestrista',
    rank: 1,
    scope: 'comunidad',
    description: 'Usuario creado con mail confirmado. Puede acceder a contenido basico de su comunidad.',
    approval: 'Se habilita al confirmar el mail.',
    approverRoles: []
  },
  {
    role: 'sedimentador',
    label: 'Sedimentador',
    rank: 2,
    scope: 'comunidad',
    description: 'Hizo el PM y queda vinculado a una provincia y comunidad.',
    approval: 'Debe ser aprobado por un Vocal Diocesano.',
    approverRoles: ['vocal', 'coordinador_diocesano', 'administrador']
  },
  {
    role: 'animador_comunidad',
    label: 'Animador',
    rank: 3,
    scope: 'comunidad',
    description: 'Sedimentador a cargo de animar una comunidad. Puede editar la comunidad que tiene asignada.',
    approval: 'Debe ser aprobado por un Vocal Diocesano.',
    approverRoles: ['vocal', 'coordinador_diocesano', 'administrador']
  },
  {
    role: 'coordinador_comunidad',
    label: 'Coordinador de comunidad',
    rank: 4,
    scope: 'comunidad',
    description: 'Sedimentador a cargo de una comunidad y del animador de esa comunidad.',
    approval: 'Debe ser aprobado por un Vocal Diocesano.',
    approverRoles: ['vocal', 'coordinador_diocesano', 'administrador']
  },
  {
    role: 'vocal',
    label: 'Vocal Diocesano',
    rank: 5,
    scope: 'provincia',
    description: 'Sedimentador a cargo de un area del movimiento. Gestiona comunidades, animadores y coordinadores de comunidad de su provincia.',
    approval: 'Debe ser aprobado por el Coordinador Diocesano.',
    approverRoles: ['coordinador_diocesano', 'administrador']
  },
  {
    role: 'asesor',
    label: 'Asesor',
    rank: 6,
    scope: 'provincia',
    description: 'Tiene la misma potestad operativa que un Vocal Diocesano dentro de su provincia.',
    approval: 'Debe ser aprobado por el Coordinador Diocesano.',
    approverRoles: ['coordinador_diocesano', 'administrador']
  },
  {
    role: 'coordinador_diocesano',
    label: 'Coordinador Diocesano',
    rank: 7,
    scope: 'provincia',
    description: 'Sedimentador a cargo de todo el movimiento en su provincia, incluyendo asesores, vocales, animadores y coordinadores.',
    approval: 'Debe ser aprobado por el Coordinador Diocesano anterior o por un Vocal Nacional.',
    approverRoles: ['coordinador_diocesano', 'vocal_nacional', 'administrador']
  },
  {
    role: 'vocal_nacional',
    label: 'Vocal Nacional',
    rank: 8,
    scope: 'nacional',
    description: 'Sedimentador a cargo de aspectos dirigenciales nacionales, vocales diocesanos y coordinadores diocesanos.',
    approval: 'Debe ser aprobado por el Coordinador Nacional.',
    approverRoles: ['coordinador_nacional', 'administrador']
  },
  {
    role: 'coordinador_nacional',
    label: 'Coordinador Nacional',
    rank: 9,
    scope: 'nacional',
    description: 'Esta a cargo de todas las provincias, vocales nacionales y toda la estructura anterior.',
    approval: 'Debe ser aprobado por el Coordinador Nacional anterior.',
    approverRoles: ['coordinador_nacional', 'administrador']
  },
  {
    role: 'administrador',
    label: 'Administrador',
    rank: 10,
    scope: 'sistema',
    description: 'Tiene potestad absoluta sobre la aplicacion, sin restricciones funcionales.',
    approval: 'Perfil tecnico asignado por administracion.',
    approverRoles: ['administrador']
  }
];

export const nationalProvinceNames = ['Argentina', 'Nacional', 'Equipo Nacional'];

export function roleRank(role: Role) {
  return roleHierarchy.find((item) => item.role === role)?.rank ?? 0;
}

export function canSeeAllProvinces(session: Session | null) {
  return Boolean(session && ['vocal_nacional', 'coordinador_nacional', 'administrador'].includes(session.role));
}

export function isNationalScope(province?: string | null) {
  return Boolean(province && nationalProvinceNames.some((name) => name.toLowerCase() === province.toLowerCase()));
}

export function canAccessProvince(session: Session | null, province?: string | null) {
  if (!session || !province || session.role === 'invitado') {
    return true;
  }
  if (session.role === 'administrador' || canSeeAllProvinces(session)) {
    return true;
  }
  return province === session.province || isNationalScope(province);
}

export function canManageProvince(session: Session | null, province?: string | null) {
  if (!session || !province) {
    return false;
  }
  if (session.role === 'administrador') {
    return true;
  }
  return province === session.province && ['vocal', 'asesor', 'coordinador_diocesano'].includes(session.role);
}

export function canApproveRole(session: Session | null, targetRole: Role) {
  if (!session) {
    return false;
  }
  if (targetRole === 'administrador') {
    return false;
  }
  if (session.role === 'administrador') {
    return true;
  }
  if (session.role === 'coordinador_nacional') {
    return targetRole === 'coordinador_nacional' || roleRank(targetRole) < roleRank(session.role);
  }
  if (session.role === 'vocal_nacional') {
    return roleRank(targetRole) < roleRank(session.role);
  }
  if (session.role === 'coordinador_diocesano' && targetRole === 'coordinador_diocesano') {
    return true;
  }
  const target = roleHierarchy.find((item) => item.role === targetRole);
  return Boolean(target?.approverRoles.includes(session.role) && roleRank(session.role) >= roleRank(targetRole));
}

export function assignableRolesFor(session: Session | null) {
  return roleHierarchy.filter((item) => !['invitado', 'administrador'].includes(item.role) && canApproveRole(session, item.role));
}

export function visibleHierarchyFor(session: Session | null) {
  if (session?.role === 'administrador') {
    return roleHierarchy;
  }
  return roleHierarchy.filter((item) => item.role !== 'administrador');
}
