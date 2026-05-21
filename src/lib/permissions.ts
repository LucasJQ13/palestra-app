import { Permission, Role } from '../types/auth';
import { supabase } from './supabase';

const basePermissions: Permission[] = ['ver_inicio', 'ver_noticias', 'ver_comunidades', 'ver_historia', 'ver_contacto'];

export const rolePermissions: Record<Role, Permission[]> = {
  invitado: basePermissions,
  palestrista: [...basePermissions, 'ver_materiales_internos', 'descargar_archivos', 'ver_noticias_comunidad'],
  sedimentador: [...basePermissions, 'ver_materiales_internos', 'descargar_archivos', 'descargar_archivos_exclusivos', 'ver_fechas_privadas', 'ver_noticias_comunidad'],
  coordinador_comunidad: [...basePermissions, 'ver_materiales_internos', 'descargar_archivos', 'descargar_archivos_exclusivos', 'ver_fechas_privadas', 'ver_noticias_comunidad', 'subir_noticias_comunidad', 'gestionar_comunidad', 'enviar_mensajes_comunidad'],
  animador_comunidad: [...basePermissions, 'ver_materiales_internos', 'descargar_archivos', 'descargar_archivos_exclusivos', 'ver_fechas_privadas', 'ver_noticias_comunidad', 'subir_noticias_comunidad', 'gestionar_comunidad', 'enviar_mensajes_comunidad'],
  vocal: [...basePermissions, 'ver_materiales_internos', 'descargar_archivos', 'descargar_archivos_exclusivos', 'ver_fechas_privadas', 'ver_noticias_comunidad', 'subir_noticias_comunidad', 'gestionar_comunidad', 'enviar_mensajes_comunidad', 'aprobar_sedimentadores', 'otorgar_roles_provincia', 'gestionar_contenido'],
  coordinador_diocesano: [...basePermissions, 'ver_materiales_internos', 'descargar_archivos', 'descargar_archivos_exclusivos', 'ver_fechas_privadas', 'ver_noticias_comunidad', 'subir_noticias_comunidad', 'gestionar_comunidad', 'enviar_mensajes_comunidad', 'aprobar_sedimentadores', 'otorgar_roles_provincia', 'otorgar_roles_diocesanos', 'gestionar_contenido'],
  asesor: [...basePermissions, 'ver_materiales_internos', 'descargar_archivos', 'descargar_archivos_exclusivos', 'ver_fechas_privadas', 'ver_noticias_comunidad', 'subir_noticias_comunidad', 'gestionar_comunidad', 'enviar_mensajes_comunidad', 'aprobar_sedimentadores', 'otorgar_roles_provincia', 'ver_seccion_asesores', 'gestionar_contenido'],
  vocal_nacional: [...basePermissions, 'ver_materiales_internos', 'descargar_archivos', 'descargar_archivos_exclusivos', 'ver_fechas_privadas', 'ver_noticias_comunidad', 'aprobar_sedimentadores', 'otorgar_roles_provincia', 'otorgar_roles_diocesanos', 'gestionar_contenido', 'enviar_notificaciones'],
  coordinador_nacional: [...basePermissions, 'ver_materiales_internos', 'descargar_archivos', 'descargar_archivos_exclusivos', 'ver_fechas_privadas', 'ver_noticias_comunidad', 'aprobar_sedimentadores', 'otorgar_roles_provincia', 'otorgar_roles_diocesanos', 'gestionar_contenido', 'gestionar_permisos', 'enviar_notificaciones'],
  administrador: [...basePermissions, 'ver_materiales_internos', 'descargar_archivos', 'descargar_archivos_exclusivos', 'ver_fechas_privadas', 'ver_noticias_comunidad', 'subir_noticias_comunidad', 'gestionar_comunidad', 'enviar_mensajes_comunidad', 'aprobar_sedimentadores', 'otorgar_roles_provincia', 'otorgar_roles_diocesanos', 'ver_seccion_asesores', 'gestionar_permisos', 'gestionar_sistema', 'gestionar_roles_globales', 'gestionar_pestanas', 'gestionar_comunidades_global', 'enviar_notificaciones', 'gestionar_contenido']
};

export function getPermissionsForRole(role: Role) {
  return rolePermissions[role] ?? basePermissions;
}

export async function getDynamicPermissionsForRole(role: Role): Promise<Permission[]> {
  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('permission_key')
      .eq('role', role);

    if (error || !data || data.length === 0) {
      return getPermissionsForRole(role);
    }

    const remotePermissions = data
      .map((item) => item.permission_key)
      .filter((permission): permission is Permission => typeof permission === 'string');

    return remotePermissions.length > 0 ? remotePermissions : getPermissionsForRole(role);
  } catch {
    return getPermissionsForRole(role);
  }
}
