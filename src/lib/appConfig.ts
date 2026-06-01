import { Role } from '../types/auth';
import { contactInfo } from '../data/content';
import { defaultProvinceInstagram, officialInstagramUrl } from './constants';

export type ContactBlock = { id: string; type: 'texto' | 'telefono' | 'email' | 'imagen' | 'direccion' | 'enlace' | 'boton' | 'red_social'; label: string; value: string };
export type RoleAliasConfig = {
  id: string;
  baseRole: Role;
  displayLabel: string;
  province: string | null;
  isActive: boolean;
};
export type AppAdminConfig = {
  identity: {
    appName: string;
    subtitle: string;
    description: string;
    logoUrl: string;
    heroImageUrl: string;
    primaryColor: string;
    secondaryColor: string;
  };
  home: {
    heroTitle: string;
    heroText: string;
    featuredBanner: string;
    visibleModules: string[];
    quickAccessLabels: Record<string, string>;
    greetingTemplateMale?: string;
    greetingTemplateFemale?: string;
    greetingTemplateNeutral?: string;
  };
  contact: {
    email: string;
    phone: string;
    instagram: string;
    provinceInstagram: Record<string, string>;
    blocks: ContactBlock[];
    helpText: string;
    donationText: string;
  };
  settings: {
    maintenanceMode: boolean;
    globalMessage: string;
    futureForumEnabled: boolean;
    nearbyCommunitySearchEnabled: boolean;
    hiddenFallbackContent: string[];
    roleAliases: RoleAliasConfig[];
  };
  periodoMotivador: {
    active: boolean;
    title: string;
    body: string;
    imageUrl: string;
  };
  intentions: {
    prayerSeconds: number;
  };
  gospel: {
    enabled: boolean;
    sourceUrl: string;
    reflectionSourceUrl?: string;
    autoUpdate?: boolean;
    title: string;
    body: string;
  };
};
export const defaultAdminConfig: AppAdminConfig = {
  identity: {
    appName: 'Palestra',
    subtitle: 'Movimiento Catolico',
    description: 'Movimiento catolico juvenil y comunitario presente en Argentina.',
    logoUrl: '',
    heroImageUrl: '',
    primaryColor: '#2d8dc8',
    secondaryColor: '#5da7db'
  },
  home: {
    heroTitle: 'Una app para caminar juntos.',
    heroText: 'Noticias, agenda, materiales y comunicacion interna para las comunidades de Palestra.',
    featuredBanner: 'Agenda comunitaria',
    visibleModules: ['noticias', 'comunidades', 'materiales', 'foro', 'perfil', 'agenda'],
    quickAccessLabels: {
      noticias: 'Noticias',
      comunidades: 'Comunidad',
      materiales: 'Materiales',
      foro: 'Foro',
      perfil: 'Perfil'
    },
    greetingTemplateMale: 'Bienvenido {tratamiento} en Cristo {nombre}, Oh Bella Ciao!',
    greetingTemplateFemale: 'Bienvenida {tratamiento} en Cristo {nombre}, Oh Bella Ciao!',
    greetingTemplateNeutral: 'Bienvenido/a a Palestra, {nombre}. Oh Bella Ciao!'
  },
  contact: {
    email: contactInfo.email,
    phone: contactInfo.phone,
    instagram: officialInstagramUrl,
    provinceInstagram: defaultProvinceInstagram,
    blocks: [],
    helpText: contactInfo.helpText,
    donationText: contactInfo.donationText
  },
  settings: {
    maintenanceMode: false,
    globalMessage: '',
    futureForumEnabled: false,
    nearbyCommunitySearchEnabled: false,
    hiddenFallbackContent: [],
    roleAliases: []
  },
  periodoMotivador: {
    active: false,
    title: 'PM',
    body: '',
    imageUrl: ''
  },
  intentions: {
    prayerSeconds: 60
  },
  gospel: {
    enabled: true,
    sourceUrl: 'https://donbosco.org.ar/home/evangelio',
    reflectionSourceUrl: 'https://donbosco.org.ar/home/evangelio',
    autoUpdate: true,
    title: 'Evangelio del Dia',
    body: ''
  }
};

export function normalizeAdminConfig(config?: Partial<AppAdminConfig> | null): AppAdminConfig {
  const merged: AppAdminConfig = {
    ...defaultAdminConfig,
    ...config,
    identity: { ...defaultAdminConfig.identity, ...(config?.identity ?? {}) },
    home: {
      ...defaultAdminConfig.home,
      ...(config?.home ?? {}),
      quickAccessLabels: {
        ...defaultAdminConfig.home.quickAccessLabels,
        ...(config?.home?.quickAccessLabels ?? {})
      }
    },
    contact: { ...defaultAdminConfig.contact, ...(config?.contact ?? {}) },
    settings: { ...defaultAdminConfig.settings, ...(config?.settings ?? {}) },
    periodoMotivador: { ...defaultAdminConfig.periodoMotivador, ...(config?.periodoMotivador ?? {}) },
    intentions: { ...defaultAdminConfig.intentions, ...(config?.intentions ?? {}) },
    gospel: { ...defaultAdminConfig.gospel, ...(config?.gospel ?? {}) }
  };

  if (!merged.contact.instagram || merged.contact.instagram === contactInfo.instagram || merged.contact.instagram === '@palestra.argentina') {
    merged.contact.instagram = officialInstagramUrl;
  }
  merged.contact.provinceInstagram = { ...defaultProvinceInstagram, ...(config?.contact?.provinceInstagram ?? {}) };
  merged.contact.blocks = Array.isArray(config?.contact?.blocks) ? config.contact.blocks : [];

  return merged;
}

