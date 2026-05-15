import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Animated, BackHandler, Easing, Image, Modal, Platform, RefreshControl, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { palette } from './src/theme/palette';
import { auditLog, calendarActivities, communities, contactInfo, communityNews, demoRequests, faqItems, internalMessages, materials, movementHistory, news, notilestra, pendingUsers, roleDefinitions } from './src/data/content';
import { Permission, Role, Session, UserStatus } from './src/types/auth';
import { getPermissionsForRole } from './src/lib/permissions';
import { AppCommunity, createCommunityPublication, fetchCommunities, fetchCommunityPublications, fetchNews, fetchNotilestra, voteCommunityPoll } from './src/lib/remoteData';
import { AdminUser, AppContentBlock, AppMaterialRecord, AppTabSetting, CommunityMember, ContentEditorBlock, NewsDraftRecord, UserRequestRecord, approveProfile, archiveAppMaterial, confirmAdminUserEmail, createAppTab, createEvent, createNews, createLeadershipChangeRequest, createUserRequest, fetchAdminConfig, fetchAdminRequests, fetchAdminUsers, fetchAppContent, fetchAppMaterials, fetchAppTabs, fetchMyCommunityMembers, fetchMyRequests, fetchNewsDrafts, fetchPendingProfiles, PendingProfile, resolveUserRequest, saveAdminConfig, saveAppMaterial, saveNewsDraft, updateAdminUser, updateAppContent, updateAppTab, updateCommunity, updateMyAvatar, updateMyProfile } from './src/lib/profiles';
import { supabase } from './src/lib/supabase';
import { getMyProfileSession } from './src/lib/authProfile';
import { assignableRolesFor, canAccessProvince, canApproveRole, canManageProvince, canSeeAllProvinces, visibleHierarchyFor } from './src/lib/roles';

const palestraLogo = require('./assets/logo-palestra.png');
const demoVersionLabel = 'DEMO 0.1.0';
const touchPointerPreferenceKey = 'palestra.showTouchPointer';

type TabKey = string;
type AdminModule = 'resumen' | 'identidad' | 'home' | 'noticias' | 'descargas' | 'comunidades' | 'historia_admin' | 'contacto_admin' | 'usuarios' | 'solicitudes' | 'periodo_motivador' | 'configuracion' | 'eventos' | 'contenido_general';
type ProfilePanel = 'vista' | 'editar' | 'configuracion';
type AppAdminConfig = {
  identity: {
    appName: string;
    subtitle: string;
    description: string;
    logoUrl: string;
    heroImageUrl: string;
    primaryColor: string;
    secondaryColor: string;
  };
  home: {
    heroTitle: string;
    heroText: string;
    featuredBanner: string;
    visibleModules: string[];
  };
  contact: {
    email: string;
    phone: string;
    instagram: string;
    helpText: string;
    donationText: string;
  };
  settings: {
    maintenanceMode: boolean;
    globalMessage: string;
    futureForumEnabled: boolean;
    futureChatEnabled: boolean;
  };
  periodoMotivador: {
    active: boolean;
    title: string;
    body: string;
    imageUrl: string;
  };
};
type AdminRequest = {
  id: string;
  userId?: string | null;
  title: string;
  requester: string;
  definition: string;
  createdAt: string;
  status: 'pendiente' | 'aprobada' | 'denegada';
  message?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  targetUserId?: string | null;
  targetUserName?: string | null;
  targetRole?: string | null;
  communityName?: string | null;
};

type NotilestraItem = (typeof notilestra)[number];
type CommunityPublication = Awaited<ReturnType<typeof fetchCommunityPublications>>[number];

const defaultAdminConfig: AppAdminConfig = {
  identity: {
    appName: 'Palestra',
    subtitle: 'Movimiento Catolico',
    description: 'Movimiento catolico juvenil y comunitario presente en Argentina.',
    logoUrl: '',
    heroImageUrl: '',
    primaryColor: '#2d8dc8',
    secondaryColor: '#5da7db'
  },
  home: {
    heroTitle: 'Una app para caminar juntos.',
    heroText: 'Noticias, agenda, materiales y comunicacion interna para las comunidades de Palestra.',
    featuredBanner: 'Agenda comunitaria',
    visibleModules: ['noticias', 'comunidades', 'materiales', 'perfil']
  },
  contact: {
    email: contactInfo.email,
    phone: contactInfo.phone,
    instagram: contactInfo.instagram,
    helpText: contactInfo.helpText,
    donationText: contactInfo.donationText
  },
  settings: {
    maintenanceMode: false,
    globalMessage: '',
    futureForumEnabled: false,
    futureChatEnabled: false
  },
  periodoMotivador: {
    active: false,
    title: 'Periodo Motivador',
    body: 'Espacio de preparacion, materiales y textos asociados al periodo motivador.',
    imageUrl: ''
  }
};

const adminModuleCatalog: Array<{ key: AdminModule; label: string; icon: keyof typeof Ionicons.glyphMap; systemOnly?: boolean }> = [
  { key: 'resumen', label: 'Dashboard', icon: 'grid-outline' },
  { key: 'identidad', label: 'Identidad', icon: 'sparkles-outline', systemOnly: true },
  { key: 'home', label: 'Home', icon: 'home-outline', systemOnly: true },
  { key: 'noticias', label: 'Noticias', icon: 'newspaper-outline', systemOnly: true },
  { key: 'descargas', label: 'Descargas', icon: 'folder-open-outline', systemOnly: true },
  { key: 'comunidades', label: 'Comunidades', icon: 'location-outline' },
  { key: 'historia_admin', label: 'Historia', icon: 'book-outline', systemOnly: true },
  { key: 'contacto_admin', label: 'Contacto', icon: 'chatbubbles-outline', systemOnly: true },
  { key: 'usuarios', label: 'Usuarios', icon: 'people-outline' },
  { key: 'solicitudes', label: 'Solicitudes', icon: 'mail-unread-outline' },
  { key: 'periodo_motivador', label: 'Periodo', icon: 'flame-outline', systemOnly: true },
  { key: 'configuracion', label: 'Config', icon: 'settings-outline', systemOnly: true },
  { key: 'eventos', label: 'Eventos', icon: 'calendar-outline', systemOnly: true },
  { key: 'contenido_general', label: 'Contenido', icon: 'create-outline', systemOnly: true }
];

type PageEditorProps = {
  tabKey: TabKey;
  title: string;
  content?: AppContentBlock;
  tab?: AppTabDisplay;
  isAdmin: boolean;
  onContentChanged: () => Promise<void>;
  onTabsChanged: () => Promise<void>;
};

const defaultTabs: Array<{ key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'inicio', label: 'Inicio', icon: 'home-outline' },
  { key: 'notilestra', label: 'Notilestra', icon: 'newspaper-outline' },
  { key: 'materiales', label: 'Materiales', icon: 'document-text-outline' },
  { key: 'comunidades', label: 'Comunidades', icon: 'people-outline' },
  { key: 'historia', label: 'Historia', icon: 'book-outline' },
  { key: 'contacto', label: 'Contacto', icon: 'chatbubbles-outline' },
  { key: 'perfil', label: 'Perfil', icon: 'person-circle-outline' }
];

type AppTabDisplay = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  visible: boolean;
  sortOrder: number;
  visibleRoles: string[] | null;
};

const defaultTabByKey = new Map(defaultTabs.map((tab) => [tab.key, tab]));

const demoSessions: Record<string, Session> = {
  invitado: {
    fullName: 'Visitante Demo',
    province: 'Salta',
    contact: '+54 387 400-0001',
    communityOfOrigin: 'Sin comunidad asignada',
    role: 'invitado',
    status: 'aprobado',
    permissions: getPermissionsForRole('invitado')
  },
  palestrista: {
    fullName: 'Camila Torres',
    province: 'Tucuman',
    contact: '+54 381 400-0002',
    communityOfOrigin: 'Comunidad Tucuman 1',
    role: 'palestrista',
    status: 'aprobado',
    permissions: getPermissionsForRole('palestrista')
  },
  sedimentador: {
    fullName: 'Mateo Herrera',
    province: 'Catamarca',
    contact: '+54 383 400-0003',
    communityOfOrigin: 'Comunidad Catamarca 2',
    role: 'sedimentador',
    status: 'aprobado',
    permissions: getPermissionsForRole('sedimentador')
  },
  coordinador: {
    fullName: 'Lucia Rios',
    province: 'Cordoba',
    contact: '+54 351 400-0004',
    communityOfOrigin: 'Comunidad Cordoba 1',
    role: 'coordinador_comunidad',
    status: 'aprobado',
    permissions: getPermissionsForRole('coordinador_comunidad')
  },
  nacional: {
    fullName: 'Equipo Nacional Demo',
    province: 'Argentina',
    contact: '+54 9 11 2456-7890',
    communityOfOrigin: 'Equipo Nacional',
    role: 'coordinador_nacional',
    status: 'aprobado',
    permissions: getPermissionsForRole('coordinador_nacional')
  },
  administrador: {
    fullName: 'Administrador Tecnico',
    province: 'Sistema',
    contact: 'admin@palestra.org.ar',
    communityOfOrigin: 'Administracion global',
    role: 'administrador',
    status: 'aprobado',
    permissions: getPermissionsForRole('administrador')
  }
};

function canAccessPrivate(session: Session | null) {
  return session?.status === 'aprobado' && session.role !== 'invitado';
}

function hasPermission(session: Session | null, permission: Permission) {
  return Boolean(session?.permissions.includes(permission));
}

function roleLabel(role: Role) {
  return roleDefinitions.find((item) => item.role === role)?.label ?? role;
}

function statusLabel(status: UserStatus) {
  if (status === 'aprobado') {
    return 'Aprobado';
  }
  if (status === 'bloqueado') {
    return 'Bloqueado';
  }
  return 'Pendiente de aprobacion';
}

function AppLoadingScreen() {
  const flash = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const barTravel = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(flash, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(logoScale, {
          toValue: 1.08,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        })
      ]),
      Animated.parallel([
        Animated.timing(flash, {
          toValue: 0,
          duration: 520,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 70,
          useNativeDriver: true
        })
      ])
    ]).start();

    const loop = Animated.loop(
      Animated.timing(barTravel, {
        toValue: 1,
        duration: 980,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true
      })
    );
    loop.start();

    return () => loop.stop();
  }, [barTravel, flash, logoScale]);

  const translateX = barTravel.interpolate({
    inputRange: [0, 1],
    outputRange: [-92, 230]
  });

  return (
    <View style={styles.loadingOverlay} pointerEvents="auto">
      <Animated.View style={[styles.loadingFlash, { opacity: flash }]} />
      <Animated.View style={[styles.loadingLogoFrame, { transform: [{ scale: logoScale }] }]}>
        <Image source={palestraLogo} style={styles.loadingLogo} />
      </Animated.View>
      <Text style={styles.loadingTitle}>Palestra</Text>
      <Text style={styles.loadingSubtitle}>Movimiento Catolico</Text>
      <View style={styles.loadingBarTrack}>
        <Animated.View style={[styles.loadingBarPulse, { transform: [{ translateX }] }]} />
      </View>
    </View>
  );
}

export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('inicio');
  const [tabHistory, setTabHistory] = useState<TabKey[]>(['inicio']);
  const [session, setSession] = useState<Session | null>(null);
  const [touchPointer, setTouchPointer] = useState<{ x: number; y: number } | null>(null);
  const [touchPointerEnabled, setTouchPointerEnabled] = useState(false);
  const [tabSettings, setTabSettings] = useState<AppTabSetting[]>([]);
  const [appContent, setAppContent] = useState<AppContentBlock[]>([]);
  const [adminConfig, setAdminConfig] = useState<AppAdminConfig>(defaultAdminConfig);
  const [contentVersion, setContentVersion] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [appMessage, setAppMessage] = useState('');
  const lastBackPressRef = useRef(0);
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const touchPointerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(touchPointerPreferenceKey)
      .then((value) => setTouchPointerEnabled(value === 'true'))
      .catch((error) => console.error('touch pointer preference', error));
  }, []);

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
        icon: 'document-text-outline' as keyof typeof Ionicons.glyphMap,
        visible: setting.is_visible,
        sortOrder: setting.sort_order,
        visibleRoles: setting.visible_roles ?? null
      }));

    return [...builtInTabs, ...customTabs]
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [tabSettings]);

  const visibleTabs = useMemo(() => {
    const currentRole = session?.role ?? 'invitado';
    const seen = new Set<string>();
    return resolvedTabs.filter((tab) => {
      if (!tab.visible || (tab.visibleRoles && !tab.visibleRoles.includes(currentRole)) || seen.has(tab.key)) {
        return false;
      }
      seen.add(tab.key);
      return true;
    });
  }, [resolvedTabs, session?.role]);

  const tabLabel = (key: TabKey) => resolvedTabs.find((tab) => tab.key === key)?.label ?? defaultTabs.find((tab) => tab.key === key)?.label ?? key;
  const pageEditorProps = (key: TabKey): PageEditorProps => ({
    tabKey: key,
    title: tabLabel(key),
    content: appContent.find((item) => item.tab_key === key),
    tab: resolvedTabs.find((tab) => tab.key === key),
    isAdmin: session?.role === 'administrador',
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
  }

  async function reloadAdminConfig() {
    const config = await fetchAdminConfig();
    if (config) {
      setAdminConfig({ ...defaultAdminConfig, ...config } as AppAdminConfig);
    }
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
    }
  }

  async function refreshAppContent(source = 'manual') {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    setAppMessage(source === 'manual' ? 'Actualizando contenido...' : '');
    try {
      await Promise.all([
        reloadTabSettings(),
        reloadAppContent(),
        reloadAdminConfig(),
        hydrateRealSession()
      ]);
      setContentVersion((current) => current + 1);
      setAppMessage('Contenido actualizado.');
      setTimeout(() => setAppMessage(''), 1800);
    } catch (error) {
      console.error('refreshAppContent', error);
      setAppMessage(error instanceof Error ? error.message : 'No pude actualizar. Revisa la conexion.');
    } finally {
      setIsRefreshing(false);
    }
  }

  function navigateToTab(nextTab: TabKey) {
    if (nextTab === activeTab) {
      return;
    }
    setTabHistory((current) => [...current.filter((item, index) => index === current.length - 1 || item !== nextTab), nextTab]);
    setActiveTab(nextTab);
  }

  function goBackInApp() {
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

    const { data: listener } = supabase.auth.onAuthStateChange((_event, authSession) => {
      if (!authSession?.user) {
        setSession(null);
      }
      if (authSession?.user) {
        hydrateRealSession();
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', goBackInApp);
    return () => subscription.remove();
  }, [activeTab, tabHistory]);

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
    if (activeTab === 'inicio') {
      return <HomeScreen session={session} title={tabLabel('inicio')} content={appContent.find((item) => item.tab_key === 'inicio')} refreshKey={contentVersion} editor={pageEditorProps('inicio')} onNavigate={navigateToTab} adminConfig={adminConfig} />;
    }
    if (activeTab === 'notilestra') {
      return <NotilestraScreen session={session} title={tabLabel('notilestra')} content={appContent.find((item) => item.tab_key === 'notilestra')} refreshKey={contentVersion} editor={pageEditorProps('notilestra')} />;
    }
    if (activeTab === 'materiales') {
      return <MaterialsScreen session={session} title={tabLabel('materiales')} content={appContent.find((item) => item.tab_key === 'materiales')} refreshKey={contentVersion} editor={pageEditorProps('materiales')} />;
    }
    if (activeTab === 'comunidades') {
      return <CommunitiesScreen session={session} title={tabLabel('comunidades')} content={appContent.find((item) => item.tab_key === 'comunidades')} refreshKey={contentVersion} editor={pageEditorProps('comunidades')} />;
    }
    if (activeTab === 'historia') {
      return <HistoryScreen title={tabLabel('historia')} content={appContent.find((item) => item.tab_key === 'historia')} editor={pageEditorProps('historia')} />;
    }
    if (activeTab === 'contacto') {
      return <ContactScreen title={tabLabel('contacto')} content={appContent.find((item) => item.tab_key === 'contacto')} editor={pageEditorProps('contacto')} />;
    }
    if (activeTab !== 'perfil') {
      return <GenericPageScreen title={tabLabel(activeTab)} content={appContent.find((item) => item.tab_key === activeTab)} editor={pageEditorProps(activeTab)} />;
    }
    return <ProfileScreen session={session} onSessionChange={setSession} tabs={resolvedTabs} appContent={appContent} adminConfig={adminConfig} touchPointerEnabled={touchPointerEnabled} onTouchPointerEnabledChange={updateTouchPointerPreference} onAdminConfigChange={setAdminConfig} onTabsChanged={reloadTabSettings} onContentChanged={refreshPublishedContent} />;
  }, [activeTab, session, resolvedTabs, appContent, contentVersion, adminConfig, touchPointerEnabled]);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={styles.safeArea}
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
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <View style={styles.brandLogo}>
              <Image source={palestraLogo} style={styles.brandLogoImage} />
            </View>
            <View>
              <Text style={styles.brand}>{adminConfig.identity.appName}</Text>
              <Text style={styles.subtitle}>{adminConfig.identity.subtitle}</Text>
              <Text style={styles.demoLabel}>{demoVersionLabel}</Text>
            </View>
          </View>
          <View style={styles.sessionBadge}>
            <Text style={styles.sessionBadgeText}>{session ? roleLabel(session.role) : 'Invitado'}</Text>
          </View>
        </View>
        {appMessage ? (
          <View pointerEvents="none" style={styles.appToast}>
            <Text style={styles.appToastText}>{appMessage}</Text>
          </View>
        ) : null}
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={(
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => refreshAppContent('manual')}
              tintColor={palette.red}
              colors={[palette.red, palette.gold, palette.blueDeep]}
              progressBackgroundColor={palette.white}
            />
          )}
        >
          <Animated.View style={{ opacity: screenOpacity }}>
            {screen}
          </Animated.View>
        </ScrollView>
        <View style={styles.tabBar}>
          {visibleTabs.map((tab) => {
            const selected = activeTab === tab.key;
            return (
              <TouchableOpacity key={`${tab.key}-${tab.sortOrder}`} style={styles.tabButton} onPress={() => navigateToTab(tab.key)} activeOpacity={0.8}>
                <View style={[styles.tabIconFrame, selected && styles.tabIconFrameActive]}>
                  <Ionicons name={tab.icon} size={20} color={selected ? palette.white : palette.red} />
                </View>
                <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>{tab.label}</Text>
                {selected ? <View style={styles.tabActiveDot} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function EditableIntro({ content, editor }: { content?: AppContentBlock; editor?: PageEditorProps }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(editor?.title ?? '');
  const [draftTitle, setDraftTitle] = useState(content?.title ?? editor?.title ?? '');
  const [draftBody, setDraftBody] = useState(content?.body ?? '');
  const [draftBlocks, setDraftBlocks] = useState<ContentEditorBlock[]>([]);
  const [editorMessage, setEditorMessage] = useState('');

  useEffect(() => {
    setDraftLabel(editor?.title ?? '');
    setDraftTitle(content?.title ?? editor?.title ?? '');
    setDraftBody(content?.body ?? '');
    setDraftBlocks(content?.blocks?.length ? content.blocks : [
      { id: 'inline-title', type: 'titulo', value: content?.title ?? editor?.title ?? '' },
      { id: 'inline-body', type: 'texto', value: content?.body ?? '' }
    ]);
  }, [content, editor?.title, editor?.tabKey]);

  async function uploadInlineImage() {
    if (!editor) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setEditorMessage('Necesito permiso para acceder a tus fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.75
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    try {
      setEditorMessage('Subiendo imagen...');
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const bytes = await response.arrayBuffer();
      const extension = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      const path = `${editor.tabKey}/content-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(path, bytes, {
          contentType: asset.mimeType ?? 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        setEditorMessage(uploadError.message);
        return;
      }

      const { data: publicUrl } = supabase.storage.from('content-images').getPublicUrl(path);
      setDraftBlocks((current) => [...current, { id: `imagen-${Date.now()}`, type: 'imagen', value: publicUrl.publicUrl }]);
      setEditorMessage('Imagen cargada al editor.');
    } catch (error) {
      setEditorMessage(error instanceof Error ? error.message : 'No pude subir la imagen.');
    }
  }

  async function saveInlinePage() {
    if (!editor) {
      return;
    }

    if (!draftTitle.trim()) {
      setEditorMessage('La pagina necesita un titulo.');
      return;
    }

    setEditorMessage('Guardando pagina...');
    if (draftLabel.trim() && draftLabel.trim() !== editor.title) {
      const { error: tabError } = await updateAppTab(
        editor.tabKey,
        draftLabel.trim(),
        editor.tab?.visible ?? true,
        editor.tab?.visibleRoles ?? null
      );
      if (tabError) {
        setEditorMessage(tabError.message);
        return;
      }
      await editor.onTabsChanged();
    }

    const normalizedBlocks = draftBlocks
      .map((block) => ({ ...block, value: block.value.trim() }))
      .filter((block) => block.value.length > 0);
    const { error } = await updateAppContent(editor.tabKey, draftTitle.trim(), draftBody.trim(), normalizedBlocks);
    if (error) {
      setEditorMessage(error.message);
      return;
    }
    await editor.onContentChanged();
    setEditorMessage('Pagina actualizada.');
    setIsEditing(false);
  }

  function addInlineBlock(type: ContentEditorBlock['type']) {
    setDraftBlocks((current) => [
      ...current,
      { id: `${type}-${Date.now()}`, type, value: type === 'imagen' ? 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png' : '' }
    ]);
  }

  function moveInlineBlock(index: number, direction: -1 | 1) {
    setDraftBlocks((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  }

  function updateInlineBlock(id: string, value: string) {
    setDraftBlocks((current) => current.map((block) => block.id === id ? { ...block, value } : block));
  }

  const renderedContent = (() => {
    if (!content) {
      return null;
    }

    if (content.blocks && content.blocks.length > 0) {
      return (
        <View style={styles.contentIntro}>
          {content.blocks.map((block, index) => {
            const blockKey = `${block.id}-${index}`;
            if (block.type === 'titulo') {
              return <Text key={blockKey} style={styles.cardTitle}>{block.value}</Text>;
            }
            if (block.type === 'imagen') {
              return <Image key={blockKey} source={{ uri: block.value }} style={styles.cardImage} />;
            }
            return <Text key={blockKey} style={styles.cardText}>{block.value}</Text>;
          })}
        </View>
      );
    }

    return (
      <View style={styles.contentIntro}>
        <Text style={styles.cardTitle}>{content.title}</Text>
        <Text style={styles.cardText}>{content.body}</Text>
      </View>
    );
  })();

  if (editor?.isAdmin) {
    return (
      <View style={styles.stackTight}>
        <TouchableOpacity style={styles.inlineEditButton} onPress={() => setIsEditing(!isEditing)}>
          <Ionicons name={isEditing ? 'close-outline' : 'create-outline'} size={18} color={palette.red} />
          <Text style={styles.inlineEditButtonText}>{isEditing ? 'Cerrar editor' : 'Editar pagina'}</Text>
        </TouchableOpacity>
        {isEditing ? (
          <View style={styles.inlineEditorPanel}>
            <Text style={styles.cardEyebrow}>Edicion directa</Text>
            <TextInput style={styles.input} placeholder="Nombre de la pestana" value={draftLabel} onChangeText={setDraftLabel} />
            <TextInput style={styles.input} placeholder="Titulo interno" value={draftTitle} onChangeText={setDraftTitle} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Resumen o texto base" value={draftBody} onChangeText={setDraftBody} multiline />
            <View style={styles.inlineActions}>
              <TouchableOpacity style={styles.smallActionButton} onPress={() => addInlineBlock('titulo')}>
                <Ionicons name="text-outline" size={16} color={palette.red} />
                <Text style={styles.smallActionText}>Titulo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallActionButton} onPress={() => addInlineBlock('texto')}>
                <Ionicons name="document-text-outline" size={16} color={palette.red} />
                <Text style={styles.smallActionText}>Texto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallActionButton} onPress={uploadInlineImage}>
                <Ionicons name="image-outline" size={16} color={palette.red} />
                <Text style={styles.smallActionText}>Imagen</Text>
              </TouchableOpacity>
            </View>
            {draftBlocks.map((block, index) => (
              <View key={`${block.id}-${index}`} style={styles.inlineBlockEditor}>
                <View style={styles.inlineBlockHeader}>
                  <Text style={styles.cardEyebrow}>{block.type}</Text>
                  <View style={styles.inlineIconActions}>
                    <TouchableOpacity style={styles.iconButtonGhost} onPress={() => moveInlineBlock(index, -1)}>
                      <Ionicons name="arrow-up-outline" size={16} color={palette.inkMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButtonGhost} onPress={() => moveInlineBlock(index, 1)}>
                      <Ionicons name="arrow-down-outline" size={16} color={palette.inkMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButtonGhost} onPress={() => setDraftBlocks((current) => current.filter((item) => item.id !== block.id))}>
                      <Ionicons name="trash-outline" size={16} color={palette.red} />
                    </TouchableOpacity>
                  </View>
                </View>
                <TextInput
                  style={[styles.input, block.type === 'texto' && styles.textArea]}
                  placeholder={block.type === 'imagen' ? 'URL de imagen' : 'Contenido'}
                  value={block.value}
                  onChangeText={(value) => updateInlineBlock(block.id, value)}
                  multiline={block.type !== 'titulo'}
                />
                {block.type === 'imagen' && block.value ? <Image source={{ uri: block.value }} style={styles.cardImage} /> : null}
              </View>
            ))}
            <TouchableOpacity style={styles.primaryButton} onPress={saveInlinePage}>
              <Text style={styles.primaryButtonText}>Guardar pagina</Text>
            </TouchableOpacity>
            {editorMessage ? <Text style={styles.cardText}>{editorMessage}</Text> : null}
          </View>
        ) : null}
        {renderedContent}
      </View>
    );
  }

  if (!content) {
    return null;
  }

  return renderedContent;
}

function HomeScreen({ session, title, content, refreshKey, editor, onNavigate, adminConfig }: { session: Session | null; title: string; content?: AppContentBlock; refreshKey: number; editor?: PageEditorProps; onNavigate: (tab: TabKey) => void; adminConfig: AppAdminConfig }) {
  const [expandedNews, setExpandedNews] = useState<string | null>(null);
  const [homeNews, setHomeNews] = useState(news);
  const homeTiles: Array<{ tab: TabKey; title: string; meta: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = [
    { tab: 'notilestra', title: 'Noticias', meta: 'Agenda y avisos', icon: 'newspaper-outline', color: palette.red },
    { tab: 'comunidades', title: 'Comunidades', meta: 'Provincias y contactos', icon: 'people-outline', color: '#7DB9E2' },
    { tab: 'materiales', title: 'Materiales', meta: 'Archivos internos', icon: 'folder-open-outline', color: palette.gold },
    { tab: 'perfil', title: session ? 'Perfil' : 'Ingresar', meta: session ? roleLabel(session.role) : 'Cuenta personal', icon: 'person-circle-outline', color: palette.inkMuted }
  ];
  const dashboardStats = [
    { label: 'Provincias', value: String(communities.length), icon: 'map-outline' as keyof typeof Ionicons.glyphMap },
    { label: 'Comunidades', value: String(communities.reduce((total, item) => total + item.locations.length, 0)), icon: 'people-circle-outline' as keyof typeof Ionicons.glyphMap },
    { label: 'Materiales', value: String(materials.length), icon: 'library-outline' as keyof typeof Ionicons.glyphMap }
  ];
  const nextEvents = notilestra.slice(0, 2);

  useEffect(() => {
    let alive = true;
    fetchNews(session).then((items) => {
      if (alive) {
        fetchCommunityPublications(session).then((communityItems) => {
          if (alive) {
            setHomeNews([...communityItems, ...items]);
          }
        });
      }
    });
    return () => {
      alive = false;
    };
  }, [refreshKey, session?.province, session?.role]);

  return (
    <View style={styles.stack}>
      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <Text style={styles.kicker}>Argentina</Text>
        <Text style={styles.heroTitle}>{adminConfig.home.heroTitle}</Text>
        <Text style={styles.heroText}>{adminConfig.home.heroText}</Text>
      </View>

      <EditableIntro content={content} editor={editor} />

      <SectionTitle title="Accesos rapidos" />
      <View style={styles.homeTileGrid}>
        {homeTiles.map((tile) => (
          <TouchableOpacity key={tile.tab} style={styles.homeTile} activeOpacity={0.88} onPress={() => onNavigate(tile.tab)}>
            <View style={[styles.homeTileIcon, { backgroundColor: tile.color }]}>
              <Ionicons name={tile.icon} size={25} color={palette.white} />
            </View>
            <Text style={styles.homeTileTitle}>{tile.title}</Text>
            <Text style={styles.homeTileMeta}>{tile.meta}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionTitle title="Resumen" />
      <View style={styles.dashboardStrip}>
        {dashboardStats.map((item) => (
          <View key={item.label} style={styles.dashboardStat}>
            <Ionicons name={item.icon} size={18} color={palette.red} />
            <Text style={styles.dashboardValue}>{item.value}</Text>
            <Text style={styles.dashboardLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <SectionTitle title="Agenda comunitaria" />
      <View style={styles.featurePanel}>
        <View style={styles.featurePanelHeader}>
          <Text style={styles.cardEyebrow}>Proximamente</Text>
          <TouchableOpacity style={[styles.iconButton, styles.viewAllButton]} activeOpacity={0.8} onPress={() => onNavigate('notilestra')}>
            <Text style={styles.linkText}>Ver todas</Text>
          </TouchableOpacity>
        </View>
        {nextEvents.map((item, index) => (
          <View key={`${item.title}-${index}`} style={styles.miniEventRow}>
            <View style={styles.miniEventDate}>
              <Text style={styles.miniEventDay}>{new Date(`${item.date}T00:00:00`).getDate()}</Text>
              <Text style={styles.miniEventMonth}>{new Date(`${item.date}T00:00:00`).toLocaleDateString('es-AR', { month: 'short' })}</Text>
            </View>
            <View style={styles.miniEventBody}>
              <Text style={styles.miniEventTitle}>{item.title}</Text>
              <Text style={styles.miniEventScope}>{item.scope}</Text>
            </View>
          </View>
        ))}
      </View>

      <SectionTitle title="Actividad reciente" />
      {homeNews.map((item, index) => (
        <TouchableOpacity key={`${item.title}-${index}`} style={[styles.card, styles.feedCard]} activeOpacity={0.86} onPress={() => setExpandedNews(expandedNews === item.title ? null : item.title)}>
          <View style={styles.feedHeader}>
            <View style={styles.feedAvatar}>
              <Ionicons name="sparkles-outline" size={18} color={palette.red} />
            </View>
            <View style={styles.feedHeaderText}>
              <Text style={styles.cardEyebrow}>{item.scope}</Text>
              <Text style={styles.feedMeta}>Comunidad Palestra</Text>
            </View>
          </View>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardText} numberOfLines={expandedNews === item.title ? undefined : 2}>{item.body}</Text>
          {expandedNews === item.title ? <Image source={{ uri: item.imageUrl }} style={styles.cardImage} /> : null}
          <View style={styles.feedFooter}>
            <Text style={styles.expandHint}>{expandedNews === item.title ? 'Tocar para contraer' : 'Tocar para leer mas'}</Text>
            <Ionicons name={expandedNews === item.title ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
          </View>
        </TouchableOpacity>
      ))}

      {canAccessPrivate(session) ? (
        <View style={styles.notice}>
          <Ionicons name="lock-open-outline" size={20} color={palette.green} />
          <Text style={styles.noticeText}>Tu usuario esta aprobado. Ya podes ver contenido interno segun tus permisos.</Text>
        </View>
      ) : (
        <View style={styles.notice}>
          <Ionicons name="lock-closed-outline" size={20} color={palette.red} />
          <Text style={styles.noticeText}>Algunas secciones requieren registro y aprobacion de un coordinador.</Text>
        </View>
      )}
    </View>
  );
}

function NotilestraScreen({ session, title, content, refreshKey, editor }: { session: Session | null; title: string; content?: AppContentBlock; refreshKey: number; editor?: PageEditorProps }) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [selectedCalendarItems, setSelectedCalendarItems] = useState<Array<{ date: string; title: string; body?: string; imageUrl?: string; scope?: string }>>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [reminders, setReminders] = useState<string[]>([]);
  const [subtab, setSubtab] = useState<'noticias' | 'favoritos' | 'recordatorios'>('noticias');
  const [notilestraItems, setNotilestraItems] = useState<NotilestraItem[]>(notilestra);
  const [monthOffset, setMonthOffset] = useState(0);
  const baseDate = new Date(2026, 4 + monthOffset, 1);
  const monthLabel = baseDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1).getDay();
  useEffect(() => {
    let alive = true;
    fetchNotilestra(session).then((items) => {
      if (alive) {
        setNotilestraItems(items);
      }
    });
    return () => {
      alive = false;
    };
  }, [refreshKey, session?.province, session?.role]);

  const eventDays = notilestraItems
    .filter((item) => {
      const itemDate = new Date(`${item.date}T00:00:00`);
      return itemDate.getFullYear() === baseDate.getFullYear() && itemDate.getMonth() === baseDate.getMonth();
    })
    .map((item) => new Date(`${item.date}T00:00:00`).getDate());
  const activityDays = calendarActivities.filter((item) => {
    const itemDate = new Date(`${item.date}T00:00:00`);
    const canSee = !('requiredPermission' in item) || hasPermission(session, item.requiredPermission as Permission);
    return canSee && itemDate.getFullYear() === baseDate.getFullYear() && itemDate.getMonth() === baseDate.getMonth();
  });
  const favoriteItems = notilestraItems.filter((item) => favorites.includes(item.title));
  const reminderItems = notilestraItems.filter((item) => reminders.includes(item.title));
  const dueReminderItems = reminderItems.filter((item) => {
    const eventDate = new Date(`${item.date}T00:00:00`);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return eventDate.toDateString() === tomorrow.toDateString();
  });
  const [dismissedReminderPopup, setDismissedReminderPopup] = useState(false);

  function openCalendarDay(day: number) {
    const dateKey = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const newsForDay = notilestraItems
      .filter((item) => item.date === dateKey)
      .map((item) => ({ date: item.date, title: item.title, body: item.body, scope: item.scope }));
    const activitiesForDay = activityDays
      .filter((item) => item.date === dateKey)
      .map((item) => ({
        date: item.date,
        title: item.title,
        body: 'body' in item ? item.body : undefined,
        imageUrl: 'imageUrl' in item ? item.imageUrl : undefined,
        scope: 'Actividad'
      }));
    setSelectedCalendarItems([...newsForDay, ...activitiesForDay]);
  }

  function toggleFavorite(title: string) {
    setFavorites((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title]);
  }

  function toggleReminder(title: string) {
    setReminders((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title]);
  }

  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      <Modal visible={dueReminderItems.length > 0 && !dismissedReminderPopup} transparent animationType="fade" onRequestClose={() => setDismissedReminderPopup(true)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalPanel}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setDismissedReminderPopup(true)} activeOpacity={0.8}>
              <Ionicons name="close" size={22} color={palette.red} />
            </TouchableOpacity>
            <Text style={styles.cardEyebrow}>Recordatorio</Text>
            <Text style={styles.cardTitle}>Tenes eventos marcados para manana</Text>
            {dueReminderItems.map((item, index) => <Text key={`${item.title}-${index}`} style={styles.cardText}>{item.title} - {item.date}</Text>)}
          </View>
        </View>
      </Modal>
      <View style={styles.filterRow}>
        {[
          { key: 'noticias', label: 'Noticias' },
          { key: 'favoritos', label: 'Favoritos' },
          { key: 'recordatorios', label: 'Recordatorios' }
        ].map((item) => (
          <TouchableOpacity key={item.key} style={[styles.filterChip, subtab === item.key && styles.filterChipActive]} onPress={() => setSubtab(item.key as typeof subtab)}>
            <Text style={[styles.filterChipText, subtab === item.key && styles.filterChipTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => setMonthOffset(monthOffset - 1)} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={18} color={palette.red} />
          </TouchableOpacity>
          <Text style={styles.calendarTitle}>{monthLabel}</Text>
          <TouchableOpacity onPress={() => setMonthOffset(monthOffset + 1)} style={styles.iconButton}>
            <Ionicons name="chevron-forward" size={18} color={palette.red} />
          </TouchableOpacity>
        </View>
        <View style={styles.calendarGrid}>
          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => <Text key={`${day}-${index}`} style={styles.calendarWeekday}>{day}</Text>)}
          {Array.from({ length: firstDay }).map((_, index) => <View key={`empty-${index}`} style={styles.calendarDay} />)}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const hasEvent = eventDays.includes(day);
            const activity = activityDays.find((item) => new Date(`${item.date}T00:00:00`).getDate() === day);
            const canOpenDay = hasEvent || Boolean(activity);
            return (
              <TouchableOpacity key={day} style={[styles.calendarDay, hasEvent && styles.calendarEventDay, activity && styles.calendarActivityDay]} activeOpacity={canOpenDay ? 0.75 : 1} onPress={() => canOpenDay && openCalendarDay(day)}>
                <Text style={[styles.calendarDayText, hasEvent && styles.calendarEventText, activity && styles.calendarActivityText]}>{day}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <Modal visible={selectedCalendarItems.length > 0} transparent animationType="fade" onRequestClose={() => setSelectedCalendarItems([])}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalPanel}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setSelectedCalendarItems([])} activeOpacity={0.8}>
              <Ionicons name="close" size={22} color={palette.red} />
            </TouchableOpacity>
            <Text style={styles.cardEyebrow}>{selectedCalendarItems[0]?.date}</Text>
            {selectedCalendarItems.map((item) => (
              <View key={`${item.date}-${item.title}`} style={styles.modalItem}>
                <Text style={styles.cardEyebrow}>{item.scope ?? 'Notilestra'}</Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.cardImage} /> : null}
                {item.body ? <Text style={styles.cardText}>{item.body}</Text> : null}
              </View>
            ))}
          </View>
        </View>
      </Modal>
      {subtab === 'noticias' ? notilestraItems.map((item, index) => (
        <View key={`${item.title}-${index}`} style={[styles.card, styles.feedCard]}>
          <TouchableOpacity activeOpacity={0.86} onPress={() => setExpandedItem(expandedItem === item.title ? null : item.title)}>
            <View style={styles.feedHeader}>
              <View style={styles.feedAvatar}>
                <Ionicons name="megaphone-outline" size={18} color={palette.red} />
              </View>
              <View style={styles.feedHeaderText}>
                <Text style={styles.cardEyebrow}>{item.scope}</Text>
                <Text style={styles.feedMeta}>{new Date(`${item.date}T00:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardText} numberOfLines={expandedItem === item.title ? undefined : 2}>{item.body}</Text>
          </TouchableOpacity>
          <View style={styles.inlineActions}>
            <TouchableOpacity style={[styles.actionPill, favorites.includes(item.title) && styles.actionPillActive]} onPress={() => toggleFavorite(item.title)}>
              <Ionicons name={favorites.includes(item.title) ? 'star' : 'star-outline'} size={16} color={favorites.includes(item.title) ? palette.white : palette.red} />
              <Text style={[styles.actionPillText, favorites.includes(item.title) && styles.actionPillTextActive]}>Favorito</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionPill, reminders.includes(item.title) && styles.actionPillActive]} onPress={() => toggleReminder(item.title)}>
              <Ionicons name={reminders.includes(item.title) ? 'notifications' : 'notifications-outline'} size={16} color={reminders.includes(item.title) ? palette.white : palette.red} />
              <Text style={[styles.actionPillText, reminders.includes(item.title) && styles.actionPillTextActive]}>Recordar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )) : null}
      {subtab === 'favoritos' ? <View style={styles.stack}>{favoriteItems.length > 0 ? favoriteItems.map((item, index) => (
        <View key={`${item.title}-${index}`} style={[styles.card, styles.feedCard]}>
          <Text style={styles.cardEyebrow}>{item.scope} - {item.date}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardText}>{item.body}</Text>
        </View>
      )) : <View style={styles.card}><Text style={styles.cardText}>Todavia no marcaste favoritos.</Text></View>}</View> : null}
      {subtab === 'recordatorios' ? <View style={styles.stack}>{reminderItems.length > 0 ? reminderItems.map((item, index) => (
        <View key={`${item.title}-${index}`} style={[styles.card, styles.feedCard]}>
          <Text style={styles.cardEyebrow}>Recordatorio - {item.date}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardText}>La app mostrara un aviso interno 1 dia antes al abrir Notilestra.</Text>
        </View>
      )) : <View style={styles.card}><Text style={styles.cardText}>Todavia no marcaste recordatorios.</Text></View>}</View> : null}
    </View>
  );
}

function MaterialsScreen({ session, title, content, refreshKey, editor }: { session: Session | null; title: string; content?: AppContentBlock; refreshKey: number; editor?: PageEditorProps }) {
  const [remoteMaterials, setRemoteMaterials] = useState<AppMaterialRecord[]>([]);

  useEffect(() => {
    let alive = true;
    fetchAppMaterials().then((items) => {
      if (alive) {
        setRemoteMaterials(items);
      }
    });
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const visibleMaterials = remoteMaterials.length > 0
    ? remoteMaterials.map((material) => ({
      type: material.category ?? material.visibility ?? 'Material',
      title: material.title,
      description: material.description,
      permission: material.required_permission as Permission | null
    }))
    : materials;

  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      {visibleMaterials.map((material, index) => {
        const locked = material.permission && !hasPermission(session, material.permission as Permission);
        return (
          <View key={`${material.title}-${index}`} style={[styles.card, styles.libraryCard, locked && styles.lockedCard]}>
            <View style={styles.libraryIcon}>
              <Ionicons name={locked ? 'lock-closed-outline' : 'document-text-outline'} size={24} color={locked ? palette.inkMuted : palette.red} />
            </View>
            <View style={styles.libraryBody}>
              <Text style={styles.cardEyebrow}>{material.type}</Text>
              <Text style={styles.cardTitle}>{material.title}</Text>
              <Text style={styles.cardText}>{locked ? 'Material restringido por rango o permiso.' : material.description}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function CommunitiesScreen({ session, title, content, refreshKey, editor }: { session: Session | null; title: string; content?: AppContentBlock; refreshKey: number; editor?: PageEditorProps }) {
  const [communityData, setCommunityData] = useState<AppCommunity[]>(communities);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [filterProvince, setFilterProvince] = useState<string>('Todas');
  const visibleCommunityData = communityData;
  const province = visibleCommunityData.find((item) => item.province === selectedProvince);
  const community = province?.locations.find((item) => item.name === selectedCommunity);

  useEffect(() => {
    let alive = true;
    fetchCommunities().then((items) => {
      if (alive) {
        setCommunityData(items);
      }
    });
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !selectedProvince) {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedCommunity) {
        setSelectedCommunity(null);
        return true;
      }
      setSelectedProvince(null);
      return true;
    });
    return () => subscription.remove();
  }, [selectedCommunity, selectedProvince]);

  if (province) {
    return (
      <View style={styles.stack}>
        <TouchableOpacity style={styles.backButton} onPress={() => { setSelectedCommunity(null); setSelectedProvince(null); }} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={18} color={palette.red} />
          <Text style={styles.backButtonText}>Provincias</Text>
        </TouchableOpacity>
        <SectionTitle title={province.province} />
        <Text style={styles.screenIntro}>{province.description}</Text>
        <Modal visible={Boolean(community)} transparent animationType="slide" onRequestClose={() => setSelectedCommunity(null)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedCommunity(null)}>
            <TouchableOpacity style={[styles.modalPanel, styles.communityModalPanel]} activeOpacity={1} onPress={() => undefined}>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setSelectedCommunity(null)} activeOpacity={0.8}>
                <Ionicons name="close" size={22} color={palette.red} />
              </TouchableOpacity>
              {community ? (
                <>
                  <Image source={{ uri: community.imageUrl }} style={styles.communityModalImage} />
                  <Text style={styles.cardEyebrow}>{province.region}</Text>
                  <Text style={styles.cardTitle}>{community.name}</Text>
                  <View style={styles.communityModalMeta}>
                    <View style={styles.communityModalMetaItem}>
                      <Ionicons name="map-outline" size={17} color={palette.red} />
                      <Text style={styles.communityModalMetaText}>{province.province}</Text>
                    </View>
                    <View style={styles.communityModalMetaItem}>
                      <Ionicons name="people-outline" size={17} color={palette.red} />
                      <Text style={styles.communityModalMetaText}>{province.locations.length} comunidades activas</Text>
                    </View>
                    <View style={styles.communityModalMetaItem}>
                      <Ionicons name="call-outline" size={17} color={palette.red} />
                      <Text style={styles.communityModalMetaText}>{community.phone}</Text>
                    </View>
                    <View style={styles.communityModalMetaItem}>
                      <Ionicons name="calendar-outline" size={17} color={palette.red} />
                      <Text style={styles.communityModalMetaText}>{community.meetingDay} - {community.meetingTime}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardText}>{community.address}</Text>
                  <Text style={styles.cardText}>{community.description}</Text>
                  <View style={styles.inlineActions}>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => setSelectedCommunity(null)}>
                      <Text style={styles.primaryButtonText}>Ver mas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => setSelectedCommunity(null)}>
                      <Text style={styles.secondaryButtonText}>Contactar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
        {province.province === 'Tucuman' || province.province === 'Catamarca' ? (
          <View style={styles.groupNote}>
            <Text style={styles.groupNoteText}>Esta provincia distingue comunidades de jovenes y comunidades de adultos.</Text>
          </View>
        ) : null}
        {(province.province === 'Tucuman' || province.province === 'Catamarca') ? (
          <>
            <SectionTitle title="Comunidades de jovenes" />
            {province.locations.filter((location) => location.group !== 'adultos').map((location) => (
              <TouchableOpacity key={`young-${location.name}`} style={[styles.card, styles.communityCard]} activeOpacity={0.86} onPress={() => setSelectedCommunity(location.name)}>
                <Text style={styles.cardTitle}>{location.name}</Text>
                <Text style={styles.cardText}>{location.address}</Text>
                <Text style={styles.cardText}>Contacto: {location.phone}</Text>
                <Text style={styles.cardText}>Reunion: {location.meetingDay} - {location.meetingTime}</Text>
                <Text style={styles.expandHint}>Tocar para ver presentacion</Text>
              </TouchableOpacity>
            ))}
            <SectionTitle title="Comunidades de adultos" />
            {province.locations.filter((location) => location.group === 'adultos').map((location) => (
              <TouchableOpacity key={`adult-${location.name}`} style={[styles.card, styles.communityCard]} activeOpacity={0.86} onPress={() => setSelectedCommunity(location.name)}>
                <Text style={styles.cardTitle}>{location.name}</Text>
                <Text style={styles.cardText}>{location.address}</Text>
                <Text style={styles.cardText}>Contacto: {location.phone}</Text>
                <Text style={styles.cardText}>Reunion: {location.meetingDay} - {location.meetingTime}</Text>
                <Text style={styles.expandHint}>Tocar para ver presentacion</Text>
              </TouchableOpacity>
            ))}
          </>
        ) : province.locations.map((location) => (
          <TouchableOpacity key={location.name} style={[styles.card, styles.communityCard]} activeOpacity={0.86} onPress={() => setSelectedCommunity(location.name)}>
            <Text style={styles.cardTitle}>{location.name}</Text>
            <Text style={styles.cardText}>{location.address}</Text>
            <Text style={styles.cardText}>Contacto: {location.phone}</Text>
            <Text style={styles.cardText}>Reunion: {location.meetingDay} - {location.meetingTime}</Text>
            <Text style={styles.expandHint}>Tocar para ver presentacion</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      {visibleCommunityData.map((community) => (
        <TouchableOpacity key={community.province} style={[styles.card, styles.provinceCard]} onPress={() => setSelectedProvince(community.province)} activeOpacity={0.85}>
          <View style={styles.provinceIcon}>
            <Ionicons name="location-outline" size={22} color={palette.white} />
          </View>
          <View style={styles.provinceBody}>
            <Text style={styles.cardEyebrow}>{community.region}</Text>
            <Text style={styles.cardTitle}>{community.province}</Text>
            <Text style={styles.cardText}>{community.description}</Text>
            <Text style={styles.expandHint}>{community.locations.length} comunidades activas</Text>
          </View>
        </TouchableOpacity>
      ))}
      <SectionTitle title="Filtro demo" />
      <View style={styles.filterRow}>
        {['Todas', ...visibleCommunityData.map((item) => item.province)].map((item, index) => (
          <TouchableOpacity key={`${item}-${index}`} style={[styles.filterChip, filterProvince === item && styles.filterChipActive]} onPress={() => setFilterProvince(item)}>
            <Text style={[styles.filterChipText, filterProvince === item && styles.filterChipTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function HistoryScreen({ title, content, editor }: { title: string; content?: AppContentBlock; editor?: PageEditorProps }) {
  const [subtab, setSubtab] = useState<'historia' | 'faq'>('historia');
  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterChip, subtab === 'historia' && styles.filterChipActive]} onPress={() => setSubtab('historia')}>
          <Text style={[styles.filterChipText, subtab === 'historia' && styles.filterChipTextActive]}>Historia</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterChip, subtab === 'faq' && styles.filterChipActive]} onPress={() => setSubtab('faq')}>
          <Text style={[styles.filterChipText, subtab === 'faq' && styles.filterChipTextActive]}>Preguntas frecuentes</Text>
        </TouchableOpacity>
      </View>
      {subtab === 'historia' ? movementHistory.map((paragraph, index) => (
        <View key={paragraph.slice(0, 24)} style={styles.card}>
          <Text style={styles.cardEyebrow}>Capitulo {index + 1}</Text>
          <Text style={styles.cardText}>{paragraph}</Text>
        </View>
      )) : faqItems.map((item) => (
        <View key={item.question} style={styles.card}>
          <Text style={styles.cardTitle}>{item.question}</Text>
          <Text style={styles.cardText}>{item.answer}</Text>
        </View>
      ))}
    </View>
  );
}

function ContactScreen({ title, content, editor }: { title: string; content?: AppContentBlock; editor?: PageEditorProps }) {
  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      <View style={styles.heroMini}>
        <Text style={styles.cardTitle}>Encontrar una comunidad</Text>
        <Text style={styles.cardText}>{contactInfo.helpText}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>Canales</Text>
        <Text style={styles.cardText}>Mail: {contactInfo.email}</Text>
        <Text style={styles.cardText}>Celular: {contactInfo.phone}</Text>
        <Text style={styles.cardText}>Instagram: {contactInfo.instagram}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>Donaciones</Text>
        <Text style={styles.cardText}>{contactInfo.donationText}</Text>
      </View>
    </View>
  );
}

function GenericPageScreen({ title, content, editor }: { title: string; content?: AppContentBlock; editor?: PageEditorProps }) {
  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      {!content ? (
        <View style={styles.card}>
          <Text style={styles.cardText}>Esta pagina todavia no tiene contenido cargado.</Text>
        </View>
      ) : null}
    </View>
  );
}

function ProfileScreen({
  session,
  onSessionChange,
  tabs,
  appContent,
  adminConfig,
  touchPointerEnabled,
  onTouchPointerEnabledChange,
  onAdminConfigChange,
  onTabsChanged,
  onContentChanged
}: {
  session: Session | null;
  onSessionChange: (session: Session | null) => void;
  tabs: AppTabDisplay[];
  appContent: AppContentBlock[];
  adminConfig: AppAdminConfig;
  touchPointerEnabled: boolean;
  onTouchPointerEnabledChange: (value: boolean) => void;
  onAdminConfigChange: (config: AppAdminConfig) => void;
  onTabsChanged: () => Promise<void>;
  onContentChanged: () => Promise<void>;
}) {
  const [showCommunity, setShowCommunity] = useState(false);
  const [showCommunityManagement, setShowCommunityManagement] = useState(false);
  const [showProfilePhoto, setShowProfilePhoto] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [userRequestText, setUserRequestText] = useState('');
  const [selectedSentRequestId, setSelectedSentRequestId] = useState('');
  const [profilePanel, setProfilePanel] = useState<ProfilePanel>('vista');
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerContact, setRegisterContact] = useState('');
  const [registerProvince, setRegisterProvince] = useState('');
  const [registerCommunity, setRegisterCommunity] = useState('');
  const [registrationCommunities, setRegistrationCommunities] = useState<AppCommunity[]>(communities);
  const [provinceDropdownOpen, setProvinceDropdownOpen] = useState(false);
  const [communityDropdownOpen, setCommunityDropdownOpen] = useState(false);
  const [showDemoAccess, setShowDemoAccess] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [editFullName, setEditFullName] = useState(session?.fullName ?? '');
  const [editContact, setEditContact] = useState(session?.contact ?? '');
  const [editProvince, setEditProvince] = useState(session?.province ?? '');
  const [editCommunity, setEditCommunity] = useState(session?.communityOfOrigin ?? '');
  const [editProvinceDropdownOpen, setEditProvinceDropdownOpen] = useState(false);
  const [editCommunityDropdownOpen, setEditCommunityDropdownOpen] = useState(false);
  const [realPendingProfiles, setRealPendingProfiles] = useState<PendingProfile[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [selectedAdminUserId, setSelectedAdminUserId] = useState('');
  const [adminUserSearch, setAdminUserSearch] = useState('');
  const [selectedUsersProvince, setSelectedUsersProvince] = useState('');
  const [adminUserFullName, setAdminUserFullName] = useState('');
  const [adminUserEmail, setAdminUserEmail] = useState('');
  const [adminUserPassword, setAdminUserPassword] = useState('');
  const [adminUserPhone, setAdminUserPhone] = useState('');
  const [adminUserProvince, setAdminUserProvince] = useState('');
  const [adminUserCommunity, setAdminUserCommunity] = useState('');
  const [adminUserProvinceDropdownOpen, setAdminUserProvinceDropdownOpen] = useState(false);
  const [adminUserCommunityDropdownOpen, setAdminUserCommunityDropdownOpen] = useState(false);
  const [adminUserRoleDropdownOpen, setAdminUserRoleDropdownOpen] = useState(false);
  const [adminUserStatus, setAdminUserStatus] = useState('pendiente');
  const [adminUserRole, setAdminUserRole] = useState<Role>('palestrista');
  const [adminNewsTitle, setAdminNewsTitle] = useState('');
  const [adminNewsBody, setAdminNewsBody] = useState('');
  const [adminNewsCategory, setAdminNewsCategory] = useState('General');
  const [adminNewsImage, setAdminNewsImage] = useState('');
  const [adminNewsDraft, setAdminNewsDraft] = useState(false);
  const [adminNewsFeatured, setAdminNewsFeatured] = useState(false);
  const [newsDrafts, setNewsDrafts] = useState<NewsDraftRecord[]>([]);
  const [adminMaterials, setAdminMaterials] = useState<AppMaterialRecord[]>([]);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [materialCategory, setMaterialCategory] = useState('General');
  const [materialVisibility, setMaterialVisibility] = useState('interno');
  const [materialPermission, setMaterialPermission] = useState('');
  const [materialFileUrl, setMaterialFileUrl] = useState('');
  const [adminEventTitle, setAdminEventTitle] = useState('');
  const [adminEventBody, setAdminEventBody] = useState('');
  const [adminEventDate, setAdminEventDate] = useState('');
  const [adminModule, setAdminModule] = useState<AdminModule>('resumen');
  const [adminConfigDraft, setAdminConfigDraft] = useState<AppAdminConfig>(adminConfig);
  const [adminCommunityProvince, setAdminCommunityProvince] = useState('');
  const [adminCommunityId, setAdminCommunityId] = useState('');
  const [adminCommunityName, setAdminCommunityName] = useState('');
  const [adminCommunityAddress, setAdminCommunityAddress] = useState('');
  const [adminCommunityPhone, setAdminCommunityPhone] = useState('');
  const [adminCommunityDay, setAdminCommunityDay] = useState('');
  const [adminCommunityTime, setAdminCommunityTime] = useState('');
  const [adminCommunityDescription, setAdminCommunityDescription] = useState('');
  const [editingTabs, setEditingTabs] = useState<Record<string, { label: string; isVisible: boolean; visibleRoles: string[] | null }>>({});
  const [newTabLabel, setNewTabLabel] = useState('');
  const [newTabRoles, setNewTabRoles] = useState<string[]>(['sedimentador', 'coordinador_comunidad', 'animador_comunidad', 'vocal', 'coordinador_diocesano', 'asesor', 'vocal_nacional', 'coordinador_nacional', 'administrador']);
  const [selectedContentTab, setSelectedContentTab] = useState<TabKey>('inicio');
  const [contentTitle, setContentTitle] = useState('');
  const [contentBody, setContentBody] = useState('');
  const [contentBlocks, setContentBlocks] = useState<ContentEditorBlock[]>([]);
  const [adminRequestMessage, setAdminRequestMessage] = useState('');
  const [perseveranceRole, setPerseveranceRole] = useState<Role>('sedimentador');
  const [perseveranceRoleDropdownOpen, setPerseveranceRoleDropdownOpen] = useState(false);
  const [communityMembers, setCommunityMembers] = useState<CommunityMember[]>([]);
  const [leadershipRole, setLeadershipRole] = useState<Role>('animador_comunidad');
  const [leadershipRoleDropdownOpen, setLeadershipRoleDropdownOpen] = useState(false);
  const [successorUserId, setSuccessorUserId] = useState('');
  const [successorDropdownOpen, setSuccessorDropdownOpen] = useState(false);
  const [communityPostKind, setCommunityPostKind] = useState<'aviso' | 'noticia' | 'fecha' | 'encuesta'>('aviso');
  const [communityPostVisibility, setCommunityPostVisibility] = useState<'publica' | 'registrados' | 'sedimentadores'>('publica');
  const [communityPostTitle, setCommunityPostTitle] = useState('');
  const [communityPostBody, setCommunityPostBody] = useState('');
  const [communityPostDate, setCommunityPostDate] = useState('');
  const [communityPollOptions, setCommunityPollOptions] = useState('');
  const [myCommunityPublications, setMyCommunityPublications] = useState<CommunityPublication[]>([]);
  const [localPollVotes, setLocalPollVotes] = useState<Record<string, string>>({});
  const [sentRequests, setSentRequests] = useState<AdminRequest[]>([]);
  const [requestSubtab, setRequestSubtab] = useState<'pendientes' | 'resueltas'>('pendientes');
  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>([
    {
      id: 'req-001',
      title: 'Solicitud de perseverancia',
      requester: 'Usuario demo 1',
      definition: 'Pide revision para acceder al rango de Sedimentador.',
      createdAt: '2026-05-10T09:00:00-03:00',
      status: 'pendiente'
    },
    {
      id: 'req-002',
      title: 'Solicitud de material exclusivo',
      requester: 'Usuario demo 2',
      definition: 'Pide acceso a material interno de formacion.',
      createdAt: '2026-05-14T08:15:00-03:00',
      status: 'pendiente'
    }
  ]);
  const selectedRegistrationProvince = registrationCommunities.find((item) => item.province === registerProvince);
  const selectedEditProvince = registrationCommunities.find((item) => item.province === editProvince);
  const visibleRegistrationCommunities = useMemo(() => registrationCommunities.filter((item) => canAccessProvince(session, item.province)), [registrationCommunities, session?.province, session?.role]);
  const manageableCommunities = useMemo(() => registrationCommunities.filter((item) => canManageProvince(session, item.province)), [registrationCommunities, session?.province, session?.role]);
  const selectedAdminProvince = manageableCommunities.find((item) => item.province === adminCommunityProvince);
  const selectedAdminCommunity = selectedAdminProvince?.locations.find((item) => (item.id ?? item.name) === adminCommunityId);
  const selectedAdminUser = adminUsers.find((item) => item.id === selectedAdminUserId);
  const selectedAdminUserProvince = visibleRegistrationCommunities.find((item) => item.province === adminUserProvince);
  const assignableRoles = useMemo(() => assignableRolesFor(session), [session?.role]);
  const selectedEditableContent = appContent.find((item) => item.tab_key === selectedContentTab);
  const editableTabs = useMemo(
    () => (tabs.length > 0 ? tabs : defaultTabs.map((tab, index) => ({ ...tab, visible: true, sortOrder: index, visibleRoles: null }))),
    [tabs]
  );
  const tabLabel = (key: TabKey) => editableTabs.find((tab) => tab.key === key)?.label ?? defaultTabs.find((tab) => tab.key === key)?.label ?? key;
  const profileNews = session ? communityNews.filter((item) => item.community === session.communityOfOrigin) : [];
  const roleInfo = session ? roleDefinitions.find((item) => item.role === session.role) : null;
  const isCommunityLeader = Boolean(session && ['animador_comunidad', 'coordinador_comunidad'].includes(session.role));
  const canReviewLeadershipRequests = Boolean(session && ['vocal', 'coordinador_diocesano', 'administrador'].includes(session.role));
  const selectableCommunityMembers = communityMembers.filter((member) => (
    member.email !== session?.email
    && member.full_name !== session?.fullName
  ));
  const pendingAdminRequests = adminRequests.filter((item) => item.status === 'pendiente').sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const resolvedAdminRequests = adminRequests.filter((item) => item.status !== 'pendiente').sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const filteredAdminUsers = adminUsers.filter((user) => {
    if (!canAccessProvince(session, user.province)) {
      return false;
    }
    const query = adminUserSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return [user.full_name, user.email, user.province, user.community_name, user.role, user.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });
  const adminUsersByProvince = filteredAdminUsers.reduce<Record<string, AdminUser[]>>((groups, user) => {
    const province = user.province || 'Sin provincia';
    groups[province] = groups[province] ?? [];
    groups[province].push(user);
    return groups;
  }, {});
  const userProvinceOptions = Object.keys(adminUsersByProvince).sort((a, b) => a.localeCompare(b));
  const visibleAdminUsers = selectedUsersProvince ? (adminUsersByProvince[selectedUsersProvince] ?? []) : [];
  const enabledAdminModules = adminModuleCatalog.filter((item) => hasPermission(session, 'gestionar_sistema') || !item.systemOnly || ['resumen', 'usuarios', 'solicitudes', 'comunidades'].includes(item.key));
  const adminDraftSummary = [
    { label: 'Usuarios', value: String(adminUsers.length || realPendingProfiles.length), icon: 'people-outline' as keyof typeof Ionicons.glyphMap },
    { label: 'Solicitudes', value: String(pendingAdminRequests.length), icon: 'mail-unread-outline' as keyof typeof Ionicons.glyphMap },
    { label: 'Comunidades', value: String(manageableCommunities.reduce((total, item) => total + item.locations.length, 0)), icon: 'location-outline' as keyof typeof Ionicons.glyphMap },
    { label: 'Modulos', value: String(editableTabs.filter((tab) => tab.visible).length), icon: 'apps-outline' as keyof typeof Ionicons.glyphMap }
  ];

  useEffect(() => {
    setEditFullName(session?.fullName ?? '');
    setEditContact(session?.contact ?? '');
    setEditProvince(session?.province ?? '');
    setEditCommunity(session?.communityOfOrigin ?? '');
  }, [session]);

  useEffect(() => {
    setAdminConfigDraft(adminConfig);
  }, [adminConfig]);

  function updateAdminConfigSection<K extends keyof AppAdminConfig>(section: K, patch: Partial<AppAdminConfig[K]>) {
    setAdminConfigDraft((current) => ({
      ...current,
      [section]: {
        ...current[section],
        ...patch
      }
    }));
  }

  function toggleAdminConfigList(section: 'home', key: string) {
    setAdminConfigDraft((current) => {
      const currentList = current[section].visibleModules;
      const nextList = currentList.includes(key) ? currentList.filter((item) => item !== key) : [...currentList, key];
      return { ...current, [section]: { ...current[section], visibleModules: nextList } };
    });
  }

  async function saveAdminConfigDraft(scope: string) {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo el administrador puede guardar configuracion global.');
      return;
    }
    setAuthMessage(`Guardando ${scope}...`);
    const { error } = await saveAdminConfig(adminConfigDraft);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    onAdminConfigChange(adminConfigDraft);
    setAuthMessage(`${scope} guardado en Supabase.`);
  }

  useEffect(() => {
    const tab = editableTabs.find((item) => item.key === selectedContentTab);
    setContentTitle(selectedEditableContent?.title ?? tab?.label ?? '');
    setContentBody(selectedEditableContent?.body ?? '');
    setContentBlocks(selectedEditableContent?.blocks?.length ? selectedEditableContent.blocks : [
      { id: 'block-title', type: 'titulo', value: selectedEditableContent?.title ?? tab?.label ?? '' },
      { id: 'block-body', type: 'texto', value: selectedEditableContent?.body ?? '' }
    ]);
  }, [selectedContentTab, selectedEditableContent, editableTabs]);

  useEffect(() => {
    let alive = true;
    fetchCommunities().then((items) => {
      if (alive) {
        setRegistrationCommunities(items);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedAdminCommunity) {
      setAdminCommunityName('');
      setAdminCommunityAddress('');
      setAdminCommunityPhone('');
      setAdminCommunityDay('');
      setAdminCommunityTime('');
      setAdminCommunityDescription('');
      return;
    }

    setAdminCommunityName(selectedAdminCommunity.name);
    setAdminCommunityAddress(selectedAdminCommunity.address);
    setAdminCommunityPhone(selectedAdminCommunity.phone);
    setAdminCommunityDay(selectedAdminCommunity.meetingDay);
    setAdminCommunityTime(selectedAdminCommunity.meetingTime);
    setAdminCommunityDescription(selectedAdminCommunity.description);
  }, [selectedAdminCommunity]);

  useEffect(() => {
    if (!selectedAdminUser) {
      setAdminUserFullName('');
      setAdminUserPhone('');
      setAdminUserProvince('');
      setAdminUserCommunity('');
      setAdminUserStatus('pendiente');
      setAdminUserRole('palestrista');
      return;
    }

    setAdminUserFullName(selectedAdminUser.full_name ?? '');
    setAdminUserEmail(selectedAdminUser.email ?? '');
    setAdminUserPassword('');
    setAdminUserPhone(selectedAdminUser.phone ?? '');
    setAdminUserProvince(selectedAdminUser.province ?? '');
    setAdminUserCommunity(selectedAdminUser.community_name ?? '');
    setAdminUserStatus(selectedAdminUser.status);
    setAdminUserRole((selectedAdminUser.role || 'palestrista') as Role);
  }, [selectedAdminUser]);

  function normalizeRequest(item: UserRequestRecord): AdminRequest {
    return {
      id: item.id,
      userId: item.user_id,
      title: item.title,
      requester: item.requester,
      definition: item.definition,
      createdAt: item.created_at,
      status: item.status === 'rechazada' ? 'denegada' : item.status as AdminRequest['status'],
      message: item.admin_message ?? undefined,
      resolvedAt: item.resolved_at ?? undefined,
      resolvedBy: item.resolved_by_name ? `${item.resolved_by_name}${item.resolved_by_role ? ` - ${roleLabel(item.resolved_by_role as Role)}` : ''}` : undefined,
      targetUserId: item.target_user_id,
      targetUserName: item.target_user_name,
      targetRole: item.target_role,
      communityName: item.community_name
    };
  }

  async function loadMyRequests() {
    const items = await fetchMyRequests();
    if (items.length > 0) {
      setSentRequests(items.map(normalizeRequest));
    }
  }

  async function loadAdminRequests() {
    const items = await fetchAdminRequests();
    if (items.length > 0) {
      setAdminRequests(items.map(normalizeRequest));
    }
  }

  useEffect(() => {
    if (session) {
      loadMyRequests();
      fetchCommunityPublications(session).then((items) => {
        setMyCommunityPublications(items.filter((item) => item.communityName === session.communityOfOrigin));
      });
      if (['animador_comunidad', 'coordinador_comunidad'].includes(session.role)) {
        fetchMyCommunityMembers().then(setCommunityMembers);
      }
      if (session.role === 'administrador') {
        loadAdminRequests();
      }
      if (['vocal', 'coordinador_diocesano'].includes(session.role)) {
        loadAdminRequests();
      }
    }
  }, [session?.email, session?.role, session?.communityOfOrigin]);

  async function loadRealProfile(userId: string, fallbackEmail: string) {
    const result = await getMyProfileSession(fallbackEmail);
    if (result.error) {
      setAuthMessage(`No pude leer tu perfil: ${result.error}`);
      return;
    }
    if (result.session) {
      onSessionChange(result.session);
    }
  }

  async function signInReal() {
    setAuthMessage('Ingresando...');
    const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
    if (error || !data.user) {
      setAuthMessage(error?.message ?? 'No se pudo iniciar sesion. Si registraste el email hoy, revisa que este confirmado o habilitado por SQL.');
      return;
    }
    await loadRealProfile(data.user.id, authEmail.trim());
    setAuthMessage('Sesion iniciada.');
  }

  async function registerReal() {
    if (authMode === 'register' && !registerFullName.trim()) {
      setAuthMessage('Nombre y apellido es obligatorio para registrarte.');
      return;
    }
    if (authMode === 'register' && !authEmail.trim()) {
      setAuthMessage('El mail es obligatorio para registrarte.');
      return;
    }
    if (authMode === 'register' && (!registerProvince || !registerCommunity)) {
      setAuthMessage('Elegir provincia y comunidad es obligatorio para registrarte.');
      return;
    }

    setAuthMessage('Registrando...');
    const { data, error } = await supabase.auth.signUp({
      email: authEmail.trim(),
      password: authPassword,
      options: {
        data: {
          full_name: registerFullName.trim() || authEmail.trim(),
          phone: registerContact.trim(),
          province: registerProvince.trim(),
          community_name: registerCommunity.trim()
        }
      }
    });
    if (error || !data.user) {
      setAuthMessage(error?.message ?? 'No se pudo registrar.');
      return;
    }

    if (data.session) {
      await loadRealProfile(data.user.id, authEmail.trim());
      setAuthMessage('Registro creado. Queda pendiente de aprobacion.');
      return;
    }

    setAuthMessage('Registro creado como Palestrista pendiente. Inicia sesion cuando el email este confirmado o un administrador lo habilite.');
  }

  async function signOutReal() {
    await supabase.auth.signOut();
    setAuthMessage('');
    onSessionChange(null);
  }

  async function refreshRealProfile() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setAuthMessage('No hay una sesion real activa. Cerrar e iniciar sesion otra vez.');
      return;
    }

    await loadRealProfile(data.user.id, data.user.email ?? 'Usuario');
    setAuthMessage('Estado actualizado desde Supabase.');
  }

  async function saveProfile() {
    if (!session) {
      return;
    }

    if (!editProvince || !editCommunity) {
      setAuthMessage('Elegir provincia y comunidad es obligatorio.');
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setAuthMessage('Perfil demo actualizado visualmente. Inicia sesion real para guardar en Supabase.');
      onSessionChange({
        ...session,
        fullName: editFullName || session.fullName,
        province: editProvince || session.province,
        contact: editContact || session.contact,
        communityOfOrigin: editCommunity || session.communityOfOrigin
      });
      return;
    }

    const { error } = await updateMyProfile({
      fullName: editFullName || session.fullName,
      phone: editContact || session.contact,
      province: editProvince || session.province,
      communityName: editCommunity || session.communityOfOrigin
    });

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    onSessionChange({
      ...session,
      fullName: editFullName || session.fullName,
      province: editProvince || session.province,
      contact: editContact || session.contact,
      communityOfOrigin: editCommunity || session.communityOfOrigin
    });
    await loadRealProfile(authData.user.id, authData.user.email ?? session.email ?? session.fullName);
    setAuthMessage('Perfil guardado.');
  }

  async function uploadProfilePhoto() {
    if (!session) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAuthMessage('Necesito permiso para acceder a tus fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setAuthMessage('Inicia sesion real para subir una foto.');
      return;
    }

    try {
      setAuthMessage('Subiendo foto...');
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const bytes = await response.arrayBuffer();
      const extension = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      const path = `${authData.user.id}/profile-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(path, bytes, {
          contentType: asset.mimeType ?? 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        setAuthMessage(uploadError.message);
        return;
      }

      const { data: publicUrl } = supabase.storage.from('profile-photos').getPublicUrl(path);
      const avatarUrl = publicUrl.publicUrl;
      const { error } = await updateMyAvatar(avatarUrl);
      if (error) {
        setAuthMessage(error.message);
        return;
      }

      onSessionChange({ ...session, avatarUrl });
      setAuthMessage('Foto de perfil actualizada.');
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'No pude subir la foto.');
    }
  }

  async function loadPendingProfiles() {
    const items = await fetchPendingProfiles();
    setRealPendingProfiles(items);
  }

  async function loadAdminUsers() {
    setAuthMessage('Cargando usuarios...');
    const items = await fetchAdminUsers();
    setAdminUsers(items);
    setAuthMessage(items.length > 0 ? 'Usuarios cargados.' : 'No se encontraron usuarios o falta ejecutar el SQL de administracion.');
  }

  async function approvePendingProfile(id: string, role: Role) {
    const { error } = await approveProfile(id, role);
    setAuthMessage(error ? error.message : 'Usuario aprobado.');
    await loadPendingProfiles();
  }

  async function saveAdminUser() {
    if (!selectedAdminUser) {
      setAuthMessage('Elegir un usuario para editar.');
      return;
    }
    if (!canAccessProvince(session, adminUserProvince)) {
      setAuthMessage('No podes editar usuarios de otra provincia.');
      return;
    }
    if (selectedAdminUser.role !== adminUserRole && !canApproveRole(session, adminUserRole)) {
      setAuthMessage(`Tu rango no puede asignar el rol ${roleLabel(adminUserRole)}.`);
      return;
    }

    setAuthMessage('Guardando usuario...');
    const { error } = await updateAdminUser({
      id: selectedAdminUser.id,
      email: adminUserEmail,
      password: adminUserPassword,
      fullName: adminUserFullName,
      phone: adminUserPhone,
      province: adminUserProvince,
      communityName: adminUserCommunity,
      status: adminUserStatus,
      role: adminUserRole
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await loadAdminUsers();
    setSelectedAdminUserId('');
    setAuthMessage('Usuario actualizado.');
  }

  async function confirmSelectedUserEmail() {
    if (!selectedAdminUser) {
      setAuthMessage('Elegir un usuario para aprobar email.');
      return;
    }

    const { error } = await confirmAdminUserEmail(selectedAdminUser.id);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await loadAdminUsers();
    setAuthMessage('Email confirmado desde administracion.');
  }

  async function adminCreateNews() {
    if (!adminNewsTitle.trim() || !adminNewsBody.trim()) {
      setAuthMessage('Completa titulo y texto antes de publicar la noticia.');
      return;
    }

    setAuthMessage('Publicando noticia...');
    const { error } = await createNews(adminNewsTitle.trim(), adminNewsBody.trim(), true);
    setAuthMessage(error ? error.message : 'Noticia creada.');
    if (!error) {
      setAdminNewsTitle('');
      setAdminNewsBody('');
      setAdminNewsImage('');
      setAdminNewsDraft(false);
      setAdminNewsFeatured(false);
      await onContentChanged();
    }
  }

  async function loadNewsDrafts() {
    const items = await fetchNewsDrafts();
    setNewsDrafts(items);
    setAuthMessage(items.length > 0 ? 'Borradores cargados.' : 'No hay borradores guardados.');
  }

  async function adminSaveNewsDraft(status = 'borrador') {
    if (!adminNewsTitle.trim() || !adminNewsBody.trim()) {
      setAuthMessage('Completa titulo y texto antes de guardar el borrador.');
      return;
    }

    setAuthMessage('Guardando borrador...');
    const { error } = await saveNewsDraft({
      title: adminNewsTitle.trim(),
      body: adminNewsBody.trim(),
      category: adminNewsCategory,
      imageUrl: adminNewsImage.trim() || null,
      isFeatured: adminNewsFeatured,
      status
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAdminNewsTitle('');
    setAdminNewsBody('');
    setAdminNewsImage('');
    setAdminNewsDraft(false);
    setAdminNewsFeatured(false);
    await loadNewsDrafts();
    setAuthMessage(status === 'borrador' ? 'Borrador guardado.' : 'Borrador actualizado.');
  }

  async function loadAdminMaterials() {
    const items = await fetchAppMaterials();
    setAdminMaterials(items);
    setAuthMessage(items.length > 0 ? 'Materiales cargados.' : 'No hay materiales guardados.');
  }

  async function adminSaveMaterial() {
    if (!materialTitle.trim() || !materialDescription.trim()) {
      setAuthMessage('Completa nombre y descripcion del material.');
      return;
    }

    setAuthMessage('Guardando material...');
    const { error } = await saveAppMaterial({
      title: materialTitle.trim(),
      description: materialDescription.trim(),
      category: materialCategory.trim() || 'General',
      visibility: materialVisibility,
      requiredPermission: materialPermission.trim() || null,
      fileUrl: materialFileUrl.trim() || null,
      filePath: null,
      sortOrder: 100
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setMaterialTitle('');
    setMaterialDescription('');
    setMaterialFileUrl('');
    setMaterialPermission('');
    await loadAdminMaterials();
    setAuthMessage('Material guardado y visible segun permisos.');
  }

  async function adminArchiveMaterial(id: string) {
    const { error } = await archiveAppMaterial(id);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await loadAdminMaterials();
    setAuthMessage('Material archivado.');
  }

  async function adminCreateEvent() {
    if (!adminEventTitle.trim() || !adminEventBody.trim() || !adminEventDate.trim()) {
      setAuthMessage('Completa titulo, descripcion y fecha antes de publicar el evento.');
      return;
    }
    if (Number.isNaN(Date.parse(adminEventDate))) {
      setAuthMessage('La fecha debe tener formato valido. Ejemplo: 2026-05-28T21:00:00-03:00');
      return;
    }

    setAuthMessage('Publicando evento...');
    const { error } = await createEvent(adminEventTitle.trim(), adminEventBody.trim(), adminEventDate.trim(), true);
    setAuthMessage(error ? error.message : 'Evento creado.');
    if (!error) {
      setAdminEventTitle('');
      setAdminEventBody('');
      setAdminEventDate('');
      await onContentChanged();
    }
  }

  async function adminSaveTab(key: string, fallbackLabel: string) {
    const tab = editableTabs.find((item) => item.key === key);
    const draft = editingTabs[key] ?? { label: fallbackLabel, isVisible: true, visibleRoles: tab?.visibleRoles ?? null };
    const { error } = await updateAppTab(key, draft.label || fallbackLabel, draft.isVisible, draft.visibleRoles);
    setAuthMessage(error ? error.message : 'Pestana actualizada.');
    await onTabsChanged();
  }

  async function adminCreatePage() {
    if (!newTabLabel.trim()) {
      setAuthMessage('Escribir un nombre para la nueva pagina.');
      return;
    }
    const key = newTabLabel.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const { error } = await createAppTab(key, newTabLabel.trim(), newTabRoles);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await updateAppContent(key, newTabLabel.trim(), 'Contenido inicial de la pagina.', [
      { id: `titulo-${Date.now()}`, type: 'titulo', value: newTabLabel.trim() },
      { id: `texto-${Date.now()}`, type: 'texto', value: 'Contenido inicial de la pagina.' }
    ]);
    setNewTabLabel('');
    await onTabsChanged();
    await onContentChanged();
    setAuthMessage('Pagina creada con visibilidad por rol.');
  }

  function updateTabRole(key: string, role: Role, checked: boolean) {
    const tab = editableTabs.find((item) => item.key === key);
    const currentDraft = editingTabs[key] ?? { label: tab?.label ?? key, isVisible: tab?.visible ?? true, visibleRoles: tab?.visibleRoles ?? null };
    const currentRoles = currentDraft.visibleRoles ?? roleDefinitions.map((item) => item.role);
    const nextRoles = checked ? Array.from(new Set([...currentRoles, role])) : currentRoles.filter((item) => item !== role);
    setEditingTabs((current) => ({ ...current, [key]: { ...currentDraft, visibleRoles: nextRoles } }));
  }

  function toggleNewTabRole(role: Role) {
    setNewTabRoles((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role]);
  }

  async function adminSaveContent() {
    if (!contentTitle.trim() || !contentBody.trim()) {
      setAuthMessage('Completa titulo y texto antes de guardar el contenido.');
      return;
    }

    setAuthMessage('Guardando contenido...');
    const normalizedBlocks = contentBlocks
      .map((block) => ({ ...block, value: block.value.trim() }))
      .filter((block) => block.value.length > 0);
    const { error } = await updateAppContent(selectedContentTab, contentTitle.trim(), contentBody.trim(), normalizedBlocks);
    setAuthMessage(error ? error.message : 'Contenido actualizado.');
    if (!error) {
      await onContentChanged();
    }
  }

  async function adminSaveCommunity() {
    if (!selectedAdminCommunity?.id) {
      setAuthMessage('Elegir una comunidad cargada desde Supabase para editar.');
      return;
    }
    if (!canManageProvince(session, adminCommunityProvince)) {
      setAuthMessage('Tu rango solo puede editar comunidades de tu provincia o de tu alcance.');
      return;
    }

    setAuthMessage('Guardando comunidad...');
    const { error } = await updateCommunity(selectedAdminCommunity.id, {
      name: adminCommunityName,
      address: adminCommunityAddress,
      phone: adminCommunityPhone,
      meeting_day: adminCommunityDay,
      meeting_time: adminCommunityTime,
      description: adminCommunityDescription
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }

    const items = await fetchCommunities();
    setRegistrationCommunities(items);
    setAdminCommunityId('');
    setAuthMessage('Comunidad actualizada.');
    if (session?.communityOfOrigin === selectedAdminCommunity.name) {
      onSessionChange({ ...session, communityOfOrigin: adminCommunityName || selectedAdminCommunity.name });
    }
    await onContentChanged();
  }

  function addContentBlock(type: ContentEditorBlock['type']) {
    setContentBlocks((current) => [
      ...current,
      { id: `${type}-${Date.now()}`, type, value: type === 'imagen' ? 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png' : '' }
    ]);
  }

  function moveContentBlock(index: number, direction: -1 | 1) {
    setContentBlocks((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  }

  function updateContentBlock(id: string, value: string) {
    setContentBlocks((current) => current.map((block) => block.id === id ? { ...block, value } : block));
  }

  function deleteContentBlock(id: string) {
    setContentBlocks((current) => current.filter((block) => block.id !== id));
  }

  async function resolveAdminRequest(id: string, status: 'aprobada' | 'denegada') {
    const request = adminRequests.find((item) => item.id === id);
    const assignRole = status === 'aprobada' && request?.title === 'Solicitud de perseverancia' ? perseveranceRole : status === 'aprobada' && request?.title === 'Cambio de dirigencia' ? (request.targetRole as Role | undefined ?? leadershipRole) : null;
    if (assignRole && !canApproveRole(session, assignRole)) {
      setAuthMessage(`Tu rango no puede aprobar el rol ${roleLabel(assignRole)}.`);
      return;
    }
    const { error } = await resolveUserRequest(id, status === 'denegada' ? 'rechazada' : status, adminRequestMessage || 'Sin mensaje del administrador', assignRole);
    if (!error) {
      await loadAdminRequests();
      setRequestSubtab('resueltas');
      setAuthMessage(assignRole ? `Solicitud aprobada y rol ${roleLabel(assignRole)} asignado.` : `Solicitud ${status}. El usuario vera la resolucion en su perfil.`);
      setAdminRequestMessage('');
      return;
    }

    setAdminRequests((current) => current.map((request) => (
      request.id === id
        ? { ...request, status, message: adminRequestMessage || 'Sin mensaje del administrador', resolvedAt: new Date().toISOString(), resolvedBy: `${session?.fullName ?? 'Administrador'} - ${roleLabel(session?.role ?? 'administrador')}` }
        : request
    )));
    setRequestSubtab('resueltas');
    setAuthMessage(`Solicitud ${status}. El usuario vera la resolucion en su perfil.`);
    setAdminRequestMessage('');
  }

  function submitUserRequest(title: string) {
    if (!session) {
      return;
    }
    if (userRequestText.trim().length === 0) {
      setAuthMessage('Escribir una descripcion de hasta 500 caracteres para enviar la solicitud.');
      return;
    }

    const newRequest = {
      id: `req-${Date.now()}`,
      title,
      requester: session.fullName,
      definition: userRequestText.trim().slice(0, 500),
      createdAt: new Date().toISOString(),
      status: 'pendiente' as const
    };
    createUserRequest(title, newRequest.definition).then(async ({ error }) => {
      if (!error) {
        await loadMyRequests();
        await loadAdminRequests();
      }
    });
    setSentRequests((current) => [
      ...current,
      newRequest
    ]);
    setAdminRequests((current) => [
      ...current,
      newRequest
    ]);
    setSelectedRequest(null);
    setUserRequestText('');
    setAuthMessage('Solicitud enviada al panel del administrador.');
  }

  async function submitLeadershipChangeRequest() {
    if (!session || !isCommunityLeader) {
      return;
    }
    if (!successorUserId) {
      setAuthMessage('Selecciona el sucesor dentro de tu comunidad.');
      return;
    }
    if (!userRequestText.trim()) {
      setAuthMessage('Escribi un mensaje para fundamentar el cambio de dirigencia.');
      return;
    }

    const successor = selectableCommunityMembers.find((member) => member.id === successorUserId);
    const details = `${userRequestText.trim().slice(0, 500)}\n\nSucesor propuesto: ${successor?.full_name ?? 'Usuario seleccionado'}\nRol propuesto: ${roleLabel(leadershipRole)}\nComunidad: ${session.communityOfOrigin}`;
    const { error } = await createLeadershipChangeRequest({
      successorUserId,
      successorRole: leadershipRole,
      details
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await loadMyRequests();
    setSelectedRequest(null);
    setUserRequestText('');
    setSuccessorUserId('');
    setAuthMessage('Solicitud de cambio de dirigencia enviada al Vocal Diocesano.');
  }

  async function publishCommunityPost() {
    if (!session || !isCommunityLeader) {
      return;
    }
    if (!communityPostTitle.trim() || !communityPostBody.trim()) {
      setAuthMessage('Completa titulo y texto antes de publicar en tu comunidad.');
      return;
    }
    if (communityPostKind === 'fecha' && !communityPostDate.trim()) {
      setAuthMessage('Las fechas de calendario necesitan una fecha.');
      return;
    }

    const visibility = session.role === 'animador_comunidad' ? 'publica' : communityPostVisibility;
    const pollOptions = communityPostKind === 'encuesta'
      ? communityPollOptions.split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 8)
      : [];
    if (communityPostKind === 'encuesta' && pollOptions.length < 2) {
      setAuthMessage('Las encuestas necesitan al menos 2 opciones, una por linea.');
      return;
    }
    const { error } = await createCommunityPublication({
      kind: communityPostKind,
      title: communityPostTitle.trim(),
      body: communityPostBody.trim(),
      eventDate: communityPostKind === 'fecha' ? communityPostDate.trim() : null,
      visibility,
      pollOptions
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setCommunityPostTitle('');
    setCommunityPostBody('');
    setCommunityPostDate('');
    setCommunityPollOptions('');
    setAuthMessage('Publicacion enviada a la comunidad.');
    const updatedItems = await fetchCommunityPublications(session);
    setMyCommunityPublications(updatedItems.filter((item) => item.communityName === session.communityOfOrigin));
    await onContentChanged();
  }

  async function votePoll(publication: CommunityPublication, option: string) {
    if (!publication.id) {
      return;
    }
    const { error } = await voteCommunityPoll(publication.id, option);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setLocalPollVotes((current) => ({ ...current, [publication.id]: option }));
    const updatedItems = await fetchCommunityPublications(session);
    setMyCommunityPublications(updatedItems.filter((item) => item.communityName === session?.communityOfOrigin));
  }

  return (
    <View style={styles.stack}>
      <SectionTitle title={`${tabLabel('perfil')} y acceso`} />
      {session ? (
        <View style={styles.profileShell}>
          <View style={styles.profileTopRow}>
            <View />
            <TouchableOpacity style={styles.iconButton} onPress={() => setShowAccountMenu(!showAccountMenu)}>
              <Ionicons name="menu" size={20} color={palette.red} />
            </TouchableOpacity>
          </View>
          {showAccountMenu ? (
            <View style={styles.accountMenu}>
              <View style={styles.accountMenuHeader}>
                <View style={styles.accountMenuAvatar}>
                  {session.avatarUrl ? <Image source={{ uri: session.avatarUrl }} style={styles.accountMenuAvatarImage} /> : <Ionicons name="person-outline" size={18} color={palette.red} />}
                </View>
                <View style={styles.adminUserHeaderText}>
                  <Text style={styles.accountMenuName}>{session.fullName}</Text>
                  <Text style={styles.accountMenuSub}>{roleLabel(session.role)}</Text>
                </View>
              </View>
              {[
                { icon: 'person-outline', label: 'Mi perfil', action: () => setProfilePanel('vista') },
                { icon: 'create-outline', label: 'Editar perfil', action: () => setProfilePanel('editar') },
                { icon: 'settings-outline', label: 'Configuracion', action: () => setProfilePanel('configuracion') },
                { icon: 'people-outline', label: 'Mi comunidad', action: () => setShowCommunity(true) },
                ...(isCommunityLeader ? [{ icon: 'briefcase-outline', label: 'Gestionar comunidad', action: () => setShowCommunityManagement(true) }] : []),
                { icon: 'refresh-outline', label: 'Actualizar estado', action: refreshRealProfile }
              ].map((item) => (
                <TouchableOpacity key={item.label} style={styles.accountMenuItem} onPress={() => { item.action(); setShowAccountMenu(false); }}>
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color={palette.inkMuted} />
                  <Text style={styles.accountMenuItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.accountMenuItem} onPress={signOutReal}>
                <Ionicons name="log-out-outline" size={18} color={palette.red} />
                <Text style={[styles.accountMenuItemText, styles.accountMenuDanger]}>Cerrar sesion</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <View style={styles.profileHero}>
            <TouchableOpacity style={styles.avatarFrameLarge} onPress={() => session.avatarUrl ? setShowProfilePhoto(true) : uploadProfilePhoto()} activeOpacity={0.88}>
              {session.avatarUrl ? <Image source={{ uri: session.avatarUrl }} style={styles.avatarImageLarge} /> : <Ionicons name="camera-outline" size={42} color={palette.red} />}
            </TouchableOpacity>
            <View style={styles.profileHeroInfo}>
              <View style={styles.profileNameRow}>
                <Text style={styles.profileName}>{session.fullName}</Text>
                <View style={styles.verifiedRow}>
                  <Ionicons name={session.status === 'aprobado' ? 'checkmark-circle' : 'time-outline'} size={22} color={session.status === 'aprobado' ? palette.green : palette.gold} />
                  <Text style={styles.verifiedText}>{statusLabel(session.status)}</Text>
                </View>
              </View>
              {session.email ? <Text style={styles.cardText}>{session.email}</Text> : null}
              <Text style={styles.cardText}>{roleLabel(session.role)}</Text>
              <TouchableOpacity style={styles.photoChangeButton} onPress={uploadProfilePhoto}>
                <Ionicons name="camera-outline" size={16} color={palette.red} />
                <Text style={styles.photoChangeText}>{session.avatarUrl ? 'Cambiar foto de perfil' : 'Subir foto de perfil'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          {session.avatarUrl ? (
            <Modal visible={showProfilePhoto} transparent animationType="fade" onRequestClose={() => setShowProfilePhoto(false)}>
              <View style={styles.photoModalBackdrop}>
                <TouchableOpacity style={styles.photoModalClose} onPress={() => setShowProfilePhoto(false)}>
                  <Ionicons name="close" size={22} color={palette.white} />
                </TouchableOpacity>
                <Image source={{ uri: session.avatarUrl }} style={styles.photoModalImage} />
              </View>
            </Modal>
          ) : null}
          <View style={styles.profileMetaGrid}>
            {[
              { label: 'Provincia', value: session.province, icon: 'map-outline' },
              { label: 'Rango', value: roleLabel(session.role), icon: 'ribbon-outline' },
              { label: 'Contacto', value: session.contact, icon: 'chatbubble-ellipses-outline' },
              { label: 'Comunidad', value: session.communityOfOrigin, icon: 'people-outline' },
              { label: 'Estado', value: statusLabel(session.status), icon: 'checkmark-circle-outline' }
            ].map((item) => (
              <View key={item.label} style={styles.profileMetaItem}>
                <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={17} color={palette.red} />
                <View style={styles.profileMetaText}>
                  <Text style={styles.profileMetaLabel}>{item.label}</Text>
                  <Text style={styles.profileMetaValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
          {roleInfo ? <Text style={styles.cardText}>{roleInfo.description}</Text> : null}
          {profilePanel === 'editar' ? <View style={styles.profileCommunityPanel}>
            <Text style={styles.cardEyebrow}>Editar perfil</Text>
            <Text style={styles.cardText}>Por seguridad, los datos de perfil solo pueden cambiarse una vez cada 5 dias.</Text>
            <TextInput style={styles.input} placeholder="Nombre y apellido" value={editFullName} onChangeText={setEditFullName} />
            <TextInput style={styles.input} placeholder="Contacto" value={editContact} onChangeText={setEditContact} />
            <Text style={styles.cardEyebrow}>Provincia</Text>
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setEditProvinceDropdownOpen(!editProvinceDropdownOpen)}>
              <Text style={styles.dropdownButtonText}>{editProvince || 'Seleccionar provincia'}</Text>
              <Ionicons name={editProvinceDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
            </TouchableOpacity>
            {editProvinceDropdownOpen ? (
              <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                {registrationCommunities.map((item) => (
                  <TouchableOpacity
                    key={item.province}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setEditProvince(item.province);
                      setEditCommunity('');
                      setEditProvinceDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{item.province}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}
            {selectedEditProvince ? (
              <>
                <Text style={styles.cardEyebrow}>Comunidad de origen</Text>
                <TouchableOpacity style={styles.dropdownButton} onPress={() => setEditCommunityDropdownOpen(!editCommunityDropdownOpen)}>
                  <Text style={styles.dropdownButtonText}>{editCommunity || 'Seleccionar comunidad'}</Text>
                  <Ionicons name={editCommunityDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                </TouchableOpacity>
                {editCommunityDropdownOpen ? (
                  <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                    {selectedEditProvince.locations.map((item) => (
                      <TouchableOpacity key={item.name} style={styles.dropdownItem} onPress={() => { setEditCommunity(item.name); setEditCommunityDropdownOpen(false); }}>
                        <Text style={styles.dropdownItemText}>{item.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : null}
              </>
            ) : null}
            <TouchableOpacity style={styles.primaryButton} onPress={saveProfile}>
              <Text style={styles.primaryButtonText}>Guardar perfil</Text>
            </TouchableOpacity>
            {authMessage ? <Text style={styles.cardText}>{authMessage}</Text> : null}
          </View> : null}
          {profilePanel === 'configuracion' ? (
            <View style={styles.profileCommunityPanel}>
              <Text style={styles.cardEyebrow}>Configuracion de usuario</Text>
              <View style={styles.settingRow}>
                <View style={styles.settingRowText}>
                  <Text style={styles.cardTitle}>Mostrar puntero tactil</Text>
                  <Text style={styles.cardText}>Ayuda visual para testing: muestra un circulo que sigue tu dedo mientras tocas la pantalla.</Text>
                </View>
                <Switch
                  value={touchPointerEnabled}
                  onValueChange={onTouchPointerEnabledChange}
                  trackColor={{ false: 'rgba(94, 131, 150, 0.22)', true: 'rgba(45, 141, 200, 0.36)' }}
                  thumbColor={touchPointerEnabled ? palette.red : palette.white}
                />
              </View>
              <Text style={styles.cardText}>Esta opcion queda guardada en este dispositivo y por defecto permanece apagada.</Text>
            </View>
          ) : null}
          {showCommunity ? (
            <View style={styles.profileCommunityPanel}>
              <Text style={styles.cardEyebrow}>{session.communityOfOrigin}</Text>
              <Text style={styles.cardText}>
                Relacion activa: {roleLabel(session.role)} vinculado a {session.communityOfOrigin} en {session.province}.
                {['animador_comunidad', 'coordinador_comunidad'].includes(session.role) ? ' Este rango puede editar su comunidad asignada.' : ''}
                {['vocal', 'asesor', 'coordinador_diocesano'].includes(session.role) ? ' Este rango supervisa animadores y coordinadores de comunidad de su provincia.' : ''}
                {['vocal_nacional', 'coordinador_nacional'].includes(session.role) ? ' Este rango supervisa estructura nacional y provincias.' : ''}
              </Text>
              {hasPermission(session, 'ver_noticias_comunidad') ? (
                profileNews.length > 0 ? profileNews.map((item, index) => (
                  <View key={`${item.title}-${index}`} style={styles.innerNewsCard}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardText}>{item.body}</Text>
                  </View>
                )) : <Text style={styles.cardText}>Todavia no hay noticias cargadas para esta comunidad.</Text>
              ) : (
                <Text style={styles.cardText}>Tu rango actual no permite ver noticias internas de comunidad.</Text>
              )}
              <SectionTitle title="Publicado por mi comunidad" />
              {myCommunityPublications.length === 0 ? <Text style={styles.cardText}>Todavia no hay publicaciones de tu animador o coordinador.</Text> : null}
              {myCommunityPublications.map((item, index) => {
                const results = Object.entries(item.pollResults ?? {}).sort((a, b) => Number(b[1]) - Number(a[1]));
                return (
                  <View key={`${item.id ?? item.title}-${index}`} style={styles.innerNewsCard}>
                    <Text style={styles.cardEyebrow}>{item.kind} - {item.visibility}</Text>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardText}>{item.body}</Text>
                    {item.kind === 'encuesta' ? (
                      <View style={styles.profileCommunityPanel}>
                        <Text style={styles.cardEyebrow}>Opciones</Text>
                        {(item.pollOptions ?? []).map((option: string) => (
                          <TouchableOpacity key={option} style={[styles.filterChip, localPollVotes[item.id ?? ''] === option && styles.filterChipActive]} onPress={() => votePoll(item, option)}>
                            <Text style={[styles.filterChipText, localPollVotes[item.id ?? ''] === option && styles.filterChipTextActive]}>{option}</Text>
                          </TouchableOpacity>
                        ))}
                        <Text style={styles.cardEyebrow}>Resultados</Text>
                        {results.length === 0 ? <Text style={styles.cardText}>Todavia no hay votos registrados.</Text> : results.map(([option, total]) => (
                          <Text key={option} style={styles.cardText}>{option}: {String(total)} voto/s</Text>
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : null}
          {isCommunityLeader && showCommunityManagement ? (
            <View style={styles.profileCommunityPanel}>
              <Text style={styles.cardEyebrow}>Comunidad</Text>
              <Text style={styles.cardTitle}>{session.communityOfOrigin}</Text>
              <Text style={styles.cardText}>Panel de {roleLabel(session.role)}. Esta comunidad es asignada por el Vocal Diocesano; no puede cambiarse desde este perfil.</Text>
              <SectionTitle title="Publicar en comunidad" />
              <View style={styles.filterRow}>
                {(['aviso', 'noticia', 'fecha', 'encuesta'] as const).map((kind) => (
                  <TouchableOpacity key={kind} style={[styles.filterChip, communityPostKind === kind && styles.filterChipActive]} onPress={() => setCommunityPostKind(kind)}>
                    <Text style={[styles.filterChipText, communityPostKind === kind && styles.filterChipTextActive]}>{kind}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {session.role === 'coordinador_comunidad' ? (
                <>
                  <Text style={styles.cardEyebrow}>Visibilidad</Text>
                  <View style={styles.filterRow}>
                    {[
                      { key: 'publica', label: 'Invitados/Palestristas/Sedis' },
                      { key: 'sedimentadores', label: 'Solo sedimentadores' }
                    ].map((item) => (
                      <TouchableOpacity key={item.key} style={[styles.filterChip, communityPostVisibility === item.key && styles.filterChipActive]} onPress={() => setCommunityPostVisibility(item.key as typeof communityPostVisibility)}>
                        <Text style={[styles.filterChipText, communityPostVisibility === item.key && styles.filterChipTextActive]}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                <Text style={styles.cardText}>Las publicaciones del animador se muestran publicamente.</Text>
              )}
              <TextInput style={styles.input} placeholder="Titulo" value={communityPostTitle} onChangeText={setCommunityPostTitle} />
              {communityPostKind === 'fecha' ? <TextInput style={styles.input} placeholder="Fecha: 2026-05-28" value={communityPostDate} onChangeText={setCommunityPostDate} /> : null}
              <TextInput style={[styles.input, styles.textArea]} placeholder={communityPostKind === 'encuesta' ? 'Pregunta y opciones de la encuesta' : 'Texto de la publicacion'} value={communityPostBody} onChangeText={setCommunityPostBody} multiline />
              {communityPostKind === 'encuesta' ? (
                <TextInput style={[styles.input, styles.textArea]} placeholder="Opciones, una por linea" value={communityPollOptions} onChangeText={setCommunityPollOptions} multiline />
              ) : null}
              <TouchableOpacity style={styles.primaryButton} onPress={publishCommunityPost}>
                <Text style={styles.primaryButtonText}>Publicar</Text>
              </TouchableOpacity>
              <SectionTitle title="Cambio de dirigencia" />
              <Text style={styles.cardText}>Solicitud privada para proponer sucesor al finalizar el periodo de servicio.</Text>
              <TouchableOpacity style={styles.dropdownButton} onPress={() => setLeadershipRoleDropdownOpen(!leadershipRoleDropdownOpen)}>
                <Text style={styles.dropdownButtonText}>{roleLabel(leadershipRole)}</Text>
                <Ionicons name={leadershipRoleDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
              </TouchableOpacity>
              {leadershipRoleDropdownOpen ? (
                <View style={styles.dropdownList}>
                  {(['animador_comunidad', 'coordinador_comunidad'] as Role[]).map((role) => (
                    <TouchableOpacity key={role} style={styles.dropdownItem} onPress={() => { setLeadershipRole(role); setLeadershipRoleDropdownOpen(false); }}>
                      <Text style={styles.dropdownItemText}>{roleLabel(role)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
              <TouchableOpacity style={styles.dropdownButton} onPress={async () => { if (communityMembers.length === 0) setCommunityMembers(await fetchMyCommunityMembers()); setSuccessorDropdownOpen(!successorDropdownOpen); }}>
                <Text style={styles.dropdownButtonText}>{selectableCommunityMembers.find((member) => member.id === successorUserId)?.full_name ?? 'Seleccionar sucesor de mi comunidad'}</Text>
                <Ionicons name={successorDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
              </TouchableOpacity>
              {successorDropdownOpen ? (
                <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                  {selectableCommunityMembers.length === 0 ? <Text style={styles.cardText}>No hay miembros cargados para esta comunidad.</Text> : null}
                  {selectableCommunityMembers.map((member) => (
                    <TouchableOpacity key={member.id} style={styles.dropdownItem} onPress={() => { setSuccessorUserId(member.id); setSuccessorDropdownOpen(false); }}>
                      <Text style={styles.dropdownItemText}>{member.full_name ?? member.email}</Text>
                      <Text style={styles.cardText}>{roleLabel((member.role || 'palestrista') as Role)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : null}
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Mensaje para el Vocal Diocesano"
                value={userRequestText}
                onChangeText={(value) => setUserRequestText(value.slice(0, 500))}
                multiline
              />
              <Text style={styles.cardText}>{userRequestText.length}/500</Text>
              <TouchableOpacity style={styles.secondaryButton} onPress={submitLeadershipChangeRequest}>
                <Text style={styles.secondaryButtonText}>Enviar cambio de dirigencia</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <View style={styles.profileCommunityPanel}>
            <Text style={styles.cardEyebrow}>Credencial digital</Text>
            <Text style={styles.cardText}>{session.fullName} - {roleLabel(session.role)}</Text>
            <Text style={styles.cardText}>{session.province} / {session.communityOfOrigin}</Text>
          </View>
          {session.role !== 'administrador' ? <SectionTitle title="Solicitudes" /> : null}
          {session.role !== 'administrador' ? demoRequests.map((item, index) => (
            <View key={`${item}-${index}`}>
              <TouchableOpacity style={styles.innerNewsCard} onPress={() => setSelectedRequest(selectedRequest === item ? null : item)}>
                <Text style={styles.cardTitle}>{item}</Text>
                <Text style={styles.expandHint}>{selectedRequest === item ? 'Cerrar solicitud' : 'Abrir solicitud'}</Text>
              </TouchableOpacity>
              {selectedRequest === item ? (
                <View style={styles.profileCommunityPanel}>
                  <Text style={styles.cardEyebrow}>Solicitud</Text>
                  <Text style={styles.cardTitle}>{item}</Text>
                  <Text style={styles.cardText}>Escribi el motivo de la solicitud. Maximo 500 caracteres.</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Detalle de la solicitud"
                    value={userRequestText}
                    onChangeText={(value) => setUserRequestText(value.slice(0, 500))}
                    multiline
                  />
                  <Text style={styles.cardText}>{userRequestText.length}/500</Text>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => submitUserRequest(item)}>
                    <Text style={styles.primaryButtonText}>Enviar solicitud</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          )) : null}
          {session.role !== 'administrador' ? (
            <View style={styles.profileCommunityPanel}>
              <Text style={styles.cardEyebrow}>Solicitudes enviadas</Text>
              {sentRequests.length === 0 ? <Text style={styles.cardText}>Todavia no enviaste solicitudes.</Text> : null}
              {sentRequests.map((item) => (
                <View key={item.id}>
                  <TouchableOpacity style={styles.innerNewsCard} onPress={() => setSelectedSentRequestId(selectedSentRequestId === item.id ? '' : item.id)}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardText}>Estado: {item.status}</Text>
                    <Text style={styles.expandHint}>{selectedSentRequestId === item.id ? 'Ocultar detalle' : 'Ver detalle'}</Text>
                  </TouchableOpacity>
                  {selectedSentRequestId === item.id ? (
                    <View style={styles.profileCommunityPanel}>
                      <Text style={styles.cardText}>Enviada: {new Date(item.createdAt).toLocaleString('es-AR')}</Text>
                      <Text style={styles.cardText}>Detalle: {item.definition}</Text>
                      <Text style={styles.cardText}>Respondio: {item.resolvedBy ?? 'Pendiente'}</Text>
                      <Text style={styles.cardText}>Fecha de resolucion: {item.resolvedAt ? new Date(item.resolvedAt).toLocaleString('es-AR') : 'Pendiente'}</Text>
                      <Text style={styles.cardText}>Mensaje: {item.message ?? 'Sin mensaje todavia'}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
          <SectionTitle title="Mensajes" />
          {internalMessages.map((item, index) => (
            <View key={`${item.title}-${index}`} style={styles.innerNewsCard}>
              <Text style={styles.cardEyebrow}>{item.from}</Text>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardText}>{item.body}</Text>
            </View>
          ))}
          {(hasPermission(session, 'gestionar_comunidad') || hasPermission(session, 'gestionar_contenido') || hasPermission(session, 'gestionar_permisos')) ? (
            <View style={styles.profileCommunityPanel}>
              <Text style={styles.cardEyebrow}>Gestionar</Text>
              <Text style={styles.cardText}>Publicar noticia, editar horarios, cargar fechas especiales y enviar mensajes.</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={loadPendingProfiles}>
                <Text style={styles.primaryButtonText}>Cargar usuarios pendientes</Text>
              </TouchableOpacity>
              {realPendingProfiles.map((user) => (
                <View key={user.id} style={styles.innerNewsCard}>
                  <Text style={styles.cardTitle}>{user.full_name}</Text>
                  <Text style={styles.cardText}>Rol actual: {user.role}</Text>
                  <Text style={styles.cardText}>Comunidad: {user.community_name ?? 'Sin comunidad'}</Text>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => approvePendingProfile(user.id, 'palestrista')}>
                    <Text style={styles.secondaryButtonText}>Aprobar como Palestrista</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {pendingUsers.map((user, index) => (
                <Text key={`${user.name}-${index}`} style={styles.cardText}>{user.name}: {user.requestedRole} - {user.status}</Text>
              ))}
              {auditLog.map((item, index) => <Text key={`${item}-${index}`} style={styles.cardText}>- {item}</Text>)}
            </View>
          ) : null}
          {(hasPermission(session, 'gestionar_sistema') || canReviewLeadershipRequests) ? (
            <View style={styles.adminPanel}>
              <Text style={styles.cardEyebrow}>{session.role === 'administrador' ? 'Administrador' : 'Dirigencia'}</Text>
              <Text style={styles.cardTitle}>{session.role === 'administrador' ? 'Panel tecnico global' : 'Panel diocesano'}</Text>
              <Text style={styles.cardText}>{session.role === 'administrador' ? 'Gestionar roles, permisos, pestanas, secciones, comunidades, provincias, usuarios, contenido y configuracion general.' : 'Revisar solicitudes y gestionar cambios de dirigencia dentro de la provincia.'}</Text>
              {authMessage ? <Text style={styles.adminMessage}>{authMessage}</Text> : null}
              {adminConfigDraft.settings.maintenanceMode ? (
                <View style={styles.adminStatusPill}>
                  <Ionicons name="warning-outline" size={17} color={palette.gold} />
                  <Text style={styles.adminStatusText}>Modo mantenimiento activo</Text>
                </View>
              ) : null}
              <View style={styles.adminModuleGrid}>
                {enabledAdminModules.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.adminModuleButton, adminModule === item.key && styles.adminModuleButtonActive]}
                    onPress={() => setAdminModule(item.key as AdminModule)}
                  >
                    <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color={adminModule === item.key ? palette.white : palette.red} />
                    <Text style={[styles.adminModuleText, adminModule === item.key && styles.adminModuleTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {adminModule === 'resumen' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Admin Dashboard</Text>
                  <Text style={styles.cardText}>Consola base para controlar contenido, usuarios, comunidades, identidad y configuracion general de la app.</Text>
                  <View style={styles.adminStatRow}>
                    {adminDraftSummary.map((item) => (
                      <TouchableOpacity key={item.label} style={styles.adminStat} activeOpacity={0.84}>
                        <Ionicons name={item.icon} size={18} color={palette.red} />
                        <Text style={styles.adminStatNumber}>{item.value}</Text>
                        <Text style={styles.adminStatLabel}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.cardEyebrow}>Accesos rapidos</Text>
                  <View style={styles.adminQuickGrid}>
                    {[
                      { label: 'Nueva noticia', module: 'noticias', icon: 'add-circle-outline' },
                      { label: 'Subir material', module: 'descargas', icon: 'cloud-upload-outline' },
                      { label: 'Crear comunidad', module: 'comunidades', icon: 'location-outline' },
                      { label: 'Revisar usuarios', module: 'usuarios', icon: 'people-outline' }
                    ].map((item) => (
                      <TouchableOpacity key={item.label} style={styles.adminQuickAction} onPress={() => setAdminModule(item.module as AdminModule)}>
                        <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color={palette.red} />
                        <Text style={styles.adminQuickText}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.cardEyebrow}>Arquitectura editable</Text>
                  <Text style={styles.cardText}>Identidad, home, contacto, periodo motivador y configuracion ya estan centralizados en un objeto de configuracion local. Noticias, usuarios, pestañas, contenido y comunidades siguen usando las funciones reales existentes.</Text>
                </View>
              ) : null}

              {adminModule === 'identidad' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Identidad de la app</Text>
                  <Text style={styles.cardText}>Base editable para nombre, subtitulo, logo, portada y colores principales.</Text>
                  <TextInput style={styles.input} placeholder="Nombre de la app" value={adminConfigDraft.identity.appName} onChangeText={(value) => updateAdminConfigSection('identity', { appName: value })} />
                  <TextInput style={styles.input} placeholder="Subtitulo" value={adminConfigDraft.identity.subtitle} onChangeText={(value) => updateAdminConfigSection('identity', { subtitle: value })} />
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Descripcion institucional" value={adminConfigDraft.identity.description} onChangeText={(value) => updateAdminConfigSection('identity', { description: value })} multiline />
                  <TextInput style={styles.input} placeholder="URL del logo" value={adminConfigDraft.identity.logoUrl} onChangeText={(value) => updateAdminConfigSection('identity', { logoUrl: value })} />
                  <TextInput style={styles.input} placeholder="URL de imagen hero/portada" value={adminConfigDraft.identity.heroImageUrl} onChangeText={(value) => updateAdminConfigSection('identity', { heroImageUrl: value })} />
                  <View style={styles.inlineActions}>
                    <TextInput style={[styles.input, styles.colorInput]} placeholder="#2d8dc8" value={adminConfigDraft.identity.primaryColor} onChangeText={(value) => updateAdminConfigSection('identity', { primaryColor: value })} />
                    <TextInput style={[styles.input, styles.colorInput]} placeholder="#5da7db" value={adminConfigDraft.identity.secondaryColor} onChangeText={(value) => updateAdminConfigSection('identity', { secondaryColor: value })} />
                  </View>
                  <View style={styles.adminPreviewPane}>
                    <Text style={styles.cardEyebrow}>Previsualizacion</Text>
                    <Text style={styles.cardTitle}>{adminConfigDraft.identity.appName}</Text>
                    <Text style={styles.cardText}>{adminConfigDraft.identity.subtitle}</Text>
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => saveAdminConfigDraft('Identidad')}>
                    <Text style={styles.primaryButtonText}>Guardar identidad</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {adminModule === 'home' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Home</Text>
                  <Text style={styles.cardText}>Control visual del dashboard inicial, accesos rapidos y secciones visibles.</Text>
                  <TextInput style={styles.input} placeholder="Titulo principal" value={adminConfigDraft.home.heroTitle} onChangeText={(value) => updateAdminConfigSection('home', { heroTitle: value })} />
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Texto principal" value={adminConfigDraft.home.heroText} onChangeText={(value) => updateAdminConfigSection('home', { heroText: value })} multiline />
                  <TextInput style={styles.input} placeholder="Banner destacado" value={adminConfigDraft.home.featuredBanner} onChangeText={(value) => updateAdminConfigSection('home', { featuredBanner: value })} />
                  <Text style={styles.cardEyebrow}>Modulos visibles</Text>
                  <View style={styles.filterRow}>
                    {['noticias', 'comunidades', 'materiales', 'perfil', 'agenda', 'actividad'].map((item, index) => (
                      <TouchableOpacity key={`${item}-${index}`} style={[styles.filterChip, adminConfigDraft.home.visibleModules.includes(item) && styles.filterChipActive]} onPress={() => toggleAdminConfigList('home', item)}>
                        <Text style={[styles.filterChipText, adminConfigDraft.home.visibleModules.includes(item) && styles.filterChipTextActive]}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => saveAdminConfigDraft('Home')}>
                    <Text style={styles.primaryButtonText}>Guardar Home</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {adminModule === 'descargas' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Descargas y materiales</Text>
                  <Text style={styles.cardText}>Biblioteca editable persistida en Supabase. Se puede guardar URL o ruta de archivo y definir visibilidad por rol.</Text>
                  <TouchableOpacity style={styles.secondaryButton} onPress={loadAdminMaterials}>
                    <Text style={styles.secondaryButtonText}>Cargar materiales</Text>
                  </TouchableOpacity>
                  <Text style={styles.cardEyebrow}>Materiales actuales</Text>
                  {(adminMaterials.length > 0 ? adminMaterials : materials.map((material, index) => ({
                    id: `fallback-${index}`,
                    title: material.title,
                    description: material.description,
                    category: material.type,
                    visibility: material.permission ? 'interno' : 'publico',
                    required_permission: material.permission,
                    file_url: null,
                    file_path: null,
                    sort_order: index,
                    archived_at: null,
                    created_at: null
                  } as AppMaterialRecord))).map((material) => (
                    <View key={material.id} style={styles.adminListRow}>
                      <Ionicons name="document-text-outline" size={19} color={palette.red} />
                      <View style={styles.adminUserHeaderText}>
                        <Text style={styles.cardTitle}>{material.title}</Text>
                        <Text style={styles.cardText}>{material.category ?? 'General'} - {material.visibility ?? 'interno'}{material.required_permission ? ` - ${material.required_permission}` : ''}</Text>
                      </View>
                      {!material.id.startsWith('fallback-') ? (
                        <TouchableOpacity onPress={() => adminArchiveMaterial(material.id)}>
                          <Text style={styles.adminStateDraft}>Archivar</Text>
                        </TouchableOpacity>
                      ) : <Text style={styles.adminStateDraft}>Base</Text>}
                    </View>
                  ))}
                  <Text style={styles.cardEyebrow}>Nuevo material</Text>
                  <TextInput style={styles.input} placeholder="Nombre del archivo" value={materialTitle} onChangeText={setMaterialTitle} />
                  <TextInput style={styles.input} placeholder="Categoria" value={materialCategory} onChangeText={setMaterialCategory} />
                  <TextInput style={styles.input} placeholder="URL del archivo o PDF" value={materialFileUrl} onChangeText={setMaterialFileUrl} />
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Descripcion" value={materialDescription} onChangeText={setMaterialDescription} multiline />
                  <View style={styles.filterRow}>
                    {['publico', 'interno', 'reservado', 'administrador'].map((item, index) => (
                      <TouchableOpacity key={`${item}-${index}`} style={[styles.filterChip, materialVisibility === item && styles.filterChipActive]} onPress={() => setMaterialVisibility(item)}>
                        <Text style={[styles.filterChipText, materialVisibility === item && styles.filterChipTextActive]}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput style={styles.input} placeholder="Permiso requerido opcional. Ej: ver_materiales_internos" value={materialPermission} onChangeText={setMaterialPermission} />
                  <TouchableOpacity style={styles.primaryButton} onPress={adminSaveMaterial}>
                    <Text style={styles.primaryButtonText}>Guardar material</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {adminModule === 'historia_admin' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Nuestra Historia</Text>
                  <Text style={styles.cardText}>Gestion de capitulos, preguntas frecuentes y textos institucionales desde el editor centralizado.</Text>
                  <View style={styles.adminListRow}>
                    <Ionicons name="book-outline" size={19} color={palette.red} />
                    <View style={styles.adminUserHeaderText}>
                      <Text style={styles.cardTitle}>{movementHistory.length} capitulos actuales</Text>
                      <Text style={styles.cardText}>Migracion progresiva al editor de bloques.</Text>
                    </View>
                  </View>
                  <View style={styles.adminListRow}>
                    <Ionicons name="help-circle-outline" size={19} color={palette.red} />
                    <View style={styles.adminUserHeaderText}>
                      <Text style={styles.cardTitle}>{faqItems.length} preguntas frecuentes</Text>
                      <Text style={styles.cardText}>Editable desde Contenido General por ahora.</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => { setSelectedContentTab('historia'); setAdminModule('contenido_general'); }}>
                    <Text style={styles.primaryButtonText}>Abrir editor de Historia</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {adminModule === 'contacto_admin' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Contacto oficial</Text>
                  <Text style={styles.cardText}>Datos y textos institucionales que luego se persistiran como configuracion global.</Text>
                  <TextInput style={styles.input} placeholder="Mail oficial" value={adminConfigDraft.contact.email} onChangeText={(value) => updateAdminConfigSection('contact', { email: value })} />
                  <TextInput style={styles.input} placeholder="Telefono" value={adminConfigDraft.contact.phone} onChangeText={(value) => updateAdminConfigSection('contact', { phone: value })} />
                  <TextInput style={styles.input} placeholder="Instagram" value={adminConfigDraft.contact.instagram} onChangeText={(value) => updateAdminConfigSection('contact', { instagram: value })} />
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Texto de ayuda" value={adminConfigDraft.contact.helpText} onChangeText={(value) => updateAdminConfigSection('contact', { helpText: value })} multiline />
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Texto de donaciones" value={adminConfigDraft.contact.donationText} onChangeText={(value) => updateAdminConfigSection('contact', { donationText: value })} multiline />
                  <TouchableOpacity style={styles.primaryButton} onPress={() => saveAdminConfigDraft('Contacto')}>
                    <Text style={styles.primaryButtonText}>Guardar contacto</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {adminModule === 'periodo_motivador' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Periodo Motivador</Text>
                  <Text style={styles.cardText}>Seccion preparada para activar/desactivar, editar portada, titulo, textos y materiales asociados.</Text>
                  <View style={styles.filterRow}>
                    <TouchableOpacity style={[styles.filterChip, adminConfigDraft.periodoMotivador.active && styles.filterChipActive]} onPress={() => updateAdminConfigSection('periodoMotivador', { active: !adminConfigDraft.periodoMotivador.active })}>
                      <Text style={[styles.filterChipText, adminConfigDraft.periodoMotivador.active && styles.filterChipTextActive]}>{adminConfigDraft.periodoMotivador.active ? 'Activo' : 'Inactivo'}</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput style={styles.input} placeholder="Titulo" value={adminConfigDraft.periodoMotivador.title} onChangeText={(value) => updateAdminConfigSection('periodoMotivador', { title: value })} />
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Contenido" value={adminConfigDraft.periodoMotivador.body} onChangeText={(value) => updateAdminConfigSection('periodoMotivador', { body: value })} multiline />
                  <TextInput style={styles.input} placeholder="URL de imagen principal" value={adminConfigDraft.periodoMotivador.imageUrl} onChangeText={(value) => updateAdminConfigSection('periodoMotivador', { imageUrl: value })} />
                  <TouchableOpacity style={styles.primaryButton} onPress={() => saveAdminConfigDraft('Periodo Motivador')}>
                    <Text style={styles.primaryButtonText}>Guardar periodo</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {adminModule === 'configuracion' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Configuracion general</Text>
                  <Text style={styles.cardText}>Base para mantenimiento, aviso global, permisos, modulos activos, foro y chat.</Text>
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Mensaje global" value={adminConfigDraft.settings.globalMessage} onChangeText={(value) => updateAdminConfigSection('settings', { globalMessage: value })} multiline />
                  {[
                    { key: 'maintenanceMode', label: 'Modo mantenimiento' },
                    { key: 'futureForumEnabled', label: 'Preparar foro' },
                    { key: 'futureChatEnabled', label: 'Preparar chat' }
                  ].map((item) => {
                    const key = item.key as keyof AppAdminConfig['settings'];
                    const active = Boolean(adminConfigDraft.settings[key]);
                    return (
                      <TouchableOpacity key={item.key} style={[styles.adminListRow, active && styles.adminListRowActive]} onPress={() => updateAdminConfigSection('settings', { [key]: !active } as Partial<AppAdminConfig['settings']>)}>
                        <Ionicons name={active ? 'toggle' : 'toggle-outline'} size={24} color={active ? palette.red : palette.inkMuted} />
                        <Text style={styles.adminQuickText}>{item.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  <Text style={styles.cardEyebrow}>Orden de navegacion</Text>
                  <Text style={styles.cardText}>El orden y visibilidad se administran desde Contenido.</Text>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => saveAdminConfigDraft('Configuracion general')}>
                    <Text style={styles.primaryButtonText}>Guardar configuracion</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {adminModule === 'usuarios' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Usuarios registrados</Text>
                  <TextInput style={styles.input} placeholder="Buscar por nombre, mail, provincia, comunidad o rol" value={adminUserSearch} onChangeText={setAdminUserSearch} />
                  <TouchableOpacity style={styles.primaryButton} onPress={loadAdminUsers}>
                    <Text style={styles.primaryButtonText}>Cargar todos los usuarios</Text>
                  </TouchableOpacity>
                  {adminUsers.length === 0 ? <Text style={styles.cardText}>No hay usuarios cargados.</Text> : null}
                  {userProvinceOptions.length > 0 ? (
                    <>
                      <Text style={styles.cardEyebrow}>Provincia</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                        {userProvinceOptions.map((province) => (
                          <TouchableOpacity key={province} style={[styles.filterChip, selectedUsersProvince === province && styles.filterChipActive]} onPress={() => { setSelectedUsersProvince(province); setSelectedAdminUserId(''); }}>
                            <Text style={[styles.filterChipText, selectedUsersProvince === province && styles.filterChipTextActive]}>{province}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  ) : null}
                  {selectedUsersProvince ? (
                    <View style={styles.profileCommunityPanel}>
                      <Text style={styles.cardEyebrow}>{selectedUsersProvince}</Text>
                      {visibleAdminUsers.length === 0 ? <Text style={styles.cardText}>No hay usuarios para esta provincia.</Text> : null}
                      {visibleAdminUsers.map((user) => {
                        const selected = selectedAdminUserId === user.id;
                        return (
                          <View key={user.id}>
                            <TouchableOpacity style={styles.innerNewsCard} onPress={() => setSelectedAdminUserId(selected ? '' : user.id)}>
                              <View style={styles.adminUserHeader}>
                                <View style={styles.adminUserAvatar}>
                                  {user.avatar_url ? <Image source={{ uri: user.avatar_url }} style={styles.adminUserAvatarImage} /> : <Ionicons name="person-outline" size={20} color={palette.red} />}
                                </View>
                                <View style={styles.adminUserHeaderText}>
                                  <Text style={styles.cardTitle}>{user.full_name ?? user.email ?? 'Usuario sin nombre'}</Text>
                                  <Text style={styles.cardText}>{user.email ?? 'Sin email'} - {user.status} - {user.role}</Text>
                                </View>
                              </View>
                              <Text style={styles.cardText}>Email: {user.email_confirmed_at ? 'confirmado' : 'sin confirmar'}</Text>
                              <Text style={styles.expandHint}>{selected ? 'Cerrar edicion' : 'Editar usuario'}</Text>
                            </TouchableOpacity>
                            {selected ? (
                              <View style={styles.adminInlineEditor}>
                                <TextInput style={styles.input} placeholder="Nombre y apellido" value={adminUserFullName} onChangeText={setAdminUserFullName} />
                                <TextInput style={styles.input} placeholder="Email" value={adminUserEmail} onChangeText={setAdminUserEmail} autoCapitalize="none" />
                                <TextInput style={styles.input} placeholder="Nueva contrasena opcional" value={adminUserPassword} onChangeText={setAdminUserPassword} secureTextEntry />
                                <TextInput style={styles.input} placeholder="Contacto" value={adminUserPhone} onChangeText={setAdminUserPhone} />
                                <Text style={styles.cardEyebrow}>Provincia</Text>
                                <TouchableOpacity style={styles.dropdownButton} onPress={() => setAdminUserProvinceDropdownOpen(!adminUserProvinceDropdownOpen)}>
                                  <Text style={styles.dropdownButtonText}>{adminUserProvince || 'Seleccionar provincia'}</Text>
                                  <Ionicons name={adminUserProvinceDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                                </TouchableOpacity>
                                {adminUserProvinceDropdownOpen ? (
                                  <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                                    {visibleRegistrationCommunities.map((item) => (
                                      <TouchableOpacity key={item.province} style={styles.dropdownItem} onPress={() => { setAdminUserProvince(item.province); setAdminUserCommunity(''); setAdminUserProvinceDropdownOpen(false); }}>
                                        <Text style={styles.dropdownItemText}>{item.province}</Text>
                                      </TouchableOpacity>
                                    ))}
                                  </ScrollView>
                                ) : null}
                                {selectedAdminUserProvince ? (
                                  <>
                                    <Text style={styles.cardEyebrow}>Comunidad</Text>
                                    <TouchableOpacity style={styles.dropdownButton} onPress={() => setAdminUserCommunityDropdownOpen(!adminUserCommunityDropdownOpen)}>
                                      <Text style={styles.dropdownButtonText}>{adminUserCommunity || 'Seleccionar comunidad'}</Text>
                                      <Ionicons name={adminUserCommunityDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                                    </TouchableOpacity>
                                    {adminUserCommunityDropdownOpen ? (
                                      <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                                        {selectedAdminUserProvince.locations.map((item) => (
                                          <TouchableOpacity key={item.id ?? item.name} style={styles.dropdownItem} onPress={() => { setAdminUserCommunity(item.name); setAdminUserCommunityDropdownOpen(false); }}>
                                            <Text style={styles.dropdownItemText}>{item.name}</Text>
                                          </TouchableOpacity>
                                        ))}
                                      </ScrollView>
                                    ) : null}
                                  </>
                                ) : null}
                                <Text style={styles.cardEyebrow}>Estado</Text>
                                <View style={styles.filterRow}>
                                  {['pendiente', 'aprobado', 'bloqueado'].map((status) => (
                                    <TouchableOpacity key={status} style={[styles.filterChip, adminUserStatus === status && styles.filterChipActive]} onPress={() => setAdminUserStatus(status)}>
                                      <Text style={[styles.filterChipText, adminUserStatus === status && styles.filterChipTextActive]}>{status}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                                <Text style={styles.cardEyebrow}>Rol</Text>
                                <TouchableOpacity style={styles.dropdownButton} onPress={() => setAdminUserRoleDropdownOpen(!adminUserRoleDropdownOpen)}>
                                  <Text style={styles.dropdownButtonText}>{roleLabel(adminUserRole)}</Text>
                                  <Ionicons name={adminUserRoleDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                                </TouchableOpacity>
                                {adminUserRoleDropdownOpen ? (
                                  <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                                    {roleDefinitions.filter((role) => role.role === selectedAdminUser?.role || assignableRoles.some((item) => item.role === role.role)).map((role) => (
                                      <TouchableOpacity key={role.role} style={styles.dropdownItem} onPress={() => { setAdminUserRole(role.role as Role); setAdminUserRoleDropdownOpen(false); }}>
                                        <Text style={styles.dropdownItemText}>{role.label}</Text>
                                      </TouchableOpacity>
                                    ))}
                                  </ScrollView>
                                ) : null}
                                <TouchableOpacity style={styles.primaryButton} onPress={saveAdminUser}>
                                  <Text style={styles.primaryButtonText}>Guardar usuario</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.secondaryButton} onPress={confirmSelectedUserEmail}>
                                  <Text style={styles.secondaryButtonText}>Confirmar email</Text>
                                </TouchableOpacity>
                              </View>
                            ) : null}
                          </View>
                        );
                      })}
                    </View>
                  ) : adminUsers.length > 0 ? <Text style={styles.cardText}>Elegir una provincia para ver sus usuarios.</Text> : null}
                  <View style={styles.profileCommunityPanel}>
                    <Text style={styles.cardEyebrow}>Pendientes rapido</Text>
                    <TouchableOpacity style={styles.secondaryButton} onPress={loadPendingProfiles}>
                      <Text style={styles.secondaryButtonText}>Cargar pendientes</Text>
                    </TouchableOpacity>
                    {realPendingProfiles.map((user) => (
                      <View key={user.id} style={styles.innerNewsCard}>
                        <Text style={styles.cardTitle}>{user.full_name}</Text>
                        <Text style={styles.cardText}>Rol actual: {user.role}</Text>
                        <Text style={styles.cardText}>Comunidad: {user.community_name ?? 'Sin comunidad'}</Text>
                        <TouchableOpacity style={styles.secondaryButton} onPress={() => approvePendingProfile(user.id, 'palestrista')}>
                          <Text style={styles.secondaryButtonText}>Aprobar como Palestrista</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {adminModule === 'solicitudes' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Solicitudes</Text>
                  <View style={styles.filterRow}>
                    <TouchableOpacity style={[styles.filterChip, requestSubtab === 'pendientes' && styles.filterChipActive]} onPress={() => setRequestSubtab('pendientes')}>
                      <Text style={[styles.filterChipText, requestSubtab === 'pendientes' && styles.filterChipTextActive]}>Pendientes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.filterChip, requestSubtab === 'resueltas' && styles.filterChipActive]} onPress={() => setRequestSubtab('resueltas')}>
                      <Text style={[styles.filterChipText, requestSubtab === 'resueltas' && styles.filterChipTextActive]}>Resueltas</Text>
                    </TouchableOpacity>
                  </View>
                  {requestSubtab === 'pendientes' && pendingAdminRequests.length === 0 ? <Text style={styles.cardText}>No hay solicitudes pendientes.</Text> : null}
                  {requestSubtab === 'pendientes' ? pendingAdminRequests.map((item, index) => (
                    <View key={item.id} style={styles.innerNewsCard}>
                      <Text style={styles.cardEyebrow}>Llegada #{index + 1} - {new Date(item.createdAt).toLocaleDateString('es-AR')}</Text>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardText}>Solicitante: {item.requester}</Text>
                      {item.communityName ? <Text style={styles.cardText}>Comunidad: {item.communityName}</Text> : null}
                      {item.targetUserName ? <Text style={styles.cardText}>Sucesor propuesto: {item.targetUserName} - {roleLabel((item.targetRole ?? 'palestrista') as Role)}</Text> : null}
                      <Text style={styles.cardText}>Definicion: {item.definition}</Text>
                      <TextInput style={[styles.input, styles.textArea]} placeholder="Mensaje opcional para el usuario" value={adminRequestMessage} onChangeText={setAdminRequestMessage} multiline />
                      {item.title === 'Solicitud de perseverancia' ? (
                        <View style={styles.profileCommunityPanel}>
                          <Text style={styles.cardEyebrow}>Rol a designar si se aprueba</Text>
                          <TouchableOpacity style={styles.dropdownButton} onPress={() => setPerseveranceRoleDropdownOpen(!perseveranceRoleDropdownOpen)}>
                            <Text style={styles.dropdownButtonText}>{roleLabel(perseveranceRole)}</Text>
                            <Ionicons name={perseveranceRoleDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                          </TouchableOpacity>
                          {perseveranceRoleDropdownOpen ? (
                            <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                              {assignableRoles.filter((role) => role.role !== 'palestrista').map((role) => (
                                <TouchableOpacity key={role.role} style={styles.dropdownItem} onPress={() => { setPerseveranceRole(role.role as Role); setPerseveranceRoleDropdownOpen(false); }}>
                                  <Text style={styles.dropdownItemText}>{role.label}</Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          ) : null}
                        </View>
                      ) : null}
                      {item.title === 'Cambio de dirigencia' ? (
                        <View style={styles.profileCommunityPanel}>
                          <Text style={styles.cardEyebrow}>Resolucion de dirigencia</Text>
                          <Text style={styles.cardText}>Al aprobar se asignara {roleLabel((item.targetRole ?? 'animador_comunidad') as Role)} al sucesor propuesto.</Text>
                        </View>
                      ) : null}
                      <View style={styles.inlineActions}>
                        <TouchableOpacity style={styles.primaryButton} onPress={() => resolveAdminRequest(item.id, 'aprobada')}>
                          <Text style={styles.primaryButtonText}>Aprobar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryButton} onPress={() => resolveAdminRequest(item.id, 'denegada')}>
                          <Text style={styles.secondaryButtonText}>Denegar</Text>
                        </TouchableOpacity>
                      </View>
                      {item.title === 'Solicitud de perseverancia' ? <Text style={styles.cardText}>Al aprobar esta solicitud se asignara el rol seleccionado.</Text> : null}
                    </View>
                  )) : null}
                  {requestSubtab === 'resueltas' && resolvedAdminRequests.length === 0 ? <Text style={styles.cardText}>Todavia no hay solicitudes resueltas.</Text> : null}
                  {requestSubtab === 'resueltas' ? resolvedAdminRequests.map((item) => (
                    <View key={item.id} style={styles.innerNewsCard}>
                      <Text style={styles.cardEyebrow}>{item.status.toUpperCase()} - {new Date(item.createdAt).toLocaleDateString('es-AR')}</Text>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardText}>Solicitante: {item.requester}</Text>
                      {item.communityName ? <Text style={styles.cardText}>Comunidad: {item.communityName}</Text> : null}
                      {item.targetUserName ? <Text style={styles.cardText}>Sucesor: {item.targetUserName} - {roleLabel((item.targetRole ?? 'palestrista') as Role)}</Text> : null}
                      <Text style={styles.cardText}>Definicion: {item.definition}</Text>
                      <Text style={styles.cardText}>Resolvio: {item.resolvedBy ?? 'Sin responsable'}</Text>
                      <Text style={styles.cardText}>Fecha de resolucion: {item.resolvedAt ? new Date(item.resolvedAt).toLocaleString('es-AR') : 'Sin fecha'}</Text>
                      <Text style={styles.cardText}>Mensaje enviado: {item.message ?? 'Sin mensaje'}</Text>
                    </View>
                  )) : null}
                </View>
              ) : null}

              {adminModule === 'noticias' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Noticias</Text>
                  <Text style={styles.cardText}>Crear, preparar borradores y marcar publicaciones destacadas. La publicacion real reutiliza la funcion existente.</Text>
                  <View style={styles.filterRow}>
                    {['General', 'Agenda', 'Formacion', 'Comunidad'].map((item, index) => (
                      <TouchableOpacity key={`${item}-${index}`} style={[styles.filterChip, adminNewsCategory === item && styles.filterChipActive]} onPress={() => setAdminNewsCategory(item)}>
                        <Text style={[styles.filterChipText, adminNewsCategory === item && styles.filterChipTextActive]}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput style={styles.input} placeholder="Titulo" value={adminNewsTitle} onChangeText={setAdminNewsTitle} />
                  <TextInput style={styles.input} placeholder="URL de imagen" value={adminNewsImage} onChangeText={setAdminNewsImage} />
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Texto" value={adminNewsBody} onChangeText={setAdminNewsBody} multiline />
                  <View style={styles.filterRow}>
                    <TouchableOpacity style={[styles.filterChip, adminNewsDraft && styles.filterChipActive]} onPress={() => setAdminNewsDraft(!adminNewsDraft)}>
                      <Text style={[styles.filterChipText, adminNewsDraft && styles.filterChipTextActive]}>{adminNewsDraft ? 'Borrador' : 'Publicar'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.filterChip, adminNewsFeatured && styles.filterChipActive]} onPress={() => setAdminNewsFeatured(!adminNewsFeatured)}>
                      <Text style={[styles.filterChipText, adminNewsFeatured && styles.filterChipTextActive]}>Destacada</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.adminPreviewPane}>
                    <Text style={styles.cardEyebrow}>{adminNewsCategory}{adminNewsFeatured ? ' - destacada' : ''}</Text>
                    <Text style={styles.cardTitle}>{adminNewsTitle || 'Titulo de noticia'}</Text>
                    <Text style={styles.cardText}>{adminNewsBody || 'Previsualizacion del contenido antes de publicar.'}</Text>
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={adminNewsDraft ? () => adminSaveNewsDraft('borrador') : adminCreateNews}>
                    <Text style={styles.primaryButtonText}>{adminNewsDraft ? 'Guardar borrador' : 'Publicar noticia'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={loadNewsDrafts}>
                    <Text style={styles.secondaryButtonText}>Cargar borradores</Text>
                  </TouchableOpacity>
                  {newsDrafts.map((draft) => (
                    <View key={draft.id} style={styles.adminListRow}>
                      <Ionicons name={draft.status === 'borrador' ? 'document-outline' : 'checkmark-circle-outline'} size={19} color={palette.red} />
                      <View style={styles.adminUserHeaderText}>
                        <Text style={styles.cardTitle}>{draft.title}</Text>
                        <Text style={styles.cardText}>{draft.category} - {draft.status}{draft.is_featured ? ' - destacada' : ''}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}

              {adminModule === 'eventos' ? (
                <View style={styles.adminWorkspace}>
                <Text style={styles.cardTitle}>Crear evento {tabLabel('notilestra')}</Text>
                <TextInput style={styles.input} placeholder="Titulo" value={adminEventTitle} onChangeText={setAdminEventTitle} />
                <TextInput style={[styles.input, styles.textArea]} placeholder="Descripcion" value={adminEventBody} onChangeText={setAdminEventBody} multiline />
                <TextInput style={styles.input} placeholder="Fecha ISO: 2026-05-28T21:00:00-03:00" value={adminEventDate} onChangeText={setAdminEventDate} />
                <TouchableOpacity style={styles.primaryButton} onPress={adminCreateEvent}>
                  <Text style={styles.primaryButtonText}>Publicar evento</Text>
                </TouchableOpacity>
                </View>
              ) : null}

              {adminModule === 'comunidades' ? (
                <View style={styles.adminWorkspace}>
                  <Text style={styles.cardTitle}>Editar comunidades</Text>
                  <Text style={styles.cardText}>Seleccionar provincia y comunidad. Los cambios se guardan en Supabase.</Text>
                  <Text style={styles.cardEyebrow}>Provincia</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                    {manageableCommunities.map((item) => (
                      <TouchableOpacity
                        key={item.province}
                        style={[styles.filterChip, adminCommunityProvince === item.province && styles.filterChipActive]}
                        onPress={() => {
                          setAdminCommunityProvince(item.province);
                          setAdminCommunityId('');
                        }}
                      >
                        <Text style={[styles.filterChipText, adminCommunityProvince === item.province && styles.filterChipTextActive]}>{item.province}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {selectedAdminProvince ? (
                    <>
                      <Text style={styles.cardEyebrow}>Comunidad</Text>
                      <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                        {selectedAdminProvince.locations.map((item) => {
                          const itemKey = item.id ?? item.name;
                          const selected = adminCommunityId === itemKey;
                          return (
                            <View key={itemKey}>
                              <TouchableOpacity
                                style={[styles.dropdownItem, selected && styles.communityChoiceActive]}
                                onPress={() => setAdminCommunityId(selected ? '' : itemKey)}
                              >
                                <Text style={[styles.dropdownItemText, selected && styles.filterChipTextActive]}>{item.name}</Text>
                              </TouchableOpacity>
                              {selected ? (
                                <View style={styles.adminInlineEditor}>
                                  <TextInput style={styles.input} placeholder="Nombre" value={adminCommunityName} onChangeText={setAdminCommunityName} />
                                  <TextInput style={styles.input} placeholder="Direccion" value={adminCommunityAddress} onChangeText={setAdminCommunityAddress} />
                                  <TextInput style={styles.input} placeholder="Numero de contacto" value={adminCommunityPhone} onChangeText={setAdminCommunityPhone} />
                                  <TextInput style={styles.input} placeholder="Dia de reunion" value={adminCommunityDay} onChangeText={setAdminCommunityDay} />
                                  <TextInput style={styles.input} placeholder="Horario" value={adminCommunityTime} onChangeText={setAdminCommunityTime} />
                                  <TextInput style={[styles.input, styles.textArea]} placeholder="Descripcion e historia" value={adminCommunityDescription} onChangeText={setAdminCommunityDescription} multiline />
                                  <TouchableOpacity style={styles.primaryButton} onPress={adminSaveCommunity}>
                                    <Text style={styles.primaryButtonText}>Guardar comunidad</Text>
                                  </TouchableOpacity>
                                </View>
                              ) : null}
                            </View>
                          );
                        })}
                      </ScrollView>
                    </>
                  ) : null}
                </View>
              ) : null}

              {adminModule === 'contenido_general' ? (
                <View style={styles.adminWorkspace}>
                <Text style={styles.cardTitle}>Contenido General</Text>
                <Text style={styles.cardText}>Modificar nombres de pestanas y editar el contenido completo de cada pagina.</Text>
                <Text style={styles.cardEyebrow}>Crear pagina nueva</Text>
                <TextInput style={styles.input} placeholder="Nombre de la pagina" value={newTabLabel} onChangeText={setNewTabLabel} />
                <Text style={styles.cardText}>Roles que pueden verla</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                  {visibleHierarchyFor(session).map((role) => (
                    <TouchableOpacity key={role.role} style={[styles.filterChip, newTabRoles.includes(role.role as Role) && styles.filterChipActive]} onPress={() => toggleNewTabRole(role.role as Role)}>
                      <Text style={[styles.filterChipText, newTabRoles.includes(role.role as Role) && styles.filterChipTextActive]}>{role.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.primaryButton} onPress={adminCreatePage}>
                  <Text style={styles.primaryButtonText}>Crear pagina</Text>
                </TouchableOpacity>
                <Text style={styles.cardEyebrow}>Nombres y visibilidad</Text>
                {editableTabs.map((tab) => {
                  const draft = editingTabs[tab.key] ?? { label: tab.label, isVisible: tab.visible, visibleRoles: tab.visibleRoles };
                  return (
                    <View key={tab.key} style={styles.tabEditorRow}>
                      <Text style={styles.cardEyebrow}>{tab.key}</Text>
                      <TextInput
                        style={styles.input}
                        value={draft.label}
                        onChangeText={(value) => setEditingTabs((current) => ({ ...current, [tab.key]: { ...draft, label: value } }))}
                      />
                      <TouchableOpacity
                        style={[styles.secondaryButton, draft.isVisible && styles.filterChipActive]}
                        onPress={() => setEditingTabs((current) => ({ ...current, [tab.key]: { ...draft, isVisible: !draft.isVisible } }))}
                      >
                        <Text style={[styles.secondaryButtonText, draft.isVisible && styles.filterChipTextActive]}>{draft.isVisible ? 'Visible' : 'Oculta'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.primaryButton} onPress={() => adminSaveTab(tab.key, tab.label)}>
                        <Text style={styles.primaryButtonText}>Guardar pestana</Text>
                      </TouchableOpacity>
                      <Text style={styles.cardEyebrow}>Visible para roles</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                        {visibleHierarchyFor(session).map((role) => {
                          const roles = draft.visibleRoles ?? visibleHierarchyFor(session).map((item) => item.role);
                          const checked = roles.includes(role.role);
                          return (
                            <TouchableOpacity key={role.role} style={[styles.filterChip, checked && styles.filterChipActive]} onPress={() => updateTabRole(tab.key, role.role as Role, !checked)}>
                              <Text style={[styles.filterChipText, checked && styles.filterChipTextActive]}>{role.label}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  );
                })}
                <Text style={styles.cardEyebrow}>Contenido de pagina</Text>
                <Text style={styles.cardText}>Editor por bloques: podes mover, borrar, cambiar titulos, texto e imagenes.</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                  {editableTabs.filter((tab) => tab.key !== 'perfil').map((tab) => (
                    <TouchableOpacity
                      key={tab.key}
                      style={[styles.filterChip, selectedContentTab === tab.key && styles.filterChipActive]}
                      onPress={() => setSelectedContentTab(tab.key)}
                    >
                      <Text style={[styles.filterChipText, selectedContentTab === tab.key && styles.filterChipTextActive]}>{tab.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TextInput style={styles.input} placeholder="Titulo de la seccion" value={contentTitle} onChangeText={setContentTitle} />
                <TextInput style={[styles.input, styles.textArea]} placeholder="Texto de la seccion" value={contentBody} onChangeText={setContentBody} multiline />
                <View style={styles.inlineActions}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => addContentBlock('titulo')}>
                    <Text style={styles.secondaryButtonText}>+ Titulo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => addContentBlock('texto')}>
                    <Text style={styles.secondaryButtonText}>+ Texto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => addContentBlock('imagen')}>
                    <Text style={styles.secondaryButtonText}>+ Imagen</Text>
                  </TouchableOpacity>
                </View>
                {contentBlocks.map((block, index) => (
                  <View key={`${block.id}-${index}`} style={styles.blockEditorCard}>
                    <Text style={styles.cardEyebrow}>{block.type}</Text>
                    <TextInput
                      style={[styles.input, block.type === 'texto' && styles.textArea]}
                      placeholder={block.type === 'imagen' ? 'URL de imagen' : 'Contenido'}
                      value={block.value}
                      onChangeText={(value) => updateContentBlock(block.id, value)}
                      multiline={block.type !== 'titulo'}
                    />
                    <View style={styles.inlineActions}>
                      <TouchableOpacity style={styles.secondaryButton} onPress={() => moveContentBlock(index, -1)}>
                        <Text style={styles.secondaryButtonText}>Subir</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.secondaryButton} onPress={() => moveContentBlock(index, 1)}>
                        <Text style={styles.secondaryButtonText}>Bajar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.secondaryButton} onPress={() => deleteContentBlock(block.id)}>
                        <Text style={styles.secondaryButtonText}>Borrar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={styles.primaryButton} onPress={adminSaveContent}>
                  <Text style={styles.primaryButtonText}>Guardar contenido</Text>
                </TouchableOpacity>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Perfil Invitado</Text>
          <Text style={styles.cardText}>Estas navegando como invitado. Podes ver inicio, noticias publicas, comunidades, historia y contacto.</Text>
          <View style={styles.filterRow}>
            <TouchableOpacity style={[styles.filterChip, authMode === 'login' && styles.filterChipActive]} onPress={() => setAuthMode('login')}>
              <Text style={[styles.filterChipText, authMode === 'login' && styles.filterChipTextActive]}>Iniciar sesion</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.filterChip, authMode === 'register' && styles.filterChipActive]} onPress={() => setAuthMode('register')}>
              <Text style={[styles.filterChipText, authMode === 'register' && styles.filterChipTextActive]}>Registrarme</Text>
            </TouchableOpacity>
          </View>
          {authMode === 'register' ? (
            <>
              <SectionTitle title="Queres ser parte de Palestra?" />
              <Text style={styles.cardText}>Registrate como Palestrista. Tu perfil queda pendiente hasta que un dirigente lo apruebe.</Text>
              <TextInput style={styles.input} placeholder="Nombre y apellido" value={registerFullName} onChangeText={setRegisterFullName} />
              <TextInput style={styles.input} placeholder="Contacto" value={registerContact} onChangeText={setRegisterContact} />
              <Text style={styles.cardEyebrow}>Provincia</Text>
              <TouchableOpacity style={styles.dropdownButton} onPress={() => setProvinceDropdownOpen(!provinceDropdownOpen)}>
                <Text style={styles.dropdownButtonText}>{registerProvince || 'Seleccionar provincia'}</Text>
                <Ionicons name={provinceDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
              </TouchableOpacity>
              {provinceDropdownOpen ? (
                <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                  {registrationCommunities.map((item) => (
                    <TouchableOpacity
                      key={item.province}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setRegisterProvince(item.province);
                        setRegisterCommunity('');
                        setProvinceDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{item.province}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : null}
              {selectedRegistrationProvince ? (
                <>
                  <Text style={styles.cardEyebrow}>Comunidad de origen</Text>
                  <TouchableOpacity style={styles.dropdownButton} onPress={() => setCommunityDropdownOpen(!communityDropdownOpen)}>
                    <Text style={styles.dropdownButtonText}>{registerCommunity || 'Seleccionar comunidad'}</Text>
                    <Ionicons name={communityDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                  </TouchableOpacity>
                  {communityDropdownOpen ? (
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                      {selectedRegistrationProvince.locations.map((item) => (
                        <TouchableOpacity key={item.name} style={styles.dropdownItem} onPress={() => { setRegisterCommunity(item.name); setCommunityDropdownOpen(false); }}>
                          <Text style={styles.dropdownItemText}>{item.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}
          <TextInput style={styles.input} placeholder="Email" value={authEmail} onChangeText={setAuthEmail} autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={styles.input} placeholder="Contrasena" value={authPassword} onChangeText={setAuthPassword} secureTextEntry />
          {authMode === 'register' ? (
            <DemoButton label="Registrarme" onPress={registerReal} />
          ) : (
            <DemoButton label="Iniciar sesion" onPress={signInReal} />
          )}
          {authMessage ? <Text style={styles.cardText}>{authMessage}</Text> : null}
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowDemoAccess(!showDemoAccess)}>
            <Text style={styles.secondaryButtonText}>{showDemoAccess ? 'Ocultar accesos demo' : 'Mostrar accesos demo'}</Text>
          </TouchableOpacity>
          {showDemoAccess ? (
            <View style={styles.profileCommunityPanel}>
              <Text style={styles.cardEyebrow}>Modo demo</Text>
              <Text style={styles.cardText}>Solo para probar interfaces por rango.</Text>
              <DemoButton label="Entrar como palestrista" onPress={() => onSessionChange(demoSessions.palestrista)} />
              <DemoButton label="Entrar como sedimentador" onPress={() => onSessionChange(demoSessions.sedimentador)} />
              <DemoButton label="Entrar como coordinador" onPress={() => onSessionChange(demoSessions.coordinador)} />
              <DemoButton label="Entrar como coordinador nacional" onPress={() => onSessionChange(demoSessions.nacional)} />
              <DemoButton label="Entrar como administrador" onPress={() => onSessionChange(demoSessions.administrador)} />
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

function DemoButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.primaryButton} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.paper
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34
  },
  loadingFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF'
  },
  loadingLogoFrame: {
    width: 142,
    height: 142,
    borderRadius: 71,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.16,
    shadowRadius: 24
  },
  loadingLogo: {
    width: '100%',
    height: '100%'
  },
  loadingTitle: {
    color: palette.ink,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 18
  },
  loadingSubtitle: {
    color: palette.inkMuted,
    fontSize: 14,
    marginTop: 4
  },
  loadingBarTrack: {
    width: 220,
    height: 7,
    borderRadius: 7,
    backgroundColor: palette.whiteSoft,
    overflow: 'hidden',
    marginTop: 28
  },
  loadingBarPulse: {
    width: 92,
    height: 7,
    borderRadius: 7,
    backgroundColor: palette.red
  },
  tapCircle: {
    position: 'absolute',
    zIndex: 120,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(31, 159, 209, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)'
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 0,
    backgroundColor: '#DDF1F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  brandLogo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: 'rgba(45, 141, 200, 0.18)',
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2
  },
  brandLogoImage: {
    width: '100%',
    height: '100%'
  },
  brand: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '800'
  },
  subtitle: {
    color: palette.inkMuted,
    fontSize: 13,
    marginTop: 2
  },
  demoLabel: {
    color: palette.red,
    fontSize: 10,
    fontWeight: '900',
    marginTop: 2,
    textTransform: 'uppercase'
  },
  appToast: {
    position: 'absolute',
    top: 86,
    left: 18,
    right: 18,
    zIndex: 80,
    backgroundColor: palette.ink,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 5
  },
  appToastText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center'
  },
  sessionBadge: {
    backgroundColor: 'rgba(45, 141, 200, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)'
  },
  sessionBadgeText: {
    color: palette.blueDeep,
    fontSize: 12,
    fontWeight: '700'
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 156
  },
  stack: {
    gap: 18
  },
  stackTight: {
    gap: 10
  },
  hero: {
    backgroundColor: palette.red,
    borderRadius: 30,
    padding: 24,
    overflow: 'hidden',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 4,
    marginBottom: 2
  },
  heroGlow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#9FD8E8',
    opacity: 0.46,
    right: -42,
    top: -54
  },
  kicker: {
    color: palette.goldSoft,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  heroTitle: {
    color: palette.white,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 8
  },
  heroText: {
    color: 'rgba(255, 255, 255, 0.86)',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10
  },
  homeTileGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0
  },
  homeTile: {
    flex: 1,
    minWidth: 0,
    minHeight: 116,
    borderRadius: 0,
    padding: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  homeTilePrimary: {
    backgroundColor: 'transparent'
  },
  homeTileSky: {
    backgroundColor: 'transparent'
  },
  homeTileWarm: {
    backgroundColor: 'transparent'
  },
  homeTileDeep: {
    backgroundColor: 'transparent'
  },
  homeTileIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: palette.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 3
  },
  homeTileTitle: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 10,
    textAlign: 'center'
  },
  homeTileMeta: {
    color: palette.inkMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 15
  },
  dashboardStrip: {
    flexDirection: 'row',
    gap: 10
  },
  dashboardStat: {
    flex: 1,
    minHeight: 116,
    borderRadius: 22,
    padding: 14,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.12)',
    justifyContent: 'space-between',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2
  },
  dashboardValue: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 6
  },
  dashboardLabel: {
    color: palette.inkMuted,
    fontSize: 11,
    fontWeight: '800'
  },
  featurePanel: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    gap: 12,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  featurePanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12
  },
  miniEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.white,
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.1)',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 1
  },
  miniEventDate: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: palette.red,
    alignItems: 'center',
    justifyContent: 'center'
  },
  miniEventDay: {
    color: palette.white,
    fontSize: 18,
    fontWeight: '900'
  },
  miniEventMonth: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  miniEventBody: {
    flex: 1
  },
  miniEventTitle: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '900'
  },
  miniEventScope: {
    color: palette.inkMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 21,
    fontWeight: '900',
    marginTop: 6,
    marginBottom: 2
  },
  card: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.08)',
    borderRadius: 22,
    padding: 16,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 0
  },
  feedCard: {
    gap: 10,
    borderRadius: 22,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    backgroundColor: palette.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 2
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2
  },
  feedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: 'rgba(45, 141, 200, 0.1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  feedHeaderText: {
    flex: 1
  },
  feedMeta: {
    color: palette.inkMuted,
    fontSize: 12,
    fontWeight: '700'
  },
  feedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2
  },
  libraryCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 2
  },
  libraryIcon: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: 'rgba(45, 141, 200, 0.1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  libraryBody: {
    flex: 1
  },
  provinceCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.32)'
  },
  provinceIcon: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: palette.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 2
  },
  provinceBody: {
    flex: 1
  },
  communityCard: {
    borderLeftColor: 'rgba(45, 141, 200, 0.45)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 2,
    paddingVertical: 15,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  lockedCard: {
    opacity: 0.72
  },
  cardEyebrow: {
    color: palette.red,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6
  },
  screenIntro: {
    color: palette.inkMuted,
    fontSize: 15,
    lineHeight: 21
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.white,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 9,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1
  },
  backButtonText: {
    color: palette.red,
    fontSize: 14,
    fontWeight: '800'
  },
  cardTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6
  },
  cardText: {
    color: palette.inkMuted,
    fontSize: 15,
    lineHeight: 21
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginTop: 12,
    backgroundColor: palette.whiteSoft
  },
  expandHint: {
    color: palette.red,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10
  },
  detailPanel: {
    backgroundColor: palette.white,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    gap: 10,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2
  },
  modalPanel: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderColor: 'rgba(45, 141, 200, 0.18)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 10,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 25, 38, 0.46)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalItem: {
    gap: 6,
    paddingTop: 6
  },
  communityModalPanel: {
    maxHeight: '86%',
    borderRadius: 30,
    paddingBottom: 20
  },
  communityModalImage: {
    width: '100%',
    height: 176,
    borderRadius: 24,
    marginBottom: 12,
    backgroundColor: palette.whiteSoft
  },
  communityModalMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6
  },
  communityModalMetaItem: {
    flex: 1,
    minWidth: '46%',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(230, 243, 245, 0.78)'
  },
  communityModalMetaText: {
    flex: 1,
    color: palette.ink,
    fontSize: 12,
    fontWeight: '800'
  },
  groupNote: {
    backgroundColor: palette.goldSoft,
    borderColor: 'rgba(242, 184, 75, 0.42)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14
  },
  groupNoteText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20
  },
  heroMini: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderRadius: 22,
    padding: 18,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 1
  },
  contentIntro: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.12)',
    borderRadius: 20,
    padding: 14,
    gap: 6,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1
  },
  calendarCard: {
    backgroundColor: palette.white,
    borderWidth: 0,
    borderColor: palette.line,
    borderRadius: 24,
    padding: 16,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 2
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  calendarTitle: {
    color: palette.ink,
    fontSize: 17,
    fontWeight: '800',
    textTransform: 'capitalize'
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 0,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 141, 200, 0.1)'
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  calendarWeekday: {
    width: '14.285%',
    textAlign: 'center',
    color: palette.inkMuted,
    fontWeight: '800',
    marginBottom: 6
  },
  calendarDay: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  calendarEventDay: {
    backgroundColor: palette.goldSoft,
    borderRadius: 12
  },
  calendarActivityDay: {
    backgroundColor: palette.red,
    borderRadius: 12
  },
  calendarDayText: {
    color: palette.ink,
    fontWeight: '700'
  },
  calendarEventText: {
    color: palette.red,
    fontWeight: '900'
  },
  calendarActivityText: {
    color: palette.white,
    fontWeight: '900'
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.white,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 1
  },
  noticeText: {
    flex: 1,
    color: palette.ink,
    fontSize: 14,
    lineHeight: 20
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6
  },
  settingRowText: {
    flex: 1
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  verifiedText: {
    color: palette.green,
    fontWeight: '900'
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8
  },
  profileHero: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
    marginBottom: 18
  },
  profileHeroInfo: {
    flex: 1,
    paddingTop: 6
  },
  profileName: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '900',
    flex: 1
  },
  profileMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12
  },
  profileMetaItem: {
    flex: 1,
    minWidth: '46%',
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 20,
    padding: 12,
    backgroundColor: palette.whiteSoft,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.12)'
  },
  profileMetaText: {
    flex: 1
  },
  profileMetaLabel: {
    color: palette.inkMuted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 3
  },
  profileMetaValue: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '800'
  },
  avatarFrameLarge: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    backgroundColor: palette.whiteSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  avatarImageLarge: {
    width: '100%',
    height: '100%'
  },
  photoChangeButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)',
    backgroundColor: palette.white,
    borderRadius: 18,
    minHeight: 42,
    paddingHorizontal: 12,
    marginTop: 12,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1
  },
  photoChangeText: {
    color: palette.red,
    fontSize: 13,
    fontWeight: '900'
  },
  photoModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 20, 28, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  photoModalImage: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: palette.white
  },
  photoModalClose: {
    position: 'absolute',
    top: 44,
    right: 24,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  accountMenu: {
    position: 'absolute',
    top: 48,
    right: 0,
    zIndex: 8,
    width: 238,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderRadius: 22,
    padding: 10,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 6
  },
  accountMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45, 141, 200, 0.12)',
    marginBottom: 4
  },
  accountMenuAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.whiteSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  accountMenuAvatarImage: {
    width: '100%',
    height: '100%'
  },
  accountMenuName: {
    color: palette.ink,
    fontWeight: '900',
    fontSize: 13
  },
  accountMenuSub: {
    color: palette.inkMuted,
    fontSize: 12,
    marginTop: 2
  },
  accountMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 38,
    paddingHorizontal: 8,
    borderRadius: 14
  },
  accountMenuItemText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700'
  },
  accountMenuDanger: {
    color: palette.red
  },
  primaryButton: {
    backgroundColor: palette.red,
    minHeight: 48,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2
  },
  primaryButtonText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '800'
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.32)',
    minHeight: 48,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: palette.white
  },
  secondaryButtonText: {
    color: palette.red,
    fontSize: 15,
    fontWeight: '800'
  },
  tabBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: 0,
    borderRadius: 30,
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 6,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 10
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    gap: 3
  },
  tabIconFrame: {
    width: 38,
    height: 34,
    borderWidth: 0,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 15,
    borderBottomLeftRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 141, 200, 0.1)'
  },
  viewAllButton: {
    width: 'auto',
    minWidth: 76,
    paddingHorizontal: 10
  },
  linkText: {
    color: palette.red,
    fontSize: 13,
    fontWeight: '900'
  },
  tabIconFrameActive: {
    backgroundColor: palette.red,
    borderColor: palette.red,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3
  },
  tabLabel: {
    color: palette.inkMuted,
    fontSize: 9,
    fontWeight: '700'
  },
  tabLabelActive: {
    color: palette.red
  },
  tabActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.red,
    marginTop: 1
  },
  profileCommunityPanel: {
    backgroundColor: palette.white,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    marginTop: 12,
    gap: 10,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 1
  },
  profileShell: {
    position: 'relative',
    backgroundColor: palette.white,
    borderWidth: 0,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderRadius: 24,
    padding: 16,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 2
  },
  roleTimeline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  roleStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 16,
    paddingHorizontal: 9,
    paddingVertical: 7,
    backgroundColor: palette.white
  },
  roleStepActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  roleStepRank: {
    color: palette.red,
    fontWeight: '900'
  },
  roleStepLabel: {
    color: palette.ink,
    fontWeight: '800',
    fontSize: 12
  },
  roleStepTextActive: {
    color: palette.white
  },
  innerNewsCard: {
    backgroundColor: palette.white,
    borderColor: 'rgba(45, 141, 200, 0.12)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1
  },
  adminUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  adminUserHeaderText: {
    flex: 1
  },
  adminUserAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.whiteSoft,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  adminUserAvatarImage: {
    width: '100%',
    height: '100%'
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  actionPill: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)',
    borderRadius: 18,
    paddingHorizontal: 10,
    marginTop: 10,
    backgroundColor: palette.white
  },
  actionPillActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  actionPillText: {
    color: palette.red,
    fontSize: 13,
    fontWeight: '900'
  },
  actionPillTextActive: {
    color: palette.white
  },
  inlineEditButton: {
    alignSelf: 'flex-start',
    minHeight: 38,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)',
    borderRadius: 20,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.white
  },
  inlineEditButtonText: {
    color: palette.red,
    fontSize: 13,
    fontWeight: '900'
  },
  inlineEditorPanel: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderRadius: 22,
    padding: 14,
    gap: 8,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 1
  },
  smallActionButton: {
    minHeight: 38,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 16,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.whiteSoft
  },
  smallActionText: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '800'
  },
  inlineBlockEditor: {
    backgroundColor: palette.whiteSoft,
    borderRadius: 18,
    padding: 12,
    gap: 6
  },
  inlineBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  inlineIconActions: {
    flexDirection: 'row',
    gap: 6
  },
  iconButtonGhost: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.12)'
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  horizontalChips: {
    gap: 8,
    paddingVertical: 4
  },
  filterChip: {
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    backgroundColor: palette.white,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  filterChipActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  filterChipText: {
    color: palette.ink,
    fontWeight: '800'
  },
  filterChipTextActive: {
    color: palette.white
  },
  avatarPlaceholder: {
    height: 132,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 66,
    backgroundColor: palette.whiteSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  },
  communityChoiceList: {
    maxHeight: 220,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 18,
    padding: 8,
    gap: 8,
    backgroundColor: palette.whiteSoft
  },
  communityChoice: {
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: palette.white
  },
  communityChoiceActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  statusBanner: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12
  },
  statusBanner_pendiente: {
    backgroundColor: palette.goldSoft,
    borderColor: palette.gold
  },
  statusBanner_aprobado: {
    backgroundColor: '#E4F7F0',
    borderColor: palette.green
  },
  statusBanner_bloqueado: {
    backgroundColor: '#FDE8E8',
    borderColor: '#D94B4B'
  },
  statusBannerText: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4
  },
  statusBannerSubtext: {
    color: palette.inkMuted,
    fontSize: 14,
    lineHeight: 20
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 18,
    paddingHorizontal: 14,
    marginTop: 10,
    color: palette.ink,
    backgroundColor: palette.white
  },
  textArea: {
    minHeight: 110,
    paddingTop: 12,
    textAlignVertical: 'top'
  },
  dropdownButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 18,
    paddingHorizontal: 14,
    marginTop: 8,
    backgroundColor: palette.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  dropdownButtonText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '800',
    flex: 1
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 18,
    backgroundColor: palette.white,
    marginTop: 8,
    maxHeight: 220,
    overflow: 'hidden'
  },
  dropdownItem: {
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45, 141, 200, 0.1)',
    justifyContent: 'center'
  },
  dropdownItemText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700'
  },
  debugPanel: {
    backgroundColor: '#FFF4CC',
    borderColor: palette.gold,
    borderWidth: 1,
    borderRadius: 18,
    padding: 8,
    marginBottom: 8
  },
  debugText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: '800'
  },
  adminPanel: {
    backgroundColor: palette.white,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 10,
    marginTop: 12,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 2
  },
  adminModuleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'rgba(230, 243, 245, 0.58)',
    borderRadius: 24,
    padding: 8
  },
  adminModuleButton: {
    width: '31%',
    minHeight: 66,
    borderWidth: 0,
    borderColor: palette.line,
    backgroundColor: 'rgba(45, 141, 200, 0.09)',
    borderRadius: 18,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5
  },
  adminModuleButtonActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  adminModuleText: {
    color: palette.ink,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center'
  },
  adminModuleTextActive: {
    color: palette.white
  },
  adminWorkspace: {
    backgroundColor: 'rgba(255,255,255,0.38)',
    borderColor: 'rgba(45, 141, 200, 0.12)',
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    gap: 10,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 0
  },
  adminStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.goldSoft,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  adminStatusText: {
    color: palette.ink,
    fontWeight: '900',
    fontSize: 13
  },
  adminStatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  adminStat: {
    flex: 1,
    minWidth: '46%',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderRadius: 18,
    padding: 12,
    backgroundColor: palette.whiteSoft
  },
  adminStatNumber: {
    color: palette.red,
    fontSize: 20,
    fontWeight: '900'
  },
  adminStatLabel: {
    color: palette.inkMuted,
    fontSize: 11,
    fontWeight: '800'
  },
  adminEditForm: {
    gap: 4
  },
  adminInlineEditor: {
    backgroundColor: palette.whiteSoft,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 18,
    padding: 12,
    margin: 8
  },
  adminQuickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  adminQuickAction: {
    flex: 1,
    minWidth: '46%',
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 18,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(45, 141, 200, 0.09)'
  },
  adminQuickText: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '900',
    flex: 1
  },
  adminPreviewPane: {
    backgroundColor: 'rgba(230, 243, 245, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.12)',
    borderRadius: 22,
    padding: 14,
    gap: 6
  },
  colorInput: {
    flex: 1,
    minWidth: 130
  },
  adminListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45, 141, 200, 0.11)',
    paddingVertical: 12
  },
  adminListRowActive: {
    backgroundColor: 'rgba(45, 141, 200, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 10,
    borderBottomWidth: 0
  },
  adminStateDraft: {
    color: palette.red,
    fontWeight: '900',
    fontSize: 12
  },
  blockEditorCard: {
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 18,
    padding: 12,
    backgroundColor: palette.whiteSoft
  },
  adminMessage: {
    color: palette.white,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 18,
    padding: 10,
    fontWeight: '800'
  },
  tabEditorRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(45, 141, 200, 0.14)',
    paddingTop: 10,
    marginTop: 8
  }
});
