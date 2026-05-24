import { supabase } from './supabase';

export type AppRuntimeConfig = {
  minSupportedVersion: string;
  recommendedVersion: string;
  maintenanceMode: boolean;
  globalMessage: string | null;
  featureFlags: Record<string, boolean>;
  lastSyncedAt: string | null;
};

export const defaultRuntimeConfig: AppRuntimeConfig = {
  minSupportedVersion: '0.1.0',
  recommendedVersion: '0.1.31',
  maintenanceMode: false,
  globalMessage: null,
  featureFlags: {
    externalCatholicNews: true,
    dynamicNavigation: true,
    honorLevels: true
  },
  lastSyncedAt: null
};

export async function fetchAppRuntimeConfig(): Promise<AppRuntimeConfig> {
  try {
    const { data, error } = await supabase
      .from('app_runtime_config')
      .select('min_supported_version, recommended_version, maintenance_mode, global_message, feature_flags, updated_at')
      .eq('id', 'default')
      .maybeSingle();

    if (error || !data) {
      return defaultRuntimeConfig;
    }

    return {
      minSupportedVersion: data.min_supported_version ?? defaultRuntimeConfig.minSupportedVersion,
      recommendedVersion: data.recommended_version ?? defaultRuntimeConfig.recommendedVersion,
      maintenanceMode: Boolean(data.maintenance_mode),
      globalMessage: data.global_message ?? null,
      featureFlags: {
        ...defaultRuntimeConfig.featureFlags,
        ...((data.feature_flags ?? {}) as Record<string, boolean>)
      },
      lastSyncedAt: data.updated_at ?? null
    };
  } catch {
    return defaultRuntimeConfig;
  }
}
