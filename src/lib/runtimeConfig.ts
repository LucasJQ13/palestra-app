import { supabase } from './supabase';

export type AppRuntimeConfig = {
  minSupportedVersion: string;
  recommendedVersion: string;
  maintenanceMode: boolean;
  globalMessage: string | null;
  featureFlags: Record<string, boolean>;
  catholicNews: CatholicNewsConfig;
  lastSyncedAt: string | null;
};

export type CatholicNewsSourceKey = 'vatican' | 'episcopado' | 'aci';

export type CatholicNewsConfig = {
  enabled: boolean;
  maxItems: number;
  sourceOrder: CatholicNewsSourceKey[];
  sources: Record<CatholicNewsSourceKey, boolean>;
};

export const defaultCatholicNewsConfig: CatholicNewsConfig = {
  enabled: true,
  maxItems: 3,
  sourceOrder: ['vatican', 'episcopado', 'aci'],
  sources: {
    vatican: true,
    episcopado: true,
    aci: true
  }
};

export const defaultRuntimeConfig: AppRuntimeConfig = {
  minSupportedVersion: '0.1.0',
  recommendedVersion: '0.1.32',
  maintenanceMode: false,
  globalMessage: null,
  featureFlags: {
    externalCatholicNews: true,
    dynamicNavigation: true,
    honorLevels: true
  },
  catholicNews: defaultCatholicNewsConfig,
  lastSyncedAt: null
};

function normalizeCatholicNewsConfig(value: unknown): CatholicNewsConfig {
  const raw = (value ?? {}) as Partial<CatholicNewsConfig>;
  const rawSources = (raw.sources ?? {}) as Partial<Record<CatholicNewsSourceKey, boolean>>;
  const order = Array.isArray(raw.sourceOrder)
    ? raw.sourceOrder.filter((item): item is CatholicNewsSourceKey => ['vatican', 'episcopado', 'aci'].includes(String(item)))
    : defaultCatholicNewsConfig.sourceOrder;

  return {
    enabled: raw.enabled ?? defaultCatholicNewsConfig.enabled,
    maxItems: Math.max(1, Math.min(Number(raw.maxItems ?? defaultCatholicNewsConfig.maxItems) || 3, 9)),
    sourceOrder: order.length ? order : defaultCatholicNewsConfig.sourceOrder,
    sources: {
      ...defaultCatholicNewsConfig.sources,
      ...rawSources
    }
  };
}

export async function fetchAppRuntimeConfig(): Promise<AppRuntimeConfig> {
  try {
    const { data, error } = await supabase
      .from('app_runtime_config')
      .select('min_supported_version, recommended_version, maintenance_mode, global_message, feature_flags, catholic_news, updated_at')
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
      catholicNews: normalizeCatholicNewsConfig(data.catholic_news),
      lastSyncedAt: data.updated_at ?? null
    };
  } catch {
    return defaultRuntimeConfig;
  }
}

export async function saveAppRuntimeConfig(config: AppRuntimeConfig) {
  return supabase
    .from('app_runtime_config')
    .upsert({
      id: 'default',
      min_supported_version: config.minSupportedVersion,
      recommended_version: config.recommendedVersion,
      maintenance_mode: config.maintenanceMode,
      global_message: config.globalMessage,
      feature_flags: config.featureFlags,
      catholic_news: config.catholicNews,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
}
