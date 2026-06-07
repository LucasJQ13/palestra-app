import { PersonalPmType, Role } from './auth';
import { GenderPreference } from '../lib/profileDisplay';

export type TabKey = string;

export type AdminModule = 'resumen' | 'identidad' | 'home' | 'noticias' | 'descargas' | 'comunidades' | 'crear_provincia' | 'listas_qr' | 'intenciones' | 'moderacion' | 'proceso_educativo' | 'evangelio_dia' | 'historia_admin' | 'contacto_admin' | 'usuarios' | 'solicitudes' | 'periodo_motivador' | 'configuracion' | 'eventos' | 'contenido_general' | 'contenido_publicado' | 'navegacion' | 'permisos_roles' | 'etiquetas_roles' | 'rangos_alias';
export type ProfilePanel = 'vista' | 'editar' | 'comunidad' | 'buzon' | 'configuracion' | 'intenciones';
export type AdminUsersTool = 'crear' | 'editar' | 'listado' | 'pendientes' | 'diagnostico';
export type AdminRequest = {
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

export type PublicProfilePreview = {
  id?: string | null;
  fullName: string;
  role: Role;
  province?: string | null;
  communityName?: string | null;
  avatarUrl?: string | null;
  contact?: string | null;
  displayRoleLabel?: string | null;
  genderPreference?: GenderPreference;
  nickname?: string | null;
  credentialNameMode?: 'name' | 'nickname' | 'both' | null;
  perseveranceStartYear?: number | null;
  personalPmType?: PersonalPmType | null;
  personalPmNumber?: number | null;
  personalPmProvince?: string | null;
  personalPmMotto?: string | null;
  pmMotto?: string | null;
};

export type GlobalSearchResult = {
  id: string;
  title: string;
  subtitle: string;
  type: 'usuario' | 'comunidad' | 'archivo' | 'noticia' | 'pm' | 'aviso' | 'descarga' | 'contenido';
  tab?: TabKey;
  publicProfile?: PublicProfilePreview;
};
