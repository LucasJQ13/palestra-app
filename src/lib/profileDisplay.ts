import { roleDefinitions } from '../data/content';
import { PersonalPmType, Role, Session } from '../types/auth';
import { currentYear } from './constants';
import { ProvinceRoleLabelRecord } from './profiles';
import { AppAdminConfig, defaultAdminConfig, RoleAliasConfig } from './appConfig';

type CredentialDisplayProfile = {
  fullName: string;
  nickname?: string | null;
  credentialNameMode?: 'name' | 'nickname' | 'both' | null;
};

export type GenderPreference = 'male' | 'female' | null | undefined;

export const genderNarratives = {
  male: {
    option: 'Hombre',
    title: 'Bienaventurado seas.',
    text: 'Querido hermano, sonríe, porque eres amado de verdad. Cada paso que das acercándote a Dios alegra el corazón de Cristo, porque Él ha esperado este momento para abrazarte y caminar a tu lado.\n\nNo temas avanzar. Incluso en medio de tus luchas, Él sigue obrando en vos. Así que toma tu cruz y sigámoslo juntos.'
  },
  female: {
    option: 'Mujer',
    title: 'Bienaventurada seas.',
    text: 'Querida hermana, sonríe, porque eres amada de verdad. Cada paso que das acercándote a Dios alegra el corazón de Cristo, porque Él ha esperado este momento para abrazarte y caminar a tu lado.\n\nNo temas avanzar. Incluso en medio de tus luchas, Él sigue obrando en vos. Así que toma tu cruz y sigámoslo juntas.'
  }
} satisfies Record<'male' | 'female', { option: string; title: string; text: string }>;

const genderedRoleLabels: Partial<Record<Role, { male: string; female: string }>> = {
  animador_comunidad: { male: 'Animador de Comunidad', female: 'Animadora de Comunidad' },
  coordinador_comunidad: { male: 'Coordinador de Comunidad', female: 'Coordinadora de Comunidad' },
  vocal: { male: 'Vocal Diocesano', female: 'Vocal Diocesana' },
  coordinador_diocesano: { male: 'Coordinador Diocesano', female: 'Coordinadora Diocesana' },
  vocal_nacional: { male: 'Vocal Nacional', female: 'Vocal Nacional' },
  coordinador_nacional: { male: 'Coordinador Nacional', female: 'Coordinadora Nacional' }
};

export function roleLabel(role: Role, gender?: GenderPreference) {
  if (gender && genderedRoleLabels[role]?.[gender]) {
    return genderedRoleLabels[role]?.[gender] ?? role;
  }
  return roleDefinitions.find((item) => item.role === role)?.label ?? role;
}

export function firstNameOf(fullName?: string | null) {
  return (fullName ?? '').trim().split(/\s+/)[0] || 'Palestrista';
}

export function perseveranceYearsFromStart(startYear?: number | null) {
  if (!startYear || startYear < 1961 || startYear > currentYear) {
    return null;
  }
  return Math.max(0, currentYear - startYear);
}

export function perseveranceLabel(startYear?: number | null) {
  const years = perseveranceYearsFromStart(startYear);
  if (years === null) {
    return '';
  }
  return `${years} ${years === 1 ? 'año' : 'años'} de perseverancia`;
}

export function personalPmTypeLabel(type?: PersonalPmType | string | null) {
  if (type === 'pmm') {
    return 'PMM';
  }
  if (type === 'pmf') {
    return 'PMF';
  }
  return '';
}

export function personalPmSummary(values: {
  type?: PersonalPmType | string | null;
  number?: number | string | null;
  province?: string | null;
  motto?: string | null;
}) {
  const label = personalPmTypeLabel(values.type);
  const number = values.number ? String(values.number).trim() : '';
  const province = values.province?.trim();
  const motto = values.motto?.trim();
  if (!label || !number || !province) {
    return '';
  }
  return `${label} N° ${number} (${province})${motto ? ` - ${motto}` : ''}`;
}

export function credentialDisplayName(session: Session | CredentialDisplayProfile | null) {
  if (!session) {
    return '';
  }
  const fullName = 'fullName' in session ? session.fullName : '';
  const nickname = session.nickname?.trim();
  const mode = session.credentialNameMode ?? 'name';
  if (mode === 'nickname' && nickname) {
    return nickname;
  }
  if (mode === 'both' && nickname) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]} "${nickname}" ${parts.slice(1).join(' ')}`;
    }
    return `${fullName} "${nickname}"`.trim();
  }
  return fullName || nickname || 'Palestrista';
}

export function renderGreetingTemplate(template: string | undefined, variables: Record<string, string>, fallback: string) {
  if (!template?.trim()) {
    return fallback;
  }
  const rendered = template.replace(/\{([a-zA-Z_]+)\}/g, (match, key) => variables[key] ?? '');
  return rendered.trim() || fallback;
}

export function homeGreeting(session: Session | null, homeConfig: AppAdminConfig['home'] = defaultAdminConfig.home) {
  if (!session || session.role === 'invitado') {
    return '';
  }
  const name = homeGreetingName(session);
  const role = roleLabel(session.role, session.genderPreference);
  if (session.genderPreference === 'male') {
    const fallback = `Bienvenido hno. en Cristo ${name}, Oh Bella Ciao!`;
    return renderGreetingTemplate(homeConfig.greetingTemplateMale, {
      nombre: name,
      tratamiento: 'hno.',
      genero_bienvenida: 'Bienvenido',
      rango: role
    }, fallback);
  }
  if (session.genderPreference === 'female') {
    const fallback = `Bienvenida hna. en Cristo ${name}, Oh Bella Ciao!`;
    return renderGreetingTemplate(homeConfig.greetingTemplateFemale, {
      nombre: name,
      tratamiento: 'hna.',
      genero_bienvenida: 'Bienvenida',
      rango: role
    }, fallback);
  }
  const fallback = `Bienvenido/a a Palestra, ${name}. Oh Bella Ciao!`;
  return renderGreetingTemplate(homeConfig.greetingTemplateNeutral, {
    nombre: name,
    tratamiento: 'hno./hna.',
    genero_bienvenida: 'Bienvenido/a',
    rango: role
  }, fallback);
}

export function homeGreetingName(session: Session | null) {
  if (!session || session.role === 'invitado') {
    return '';
  }
  return session.useNicknameInGreetings && session.nickname?.trim() ? session.nickname.trim() : firstNameOf(session.fullName);
}

export function roleLabelForProvince(role: Role, province?: string | null, labels: ProvinceRoleLabelRecord[] = [], aliases: RoleAliasConfig[] = [], gender?: GenderPreference) {
  if (!province) {
    const globalAlias = aliases.find((item) => item.isActive && item.baseRole === role && !item.province);
    return globalAlias?.displayLabel || roleLabel(role, gender);
  }
  const custom = labels.find((item) => item.is_active && item.role_key === role && item.province.toLowerCase() === province.toLowerCase());
  const alias = aliases.find((item) => item.isActive && item.baseRole === role && (!item.province || item.province.toLowerCase() === province.toLowerCase()));
  return custom?.display_label || alias?.displayLabel || roleLabel(role, gender);
}

export function displayRoleLabel(role: Role, province?: string | null, labels: ProvinceRoleLabelRecord[] = [], aliases: RoleAliasConfig[] = [], assignedLabel?: string | null, gender?: GenderPreference) {
  return assignedLabel?.trim() || roleLabelForProvince(role, province, labels, aliases, gender);
}

export function roleShortLabel(role: Role, gender?: GenderPreference) {
  const labels: Record<Role, string> = {
    invitado: 'Invitado',
    palestrista: 'Palestrista',
    sedimentador: 'Sedimentador',
    animador_comunidad: gender === 'female' ? 'Animadora' : 'Animador',
    coordinador_comunidad: 'Coord. Comunidad',
    vocal: 'Vocal Dioc.',
    asesor: 'Asesor',
    coordinador_diocesano: 'Coord. Dioc.',
    vocal_nacional: 'Vocal Nac.',
    coordinador_nacional: 'Coord. Nacional',
    administrador: 'Admin'
  };
  return labels[role] ?? roleLabel(role, gender);
}
