import { useState } from 'react';
import { AppAdminConfig, defaultAdminConfig, normalizeAdminConfig } from '../lib/appConfig';
import { AppContentBlock, AppTabSetting, fetchAdminConfig, fetchAppContent, fetchAppTabs } from '../lib/profiles';
import { AppRuntimeConfig, defaultRuntimeConfig, fetchAppRuntimeConfig } from '../lib/runtimeConfig';

type UseAppBootstrapDataOptions = {
  hydrateSession: () => Promise<void>;
  onError?: (message: string) => void;
};

export function useAppBootstrapData({ hydrateSession, onError }: UseAppBootstrapDataOptions) {
  const [tabSettings, setTabSettings] = useState<AppTabSetting[]>([]);
  const [appContent, setAppContent] = useState<AppContentBlock[]>([]);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [adminConfig, setAdminConfig] = useState<AppAdminConfig>(defaultAdminConfig);
  const [runtimeConfig, setRuntimeConfig] = useState<AppRuntimeConfig>(defaultRuntimeConfig);
  const [contentVersion, setContentVersion] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function reloadTabSettings() {
    const items = await fetchAppTabs();
    setTabSettings(items);
  }

  async function reloadAppContent() {
    const items = await fetchAppContent();
    setAppContent(items);
    setContentLoaded(true);
  }

  async function reloadAdminConfig() {
    const config = await fetchAdminConfig();
    if (config) {
      setAdminConfig(normalizeAdminConfig(config as Partial<AppAdminConfig>));
    }
  }

  async function reloadRuntimeConfig() {
    setRuntimeConfig(await fetchAppRuntimeConfig());
  }

  async function refreshPublishedContent() {
    await reloadAppContent();
    setContentVersion((current) => current + 1);
  }

  async function refreshAppContent(_source = 'manual') {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    try {
      await Promise.all([
        reloadTabSettings(),
        reloadAppContent(),
        reloadAdminConfig(),
        reloadRuntimeConfig(),
        hydrateSession()
      ]);
      setContentVersion((current) => current + 1);
    } catch (error) {
      console.error('refreshAppContent', error);
      onError?.(error instanceof Error ? error.message : 'No pude actualizar. Revisa la conexion.');
    } finally {
      setIsRefreshing(false);
    }
  }

  return {
    adminConfig,
    appContent,
    contentLoaded,
    contentVersion,
    isRefreshing,
    refreshAppContent,
    refreshPublishedContent,
    reloadAdminConfig,
    reloadAppContent,
    reloadRuntimeConfig,
    reloadTabSettings,
    runtimeConfig,
    setAdminConfig,
    setRuntimeConfig,
    tabSettings
  };
}
