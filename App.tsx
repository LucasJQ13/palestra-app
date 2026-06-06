import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Animated, Easing, Image, KeyboardAvoidingView, Modal, Platform, RefreshControl, ScrollView, StatusBar, Switch, Text, TextInput, ToastAndroid, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { palette } from './src/theme/palette';
import { AppTheme, themePresets } from './src/theme/themes';
import { AppThemeContext, useIsDarkTheme } from './src/theme/ThemeContext';
import { auditLog, calendarActivities, communities, contactInfo, communityNews, faqItems, internalMessages, materials, movementHistory, news, notilestra, pendingUsers, roleDefinitions } from './src/data/content';
import { Permission, PersonalPmType, Role, Session } from './src/types/auth';
import { getPermissionsForRole, rolePermissions } from './src/lib/permissions';
import { AppCommunity, PublicationComment, RemoteAgendaItem, archiveAgendaEvent, archiveCommunityPublication, archiveNewsEntry, createCommunityPublication, createPublicationComment, fetchCommunityPublications, fetchPublicationComments, reactToPublication, reportPublication, updateAgendaEvent, updateCommunityPublication, updateNewsEntry, voteCommunityPoll } from './src/lib/remoteData';
import { AdminUser, AdminUserLoginDiagnostic, AppTabSectionType, ChurchDocumentButtonRecord, CommunityMember, ContentEditorBlock, MailboxMessageRecord, MailboxTargetMode, MotivadorPeriodRecord, NewsDraftRecord, ProvinceRoleLabelRecord, RoleAliasRecord, RolePermissionRecord, UserAgendaPreferenceRecord, UserRequestRecord, acceptDiocesanCoordinatorRequest, approveProfile, archiveAppMaterial, archiveChurchDocumentButton, archiveCommunity, confirmAdminUserEmail, createAdminBasicUser, createAppTab, createCommunity, createCommunityContactMessage, createEmailConfirmationRequest, createEvent, createNews, createLeadershipChangeRequest, createMailboxMessage, createNotificationIntent, createUserRequest, debugPushToDevice, deleteAdminUserByEmail, deleteAppTab, deliverNotificationIntent, diagnoseAdminUserLogin, fetchAdminMotivadorPeriods, fetchAdminRequests, fetchAdminUsers, fetchAssignableRoleAliases, fetchChurchDocumentButtons, fetchMailboxMessages, fetchMyCommunityMembers, fetchMyRequests, fetchNewsDrafts, fetchPendingProfiles, fetchProvinceRoleLabels, fetchPublicProfile, fetchRolePermissions, fetchUserAgendaPreferences, PendingProfile, registerPushToken, repairAdminUserLogin, resolveUserRequest, respondMailboxMessage, restoreDefaultAppTabs, saveAdminConfig, saveAdminInstagram, saveAppMaterial, saveChurchDocumentButton, saveMotivadorPeriod, saveNewsDraft, saveProvinceRoleLabel, saveRoleAlias, saveRolePermissions, setCommunityStatus, setMailboxMessageStatus, setMotivadorPeriodStatus, setRoleAliasStatus, setUserAgendaPreference, softDeleteAdminUser, updateAdminUser, updateAppContent, updateAppTab, updateAppTabPosition, updateCommunity, updateMyAvatar, updateMyProfile, updateMyProfileDetails } from './src/lib/profiles';
import { supabase } from './src/lib/supabase';
import { ForumCategory, ForumComment, ForumTopic, archiveForumComment, archiveForumTopic, canUseForumCategory, createForumComment, createForumTopic, fetchForumCategories, fetchForumComments, fetchForumTopics, setForumTopicStatus, updateForumTopic, visibleForumRolesFor } from './src/lib/forum';
import { AppLibraryItem, LibrarySection, archiveLibraryItem, debugLibraryPermission, fetchLibraryItems, saveLibraryItem } from './src/lib/library';
import { assignableRolesFor, canAccessProvince, canApproveRole, canEditCommunity, canManageProvince, canSeeAllProvinces, roleRank, visibleHierarchyFor } from './src/lib/roles';
import { ExternalCatholicNewsItem, fetchExternalCatholicNews } from './src/lib/externalNews';
import { ExternalNewsCarousel } from './src/components/ExternalNewsCarousel';
import { AppDrawer, AppDrawerItem } from './src/components/AppDrawer';
import { ActionButton } from './src/components/ActionButton';
import { SectionTitle } from './src/components/SectionTitle';
import { LinkedSelectableText } from './src/components/LinkedSelectableText';
import { RoleDropdown } from './src/components/RoleDropdown';
import { EditableIntro } from './src/components/EditableIntro';
import { styles } from './src/theme/appStyles';
import { AppLoadingScreen } from './src/screens/AppLoadingScreen';
import { AuthScreen, MailConfirmedScreen } from './src/screens/auth/AuthFlow';
import { ContactScreen, DynamicContactForm, EmptyRemoteContent, GenericPageScreen, HistoryScreen, MaintenanceScreen } from './src/screens/StaticScreens';
import { LibrarySectionScreen } from './src/screens/LibrarySectionScreen';
import { ForumScreen } from './src/screens/ForumScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { NotilestraScreen } from './src/screens/NotilestraScreen';
import { MotivadorScreen } from './src/screens/MotivadorScreen';
import { MaterialsScreen } from './src/screens/MaterialsScreen';
import { CommunitiesScreen } from './src/screens/CommunitiesScreen';
import { IntentionsScreen } from './src/screens/IntentionsScreen';
import { DynamicNavigationSectionScreen } from './src/screens/DynamicNavigationSectionScreen';
import { CatholicNewsSourceKey, saveAppRuntimeConfig } from './src/lib/runtimeConfig';
import { appBetaVersion, appRuntimeOwner, appStageLabel, appVersionLabel, currentYear, defaultProvinceInstagram, easProjectId, inputPlaceholderColor, localReminderNotificationKey, officialInstagramUrl, palestraLogo, perseveranceStartYears, provinceDisplayNames, provinceLogos, pushDeviceIdKey } from './src/lib/constants';
import { adminModuleCatalog, AppTabDisplay, defaultTabByKey, defaultTabs, isIoniconName, navigationIconSuggestions, navigationSectionTypes, normalizeTabKey, PageEditorProps, protectedTabKeys } from './src/lib/navigationConstants';
import { normalizeExternalUrl } from './src/lib/urls';
import { uploadPickedImageToPublicUrl } from './src/lib/uploads';
import { credentialDisplayName, displayRoleLabel, firstNameOf, GenderPreference, genderNarratives, homeGreeting, homeGreetingName, perseveranceLabel, personalPmSummary, personalPmTypeLabel, renderGreetingTemplate, roleLabel, roleLabelForProvince, roleShortLabel } from './src/lib/profileDisplay';
import { changeDone, communityDowngradesRole, friendlyUploadError, hasPlausibleEmailDomain, isMissingProfileScope, isValidEmail, provinceDowngradesRole, safeAuthError, verifyEmailDomainExists } from './src/lib/appMessages';
import { buildInitialBlocksForSection, splitConfigValue, tabLabelFromKey } from './src/lib/contentBlocks';
import { canAccessPrivate, canCreateOrAdministrateCommunities, canEditAdminUser, canEditPageContent, canEditStaticInstitutionalPage, canManageGlobalInstagram, canManageMotivadorPanel, canManageNationalPublishedContent, canManageNewsContent, canManagePublishedContent, canManageUsersPanel, canUseCommunityAdmin, hasPermission, isCommunityLeaderRole, leadershipPanelTitle } from './src/lib/sessionAccess';
import { AdminModule, AdminRequest, ProfilePanel } from './src/types/appUi';
import { internalTestSessions } from './src/lib/internalTestSessions';
import { permissionOptions } from './src/lib/permissionLabels';
import { getAndroidChannelDebug, getFriendlyPushError, notificationTitleFor, requestAndRegisterPushToken, showFeedbackMessage } from './src/lib/notificationHelpers';
import { AgendaItem, agendaPreferenceKey, cancelLocalReminderNotification, groupMotivadorFeedItems, readReminderNotificationMap, scheduleLocalReminderNotification, splitAgendaPreferences } from './src/lib/agendaHelpers';
import { useAppThemePreference } from './src/hooks/useAppThemePreference';
import { useTouchPointer } from './src/hooks/useTouchPointer';
import { useAppBootstrapData } from './src/hooks/useAppBootstrapData';
import { useAppNavigationState } from './src/hooks/useAppNavigationState';
import { useAppSessionLinks } from './src/hooks/useAppSessionLinks';
import { useGlobalSearch } from './src/hooks/useGlobalSearch';


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

(TextInput as any).defaultProps = {
  ...((TextInput as any).defaultProps ?? {}),
  placeholderTextColor: inputPlaceholderColor,
  selectionColor: palette.red
};

type TabKey = string;
type NotilestraItem = (typeof notilestra)[number];
type CommunityPublication = Awaited<ReturnType<typeof fetchCommunityPublications>>[number];
type NewsFeedItem = (typeof news)[number] & { id?: string; source?: 'news'; province?: string };
type HomeFeedItem = NewsFeedItem | CommunityPublication;
function isRemoteNewsItem(item: HomeFeedItem): item is NewsFeedItem & { id: string; source: 'news' } {
  return Boolean((item as NewsFeedItem).id && (item as NewsFeedItem).source === 'news');
}
function fallbackContentKey(section: string, title: string, date?: string) {
  return `${section}:${date ? `${date}:` : ''}${title}`;
}

function validHexColor(value?: string | null, fallback = palette.red) {
  const color = (value ?? '').trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

function newestUnreadMailboxMessage(messages: MailboxMessageRecord[]) {
  return messages
    .filter((message) => (message.mailbox_folder ?? 'entrada') === 'entrada' && message.status === 'nuevo')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null;
}

export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [adminSessionBeforeViewAs, setAdminSessionBeforeViewAs] = useState<Session | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authScreenOpen, setAuthScreenOpen] = useState(false);
  const [profileInitialPanel, setProfileInitialPanel] = useState<ProfilePanel>('vista');
  const [floatingMailboxMessage, setFloatingMailboxMessage] = useState<MailboxMessageRecord | null>(null);
  const [dismissedMailboxMessageId, setDismissedMailboxMessageId] = useState<string | null>(null);
  const [authConfirmationOpen, setAuthConfirmationOpen] = useState(false);
  const [authConfirmationError, setAuthConfirmationError] = useState('');
  const [appMessage, setAppMessage] = useState('');
  const [successToastVisible, setSuccessToastVisible] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());
  const successToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrateSessionRef = useRef<(() => Promise<void>) | null>(null);
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const {
    hideTouchPointer,
    moveTouchPointer,
    showTouchPointer,
    touchPointer,
    touchPointerEnabled,
    touchPointerOpacity,
    updateTouchPointerPreference
  } = useTouchPointer({
    onError: (message) => {
      setAppMessage(message);
      setTimeout(() => setAppMessage(''), 1800);
    }
  });
  const {
    themeName,
    themeTransitionColor,
    themeTransitionProgress,
    themeTransitionVisible,
    updateThemePreference
  } = useAppThemePreference({
    onError: (message) => {
      setAppMessage(message);
      setTimeout(() => setAppMessage(''), 1800);
    }
  });
  const {
    activeTab,
    navigateToTab,
    setActiveTab,
    setTabHistory
  } = useAppNavigationState({
    drawerOpen,
    session,
    setAppMessage,
    setAuthScreenOpen,
    setDrawerOpen,
    setProfileInitialPanel
  });
  const {
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
  } = useAppBootstrapData({
    hydrateSession: async () => {
      await hydrateSessionRef.current?.();
    },
    onError: (message) => setAppMessage(message)
  });
  const baseAppTheme = themePresets[themeName] ?? themePresets.default;
  const identityPrimaryColor = validHexColor(adminConfig.identity.primaryColor, palette.red);
  const identitySecondaryColor = validHexColor(adminConfig.identity.secondaryColor, palette.blueDeep);
  const identityTextColor = validHexColor(adminConfig.identity.textColor, baseAppTheme.colors.text);
  const identityButtonColor = validHexColor(adminConfig.identity.buttonColor, identityPrimaryColor);
  const visibleAppVersionLabel = `${adminConfig.identity.releaseLabel?.trim() || appStageLabel} ${adminConfig.identity.releaseVersion?.trim() || appBetaVersion}`.trim();
  const appTheme = useMemo<AppTheme>(() => ({
    ...baseAppTheme,
    colors: {
      ...baseAppTheme.colors,
      primary: identityPrimaryColor,
      secondary: identitySecondaryColor,
      text: identityTextColor
    }
  }), [baseAppTheme, identityPrimaryColor, identitySecondaryColor, identityTextColor]);
  const isDarkTheme = appTheme.mode === 'dark';
  const { width: viewportWidth } = useWindowDimensions();
  const compactViewport = viewportWidth < 390;
  const veryCompactViewport = viewportWidth < 340;

  const showToastSuccess = useCallback((message = 'Cambios guardados') => {
    setAppMessage(message);
    setSuccessToastVisible(true);
    if (successToastTimerRef.current) {
      clearTimeout(successToastTimerRef.current);
    }
    successToastTimerRef.current = setTimeout(() => {
      setSuccessToastVisible(false);
      setAppMessage('');
    }, 1500);
  }, []);

  const showToastError = useCallback((message = 'No se pudo guardar') => {
    setAppMessage(message);
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
    setTimeout(() => setAppMessage(''), 1800);
  }, []);

  const { hydrateRealSession } = useAppSessionLinks({
    setActiveTab,
    setAdminSessionBeforeViewAs,
    setAppMessage,
    setAuthConfirmationError,
    setAuthConfirmationOpen,
    setAuthScreenOpen,
    setSession,
    onMailConfirmed: () => showToastSuccess('Mail confirmado correctamente.'),
    reloadAdminConfig,
    reloadAppContent,
    reloadRuntimeConfig,
    reloadTabSettings
  });
  hydrateSessionRef.current = hydrateRealSession;

  const currentDateTimeLabel = useMemo(() => {
    const date = currentDateTime.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = currentDateTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    return `${date} - ${time}`;
  }, [currentDateTime]);

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const resolvedTabs = useMemo<AppTabDisplay[]>(() => {
    const settingsByKey = new Map(tabSettings.map((item) => [item.key, item]));
    const builtInTabs = defaultTabs.map((tab) => {
        const setting = settingsByKey.get(tab.key);
        return {
          ...tab,
          label: setting?.label ?? tab.label,
          icon: isIoniconName(setting?.icon_name) ? setting.icon_name : tab.icon,
          sectionType: setting?.section_type ?? 'internal',
          visible: setting?.is_visible ?? true,
          sortOrder: setting?.sort_order ?? 999,
          visibleRoles: setting?.visible_roles ?? null
        };
      });
    const customTabs = tabSettings
      .filter((setting) => !defaultTabByKey.has(setting.key))
      .map((setting) => ({
        key: setting.key,
        label: setting.label,
        icon: isIoniconName(setting.icon_name) ? setting.icon_name : 'document-text-outline' as keyof typeof Ionicons.glyphMap,
        sectionType: setting.section_type ?? 'simple',
        visible: setting.is_visible,
        sortOrder: setting.sort_order,
        visibleRoles: setting.visible_roles ?? null
      }));

    return [...builtInTabs, ...customTabs]
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [tabSettings]);

  const visibleTabs = useMemo(() => {
    const currentRole = session?.role ?? 'invitado';
    const mustCompleteProfile = isMissingProfileScope(session);
    const maintenanceForUser = adminConfig.settings.maintenanceMode && currentRole !== 'administrador';
    const seen = new Set<string>();
    return resolvedTabs.filter((tab) => {
      if (tab.key === 'perfil') {
        return false;
      }
      if (maintenanceForUser) {
        return false;
      }
      if (mustCompleteProfile) {
        return false;
      }
      if (tab.key === 'periodo_motivador' && roleRank(currentRole as Role) < roleRank('sedimentador')) {
        return false;
      }
      if (!tab.visible || (tab.visibleRoles && !tab.visibleRoles.includes(currentRole)) || seen.has(tab.key)) {
        return false;
      }
      seen.add(tab.key);
      return true;
    });
  }, [resolvedTabs, session, adminConfig.settings.maintenanceMode]);

  const drawerWidth = Math.min(348, Math.max(286, viewportWidth * 0.86));
  const drawerItems = useMemo(() => {
    const items: AppDrawerItem[] = visibleTabs.map((tab) => ({
      key: tab.key,
      label: tab.label,
      icon: tab.icon,
      active: activeTab === tab.key,
      action: () => navigateToTab(tab.key)
    }));

    items.push({
      key: 'perfil',
      label: session ? 'Perfil' : 'Ingresar',
      icon: 'person-circle-outline',
      active: activeTab === 'perfil' && profileInitialPanel === 'vista',
      action: () => {
        if (!session) {
          setDrawerOpen(false);
          setAuthScreenOpen(true);
          return;
        }
        setProfileInitialPanel('vista');
        navigateToTab('perfil');
      }
    });

    if (canAccessPrivate(session)) {
      items.push({
        key: 'mi_comunidad',
        label: 'Mi Comunidad',
        icon: 'people-circle-outline',
        active: activeTab === 'perfil' && profileInitialPanel === 'comunidad',
        meta: session?.communityOfOrigin,
        action: () => {
          setProfileInitialPanel('comunidad');
          navigateToTab('perfil');
        }
      });
    }

    if (canManageUsersPanel(session) || isCommunityLeaderRole(session)) {
      items.push({
        key: 'panel_dirigencial',
        label: 'Panel Dirigencial',
        icon: 'shield-checkmark-outline',
        active: activeTab === 'perfil' && profileInitialPanel === 'vista',
        meta: 'Gestión interna',
        action: () => {
          setProfileInitialPanel('vista');
          navigateToTab('perfil');
        }
      });
    }

    return items;
  }, [visibleTabs, activeTab, profileInitialPanel, session]);

  const tabLabel = (key: TabKey) => resolvedTabs.find((tab) => tab.key === key)?.label ?? defaultTabs.find((tab) => tab.key === key)?.label ?? key;
  const {
    close: closeGlobalSearch,
    loading: globalSearchLoading,
    message: globalSearchMessage,
    open: globalSearchOpen,
    openResult: openGlobalSearchResult,
    profile: globalSearchProfile,
    query: globalSearchQuery,
    results: globalSearchResults,
    run: runGlobalSearch,
    setOpen: setGlobalSearchOpen,
    setProfile: setGlobalSearchProfile,
    setQuery: setGlobalSearchQuery
  } = useGlobalSearch({
    session,
    roleAliases: adminConfig.settings.roleAliases,
    tabLabel,
    navigateToTab
  });
  const pageEditorProps = (key: TabKey): PageEditorProps => ({
    tabKey: key,
    title: tabLabel(key),
    content: appContent.find((item) => item.tab_key === key),
    tab: resolvedTabs.find((tab) => tab.key === key),
    isAdmin: canEditPageContent(session, key),
    contentLoaded,
    onContentChanged: refreshPublishedContent,
    onTabsChanged: reloadTabSettings
  });

  function startAdminViewAs(nextSession: Session) {
    if (session?.role !== 'administrador') {
      showToastError('Solo Administrador puede usar Ver como.');
      return;
    }
    setAdminSessionBeforeViewAs(session);
    setSession({
      ...nextSession,
      id: undefined,
      email: undefined
    });
    setActiveTab('inicio');
    setTabHistory(['inicio']);
    showToastSuccess('Modo Ver como activado');
  }

  function stopAdminViewAs() {
    if (!adminSessionBeforeViewAs) {
      return;
    }
    setSession(adminSessionBeforeViewAs);
    setAdminSessionBeforeViewAs(null);
    setActiveTab('perfil');
    setTabHistory(['perfil']);
    showToastSuccess('Volviste a Administrador');
  }

  const dismissedMailboxKey = session?.id ? `palestra.mailboxFloatingDismissed.${session.id}` : '';

  async function refreshFloatingMailboxNotice() {
    if (!session?.id || session.role === 'invitado') {
      setFloatingMailboxMessage(null);
      return;
    }
    if (activeTab === 'perfil' && profileInitialPanel === 'buzon') {
      setFloatingMailboxMessage(null);
      return;
    }
    const unread = newestUnreadMailboxMessage(await fetchMailboxMessages());
    setFloatingMailboxMessage(unread && unread.id !== dismissedMailboxMessageId ? unread : null);
  }

  async function dismissFloatingMailboxNotice() {
    if (!floatingMailboxMessage) {
      return;
    }
    setDismissedMailboxMessageId(floatingMailboxMessage.id);
    setFloatingMailboxMessage(null);
    if (dismissedMailboxKey) {
      await AsyncStorage.setItem(dismissedMailboxKey, floatingMailboxMessage.id);
    }
  }

  async function openMailboxFromFloatingNotice() {
    if (floatingMailboxMessage && dismissedMailboxKey) {
      await AsyncStorage.setItem(dismissedMailboxKey, floatingMailboxMessage.id);
      setDismissedMailboxMessageId(floatingMailboxMessage.id);
    }
    setFloatingMailboxMessage(null);
    setProfileInitialPanel('buzon');
    navigateToTab('perfil');
  }

  useEffect(() => {
    let alive = true;
    setFloatingMailboxMessage(null);
    setDismissedMailboxMessageId(null);
    if (!session?.id || session.role === 'invitado') {
      return () => {
        alive = false;
      };
    }
    AsyncStorage.getItem(`palestra.mailboxFloatingDismissed.${session.id}`).then((value) => {
      if (alive) {
        setDismissedMailboxMessageId(value);
      }
    }).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [session?.id, session?.role]);

  useEffect(() => {
    if (!session?.id || session.role === 'invitado') {
      return;
    }
    refreshFloatingMailboxNotice();
    const timer = setInterval(refreshFloatingMailboxNotice, 45000);
    return () => clearInterval(timer);
  }, [session?.id, session?.role, activeTab, profileInitialPanel, dismissedMailboxMessageId]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const tabKey = response.notification.request.content.data?.tabKey;
      if (typeof tabKey === 'string') {
        navigateToTab(tabKey);
      }
    });
    return () => subscription.remove();
  }, [session?.id, activeTab]);

  useEffect(() => {
    let alive = true;

    async function registerDeviceForPushNotifications() {
      if (!session?.id) {
        return;
      }
      try {
        const result = await requestAndRegisterPushToken(session, true);
        if (!alive || result.status !== 'granted') {
          return;
        }
      } catch (error) {
        console.error('register push token', error);
      }
    }

    registerDeviceForPushNotifications();
    return () => {
      alive = false;
    };
  }, [session?.id]);

  useEffect(() => {
    screenOpacity.setValue(0.88);
    Animated.timing(screenOpacity, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();
  }, [activeTab, screenOpacity]);

  const screen = useMemo(() => {
    if (adminConfig.settings.maintenanceMode && session?.role !== 'administrador' && activeTab !== 'perfil' && !(adminConfig.settings.futureForumEnabled && activeTab === 'foro')) {
      return <MaintenanceScreen adminConfig={adminConfig} onNavigate={navigateToTab} />;
    }
    if (activeTab === 'inicio') {
      return <HomeScreen session={session} title={tabLabel('inicio')} content={appContent.find((item) => item.tab_key === 'inicio')} refreshKey={contentVersion} editor={pageEditorProps('inicio')} onNavigate={navigateToTab} adminConfig={adminConfig} />;
    }
    if (activeTab === 'notilestra') {
      return <NotilestraScreen session={session} title={tabLabel('notilestra')} content={appContent.find((item) => item.tab_key === 'notilestra')} refreshKey={contentVersion} editor={pageEditorProps('notilestra')} adminConfig={adminConfig} runtimeConfig={runtimeConfig} />;
    }
    if (activeTab === 'materiales') {
      return <MaterialsScreen session={session} title={tabLabel('materiales')} content={appContent.find((item) => item.tab_key === 'materiales')} refreshKey={contentVersion} editor={pageEditorProps('materiales')} />;
    }
    if (activeTab === 'oraciones') {
      return <LibrarySectionScreen session={session} title={tabLabel('oraciones')} section="oraciones" variant="prayer" content={appContent.find((item) => item.tab_key === 'oraciones')} editor={pageEditorProps('oraciones')} />;
    }
    if (activeTab === 'cancionero') {
      return <LibrarySectionScreen session={session} title={tabLabel('cancionero')} section="cancionero" variant="song" content={appContent.find((item) => item.tab_key === 'cancionero')} editor={pageEditorProps('cancionero')} />;
    }
    if (activeTab === 'himno') {
      return <LibrarySectionScreen session={session} title={tabLabel('himno')} section="himno" variant="song" content={appContent.find((item) => item.tab_key === 'himno')} editor={pageEditorProps('himno')} />;
    }
    if (activeTab === 'comunidades') {
      return <CommunitiesScreen session={session} title={tabLabel('comunidades')} content={appContent.find((item) => item.tab_key === 'comunidades')} refreshKey={contentVersion} nearbySearchEnabled={adminConfig.settings.nearbyCommunitySearchEnabled} secretariatsEnabled={adminConfig.settings.secretariatsEnabled !== false} editor={pageEditorProps('comunidades')} />;
    }
    if (activeTab === 'intenciones') {
      return <IntentionsScreen session={session} title={tabLabel('intenciones')} content={appContent.find((item) => item.tab_key === 'intenciones')} editor={pageEditorProps('intenciones')} prayerSeconds={adminConfig.intentions.prayerSeconds} />;
    }
    if (activeTab === 'historia') {
      return <HistoryScreen title={tabLabel('historia')} content={appContent.find((item) => item.tab_key === 'historia')} editor={pageEditorProps('historia')} />;
    }
    if (activeTab === 'contacto') {
      return <ContactScreen adminConfig={adminConfig} title={tabLabel('contacto')} content={appContent.find((item) => item.tab_key === 'contacto')} editor={pageEditorProps('contacto')} />;
    }
    if (activeTab === 'periodo_motivador') {
      return <MotivadorScreen session={session} title={tabLabel('periodo_motivador')} content={appContent.find((item) => item.tab_key === 'periodo_motivador')} refreshKey={contentVersion} editor={pageEditorProps('periodo_motivador')} adminConfig={adminConfig} />;
    }
    if (activeTab === 'foro') {
      return <ForumScreen session={session} title="Foro" />;
    }
    if (activeTab !== 'perfil') {
      return <DynamicNavigationSectionScreen session={session} tab={resolvedTabs.find((tab) => tab.key === activeTab)} title={tabLabel(activeTab)} content={appContent.find((item) => item.tab_key === activeTab)} editor={pageEditorProps(activeTab)} refreshKey={contentVersion} onNavigate={navigateToTab} />;
    }
    return <ProfileScreen session={session} onSessionChange={setSession} tabs={resolvedTabs} appContent={appContent} adminConfig={adminConfig} runtimeConfig={runtimeConfig} onRuntimeConfigChange={setRuntimeConfig} touchPointerEnabled={touchPointerEnabled} onTouchPointerEnabledChange={updateTouchPointerPreference} themeName={themeName} appTheme={appTheme} onThemeChange={updateThemePreference} onAdminConfigChange={setAdminConfig} onTabsChanged={reloadTabSettings} onContentChanged={refreshPublishedContent} onNavigate={navigateToTab} onSavedFeedback={showToastSuccess} onErrorFeedback={showToastError} onViewAsSession={startAdminViewAs} initialPanel={profileInitialPanel} initialPublicProfile={globalSearchProfile} onInitialPublicProfileHandled={() => setGlobalSearchProfile(null)} />;
  }, [activeTab, session, resolvedTabs, appContent, contentVersion, adminConfig, runtimeConfig, touchPointerEnabled, themeName, appTheme, profileInitialPanel, globalSearchProfile]);

  return (
    <SafeAreaProvider>
      <AppThemeContext.Provider value={appTheme}>
        <SafeAreaView
        style={[styles.safeArea, isDarkTheme && styles.safeAreaDark]}
        onTouchStart={(event) => {
          const { pageX, pageY } = event.nativeEvent;
          showTouchPointer(pageX, pageY);
        }}
        onTouchMove={(event) => {
          const { pageX, pageY } = event.nativeEvent;
          moveTouchPointer(pageX, pageY);
        }}
        onTouchEnd={hideTouchPointer}
        onTouchCancel={hideTouchPointer}
        onTouchEndCapture={(event) => {
          const { pageX, pageY } = event.nativeEvent;
          if (touchPointerEnabled && pageX && pageY) {
            moveTouchPointer(pageX, pageY);
          }
        }}
      >
        {isBooting ? <AppLoadingScreen /> : null}
        {authScreenOpen && !session ? (
          <AuthScreen
            onClose={() => setAuthScreenOpen(false)}
            onAuthenticated={(nextSession) => {
              setSession(nextSession);
              setAuthScreenOpen(false);
              setActiveTab('inicio');
              setTabHistory(['inicio']);
            }}
          />
        ) : null}
        <Modal visible={authConfirmationOpen} transparent={false} animationType="fade" onRequestClose={() => setAuthConfirmationOpen(false)}>
          <MailConfirmedScreen
            isError={Boolean(authConfirmationError)}
            message={authConfirmationError || undefined}
            onEnter={() => {
              setAuthConfirmationOpen(false);
              setAuthConfirmationError('');
              setAuthScreenOpen(true);
              setActiveTab('perfil');
            }}
          />
        </Modal>
        {touchPointer && touchPointerEnabled ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.tapCircle,
              {
                left: touchPointer.x - 24,
                top: touchPointer.y - 24,
                opacity: touchPointerOpacity,
                transform: [
                  {
                    scale: touchPointerOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.82, 1]
                    })
                  }
                ]
              }
            ]}
          />
        ) : null}
        <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
        {runtimeConfig.maintenanceMode || runtimeConfig.globalMessage ? (
          <View style={[styles.runtimeBanner, runtimeConfig.maintenanceMode && styles.runtimeBannerWarning]}>
            <Ionicons name={runtimeConfig.maintenanceMode ? 'warning-outline' : 'information-circle-outline'} size={17} color={palette.white} />
            <Text style={styles.runtimeBannerText}>{runtimeConfig.maintenanceMode ? 'Modo mantenimiento activo.' : runtimeConfig.globalMessage}</Text>
          </View>
        ) : null}
        <View style={[styles.header, isDarkTheme && styles.headerDark]}>
          <TouchableOpacity style={styles.brandBlock} onPress={() => navigateToTab('inicio')} activeOpacity={0.85}>
            <View style={[styles.brandLogo, { backgroundColor: identityPrimaryColor }]}>
              <Image source={palestraLogo} style={styles.brandLogoImage} />
            </View>
            <View style={styles.brandTextBlock}>
              <Text numberOfLines={1} style={[styles.brand, isDarkTheme && styles.brandDark]}>{adminConfig.identity.appName}</Text>
              <Text numberOfLines={1} style={[styles.subtitle, isDarkTheme && styles.subtitleDark]}>{adminConfig.identity.subtitle}</Text>
              <Text numberOfLines={1} style={styles.versionBadge}>{visibleAppVersionLabel}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <View style={styles.headerActionTop}>
              <TouchableOpacity style={[styles.headerMenuButton, isDarkTheme && styles.headerPillDark]} onPress={() => setGlobalSearchOpen(true)} activeOpacity={0.85}>
                <Ionicons name="search-outline" size={21} color={identityPrimaryColor} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerProfileButton, isDarkTheme && styles.headerPillDark]} onPress={() => navigateToTab('perfil')} activeOpacity={0.85}>
                <Ionicons name="person-circle-outline" size={17} color={identityPrimaryColor} />
                {!veryCompactViewport ? <Text style={[styles.headerProfileButtonText, { color: identityPrimaryColor }]}>{session ? 'Mi Perfil' : 'Ingresar'}</Text> : null}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerMenuButton, isDarkTheme && styles.headerPillDark]} onPress={() => setDrawerOpen(true)} activeOpacity={0.85}>
                <Ionicons name="menu-outline" size={22} color={identityPrimaryColor} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <AppDrawer
          drawerWidth={drawerWidth}
          identityPrimaryColor={identityPrimaryColor}
          isDarkTheme={isDarkTheme}
          items={drawerItems}
          logo={palestraLogo}
          onClose={() => setDrawerOpen(false)}
          roleLabel={session ? displayRoleLabel(session.role, session.province, [], [], null, session.genderPreference) : 'Invitado'}
          visible={drawerOpen}
        />
        <Modal visible={globalSearchOpen} transparent animationType="fade" onRequestClose={closeGlobalSearch} statusBarTranslucent>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalKeyboardAvoider}>
              <View style={[styles.modalPanel, styles.globalSearchPanel, isDarkTheme && styles.surfacePanelDark]}>
                <TouchableOpacity style={styles.modalCloseButton} onPress={closeGlobalSearch} activeOpacity={0.8}>
                  <Ionicons name="close" size={22} color={palette.red} />
                </TouchableOpacity>
                <Text style={[styles.cardEyebrow, isDarkTheme && styles.textDarkAccent]}>Búsqueda global</Text>
                <View style={styles.globalSearchRow}>
                  <TextInput
                    style={[styles.input, styles.globalSearchInput, isDarkTheme && styles.inputDark]}
                    placeholder="Usuarios, comunidades, PMs, noticias..."
                    value={globalSearchQuery}
                    onChangeText={setGlobalSearchQuery}
                    onSubmitEditing={runGlobalSearch}
                    returnKeyType="search"
                    autoCapitalize="none"
                    placeholderTextColor={inputPlaceholderColor}
                  />
                  <TouchableOpacity style={[styles.globalSearchButton, { backgroundColor: identityPrimaryColor }]} onPress={runGlobalSearch} disabled={globalSearchLoading} activeOpacity={0.84}>
                    <Ionicons name={globalSearchLoading ? 'hourglass-outline' : 'search-outline'} size={20} color={palette.white} />
                  </TouchableOpacity>
                </View>
                {globalSearchMessage ? <Text style={[styles.cardText, isDarkTheme && styles.textDarkBody]}>{globalSearchMessage}</Text> : null}
                <ScrollView
                  style={styles.globalSearchResultsScroll}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                  contentContainerStyle={styles.globalSearchResults}
                >
                  {globalSearchResults.map((result) => (
                    <TouchableOpacity key={result.id} style={[styles.innerNewsCard, isDarkTheme && styles.surfaceRowDark]} onPress={() => openGlobalSearchResult(result)} activeOpacity={0.86}>
                      <Text style={[styles.cardEyebrow, isDarkTheme && styles.textDarkAccent]}>{result.type}</Text>
                      <Text style={[styles.cardTitle, isDarkTheme && styles.textDarkStrong]}>{result.title}</Text>
                      <Text style={[styles.cardText, isDarkTheme && styles.textDarkBody]}>{result.subtitle}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
        {adminSessionBeforeViewAs ? (
          <View style={styles.viewAsBanner}>
            <Ionicons name="eye-outline" size={17} color={palette.white} />
            <Text style={styles.viewAsBannerText}>Ver como: {roleLabel(session?.role ?? 'invitado', session?.genderPreference)}</Text>
            <TouchableOpacity style={styles.viewAsExitButton} onPress={stopAdminViewAs}>
              <Text style={styles.viewAsExitText}>Volver a Administrador</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {successToastVisible ? (
          <View pointerEvents="none" style={styles.successToastOverlay}>
            <View style={styles.successToastCard}>
              <Ionicons name="checkmark-circle" size={22} color={palette.white} />
              <Text style={styles.successToastText}>{appMessage || 'Cambios guardados'}</Text>
            </View>
          </View>
        ) : null}
        {appMessage && !successToastVisible ? (
          <View pointerEvents="none" style={styles.appToast}>
            <Text style={styles.appToastText}>{appMessage}</Text>
          </View>
        ) : null}
        {floatingMailboxMessage && session && !(activeTab === 'perfil' && profileInitialPanel === 'buzon') ? (
          <View style={[styles.mailboxFloatingNotice, isDarkTheme && styles.mailboxFloatingNoticeDark]}>
            <TouchableOpacity style={styles.mailboxFloatingMain} onPress={openMailboxFromFloatingNotice} activeOpacity={0.86}>
              <View style={[styles.mailboxFloatingIcon, { backgroundColor: identityPrimaryColor }]}>
                <Ionicons name="mail-unread-outline" size={22} color={palette.white} />
              </View>
              <View style={styles.mailboxFloatingTextBlock}>
                <Text numberOfLines={1} style={[styles.mailboxFloatingTitle, isDarkTheme && styles.textDarkStrong]}>Mensaje nuevo</Text>
                <Text numberOfLines={1} style={[styles.mailboxFloatingMeta, isDarkTheme && styles.textDarkMuted]}>
                  {floatingMailboxMessage.sender_name || 'Buzon'}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mailboxFloatingClose} onPress={dismissFloatingMailboxNotice} activeOpacity={0.82}>
              <Ionicons name="close" size={16} color={identityPrimaryColor} />
            </TouchableOpacity>
          </View>
        ) : null}
        {themeTransitionVisible ? (
          <View pointerEvents="none" style={styles.themeTransitionLayer}>
            <Animated.View
              style={[
                styles.themePaintSplash,
                {
                  backgroundColor: themeTransitionColor,
                  opacity: themeTransitionProgress.interpolate({
                    inputRange: [0, 0.08, 1],
                    outputRange: [0, 1, 1]
                  }),
                  transform: [
                    {
                      scale: themeTransitionProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.18, 18]
                      })
                    }
                  ]
                }
              ]}
            />
            <Animated.View
              style={[
                styles.themePaintDrop,
                styles.themePaintDropOne,
                {
                  backgroundColor: themeTransitionColor,
                  opacity: themeTransitionProgress.interpolate({
                    inputRange: [0, 0.2, 1],
                    outputRange: [0, 0.75, 0.2]
                  }),
                  transform: [
                    {
                      scale: themeTransitionProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.1, 3.6]
                      })
                    }
                  ]
                }
              ]}
            />
            <Animated.View
              style={[
                styles.themePaintDrop,
                styles.themePaintDropTwo,
                {
                  backgroundColor: themeTransitionColor,
                  opacity: themeTransitionProgress.interpolate({
                    inputRange: [0, 0.28, 1],
                    outputRange: [0, 0.64, 0.16]
                  }),
                  transform: [
                    {
                      scale: themeTransitionProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.1, 2.9]
                      })
                    }
                  ]
                }
              ]}
            />
          </View>
        ) : null}
        <KeyboardAvoidingView
          style={styles.contentKeyboardAvoider}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 12}
        >
          <ScrollView
            contentContainerStyle={[styles.content, isDarkTheme && styles.contentDark]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            overScrollMode="always"
            refreshControl={(
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => refreshAppContent('manual')}
                colors={[identityPrimaryColor]}
                tintColor={identityPrimaryColor}
                progressBackgroundColor={isDarkTheme ? themePresets.dark.colors.surface : palette.white}
              />
            )}
          >
            <Animated.View style={{ opacity: screenOpacity }}>
              {screen}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
        </SafeAreaView>
      </AppThemeContext.Provider>
    </SafeAreaProvider>
  );
}
