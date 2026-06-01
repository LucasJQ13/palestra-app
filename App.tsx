import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Animated, BackHandler, Easing, Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, RefreshControl, ScrollView, StatusBar, Switch, Text, TextInput, ToastAndroid, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { palette } from './src/theme/palette';
import { AppTheme, ThemeName, themePresets } from './src/theme/themes';
import { AppThemeContext, useIsDarkTheme } from './src/theme/ThemeContext';
import { auditLog, calendarActivities, communities, contactInfo, communityNews, faqItems, internalMessages, materials, movementHistory, news, notilestra, pendingUsers, roleDefinitions } from './src/data/content';
import { Permission, PersonalPmType, Role, Session } from './src/types/auth';
import { getPermissionsForRole, rolePermissions } from './src/lib/permissions';
import { AppCommunity, PublicationComment, RemoteAgendaItem, archiveAgendaEvent, archiveCommunityPublication, archiveNewsEntry, createCommunityPublication, createPublicationComment, fetchCommunities, fetchCommunityPublications, fetchMotivadorPeriods, fetchNews, fetchNotilestra, fetchPublicationComments, reactToPublication, reportPublication, updateAgendaEvent, updateCommunityPublication, updateNewsEntry, voteCommunityPoll } from './src/lib/remoteData';
import { AdminUser, AdminUserLoginDiagnostic, AppContentBlock, AppMaterialRecord, AppTabSectionType, AppTabSetting, ChurchDocumentButtonRecord, CommunityMember, ContentEditorBlock, MailboxMessageRecord, MailboxTargetMode, MotivadorPeriodRecord, NewsDraftRecord, ProvinceRoleLabelRecord, RoleAliasRecord, RolePermissionRecord, UserAgendaPreferenceRecord, UserRequestRecord, acceptDiocesanCoordinatorRequest, approveProfile, archiveAppMaterial, archiveChurchDocumentButton, archiveCommunity, confirmAdminUserEmail, createAdminBasicUser, createAppTab, createCommunity, createCommunityContactMessage, createEmailConfirmationRequest, createEvent, createNews, createLeadershipChangeRequest, createMailboxMessage, createNotificationIntent, createUserRequest, debugPushToDevice, deleteAdminUserByEmail, deleteAppTab, deliverNotificationIntent, diagnoseAdminUserLogin, fetchAdminConfig, fetchAdminMotivadorPeriods, fetchAdminRequests, fetchAdminUsers, fetchAppContent, fetchAppMaterials, fetchAppTabs, fetchAssignableRoleAliases, fetchChurchDocumentButtons, fetchMailboxMessages, fetchMyCommunityMembers, fetchMyRequests, fetchNewsDrafts, fetchPendingProfiles, fetchProvinceRoleLabels, fetchPublicProfile, fetchRolePermissions, fetchUserAgendaPreferences, PendingProfile, registerPushToken, repairAdminUserLogin, resolveUserRequest, respondMailboxMessage, restoreDefaultAppTabs, saveAdminConfig, saveAdminInstagram, saveAppMaterial, saveChurchDocumentButton, saveMotivadorPeriod, saveNewsDraft, saveProvinceRoleLabel, saveRoleAlias, saveRolePermissions, setCommunityStatus, setMailboxMessageStatus, setMotivadorPeriodStatus, setRoleAliasStatus, setUserAgendaPreference, softDeleteAdminUser, updateAdminUser, updateAppContent, updateAppTab, updateAppTabPosition, updateCommunity, updateMyAvatar, updateMyProfile, updateMyProfileDetails } from './src/lib/profiles';
import { supabase } from './src/lib/supabase';
import { getMyProfileSession } from './src/lib/authProfile';
import { ForumCategory, ForumComment, ForumTopic, archiveForumComment, archiveForumTopic, canUseForumCategory, createForumComment, createForumTopic, fetchForumCategories, fetchForumComments, fetchForumTopics, setForumTopicStatus, updateForumTopic, visibleForumRolesFor } from './src/lib/forum';
import { AppLibraryItem, LibrarySection, archiveLibraryItem, debugLibraryPermission, fetchLibraryItems, saveLibraryItem } from './src/lib/library';
import { assignableRolesFor, canAccessProvince, canApproveRole, canEditCommunity, canManageProvince, canSeeAllProvinces, roleRank, visibleHierarchyFor } from './src/lib/roles';
import { ExternalCatholicNewsItem, fetchExternalCatholicNews } from './src/lib/externalNews';
import { ExternalNewsCarousel } from './src/components/ExternalNewsCarousel';
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
import { AppRuntimeConfig, CatholicNewsSourceKey, defaultRuntimeConfig, fetchAppRuntimeConfig, saveAppRuntimeConfig } from './src/lib/runtimeConfig';
import { appRuntimeOwner, appVersionLabel, authDeepLinkBaseUrl, currentYear, defaultProvinceInstagram, easProjectId, inputPlaceholderColor, localReminderNotificationKey, officialInstagramUrl, palestraLogo, perseveranceStartYears, provinceDisplayNames, provinceLogos, pushDeviceIdKey, themePreferenceKey, touchPointerPreferenceKey } from './src/lib/constants';
import { adminModuleCatalog, AppTabDisplay, defaultTabByKey, defaultTabs, isIoniconName, navigationIconSuggestions, navigationSectionTypes, normalizeTabKey, PageEditorProps, protectedTabKeys } from './src/lib/navigationConstants';
import { AppAdminConfig, ContactBlock, defaultAdminConfig, normalizeAdminConfig, RoleAliasConfig } from './src/lib/appConfig';
import { normalizeExternalUrl } from './src/lib/urls';
import { uploadPickedImageToPublicUrl } from './src/lib/uploads';
import { credentialDisplayName, displayRoleLabel, firstNameOf, GenderPreference, genderNarratives, homeGreeting, homeGreetingName, perseveranceLabel, personalPmSummary, personalPmTypeLabel, renderGreetingTemplate, roleLabel, roleLabelForProvince, roleShortLabel } from './src/lib/profileDisplay';
import { changeDone, communityDowngradesRole, friendlyUploadError, hasPlausibleEmailDomain, isMissingProfileScope, isValidEmail, provinceDowngradesRole, safeAuthError, verifyEmailDomainExists } from './src/lib/appMessages';
import { buildInitialBlocksForSection, splitConfigValue, tabLabelFromKey } from './src/lib/contentBlocks';
import { canAccessPrivate, canCreateOrAdministrateCommunities, canEditAdminUser, canEditPageContent, canEditStaticInstitutionalPage, canManageGlobalInstagram, canManageMotivadorPanel, canManageNationalPublishedContent, canManageNewsContent, canManagePublishedContent, canManageUsersPanel, canUseCommunityAdmin, hasPermission, isCommunityLeaderRole, leadershipPanelTitle } from './src/lib/sessionAccess';
import { AdminModule, AdminRequest, GlobalSearchResult, ProfilePanel, PublicProfilePreview } from './src/types/appUi';
import { internalTestSessions } from './src/lib/internalTestSessions';
import { permissionOptions } from './src/lib/permissionLabels';
import { getAndroidChannelDebug, getFriendlyPushError, notificationTitleFor, requestAndRegisterPushToken, showFeedbackMessage } from './src/lib/notificationHelpers';
import { AgendaItem, agendaPreferenceKey, cancelLocalReminderNotification, groupMotivadorFeedItems, readReminderNotificationMap, scheduleLocalReminderNotification, splitAgendaPreferences } from './src/lib/agendaHelpers';


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

export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('inicio');
  const [tabHistory, setTabHistory] = useState<TabKey[]>(['inicio']);
  const [session, setSession] = useState<Session | null>(null);
  const [adminSessionBeforeViewAs, setAdminSessionBeforeViewAs] = useState<Session | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authScreenOpen, setAuthScreenOpen] = useState(false);
  const [profileInitialPanel, setProfileInitialPanel] = useState<ProfilePanel>('vista');
  const [touchPointer, setTouchPointer] = useState<{ x: number; y: number } | null>(null);
  const [touchPointerEnabled, setTouchPointerEnabled] = useState(false);
  const [themeName, setThemeName] = useState<ThemeName>('default');
  const [tabSettings, setTabSettings] = useState<AppTabSetting[]>([]);
  const [appContent, setAppContent] = useState<AppContentBlock[]>([]);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [adminConfig, setAdminConfig] = useState<AppAdminConfig>(defaultAdminConfig);
  const [runtimeConfig, setRuntimeConfig] = useState<AppRuntimeConfig>(defaultRuntimeConfig);
  const [authConfirmationOpen, setAuthConfirmationOpen] = useState(false);
  const [authConfirmationError, setAuthConfirmationError] = useState('');
  const [contentVersion, setContentVersion] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<GlobalSearchResult[]>([]);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [globalSearchMessage, setGlobalSearchMessage] = useState('');
  const [globalSearchProfile, setGlobalSearchProfile] = useState<PublicProfilePreview | null>(null);
  const [appMessage, setAppMessage] = useState('');
  const [successToastVisible, setSuccessToastVisible] = useState(false);
  const [themeTransitionVisible, setThemeTransitionVisible] = useState(false);
  const [themeTransitionColor, setThemeTransitionColor] = useState('#2B2B2B');
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());
  const lastBackPressRef = useRef(0);
  const successToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const touchPointerOpacity = useRef(new Animated.Value(0)).current;
  const themeTransitionProgress = useRef(new Animated.Value(0)).current;
  const baseAppTheme = themePresets[themeName] ?? themePresets.default;
  const identityPrimaryColor = validHexColor(adminConfig.identity.primaryColor, palette.red);
  const identitySecondaryColor = validHexColor(adminConfig.identity.secondaryColor, palette.blueDeep);
  const identityTextColor = validHexColor(adminConfig.identity.textColor, baseAppTheme.colors.text);
  const identityButtonColor = validHexColor(adminConfig.identity.buttonColor, identityPrimaryColor);
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

  useEffect(() => {
    AsyncStorage.getItem(touchPointerPreferenceKey)
      .then((value) => setTouchPointerEnabled(value === 'true'))
      .catch((error) => console.error('touch pointer preference', error));
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(themePreferenceKey)
      .then((value) => {
        if (value && value in themePresets) {
          setThemeName(value as ThemeName);
        }
      })
      .catch((error) => console.error('theme preference', error));
  }, []);

  async function updateThemePreference(nextTheme: ThemeName) {
    setThemeTransitionColor(nextTheme === 'dark' ? themePresets.dark.colors.background : '#E6F3F5');
    setThemeTransitionVisible(true);
    themeTransitionProgress.setValue(0);
    Animated.timing(themeTransitionProgress, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start(() => {
      setThemeName(nextTheme);
      Animated.timing(themeTransitionProgress, {
        toValue: 0,
        duration: 260,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true
      }).start(() => setThemeTransitionVisible(false));
    });
    try {
      await AsyncStorage.setItem(themePreferenceKey, nextTheme);
    } catch (error) {
      console.error('save theme preference', error);
      setAppMessage('No pude guardar el tema visual.');
      setTimeout(() => setAppMessage(''), 1800);
    }
  }

  async function updateTouchPointerPreference(value: boolean) {
    setTouchPointerEnabled(value);
    try {
      await AsyncStorage.setItem(touchPointerPreferenceKey, value ? 'true' : 'false');
    } catch (error) {
      console.error('save touch pointer preference', error);
      setAppMessage('No pude guardar la preferencia del puntero.');
      setTimeout(() => setAppMessage(''), 1800);
    }
  }

  function showTouchPointer(x: number, y: number) {
    if (!touchPointerEnabled) {
      return;
    }

    setTouchPointer({ x, y });
    Animated.timing(touchPointerOpacity, {
      toValue: 1,
      duration: 90,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();
  }

  function moveTouchPointer(x: number, y: number) {
    if (!touchPointerEnabled) {
      return;
    }

    setTouchPointer({ x, y });
  }

  function hideTouchPointer() {
    if (!touchPointerEnabled) {
      return;
    }

    Animated.timing(touchPointerOpacity, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished) {
        setTouchPointer(null);
      }
    });
  }

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
    const items: Array<{
      key: string;
      label: string;
      icon: keyof typeof Ionicons.glyphMap;
      action: () => void;
      active: boolean;
      meta?: string;
    }> = visibleTabs.map((tab) => ({
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

  async function hydrateRealSession() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return;
    }

    const result = await getMyProfileSession(data.user.email ?? 'Usuario');
    if (result.session) {
      setSession(result.session);
      setAdminSessionBeforeViewAs(null);
    }
  }

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

  async function refreshAppContent(source = 'manual') {
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
        hydrateRealSession()
      ]);
      setContentVersion((current) => current + 1);
    } catch (error) {
      console.error('refreshAppContent', error);
      setAppMessage(error instanceof Error ? error.message : 'No pude actualizar. Revisa la conexion.');
    } finally {
      setIsRefreshing(false);
    }
  }

  async function runGlobalSearch() {
    const query = globalSearchQuery.trim().toLowerCase();
    if (query.length < 2) {
      setGlobalSearchResults([]);
      setGlobalSearchMessage('Escribe al menos 2 caracteres.');
      return;
    }

    setGlobalSearchLoading(true);
    setGlobalSearchMessage('');
    try {
      const [
        communitiesRemote,
        materialsRemote,
        contentRemote,
        newsRemote,
        agendaRemote,
        pmRemote,
        communityPublicationsRemote,
        adminUsersRemote
      ] = await Promise.all([
        fetchCommunities(),
        fetchAppMaterials(session?.role === 'administrador'),
        fetchAppContent(),
        fetchNews(session),
        fetchNotilestra(session),
        fetchMotivadorPeriods(session),
        fetchCommunityPublications(session),
        canManageUsersPanel(session) ? fetchAdminUsers() : Promise.resolve([] as AdminUser[])
      ]);

      const matches = (values: Array<string | null | undefined>) => values
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));

      const nextResults: GlobalSearchResult[] = [];

      adminUsersRemote.forEach((user) => {
        if (matches([user.full_name, user.nickname])) {
          const role = (user.role || 'palestrista') as Role;
          nextResults.push({
            id: `user-${user.id}`,
            type: 'usuario',
            title: user.full_name ?? 'Usuario',
            subtitle: `${displayRoleLabel(role, user.province, [], adminConfig.settings.roleAliases, user.display_role_label, user.gender_preference ?? null)} - ${user.community_name ?? 'Sin comunidad'} - ${user.province ?? 'Sin provincia'}`,
            tab: 'perfil',
            publicProfile: {
              id: user.id,
              fullName: user.full_name ?? 'Usuario',
              role,
              province: user.province,
              communityName: user.community_name,
              avatarUrl: user.avatar_url,
              contact: user.phone ?? '',
              displayRoleLabel: user.display_role_label ?? null,
              genderPreference: user.gender_preference ?? null,
              nickname: user.nickname ?? null,
              credentialNameMode: user.credential_name_mode ?? 'name',
              perseveranceStartYear: user.perseverance_start_year ?? null,
              personalPmType: user.personal_pm_type ?? null,
              personalPmNumber: user.personal_pm_number ?? null,
              personalPmProvince: user.personal_pm_province ?? null,
              personalPmMotto: user.personal_pm_motto ?? user.pm_motto ?? null,
              pmMotto: user.pm_motto ?? null
            }
          });
        }
      });

      communitiesRemote.forEach((province) => {
        province.locations.forEach((community) => {
          if (matches([province.province, community.name, community.address, community.description, community.phone])) {
            nextResults.push({
              id: `community-${community.id ?? province.province}-${community.name}`,
              type: 'comunidad',
              title: community.name,
              subtitle: `${province.province} - ${community.address}`,
              tab: 'comunidades'
            });
          }
        });
      });

      materialsRemote.forEach((material) => {
        if (matches([material.title, material.description, material.category, material.required_permission, material.visibility])) {
          nextResults.push({
            id: `material-${material.id}`,
            type: 'descarga',
            title: material.title,
            subtitle: `${material.category ?? 'Material'} - ${material.visibility}`,
            tab: 'materiales'
          });
        }
      });

      newsRemote.forEach((item: any, index: number) => {
        if (matches([item.title, item.body, item.scope, item.province])) {
          nextResults.push({
            id: `news-${item.id ?? index}`,
            type: 'noticia',
            title: item.title,
            subtitle: item.scope ?? 'Noticia',
            tab: 'inicio'
          });
        }
      });

      agendaRemote.forEach((item: any, index: number) => {
        if (matches([item.title, item.body, item.scope, item.date])) {
          nextResults.push({
            id: `agenda-${item.id ?? index}`,
            type: 'noticia',
            title: item.title,
            subtitle: `${item.scope ?? 'Agenda'} - ${item.date}`,
            tab: 'notilestra'
          });
        }
      });

      pmRemote.forEach((item: any, index: number) => {
        if (matches([item.title, item.body, item.scope, item.province, item.date])) {
          nextResults.push({
            id: `pm-${item.id ?? index}`,
            type: 'pm',
            title: item.title,
            subtitle: `${item.scope ?? 'PM'} - ${item.date}`,
            tab: 'periodo_motivador'
          });
        }
      });

      communityPublicationsRemote.forEach((item: any, index: number) => {
        if (matches([item.title, item.body, item.communityName, item.scope, item.visibility])) {
          nextResults.push({
            id: `community-publication-${item.id ?? index}`,
            type: 'aviso',
            title: item.title,
            subtitle: item.scope ?? item.communityName ?? 'Aviso comunitario',
            tab: 'perfil'
          });
        }
      });

      contentRemote.forEach((item) => {
        const blocksText = Array.isArray(item.blocks) ? item.blocks.map((block) => `${block.type ?? ''} ${block.value ?? ''}`).join(' ') : '';
        if (matches([item.tab_key, item.title, item.body, blocksText])) {
          nextResults.push({
            id: `content-${item.tab_key}`,
            type: 'contenido',
            title: item.title || item.tab_key,
            subtitle: tabLabel(item.tab_key as TabKey),
            tab: item.tab_key as TabKey
          });
        }
      });

      setGlobalSearchResults(nextResults.slice(0, 80));
      setGlobalSearchMessage(nextResults.length ? '' : 'No encontré resultados remotos para esa búsqueda.');
    } catch (error) {
      console.error('global search', error);
      setGlobalSearchMessage('No pude buscar en Supabase. Revisa la conexión.');
    } finally {
      setGlobalSearchLoading(false);
    }
  }

  function openGlobalSearchResult(result: GlobalSearchResult) {
    setGlobalSearchOpen(false);
    if (result.publicProfile) {
      setGlobalSearchProfile(result.publicProfile);
      navigateToTab('perfil');
      return;
    }
    if (result.tab) {
      navigateToTab(result.tab);
    }
  }

  function navigateToTab(nextTab: TabKey) {
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
  }

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const tabKey = response.notification.request.content.data?.tabKey;
      if (typeof tabKey === 'string') {
        navigateToTab(tabKey);
      }
    });
    return () => subscription.remove();
  }, [session?.id, activeTab]);

  function goBackInApp() {
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
  }

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

  async function handleDeepLinkUrl(url: string) {
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
      setAppMessage('Mail confirmado correctamente.');
    } catch (error) {
      setAuthConfirmationError('No pudimos procesar el link de confirmación. Abrí Palestra APP e intentá iniciar sesión.');
      setAuthConfirmationOpen(true);
      console.error('auth callback link', error);
    }
  }

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', goBackInApp);
    return () => subscription.remove();
  }, [activeTab, tabHistory, drawerOpen]);

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
  }, [session, activeTab]);

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
              <Text numberOfLines={1} style={styles.versionBadge}>{appVersionLabel}</Text>
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
        <Modal visible={drawerOpen} transparent animationType="fade" onRequestClose={() => setDrawerOpen(false)}>
          <View style={styles.drawerOverlay}>
            <Pressable style={styles.drawerBackdrop} onPress={() => setDrawerOpen(false)} />
            <SafeAreaView edges={['top', 'bottom']} style={[styles.drawerPanel, isDarkTheme && styles.drawerPanelDark, { width: drawerWidth }]}>
              <View style={styles.drawerHeader}>
                <View style={[styles.drawerLogo, { backgroundColor: identityPrimaryColor }]}>
                  <Image source={palestraLogo} style={styles.brandLogoImage} />
                </View>
                <View style={styles.drawerHeaderText}>
                  <Text numberOfLines={1} style={[styles.drawerTitle, isDarkTheme && styles.drawerTitleDark]}>Palestra</Text>
                  <Text numberOfLines={1} style={[styles.drawerSubtitle, isDarkTheme && styles.drawerSubtitleDark]}>{session ? displayRoleLabel(session.role, session.province, [], [], null, session.genderPreference) : 'Invitado'}</Text>
                </View>
                <TouchableOpacity style={[styles.drawerCloseButton, isDarkTheme && styles.drawerCloseButtonDark]} onPress={() => setDrawerOpen(false)} activeOpacity={0.85}>
                  <Ionicons name="close-outline" size={22} color={isDarkTheme ? themePresets.dark.colors.text : palette.ink} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.drawerScroll} contentContainerStyle={styles.drawerScrollContent} showsVerticalScrollIndicator={false}>
                {drawerItems.map((item) => (
                  <TouchableOpacity key={item.key} style={[styles.drawerItem, isDarkTheme && styles.drawerItemDark, item.active && styles.drawerItemActive, item.active && isDarkTheme && styles.drawerItemActiveDark]} onPress={item.action} activeOpacity={0.84}>
                    <View style={[styles.drawerIconFrame, isDarkTheme && styles.drawerIconFrameDark, item.active && styles.drawerIconFrameActive, item.active && { backgroundColor: identityPrimaryColor, borderColor: identityPrimaryColor }]}>
                      <Ionicons name={item.icon} size={20} color={item.active ? palette.white : identityPrimaryColor} />
                    </View>
                    <View style={styles.drawerItemTextBlock}>
                      <Text numberOfLines={1} style={[styles.drawerItemText, isDarkTheme && styles.drawerItemTextDark, item.active && styles.drawerItemTextActive]}>{item.label}</Text>
                      {item.meta ? <Text numberOfLines={1} style={[styles.drawerItemMeta, isDarkTheme && styles.drawerItemMetaDark]}>{item.meta}</Text> : null}
                    </View>
                    {item.active ? <Ionicons name="ellipse" size={8} color={identityPrimaryColor} /> : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>
        <Modal visible={globalSearchOpen} transparent animationType="fade" onRequestClose={() => setGlobalSearchOpen(false)} statusBarTranslucent>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKeyboardAvoider}>
              <View style={[styles.modalPanel, styles.globalSearchPanel, isDarkTheme && styles.surfacePanelDark]}>
                <TouchableOpacity style={styles.modalCloseButton} onPress={() => setGlobalSearchOpen(false)} activeOpacity={0.8}>
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
                <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.globalSearchResults}>
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
              <Text style={styles.successToastText}>Cambios guardados</Text>
            </View>
          </View>
        ) : null}
        {appMessage && !successToastVisible ? (
          <View pointerEvents="none" style={styles.appToast}>
            <Text style={styles.appToastText}>{appMessage}</Text>
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
