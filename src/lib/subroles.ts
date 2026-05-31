import { Role } from '../types/auth';

export type SubroleKey =
  | 'vocal_diocesano'
  | 'proceso_educativo'
  | 'formacion_espiritualidad'
  | 'retaguardia_finanzas'
  | 'pastoral'
  | 'secretaria'
  | 'vocal_nacional';

export type SubroleDefinition = {
  key: SubroleKey;
  label: string;
  allowedRoles: Role[];
};

export const leadershipSubroles: SubroleDefinition[] = [
  { key: 'vocal_diocesano', label: 'Vocal Diocesano', allowedRoles: ['vocal', 'vocal_nacional'] },
  { key: 'proceso_educativo', label: 'Vocal de Proceso Educativo', allowedRoles: ['vocal', 'vocal_nacional'] },
  { key: 'formacion_espiritualidad', label: 'Vocal de Formacion y Espiritualidad', allowedRoles: ['vocal', 'vocal_nacional'] },
  { key: 'retaguardia_finanzas', label: 'Vocal de Retaguardia y Finanzas', allowedRoles: ['vocal', 'vocal_nacional'] },
  { key: 'pastoral', label: 'Vocal de Pastoral', allowedRoles: ['vocal', 'vocal_nacional'] },
  { key: 'secretaria', label: 'Secretario / Secretaria', allowedRoles: ['vocal', 'vocal_nacional'] },
  { key: 'vocal_nacional', label: 'Vocal Nacional', allowedRoles: ['vocal_nacional'] }
];

export function subrolesForRole(role: Role) {
  return leadershipSubroles.filter((item) => item.allowedRoles.includes(role));
}

export function subroleLabel(key?: string | null) {
  if (!key) {
    return 'Sin subrango';
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
