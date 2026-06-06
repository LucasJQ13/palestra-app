import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, ToastAndroid } from 'react-native';
import { Session } from '../types/auth';
import { ProfilePanel, TabKey } from '../types/appUi';
import { isMissingProfileScope } from '../lib/appMessages';

type UseAppNavigationStateOptions = {
  drawerOpen: boolean;
  session: Session | null;
  setAppMessage: (message: string) => void;
  setAuthScreenOpen: (open: boolean) => void;
  setDrawerOpen: (open: boolean) => void;
  setProfileInitialPanel: Dispatch<SetStateAction<ProfilePanel>>;
};

export function useAppNavigationState({
  drawerOpen,
  session,
  setAppMessage,
  setAuthScreenOpen,
  setDrawerOpen,
  setProfileInitialPanel
}: UseAppNavigationStateOptions) {
  const [activeTab, setActiveTab] = useState<TabKey>('inicio');
  const [tabHistory, setTabHistory] = useState<TabKey[]>(['inicio']);
  const lastBackPressRef = useRef(0);

  const navigateToTab = useCallback((nextTab: TabKey) => {
    setDrawerOpen(false);
    if (!session && nextTab === 'perfil') {
      setAuthScreenOpen(true);
      return;
    }
    if (isMissingProfileScope(session) && nextTab !== 'perfil') {
      setActiveTab('perfil');
      setTabHistory(['perfil']);
      setAppMessage('Completa provincia y comunidad para usar la app.');
      setTimeout(() => setAppMessage(''), 2200);
      return;
    }
    if (nextTab !== 'perfil') {
      setProfileInitialPanel('vista');
    }
    if (nextTab === activeTab) {
      return;
    }
    setTabHistory((current) => [...current.filter((item, index) => index === current.length - 1 || item !== nextTab), nextTab]);
    setActiveTab(nextTab);
  }, [activeTab, session, setAppMessage, setAuthScreenOpen, setDrawerOpen, setProfileInitialPanel]);

  const goBackInApp = useCallback(() => {
    if (drawerOpen) {
      setDrawerOpen(false);
      return true;
    }

    if (tabHistory.length > 1) {
      const nextHistory = tabHistory.slice(0, -1);
      const previousTab = nextHistory[nextHistory.length - 1] ?? 'inicio';
      setTabHistory(nextHistory);
      setActiveTab(previousTab);
      return true;
    }

    if (activeTab !== 'inicio') {
      setTabHistory(['inicio']);
      setActiveTab('inicio');
      return true;
    }

    const now = Date.now();
    if (now - lastBackPressRef.current < 1800) {
      return false;
    }

    lastBackPressRef.current = now;
    const message = 'Presiona nuevamente para salir';
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
    setAppMessage(message);
    setTimeout(() => setAppMessage(''), 1800);
    return true;
  }, [activeTab, drawerOpen, setAppMessage, setDrawerOpen, tabHistory]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', goBackInApp);
    return () => subscription.remove();
  }, [goBackInApp]);

  useEffect(() => {
    if (isMissingProfileScope(session) && activeTab !== 'perfil') {
      setActiveTab('perfil');
      setTabHistory(['perfil']);
    }
  }, [session, activeTab]);

  useEffect(() => {
    if (!session && activeTab === 'perfil') {
      setActiveTab('inicio');
      setTabHistory(['inicio']);
      setAuthScreenOpen(true);
    }
  }, [session, activeTab, setAuthScreenOpen]);

  return {
    activeTab,
    navigateToTab,
    setActiveTab,
    setTabHistory
  };
}
