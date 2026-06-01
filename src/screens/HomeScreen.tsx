import React, { useEffect, useState } from 'react';
import { Alert, Image, Linking, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { news } from '../data/content';
import { AppCommunity, fetchCommunities, fetchCommunityPublications, fetchNews, updateNewsEntry, archiveNewsEntry } from '../lib/remoteData';
import { AppContentBlock, AppMaterialRecord, fetchAppMaterials } from '../lib/profiles';
import { PageEditorProps, TabKey } from '../lib/navigationConstants';
import { themePresets } from '../theme/themes';
import { AppAdminConfig, defaultAdminConfig } from '../lib/appConfig';
import { canAccessPrivate, canManageNationalPublishedContent } from '../lib/sessionAccess';
import { fallbackContentKey } from '../lib/contentBlocks';
import { changeDone } from '../lib/appMessages';
import { inputPlaceholderColor } from '../lib/constants';
import { DailyGospelRecord, fetchDailyGospel } from '../lib/dailyGospel';
import { homeGreeting, homeGreetingName, roleLabel } from '../lib/profileDisplay';
import { uploadPickedImageToPublicUrl } from '../lib/uploads';
import { Session } from '../types/auth';
import { EditableIntro } from '../components/EditableIntro';
import { ExternalNewsCarousel } from '../components/ExternalNewsCarousel';
import { LinkedSelectableText } from '../components/LinkedSelectableText';
import { SectionTitle } from '../components/SectionTitle';
import { useIsDarkTheme } from '../theme/ThemeContext';
import { palette } from '../theme/palette';
import { styles } from '../theme/appStyles';

type CommunityPublication = Awaited<ReturnType<typeof fetchCommunityPublications>>[number];
type NewsFeedItem = (typeof news)[number] & { id?: string; source?: 'news'; province?: string };
type HomeFeedItem = NewsFeedItem | CommunityPublication;

function isRemoteNewsItem(item: HomeFeedItem): item is NewsFeedItem & { id: string; source: 'news' } {
  return Boolean((item as NewsFeedItem).id && (item as NewsFeedItem).source === 'news');
}

function validHexColor(value?: string | null, fallback = palette.red) {
  const color = (value ?? '').trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

export function HomeScreen({ session, title, content, refreshKey, editor, onNavigate, adminConfig }: { session: Session | null; title: string; content?: AppContentBlock; refreshKey: number; editor?: PageEditorProps; onNavigate: (tab: TabKey) => void; adminConfig: AppAdminConfig }) {
  const isDark = useIsDarkTheme();
  const [expandedNews, setExpandedNews] = useState<string | null>(null);
  const [homeNews, setHomeNews] = useState<HomeFeedItem[]>([]);
  const [communityAgenda, setCommunityAgenda] = useState<CommunityPublication[]>([]);
  const [homeCommunities, setHomeCommunities] = useState<AppCommunity[]>([]);
  const [homeMaterials, setHomeMaterials] = useState<AppMaterialRecord[]>([]);
  const [homeRefreshKey, setHomeRefreshKey] = useState(0);
  const [homeEditId, setHomeEditId] = useState<string | null>(null);
  const [homeEditTitle, setHomeEditTitle] = useState('');
  const [homeEditBody, setHomeEditBody] = useState('');
  const [homeEditImage, setHomeEditImage] = useState('');
  const [homeActionMessage, setHomeActionMessage] = useState('');
  const [gospelModalVisible, setGospelModalVisible] = useState(false);
  const [dailyGospel, setDailyGospel] = useState<DailyGospelRecord | null>(null);
  const [dailyGospelLoading, setDailyGospelLoading] = useState(false);
  const [dailyGospelMessage, setDailyGospelMessage] = useState('');
  const [gospelReflectionOpen, setGospelReflectionOpen] = useState(false);
  const canManageHomeEntries = canManageNationalPublishedContent(session);
  const hiddenFallbackContent = adminConfig.settings.hiddenFallbackContent ?? [];
  const instagramUrl = adminConfig.contact.instagram?.startsWith('http') ? adminConfig.contact.instagram : `https://www.instagram.com/${adminConfig.contact.instagram.replace('@', '')}`;
  const instagramLabel = instagramUrl.includes('infopalestra.argentina') ? '@infopalestra.argentina' : adminConfig.contact.instagram;
  const greeting = homeGreeting(session, adminConfig.home);
  const greetingName = homeGreetingName(session);
  const identityButtonColor = validHexColor(adminConfig.identity.buttonColor, adminConfig.identity.primaryColor || palette.red);
  const greetingNameColor = validHexColor(adminConfig.identity.greetingNameColor, '#2fb66d');
  const enabledHomeModules = new Set(adminConfig.home.visibleModules?.length ? adminConfig.home.visibleModules : defaultAdminConfig.home.visibleModules);
  const homeModuleEnabled = (moduleKey: string) => enabledHomeModules.has(moduleKey);
  const quickLabel = (moduleKey: string, fallback: string) => adminConfig.home.quickAccessLabels?.[moduleKey]?.trim() || fallback;
  const homeTiles = ([
    { module: 'noticias', tab: 'notilestra', title: quickLabel('noticias', 'Noticias'), meta: 'Agenda y avisos', icon: 'newspaper-outline', color: palette.red },
    { module: 'comunidades', tab: 'comunidades', title: quickLabel('comunidades', 'Comunidad'), meta: 'Provincias y contactos', icon: 'people-outline', color: '#7DB9E2' },
    { module: 'materiales', tab: 'materiales', title: quickLabel('materiales', 'Materiales'), meta: 'Archivos internos', icon: 'folder-open-outline', color: palette.gold },
    { module: 'foro', tab: 'foro', title: quickLabel('foro', 'Foro'), meta: 'Nacional y provincias', icon: 'chatbubbles-outline', color: '#4AA06D' },
    { module: 'perfil', tab: 'perfil', title: session ? quickLabel('perfil', 'Perfil') : 'Ingresar', meta: session ? roleLabel(session.role, session.genderPreference) : 'Cuenta personal', icon: 'person-circle-outline', color: palette.inkMuted }
  ] satisfies Array<{ module: string; tab: TabKey; title: string; meta: string; icon: keyof typeof Ionicons.glyphMap; color: string }>).filter((tile) => homeModuleEnabled(tile.module));
  const dashboardStats = [
    { module: 'comunidades', label: 'Provincias', value: String(homeCommunities.length), icon: 'map-outline' as keyof typeof Ionicons.glyphMap },
    { module: 'comunidades', label: 'Comunidades', value: String(homeCommunities.reduce((total, item) => total + item.locations.length, 0)), icon: 'people-circle-outline' as keyof typeof Ionicons.glyphMap },
    { module: 'materiales', label: 'Materiales', value: String(homeMaterials.length), icon: 'library-outline' as keyof typeof Ionicons.glyphMap }
  ].filter((item) => homeModuleEnabled(item.module));
  const visibleHomeNews = homeNews.filter((item) => isRemoteNewsItem(item) || !hiddenFallbackContent.includes(fallbackContentKey('home', item.title)));

  useEffect(() => {
    let alive = true;
    Promise.all([fetchNews(session), fetchCommunityPublications(session), fetchCommunities(), fetchAppMaterials(session?.role === 'administrador')]).then(([items, communityItems, communityRemote, materialRemote]) => {
      if (alive) {
        setHomeNews([...communityItems, ...items]);
        setCommunityAgenda(communityItems.filter((item) => item.kind === 'fecha'));
        setHomeCommunities(communityRemote);
        setHomeMaterials(materialRemote);
      }
    });
    return () => {
      alive = false;
    };
  }, [refreshKey, homeRefreshKey, session?.province, session?.role]);

  useEffect(() => {
    if (gospelModalVisible && adminConfig.gospel.autoUpdate !== false) {
      loadDailyGospel(false);
    }
  }, [gospelModalVisible, adminConfig.gospel.sourceUrl, adminConfig.gospel.reflectionSourceUrl]);

  async function loadDailyGospel(forceRefresh: boolean) {
    setDailyGospelLoading(true);
    setDailyGospelMessage(forceRefresh ? 'Actualizando Evangelio del dia...' : 'Cargando Evangelio del dia...');
    const { data, error } = await fetchDailyGospel({
      sourceUrl: adminConfig.gospel.sourceUrl || 'https://donbosco.org.ar/home/evangelio',
      reflectionSourceUrl: adminConfig.gospel.reflectionSourceUrl || adminConfig.gospel.sourceUrl,
      forceRefresh
    });
    if (error || !data) {
      setDailyGospelMessage(error?.message ?? 'No pude cargar el Evangelio automatico.');
      setDailyGospelLoading(false);
      return;
    }
    setDailyGospel(data);
    setDailyGospelMessage('');
    setDailyGospelLoading(false);
  }

  function startHomeNewsEdit(item: HomeFeedItem) {
    if (!isRemoteNewsItem(item)) {
      return;
    }
    setHomeEditId(item.id);
    setHomeEditTitle(item.title);
    setHomeEditBody(item.body);
    setHomeEditImage(item.imageUrl ?? '');
    setHomeActionMessage('');
  }

  async function uploadHomeNewsImage() {
    if (!homeEditId) {
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setHomeActionMessage('Necesito permiso para seleccionar una imagen.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.82
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    try {
      setHomeActionMessage('Subiendo imagen...');
      const publicUrl = await uploadPickedImageToPublicUrl(result.assets[0], 'news');
      setHomeEditImage(publicUrl);
      setHomeActionMessage('Imagen cargada. Tocá Guardar para aplicarla.');
    } catch (error) {
      setHomeActionMessage(error instanceof Error ? error.message : 'No se pudo subir la imagen.');
    }
  }

  async function saveHomeNewsEdit() {
    if (!homeEditId) {
      return;
    }
    if (!homeEditTitle.trim() || !homeEditBody.trim()) {
      setHomeActionMessage('Completa titulo y contenido.');
      return;
    }
    const { error } = await updateNewsEntry({
      id: homeEditId,
      title: homeEditTitle.trim(),
      body: homeEditBody.trim(),
      imageUrl: homeEditImage.trim() || null
    });
    if (error) {
      setHomeActionMessage(error.message);
      return;
    }
    setHomeEditId(null);
    setHomeEditTitle('');
    setHomeEditBody('');
    setHomeEditImage('');
    setHomeActionMessage(changeDone('Cambios realizados'));
    setHomeRefreshKey((current) => current + 1);
  }

  async function removeHomeNews(item: HomeFeedItem) {
    if (!isRemoteNewsItem(item)) {
      return;
    }
    const confirmed = Platform.OS === 'web'
      ? (typeof window === 'undefined' ? true : window.confirm('¿Seguro que deseas eliminar esta publicacion de Inicio?'))
      : await new Promise<boolean>((resolve) => {
        Alert.alert('Eliminar publicacion', '¿Seguro que deseas eliminar esta publicacion de Inicio?', [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) }
        ]);
      });
    if (!confirmed) {
      return;
    }
    const { error } = await archiveNewsEntry(item.id);
    if (error) {
      setHomeActionMessage(error.message);
      return;
    }
    setHomeActionMessage(changeDone('Cambios realizados'));
    setHomeRefreshKey((current) => current + 1);
  }

  return (
    <View style={styles.stack}>
      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <Text style={styles.kicker}>Argentina</Text>
        <Text style={styles.heroTitle}>
          {greeting && greetingName && greeting.includes(greetingName) ? (
            <>
              {greeting.split(greetingName)[0]}
              <Text style={[styles.heroGreetingName, { color: greetingNameColor }]}>{greetingName}</Text>
              {greeting.split(greetingName).slice(1).join(greetingName)}
            </>
          ) : greeting || adminConfig.home.heroTitle}
        </Text>
        <Text style={styles.heroText}>{adminConfig.home.heroText}</Text>
      </View>

      <EditableIntro content={content} editor={editor} />

      {homeTiles.length > 0 ? <SectionTitle title="Accesos rápidos" /> : null}
      {homeTiles.length > 0 ? <View style={styles.homeTileGrid}>
        {homeTiles.map((tile) => (
          <TouchableOpacity key={tile.tab} style={styles.homeTile} activeOpacity={0.88} onPress={() => onNavigate(tile.tab)}>
            <View style={[styles.homeTileIcon, { backgroundColor: tile.color }]}>
              <Ionicons name={tile.icon} size={25} color={palette.white} />
            </View>
            <Text style={[styles.homeTileTitle, isDark && styles.textDarkStrong]}>{tile.title}</Text>
            <Text style={[styles.homeTileMeta, isDark && styles.textDarkMuted]}>{tile.meta}</Text>
          </TouchableOpacity>
        ))}
      </View> : null}

      {dashboardStats.length > 0 ? <SectionTitle title="Resumen" /> : null}
      {dashboardStats.length > 0 ? <View style={styles.dashboardStrip}>
        {dashboardStats.map((item) => (
          <View key={item.label} style={[styles.dashboardStat, isDark && styles.surfaceCardDark]}>
            <Ionicons name={item.icon} size={18} color={isDark ? themePresets.dark.colors.secondary : palette.red} />
            <Text style={[styles.dashboardValue, isDark && styles.textDarkStrong]}>{item.value}</Text>
            <Text style={[styles.dashboardLabel, isDark && styles.textDarkMuted]}>{item.label}</Text>
          </View>
        ))}
      </View> : null}

      {adminConfig.gospel.enabled ? (
        <TouchableOpacity style={[styles.gospelButton, { backgroundColor: identityButtonColor, shadowColor: identityButtonColor }]} activeOpacity={0.88} onPress={() => setGospelModalVisible(true)}>
          <Ionicons name="book-outline" size={22} color={palette.white} />
          <View style={styles.instagramButtonText}>
            <Text style={styles.instagramButtonTitle}>Evangelio del Dia</Text>
            <Text style={styles.instagramButtonMeta}>{adminConfig.gospel.title || 'Lectura diaria'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={palette.white} />
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity style={styles.instagramButton} activeOpacity={0.88} onPress={() => Linking.openURL(instagramUrl)}>
        <Ionicons name="logo-instagram" size={22} color={palette.white} />
        <View style={styles.instagramButtonText}>
          <Text style={styles.instagramButtonTitle}>Instagram Palestrista</Text>
          <Text style={styles.instagramButtonMeta}>{instagramLabel}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={palette.white} />
      </TouchableOpacity>

      <Modal visible={gospelModalVisible} transparent animationType="fade" onRequestClose={() => setGospelModalVisible(false)} statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalPanel, isDark && styles.surfacePanelDark]}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setGospelModalVisible(false)}>
              <Ionicons name="close-outline" size={22} color={palette.red} />
            </TouchableOpacity>
            <ScrollView style={styles.gospelModalScroll} contentContainerStyle={styles.gospelModalContent} nestedScrollEnabled>
              <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Evangelio del Dia</Text>
              <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{dailyGospel?.title || adminConfig.gospel.title || 'Evangelio del Dia'}</Text>
              {dailyGospel?.citation ? <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{dailyGospel.citation}</Text> : null}
              {dailyGospel?.gospel_text ? (
                <LinkedSelectableText text={dailyGospel.gospel_text} style={[styles.cardText, styles.gospelText, isDark && styles.textDarkBody]} linkStyle={styles.linkText} />
              ) : adminConfig.gospel.body ? (
                <LinkedSelectableText text={adminConfig.gospel.body} style={[styles.cardText, styles.gospelText, isDark && styles.textDarkBody]} linkStyle={styles.linkText} />
              ) : (
                <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{dailyGospelLoading ? 'Cargando Evangelio automatico...' : 'No hay evangelio cargado todavia.'}</Text>
              )}
              {dailyGospelMessage ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{dailyGospelMessage}</Text> : null}
              {dailyGospel?.reflection_text ? (
                <>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => setGospelReflectionOpen((current) => !current)}>
                    <Ionicons name={gospelReflectionOpen ? 'chevron-up-outline' : 'sparkles-outline'} size={17} color={palette.red} />
                    <Text style={styles.secondaryButtonText}>{gospelReflectionOpen ? 'Ocultar reflexion' : 'Reflexion'}</Text>
                  </TouchableOpacity>
                  {gospelReflectionOpen ? (
                    <View style={[styles.notice, isDark && styles.surfaceRowDark]}>
                      <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{dailyGospel.reflection_title || 'Reflexion'}</Text>
                      <LinkedSelectableText text={dailyGospel.reflection_text} style={[styles.cardText, isDark && styles.textDarkBody]} linkStyle={styles.linkText} />
                    </View>
                  ) : null}
                </>
              ) : null}
              <View style={styles.compactToolRow}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => loadDailyGospel(true)} disabled={dailyGospelLoading}>
                  <Ionicons name="refresh-outline" size={17} color={palette.red} />
                  <Text style={styles.secondaryButtonText}>{dailyGospelLoading ? 'Actualizando' : 'Actualizar'}</Text>
                </TouchableOpacity>
                {(dailyGospel?.source_url || adminConfig.gospel.sourceUrl) ? (
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => Linking.openURL(dailyGospel?.source_url || adminConfig.gospel.sourceUrl)}>
                    <Ionicons name="open-outline" size={17} color={palette.red} />
                    <Text style={styles.secondaryButtonText}>Fuente</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>Fuente: {dailyGospel?.source_name || 'Don Bosco Argentina'}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {homeModuleEnabled('agenda') ? <SectionTitle title="Agenda comunitaria" /> : null}
      {homeModuleEnabled('agenda') ? <View style={[styles.featurePanel, isDark && styles.surfacePanelDark]}>
        <View style={styles.featurePanelHeader}>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Proximamente</Text>
          <TouchableOpacity style={[styles.iconButton, styles.viewAllButton]} activeOpacity={0.8} onPress={() => onNavigate('notilestra')}>
            <Text style={styles.linkText}>Ver todas</Text>
          </TouchableOpacity>
        </View>
        {communityAgenda.slice(0, 3).map((item, index) => (
          <View key={`${item.title}-${index}`} style={[styles.miniEventRow, isDark && styles.surfaceRowDark]}>
            <View style={styles.miniEventDate}>
              <Text style={styles.miniEventDay}>{new Date(`${'date' in item ? item.date : item.eventDate}T00:00:00`).getDate()}</Text>
              <Text style={styles.miniEventMonth}>{new Date(`${'date' in item ? item.date : item.eventDate}T00:00:00`).toLocaleDateString('es-AR', { month: 'short' })}</Text>
            </View>
            <View style={styles.miniEventBody}>
              <Text style={[styles.miniEventTitle, isDark && styles.textDarkStrong]}>{item.title}</Text>
              <Text style={[styles.miniEventScope, isDark && styles.textDarkMuted]}>{item.scope}</Text>
            </View>
          </View>
        ))}
        {communityAgenda.length === 0 ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>No hay fechas comunitarias cargadas en Supabase.</Text> : null}
      </View> : null}

      {homeModuleEnabled('noticias') ? <SectionTitle title="Info Palestrista" /> : null}
      {homeModuleEnabled('noticias') && homeActionMessage ? <Text style={styles.noticeText}>{homeActionMessage}</Text> : null}
      {homeModuleEnabled('noticias') ? visibleHomeNews.map((item, index) => (
        <TouchableOpacity key={`${item.title}-${index}`} style={[styles.card, styles.feedCard, isDark && styles.feedCardDark]} activeOpacity={0.86} onPress={() => {
          if (!(homeEditId && isRemoteNewsItem(item) && item.id === homeEditId)) {
            setExpandedNews(expandedNews === item.title ? null : item.title);
          }
        }}>
          <View style={styles.feedHeader}>
            <View style={styles.feedAvatar}>
              <Ionicons name="sparkles-outline" size={18} color={palette.red} />
            </View>
            <View style={styles.feedHeaderText}>
              <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{item.scope}</Text>
              <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>Comunidad Palestra</Text>
            </View>
          </View>
          {homeEditId && isRemoteNewsItem(item) && item.id === homeEditId ? (
            <View style={styles.stackSmall}>
              <TextInput style={styles.input} placeholder="Titulo de la publicacion" value={homeEditTitle} onChangeText={setHomeEditTitle} placeholderTextColor={inputPlaceholderColor} />
              <TextInput style={[styles.input, styles.textArea]} placeholder="Contenido completo" value={homeEditBody} onChangeText={setHomeEditBody} multiline placeholderTextColor={inputPlaceholderColor} />
              <TextInput style={styles.input} placeholder="URL de imagen opcional" value={homeEditImage} onChangeText={setHomeEditImage} autoCapitalize="none" placeholderTextColor={inputPlaceholderColor} />
              {homeEditImage ? <Image source={{ uri: homeEditImage }} style={styles.cardImage} /> : null}
              <View style={styles.inlineActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={uploadHomeNewsImage}>
                  <Ionicons name="image-outline" size={16} color={palette.red} />
                  <Text style={styles.secondaryButtonText}>Subir imagen</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setHomeEditImage('')}>
                  <Ionicons name="close-circle-outline" size={16} color={palette.red} />
                  <Text style={styles.secondaryButtonText}>Quitar imagen</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inlineActions}>
                <TouchableOpacity style={styles.primaryButton} onPress={saveHomeNewsEdit}>
                  <Text style={styles.primaryButtonText}>Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => { setHomeEditId(null); setHomeEditImage(''); }}>
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{item.title}</Text>
              <LinkedSelectableText
                text={item.body}
                style={[styles.cardText, isDark && styles.textDarkBody]}
                linkStyle={[styles.inlineLinkText, isDark && styles.textDarkAccent]}
                numberOfLines={expandedNews === item.title ? undefined : 2}
              />
            </>
          )}
          {expandedNews === item.title && item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.cardImage} /> : null}
          {canManageHomeEntries && isRemoteNewsItem(item) ? (
            <View style={styles.inlineActions}>
              <TouchableOpacity style={styles.actionPill} onPress={() => startHomeNewsEdit(item)}>
                <Ionicons name="create-outline" size={16} color={palette.red} />
                <Text style={styles.actionPillText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionPill} onPress={() => removeHomeNews(item)}>
                <Ionicons name="trash-outline" size={16} color={palette.red} />
                <Text style={styles.actionPillText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <View style={styles.feedFooter}>
            <Text style={[styles.expandHint, isDark && styles.textDarkAccent]}>{expandedNews === item.title ? 'Tocar para contraer' : 'Tocar para leer mas'}</Text>
            <Ionicons name={expandedNews === item.title ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
          </View>
        </TouchableOpacity>
      )) : null}

      {!canAccessPrivate(session) ? (
        <View style={styles.notice}>
          <Ionicons name="lock-closed-outline" size={20} color={palette.red} />
          <Text style={styles.noticeText}>Algunas secciones requieren registro y aprobación de un coordinador.</Text>
        </View>
      ) : null}
    </View>
  );
}
