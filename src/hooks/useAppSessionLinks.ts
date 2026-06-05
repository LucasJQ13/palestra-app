import { Dispatch, SetStateAction, useCallback, useEffect } from 'react';
import { Linking } from 'react-native';
import { authDeepLinkBaseUrl } from '../lib/constants';
import { getMyProfileSession } from '../lib/authProfile';
import { supabase } from '../lib/supabase';
import { Session } from '../types/auth';

type UseAppSessionLinksOptions = {
  setActiveTab: Dispatch<SetStateAction<string>>;
  setAdminSessionBeforeViewAs: Dispatch<SetStateAction<Session | null>>;
  setAppMessage: Dispatch<SetStateAction<string>>;
  setAuthConfirmationError: Dispatch<SetStateAction<string>>;
  setAuthConfirmationOpen: Dispatch<SetStateAction<boolean>>;
  setAuthScreenOpen: Dispatch<SetStateAction<boolean>>;
  setSession: Dispatch<SetStateAction<Session | null>>;
  onMailConfirmed: () => void;
  reloadAdminConfig: () => Promise<void>;
  reloadAppContent: () => Promise<void>;
  reloadRuntimeConfig: () => Promise<void>;
  reloadTabSettings: () => Promise<void>;
};

export function useAppSessionLinks({
  setActiveTab,
  setAdminSessionBeforeViewAs,
  setAppMessage,
  setAuthConfirmationError,
  setAuthConfirmationOpen,
  setAuthScreenOpen,
  setSession,
  onMailConfirmed,
  reloadAdminConfig,
  reloadAppContent,
  reloadRuntimeConfig,
  reloadTabSettings
}: UseAppSessionLinksOptions) {
  const hydrateRealSession = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return;
    }

    const result = await getMyProfileSession(data.user.email ?? 'Usuario');
    if (result.session) {
      setSession(result.session);
      setAdminSessionBeforeViewAs(null);
    }
  }, [setAdminSessionBeforeViewAs, setSession]);

  const handleDeepLinkUrl = useCallback(async (url: string) => {
    if (!url.startsWith(authDeepLinkBaseUrl)) {
      return;
    }
    try {
      const parsed = new URL(url);
      const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));
      const preview = parsed.searchParams.get('preview') ?? hashParams.get('preview');
      if (preview === 'mail-confirmed') {
        setAuthConfirmationError('');
        setAuthConfirmationOpen(true);
        setAuthScreenOpen(false);
        return;
      }
      const callbackError = parsed.searchParams.get('error_description')
        ?? hashParams.get('error_description')
        ?? parsed.searchParams.get('error')
        ?? hashParams.get('error');
      if (callbackError) {
        setAuthConfirmationError('No pudimos confirmar tu correo. Pedí un nuevo mail de confirmación e intentá nuevamente.');
        setAuthConfirmationOpen(true);
        setAuthScreenOpen(false);
        return;
      }
      const flow = parsed.searchParams.get('flow') ?? parsed.searchParams.get('type') ?? hashParams.get('type');
      if (flow === 'password-reset' || flow === 'recovery') {
        setAuthConfirmationOpen(false);
        setActiveTab('perfil');
        setAuthScreenOpen(true);
        setAppMessage('Link de recuperacion recibido. Inicia sesion o actualiza tu contrasena desde Mi Perfil.');
        return;
      }
      const code = parsed.searchParams.get('code');
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
      const accessToken = parsed.searchParams.get('access_token') ?? hashParams.get('access_token');
      const refreshToken = parsed.searchParams.get('refresh_token') ?? hashParams.get('refresh_token');
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }
      await hydrateRealSession();
      setAuthConfirmationError('');
      setAuthConfirmationOpen(true);
      setActiveTab('perfil');
      setAuthScreenOpen(false);
      onMailConfirmed();
    } catch (error) {
      setAuthConfirmationError('No pudimos procesar el link de confirmación. Abrí Palestra APP e intentá iniciar sesión.');
      setAuthConfirmationOpen(true);
      console.error('auth callback link', error);
    }
  }, [
    hydrateRealSession,
    onMailConfirmed,
    setActiveTab,
    setAppMessage,
    setAuthConfirmationError,
    setAuthConfirmationOpen,
    setAuthScreenOpen
  ]);

  useEffect(() => {
    hydrateRealSession();
    reloadTabSettings();
    reloadAppContent();
    reloadAdminConfig();
    reloadRuntimeConfig();

    async function handleInitialUrl() {
      const url = await Linking.getInitialURL();
      if (url) {
        handleDeepLinkUrl(url);
      }
    }

    handleInitialUrl();
    const urlSubscription = Linking.addEventListener('url', ({ url }) => handleDeepLinkUrl(url));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, authSession) => {
      if (!authSession?.user) {
        setSession(null);
        setAdminSessionBeforeViewAs(null);
      }
      if (authSession?.user) {
        hydrateRealSession();
      }
    });

    return () => {
      listener.subscription.unsubscribe();
      urlSubscription.remove();
    };
  }, []);

  return {
    handleDeepLinkUrl,
    hydrateRealSession
  };
}
