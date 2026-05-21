import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Animated, BackHandler, Easing, Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, ToastAndroid, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { palette } from './src/theme/palette';
import { AppTheme, ThemeName, themePresets } from './src/theme/themes';
import { auditLog, calendarActivities, communities, contactInfo, communityNews, faqItems, internalMessages, materials, movementHistory, news, notilestra, pendingUsers, roleDefinitions } from './src/data/content';
import { Permission, Role, Session, UserStatus } from './src/types/auth';
import { getPermissionsForRole, rolePermissions } from './src/lib/permissions';
import { AppCommunity, PublicationComment, RemoteAgendaItem, archiveAgendaEvent, archiveCommunityPublication, archiveNewsEntry, createCommunityPublication, createPublicationComment, fetchCommunities, fetchCommunityPublications, fetchMotivadorPeriods, fetchNews, fetchNotilestra, fetchPublicationComments, reactToPublication, reportPublication, updateAgendaEvent, updateCommunityPublication, updateNewsEntry, voteCommunityPoll } from './src/lib/remoteData';
import { AdminUser, AdminUserLoginDiagnostic, AppContentBlock, AppMaterialRecord, AppTabSetting, CommunityMember, ContentEditorBlock, MailboxMessageRecord, MailboxTargetMode, MotivadorPeriodRecord, NewsDraftRecord, ProvinceRoleLabelRecord, RoleAliasRecord, RolePermissionRecord, UserAgendaPreferenceRecord, UserRequestRecord, acceptDiocesanCoordinatorRequest, approveProfile, archiveAppMaterial, archiveCommunity, confirmAdminUserEmail, createAdminBasicUser, createAppTab, createCommunity, createCommunityContactMessage, createEvent, createNews, createLeadershipChangeRequest, createMailboxMessage, createNotificationIntent, createUserRequest, debugPushToDevice, deleteAdminUserByEmail, deleteAppTab, deliverNotificationIntent, diagnoseAdminUserLogin, fetchAdminConfig, fetchAdminMotivadorPeriods, fetchAdminRequests, fetchAdminUsers, fetchAppContent, fetchAppMaterials, fetchAppTabs, fetchAssignableRoleAliases, fetchMailboxMessages, fetchMyCommunityMembers, fetchMyRequests, fetchNewsDrafts, fetchPendingProfiles, fetchProvinceRoleLabels, fetchPublicProfile, fetchRolePermissions, fetchUserAgendaPreferences, PendingProfile, registerPushToken, repairAdminUserLogin, resolveUserRequest, respondMailboxMessage, restoreDefaultAppTabs, saveAdminConfig, saveAdminInstagram, saveAppMaterial, saveMotivadorPeriod, saveNewsDraft, saveProvinceRoleLabel, saveRoleAlias, saveRolePermissions, setCommunityStatus, setMailboxMessageStatus, setMotivadorPeriodStatus, setRoleAliasStatus, setUserAgendaPreference, softDeleteAdminUser, updateAdminUser, updateAppContent, updateAppTab, updateAppTabPosition, updateCommunity, updateMyAvatar, updateMyProfile } from './src/lib/profiles';
import { supabase } from './src/lib/supabase';
import { getMyProfileSession } from './src/lib/authProfile';
import { ForumCategory, ForumComment, ForumTopic, archiveForumComment, archiveForumTopic, canUseForumCategory, createForumComment, createForumTopic, fetchForumCategories, fetchForumComments, fetchForumTopics, setForumTopicStatus, updateForumTopic, visibleForumRolesFor } from './src/lib/forum';
import { AppLibraryItem, LibrarySection, archiveLibraryItem, debugLibraryPermission, fetchLibraryItems, saveLibraryItem } from './src/lib/library';
import { assignableRolesFor, canAccessProvince, canApproveRole, canEditCommunity, canManageProvince, canSeeAllProvinces, roleRank, visibleHierarchyFor } from './src/lib/roles';

const palestraLogo = require('./assets/logo-palestra.png');
const provinceLogos: Record<string, any> = {
  Salta: require('./assets/logo-provincia-salta.png'),
  Jujuy: require('./assets/logo-provincia-jujuy.png'),
  Tucuman: require('./assets/logo-provincia-tucuman.png'),
  Catamarca: require('./assets/logo-provincia-catamarca.png'),
  Cordoba: require('./assets/logo-provincia-cordoba.png'),
  'San Luis': require('./assets/logo-provincia-san-luis.png')
};
const provinceDisplayNames: Record<string, string> = {
  Cordoba: 'Córdoba',
  Tucuman: 'Tucumán',
  Catamarca: 'Catamarca',
  Salta: 'Salta',
  Jujuy: 'Jujuy',
  'San Luis': 'San Luis'
};
const appBetaVersion = '0.1.0';
const appStageLabel = 'BETA';
const appVersionLabel = `${appStageLabel} ${appBetaVersion}`;
const touchPointerPreferenceKey = 'palestra.showTouchPointer';
const themePreferenceKey = 'palestra.themePreference';
const pushDeviceIdKey = 'palestra.push.deviceId';
const inputPlaceholderColor = '#5E8396';
const officialInstagramUrl = 'https://www.instagram.com/infopalestra.argentina?igsh=MXB2aGcwZG9qeGpvOA==';
const easProjectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? 'sin-project-id';
const appRuntimeOwner = String((Constants as any).appOwnership ?? (Constants as any).executionEnvironment ?? 'standalone');
const defaultProvinceInstagram: Record<string, string> = {
  Cordoba: 'https://www.instagram.com/infopalestra.cordoba?igsh=MXd2aTcwcmo4bzEwZw==',
  Catamarca: 'https://www.instagram.com/infopalestra.catamarca?igsh=MTB6ZXd0YWo1em4xdg==',
  Salta: 'https://www.instagram.com/palestrasaltaoficial?igsh=cGljYW51ajdqbTFn',
  'San Luis': 'https://www.instagram.com/infopalestra.sanluis?igsh=ZmJyZ2M0N2p5MDhv',
  Jujuy: 'https://www.instagram.com/infopalestra.jujuy?igsh=eGI4bnYyMnNlNXZn',
  Tucuman: 'https://www.instagram.com/infopalestra.tucuman?igsh=MTE5YzNqbXN1ZXdrag=='
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

(TextInput as any).defaultProps = {
  ...((TextInput as any).defaultProps ?? {}),
  placeholderTextColor: inputPlaceholderColor,
  selectionColor: palette.red
};

type TabKey = string;
type AdminModule = 'resumen' | 'identidad' | 'home' | 'noticias' | 'descargas' | 'comunidades' | 'historia_admin' | 'contacto_admin' | 'usuarios' | 'solicitudes' | 'periodo_motivador' | 'configuracion' | 'eventos' | 'contenido_general' | 'contenido_publicado' | 'navegacion' | 'permisos_roles' | 'etiquetas_roles' | 'rangos_alias';
type ContactBlock = { id: string; type: 'texto' | 'telefono' | 'email' | 'imagen' | 'direccion' | 'enlace' | 'boton' | 'red_social'; label: string; value: string };
type ProfilePanel = 'vista' | 'editar' | 'comunidad' | 'buzon' | 'configuracion';
type RoleAliasConfig = {
  id: string;
  baseRole: Role;
  displayLabel: string;
  province: string | null;
  isActive: boolean;
};
type AppAdminConfig = {
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
    hiddenFallbackContent: string[];
    roleAliases: RoleAliasConfig[];
  };
  periodoMotivador: {
    active: boolean;
    title: string;
    body: string;
    imageUrl: string;
  };
};
type AdminRequest = {
  id: string;
  userId?: string | null;
  title: string;
  requester: string;
  definition: string;
  createdAt: string;
  status: 'pendiente' | 'aprobada' | 'denegada';
  message?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  targetUserId?: string | null;
  targetUserName?: string | null;
  targetRole?: string | null;
  communityName?: string | null;
};

type NotilestraItem = (typeof notilestra)[number];
type CommunityPublication = Awaited<ReturnType<typeof fetchCommunityPublications>>[number];
type NewsFeedItem = (typeof news)[number] & { id?: string; source?: 'news'; province?: string };
type HomeFeedItem = NewsFeedItem | CommunityPublication;
type AgendaItem = NotilestraItem & Partial<Pick<RemoteAgendaItem, 'id' | 'source' | 'imageUrl' | 'mapUrl' | 'province' | 'dateGroupKey'>>;
function isRemoteNewsItem(item: HomeFeedItem): item is NewsFeedItem & { id: string; source: 'news' } {
  return Boolean((item as NewsFeedItem).id && (item as NewsFeedItem).source === 'news');
}
type PublicProfilePreview = {
  id?: string | null;
  fullName: string;
  role: Role;
  province?: string | null;
  communityName?: string | null;
  avatarUrl?: string | null;
  contact?: string | null;
};

const defaultAdminConfig: AppAdminConfig = {
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
    visibleModules: ['noticias', 'comunidades', 'materiales', 'perfil']
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
    hiddenFallbackContent: [],
    roleAliases: []
  },
  periodoMotivador: {
    active: false,
    title: 'PM',
    body: 'Espacio de preparacion, materiales y textos asociados al PM.',
    imageUrl: ''
  }
};

function normalizeAdminConfig(config?: Partial<AppAdminConfig> | null): AppAdminConfig {
  const merged: AppAdminConfig = {
    ...defaultAdminConfig,
    ...config,
    identity: { ...defaultAdminConfig.identity, ...(config?.identity ?? {}) },
    home: { ...defaultAdminConfig.home, ...(config?.home ?? {}) },
    contact: { ...defaultAdminConfig.contact, ...(config?.contact ?? {}) },
    settings: { ...defaultAdminConfig.settings, ...(config?.settings ?? {}) },
    periodoMotivador: { ...defaultAdminConfig.periodoMotivador, ...(config?.periodoMotivador ?? {}) }
  };

  if (!merged.contact.instagram || merged.contact.instagram === contactInfo.instagram || merged.contact.instagram === '@palestra.argentina') {
    merged.contact.instagram = officialInstagramUrl;
  }
  merged.contact.provinceInstagram = { ...defaultProvinceInstagram, ...(config?.contact?.provinceInstagram ?? {}) };
  merged.contact.blocks = Array.isArray(config?.contact?.blocks) ? config.contact.blocks : [];

  return merged;
}

const adminModuleCatalog: Array<{ key: AdminModule; label: string; icon: keyof typeof Ionicons.glyphMap; systemOnly?: boolean }> = [
  { key: 'resumen', label: 'Panel', icon: 'grid-outline' },
  { key: 'identidad', label: 'Identidad', icon: 'sparkles-outline', systemOnly: true },
  { key: 'home', label: 'Home', icon: 'home-outline', systemOnly: true },
  { key: 'noticias', label: 'Noticias', icon: 'newspaper-outline', systemOnly: true },
  { key: 'contenido_publicado', label: 'Contenido', icon: 'albums-outline', systemOnly: true },
  { key: 'comunidades', label: 'Comunidades', icon: 'location-outline' },
  { key: 'contacto_admin', label: 'Contacto', icon: 'chatbubbles-outline', systemOnly: true },
  { key: 'usuarios', label: 'Usuarios', icon: 'people-outline' },
  { key: 'solicitudes', label: 'Solicitudes', icon: 'mail-unread-outline' },
  { key: 'permisos_roles', label: 'Permisos', icon: 'shield-checkmark-outline', systemOnly: true },
  { key: 'etiquetas_roles', label: 'Etiquetas', icon: 'pricetags-outline', systemOnly: true },
  { key: 'rangos_alias', label: 'Rangos', icon: 'copy-outline', systemOnly: true },
  { key: 'navegacion', label: 'Navegación', icon: 'navigate-outline', systemOnly: true },
  { key: 'periodo_motivador', label: 'PM', icon: 'flame-outline', systemOnly: true },
  { key: 'configuracion', label: 'Config', icon: 'settings-outline', systemOnly: true }
];

type PageEditorProps = {
  tabKey: TabKey;
  title: string;
  content?: AppContentBlock;
  tab?: AppTabDisplay;
  isAdmin: boolean;
  contentLoaded: boolean;
  onContentChanged: () => Promise<void>;
  onTabsChanged: () => Promise<void>;
};

const defaultTabs: Array<{ key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'inicio', label: 'Inicio', icon: 'home-outline' },
  { key: 'notilestra', label: 'Notilestra', icon: 'newspaper-outline' },
  { key: 'materiales', label: 'Materiales', icon: 'document-text-outline' },
  { key: 'oraciones', label: 'Oraciones', icon: 'heart-outline' },
  { key: 'cancionero', label: 'Cancionero', icon: 'musical-notes-outline' },
  { key: 'himno', label: 'Himno', icon: 'flag-outline' },
  { key: 'comunidades', label: 'Comunidades', icon: 'people-outline' },
  { key: 'historia', label: 'Historia', icon: 'book-outline' },
  { key: 'contacto', label: 'Contacto', icon: 'chatbubbles-outline' },
  { key: 'periodo_motivador', label: 'PM', icon: 'flame-outline' },
  { key: 'perfil', label: 'Perfil', icon: 'person-circle-outline' }
];

type AppTabDisplay = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  visible: boolean;
  sortOrder: number;
  visibleRoles: string[] | null;
};

const defaultTabByKey = new Map(defaultTabs.map((tab) => [tab.key, tab]));
const protectedTabKeys = new Set(['inicio', 'perfil']);
const navigationIconSuggestions: Array<keyof typeof Ionicons.glyphMap> = [
  'home-outline',
  'newspaper-outline',
  'download-outline',
  'people-outline',
  'book-outline',
  'chatbubble-ellipses-outline',
  'person-circle-outline',
  'calendar-outline',
  'folder-open-outline',
  'heart-outline',
  'sparkles-outline',
  'settings-outline'
];

function isIoniconName(value?: string | null): value is keyof typeof Ionicons.glyphMap {
  return Boolean(value && value in Ionicons.glyphMap);
}

function normalizeTabKey(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

const internalTestSessions: Record<string, Session> = {
  invitado: {
    fullName: 'Visitante de prueba',
    province: 'Salta',
    contact: '+54 387 400-0001',
    communityOfOrigin: 'Sin comunidad asignada',
    role: 'invitado',
    status: 'aprobado',
    permissions: getPermissionsForRole('invitado')
  },
  palestrista: {
    fullName: 'Camila Torres',
    province: 'Tucuman',
    contact: '+54 381 400-0002',
    communityOfOrigin: 'Comunidad Tucuman 1',
    role: 'palestrista',
    status: 'aprobado',
    permissions: getPermissionsForRole('palestrista')
  },
  sedimentador: {
    fullName: 'Mateo Herrera',
    province: 'Catamarca',
    contact: '+54 383 400-0003',
    communityOfOrigin: 'Comunidad Catamarca 2',
    role: 'sedimentador',
    status: 'aprobado',
    permissions: getPermissionsForRole('sedimentador')
  },
  coordinador: {
    fullName: 'Lucia Rios',
    province: 'Cordoba',
    contact: '+54 351 400-0004',
    communityOfOrigin: 'Comunidad Cordoba 1',
    role: 'coordinador_comunidad',
    status: 'aprobado',
    permissions: getPermissionsForRole('coordinador_comunidad')
  },
  nacional: {
    fullName: 'Equipo Nacional de prueba',
    province: 'Argentina',
    contact: '+54 9 11 2456-7890',
    communityOfOrigin: 'Equipo Nacional',
    role: 'coordinador_nacional',
    status: 'aprobado',
    permissions: getPermissionsForRole('coordinador_nacional')
  },
  administrador: {
    fullName: 'Administrador Tecnico',
    province: 'Sistema',
    contact: 'admin@palestra.org.ar',
    communityOfOrigin: 'Administracion global',
    role: 'administrador',
    status: 'aprobado',
    permissions: getPermissionsForRole('administrador')
  }
};

function canAccessPrivate(session: Session | null) {
  return session?.status === 'aprobado' && session.role !== 'invitado';
}

function hasPermission(session: Session | null, permission: Permission) {
  return Boolean(session?.permissions.includes(permission));
}

function canManagePublishedContent(session: Session | null) {
  return Boolean(session && roleRank(session.role) >= roleRank('vocal'));
}

function canManageNationalPublishedContent(session: Session | null) {
  return Boolean(session && ['vocal_nacional', 'coordinador_nacional', 'administrador'].includes(session.role));
}

function isCommunityLeaderRole(session: Session | null) {
  return Boolean(session && ['animador_comunidad', 'coordinador_comunidad'].includes(session.role));
}

function canCreateOrAdministrateCommunities(session: Session | null) {
  return Boolean(session && ['vocal', 'coordinador_diocesano', 'administrador'].includes(session.role));
}

function canManageMotivadorPanel(session: Session | null) {
  return Boolean(session && ['vocal', 'coordinador_diocesano', 'administrador'].includes(session.role));
}

function canEditAdminUser(session: Session | null, user?: AdminUser | null) {
  if (!session || !user) {
    return false;
  }
  if (user.id === session.id) {
    return false;
  }
  const targetRole = (user.role || 'palestrista') as Role;
  if (targetRole === 'administrador') {
    return false;
  }
  if (!canAccessProvince(session, user.province)) {
    return false;
  }
  return roleRank(session.role) >= roleRank(targetRole);
}

function canManageUsersPanel(session: Session | null) {
  return Boolean(session && ['asesor', 'vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador'].includes(session.role));
}

function canEditStaticInstitutionalPage(session: Session | null) {
  return Boolean(session && ['coordinador_nacional', 'administrador'].includes(session.role));
}

function canManageGlobalInstagram(session: Session | null) {
  return Boolean(session && ['coordinador_nacional', 'administrador'].includes(session.role));
}

function canEditPageContent(session: Session | null, key: TabKey) {
  if (!session) {
    return false;
  }
  if (['historia', 'contacto'].includes(key)) {
    return canEditStaticInstitutionalPage(session);
  }
  if (key === 'himno') {
    return session.role === 'administrador';
  }
  if (session.role === 'administrador') {
    return true;
  }
  return canManagePublishedContent(session) && ['inicio', 'notilestra', 'materiales', 'oraciones', 'cancionero', 'comunidades', 'periodo_motivador'].includes(key);
}

type GenderPreference = 'male' | 'female' | null | undefined;

const genderNarratives = {
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

const monthNames = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

const shortMonthNames = monthNames.map((item) => item.slice(0, 3));

function roleLabel(role: Role, gender?: GenderPreference) {
  if (gender && genderedRoleLabels[role]?.[gender]) {
    return genderedRoleLabels[role]?.[gender] ?? role;
  }
  return roleDefinitions.find((item) => item.role === role)?.label ?? role;
}

function firstNameOf(fullName?: string | null) {
  return (fullName ?? '').trim().split(/\s+/)[0] || 'Palestrista';
}

function homeGreeting(session: Session | null) {
  if (!session || session.role === 'invitado') {
    return '';
  }
  const name = firstNameOf(session.fullName);
  if (session.genderPreference === 'male') {
    return `Bienvenido hno. en Cristo ${name}, Oh Bella Ciao!`;
  }
  if (session.genderPreference === 'female') {
    return `Bienvenida hna. en Cristo ${name}, Oh Bella Ciao!`;
  }
  return `Bienvenido/a a Palestra, ${name}. Oh Bella Ciao!`;
}

function roleLabelForProvince(role: Role, province?: string | null, labels: ProvinceRoleLabelRecord[] = [], aliases: RoleAliasConfig[] = [], gender?: GenderPreference) {
  if (!province) {
    const globalAlias = aliases.find((item) => item.isActive && item.baseRole === role && !item.province);
    return globalAlias?.displayLabel || roleLabel(role, gender);
  }
  const custom = labels.find((item) => item.is_active && item.role_key === role && item.province.toLowerCase() === province.toLowerCase());
  const alias = aliases.find((item) => item.isActive && item.baseRole === role && (!item.province || item.province.toLowerCase() === province.toLowerCase()));
  return custom?.display_label || alias?.displayLabel || roleLabel(role, gender);
}

function displayRoleLabel(role: Role, province?: string | null, labels: ProvinceRoleLabelRecord[] = [], aliases: RoleAliasConfig[] = [], assignedLabel?: string | null, gender?: GenderPreference) {
  return assignedLabel?.trim() || roleLabelForProvince(role, province, labels, aliases, gender);
}

function roleShortLabel(role: Role, gender?: GenderPreference) {
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

function fallbackContentKey(section: string, title: string, date?: string) {
  return `${section}:${date ? `${date}:` : ''}${title}`;
}

const permissionFriendlyLabels: Record<Permission, string> = {
  ver_inicio: 'Puede ver Inicio',
  ver_noticias: 'Puede ver Noticias',
  ver_comunidades: 'Puede ver Comunidades',
  ver_historia: 'Puede ver Historia',
  ver_contacto: 'Puede ver Contacto',
  ver_materiales_internos: 'Puede ver materiales internos',
  descargar_archivos: 'Puede descargar archivos',
  descargar_archivos_exclusivos: 'Puede descargar archivos exclusivos',
  ver_fechas_privadas: 'Puede ver fechas privadas',
  ver_noticias_comunidad: 'Puede ver noticias de su comunidad',
  subir_noticias_comunidad: 'Puede publicar avisos comunitarios',
  gestionar_comunidad: 'Puede gestionar comunidad',
  enviar_mensajes_comunidad: 'Puede enviar mensajes comunitarios',
  aprobar_sedimentadores: 'Puede aprobar sedimentadores',
  otorgar_roles_provincia: 'Puede otorgar roles provinciales',
  otorgar_roles_diocesanos: 'Puede otorgar roles diocesanos',
  ver_seccion_asesores: 'Puede ver sección de asesores',
  gestionar_permisos: 'Puede gestionar permisos',
  gestionar_sistema: 'Puede gestionar sistema',
  gestionar_roles_globales: 'Puede gestionar roles globales',
  gestionar_pestanas: 'Puede gestionar pestanas',
  gestionar_comunidades_global: 'Puede gestionar comunidades globales',
  enviar_notificaciones: 'Puede enviar notificaciones',
  gestionar_contenido: 'Puede gestionar contenido'
};

const permissionOptions = (Object.keys(permissionFriendlyLabels) as Permission[]).map((permission) => ({
  key: permission,
  label: permissionFriendlyLabels[permission]
}));

function tabShortLabel(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes('notilestra') || normalized.includes('noticia')) return 'Noticias';
  if (normalized.includes('material')) return 'Descargas';
  if (normalized.includes('comunidad')) return 'Comunid.';
  if (normalized.includes('historia')) return 'Historia';
  if (normalized.includes('contacto')) return 'Contacto';
  if (normalized.includes('motivador')) return 'PM';
  return label.length > 10 ? `${label.slice(0, 9)}.` : label;
}

function agendaPreferenceKey(item: AgendaItem) {
  if (item.id) {
    return `${item.source ?? 'agenda'}:${item.id}`;
  }
  return `local:${item.date}:${item.title}`;
}

function splitAgendaPreferences(records: UserAgendaPreferenceRecord[]) {
  return {
    favorites: records.filter((item) => item.preference_type === 'favorite').map((item) => item.item_key),
    reminders: records.filter((item) => item.preference_type === 'reminder').map((item) => item.item_key)
  };
}

function groupMotivadorFeedItems(items: AgendaItem[]) {
  const grouped = new Map<string, AgendaItem>();
  const output: AgendaItem[] = [];

  items.forEach((item) => {
    if (item.source !== 'motivador') {
      output.push(item);
      return;
    }

    const groupKey = item.dateGroupKey ?? item.id ?? `${item.title}-${item.scope}`;
    const current = grouped.get(groupKey);
    if (!current) {
      const feedItem = { ...item, id: `${groupKey}-feed`, dateGroupKey: groupKey };
      grouped.set(groupKey, feedItem);
      output.push(feedItem);
      return;
    }

    if (Date.parse(item.date) < Date.parse(current.date)) {
      current.date = item.date;
    }
  });

  return output.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

function notificationPermissionLabel(session: Session | null) {
  if (!session || (!hasPermission(session, 'enviar_notificaciones') && !['animador_comunidad', 'coordinador_comunidad'].includes(session.role))) {
    return 'La notificacion quedara disponible solo para roles con permiso de enviar notificaciones.';
  }
  return 'También se dejará preparada una notificación push para los usuarios alcanzados.';
}

async function getPushDeviceId() {
  const current = await AsyncStorage.getItem(pushDeviceIdKey);
  if (current) {
    return current;
  }
  const next = `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(pushDeviceIdKey, next);
  return next;
}

type PushRegistrationResult = {
  status: string;
  token: string | null;
  projectId?: string;
  deviceId?: string | null;
  appRuntimeOwner?: string;
  saved?: boolean;
  error: string | null;
  technicalError?: string | null;
};

function getTechnicalErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error ?? 'Error desconocido');
}

function getFriendlyPushError(error: unknown) {
  const message = getTechnicalErrorMessage(error);
  if (
    message.includes('Default FirebaseApp is not initialized') ||
    message.includes('fcm-credentials') ||
    message.includes('google-services')
  ) {
    return 'No se pudo inicializar push remoto en esta APK. Revisá la configuración Firebase/FCM.';
  }
  return 'No se pudo activar push remoto en este dispositivo.';
}

function notificationTitleFor(values: {
  notificationType: string;
  title: string;
  targetKind: string;
  targetValue?: string | null;
  province?: string | null;
  community?: string | null;
  sourceType?: string | null;
}) {
  if (values.notificationType.includes('privado')) {
    return 'Mensaje privado';
  }
  if (values.notificationType.includes('recordatorio') || values.sourceType === 'event') {
    return 'Recordatorio';
  }
  if (values.targetKind === 'comunidad') {
    return `Aviso comunitario · ${values.community || values.targetValue || 'Comunidad'}`;
  }
  if (values.targetKind === 'provincia') {
    return `Aviso provincial · ${values.province || values.targetValue || 'Provincia'}`;
  }
  return 'Aviso nacional · Palestra';
}

async function requestAndRegisterPushToken(session: Session | null, requestPermission: boolean) {
  if (!session?.id) {
    return { status: 'missing-session', token: null, error: 'Iniciá sesión para activar notificaciones.', technicalError: null } satisfies PushRegistrationResult;
  }
  if (Platform.OS === 'web') {
    return { status: 'web', token: null, projectId: easProjectId, deviceId: null, appRuntimeOwner, saved: false, error: 'Las notificaciones push se prueban en celular.', technicalError: null } satisfies PushRegistrationResult;
  }

  const currentPermission = await Notifications.getPermissionsAsync();
  let finalStatus = currentPermission.status;
  if (requestPermission && currentPermission.status !== 'granted') {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermission.status;
  }
  if (finalStatus !== 'granted') {
    return { status: finalStatus, token: null, projectId: easProjectId, deviceId: null, appRuntimeOwner, saved: false, error: 'Permiso de notificaciones no habilitado.', technicalError: null } satisfies PushRegistrationResult;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Palestra',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2d8dc8',
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
    });
  }

  const projectId = easProjectId;
  let tokenResult: Notifications.ExpoPushToken;
  try {
    tokenResult = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  } catch (error) {
    return {
      status: 'push-config-error',
      token: null,
      projectId,
      deviceId: null,
      appRuntimeOwner,
      saved: false,
      error: getFriendlyPushError(error),
      technicalError: getTechnicalErrorMessage(error)
    } satisfies PushRegistrationResult;
  }
  const deviceId = await getPushDeviceId();
  const { error } = await registerPushToken({
    token: tokenResult.data,
    platform: Platform.OS,
    deviceId,
    deviceName: appRuntimeOwner,
    appVersion: `${appVersionLabel} - ${appRuntimeOwner}`,
    isActive: true
  });
  if (error) {
    return { status: 'error', token: tokenResult.data, projectId, deviceId, appRuntimeOwner, saved: false, error: error.message, technicalError: error.message } satisfies PushRegistrationResult;
  }
  return { status: 'granted', token: tokenResult.data, projectId, deviceId, appRuntimeOwner, saved: true, error: null, technicalError: null } satisfies PushRegistrationResult;
}

function showFeedbackMessage(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
}

async function getAndroidChannelDebug() {
  if (Platform.OS !== 'android') {
    return 'No aplica: plataforma no Android.';
  }
  try {
    const channels = await Notifications.getNotificationChannelsAsync();
    return JSON.stringify(channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      importance: channel.importance,
      sound: channel.sound,
      vibrationPattern: channel.vibrationPattern,
      lockscreenVisibility: channel.lockscreenVisibility
    })), null, 2);
  } catch (error) {
    return error instanceof Error ? error.message : 'No pude leer canales Android.';
  }
}

function statusLabel(status: UserStatus) {
  if (status === 'aprobado') {
    return 'Aprobado';
  }
  if (status === 'bloqueado') {
    return 'Bloqueado';
  }
  return 'Pendiente de aprobación';
}

function changeDone(detail: string) {
  return `Cambio realizado. ${detail}`;
}

function isMissingProfileScope(session: Session | null) {
  if (!session || session.role === 'invitado') {
    return false;
  }
  return !session.province || session.province === 'Sin provincia' || !session.communityOfOrigin || session.communityOfOrigin === 'Sin comunidad asignada';
}

function provinceDowngradesRole(role: Role) {
  return ['animador_comunidad', 'coordinador_comunidad', 'vocal', 'asesor', 'coordinador_diocesano'].includes(role);
}

function communityDowngradesRole(role: Role) {
  return ['animador_comunidad', 'coordinador_comunidad'].includes(role);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function safeAuthError(message?: string) {
  const text = (message ?? '').toLowerCase();
  if (text.includes('invalid login') || text.includes('invalid credentials')) {
    return 'Mail o contraseña incorrectos.';
  }
  if (text.includes('email not confirmed')) {
    return 'Tu correo todavía no está confirmado.';
  }
  if (text.includes('already') || text.includes('existe')) {
    return 'Ya existe un usuario con ese correo.';
  }
  if (text.includes('password') || text.includes('contrasena')) {
    return 'Revisá la contraseña indicada.';
  }
  return 'No pudimos completar la acción. Revisá los datos e intenta nuevamente.';
}

function AppLoadingScreen() {
  const flash = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const barTravel = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(flash, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(logoScale, {
          toValue: 1.08,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        })
      ]),
      Animated.parallel([
        Animated.timing(flash, {
          toValue: 0,
          duration: 520,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 70,
          useNativeDriver: true
        })
      ])
    ]).start();

    const loop = Animated.loop(
      Animated.timing(barTravel, {
        toValue: 1,
        duration: 980,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true
      })
    );
    loop.start();

    return () => loop.stop();
  }, [barTravel, flash, logoScale]);

  const translateX = barTravel.interpolate({
    inputRange: [0, 1],
    outputRange: [-92, 230]
  });

  return (
    <View style={styles.loadingOverlay} pointerEvents="auto">
      <Animated.View style={[styles.loadingFlash, { opacity: flash }]} />
      <Animated.View style={[styles.loadingLogoFrame, { transform: [{ scale: logoScale }] }]}>
        <Image source={palestraLogo} style={styles.loadingLogo} />
      </Animated.View>
      <Text style={styles.loadingTitle}>Palestra</Text>
      <Text style={styles.loadingSubtitle}>Movimiento Catolico</Text>
      <View style={styles.loadingBarTrack}>
        <Animated.View style={[styles.loadingBarPulse, { transform: [{ translateX }] }]} />
      </View>
    </View>
  );
}

export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('inicio');
  const [tabHistory, setTabHistory] = useState<TabKey[]>(['inicio']);
  const [session, setSession] = useState<Session | null>(null);
  const [adminSessionBeforeViewAs, setAdminSessionBeforeViewAs] = useState<Session | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authScreenOpen, setAuthScreenOpen] = useState(false);
  const [profileInitialPanel, setProfileInitialPanel] = useState<ProfilePanel>('vista');
  const [touchPointer, setTouchPointer] = useState<{ x: number; y: number } | null>(null);
  const [touchPointerEnabled, setTouchPointerEnabled] = useState(false);
  const [themeName, setThemeName] = useState<ThemeName>('default');
  const [tabSettings, setTabSettings] = useState<AppTabSetting[]>([]);
  const [appContent, setAppContent] = useState<AppContentBlock[]>([]);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [adminConfig, setAdminConfig] = useState<AppAdminConfig>(defaultAdminConfig);
  const [contentVersion, setContentVersion] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshLogoVisible, setRefreshLogoVisible] = useState(false);
  const [appMessage, setAppMessage] = useState('');
  const [successToastVisible, setSuccessToastVisible] = useState(false);
  const [themeTransitionVisible, setThemeTransitionVisible] = useState(false);
  const [themeTransitionColor, setThemeTransitionColor] = useState('#2B2B2B');
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());
  const lastBackPressRef = useRef(0);
  const successToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshSpinLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const touchPointerOpacity = useRef(new Animated.Value(0)).current;
  const refreshLogoOpacity = useRef(new Animated.Value(0)).current;
  const refreshLogoTranslateY = useRef(new Animated.Value(-34)).current;
  const refreshLogoRotate = useRef(new Animated.Value(0)).current;
  const themeTransitionProgress = useRef(new Animated.Value(0)).current;
  const appTheme = themePresets[themeName] ?? themePresets.default;
  const isDarkTheme = appTheme.mode === 'dark';
  const { width: viewportWidth } = useWindowDimensions();
  const compactViewport = viewportWidth < 390;
  const veryCompactViewport = viewportWidth < 340;

  const showToastSuccess = useCallback((message = 'Cambios guardados') => {
    setAppMessage(message);
    setSuccessToastVisible(true);
    if (successToastTimerRef.current) {
      clearTimeout(successToastTimerRef.current);
    }
    successToastTimerRef.current = setTimeout(() => {
      setSuccessToastVisible(false);
      setAppMessage('');
    }, 1500);
  }, []);

  const showToastError = useCallback((message = 'No se pudo guardar') => {
    setAppMessage(message);
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
    setTimeout(() => setAppMessage(''), 1800);
  }, []);

  const currentDateTimeLabel = useMemo(() => {
    const date = currentDateTime.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = currentDateTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    return `${date} - ${time}`;
  }, [currentDateTime]);

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(touchPointerPreferenceKey)
      .then((value) => setTouchPointerEnabled(value === 'true'))
      .catch((error) => console.error('touch pointer preference', error));
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(themePreferenceKey)
      .then((value) => {
        if (value && value in themePresets) {
          setThemeName(value as ThemeName);
        }
      })
      .catch((error) => console.error('theme preference', error));
  }, []);

  async function updateThemePreference(nextTheme: ThemeName) {
    setThemeTransitionColor(nextTheme === 'dark' ? themePresets.dark.colors.background : '#E6F3F5');
    setThemeTransitionVisible(true);
    themeTransitionProgress.setValue(0);
    Animated.timing(themeTransitionProgress, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start(() => {
      setThemeName(nextTheme);
      Animated.timing(themeTransitionProgress, {
        toValue: 0,
        duration: 260,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true
      }).start(() => setThemeTransitionVisible(false));
    });
    try {
      await AsyncStorage.setItem(themePreferenceKey, nextTheme);
    } catch (error) {
      console.error('save theme preference', error);
      setAppMessage('No pude guardar el tema visual.');
      setTimeout(() => setAppMessage(''), 1800);
    }
  }

  async function updateTouchPointerPreference(value: boolean) {
    setTouchPointerEnabled(value);
    try {
      await AsyncStorage.setItem(touchPointerPreferenceKey, value ? 'true' : 'false');
    } catch (error) {
      console.error('save touch pointer preference', error);
      setAppMessage('No pude guardar la preferencia del puntero.');
      setTimeout(() => setAppMessage(''), 1800);
    }
  }

  function showTouchPointer(x: number, y: number) {
    if (!touchPointerEnabled) {
      return;
    }

    setTouchPointer({ x, y });
    Animated.timing(touchPointerOpacity, {
      toValue: 1,
      duration: 90,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();
  }

  function moveTouchPointer(x: number, y: number) {
    if (!touchPointerEnabled) {
      return;
    }

    setTouchPointer({ x, y });
  }

  function hideTouchPointer() {
    if (!touchPointerEnabled) {
      return;
    }

    Animated.timing(touchPointerOpacity, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished) {
        setTouchPointer(null);
      }
    });
  }

  function showRefreshLogo() {
    setRefreshLogoVisible(true);
    refreshLogoOpacity.setValue(0);
    refreshLogoTranslateY.setValue(-34);
    refreshLogoRotate.setValue(0);
    Animated.parallel([
      Animated.timing(refreshLogoOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      }),
      Animated.timing(refreshLogoTranslateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true
      })
    ]).start();
    const spin = Animated.loop(
      Animated.timing(refreshLogoRotate, {
        toValue: 1,
        duration: 920,
        easing: Easing.linear,
        useNativeDriver: true
      })
    );
    refreshSpinLoopRef.current = spin;
    spin.start();
  }

  function hideRefreshLogo() {
    refreshSpinLoopRef.current?.stop();
    refreshSpinLoopRef.current = null;
    Animated.parallel([
      Animated.timing(refreshLogoOpacity, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true
      }),
      Animated.timing(refreshLogoTranslateY, {
        toValue: -34,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true
      })
    ]).start(() => setRefreshLogoVisible(false));
  }

  const resolvedTabs = useMemo<AppTabDisplay[]>(() => {
    const settingsByKey = new Map(tabSettings.map((item) => [item.key, item]));
    const builtInTabs = defaultTabs.map((tab) => {
        const setting = settingsByKey.get(tab.key);
        return {
          ...tab,
          label: setting?.label ?? tab.label,
          icon: isIoniconName(setting?.icon_name) ? setting.icon_name : tab.icon,
          visible: setting?.is_visible ?? true,
          sortOrder: setting?.sort_order ?? 999,
          visibleRoles: setting?.visible_roles ?? null
        };
      });
    const customTabs = tabSettings
      .filter((setting) => !defaultTabByKey.has(setting.key))
      .map((setting) => ({
        key: setting.key,
        label: setting.label,
        icon: isIoniconName(setting.icon_name) ? setting.icon_name : 'document-text-outline' as keyof typeof Ionicons.glyphMap,
        visible: setting.is_visible,
        sortOrder: setting.sort_order,
        visibleRoles: setting.visible_roles ?? null
      }));

    return [...builtInTabs, ...customTabs]
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [tabSettings]);

  const visibleTabs = useMemo(() => {
    const currentRole = session?.role ?? 'invitado';
    const mustCompleteProfile = isMissingProfileScope(session);
    const maintenanceForUser = adminConfig.settings.maintenanceMode && currentRole !== 'administrador';
    const seen = new Set<string>();
    return resolvedTabs.filter((tab) => {
      if (tab.key === 'perfil') {
        return false;
      }
      if (maintenanceForUser) {
        return false;
      }
      if (mustCompleteProfile) {
        return false;
      }
      if (tab.key === 'periodo_motivador' && roleRank(currentRole as Role) < roleRank('sedimentador')) {
        return false;
      }
      if (!tab.visible || (tab.visibleRoles && !tab.visibleRoles.includes(currentRole)) || seen.has(tab.key)) {
        return false;
      }
      seen.add(tab.key);
      return true;
    });
  }, [resolvedTabs, session, adminConfig.settings.maintenanceMode]);

  const drawerWidth = Math.min(348, Math.max(286, viewportWidth * 0.86));
  const drawerItems = useMemo(() => {
    const items: Array<{
      key: string;
      label: string;
      icon: keyof typeof Ionicons.glyphMap;
      action: () => void;
      active: boolean;
      meta?: string;
    }> = visibleTabs.map((tab) => ({
      key: tab.key,
      label: tab.label,
      icon: tab.icon,
      active: activeTab === tab.key,
      action: () => navigateToTab(tab.key)
    }));

    items.push({
      key: 'perfil',
      label: session ? 'Perfil' : 'Ingresar',
      icon: 'person-circle-outline',
      active: activeTab === 'perfil' && profileInitialPanel === 'vista',
      action: () => {
        if (!session) {
          setDrawerOpen(false);
          setAuthScreenOpen(true);
          return;
        }
        setProfileInitialPanel('vista');
        navigateToTab('perfil');
      }
    });

    if (canAccessPrivate(session)) {
      items.push({
        key: 'mi_comunidad',
        label: 'Mi Comunidad',
        icon: 'people-circle-outline',
        active: activeTab === 'perfil' && profileInitialPanel === 'comunidad',
        meta: session?.communityOfOrigin,
        action: () => {
          setProfileInitialPanel('comunidad');
          navigateToTab('perfil');
        }
      });
    }

    if (canManageUsersPanel(session) || isCommunityLeaderRole(session)) {
      items.push({
        key: 'panel_dirigencial',
        label: 'Panel Dirigencial',
        icon: 'shield-checkmark-outline',
        active: activeTab === 'perfil' && profileInitialPanel === 'vista',
        meta: 'Gestión interna',
        action: () => {
          setProfileInitialPanel('vista');
          navigateToTab('perfil');
        }
      });
    }

    return items;
  }, [visibleTabs, activeTab, profileInitialPanel, session]);

  const tabLabel = (key: TabKey) => resolvedTabs.find((tab) => tab.key === key)?.label ?? defaultTabs.find((tab) => tab.key === key)?.label ?? key;
  const pageEditorProps = (key: TabKey): PageEditorProps => ({
    tabKey: key,
    title: tabLabel(key),
    content: appContent.find((item) => item.tab_key === key),
    tab: resolvedTabs.find((tab) => tab.key === key),
    isAdmin: canEditPageContent(session, key),
    contentLoaded,
    onContentChanged: refreshPublishedContent,
    onTabsChanged: reloadTabSettings
  });

  async function reloadTabSettings() {
    const items = await fetchAppTabs();
    setTabSettings(items);
  }

  async function reloadAppContent() {
    const items = await fetchAppContent();
    setAppContent(items);
    setContentLoaded(true);
  }

  async function reloadAdminConfig() {
    const config = await fetchAdminConfig();
    if (config) {
      setAdminConfig(normalizeAdminConfig(config as Partial<AppAdminConfig>));
    }
  }

  async function refreshPublishedContent() {
    await reloadAppContent();
    setContentVersion((current) => current + 1);
  }

  async function hydrateRealSession() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return;
    }

    const result = await getMyProfileSession(data.user.email ?? 'Usuario');
    if (result.session) {
      setSession(result.session);
      setAdminSessionBeforeViewAs(null);
    }
  }

  function startAdminViewAs(nextSession: Session) {
    if (session?.role !== 'administrador') {
      showToastError('Solo Administrador puede usar Ver como.');
      return;
    }
    setAdminSessionBeforeViewAs(session);
    setSession({
      ...nextSession,
      id: undefined,
      email: undefined
    });
    setActiveTab('inicio');
    setTabHistory(['inicio']);
    showToastSuccess('Modo Ver como activado');
  }

  function stopAdminViewAs() {
    if (!adminSessionBeforeViewAs) {
      return;
    }
    setSession(adminSessionBeforeViewAs);
    setAdminSessionBeforeViewAs(null);
    setActiveTab('perfil');
    setTabHistory(['perfil']);
    showToastSuccess('Volviste a Administrador');
  }

  async function refreshAppContent(source = 'manual') {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    if (source === 'manual') {
      showRefreshLogo();
    }
    try {
      await Promise.all([
        reloadTabSettings(),
        reloadAppContent(),
        reloadAdminConfig(),
        hydrateRealSession()
      ]);
      setContentVersion((current) => current + 1);
    } catch (error) {
      console.error('refreshAppContent', error);
      setAppMessage(error instanceof Error ? error.message : 'No pude actualizar. Revisa la conexion.');
    } finally {
      setIsRefreshing(false);
      if (source === 'manual') {
        hideRefreshLogo();
      }
    }
  }

  function navigateToTab(nextTab: TabKey) {
    setDrawerOpen(false);
    if (!session && nextTab === 'perfil') {
      setAuthScreenOpen(true);
      return;
    }
    if (isMissingProfileScope(session) && nextTab !== 'perfil') {
      setActiveTab('perfil');
      setTabHistory(['perfil']);
      setAppMessage('Completa provincia y comunidad para usar la app.');
      setTimeout(() => setAppMessage(''), 2200);
      return;
    }
    if (nextTab !== 'perfil') {
      setProfileInitialPanel('vista');
    }
    if (nextTab === activeTab) {
      return;
    }
    setTabHistory((current) => [...current.filter((item, index) => index === current.length - 1 || item !== nextTab), nextTab]);
    setActiveTab(nextTab);
  }

  function goBackInApp() {
    if (drawerOpen) {
      setDrawerOpen(false);
      return true;
    }

    if (tabHistory.length > 1) {
      const nextHistory = tabHistory.slice(0, -1);
      const previousTab = nextHistory[nextHistory.length - 1] ?? 'inicio';
      setTabHistory(nextHistory);
      setActiveTab(previousTab);
      return true;
    }

    if (activeTab !== 'inicio') {
      setTabHistory(['inicio']);
      setActiveTab('inicio');
      return true;
    }

    const now = Date.now();
    if (now - lastBackPressRef.current < 1800) {
      return false;
    }

    lastBackPressRef.current = now;
    const message = 'Presiona nuevamente para salir';
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
    setAppMessage(message);
    setTimeout(() => setAppMessage(''), 1800);
    return true;
  }

  useEffect(() => {
    hydrateRealSession();
    reloadTabSettings();
    reloadAppContent();
    reloadAdminConfig();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, authSession) => {
      if (!authSession?.user) {
        setSession(null);
        setAdminSessionBeforeViewAs(null);
      }
      if (authSession?.user) {
        hydrateRealSession();
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', goBackInApp);
    return () => subscription.remove();
  }, [activeTab, tabHistory, drawerOpen]);

  useEffect(() => {
    if (isMissingProfileScope(session) && activeTab !== 'perfil') {
      setActiveTab('perfil');
      setTabHistory(['perfil']);
    }
  }, [session, activeTab]);

  useEffect(() => {
    if (!session && activeTab === 'perfil') {
      setActiveTab('inicio');
      setTabHistory(['inicio']);
      setAuthScreenOpen(true);
    }
  }, [session, activeTab]);

  useEffect(() => {
    let alive = true;

    async function registerDeviceForPushNotifications() {
      if (!session?.id) {
        return;
      }
      try {
        const result = await requestAndRegisterPushToken(session, true);
        if (!alive || result.status !== 'granted') {
          return;
        }
      } catch (error) {
        console.error('register push token', error);
      }
    }

    registerDeviceForPushNotifications();
    return () => {
      alive = false;
    };
  }, [session?.id]);

  useEffect(() => {
    screenOpacity.setValue(0.88);
    Animated.timing(screenOpacity, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();
  }, [activeTab, screenOpacity]);

  const screen = useMemo(() => {
    if (adminConfig.settings.maintenanceMode && session?.role !== 'administrador' && activeTab !== 'perfil' && !(adminConfig.settings.futureForumEnabled && activeTab === 'foro')) {
      return <MaintenanceScreen adminConfig={adminConfig} onNavigate={navigateToTab} />;
    }
    if (activeTab === 'inicio') {
      return <HomeScreen session={session} title={tabLabel('inicio')} content={appContent.find((item) => item.tab_key === 'inicio')} refreshKey={contentVersion} editor={pageEditorProps('inicio')} onNavigate={navigateToTab} adminConfig={adminConfig} />;
    }
    if (activeTab === 'notilestra') {
      return <NotilestraScreen session={session} title={tabLabel('notilestra')} content={appContent.find((item) => item.tab_key === 'notilestra')} refreshKey={contentVersion} editor={pageEditorProps('notilestra')} adminConfig={adminConfig} />;
    }
    if (activeTab === 'materiales') {
      return <MaterialsScreen session={session} title={tabLabel('materiales')} content={appContent.find((item) => item.tab_key === 'materiales')} refreshKey={contentVersion} editor={pageEditorProps('materiales')} />;
    }
    if (activeTab === 'oraciones') {
      return <LibrarySectionScreen session={session} title={tabLabel('oraciones')} section="oraciones" variant="prayer" content={appContent.find((item) => item.tab_key === 'oraciones')} editor={pageEditorProps('oraciones')} />;
    }
    if (activeTab === 'cancionero') {
      return <LibrarySectionScreen session={session} title={tabLabel('cancionero')} section="cancionero" variant="song" content={appContent.find((item) => item.tab_key === 'cancionero')} editor={pageEditorProps('cancionero')} />;
    }
    if (activeTab === 'himno') {
      return <LibrarySectionScreen session={session} title={tabLabel('himno')} section="himno" variant="song" content={appContent.find((item) => item.tab_key === 'himno')} editor={pageEditorProps('himno')} />;
    }
    if (activeTab === 'comunidades') {
      return <CommunitiesScreen session={session} title={tabLabel('comunidades')} content={appContent.find((item) => item.tab_key === 'comunidades')} refreshKey={contentVersion} editor={pageEditorProps('comunidades')} />;
    }
    if (activeTab === 'historia') {
      return <HistoryScreen title={tabLabel('historia')} content={appContent.find((item) => item.tab_key === 'historia')} editor={pageEditorProps('historia')} />;
    }
    if (activeTab === 'contacto') {
      return <ContactScreen adminConfig={adminConfig} title={tabLabel('contacto')} content={appContent.find((item) => item.tab_key === 'contacto')} editor={pageEditorProps('contacto')} />;
    }
    if (activeTab === 'periodo_motivador') {
      return <MotivadorScreen session={session} title={tabLabel('periodo_motivador')} content={appContent.find((item) => item.tab_key === 'periodo_motivador')} refreshKey={contentVersion} editor={pageEditorProps('periodo_motivador')} adminConfig={adminConfig} />;
    }
    if (activeTab === 'foro') {
      return <ForumScreen session={session} title="Foro" />;
    }
    if (activeTab !== 'perfil') {
      return <GenericPageScreen title={tabLabel(activeTab)} content={appContent.find((item) => item.tab_key === activeTab)} editor={pageEditorProps(activeTab)} />;
    }
    return <ProfileScreen session={session} onSessionChange={setSession} tabs={resolvedTabs} appContent={appContent} adminConfig={adminConfig} touchPointerEnabled={touchPointerEnabled} onTouchPointerEnabledChange={updateTouchPointerPreference} themeName={themeName} appTheme={appTheme} onThemeChange={updateThemePreference} onAdminConfigChange={setAdminConfig} onTabsChanged={reloadTabSettings} onContentChanged={refreshPublishedContent} onNavigate={navigateToTab} onSavedFeedback={showToastSuccess} onErrorFeedback={showToastError} onViewAsSession={startAdminViewAs} initialPanel={profileInitialPanel} />;
  }, [activeTab, session, resolvedTabs, appContent, contentVersion, adminConfig, touchPointerEnabled, themeName, appTheme, profileInitialPanel]);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[styles.safeArea, isDarkTheme && styles.safeAreaDark]}
        onTouchStart={(event) => {
          const { pageX, pageY } = event.nativeEvent;
          showTouchPointer(pageX, pageY);
        }}
        onTouchMove={(event) => {
          const { pageX, pageY } = event.nativeEvent;
          moveTouchPointer(pageX, pageY);
        }}
        onTouchEnd={hideTouchPointer}
        onTouchCancel={hideTouchPointer}
        onTouchEndCapture={(event) => {
          const { pageX, pageY } = event.nativeEvent;
          if (touchPointerEnabled && pageX && pageY) {
            moveTouchPointer(pageX, pageY);
          }
        }}
      >
        {isBooting ? <AppLoadingScreen /> : null}
        {authScreenOpen && !session ? (
          <AuthScreen
            onClose={() => setAuthScreenOpen(false)}
            onAuthenticated={(nextSession) => {
              setSession(nextSession);
              setAuthScreenOpen(false);
              setActiveTab('inicio');
              setTabHistory(['inicio']);
            }}
          />
        ) : null}
        {touchPointer && touchPointerEnabled ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.tapCircle,
              {
                left: touchPointer.x - 24,
                top: touchPointer.y - 24,
                opacity: touchPointerOpacity,
                transform: [
                  {
                    scale: touchPointerOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.82, 1]
                    })
                  }
                ]
              }
            ]}
          />
        ) : null}
        <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
        <View style={[styles.header, isDarkTheme && styles.headerDark]}>
          <TouchableOpacity style={styles.brandBlock} onPress={() => navigateToTab('inicio')} activeOpacity={0.85}>
            <View style={styles.brandLogo}>
              <Image source={palestraLogo} style={styles.brandLogoImage} />
            </View>
            <View style={styles.brandTextBlock}>
              <Text numberOfLines={1} style={[styles.brand, isDarkTheme && styles.brandDark]}>{adminConfig.identity.appName}</Text>
              <Text numberOfLines={1} style={[styles.subtitle, isDarkTheme && styles.subtitleDark]}>{adminConfig.identity.subtitle}</Text>
              <Text numberOfLines={1} style={styles.versionBadge}>{appVersionLabel}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <View style={styles.headerActionTop}>
              <TouchableOpacity style={[styles.headerProfileButton, isDarkTheme && styles.headerPillDark]} onPress={() => navigateToTab('perfil')} activeOpacity={0.85}>
                <Ionicons name="person-circle-outline" size={17} color={palette.red} />
                {!veryCompactViewport ? <Text style={styles.headerProfileButtonText}>{session ? 'Mi Perfil' : 'Ingresar'}</Text> : null}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerMenuButton, isDarkTheme && styles.headerPillDark]} onPress={() => setDrawerOpen(true)} activeOpacity={0.85}>
                <Ionicons name="menu-outline" size={22} color={palette.red} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <Modal visible={drawerOpen} transparent animationType="fade" onRequestClose={() => setDrawerOpen(false)}>
          <View style={styles.drawerOverlay}>
            <Pressable style={styles.drawerBackdrop} onPress={() => setDrawerOpen(false)} />
            <View style={[styles.drawerPanel, isDarkTheme && styles.drawerPanelDark, { width: drawerWidth }]}>
              <View style={styles.drawerHeader}>
                <View style={styles.drawerLogo}>
                  <Image source={palestraLogo} style={styles.brandLogoImage} />
                </View>
                <View style={styles.drawerHeaderText}>
                  <Text numberOfLines={1} style={[styles.drawerTitle, isDarkTheme && styles.drawerTitleDark]}>Palestra</Text>
                  <Text numberOfLines={1} style={[styles.drawerSubtitle, isDarkTheme && styles.drawerSubtitleDark]}>{session ? displayRoleLabel(session.role, session.province, [], [], null, session.genderPreference) : 'Invitado'}</Text>
                </View>
                <TouchableOpacity style={[styles.drawerCloseButton, isDarkTheme && styles.drawerCloseButtonDark]} onPress={() => setDrawerOpen(false)} activeOpacity={0.85}>
                  <Ionicons name="close-outline" size={22} color={isDarkTheme ? themePresets.dark.colors.text : palette.ink} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.drawerScroll} contentContainerStyle={styles.drawerScrollContent} showsVerticalScrollIndicator={false}>
                {drawerItems.map((item) => (
                  <TouchableOpacity key={item.key} style={[styles.drawerItem, isDarkTheme && styles.drawerItemDark, item.active && styles.drawerItemActive, item.active && isDarkTheme && styles.drawerItemActiveDark]} onPress={item.action} activeOpacity={0.84}>
                    <View style={[styles.drawerIconFrame, isDarkTheme && styles.drawerIconFrameDark, item.active && styles.drawerIconFrameActive]}>
                      <Ionicons name={item.icon} size={20} color={item.active ? palette.white : palette.red} />
                    </View>
                    <View style={styles.drawerItemTextBlock}>
                      <Text numberOfLines={1} style={[styles.drawerItemText, isDarkTheme && styles.drawerItemTextDark, item.active && styles.drawerItemTextActive]}>{item.label}</Text>
                      {item.meta ? <Text numberOfLines={1} style={[styles.drawerItemMeta, isDarkTheme && styles.drawerItemMetaDark]}>{item.meta}</Text> : null}
                    </View>
                    {item.active ? <Ionicons name="ellipse" size={8} color={palette.red} /> : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
        {adminSessionBeforeViewAs ? (
          <View style={styles.viewAsBanner}>
            <Ionicons name="eye-outline" size={17} color={palette.white} />
            <Text style={styles.viewAsBannerText}>Ver como: {roleLabel(session?.role ?? 'invitado', session?.genderPreference)}</Text>
            <TouchableOpacity style={styles.viewAsExitButton} onPress={stopAdminViewAs}>
              <Text style={styles.viewAsExitText}>Volver a Administrador</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {successToastVisible ? (
          <View pointerEvents="none" style={styles.successToastOverlay}>
            <View style={styles.successToastCard}>
              <Ionicons name="checkmark-circle" size={22} color={palette.white} />
              <Text style={styles.successToastText}>Cambios guardados</Text>
            </View>
          </View>
        ) : null}
        {appMessage && !successToastVisible ? (
          <View pointerEvents="none" style={styles.appToast}>
            <Text style={styles.appToastText}>{appMessage}</Text>
          </View>
        ) : null}
        {refreshLogoVisible ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.refreshLogoIndicator,
              isDarkTheme && styles.refreshLogoIndicatorDark,
              {
                opacity: refreshLogoOpacity,
                transform: [
                  { translateY: refreshLogoTranslateY },
                  {
                    rotate: refreshLogoRotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    })
                  }
                ]
              }
            ]}
          >
            <Image source={palestraLogo} style={styles.refreshLogoImage} />
          </Animated.View>
        ) : null}
        {themeTransitionVisible ? (
          <View pointerEvents="none" style={styles.themeTransitionLayer}>
            <Animated.View
              style={[
                styles.themePaintSplash,
                {
                  backgroundColor: themeTransitionColor,
                  opacity: themeTransitionProgress.interpolate({
                    inputRange: [0, 0.08, 1],
                    outputRange: [0, 1, 1]
                  }),
                  transform: [
                    {
                      scale: themeTransitionProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.18, 18]
                      })
                    }
                  ]
                }
              ]}
            />
            <Animated.View
              style={[
                styles.themePaintDrop,
                styles.themePaintDropOne,
                {
                  backgroundColor: themeTransitionColor,
                  opacity: themeTransitionProgress.interpolate({
                    inputRange: [0, 0.2, 1],
                    outputRange: [0, 0.75, 0.2]
                  }),
                  transform: [
                    {
                      scale: themeTransitionProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.1, 3.6]
                      })
                    }
                  ]
                }
              ]}
            />
            <Animated.View
              style={[
                styles.themePaintDrop,
                styles.themePaintDropTwo,
                {
                  backgroundColor: themeTransitionColor,
                  opacity: themeTransitionProgress.interpolate({
                    inputRange: [0, 0.28, 1],
                    outputRange: [0, 0.64, 0.16]
                  }),
                  transform: [
                    {
                      scale: themeTransitionProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.1, 2.9]
                      })
                    }
                  ]
                }
              ]}
            />
          </View>
        ) : null}
        <ScrollView
          contentContainerStyle={[styles.content, isDarkTheme && styles.contentDark]}
          keyboardShouldPersistTaps="handled"
          refreshControl={(
            <RefreshControl
              refreshing={false}
              onRefresh={() => refreshAppContent('manual')}
              tintColor="transparent"
              colors={['transparent']}
              progressBackgroundColor="transparent"
            />
          )}
        >
          <Animated.View style={{ opacity: screenOpacity }}>
            {screen}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

type RegisterDraft = {
  firstName: string;
  lastName: string;
  birthDate: string;
  nickname: string;
  contact: string;
  province: string;
  community: string;
  email: string;
  password: string;
  genderPreference: 'male' | 'female' | null;
};

function AuthScreen({ onClose, onAuthenticated }: { onClose: () => void; onAuthenticated: (session: Session) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [authMessage, setAuthMessage] = useState('');

  async function resolveSession(email: string) {
    const result = await getMyProfileSession(email);
    if (result.error || !result.session) {
      setAuthMessage(result.error ?? 'No pude leer tu perfil.');
      return;
    }
    if (result.session.status === 'bloqueado') {
      await supabase.auth.signOut();
      setAuthMessage('Este usuario está bloqueado. Contactá a un dirigente.');
      return;
    }
    onAuthenticated(result.session);
  }

  return (
    <View style={styles.authFullscreen}>
      <View style={styles.authGlowOne} />
      <View style={styles.authGlowTwo} />
      <TouchableOpacity style={styles.authCloseButton} onPress={onClose} activeOpacity={0.85}>
        <Ionicons name="close-outline" size={24} color={palette.white} />
      </TouchableOpacity>
      {mode === 'login' ? (
        <LoginScreen
          message={authMessage}
          onMessage={setAuthMessage}
          onAuthenticated={resolveSession}
          onRegister={() => {
            setAuthMessage('');
            setMode('register');
          }}
        />
      ) : (
        <RegisterWizard
          message={authMessage}
          onMessage={setAuthMessage}
          onBackToLogin={() => {
            setAuthMessage('');
            setMode('login');
          }}
          onRegistered={resolveSession}
        />
      )}
    </View>
  );
}

function LoginScreen({ message, onMessage, onAuthenticated, onRegister }: { message: string; onMessage: (message: string) => void; onAuthenticated: (email: string) => Promise<void>; onRegister: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submitLogin() {
    if (!isValidEmail(email)) {
      onMessage('Ingresá un mail válido.');
      return;
    }
    if (!password) {
      onMessage('Ingresá tu contraseña.');
      return;
    }
    setLoading(true);
    onMessage('Iniciando sesión...');
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error || !data.user) {
      onMessage(safeAuthError(error?.message));
      return;
    }
    await onAuthenticated(email.trim());
  }

  async function recoverPassword() {
    if (!isValidEmail(email)) {
      onMessage('Escribí tu mail para enviarte la recuperación.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    onMessage(error ? safeAuthError(error.message) : 'Te enviamos un mail para recuperar la contraseña.');
  }

  return (
    <ScrollView contentContainerStyle={styles.authScrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.authBrandHeader}>
        <Image source={palestraLogo} style={styles.authLogo} />
        <Text style={styles.authBrandTitle}>Palestra</Text>
        <Text style={styles.authBrandSubtitle}>Movimiento Católico</Text>
      </View>
      <Text style={styles.authHeroTitle}>Bienvenido/a, ¿iniciamos sesión?</Text>
      <Text style={styles.authHeroText}>Qué alegría volver a encontrarte en este camino.</Text>

      <View style={styles.authFormPanel}>
        <AuthTextInput label="Mail" placeholder="tu.mail@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <View>
          <Text style={styles.authInputLabel}>Contraseña</Text>
          <View style={styles.authPasswordWrap}>
            <TextInput
              style={styles.authInputPassword}
              placeholder="Ingresá tu contraseña"
              placeholderTextColor="rgba(230,243,245,0.62)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.authEyeButton} onPress={() => setPasswordVisible(!passwordVisible)}>
              <Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={palette.white} />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.authPrimaryButton} onPress={submitLogin} disabled={loading} activeOpacity={0.86}>
          <Text style={styles.authPrimaryText}>{loading ? 'Ingresando...' : 'Iniciar sesión'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.authGhostButton} onPress={onRegister} activeOpacity={0.86}>
          <Text style={styles.authGhostText}>Registrarme</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={recoverPassword} activeOpacity={0.75}>
          <Text style={styles.authLinkText}>Olvidé mi contraseña</Text>
        </TouchableOpacity>
        {message ? <Text style={styles.authMessage}>{message}</Text> : null}
      </View>
    </ScrollView>
  );
}

function RegisterWizard({ message, onMessage, onBackToLogin, onRegistered }: { message: string; onMessage: (message: string) => void; onBackToLogin: () => void; onRegistered: (email: string) => Promise<void> }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<RegisterDraft>({
    firstName: '',
    lastName: '',
    birthDate: '',
    nickname: '',
    contact: '',
    province: '',
    community: '',
    email: '',
    password: '',
    genderPreference: null
  });
  const [registrationCommunities, setRegistrationCommunities] = useState<AppCommunity[]>(communities);
  const [loading, setLoading] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const selectedProvince = registrationCommunities.find((item) => item.province === draft.province);

  useEffect(() => {
    fetchCommunities().then((items) => {
      if (items.length > 0) {
        setRegistrationCommunities(items);
      }
    });
  }, []);

  useEffect(() => {
    fade.setValue(0.75);
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();
  }, [step, fade]);

  function patchDraft(values: Partial<RegisterDraft>) {
    setDraft((current) => ({ ...current, ...values }));
    onMessage('');
  }

  function validateStep() {
    if (step === 0 && (!draft.firstName.trim() || !draft.lastName.trim())) {
      onMessage('Completá nombre y apellido para continuar.');
      return false;
    }
    if (step === 1 && (!draft.birthDate || !draft.contact.trim())) {
      onMessage('Completá fecha de nacimiento y contacto.');
      return false;
    }
    if (step === 2) {
      if (!draft.province || !draft.community) {
        onMessage('Elegí provincia y comunidad.');
        return false;
      }
      if (!isValidEmail(draft.email)) {
        onMessage('Ingresá un mail válido.');
        return false;
      }
      if (draft.password.length < 6) {
        onMessage('La contraseña debe tener al menos 6 caracteres.');
        return false;
      }
    }
    if (step === 3 && !draft.genderPreference) {
      onMessage('Elegí una opción narrativa para personalizar el saludo.');
      return false;
    }
    return true;
  }

  async function nextStep() {
    if (!validateStep()) {
      return;
    }
    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }
    setLoading(true);
    onMessage('Creando tu registro...');
    const fullName = `${draft.firstName.trim()} ${draft.lastName.trim()}`.trim();
    const { data, error } = await supabase.auth.signUp({
      email: draft.email.trim(),
      password: draft.password,
      options: {
        data: {
          full_name: fullName,
          first_name: draft.firstName.trim(),
          last_name: draft.lastName.trim(),
          birth_date: draft.birthDate,
          nickname: draft.nickname.trim(),
          phone: draft.contact.trim(),
          province: draft.province.trim(),
          community_name: draft.community.trim(),
          gender_preference: draft.genderPreference
        }
      }
    });
    setLoading(false);
    if (error || !data.user) {
      onMessage(safeAuthError(error?.message));
      return;
    }
    if (data.session) {
      await onRegistered(draft.email.trim());
      return;
    }
    onMessage('Registro creado como Palestrista pendiente. Confirmá el mail o esperá la habilitación dirigencial.');
  }

  return (
    <View style={styles.authWizardShell}>
      <View style={styles.authWizardTop}>
        <TouchableOpacity style={styles.authBackButton} onPress={step === 0 ? onBackToLogin : () => setStep((current) => Math.max(0, current - 1))}>
          <Ionicons name="arrow-back-outline" size={20} color={palette.white} />
          <Text style={styles.authBackText}>{step === 0 ? 'Iniciar sesión' : 'Atrás'}</Text>
        </TouchableOpacity>
        <Text style={styles.authProgressText}>Página {step + 1} de 4</Text>
      </View>
      <Animated.View style={[styles.authWizardCard, { opacity: fade }]}>
        {step === 0 ? <RegisterStepName draft={draft} onChange={patchDraft} /> : null}
        {step === 1 ? <RegisterStepAbout draft={draft} onChange={patchDraft} /> : null}
        {step === 2 ? <RegisterStepCommunity draft={draft} onChange={patchDraft} provinces={registrationCommunities} selectedProvince={selectedProvince} /> : null}
        {step === 3 ? <RegisterStepNarrative draft={draft} onChange={patchDraft} /> : null}
      </Animated.View>
      {message ? <Text style={styles.authMessage}>{message}</Text> : null}
      <TouchableOpacity style={styles.authPrimaryButton} onPress={nextStep} disabled={loading} activeOpacity={0.86}>
        <Text style={styles.authPrimaryText}>{step === 3 ? (loading ? 'Registrando...' : 'Crear cuenta') : 'Continuar'}</Text>
      </TouchableOpacity>
      <View style={styles.authStepDots}>
        {[0, 1, 2, 3].map((item) => <View key={item} style={[styles.authStepDot, item === step && styles.authStepDotActive]} />)}
      </View>
    </View>
  );
}

function RegisterStepName({ draft, onChange }: { draft: RegisterDraft; onChange: (values: Partial<RegisterDraft>) => void }) {
  return (
    <View style={styles.authStepContent}>
      <Text style={styles.authHeroTitle}>¿Cómo te llamás?</Text>
      <Text style={styles.authHeroText}>Antes de comenzar esta aventura, nos gustaría saber quién sos y conocer un poco más de vos.</Text>
      <AuthTextInput label="Nombre" placeholder="Ej: Lucas" value={draft.firstName} onChangeText={(value) => onChange({ firstName: value })} />
      <AuthTextInput label="Apellido" placeholder="Ej: Quiroga" value={draft.lastName} onChangeText={(value) => onChange({ lastName: value })} />
    </View>
  );
}

function RegisterStepAbout({ draft, onChange }: { draft: RegisterDraft; onChange: (values: Partial<RegisterDraft>) => void }) {
  return (
    <View style={styles.authStepContent}>
      <Text style={styles.authHeroTitle}>Acerca de ti</Text>
      <Text style={styles.authHeroText}>Esto nos permitirá conocerte un poco mejor y preparar esta aventura para ti.</Text>
      <BirthDatePicker value={draft.birthDate} onChange={(birthDate) => onChange({ birthDate })} />
      <AuthTextInput label="Apodo" placeholder="Como te dicen en tu comunidad" value={draft.nickname} onChangeText={(value) => onChange({ nickname: value })} />
      <AuthTextInput label="Contacto" placeholder="Teléfono o contacto personal" value={draft.contact} onChangeText={(value) => onChange({ contact: value })} keyboardType="phone-pad" />
    </View>
  );
}

function RegisterStepCommunity({ draft, onChange, provinces, selectedProvince }: { draft: RegisterDraft; onChange: (values: Partial<RegisterDraft>) => void; provinces: AppCommunity[]; selectedProvince?: AppCommunity }) {
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  return (
    <View style={styles.authStepContent}>
      <Text style={styles.authHeroTitle}>Comunidad y acceso</Text>
      <Text style={styles.authHeroText}>Elegí tu lugar de origen y prepará tus datos de ingreso.</Text>
      <AuthSelect label="Provincia" value={draft.province || 'Seleccioná tu provincia'} open={provinceOpen} onToggle={() => setProvinceOpen(!provinceOpen)}>
        {provinces.map((item) => (
          <TouchableOpacity key={item.province} style={styles.authSelectItem} onPress={() => { onChange({ province: item.province, community: '' }); setProvinceOpen(false); setCommunityOpen(false); }}>
            <Text style={styles.authSelectItemText}>{provinceDisplayNames[item.province] ?? item.province}</Text>
          </TouchableOpacity>
        ))}
      </AuthSelect>
      {selectedProvince ? (
        <AuthSelect label="Comunidad" value={draft.community || 'Seleccioná tu comunidad'} open={communityOpen} onToggle={() => setCommunityOpen(!communityOpen)}>
          {selectedProvince.locations.map((item) => (
            <TouchableOpacity key={item.name} style={styles.authSelectItem} onPress={() => { onChange({ community: item.name }); setCommunityOpen(false); }}>
              <Text style={styles.authSelectItemText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </AuthSelect>
      ) : null}
      <AuthTextInput label="Mail" placeholder="tu.mail@email.com" value={draft.email} onChangeText={(value) => onChange({ email: value })} keyboardType="email-address" autoCapitalize="none" />
      <AuthTextInput label="Contraseña" placeholder="Mínimo 6 caracteres" value={draft.password} onChangeText={(value) => onChange({ password: value })} secureTextEntry autoCapitalize="none" />
    </View>
  );
}

function RegisterStepNarrative({ draft, onChange }: { draft: RegisterDraft; onChange: (values: Partial<RegisterDraft>) => void }) {
  return (
    <View style={styles.authStepContent}>
      <Text style={styles.authHeroTitle}>Narrativa</Text>
      <Text style={styles.authHeroText}>Esto nos ayuda a hablarte con una cercanía más personal dentro de la app.</Text>
      {(['male', 'female'] as const).map((value) => {
        const narrative = genderNarratives[value];
        const selected = draft.genderPreference === value;
        return (
          <TouchableOpacity key={value} style={[styles.authNarrativeCard, selected && styles.authNarrativeCardActive]} onPress={() => onChange({ genderPreference: value })} activeOpacity={0.86}>
            <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={selected ? palette.white : 'rgba(230,243,245,0.72)'} />
            <View style={styles.authNarrativeTextBlock}>
              <Text style={[styles.authNarrativeTitle, selected && styles.authNarrativeTitleActive]}>{narrative.title}</Text>
              <Text style={[styles.authNarrativeText, selected && styles.authNarrativeTextActive]}>{narrative.text}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function AuthTextInput(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, style, ...inputProps } = props;
  return (
    <View>
      <Text style={styles.authInputLabel}>{label}</Text>
      <TextInput {...inputProps} style={[styles.authInput, style]} placeholderTextColor="rgba(230,243,245,0.62)" />
    </View>
  );
}

function AuthSelect({ label, value, open, onToggle, children }: { label: string; value: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.authInputLabel}>{label}</Text>
      <TouchableOpacity style={styles.authSelectButton} onPress={onToggle} activeOpacity={0.84}>
        <Text numberOfLines={1} style={styles.authSelectText}>{value}</Text>
        <Ionicons name={open ? 'chevron-up-outline' : 'chevron-down-outline'} size={18} color={palette.white} />
      </TouchableOpacity>
      {open ? <ScrollView style={styles.authSelectList} nestedScrollEnabled>{children}</ScrollView> : null}
    </View>
  );
}

function BirthDatePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'days' | 'months' | 'years'>('days');
  const [month, setMonth] = useState(() => new Date(2000, 0, 1));
  const yearRangeStart = Math.floor(month.getFullYear() / 16) * 16;
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const firstDay = (first.getDay() + 6) % 7;
  const totalDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const selectedLabel = value ? new Date(`${value}T12:00:00`).toLocaleDateString('es-AR') : 'Seleccioná tu fecha';

  function selectDay(day: number) {
    const date = new Date(month.getFullYear(), month.getMonth(), day, 12);
    onChange(date.toISOString().slice(0, 10));
    setOpen(false);
    setMode('days');
  }

  return (
    <View>
      <Text style={styles.authInputLabel}>Fecha de nacimiento</Text>
      <TouchableOpacity style={styles.authSelectButton} onPress={() => setOpen(!open)} activeOpacity={0.84}>
        <Text style={styles.authSelectText}>{selectedLabel}</Text>
        <Ionicons name="calendar-outline" size={18} color={palette.white} />
      </TouchableOpacity>
      {open ? (
        <View style={styles.birthCalendar}>
          <View style={styles.birthCalendarHeader}>
            <TouchableOpacity onPress={() => {
              if (mode === 'years') {
                setMonth((current) => new Date(current.getFullYear() - 16, current.getMonth(), 1));
              } else {
                setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
              }
            }}>
              <Ionicons name="chevron-back-outline" size={20} color={palette.white} />
            </TouchableOpacity>
            <View style={styles.birthCalendarTitleGroup}>
              <TouchableOpacity onPress={() => setMode(mode === 'months' ? 'days' : 'months')}>
                <Text style={styles.birthCalendarTitle}>{mode === 'years' ? `${yearRangeStart} - ${yearRangeStart + 15}` : monthNames[month.getMonth()]}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode(mode === 'years' ? 'days' : 'years')}>
                <Text style={styles.birthCalendarYear}>{month.getFullYear()}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => {
              if (mode === 'years') {
                setMonth((current) => new Date(current.getFullYear() + 16, current.getMonth(), 1));
              } else {
                setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
              }
            }}>
              <Ionicons name="chevron-forward-outline" size={20} color={palette.white} />
            </TouchableOpacity>
          </View>
          {mode === 'days' ? (
            <View style={styles.birthCalendarGrid}>
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => <Text key={`${day}-${index}`} style={styles.birthWeekday}>{day}</Text>)}
              {Array.from({ length: firstDay }).map((_, index) => <View key={`empty-${index}`} style={styles.birthDay} />)}
              {Array.from({ length: totalDays }).map((_, index) => {
                const day = index + 1;
                const dateValue = new Date(month.getFullYear(), month.getMonth(), day, 12).toISOString().slice(0, 10);
                const selected = dateValue === value;
                return (
                  <TouchableOpacity key={day} style={[styles.birthDay, selected && styles.birthDaySelected]} onPress={() => selectDay(day)}>
                    <Text style={[styles.birthDayText, selected && styles.birthDayTextSelected]}>{day}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
          {mode === 'months' ? (
            <View style={styles.birthPickerGrid}>
              {Array.from({ length: 12 }).map((_, index) => {
                const selected = month.getMonth() === index;
                return (
                  <TouchableOpacity key={index} style={[styles.birthPickerCell, selected && styles.birthDaySelected]} onPress={() => { setMonth((current) => new Date(current.getFullYear(), index, 1)); setMode('days'); }}>
                    <Text style={[styles.birthDayText, selected && styles.birthDayTextSelected]}>{shortMonthNames[index]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
          {mode === 'years' ? (
            <View style={styles.birthPickerGrid}>
              {Array.from({ length: 16 }).map((_, index) => {
                const year = yearRangeStart + index;
                const selected = month.getFullYear() === year;
                return (
                  <TouchableOpacity key={year} style={[styles.birthPickerCell, selected && styles.birthDaySelected]} onPress={() => { setMonth((current) => new Date(year, current.getMonth(), 1)); setMode('months'); }}>
                    <Text style={[styles.birthDayText, selected && styles.birthDayTextSelected]}>{year}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function EditableIntro({ content, editor }: { content?: AppContentBlock; editor?: PageEditorProps }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(editor?.title ?? '');
  const [draftTitle, setDraftTitle] = useState(content?.title ?? editor?.title ?? '');
  const [draftBody, setDraftBody] = useState(content?.body ?? '');
  const [draftBlocks, setDraftBlocks] = useState<ContentEditorBlock[]>([]);
  const [editorMessage, setEditorMessage] = useState('');

  useEffect(() => {
    setDraftLabel(editor?.title ?? '');
    setDraftTitle(content?.title ?? editor?.title ?? '');
    setDraftBody(content?.body ?? '');
    setDraftBlocks(content?.blocks?.length ? content.blocks : [
      { id: 'inline-title', type: 'titulo', value: content?.title ?? editor?.title ?? '' },
      { id: 'inline-body', type: 'texto', value: content?.body ?? '' }
    ]);
  }, [content, editor?.title, editor?.tabKey]);

  async function uploadInlineImage() {
    if (!editor) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setEditorMessage('Necesito permiso para acceder a tus fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.75
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    try {
      setEditorMessage('Subiendo imagen...');
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const bytes = await response.arrayBuffer();
      const extension = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      const path = `${editor.tabKey}/content-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(path, bytes, {
          contentType: asset.mimeType ?? 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        setDraftBlocks((current) => [...current, { id: `imagen-${Date.now()}`, type: 'imagen', value: asset.uri }]);
        setEditorMessage(`No pude subir a Supabase (${uploadError.message}). La imagen quedó cargada localmente para esta edición.`);
        return;
      }

      const { data: publicUrl } = supabase.storage.from('content-images').getPublicUrl(path);
      setDraftBlocks((current) => [...current, { id: `imagen-${Date.now()}`, type: 'imagen', value: publicUrl.publicUrl }]);
      setEditorMessage('Imagen cargada al editor.');
    } catch (error) {
      setEditorMessage(error instanceof Error ? error.message : 'No pude subir la imagen.');
    }
  }

  async function saveInlinePage() {
    if (!editor) {
      return;
    }

    setEditorMessage('Guardando pagina...');
    if (draftLabel.trim() && draftLabel.trim() !== editor.title) {
      const { error: tabError } = await updateAppTab(
        editor.tabKey,
        draftLabel.trim(),
        editor.tab?.visible ?? true,
        editor.tab?.visibleRoles ?? null
      );
      if (tabError) {
        setEditorMessage(tabError.message);
        return;
      }
      await editor.onTabsChanged();
    }

    const normalizedBlocks = draftBlocks
      .map((block) => ({ ...block, value: block.value.trim() }))
      .filter((block) => block.value.length > 0);
    const titleFromBlocks = normalizedBlocks.find((block) => block.type === 'titulo')?.value ?? draftTitle.trim() ?? editor.title;
    const bodyFromBlocks = normalizedBlocks.find((block) => block.type === 'texto')?.value ?? draftBody.trim();
    const { error } = await updateAppContent(editor.tabKey, titleFromBlocks, bodyFromBlocks, normalizedBlocks);
    if (error) {
      setEditorMessage(error.message);
      return;
    }
    await editor.onContentChanged();
    setEditorMessage(changeDone('Pagina actualizada.'));
    setIsEditing(false);
  }

  function addInlineBlock(type: ContentEditorBlock['type']) {
    setDraftBlocks((current) => [
      ...current,
      { id: `${type}-${Date.now()}`, type, value: type === 'imagen' ? 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png' : '' }
    ]);
  }

  function moveInlineBlock(index: number, direction: -1 | 1) {
    setDraftBlocks((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  }

  function updateInlineBlock(id: string, value: string) {
    setDraftBlocks((current) => current.map((block) => block.id === id ? { ...block, value } : block));
  }

  const renderedContent = (() => {
    if (!content) {
      return null;
    }

    if (content.blocks && content.blocks.length > 0) {
      return (
        <View style={styles.contentIntro}>
          {content.blocks.map((block, index) => {
            const blockKey = `${block.id}-${index}`;
            if (block.type === 'titulo') {
              return <Text key={blockKey} style={styles.cardTitle}>{block.value}</Text>;
            }
            if (block.type === 'imagen') {
              return <Image key={blockKey} source={{ uri: block.value }} style={styles.cardImage} />;
            }
            return <Text key={blockKey} style={styles.cardText}>{block.value}</Text>;
          })}
        </View>
      );
    }

    return (
      <View style={styles.contentIntro}>
        <Text style={styles.cardTitle}>{content.title}</Text>
        <Text style={styles.cardText}>{content.body}</Text>
      </View>
    );
  })();

  if (editor?.isAdmin) {
    return (
      <View style={styles.stackTight}>
        <TouchableOpacity style={styles.inlineEditButton} onPress={() => setIsEditing(!isEditing)}>
          <Ionicons name={isEditing ? 'close-outline' : 'create-outline'} size={18} color={palette.red} />
          <Text style={styles.inlineEditButtonText}>{isEditing ? 'Cerrar editor' : 'Editar pagina'}</Text>
        </TouchableOpacity>
        {isEditing ? (
          <View style={styles.inlineEditorPanel}>
            <Text style={styles.cardText}>Edita el contenido con bloques. El primer bloque de texto se usa como resumen interno de la pagina.</Text>
            <View style={styles.inlineActions}>
              <TouchableOpacity style={styles.smallActionButton} onPress={() => addInlineBlock('titulo')}>
                <Ionicons name="text-outline" size={16} color={palette.red} />
                <Text style={styles.smallActionText}>Titulo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallActionButton} onPress={() => addInlineBlock('texto')}>
                <Ionicons name="document-text-outline" size={16} color={palette.red} />
                <Text style={styles.smallActionText}>Texto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallActionButton} onPress={uploadInlineImage}>
                <Ionicons name="image-outline" size={16} color={palette.red} />
                <Text style={styles.smallActionText}>Imagen</Text>
              </TouchableOpacity>
            </View>
            {draftBlocks.map((block, index) => (
              <View key={`${block.id}-${index}`} style={styles.inlineBlockEditor}>
                <View style={styles.inlineBlockHeader}>
                  <Text style={styles.cardEyebrow}>{block.type}</Text>
                  <View style={styles.inlineIconActions}>
                    <TouchableOpacity style={styles.iconButtonGhost} onPress={() => moveInlineBlock(index, -1)}>
                      <Ionicons name="arrow-up-outline" size={16} color={palette.inkMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButtonGhost} onPress={() => moveInlineBlock(index, 1)}>
                      <Ionicons name="arrow-down-outline" size={16} color={palette.inkMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButtonGhost} onPress={() => setDraftBlocks((current) => current.filter((item) => item.id !== block.id))}>
                      <Ionicons name="trash-outline" size={16} color={palette.red} />
                    </TouchableOpacity>
                  </View>
                </View>
                <TextInput
                  style={[styles.input, block.type === 'texto' && styles.textArea]}
                  placeholder={block.type === 'imagen' ? 'URL de imagen' : 'Contenido'}
                  value={block.value}
                  onChangeText={(value) => updateInlineBlock(block.id, value)}
                  multiline={block.type !== 'titulo'} placeholderTextColor={inputPlaceholderColor} />
                {block.type === 'imagen' && block.value ? <Image source={{ uri: block.value }} style={styles.cardImage} /> : null}
              </View>
            ))}
            <TouchableOpacity style={styles.primaryButton} onPress={saveInlinePage}>
              <Text style={styles.primaryButtonText}>Guardar pagina</Text>
            </TouchableOpacity>
            {editorMessage ? <Text style={styles.cardText}>{editorMessage}</Text> : null}
          </View>
        ) : null}
        {renderedContent}
      </View>
    );
  }

  if (!content) {
    return null;
  }

  return renderedContent;
}

function HomeScreen({ session, title, content, refreshKey, editor, onNavigate, adminConfig }: { session: Session | null; title: string; content?: AppContentBlock; refreshKey: number; editor?: PageEditorProps; onNavigate: (tab: TabKey) => void; adminConfig: AppAdminConfig }) {
  const [expandedNews, setExpandedNews] = useState<string | null>(null);
  const [homeNews, setHomeNews] = useState<HomeFeedItem[]>(news);
  const [communityAgenda, setCommunityAgenda] = useState<CommunityPublication[]>([]);
  const [homeRefreshKey, setHomeRefreshKey] = useState(0);
  const [homeEditId, setHomeEditId] = useState<string | null>(null);
  const [homeEditTitle, setHomeEditTitle] = useState('');
  const [homeEditBody, setHomeEditBody] = useState('');
  const [homeActionMessage, setHomeActionMessage] = useState('');
  const canManageHomeEntries = canManageNationalPublishedContent(session);
  const hiddenFallbackContent = adminConfig.settings.hiddenFallbackContent ?? [];
  const instagramUrl = adminConfig.contact.instagram?.startsWith('http') ? adminConfig.contact.instagram : `https://www.instagram.com/${adminConfig.contact.instagram.replace('@', '')}`;
  const instagramLabel = instagramUrl.includes('infopalestra.argentina') ? '@infopalestra.argentina' : adminConfig.contact.instagram;
  const greeting = homeGreeting(session);
  const homeTiles: Array<{ tab: TabKey; title: string; meta: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = [
    { tab: 'notilestra', title: 'Noticias', meta: 'Agenda y avisos', icon: 'newspaper-outline', color: palette.red },
    { tab: 'comunidades', title: 'Comunidades', meta: 'Provincias y contactos', icon: 'people-outline', color: '#7DB9E2' },
    { tab: 'materiales', title: 'Materiales', meta: 'Archivos internos', icon: 'folder-open-outline', color: palette.gold },
    { tab: 'foro', title: 'Foro', meta: 'Nacional y provincias', icon: 'chatbubbles-outline', color: '#4AA06D' },
    { tab: 'perfil', title: session ? 'Perfil' : 'Ingresar', meta: session ? roleLabel(session.role) : 'Cuenta personal', icon: 'person-circle-outline', color: palette.inkMuted }
  ];
  const dashboardStats = [
    { label: 'Provincias', value: String(communities.length), icon: 'map-outline' as keyof typeof Ionicons.glyphMap },
    { label: 'Comunidades', value: String(communities.reduce((total, item) => total + item.locations.length, 0)), icon: 'people-circle-outline' as keyof typeof Ionicons.glyphMap },
    { label: 'Materiales', value: String(materials.length), icon: 'library-outline' as keyof typeof Ionicons.glyphMap }
  ];
  const nextEvents = notilestra
    .filter((item) => !hiddenFallbackContent.includes(fallbackContentKey('notilestra', item.title, item.date)))
    .slice(0, 2);
  const visibleHomeNews = homeNews.filter((item) => isRemoteNewsItem(item) || !hiddenFallbackContent.includes(fallbackContentKey('home', item.title)));

  useEffect(() => {
    let alive = true;
    fetchNews(session).then((items) => {
      if (alive) {
        fetchCommunityPublications(session).then((communityItems) => {
          if (alive) {
            setHomeNews([...communityItems, ...items]);
            setCommunityAgenda(communityItems.filter((item) => item.kind === 'fecha'));
          }
        });
      }
    });
    return () => {
      alive = false;
    };
  }, [refreshKey, homeRefreshKey, session?.province, session?.role]);

  function startHomeNewsEdit(item: HomeFeedItem) {
    if (!isRemoteNewsItem(item)) {
      return;
    }
    setHomeEditId(item.id);
    setHomeEditTitle(item.title);
    setHomeEditBody(item.body);
    setHomeActionMessage('');
  }

  async function saveHomeNewsEdit() {
    if (!homeEditId) {
      return;
    }
    if (!homeEditTitle.trim() || !homeEditBody.trim()) {
      setHomeActionMessage('Completa titulo y contenido.');
      return;
    }
    const { error } = await updateNewsEntry({
      id: homeEditId,
      title: homeEditTitle.trim(),
      body: homeEditBody.trim()
    });
    if (error) {
      setHomeActionMessage(error.message);
      return;
    }
    setHomeEditId(null);
    setHomeEditTitle('');
    setHomeEditBody('');
    setHomeActionMessage(changeDone('Cambios realizados'));
    setHomeRefreshKey((current) => current + 1);
  }

  async function removeHomeNews(item: HomeFeedItem) {
    if (!isRemoteNewsItem(item)) {
      return;
    }
    const confirmed = Platform.OS === 'web'
      ? (typeof window === 'undefined' ? true : window.confirm('¿Seguro que deseas eliminar esta publicacion de Inicio?'))
      : await new Promise<boolean>((resolve) => {
        Alert.alert('Eliminar publicacion', '¿Seguro que deseas eliminar esta publicacion de Inicio?', [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) }
        ]);
      });
    if (!confirmed) {
      return;
    }
    const { error } = await archiveNewsEntry(item.id);
    if (error) {
      setHomeActionMessage(error.message);
      return;
    }
    setHomeActionMessage(changeDone('Cambios realizados'));
    setHomeRefreshKey((current) => current + 1);
  }

  return (
    <View style={styles.stack}>
      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <Text style={styles.kicker}>Argentina</Text>
        <Text style={styles.heroTitle}>{greeting || adminConfig.home.heroTitle}</Text>
        <Text style={styles.heroText}>{adminConfig.home.heroText}</Text>
      </View>

      <EditableIntro content={content} editor={editor} />

      <SectionTitle title="Accesos rápidos" />
      <View style={styles.homeTileGrid}>
        {homeTiles.map((tile) => (
          <TouchableOpacity key={tile.tab} style={styles.homeTile} activeOpacity={0.88} onPress={() => onNavigate(tile.tab)}>
            <View style={[styles.homeTileIcon, { backgroundColor: tile.color }]}>
              <Ionicons name={tile.icon} size={25} color={palette.white} />
            </View>
            <Text style={styles.homeTileTitle}>{tile.title}</Text>
            <Text style={styles.homeTileMeta}>{tile.meta}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionTitle title="Resumen" />
      <View style={styles.dashboardStrip}>
        {dashboardStats.map((item) => (
          <View key={item.label} style={styles.dashboardStat}>
            <Ionicons name={item.icon} size={18} color={palette.red} />
            <Text style={styles.dashboardValue}>{item.value}</Text>
            <Text style={styles.dashboardLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.instagramButton} activeOpacity={0.88} onPress={() => Linking.openURL(instagramUrl)}>
        <Ionicons name="logo-instagram" size={22} color={palette.white} />
        <View style={styles.instagramButtonText}>
          <Text style={styles.instagramButtonTitle}>Instagram Palestrista</Text>
          <Text style={styles.instagramButtonMeta}>{instagramLabel}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={palette.white} />
      </TouchableOpacity>

      <SectionTitle title="Agenda comunitaria" />
      <View style={styles.featurePanel}>
        <View style={styles.featurePanelHeader}>
          <Text style={styles.cardEyebrow}>Proximamente</Text>
          <TouchableOpacity style={[styles.iconButton, styles.viewAllButton]} activeOpacity={0.8} onPress={() => onNavigate('notilestra')}>
            <Text style={styles.linkText}>Ver todas</Text>
          </TouchableOpacity>
        </View>
        {(communityAgenda.length > 0 ? communityAgenda.slice(0, 3) : nextEvents).map((item, index) => (
          <View key={`${item.title}-${index}`} style={styles.miniEventRow}>
            <View style={styles.miniEventDate}>
              <Text style={styles.miniEventDay}>{new Date(`${'date' in item ? item.date : item.eventDate}T00:00:00`).getDate()}</Text>
              <Text style={styles.miniEventMonth}>{new Date(`${'date' in item ? item.date : item.eventDate}T00:00:00`).toLocaleDateString('es-AR', { month: 'short' })}</Text>
            </View>
            <View style={styles.miniEventBody}>
              <Text style={styles.miniEventTitle}>{item.title}</Text>
              <Text style={styles.miniEventScope}>{item.scope}</Text>
            </View>
          </View>
        ))}
      </View>

      <SectionTitle title="Info Palestrista" />
      {homeActionMessage ? <Text style={styles.noticeText}>{homeActionMessage}</Text> : null}
      {visibleHomeNews.map((item, index) => (
        <TouchableOpacity key={`${item.title}-${index}`} style={[styles.card, styles.feedCard]} activeOpacity={0.86} onPress={() => {
          if (!(homeEditId && isRemoteNewsItem(item) && item.id === homeEditId)) {
            setExpandedNews(expandedNews === item.title ? null : item.title);
          }
        }}>
          <View style={styles.feedHeader}>
            <View style={styles.feedAvatar}>
              <Ionicons name="sparkles-outline" size={18} color={palette.red} />
            </View>
            <View style={styles.feedHeaderText}>
              <Text style={styles.cardEyebrow}>{item.scope}</Text>
              <Text style={styles.feedMeta}>Comunidad Palestra</Text>
            </View>
          </View>
          {homeEditId && isRemoteNewsItem(item) && item.id === homeEditId ? (
            <View style={styles.stackSmall}>
              <TextInput style={styles.input} placeholder="Titulo de la publicacion" value={homeEditTitle} onChangeText={setHomeEditTitle} placeholderTextColor={inputPlaceholderColor} />
              <TextInput style={[styles.input, styles.textArea]} placeholder="Contenido completo" value={homeEditBody} onChangeText={setHomeEditBody} multiline placeholderTextColor={inputPlaceholderColor} />
              <View style={styles.inlineActions}>
                <TouchableOpacity style={styles.primaryButton} onPress={saveHomeNewsEdit}>
                  <Text style={styles.primaryButtonText}>Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setHomeEditId(null)}>
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardText} numberOfLines={expandedNews === item.title ? undefined : 2}>{item.body}</Text>
            </>
          )}
          {expandedNews === item.title ? <Image source={{ uri: item.imageUrl }} style={styles.cardImage} /> : null}
          {canManageHomeEntries && isRemoteNewsItem(item) ? (
            <View style={styles.inlineActions}>
              <TouchableOpacity style={styles.actionPill} onPress={() => startHomeNewsEdit(item)}>
                <Ionicons name="create-outline" size={16} color={palette.red} />
                <Text style={styles.actionPillText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionPill} onPress={() => removeHomeNews(item)}>
                <Ionicons name="trash-outline" size={16} color={palette.red} />
                <Text style={styles.actionPillText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <View style={styles.feedFooter}>
            <Text style={styles.expandHint}>{expandedNews === item.title ? 'Tocar para contraer' : 'Tocar para leer mas'}</Text>
            <Ionicons name={expandedNews === item.title ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
          </View>
        </TouchableOpacity>
      ))}

      {!canAccessPrivate(session) ? (
        <View style={styles.notice}>
          <Ionicons name="lock-closed-outline" size={20} color={palette.red} />
          <Text style={styles.noticeText}>Algunas secciones requieren registro y aprobación de un coordinador.</Text>
        </View>
      ) : null}
    </View>
  );
}

function NotilestraScreen({ session, title, content, refreshKey, editor, adminConfig }: { session: Session | null; title: string; content?: AppContentBlock; refreshKey: number; editor?: PageEditorProps; adminConfig: AppAdminConfig }) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [selectedCalendarItems, setSelectedCalendarItems] = useState<Array<{ date: string; title: string; body?: string; imageUrl?: string; scope?: string; mapUrl?: string }>>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [reminders, setReminders] = useState<string[]>([]);
  const [subtab, setSubtab] = useState<'noticias' | 'favoritos' | 'recordatorios'>('noticias');
  const [notilestraItems, setNotilestraItems] = useState<AgendaItem[]>(notilestra);
  const [notilestraRefreshKey, setNotilestraRefreshKey] = useState(0);
  const [notilestraEditId, setNotilestraEditId] = useState<string | null>(null);
  const [notilestraEditTitle, setNotilestraEditTitle] = useState('');
  const [notilestraEditBody, setNotilestraEditBody] = useState('');
  const [notilestraEditDate, setNotilestraEditDate] = useState('');
  const [notilestraActionMessage, setNotilestraActionMessage] = useState('');
  const canManageNotilestraEntries = canManageNationalPublishedContent(session);
  const [monthOffset, setMonthOffset] = useState(0);
  const preferenceStorageKey = useMemo(() => `palestra.notilestra.preferences.${session?.id ?? session?.email ?? 'guest'}`, [session?.id, session?.email]);
  const baseDate = new Date(2026, 4 + monthOffset, 1);
  const monthLabel = baseDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1).getDay();
  useEffect(() => {
    let alive = true;
    Promise.all([fetchNotilestra(session), fetchMotivadorPeriods(session)]).then(([items, pmItems]) => {
      if (alive) {
        setNotilestraItems([...items, ...pmItems].sort((a, b) => Date.parse(a.date) - Date.parse(b.date)));
      }
    });
    return () => {
      alive = false;
    };
  }, [refreshKey, notilestraRefreshKey, session?.province, session?.role]);

  useEffect(() => {
    let alive = true;

    async function loadPreferences() {
      try {
        const raw = await AsyncStorage.getItem(preferenceStorageKey);
        if (alive && raw) {
          const parsed = JSON.parse(raw) as { favorites?: string[]; reminders?: string[] };
          setFavorites(Array.isArray(parsed.favorites) ? parsed.favorites : []);
          setReminders(Array.isArray(parsed.reminders) ? parsed.reminders : []);
        }
      } catch (error) {
        console.error('load notilestra preferences', error);
      }

      if (!session?.id) {
        return;
      }
      const remotePreferences = await fetchUserAgendaPreferences();
      if (!alive || remotePreferences.length === 0) {
        return;
      }
      const next = splitAgendaPreferences(remotePreferences);
      setFavorites(next.favorites);
      setReminders(next.reminders);
      try {
        await AsyncStorage.setItem(preferenceStorageKey, JSON.stringify(next));
      } catch (error) {
        console.error('cache notilestra preferences', error);
      }
    }

    loadPreferences();
    return () => {
      alive = false;
    };
  }, [preferenceStorageKey, session?.id]);

  const eventDays = notilestraItems
    .filter((item) => {
      const itemDate = new Date(`${item.date}T00:00:00`);
      return itemDate.getFullYear() === baseDate.getFullYear() && itemDate.getMonth() === baseDate.getMonth();
    })
    .map((item) => new Date(`${item.date}T00:00:00`).getDate());
  const calendarItemsByDay = useMemo(() => {
    const groups = new Map<number, AgendaItem[]>();
    notilestraItems.forEach((item) => {
      const itemDate = new Date(`${item.date}T00:00:00`);
      if (itemDate.getFullYear() !== baseDate.getFullYear() || itemDate.getMonth() !== baseDate.getMonth()) {
        return;
      }
      const day = itemDate.getDate();
      groups.set(day, [...(groups.get(day) ?? []), item]);
    });
    return groups;
  }, [notilestraItems, baseDate.getFullYear(), baseDate.getMonth()]);
  const hiddenFallbackContent = adminConfig.settings.hiddenFallbackContent ?? [];
  const activityDays = calendarActivities.filter((item) => {
    const itemDate = new Date(`${item.date}T00:00:00`);
    const canSee = !('requiredPermission' in item) || hasPermission(session, item.requiredPermission as Permission);
    const hidden = hiddenFallbackContent.includes(fallbackContentKey('calendario', item.title, item.date));
    return canSee && !hidden && itemDate.getFullYear() === baseDate.getFullYear() && itemDate.getMonth() === baseDate.getMonth();
  });
  const feedItems = useMemo(() => groupMotivadorFeedItems(notilestraItems), [notilestraItems]);
  const visibleFeedItems = feedItems.filter((item) => item.id || !hiddenFallbackContent.includes(fallbackContentKey('notilestra', item.title, item.date)));
  const favoriteItems = visibleFeedItems.filter((item) => favorites.includes(agendaPreferenceKey(item)));
  const reminderItems = visibleFeedItems.filter((item) => reminders.includes(agendaPreferenceKey(item)));
  const dueReminderItems = reminderItems.filter((item) => {
    const eventDate = new Date(`${item.date}T00:00:00`);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return eventDate.toDateString() === tomorrow.toDateString();
  });
  const [dismissedReminderPopup, setDismissedReminderPopup] = useState(false);

  function openCalendarDay(day: number) {
    const dateKey = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const newsForDay = notilestraItems
      .filter((item) => item.date === dateKey)
      .map((item) => ({ date: item.date, title: item.title, body: item.body, scope: item.scope, imageUrl: item.imageUrl, mapUrl: item.mapUrl }));
    const activitiesForDay = activityDays
      .filter((item) => item.date === dateKey)
      .map((item) => ({
        date: item.date,
        title: item.title,
        body: 'body' in item ? item.body : undefined,
        imageUrl: 'imageUrl' in item ? item.imageUrl : undefined,
        scope: 'Actividad'
      }));
    setSelectedCalendarItems([...newsForDay, ...activitiesForDay]);
  }

  async function persistNotilestraPreferences(nextFavorites: string[], nextReminders: string[]) {
    try {
      await AsyncStorage.setItem(preferenceStorageKey, JSON.stringify({ favorites: nextFavorites, reminders: nextReminders }));
    } catch (error) {
      console.error('save notilestra preferences', error);
    }
  }

  function toggleFavorite(item: AgendaItem) {
    const itemKey = agendaPreferenceKey(item);
    const enabled = !favorites.includes(itemKey);
    const nextFavorites = enabled ? [...favorites, itemKey] : favorites.filter((key) => key !== itemKey);
    setFavorites(nextFavorites);
    persistNotilestraPreferences(nextFavorites, reminders);
    if (session?.id) {
      setUserAgendaPreference({
        itemKey,
        preferenceType: 'favorite',
        enabled,
        itemTitle: item.title,
        itemDate: item.date,
        itemSource: item.source ?? 'local'
      }).catch((error) => console.error('remote favorite preference', error));
    }
  }

  function toggleReminder(item: AgendaItem) {
    const itemKey = agendaPreferenceKey(item);
    const enabled = !reminders.includes(itemKey);
    const nextReminders = enabled ? [...reminders, itemKey] : reminders.filter((key) => key !== itemKey);
    setReminders(nextReminders);
    persistNotilestraPreferences(favorites, nextReminders);
    if (session?.id) {
      setUserAgendaPreference({
        itemKey,
        preferenceType: 'reminder',
        enabled,
        itemTitle: item.title,
        itemDate: item.date,
        itemSource: item.source ?? 'local'
      }).catch((error) => console.error('remote reminder preference', error));
    }
  }

  function startNotilestraEdit(item: AgendaItem) {
    if (!item.id || item.source !== 'event') {
      return;
    }
    setNotilestraEditId(item.id);
    setNotilestraEditTitle(item.title);
    setNotilestraEditBody(item.body);
    setNotilestraEditDate(item.date);
    setNotilestraActionMessage('');
  }

  async function saveNotilestraEdit() {
    if (!notilestraEditId) {
      return;
    }
    if (!notilestraEditTitle.trim() || !notilestraEditBody.trim() || !notilestraEditDate.trim()) {
      setNotilestraActionMessage('Completa titulo, contenido y fecha.');
      return;
    }
    const { error } = await updateAgendaEvent({
      id: notilestraEditId,
      title: notilestraEditTitle.trim(),
      body: notilestraEditBody.trim(),
      startsAt: `${notilestraEditDate}T09:00:00-03:00`
    });
    if (error) {
      setNotilestraActionMessage(error.message);
      return;
    }
    setNotilestraEditId(null);
    setNotilestraEditTitle('');
    setNotilestraEditBody('');
    setNotilestraEditDate('');
    setNotilestraActionMessage(changeDone('Cambios realizados'));
    setNotilestraRefreshKey((current) => current + 1);
  }

  async function removeNotilestraItem(item: AgendaItem) {
    if (!item.id || item.source !== 'event') {
      return;
    }
    const confirmed = Platform.OS === 'web'
      ? (typeof window === 'undefined' ? true : window.confirm('¿Seguro que deseas eliminar esta entrada de Notilestra?'))
      : await new Promise<boolean>((resolve) => {
        Alert.alert('Eliminar entrada', '¿Seguro que deseas eliminar esta entrada de Notilestra?', [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) }
        ]);
      });
    if (!confirmed) {
      return;
    }
    const { error } = await archiveAgendaEvent(item.id);
    if (error) {
      setNotilestraActionMessage(error.message);
      return;
    }
    setNotilestraActionMessage(changeDone('Cambios realizados'));
    setNotilestraRefreshKey((current) => current + 1);
  }

  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      {notilestraActionMessage ? <Text style={styles.noticeText}>{notilestraActionMessage}</Text> : null}
      <Modal visible={dueReminderItems.length > 0 && !dismissedReminderPopup} transparent animationType="fade" onRequestClose={() => setDismissedReminderPopup(true)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalPanel}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setDismissedReminderPopup(true)} activeOpacity={0.8}>
              <Ionicons name="close" size={22} color={palette.red} />
            </TouchableOpacity>
            <Text style={styles.cardEyebrow}>Recordatorio</Text>
            <Text style={styles.cardTitle}>Tenes eventos marcados para manana</Text>
            {dueReminderItems.map((item, index) => <Text key={`${item.title}-${index}`} style={styles.cardText}>{item.title} - {item.date}</Text>)}
          </View>
        </View>
      </Modal>
      <View style={styles.filterRow}>
        {[
          { key: 'noticias', label: 'Noticias' },
          { key: 'favoritos', label: 'Favoritos' },
          { key: 'recordatorios', label: 'Recordatorios' }
        ].map((item) => (
          <TouchableOpacity key={item.key} style={[styles.filterChip, subtab === item.key && styles.filterChipActive]} onPress={() => setSubtab(item.key as typeof subtab)}>
            <Text style={[styles.filterChipText, subtab === item.key && styles.filterChipTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => setMonthOffset(monthOffset - 1)} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={18} color={palette.red} />
          </TouchableOpacity>
          <Text style={styles.calendarTitle}>{monthLabel}</Text>
          <TouchableOpacity onPress={() => setMonthOffset(monthOffset + 1)} style={styles.iconButton}>
            <Ionicons name="chevron-forward" size={18} color={palette.red} />
          </TouchableOpacity>
        </View>
        <View style={styles.calendarGrid}>
          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => <Text key={`${day}-${index}`} style={styles.calendarWeekday}>{day}</Text>)}
          {Array.from({ length: firstDay }).map((_, index) => <View key={`empty-${index}`} style={styles.calendarDay} />)}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dayItems = calendarItemsByDay.get(day) ?? [];
            const hasEvent = eventDays.includes(day);
            const hasMotivador = dayItems.some((item) => item.source === 'motivador');
            const hasMultipleEvents = dayItems.length > 1;
            const activity = activityDays.find((item) => new Date(`${item.date}T00:00:00`).getDate() === day);
            const canOpenDay = hasEvent || Boolean(activity);
            return (
              <TouchableOpacity key={day} style={[styles.calendarDay, hasEvent && styles.calendarEventDay, hasMotivador && styles.calendarMotivadorDay, activity && styles.calendarActivityDay]} activeOpacity={canOpenDay ? 0.75 : 1} onPress={() => canOpenDay && openCalendarDay(day)}>
                <Text style={[styles.calendarDayText, hasEvent && styles.calendarEventText, activity && styles.calendarActivityText]}>{day}</Text>
                {hasMultipleEvents ? <View style={styles.calendarMultiDot} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <Modal visible={selectedCalendarItems.length > 0} transparent animationType="fade" onRequestClose={() => setSelectedCalendarItems([])}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalPanel}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setSelectedCalendarItems([])} activeOpacity={0.8}>
              <Ionicons name="close" size={22} color={palette.red} />
            </TouchableOpacity>
            <Text style={styles.cardEyebrow}>{selectedCalendarItems[0]?.date}</Text>
            {selectedCalendarItems.map((item) => (
              <View key={`${item.date}-${item.title}`} style={styles.modalItem}>
                <Text style={styles.cardEyebrow}>{item.scope ?? 'Notilestra'}</Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.cardImage} /> : null}
                {item.body ? <Text style={styles.cardText}>{item.body}</Text> : null}
                {item.mapUrl ? (
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => Linking.openURL(item.mapUrl as string)}>
                    <Ionicons name="map-outline" size={17} color={palette.red} />
                    <Text style={styles.secondaryButtonText}>Abrir mapa</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      </Modal>
      {subtab === 'noticias' ? visibleFeedItems.map((item, index) => (
        <View key={`${item.title}-${index}`} style={[styles.card, styles.feedCard]}>
          <TouchableOpacity activeOpacity={0.86} onPress={() => {
            if (!(notilestraEditId && item.id === notilestraEditId)) {
              setExpandedItem(expandedItem === item.title ? null : item.title);
            }
          }}>
            <View style={styles.feedHeader}>
              <View style={styles.feedAvatar}>
                <Ionicons name="megaphone-outline" size={18} color={palette.red} />
              </View>
              <View style={styles.feedHeaderText}>
                <Text style={styles.cardEyebrow}>{item.scope}</Text>
                <Text style={styles.feedMeta}>{new Date(`${item.date}T00:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              </View>
            </View>
            {notilestraEditId && item.id === notilestraEditId ? (
              <View style={styles.stackSmall}>
                <TextInput style={styles.input} placeholder="Titulo de la entrada" value={notilestraEditTitle} onChangeText={setNotilestraEditTitle} placeholderTextColor={inputPlaceholderColor} />
                <TextInput style={styles.input} placeholder="Fecha del evento (AAAA-MM-DD)" value={notilestraEditDate} onChangeText={setNotilestraEditDate} placeholderTextColor={inputPlaceholderColor} />
                <TextInput style={[styles.input, styles.textArea]} placeholder="Contenido completo" value={notilestraEditBody} onChangeText={setNotilestraEditBody} multiline placeholderTextColor={inputPlaceholderColor} />
                <View style={styles.inlineActions}>
                  <TouchableOpacity style={styles.primaryButton} onPress={saveNotilestraEdit}>
                    <Text style={styles.primaryButtonText}>Guardar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => setNotilestraEditId(null)}>
                    <Text style={styles.secondaryButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardText} numberOfLines={expandedItem === item.title ? undefined : 2}>{item.body}</Text>
              </>
            )}
          </TouchableOpacity>
          <View style={styles.inlineActions}>
            <TouchableOpacity style={[styles.actionPill, favorites.includes(agendaPreferenceKey(item)) && styles.actionPillActive]} onPress={() => toggleFavorite(item)}>
              <Ionicons name={favorites.includes(agendaPreferenceKey(item)) ? 'star' : 'star-outline'} size={16} color={favorites.includes(agendaPreferenceKey(item)) ? palette.white : palette.red} />
              <Text style={[styles.actionPillText, favorites.includes(agendaPreferenceKey(item)) && styles.actionPillTextActive]}>Favorito</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionPill, reminders.includes(agendaPreferenceKey(item)) && styles.actionPillActive]} onPress={() => toggleReminder(item)}>
              <Ionicons name={reminders.includes(agendaPreferenceKey(item)) ? 'notifications' : 'notifications-outline'} size={16} color={reminders.includes(agendaPreferenceKey(item)) ? palette.white : palette.red} />
              <Text style={[styles.actionPillText, reminders.includes(agendaPreferenceKey(item)) && styles.actionPillTextActive]}>Recordar</Text>
            </TouchableOpacity>
            {canManageNotilestraEntries && item.id && item.source === 'event' ? (
              <>
                <TouchableOpacity style={styles.actionPill} onPress={() => startNotilestraEdit(item)}>
                  <Ionicons name="create-outline" size={16} color={palette.red} />
                  <Text style={styles.actionPillText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionPill} onPress={() => removeNotilestraItem(item)}>
                  <Ionicons name="trash-outline" size={16} color={palette.red} />
                  <Text style={styles.actionPillText}>Eliminar</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      )) : null}
      {subtab === 'favoritos' ? <View style={styles.stack}>{favoriteItems.length > 0 ? favoriteItems.map((item, index) => (
        <View key={`${item.title}-${index}`} style={[styles.card, styles.feedCard]}>
          <Text style={styles.cardEyebrow}>{item.scope} - {item.date}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardText}>{item.body}</Text>
        </View>
      )) : <View style={styles.card}><Text style={styles.cardText}>Todavia no marcaste favoritos.</Text></View>}</View> : null}
      {subtab === 'recordatorios' ? <View style={styles.stack}>{reminderItems.length > 0 ? reminderItems.map((item, index) => (
        <View key={`${item.title}-${index}`} style={[styles.card, styles.feedCard]}>
          <Text style={styles.cardEyebrow}>Recordatorio - {item.date}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardText}>La app mostrara un aviso interno 1 dia antes al abrir Notilestra.</Text>
        </View>
      )) : <View style={styles.card}><Text style={styles.cardText}>Todavia no marcaste recordatorios.</Text></View>}</View> : null}
    </View>
  );
}

function MotivadorScreen({ session, title, content, refreshKey, editor, adminConfig }: { session: Session | null; title: string; content?: AppContentBlock; refreshKey: number; editor?: PageEditorProps; adminConfig: AppAdminConfig }) {
  const [items, setItems] = useState<AgendaItem[]>([]);

  useEffect(() => {
    let alive = true;
    Promise.all([fetchMotivadorPeriods(session), fetchNotilestra(session)]).then(([pmPeriods, events]) => {
      if (alive) {
        const pmItems = events.filter((item) => {
          const text = `${item.title} ${item.body} ${item.scope}`.toLowerCase();
          return text.includes('periodo motivador') || text.includes(' pm ') || text.includes('retiro');
        });
        setItems(pmPeriods.length > 0 ? pmPeriods : pmItems);
      }
    });
    return () => {
      alive = false;
    };
  }, [refreshKey, session?.province, session?.role]);

  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      <View style={styles.featurePanel}>
        <Text style={styles.cardTitle}>{adminConfig.periodoMotivador.title}</Text>
        <Text style={styles.cardText}>{adminConfig.periodoMotivador.body}</Text>
        {adminConfig.periodoMotivador.imageUrl ? <Image source={{ uri: adminConfig.periodoMotivador.imageUrl }} style={styles.cardImage} /> : null}
      </View>
      <SectionTitle title="Agenda de PM" />
      {items.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No hay PM activos</Text>
          <Text style={styles.cardText}>Cuando se carguen PM reales y activos en Supabase, apareceran aca.</Text>
        </View>
      ) : null}
      {items.map((item, index) => (
        <View key={`${item.title}-${index}`} style={[styles.card, styles.feedCard]}>
          <View style={styles.feedHeader}>
            <View style={styles.feedAvatar}>
              <Ionicons name="flame-outline" size={18} color={palette.red} />
            </View>
            <View style={styles.feedHeaderText}>
              <Text style={styles.cardEyebrow}>{item.scope}</Text>
              <Text style={styles.feedMeta}>{new Date(`${item.date}T00:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            </View>
          </View>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardText}>{item.body}</Text>
          {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.cardImage} /> : null}
          {item.mapUrl ? (
            <TouchableOpacity style={styles.secondaryButton} onPress={() => Linking.openURL(item.mapUrl as string)}>
              <Ionicons name="map-outline" size={17} color={palette.red} />
              <Text style={styles.secondaryButtonText}>Abrir mapa</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
      <View style={styles.notice}>
        <Ionicons name="archive-outline" size={20} color={palette.red} />
        <Text style={styles.noticeText}>El registro histórico de PM queda disponible acá; las fechas cargadas en Supabase también se reflejan en el calendario de Noticias.</Text>
      </View>
    </View>
  );
}

function MaterialsScreen({ session, title, content, refreshKey, editor }: { session: Session | null; title: string; content?: AppContentBlock; refreshKey: number; editor?: PageEditorProps }) {
  const [remoteMaterials, setRemoteMaterials] = useState<AppMaterialRecord[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadVisibility, setUploadVisibility] = useState<'publico' | 'desde_rango' | 'solo_rango'>('desde_rango');
  const [uploadRole, setUploadRole] = useState<Role>('sedimentador');
  const [uploadMessage, setUploadMessage] = useState('');
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [materialEditTitle, setMaterialEditTitle] = useState('');
  const [materialEditDescription, setMaterialEditDescription] = useState('');
  const [materialEditVisibility, setMaterialEditVisibility] = useState<'publico' | 'desde_rango' | 'solo_rango'>('desde_rango');
  const [materialEditRole, setMaterialEditRole] = useState<Role>('sedimentador');

  useEffect(() => {
    let alive = true;
    fetchAppMaterials().then((items) => {
      if (alive) {
        setRemoteMaterials(items);
      }
    });
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const visibleMaterials = remoteMaterials.length > 0
    ? remoteMaterials.map((material) => ({
      id: material.id,
      type: material.category ?? material.visibility ?? 'Material',
      title: material.title,
      description: material.description,
      permission: material.required_permission as Permission | null,
      visibility: material.visibility,
      fileUrl: material.file_url,
      filePath: material.file_path,
      createdBy: material.created_by,
      provinceId: material.province_id,
      sortOrder: material.sort_order
    })).filter((material) => {
      if (!material.fileUrl && !material.filePath) {
        return false;
      }
      if (material.visibility === 'publico') {
        return true;
      }
      if (!session) {
        return false;
      }
      const selectedRole = material.permission?.replace('rango_', '') as Role | undefined;
      if (!selectedRole || !roleDefinitions.some((item) => item.role === selectedRole)) {
        return !material.permission || hasPermission(session, material.permission as Permission);
      }
      if (material.visibility === 'solo_rango') {
        return session.role === selectedRole;
      }
      return roleRank(session.role) >= roleRank(selectedRole);
    })
    : [];

  function canManageMaterial(material: { createdBy?: string | null }) {
    return Boolean(session && (material.createdBy === session.id || canManagePublishedContent(session)));
  }

  function startEditMaterial(material: typeof visibleMaterials[number]) {
    if (!('id' in material) || !material.id) {
      return;
    }
    setEditingMaterialId(material.id);
    setMaterialEditTitle(material.title);
    setMaterialEditDescription(material.description);
    setMaterialEditVisibility((material.visibility === 'publico' || material.visibility === 'solo_rango' || material.visibility === 'desde_rango') ? material.visibility : 'desde_rango');
    const selectedRole = material.permission?.replace('rango_', '') as Role | undefined;
    setMaterialEditRole(selectedRole && roleDefinitions.some((item) => item.role === selectedRole) ? selectedRole : 'sedimentador');
    setUploadMessage('');
  }

  async function saveEditedMaterial(material: typeof visibleMaterials[number]) {
    if (!('id' in material) || !material.id) {
      return;
    }
    if (!materialEditTitle.trim() || !materialEditDescription.trim()) {
      setUploadMessage('Completa titulo y descripcion.');
      return;
    }
    const { error } = await saveAppMaterial({
      id: material.id,
      title: materialEditTitle.trim(),
      description: materialEditDescription.trim(),
      category: material.type,
      visibility: materialEditVisibility,
      requiredPermission: materialEditVisibility === 'publico' ? null : `rango_${materialEditRole}`,
      fileUrl: material.fileUrl ?? null,
      filePath: material.filePath ?? null,
      sortOrder: material.sortOrder ?? 100
    });
    if (error) {
      setUploadMessage(error.message);
      return;
    }
    setEditingMaterialId(null);
    setUploadMessage(changeDone('Material actualizado.'));
    setRemoteMaterials(await fetchAppMaterials());
  }

  async function deleteMaterial(material: typeof visibleMaterials[number]) {
    if (!('id' in material) || !material.id) {
      return;
    }
    const { error } = await archiveAppMaterial(material.id);
    if (error) {
      setUploadMessage(error.message);
      return;
    }
    setUploadMessage(changeDone('Material eliminado.'));
    setRemoteMaterials(await fetchAppMaterials());
  }

  async function openMaterialFile(material: typeof visibleMaterials[number]) {
    if (!('fileUrl' in material) || !material.fileUrl) {
      setUploadMessage('No se encontro el archivo de descarga.');
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(material.fileUrl);
      if (!canOpen) {
        setUploadMessage('No se pudo abrir el enlace del archivo.');
        return;
      }
      await Linking.openURL(material.fileUrl);
    } catch {
      setUploadMessage('No se pudo descargar el archivo. Puede que ya no exista en Storage.');
    }
  }

  async function uploadPdfMaterial() {
    if (!session || !canManagePublishedContent(session)) {
      setUploadMessage('Solo Vocal Diocesano en adelante puede subir contenido.');
      return;
    }
    if (!uploadTitle.trim() || !uploadDescription.trim()) {
      setUploadMessage('Completa titulo y descripcion.');
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
      multiple: false
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    const asset = result.assets[0];
    if (!asset.name.toLowerCase().endsWith('.pdf') && asset.mimeType !== 'application/pdf') {
      setUploadMessage('Solo se permiten documentos PDF.');
      return;
    }
    if ((asset.size ?? 0) > 15 * 1024 * 1024) {
      setUploadMessage('El PDF no puede pesar mas de 15Mb.');
      return;
    }
    try {
      setUploadMessage('Subiendo PDF...');
      const response = await fetch(asset.uri);
      const bytes = await response.arrayBuffer();
      const path = `${session.province}/${Date.now()}-${asset.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(path, bytes, { contentType: 'application/pdf', upsert: true });
      if (uploadError) {
        setUploadMessage(uploadError.message);
        return;
      }
      const { data: publicUrl } = supabase.storage.from('materials').getPublicUrl(path);
      const { error } = await saveAppMaterial({
        title: uploadTitle.trim(),
        description: uploadDescription.trim(),
        category: session.province,
        visibility: uploadVisibility,
        requiredPermission: uploadVisibility === 'publico' ? null : `rango_${uploadRole}`,
        fileUrl: publicUrl.publicUrl,
        filePath: path,
        sortOrder: 100
      });
      if (error) {
        setUploadMessage(error.message);
        return;
      }
      setUploadTitle('');
      setUploadDescription('');
      setShowUpload(false);
      setUploadMessage(changeDone('PDF subido correctamente.'));
      setRemoteMaterials(await fetchAppMaterials());
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : 'No pude subir el PDF.');
    }
  }

  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      {canManagePublishedContent(session) ? (
        <TouchableOpacity style={styles.primaryButton} onPress={() => setShowUpload(!showUpload)}>
          <Ionicons name="cloud-upload-outline" size={17} color={palette.white} />
          <Text style={styles.primaryButtonText}>Subir contenido</Text>
        </TouchableOpacity>
      ) : null}
      {showUpload ? (
        <View style={styles.inlineEditorPanel}>
          <Text style={styles.cardEyebrow}>Nuevo PDF</Text>
          <TextInput style={styles.input} placeholder="Titulo" value={uploadTitle} onChangeText={setUploadTitle} placeholderTextColor={inputPlaceholderColor} />
          <TextInput style={[styles.input, styles.textArea]} placeholder="Descripcion" value={uploadDescription} onChangeText={setUploadDescription} multiline placeholderTextColor={inputPlaceholderColor} />
          <Text style={styles.cardEyebrow}>Visibilidad</Text>
          <View style={styles.filterRow}>
            {[
              { key: 'publico', label: 'Todo publico' },
              { key: 'desde_rango', label: 'Desde rango y superiores' },
              { key: 'solo_rango', label: 'Solo rango seleccionado' }
            ].map((item) => (
              <TouchableOpacity key={item.key} style={[styles.filterChip, uploadVisibility === item.key && styles.filterChipActive]} onPress={() => setUploadVisibility(item.key as typeof uploadVisibility)}>
                <Text style={[styles.filterChipText, uploadVisibility === item.key && styles.filterChipTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {uploadVisibility !== 'publico' ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
              {roleDefinitions.filter((role) => role.role !== 'invitado').map((role) => (
                <TouchableOpacity key={role.role} style={[styles.filterChip, uploadRole === role.role && styles.filterChipActive]} onPress={() => setUploadRole(role.role as Role)}>
                  <Text style={[styles.filterChipText, uploadRole === role.role && styles.filterChipTextActive]}>{role.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
          <TouchableOpacity style={styles.secondaryButton} onPress={uploadPdfMaterial}>
            <Ionicons name="document-attach-outline" size={17} color={palette.red} />
            <Text style={styles.secondaryButtonText}>Elegir PDF max. 15Mb</Text>
          </TouchableOpacity>
          {uploadMessage ? <Text style={styles.cardText}>{uploadMessage}</Text> : null}
        </View>
      ) : null}
      {visibleMaterials.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No existen archivos actualmente</Text>
        </View>
      ) : null}
      {visibleMaterials.map((material, index) => {
        const locked = material.permission && !hasPermission(session, material.permission as Permission);
        const canEditThisMaterial = 'id' in material && canManageMaterial(material);
        const isEditingThisMaterial = 'id' in material && editingMaterialId === material.id;
        return (
          <View key={`${material.title}-${index}`} style={[styles.card, styles.libraryCard, locked && styles.lockedCard]}>
            <View style={styles.libraryIcon}>
              <Ionicons name={locked ? 'lock-closed-outline' : 'document-text-outline'} size={24} color={locked ? palette.inkMuted : palette.red} />
            </View>
            <View style={styles.libraryBody}>
              {isEditingThisMaterial ? (
                <View style={styles.profileCommunityPanel}>
                  <Text style={styles.cardEyebrow}>Editar material</Text>
                  <TextInput style={styles.input} placeholder="Titulo" value={materialEditTitle} onChangeText={setMaterialEditTitle} placeholderTextColor={inputPlaceholderColor} />
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Descripcion" value={materialEditDescription} onChangeText={setMaterialEditDescription} multiline placeholderTextColor={inputPlaceholderColor} />
                  <View style={styles.filterRow}>
                    {[
                      { key: 'publico', label: 'Todo publico' },
                      { key: 'desde_rango', label: 'Desde rango' },
                      { key: 'solo_rango', label: 'Solo rango' }
                    ].map((item) => (
                      <TouchableOpacity key={item.key} style={[styles.filterChip, materialEditVisibility === item.key && styles.filterChipActive]} onPress={() => setMaterialEditVisibility(item.key as typeof materialEditVisibility)}>
                        <Text style={[styles.filterChipText, materialEditVisibility === item.key && styles.filterChipTextActive]}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {materialEditVisibility !== 'publico' ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                      {roleDefinitions.filter((role) => role.role !== 'invitado').map((role) => (
                        <TouchableOpacity key={role.role} style={[styles.filterChip, materialEditRole === role.role && styles.filterChipActive]} onPress={() => setMaterialEditRole(role.role as Role)}>
                          <Text style={[styles.filterChipText, materialEditRole === role.role && styles.filterChipTextActive]}>{role.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : null}
                  <View style={styles.inlineActions}>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => saveEditedMaterial(material)}>
                      <Text style={styles.primaryButtonText}>Guardar cambios</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => setEditingMaterialId(null)}>
                      <Text style={styles.secondaryButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.cardEyebrow}>{material.type}</Text>
                  <Text style={styles.cardTitle}>{material.title}</Text>
                  <Text style={styles.cardText}>{locked ? 'Material restringido por rango o permiso.' : material.description}</Text>
                  {locked ? <Text style={styles.cardText}>Requiere permiso: {material.permission}</Text> : null}
                  {!locked && 'fileUrl' in material && material.fileUrl ? (
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => openMaterialFile(material)}>
                      <Ionicons name="download-outline" size={16} color={palette.red} />
                      <Text style={styles.secondaryButtonText}>Descargar PDF</Text>
                    </TouchableOpacity>
                  ) : null}
                  {canEditThisMaterial ? (
                    <View style={styles.inlineActions}>
                      <TouchableOpacity style={styles.secondaryButton} onPress={() => startEditMaterial(material)}>
                        <Text style={styles.secondaryButtonText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.secondaryButton} onPress={() => deleteMaterial(material)}>
                        <Text style={styles.secondaryButtonText}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function CommunitiesScreen({ session, title, content, refreshKey, editor }: { session: Session | null; title: string; content?: AppContentBlock; refreshKey: number; editor?: PageEditorProps }) {
  const [communityData, setCommunityData] = useState<AppCommunity[]>(communities);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [selectedProvinceLogo, setSelectedProvinceLogo] = useState<AppCommunity | null>(null);
  const [showContactBox, setShowContactBox] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [contactName, setContactName] = useState(session?.fullName ?? '');
  const [contactInfoValue, setContactInfoValue] = useState(session?.email ?? '');
  const [contactStatus, setContactStatus] = useState('');
  const contactScrollRef = useRef<ScrollView | null>(null);
  const visibleCommunityData = communityData;
  const province = visibleCommunityData.find((item) => item.province === selectedProvince);
  const community = province?.locations.find((item) => item.name === selectedCommunity);

  function openCommunityLocation(location: AppCommunity['locations'][number]) {
    const query = `${location.address}, ${province?.province ?? ''}, Argentina`;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
  }

  function openCommunityPresentation(locationName: string) {
    setShowContactBox(false);
    setContactStatus('');
    setSelectedCommunity(locationName);
  }

  function closeCommunityModal() {
    setSelectedCommunity(null);
    setShowContactBox(false);
    setContactStatus('');
  }

  function renderCommunityRow(location: AppCommunity['locations'][number], keyPrefix = 'community') {
    return (
      <View key={`${keyPrefix}-${location.name}`} style={[styles.card, styles.communityCard]}>
        <View style={styles.communityRowHeader}>
          <TouchableOpacity style={styles.communityRowBody} activeOpacity={0.86} onPress={() => openCommunityPresentation(location.name)}>
            <Text style={styles.cardTitle}>{location.name}</Text>
            <Text style={styles.cardText}>{location.address}</Text>
            <Text style={styles.cardText}>Contacto: {location.phone}</Text>
            <Text style={styles.cardText}>Reunion: {location.meetingDay} - {location.meetingTime}</Text>
            <Text style={styles.expandHint}>Tocar para ver presentacion</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  useEffect(() => {
    let alive = true;
    fetchCommunities().then((items) => {
      if (alive) {
        setCommunityData(items);
      }
    });
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  async function sendCommunityContactMessage() {
    if (!community?.id) {
      setContactStatus('No se encontro la comunidad seleccionada.');
      return;
    }
    if (!contactMessage.trim()) {
      setContactStatus('Escribi un mensaje antes de enviarlo.');
      return;
    }
    if (!session && (!contactName.trim() || !contactInfoValue.trim())) {
      setContactStatus('Deja tu nombre y un contacto para que puedan responderte.');
      return;
    }
    const { error } = await createCommunityContactMessage({
      communityId: community.id,
      senderName: contactName.trim() || session?.fullName || 'Consulta externa',
      senderContact: contactInfoValue.trim() || session?.email || '',
      message: contactMessage.trim()
    });
    if (error) {
      setContactStatus(error.message);
      return;
    }
    setContactStatus(changeDone('Mensaje enviado al buzon de la comunidad.'));
    setContactMessage('');
  }

  useEffect(() => {
    if (Platform.OS !== 'android' || !selectedProvince) {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedCommunity) {
        setSelectedCommunity(null);
        return true;
      }
      setSelectedProvince(null);
      return true;
    });
    return () => subscription.remove();
  }, [selectedCommunity, selectedProvince]);

  if (province) {
    const provinceInitials = province.province.slice(0, 2).toUpperCase();
    const provinceLogo = provinceLogos[province.province];
    return (
      <View style={styles.stack}>
        <TouchableOpacity style={styles.backButton} onPress={() => { setSelectedCommunity(null); setSelectedProvince(null); }} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={18} color={palette.red} />
          <Text style={styles.backButtonText}>Provincias</Text>
        </TouchableOpacity>
        <SectionTitle title={province.province} />
        <TouchableOpacity style={styles.provinceLogoLarge} onPress={() => setSelectedProvinceLogo(province)} activeOpacity={0.85}>
          {provinceLogo ? <Image source={provinceLogo} style={styles.provinceLogoImage} /> : <Text style={styles.provinceLogoText}>{provinceInitials}</Text>}
        </TouchableOpacity>
        <Text style={styles.screenIntro}>{province.description}</Text>
        <Modal visible={Boolean(selectedProvinceLogo)} transparent animationType="fade" onRequestClose={() => setSelectedProvinceLogo(null)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedProvinceLogo(null)}>
            <View style={styles.provinceLogoModal}>
              {selectedProvinceLogo && provinceLogos[selectedProvinceLogo.province] ? <Image source={provinceLogos[selectedProvinceLogo.province]} style={styles.provinceLogoModalImage} /> : <Text style={styles.provinceLogoModalText}>{selectedProvinceLogo?.province.slice(0, 2).toUpperCase()}</Text>}
              <Text style={styles.cardTitle}>{selectedProvinceLogo?.province}</Text>
            </View>
          </TouchableOpacity>
        </Modal>
        <Modal visible={Boolean(community)} transparent animationType="slide" onRequestClose={closeCommunityModal} statusBarTranslucent>
          <View style={styles.modalOverlay} pointerEvents="box-none">
            <Pressable style={styles.modalBackdropTouch} onPress={closeCommunityModal} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0} style={styles.modalKeyboardAvoider} pointerEvents="box-none">
            <View style={[styles.modalPanel, styles.communityModalPanel]} pointerEvents="auto">
              <ScrollView
                ref={contactScrollRef}
                style={styles.communityModalScroll}
                keyboardShouldPersistTaps="always"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                nestedScrollEnabled
                scrollEventThrottle={16}
                overScrollMode="always"
                showsVerticalScrollIndicator
                contentContainerStyle={styles.modalScrollContent}
              >
              <TouchableOpacity style={styles.modalCloseButton} onPress={closeCommunityModal} activeOpacity={0.8}>
                <Ionicons name="close" size={22} color={palette.red} />
              </TouchableOpacity>
              {community ? (
                <>
                  <Image source={{ uri: community.imageUrl }} style={styles.communityModalImage} />
                  <Text style={styles.cardEyebrow}>{province.region}</Text>
                  <Text style={styles.cardTitle}>{community.name}</Text>
                  <View style={styles.communityModalMeta}>
                    <View style={styles.communityModalMetaItem}>
                      <Ionicons name="map-outline" size={17} color={palette.red} />
                      <Text style={styles.communityModalMetaText}>{province.province}</Text>
                    </View>
                    <View style={styles.communityModalMetaItem}>
                      <Ionicons name="people-outline" size={17} color={palette.red} />
                      <Text style={styles.communityModalMetaText}>{province.locations.length} comunidades activas</Text>
                    </View>
                    <View style={styles.communityModalMetaItem}>
                      <Ionicons name="call-outline" size={17} color={palette.red} />
                      <Text style={styles.communityModalMetaText}>{community.phone}</Text>
                    </View>
                    <View style={styles.communityModalMetaItem}>
                      <Ionicons name="calendar-outline" size={17} color={palette.red} />
                      <Text style={styles.communityModalMetaText}>{community.meetingDay} - {community.meetingTime}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardText}>{community.address}</Text>
                  <Text style={styles.cardText}>{community.description}</Text>
                  <View style={styles.inlineActions}>
                    <TouchableOpacity style={styles.locationIconButton} onPress={() => openCommunityLocation(community)} accessibilityLabel="Abrir ubicacion">
                      <Ionicons name="location-outline" size={22} color={palette.white} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.locationIconButton} onPress={() => { setShowContactBox(!showContactBox); setTimeout(() => contactScrollRef.current?.scrollToEnd({ animated: true }), 120); }} accessibilityLabel="Enviar mensaje">
                      <Ionicons name="chatbubble-outline" size={22} color={palette.white} />
                    </TouchableOpacity>
                  </View>
                  {showContactBox ? (
                    <View style={styles.inlineEditorPanel}>
                      <Text style={styles.cardEyebrow}>Mensaje a animación/coordinación</Text>
                      {!session ? (
                        <>
                          <Text style={styles.inputLabel}>Nombre</Text>
                          <TextInput style={styles.input} placeholder="Ej: Juan Perez" value={contactName} onChangeText={setContactName} onFocus={() => setTimeout(() => contactScrollRef.current?.scrollToEnd({ animated: true }), 160)} placeholderTextColor={inputPlaceholderColor} />
                          <Text style={styles.inputLabel}>Contacto</Text>
                          <TextInput style={styles.input} placeholder="Ej: nombre@email.com o telefono" value={contactInfoValue} onChangeText={setContactInfoValue} onFocus={() => setTimeout(() => contactScrollRef.current?.scrollToEnd({ animated: true }), 160)} placeholderTextColor={inputPlaceholderColor} />
                        </>
                      ) : null}
                      <Text style={styles.inputLabel}>Mensaje</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Escribi tu consulta para la comunidad"
                        value={contactMessage}
                        onChangeText={(value) => setContactMessage(value.slice(0, 500))}
                        onFocus={() => setTimeout(() => contactScrollRef.current?.scrollToEnd({ animated: true }), 160)}
                        multiline placeholderTextColor={inputPlaceholderColor} />
                      <Text style={styles.cardText}>{contactMessage.length}/500</Text>
                      <TouchableOpacity style={styles.primaryButton} onPress={sendCommunityContactMessage}>
                        <Text style={styles.primaryButtonText}>Enviar mensaje</Text>
                      </TouchableOpacity>
                      {contactStatus ? <Text style={styles.cardText}>{contactStatus}</Text> : null}
                    </View>
                  ) : null}
                </>
              ) : null}
              </ScrollView>
            </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
        {(province.province === 'Tucuman' || province.province === 'Catamarca') ? (
          <>
            <SectionTitle title="Comunidades de jovenes" />
            {province.locations.filter((location) => location.group !== 'adultos').map((location) => renderCommunityRow(location, 'young'))}
            <SectionTitle title="Comunidades de adultos" />
            {province.locations.filter((location) => location.group === 'adultos').map((location) => renderCommunityRow(location, 'adult'))}
          </>
        ) : province.locations.map((location) => (
          renderCommunityRow(location)
        ))}
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      {visibleCommunityData.map((community) => (
        <TouchableOpacity key={community.province} style={[styles.card, styles.provinceCard]} onPress={() => setSelectedProvince(community.province)} activeOpacity={0.85}>
          <TouchableOpacity style={styles.provinceIcon} onPress={() => setSelectedProvinceLogo(community)} activeOpacity={0.85}>
            {provinceLogos[community.province] ? <Image source={provinceLogos[community.province]} style={styles.provinceLogoMiniImage} /> : <Text style={styles.provinceLogoMiniText}>{community.province.slice(0, 2).toUpperCase()}</Text>}
          </TouchableOpacity>
          <View style={styles.provinceBody}>
            <Text style={styles.cardEyebrow}>{community.region}</Text>
            <Text style={styles.cardTitle}>{community.province}</Text>
            <Text style={styles.cardText}>{community.description}</Text>
            <Text style={styles.expandHint}>{community.locations.length} comunidades activas</Text>
          </View>
        </TouchableOpacity>
      ))}
      <Modal visible={Boolean(selectedProvinceLogo)} transparent animationType="fade" onRequestClose={() => setSelectedProvinceLogo(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedProvinceLogo(null)}>
          <View style={styles.provinceLogoModal}>
            {selectedProvinceLogo && provinceLogos[selectedProvinceLogo.province] ? <Image source={provinceLogos[selectedProvinceLogo.province]} style={styles.provinceLogoModalImage} /> : <Text style={styles.provinceLogoModalText}>{selectedProvinceLogo?.province.slice(0, 2).toUpperCase()}</Text>}
            <Text style={styles.cardTitle}>{selectedProvinceLogo?.province}</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function HistoryScreen({ title, content, editor }: { title: string; content?: AppContentBlock; editor?: PageEditorProps }) {
  const shouldShowFallback = !content && !editor?.contentLoaded;
  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      {shouldShowFallback ? (
        <View style={styles.contentIntro}>
          <Text style={styles.cardTitle}>Nuestra Historia</Text>
          {movementHistory.map((paragraph, index) => <Text key={`${paragraph.slice(0, 12)}-${index}`} style={styles.cardText}>{paragraph}</Text>)}
        </View>
      ) : null}
      {!content && editor?.contentLoaded ? <EmptyRemoteContent title="Historia pendiente" /> : null}
    </View>
  );
}

function ContactScreen({ title, content, editor, adminConfig }: { title: string; content?: AppContentBlock; editor?: PageEditorProps; adminConfig: AppAdminConfig }) {
  const shouldShowFallback = !content && !editor?.contentLoaded;
  const contactBlocks = adminConfig.contact.blocks ?? [];
  const provinceInstagram = adminConfig.contact.provinceInstagram ?? {};
  const hasProvinceInstagram = Object.entries(provinceInstagram).some(([, value]) => value.trim());
  const hasContactPanel = shouldShowFallback || contactBlocks.length > 0 || hasProvinceInstagram || Boolean(adminConfig.contact.email || adminConfig.contact.phone || adminConfig.contact.instagram || adminConfig.contact.helpText || adminConfig.contact.donationText);
  const openContactValue = (value: string) => {
    if (!value.trim()) {
      return;
    }
    const url = value.startsWith('http') ? value : `https://www.instagram.com/${value.replace('@', '')}`;
    Linking.openURL(url);
  };
  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      {hasContactPanel ? (
        <View style={styles.contentIntro}>
          <Text style={styles.cardTitle}>Encontrar una comunidad</Text>
          <Text style={styles.cardText}>{adminConfig.contact.helpText}</Text>
          {adminConfig.contact.email ? <Text style={styles.cardText}>Mail: {adminConfig.contact.email}</Text> : null}
          {adminConfig.contact.phone ? <Text style={styles.cardText}>Celular: {adminConfig.contact.phone}</Text> : null}
          {adminConfig.contact.instagram ? (
            <TouchableOpacity style={styles.instagramButton} onPress={() => openContactValue(adminConfig.contact.instagram)}>
              <Ionicons name="logo-instagram" size={20} color={palette.white} />
              <Text style={styles.instagramButtonTitle}>Instagram nacional</Text>
            </TouchableOpacity>
          ) : null}
          {hasProvinceInstagram ? (
            <View style={styles.provinceInstagramPanel}>
              <Text style={styles.cardEyebrow}>Instagram por provincia</Text>
              {Object.entries(provinceInstagram).filter(([, value]) => value.trim()).map(([province, value]) => (
                <TouchableOpacity key={province} style={styles.provinceInstagramButton} onPress={() => openContactValue(value)} activeOpacity={0.86}>
                  <View style={styles.provinceInstagramLogo}>
                    {provinceLogos[province] ? <Image source={provinceLogos[province]} style={styles.provinceInstagramLogoImage} /> : <Text style={styles.provinceLogoMiniText}>{provinceDisplayNames[province]?.slice(0, 2).toUpperCase() ?? province.slice(0, 2).toUpperCase()}</Text>}
                  </View>
                  <View style={styles.adminUserHeaderText}>
                    <Text style={styles.provinceInstagramName}>{provinceDisplayNames[province] ?? province}</Text>
                    <Text style={styles.feedMeta}>Instagram oficial</Text>
                  </View>
                  <Ionicons name="logo-instagram" size={20} color={palette.red} />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
          {contactBlocks.map((block) => (
            <View key={block.id} style={styles.innerNewsCard}>
              <Text style={styles.cardEyebrow}>{block.type}</Text>
              {block.label ? <Text style={styles.cardTitle}>{block.label}</Text> : null}
              {block.type === 'imagen' && block.value ? <Image source={{ uri: block.value }} style={styles.cardImage} /> : <Text style={styles.cardText}>{block.value}</Text>}
              {['enlace', 'boton', 'red_social'].includes(block.type) && block.value ? (
                <TouchableOpacity style={styles.secondaryButton} onPress={() => Linking.openURL(block.value.startsWith('http') ? block.value : `https://${block.value}`)}>
                  <Text style={styles.secondaryButtonText}>Abrir enlace</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
          <Text style={styles.cardText}>{adminConfig.contact.donationText}</Text>
        </View>
      ) : null}
      {!content && editor?.contentLoaded ? <EmptyRemoteContent title="Contacto pendiente" /> : null}
    </View>
  );
}

function MaintenanceScreen({ adminConfig, onNavigate }: { adminConfig: AppAdminConfig; onNavigate: (tab: TabKey) => void }) {
  const message = adminConfig.settings.globalMessage.trim() || 'Estamos realizando tareas de mantenimiento. La aplicación volverá a estar disponible próximamente.';
  return (
    <View style={styles.stack}>
      <View style={styles.maintenancePanel}>
        <View style={styles.brandLogo}>
          <Image source={palestraLogo} style={styles.brandLogoImage} />
        </View>
        <Text style={styles.maintenanceTitle}>{adminConfig.identity.appName || 'Palestra'}</Text>
        <Text style={styles.maintenanceText}>{message}</Text>
        <Text style={styles.cardText}>Estamos ajustando herramientas internas para que la experiencia sea mas estable.</Text>
        <View style={styles.inlineActions}>
          {adminConfig.settings.futureForumEnabled ? (
            <TouchableOpacity style={styles.primaryButton} onPress={() => onNavigate('foro')}>
              <Ionicons name="chatbubbles-outline" size={17} color={palette.white} />
              <Text style={styles.primaryButtonText}>Ir al Foro</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.secondaryButton} onPress={() => onNavigate('perfil')}>
            <Text style={styles.secondaryButtonText}>Mi Perfil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function LibrarySectionScreen({
  session,
  title,
  section,
  variant,
  content,
  editor
}: {
  session: Session | null;
  title: string;
  section: LibrarySection;
  variant: 'prayer' | 'song';
  content?: AppContentBlock;
  editor?: PageEditorProps;
}) {
  const [items, setItems] = useState<AppLibraryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<AppLibraryItem | null>(null);
  const [editingItem, setEditingItem] = useState<AppLibraryItem | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftSubtitle, setDraftSubtitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftImageUrl, setDraftImageUrl] = useState('');
  const [message, setMessage] = useState('');
  const canCreateItems = Boolean(session && roleRank(session.role) >= roleRank('sedimentador'));
  const emptyTitle = section === 'oraciones' ? 'No hay oraciones publicadas' : section === 'himno' ? 'No hay himnos publicados' : 'No hay canciones publicadas';

  async function loadItems() {
    setItems(await fetchLibraryItems(section));
  }

  useEffect(() => {
    loadItems();
    setSelectedItem(null);
    setShowEditor(false);
  }, [section]);

  function resetDraft(item?: AppLibraryItem | null) {
    setEditingItem(item ?? null);
    setDraftTitle(item?.title ?? '');
    setDraftSubtitle(item?.subtitle ?? '');
    setDraftBody(item?.body ?? '');
    setDraftImageUrl(item?.image_url ?? '');
    setShowEditor(true);
    setMessage('');
  }

  function canManageLibraryItem(item: AppLibraryItem) {
    return Boolean(session && (item.created_by === session.id || canManagePublishedContent(session)));
  }

  async function chooseLibraryImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    try {
      setMessage('Subiendo imagen...');
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const bytes = await response.arrayBuffer();
      const extension = asset.fileName?.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${section}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('library-images')
        .upload(path, bytes, { contentType: asset.mimeType ?? 'image/jpeg', upsert: true });
      if (uploadError) {
        setMessage(uploadError.message);
        return;
      }
      const { data: publicUrl } = supabase.storage.from('library-images').getPublicUrl(path);
      setDraftImageUrl(publicUrl.publicUrl);
      setMessage(changeDone('Imagen cargada.'));
    } catch {
      setMessage('No pude subir la imagen.');
    }
  }

  async function submitItem() {
    if (!draftTitle.trim() || !draftBody.trim()) {
      setMessage('Completa titulo y contenido antes de guardar.');
      return;
    }
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setMessage('Para publicar contenido tenés que iniciar sesión con una cuenta real de Supabase. El acceso de prueba interno no puede guardar publicaciones.');
      return;
    }
    const { error } = await saveLibraryItem({
      id: editingItem?.id,
      section,
      title: draftTitle.trim(),
      subtitle: draftSubtitle.trim(),
      body: draftBody.trim(),
      imageUrl: draftImageUrl.trim() || null,
      category: null,
      source: null,
      itemDate: null,
      status: 'publicado',
      sortOrder: editingItem?.sort_order ?? 100
    });
    if (error) {
      const debug = await debugLibraryPermission();
      if (debug) {
        setMessage(`${error.message} Supabase ve: ${debug.email ?? 'sin mail'} / ${debug.role ?? 'sin rol'} / ${debug.status ?? 'sin estado'}.`);
      } else {
        setMessage(error.message);
      }
      return;
    }
    setMessage(changeDone('Contenido guardado.'));
    setShowEditor(false);
    await loadItems();
  }

  async function deleteItem(item: AppLibraryItem) {
    Alert.alert('Eliminar contenido', 'Este elemento dejara de mostrarse en la app. ¿Deseas continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await archiveLibraryItem(item.id);
          if (error) {
            setMessage(error.message);
            return;
          }
          setSelectedItem(null);
          setMessage(changeDone('Contenido eliminado.'));
          await loadItems();
        }
      }
    ]);
  }

  if (selectedItem) {
    const stanzas = selectedItem.body.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
    return (
      <View style={styles.stack}>
        <TouchableOpacity style={styles.backButton} onPress={() => setSelectedItem(null)} activeOpacity={0.82}>
          <Ionicons name="chevron-back" size={18} color={palette.red} />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
        <View style={variant === 'prayer' ? styles.prayerReader : styles.songReader}>
          {variant === 'song' && selectedItem.image_url ? <Image source={{ uri: selectedItem.image_url }} style={styles.songHeroImage} resizeMode="cover" /> : null}
          <Text style={variant === 'prayer' ? styles.prayerReaderTitle : styles.songReaderTitle}>{selectedItem.title}</Text>
          {selectedItem.subtitle ? <Text style={variant === 'prayer' ? styles.prayerReaderSubtitle : styles.songReaderSubtitle}>{selectedItem.subtitle}</Text> : null}
          <View style={variant === 'prayer' ? styles.prayerDivider : styles.songDivider} />
          {stanzas.map((stanza, index) => (
            <Text key={`${selectedItem.id}-${index}`} style={variant === 'prayer' ? styles.prayerParagraph : styles.songStanza}>
              {stanza}
            </Text>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      <View style={variant === 'prayer' ? styles.libraryPlainPanel : styles.libraryVisualPanel}>
        <View style={styles.libraryHeaderRow}>
          <View style={styles.flexOne}>
            <Text style={variant === 'prayer' ? styles.libraryPlainTitle : styles.libraryVisualTitle}>{section === 'oraciones' ? 'Biblioteca de oraciones' : section === 'himno' ? 'Himnos y canciones' : 'Cancionero palestrista'}</Text>
            <Text style={styles.cardText}>{section === 'oraciones' ? 'Lectura simple, clara y rapida.' : 'Letras ordenadas para encuentros, retiros y comunidades.'}</Text>
          </View>
          {canCreateItems ? (
            <TouchableOpacity style={styles.iconActionButton} onPress={() => resetDraft(null)} activeOpacity={0.82}>
              <Ionicons name="add" size={22} color={palette.white} />
            </TouchableOpacity>
          ) : null}
        </View>
        {message ? <Text style={styles.formErrorText}>{message}</Text> : null}
        {showEditor && canCreateItems ? (
          <View style={styles.libraryEditor}>
            <Text style={styles.cardTitle}>{editingItem ? 'Editar contenido' : 'Nuevo contenido'}</Text>
            <TextInput style={styles.input} placeholder="Titulo" value={draftTitle} onChangeText={setDraftTitle} placeholderTextColor={inputPlaceholderColor} />
            <TextInput style={styles.input} placeholder="Subtitulo opcional" value={draftSubtitle} onChangeText={setDraftSubtitle} placeholderTextColor={inputPlaceholderColor} />
            {variant === 'song' ? (
              <>
                <TextInput style={styles.input} placeholder="URL de portada o imagen" value={draftImageUrl} onChangeText={setDraftImageUrl} autoCapitalize="none" placeholderTextColor={inputPlaceholderColor} />
                <TouchableOpacity style={styles.secondaryButton} onPress={chooseLibraryImage}>
                  <Text style={styles.secondaryButtonText}>Subir imagen</Text>
                </TouchableOpacity>
              </>
            ) : null}
            <TextInput style={[styles.input, styles.textArea, styles.libraryBodyInput]} placeholder={variant === 'prayer' ? 'Texto de la oracion' : 'Letra separada por estrofas'} value={draftBody} onChangeText={setDraftBody} multiline placeholderTextColor={inputPlaceholderColor} />
            <TouchableOpacity style={styles.primaryButton} onPress={submitItem}>
              <Text style={styles.primaryButtonText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowEditor(false)}>
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {items.length === 0 ? (
          <View style={styles.emptyLibraryState}>
            <Text style={styles.cardTitle}>{emptyTitle}</Text>
            <Text style={styles.cardText}>Cuando se cargue contenido en Supabase, aparecera aca sin actualizar la APK.</Text>
          </View>
        ) : null}
        {items.map((item) => (
          <TouchableOpacity key={item.id} style={variant === 'prayer' ? styles.prayerListRow : styles.songListRow} activeOpacity={0.84} onPress={() => setSelectedItem(item)}>
            {variant === 'song' ? (
              <View style={styles.songThumb}>
                {item.image_url ? <Image source={{ uri: item.image_url }} style={styles.songThumbImage} resizeMode="cover" /> : <Ionicons name="musical-notes-outline" size={22} color={palette.red} />}
              </View>
            ) : null}
            <View style={styles.flexOne}>
              <Text style={variant === 'prayer' ? styles.prayerListTitle : styles.songListTitle}>{item.title}</Text>
              {item.subtitle ? <Text style={styles.libraryMeta}>{item.subtitle}</Text> : null}
            </View>
            {canManageLibraryItem(item) ? (
              <View style={styles.libraryActions}>
                <TouchableOpacity style={styles.tinyIconButton} onPress={() => resetDraft(item)}>
                  <Ionicons name="create-outline" size={17} color={palette.red} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.tinyIconButton} onPress={() => deleteItem(item)}>
                  <Ionicons name="trash-outline" size={17} color="#B93232" />
                </TouchableOpacity>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={18} color={palette.inkMuted} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function EmptyRemoteContent({ title }: { title: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardText}>No hay contenido publicado en Supabase para esta sección todavía.</Text>
    </View>
  );
}

function GenericPageScreen({ title, content, editor }: { title: string; content?: AppContentBlock; editor?: PageEditorProps }) {
  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      {!content ? (
        <View style={styles.card}>
          <Text style={styles.cardText}>Esta página todavía no tiene contenido cargado.</Text>
        </View>
      ) : null}
    </View>
  );
}

function ForumScreen({ session, title }: { session: Session | null; title: string }) {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [showComposer, setShowComposer] = useState(false);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicBody, setTopicBody] = useState('');
  const [topicMinRole, setTopicMinRole] = useState<Role>('invitado');
  const [commentDraft, setCommentDraft] = useState('');
  const [forumMessage, setForumMessage] = useState('');
  const canCreate = Boolean(session && session.status === 'aprobado' && session.role !== 'invitado');
  const selectedCategory = categories.find((item) => item.id === selectedCategoryId);
  const allowedRoles = visibleForumRolesFor(session, selectedCategory);

  async function loadCategories() {
    const items = (await fetchForumCategories()).filter((category) => canUseForumCategory(session, category));
    setCategories(items);
    if ((!selectedCategoryId || !items.some((item) => item.id === selectedCategoryId)) && items.length > 0) {
      const national = items.find((item) => item.scope === 'nacional');
      setSelectedCategoryId((national ?? items[0]).id);
    }
  }

  async function loadTopics(categoryId = selectedCategoryId) {
    if (!categoryId) {
      setTopics([]);
      return;
    }
    setTopics(await fetchForumTopics(categoryId));
  }

  async function openTopic(topic: ForumTopic) {
    setSelectedTopic(topic);
    setComments(await fetchForumComments(topic.id));
  }

  useEffect(() => {
    loadCategories();
  }, [session?.role, session?.province, session?.status]);

  useEffect(() => {
    loadTopics(selectedCategoryId);
    setSelectedTopic(null);
  }, [selectedCategoryId]);

  useEffect(() => {
    const fallbackRole = allowedRoles.includes(topicMinRole) ? topicMinRole : allowedRoles[allowedRoles.length - 1] ?? 'invitado';
    setTopicMinRole(fallbackRole);
  }, [session?.role, selectedCategoryId]);

  async function submitTopic() {
    if (!canCreate) {
      setForumMessage('Iniciá sesión con un usuario aprobado para crear temas.');
      return;
    }
    if (!selectedCategoryId || !topicTitle.trim() || !topicBody.trim()) {
      setForumMessage('Completa categoria, titulo y contenido.');
      return;
    }
    const { error } = selectedTopic && selectedTopic.authorId === session?.id
      ? await updateForumTopic({ topicId: selectedTopic.id, title: topicTitle.trim(), body: topicBody.trim(), minRole: topicMinRole })
      : await createForumTopic({ categoryId: selectedCategoryId, title: topicTitle.trim(), body: topicBody.trim(), minRole: topicMinRole });
    if (error) {
      setForumMessage(error.message);
      return;
    }
    setTopicTitle('');
    setTopicBody('');
    setTopicMinRole('invitado');
    setShowComposer(false);
    setForumMessage(changeDone('Tema guardado en el foro.'));
    await loadTopics(selectedCategoryId);
  }

  function startEditTopic(topic: ForumTopic) {
    setSelectedTopic(topic);
    setTopicTitle(topic.title);
    setTopicBody(topic.body);
    setTopicMinRole(topic.minRole);
    setShowComposer(true);
  }

  async function closeTopic(topic: ForumTopic) {
    const nextStatus = topic.status === 'cerrado' ? 'abierto' : 'cerrado';
    const { error } = await setForumTopicStatus(topic.id, nextStatus);
    if (error) {
      setForumMessage(error.message);
      return;
    }
    setForumMessage(changeDone(nextStatus === 'cerrado' ? 'Tema cerrado.' : 'Tema reabierto.'));
    await loadTopics();
    if (selectedTopic?.id === topic.id) {
      setSelectedTopic({ ...topic, status: nextStatus });
    }
  }

  async function deleteTopic(topic: ForumTopic) {
    const confirmed = Platform.OS === 'web' ? (typeof window === 'undefined' ? true : window.confirm('Eliminar este tema del foro?')) : await new Promise<boolean>((resolve) => {
      Alert.alert('Eliminar tema', 'Eliminar este tema del foro?', [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) }
      ]);
    });
    if (!confirmed) {
      return;
    }
    const { error } = await archiveForumTopic(topic.id);
    if (error) {
      setForumMessage(error.message);
      return;
    }
    setSelectedTopic(null);
    setForumMessage(changeDone('Tema eliminado.'));
    await loadTopics();
  }

  async function submitComment() {
    if (!canCreate) {
      setForumMessage('Iniciá sesión con un usuario aprobado para comentar.');
      return;
    }
    if (!selectedTopic || !commentDraft.trim()) {
      setForumMessage('Escribe un comentario antes de publicar.');
      return;
    }
    const { error } = await createForumComment(selectedTopic.id, commentDraft.trim());
    if (error) {
      setForumMessage(error.message);
      return;
    }
    setCommentDraft('');
    setComments(await fetchForumComments(selectedTopic.id));
    setForumMessage(changeDone('Comentario publicado.'));
    await loadTopics(selectedTopic.categoryId);
  }

  async function deleteComment(comment: ForumComment) {
    const { error } = await archiveForumComment(comment.id);
    if (error) {
      setForumMessage(error.message);
      return;
    }
    if (selectedTopic) {
      setComments(await fetchForumComments(selectedTopic.id));
    }
  }

  function canModerateTopic(topic: ForumTopic) {
    return Boolean(session && (topic.authorId === session.id || roleRank(session.role) > roleRank(topic.authorRole)));
  }

  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <View style={styles.contentIntro}>
        <Text style={styles.cardTitle}>Foro Palestrista</Text>
        <Text style={styles.cardText}>Temas nacionales y provinciales, ordenados por rango y alcance. Por ahora solo texto.</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
        {categories.map((category) => (
          <TouchableOpacity key={category.id} style={[styles.filterChip, selectedCategoryId === category.id && styles.filterChipActive]} onPress={() => setSelectedCategoryId(category.id)}>
            <Text style={[styles.filterChipText, selectedCategoryId === category.id && styles.filterChipTextActive]}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {selectedCategory ? (
        <View style={styles.featurePanel}>
          <Text style={styles.cardEyebrow}>{selectedCategory.scope}</Text>
          <Text style={styles.cardTitle}>{selectedCategory.name}</Text>
          <Text style={styles.cardText}>{selectedCategory.description ?? 'Categoria del foro.'}</Text>
          {canCreate ? (
            <TouchableOpacity style={styles.primaryButton} onPress={() => { setShowComposer(!showComposer); setSelectedTopic(null); }}>
              <Ionicons name="add-circle-outline" size={17} color={palette.white} />
              <Text style={styles.primaryButtonText}>Crear tema</Text>
            </TouchableOpacity>
          ) : <Text style={styles.cardText}>Iniciá sesión para crear temas o comentar.</Text>}
        </View>
      ) : null}
      {showComposer ? (
        <View style={styles.inlineEditorPanel}>
          <Text style={styles.cardEyebrow}>{selectedTopic ? 'Editar tema' : 'Nuevo tema'}</Text>
          <Text style={styles.inputLabel}>Titulo</Text>
          <TextInput style={styles.input} placeholder="Escribe un titulo claro" placeholderTextColor="#7FA4B5" value={topicTitle} onChangeText={setTopicTitle} />
          <Text style={styles.inputLabel}>Contenido</Text>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Comparte el tema para conversar en comunidad" placeholderTextColor="#7FA4B5" value={topicBody} onChangeText={setTopicBody} multiline />
          <Text style={styles.cardEyebrow}>Visible para</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
            {allowedRoles.map((role) => (
              <TouchableOpacity key={role} style={[styles.filterChip, topicMinRole === role && styles.filterChipActive]} onPress={() => setTopicMinRole(role)}>
                <Text style={[styles.filterChipText, topicMinRole === role && styles.filterChipTextActive]}>{roleLabel(role)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.primaryButton} onPress={submitTopic}>
            <Text style={styles.primaryButtonText}>Guardar tema</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {forumMessage ? <Text style={styles.cardText}>{forumMessage}</Text> : null}
      {selectedTopic ? (
        <View style={styles.profileCommunityPanel}>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedTopic(null)}>
            <Ionicons name="chevron-back" size={16} color={palette.red} />
            <Text style={styles.backButtonText}>Volver a temas</Text>
          </TouchableOpacity>
          <Text style={styles.cardEyebrow}>{selectedTopic.status} - {roleLabel(selectedTopic.minRole)} en adelante</Text>
          <Text style={styles.cardTitle}>{selectedTopic.title}</Text>
          <Text style={styles.cardText}>{selectedTopic.body}</Text>
          <Text style={styles.cardText}>Por {selectedTopic.authorName} - {roleLabel(selectedTopic.authorRole)}</Text>
          {canModerateTopic(selectedTopic) ? (
            <View style={styles.inlineActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => startEditTopic(selectedTopic)}>
                <Text style={styles.secondaryButtonText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => closeTopic(selectedTopic)}>
                <Text style={styles.secondaryButtonText}>{selectedTopic.status === 'cerrado' ? 'Reabrir' : 'Cerrar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => deleteTopic(selectedTopic)}>
                <Text style={styles.secondaryButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <SectionTitle title="Respuestas" />
          {comments.length === 0 ? <Text style={styles.cardText}>Todavia no hay respuestas.</Text> : null}
          {comments.map((comment) => (
            <View key={comment.id} style={styles.innerNewsCard}>
              <Text style={styles.cardEyebrow}>{comment.authorName} - {roleLabel(comment.authorRole)}</Text>
              <Text style={styles.feedMeta}>{new Date(comment.createdAt).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
              <Text style={styles.cardText}>{comment.body}</Text>
              {(comment.authorId === session?.id || canModerateTopic(selectedTopic)) ? (
                <TouchableOpacity style={styles.actionPill} onPress={() => deleteComment(comment)}>
                  <Ionicons name="trash-outline" size={16} color={palette.red} />
                  <Text style={styles.actionPillText}>Eliminar</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
          {canCreate && selectedTopic.status === 'abierto' ? (
            <View style={styles.inlineEditorPanel}>
              <Text style={styles.inputLabel}>Comentario</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Escribe una respuesta respetuosa" placeholderTextColor="#7FA4B5" value={commentDraft} onChangeText={setCommentDraft} multiline />
              <TouchableOpacity style={styles.primaryButton} onPress={submitComment}>
                <Text style={styles.primaryButtonText}>Publicar respuesta</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.stack}>
          {topics.length === 0 ? <Text style={styles.cardText}>Todavia no hay temas publicados en esta categoria.</Text> : null}
          {topics.map((topic) => (
            <TouchableOpacity key={topic.id} style={styles.innerNewsCard} activeOpacity={0.86} onPress={() => openTopic(topic)}>
              <Text style={styles.cardEyebrow}>{topic.status} - {roleLabel(topic.minRole)} en adelante</Text>
              <Text style={styles.cardTitle}>{topic.title}</Text>
              <Text style={styles.cardText}>{topic.body}</Text>
              <Text style={styles.expandHint}>{topic.replyCount} respuesta/s - abrir tema</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function ProfileScreen({
  session,
  onSessionChange,
  tabs,
  appContent,
  adminConfig,
  touchPointerEnabled,
  onTouchPointerEnabledChange,
  themeName,
  appTheme,
  onThemeChange,
  onAdminConfigChange,
  onTabsChanged,
  onContentChanged,
  onNavigate,
  onSavedFeedback,
  onErrorFeedback,
  onViewAsSession,
  initialPanel = 'vista'
}: {
  session: Session | null;
  onSessionChange: (session: Session | null) => void;
  tabs: AppTabDisplay[];
  appContent: AppContentBlock[];
  adminConfig: AppAdminConfig;
  touchPointerEnabled: boolean;
  onTouchPointerEnabledChange: (value: boolean) => void;
  themeName: ThemeName;
  appTheme: AppTheme;
  onThemeChange: (theme: ThemeName) => Promise<void>;
  onAdminConfigChange: (config: AppAdminConfig) => void;
  onTabsChanged: () => Promise<void>;
  onContentChanged: () => Promise<void>;
  onNavigate: (tab: TabKey) => void;
  onSavedFeedback: (message?: string) => void;
  onErrorFeedback: (message?: string) => void;
  onViewAsSession: (session: Session) => void;
  initialPanel?: ProfilePanel;
}) {
  const [showCommunity, setShowCommunity] = useState(false);
  const [showCommunityManagement, setShowCommunityManagement] = useState(false);
  const [showProfilePhoto, setShowProfilePhoto] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [userRequestText, setUserRequestText] = useState('');
  const [selectedSentRequestId, setSelectedSentRequestId] = useState('');
  const [profilePanel, setProfilePanel] = useState<ProfilePanel>(initialPanel);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPasswordConfirm, setAuthPasswordConfirm] = useState('');
  const [authPasswordVisible, setAuthPasswordVisible] = useState(false);
  const [authFocusedField, setAuthFocusedField] = useState('');
  const [authErrors, setAuthErrors] = useState<Record<string, string>>({});
  const [authMessage, setAuthMessage] = useState('');
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState('desconocido');
  const [pushTokenPreview, setPushTokenPreview] = useState('');
  const [pushDebugInfo, setPushDebugInfo] = useState('');
  const [pushCurrentToken, setPushCurrentToken] = useState('');
  const [pushChannelDebug, setPushChannelDebug] = useState('');
  const [pushTestResult, setPushTestResult] = useState('');
  const [showPushDiagnostics, setShowPushDiagnostics] = useState(false);
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerContact, setRegisterContact] = useState('');
  const [registerProvince, setRegisterProvince] = useState('');
  const [registerCommunity, setRegisterCommunity] = useState('');
  const [registrationCommunities, setRegistrationCommunities] = useState<AppCommunity[]>(communities);
  const [provinceDropdownOpen, setProvinceDropdownOpen] = useState(false);
  const [communityDropdownOpen, setCommunityDropdownOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [editFullName, setEditFullName] = useState(session?.fullName ?? '');
  const [editContact, setEditContact] = useState(session?.contact ?? '');
  const [editProvince, setEditProvince] = useState(session?.province ?? '');
  const [editCommunity, setEditCommunity] = useState(session?.communityOfOrigin ?? '');
  const [editGenderPreference, setEditGenderPreference] = useState<'male' | 'female' | null>(session?.genderPreference ?? null);
  const [editProvinceDropdownOpen, setEditProvinceDropdownOpen] = useState(false);
  const [editCommunityDropdownOpen, setEditCommunityDropdownOpen] = useState(false);
  const [realPendingProfiles, setRealPendingProfiles] = useState<PendingProfile[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [selectedAdminUserId, setSelectedAdminUserId] = useState('');
  const [adminUserSearch, setAdminUserSearch] = useState('');
  const [selectedUsersProvince, setSelectedUsersProvince] = useState('');
  const [adminUserFullName, setAdminUserFullName] = useState('');
  const [adminUserEmail, setAdminUserEmail] = useState('');
  const [adminUserPassword, setAdminUserPassword] = useState('');
  const [adminUserPhone, setAdminUserPhone] = useState('');
  const [adminUserProvince, setAdminUserProvince] = useState('');
  const [adminUserCommunity, setAdminUserCommunity] = useState('');
  const [adminUserProvinceDropdownOpen, setAdminUserProvinceDropdownOpen] = useState(false);
  const [adminUserCommunityDropdownOpen, setAdminUserCommunityDropdownOpen] = useState(false);
  const [adminUserRoleDropdownOpen, setAdminUserRoleDropdownOpen] = useState(false);
  const [adminUserRoleAliasDropdownOpen, setAdminUserRoleAliasDropdownOpen] = useState(false);
  const [adminUserStatus, setAdminUserStatus] = useState('pendiente');
  const [adminUserRole, setAdminUserRole] = useState<Role>('palestrista');
  const [adminUserDisplayRoleLabel, setAdminUserDisplayRoleLabel] = useState('');
  const [adminCreateEmail, setAdminCreateEmail] = useState('');
  const [adminCreatePassword, setAdminCreatePassword] = useState('');
  const [adminCreatePasswordVisible, setAdminCreatePasswordVisible] = useState(false);
  const [adminDiagnosticEmail, setAdminDiagnosticEmail] = useState('lucas.lsd.13@gmail.com');
  const [adminLoginDiagnostic, setAdminLoginDiagnostic] = useState<AdminUserLoginDiagnostic | null>(null);
  const [permissionRole, setPermissionRole] = useState<Role>('palestrista');
  const [permissionRoleDropdownOpen, setPermissionRoleDropdownOpen] = useState(false);
  const [rolePermissionRows, setRolePermissionRows] = useState<RolePermissionRecord[]>([]);
  const [rolePermissionDraft, setRolePermissionDraft] = useState<Permission[]>(rolePermissions.palestrista);
  const [provinceRoleLabels, setProvinceRoleLabels] = useState<ProvinceRoleLabelRecord[]>([]);
  const [roleAliases, setRoleAliases] = useState<RoleAliasRecord[]>([]);
  const [roleLabelProvince, setRoleLabelProvince] = useState(session?.province ?? '');
  const [roleLabelRole, setRoleLabelRole] = useState<Role>('animador_comunidad');
  const [roleLabelDraft, setRoleLabelDraft] = useState('');
  const [roleLabelDescription, setRoleLabelDescription] = useState('');
  const [roleLabelActive, setRoleLabelActive] = useState(true);
  const [roleLabelProvinceDropdownOpen, setRoleLabelProvinceDropdownOpen] = useState(false);
  const [roleLabelRoleDropdownOpen, setRoleLabelRoleDropdownOpen] = useState(false);
  const [roleAliasBaseRole, setRoleAliasBaseRole] = useState<Role>('animador_comunidad');
  const [roleAliasLabel, setRoleAliasLabel] = useState('');
  const [roleAliasProvince, setRoleAliasProvince] = useState('');
  const [roleAliasIsGlobal, setRoleAliasIsGlobal] = useState(true);
  const [roleAliasActive, setRoleAliasActive] = useState(true);
  const [roleAliasRoleDropdownOpen, setRoleAliasRoleDropdownOpen] = useState(false);
  const [roleAliasProvinceDropdownOpen, setRoleAliasProvinceDropdownOpen] = useState(false);
  const [adminNewsTitle, setAdminNewsTitle] = useState('');
  const [adminNewsBody, setAdminNewsBody] = useState('');
  const [adminNewsCategory, setAdminNewsCategory] = useState('General');
  const [adminNewsImage, setAdminNewsImage] = useState('');
  const [adminNewsDraft, setAdminNewsDraft] = useState(false);
  const [adminNewsFeatured, setAdminNewsFeatured] = useState(false);
  const [adminNewsNotify, setAdminNewsNotify] = useState(false);
  const [newsDrafts, setNewsDrafts] = useState<NewsDraftRecord[]>([]);
  const [adminMaterials, setAdminMaterials] = useState<AppMaterialRecord[]>([]);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [materialCategory, setMaterialCategory] = useState('General');
  const [materialVisibility, setMaterialVisibility] = useState('interno');
  const [materialPermission, setMaterialPermission] = useState('');
  const [materialFileUrl, setMaterialFileUrl] = useState('');
  const [adminEventTitle, setAdminEventTitle] = useState('');
  const [adminEventBody, setAdminEventBody] = useState('');
  const [adminEventDate, setAdminEventDate] = useState('');
  const [adminEventNotify, setAdminEventNotify] = useState(false);
  const [adminEventCalendarOpen, setAdminEventCalendarOpen] = useState(false);
  const [adminEventCalendarMonth, setAdminEventCalendarMonth] = useState(new Date());
  const [adminMotivadorPeriods, setAdminMotivadorPeriods] = useState<MotivadorPeriodRecord[]>([]);
  const [pmEditingId, setPmEditingId] = useState<string | null>(null);
  const [pmGender, setPmGender] = useState<'masculino' | 'femenino'>('masculino');
  const [pmNumber, setPmNumber] = useState('');
  const [pmProvince, setPmProvince] = useState(session?.role === 'administrador' ? '' : session?.province ?? '');
  const [pmSelectedDates, setPmSelectedDates] = useState<string[]>([]);
  const [pmCalendarOpen, setPmCalendarOpen] = useState(false);
  const [pmCalendarMonth, setPmCalendarMonth] = useState(new Date());
  const [pmRetreatHouse, setPmRetreatHouse] = useState('');
  const [pmAddress, setPmAddress] = useState('');
  const [pmOpeningTime, setPmOpeningTime] = useState('');
  const [pmClosingTime, setPmClosingTime] = useState('');
  const [pmDescription, setPmDescription] = useState('');
  const [pmPlacePhotoUrl, setPmPlacePhotoUrl] = useState('');
  const [pmFlyerUrl, setPmFlyerUrl] = useState('');
  const [pmVisibleToLowerRoles, setPmVisibleToLowerRoles] = useState(false);
  const [pmStatus, setPmStatus] = useState<'activo' | 'inactivo' | 'borrador' | 'archivado'>('borrador');
  const [pmProvinceFilter, setPmProvinceFilter] = useState('');
  const [pmGenderFilter, setPmGenderFilter] = useState<'todos' | 'masculino' | 'femenino'>('todos');
  const [pmStatusFilter, setPmStatusFilter] = useState<'todos' | 'activo' | 'inactivo' | 'borrador'>('todos');
  const [pmTimeFilter, setPmTimeFilter] = useState<'todos' | 'proximos' | 'pasados'>('todos');
  const [adminModule, setAdminModule] = useState<AdminModule>('resumen');
  const [adminConfigDraft, setAdminConfigDraft] = useState<AppAdminConfig>(adminConfig);
  const [adminCommunityProvince, setAdminCommunityProvince] = useState('');
  const [adminCommunityId, setAdminCommunityId] = useState('');
  const [adminCommunityName, setAdminCommunityName] = useState('');
  const [adminCommunityAddress, setAdminCommunityAddress] = useState('');
  const [adminCommunityPhone, setAdminCommunityPhone] = useState('');
  const [adminCommunityDay, setAdminCommunityDay] = useState('');
  const [adminCommunityTime, setAdminCommunityTime] = useState('');
  const [adminCommunityDescription, setAdminCommunityDescription] = useState('');
  const [adminCommunityImageUrl, setAdminCommunityImageUrl] = useState('');
  const [adminCommunityImagePreview, setAdminCommunityImagePreview] = useState('');
  const [adminCommunityImageAsset, setAdminCommunityImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [adminCommunityImageUploading, setAdminCommunityImageUploading] = useState(false);
  const [adminCommunityGroupType, setAdminCommunityGroupType] = useState<'jovenes' | 'adultos'>('jovenes');
  const [adminCommunityIsActive, setAdminCommunityIsActive] = useState(true);
  const [editingTabs, setEditingTabs] = useState<Record<string, { label: string; iconName: string; isVisible: boolean; visibleRoles: string[] | null }>>({});
  const [newTabLabel, setNewTabLabel] = useState('');
  const [newTabKey, setNewTabKey] = useState('');
  const [newTabIcon, setNewTabIcon] = useState('document-text-outline');
  const [newTabRoles, setNewTabRoles] = useState<string[]>(['sedimentador', 'coordinador_comunidad', 'animador_comunidad', 'vocal', 'coordinador_diocesano', 'asesor', 'vocal_nacional', 'coordinador_nacional', 'administrador']);
  const [selectedNavigationTabKey, setSelectedNavigationTabKey] = useState('');
  const [navigationRolesDropdownOpen, setNavigationRolesDropdownOpen] = useState(false);
  const [newNavigationRolesDropdownOpen, setNewNavigationRolesDropdownOpen] = useState(false);
  const [selectedContentTab, setSelectedContentTab] = useState<TabKey>('inicio');
  const [contentTitle, setContentTitle] = useState('');
  const [contentBody, setContentBody] = useState('');
  const [contentBlocks, setContentBlocks] = useState<ContentEditorBlock[]>([]);
  const [adminRequestMessage, setAdminRequestMessage] = useState('');
  const [perseveranceRole, setPerseveranceRole] = useState<Role>('sedimentador');
  const [perseveranceRoleDropdownOpen, setPerseveranceRoleDropdownOpen] = useState(false);
  const [communityMembers, setCommunityMembers] = useState<CommunityMember[]>([]);
  const [leadershipRole, setLeadershipRole] = useState<Role>('animador_comunidad');
  const [leadershipRoleDropdownOpen, setLeadershipRoleDropdownOpen] = useState(false);
  const [successorUserId, setSuccessorUserId] = useState('');
  const [successorDropdownOpen, setSuccessorDropdownOpen] = useState(false);
  const [communityPostKind, setCommunityPostKind] = useState<'aviso' | 'noticia' | 'fecha' | 'encuesta'>('aviso');
  const [communityPostVisibility, setCommunityPostVisibility] = useState<'publica' | 'registrados' | 'sedimentadores'>('publica');
  const [communityPostTitle, setCommunityPostTitle] = useState('');
  const [communityPostBody, setCommunityPostBody] = useState('');
  const [communityPostDate, setCommunityPostDate] = useState('');
  const [communityPollOptions, setCommunityPollOptions] = useState('');
  const [communityPostNotify, setCommunityPostNotify] = useState(false);
  const [editingCommunityPublicationId, setEditingCommunityPublicationId] = useState<string | null>(null);
  const [editingCommunityPublicationTitle, setEditingCommunityPublicationTitle] = useState('');
  const [editingCommunityPublicationBody, setEditingCommunityPublicationBody] = useState('');
  const [myCommunityPublications, setMyCommunityPublications] = useState<CommunityPublication[]>([]);
  const [mailboxMessages, setMailboxMessages] = useState<MailboxMessageRecord[]>([]);
  const [mailboxResponses, setMailboxResponses] = useState<Record<string, string>>({});
  const [mailboxFilter, setMailboxFilter] = useState<'todos' | 'enviados' | 'recibidos' | 'nuevo' | 'respondido' | 'cerrado'>('todos');
  const [showMailboxComposer, setShowMailboxComposer] = useState(false);
  const [mailboxDraft, setMailboxDraft] = useState('');
  const [mailboxTargetMode, setMailboxTargetMode] = useState<MailboxTargetMode>('my_community');
  const [mailboxTargetCommunityId, setMailboxTargetCommunityId] = useState('');
  const [mailboxTargetProvince, setMailboxTargetProvince] = useState('');
  const [mailboxTargetRole, setMailboxTargetRole] = useState<Role>('palestrista');
  const [mailboxTargetUserId, setMailboxTargetUserId] = useState('');
  const [mailboxRecipientSearch, setMailboxRecipientSearch] = useState('');
  const [mailboxSelectedUserIds, setMailboxSelectedUserIds] = useState<string[]>([]);
  const [mailboxUserDropdownOpen, setMailboxUserDropdownOpen] = useState(false);
  const [mailboxProvinceDropdownOpen, setMailboxProvinceDropdownOpen] = useState(false);
  const [mailboxRoleDropdownOpen, setMailboxRoleDropdownOpen] = useState(false);
  const [localPollVotes, setLocalPollVotes] = useState<Record<string, string>>({});
  const [forumComments, setForumComments] = useState<Record<string, PublicationComment[]>>({});
  const [forumCommentDrafts, setForumCommentDrafts] = useState<Record<string, string>>({});
  const [forumReportDrafts, setForumReportDrafts] = useState<Record<string, string>>({});
  const [expandedForumItem, setExpandedForumItem] = useState<string | null>(null);
  const [selectedPublicProfile, setSelectedPublicProfile] = useState<PublicProfilePreview | null>(null);
  const [sentRequests, setSentRequests] = useState<AdminRequest[]>([]);
  const [requestSubtab, setRequestSubtab] = useState<'pendientes' | 'resueltas'>('pendientes');
  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>([
    {
      id: 'req-001',
      title: 'Solicitud de perseverancia',
      requester: 'Usuario de prueba 1',
      definition: 'Pide revision para acceder al rango de Sedimentador.',
      createdAt: '2026-05-10T09:00:00-03:00',
      status: 'pendiente'
    },
    {
      id: 'req-002',
      title: 'Solicitud de material exclusivo',
      requester: 'Usuario de prueba 2',
      definition: 'Pide acceso a material interno de formacion.',
      createdAt: '2026-05-14T08:15:00-03:00',
      status: 'pendiente'
    }
  ]);
  const selectedRegistrationProvince = registrationCommunities.find((item) => item.province === registerProvince);
  const selectedEditProvince = registrationCommunities.find((item) => item.province === editProvince);
  const visibleRegistrationCommunities = useMemo(() => registrationCommunities.filter((item) => canAccessProvince(session, item.province)), [registrationCommunities, session?.province, session?.role]);
  const manageableCommunities = useMemo(() => registrationCommunities
    .map((province) => ({
      ...province,
      locations: province.locations.filter((community) => canEditCommunity(session, province.province, community.name))
    }))
    .filter((province) => province.locations.length > 0), [registrationCommunities, session?.province, session?.role, session?.communityOfOrigin]);
  const motivadorProvinceOptions = useMemo(() => {
    if (session?.role === 'administrador') {
      return registrationCommunities.map((item) => item.province);
    }
    return session?.province ? [session.province] : [];
  }, [registrationCommunities, session?.province, session?.role]);
  const selectedAdminProvince = manageableCommunities.find((item) => item.province === adminCommunityProvince);
  const selectedAdminCommunity = selectedAdminProvince?.locations.find((item) => (item.id ?? item.name) === adminCommunityId);
  const selectedAdminUser = adminUsers.find((item) => item.id === selectedAdminUserId);
  const selectedAdminUserProvince = visibleRegistrationCommunities.find((item) => item.province === adminUserProvince);
  const assignableRoles = useMemo(() => assignableRolesFor(session), [session?.role]);
  const selectedEditableContent = appContent.find((item) => item.tab_key === selectedContentTab);
  const editableTabs = useMemo(
    () => (tabs.length > 0 ? tabs : defaultTabs.map((tab, index) => ({ ...tab, visible: true, sortOrder: index, visibleRoles: null }))),
    [tabs]
  );
  const selectedNavigationTab = editableTabs.find((tab) => tab.key === selectedNavigationTabKey) ?? editableTabs[0];
  const selectedNavigationDraft = selectedNavigationTab
    ? (editingTabs[selectedNavigationTab.key] ?? {
      label: selectedNavigationTab.label,
      iconName: selectedNavigationTab.icon,
      isVisible: selectedNavigationTab.visible,
      visibleRoles: selectedNavigationTab.visibleRoles
    })
    : null;
  const tabLabel = (key: TabKey) => editableTabs.find((tab) => tab.key === key)?.label ?? defaultTabs.find((tab) => tab.key === key)?.label ?? key;
  const profileNews = session ? communityNews.filter((item) => item.community === session.communityOfOrigin) : [];
  const roleInfo = session ? roleDefinitions.find((item) => item.role === session.role) : null;
  const isCommunityLeader = isCommunityLeaderRole(session);
  const canManageUsers = canManageUsersPanel(session);
  const canAdministrateCommunities = canCreateOrAdministrateCommunities(session);
  const canReviewLeadershipRequests = Boolean(session && ['vocal', 'coordinador_diocesano', 'administrador'].includes(session.role));
  const showDedicatedNavigationManager = adminModule === 'navegacion' && session?.role === 'administrador';
  const selectableCommunityMembers = communityMembers.filter((member) => (
    member.email !== session?.email
    && member.full_name !== session?.fullName
  ));
  const pendingAdminRequests = adminRequests.filter((item) => item.status === 'pendiente').sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const resolvedAdminRequests = adminRequests.filter((item) => item.status !== 'pendiente').sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const filteredAdminUsers = adminUsers.filter((user) => {
    if (!canAccessProvince(session, user.province)) {
      return false;
    }
    const query = adminUserSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return [user.full_name]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });
  const navigationVisibleCount = editableTabs.filter((tab) => {
    const draft = editingTabs[tab.key] ?? { label: tab.label, iconName: tab.icon, isVisible: tab.visible, visibleRoles: tab.visibleRoles };
    return draft.isVisible;
  }).length;
  const navigationLockedCount = editableTabs.filter((tab) => protectedTabKeys.has(tab.key) || defaultTabByKey.has(tab.key)).length;
  const adminUsersByProvince = filteredAdminUsers.reduce<Record<string, AdminUser[]>>((groups, user) => {
    const province = user.province || 'Sin provincia';
    groups[province] = groups[province] ?? [];
    groups[province].push(user);
    return groups;
  }, {});
  const userProvinceOptions = Object.keys(adminUsersByProvince).sort((a, b) => a.localeCompare(b));
  const visibleAdminUsers = selectedUsersProvince ? (adminUsersByProvince[selectedUsersProvince] ?? []) : [];
  const activeNationalCoordinator = adminUsers.find((user) => user.role === 'coordinador_nacional' && user.status === 'aprobado');
  const activeDiocesanCoordinator = selectedUsersProvince
    ? adminUsersByProvince[selectedUsersProvince]?.find((user) => user.role === 'coordinador_diocesano' && user.status === 'aprobado')
    : null;
  const filteredMotivadorPeriods = adminMotivadorPeriods.filter((period) => {
    if (pmProvinceFilter && period.province !== pmProvinceFilter) {
      return false;
    }
    if (pmGenderFilter !== 'todos' && period.gender !== pmGenderFilter) {
      return false;
    }
    if (pmStatusFilter !== 'todos' && period.status !== pmStatusFilter) {
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endsAt = new Date(`${period.ends_on}T00:00:00`);
    if (pmTimeFilter === 'proximos' && endsAt < today) {
      return false;
    }
    if (pmTimeFilter === 'pasados' && endsAt >= today) {
      return false;
    }
    return true;
  });
  const visibleMailboxMessages = mailboxMessages.filter((message) => {
    if (mailboxFilter === 'todos') {
      return true;
    }
    if (mailboxFilter === 'enviados') {
      return message.sender_id === session?.id;
    }
    if (mailboxFilter === 'recibidos') {
      return message.can_respond;
    }
    return message.status === mailboxFilter;
  });
  const mailboxCommunityOptions = registrationCommunities
    .flatMap((province) => province.locations.map((community) => ({ ...community, province: province.province })))
    .filter((community) => {
      if (!session) {
        return false;
      }
      if (session.role === 'administrador' || ['vocal_nacional', 'coordinador_nacional'].includes(session.role)) {
        return true;
      }
      if (['vocal', 'coordinador_diocesano'].includes(session.role)) {
        return community.province === session.province;
      }
      return community.name === session.communityOfOrigin;
    });
  const mailboxProvinceOptions = Array.from(new Set(registrationCommunities.map((item) => item.province))).sort((a, b) => a.localeCompare(b));
  const mailboxUserOptions = adminUsers.filter((user) => user.role !== 'administrador');
  const mailboxRecipientQuery = mailboxRecipientSearch.trim().toLowerCase();
  const filteredMailboxUserOptions = mailboxUserOptions.filter((user) => {
    if (!mailboxRecipientQuery) {
      return true;
    }
    return [user.full_name, user.email, user.province, user.community_name, user.role]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(mailboxRecipientQuery));
  });
  const selectedMailboxUsers = mailboxUserOptions.filter((user) => mailboxSelectedUserIds.includes(user.id));
  const estimatedMailboxRecipients = (() => {
    if (mailboxTargetMode === 'user') {
      return mailboxSelectedUserIds.length;
    }
    if (mailboxTargetMode === 'all') {
      return mailboxUserOptions.length;
    }
    if (mailboxTargetMode === 'role') {
      return mailboxUserOptions.filter((user) => user.role === mailboxTargetRole).length;
    }
    if (mailboxTargetMode === 'province') {
      const province = mailboxTargetProvince || session?.province;
      return mailboxUserOptions.filter((user) => user.province === province).length;
    }
    if (mailboxTargetMode === 'role_province') {
      const province = mailboxTargetProvince || session?.province;
      return mailboxUserOptions.filter((user) => user.role === mailboxTargetRole && user.province === province).length;
    }
    if (mailboxTargetMode === 'diocesan_leadership') {
      const province = mailboxTargetProvince || '';
      return mailboxUserOptions.filter((user) => ['vocal', 'coordinador_diocesano'].includes(user.role) && (!province || user.province === province)).length;
    }
    if (mailboxTargetMode === 'province_communities') {
      return mailboxUserOptions.filter((user) => ['animador_comunidad', 'coordinador_comunidad'].includes(user.role) && user.province === session?.province).length;
    }
    if (['community', 'my_community'].includes(mailboxTargetMode)) {
      const communityName = mailboxCommunityOptions.find((community) => community.id === (mailboxTargetCommunityId || mailboxCommunityOptions[0]?.id))?.name ?? session?.communityOfOrigin;
      return mailboxUserOptions.filter((user) => ['animador_comunidad', 'coordinador_comunidad'].includes(user.role) && user.community_name === communityName).length;
    }
    return 0;
  })();
  const enabledAdminModules = adminModuleCatalog.filter((item) => {
    if (item.key === 'navegacion') {
      return session?.role === 'administrador';
    }
    if (item.key === 'usuarios') {
      return canManageUsers;
    }
    if (hasPermission(session, 'gestionar_sistema')) {
      return true;
    }
    if (['resumen', 'solicitudes', 'comunidades'].includes(item.key)) {
      return true;
    }
    if (item.key === 'periodo_motivador') {
      return canManageMotivadorPanel(session);
    }
    if (canManagePublishedContent(session) && ['home', 'noticias'].includes(item.key)) {
      return true;
    }
    if (canAdministrateCommunities && item.key === 'comunidades') {
      return true;
    }
    if (canEditStaticInstitutionalPage(session) && ['contacto_admin'].includes(item.key)) {
      return true;
    }
    return !item.systemOnly;
  });
  const adminDraftSummary = [
    { label: 'Usuarios', value: String(adminUsers.length || realPendingProfiles.length), icon: 'people-outline' as keyof typeof Ionicons.glyphMap },
    { label: 'Solicitudes', value: String(pendingAdminRequests.length), icon: 'mail-unread-outline' as keyof typeof Ionicons.glyphMap },
    { label: 'Comunidades', value: String(manageableCommunities.reduce((total, item) => total + item.locations.length, 0)), icon: 'location-outline' as keyof typeof Ionicons.glyphMap },
    { label: 'Herramientas', value: String(enabledAdminModules.length), icon: 'apps-outline' as keyof typeof Ionicons.glyphMap }
  ];

  useEffect(() => {
    setEditFullName(session?.fullName ?? '');
    setEditContact(session?.contact ?? '');
    setEditProvince(session?.province ?? '');
    setEditCommunity(session?.communityOfOrigin ?? '');
    setEditGenderPreference(session?.genderPreference ?? null);
  }, [session]);

  useEffect(() => {
    setAdminConfigDraft(adminConfig);
  }, [adminConfig]);

  useEffect(() => {
    let alive = true;
    async function loadNotificationStatus() {
      if (Platform.OS === 'web') {
        setNotificationPermissionStatus('solo celular');
        return;
      }
      try {
        const permission = await Notifications.getPermissionsAsync();
        if (alive) {
          setNotificationPermissionStatus(permission.status);
        }
      } catch {
        if (alive) {
          setNotificationPermissionStatus('no disponible');
        }
      }
    }
    loadNotificationStatus();
    return () => {
      alive = false;
    };
  }, [session?.id, profilePanel]);

  useEffect(() => {
    if (session?.role !== 'administrador') {
      setPmProvince(session?.province ?? '');
      setPmProvinceFilter('');
    }
  }, [session?.province, session?.role]);

  useEffect(() => {
    if (isMissingProfileScope(session)) {
      setProfilePanel('editar');
      setAuthMessage('Completa provincia y comunidad para continuar.');
    }
  }, [session]);

  useEffect(() => {
    if (!isMissingProfileScope(session)) {
      setProfilePanel(initialPanel);
    }
  }, [initialPanel]);

  useEffect(() => {
    fetchProvinceRoleLabels().then(setProvinceRoleLabels);
  }, [session?.id]);

  useEffect(() => {
    if (authMessage.startsWith('Cambio realizado.')) {
      onSavedFeedback('Cambios guardados');
    } else if (authMessage && !authMessage.startsWith('Completa provincia')) {
      const lowerMessage = authMessage.toLowerCase();
      if (lowerMessage.includes('error') || lowerMessage.includes('no se pudo') || lowerMessage.includes('failed')) {
        onErrorFeedback(authMessage);
      }
    }
  }, [authMessage, onErrorFeedback, onSavedFeedback]);

  function updateAdminConfigSection<K extends keyof AppAdminConfig>(section: K, patch: Partial<AppAdminConfig[K]>) {
    setAdminConfigDraft((current) => ({
      ...current,
      [section]: {
        ...current[section],
        ...patch
      }
    }));
  }

  function toggleAdminConfigList(section: 'home', key: string) {
    setAdminConfigDraft((current) => {
      const currentList = current[section].visibleModules;
      const nextList = currentList.includes(key) ? currentList.filter((item) => item !== key) : [...currentList, key];
      return { ...current, [section]: { ...current[section], visibleModules: nextList } };
    });
  }

  async function saveAdminConfigDraft(scope: string) {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo el administrador puede guardar configuración global.');
      return;
    }
    setAuthMessage(`Guardando ${scope}...`);
    const { error } = await saveAdminConfig(adminConfigDraft);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    onAdminConfigChange(adminConfigDraft);
    setAuthMessage(changeDone(`${scope} guardado en Supabase.`));
  }

  async function setFallbackContentHidden(key: string, hidden: boolean) {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo Administrador puede gestionar contenido publicado.');
      return;
    }
    const current = adminConfigDraft.settings.hiddenFallbackContent ?? [];
    const nextHidden = hidden ? Array.from(new Set([...current, key])) : current.filter((item) => item !== key);
    const nextConfig = {
      ...adminConfigDraft,
      settings: {
        ...adminConfigDraft.settings,
        hiddenFallbackContent: nextHidden
      }
    };
    setAuthMessage('Guardando visibilidad de contenido...');
    const { error } = await saveAdminConfig(nextConfig);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAdminConfigDraft(nextConfig);
    onAdminConfigChange(nextConfig);
    setAuthMessage(changeDone(hidden ? 'Contenido ocultado.' : 'Contenido restaurado.'));
  }

  async function saveRoleAliasDraft() {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo Administrador puede duplicar o renombrar rangos.');
      return;
    }
    if (!roleAliasLabel.trim()) {
      setAuthMessage('Escribir el nuevo nombre visible del rango.');
      return;
    }
    if (!roleAliasIsGlobal && !roleAliasProvince) {
      setAuthMessage('Elegir provincia o marcar alcance global.');
      return;
    }
    setAuthMessage('Guardando alias de rango...');
    const { error } = await saveRoleAlias({
      baseRole: roleAliasBaseRole,
      displayLabel: roleAliasLabel.trim(),
      province: roleAliasIsGlobal ? null : roleAliasProvince,
      isActive: roleAliasActive
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await loadRoleAliases(false);
    setRoleAliasLabel('');
    setAuthMessage(changeDone('Alias de rango guardado y disponible para asignar.'));
  }

  async function toggleSavedRoleAlias(aliasId: string, active: boolean) {
    const { error } = await setRoleAliasStatus(aliasId, active);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await loadRoleAliases(false);
    setAuthMessage(changeDone(active ? 'Alias activado.' : 'Alias desactivado.'));
  }

  async function saveInstagramConfigDraft() {
    if (!canManageGlobalInstagram(session)) {
      setAuthMessage('Solo Coordinador Nacional y Administrador pueden modificar Instagram.');
      return;
    }
    setAuthMessage('Guardando Instagram...');
    const instagram = adminConfigDraft.contact.instagram.trim();
    const nextConfig = {
      ...adminConfig,
      contact: {
        ...adminConfig.contact,
        instagram
      }
    };
    const { error } = await saveAdminInstagram(instagram);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAdminConfigDraft(nextConfig);
    onAdminConfigChange(nextConfig);
    setAuthMessage(changeDone('Instagram guardado en Supabase.'));
  }

  function formatPmDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function isoDate(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function selectedDatesSummary(dates: string[]) {
    if (dates.length === 0) {
      return 'Sin fechas seleccionadas';
    }
    return [...dates].sort().map(formatPmDate).join(', ');
  }

  function togglePmDate(date: string) {
    setPmSelectedDates((current) => current.includes(date)
      ? current.filter((item) => item !== date)
      : [...current, date].sort());
  }

  function selectAdminEventDate(date: string) {
    setAdminEventDate(`${date}T09:00:00-03:00`);
    setAdminEventCalendarOpen(false);
  }

  async function loadMotivadorAdminPeriods() {
    if (!canManageMotivadorPanel(session)) {
      setAdminMotivadorPeriods([]);
      return;
    }
    const items = await fetchAdminMotivadorPeriods();
    setAdminMotivadorPeriods(items);
  }

  function resetMotivadorForm() {
    setPmEditingId(null);
    setPmGender('masculino');
    setPmNumber('');
    setPmProvince(session?.role === 'administrador' ? (motivadorProvinceOptions[0] ?? '') : session?.province ?? '');
    setPmSelectedDates([]);
    setPmRetreatHouse('');
    setPmAddress('');
    setPmOpeningTime('');
    setPmClosingTime('');
    setPmDescription('');
    setPmPlacePhotoUrl('');
    setPmFlyerUrl('');
    setPmVisibleToLowerRoles(false);
    setPmStatus('borrador');
    setPmCalendarOpen(false);
  }

  function editMotivadorPeriod(period: MotivadorPeriodRecord) {
    setPmEditingId(period.id);
    setPmGender(period.gender);
    setPmNumber(String(period.pm_number));
    setPmProvince(period.province ?? session?.province ?? '');
    setPmSelectedDates((period.selected_dates?.length ? period.selected_dates : [period.starts_on, period.ends_on]).map((date) => String(date).slice(0, 10)).filter(Boolean));
    setPmRetreatHouse(period.retreat_house ?? '');
    setPmAddress(period.address ?? '');
    setPmOpeningTime(period.opening_time ?? '');
    setPmClosingTime(period.closing_time ?? '');
    setPmDescription(period.description ?? '');
    setPmPlacePhotoUrl(period.place_photo_url ?? '');
    setPmFlyerUrl(period.flyer_url ?? '');
    setPmVisibleToLowerRoles(Boolean(period.visible_to_lower_roles));
    setPmStatus(period.status === 'archivado' ? 'inactivo' : period.status);
    setPmCalendarOpen(true);
  }

  async function submitMotivadorPeriod() {
    if (!canManageMotivadorPanel(session)) {
      setAuthMessage('No tenes permisos para gestionar PM.');
      return;
    }
    if (!pmProvince || !pmNumber.trim() || pmSelectedDates.length === 0 || !pmRetreatHouse.trim() || !pmAddress.trim() || !pmOpeningTime.trim() || !pmClosingTime.trim()) {
      setAuthMessage('Completá tipo, número, provincia, fechas, casa, dirección y horarios.');
      return;
    }
    const { error } = await saveMotivadorPeriod({
      id: pmEditingId,
      province: pmProvince,
      gender: pmGender,
      pmNumber: Number.parseInt(pmNumber, 10),
      selectedDates: pmSelectedDates,
      retreatHouse: pmRetreatHouse.trim(),
      address: pmAddress.trim(),
      openingTime: pmOpeningTime.trim(),
      closingTime: pmClosingTime.trim(),
      description: pmDescription.trim(),
      placePhotoUrl: pmPlacePhotoUrl.trim(),
      flyerUrl: pmFlyerUrl.trim(),
      visibleToLowerRoles: pmVisibleToLowerRoles,
      status: pmStatus
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAuthMessage(changeDone('PM guardado.'));
    resetMotivadorForm();
    await loadMotivadorAdminPeriods();
  }

  async function updateMotivadorStatus(id: string, status: 'activo' | 'inactivo' | 'borrador' | 'archivado') {
    const { error } = await setMotivadorPeriodStatus(id, status);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAuthMessage(changeDone(status === 'archivado' ? 'PM archivado.' : `Estado actualizado a ${status}.`));
    await loadMotivadorAdminPeriods();
  }

  useEffect(() => {
    const tab = editableTabs.find((item) => item.key === selectedContentTab);
    setContentTitle(selectedEditableContent?.title ?? tab?.label ?? '');
    setContentBody(selectedEditableContent?.body ?? '');
    setContentBlocks(selectedEditableContent?.blocks?.length ? selectedEditableContent.blocks : [
      { id: 'block-title', type: 'titulo', value: selectedEditableContent?.title ?? tab?.label ?? '' },
      { id: 'block-body', type: 'texto', value: selectedEditableContent?.body ?? '' }
    ]);
  }, [selectedContentTab, selectedEditableContent, editableTabs]);

  useEffect(() => {
    let alive = true;
    fetchCommunities().then((items) => {
      if (alive) {
        setRegistrationCommunities(items);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (adminModule === 'periodo_motivador') {
      loadMotivadorAdminPeriods();
      if (!pmProvince && motivadorProvinceOptions.length > 0) {
        setPmProvince(motivadorProvinceOptions[0]);
      }
    }
  }, [adminModule, session?.role, session?.province, motivadorProvinceOptions.length]);

  useEffect(() => {
    if (adminModule === 'etiquetas_roles' && session?.role === 'administrador') {
      loadProvinceRoleLabels();
    }
  }, [adminModule, session?.role]);

  useEffect(() => {
    if (['rangos_alias', 'usuarios', 'permisos_roles'].includes(adminModule) && session?.role === 'administrador') {
      loadRoleAliases(false);
    }
  }, [adminModule, session?.role]);

  useEffect(() => {
    const current = provinceRoleLabels.find((item) => item.province === roleLabelProvince && item.role_key === roleLabelRole);
    setRoleLabelDraft(current?.display_label ?? roleLabel(roleLabelRole));
    setRoleLabelDescription(current?.description ?? '');
    setRoleLabelActive(current?.is_active ?? true);
  }, [provinceRoleLabels, roleLabelProvince, roleLabelRole]);

  useEffect(() => {
    if (!selectedAdminCommunity) {
      setAdminCommunityName('');
      setAdminCommunityAddress('');
      setAdminCommunityPhone('');
      setAdminCommunityDay('');
      setAdminCommunityTime('');
      setAdminCommunityDescription('');
      setAdminCommunityImageUrl('');
      setAdminCommunityImagePreview('');
      setAdminCommunityImageAsset(null);
      return;
    }

    setAdminCommunityName(selectedAdminCommunity.name);
    setAdminCommunityAddress(selectedAdminCommunity.address);
    setAdminCommunityPhone(selectedAdminCommunity.phone);
    setAdminCommunityDay(selectedAdminCommunity.meetingDay);
    setAdminCommunityTime(selectedAdminCommunity.meetingTime);
    setAdminCommunityDescription(selectedAdminCommunity.description);
    setAdminCommunityImageUrl(selectedAdminCommunity.imageUrl ?? '');
    setAdminCommunityImagePreview(selectedAdminCommunity.imageUrl ?? '');
    setAdminCommunityImageAsset(null);
    setAdminCommunityGroupType(selectedAdminCommunity.group ?? 'jovenes');
    setAdminCommunityIsActive(true);
  }, [selectedAdminCommunity]);

  useEffect(() => {
    if (!selectedAdminUser) {
      setAdminUserFullName('');
      setAdminUserPhone('');
      setAdminUserProvince('');
      setAdminUserCommunity('');
      setAdminUserStatus('pendiente');
      setAdminUserRole('palestrista');
      setAdminUserDisplayRoleLabel('');
      return;
    }

    setAdminUserFullName(selectedAdminUser.full_name ?? '');
    setAdminUserEmail(selectedAdminUser.email ?? '');
    setAdminUserPassword('');
    setAdminUserPhone(selectedAdminUser.phone ?? '');
    setAdminUserProvince(selectedAdminUser.province ?? '');
    setAdminUserCommunity(selectedAdminUser.community_name ?? '');
    setAdminUserStatus(selectedAdminUser.status);
    setAdminUserRole((selectedAdminUser.role || 'palestrista') as Role);
    setAdminUserDisplayRoleLabel(selectedAdminUser.display_role_label ?? '');
  }, [selectedAdminUser]);

  function normalizeRequest(item: UserRequestRecord): AdminRequest {
    return {
      id: item.id,
      userId: item.user_id,
      title: item.title,
      requester: item.requester,
      definition: item.definition,
      createdAt: item.created_at,
      status: item.status === 'rechazada' ? 'denegada' : item.status as AdminRequest['status'],
      message: item.admin_message ?? undefined,
      resolvedAt: item.resolved_at ?? undefined,
      resolvedBy: item.resolved_by_name ? `${item.resolved_by_name}${item.resolved_by_role ? ` - ${roleLabel(item.resolved_by_role as Role)}` : ''}` : undefined,
      targetUserId: item.target_user_id,
      targetUserName: item.target_user_name,
      targetRole: item.target_role,
      communityName: item.community_name
    };
  }

  async function loadMyRequests() {
    const items = await fetchMyRequests();
    if (items.length > 0) {
      setSentRequests(items.map(normalizeRequest));
    }
  }

  async function loadAdminRequests() {
    const items = await fetchAdminRequests();
    if (items.length > 0) {
      setAdminRequests(items.map(normalizeRequest));
    }
  }

  async function refreshCommunityForum() {
    if (!session) {
      setMyCommunityPublications([]);
      setForumComments({});
      return;
    }
    const normalizeCommunity = (value?: string | null) => (value ?? '').trim().toLowerCase();
    const items = await fetchCommunityPublications(session);
    const scopedItems = items.filter((item) => normalizeCommunity(item.communityName) === normalizeCommunity(session.communityOfOrigin));
    setMyCommunityPublications(scopedItems);
    const ids = scopedItems.map((item) => item.id).filter(Boolean) as string[];
    setForumComments(await fetchPublicationComments(ids));
  }

  async function refreshMailbox() {
    if (!session || session.role === 'invitado') {
      setMailboxMessages([]);
      return;
    }
    setMailboxMessages(await fetchMailboxMessages());
  }

  function defaultMailboxTargetMode(): MailboxTargetMode {
    if (!session) {
      return 'my_community';
    }
    if (session.role === 'administrador') {
      return 'user';
    }
    if (['vocal_nacional', 'coordinador_nacional'].includes(session.role)) {
      return 'diocesan_leadership';
    }
    if (['vocal', 'coordinador_diocesano'].includes(session.role)) {
      return 'community';
    }
    return 'my_community';
  }

  async function confirmMailboxSend(total: number) {
    if (total <= 10) {
      return true;
    }
    const message = `Vas a enviar este mensaje a ${total} destinatarios. Confirmas el envio?`;
    if (Platform.OS === 'web') {
      return typeof window === 'undefined' ? true : window.confirm(message);
    }
    return new Promise<boolean>((resolve) => {
      Alert.alert('Confirmar envio', message, [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Enviar', onPress: () => resolve(true) }
      ]);
    });
  }

  function toggleMailboxUser(userId: string) {
    setMailboxSelectedUserIds((current) => current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId]);
  }

  async function submitNewMailboxMessage() {
    if (!session || session.role === 'invitado') {
      setAuthMessage('Iniciá sesión para enviar mensajes.');
      return;
    }
    if (!mailboxDraft.trim()) {
      setAuthMessage('Escribe un mensaje antes de enviar.');
      return;
    }

    const mode = mailboxTargetMode || defaultMailboxTargetMode();
    const fallbackCommunity = mailboxCommunityOptions[0];
    const communityId = mode === 'my_community' ? fallbackCommunity?.id : mailboxTargetCommunityId || fallbackCommunity?.id;
    const province = mailboxTargetProvince || session.province;

    if (['my_community', 'community'].includes(mode) && !communityId) {
      setAuthMessage('No hay responsables asignados para tu comunidad actualmente.');
      return;
    }
    if (mode === 'user' && mailboxSelectedUserIds.length === 0) {
      setAuthMessage('Selecciona al menos un usuario destinatario.');
      return;
    }
    if (estimatedMailboxRecipients === 0) {
      setAuthMessage('No hay destinatarios para el criterio seleccionado.');
      return;
    }

    const confirmed = await confirmMailboxSend(estimatedMailboxRecipients);
    if (!confirmed) {
      return;
    }

    const errors: string[] = [];
    if (mode === 'user') {
      for (const userId of mailboxSelectedUserIds) {
        const { error } = await createMailboxMessage({
          targetMode: mode,
          message: mailboxDraft.trim(),
          userId
        });
        if (error) {
          errors.push(error.message);
        }
      }
    } else {
      const { error } = await createMailboxMessage({
        targetMode: mode,
        message: mailboxDraft.trim(),
        communityId,
        province,
        role: mailboxTargetRole,
        userId: mailboxTargetUserId || null
      });
      if (error) {
        errors.push(error.message);
      }
    }

    if (errors.length > 0) {
      setAuthMessage(errors[0]);
      return;
    }

    setMailboxDraft('');
    setMailboxRecipientSearch('');
    setMailboxSelectedUserIds([]);
    setShowMailboxComposer(false);
    setAuthMessage(changeDone('Mensaje enviado.'));
    await refreshMailbox();
  }

  async function submitMailboxResponse(messageId: string) {
    const response = (mailboxResponses[messageId] ?? '').trim();
    if (!response) {
      setAuthMessage('Escribi una respuesta antes de enviarla.');
      return;
    }
    const { error } = await respondMailboxMessage(messageId, response);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setMailboxResponses((current) => ({ ...current, [messageId]: '' }));
    setAuthMessage(changeDone('Respuesta enviada.'));
    await refreshMailbox();
  }

  async function updateMailboxStatus(messageId: string, status: MailboxMessageRecord['status']) {
    const { error } = await setMailboxMessageStatus(messageId, status);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAuthMessage(changeDone(`Mensaje marcado como ${status}.`));
    await refreshMailbox();
  }

  useEffect(() => {
    if (session) {
      loadMyRequests();
      refreshCommunityForum();
      if (['animador_comunidad', 'coordinador_comunidad'].includes(session.role)) {
        fetchMyCommunityMembers().then(setCommunityMembers);
      }
      if (session.role === 'administrador') {
        loadAdminRequests();
      }
      if (['vocal', 'coordinador_diocesano'].includes(session.role)) {
        loadAdminRequests();
      }
    }
  }, [session?.email, session?.role, session?.communityOfOrigin]);

  useEffect(() => {
    if (profilePanel === 'comunidad') {
      refreshCommunityForum();
    }
    if (profilePanel === 'buzon') {
      setMailboxTargetMode(defaultMailboxTargetMode());
      refreshMailbox();
      if (session?.role === 'administrador' && adminUsers.length === 0) {
        loadAdminUsers();
      }
    }
  }, [profilePanel, session?.email, session?.communityOfOrigin, adminUsers.length]);

  async function loadRealProfile(userId: string, fallbackEmail: string) {
    const result = await getMyProfileSession(fallbackEmail);
    if (result.error) {
      setAuthMessage(`No pude leer tu perfil: ${result.error}`);
      return;
    }
    if (result.session) {
      if (result.session.status === 'bloqueado') {
        await supabase.auth.signOut();
        onSessionChange(null);
        setAuthMessage('Este usuario esta bloqueado o eliminado. Contacta a un administrador.');
        return;
      }
      onSessionChange(result.session);
    }
  }

  function validateAuthForm() {
    const nextErrors: Record<string, string> = {};
    if (!isValidEmail(authEmail)) {
      nextErrors.email = 'Ingresa un correo valido';
    }
    if (!authPassword) {
      nextErrors.password = 'La contraseña es obligatoria';
    }
    if (authMode === 'register') {
      if (!registerFullName.trim()) {
        nextErrors.fullName = 'Ingresa tu nombre completo';
      }
      if (!registerProvince) {
        nextErrors.province = 'Selecciona tu provincia';
      }
      if (!registerCommunity) {
        nextErrors.community = 'Selecciona tu comunidad';
      }
      if (authPassword.length < 6) {
        nextErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
      if (authPasswordConfirm !== authPassword) {
        nextErrors.confirm = 'Las contraseñas no coinciden';
      }
    }
    setAuthErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function confirmProfileChangeIfNeeded() {
    if (!session) {
      return Promise.resolve(false);
    }
    const changesProvince = editProvince && editProvince !== session.province;
    const changesCommunity = editCommunity && editCommunity !== session.communityOfOrigin;
    const canDowngrade = (changesProvince && provinceDowngradesRole(session.role)) || (changesCommunity && communityDowngradesRole(session.role));
    if (!canDowngrade) {
      return Promise.resolve(true);
    }

    const message = 'Al cambiar tu provincia o comunidad, tu rango actual puede volver a Sedimentador hasta nueva aprobación.';
    if (Platform.OS === 'web') {
      return Promise.resolve(typeof window === 'undefined' ? true : window.confirm(message));
    }

    return new Promise<boolean>((resolve) => {
      Alert.alert('Confirmar cambio', message, [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Continuar', style: 'destructive', onPress: () => resolve(true) }
      ]);
    });
  }

  async function signInReal() {
    if (!validateAuthForm()) {
      return;
    }
    setAuthMessage('Ingresando...');
    const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
    if (error || !data.user) {
      setAuthMessage(safeAuthError(error?.message));
      return;
    }
    await loadRealProfile(data.user.id, authEmail.trim());
    setAuthMessage('Sesión iniciada.');
  }

  async function registerReal() {
    if (!validateAuthForm()) {
      return;
    }

    setAuthMessage('Registrando...');
    const { data, error } = await supabase.auth.signUp({
      email: authEmail.trim(),
      password: authPassword,
      options: {
        data: {
          full_name: registerFullName.trim() || authEmail.trim(),
          phone: registerContact.trim(),
          province: registerProvince.trim(),
          community_name: registerCommunity.trim()
        }
      }
    });
    if (error || !data.user) {
      setAuthMessage(safeAuthError(error?.message));
      return;
    }

    if (data.session) {
      await loadRealProfile(data.user.id, authEmail.trim());
      setAuthMessage('Registro creado. Queda pendiente de aprobación.');
      return;
    }

    setAuthMessage('Registro creado como Palestrista pendiente. Iniciá sesión cuando el email esté confirmado o un administrador lo habilite.');
  }

  async function signOutReal() {
    await supabase.auth.signOut();
    setAuthMessage('');
    onSessionChange(null);
  }

  async function refreshRealProfile() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setAuthMessage('No hay una sesión real activa. Cerrá e iniciá sesión otra vez.');
      return;
    }

    await loadRealProfile(data.user.id, data.user.email ?? 'Usuario');
    setAuthMessage('Estado actualizado desde Supabase.');
  }

  async function saveProfile() {
    if (!session) {
      return;
    }

    if (!editProvince || !editCommunity) {
      setAuthMessage('Elegir provincia y comunidad es obligatorio.');
      return;
    }

    const confirmed = await confirmProfileChangeIfNeeded();
    if (!confirmed) {
      return;
    }
    const mayDowngrade = (editProvince !== session.province && provinceDowngradesRole(session.role)) || (editCommunity !== session.communityOfOrigin && communityDowngradesRole(session.role));

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setAuthMessage('Perfil de prueba actualizado visualmente. Iniciá sesión real para guardar en Supabase.');
      onSessionChange({
        ...session,
        fullName: editFullName || session.fullName,
        province: editProvince || session.province,
        contact: editContact || session.contact,
        communityOfOrigin: editCommunity || session.communityOfOrigin,
        genderPreference: editGenderPreference
      });
      return;
    }

    const { error } = await updateMyProfile({
      fullName: editFullName || session.fullName,
      phone: editContact || session.contact,
      province: editProvince || session.province,
      communityName: editCommunity || session.communityOfOrigin,
      genderPreference: editGenderPreference
    });

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    onSessionChange({
      ...session,
      fullName: editFullName || session.fullName,
      province: editProvince || session.province,
      contact: editContact || session.contact,
      communityOfOrigin: editCommunity || session.communityOfOrigin,
      genderPreference: editGenderPreference
    });
    await loadRealProfile(authData.user.id, authData.user.email ?? session.email ?? session.fullName);
    setAuthMessage(mayDowngrade
      ? 'Tu provincia/comunidad fue actualizada. Tu rango fue ajustado a Sedimentador según las reglas del movimiento.'
      : changeDone('Perfil guardado.'));
  }

  async function uploadProfilePhoto() {
    if (!session) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAuthMessage('Necesito permiso para acceder a tus fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setAuthMessage('Iniciá sesión real para subir una foto.');
      return;
    }

    try {
      setAuthMessage('Subiendo foto...');
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const bytes = await response.arrayBuffer();
      const extension = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      const path = `${authData.user.id}/profile-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(path, bytes, {
          contentType: asset.mimeType ?? 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        setAuthMessage(uploadError.message);
        return;
      }

      const { data: publicUrl } = supabase.storage.from('profile-photos').getPublicUrl(path);
      const avatarUrl = publicUrl.publicUrl;
      const { error } = await updateMyAvatar(avatarUrl);
      if (error) {
        setAuthMessage(error.message);
        return;
      }

      onSessionChange({ ...session, avatarUrl });
      setAuthMessage(changeDone('Foto de perfil actualizada.'));
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'No pude subir la foto.');
    }
  }

  async function loadPendingProfiles() {
    const items = await fetchPendingProfiles();
    setRealPendingProfiles(items);
  }

  async function loadAdminUsers() {
    if (!canManageUsersPanel(session)) {
      setAuthMessage('Tu rango no tiene acceso a la herramienta Usuarios.');
      return;
    }
    setAuthMessage('Cargando usuarios...');
    const items = await fetchAdminUsers();
    setAdminUsers(items);
    if (!selectedUsersProvince && items.length > 0) {
      const firstProvince = items.find((item) => item.province)?.province ?? 'Sin provincia';
      setSelectedUsersProvince(firstProvince);
    }
    setAuthMessage(items.length > 0 ? 'Usuarios cargados.' : 'No se encontraron usuarios o falta ejecutar el SQL de administración.');
  }

  async function createBasicAdminUser() {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo Administrador puede crear usuarios.');
      return;
    }
    if (!isValidEmail(adminCreateEmail)) {
      setAuthMessage('Ingresa un correo valido.');
      return;
    }
    if (adminCreatePassword.length < 6) {
      setAuthMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setAuthMessage('Creando usuario...');
    const { error } = await createAdminBasicUser(adminCreateEmail.trim(), adminCreatePassword);
    if (error) {
      setAuthMessage(safeAuthError(error.message));
      return;
    }
    setAdminCreateEmail('');
    setAdminCreatePassword('');
    await loadAdminUsers();
    setAuthMessage(changeDone('Usuario creado y habilitado. Debera completar provincia y comunidad al ingresar.'));
  }

  async function approvePendingProfile(id: string, role: Role) {
    const { error } = await approveProfile(id, role);
    setAuthMessage(error ? error.message : changeDone('Usuario aprobado.'));
    await loadPendingProfiles();
  }

  async function saveAdminUser() {
    if (!selectedAdminUser) {
      setAuthMessage('Elegir un usuario para editar.');
      return;
    }
    if (!canEditAdminUser(session, selectedAdminUser)) {
      setAuthMessage('No podes editar administradores, usuarios superiores o usuarios fuera de tu alcance.');
      return;
    }
    if (adminUserRole === 'administrador') {
      setAuthMessage('El rol Administrador no puede asignarse desde la app.');
      return;
    }
    if (!canAccessProvince(session, adminUserProvince)) {
      setAuthMessage('No podes editar usuarios de otra provincia.');
      return;
    }
    if (!canApproveRole(session, adminUserRole)) {
      setAuthMessage(`Tu rango no puede asignar el rol ${roleLabel(adminUserRole)}.`);
      return;
    }

    setAuthMessage('Guardando usuario...');
    const { error } = await updateAdminUser({
      id: selectedAdminUser.id,
      email: session?.role === 'administrador' ? adminUserEmail : (selectedAdminUser.email ?? ''),
      password: session?.role === 'administrador' ? adminUserPassword : '',
      fullName: adminUserFullName,
      phone: adminUserPhone,
      province: adminUserProvince,
      communityName: adminUserCommunity,
      status: adminUserStatus,
      role: adminUserRole,
      displayRoleLabel: adminUserDisplayRoleLabel.trim() || null
    });
    if (error) {
      setAuthMessage(error.message || 'No se pudo guardar el usuario. Revisa permisos y datos.');
      return;
    }
    await loadAdminUsers();
    setSelectedAdminUserId('');
    setAuthMessage(changeDone('Usuario actualizado.'));
  }

  async function confirmSelectedUserEmail() {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo Administrador puede confirmar mails desde Auth.');
      return;
    }
    if (!selectedAdminUser) {
      setAuthMessage('Elegir un usuario para aprobar email.');
      return;
    }

    const { error } = await confirmAdminUserEmail(selectedAdminUser.id);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await loadAdminUsers();
    setAuthMessage(changeDone('Mail confirmado correctamente.'));
  }

  async function deleteSelectedAdminUser() {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo Administrador puede eliminar usuarios y liberar mails.');
      return;
    }
    if (!selectedAdminUser) {
      setAuthMessage('Elegir un usuario para eliminar.');
      return;
    }
    if (!canEditAdminUser(session, selectedAdminUser)) {
      setAuthMessage('No podes eliminar administradores, usuarios superiores o usuarios fuera de tu alcance.');
      return;
    }

    const message = 'Esta acción eliminará el acceso del usuario y liberará su correo para reutilizarlo. Se guardará un backup interno antes de eliminar.';
    const confirmed = Platform.OS === 'web'
      ? (typeof window === 'undefined' ? true : window.confirm(message))
      : await new Promise<boolean>((resolve) => {
        Alert.alert('Eliminar usuario', message, [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) }
        ]);
      });
    if (!confirmed) {
      return;
    }

    setAuthMessage('Eliminando usuario...');
    const { error } = await softDeleteAdminUser(selectedAdminUser.id);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setSelectedAdminUserId('');
    await loadAdminUsers();
    setAuthMessage(changeDone('Usuario eliminado y correo liberado correctamente.'));
  }

  async function diagnoseUserLogin() {
    const email = adminDiagnosticEmail.trim();
    if (!isValidEmail(email)) {
      setAuthMessage('Ingresa un mail valido para diagnosticar.');
      return;
    }
    setAuthMessage('Diagnosticando usuario...');
    const { data, error } = await diagnoseAdminUserLogin(email);
    if (error) {
      setAuthMessage(error.message || 'No pude diagnosticar el usuario.');
      return;
    }
    setAdminLoginDiagnostic(data);
    setAuthMessage(data ? 'Diagnostico listo.' : 'No hubo respuesta de diagnostico.');
  }

  async function repairUserLogin() {
    const email = adminDiagnosticEmail.trim();
    if (!isValidEmail(email)) {
      setAuthMessage('Ingresa un mail valido para reparar.');
      return;
    }
    setAuthMessage('Reparando usuario...');
    const { error } = await repairAdminUserLogin(email);
    if (error) {
      setAuthMessage(error.message || 'No pude reparar el usuario.');
      return;
    }
    await diagnoseUserLogin();
    await loadAdminUsers();
    setAuthMessage(changeDone('Usuario reparado. Probalo iniciando sesión nuevamente.'));
  }

  async function deleteUserByDiagnosticEmail() {
    const email = adminDiagnosticEmail.trim();
    if (!isValidEmail(email)) {
      setAuthMessage('Ingresa un mail valido para liberar.');
      return;
    }
    const message = `Esta acción eliminará Auth/Profile/datos vinculados de ${email} y liberará el correo. Se guardará backup interno antes de eliminar.`;
    const confirmed = Platform.OS === 'web'
      ? (typeof window === 'undefined' ? true : window.confirm(message))
      : await new Promise<boolean>((resolve) => {
        Alert.alert('Liberar correo', message, [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Eliminar y liberar', style: 'destructive', onPress: () => resolve(true) }
        ]);
      });
    if (!confirmed) {
      return;
    }

    setAuthMessage('Liberando correo...');
    const { error } = await deleteAdminUserByEmail(email, 'Liberacion manual de correo desde panel administrador');
    if (error) {
      setAuthMessage(error.message || 'No pude liberar el correo.');
      return;
    }
    setSelectedAdminUserId('');
    setAdminLoginDiagnostic(null);
    await loadAdminUsers();
    setAuthMessage(changeDone('Usuario eliminado y correo liberado correctamente.'));
  }

  async function loadRolePermissionDraft(role: Role = permissionRole) {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo Administrador puede gestionar permisos de rangos.');
      return;
    }
    setAuthMessage('Cargando permisos del rango...');
    const rows = await fetchRolePermissions(role);
    setRolePermissionRows(rows);
    if (rows.length > 0) {
      setRolePermissionDraft(rows.filter((item) => item.enabled).map((item) => item.permission_key as Permission));
    } else {
      setRolePermissionDraft(rolePermissions[role] ?? []);
    }
    setAuthMessage(rows.length > 0 ? 'Permisos cargados.' : 'No hay permisos remotos cargados; se muestra base local.');
  }

  function toggleRolePermission(permission: Permission) {
    setRolePermissionDraft((current) => (
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission]
    ));
  }

  async function saveRolePermissionDraft() {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo Administrador puede guardar permisos de rangos.');
      return;
    }
    const { error } = await saveRolePermissions(permissionRole, rolePermissionDraft);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await loadRolePermissionDraft(permissionRole);
    if (session?.role === permissionRole) {
      onSessionChange({ ...session, permissions: rolePermissionDraft });
    }
    setAuthMessage(changeDone('Permisos del rango actualizados.'));
  }

  async function loadProvinceRoleLabels() {
    setAuthMessage('Cargando etiquetas de rangos...');
    const rows = await fetchProvinceRoleLabels();
    setProvinceRoleLabels(rows);
    setAuthMessage(rows.length > 0 ? 'Etiquetas cargadas.' : 'No hay etiquetas personalizadas cargadas.');
  }

  async function saveProvinceRoleLabelDraft() {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo Administrador puede editar nombres visibles de rangos.');
      return;
    }
    if (!roleLabelProvince) {
      setAuthMessage('Elegir provincia.');
      return;
    }
    if (!roleLabelDraft.trim()) {
      setAuthMessage('Escribir el nombre visible del rango.');
      return;
    }

    const { error } = await saveProvinceRoleLabel({
      province: roleLabelProvince,
      roleKey: roleLabelRole,
      displayLabel: roleLabelDraft.trim(),
      description: roleLabelDescription.trim(),
      isActive: roleLabelActive
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await loadProvinceRoleLabels();
    setAuthMessage(changeDone('Etiqueta de rango actualizada.'));
  }

  async function loadRoleAliases(showMessage = true) {
    if (showMessage) {
      setAuthMessage('Cargando alias de rangos...');
    }
    const rows = await fetchAssignableRoleAliases();
    setRoleAliases(rows);
    if (showMessage) {
      setAuthMessage(rows.length > 0 ? 'Alias cargados.' : 'No hay alias asignables cargados.');
    }
  }

  async function queueNotificationIfRequested(enabled: boolean, values: {
    notificationType: string;
    title: string;
    body: string;
    targetKind: string;
    targetValue?: string | null;
    targetScope?: string | null;
    province?: string | null;
    community?: string | null;
    minRole?: string | null;
    tabKey?: string | null;
    sourceType?: string | null;
    sourceId?: string | null;
  }) {
    if (!enabled) {
      return null;
    }
    const canNotify = hasPermission(session, 'enviar_notificaciones') || (values.targetKind === 'comunidad' && Boolean(session && ['animador_comunidad', 'coordinador_comunidad'].includes(session.role)));
    if (!canNotify) {
      return 'El aviso se publico, pero tu rango no tiene permiso para notificar usuarios.';
    }
    const { data, error } = await createNotificationIntent({
      ...values,
      title: notificationTitleFor(values),
      body: values.body.slice(0, 220),
      targetScope: values.targetScope ?? values.targetKind,
      minRole: values.minRole ?? 'palestrista'
    });
    if (error) {
      return `El aviso se publico, pero no pude preparar la notificacion: ${error.message}`;
    }
    const intentId = typeof data === 'string' ? data : Array.isArray(data) ? data[0] : null;
    if (intentId) {
      const delivery = await deliverNotificationIntent(intentId);
      if (delivery.error) {
        return `El aviso se publico, pero no pude enviar la notificacion: ${delivery.error.message}`;
      }
    }
    return null;
  }

  async function adminCreateNews() {
    if (!adminNewsTitle.trim() || !adminNewsBody.trim()) {
      setAuthMessage('Completa titulo y texto antes de publicar la noticia.');
      return;
    }

    setAuthMessage('Publicando noticia...');
    const { data: newsId, error } = await createNews(adminNewsTitle.trim(), adminNewsBody.trim(), true);
    const newsTargetKind = session && ['vocal', 'asesor', 'coordinador_diocesano'].includes(session.role) ? 'provincia' : 'nacional';
    const notificationWarning = !error ? await queueNotificationIfRequested(adminNewsNotify, {
      notificationType: 'aviso_dirigencial',
      title: adminNewsTitle.trim(),
      body: adminNewsBody.trim(),
      targetKind: newsTargetKind,
      targetValue: newsTargetKind === 'provincia' ? session?.province ?? null : null,
      targetScope: newsTargetKind,
      province: newsTargetKind === 'provincia' ? session?.province ?? null : null,
      minRole: 'palestrista',
      tabKey: 'notilestra',
      sourceType: 'news',
      sourceId: typeof newsId === 'string' ? newsId : null
    }) : null;
    setAuthMessage(error ? error.message : notificationWarning ?? changeDone(adminNewsNotify ? 'Noticia creada y notificacion preparada.' : 'Noticia creada.'));
    if (!error) {
      setAdminNewsTitle('');
      setAdminNewsBody('');
      setAdminNewsImage('');
      setAdminNewsDraft(false);
      setAdminNewsFeatured(false);
      setAdminNewsNotify(false);
      await onContentChanged();
    }
  }

  async function loadNewsDrafts() {
    const items = await fetchNewsDrafts();
    setNewsDrafts(items);
    setAuthMessage(items.length > 0 ? 'Borradores cargados.' : 'No hay borradores guardados.');
  }

  async function adminSaveNewsDraft(status = 'borrador') {
    if (!adminNewsTitle.trim() || !adminNewsBody.trim()) {
      setAuthMessage('Completa titulo y texto antes de guardar el borrador.');
      return;
    }

    setAuthMessage('Guardando borrador...');
    const { error } = await saveNewsDraft({
      title: adminNewsTitle.trim(),
      body: adminNewsBody.trim(),
      category: adminNewsCategory,
      imageUrl: adminNewsImage.trim() || null,
      isFeatured: adminNewsFeatured,
      status
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAdminNewsTitle('');
    setAdminNewsBody('');
    setAdminNewsImage('');
    setAdminNewsDraft(false);
    setAdminNewsFeatured(false);
    await loadNewsDrafts();
    setAuthMessage(changeDone(status === 'borrador' ? 'Borrador guardado.' : 'Borrador actualizado.'));
  }

  async function loadAdminMaterials() {
    const items = await fetchAppMaterials();
    setAdminMaterials(items);
    setAuthMessage(items.length > 0 ? 'Materiales cargados.' : 'No hay materiales guardados.');
  }

  async function adminSaveMaterial() {
    if (!materialTitle.trim() || !materialDescription.trim()) {
      setAuthMessage('Completa nombre y descripcion del material.');
      return;
    }

    setAuthMessage('Guardando material...');
    const { error } = await saveAppMaterial({
      title: materialTitle.trim(),
      description: materialDescription.trim(),
      category: materialCategory.trim() || 'General',
      visibility: materialVisibility,
      requiredPermission: materialPermission.trim() || null,
      fileUrl: materialFileUrl.trim() || null,
      filePath: null,
      sortOrder: 100
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setMaterialTitle('');
    setMaterialDescription('');
    setMaterialFileUrl('');
    setMaterialPermission('');
    await loadAdminMaterials();
    setAuthMessage(changeDone('Material guardado y visible segun permisos.'));
  }

  async function adminArchiveMaterial(id: string) {
    const { error } = await archiveAppMaterial(id);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await loadAdminMaterials();
    setAuthMessage(changeDone('Material archivado.'));
  }

  async function adminCreateEvent() {
    if (!adminEventTitle.trim() || !adminEventBody.trim() || !adminEventDate.trim()) {
      setAuthMessage('Completa titulo, descripcion y fecha antes de publicar el evento.');
      return;
    }
    if (Number.isNaN(Date.parse(adminEventDate))) {
      setAuthMessage('La fecha debe tener formato valido. Ejemplo: 2026-05-28T21:00:00-03:00');
      return;
    }

    setAuthMessage('Publicando evento...');
    const { data: eventId, error } = await createEvent(adminEventTitle.trim(), adminEventBody.trim(), adminEventDate.trim(), true);
    const eventTargetKind = session && ['vocal', 'asesor', 'coordinador_diocesano'].includes(session.role) ? 'provincia' : 'nacional';
    const notificationWarning = !error ? await queueNotificationIfRequested(adminEventNotify, {
      notificationType: 'recordatorio_evento',
      title: adminEventTitle.trim(),
      body: adminEventBody.trim(),
      targetKind: eventTargetKind,
      targetValue: eventTargetKind === 'provincia' ? session?.province ?? null : null,
      targetScope: eventTargetKind,
      province: eventTargetKind === 'provincia' ? session?.province ?? null : null,
      minRole: 'palestrista',
      tabKey: 'notilestra',
      sourceType: 'event',
      sourceId: typeof eventId === 'string' ? eventId : null
    }) : null;
    setAuthMessage(error ? error.message : notificationWarning ?? changeDone(adminEventNotify ? 'Evento creado y notificacion preparada.' : 'Evento creado.'));
    if (!error) {
      setAdminEventTitle('');
      setAdminEventBody('');
      setAdminEventDate('');
      setAdminEventNotify(false);
      await onContentChanged();
    }
  }

  async function adminSaveTab(key: string, fallbackLabel: string) {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo el administrador puede modificar los accesos.');
      return;
    }
    const tab = editableTabs.find((item) => item.key === key);
    const draft = editingTabs[key] ?? { label: fallbackLabel, iconName: tab?.icon ?? 'document-text-outline', isVisible: true, visibleRoles: tab?.visibleRoles ?? null };
    if (!draft.label.trim()) {
      setAuthMessage('El nombre visible no puede quedar vacio.');
      return;
    }
    if (!isIoniconName(draft.iconName)) {
      setAuthMessage(`El icono "${draft.iconName}" no existe en Ionicons.`);
      return;
    }
    const { error } = await updateAppTab(key, draft.label.trim() || fallbackLabel, draft.isVisible, draft.visibleRoles, draft.iconName);
    setAuthMessage(error ? error.message : changeDone('Pestana actualizada.'));
    await onTabsChanged();
  }

  async function adminCreatePage() {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo el administrador puede crear paginas nuevas.');
      return;
    }
    if (!newTabLabel.trim()) {
      setAuthMessage('Escribir un nombre para la nueva pagina.');
      return;
    }
    const key = normalizeTabKey(newTabKey || newTabLabel);
    if (!key) {
      setAuthMessage('La clave interna no puede quedar vacia.');
      return;
    }
    if (editableTabs.some((item) => item.key === key)) {
      setAuthMessage('Ya existe una sección con esa clave interna.');
      return;
    }
    if (!isIoniconName(newTabIcon)) {
      setAuthMessage(`El icono "${newTabIcon}" no existe en Ionicons.`);
      return;
    }
    const { error } = await createAppTab(key, newTabLabel.trim(), newTabRoles, newTabIcon);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await updateAppContent(key, newTabLabel.trim(), 'Contenido inicial de la pagina.', [
      { id: `titulo-${Date.now()}`, type: 'titulo', value: newTabLabel.trim() },
      { id: `texto-${Date.now()}`, type: 'texto', value: 'Contenido inicial de la pagina.' }
    ]);
    setNewTabLabel('');
    setNewTabKey('');
    setNewTabIcon('document-text-outline');
    await onTabsChanged();
    await onContentChanged();
    setAuthMessage(changeDone('Pagina creada con visibilidad por rol.'));
  }

  async function adminMoveTab(key: string, direction: -1 | 1) {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo el administrador puede ordenar los accesos.');
      return;
    }
    const sorted = editableTabs.map((tab, index) => ({ ...tab, sortOrder: Number.isFinite(tab.sortOrder) ? tab.sortOrder : index * 10 })).sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex((item) => item.key === key);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) {
      return;
    }
    const nextOrder = [...sorted];
    const [moved] = nextOrder.splice(index, 1);
    nextOrder.splice(targetIndex, 0, moved);

    setAuthMessage('Actualizando orden de accesos...');
    for (const [orderIndex, tab] of nextOrder.entries()) {
      const draft = editingTabs[tab.key] ?? { label: tab.label, iconName: tab.icon, isVisible: tab.visible, visibleRoles: tab.visibleRoles };
      const { error } = await updateAppTabPosition({
        key: tab.key,
        label: draft.label || tab.label,
        isVisible: draft.isVisible,
        sortOrder: (orderIndex + 1) * 10,
        visibleRoles: draft.visibleRoles,
        iconName: draft.iconName || tab.icon
      });
      if (error) {
        setAuthMessage(error.message);
        return;
      }
    }
    await onTabsChanged();
    setAuthMessage(changeDone('Orden de accesos actualizado.'));
  }

  function updateTabRole(key: string, role: Role, checked: boolean) {
    const tab = editableTabs.find((item) => item.key === key);
    const currentDraft = editingTabs[key] ?? { label: tab?.label ?? key, iconName: tab?.icon ?? 'document-text-outline', isVisible: tab?.visible ?? true, visibleRoles: tab?.visibleRoles ?? null };
    const currentRoles = currentDraft.visibleRoles ?? roleDefinitions.map((item) => item.role);
    const nextRoles = checked ? Array.from(new Set([...currentRoles, role])) : currentRoles.filter((item) => item !== role);
    setEditingTabs((current) => ({ ...current, [key]: { ...currentDraft, visibleRoles: nextRoles } }));
  }

  function toggleNewTabRole(role: Role) {
    setNewTabRoles((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role]);
  }

  async function adminDeleteTab(key: string) {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo el administrador puede eliminar secciones.');
      return;
    }
    if (protectedTabKeys.has(key) || defaultTabByKey.has(key)) {
      setAuthMessage('Esta sección es crítica o propia de la app. Podés ocultarla, pero no eliminarla.');
      return;
    }
    const confirmed = Platform.OS === 'web'
      ? (typeof window === 'undefined' ? true : window.confirm('¿Seguro que deseas eliminar esta sección? También se puede perder contenido asociado.'))
      : await new Promise<boolean>((resolve) => {
        Alert.alert('Eliminar sección', '¿Seguro que deseas eliminar esta sección? También se puede perder contenido asociado.', [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) }
        ]);
      });
    if (!confirmed) {
      return;
    }
    const { error } = await deleteAppTab(key);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await onTabsChanged();
    await onContentChanged();
    setAuthMessage(changeDone('Sección eliminada.'));
  }

  async function adminRestoreDefaultNavigation() {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo el administrador puede restaurar navegación.');
      return;
    }
    const confirmed = Platform.OS === 'web'
      ? (typeof window === 'undefined' ? true : window.confirm('¿Restaurar la navegación predeterminada? Se reemplazarán nombres, iconos, orden y visibilidad base.'))
      : await new Promise<boolean>((resolve) => {
        Alert.alert('Restaurar navegación', '¿Restaurar la navegación predeterminada? Se reemplazarán nombres, iconos, orden y visibilidad base.', [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Restaurar', style: 'destructive', onPress: () => resolve(true) }
        ]);
      });
    if (!confirmed) {
      return;
    }
    const { error } = await restoreDefaultAppTabs();
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setEditingTabs({});
    await onTabsChanged();
    setAuthMessage(changeDone('Navegación predeterminada restaurada.'));
  }

  async function adminSaveContent() {
    if (!contentTitle.trim() || !contentBody.trim()) {
      setAuthMessage('Completa titulo y texto antes de guardar el contenido.');
      return;
    }

    setAuthMessage('Guardando contenido...');
    const normalizedBlocks = contentBlocks
      .map((block) => ({ ...block, value: block.value.trim() }))
      .filter((block) => block.value.length > 0);
    const { error } = await updateAppContent(selectedContentTab, contentTitle.trim(), contentBody.trim(), normalizedBlocks);
    setAuthMessage(error ? error.message : changeDone('Contenido actualizado.'));
    if (!error) {
      await onContentChanged();
    }
  }

  async function pickAdminCommunityImage() {
    if (!selectedAdminCommunity?.id) {
      setAuthMessage('Elegir una comunidad antes de cargar imagen.');
      return;
    }
    if (!canEditCommunity(session, adminCommunityProvince, selectedAdminCommunity.name)) {
      setAuthMessage('Tu rango no puede cambiar la imagen de esta comunidad.');
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAuthMessage('Necesitamos permiso para elegir una imagen.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    setAdminCommunityImageAsset(result.assets[0]);
    setAdminCommunityImagePreview(result.assets[0].uri);
    setAuthMessage('Imagen seleccionada. Revisá la vista previa y guardá la comunidad.');
  }

  async function uploadAdminCommunityImage() {
    if (!adminCommunityImageAsset || !selectedAdminCommunity?.id) {
      return adminCommunityImageUrl;
    }
    setAdminCommunityImageUploading(true);
    try {
      const response = await fetch(adminCommunityImageAsset.uri);
      const bytes = await response.arrayBuffer();
      const extension = adminCommunityImageAsset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      const safeExtension = extension.length <= 5 ? extension : 'jpg';
      const path = `${selectedAdminCommunity.id}/community-${Date.now()}.${safeExtension}`;
      const { error: uploadError } = await supabase.storage
        .from('community-images')
        .upload(path, bytes, {
          contentType: adminCommunityImageAsset.mimeType ?? 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrl } = supabase.storage.from('community-images').getPublicUrl(path);
      return publicUrl.publicUrl;
    } finally {
      setAdminCommunityImageUploading(false);
    }
  }

  async function adminSaveCommunity() {
    if (!selectedAdminCommunity?.id) {
      setAuthMessage('Elegir una comunidad cargada desde Supabase para editar.');
      return;
    }
    if (!canEditCommunity(session, adminCommunityProvince, selectedAdminCommunity.name)) {
      setAuthMessage('Tu rango solo puede editar comunidades de tu provincia o de tu alcance.');
      return;
    }

    setAuthMessage('Guardando comunidad...');
    let imageUrl = adminCommunityImageUrl;
    try {
      imageUrl = await uploadAdminCommunityImage();
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'No se pudo subir la imagen de comunidad.');
      return;
    }
    const { error } = await updateCommunity(selectedAdminCommunity.id, {
      name: adminCommunityName,
      address: adminCommunityAddress,
      phone: adminCommunityPhone,
      meeting_day: adminCommunityDay,
      meeting_time: adminCommunityTime,
      description: adminCommunityDescription,
      image_url: imageUrl
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }

    const items = await fetchCommunities();
    setRegistrationCommunities(items);
    setAdminCommunityId('');
    setAdminCommunityImageAsset(null);
    setAdminCommunityImageUrl(imageUrl);
    setAdminCommunityImagePreview(imageUrl);
    setAuthMessage(changeDone('Cambios guardados.'));
    if (session?.communityOfOrigin === selectedAdminCommunity.name) {
      onSessionChange({ ...session, communityOfOrigin: adminCommunityName || selectedAdminCommunity.name });
    }
    await onContentChanged();
  }

  async function adminCreateCommunity() {
    if (!canAdministrateCommunities) {
      setAuthMessage('Tu rango no puede crear comunidades.');
      return;
    }
    if (!adminCommunityProvince || !adminCommunityName.trim()) {
      setAuthMessage('Nombre y provincia son obligatorios.');
      return;
    }
    if (!canManageProvince(session, adminCommunityProvince) && !canSeeAllProvinces(session)) {
      setAuthMessage('Tu rango solo puede crear comunidades dentro de su jurisdiccion.');
      return;
    }

    setAuthMessage('Creando comunidad...');
    const { error } = await createCommunity({
      province: adminCommunityProvince,
      name: adminCommunityName.trim(),
      groupType: adminCommunityGroupType,
      address: adminCommunityAddress.trim(),
      phone: adminCommunityPhone.trim(),
      meetingDay: adminCommunityDay.trim(),
      meetingTime: adminCommunityTime.trim(),
      description: adminCommunityDescription.trim(),
      isActive: adminCommunityIsActive
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    const items = await fetchCommunities();
    setRegistrationCommunities(items);
    setAdminCommunityName('');
    setAdminCommunityAddress('');
    setAdminCommunityPhone('');
    setAdminCommunityDay('');
    setAdminCommunityTime('');
    setAdminCommunityDescription('');
    setAuthMessage(changeDone('Comunidad creada.'));
    await onContentChanged();
  }

  async function adminToggleCommunityStatus(id: string, isActive: boolean) {
    const { error } = await setCommunityStatus(id, isActive);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setRegistrationCommunities(await fetchCommunities());
    setAuthMessage(changeDone(isActive ? 'Comunidad habilitada.' : 'Comunidad deshabilitada.'));
  }

  async function adminArchiveCommunity(id: string) {
    const message = '¿Seguro que deseas eliminar esta comunidad? Esta acción puede afectar usuarios, avisos y publicaciones vinculadas.';
    const confirmed = Platform.OS === 'web' ? (typeof window === 'undefined' ? true : window.confirm(message)) : await new Promise<boolean>((resolve) => {
      Alert.alert('Eliminar comunidad', message, [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) }
      ]);
    });
    if (!confirmed) {
      return;
    }
    const { error } = await archiveCommunity(id);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setRegistrationCommunities(await fetchCommunities());
    setAdminCommunityId('');
    setAuthMessage(changeDone('Comunidad eliminada.'));
  }

  function addContentBlock(type: ContentEditorBlock['type']) {
    setContentBlocks((current) => [
      ...current,
      { id: `${type}-${Date.now()}`, type, value: type === 'imagen' ? 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png' : '' }
    ]);
  }

  function moveContentBlock(index: number, direction: -1 | 1) {
    setContentBlocks((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  }

  function updateContentBlock(id: string, value: string) {
    setContentBlocks((current) => current.map((block) => block.id === id ? { ...block, value } : block));
  }

  function deleteContentBlock(id: string) {
    setContentBlocks((current) => current.filter((block) => block.id !== id));
  }

  async function resolveAdminRequest(id: string, status: 'aprobada' | 'denegada') {
    const request = adminRequests.find((item) => item.id === id);
    const assignRole = status === 'aprobada' && request?.title === 'Solicitud de perseverancia' ? perseveranceRole : status === 'aprobada' && request?.title === 'Cambio de dirigencia' ? (request.targetRole as Role | undefined ?? leadershipRole) : null;
    if (assignRole && !canApproveRole(session, assignRole)) {
      setAuthMessage(`Tu rango no puede aprobar el rol ${roleLabel(assignRole)}.`);
      return;
    }
    const { error } = await resolveUserRequest(id, status === 'denegada' ? 'rechazada' : status, adminRequestMessage || 'Sin mensaje del administrador', assignRole);
    if (!error) {
      await loadAdminRequests();
      setRequestSubtab('resueltas');
      setAuthMessage(changeDone(assignRole ? `Solicitud aprobada y rol ${roleLabel(assignRole)} asignado.` : `Solicitud ${status}. El usuario vera la resolucion en su perfil.`));
      setAdminRequestMessage('');
      return;
    }

    setAdminRequests((current) => current.map((request) => (
      request.id === id
        ? { ...request, status, message: adminRequestMessage || 'Sin mensaje del administrador', resolvedAt: new Date().toISOString(), resolvedBy: `${session?.fullName ?? 'Administrador'} - ${roleLabel(session?.role ?? 'administrador')}` }
        : request
    )));
    setRequestSubtab('resueltas');
    setAuthMessage(changeDone(`Solicitud ${status}. El usuario vera la resolucion en su perfil.`));
    setAdminRequestMessage('');
  }

  async function acceptDiocesanRequest(id: string) {
    const { error } = await acceptDiocesanCoordinatorRequest(id);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await loadMyRequests();
    await refreshRealProfile();
    setAuthMessage(changeDone('Aceptaste el nuevo rango de coordinación.'));
  }

  async function submitUserRequest(title: string) {
    if (!session) {
      return;
    }
    if (userRequestText.trim().length === 0) {
      setAuthMessage('Escribí una descripción de hasta 500 caracteres para enviar la solicitud.');
      return;
    }

    const newRequest = {
      id: `req-${Date.now()}`,
      title,
      requester: session.fullName,
      definition: userRequestText.trim().slice(0, 500),
      createdAt: new Date().toISOString(),
      status: 'pendiente' as const
    };
    const { error } = await createUserRequest(title, newRequest.definition);
    if (error) {
      setAuthMessage(error.message || 'No se pudo enviar la solicitud.');
      return;
    }
    await loadMyRequests();
    await loadAdminRequests();
    setSentRequests((current) => [
      ...current,
      newRequest
    ]);
    setAdminRequests((current) => [
      ...current,
      newRequest
    ]);
    setSelectedRequest(null);
    setUserRequestText('');
    setAuthMessage(changeDone(title === 'Solicitud Especial' ? 'Solicitud enviada a la dirigencia diocesana.' : 'Solicitud enviada al panel del administrador.'));
  }

  async function submitLeadershipChangeRequest() {
    if (!session || !isCommunityLeader) {
      return;
    }
    if (!successorUserId) {
      setAuthMessage('Selecciona el sucesor dentro de tu comunidad.');
      return;
    }
    if (!userRequestText.trim()) {
      setAuthMessage('Escribi un mensaje para fundamentar el cambio de dirigencia.');
      return;
    }

    const successor = selectableCommunityMembers.find((member) => member.id === successorUserId);
    const details = `${userRequestText.trim().slice(0, 500)}\n\nSucesor propuesto: ${successor?.full_name ?? 'Usuario seleccionado'}\nRol propuesto: ${roleLabel(leadershipRole)}\nComunidad: ${session.communityOfOrigin}`;
    const { error } = await createLeadershipChangeRequest({
      successorUserId,
      successorRole: leadershipRole,
      details
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await loadMyRequests();
    setSelectedRequest(null);
    setUserRequestText('');
    setSuccessorUserId('');
    setAuthMessage(changeDone('Solicitud de cambio de dirigencia enviada al Vocal Diocesano.'));
  }

  async function saveAccountSettings() {
    setAuthMessage('Guardando ajustes...');
    const updates: { email?: string; password?: string } = {};
    if (newEmail.trim()) {
      updates.email = newEmail.trim();
    }
    if (newPassword.trim()) {
      updates.password = newPassword;
    }
    if (!updates.email && !updates.password) {
      setAuthMessage('No hay cambios de mail o contraseña para guardar.');
      return;
    }
    const { error } = await supabase.auth.updateUser(updates);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setNewEmail('');
    setNewPassword('');
    await refreshRealProfile();
    setAuthMessage(changeDone('Ajustes de cuenta actualizados.'));
  }

  async function enablePushNotificationsFromSettings() {
    if (!session) {
      setAuthMessage('Iniciá sesión para activar notificaciones.');
      return;
    }
    setAuthMessage('Solicitando permiso de notificaciones...');
    try {
      const result = await requestAndRegisterPushToken(session, true);
      setNotificationPermissionStatus(result.status);
      if (result.token) {
        setPushTokenPreview(`${result.token.slice(0, 18)}...`);
        setPushCurrentToken(result.token);
      }
      const channelDebug = await getAndroidChannelDebug();
      setPushChannelDebug(channelDebug);
      setPushDebugInfo([
        `Permiso: ${result.status}`,
        `ProjectId: ${result.projectId}`,
        `Runtime: ${result.appRuntimeOwner}`,
        `DeviceId: ${result.deviceId ?? 'sin-device-id'}`,
        `Usuario: ${session.email}`,
        `Guardado Supabase: ${result.saved ? 'si' : 'no'}`,
        `Token: ${result.token ?? 'sin-token'}`,
        `Error técnico: ${result.technicalError ?? 'sin-error-técnico'}`
      ].join('\n'));
      setAuthMessage(result.error ? result.error : changeDone('Notificaciones activadas en este dispositivo.'));
    } catch (error) {
      setAuthMessage(getFriendlyPushError(error));
    }
  }

  async function sendLocalNotificationDebug() {
    setPushTestResult('Enviando notificacion local...');
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Palestra',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2d8dc8',
          sound: 'default',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
        });
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Prueba local Palestra',
          body: 'Si ves esto, Android y el canal local muestran notificaciones.',
          sound: 'default'
        },
        trigger: null
      });
      setPushChannelDebug(await getAndroidChannelDebug());
      setPushTestResult('Notificacion local solicitada. Si aparece, el canal Android funciona.');
    } catch (error) {
      setPushTestResult(error instanceof Error ? error.message : 'Fallo la prueba local.');
    }
  }

  async function sendRemotePushDebug() {
    if (session?.role !== 'administrador') {
      setPushTestResult('Solo Administrador puede enviar prueba push.');
      return;
    }
    let token = pushCurrentToken;
    if (!token) {
      const result = await requestAndRegisterPushToken(session, true);
      token = result.token ?? '';
      setNotificationPermissionStatus(result.status);
      setPushCurrentToken(token);
      setPushTokenPreview(token ? `${token.slice(0, 18)}...` : '');
      setPushDebugInfo([
        `Permiso: ${result.status}`,
        `ProjectId: ${result.projectId}`,
        `Runtime: ${result.appRuntimeOwner}`,
        `DeviceId: ${result.deviceId ?? 'sin-device-id'}`,
        `Usuario: ${session.email}`,
        `Guardado Supabase: ${result.saved ? 'si' : 'no'}`,
        `Token: ${result.token ?? 'sin-token'}`,
        `Error técnico: ${result.technicalError ?? 'sin-error-técnico'}`
      ].join('\n'));
    }
    if (!token) {
      setPushTestResult('No hay token actual para probar.');
      return;
    }
    setPushTestResult('Enviando push remoto a Expo Push API...');
    const response = await debugPushToDevice({
      token,
      projectId: easProjectId,
      runtime: appRuntimeOwner
    });
    setPushChannelDebug(await getAndroidChannelDebug());
    setPushTestResult(JSON.stringify({
      error: response.error?.message ?? null,
      data: response.data ?? null
    }, null, 2));
  }

  async function publishCommunityPost() {
    if (!session || !isCommunityLeader) {
      return;
    }
    if (!communityPostBody.trim()) {
      setAuthMessage('Completa el mensaje antes de publicar en tu comunidad.');
      return;
    }
    if (communityPostKind === 'fecha' && !communityPostDate.trim()) {
      setAuthMessage('Las fechas de calendario necesitan una fecha.');
      return;
    }

    const visibility = session.role === 'animador_comunidad' ? 'publica' : communityPostVisibility;
    const pollOptions = communityPostKind === 'encuesta'
      ? communityPollOptions.split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 8)
      : [];
    if (communityPostKind === 'encuesta' && pollOptions.length < 2) {
      setAuthMessage('Las encuestas necesitan al menos 2 opciones, una por linea.');
      return;
    }
    const { data: communityPublicationId, error } = await createCommunityPublication({
      kind: communityPostKind,
      title: communityPostTitle.trim() || 'Aviso comunitario',
      body: communityPostBody.trim(),
      eventDate: communityPostKind === 'fecha' ? communityPostDate.trim() : null,
      visibility,
      pollOptions
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    const notificationWarning = await queueNotificationIfRequested(communityPostNotify, {
      notificationType: 'mensaje_comunidad',
      title: communityPostTitle.trim() || 'Aviso comunitario',
      body: communityPostBody.trim(),
      targetKind: 'comunidad',
      targetValue: session.communityOfOrigin,
      targetScope: visibility,
      province: session.province,
      community: session.communityOfOrigin,
      minRole: visibility === 'sedimentadores' ? 'sedimentador' : 'palestrista',
      tabKey: 'perfil',
      sourceType: 'community_publication',
      sourceId: typeof communityPublicationId === 'string' ? communityPublicationId : null
    });
    setCommunityPostTitle('');
    setCommunityPostBody('');
    setCommunityPostDate('');
    setCommunityPollOptions('');
    setCommunityPostNotify(false);
    const successMessage = notificationWarning ?? changeDone('Mensaje enviado correctamente');
    setAuthMessage(successMessage);
    if (!notificationWarning) {
      showFeedbackMessage('Mensaje enviado correctamente');
    }
    await refreshCommunityForum();
    await onContentChanged();
  }

  function startEditCommunityPublication(item: CommunityPublication) {
    setEditingCommunityPublicationId(item.id ?? null);
    setEditingCommunityPublicationTitle(item.title);
    setEditingCommunityPublicationBody(item.body);
  }

  async function saveCommunityPublicationEdit(status: 'activo' | 'cerrado' = 'activo') {
    if (!editingCommunityPublicationId) {
      return;
    }
    if (!editingCommunityPublicationTitle.trim() || !editingCommunityPublicationBody.trim()) {
      setAuthMessage('Completa titulo y contenido del aviso.');
      return;
    }
    const { error } = await updateCommunityPublication({
      publicationId: editingCommunityPublicationId,
      title: editingCommunityPublicationTitle.trim(),
      body: editingCommunityPublicationBody.trim(),
      status
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setEditingCommunityPublicationId(null);
    setEditingCommunityPublicationTitle('');
    setEditingCommunityPublicationBody('');
    setAuthMessage(changeDone(status === 'cerrado' ? 'Aviso cerrado.' : 'Aviso actualizado.'));
    await refreshCommunityForum();
  }

  async function removeCommunityPublication(publicationId: string) {
    const { error } = await archiveCommunityPublication(publicationId);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAuthMessage(changeDone('Aviso eliminado.'));
    await refreshCommunityForum();
  }

  async function votePoll(publication: CommunityPublication, option: string) {
    if (!publication.id) {
      return;
    }
    const { error } = await voteCommunityPoll(publication.id, option);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setLocalPollVotes((current) => ({ ...current, [publication.id]: option }));
    await refreshCommunityForum();
  }

  async function submitForumComment(publicationId: string) {
    const body = (forumCommentDrafts[publicationId] ?? '').trim();
    if (!body) {
      setAuthMessage('Escribi un comentario antes de publicar.');
      return;
    }
    const { error } = await createPublicationComment(publicationId, body);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setForumCommentDrafts((current) => ({ ...current, [publicationId]: '' }));
    setAuthMessage(changeDone('Comentario publicado.'));
    await refreshCommunityForum();
  }

  async function submitForumReaction(publicationId: string) {
    const { error } = await reactToPublication(publicationId, 'amen');
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAuthMessage(changeDone('Reacción registrada.'));
  }

  async function submitForumReport(publicationId: string) {
    const reason = (forumReportDrafts[publicationId] ?? '').trim();
    if (!reason) {
      setAuthMessage('Escribi un motivo para reportar.');
      return;
    }
    const { error } = await reportPublication(publicationId, reason);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setForumReportDrafts((current) => ({ ...current, [publicationId]: '' }));
    setAuthMessage(changeDone('Reporte enviado para moderacion.'));
  }

  async function openPublicProfile(profile: PublicProfilePreview) {
    setSelectedPublicProfile(profile);
    if (!profile.id) {
      return;
    }
    const remoteProfile = await fetchPublicProfile(profile.id);
    if (!remoteProfile) {
      return;
    }
    setSelectedPublicProfile((current) => {
      if (!current || current.id !== profile.id) {
        return current;
      }
      return {
        ...current,
        fullName: remoteProfile.full_name ?? current.fullName,
        role: (remoteProfile.role || current.role) as Role,
        province: remoteProfile.province ?? current.province,
        communityName: remoteProfile.community_name ?? current.communityName,
        contact: remoteProfile.phone ?? current.contact,
        avatarUrl: remoteProfile.avatar_url ?? current.avatarUrl
      };
    });
  }

  return (
    <View style={styles.stack}>
      <SectionTitle title={`${tabLabel('perfil')} y acceso`} />
      <Modal visible={Boolean(selectedPublicProfile)} transparent animationType="fade" onRequestClose={() => setSelectedPublicProfile(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalPanel}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setSelectedPublicProfile(null)} activeOpacity={0.8}>
              <Ionicons name="close" size={19} color={palette.red} />
            </TouchableOpacity>
            {selectedPublicProfile ? (
              <View style={styles.publicProfilePanel}>
                <View style={styles.publicProfileAvatar}>
                  {selectedPublicProfile.avatarUrl ? <Image source={{ uri: selectedPublicProfile.avatarUrl }} style={styles.publicProfileAvatarImage} /> : <Ionicons name="person-outline" size={28} color={palette.red} />}
                </View>
                <Text style={styles.cardEyebrow}>Perfil palestrista</Text>
                <Text style={styles.cardTitle}>{selectedPublicProfile.fullName}</Text>
                <Text style={styles.cardText}>{roleLabel(selectedPublicProfile.role)}</Text>
                {selectedPublicProfile.communityName ? <Text style={styles.cardText}>Comunidad: {selectedPublicProfile.communityName}</Text> : null}
                {selectedPublicProfile.province ? <Text style={styles.cardText}>Provincia: {selectedPublicProfile.province}</Text> : null}
                {selectedPublicProfile.contact ? <Text style={styles.cardText}>Contacto: {selectedPublicProfile.contact}</Text> : null}
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
      {session ? (
        <View style={styles.profileShell}>
          <View style={styles.profileTopRow}>
            <View />
            <TouchableOpacity style={styles.iconButton} onPress={() => setShowAccountMenu(!showAccountMenu)}>
              <Ionicons name="ellipsis-vertical" size={20} color={palette.red} />
            </TouchableOpacity>
          </View>
          {showAccountMenu ? (
            <View style={styles.accountMenu}>
              <View style={styles.accountMenuHeader}>
                <View style={styles.accountMenuAvatar}>
                  {session.avatarUrl ? <Image source={{ uri: session.avatarUrl }} style={styles.accountMenuAvatarImage} /> : <Ionicons name="person-outline" size={18} color={palette.red} />}
                </View>
                <View style={styles.adminUserHeaderText}>
                  <Text style={styles.accountMenuName}>{session.fullName}</Text>
                  <Text style={styles.accountMenuSub}>{displayRoleLabel(session.role, session.province, provinceRoleLabels, adminConfig.settings.roleAliases, session.displayRoleLabel, session.genderPreference)}</Text>
                </View>
              </View>
              {[
                { icon: 'person-outline', label: 'Mi perfil', action: () => { setProfilePanel('vista'); setShowCommunity(false); setShowCommunityManagement(false); } },
                { icon: 'create-outline', label: 'Editar perfil', action: () => { setProfilePanel('editar'); setShowCommunity(false); setShowCommunityManagement(false); } },
                { icon: 'people-outline', label: 'Mi comunidad', action: () => { setProfilePanel('comunidad'); setShowCommunity(false); setShowCommunityManagement(false); refreshCommunityForum(); } },
                { icon: 'mail-outline', label: 'Buzon', action: () => { setProfilePanel('buzon'); setShowCommunity(false); setShowCommunityManagement(false); refreshMailbox(); } },
                { icon: 'settings-outline', label: 'Ajustes', action: () => { setProfilePanel('configuracion'); setShowCommunity(false); setShowCommunityManagement(false); } },
              ].map((item) => (
                <TouchableOpacity key={item.label} style={styles.accountMenuItem} onPress={() => { item.action(); setShowAccountMenu(false); }}>
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color={palette.inkMuted} />
                  <Text style={styles.accountMenuItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.accountMenuItem} onPress={signOutReal}>
                <Ionicons name="log-out-outline" size={18} color={palette.red} />
                <Text style={[styles.accountMenuItemText, styles.accountMenuDanger]}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {profilePanel === 'vista' ? <View style={styles.profileHero}>
            <TouchableOpacity style={styles.avatarFrameLarge} onPress={uploadProfilePhoto} activeOpacity={0.88}>
              {session.avatarUrl ? <Image source={{ uri: session.avatarUrl }} style={styles.avatarImageLarge} /> : <Ionicons name="camera-outline" size={42} color={palette.red} />}
            </TouchableOpacity>
            <View style={styles.profileHeroInfo}>
              <View style={styles.profileNameRow}>
                <Text style={styles.profileName}>{session.fullName}</Text>
                <View style={styles.verifiedRow}>
                  <Ionicons name="shield-checkmark-outline" size={22} color={palette.green} />
                </View>
              </View>
              {session.email ? <Text style={styles.cardText}>{session.email}</Text> : null}
              <Text style={styles.cardText}>{displayRoleLabel(session.role, session.province, provinceRoleLabels, adminConfig.settings.roleAliases, session.displayRoleLabel, session.genderPreference)}</Text>
              <TouchableOpacity style={styles.photoChangeButton} onPress={uploadProfilePhoto}>
                <Ionicons name="camera-outline" size={16} color={palette.red} />
                <Text style={styles.photoChangeText}>{session.avatarUrl ? 'Cambiar foto de perfil' : 'Subir foto de perfil'}</Text>
              </TouchableOpacity>
            </View>
          </View> : null}
          {profilePanel === 'vista' ? <View style={styles.profileMetaGrid}>
            {[
              { label: 'Provincia', value: session.province, icon: 'map-outline' },
              { label: 'Rango', value: displayRoleLabel(session.role, session.province, provinceRoleLabels, adminConfig.settings.roleAliases, session.displayRoleLabel, session.genderPreference), icon: 'ribbon-outline' },
              { label: 'Contacto', value: session.contact, icon: 'chatbubble-ellipses-outline' },
              { label: 'Comunidad', value: session.communityOfOrigin, icon: 'people-outline' }
            ].map((item) => (
              <View key={item.label} style={styles.profileMetaItem}>
                <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={17} color={palette.red} />
                <View style={styles.profileMetaText}>
                  <Text style={styles.profileMetaLabel}>{item.label}</Text>
                  <Text style={styles.profileMetaValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View> : null}
          {profilePanel === 'vista' && roleInfo ? <Text style={styles.cardText}>{roleInfo.description}</Text> : null}
          {profilePanel === 'editar' ? <View style={styles.profileCommunityPanel}>
            <Text style={styles.cardEyebrow}>Editar perfil</Text>
            {isMissingProfileScope(session) ? (
              <View style={styles.completionNotice}>
                <Ionicons name="alert-circle-outline" size={20} color={palette.red} />
                <Text style={styles.completionNoticeText}>Completa provincia y comunidad para usar normalmente la app.</Text>
              </View>
            ) : null}
            <Text style={styles.cardText}>Por seguridad, los datos de perfil solo pueden cambiarse una vez cada 5 dias.</Text>
            <TextInput style={styles.input} placeholder="Nombre y apellido" value={editFullName} onChangeText={setEditFullName}  placeholderTextColor={inputPlaceholderColor} />
            <TextInput style={styles.input} placeholder="Contacto" value={editContact} onChangeText={setEditContact}  placeholderTextColor={inputPlaceholderColor} />
            <Text style={styles.cardEyebrow}>Provincia</Text>
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setEditProvinceDropdownOpen(!editProvinceDropdownOpen)}>
              <Text style={styles.dropdownButtonText}>{editProvince || 'Seleccionar provincia'}</Text>
              <Ionicons name={editProvinceDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
            </TouchableOpacity>
            {editProvinceDropdownOpen ? (
              <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                {registrationCommunities.map((item) => (
                  <TouchableOpacity
                    key={item.province}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setEditProvince(item.province);
                      setEditCommunity('');
                      setEditProvinceDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{item.province}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}
            {selectedEditProvince ? (
              <>
                <Text style={styles.cardEyebrow}>Comunidad de origen</Text>
                <TouchableOpacity style={styles.dropdownButton} onPress={() => setEditCommunityDropdownOpen(!editCommunityDropdownOpen)}>
                  <Text style={styles.dropdownButtonText}>{editCommunity || 'Seleccionar comunidad'}</Text>
                  <Ionicons name={editCommunityDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                </TouchableOpacity>
                {editCommunityDropdownOpen ? (
                  <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                    {selectedEditProvince.locations.map((item) => (
                      <TouchableOpacity key={item.name} style={styles.dropdownItem} onPress={() => { setEditCommunity(item.name); setEditCommunityDropdownOpen(false); }}>
                        <Text style={styles.dropdownItemText}>{item.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : null}
              </>
            ) : null}
            <Text style={styles.cardEyebrow}>Narrativa</Text>
            <Text style={styles.cardText}>Elegí cómo querés que la app adapte los textos automáticos del sistema.</Text>
            {(['male', 'female'] as const).map((option) => {
              const selected = editGenderPreference === option;
              const narrative = genderNarratives[option];
              return (
                <TouchableOpacity key={option} style={[styles.narrativeEditCard, selected && styles.narrativeEditCardActive]} onPress={() => setEditGenderPreference(option)} activeOpacity={0.86}>
                  <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={selected ? palette.white : palette.red} />
                  <View style={styles.narrativeEditTextBlock}>
                    <Text style={[styles.narrativeEditTitle, selected && styles.narrativeEditTitleActive]}>{narrative.title}</Text>
                    <Text numberOfLines={3} style={[styles.narrativeEditText, selected && styles.narrativeEditTextActive]}>{narrative.text}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.primaryButton} onPress={saveProfile}>
              <Text style={styles.primaryButtonText}>Guardar perfil</Text>
            </TouchableOpacity>
            {authMessage ? <Text style={styles.cardText}>{authMessage}</Text> : null}
          </View> : null}
          {profilePanel === 'configuracion' ? (
            <View style={styles.profileCommunityPanel}>
              <Text style={styles.cardEyebrow}>Configuración de usuario</Text>
              <View style={styles.settingRow}>
                <View style={styles.settingRowText}>
                  <Text style={styles.cardTitle}>Mostrar puntero tactil</Text>
                  <Text style={styles.cardText}>Ayuda visual para testing: muestra un circulo que sigue tu dedo mientras tocas la pantalla.</Text>
                </View>
                <Switch
                  value={touchPointerEnabled}
                  onValueChange={onTouchPointerEnabledChange}
                  trackColor={{ false: 'rgba(94, 131, 150, 0.22)', true: 'rgba(45, 141, 200, 0.36)' }}
                  thumbColor={touchPointerEnabled ? palette.red : palette.white}
                />
              </View>
              <Text style={styles.cardText}>Esta opcion queda guardada en este dispositivo y por defecto permanece apagada.</Text>
              <View style={styles.settingRow}>
                <View style={styles.settingRowText}>
                  <Text style={styles.cardTitle}>Tema</Text>
                  <Text style={styles.cardText}>Preferencia visual solo para este dispositivo: Predeterminado u Oscuro.</Text>
                </View>
              </View>
              <View style={styles.filterRow}>
                {([
                  ['default', 'Predeterminado'],
                  ['dark', 'Oscuro']
                ] as [ThemeName, string][]).map(([name, label]) => (
                  <TouchableOpacity key={name} style={[styles.filterChip, themeName === name && styles.filterChipActive]} onPress={() => onThemeChange(name)}>
                    <Text style={[styles.filterChipText, themeName === name && styles.filterChipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.cardText}>Tema activo: {appTheme.name === 'dark' ? 'Oscuro' : 'Predeterminado'}.</Text>
              <View style={styles.settingRow}>
                <View style={styles.settingRowText}>
                  <Text style={styles.cardTitle}>Permitir notificaciones</Text>
                  <Text style={styles.cardText}>Estado actual: {notificationPermissionStatus}. Activa este dispositivo para recibir avisos importantes.</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.secondaryButton} onPress={enablePushNotificationsFromSettings}>
                <Ionicons name="notifications-outline" size={17} color={palette.red} />
                <Text style={styles.secondaryButtonText}>Solicitar permiso</Text>
              </TouchableOpacity>
              {session.role === 'administrador' ? (
                <View style={styles.inlineEditorPanel}>
                  <View style={styles.settingRow}>
                    <View style={styles.settingRowText}>
                      <Text style={styles.cardEyebrow}>Diagnóstico de notificaciones</Text>
                      <Text style={styles.cardText}>Herramientas técnicas visibles solo para Administrador.</Text>
                    </View>
                    <Switch value={showPushDiagnostics} onValueChange={setShowPushDiagnostics} />
                  </View>
                  {showPushDiagnostics ? (
                    <>
                      {pushTokenPreview ? <Text style={styles.feedMeta}>Token registrado: {pushTokenPreview}</Text> : null}
                      <Text style={styles.feedMeta}>Runtime: {appRuntimeOwner} - ProjectId: {easProjectId}</Text>
                      {pushDebugInfo ? <Text selectable style={styles.feedMeta}>{pushDebugInfo}</Text> : null}
                      {pushChannelDebug ? (
                        <>
                          <Text style={styles.cardEyebrow}>Canales Android</Text>
                          <Text selectable style={styles.feedMeta}>{pushChannelDebug}</Text>
                        </>
                      ) : null}
                      <TouchableOpacity style={styles.secondaryButton} onPress={sendLocalNotificationDebug}>
                        <Ionicons name="phone-portrait-outline" size={17} color={palette.red} />
                        <Text style={styles.secondaryButtonText}>Probar canal local Android</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.primaryButton} onPress={sendRemotePushDebug}>
                        <Ionicons name="notifications-outline" size={17} color={palette.white} />
                        <Text style={styles.primaryButtonText}>Enviar notificacion de prueba a este dispositivo</Text>
                      </TouchableOpacity>
                      {pushTestResult ? <Text selectable style={styles.feedMeta}>{pushTestResult}</Text> : null}
                    </>
                  ) : null}
                </View>
              ) : null}
              <TextInput style={styles.input} placeholder="Nuevo mail" value={newEmail} onChangeText={setNewEmail} autoCapitalize="none"  placeholderTextColor={inputPlaceholderColor} />
              <TextInput style={styles.input} placeholder="Nueva contraseña" value={newPassword} onChangeText={setNewPassword} secureTextEntry  placeholderTextColor={inputPlaceholderColor} />
              <TouchableOpacity style={styles.primaryButton} onPress={saveAccountSettings}>
                <Text style={styles.primaryButtonText}>Guardar ajustes</Text>
              </TouchableOpacity>
              {authMessage ? <Text style={styles.cardText}>{authMessage}</Text> : null}
            </View>
          ) : null}
          {profilePanel === 'comunidad' ? (
            <View style={styles.profileCommunityPanel}>
              <Text style={styles.cardEyebrow}>{session.communityOfOrigin}</Text>
              <SectionTitle title="Mi comunidad" />
              <Text style={styles.cardText}>
                Relación activa: {displayRoleLabel(session.role, session.province, provinceRoleLabels, adminConfig.settings.roleAliases, session.displayRoleLabel, session.genderPreference)} vinculado a {session.communityOfOrigin} en {session.province}.
                {['animador_comunidad', 'coordinador_comunidad'].includes(session.role) ? ' Este rango puede editar su comunidad asignada.' : ''}
                {['vocal', 'asesor', 'coordinador_diocesano'].includes(session.role) ? ' Este rango supervisa animadores y coordinadores de comunidad de su provincia.' : ''}
                {['vocal_nacional', 'coordinador_nacional'].includes(session.role) ? ' Este rango supervisa estructura nacional y provincias.' : ''}
              </Text>
              {isCommunityLeader ? (
                <View style={styles.inlineEditorPanel}>
                  <Text style={styles.cardEyebrow}>Nuevo aviso comunitario</Text>
                  <TextInput style={styles.input} placeholder="Titulo opcional del aviso" value={communityPostTitle} onChangeText={setCommunityPostTitle}  placeholderTextColor={inputPlaceholderColor} />
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Mensaje para la comunidad" value={communityPostBody} onChangeText={setCommunityPostBody} multiline  placeholderTextColor={inputPlaceholderColor} />
                  <View style={styles.settingRow}>
                    <View style={styles.settingRowText}>
                      <Text style={styles.cardTitle}>Notificar a miembros</Text>
                      <Text style={styles.cardText}>Preparar aviso push para los miembros alcanzados por este mensaje.</Text>
                    </View>
                    <Switch value={communityPostNotify} onValueChange={setCommunityPostNotify} />
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={publishCommunityPost}>
                    <Text style={styles.primaryButtonText}>Enviar mensaje a comunidad</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              <SectionTitle title="Avisos Comunitarios" />
              <TouchableOpacity style={styles.actionPill} onPress={refreshCommunityForum} activeOpacity={0.85}>
                <Ionicons name="refresh-outline" size={16} color={palette.red} />
                <Text style={styles.actionPillText}>Actualizar avisos</Text>
              </TouchableOpacity>
              {myCommunityPublications.length === 0 ? <Text style={styles.cardText}>No hay avisos para tu comunidad actualmente</Text> : null}
              {myCommunityPublications.map((item, index) => (
                <View key={`${item.id || item.title}-${index}`} style={styles.innerNewsCard}>
                  <Text style={styles.cardEyebrow}>{item.visibility} - {item.status ?? 'activo'}</Text>
                  {item.title ? <Text style={styles.cardTitle}>{item.title}</Text> : null}
                  <Text style={styles.cardText}>{item.body}</Text>
                  <Text style={styles.feedMeta}>
                    Por {item.authorName ?? 'Palestrista'} - {roleLabelForProvince((item.authorRole || 'palestrista') as Role, session.province, provinceRoleLabels)}
                  </Text>
                  <Text style={styles.feedMeta}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Fecha no disponible'}
                  </Text>
                  {(item.id && (item.createdBy === session.id || roleRank(session.role) >= roleRank('vocal'))) ? (
                    <View style={styles.inlineActions}>
                      <TouchableOpacity style={styles.actionPill} onPress={() => startEditCommunityPublication(item)}>
                        <Ionicons name="create-outline" size={16} color={palette.red} />
                        <Text style={styles.actionPillText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionPill} onPress={() => removeCommunityPublication(item.id as string)}>
                        <Ionicons name="trash-outline" size={16} color={palette.red} />
                        <Text style={styles.actionPillText}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                  {editingCommunityPublicationId === item.id ? (
                    <View style={styles.inlineEditorPanel}>
                      <TextInput style={styles.input} placeholder="Titulo del aviso" value={editingCommunityPublicationTitle} onChangeText={setEditingCommunityPublicationTitle}  placeholderTextColor={inputPlaceholderColor} />
                      <TextInput style={[styles.input, styles.textArea]} placeholder="Contenido del aviso" value={editingCommunityPublicationBody} onChangeText={setEditingCommunityPublicationBody} multiline  placeholderTextColor={inputPlaceholderColor} />
                      <View style={styles.inlineActions}>
                        <TouchableOpacity style={styles.primaryButton} onPress={() => saveCommunityPublicationEdit('activo')}>
                          <Text style={styles.primaryButtonText}>Guardar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryButton} onPress={() => saveCommunityPublicationEdit('cerrado')}>
                          <Text style={styles.secondaryButtonText}>Cerrar aviso</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}
                </View>
              ))}
              <SectionTitle title="Miembros" />
              {communityMembers.length === 0 ? (
                <TouchableOpacity style={styles.secondaryButton} onPress={async () => setCommunityMembers(await fetchMyCommunityMembers())}>
                  <Text style={styles.secondaryButtonText}>Cargar miembros</Text>
                </TouchableOpacity>
              ) : communityMembers.map((member) => (
                <View key={member.id} style={styles.innerNewsCard}>
                  <Text style={styles.cardTitle}>{member.full_name ?? member.email}</Text>
                  <Text style={styles.cardText}>{roleLabelForProvince((member.role || 'palestrista') as Role, member.province, provinceRoleLabels)}</Text>
                  <TouchableOpacity
                    style={styles.actionPill}
                    onPress={() => openPublicProfile({
                      id: member.id,
                      fullName: member.full_name ?? member.email ?? 'Palestrista',
                      role: (member.role || 'palestrista') as Role,
                      province: member.province,
                      communityName: member.community_name,
                      contact: member.email,
                      avatarUrl: member.avatar_url
                    })}
                  >
                    <Ionicons name="person-circle-outline" size={16} color={palette.red} />
                    <Text style={styles.actionPillText}>Ver perfil</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <SectionTitle title="Encargados" />
              {communityMembers.filter((member) => ['animador_comunidad', 'coordinador_comunidad'].includes(member.role)).map((member) => (
                <View key={`leader-${member.id}`} style={styles.innerNewsCard}>
                  <Text style={styles.cardText}>{member.full_name ?? 'Palestrista'} - {roleLabelForProvince(member.role as Role, member.province, provinceRoleLabels)}</Text>
                  <TouchableOpacity
                    style={styles.actionPill}
                    onPress={() => openPublicProfile({
                      id: member.id,
                      fullName: member.full_name ?? 'Palestrista',
                      role: member.role as Role,
                      province: member.province,
                      communityName: member.community_name,
                      contact: '',
                      avatarUrl: member.avatar_url
                    })}
                  >
                    <Ionicons name="person-circle-outline" size={16} color={palette.red} />
                    <Text style={styles.actionPillText}>Ver perfil</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}
          {profilePanel === 'buzon' ? (
            <View style={styles.profileCommunityPanel}>
              <SectionTitle title="Buzon de mensajes" />
              <Text style={styles.cardText}>Consultas enviadas y mensajes recibidos por tu comunidad o jurisdiccion.</Text>
              <TouchableOpacity style={styles.secondaryButton} onPress={refreshMailbox}>
                <Ionicons name="refresh-outline" size={17} color={palette.red} />
                <Text style={styles.secondaryButtonText}>Actualizar buzon</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={() => setShowMailboxComposer(!showMailboxComposer)}>
                <Ionicons name="create-outline" size={17} color={palette.white} />
                <Text style={styles.primaryButtonText}>Nuevo Mensaje</Text>
              </TouchableOpacity>
              {showMailboxComposer ? (
                <View style={styles.inlineEditorPanel}>
                  <Text style={styles.cardEyebrow}>Nuevo mensaje</Text>
                  <Text style={styles.inputLabel}>Destino</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                    {session.role === 'administrador' ? ([
                      ['user', 'Usuario'],
                      ['role', 'Rango'],
                      ['province', 'Provincia'],
                      ['role_province', 'Rango + provincia'],
                      ['all', 'Todos']
                    ] as [MailboxTargetMode, string][]).map(([mode, label]) => (
                      <TouchableOpacity key={mode} style={[styles.filterChip, mailboxTargetMode === mode && styles.filterChipActive]} onPress={() => setMailboxTargetMode(mode)}>
                        <Text style={[styles.filterChipText, mailboxTargetMode === mode && styles.filterChipTextActive]}>{label}</Text>
                      </TouchableOpacity>
                    )) : ['vocal_nacional', 'coordinador_nacional'].includes(session.role) ? ([
                      ['diocesan_leadership', 'Dirigencia diocesana']
                    ] as [MailboxTargetMode, string][]).map(([mode, label]) => (
                      <TouchableOpacity key={mode} style={[styles.filterChip, mailboxTargetMode === mode && styles.filterChipActive]} onPress={() => setMailboxTargetMode(mode)}>
                        <Text style={[styles.filterChipText, mailboxTargetMode === mode && styles.filterChipTextActive]}>{label}</Text>
                      </TouchableOpacity>
                    )) : ['vocal', 'coordinador_diocesano'].includes(session.role) ? ([
                      ['community', 'Comunidad'],
                      ['province_communities', 'Todas de mi provincia']
                    ] as [MailboxTargetMode, string][]).map(([mode, label]) => (
                      <TouchableOpacity key={mode} style={[styles.filterChip, mailboxTargetMode === mode && styles.filterChipActive]} onPress={() => setMailboxTargetMode(mode)}>
                        <Text style={[styles.filterChipText, mailboxTargetMode === mode && styles.filterChipTextActive]}>{label}</Text>
                      </TouchableOpacity>
                    )) : (
                      <TouchableOpacity style={[styles.filterChip, styles.filterChipActive]} onPress={() => setMailboxTargetMode('my_community')}>
                        <Text style={[styles.filterChipText, styles.filterChipTextActive]}>Responsables de mi comunidad</Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                  {['community', 'my_community'].includes(mailboxTargetMode) ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                      {mailboxCommunityOptions.map((community) => (
                        <TouchableOpacity key={community.id} style={[styles.filterChip, (mailboxTargetCommunityId || mailboxCommunityOptions[0]?.id) === community.id && styles.filterChipActive]} onPress={() => setMailboxTargetCommunityId(community.id ?? '')}>
                          <Text style={[styles.filterChipText, (mailboxTargetCommunityId || mailboxCommunityOptions[0]?.id) === community.id && styles.filterChipTextActive]}>{community.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : null}
                  {['province', 'role_province', 'diocesan_leadership'].includes(mailboxTargetMode) && (session.role === 'administrador' || ['vocal_nacional', 'coordinador_nacional'].includes(session.role)) ? (
                    <>
                      <Text style={styles.inputLabel}>Provincia</Text>
                      <TouchableOpacity style={styles.dropdownButton} onPress={() => setMailboxProvinceDropdownOpen(!mailboxProvinceDropdownOpen)}>
                        <Text style={styles.dropdownButtonText}>{mailboxTargetProvince || 'Todas / seleccionar provincia'}</Text>
                        <Ionicons name={mailboxProvinceDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                      </TouchableOpacity>
                      {mailboxProvinceDropdownOpen ? (
                        <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                          {mailboxTargetMode === 'diocesan_leadership' ? (
                            <TouchableOpacity style={styles.dropdownItem} onPress={() => { setMailboxTargetProvince(''); setMailboxProvinceDropdownOpen(false); }}>
                              <Text style={styles.dropdownItemText}>Todas las provincias</Text>
                            </TouchableOpacity>
                          ) : null}
                          {mailboxProvinceOptions.map((province) => (
                            <TouchableOpacity key={province} style={styles.dropdownItem} onPress={() => { setMailboxTargetProvince(province); setMailboxProvinceDropdownOpen(false); }}>
                              <Text style={styles.dropdownItemText}>{province}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      ) : null}
                    </>
                  ) : null}
                  {['role', 'role_province'].includes(mailboxTargetMode) ? (
                    <>
                      <Text style={styles.inputLabel}>Rango</Text>
                      <TouchableOpacity style={styles.dropdownButton} onPress={() => setMailboxRoleDropdownOpen(!mailboxRoleDropdownOpen)}>
                        <Text style={styles.dropdownButtonText}>{roleLabel(mailboxTargetRole)}</Text>
                        <Ionicons name={mailboxRoleDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                      </TouchableOpacity>
                      {mailboxRoleDropdownOpen ? (
                        <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                          {visibleHierarchyFor(session).filter((item) => !['invitado', 'administrador'].includes(item.role)).map((item) => (
                            <TouchableOpacity key={item.role} style={styles.dropdownItem} onPress={() => { setMailboxTargetRole(item.role); setMailboxRoleDropdownOpen(false); }}>
                              <Text style={styles.dropdownItemText}>{item.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      ) : null}
                    </>
                  ) : null}
                  {mailboxTargetMode === 'user' ? (
                    <View style={styles.profileCommunityPanel}>
                      <Text style={styles.inputLabel}>Buscar usuario</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Buscar por nombre, provincia, comunidad o rango"
                        value={mailboxRecipientSearch}
                        onChangeText={setMailboxRecipientSearch}
                       placeholderTextColor={inputPlaceholderColor} />
                      <TouchableOpacity style={styles.dropdownButton} onPress={() => setMailboxUserDropdownOpen(!mailboxUserDropdownOpen)}>
                        <Text style={styles.dropdownButtonText}>{mailboxSelectedUserIds.length} usuario/s seleccionado/s</Text>
                        <Ionicons name={mailboxUserDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                      </TouchableOpacity>
                      {mailboxUserDropdownOpen ? (
                        <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                          {filteredMailboxUserOptions.length === 0 ? <Text style={styles.dropdownItemText}>Sin resultados</Text> : null}
                          {filteredMailboxUserOptions.slice(0, 60).map((user) => {
                            const selectedUser = mailboxSelectedUserIds.includes(user.id);
                            return (
                              <TouchableOpacity key={user.id} style={styles.dropdownItem} onPress={() => toggleMailboxUser(user.id)}>
                                <Ionicons name={selectedUser ? 'checkbox-outline' : 'square-outline'} size={18} color={selectedUser ? palette.red : palette.inkMuted} />
                                <View style={styles.adminUserHeaderText}>
                                  <Text style={styles.dropdownItemText}>{user.full_name ?? 'Usuario'}</Text>
                                  <Text style={styles.feedMeta}>{roleLabelForProvince((user.role || 'palestrista') as Role, user.province, provinceRoleLabels)} - {user.province ?? 'Sin provincia'} - {user.community_name ?? 'Sin comunidad'}</Text>
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      ) : null}
                      {selectedMailboxUsers.length > 0 ? (
                        <View style={styles.chipRow}>
                          {selectedMailboxUsers.slice(0, 8).map((user) => (
                            <TouchableOpacity key={user.id} style={[styles.filterChip, styles.filterChipActive]} onPress={() => toggleMailboxUser(user.id)}>
                              <Text style={[styles.filterChipText, styles.filterChipTextActive]}>{user.full_name ?? 'Usuario'}</Text>
                            </TouchableOpacity>
                          ))}
                          {selectedMailboxUsers.length > 8 ? <Text style={styles.cardText}>+{selectedMailboxUsers.length - 8} mas</Text> : null}
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                  <View style={styles.notice}>
                    <Ionicons name="people-outline" size={18} color={palette.red} />
                    <Text style={styles.noticeText}>Destinatarios estimados: {estimatedMailboxRecipients}</Text>
                  </View>
                  <Text style={styles.inputLabel}>Mensaje</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Escribe el mensaje para el buzon"
                    value={mailboxDraft}
                    onChangeText={(value) => setMailboxDraft(value.slice(0, 500))}
                    multiline
                   placeholderTextColor={inputPlaceholderColor} />
                  <TouchableOpacity style={styles.primaryButton} onPress={submitNewMailboxMessage}>
                    <Text style={styles.primaryButtonText}>Enviar mensaje</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                {(['todos', 'enviados', 'recibidos', 'nuevo', 'respondido', 'cerrado'] as const).map((filter) => (
                  <TouchableOpacity key={filter} style={[styles.filterChip, mailboxFilter === filter && styles.filterChipActive]} onPress={() => setMailboxFilter(filter)}>
                    <Text style={[styles.filterChipText, mailboxFilter === filter && styles.filterChipTextActive]}>{filter}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {visibleMailboxMessages.length === 0 ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>No tienes mensajes actualmente</Text>
                </View>
              ) : null}
              {visibleMailboxMessages.map((message) => (
                <View key={message.id} style={styles.innerNewsCard}>
                  <Text style={styles.cardEyebrow}>{message.status} - {message.community_name || 'Mensaje directo'} {message.province ? `(${message.province})` : ''}</Text>
                  <Text style={styles.cardTitle}>{message.sender_name ?? 'Consulta externa'}</Text>
                  {message.sender_contact ? <Text style={styles.cardText}>Contacto: {message.sender_contact}</Text> : null}
                  <Text style={styles.feedMeta}>{new Date(message.created_at).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                  <Text style={styles.cardText}>{message.message}</Text>
                  {message.response ? (
                    <View style={styles.notice}>
                      <Ionicons name="return-up-forward-outline" size={18} color={palette.red} />
                      <Text style={styles.noticeText}>{message.response}</Text>
                    </View>
                  ) : null}
                  {message.can_respond && message.status !== 'cerrado' && message.status !== 'archivado' ? (
                    <View style={styles.inlineEditorPanel}>
                      <Text style={styles.inputLabel}>Respuesta</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Escribe una respuesta clara"
                        value={mailboxResponses[message.id] ?? ''}
                        onChangeText={(value) => setMailboxResponses((current) => ({ ...current, [message.id]: value.slice(0, 1000) }))}
                        multiline
                       placeholderTextColor={inputPlaceholderColor} />
                      <TouchableOpacity style={styles.primaryButton} onPress={() => submitMailboxResponse(message.id)}>
                        <Text style={styles.primaryButtonText}>Responder</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                  <View style={styles.inlineActions}>
                    <TouchableOpacity style={styles.actionPill} onPress={() => updateMailboxStatus(message.id, 'leido')}>
                      <Ionicons name="mail-open-outline" size={16} color={palette.red} />
                      <Text style={styles.actionPillText}>Leido</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionPill} onPress={() => updateMailboxStatus(message.id, 'nuevo')}>
                      <Ionicons name="mail-unread-outline" size={16} color={palette.red} />
                      <Text style={styles.actionPillText}>No leido</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionPill} onPress={() => updateMailboxStatus(message.id, 'cerrado')}>
                      <Ionicons name="checkmark-done-outline" size={16} color={palette.red} />
                      <Text style={styles.actionPillText}>Cerrar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
          {profilePanel === 'vista' ? <View style={styles.profileCommunityPanel}>
            <Text style={styles.cardEyebrow}>Credencial digital</Text>
            <View style={styles.digitalCredential}>
              <View style={styles.credentialAvatar}>
                {session.avatarUrl ? <Image source={{ uri: session.avatarUrl }} style={styles.credentialAvatarImage} /> : <Ionicons name="person-outline" size={18} color={palette.red} />}
              </View>
              <View style={styles.adminUserHeaderText}>
                <Text style={styles.credentialName}>{session.fullName}</Text>
                <Text style={styles.cardText}>{displayRoleLabel(session.role, session.province, provinceRoleLabels, adminConfig.settings.roleAliases, session.displayRoleLabel, session.genderPreference)}</Text>
                <Text style={styles.cardText}>{session.communityOfOrigin}, {session.province}</Text>
              </View>
            </View>
            <Text style={styles.cardText}>Uso futuro sugerido: validar asistencia a PM, retiros y actividades mediante QR o lectura interna de credencial.</Text>
          </View> : null}
          {profilePanel === 'vista' && session.role !== 'administrador' ? (
            <View style={styles.profileCommunityPanel}>
              <TouchableOpacity style={styles.primaryButton} onPress={() => setSelectedRequest(selectedRequest === 'menu' ? null : 'menu')}>
                <Ionicons name="mail-unread-outline" size={17} color={palette.white} />
                <Text style={styles.primaryButtonText}>Solicitudes</Text>
              </TouchableOpacity>
              {selectedRequest === 'menu' || (selectedRequest && ['Solicitud de perseverancia', 'Solicitud Especial'].includes(selectedRequest)) ? (
                <View style={styles.inlineEditorPanel}>
                  {roleRank(session.role) < roleRank('sedimentador') ? (
                    <TouchableOpacity style={styles.innerNewsCard} onPress={() => setSelectedRequest(selectedRequest === 'Solicitud de perseverancia' ? 'menu' : 'Solicitud de perseverancia')}>
                      <Text style={styles.cardTitle}>Solicitud de Perseverancia</Text>
                      <Text style={styles.cardText}>Para pedir revisión del camino de perseverancia.</Text>
                      <Text style={styles.expandHint}>{selectedRequest === 'Solicitud de perseverancia' ? 'Cerrar solicitud' : 'Abrir solicitud'}</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity style={styles.innerNewsCard} onPress={() => setSelectedRequest(selectedRequest === 'Solicitud Especial' ? 'menu' : 'Solicitud Especial')}>
                    <Text style={styles.cardTitle}>Solicitud Especial</Text>
                    <Text style={styles.cardText}>Contacto con Vocal Diocesano o Coordinador Diocesano de tu provincia.</Text>
                    <Text style={styles.expandHint}>{selectedRequest === 'Solicitud Especial' ? 'Cerrar solicitud' : 'Abrir solicitud'}</Text>
                  </TouchableOpacity>
                  {selectedRequest && selectedRequest !== 'menu' ? (
                    <View style={styles.profileCommunityPanel}>
                      <Text style={styles.cardEyebrow}>Solicitud</Text>
                      <Text style={styles.cardTitle}>{selectedRequest === 'Solicitud de perseverancia' ? 'Solicitud de Perseverancia' : selectedRequest}</Text>
                      <Text style={styles.cardText}>Escribí el motivo de la solicitud. Máximo 500 caracteres.</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder={selectedRequest === 'Solicitud Especial' ? 'Escribí tu consulta para la dirigencia diocesana' : 'Detalle de la solicitud'}
                        value={userRequestText}
                        onChangeText={(value) => setUserRequestText(value.slice(0, 500))}
                        multiline
                       placeholderTextColor={inputPlaceholderColor} />
                      <Text style={styles.cardText}>{userRequestText.length}/500</Text>
                      <TouchableOpacity style={styles.primaryButton} onPress={() => submitUserRequest(selectedRequest)}>
                        <Text style={styles.primaryButtonText}>Enviar solicitud</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : null}
          {profilePanel === 'vista' && session.role !== 'administrador' ? (
            <View style={styles.profileCommunityPanel}>
              <Text style={styles.cardEyebrow}>Solicitudes enviadas</Text>
              {sentRequests.length === 0 ? <Text style={styles.cardText}>Todavia no enviaste solicitudes.</Text> : null}
              {sentRequests.map((item) => (
                <View key={item.id}>
                  <TouchableOpacity style={styles.innerNewsCard} onPress={() => setSelectedSentRequestId(selectedSentRequestId === item.id ? '' : item.id)}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardText}>Estado: {item.status}</Text>
                    <Text style={styles.expandHint}>{selectedSentRequestId === item.id ? 'Ocultar detalle' : 'Ver detalle'}</Text>
                  </TouchableOpacity>
                  {selectedSentRequestId === item.id ? (
                    <View style={styles.profileCommunityPanel}>
                      <Text style={styles.cardText}>Enviada: {new Date(item.createdAt).toLocaleString('es-AR')}</Text>
                      <Text style={styles.cardText}>Detalle: {item.definition}</Text>
                      <Text style={styles.cardText}>Respondio: {item.resolvedBy ?? 'Pendiente'}</Text>
                      <Text style={styles.cardText}>Fecha de resolucion: {item.resolvedAt ? new Date(item.resolvedAt).toLocaleString('es-AR') : 'Pendiente'}</Text>
                      <Text style={styles.cardText}>Mensaje: {item.message ?? 'Sin mensaje todavía'}</Text>
                      {['Propuesta Coordinador Diocesano', 'Propuesta Coordinador Nacional', 'Solicitud de Coordinación Diocesana', 'Solicitud de Coordinación Nacional', 'Solicitud de Coordinacion Diocesana', 'Solicitud de Coordinacion Nacional'].includes(item.title) && item.status === 'pendiente' && item.targetUserId === session.id ? (
                        <TouchableOpacity style={styles.primaryButton} onPress={() => acceptDiocesanRequest(item.id)}>
                          <Text style={styles.primaryButtonText}>Aceptar rango {roleLabel((item.targetRole ?? 'coordinador_diocesano') as Role)}</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
          {(hasPermission(session, 'gestionar_sistema') || canAdministrateCommunities || hasPermission(session, 'gestionar_contenido') || hasPermission(session, 'gestionar_permisos') || canReviewLeadershipRequests || isCommunityLeader) ? (
            showDedicatedNavigationManager ? (
                <View style={styles.navigationDedicatedShell}>
                  <View style={styles.navigationDedicatedTopbar}>
                    <View style={styles.navigationDedicatedBrand}>
                      <View style={styles.navigationDedicatedLogo}>
                        <Ionicons name="navigate-outline" size={22} color={palette.white} />
                      </View>
                      <View style={styles.adminUserHeaderText}>
                        <Text style={styles.navigationDedicatedTitle}>Consola de navegación</Text>
                        <Text style={styles.navigationDedicatedSubtitle}>Gestión visual de secciones, roles y barra inferior.</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.navigationBackButton} onPress={() => setAdminModule('resumen')} activeOpacity={0.85}>
                      <Ionicons name="arrow-back-outline" size={17} color={palette.red} />
                      <Text style={styles.navigationBackButtonText}>Regresar a Palestra APP</Text>
                    </TouchableOpacity>
                  </View>

                  {authMessage ? <Text style={styles.navigationDedicatedMessage}>{authMessage}</Text> : null}

                  <View style={styles.navigationBuilderScreen}>
                    <View style={styles.navigationBuilderHero}>
                      <View style={styles.navigationHeroText}>
                        <Text style={styles.navigationHeroEyebrow}>Constructor visual</Text>
                        <Text style={styles.navigationHeroTitle}>Navegación de la app</Text>
                        <Text style={styles.navigationHeroBody}>Edita la barra inferior como un panel profesional: orden, iconos, nombres, visibilidad y roles desde una sola pantalla.</Text>
                      </View>
                      <View style={styles.navigationHeroBadge}>
                        <Ionicons name="phone-portrait-outline" size={22} color={palette.white} />
                      </View>
                    </View>

                    <View style={styles.navigationStatsRow}>
                      <View style={styles.navigationStatPill}>
                        <Text style={styles.navigationStatValue}>{editableTabs.length}</Text>
                        <Text style={styles.navigationStatLabel}>Secciones</Text>
                      </View>
                      <View style={styles.navigationStatPill}>
                        <Text style={styles.navigationStatValue}>{navigationVisibleCount}</Text>
                        <Text style={styles.navigationStatLabel}>Visibles</Text>
                      </View>
                      <View style={styles.navigationStatPill}>
                        <Text style={styles.navigationStatValue}>{navigationLockedCount}</Text>
                        <Text style={styles.navigationStatLabel}>Base</Text>
                      </View>
                    </View>

                    <View style={styles.navigationPhonePreview}>
                      <View style={styles.navigationPhoneTop}>
                        <View>
                          <Text style={styles.navigationPhoneTitle}>Palestra</Text>
                          <Text style={styles.navigationPhoneSub}>Vista previa en vivo</Text>
                        </View>
                        <View style={styles.navigationPhoneStatus} />
                      </View>
                      <View style={styles.navigationPreviewContent}>
                        <Text style={styles.navigationPreviewLabel}>Barra inferior</Text>
                        <Text style={styles.navigationPreviewHint}>Los cambios guardados impactan globalmente al refrescar la app.</Text>
                      </View>
                      <View style={styles.navPreviewBar}>
                        {editableTabs.slice(0, 7).map((tab) => {
                          const draft = editingTabs[tab.key] ?? { label: tab.label, iconName: tab.icon, isVisible: tab.visible, visibleRoles: tab.visibleRoles };
                          const iconName = isIoniconName(draft.iconName) ? draft.iconName : 'help-circle-outline';
                          const selected = selectedNavigationTab?.key === tab.key;
                          return (
                            <TouchableOpacity key={`preview-dedicated-${tab.key}`} style={[styles.navPreviewItem, !draft.isVisible && styles.navPreviewItemHidden, selected && styles.navPreviewItemSelected]} onPress={() => setSelectedNavigationTabKey(tab.key)} activeOpacity={0.85}>
                              <Ionicons name={iconName} size={18} color={selected ? palette.white : draft.isVisible ? palette.red : palette.inkMuted} />
                              <Text numberOfLines={1} style={[styles.navPreviewText, selected && styles.navPreviewTextSelected]}>{draft.label || tab.label}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navigationRail}>
                      {editableTabs.map((tab, index) => {
                        const draft = editingTabs[tab.key] ?? { label: tab.label, iconName: tab.icon, isVisible: tab.visible, visibleRoles: tab.visibleRoles };
                        const iconName = isIoniconName(draft.iconName) ? draft.iconName : 'help-circle-outline';
                        const selected = selectedNavigationTab?.key === tab.key;
                        return (
                          <TouchableOpacity key={`rail-dedicated-${tab.key}`} style={[styles.navigationRailItem, selected && styles.navigationRailItemActive]} onPress={() => { setSelectedNavigationTabKey(tab.key); setNavigationRolesDropdownOpen(false); }} activeOpacity={0.85}>
                            <Ionicons name={iconName} size={20} color={selected ? palette.white : palette.red} />
                            <Text numberOfLines={1} style={[styles.navigationRailText, selected && styles.navigationRailTextActive]}>{draft.label || tab.label}</Text>
                            <Text style={[styles.navigationRailMeta, selected && styles.navigationRailTextActive]}>#{index + 1}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {selectedNavigationTab && selectedNavigationDraft ? (
                      <View style={styles.navigationFocusPanel}>
                        <View style={styles.navigationFocusHeader}>
                          <View style={styles.navigationFocusIcon}>
                            <Ionicons name={isIoniconName(selectedNavigationDraft.iconName) ? selectedNavigationDraft.iconName : 'help-circle-outline'} size={28} color={palette.red} />
                          </View>
                          <View style={styles.adminUserHeaderText}>
                            <Text style={styles.navigationFocusTitle}>{selectedNavigationDraft.label || selectedNavigationTab.label}</Text>
                            <Text style={styles.feedMeta}>Clave interna: {selectedNavigationTab.key}</Text>
                            <Text style={styles.feedMeta}>Orden actual: {selectedNavigationTab.sortOrder}</Text>
                          </View>
                        </View>

                        <View style={styles.navigationFieldGrid}>
                          <View style={styles.navigationField}>
                            <Text style={styles.cardEyebrow}>Nombre visible</Text>
                            <TextInput
                              style={styles.input}
                              placeholder="Ej: Noticias"
                              value={selectedNavigationDraft.label}
                              onChangeText={(value) => setEditingTabs((current) => ({ ...current, [selectedNavigationTab.key]: { ...selectedNavigationDraft, label: value } }))}
                              placeholderTextColor={inputPlaceholderColor}
                            />
                          </View>
                          <View style={styles.navigationField}>
                            <Text style={styles.cardEyebrow}>Icono Ionicons</Text>
                            <TextInput
                              style={styles.input}
                              placeholder="Ej: newspaper-outline"
                              value={selectedNavigationDraft.iconName}
                              onChangeText={(value) => setEditingTabs((current) => ({ ...current, [selectedNavigationTab.key]: { ...selectedNavigationDraft, iconName: value } }))}
                              autoCapitalize="none"
                              placeholderTextColor={inputPlaceholderColor}
                            />
                          </View>
                        </View>

                        <Text style={styles.cardEyebrow}>Iconos rápidos</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navigationIconPicker}>
                          {navigationIconSuggestions.map((icon) => (
                            <TouchableOpacity key={`dedicated-${icon}`} style={[styles.navigationIconChoice, selectedNavigationDraft.iconName === icon && styles.navigationIconChoiceActive]} onPress={() => setEditingTabs((current) => ({ ...current, [selectedNavigationTab.key]: { ...selectedNavigationDraft, iconName: icon } }))}>
                              <Ionicons name={icon} size={21} color={selectedNavigationDraft.iconName === icon ? palette.white : palette.red} />
                            </TouchableOpacity>
                          ))}
                        </ScrollView>

                        <View style={styles.navigationActionGrid}>
                          <TouchableOpacity style={styles.navigationMiniAction} onPress={() => adminMoveTab(selectedNavigationTab.key, -1)} disabled={editableTabs[0]?.key === selectedNavigationTab.key}>
                            <Ionicons name="arrow-back-outline" size={17} color={palette.red} />
                            <Text style={styles.navigationMiniActionText}>Mover izq.</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.navigationMiniAction} onPress={() => adminMoveTab(selectedNavigationTab.key, 1)} disabled={editableTabs[editableTabs.length - 1]?.key === selectedNavigationTab.key}>
                            <Ionicons name="arrow-forward-outline" size={17} color={palette.red} />
                            <Text style={styles.navigationMiniActionText}>Mover der.</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.navigationMiniAction, selectedNavigationDraft.isVisible && styles.navigationMiniActionActive]}
                            onPress={() => setEditingTabs((current) => ({ ...current, [selectedNavigationTab.key]: { ...selectedNavigationDraft, isVisible: !selectedNavigationDraft.isVisible } }))}
                          >
                            <Ionicons name={selectedNavigationDraft.isVisible ? 'eye-outline' : 'eye-off-outline'} size={17} color={selectedNavigationDraft.isVisible ? palette.white : palette.red} />
                            <Text style={[styles.navigationMiniActionText, selectedNavigationDraft.isVisible && styles.navigationMiniActionTextActive]}>{selectedNavigationDraft.isVisible ? 'Visible' : 'Oculta'}</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.navigationRolesPanel}>
                          <TouchableOpacity style={styles.navigationRolesButton} onPress={() => setNavigationRolesDropdownOpen(!navigationRolesDropdownOpen)} activeOpacity={0.85}>
                            <View style={styles.adminUserHeaderText}>
                              <Text style={styles.cardEyebrow}>Roles que ven esta sección</Text>
                              <Text style={styles.navigationRolesSummary}>{(selectedNavigationDraft.visibleRoles ?? visibleHierarchyFor(session).map((item) => item.role)).length} roles seleccionados</Text>
                            </View>
                            <Ionicons name={navigationRolesDropdownOpen ? 'chevron-up-outline' : 'chevron-down-outline'} size={18} color={palette.red} />
                          </TouchableOpacity>
                          <View style={styles.navigationSelectedRolesWrap}>
                            {(selectedNavigationDraft.visibleRoles ?? visibleHierarchyFor(session).map((item) => item.role)).slice(0, 5).map((role) => (
                              <TouchableOpacity key={`selected-role-${role}`} style={styles.navigationSelectedRoleChip} onPress={() => updateTabRole(selectedNavigationTab.key, role as Role, false)}>
                                <Text style={styles.navigationSelectedRoleText}>{roleShortLabel(role as Role)}</Text>
                                <Ionicons name="close-outline" size={13} color={palette.red} />
                              </TouchableOpacity>
                            ))}
                          </View>
                          {navigationRolesDropdownOpen ? (
                            <View style={styles.navigationRolesDropdown}>
                              {visibleHierarchyFor(session).map((role) => {
                                const roles = selectedNavigationDraft.visibleRoles ?? visibleHierarchyFor(session).map((item) => item.role);
                                const checked = roles.includes(role.role);
                                return (
                                  <TouchableOpacity key={`role-option-${role.role}`} style={styles.navigationRoleOption} onPress={() => updateTabRole(selectedNavigationTab.key, role.role as Role, !checked)} activeOpacity={0.82}>
                                    <Ionicons name={checked ? 'checkbox-outline' : 'square-outline'} size={18} color={checked ? palette.red : palette.inkMuted} />
                                    <Text style={styles.navigationRoleOptionText}>{role.label}</Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          ) : null}
                        </View>

                        <View style={styles.inlineActions}>
                          <TouchableOpacity style={[styles.primaryButton, styles.navigationLargeButton]} onPress={() => adminSaveTab(selectedNavigationTab.key, selectedNavigationTab.label)}>
                            <Ionicons name="save-outline" size={17} color={palette.white} />
                            <Text style={styles.primaryButtonText}>Guardar sección</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.secondaryButton, styles.navigationLargeButton]} onPress={() => adminDeleteTab(selectedNavigationTab.key)}>
                            <Ionicons name="trash-outline" size={17} color={palette.red} />
                            <Text style={styles.secondaryButtonText}>{(!protectedTabKeys.has(selectedNavigationTab.key) && !defaultTabByKey.has(selectedNavigationTab.key)) ? 'Eliminar' : 'No eliminable'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : null}

                    <View style={styles.navigationCreatePanel}>
                      <View style={styles.navigationCreateHeader}>
                        <Ionicons name="add-circle-outline" size={22} color={palette.red} />
                        <Text style={styles.navigationFocusTitle}>Nueva sección</Text>
                      </View>
                      <TextInput style={styles.input} placeholder="Nombre visible. Ej: Noticias" value={newTabLabel} onChangeText={setNewTabLabel} placeholderTextColor={inputPlaceholderColor} />
                      <TextInput style={styles.input} placeholder="Clave interna. Ej: noticias" value={newTabKey} onChangeText={(value) => setNewTabKey(normalizeTabKey(value))} autoCapitalize="none" placeholderTextColor={inputPlaceholderColor} />
                      <TextInput style={styles.input} placeholder="Icono. Ej: newspaper-outline" value={newTabIcon} onChangeText={setNewTabIcon} autoCapitalize="none" placeholderTextColor={inputPlaceholderColor} />
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navigationIconPicker}>
                        {navigationIconSuggestions.map((icon) => (
                          <TouchableOpacity key={`new-dedicated-${icon}`} style={[styles.navigationIconChoice, newTabIcon === icon && styles.navigationIconChoiceActive]} onPress={() => setNewTabIcon(icon)}>
                            <Ionicons name={icon} size={21} color={newTabIcon === icon ? palette.white : palette.red} />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <TouchableOpacity style={styles.navigationRolesButton} onPress={() => setNewNavigationRolesDropdownOpen(!newNavigationRolesDropdownOpen)} activeOpacity={0.85}>
                        <View style={styles.adminUserHeaderText}>
                          <Text style={styles.cardEyebrow}>Roles visibles</Text>
                          <Text style={styles.navigationRolesSummary}>{newTabRoles.length} roles seleccionados</Text>
                        </View>
                        <Ionicons name={newNavigationRolesDropdownOpen ? 'chevron-up-outline' : 'chevron-down-outline'} size={18} color={palette.red} />
                      </TouchableOpacity>
                      {newNavigationRolesDropdownOpen ? (
                        <View style={styles.navigationRolesDropdown}>
                          {visibleHierarchyFor(session).map((role) => {
                            const checked = newTabRoles.includes(role.role as Role);
                            return (
                              <TouchableOpacity key={`new-role-option-${role.role}`} style={styles.navigationRoleOption} onPress={() => toggleNewTabRole(role.role as Role)} activeOpacity={0.82}>
                                <Ionicons name={checked ? 'checkbox-outline' : 'square-outline'} size={18} color={checked ? palette.red : palette.inkMuted} />
                                <Text style={styles.navigationRoleOptionText}>{role.label}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ) : null}
                      <TouchableOpacity style={[styles.primaryButton, styles.navigationLargeButton]} onPress={adminCreatePage}>
                        <Ionicons name="add-circle-outline" size={17} color={palette.white} />
                        <Text style={styles.primaryButtonText}>Crear sección</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.navigationRestoreButton} onPress={adminRestoreDefaultNavigation}>
                      <Ionicons name="refresh-circle-outline" size={18} color={palette.red} />
                      <Text style={styles.secondaryButtonText}>Restaurar navegación predeterminada</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
            <View style={styles.adminPanel}>
              <Text style={styles.cardEyebrow}>{session.role === 'administrador' ? 'Administrador' : 'Dirigencia'}</Text>
              <Text style={styles.cardTitle}>Panel Dirigencial</Text>
              <Text style={styles.cardText}>{session.role === 'administrador' ? 'Gestionar roles, permisos, pestañas, secciones, comunidades, provincias, usuarios, contenido y configuración general.' : 'Revisar solicitudes y gestionar cambios de dirigencia dentro de la provincia.'}</Text>
              {authMessage ? <Text style={styles.adminMessage}>{authMessage}</Text> : null}
              {adminConfigDraft.settings.maintenanceMode ? (
                <View style={styles.adminStatusPill}>
                  <Ionicons name="warning-outline" size={17} color={palette.gold} />
                  <Text style={styles.adminStatusText}>Modo mantenimiento activo</Text>
                </View>
              ) : null}
              <View style={styles.adminModuleGrid}>
                {enabledAdminModules.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.adminModuleButton, adminModule === item.key && styles.adminModuleButtonActive]}
                    onPress={() => setAdminModule(item.key as AdminModule)}
                  >
                    <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color={adminModule === item.key ? palette.white : palette.red} />
                    <Text style={[styles.adminModuleText, adminModule === item.key && styles.adminModuleTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {adminModule === 'resumen' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Panel Dirigencial</Text>
                  <Text style={styles.cardText}>Consola base para controlar contenido, usuarios, comunidades, identidad y configuración general de la app.</Text>
                  <View style={styles.adminStatRow}>
                    {adminDraftSummary.map((item) => (
                      <TouchableOpacity key={item.label} style={styles.adminStat} activeOpacity={0.84}>
                        <Ionicons name={item.icon} size={18} color={palette.red} />
                        <Text style={styles.adminStatNumber}>{item.value}</Text>
                        <Text style={styles.adminStatLabel}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.cardEyebrow}>Accesos rápidos</Text>
                  <View style={styles.adminQuickGrid}>
                    {[
                      { label: isCommunityLeader ? 'Nuevo aviso comunitario' : 'Nueva noticia', module: isCommunityLeader ? 'muro_comunitario' : 'noticias', icon: 'add-circle-outline' },
                      { label: 'Crear comunidad', module: 'comunidades', icon: 'location-outline' },
                      { label: 'Revisar usuarios', module: 'usuarios', icon: 'people-outline' }
                    ].filter((item) => (
                      (item.module !== 'usuarios' || canManageUsers)
                      && (item.module !== 'comunidades' || canAdministrateCommunities)
                    )).map((item) => (
                      <TouchableOpacity key={item.label} style={styles.adminQuickAction} onPress={() => item.module === 'muro_comunitario' ? setProfilePanel('comunidad') : setAdminModule(item.module as AdminModule)}>
                        <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color={palette.red} />
                        <Text style={styles.adminQuickText}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {session.role === 'administrador' ? (
                    <View style={styles.profileCommunityPanel}>
                      <Text style={styles.cardEyebrow}>Ver como</Text>
                      <Text style={styles.cardText}>Simulación temporal para revisar la app con otros rangos. No cambia permisos reales ni guarda cambios en Supabase.</Text>
                      <View style={styles.adminQuickGrid}>
                        {([
                          { key: 'palestrista', label: 'Palestrista' },
                          { key: 'sedimentador', label: 'Sedimentador' },
                          { key: 'coordinador', label: 'Coordinador' },
                          { key: 'nacional', label: 'Nacional' }
                        ] as const).map((item) => (
                          <TouchableOpacity key={item.key} style={styles.adminQuickAction} onPress={() => onViewAsSession(internalTestSessions[item.key])}>
                            <Ionicons name="eye-outline" size={20} color={palette.red} />
                            <Text style={styles.adminQuickText}>{item.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ) : null}
                  <Text style={styles.cardEyebrow}>Arquitectura editable</Text>
                  <Text style={styles.cardText}>Panel reducido para Beta: identidad, home, noticias, contacto, período motivador, usuarios, comunidades y configuración real.</Text>
                </View>
              ) : null}

              {adminModule === 'identidad' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Identidad de la app</Text>
                  <Text style={styles.cardText}>Base editable para nombre, subtitulo, logo, portada y colores principales.</Text>
                  <TextInput style={styles.input} placeholder="Nombre de la app" value={adminConfigDraft.identity.appName} onChangeText={(value) => updateAdminConfigSection('identity', { appName: value })}  placeholderTextColor={inputPlaceholderColor} />
                  <TextInput style={styles.input} placeholder="Subtitulo" value={adminConfigDraft.identity.subtitle} onChangeText={(value) => updateAdminConfigSection('identity', { subtitle: value })}  placeholderTextColor={inputPlaceholderColor} />
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Descripcion institucional" value={adminConfigDraft.identity.description} onChangeText={(value) => updateAdminConfigSection('identity', { description: value })} multiline  placeholderTextColor={inputPlaceholderColor} />
                  <TextInput style={styles.input} placeholder="URL del logo" value={adminConfigDraft.identity.logoUrl} onChangeText={(value) => updateAdminConfigSection('identity', { logoUrl: value })}  placeholderTextColor={inputPlaceholderColor} />
                  <TextInput style={styles.input} placeholder="URL de imagen hero/portada" value={adminConfigDraft.identity.heroImageUrl} onChangeText={(value) => updateAdminConfigSection('identity', { heroImageUrl: value })}  placeholderTextColor={inputPlaceholderColor} />
                  <View style={styles.inlineActions}>
                    <TextInput style={[styles.input, styles.colorInput]} placeholder="#2d8dc8" value={adminConfigDraft.identity.primaryColor} onChangeText={(value) => updateAdminConfigSection('identity', { primaryColor: value })}  placeholderTextColor={inputPlaceholderColor} />
                    <TextInput style={[styles.input, styles.colorInput]} placeholder="#5da7db" value={adminConfigDraft.identity.secondaryColor} onChangeText={(value) => updateAdminConfigSection('identity', { secondaryColor: value })}  placeholderTextColor={inputPlaceholderColor} />
                  </View>
                  <View style={styles.adminPreviewPane}>
                    <Text style={styles.cardEyebrow}>Previsualizacion</Text>
                    <Text style={styles.cardTitle}>{adminConfigDraft.identity.appName}</Text>
                    <Text style={styles.cardText}>{adminConfigDraft.identity.subtitle}</Text>
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => saveAdminConfigDraft('Identidad')}>
                    <Text style={styles.primaryButtonText}>Guardar identidad</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {adminModule === 'home' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Home</Text>
                  <Text style={styles.cardText}>Control visual del panel inicial, accesos rápidos y secciones visibles.</Text>
                  <TextInput style={styles.input} placeholder="Titulo principal" value={adminConfigDraft.home.heroTitle} onChangeText={(value) => updateAdminConfigSection('home', { heroTitle: value })}  placeholderTextColor={inputPlaceholderColor} />
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Texto principal" value={adminConfigDraft.home.heroText} onChangeText={(value) => updateAdminConfigSection('home', { heroText: value })} multiline  placeholderTextColor={inputPlaceholderColor} />
                  <TextInput style={styles.input} placeholder="Banner destacado" value={adminConfigDraft.home.featuredBanner} onChangeText={(value) => updateAdminConfigSection('home', { featuredBanner: value })}  placeholderTextColor={inputPlaceholderColor} />
                  <Text style={styles.cardEyebrow}>Modulos visibles</Text>
                  <View style={styles.filterRow}>
                    {['noticias', 'comunidades', 'materiales', 'perfil', 'agenda', 'actividad'].map((item, index) => (
                      <TouchableOpacity key={`${item}-${index}`} style={[styles.filterChip, adminConfigDraft.home.visibleModules.includes(item) && styles.filterChipActive]} onPress={() => toggleAdminConfigList('home', item)}>
                        <Text style={[styles.filterChipText, adminConfigDraft.home.visibleModules.includes(item) && styles.filterChipTextActive]}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => saveAdminConfigDraft('Home')}>
                    <Text style={styles.primaryButtonText}>Guardar Home</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {adminModule === 'contenido_publicado' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Contenido Publicado</Text>
                  <Text style={styles.cardText}>Inventario central para distinguir contenido real de Supabase y contenido base/fallback usado para que la app no quede vacía.</Text>
                  <Text style={styles.cardEyebrow}>Páginas editables en Supabase</Text>
                  {appContent.length === 0 ? <Text style={styles.cardText}>No hay páginas publicadas cargadas desde Supabase.</Text> : null}
                  {appContent.map((item) => (
                    <View key={item.tab_key} style={styles.adminListRow}>
                      <Ionicons name="document-text-outline" size={20} color={palette.red} />
                      <View style={styles.adminUserHeaderText}>
                        <Text style={styles.adminQuickText}>{item.title || item.tab_key}</Text>
                        <Text style={styles.cardText}>Origen: Supabase - pestaña {item.tab_key}</Text>
                      </View>
                      <TouchableOpacity style={styles.actionPill} onPress={() => { setSelectedContentTab(item.tab_key); setAdminModule('contenido_general'); }}>
                        <Text style={styles.actionPillText}>Editar</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <Text style={styles.cardEyebrow}>Contenido base / fallback</Text>
                  {[
                    ...news.map((item) => ({ key: fallbackContentKey('home', item.title), section: 'Home', title: item.title, origin: 'Fallback local' })),
                    ...notilestra.map((item) => ({ key: fallbackContentKey('notilestra', item.title, item.date), section: 'Noticias/Agenda', title: item.title, origin: `Fallback local - ${item.date}` })),
                    ...calendarActivities.map((item) => ({ key: fallbackContentKey('calendario', item.title, item.date), section: 'Calendario', title: item.title, origin: `Fallback local - ${item.date}` }))
                  ].map((item) => {
                    const hidden = (adminConfigDraft.settings.hiddenFallbackContent ?? []).includes(item.key);
                    return (
                      <View key={item.key} style={[styles.adminListRow, hidden && styles.lockedCard]}>
                        <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={20} color={palette.red} />
                        <View style={styles.adminUserHeaderText}>
                          <Text style={styles.adminQuickText}>{item.title}</Text>
                          <Text style={styles.cardText}>{item.section} - {item.origin} - {hidden ? 'oculto' : 'visible'}</Text>
                        </View>
                        <TouchableOpacity style={styles.actionPill} onPress={() => setFallbackContentHidden(item.key, !hidden)}>
                          <Text style={styles.actionPillText}>{hidden ? 'Mostrar' : 'Ocultar'}</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              {adminModule === 'descargas' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Descargas y materiales</Text>
                  <Text style={styles.cardText}>Biblioteca editable persistida en Supabase. Se puede guardar URL o ruta de archivo y definir visibilidad por rol.</Text>
                  <TouchableOpacity style={styles.secondaryButton} onPress={loadAdminMaterials}>
                    <Text style={styles.secondaryButtonText}>Cargar materiales</Text>
                  </TouchableOpacity>
                  <Text style={styles.cardEyebrow}>Materiales actuales</Text>
                  {(adminMaterials.length > 0 ? adminMaterials : materials.map((material, index) => ({
                    id: `fallback-${index}`,
                    title: material.title,
                    description: material.description,
                    category: material.type,
                    visibility: material.permission ? 'interno' : 'publico',
                    required_permission: material.permission,
                    file_url: null,
                    file_path: null,
                    sort_order: index,
                    archived_at: null,
                    created_at: null,
                    created_by: null,
                    province_id: null
                  } as AppMaterialRecord))).map((material) => (
                    <View key={material.id} style={styles.adminListRow}>
                      <Ionicons name="document-text-outline" size={19} color={palette.red} />
                      <View style={styles.adminUserHeaderText}>
                        <Text style={styles.cardTitle}>{material.title}</Text>
                        <Text style={styles.cardText}>{material.category ?? 'General'} - {material.visibility ?? 'interno'}{material.required_permission ? ` - ${material.required_permission}` : ''}</Text>
                      </View>
                      {!material.id.startsWith('fallback-') ? (
                        <TouchableOpacity onPress={() => adminArchiveMaterial(material.id)}>
                          <Text style={styles.adminStateDraft}>Archivar</Text>
                        </TouchableOpacity>
                      ) : <Text style={styles.adminStateDraft}>Base</Text>}
                    </View>
                  ))}
                  <Text style={styles.cardEyebrow}>Nuevo material</Text>
                  <TextInput style={styles.input} placeholder="Nombre del archivo" value={materialTitle} onChangeText={setMaterialTitle}  placeholderTextColor={inputPlaceholderColor} />
                  <TextInput style={styles.input} placeholder="Categoria" value={materialCategory} onChangeText={setMaterialCategory}  placeholderTextColor={inputPlaceholderColor} />
                  <TextInput style={styles.input} placeholder="URL del archivo o PDF" value={materialFileUrl} onChangeText={setMaterialFileUrl}  placeholderTextColor={inputPlaceholderColor} />
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Descripcion" value={materialDescription} onChangeText={setMaterialDescription} multiline  placeholderTextColor={inputPlaceholderColor} />
                  <View style={styles.filterRow}>
                    {['publico', 'interno', 'reservado', 'administrador'].map((item, index) => (
                      <TouchableOpacity key={`${item}-${index}`} style={[styles.filterChip, materialVisibility === item && styles.filterChipActive]} onPress={() => setMaterialVisibility(item)}>
                        <Text style={[styles.filterChipText, materialVisibility === item && styles.filterChipTextActive]}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput style={styles.input} placeholder="Permiso requerido opcional. Ej: ver_materiales_internos" value={materialPermission} onChangeText={setMaterialPermission}  placeholderTextColor={inputPlaceholderColor} />
                  <TouchableOpacity style={styles.primaryButton} onPress={adminSaveMaterial}>
                    <Text style={styles.primaryButtonText}>Guardar material</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {adminModule === 'historia_admin' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Nuestra Historia</Text>
                  <Text style={styles.cardText}>Gestión de capítulos, preguntas frecuentes y textos institucionales desde el editor centralizado.</Text>
                  <View style={styles.adminListRow}>
                    <Ionicons name="book-outline" size={19} color={palette.red} />
                    <View style={styles.adminUserHeaderText}>
                      <Text style={styles.cardTitle}>{movementHistory.length} capitulos actuales</Text>
                      <Text style={styles.cardText}>Migracion progresiva al editor de bloques.</Text>
                    </View>
                  </View>
                  <View style={styles.adminListRow}>
                    <Ionicons name="help-circle-outline" size={19} color={palette.red} />
                    <View style={styles.adminUserHeaderText}>
                      <Text style={styles.cardTitle}>{faqItems.length} preguntas frecuentes</Text>
                      <Text style={styles.cardText}>Editable desde Contenido General por ahora.</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => { setSelectedContentTab('historia'); setAdminModule('contenido_general'); }}>
                    <Text style={styles.primaryButtonText}>Abrir editor de Historia</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {adminModule === 'contacto_admin' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Contacto modular</Text>
                  <Text style={styles.cardText}>Configura canales nacionales, Instagram por provincia y bloques dinamicos visibles en Contacto.</Text>
                  {session?.role === 'administrador' ? (
                    <>
                      <TextInput style={styles.input} placeholder="Correo electronico oficial. Ej: contacto@palestra.org.ar" value={adminConfigDraft.contact.email} onChangeText={(value) => updateAdminConfigSection('contact', { email: value })}  placeholderTextColor={inputPlaceholderColor} />
                      <TextInput style={styles.input} placeholder="Numero telefonico oficial. Ej: +54 351 000-0000" value={adminConfigDraft.contact.phone} onChangeText={(value) => updateAdminConfigSection('contact', { phone: value })}  placeholderTextColor={inputPlaceholderColor} />
                    </>
                  ) : null}
                  <Text style={styles.cardEyebrow}>Instagram nacional</Text>
                  <TextInput style={styles.input} placeholder="URL o usuario de Instagram nacional" value={adminConfigDraft.contact.instagram} onChangeText={(value) => updateAdminConfigSection('contact', { instagram: value })}  placeholderTextColor={inputPlaceholderColor} />
                  <TouchableOpacity style={styles.primaryButton} onPress={saveInstagramConfigDraft}>
                    <Text style={styles.primaryButtonText}>Guardar Instagram</Text>
                  </TouchableOpacity>
                  {session?.role === 'administrador' ? (
                    <>
                      <Text style={styles.cardEyebrow}>Instagram por provincia</Text>
                      {Object.keys(defaultAdminConfig.contact.provinceInstagram).map((province) => (
                        <TextInput
                          key={province}
                          style={styles.input}
                          placeholder={`Instagram de ${province}`}
                          value={adminConfigDraft.contact.provinceInstagram?.[province] ?? ''}
                          onChangeText={(value) => updateAdminConfigSection('contact', {
                            provinceInstagram: { ...(adminConfigDraft.contact.provinceInstagram ?? {}), [province]: value }
                          })}
                          autoCapitalize="none"
                         placeholderTextColor={inputPlaceholderColor} />
                      ))}
                      <TextInput style={[styles.input, styles.textArea]} placeholder="Texto de ayuda para orientar a quien visita Contacto" value={adminConfigDraft.contact.helpText} onChangeText={(value) => updateAdminConfigSection('contact', { helpText: value })} multiline  placeholderTextColor={inputPlaceholderColor} />
                      <TextInput style={[styles.input, styles.textArea]} placeholder="Texto opcional de donaciones o colaboracion" value={adminConfigDraft.contact.donationText} onChangeText={(value) => updateAdminConfigSection('contact', { donationText: value })} multiline  placeholderTextColor={inputPlaceholderColor} />
                      <Text style={styles.cardEyebrow}>Bloques dinamicos</Text>
                      {(adminConfigDraft.contact.blocks ?? []).map((block, index) => (
                        <View key={block.id} style={styles.innerNewsCard}>
                          <TextInput
                            style={styles.input}
                            placeholder="Titulo o etiqueta del bloque"
                            value={block.label}
                            onChangeText={(value) => {
                              const blocks = [...(adminConfigDraft.contact.blocks ?? [])];
                              blocks[index] = { ...block, label: value };
                              updateAdminConfigSection('contact', { blocks });
                            }}
                           placeholderTextColor={inputPlaceholderColor} />
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                            {(['texto', 'telefono', 'email', 'imagen', 'direccion', 'enlace', 'boton', 'red_social'] as ContactBlock['type'][]).map((type) => (
                              <TouchableOpacity key={type} style={[styles.filterChip, block.type === type && styles.filterChipActive]} onPress={() => {
                                const blocks = [...(adminConfigDraft.contact.blocks ?? [])];
                                blocks[index] = { ...block, type };
                                updateAdminConfigSection('contact', { blocks });
                              }}>
                                <Text style={[styles.filterChipText, block.type === type && styles.filterChipTextActive]}>{type}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                          <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Contenido, URL, teléfono, email o dirección"
                            value={block.value}
                            onChangeText={(value) => {
                              const blocks = [...(adminConfigDraft.contact.blocks ?? [])];
                              blocks[index] = { ...block, value };
                              updateAdminConfigSection('contact', { blocks });
                            }}
                            multiline
                           placeholderTextColor={inputPlaceholderColor} />
                          <TouchableOpacity style={styles.secondaryButton} onPress={() => updateAdminConfigSection('contact', { blocks: (adminConfigDraft.contact.blocks ?? []).filter((item) => item.id !== block.id) })}>
                            <Text style={styles.secondaryButtonText}>Eliminar bloque</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity style={styles.secondaryButton} onPress={() => updateAdminConfigSection('contact', {
                        blocks: [...(adminConfigDraft.contact.blocks ?? []), { id: `contact-${Date.now()}`, type: 'texto', label: '', value: '' }]
                      })}>
                        <Ionicons name="add-circle-outline" size={17} color={palette.red} />
                        <Text style={styles.secondaryButtonText}>Agregar bloque</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.primaryButton} onPress={() => saveAdminConfigDraft('Contacto')}>
                        <Text style={styles.primaryButtonText}>Guardar contacto completo</Text>
                      </TouchableOpacity>
                    </>
                  ) : null}
                </View>
              ) : null}

              {adminModule === 'periodo_motivador' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Período Motivador</Text>
                  <Text style={styles.cardText}>Gestión real de PM por provincia. Solo Vocal Diocesano, Coordinador Diocesano y Administrador pueden administrar esta sección.</Text>
                  {!canManageMotivadorPanel(session) ? (
                    <View style={styles.notice}>
                      <Ionicons name="lock-closed-outline" size={20} color={palette.red} />
                      <Text style={styles.noticeText}>No tenés permisos para gestionar Períodos Motivadores.</Text>
                    </View>
                  ) : null}
                  {canManageMotivadorPanel(session) ? (
                    <>
                      <View style={styles.inlineEditorPanel}>
                        <Text style={styles.cardEyebrow}>{pmEditingId ? 'Editar PM' : 'Nuevo PM'}</Text>
                        <View style={styles.filterRow}>
                          {(['masculino', 'femenino'] as const).map((item) => (
                            <TouchableOpacity key={item} style={[styles.filterChip, pmGender === item && styles.filterChipActive]} onPress={() => setPmGender(item)}>
                              <Text style={[styles.filterChipText, pmGender === item && styles.filterChipTextActive]}>PM {item === 'masculino' ? 'Masculino' : 'Femenino'}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <TextInput style={styles.input} placeholder="Número de PM" value={pmNumber} onChangeText={setPmNumber} keyboardType="numeric"  placeholderTextColor={inputPlaceholderColor} />
                        <Text style={styles.cardEyebrow}>Provincia</Text>
                        <View style={styles.filterRow}>
                          {motivadorProvinceOptions.map((province) => (
                            <TouchableOpacity
                              key={province}
                              style={[styles.filterChip, pmProvince === province && styles.filterChipActive]}
                              onPress={() => session?.role === 'administrador' ? setPmProvince(province) : undefined}
                              disabled={session?.role !== 'administrador'}
                            >
                              <Text style={[styles.filterChipText, pmProvince === province && styles.filterChipTextActive]}>{province}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <TouchableOpacity style={styles.secondaryButton} onPress={() => setPmCalendarOpen(!pmCalendarOpen)}>
                          <Ionicons name="calendar-outline" size={17} color={palette.red} />
                          <Text style={styles.secondaryButtonText}>Seleccionar fechas</Text>
                        </TouchableOpacity>
                        <Text style={styles.cardText}>{selectedDatesSummary(pmSelectedDates)}</Text>
                        {pmCalendarOpen ? (
                          <View style={styles.pmCalendarPanel}>
                            <View style={styles.pmCalendarHeader}>
                              <TouchableOpacity style={styles.pmCalendarNavButton} onPress={() => setPmCalendarMonth(new Date(pmCalendarMonth.getFullYear(), pmCalendarMonth.getMonth() - 1, 1))}>
                                <Text style={styles.pmCalendarNavText}>←</Text>
                              </TouchableOpacity>
                              <Text style={styles.pmCalendarTitle}>{pmCalendarMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</Text>
                              <TouchableOpacity style={styles.pmCalendarNavButton} onPress={() => setPmCalendarMonth(new Date(pmCalendarMonth.getFullYear(), pmCalendarMonth.getMonth() + 1, 1))}>
                                <Text style={styles.pmCalendarNavText}>→</Text>
                              </TouchableOpacity>
                            </View>
                            <View style={styles.pmCalendarWeekRow}>
                              {['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'].map((day) => (
                                <Text key={day} style={styles.pmWeekdayText}>{day}</Text>
                              ))}
                            </View>
                            <View style={styles.pmCalendarGrid}>
                              {Array.from({ length: new Date(pmCalendarMonth.getFullYear(), pmCalendarMonth.getMonth(), 1).getDay() }, (_, index) => (
                                <View key={`blank-${index}`} style={styles.pmDaySpacer} />
                              ))}
                              {Array.from({ length: new Date(pmCalendarMonth.getFullYear(), pmCalendarMonth.getMonth() + 1, 0).getDate() }, (_, index) => {
                                const day = index + 1;
                                const date = isoDate(pmCalendarMonth.getFullYear(), pmCalendarMonth.getMonth(), day);
                                const selected = pmSelectedDates.includes(date);
                                return (
                                  <TouchableOpacity key={date} style={[styles.pmDayButton, selected && styles.pmDayButtonSelected]} onPress={() => togglePmDate(date)}>
                                    <Text style={[styles.pmDayText, selected && styles.pmDayTextSelected]}>{day}</Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </View>
                        ) : null}
                        <TextInput style={styles.input} placeholder="Casa de retiro" value={pmRetreatHouse} onChangeText={setPmRetreatHouse}  placeholderTextColor={inputPlaceholderColor} />
                        <TextInput style={styles.input} placeholder="Dirección de la casa de retiro" value={pmAddress} onChangeText={setPmAddress}  placeholderTextColor={inputPlaceholderColor} />
                        <TextInput style={styles.input} placeholder="Horario estimado de apertura. Ej: Viernes 18:00" value={pmOpeningTime} onChangeText={setPmOpeningTime}  placeholderTextColor={inputPlaceholderColor} />
                        <TextInput style={styles.input} placeholder="Horario estimado de clausura. Ej: Domingo 17:00" value={pmClosingTime} onChangeText={setPmClosingTime}  placeholderTextColor={inputPlaceholderColor} />
                        <TextInput style={[styles.input, styles.textArea]} placeholder="Descripcion opcional" value={pmDescription} onChangeText={setPmDescription} multiline  placeholderTextColor={inputPlaceholderColor} />
                        <TextInput style={styles.input} placeholder="URL foto del lugar opcional" value={pmPlacePhotoUrl} onChangeText={setPmPlacePhotoUrl} autoCapitalize="none"  placeholderTextColor={inputPlaceholderColor} />
                        <TextInput style={styles.input} placeholder="URL flyer o invitacion opcional" value={pmFlyerUrl} onChangeText={setPmFlyerUrl} autoCapitalize="none"  placeholderTextColor={inputPlaceholderColor} />
                        <TouchableOpacity style={[styles.filterChip, pmVisibleToLowerRoles && styles.filterChipActive]} onPress={() => setPmVisibleToLowerRoles(!pmVisibleToLowerRoles)}>
                          <Text style={[styles.filterChipText, pmVisibleToLowerRoles && styles.filterChipTextActive]}>{pmVisibleToLowerRoles ? 'Visible para inferiores a Sedimentador' : 'Invisible para inferiores a Sedimentador'}</Text>
                        </TouchableOpacity>
                        <Text style={styles.cardEyebrow}>Estado</Text>
                        <View style={styles.filterRow}>
                          {(['activo', 'inactivo', 'borrador'] as const).map((status) => (
                            <TouchableOpacity key={status} style={[styles.filterChip, pmStatus === status && styles.filterChipActive]} onPress={() => setPmStatus(status)}>
                              <Text style={[styles.filterChipText, pmStatus === status && styles.filterChipTextActive]}>{status}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <TouchableOpacity style={styles.primaryButton} onPress={submitMotivadorPeriod}>
                          <Text style={styles.primaryButtonText}>{pmEditingId ? 'Guardar cambios' : 'Crear PM'}</Text>
                        </TouchableOpacity>
                        {pmEditingId ? (
                          <TouchableOpacity style={styles.secondaryButton} onPress={resetMotivadorForm}>
                            <Text style={styles.secondaryButtonText}>Cancelar edición</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                      <SectionTitle title="PM cargados" />
                      <View style={styles.filterRow}>
                        {session?.role === 'administrador' ? [''].concat(motivadorProvinceOptions).map((province) => (
                          <TouchableOpacity key={province || 'todas'} style={[styles.filterChip, pmProvinceFilter === province && styles.filterChipActive]} onPress={() => setPmProvinceFilter(province)}>
                            <Text style={[styles.filterChipText, pmProvinceFilter === province && styles.filterChipTextActive]}>{province || 'Todas'}</Text>
                          </TouchableOpacity>
                        )) : null}
                        {(['todos', 'masculino', 'femenino'] as const).map((gender) => (
                          <TouchableOpacity key={gender} style={[styles.filterChip, pmGenderFilter === gender && styles.filterChipActive]} onPress={() => setPmGenderFilter(gender)}>
                            <Text style={[styles.filterChipText, pmGenderFilter === gender && styles.filterChipTextActive]}>{gender}</Text>
                          </TouchableOpacity>
                        ))}
                        {(['todos', 'activo', 'inactivo', 'borrador'] as const).map((status) => (
                          <TouchableOpacity key={status} style={[styles.filterChip, pmStatusFilter === status && styles.filterChipActive]} onPress={() => setPmStatusFilter(status)}>
                            <Text style={[styles.filterChipText, pmStatusFilter === status && styles.filterChipTextActive]}>{status}</Text>
                          </TouchableOpacity>
                        ))}
                        {(['todos', 'proximos', 'pasados'] as const).map((period) => (
                          <TouchableOpacity key={period} style={[styles.filterChip, pmTimeFilter === period && styles.filterChipActive]} onPress={() => setPmTimeFilter(period)}>
                            <Text style={[styles.filterChipText, pmTimeFilter === period && styles.filterChipTextActive]}>{period}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      {filteredMotivadorPeriods.length === 0 ? <Text style={styles.cardText}>No hay PM cargados para los filtros seleccionados.</Text> : null}
                      {filteredMotivadorPeriods.map((period) => (
                        <View key={period.id} style={styles.adminListRow}>
                          <Ionicons name="flame-outline" size={20} color={palette.red} />
                          <View style={styles.adminUserHeaderText}>
                            <Text style={styles.cardTitle}>PM {period.gender === 'femenino' ? 'Femenino' : 'Masculino'} {period.pm_number} - {period.province}</Text>
                            <Text style={styles.cardText}>Fechas: {selectedDatesSummary(period.selected_dates?.map((date) => String(date).slice(0, 10)) ?? [period.starts_on, period.ends_on])}</Text>
                            <Text style={styles.cardText}>Casa: {period.retreat_house}. Dirección: {period.address}</Text>
                            <Text style={styles.cardText}>Apertura: {period.opening_time ?? 'Sin horario'} - Clausura: {period.closing_time ?? 'Sin horario'}</Text>
                            <Text style={styles.cardText}>Estado: {period.status}. Última edición: {period.updated_by_name ?? 'Sin registro'}</Text>
                            <View style={styles.inlineActions}>
                              <TouchableOpacity style={styles.secondaryButton} onPress={() => editMotivadorPeriod(period)}>
                                <Text style={styles.secondaryButtonText}>Editar</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.secondaryButton} onPress={() => updateMotivadorStatus(period.id, period.status === 'activo' ? 'inactivo' : 'activo')}>
                                <Text style={styles.secondaryButtonText}>{period.status === 'activo' ? 'Inhabilitar' : 'Habilitar'}</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.secondaryButton} onPress={() => updateMotivadorStatus(period.id, 'archivado')}>
                                <Text style={styles.secondaryButtonText}>Eliminar</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      ))}
                    </>
                  ) : null}
                </View>
              ) : null}

              {adminModule === 'permisos_roles' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Permisos de Rangos</Text>
                  <Text style={styles.cardText}>Activa o desactiva permisos reales por rango. Los cambios se guardan en Supabase, se leen al iniciar sesion y actualizan la sesion actual si corresponde.</Text>
                  <Text style={styles.cardEyebrow}>Rango</Text>
                  <TouchableOpacity style={styles.dropdownButton} onPress={() => setPermissionRoleDropdownOpen(!permissionRoleDropdownOpen)}>
                    <Text style={styles.dropdownButtonText}>{roleLabel(permissionRole)}</Text>
                    <Ionicons name={permissionRoleDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                  </TouchableOpacity>
                  {permissionRoleDropdownOpen ? (
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                      {roleDefinitions.filter((role) => role.role !== 'administrador').map((role) => (
                        <TouchableOpacity key={role.role} style={styles.dropdownItem} onPress={() => {
                          const nextRole = role.role as Role;
                          setPermissionRole(nextRole);
                          setRolePermissionDraft(rolePermissions[nextRole] ?? []);
                          setRolePermissionRows([]);
                          setPermissionRoleDropdownOpen(false);
                        }}>
                          <Text style={styles.dropdownItemText}>{role.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : null}
                  <View style={styles.inlineActions}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => loadRolePermissionDraft(permissionRole)}>
                      <Ionicons name="refresh-outline" size={17} color={palette.red} />
                      <Text style={styles.secondaryButtonText}>Cargar permisos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButton} onPress={saveRolePermissionDraft}>
                      <Ionicons name="save-outline" size={17} color={palette.white} />
                      <Text style={styles.primaryButtonText}>Guardar permisos</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cardEyebrow}>Permisos disponibles</Text>
                  <View style={styles.permissionGrid}>
                    {permissionOptions.map((permission) => {
                      const checked = rolePermissionDraft.includes(permission.key);
                      const remoteRow = rolePermissionRows.find((item) => item.permission_key === permission.key);
                      return (
                        <TouchableOpacity key={permission.key} style={[styles.permissionToggle, checked && styles.permissionToggleActive]} onPress={() => toggleRolePermission(permission.key)} activeOpacity={0.85}>
                          <Ionicons name={checked ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={checked ? palette.white : palette.red} />
                          <View style={styles.adminUserHeaderText}>
                            <Text style={[styles.permissionToggleTitle, checked && styles.permissionToggleTitleActive]}>{remoteRow?.permission_label || permission.label}</Text>
                            <Text style={[styles.permissionToggleMeta, checked && styles.permissionToggleMetaActive]}>{permission.key}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {adminModule === 'etiquetas_roles' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Nombres visibles por provincia</Text>
                  <Text style={styles.cardText}>Personaliza como se ve un rango en una provincia sin cambiar su role_key interno, permisos ni jerarquia.</Text>
                  <Text style={styles.cardEyebrow}>Provincia</Text>
                  <TouchableOpacity style={styles.dropdownButton} onPress={() => setRoleLabelProvinceDropdownOpen(!roleLabelProvinceDropdownOpen)}>
                    <Text style={styles.dropdownButtonText}>{roleLabelProvince || 'Seleccionar provincia'}</Text>
                    <Ionicons name={roleLabelProvinceDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                  </TouchableOpacity>
                  {roleLabelProvinceDropdownOpen ? (
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                      {registrationCommunities.map((item) => (
                        <TouchableOpacity key={item.province} style={styles.dropdownItem} onPress={() => { setRoleLabelProvince(item.province); setRoleLabelProvinceDropdownOpen(false); }}>
                          <Text style={styles.dropdownItemText}>{item.province}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : null}
                  <Text style={styles.cardEyebrow}>Rango interno</Text>
                  <TouchableOpacity style={styles.dropdownButton} onPress={() => setRoleLabelRoleDropdownOpen(!roleLabelRoleDropdownOpen)}>
                    <Text style={styles.dropdownButtonText}>{roleLabel(roleLabelRole)}</Text>
                    <Ionicons name={roleLabelRoleDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                  </TouchableOpacity>
                  {roleLabelRoleDropdownOpen ? (
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                      {roleDefinitions.filter((role) => role.role !== 'invitado' && role.role !== 'administrador').map((role) => (
                        <TouchableOpacity key={role.role} style={styles.dropdownItem} onPress={() => { setRoleLabelRole(role.role as Role); setRoleLabelRoleDropdownOpen(false); }}>
                          <Text style={styles.dropdownItemText}>{role.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : null}
                  <TextInput style={styles.input} placeholder="Nombre visible para esta provincia" value={roleLabelDraft} onChangeText={setRoleLabelDraft} placeholderTextColor={inputPlaceholderColor} />
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Descripcion interna opcional" value={roleLabelDescription} onChangeText={setRoleLabelDescription} multiline placeholderTextColor={inputPlaceholderColor} />
                  <TouchableOpacity style={[styles.adminListRow, roleLabelActive && styles.adminListRowActive]} onPress={() => setRoleLabelActive(!roleLabelActive)}>
                    <Ionicons name={roleLabelActive ? 'toggle' : 'toggle-outline'} size={24} color={roleLabelActive ? palette.red : palette.inkMuted} />
                    <Text style={styles.adminQuickText}>{roleLabelActive ? 'Etiqueta activa' : 'Etiqueta inactiva: se usa nombre estandar'}</Text>
                  </TouchableOpacity>
                  <View style={styles.profileCommunityPanel}>
                    <Text style={styles.cardEyebrow}>Vista previa</Text>
                    <Text style={styles.cardTitle}>{roleLabelForProvince(roleLabelRole, roleLabelProvince, provinceRoleLabels)}</Text>
                    <Text style={styles.cardText}>Interno: {roleLabelRole}. Los permisos siguen usando este valor interno.</Text>
                  </View>
                  <View style={styles.inlineActions}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={loadProvinceRoleLabels}>
                      <Ionicons name="refresh-outline" size={17} color={palette.red} />
                      <Text style={styles.secondaryButtonText}>Cargar etiquetas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButton} onPress={saveProvinceRoleLabelDraft}>
                      <Ionicons name="save-outline" size={17} color={palette.white} />
                      <Text style={styles.primaryButtonText}>Guardar etiqueta</Text>
                    </TouchableOpacity>
                  </View>
                  {provinceRoleLabels.length > 0 ? (
                    <View style={styles.profileCommunityPanel}>
                      <Text style={styles.cardEyebrow}>Etiquetas cargadas</Text>
                      {provinceRoleLabels.map((item) => (
                        <View key={item.id} style={styles.adminListRow}>
                          <Ionicons name={item.is_active ? 'pricetag-outline' : 'eye-off-outline'} size={20} color={palette.red} />
                          <View style={styles.adminUserHeaderText}>
                            <Text style={styles.adminQuickText}>{item.province} - {roleLabel(item.role_key as Role)}</Text>
                            <Text style={styles.cardText}>{item.display_label}{item.is_active ? '' : ' (inactiva)'}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {adminModule === 'rangos_alias' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Duplicar / renombrar rangos</Text>
                  <Text style={styles.cardText}>Crea alias asignables que heredan permisos y jerarquia del rango base. Se guardan en Supabase y se aplican al usuario como nombre visible persistente.</Text>
                  <Text style={styles.cardEyebrow}>Rango base</Text>
                  <TouchableOpacity style={styles.dropdownButton} onPress={() => setRoleAliasRoleDropdownOpen(!roleAliasRoleDropdownOpen)}>
                    <Text style={styles.dropdownButtonText}>{roleLabel(roleAliasBaseRole)}</Text>
                    <Ionicons name={roleAliasRoleDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                  </TouchableOpacity>
                  {roleAliasRoleDropdownOpen ? (
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                      {roleDefinitions.filter((role) => role.role !== 'invitado' && role.role !== 'administrador').map((role) => (
                        <TouchableOpacity key={role.role} style={styles.dropdownItem} onPress={() => { setRoleAliasBaseRole(role.role as Role); setRoleAliasRoleDropdownOpen(false); }}>
                          <Text style={styles.dropdownItemText}>{role.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : null}
                  <TextInput style={styles.input} placeholder="Nuevo nombre visible" value={roleAliasLabel} onChangeText={setRoleAliasLabel} placeholderTextColor={inputPlaceholderColor} />
                  <TouchableOpacity style={[styles.adminListRow, roleAliasIsGlobal && styles.adminListRowActive]} onPress={() => setRoleAliasIsGlobal(!roleAliasIsGlobal)}>
                    <Ionicons name={roleAliasIsGlobal ? 'earth-outline' : 'map-outline'} size={22} color={palette.red} />
                    <Text style={styles.adminQuickText}>{roleAliasIsGlobal ? 'Aplica globalmente' : 'Aplica por provincia'}</Text>
                  </TouchableOpacity>
                  {!roleAliasIsGlobal ? (
                    <>
                      <Text style={styles.cardEyebrow}>Provincia</Text>
                      <TouchableOpacity style={styles.dropdownButton} onPress={() => setRoleAliasProvinceDropdownOpen(!roleAliasProvinceDropdownOpen)}>
                        <Text style={styles.dropdownButtonText}>{roleAliasProvince || 'Seleccionar provincia'}</Text>
                        <Ionicons name={roleAliasProvinceDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                      </TouchableOpacity>
                      {roleAliasProvinceDropdownOpen ? (
                        <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                          {registrationCommunities.map((item) => (
                            <TouchableOpacity key={item.province} style={styles.dropdownItem} onPress={() => { setRoleAliasProvince(item.province); setRoleAliasProvinceDropdownOpen(false); }}>
                              <Text style={styles.dropdownItemText}>{item.province}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      ) : null}
                    </>
                  ) : null}
                  <TouchableOpacity style={[styles.adminListRow, roleAliasActive && styles.adminListRowActive]} onPress={() => setRoleAliasActive(!roleAliasActive)}>
                    <Ionicons name={roleAliasActive ? 'toggle' : 'toggle-outline'} size={24} color={roleAliasActive ? palette.red : palette.inkMuted} />
                    <Text style={styles.adminQuickText}>{roleAliasActive ? 'Alias activo y visible' : 'Alias guardado inactivo'}</Text>
                  </TouchableOpacity>
                  <View style={styles.profileCommunityPanel}>
                    <Text style={styles.cardEyebrow}>Vista previa</Text>
                    <Text style={styles.cardTitle}>{roleAliasLabel.trim() || roleLabel(roleAliasBaseRole)}</Text>
                    <Text style={styles.cardText}>Hereda permisos de {roleLabel(roleAliasBaseRole)}. Alcance: {roleAliasIsGlobal ? 'global' : roleAliasProvince || 'provincia pendiente'}.</Text>
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={saveRoleAliasDraft}>
                    <Ionicons name="save-outline" size={17} color={palette.white} />
                    <Text style={styles.primaryButtonText}>Guardar alias</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => loadRoleAliases(true)}>
                    <Ionicons name="refresh-outline" size={17} color={palette.red} />
                    <Text style={styles.secondaryButtonText}>Cargar alias</Text>
                  </TouchableOpacity>
                  <Text style={styles.cardEyebrow}>Alias guardados</Text>
                  {roleAliases.length === 0 ? <Text style={styles.cardText}>No hay alias cargados.</Text> : null}
                  {roleAliases.map((alias) => (
                    <View key={alias.id} style={[styles.adminListRow, !alias.is_active && styles.lockedCard]}>
                      <Ionicons name="copy-outline" size={20} color={palette.red} />
                      <View style={styles.adminUserHeaderText}>
                        <Text style={styles.adminQuickText}>{alias.display_label}</Text>
                        <Text style={styles.cardText}>Base: {roleLabel(alias.base_role as Role)} - {alias.province ?? 'Global'} - {alias.is_active ? 'activo' : 'inactivo'}</Text>
                      </View>
                      <TouchableOpacity style={styles.actionPill} onPress={() => toggleSavedRoleAlias(alias.id, !alias.is_active)}>
                        <Text style={styles.actionPillText}>{alias.is_active ? 'Desactivar' : 'Activar'}</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : null}

              {adminModule === 'configuracion' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Configuración general</Text>
                  <Text style={styles.cardText}>Base para mantenimiento, aviso global, permisos, módulos activos, foro y chat.</Text>
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Mensaje visible durante mantenimiento" value={adminConfigDraft.settings.globalMessage} onChangeText={(value) => updateAdminConfigSection('settings', { globalMessage: value })} multiline  placeholderTextColor={inputPlaceholderColor} />
                  {[
                    { key: 'maintenanceMode', label: 'Modo mantenimiento' },
                    { key: 'futureForumEnabled', label: 'Preparar foro' }
                  ].map((item) => {
                    const key = item.key as keyof AppAdminConfig['settings'];
                    const active = Boolean(adminConfigDraft.settings[key]);
                    return (
                      <TouchableOpacity key={item.key} style={[styles.adminListRow, active && styles.adminListRowActive]} onPress={() => updateAdminConfigSection('settings', { [key]: !active } as Partial<AppAdminConfig['settings']>)}>
                        <Ionicons name={active ? 'toggle' : 'toggle-outline'} size={24} color={active ? palette.red : palette.inkMuted} />
                        <Text style={styles.adminQuickText}>{item.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  <Text style={styles.cardEyebrow}>Orden de navegación</Text>
                  <Text style={styles.cardText}>El orden y visibilidad se administran desde Contenido.</Text>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => saveAdminConfigDraft('Configuración general')}>
                    <Text style={styles.primaryButtonText}>Guardar configuración</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {adminModule === 'usuarios' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Usuarios registrados</Text>
                  {session.role !== 'administrador' ? (
                    <Text style={styles.cardText}>Tu rango puede revisar y gestionar usuarios dentro de su alcance. Crear usuarios, confirmar mails y eliminar accesos queda reservado al Administrador.</Text>
                  ) : (
                    <View style={styles.profileCommunityPanel}>
                      <Text style={styles.cardEyebrow}>Crear usuario básico</Text>
                      <Text style={styles.cardText}>Crea una cuenta habilitada con mail y contraseña. Al ingresar, el usuario deberá completar provincia y comunidad.</Text>
                      <Text style={styles.inputLabel}>Mail</Text>
                      <TextInput style={styles.input} placeholder="Ingresá el correo electrónico" value={adminCreateEmail} onChangeText={setAdminCreateEmail} autoCapitalize="none" keyboardType="email-address"  placeholderTextColor={inputPlaceholderColor} />
                      <Text style={styles.inputLabel}>Contraseña</Text>
                      <View style={styles.passwordInputWrap}>
                        <TextInput
                          style={[styles.input, styles.inputWithIcon]}
                          placeholder="Mínimo 6 caracteres"
                          value={adminCreatePassword}
                          onChangeText={setAdminCreatePassword}
                          secureTextEntry={!adminCreatePasswordVisible}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                         placeholderTextColor={inputPlaceholderColor} />
                        <TouchableOpacity style={styles.passwordEyeButton} onPress={() => setAdminCreatePasswordVisible(!adminCreatePasswordVisible)} activeOpacity={0.82}>
                          <Ionicons name={adminCreatePasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={palette.red} />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity style={styles.primaryButton} onPress={createBasicAdminUser}>
                        <Text style={styles.primaryButtonText}>Crear usuario</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <TextInput style={styles.input} placeholder="Buscar usuario por nombre" value={adminUserSearch} onChangeText={setAdminUserSearch}  placeholderTextColor={inputPlaceholderColor} />
                  <TouchableOpacity style={styles.primaryButton} onPress={loadAdminUsers}>
                    <Text style={styles.primaryButtonText}>Cargar usuarios disponibles</Text>
                  </TouchableOpacity>
                  {session.role === 'administrador' ? (
                    <View style={styles.profileCommunityPanel}>
                      <Text style={styles.cardEyebrow}>Diagnostico y liberacion de login</Text>
                      <Text style={styles.cardText}>Usalo cuando un mail no puede ingresar, no aparece en usuarios o quedo atrapado en Auth/Profile.</Text>
                      <TextInput style={styles.input} placeholder="Mail a diagnosticar" value={adminDiagnosticEmail} onChangeText={setAdminDiagnosticEmail} autoCapitalize="none" keyboardType="email-address"  placeholderTextColor={inputPlaceholderColor} />
                      <View style={styles.inlineActions}>
                        <TouchableOpacity style={styles.secondaryButton} onPress={diagnoseUserLogin}>
                          <Ionicons name="search-outline" size={17} color={palette.red} />
                          <Text style={styles.secondaryButtonText}>Diagnosticar login</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryButton} onPress={repairUserLogin}>
                          <Ionicons name="construct-outline" size={17} color={palette.red} />
                          <Text style={styles.secondaryButtonText}>Reparar usuario</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryButton} onPress={deleteUserByDiagnosticEmail}>
                          <Ionicons name="trash-outline" size={17} color={palette.red} />
                          <Text style={styles.secondaryButtonText}>Eliminar y liberar mail</Text>
                        </TouchableOpacity>
                      </View>
                      {adminLoginDiagnostic ? (
                        <View style={styles.innerNewsCard}>
                          <Text style={styles.cardTitle}>Informe de {adminLoginDiagnostic.searched_email}</Text>
                          <Text style={styles.cardText}>Auth: {adminLoginDiagnostic.auth_exists ? 'existe' : 'no existe'} ({adminLoginDiagnostic.auth_count})</Text>
                          <Text style={styles.cardText}>Auth email: {adminLoginDiagnostic.auth_email ?? 'sin email'} - creado: {adminLoginDiagnostic.auth_created_at ? new Date(adminLoginDiagnostic.auth_created_at).toLocaleString('es-AR') : 'sin fecha'}</Text>
                          <Text style={styles.cardText}>Identities: {adminLoginDiagnostic.identity_exists ? 'existe' : 'no existe'} ({adminLoginDiagnostic.identities_count ?? 0}) - {adminLoginDiagnostic.identities_provider ?? 'sin provider'}</Text>
                          <Text style={styles.cardText}>Profile: {adminLoginDiagnostic.profile_exists ? 'existe' : 'no existe'} ({adminLoginDiagnostic.profile_count})</Text>
                          <Text style={styles.cardText}>Confirmado: {adminLoginDiagnostic.email_confirmed_at ? 'si' : 'no'}</Text>
                          <Text style={styles.cardText}>Estado/Rol: {adminLoginDiagnostic.profile_status ?? adminLoginDiagnostic.status ?? 'sin estado'} - {adminLoginDiagnostic.profile_role ?? adminLoginDiagnostic.role ?? 'sin rol'}</Text>
                          <Text style={styles.cardText}>Provincia/Comunidad: {adminLoginDiagnostic.province ?? 'sin provincia'} - {adminLoginDiagnostic.community ?? 'sin comunidad'}</Text>
                          <Text style={styles.cardText}>Backups: {adminLoginDiagnostic.backups_exists ? `si (${adminLoginDiagnostic.backup_count ?? 0})` : 'no'}</Text>
                          <Text style={styles.cardText}>Solicitudes/Tokens/Mensajes: {adminLoginDiagnostic.user_requests_exists ? 'solicitudes ' : ''}{adminLoginDiagnostic.device_push_tokens_exists ? 'tokens ' : ''}{adminLoginDiagnostic.internal_messages_exists ? 'mensajes' : ''}{(!adminLoginDiagnostic.user_requests_exists && !adminLoginDiagnostic.device_push_tokens_exists && !adminLoginDiagnostic.internal_messages_exists) ? 'sin relaciones visibles' : ''}</Text>
                          <Text style={styles.cardText}>Tablas afectadas: {adminLoginDiagnostic.affected_tables?.length ? adminLoginDiagnostic.affected_tables.join(' | ') : 'sin tablas activas detectadas'}</Text>
                          <Text style={styles.cardText}>Inconsistencias: {adminLoginDiagnostic.inconsistencies?.length ? adminLoginDiagnostic.inconsistencies.join(' | ') : 'Sin inconsistencias evidentes'}</Text>
                          <Text style={styles.cardText}>Causa probable: {adminLoginDiagnostic.possible_cause}</Text>
                          <Text style={styles.cardText}>Accion recomendada: {adminLoginDiagnostic.recommended_action}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                  <View style={styles.profileCommunityPanel}>
                    <Text style={styles.cardEyebrow}>Coordinaciones activas</Text>
                    <Text style={styles.cardText}>Coordinador Nacional: {activeNationalCoordinator?.full_name ?? activeNationalCoordinator?.email ?? 'Sin coordinador activo cargado'}</Text>
                    {selectedUsersProvince ? <Text style={styles.cardText}>Coordinador Diocesano en {selectedUsersProvince}: {activeDiocesanCoordinator?.full_name ?? activeDiocesanCoordinator?.email ?? 'Sin coordinador activo'}</Text> : null}
                  </View>
                  {adminUsers.length === 0 ? <Text style={styles.cardText}>No hay usuarios cargados.</Text> : null}
                  {userProvinceOptions.length > 0 ? (
                    <>
                      <Text style={styles.cardEyebrow}>Provincia</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                        {userProvinceOptions.map((province) => (
                          <TouchableOpacity key={province} style={[styles.filterChip, selectedUsersProvince === province && styles.filterChipActive]} onPress={() => { setSelectedUsersProvince(province); setSelectedAdminUserId(''); }}>
                            <Text style={[styles.filterChipText, selectedUsersProvince === province && styles.filterChipTextActive]}>{province}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  ) : null}
                  {selectedUsersProvince ? (
                    <View style={styles.profileCommunityPanel}>
                      <Text style={styles.cardEyebrow}>{selectedUsersProvince}</Text>
                      {visibleAdminUsers.length === 0 ? <Text style={styles.cardText}>No hay usuarios para esta provincia.</Text> : null}
                      {visibleAdminUsers.map((user) => {
                        const selected = selectedAdminUserId === user.id;
                        const canEditThisUser = canEditAdminUser(session, user);
                        return (
                          <View key={user.id}>
                            <TouchableOpacity style={[styles.innerNewsCard, !canEditThisUser && styles.lockedCard]} onPress={() => canEditThisUser ? setSelectedAdminUserId(selected ? '' : user.id) : setAuthMessage('No podes editar administradores, usuarios superiores o usuarios fuera de tu alcance.')}>
                              <View style={styles.adminUserHeader}>
                                <View style={styles.adminUserAvatar}>
                                  {user.avatar_url ? <Image source={{ uri: user.avatar_url }} style={styles.adminUserAvatarImage} /> : <Ionicons name="person-outline" size={20} color={palette.red} />}
                                </View>
                                <View style={styles.adminUserHeaderText}>
                                  <Text style={styles.cardTitle}>{user.full_name ?? 'Usuario sin nombre'}</Text>
                                  <Text style={styles.cardText}>{user.status} - {displayRoleLabel((user.role || 'palestrista') as Role, user.province, provinceRoleLabels, adminConfig.settings.roleAliases, user.display_role_label)} - {user.community_name ?? 'Sin comunidad'}</Text>
                                  {session.role === 'administrador' ? <Text style={styles.cardText}>{user.email ?? 'Sin email'}</Text> : null}
                                </View>
                              </View>
                              {session.role === 'administrador' ? <Text style={styles.cardText}>Email: {user.email_confirmed_at ? 'confirmado' : 'sin confirmar'}</Text> : null}
                              <TouchableOpacity
                                style={styles.actionPill}
                                onPress={() => openPublicProfile({
                                  id: user.id,
                                  fullName: user.full_name ?? 'Usuario sin nombre',
                                  role: (user.role || 'palestrista') as Role,
                                  province: user.province,
                                  communityName: user.community_name,
                                  avatarUrl: user.avatar_url,
                                  contact: user.phone ?? ''
                                })}
                              >
                                <Ionicons name="person-circle-outline" size={16} color={palette.red} />
                                <Text style={styles.actionPillText}>Ver perfil</Text>
                              </TouchableOpacity>
                              <Text style={styles.expandHint}>{canEditThisUser ? (selected ? 'Cerrar edición' : 'Editar usuario') : 'Edición bloqueada por jerarquía'}</Text>
                            </TouchableOpacity>
                            {selected ? (
                              <View style={styles.adminInlineEditor}>
                                <TextInput style={styles.input} placeholder="Nombre y apellido" value={adminUserFullName} onChangeText={setAdminUserFullName}  placeholderTextColor={inputPlaceholderColor} />
                                {session.role === 'administrador' ? (
                                  <>
                                    <TextInput style={styles.input} placeholder="Email" value={adminUserEmail} onChangeText={setAdminUserEmail} autoCapitalize="none"  placeholderTextColor={inputPlaceholderColor} />
                                    <TextInput style={styles.input} placeholder="Nueva contraseña opcional" value={adminUserPassword} onChangeText={setAdminUserPassword} secureTextEntry  placeholderTextColor={inputPlaceholderColor} />
                                  </>
                                ) : (
                                  null
                                )}
                                <TextInput style={styles.input} placeholder="Contacto" value={adminUserPhone} onChangeText={setAdminUserPhone}  placeholderTextColor={inputPlaceholderColor} />
                                <Text style={styles.cardEyebrow}>Provincia</Text>
                                <TouchableOpacity style={styles.dropdownButton} onPress={() => setAdminUserProvinceDropdownOpen(!adminUserProvinceDropdownOpen)}>
                                  <Text style={styles.dropdownButtonText}>{adminUserProvince || 'Seleccionar provincia'}</Text>
                                  <Ionicons name={adminUserProvinceDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                                </TouchableOpacity>
                                {adminUserProvinceDropdownOpen ? (
                                  <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                                    {visibleRegistrationCommunities.map((item) => (
                                      <TouchableOpacity key={item.province} style={styles.dropdownItem} onPress={() => { setAdminUserProvince(item.province); setAdminUserCommunity(''); setAdminUserProvinceDropdownOpen(false); }}>
                                        <Text style={styles.dropdownItemText}>{item.province}</Text>
                                      </TouchableOpacity>
                                    ))}
                                  </ScrollView>
                                ) : null}
                                {selectedAdminUserProvince ? (
                                  <>
                                    <Text style={styles.cardEyebrow}>Comunidad</Text>
                                    <TouchableOpacity style={styles.dropdownButton} onPress={() => setAdminUserCommunityDropdownOpen(!adminUserCommunityDropdownOpen)}>
                                      <Text style={styles.dropdownButtonText}>{adminUserCommunity || 'Seleccionar comunidad'}</Text>
                                      <Ionicons name={adminUserCommunityDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                                    </TouchableOpacity>
                                    {adminUserCommunityDropdownOpen ? (
                                      <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                                        {selectedAdminUserProvince.locations.map((item) => (
                                          <TouchableOpacity key={item.id ?? item.name} style={styles.dropdownItem} onPress={() => { setAdminUserCommunity(item.name); setAdminUserCommunityDropdownOpen(false); }}>
                                            <Text style={styles.dropdownItemText}>{item.name}</Text>
                                          </TouchableOpacity>
                                        ))}
                                      </ScrollView>
                                    ) : null}
                                  </>
                                ) : null}
                                <Text style={styles.cardEyebrow}>Estado</Text>
                                <View style={styles.filterRow}>
                                  {['pendiente', 'aprobado', 'bloqueado'].map((status) => (
                                    <TouchableOpacity key={status} style={[styles.filterChip, adminUserStatus === status && styles.filterChipActive]} onPress={() => setAdminUserStatus(status)}>
                                      <Text style={[styles.filterChipText, adminUserStatus === status && styles.filterChipTextActive]}>{status}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                                <Text style={styles.cardEyebrow}>Rol</Text>
                                <TouchableOpacity style={styles.dropdownButton} onPress={() => setAdminUserRoleDropdownOpen(!adminUserRoleDropdownOpen)}>
                                  <Text style={styles.dropdownButtonText}>{displayRoleLabel(adminUserRole, adminUserProvince, provinceRoleLabels, adminConfig.settings.roleAliases, adminUserDisplayRoleLabel)}</Text>
                                  <Ionicons name={adminUserRoleDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                                </TouchableOpacity>
                                {adminUserRoleDropdownOpen ? (
                                  <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                                    {roleDefinitions.filter((role) => role.role !== 'administrador' && (role.role === selectedAdminUser?.role || assignableRoles.some((item) => item.role === role.role))).map((role) => (
                                      <TouchableOpacity key={role.role} style={styles.dropdownItem} onPress={() => { setAdminUserRole(role.role as Role); setAdminUserDisplayRoleLabel(''); setAdminUserRoleDropdownOpen(false); }}>
                                        <Text style={styles.dropdownItemText}>{role.label}</Text>
                                      </TouchableOpacity>
                                    ))}
                                  </ScrollView>
                                ) : null}
                                <Text style={styles.cardEyebrow}>Alias asignable</Text>
                                <TouchableOpacity style={styles.dropdownButton} onPress={() => setAdminUserRoleAliasDropdownOpen(!adminUserRoleAliasDropdownOpen)}>
                                  <Text style={styles.dropdownButtonText}>{adminUserDisplayRoleLabel || 'Sin alias: usar nombre del rol base'}</Text>
                                  <Ionicons name={adminUserRoleAliasDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                                </TouchableOpacity>
                                {adminUserRoleAliasDropdownOpen ? (
                                  <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                                    <TouchableOpacity style={styles.dropdownItem} onPress={() => { setAdminUserDisplayRoleLabel(''); setAdminUserRoleAliasDropdownOpen(false); }}>
                                      <Text style={styles.dropdownItemText}>Sin alias</Text>
                                    </TouchableOpacity>
                                    {roleAliases
                                      .filter((alias) => alias.is_active && (!alias.province || !adminUserProvince || alias.province === adminUserProvince))
                                      .filter((alias) => alias.base_role === selectedAdminUser?.role || assignableRoles.some((item) => item.role === alias.base_role))
                                      .map((alias) => (
                                        <TouchableOpacity key={alias.id} style={styles.dropdownItem} onPress={() => {
                                          setAdminUserRole(alias.base_role as Role);
                                          setAdminUserDisplayRoleLabel(alias.display_label);
                                          setAdminUserRoleAliasDropdownOpen(false);
                                        }}>
                                          <Text style={styles.dropdownItemText}>{alias.display_label} ({roleLabel(alias.base_role as Role)})</Text>
                                        </TouchableOpacity>
                                      ))}
                                  </ScrollView>
                                ) : null}
                                <Text style={styles.cardText}>Los alias heredan permisos y jerarquia del rol base seleccionado.</Text>
                                <TouchableOpacity style={styles.primaryButton} onPress={saveAdminUser}>
                                  <Text style={styles.primaryButtonText}>Guardar usuario</Text>
                                </TouchableOpacity>
                                {session.role === 'administrador' ? (
                                  <>
                                    <TouchableOpacity style={styles.secondaryButton} onPress={confirmSelectedUserEmail}>
                                      <Text style={styles.secondaryButtonText}>Confirmar email</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.secondaryButton} onPress={deleteSelectedAdminUser}>
                                      <Ionicons name="trash-outline" size={17} color={palette.red} />
                                      <Text style={styles.secondaryButtonText}>Eliminar usuario</Text>
                                    </TouchableOpacity>
                                  </>
                                ) : null}
                              </View>
                            ) : null}
                          </View>
                        );
                      })}
                    </View>
                  ) : adminUsers.length > 0 ? <Text style={styles.cardText}>Elegir una provincia para ver sus usuarios.</Text> : null}
                  <View style={styles.profileCommunityPanel}>
                    <Text style={styles.cardEyebrow}>Pendientes rapido</Text>
                    <TouchableOpacity style={styles.secondaryButton} onPress={loadPendingProfiles}>
                      <Text style={styles.secondaryButtonText}>Cargar pendientes</Text>
                    </TouchableOpacity>
                    {realPendingProfiles.map((user) => (
                      <View key={user.id} style={styles.innerNewsCard}>
                        <Text style={styles.cardTitle}>{user.full_name}</Text>
                        <Text style={styles.cardText}>Rol actual: {user.role}</Text>
                        <Text style={styles.cardText}>Comunidad: {user.community_name ?? 'Sin comunidad'}</Text>
                        <TouchableOpacity style={styles.secondaryButton} onPress={() => approvePendingProfile(user.id, 'palestrista')}>
                          <Text style={styles.secondaryButtonText}>Aprobar como Palestrista</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {adminModule === 'solicitudes' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Solicitudes</Text>
                  <View style={styles.filterRow}>
                    <TouchableOpacity style={[styles.filterChip, requestSubtab === 'pendientes' && styles.filterChipActive]} onPress={() => setRequestSubtab('pendientes')}>
                      <Text style={[styles.filterChipText, requestSubtab === 'pendientes' && styles.filterChipTextActive]}>Pendientes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.filterChip, requestSubtab === 'resueltas' && styles.filterChipActive]} onPress={() => setRequestSubtab('resueltas')}>
                      <Text style={[styles.filterChipText, requestSubtab === 'resueltas' && styles.filterChipTextActive]}>Resueltas</Text>
                    </TouchableOpacity>
                  </View>
                  {requestSubtab === 'pendientes' && pendingAdminRequests.length === 0 ? <Text style={styles.cardText}>No hay solicitudes pendientes.</Text> : null}
                  {requestSubtab === 'pendientes' ? pendingAdminRequests.map((item, index) => (
                    <View key={item.id} style={styles.innerNewsCard}>
                      <Text style={styles.cardEyebrow}>Llegada #{index + 1} - {new Date(item.createdAt).toLocaleDateString('es-AR')}</Text>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardText}>Solicitante: {item.requester}</Text>
                      {item.communityName ? <Text style={styles.cardText}>Comunidad: {item.communityName}</Text> : null}
                      {item.targetUserName ? <Text style={styles.cardText}>Sucesor propuesto: {item.targetUserName} - {roleLabel((item.targetRole ?? 'palestrista') as Role)}</Text> : null}
                      <Text style={styles.cardText}>Definicion: {item.definition}</Text>
                      <TextInput style={[styles.input, styles.textArea]} placeholder="Mensaje opcional para el usuario" value={adminRequestMessage} onChangeText={setAdminRequestMessage} multiline  placeholderTextColor={inputPlaceholderColor} />
                      {item.title === 'Solicitud de perseverancia' ? (
                        <View style={styles.profileCommunityPanel}>
                          <Text style={styles.cardEyebrow}>Rol a designar si se aprueba</Text>
                          <TouchableOpacity style={styles.dropdownButton} onPress={() => setPerseveranceRoleDropdownOpen(!perseveranceRoleDropdownOpen)}>
                            <Text style={styles.dropdownButtonText}>{roleLabel(perseveranceRole)}</Text>
                            <Ionicons name={perseveranceRoleDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                          </TouchableOpacity>
                          {perseveranceRoleDropdownOpen ? (
                            <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                              {assignableRoles.filter((role) => role.role !== 'palestrista').map((role) => (
                                <TouchableOpacity key={role.role} style={styles.dropdownItem} onPress={() => { setPerseveranceRole(role.role as Role); setPerseveranceRoleDropdownOpen(false); }}>
                                  <Text style={styles.dropdownItemText}>{role.label}</Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          ) : null}
                        </View>
                      ) : null}
                      {item.title === 'Cambio de dirigencia' ? (
                        <View style={styles.profileCommunityPanel}>
                          <Text style={styles.cardEyebrow}>Resolucion de dirigencia</Text>
                          <Text style={styles.cardText}>Al aprobar se asignara {roleLabel((item.targetRole ?? 'animador_comunidad') as Role)} al sucesor propuesto.</Text>
                        </View>
                      ) : null}
                      <View style={styles.inlineActions}>
                        <TouchableOpacity style={styles.primaryButton} onPress={() => resolveAdminRequest(item.id, 'aprobada')}>
                          <Text style={styles.primaryButtonText}>Aprobar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryButton} onPress={() => resolveAdminRequest(item.id, 'denegada')}>
                          <Text style={styles.secondaryButtonText}>Denegar</Text>
                        </TouchableOpacity>
                      </View>
                      {item.title === 'Solicitud de perseverancia' ? <Text style={styles.cardText}>Al aprobar esta solicitud se asignara el rol seleccionado.</Text> : null}
                    </View>
                  )) : null}
                  {requestSubtab === 'resueltas' && resolvedAdminRequests.length === 0 ? <Text style={styles.cardText}>Todavia no hay solicitudes resueltas.</Text> : null}
                  {requestSubtab === 'resueltas' ? resolvedAdminRequests.map((item) => (
                    <View key={item.id} style={styles.innerNewsCard}>
                      <Text style={styles.cardEyebrow}>{item.status.toUpperCase()} - {new Date(item.createdAt).toLocaleDateString('es-AR')}</Text>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardText}>Solicitante: {item.requester}</Text>
                      {item.communityName ? <Text style={styles.cardText}>Comunidad: {item.communityName}</Text> : null}
                      {item.targetUserName ? <Text style={styles.cardText}>Sucesor: {item.targetUserName} - {roleLabel((item.targetRole ?? 'palestrista') as Role)}</Text> : null}
                      <Text style={styles.cardText}>Definicion: {item.definition}</Text>
                      <Text style={styles.cardText}>Resolvio: {item.resolvedBy ?? 'Sin responsable'}</Text>
                      <Text style={styles.cardText}>Fecha de resolucion: {item.resolvedAt ? new Date(item.resolvedAt).toLocaleString('es-AR') : 'Sin fecha'}</Text>
                      <Text style={styles.cardText}>Mensaje enviado: {item.message ?? 'Sin mensaje'}</Text>
                    </View>
                  )) : null}
                </View>
              ) : null}

              {adminModule === 'noticias' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Noticias</Text>
                  <Text style={styles.cardText}>Crear noticias generales, preparar borradores y marcar publicaciones destacadas.</Text>
                  <Text style={styles.cardEyebrow}>Categoria: General</Text>
                  <TextInput style={styles.input} placeholder="Titulo de la noticia" value={adminNewsTitle} onChangeText={setAdminNewsTitle}  placeholderTextColor={inputPlaceholderColor} />
                  <TextInput style={styles.input} placeholder="Bajada o resumen breve" value={adminNewsImage} onChangeText={setAdminNewsImage}  placeholderTextColor={inputPlaceholderColor} />
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Contenido completo de la noticia" value={adminNewsBody} onChangeText={setAdminNewsBody} multiline  placeholderTextColor={inputPlaceholderColor} />
                  <View style={styles.filterRow}>
                    <TouchableOpacity style={[styles.filterChip, adminNewsDraft && styles.filterChipActive]} onPress={() => setAdminNewsDraft(!adminNewsDraft)}>
                      <Text style={[styles.filterChipText, adminNewsDraft && styles.filterChipTextActive]}>{adminNewsDraft ? 'Borrador' : 'Publicar'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.filterChip, adminNewsFeatured && styles.filterChipActive]} onPress={() => setAdminNewsFeatured(!adminNewsFeatured)}>
                      <Text style={[styles.filterChipText, adminNewsFeatured && styles.filterChipTextActive]}>Destacada</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.settingRow}>
                    <View style={styles.settingRowText}>
                      <Text style={styles.cardTitle}>Notificar usuarios</Text>
                      <Text style={styles.cardText}>{notificationPermissionLabel(session)}</Text>
                    </View>
                    <Switch value={adminNewsNotify} onValueChange={setAdminNewsNotify} />
                  </View>
                  <View style={styles.adminPreviewPane}>
                    <Text style={styles.cardEyebrow}>{adminNewsCategory}{adminNewsFeatured ? ' - destacada' : ''}</Text>
                    <Text style={styles.cardTitle}>{adminNewsTitle || 'Titulo de noticia'}</Text>
                    <Text style={styles.cardText}>{adminNewsBody || 'Previsualizacion del contenido antes de publicar.'}</Text>
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={adminNewsDraft ? () => adminSaveNewsDraft('borrador') : adminCreateNews}>
                    <Text style={styles.primaryButtonText}>{adminNewsDraft ? 'Guardar borrador' : 'Publicar noticia'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={loadNewsDrafts}>
                    <Text style={styles.secondaryButtonText}>Cargar borradores</Text>
                  </TouchableOpacity>
                  {newsDrafts.map((draft) => (
                    <View key={draft.id} style={styles.adminListRow}>
                      <Ionicons name={draft.status === 'borrador' ? 'document-outline' : 'checkmark-circle-outline'} size={19} color={palette.red} />
                      <View style={styles.adminUserHeaderText}>
                        <Text style={styles.cardTitle}>{draft.title}</Text>
                        <Text style={styles.cardText}>{draft.category} - {draft.status}{draft.is_featured ? ' - destacada' : ''}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}

              {adminModule === 'eventos' ? (
                <View style={styles.adminWorkspace}>
                <Text style={styles.cardTitle}>Crear evento {tabLabel('notilestra')}</Text>
                <TextInput style={styles.input} placeholder="Titulo del evento" value={adminEventTitle} onChangeText={setAdminEventTitle}  placeholderTextColor={inputPlaceholderColor} />
                <TextInput style={[styles.input, styles.textArea]} placeholder="Descripcion o detalle del evento" value={adminEventBody} onChangeText={setAdminEventBody} multiline  placeholderTextColor={inputPlaceholderColor} />
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setAdminEventCalendarOpen(!adminEventCalendarOpen)}>
                  <Ionicons name="calendar-outline" size={17} color={palette.red} />
                  <Text style={styles.secondaryButtonText}>Seleccionar fecha</Text>
                </TouchableOpacity>
                {adminEventCalendarOpen ? (
                  <View style={styles.pmCalendarPanel}>
                    <View style={styles.pmCalendarHeader}>
                      <TouchableOpacity style={styles.pmCalendarNavButton} onPress={() => setAdminEventCalendarMonth(new Date(adminEventCalendarMonth.getFullYear(), adminEventCalendarMonth.getMonth() - 1, 1))}>
                        <Text style={styles.pmCalendarNavText}>←</Text>
                      </TouchableOpacity>
                      <Text style={styles.pmCalendarTitle}>{adminEventCalendarMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</Text>
                      <TouchableOpacity style={styles.pmCalendarNavButton} onPress={() => setAdminEventCalendarMonth(new Date(adminEventCalendarMonth.getFullYear(), adminEventCalendarMonth.getMonth() + 1, 1))}>
                        <Text style={styles.pmCalendarNavText}>→</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.pmCalendarWeekRow}>
                      {['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'].map((day) => (
                        <Text key={day} style={styles.pmWeekdayText}>{day}</Text>
                      ))}
                    </View>
                    <View style={styles.pmCalendarGrid}>
                      {Array.from({ length: new Date(adminEventCalendarMonth.getFullYear(), adminEventCalendarMonth.getMonth(), 1).getDay() }, (_, index) => (
                        <View key={`event-blank-${index}`} style={styles.pmDaySpacer} />
                      ))}
                      {Array.from({ length: new Date(adminEventCalendarMonth.getFullYear(), adminEventCalendarMonth.getMonth() + 1, 0).getDate() }, (_, index) => {
                        const day = index + 1;
                        const date = isoDate(adminEventCalendarMonth.getFullYear(), adminEventCalendarMonth.getMonth(), day);
                        const selected = adminEventDate.slice(0, 10) === date;
                        return (
                          <TouchableOpacity key={date} style={[styles.pmDayButton, selected && styles.pmDayButtonSelected]} onPress={() => selectAdminEventDate(date)}>
                            <Text style={[styles.pmDayText, selected && styles.pmDayTextSelected]}>{day}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
                <TextInput style={styles.input} placeholder="Fecha y hora del evento. Ej: 2026-05-28T21:00:00-03:00" value={adminEventDate} onChangeText={setAdminEventDate}  placeholderTextColor={inputPlaceholderColor} />
                <View style={styles.settingRow}>
                  <View style={styles.settingRowText}>
                    <Text style={styles.cardTitle}>Notificar usuarios</Text>
                    <Text style={styles.cardText}>{notificationPermissionLabel(session)}</Text>
                  </View>
                  <Switch value={adminEventNotify} onValueChange={setAdminEventNotify} />
                </View>
                <TouchableOpacity style={styles.primaryButton} onPress={adminCreateEvent}>
                  <Text style={styles.primaryButtonText}>Publicar evento</Text>
                </TouchableOpacity>
                </View>
              ) : null}

              {adminModule === 'comunidades' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Gestionar comunidades</Text>
                  <Text style={styles.cardText}>Crear, editar, habilitar, deshabilitar o archivar comunidades segun tu jurisdiccion.</Text>
                  <Text style={styles.cardEyebrow}>Provincia</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                    {manageableCommunities.map((item) => (
                      <TouchableOpacity
                        key={item.province}
                        style={[styles.filterChip, adminCommunityProvince === item.province && styles.filterChipActive]}
                        onPress={() => {
                          setAdminCommunityProvince(item.province);
                          setAdminCommunityId('');
                        }}
                      >
                        <Text style={[styles.filterChipText, adminCommunityProvince === item.province && styles.filterChipTextActive]}>{item.province}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {manageableCommunities.length === 0 ? <Text style={styles.cardText}>Tu rango no tiene comunidades editables.</Text> : null}
                  {canAdministrateCommunities && selectedAdminProvince ? (
                    <View style={styles.profileCommunityPanel}>
                      <Text style={styles.cardEyebrow}>Crear comunidad</Text>
                      <TextInput style={styles.input} placeholder="Nombre de comunidad" value={adminCommunityId ? '' : adminCommunityName} onChangeText={(value) => { setAdminCommunityId(''); setAdminCommunityName(value); }}  placeholderTextColor={inputPlaceholderColor} />
                      <View style={styles.filterRow}>
                        {[
                          { key: 'jovenes', label: 'Jovenes' },
                          { key: 'adultos', label: 'Adultos' }
                        ].map((item) => (
                          <TouchableOpacity key={item.key} style={[styles.filterChip, adminCommunityGroupType === item.key && styles.filterChipActive]} onPress={() => setAdminCommunityGroupType(item.key as typeof adminCommunityGroupType)}>
                            <Text style={[styles.filterChipText, adminCommunityGroupType === item.key && styles.filterChipTextActive]}>{item.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TextInput style={styles.input} placeholder="Localidad, zona o dirección" value={adminCommunityId ? '' : adminCommunityAddress} onChangeText={(value) => { setAdminCommunityId(''); setAdminCommunityAddress(value); }}  placeholderTextColor={inputPlaceholderColor} />
                      <TextInput style={styles.input} placeholder="Contacto opcional" value={adminCommunityId ? '' : adminCommunityPhone} onChangeText={(value) => { setAdminCommunityId(''); setAdminCommunityPhone(value); }}  placeholderTextColor={inputPlaceholderColor} />
                      <TextInput style={styles.input} placeholder="Dia de reunion" value={adminCommunityId ? '' : adminCommunityDay} onChangeText={(value) => { setAdminCommunityId(''); setAdminCommunityDay(value); }}  placeholderTextColor={inputPlaceholderColor} />
                      <TextInput style={styles.input} placeholder="Horario" value={adminCommunityId ? '' : adminCommunityTime} onChangeText={(value) => { setAdminCommunityId(''); setAdminCommunityTime(value); }}  placeholderTextColor={inputPlaceholderColor} />
                      <TextInput style={[styles.input, styles.textArea]} placeholder="Descripcion" value={adminCommunityId ? '' : adminCommunityDescription} onChangeText={(value) => { setAdminCommunityId(''); setAdminCommunityDescription(value); }} multiline  placeholderTextColor={inputPlaceholderColor} />
                      <TouchableOpacity style={[styles.filterChip, adminCommunityIsActive && styles.filterChipActive]} onPress={() => setAdminCommunityIsActive(!adminCommunityIsActive)}>
                        <Text style={[styles.filterChipText, adminCommunityIsActive && styles.filterChipTextActive]}>{adminCommunityIsActive ? 'Activa' : 'Inactiva'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.primaryButton} onPress={adminCreateCommunity}>
                        <Text style={styles.primaryButtonText}>Crear comunidad</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                  {selectedAdminProvince ? (
                    <>
                      <Text style={styles.cardEyebrow}>Comunidades existentes</Text>
                      <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                        {selectedAdminProvince.locations.map((item) => {
                          const itemKey = item.id ?? item.name;
                          const selected = adminCommunityId === itemKey;
                          const isActive = !('isActive' in item) || Boolean(item.isActive);
                          return (
                            <View key={itemKey}>
                              <TouchableOpacity
                                style={[styles.dropdownItem, selected && styles.communityChoiceActive]}
                                onPress={() => setAdminCommunityId(selected ? '' : itemKey)}
                              >
                                <Text style={[styles.dropdownItemText, selected && styles.filterChipTextActive]}>{item.name}</Text>
                              </TouchableOpacity>
                              {selected ? (
                                <View style={styles.adminInlineEditor}>
                                  <TextInput style={styles.input} placeholder="Nombre" value={adminCommunityName} onChangeText={setAdminCommunityName}  placeholderTextColor={inputPlaceholderColor} />
                                  <TextInput style={styles.input} placeholder="Dirección" value={adminCommunityAddress} onChangeText={setAdminCommunityAddress}  placeholderTextColor={inputPlaceholderColor} />
                                  <TextInput style={styles.input} placeholder="Numero de contacto" value={adminCommunityPhone} onChangeText={setAdminCommunityPhone}  placeholderTextColor={inputPlaceholderColor} />
                                  <TextInput style={styles.input} placeholder="Dia de reunion" value={adminCommunityDay} onChangeText={setAdminCommunityDay}  placeholderTextColor={inputPlaceholderColor} />
                                  <TextInput style={styles.input} placeholder="Horario" value={adminCommunityTime} onChangeText={setAdminCommunityTime}  placeholderTextColor={inputPlaceholderColor} />
                                  <TextInput style={[styles.input, styles.textArea]} placeholder="Descripcion e historia" value={adminCommunityDescription} onChangeText={setAdminCommunityDescription} multiline  placeholderTextColor={inputPlaceholderColor} />
                                  <Text style={styles.cardEyebrow}>Imagen de comunidad</Text>
                                  {adminCommunityImagePreview ? <Image source={{ uri: adminCommunityImagePreview }} style={styles.communityModalImage} /> : null}
                                  <TouchableOpacity style={styles.secondaryButton} onPress={pickAdminCommunityImage}>
                                    <Ionicons name="image-outline" size={17} color={palette.red} />
                                    <Text style={styles.secondaryButtonText}>{adminCommunityImagePreview ? 'Cambiar imagen' : 'Subir imagen'}</Text>
                                  </TouchableOpacity>
                                  {adminCommunityImageAsset ? <Text style={styles.cardText}>Vista previa lista. Tocá Guardar comunidad para subirla y asociarla.</Text> : null}
                                  <View style={styles.filterRow}>
                                    {canAdministrateCommunities ? (
                                      <TouchableOpacity style={styles.secondaryButton} onPress={() => adminToggleCommunityStatus(itemKey, !isActive)}>
                                        <Text style={styles.secondaryButtonText}>{isActive ? 'Deshabilitar' : 'Habilitar'}</Text>
                                      </TouchableOpacity>
                                    ) : null}
                                    {canAdministrateCommunities ? (
                                      <TouchableOpacity style={styles.secondaryButton} onPress={() => adminArchiveCommunity(itemKey)}>
                                        <Text style={styles.secondaryButtonText}>Eliminar</Text>
                                      </TouchableOpacity>
                                    ) : null}
                                  </View>
                                  <TouchableOpacity style={styles.primaryButton} onPress={adminSaveCommunity} disabled={adminCommunityImageUploading}>
                                    <Text style={styles.primaryButtonText}>{adminCommunityImageUploading ? 'Subiendo imagen...' : 'Guardar comunidad'}</Text>
                                  </TouchableOpacity>
                                </View>
                              ) : null}
                            </View>
                          );
                        })}
                      </ScrollView>
                    </>
                  ) : null}
                </View>
              ) : null}

              {adminModule === 'navegacion' ? (
                <View style={styles.navigationBuilderScreen}>
                  <View style={styles.navigationBuilderHero}>
                    <View style={styles.navigationHeroText}>
                      <Text style={styles.navigationHeroEyebrow}>Constructor visual</Text>
                      <Text style={styles.navigationHeroTitle}>Navegación de la app</Text>
                      <Text style={styles.navigationHeroBody}>Edita la barra inferior como un panel profesional: orden, iconos, nombres, visibilidad y roles desde una sola pantalla.</Text>
                    </View>
                    <View style={styles.navigationHeroBadge}>
                      <Ionicons name="phone-portrait-outline" size={22} color={palette.white} />
                    </View>
                  </View>

                  <View style={styles.navigationStatsRow}>
                    <View style={styles.navigationStatPill}>
                      <Text style={styles.navigationStatValue}>{editableTabs.length}</Text>
                      <Text style={styles.navigationStatLabel}>Secciones</Text>
                    </View>
                    <View style={styles.navigationStatPill}>
                      <Text style={styles.navigationStatValue}>{navigationVisibleCount}</Text>
                      <Text style={styles.navigationStatLabel}>Visibles</Text>
                    </View>
                    <View style={styles.navigationStatPill}>
                      <Text style={styles.navigationStatValue}>{navigationLockedCount}</Text>
                      <Text style={styles.navigationStatLabel}>Base</Text>
                    </View>
                  </View>

                  <View style={styles.navigationPhonePreview}>
                    <View style={styles.navigationPhoneTop}>
                      <View>
                        <Text style={styles.navigationPhoneTitle}>Palestra</Text>
                        <Text style={styles.navigationPhoneSub}>Vista previa en vivo</Text>
                      </View>
                      <View style={styles.navigationPhoneStatus} />
                    </View>
                    <View style={styles.navigationPreviewContent}>
                      <Text style={styles.navigationPreviewLabel}>Barra inferior</Text>
                      <Text style={styles.navigationPreviewHint}>Los cambios de esta pantalla impactan globalmente al refrescar la app.</Text>
                    </View>
                    <View style={styles.navPreviewBar}>
                      {editableTabs.slice(0, 7).map((tab) => {
                        const draft = editingTabs[tab.key] ?? { label: tab.label, iconName: tab.icon, isVisible: tab.visible, visibleRoles: tab.visibleRoles };
                        const iconName = isIoniconName(draft.iconName) ? draft.iconName : 'help-circle-outline';
                        const selected = selectedNavigationTab?.key === tab.key;
                        return (
                          <TouchableOpacity key={`preview-${tab.key}`} style={[styles.navPreviewItem, !draft.isVisible && styles.navPreviewItemHidden, selected && styles.navPreviewItemSelected]} onPress={() => setSelectedNavigationTabKey(tab.key)} activeOpacity={0.85}>
                            <Ionicons name={iconName} size={18} color={selected ? palette.white : draft.isVisible ? palette.red : palette.inkMuted} />
                            <Text numberOfLines={1} style={[styles.navPreviewText, selected && styles.navPreviewTextSelected]}>{draft.label || tab.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navigationRail}>
                    {editableTabs.map((tab, index) => {
                      const draft = editingTabs[tab.key] ?? { label: tab.label, iconName: tab.icon, isVisible: tab.visible, visibleRoles: tab.visibleRoles };
                      const iconName = isIoniconName(draft.iconName) ? draft.iconName : 'help-circle-outline';
                      const selected = selectedNavigationTab?.key === tab.key;
                      return (
                        <TouchableOpacity key={`rail-${tab.key}`} style={[styles.navigationRailItem, selected && styles.navigationRailItemActive]} onPress={() => setSelectedNavigationTabKey(tab.key)} activeOpacity={0.85}>
                          <Ionicons name={iconName} size={20} color={selected ? palette.white : palette.red} />
                          <Text numberOfLines={1} style={[styles.navigationRailText, selected && styles.navigationRailTextActive]}>{draft.label || tab.label}</Text>
                          <Text style={[styles.navigationRailMeta, selected && styles.navigationRailTextActive]}>#{index + 1}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {selectedNavigationTab && selectedNavigationDraft ? (
                    <View style={styles.navigationFocusPanel}>
                      <View style={styles.navigationFocusHeader}>
                        <View style={styles.navigationFocusIcon}>
                          <Ionicons name={isIoniconName(selectedNavigationDraft.iconName) ? selectedNavigationDraft.iconName : 'help-circle-outline'} size={28} color={palette.red} />
                        </View>
                        <View style={styles.adminUserHeaderText}>
                          <Text style={styles.navigationFocusTitle}>{selectedNavigationDraft.label || selectedNavigationTab.label}</Text>
                          <Text style={styles.feedMeta}>Clave interna: {selectedNavigationTab.key}</Text>
                          <Text style={styles.feedMeta}>Orden actual: {selectedNavigationTab.sortOrder}</Text>
                        </View>
                      </View>

                      <View style={styles.navigationFieldGrid}>
                        <View style={styles.navigationField}>
                          <Text style={styles.cardEyebrow}>Nombre visible</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Ej: Noticias"
                            value={selectedNavigationDraft.label}
                            onChangeText={(value) => setEditingTabs((current) => ({ ...current, [selectedNavigationTab.key]: { ...selectedNavigationDraft, label: value } }))}
                           placeholderTextColor={inputPlaceholderColor} />
                        </View>
                        <View style={styles.navigationField}>
                          <Text style={styles.cardEyebrow}>Icono Ionicons</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Ej: newspaper-outline"
                            value={selectedNavigationDraft.iconName}
                            onChangeText={(value) => setEditingTabs((current) => ({ ...current, [selectedNavigationTab.key]: { ...selectedNavigationDraft, iconName: value } }))}
                            autoCapitalize="none"
                           placeholderTextColor={inputPlaceholderColor} />
                        </View>
                      </View>

                      <Text style={styles.cardEyebrow}>Iconos rápidos</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navigationIconPicker}>
                        {navigationIconSuggestions.map((icon) => (
                          <TouchableOpacity key={icon} style={[styles.navigationIconChoice, selectedNavigationDraft.iconName === icon && styles.navigationIconChoiceActive]} onPress={() => setEditingTabs((current) => ({ ...current, [selectedNavigationTab.key]: { ...selectedNavigationDraft, iconName: icon } }))}>
                            <Ionicons name={icon} size={21} color={selectedNavigationDraft.iconName === icon ? palette.white : palette.red} />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      <View style={styles.navigationActionGrid}>
                        <TouchableOpacity style={styles.navigationMiniAction} onPress={() => adminMoveTab(selectedNavigationTab.key, -1)} disabled={editableTabs[0]?.key === selectedNavigationTab.key}>
                          <Ionicons name="arrow-back-outline" size={17} color={palette.red} />
                          <Text style={styles.navigationMiniActionText}>Mover izq.</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.navigationMiniAction} onPress={() => adminMoveTab(selectedNavigationTab.key, 1)} disabled={editableTabs[editableTabs.length - 1]?.key === selectedNavigationTab.key}>
                          <Ionicons name="arrow-forward-outline" size={17} color={palette.red} />
                          <Text style={styles.navigationMiniActionText}>Mover der.</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.navigationMiniAction, selectedNavigationDraft.isVisible && styles.navigationMiniActionActive]}
                          onPress={() => setEditingTabs((current) => ({ ...current, [selectedNavigationTab.key]: { ...selectedNavigationDraft, isVisible: !selectedNavigationDraft.isVisible } }))}
                        >
                          <Ionicons name={selectedNavigationDraft.isVisible ? 'eye-outline' : 'eye-off-outline'} size={17} color={selectedNavigationDraft.isVisible ? palette.white : palette.red} />
                          <Text style={[styles.navigationMiniActionText, selectedNavigationDraft.isVisible && styles.navigationMiniActionTextActive]}>{selectedNavigationDraft.isVisible ? 'Visible' : 'Oculta'}</Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.cardEyebrow}>Roles que ven esta sección</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                        {visibleHierarchyFor(session).map((role) => {
                          const roles = selectedNavigationDraft.visibleRoles ?? visibleHierarchyFor(session).map((item) => item.role);
                          const checked = roles.includes(role.role);
                          return (
                            <TouchableOpacity key={role.role} style={[styles.filterChip, checked && styles.filterChipActive]} onPress={() => updateTabRole(selectedNavigationTab.key, role.role as Role, !checked)}>
                              <Text style={[styles.filterChipText, checked && styles.filterChipTextActive]}>{role.label}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>

                      <View style={styles.inlineActions}>
                        <TouchableOpacity style={styles.primaryButton} onPress={() => adminSaveTab(selectedNavigationTab.key, selectedNavigationTab.label)}>
                          <Ionicons name="save-outline" size={17} color={palette.white} />
                          <Text style={styles.primaryButtonText}>Guardar sección</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryButton} onPress={() => adminDeleteTab(selectedNavigationTab.key)}>
                          <Ionicons name="trash-outline" size={17} color={palette.red} />
                          <Text style={styles.secondaryButtonText}>{(!protectedTabKeys.has(selectedNavigationTab.key) && !defaultTabByKey.has(selectedNavigationTab.key)) ? 'Eliminar' : 'No eliminable'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}

                  <View style={styles.navigationCreatePanel}>
                    <View style={styles.navigationCreateHeader}>
                      <Ionicons name="add-circle-outline" size={22} color={palette.red} />
                      <Text style={styles.navigationFocusTitle}>Nueva sección</Text>
                    </View>
                    <TextInput style={styles.input} placeholder="Nombre visible. Ej: Noticias" value={newTabLabel} onChangeText={setNewTabLabel}  placeholderTextColor={inputPlaceholderColor} />
                    <TextInput style={styles.input} placeholder="Clave interna. Ej: noticias" value={newTabKey} onChangeText={(value) => setNewTabKey(normalizeTabKey(value))} autoCapitalize="none"  placeholderTextColor={inputPlaceholderColor} />
                    <TextInput style={styles.input} placeholder="Icono. Ej: newspaper-outline" value={newTabIcon} onChangeText={setNewTabIcon} autoCapitalize="none"  placeholderTextColor={inputPlaceholderColor} />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navigationIconPicker}>
                      {navigationIconSuggestions.map((icon) => (
                        <TouchableOpacity key={`new-${icon}`} style={[styles.navigationIconChoice, newTabIcon === icon && styles.navigationIconChoiceActive]} onPress={() => setNewTabIcon(icon)}>
                          <Ionicons name={icon} size={21} color={newTabIcon === icon ? palette.white : palette.red} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <Text style={styles.cardEyebrow}>Roles visibles</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                      {visibleHierarchyFor(session).map((role) => (
                        <TouchableOpacity key={role.role} style={[styles.filterChip, newTabRoles.includes(role.role as Role) && styles.filterChipActive]} onPress={() => toggleNewTabRole(role.role as Role)}>
                          <Text style={[styles.filterChipText, newTabRoles.includes(role.role as Role) && styles.filterChipTextActive]}>{role.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <TouchableOpacity style={styles.primaryButton} onPress={adminCreatePage}>
                      <Ionicons name="add-circle-outline" size={17} color={palette.white} />
                      <Text style={styles.primaryButtonText}>Crear sección</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.navigationRestoreButton} onPress={adminRestoreDefaultNavigation}>
                    <Ionicons name="refresh-circle-outline" size={18} color={palette.red} />
                    <Text style={styles.secondaryButtonText}>Restaurar navegación predeterminada</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {adminModule === 'contenido_general' ? (
                <View style={styles.adminWorkspace}>
                <Text style={styles.cardTitle}>Contenido General</Text>
                <Text style={styles.cardText}>Modificar nombres de pestanas y editar el contenido completo de cada pagina.</Text>
                {session?.role === 'administrador' ? (
                  <>
                    <Text style={styles.cardEyebrow}>Crear pagina nueva</Text>
                    <TextInput style={styles.input} placeholder="Nombre de la pagina" value={newTabLabel} onChangeText={setNewTabLabel}  placeholderTextColor={inputPlaceholderColor} />
                    <Text style={styles.cardText}>Roles que pueden verla</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                      {visibleHierarchyFor(session).map((role) => (
                        <TouchableOpacity key={role.role} style={[styles.filterChip, newTabRoles.includes(role.role as Role) && styles.filterChipActive]} onPress={() => toggleNewTabRole(role.role as Role)}>
                          <Text style={[styles.filterChipText, newTabRoles.includes(role.role as Role) && styles.filterChipTextActive]}>{role.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <TouchableOpacity style={styles.primaryButton} onPress={adminCreatePage}>
                      <Text style={styles.primaryButtonText}>Crear pagina</Text>
                    </TouchableOpacity>
                    <Text style={styles.cardEyebrow}>Accesos, orden y visibilidad</Text>
                    {editableTabs.map((tab, index) => {
                      const draft = editingTabs[tab.key] ?? { label: tab.label, iconName: tab.icon, isVisible: tab.visible, visibleRoles: tab.visibleRoles };
                      return (
                        <View key={tab.key} style={styles.tabEditorRow}>
                          <Text style={styles.cardEyebrow}>{tab.key}</Text>
                          <TextInput
                            style={styles.input}
                            value={draft.label}
                            onChangeText={(value) => setEditingTabs((current) => ({ ...current, [tab.key]: { ...draft, label: value } }))}
                           placeholderTextColor={inputPlaceholderColor} />
                          <View style={styles.inlineActions}>
                            <TouchableOpacity style={styles.secondaryButton} onPress={() => adminMoveTab(tab.key, -1)} disabled={index === 0}>
                              <Text style={styles.secondaryButtonText}>Subir</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryButton} onPress={() => adminMoveTab(tab.key, 1)} disabled={index === editableTabs.length - 1}>
                              <Text style={styles.secondaryButtonText}>Bajar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.secondaryButton, draft.isVisible && styles.filterChipActive]}
                              onPress={() => setEditingTabs((current) => ({ ...current, [tab.key]: { ...draft, isVisible: !draft.isVisible } }))}
                            >
                              <Text style={[styles.secondaryButtonText, draft.isVisible && styles.filterChipTextActive]}>{draft.isVisible ? 'Visible' : 'Oculta'}</Text>
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity style={styles.primaryButton} onPress={() => adminSaveTab(tab.key, tab.label)}>
                            <Text style={styles.primaryButtonText}>Guardar pestana</Text>
                          </TouchableOpacity>
                          <Text style={styles.cardEyebrow}>Visible para roles</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                            {visibleHierarchyFor(session).map((role) => {
                              const roles = draft.visibleRoles ?? visibleHierarchyFor(session).map((item) => item.role);
                              const checked = roles.includes(role.role);
                              return (
                                <TouchableOpacity key={role.role} style={[styles.filterChip, checked && styles.filterChipActive]} onPress={() => updateTabRole(tab.key, role.role as Role, !checked)}>
                                  <Text style={[styles.filterChipText, checked && styles.filterChipTextActive]}>{role.label}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>
                      );
                    })}
                  </>
                ) : (
                  <Text style={styles.cardText}>La creacion, orden y visibilidad de accesos queda reservada al administrador.</Text>
                )}
                <Text style={styles.cardEyebrow}>Contenido de pagina</Text>
                <Text style={styles.cardText}>Editor por bloques: podes mover, borrar, cambiar titulos, texto e imagenes.</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                  {editableTabs.filter((tab) => tab.key !== 'perfil').map((tab) => (
                    <TouchableOpacity
                      key={tab.key}
                      style={[styles.filterChip, selectedContentTab === tab.key && styles.filterChipActive]}
                      onPress={() => setSelectedContentTab(tab.key)}
                    >
                      <Text style={[styles.filterChipText, selectedContentTab === tab.key && styles.filterChipTextActive]}>{tab.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TextInput style={styles.input} placeholder="Título de la sección" value={contentTitle} onChangeText={setContentTitle}  placeholderTextColor={inputPlaceholderColor} />
                <TextInput style={[styles.input, styles.textArea]} placeholder="Texto de la sección" value={contentBody} onChangeText={setContentBody} multiline  placeholderTextColor={inputPlaceholderColor} />
                <View style={styles.inlineActions}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => addContentBlock('titulo')}>
                    <Text style={styles.secondaryButtonText}>+ Titulo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => addContentBlock('texto')}>
                    <Text style={styles.secondaryButtonText}>+ Texto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => addContentBlock('imagen')}>
                    <Text style={styles.secondaryButtonText}>+ Imagen</Text>
                  </TouchableOpacity>
                </View>
                {contentBlocks.map((block, index) => (
                  <View key={`${block.id}-${index}`} style={styles.blockEditorCard}>
                    <Text style={styles.cardEyebrow}>{block.type}</Text>
                    <TextInput
                      style={[styles.input, block.type === 'texto' && styles.textArea]}
                      placeholder={block.type === 'imagen' ? 'URL de imagen' : 'Contenido'}
                      value={block.value}
                      onChangeText={(value) => updateContentBlock(block.id, value)}
                      multiline={block.type !== 'titulo'}
                     placeholderTextColor={inputPlaceholderColor} />
                    <View style={styles.inlineActions}>
                      <TouchableOpacity style={styles.secondaryButton} onPress={() => moveContentBlock(index, -1)}>
                        <Text style={styles.secondaryButtonText}>Subir</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.secondaryButton} onPress={() => moveContentBlock(index, 1)}>
                        <Text style={styles.secondaryButtonText}>Bajar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.secondaryButton} onPress={() => deleteContentBlock(block.id)}>
                        <Text style={styles.secondaryButtonText}>Borrar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={styles.primaryButton} onPress={adminSaveContent}>
                  <Text style={styles.primaryButtonText}>Guardar contenido</Text>
                </TouchableOpacity>
                </View>
              ) : null}
            </View>
              )
          ) : null}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Perfil Invitado</Text>
          <Text style={styles.cardText}>Estas navegando como invitado. Podes ver inicio, noticias publicas, comunidades, historia y contacto.</Text>
          <View style={styles.filterRow}>
            <TouchableOpacity style={[styles.filterChip, authMode === 'login' && styles.filterChipActive]} onPress={() => setAuthMode('login')}>
              <Text style={[styles.filterChipText, authMode === 'login' && styles.filterChipTextActive]}>Iniciar sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.filterChip, authMode === 'register' && styles.filterChipActive]} onPress={() => setAuthMode('register')}>
              <Text style={[styles.filterChipText, authMode === 'register' && styles.filterChipTextActive]}>Registrarme</Text>
            </TouchableOpacity>
          </View>
          {authMode === 'register' ? (
            <>
              <SectionTitle title="Queres ser parte de Palestra?" />
              <Text style={styles.cardText}>Registrate como Palestrista. Tu perfil queda pendiente hasta que un dirigente lo apruebe.</Text>
              <Text style={styles.inputLabel}>Nombre completo</Text>
              <TextInput
                style={[styles.input, authFocusedField === 'fullName' && styles.inputFocused, authErrors.fullName && styles.inputError]}
                placeholder="Ej: Juan Perez"
                value={registerFullName}
                onChangeText={(value) => { setRegisterFullName(value); setAuthErrors((current) => ({ ...current, fullName: '' })); }}
                onFocus={() => setAuthFocusedField('fullName')}
                onBlur={() => setAuthFocusedField('')}
               placeholderTextColor={inputPlaceholderColor} />
              {authErrors.fullName ? <Text style={styles.formErrorText}>{authErrors.fullName}</Text> : null}
              <Text style={styles.inputLabel}>Contacto</Text>
              <TextInput style={[styles.input, authFocusedField === 'contact' && styles.inputFocused]} placeholder="Telefono o contacto opcional" value={registerContact} onChangeText={setRegisterContact} onFocus={() => setAuthFocusedField('contact')} onBlur={() => setAuthFocusedField('')}  placeholderTextColor={inputPlaceholderColor} />
              <Text style={styles.inputLabel}>Provincia</Text>
              <TouchableOpacity style={styles.dropdownButton} onPress={() => setProvinceDropdownOpen(!provinceDropdownOpen)}>
                <Text style={styles.dropdownButtonText}>{registerProvince || 'Selecciona tu provincia'}</Text>
                <Ionicons name={provinceDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
              </TouchableOpacity>
              {authErrors.province ? <Text style={styles.formErrorText}>{authErrors.province}</Text> : null}
              {provinceDropdownOpen ? (
                <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                  {registrationCommunities.map((item) => (
                    <TouchableOpacity
                      key={item.province}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setRegisterProvince(item.province);
                        setRegisterCommunity('');
                        setAuthErrors((current) => ({ ...current, province: '', community: '' }));
                        setProvinceDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{item.province}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : null}
              {selectedRegistrationProvince ? (
                <>
                  <Text style={styles.inputLabel}>Comunidad</Text>
                  <TouchableOpacity style={styles.dropdownButton} onPress={() => setCommunityDropdownOpen(!communityDropdownOpen)}>
                    <Text style={styles.dropdownButtonText}>{registerCommunity || 'Selecciona tu comunidad'}</Text>
                    <Ionicons name={communityDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                  </TouchableOpacity>
                  {authErrors.community ? <Text style={styles.formErrorText}>{authErrors.community}</Text> : null}
                  {communityDropdownOpen ? (
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                      {selectedRegistrationProvince.locations.map((item) => (
                        <TouchableOpacity key={item.name} style={styles.dropdownItem} onPress={() => { setRegisterCommunity(item.name); setAuthErrors((current) => ({ ...current, community: '' })); setCommunityDropdownOpen(false); }}>
                          <Text style={styles.dropdownItemText}>{item.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}
          <Text style={styles.inputLabel}>Mail</Text>
          <TextInput
            style={[styles.input, authFocusedField === 'email' && styles.inputFocused, authErrors.email && styles.inputError]}
            placeholder={authMode === 'register' ? 'Ej: nombre@email.com' : 'Ingresa tu correo electronico'}
            value={authEmail}
            onChangeText={(value) => { setAuthEmail(value); setAuthErrors((current) => ({ ...current, email: '' })); }}
            autoCapitalize="none"
            keyboardType="email-address"
            onFocus={() => setAuthFocusedField('email')}
            onBlur={() => setAuthFocusedField('')}
           placeholderTextColor={inputPlaceholderColor} />
          {authErrors.email ? <Text style={styles.formErrorText}>{authErrors.email}</Text> : null}
          <Text style={styles.inputLabel}>Contraseña</Text>
          <View style={styles.passwordInputWrap}>
            <TextInput
              style={[
                styles.input,
                styles.inputWithIcon,
                authFocusedField === 'password' && styles.inputFocused,
                authErrors.password && styles.inputError
              ]}
              placeholder={authMode === 'register' ? 'Mínimo 6 caracteres' : 'Ingresá tu contraseña'}
              value={authPassword}
              onChangeText={(value) => {
                setAuthPassword(value);
                setAuthErrors((current) => ({
                  ...current,
                  password: '',
                  confirm: ''
                }));
              }}
              secureTextEntry={!authPasswordVisible}
              onFocus={() => setAuthFocusedField('password')}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
             placeholderTextColor={inputPlaceholderColor} />
            <TouchableOpacity style={styles.passwordEyeButton} onPress={() => setAuthPasswordVisible(!authPasswordVisible)} activeOpacity={0.82}>
              <Ionicons name={authPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={palette.red} />
            </TouchableOpacity>
          </View>
          {authErrors.password ? <Text style={styles.formErrorText}>{authErrors.password}</Text> : null}
          {authMode === 'register' ? (
            <>
              <Text style={styles.inputLabel}>Confirmar contraseña</Text>
              <TextInput
                style={[styles.input, authFocusedField === 'confirm' && styles.inputFocused, authErrors.confirm && styles.inputError]}
                placeholder="Repetí tu contraseña"
                value={authPasswordConfirm}
                onChangeText={(value) => { setAuthPasswordConfirm(value); setAuthErrors((current) => ({ ...current, confirm: '' })); }}
                secureTextEntry={!authPasswordVisible}
                onFocus={() => setAuthFocusedField('confirm')}
                onBlur={() => setAuthFocusedField('')}
               placeholderTextColor={inputPlaceholderColor} />
              {authErrors.confirm ? <Text style={styles.formErrorText}>{authErrors.confirm}</Text> : null}
            </>
          ) : null}
          {authMode === 'register' ? (
            <ActionButton label="Registrarme" onPress={registerReal} />
          ) : (
            <ActionButton label="Iniciar sesión" onPress={signInReal} />
          )}
          {authMessage ? <Text style={styles.cardText}>{authMessage}</Text> : null}
        </View>
      )}
    </View>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.primaryButton} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.paper
  },
  safeAreaDark: {
    backgroundColor: themePresets.dark.colors.background
  },
  authFullscreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 140,
    backgroundColor: '#081923',
    overflow: 'hidden'
  },
  authGlowOne: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    right: -94,
    top: -58,
    backgroundColor: 'rgba(45, 141, 200, 0.38)'
  },
  authGlowTwo: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    left: -86,
    bottom: -70,
    backgroundColor: 'rgba(242, 184, 75, 0.18)'
  },
  authCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 4,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)'
  },
  authScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 36,
    justifyContent: 'center'
  },
  authBrandHeader: {
    alignItems: 'flex-start',
    marginBottom: 34
  },
  authLogo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    marginBottom: 16,
    backgroundColor: palette.white
  },
  authBrandTitle: {
    color: palette.white,
    fontSize: 27,
    fontWeight: '900'
  },
  authBrandSubtitle: {
    color: 'rgba(230, 243, 245, 0.72)',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3
  },
  authHeroTitle: {
    color: palette.white,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '900',
    marginBottom: 12
  },
  authHeroText: {
    color: 'rgba(230, 243, 245, 0.78)',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
    marginBottom: 24
  },
  authFormPanel: {
    gap: 16,
    marginTop: 12
  },
  authInputLabel: {
    color: 'rgba(230, 243, 245, 0.82)',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0
  },
  authInput: {
    minHeight: 56,
    borderRadius: 18,
    paddingHorizontal: 16,
    color: palette.white,
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(230,243,245,0.16)'
  },
  authPasswordWrap: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(230,243,245,0.16)',
    flexDirection: 'row',
    alignItems: 'center'
  },
  authInputPassword: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: 16,
    color: palette.white,
    fontSize: 16,
    fontWeight: '700'
  },
  authEyeButton: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center'
  },
  authPrimaryButton: {
    minHeight: 58,
    borderRadius: 21,
    backgroundColor: '#2d8dc8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    shadowColor: '#2d8dc8',
    shadowOpacity: 0.26,
    shadowRadius: 18,
    elevation: 4
  },
  authPrimaryText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '900'
  },
  authGhostButton: {
    minHeight: 54,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230,243,245,0.24)',
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  authGhostText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '900'
  },
  authLinkText: {
    color: '#9FD8E8',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center'
  },
  authMessage: {
    color: '#E6F3F5',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  authWizardShell: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 72,
    paddingBottom: 28,
    justifyContent: 'space-between',
    gap: 16
  },
  authWizardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  authBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    minHeight: 40,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.10)'
  },
  authBackText: {
    color: palette.white,
    fontWeight: '900',
    fontSize: 12
  },
  authProgressText: {
    color: 'rgba(230,243,245,0.72)',
    fontSize: 12,
    fontWeight: '900'
  },
  authWizardCard: {
    flex: 1,
    justifyContent: 'center'
  },
  authStepContent: {
    gap: 15
  },
  authStepDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7
  },
  authStepDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(230,243,245,0.28)'
  },
  authStepDotActive: {
    width: 24,
    backgroundColor: '#2d8dc8'
  },
  authSelectButton: {
    minHeight: 56,
    borderRadius: 18,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(230,243,245,0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  authSelectText: {
    flex: 1,
    color: palette.white,
    fontSize: 15,
    fontWeight: '800'
  },
  authSelectList: {
    maxHeight: 170,
    marginTop: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(230,243,245,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(230,243,245,0.14)'
  },
  authSelectItem: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230,243,245,0.08)'
  },
  authSelectItemText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '800'
  },
  authNarrativeCard: {
    minHeight: 150,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(230,243,245,0.15)'
  },
  authNarrativeCardActive: {
    backgroundColor: '#2d8dc8',
    borderColor: '#2d8dc8'
  },
  authNarrativeTextBlock: {
    flex: 1
  },
  authNarrativeTitle: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '900'
  },
  authNarrativeTitleActive: {
    color: palette.white
  },
  authNarrativeText: {
    color: 'rgba(230,243,245,0.72)',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3
  },
  authNarrativeTextActive: {
    color: 'rgba(255,255,255,0.86)'
  },
  birthCalendar: {
    marginTop: 10,
    borderRadius: 22,
    padding: 14,
    height: 342,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(230,243,245,0.14)'
  },
  birthCalendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  birthCalendarTitleGroup: {
    alignItems: 'center',
    gap: 2
  },
  birthCalendarTitle: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'capitalize'
  },
  birthCalendarYear: {
    color: 'rgba(230,243,245,0.72)',
    fontSize: 12,
    fontWeight: '900'
  },
  birthCalendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  birthPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 10
  },
  birthPickerCell: {
    width: '22.9%',
    minHeight: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  birthWeekday: {
    width: '14.285%',
    textAlign: 'center',
    color: 'rgba(230,243,245,0.62)',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 7
  },
  birthDay: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12
  },
  birthDaySelected: {
    backgroundColor: '#2d8dc8'
  },
  birthDayText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: '800'
  },
  birthDayTextSelected: {
    color: palette.white,
    fontWeight: '900'
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34
  },
  loadingFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF'
  },
  loadingLogoFrame: {
    width: 142,
    height: 142,
    borderRadius: 71,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.16,
    shadowRadius: 24
  },
  loadingLogo: {
    width: '100%',
    height: '100%'
  },
  loadingTitle: {
    color: palette.ink,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 18
  },
  loadingSubtitle: {
    color: palette.inkMuted,
    fontSize: 14,
    marginTop: 4
  },
  loadingBarTrack: {
    width: 220,
    height: 7,
    borderRadius: 7,
    backgroundColor: palette.whiteSoft,
    overflow: 'hidden',
    marginTop: 28
  },
  loadingBarPulse: {
    width: 92,
    height: 7,
    borderRadius: 7,
    backgroundColor: palette.red
  },
  tapCircle: {
    position: 'absolute',
    zIndex: 120,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(31, 159, 209, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)'
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 0,
    backgroundColor: '#DDF1F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerDark: {
    backgroundColor: themePresets.dark.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: themePresets.dark.colors.border
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0
  },
  brandTextBlock: {
    flex: 1,
    minWidth: 0
  },
  brandLogo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: 'rgba(45, 141, 200, 0.18)',
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2
  },
  brandLogoImage: {
    width: '100%',
    height: '100%'
  },
  brand: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '800'
  },
  brandDark: {
    color: themePresets.dark.colors.text
  },
  subtitle: {
    color: palette.inkMuted,
    fontSize: 13,
    marginTop: 2
  },
  subtitleDark: {
    color: themePresets.dark.colors.muted
  },
  versionBadge: {
    color: palette.red,
    fontSize: 10,
    fontWeight: '900',
    marginTop: 2,
    textTransform: 'uppercase'
  },
  appToast: {
    position: 'absolute',
    top: 86,
    left: 18,
    right: 18,
    zIndex: 80,
    backgroundColor: palette.ink,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 5
  },
  appToastText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center'
  },
  refreshLogoIndicator: {
    position: 'absolute',
    top: 78,
    alignSelf: 'center',
    zIndex: 82,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 5
  },
  refreshLogoIndicatorDark: {
    backgroundColor: 'rgba(53,56,59,0.92)',
    borderColor: themePresets.dark.colors.border,
    shadowColor: '#000'
  },
  refreshLogoImage: {
    width: 36,
    height: 36,
    borderRadius: 18
  },
  themeTransitionLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 130,
    overflow: 'hidden'
  },
  themePaintSplash: {
    position: 'absolute',
    top: 54,
    right: 34,
    width: 86,
    height: 86,
    borderRadius: 43
  },
  themePaintDrop: {
    position: 'absolute',
    borderRadius: 999
  },
  themePaintDropOne: {
    top: 122,
    right: 86,
    width: 32,
    height: 32
  },
  themePaintDropTwo: {
    top: 38,
    right: 142,
    width: 22,
    height: 22
  },
  successToastOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12, 25, 38, 0.18)'
  },
  successToastCard: {
    minHeight: 58,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: 'rgba(45, 141, 200, 0.92)',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8
  },
  successToastText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '900'
  },
  viewAsBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: palette.blueDeep,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  viewAsBannerText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: '900',
    flex: 1
  },
  viewAsExitButton: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.16)'
  },
  viewAsExitText: {
    color: palette.white,
    fontSize: 11,
    fontWeight: '900'
  },
  inlineInfoPanel: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(45, 141, 200, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  maintenancePanel: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2
  },
  maintenanceTitle: {
    color: palette.ink,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center'
  },
  maintenanceText: {
    color: palette.ink,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    fontWeight: '700'
  },
  sessionBadge: {
    backgroundColor: 'rgba(45, 141, 200, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)',
    maxWidth: 150
  },
  sessionBadgeText: {
    color: palette.blueDeep,
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1
  },
  headerStatusColumn: {
    alignItems: 'flex-end',
    gap: 4,
    maxWidth: 156
  },
  headerDateTime: {
    color: palette.inkMuted,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 13
  },
  headerActions: {
    alignItems: 'stretch',
    gap: 4,
    flexShrink: 1
  },
  headerActionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8
  },
  headerProfileButton: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)'
  },
  headerProfileButtonText: {
    color: palette.red,
    fontSize: 12,
    fontWeight: '900'
  },
  headerMenuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 25, 38, 0.34)',
    flexDirection: 'row'
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  drawerPanel: {
    height: '100%',
    backgroundColor: '#F6FBFC',
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 20,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 12
  },
  drawerPanelDark: {
    backgroundColor: themePresets.dark.colors.surface,
    shadowColor: '#000'
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45, 141, 200, 0.12)'
  },
  drawerLogo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)'
  },
  headerPillDark: {
    backgroundColor: themePresets.dark.colors.surface,
    borderColor: themePresets.dark.colors.border
  },
  drawerHeaderText: {
    flex: 1,
    minWidth: 0
  },
  drawerTitle: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '900'
  },
  drawerTitleDark: {
    color: themePresets.dark.colors.text
  },
  drawerSubtitle: {
    color: palette.inkMuted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2
  },
  drawerSubtitleDark: {
    color: themePresets.dark.colors.muted
  },
  drawerCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)'
  },
  drawerCloseButtonDark: {
    backgroundColor: themePresets.dark.colors.surfaceSoft,
    borderColor: themePresets.dark.colors.border
  },
  drawerScroll: {
    marginTop: 14
  },
  drawerScrollContent: {
    gap: 8,
    paddingBottom: 28
  },
  drawerItem: {
    minHeight: 58,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  drawerItemDark: {
    backgroundColor: 'rgba(255,255,255,0.02)'
  },
  drawerItemActive: {
    backgroundColor: 'rgba(45, 141, 200, 0.12)'
  },
  drawerItemActiveDark: {
    backgroundColor: 'rgba(93, 167, 219, 0.18)'
  },
  drawerIconFrame: {
    width: 40,
    height: 40,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 141, 200, 0.09)'
  },
  drawerIconFrameDark: {
    backgroundColor: 'rgba(93, 167, 219, 0.14)'
  },
  drawerIconFrameActive: {
    backgroundColor: palette.red
  },
  drawerItemTextBlock: {
    flex: 1,
    minWidth: 0
  },
  drawerItemText: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '900'
  },
  drawerItemTextDark: {
    color: themePresets.dark.colors.text
  },
  drawerItemTextActive: {
    color: palette.red
  },
  drawerItemMeta: {
    color: palette.inkMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2
  },
  drawerItemMetaDark: {
    color: themePresets.dark.colors.muted
  },
  narrativeEditCard: {
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(45, 141, 200, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)'
  },
  narrativeEditCardActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  narrativeEditTextBlock: {
    flex: 1,
    minWidth: 0
  },
  narrativeEditTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '900'
  },
  narrativeEditTitleActive: {
    color: palette.white
  },
  narrativeEditText: {
    color: palette.inkMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 4
  },
  narrativeEditTextActive: {
    color: 'rgba(255,255,255,0.86)'
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 48
  },
  contentDark: {
    backgroundColor: themePresets.dark.colors.background
  },
  stack: {
    gap: 18
  },
  stackTight: {
    gap: 10
  },
  stackSmall: {
    gap: 10
  },
  hero: {
    backgroundColor: palette.red,
    borderRadius: 30,
    padding: 24,
    overflow: 'hidden',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 4,
    marginBottom: 2
  },
  heroGlow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#9FD8E8',
    opacity: 0.46,
    right: -42,
    top: -54
  },
  kicker: {
    color: palette.goldSoft,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  heroTitle: {
    color: palette.white,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 8
  },
  heroText: {
    color: 'rgba(255, 255, 255, 0.86)',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10
  },
  homeTileGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0
  },
  homeTile: {
    flex: 1,
    minWidth: 0,
    minHeight: 116,
    borderRadius: 0,
    padding: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  homeTilePrimary: {
    backgroundColor: 'transparent'
  },
  homeTileSky: {
    backgroundColor: 'transparent'
  },
  homeTileWarm: {
    backgroundColor: 'transparent'
  },
  homeTileDeep: {
    backgroundColor: 'transparent'
  },
  homeTileIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: palette.red,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 3
  },
  homeTileTitle: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 10,
    textAlign: 'center'
  },
  homeTileMeta: {
    color: palette.inkMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 15
  },
  dashboardStrip: {
    flexDirection: 'row',
    gap: 10
  },
  instagramButton: {
    minHeight: 72,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#C13584',
    shadowColor: '#C13584',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 3
  },
  instagramButtonText: {
    flex: 1
  },
  instagramButtonTitle: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '900'
  },
  instagramButtonMeta: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 13,
    fontWeight: '700'
  },
  dashboardStat: {
    flex: 1,
    minHeight: 116,
    borderRadius: 22,
    padding: 14,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.12)',
    justifyContent: 'space-between',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2
  },
  dashboardValue: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 6
  },
  dashboardLabel: {
    color: palette.inkMuted,
    fontSize: 11,
    fontWeight: '800'
  },
  featurePanel: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    gap: 12,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  featurePanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12
  },
  miniEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.white,
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.1)',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 1
  },
  miniEventDate: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: palette.red,
    alignItems: 'center',
    justifyContent: 'center'
  },
  miniEventDay: {
    color: palette.white,
    fontSize: 18,
    fontWeight: '900'
  },
  miniEventMonth: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  miniEventBody: {
    flex: 1
  },
  miniEventTitle: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '900'
  },
  miniEventScope: {
    color: palette.inkMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 21,
    fontWeight: '900',
    marginTop: 6,
    marginBottom: 2
  },
  card: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.08)',
    borderRadius: 22,
    padding: 16,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 0
  },
  feedCard: {
    gap: 10,
    borderRadius: 22,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    backgroundColor: palette.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 2
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2
  },
  feedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: 'rgba(45, 141, 200, 0.1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  feedHeaderText: {
    flex: 1
  },
  feedMeta: {
    color: palette.inkMuted,
    fontSize: 12,
    fontWeight: '700'
  },
  feedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2
  },
  libraryCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 2
  },
  libraryIcon: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: 'rgba(45, 141, 200, 0.1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  libraryBody: {
    flex: 1
  },
  provinceCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.32)'
  },
  provinceIcon: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: palette.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 2
  },
  provinceLogoMiniText: {
    color: palette.white,
    fontWeight: '900',
    fontSize: 14
  },
  provinceLogoMiniImage: {
    width: '100%',
    height: '100%'
  },
  provinceInstagramPanel: {
    gap: 10,
    marginTop: 10
  },
  provinceInstagramButton: {
    minHeight: 66,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderRadius: 18,
    padding: 10,
    backgroundColor: palette.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  provinceInstagramLogo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    backgroundColor: palette.whiteSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  provinceInstagramLogoImage: {
    width: '100%',
    height: '100%'
  },
  provinceInstagramName: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '900'
  },
  provinceLogoLarge: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.red,
    borderWidth: 3,
    borderColor: palette.gold,
    overflow: 'hidden'
  },
  provinceLogoText: {
    color: palette.white,
    fontWeight: '900',
    fontSize: 28
  },
  provinceLogoImage: {
    width: '100%',
    height: '100%'
  },
  provinceLogoModal: {
    width: 220,
    minHeight: 220,
    borderRadius: 16,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 18
  },
  provinceLogoModalText: {
    color: palette.red,
    fontWeight: '900',
    fontSize: 58
  },
  provinceLogoModalImage: {
    width: 170,
    height: 170,
    borderRadius: 18
  },
  provinceBody: {
    flex: 1
  },
  communityCard: {
    borderLeftColor: 'rgba(45, 141, 200, 0.45)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 2,
    paddingVertical: 15,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  communityRowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  communityRowBody: {
    flex: 1,
    minWidth: 0
  },
  communityQuickActions: {
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: 92
  },
  locationIconButtonSmall: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: palette.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2
  },
  communityContactButton: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 16,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.22)',
    backgroundColor: palette.white
  },
  communityContactButtonText: {
    color: palette.red,
    fontSize: 11,
    fontWeight: '900'
  },
  lockedCard: {
    opacity: 0.72
  },
  cardEyebrow: {
    color: palette.red,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6
  },
  screenIntro: {
    color: palette.inkMuted,
    fontSize: 15,
    lineHeight: 21
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.white,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 9,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1
  },
  backButtonText: {
    color: palette.red,
    fontSize: 14,
    fontWeight: '800'
  },
  cardTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6
  },
  cardText: {
    color: palette.inkMuted,
    fontSize: 15,
    lineHeight: 21
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginTop: 12,
    backgroundColor: palette.whiteSoft
  },
  expandHint: {
    color: palette.red,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10
  },
  detailPanel: {
    backgroundColor: palette.white,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    gap: 10,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2
  },
  modalPanel: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderColor: 'rgba(45, 141, 200, 0.18)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 10,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 25, 38, 0.46)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18
  },
  modalBackdropTouch: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1
  },
  modalKeyboardAvoider: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    zIndex: 2
  },
  modalScrollContent: {
    paddingBottom: 34,
    paddingTop: 2,
    gap: 10
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalItem: {
    gap: 6,
    paddingTop: 6
  },
  publicProfilePanel: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 18
  },
  publicProfileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.whiteSoft,
    borderColor: palette.line,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  publicProfileAvatarImage: {
    width: '100%',
    height: '100%'
  },
  communityModalPanel: {
    width: '100%',
    maxHeight: '86%',
    borderRadius: 30,
    paddingBottom: 12,
    overflow: 'hidden'
  },
  communityModalScroll: {
    width: '100%',
    flexGrow: 0
  },
  communityModalImage: {
    width: '100%',
    height: 176,
    borderRadius: 24,
    marginBottom: 12,
    backgroundColor: palette.whiteSoft
  },
  communityModalMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6
  },
  communityModalMetaItem: {
    flex: 1,
    minWidth: '46%',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(230, 243, 245, 0.78)'
  },
  communityModalMetaText: {
    flex: 1,
    color: palette.ink,
    fontSize: 12,
    fontWeight: '800'
  },
  groupNote: {
    backgroundColor: palette.goldSoft,
    borderColor: 'rgba(242, 184, 75, 0.42)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14
  },
  groupNoteText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20
  },
  heroMini: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderRadius: 22,
    padding: 18,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 1
  },
  contentIntro: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.12)',
    borderRadius: 20,
    padding: 14,
    gap: 6,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1
  },
  hymnPanel: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 24,
    padding: 20,
    gap: 18,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2
  },
  hymnTitle: {
    color: palette.ink,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center'
  },
  hymnStanza: {
    color: palette.ink,
    fontSize: 17,
    lineHeight: 27,
    textAlign: 'center'
  },
  flexOne: {
    flex: 1
  },
  libraryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  libraryPlainPanel: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.1)',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 4
  },
  libraryVisualPanel: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderRadius: 24,
    padding: 14,
    gap: 10,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2
  },
  libraryPlainTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '900'
  },
  libraryVisualTitle: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '900'
  },
  iconActionButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 2
  },
  locationIconButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: palette.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2
  },
  libraryEditor: {
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderRadius: 20,
    padding: 12,
    marginTop: 10,
    backgroundColor: palette.whiteSoft
  },
  libraryBodyInput: {
    minHeight: 170
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8
  },
  emptyLibraryState: {
    paddingVertical: 22,
    gap: 6
  },
  prayerListRow: {
    minHeight: 58,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23, 55, 71, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12
  },
  prayerListTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24
  },
  songListRow: {
    minHeight: 78,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23, 55, 71, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12
  },
  songThumb: {
    width: 58,
    height: 58,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(45, 141, 200, 0.1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  songThumbImage: {
    width: '100%',
    height: '100%'
  },
  songListTitle: {
    color: palette.ink,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 25
  },
  libraryMeta: {
    color: palette.inkMuted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3
  },
  draftBadge: {
    alignSelf: 'flex-start',
    color: palette.red,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 5,
    textTransform: 'uppercase'
  },
  libraryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  tinyIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)',
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center'
  },
  prayerReader: {
    backgroundColor: palette.white,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 28,
    gap: 16,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2
  },
  prayerReaderTitle: {
    color: palette.ink,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '800',
    textAlign: 'center'
  },
  prayerReaderSubtitle: {
    color: palette.inkMuted,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    fontWeight: '700'
  },
  prayerDivider: {
    width: 110,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(23, 55, 71, 0.13)',
    alignSelf: 'center',
    marginVertical: 8
  },
  prayerParagraph: {
    color: '#111827',
    fontSize: 17,
    lineHeight: 27,
    textAlign: 'left'
  },
  songReader: {
    backgroundColor: palette.white,
    borderRadius: 24,
    padding: 16,
    gap: 16,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 2
  },
  songHeroImage: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    backgroundColor: palette.whiteSoft
  },
  songReaderTitle: {
    color: palette.ink,
    fontSize: 28,
    lineHeight: 35,
    fontWeight: '900'
  },
  songReaderSubtitle: {
    color: palette.inkMuted,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800'
  },
  songDivider: {
    width: 118,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(45, 141, 200, 0.22)',
    marginVertical: 4
  },
  songStanza: {
    color: '#111827',
    fontSize: 17,
    lineHeight: 27
  },
  librarySource: {
    color: palette.inkMuted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8
  },
  pmCalendarPanel: {
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.08)',
    borderTopWidth: 3,
    borderTopColor: palette.green,
    borderRadius: 4,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    marginTop: 10,
    backgroundColor: palette.white
  },
  pmCalendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 24
  },
  pmCalendarNavButton: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pmCalendarNavText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500'
  },
  pmCalendarTitle: {
    color: '#3F3F3F',
    fontSize: 15,
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  pmCalendarWeekRow: {
    flexDirection: 'row',
    marginBottom: 12
  },
  pmWeekdayText: {
    width: `${100 / 7}%`,
    color: '#A7A7A7',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center'
  },
  pmCalendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12
  },
  pmDaySpacer: {
    width: `${100 / 7}%`,
    height: 25
  },
  pmDayButton: {
    width: `${100 / 7}%`,
    height: 25,
    borderRadius: 13,
    borderWidth: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pmDayButtonSelected: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  pmDayText: {
    color: '#777777',
    fontSize: 14,
    fontWeight: '500'
  },
  pmDayTextSelected: {
    color: palette.white
  },
  calendarCard: {
    backgroundColor: palette.white,
    borderWidth: 0,
    borderColor: palette.line,
    borderRadius: 24,
    padding: 16,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 2
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  calendarTitle: {
    color: palette.ink,
    fontSize: 17,
    fontWeight: '800',
    textTransform: 'capitalize'
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 0,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 141, 200, 0.1)'
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  calendarWeekday: {
    width: '14.285%',
    textAlign: 'center',
    color: palette.inkMuted,
    fontWeight: '800',
    marginBottom: 6
  },
  calendarDay: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  calendarEventDay: {
    backgroundColor: palette.goldSoft,
    borderRadius: 12
  },
  calendarMotivadorDay: {
    backgroundColor: 'rgba(37, 161, 123, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(37, 161, 123, 0.42)',
    borderRadius: 12
  },
  calendarActivityDay: {
    backgroundColor: palette.red,
    borderRadius: 12
  },
  calendarDayText: {
    color: palette.ink,
    fontWeight: '700'
  },
  calendarEventText: {
    color: palette.red,
    fontWeight: '900'
  },
  calendarActivityText: {
    color: palette.white,
    fontWeight: '900'
  },
  calendarMultiDot: {
    position: 'absolute',
    bottom: 5,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.blueDeep
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.white,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 1
  },
  noticeText: {
    flex: 1,
    color: palette.ink,
    fontSize: 14,
    lineHeight: 20
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6
  },
  settingRowText: {
    flex: 1
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  verifiedText: {
    color: palette.green,
    fontWeight: '900'
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8
  },
  profileHero: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
    marginBottom: 18
  },
  profileHeroInfo: {
    flex: 1,
    paddingTop: 6
  },
  profileName: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '900',
    flex: 1
  },
  profileMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12
  },
  profileMetaItem: {
    flex: 1,
    minWidth: '46%',
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 20,
    padding: 12,
    backgroundColor: palette.whiteSoft,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.12)'
  },
  profileMetaText: {
    flex: 1
  },
  profileMetaLabel: {
    color: palette.inkMuted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 3
  },
  profileMetaValue: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '800'
  },
  digitalCredential: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)',
    backgroundColor: palette.white,
    padding: 12
  },
  credentialAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.line,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.whiteSoft
  },
  credentialAvatarImage: {
    width: '100%',
    height: '100%'
  },
  credentialName: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '900'
  },
  avatarFrameLarge: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    backgroundColor: palette.whiteSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  avatarImageLarge: {
    width: '100%',
    height: '100%'
  },
  photoChangeButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)',
    backgroundColor: palette.white,
    borderRadius: 18,
    minHeight: 42,
    paddingHorizontal: 12,
    marginTop: 12,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1
  },
  photoChangeText: {
    color: palette.red,
    fontSize: 13,
    fontWeight: '900'
  },
  photoModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 20, 28, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  photoModalImage: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: palette.white
  },
  photoModalClose: {
    position: 'absolute',
    top: 44,
    right: 24,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  accountMenu: {
    position: 'absolute',
    top: 48,
    right: 0,
    zIndex: 8,
    width: 238,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderRadius: 22,
    padding: 10,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 6
  },
  accountMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45, 141, 200, 0.12)',
    marginBottom: 4
  },
  accountMenuAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.whiteSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  accountMenuAvatarImage: {
    width: '100%',
    height: '100%'
  },
  accountMenuName: {
    color: palette.ink,
    fontWeight: '900',
    fontSize: 13
  },
  accountMenuSub: {
    color: palette.inkMuted,
    fontSize: 12,
    marginTop: 2
  },
  accountMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 38,
    paddingHorizontal: 8,
    borderRadius: 14
  },
  accountMenuItemText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700'
  },
  accountMenuDanger: {
    color: palette.red
  },
  primaryButton: {
    backgroundColor: palette.red,
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2
  },
  primaryButtonText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    flexShrink: 1
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.32)',
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: palette.white
  },
  secondaryButtonText: {
    color: palette.red,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    flexShrink: 1
  },
  tabBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: 0,
    borderRadius: 30,
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 6,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 10
  },
  tabBarCompact: {
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 26,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 7
  },
  tabBarDark: {
    backgroundColor: 'rgba(16, 43, 56, 0.97)',
    shadowColor: '#000000'
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    minWidth: 0
  },
  tabButtonCompact: {
    gap: 2
  },
  tabIconFrame: {
    width: 38,
    height: 34,
    borderWidth: 0,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 15,
    borderBottomLeftRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 141, 200, 0.1)'
  },
  tabIconFrameCompact: {
    width: 33,
    height: 31,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 7,
    borderBottomRightRadius: 13,
    borderBottomLeftRadius: 8
  },
  viewAllButton: {
    width: 'auto',
    minWidth: 76,
    paddingHorizontal: 10
  },
  linkText: {
    color: palette.red,
    fontSize: 13,
    fontWeight: '900'
  },
  tabIconFrameActive: {
    backgroundColor: palette.red,
    borderColor: palette.red,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3
  },
  tabLabel: {
    color: palette.inkMuted,
    fontSize: 9,
    fontWeight: '700',
    maxWidth: 58,
    textAlign: 'center'
  },
  tabLabelCompact: {
    fontSize: 8,
    maxWidth: 46
  },
  tabLabelActive: {
    color: palette.red
  },
  tabActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.red,
    marginTop: 1
  },
  profileCommunityPanel: {
    backgroundColor: palette.white,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    marginTop: 12,
    gap: 10,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 1
  },
  profileShell: {
    position: 'relative',
    backgroundColor: palette.white,
    borderWidth: 0,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderRadius: 24,
    padding: 16,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 2
  },
  roleTimeline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  roleStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 16,
    paddingHorizontal: 9,
    paddingVertical: 7,
    backgroundColor: palette.white
  },
  roleStepActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  roleStepRank: {
    color: palette.red,
    fontWeight: '900'
  },
  roleStepLabel: {
    color: palette.ink,
    fontWeight: '800',
    fontSize: 12
  },
  roleStepTextActive: {
    color: palette.white
  },
  innerNewsCard: {
    backgroundColor: palette.white,
    borderColor: 'rgba(45, 141, 200, 0.12)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1
  },
  adminUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  adminUserHeaderText: {
    flex: 1
  },
  adminUserAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.whiteSoft,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  adminUserAvatarImage: {
    width: '100%',
    height: '100%'
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  actionPill: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)',
    borderRadius: 18,
    paddingHorizontal: 10,
    marginTop: 10,
    backgroundColor: palette.white
  },
  actionPillActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  actionPillText: {
    color: palette.red,
    fontSize: 13,
    fontWeight: '900'
  },
  actionPillTextActive: {
    color: palette.white
  },
  inlineEditButton: {
    alignSelf: 'flex-start',
    minHeight: 38,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)',
    borderRadius: 20,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.white
  },
  inlineEditButtonText: {
    color: palette.red,
    fontSize: 13,
    fontWeight: '900'
  },
  inlineEditorPanel: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderRadius: 22,
    padding: 14,
    gap: 8,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 1
  },
  smallActionButton: {
    minHeight: 38,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 16,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.whiteSoft
  },
  smallActionText: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '800'
  },
  inlineBlockEditor: {
    backgroundColor: palette.whiteSoft,
    borderRadius: 18,
    padding: 12,
    gap: 6
  },
  inlineBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  inlineIconActions: {
    flexDirection: 'row',
    gap: 6
  },
  iconButtonGhost: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.12)'
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  horizontalChips: {
    gap: 8,
    paddingVertical: 4
  },
  filterChip: {
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    backgroundColor: palette.white,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  filterChipActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  filterChipText: {
    color: palette.ink,
    fontWeight: '800'
  },
  filterChipTextActive: {
    color: palette.white
  },
  avatarPlaceholder: {
    height: 132,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 66,
    backgroundColor: palette.whiteSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  },
  communityChoiceList: {
    maxHeight: 220,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 18,
    padding: 8,
    gap: 8,
    backgroundColor: palette.whiteSoft
  },
  communityChoice: {
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: palette.white
  },
  communityChoiceActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  statusBanner: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12
  },
  statusBanner_pendiente: {
    backgroundColor: palette.goldSoft,
    borderColor: palette.gold
  },
  statusBanner_aprobado: {
    backgroundColor: '#E4F7F0',
    borderColor: palette.green
  },
  statusBanner_bloqueado: {
    backgroundColor: '#FDE8E8',
    borderColor: '#D94B4B'
  },
  statusBannerText: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4
  },
  statusBannerSubtext: {
    color: palette.inkMuted,
    fontSize: 14,
    lineHeight: 20
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 18,
    paddingHorizontal: 14,
    marginTop: 10,
    color: palette.ink,
    backgroundColor: palette.white
  },
  inputFocused: {
    borderColor: palette.red,
    shadowColor: palette.red,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1
  },
  inputError: {
    borderColor: 'rgba(209, 71, 71, 0.82)',
    backgroundColor: 'rgba(255, 246, 246, 0.96)'
  },
  inputLabel: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 12,
    marginBottom: 0
  },
  formErrorText: {
    color: '#B93232',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 5
  },
  passwordField: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 18,
    paddingLeft: 14,
    paddingRight: 8,
    marginTop: 10,
    backgroundColor: palette.white,
    flexDirection: 'row',
    alignItems: 'center'
  },
  passwordInput: {
    flex: 1,
    minHeight: 46,
    color: palette.ink
  },
  passwordToggle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center'
  },
  passwordInputWrap: {
    position: 'relative',
    justifyContent: 'center'
  },
  inputWithIcon: {
    paddingRight: 52
  },
  passwordEyeButton: {
    position: 'absolute',
    right: 8,
    top: 15,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)'
  },
  completionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(207, 52, 49, 0.24)',
    backgroundColor: 'rgba(255, 246, 246, 0.9)',
    borderRadius: 16,
    padding: 12
  },
  completionNoticeText: {
    flex: 1,
    color: palette.ink,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20
  },
  textArea: {
    minHeight: 110,
    paddingTop: 12,
    textAlignVertical: 'top'
  },
  dropdownButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 18,
    paddingHorizontal: 14,
    marginTop: 8,
    backgroundColor: palette.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  dropdownButtonText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '800',
    flex: 1
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 18,
    backgroundColor: palette.white,
    marginTop: 8,
    maxHeight: 220,
    overflow: 'hidden'
  },
  dropdownItem: {
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45, 141, 200, 0.1)',
    justifyContent: 'center'
  },
  dropdownItemText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700'
  },
  debugPanel: {
    backgroundColor: '#FFF4CC',
    borderColor: palette.gold,
    borderWidth: 1,
    borderRadius: 18,
    padding: 8,
    marginBottom: 8
  },
  debugText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: '800'
  },
  adminPanel: {
    backgroundColor: palette.white,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 10,
    marginTop: 12,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 2
  },
  adminModuleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'rgba(230, 243, 245, 0.58)',
    borderRadius: 24,
    padding: 8
  },
  adminModuleButton: {
    width: '31%',
    minHeight: 66,
    borderWidth: 0,
    borderColor: palette.line,
    backgroundColor: 'rgba(45, 141, 200, 0.09)',
    borderRadius: 18,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5
  },
  adminModuleButtonActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  adminModuleText: {
    color: palette.ink,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center'
  },
  adminModuleTextActive: {
    color: palette.white
  },
  adminWorkspace: {
    backgroundColor: 'rgba(255,255,255,0.38)',
    borderColor: 'rgba(45, 141, 200, 0.12)',
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    gap: 10,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 0
  },
  adminStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.goldSoft,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  adminStatusText: {
    color: palette.ink,
    fontWeight: '900',
    fontSize: 13
  },
  adminStatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  adminStat: {
    flex: 1,
    minWidth: '46%',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderRadius: 18,
    padding: 12,
    backgroundColor: palette.whiteSoft
  },
  adminStatNumber: {
    color: palette.red,
    fontSize: 20,
    fontWeight: '900'
  },
  adminStatLabel: {
    color: palette.inkMuted,
    fontSize: 11,
    fontWeight: '800'
  },
  adminEditForm: {
    gap: 4
  },
  adminInlineEditor: {
    backgroundColor: palette.whiteSoft,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 18,
    padding: 12,
    margin: 8
  },
  adminQuickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  adminQuickAction: {
    flex: 1,
    minWidth: '46%',
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 18,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(45, 141, 200, 0.09)'
  },
  adminQuickText: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '900',
    flex: 1
  },
  adminPreviewPane: {
    backgroundColor: 'rgba(230, 243, 245, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.12)',
    borderRadius: 22,
    padding: 14,
    gap: 6
  },
  permissionGrid: {
    gap: 8
  },
  permissionToggle: {
    minHeight: 64,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)'
  },
  permissionToggleActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  permissionToggleTitle: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '900'
  },
  permissionToggleTitleActive: {
    color: palette.white
  },
  permissionToggleMeta: {
    color: palette.inkMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2
  },
  permissionToggleMetaActive: {
    color: 'rgba(255,255,255,0.78)'
  },
  colorInput: {
    flex: 1,
    minWidth: 130
  },
  adminListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45, 141, 200, 0.11)',
    paddingVertical: 12
  },
  adminListRowActive: {
    backgroundColor: 'rgba(45, 141, 200, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 10,
    borderBottomWidth: 0
  },
  adminStateDraft: {
    color: palette.red,
    fontWeight: '900',
    fontSize: 12
  },
  blockEditorCard: {
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 18,
    padding: 12,
    backgroundColor: palette.whiteSoft
  },
  adminMessage: {
    color: palette.white,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 18,
    padding: 10,
    fontWeight: '800'
  },
  tabEditorRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(45, 141, 200, 0.14)',
    paddingTop: 10,
    marginTop: 8
  },
  navigationBuilderScreen: {
    marginHorizontal: 0,
    marginTop: 0,
    padding: 14,
    borderRadius: 28,
    gap: 14,
    backgroundColor: '#E6F3F5',
    overflow: 'hidden'
  },
  navigationDedicatedShell: {
    marginHorizontal: -16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 18,
    borderRadius: 32,
    gap: 12,
    backgroundColor: '#DFF0F6'
  },
  navigationDedicatedTopbar: {
    gap: 12,
    padding: 14,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)'
  },
  navigationDedicatedBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  navigationDedicatedLogo: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.red
  },
  navigationDedicatedTitle: {
    color: palette.ink,
    fontSize: 21,
    fontWeight: '900'
  },
  navigationDedicatedSubtitle: {
    color: palette.inkMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700'
  },
  navigationBackButton: {
    minHeight: 48,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(45, 141, 200, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)'
  },
  navigationBackButtonText: {
    color: palette.red,
    fontSize: 13,
    fontWeight: '900'
  },
  navigationDedicatedMessage: {
    color: palette.ink,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontWeight: '800',
    overflow: 'hidden'
  },
  navigationBuilderHero: {
    minHeight: 168,
    borderRadius: 28,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: palette.red,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 5
  },
  navigationHeroText: {
    flex: 1,
    gap: 8,
    paddingRight: 12
  },
  navigationHeroEyebrow: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  navigationHeroTitle: {
    color: palette.white,
    fontSize: 27,
    lineHeight: 31,
    fontWeight: '900'
  },
  navigationHeroBody: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600'
  },
  navigationHeroBadge: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  navigationStatsRow: {
    flexDirection: 'row',
    gap: 10
  },
  navigationStatPill: {
    flex: 1,
    minHeight: 74,
    borderRadius: 22,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)'
  },
  navigationStatValue: {
    color: palette.ink,
    fontSize: 24,
    fontWeight: '900'
  },
  navigationStatLabel: {
    color: palette.inkMuted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2
  },
  navigationPhonePreview: {
    borderRadius: 30,
    padding: 14,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2
  },
  navigationPhoneTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  navigationPhoneTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '900'
  },
  navigationPhoneSub: {
    color: palette.inkMuted,
    fontSize: 12,
    fontWeight: '700'
  },
  navigationPhoneStatus: {
    width: 42,
    height: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(45, 141, 200, 0.18)'
  },
  navigationPreviewContent: {
    minHeight: 86,
    borderRadius: 22,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 141, 200, 0.1)'
  },
  navigationPreviewLabel: {
    color: palette.ink,
    fontSize: 17,
    fontWeight: '900'
  },
  navigationPreviewHint: {
    color: palette.inkMuted,
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18
  },
  navigationRail: {
    gap: 10,
    paddingVertical: 2
  },
  navigationRailItem: {
    width: 104,
    minHeight: 88,
    borderRadius: 24,
    padding: 11,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)'
  },
  navigationRailItemActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  navigationRailText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: '900'
  },
  navigationRailMeta: {
    color: palette.inkMuted,
    fontSize: 11,
    fontWeight: '800'
  },
  navigationRailTextActive: {
    color: palette.white
  },
  navigationFocusPanel: {
    borderRadius: 28,
    padding: 14,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.15)'
  },
  navigationFocusHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center'
  },
  navigationFocusIcon: {
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 141, 200, 0.12)'
  },
  navigationFocusTitle: {
    color: palette.ink,
    fontSize: 19,
    fontWeight: '900'
  },
  navigationFieldGrid: {
    gap: 2
  },
  navigationField: {
    gap: 0
  },
  navigationIconPicker: {
    gap: 8,
    paddingVertical: 4
  },
  navigationIconChoice: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 141, 200, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.12)'
  },
  navigationIconChoiceActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  navigationActionGrid: {
    flexDirection: 'row',
    gap: 9
  },
  navigationMiniAction: {
    flex: 1,
    minHeight: 52,
    borderRadius: 17,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)'
  },
  navigationMiniActionActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  navigationMiniActionText: {
    color: palette.red,
    fontSize: 12,
    fontWeight: '900'
  },
  navigationMiniActionTextActive: {
    color: palette.white
  },
  navigationRolesPanel: {
    gap: 8
  },
  navigationRolesButton: {
    minHeight: 58,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: 'rgba(45, 141, 200, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)'
  },
  navigationRolesSummary: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '800'
  },
  navigationSelectedRolesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7
  },
  navigationSelectedRoleChip: {
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)'
  },
  navigationSelectedRoleText: {
    color: palette.ink,
    fontSize: 11,
    fontWeight: '900'
  },
  navigationRolesDropdown: {
    borderRadius: 20,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    overflow: 'hidden'
  },
  navigationRoleOption: {
    minHeight: 44,
    paddingHorizontal: 13,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45, 141, 200, 0.08)'
  },
  navigationRoleOptionText: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '800',
    flex: 1
  },
  navigationLargeButton: {
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 18
  },
  navigationCreatePanel: {
    borderRadius: 28,
    padding: 14,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)'
  },
  navigationCreateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  navigationRestoreButton: {
    minHeight: 50,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.22)'
  },
  navPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)'
  },
  navPreviewItem: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    justifyContent: 'center',
    minWidth: 0,
    alignItems: 'center',
    gap: 4,
    opacity: 1
  },
  navPreviewItemSelected: {
    backgroundColor: palette.red
  },
  navPreviewItemHidden: {
    opacity: 0.42
  },
  navPreviewText: {
    color: palette.ink,
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center'
  },
  navPreviewTextSelected: {
    color: palette.white
  },
  navigationEditorCard: {
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderRadius: 20,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.62)',
    gap: 10
  },
  navigationEditorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  navEditorIcon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 141, 200, 0.1)'
  }
});

