import { Session } from '../types/auth';
import { getPermissionsForRole } from './permissions';

export const internalTestSessions: Record<string, Session> = {
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
