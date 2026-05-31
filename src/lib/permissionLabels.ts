import { Permission } from '../types/auth';

export const permissionFriendlyLabels: Record<Permission, string> = {
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

export const permissionOptions = (Object.keys(permissionFriendlyLabels) as Permission[]).map((permission) => ({
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
