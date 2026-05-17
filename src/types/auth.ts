export type Role =
  | 'invitado'
  | 'palestrista'
  | 'sedimentador'
  | 'coordinador_comunidad'
  | 'animador_comunidad'
  | 'vocal'
  | 'coordinador_diocesano'
  | 'asesor'
  | 'vocal_nacional'
  | 'coordinador_nacional'
  | 'administrador';

export type UserStatus = 'pendiente' | 'aprobado' | 'bloqueado';

export type Permission =
  | 'ver_inicio'
  | 'ver_noticias'
  | 'ver_comunidades'
  | 'ver_historia'
  | 'ver_contacto'
  | 'ver_materiales_internos'
  | 'descargar_archivos'
  | 'descargar_archivos_exclusivos'
  | 'ver_fechas_privadas'
  | 'ver_noticias_comunidad'
  | 'subir_noticias_comunidad'
  | 'gestionar_comunidad'
  | 'enviar_mensajes_comunidad'
  | 'aprobar_sedimentadores'
  | 'otorgar_roles_provincia'
  | 'otorgar_roles_diocesanos'
  | 'ver_seccion_asesores'
  | 'gestionar_permisos'
  | 'gestionar_sistema'
  | 'gestionar_roles_globales'
  | 'gestionar_pestanas'
  | 'gestionar_comunidades_global'
  | 'enviar_notificaciones'
  | 'gestionar_contenido';

export type Session = {
  id?: string;
  fullName: string;
  email?: string;
  avatarUrl?: string | null;
  province: string;
  contact: string;
  communityOfOrigin: string;
  role: Role;
  status: UserStatus;
  permissions: Permission[];
};
