import { Ionicons } from '@expo/vector-icons';
import { AppContentBlock, AppTabSectionType } from './profiles';

export type TabKey = string;
type AdminModule = string;

export const adminModuleCatalog: Array<{ key: AdminModule; label: string; icon: keyof typeof Ionicons.glyphMap; systemOnly?: boolean }> = [
  { key: 'resumen', label: 'Panel', icon: 'grid-outline' },
  { key: 'identidad', label: 'Identidad', icon: 'sparkles-outline', systemOnly: true },
  { key: 'home', label: 'Home', icon: 'home-outline', systemOnly: true },
  { key: 'noticias', label: 'Noticias', icon: 'newspaper-outline', systemOnly: true },
  { key: 'descargas', label: 'Descargas', icon: 'document-attach-outline' },
  { key: 'contenido_publicado', label: 'Contenido', icon: 'albums-outline', systemOnly: true },
  { key: 'comunidades', label: 'Comunidades', icon: 'location-outline' },
  { key: 'asesores_comunidad', label: 'Asesores', icon: 'people-circle-outline' },
  { key: 'crear_provincia', label: 'Crear provincia', icon: 'map-outline', systemOnly: true },
  { key: 'listas_qr', label: 'Listas QR', icon: 'qr-code-outline' },
  { key: 'intenciones', label: 'Intenciones', icon: 'flame-outline', systemOnly: true },
  { key: 'moderacion', label: 'Moderacion', icon: 'shield-checkmark-outline' },
  { key: 'proceso_educativo', label: 'Proceso Educativo', icon: 'map-outline' },
  { key: 'evangelio_dia', label: 'Evangelio', icon: 'book-outline', systemOnly: true },
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

export type PageEditorProps = {
  tabKey: TabKey;
  title: string;
  content?: AppContentBlock;
  tab?: AppTabDisplay;
  isAdmin: boolean;
  contentLoaded: boolean;
  onContentChanged: () => Promise<void>;
  onTabsChanged: () => Promise<void>;
};

export const defaultTabs: Array<{ key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'inicio', label: 'Inicio', icon: 'home-outline' },
  { key: 'notilestra', label: 'Notilestra', icon: 'newspaper-outline' },
  { key: 'materiales', label: 'Materiales', icon: 'document-text-outline' },
  { key: 'oraciones', label: 'Oraciones', icon: 'heart-outline' },
  { key: 'cancionero', label: 'Cancionero', icon: 'musical-notes-outline' },
  { key: 'himno', label: 'Himno', icon: 'flag-outline' },
  { key: 'comunidades', label: 'Comunidades', icon: 'people-outline' },
  { key: 'intenciones', label: 'Intenciones', icon: 'flame-outline' },
  { key: 'proceso_educativo', label: 'Proceso Educativo', icon: 'map-outline' },
  { key: 'historia', label: 'Historia', icon: 'book-outline' },
  { key: 'contacto', label: 'Contacto', icon: 'chatbubbles-outline' },
  { key: 'periodo_motivador', label: 'PM', icon: 'flame-outline' },
  { key: 'perfil', label: 'Perfil', icon: 'person-circle-outline' }
];

export type AppTabDisplay = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  sectionType: AppTabSectionType;
  visible: boolean;
  sortOrder: number;
  visibleRoles: string[] | null;
};

export const navigationSectionTypes: Array<{ key: AppTabSectionType; label: string; description: string }> = [
  { key: 'simple', label: 'Pagina simple', description: 'Titulo, texto e imagen opcional.' },
  { key: 'library', label: 'Biblioteca / Archivos', description: 'Lista remota de documentos descargables.' },
  { key: 'links', label: 'Enlaces', description: 'Botones configurables por bloque enlace.' },
  { key: 'image_text', label: 'Imagen + texto', description: 'Imagen principal y bloque textual.' },
  { key: 'form', label: 'Formulario / Contacto', description: 'Formulario real que envia a buzon interno.' },
  { key: 'internal', label: 'Modulo interno', description: 'Redirige a una seccion base existente.' },
  { key: 'formation_path', label: 'Camino formativo', description: 'Ruta interactiva con estaciones, contenido por rango y materiales vinculados.' }
];

export const defaultTabByKey = new Map(defaultTabs.map((tab) => [tab.key, tab]));
export const protectedTabKeys = new Set(['inicio', 'perfil']);
export const navigationIconSuggestions: Array<keyof typeof Ionicons.glyphMap> = [
  'home-outline',
  'newspaper-outline',
  'download-outline',
  'people-outline',
  'book-outline',
  'chatbubble-ellipses-outline',
  'person-circle-outline',
  'calendar-outline',
  'flame-outline',
  'map-outline',
  'trail-sign-outline',
  'folder-open-outline',
  'heart-outline',
  'sparkles-outline',
  'settings-outline'
];

export function isIoniconName(value?: string | null): value is keyof typeof Ionicons.glyphMap {
  return Boolean(value && value in Ionicons.glyphMap);
}

export function normalizeTabKey(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}
