import { Role } from '../types/auth';

export type SubroleKey =
  | 'proceso_educativo'
  | 'formacion_espiritualidad'
  | 'retaguardia_finanzas'
  | 'pastoral'
  | 'secretario';

export type SubroleDefinition = {
  key: SubroleKey;
  label: string;
  allowedRoles: Role[];
};

export const leadershipSubroles: SubroleDefinition[] = [
  { key: 'proceso_educativo', label: 'Vocal de Proceso Educativo', allowedRoles: ['vocal', 'vocal_nacional'] },
  { key: 'formacion_espiritualidad', label: 'Vocal de Formacion y Espiritualidad', allowedRoles: ['vocal', 'vocal_nacional'] },
  { key: 'retaguardia_finanzas', label: 'Vocal de Retaguardia y Finanzas', allowedRoles: ['vocal', 'vocal_nacional'] },
  { key: 'pastoral', label: 'Vocal de Pastoral', allowedRoles: ['vocal', 'vocal_nacional'] },
  { key: 'secretario', label: 'Secretario', allowedRoles: ['vocal', 'vocal_nacional'] }
];

export function subrolesForRole(role: Role) {
  return leadershipSubroles.filter((item) => item.allowedRoles.includes(role));
}

export function subroleLabel(key?: string | null, gender?: 'male' | 'female' | null) {
  if (!key) {
    return 'Sin subrango';
  }
  if (key === 'secretario') {
    return gender === 'female' ? 'Secretaria' : 'Secretario';
  }
  return leadershipSubroles.find((item) => item.key === key)?.label ?? key;
}

export function canManageSubrole(managerRole: Role, managerSubroleKey: string | null | undefined, targetRole: Role, targetSubroleKey: string | null | undefined) {
  if (managerRole === 'administrador' || managerRole === 'coordinador_nacional') {
    return true;
  }
  if (managerRole === 'vocal_nacional') {
    if (!managerSubroleKey) {
      return true;
    }
    return targetRole === 'vocal' && targetSubroleKey === managerSubroleKey;
  }
  return true;
}
