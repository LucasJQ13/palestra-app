import { PersonalPmType, Role, Session, UserStatus } from '../types/auth';
import { getDynamicPermissionsForRole } from './permissions';
import { supabase } from './supabase';

type MyProfileRow = {
  user_id: string;
  email: string | null;
  email_confirmed_at?: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  province: string | null;
  community_name: string | null;
  status: UserStatus | null;
  role: Role | null;
  subrole_key?: string | null;
  display_role_label?: string | null;
  gender_preference?: 'male' | 'female' | null;
  nickname?: string | null;
  use_nickname_in_greetings?: boolean | null;
  credential_name_mode?: 'name' | 'nickname' | 'both' | null;
  perseverance_start_year?: number | null;
  personal_pm_type?: PersonalPmType | null;
  personal_pm_number?: number | null;
  personal_pm_province?: string | null;
  personal_pm_motto?: string | null;
  pm_motto?: string | null;
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
      emailConfirmedAt: row.email_confirmed_at ?? null,
      avatarUrl: row.avatar_url,
      province: row.province ?? 'Sin provincia',
      contact: row.phone ?? 'Sin contacto',
      communityOfOrigin: row.community_name ?? 'Sin comunidad asignada',
      role,
      subroleKey: row.subrole_key ?? null,
      displayRoleLabel: row.display_role_label ?? null,
      genderPreference: row.gender_preference ?? null,
      nickname: row.nickname ?? null,
      useNicknameInGreetings: row.use_nickname_in_greetings ?? false,
      credentialNameMode: row.credential_name_mode ?? 'name',
      perseveranceStartYear: row.perseverance_start_year ?? null,
      personalPmType: row.personal_pm_type ?? null,
      personalPmNumber: row.personal_pm_number ?? null,
      personalPmProvince: row.personal_pm_province ?? null,
      personalPmMotto: row.personal_pm_motto ?? row.pm_motto ?? null,
      pmMotto: row.pm_motto ?? null,
      status: row.status ?? 'pendiente',
      permissions
    }
  };
}
