import { supabase } from './supabase';

export type UserHonorLevel = {
  roleKey: string;
  levelKey: string;
  displayName: string;
  description: string | null;
  perseveranceYears: number;
};

export async function fetchUserHonorLevel(profileId?: string | null): Promise<UserHonorLevel | null> {
  if (!profileId) {
    return null;
  }

  try {
    const { data, error } = await supabase.rpc('resolve_profile_honor_level', {
      p_profile_id: profileId
    });

    if (error || !data) {
      return null;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      return null;
    }

    return {
      roleKey: row.role_key,
      levelKey: row.level_key,
      displayName: row.display_name,
      description: row.description ?? null,
      perseveranceYears: Number(row.perseverance_years ?? 0)
    };
  } catch {
    return null;
  }
}
