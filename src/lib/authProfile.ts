import { Role, Session, UserStatus } from '../types/auth';
import { getDynamicPermissionsForRole } from './permissions';
import { supabase } from './supabase';

type MyProfileRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  province: string | null;
  community_name: string | null;
  status: UserStatus | null;
  role: Role | null;
  display_role_label?: string | null;
  gender_preference?: 'male' | 'female' | null;
};

export async function getMyProfileSession(fallbackEmail = 'Usuario'): Promise<{ session: Session | null; error?: string }> {
  const { data, error } = await supabase.rpc('get_my_profile');

  if (error) {
    return { session: null, error: error.message };
  }

  const row = Array.isArray(data) ? (data[0] as MyProfileRow | undefined) : undefined;

  if (!row) {
    return { session: null, error: 'No existe perfil para esta sesion.' };
  }

  const storedRole = row.role ?? 'palestrista';
  const role = storedRole === 'invitado' ? 'palestrista' : storedRole;
  const permissions = await getDynamicPermissionsForRole(role);

  return {
    session: {
      id: row.user_id,
      fullName: row.full_name ?? row.email ?? fallbackEmail,
      email: row.email ?? fallbackEmail,
      avatarUrl: row.avatar_url,
      province: row.province ?? 'Sin provincia',
      contact: row.phone ?? 'Sin contacto',
      communityOfOrigin: row.community_name ?? 'Sin comunidad asignada',
      role,
      displayRoleLabel: row.display_role_label ?? null,
      genderPreference: row.gender_preference ?? null,
      status: row.status ?? 'pendiente',
      permissions
    }
  };
}
