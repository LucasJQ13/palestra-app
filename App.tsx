import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Image, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { palette } from './src/theme/palette';
import { auditLog, calendarActivities, communities, contactInfo, communityNews, demoRequests, faqItems, internalMessages, materials, movementHistory, news, notilestra, pendingUsers, roleDefinitions } from './src/data/content';
import { Permission, Role, Session, UserStatus } from './src/types/auth';
import { getPermissionsForRole } from './src/lib/permissions';
import { AppCommunity, createCommunityPublication, fetchCommunities, fetchCommunityPublications, fetchNews, fetchNotilestra, voteCommunityPoll } from './src/lib/remoteData';
import { AdminUser, AppContentBlock, AppTabSetting, CommunityMember, ContentEditorBlock, UserRequestRecord, approveProfile, confirmAdminUserEmail, createAppTab, createEvent, createNews, createLeadershipChangeRequest, createUserRequest, fetchAdminRequests, fetchAdminUsers, fetchAppContent, fetchAppTabs, fetchMyCommunityMembers, fetchMyRequests, fetchPendingProfiles, PendingProfile, resolveUserRequest, updateAdminUser, updateAppContent, updateAppTab, updateCommunity, updateMyAvatar, updateMyProfile } from './src/lib/profiles';
import { supabase } from './src/lib/supabase';
import { getMyProfileSession } from './src/lib/authProfile';
import { assignableRolesFor, canAccessProvince, canApproveRole, canManageProvince, canSeeAllProvinces, visibleHierarchyFor } from './src/lib/roles';

const palestraLogo = require('./assets/logo-palestra.png');

type TabKey = string;
type AdminModule = 'resumen' | 'usuarios' | 'solicitudes' | 'noticias' | 'eventos' | 'comunidades' | 'contenido_general';
type ProfilePanel = 'vista' | 'editar';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('inicio');
  const [session, setSession] = useState<Session | null>(null);
  const [tapEffect, setTapEffect] = useState<{ x: number; y: number; id: number } | null>(null);
  const [tabSettings, setTabSettings] = useState<AppTabSetting[]>([]);
  const [appContent, setAppContent] = useState<AppContentBlock[]>([]);
  const [contentVersion, setContentVersion] = useState(0);

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
    return resolvedTabs.filter((tab) => tab.visible && (!tab.visibleRoles || tab.visibleRoles.includes(currentRole)));
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

  async function refreshPublishedContent() {
    await reloadAppContent();
    setContentVersion((current) => current + 1);
  }

  useEffect(() => {
    let alive = true;

    async function hydrateSession() {
      const { data } = await supabase.auth.getUser();
      if (!alive || !data.user) {
        return;
      }

      const result = await getMyProfileSession(data.user.email ?? 'Usuario');
      if (result.session) {
        setSession(result.session);
      }
    }

    hydrateSession();
    reloadTabSettings();
    reloadAppContent();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, authSession) => {
      if (!authSession?.user) {
        setSession(null);
      }
      if (authSession?.user) {
        hydrateSession();
      }
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const screen = useMemo(() => {
    if (activeTab === 'inicio') {
      return <HomeScreen session={session} title={tabLabel('inicio')} content={appContent.find((item) => item.tab_key === 'inicio')} refreshKey={contentVersion} editor={pageEditorProps('inicio')} />;
    }
    if (activeTab === 'notilestra') {
      return <NotilestraScreen session={session} title={tabLabel('notilestra')} content={appContent.find((item) => item.tab_key === 'notilestra')} refreshKey={contentVersion} editor={pageEditorProps('notilestra')} />;
    }
    if (activeTab === 'materiales') {
      return <MaterialsScreen session={session} title={tabLabel('materiales')} content={appContent.find((item) => item.tab_key === 'materiales')} editor={pageEditorProps('materiales')} />;
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
    return <ProfileScreen session={session} onSessionChange={setSession} tabs={resolvedTabs} appContent={appContent} onTabsChanged={reloadTabSettings} onContentChanged={refreshPublishedContent} />;
  }, [activeTab, session, resolvedTabs, appContent, contentVersion]);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={styles.safeArea}
        onTouchStart={(event) => {
          const { locationX, locationY } = event.nativeEvent;
          const id = Date.now();
          setTapEffect({ x: locationX, y: locationY, id });
          setTimeout(() => setTapEffect((current) => (current?.id === id ? null : current)), 420);
        }}
      >
        {tapEffect ? <View pointerEvents="none" style={[styles.tapCircle, { left: tapEffect.x - 24, top: tapEffect.y - 24 }]} /> : null}
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <View style={styles.brandLogo}>
              <Image source={palestraLogo} style={styles.brandLogoImage} />
            </View>
            <View>
              <Text style={styles.brand}>Palestra</Text>
              <Text style={styles.subtitle}>Movimiento Catolico</Text>
            </View>
          </View>
          <View style={styles.sessionBadge}>
            <Text style={styles.sessionBadgeText}>{session ? roleLabel(session.role) : 'Invitado'}</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.content}>{screen}</ScrollView>
        <View style={styles.tabBar}>
          {visibleTabs.map((tab) => {
            const selected = activeTab === tab.key;
            return (
              <TouchableOpacity key={tab.key} style={styles.tabButton} onPress={() => setActiveTab(tab.key)} activeOpacity={0.8}>
                <View style={[styles.tabIconFrame, selected && styles.tabIconFrameActive]}>
                  <Ionicons name={tab.icon} size={20} color={selected ? palette.white : palette.red} />
                </View>
                <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>{tab.label}</Text>
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
          {content.blocks.map((block) => {
            if (block.type === 'titulo') {
              return <Text key={block.id} style={styles.cardTitle}>{block.value}</Text>;
            }
            if (block.type === 'imagen') {
              return <Image key={block.id} source={{ uri: block.value }} style={styles.cardImage} />;
            }
            return <Text key={block.id} style={styles.cardText}>{block.value}</Text>;
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
              <View key={block.id} style={styles.inlineBlockEditor}>
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

function HomeScreen({ session, title, content, refreshKey, editor }: { session: Session | null; title: string; content?: AppContentBlock; refreshKey: number; editor?: PageEditorProps }) {
  const [expandedNews, setExpandedNews] = useState<string | null>(null);
  const [homeNews, setHomeNews] = useState(news);

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
        <Text style={styles.heroTitle}>Una app para caminar juntos.</Text>
        <Text style={styles.heroText}>Noticias, agenda, materiales y comunicacion interna para las comunidades de Palestra.</Text>
      </View>

      <EditableIntro content={content} editor={editor} />
      <SectionTitle title="Avisos" />
      {homeNews.map((item) => (
        <TouchableOpacity key={item.title} style={styles.card} activeOpacity={0.86} onPress={() => setExpandedNews(expandedNews === item.title ? null : item.title)}>
          <Text style={styles.cardEyebrow}>{item.scope}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardText} numberOfLines={expandedNews === item.title ? undefined : 2}>{item.body}</Text>
          {expandedNews === item.title ? <Image source={{ uri: item.imageUrl }} style={styles.cardImage} /> : null}
          <Text style={styles.expandHint}>{expandedNews === item.title ? 'Tocar para contraer' : 'Tocar para leer mas'}</Text>
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
            {dueReminderItems.map((item) => <Text key={item.title} style={styles.cardText}>{item.title} - {item.date}</Text>)}
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
      {subtab === 'noticias' ? notilestraItems.map((item) => (
        <View key={item.title} style={styles.card}>
          <TouchableOpacity activeOpacity={0.86} onPress={() => setExpandedItem(expandedItem === item.title ? null : item.title)}>
            <Text style={styles.cardEyebrow}>{item.scope} - {item.date}</Text>
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
      {subtab === 'favoritos' ? <View style={styles.stack}>{favoriteItems.length > 0 ? favoriteItems.map((item) => (
        <View key={item.title} style={styles.card}>
          <Text style={styles.cardEyebrow}>{item.scope} - {item.date}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardText}>{item.body}</Text>
        </View>
      )) : <View style={styles.card}><Text style={styles.cardText}>Todavia no marcaste favoritos.</Text></View>}</View> : null}
      {subtab === 'recordatorios' ? <View style={styles.stack}>{reminderItems.length > 0 ? reminderItems.map((item) => (
        <View key={item.title} style={styles.card}>
          <Text style={styles.cardEyebrow}>Recordatorio - {item.date}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardText}>La app mostrara un aviso interno 1 dia antes al abrir Notilestra.</Text>
        </View>
      )) : <View style={styles.card}><Text style={styles.cardText}>Todavia no marcaste recordatorios.</Text></View>}</View> : null}
    </View>
  );
}

function MaterialsScreen({ session, title, content, editor }: { session: Session | null; title: string; content?: AppContentBlock; editor?: PageEditorProps }) {
  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      {materials.map((material) => {
        const locked = material.permission && !hasPermission(session, material.permission);
        return (
          <View key={material.title} style={[styles.card, locked && styles.lockedCard]}>
            <Text style={styles.cardEyebrow}>{material.type}</Text>
            <Text style={styles.cardTitle}>{material.title}</Text>
            <Text style={styles.cardText}>{locked ? 'Material restringido por rango o permiso.' : material.description}</Text>
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

  if (province) {
    return (
      <View style={styles.stack}>
        <TouchableOpacity style={styles.backButton} onPress={() => { setSelectedCommunity(null); setSelectedProvince(null); }} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={18} color={palette.red} />
          <Text style={styles.backButtonText}>Provincias</Text>
        </TouchableOpacity>
        <SectionTitle title={province.province} />
        <Text style={styles.screenIntro}>{province.description}</Text>
        {community ? (
          <View style={styles.detailPanel}>
            <TouchableOpacity style={styles.backButton} onPress={() => setSelectedCommunity(null)} activeOpacity={0.8}>
              <Ionicons name="close" size={18} color={palette.red} />
              <Text style={styles.backButtonText}>Cerrar comunidad</Text>
            </TouchableOpacity>
            <Image source={{ uri: community.imageUrl }} style={styles.cardImage} />
            <Text style={styles.cardTitle}>{community.name}</Text>
            <Text style={styles.cardText}>{community.description}</Text>
            <Text style={styles.expandHint}>Abrir direccion en Google Maps</Text>
          </View>
        ) : null}
        {province.province === 'Tucuman' || province.province === 'Catamarca' ? (
          <View style={styles.groupNote}>
            <Text style={styles.groupNoteText}>Esta provincia distingue comunidades de jovenes y comunidades de adultos.</Text>
          </View>
        ) : null}
        {(province.province === 'Tucuman' || province.province === 'Catamarca') ? (
          <>
            <SectionTitle title="Comunidades de jovenes" />
            {province.locations.filter((location) => location.group !== 'adultos').map((location) => (
              <TouchableOpacity key={`young-${location.name}`} style={styles.card} activeOpacity={0.86} onPress={() => setSelectedCommunity(location.name)}>
                <Text style={styles.cardTitle}>{location.name}</Text>
                <Text style={styles.cardText}>{location.address}</Text>
                <Text style={styles.cardText}>Contacto: {location.phone}</Text>
                <Text style={styles.cardText}>Reunion: {location.meetingDay} - {location.meetingTime}</Text>
                <Text style={styles.expandHint}>Tocar para ver presentacion</Text>
              </TouchableOpacity>
            ))}
            <SectionTitle title="Comunidades de adultos" />
            {province.locations.filter((location) => location.group === 'adultos').map((location) => (
              <TouchableOpacity key={`adult-${location.name}`} style={styles.card} activeOpacity={0.86} onPress={() => setSelectedCommunity(location.name)}>
                <Text style={styles.cardTitle}>{location.name}</Text>
                <Text style={styles.cardText}>{location.address}</Text>
                <Text style={styles.cardText}>Contacto: {location.phone}</Text>
                <Text style={styles.cardText}>Reunion: {location.meetingDay} - {location.meetingTime}</Text>
                <Text style={styles.expandHint}>Tocar para ver presentacion</Text>
              </TouchableOpacity>
            ))}
          </>
        ) : province.locations.map((location) => (
          <TouchableOpacity key={location.name} style={styles.card} activeOpacity={0.86} onPress={() => setSelectedCommunity(location.name)}>
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
        <TouchableOpacity key={community.province} style={styles.card} onPress={() => setSelectedProvince(community.province)} activeOpacity={0.85}>
          <Text style={styles.cardEyebrow}>{community.region}</Text>
          <Text style={styles.cardTitle}>{community.province}</Text>
          <Text style={styles.cardText}>{community.description}</Text>
        </TouchableOpacity>
      ))}
      <SectionTitle title="Filtro demo" />
      <View style={styles.filterRow}>
        {['Todas', ...visibleCommunityData.map((item) => item.province)].map((item) => (
          <TouchableOpacity key={item} style={[styles.filterChip, filterProvince === item && styles.filterChipActive]} onPress={() => setFilterProvince(item)}>
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
  onTabsChanged,
  onContentChanged
}: {
  session: Session | null;
  onSessionChange: (session: Session | null) => void;
  tabs: AppTabDisplay[];
  appContent: AppContentBlock[];
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
  const [adminEventTitle, setAdminEventTitle] = useState('');
  const [adminEventBody, setAdminEventBody] = useState('');
  const [adminEventDate, setAdminEventDate] = useState('');
  const [adminModule, setAdminModule] = useState<AdminModule>('resumen');
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

  useEffect(() => {
    setEditFullName(session?.fullName ?? '');
    setEditContact(session?.contact ?? '');
    setEditProvince(session?.province ?? '');
    setEditCommunity(session?.communityOfOrigin ?? '');
  }, [session]);

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
      await onContentChanged();
    }
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
          <Text style={styles.cardText}>Provincia: {session.province}</Text>
          <Text style={styles.cardText}>Rango: {roleLabel(session.role)}</Text>
          <Text style={styles.cardText}>Contacto: {session.contact}</Text>
          <Text style={styles.cardText}>Comunidad de origen: {session.communityOfOrigin}</Text>
          <Text style={styles.cardText}>Estado: {statusLabel(session.status)}</Text>
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
                profileNews.length > 0 ? profileNews.map((item) => (
                  <View key={item.title} style={styles.innerNewsCard}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardText}>{item.body}</Text>
                  </View>
                )) : <Text style={styles.cardText}>Todavia no hay noticias cargadas para esta comunidad.</Text>
              ) : (
                <Text style={styles.cardText}>Tu rango actual no permite ver noticias internas de comunidad.</Text>
              )}
              <SectionTitle title="Publicado por mi comunidad" />
              {myCommunityPublications.length === 0 ? <Text style={styles.cardText}>Todavia no hay publicaciones de tu animador o coordinador.</Text> : null}
              {myCommunityPublications.map((item) => {
                const results = Object.entries(item.pollResults ?? {}).sort((a, b) => Number(b[1]) - Number(a[1]));
                return (
                  <View key={item.id ?? item.title} style={styles.innerNewsCard}>
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
          {session.role !== 'administrador' ? demoRequests.map((item) => (
            <View key={item}>
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
          {internalMessages.map((item) => (
            <View key={item.title} style={styles.innerNewsCard}>
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
              {pendingUsers.map((user) => (
                <Text key={user.name} style={styles.cardText}>{user.name}: {user.requestedRole} - {user.status}</Text>
              ))}
              {auditLog.map((item) => <Text key={item} style={styles.cardText}>- {item}</Text>)}
            </View>
          ) : null}
          {(hasPermission(session, 'gestionar_sistema') || canReviewLeadershipRequests) ? (
            <View style={styles.adminPanel}>
              <Text style={styles.cardEyebrow}>{session.role === 'administrador' ? 'Administrador' : 'Dirigencia'}</Text>
              <Text style={styles.cardTitle}>{session.role === 'administrador' ? 'Panel tecnico global' : 'Panel diocesano'}</Text>
              <Text style={styles.cardText}>{session.role === 'administrador' ? 'Gestionar roles, permisos, pestanas, secciones, comunidades, provincias, usuarios, contenido y configuracion general.' : 'Revisar solicitudes y gestionar cambios de dirigencia dentro de la provincia.'}</Text>
              {authMessage ? <Text style={styles.adminMessage}>{authMessage}</Text> : null}
              <View style={styles.adminModuleGrid}>
                {[
                  { key: 'resumen', label: 'Resumen', icon: 'grid-outline' },
                  { key: 'usuarios', label: 'Usuarios', icon: 'people-outline' },
                  { key: 'solicitudes', label: 'Solicitudes', icon: 'mail-unread-outline' },
                  { key: 'noticias', label: 'Noticias', icon: 'newspaper-outline' },
                  { key: 'eventos', label: 'Eventos', icon: 'calendar-outline' },
                  { key: 'comunidades', label: 'Comunidades', icon: 'location-outline' },
                  { key: 'contenido_general', label: 'Contenido General', icon: 'create-outline' }
                ].filter((item) => hasPermission(session, 'gestionar_sistema') || ['resumen', 'usuarios', 'solicitudes', 'comunidades'].includes(item.key)).map((item) => (
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
                  <Text style={styles.cardTitle}>Panel de control</Text>
                  <View style={styles.adminStatRow}>
                    <View style={styles.adminStat}>
                      <Text style={styles.adminStatNumber}>{realPendingProfiles.length}</Text>
                      <Text style={styles.adminStatLabel}>Pendientes cargados</Text>
                    </View>
                    <View style={styles.adminStat}>
                      <Text style={styles.adminStatNumber}>{manageableCommunities.reduce((total, item) => total + item.locations.length, 0)}</Text>
                      <Text style={styles.adminStatLabel}>Comunidades gestionables</Text>
                    </View>
                    <View style={styles.adminStat}>
                      <Text style={styles.adminStatNumber}>{editableTabs.filter((tab) => tab.visible).length}</Text>
                      <Text style={styles.adminStatLabel}>Pestanas visibles</Text>
                    </View>
                  </View>
                  <Text style={styles.cardText}>Elegir un modulo arriba para administrar una parte concreta de la aplicacion.</Text>
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
                <Text style={styles.cardTitle}>Crear noticia</Text>
                <TextInput style={styles.input} placeholder="Titulo" value={adminNewsTitle} onChangeText={setAdminNewsTitle} />
                <TextInput style={[styles.input, styles.textArea]} placeholder="Texto" value={adminNewsBody} onChangeText={setAdminNewsBody} multiline />
                <TouchableOpacity style={styles.primaryButton} onPress={adminCreateNews}>
                  <Text style={styles.primaryButtonText}>Publicar noticia</Text>
                </TouchableOpacity>
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
                  <View key={block.id} style={styles.blockEditorCard}>
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
  tapCircle: {
    position: 'absolute',
    zIndex: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(31, 159, 209, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)'
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
    backgroundColor: palette.white,
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
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
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
  sessionBadge: {
    backgroundColor: palette.whiteSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18
  },
  sessionBadgeText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: '700'
  },
  content: {
    padding: 20,
    paddingBottom: 104
  },
  stack: {
    gap: 14
  },
  stackTight: {
    gap: 10
  },
  hero: {
    backgroundColor: '#EAF1F6',
    borderRadius: 10,
    padding: 22,
    overflow: 'hidden'
  },
  heroGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: palette.red,
    opacity: 0.28,
    right: -38,
    top: -48
  },
  kicker: {
    color: palette.red,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  heroTitle: {
    color: palette.ink,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 8
  },
  heroText: {
    color: palette.inkMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4
  },
  card: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(217, 226, 234, 0.62)',
    borderRadius: 10,
    padding: 15
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
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8
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
    borderRadius: 8,
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
    backgroundColor: palette.whiteSoft,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 10
  },
  modalPanel: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: palette.white,
    borderColor: palette.red,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 10,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.12,
    shadowRadius: 16
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
  groupNote: {
    backgroundColor: palette.goldSoft,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12
  },
  groupNoteText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20
  },
  heroMini: {
    backgroundColor: palette.whiteSoft,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    padding: 16
  },
  contentIntro: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(217, 226, 234, 0.62)',
    borderRadius: 10,
    padding: 14,
    gap: 6
  },
  calendarCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    padding: 14
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
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center'
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
    borderRadius: 8
  },
  calendarActivityDay: {
    backgroundColor: palette.red,
    borderRadius: 8
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
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14
  },
  noticeText: {
    flex: 1,
    color: palette.ink,
    fontSize: 14,
    lineHeight: 20
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
  avatarFrameLarge: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1,
    borderColor: palette.line,
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
    borderColor: palette.line,
    backgroundColor: palette.white,
    borderRadius: 8,
    minHeight: 38,
    paddingHorizontal: 10,
    marginTop: 12
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
    borderColor: palette.line,
    borderRadius: 12,
    padding: 8,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.12,
    shadowRadius: 16
  },
  accountMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
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
    borderRadius: 8
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
    minHeight: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  primaryButtonText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '800'
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: palette.red,
    minHeight: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14
  },
  secondaryButtonText: {
    color: palette.red,
    fontSize: 15,
    fontWeight: '800'
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.white,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 10
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    gap: 3
  },
  tabIconFrame: {
    width: 32,
    height: 28,
    borderWidth: 1,
    borderColor: palette.line,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 13,
    borderBottomLeftRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.whiteSoft
  },
  tabIconFrameActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  tabLabel: {
    color: palette.inkMuted,
    fontSize: 9,
    fontWeight: '700'
  },
  tabLabelActive: {
    color: palette.red
  },
  profileCommunityPanel: {
    backgroundColor: palette.whiteSoft,
    borderColor: 'rgba(217, 226, 234, 0.7)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    gap: 10
  },
  profileShell: {
    position: 'relative',
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(217, 226, 234, 0.62)',
    borderRadius: 10,
    padding: 15
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
    borderColor: palette.line,
    borderRadius: 8,
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
    borderColor: 'rgba(217, 226, 234, 0.62)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12
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
    borderColor: palette.line,
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
    borderColor: palette.line,
    borderRadius: 8,
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
    borderColor: palette.line,
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
    borderColor: palette.line,
    borderRadius: 12,
    padding: 12,
    gap: 8
  },
  smallActionButton: {
    minHeight: 38,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
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
    borderRadius: 10,
    padding: 10,
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
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white
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
    borderColor: palette.line,
    backgroundColor: palette.white,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8
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
    borderColor: palette.line,
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
    borderColor: palette.line,
    borderRadius: 8,
    padding: 8,
    gap: 8,
    backgroundColor: palette.whiteSoft
  },
  communityChoice: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
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
    borderRadius: 8,
    padding: 12,
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
    minHeight: 46,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    paddingHorizontal: 12,
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
    minHeight: 46,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    paddingHorizontal: 12,
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
    borderColor: palette.line,
    borderRadius: 8,
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
    borderBottomColor: palette.line,
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
    borderRadius: 8,
    padding: 8,
    marginBottom: 8
  },
  debugText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: '800'
  },
  adminPanel: {
    backgroundColor: '#E9F1F6',
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginTop: 12
  },
  adminModuleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  adminModuleButton: {
    width: '31.5%',
    minHeight: 66,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.white,
    borderRadius: 10,
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
    backgroundColor: palette.white,
    borderColor: 'rgba(217, 226, 234, 0.62)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10
  },
  adminStatRow: {
    flexDirection: 'row',
    gap: 8
  },
  adminStat: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    padding: 10,
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
    borderColor: palette.line,
    borderRadius: 8,
    padding: 10,
    margin: 8
  },
  blockEditorCard: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    padding: 10,
    backgroundColor: palette.whiteSoft
  },
  adminMessage: {
    color: palette.white,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 8,
    padding: 10,
    fontWeight: '800'
  },
  tabEditorRow: {
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingTop: 10,
    marginTop: 8
  }
});
