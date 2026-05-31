import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Image, Linking, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calendarActivities, notilestra } from '../data/content';
import { RemoteAgendaItem, fetchMotivadorPeriods, fetchNotilestra, updateAgendaEvent, archiveAgendaEvent } from '../lib/remoteData';
import { AppContentBlock, UserAgendaPreferenceRecord, fetchUserAgendaPreferences, setUserAgendaPreference } from '../lib/profiles';
import { PageEditorProps } from '../lib/navigationConstants';
import { AppAdminConfig } from '../lib/appConfig';
import { AppRuntimeConfig } from '../lib/runtimeConfig';
import { ExternalCatholicNewsItem, fetchExternalCatholicNews } from '../lib/externalNews';
import { canManageNationalPublishedContent, hasPermission } from '../lib/sessionAccess';
import { fallbackContentKey } from '../lib/contentBlocks';
import { changeDone } from '../lib/appMessages';
import { AgendaItem, agendaPreferenceKey, cancelLocalReminderNotification, groupMotivadorFeedItems, readReminderNotificationMap, scheduleLocalReminderNotification, splitAgendaPreferences } from '../lib/agendaHelpers';
import { Permission, Session } from '../types/auth';
import { EditableIntro } from '../components/EditableIntro';
import { ExternalNewsCarousel } from '../components/ExternalNewsCarousel';
import { LinkedSelectableText } from '../components/LinkedSelectableText';
import { SectionTitle } from '../components/SectionTitle';
import { useIsDarkTheme } from '../theme/ThemeContext';
import { palette } from '../theme/palette';
import { themePresets } from '../theme/themes';
import { inputPlaceholderColor } from '../lib/constants';
import { styles } from '../theme/appStyles';

type NotilestraItem = (typeof notilestra)[number];

export function NotilestraScreen({ session, title, content, refreshKey, editor, adminConfig, runtimeConfig }: { session: Session | null; title: string; content?: AppContentBlock; refreshKey: number; editor?: PageEditorProps; adminConfig: AppAdminConfig; runtimeConfig: AppRuntimeConfig }) {
  const isDark = useIsDarkTheme();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [selectedCalendarItems, setSelectedCalendarItems] = useState<Array<{ date: string; title: string; body?: string; imageUrl?: string; scope?: string; mapUrl?: string }>>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [reminders, setReminders] = useState<string[]>([]);
  const [subtab, setSubtab] = useState<'noticias' | 'favoritos' | 'recordatorios'>('noticias');
  const [notilestraItems, setNotilestraItems] = useState<AgendaItem[]>(notilestra);
  const [externalNews, setExternalNews] = useState<ExternalCatholicNewsItem[]>([]);
  const [externalNewsLoading, setExternalNewsLoading] = useState(false);
  const [externalNewsError, setExternalNewsError] = useState<string | null>(null);
  const [notilestraRefreshKey, setNotilestraRefreshKey] = useState(0);
  const [notilestraEditId, setNotilestraEditId] = useState<string | null>(null);
  const [notilestraEditTitle, setNotilestraEditTitle] = useState('');
  const [notilestraEditBody, setNotilestraEditBody] = useState('');
  const [notilestraEditDate, setNotilestraEditDate] = useState('');
  const [notilestraActionMessage, setNotilestraActionMessage] = useState('');
  const canManageNotilestraEntries = canManageNationalPublishedContent(session);
  const [monthOffset, setMonthOffset] = useState(0);
  const preferenceStorageKey = useMemo(() => `palestra.notilestra.preferences.${session?.id ?? session?.email ?? 'guest'}`, [session?.id, session?.email]);
  const baseDate = new Date(2026, 4 + monthOffset, 1);
  const monthLabel = baseDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1).getDay();
  useEffect(() => {
    let alive = true;
    Promise.all([fetchNotilestra(session), fetchMotivadorPeriods(session)]).then(([items, pmItems]) => {
      if (alive) {
        setNotilestraItems([...items, ...pmItems].sort((a, b) => Date.parse(a.date) - Date.parse(b.date)));
      }
    });
    if (runtimeConfig.featureFlags.externalCatholicNews !== false && runtimeConfig.catholicNews.enabled) {
      setExternalNewsLoading(true);
      setExternalNewsError(null);
      fetchExternalCatholicNews(runtimeConfig.catholicNews)
        .then((items) => {
          if (alive) {
            setExternalNews(items);
            setExternalNewsError(items.length === 0 ? 'No pudimos cargar noticias externas en este momento.' : null);
          }
        })
        .catch(() => {
          if (alive) {
            setExternalNews([]);
            setExternalNewsError('No pudimos cargar noticias externas en este momento.');
          }
        })
        .finally(() => {
          if (alive) {
            setExternalNewsLoading(false);
          }
        });
    } else {
      setExternalNews([]);
      setExternalNewsError(null);
      setExternalNewsLoading(false);
    }
    return () => {
      alive = false;
    };
  }, [refreshKey, notilestraRefreshKey, session?.province, session?.role, runtimeConfig.featureFlags.externalCatholicNews, runtimeConfig.catholicNews]);

  useEffect(() => {
    let alive = true;

    async function loadPreferences() {
      try {
        const raw = await AsyncStorage.getItem(preferenceStorageKey);
        if (alive && raw) {
          const parsed = JSON.parse(raw) as { favorites?: string[]; reminders?: string[] };
          setFavorites(Array.isArray(parsed.favorites) ? parsed.favorites : []);
          setReminders(Array.isArray(parsed.reminders) ? parsed.reminders : []);
        }
      } catch (error) {
        console.error('load notilestra preferences', error);
      }

      if (!session?.id) {
        return;
      }
      const remotePreferences = await fetchUserAgendaPreferences();
      if (!alive || remotePreferences.length === 0) {
        return;
      }
      const next = splitAgendaPreferences(remotePreferences);
      setFavorites(next.favorites);
      setReminders(next.reminders);
      try {
        await AsyncStorage.setItem(preferenceStorageKey, JSON.stringify(next));
      } catch (error) {
        console.error('cache notilestra preferences', error);
      }
    }

    loadPreferences();
    return () => {
      alive = false;
    };
  }, [preferenceStorageKey, session?.id]);

  useEffect(() => {
    if (Platform.OS === 'web' || reminders.length === 0 || notilestraItems.length === 0) {
      return;
    }
    let alive = true;
    async function restoreScheduledReminders() {
      const scheduled = await readReminderNotificationMap(session);
      for (const item of groupMotivadorFeedItems(notilestraItems)) {
        if (!alive) {
          return;
        }
        const itemKey = agendaPreferenceKey(item);
        if (reminders.includes(itemKey) && !scheduled[itemKey]) {
          await scheduleLocalReminderNotification(session, item).catch((error) => console.error('restore reminder notification', error));
        }
      }
    }
    restoreScheduledReminders();
    return () => {
      alive = false;
    };
  }, [reminders, notilestraItems, session?.id]);

  const eventDays = notilestraItems
    .filter((item) => {
      const itemDate = new Date(`${item.date}T00:00:00`);
      return itemDate.getFullYear() === baseDate.getFullYear() && itemDate.getMonth() === baseDate.getMonth();
    })
    .map((item) => new Date(`${item.date}T00:00:00`).getDate());
  const calendarItemsByDay = useMemo(() => {
    const groups = new Map<number, AgendaItem[]>();
    notilestraItems.forEach((item) => {
      const itemDate = new Date(`${item.date}T00:00:00`);
      if (itemDate.getFullYear() !== baseDate.getFullYear() || itemDate.getMonth() !== baseDate.getMonth()) {
        return;
      }
      const day = itemDate.getDate();
      groups.set(day, [...(groups.get(day) ?? []), item]);
    });
    return groups;
  }, [notilestraItems, baseDate.getFullYear(), baseDate.getMonth()]);
  const hiddenFallbackContent = adminConfig.settings.hiddenFallbackContent ?? [];
  const activityDays = calendarActivities.filter((item) => {
    const itemDate = new Date(`${item.date}T00:00:00`);
    const canSee = !('requiredPermission' in item) || hasPermission(session, item.requiredPermission as Permission);
    const hidden = hiddenFallbackContent.includes(fallbackContentKey('calendario', item.title, item.date));
    return canSee && !hidden && itemDate.getFullYear() === baseDate.getFullYear() && itemDate.getMonth() === baseDate.getMonth();
  });
  const feedItems = useMemo(() => groupMotivadorFeedItems(notilestraItems), [notilestraItems]);
  const visibleFeedItems = feedItems.filter((item) => item.id || !hiddenFallbackContent.includes(fallbackContentKey('notilestra', item.title, item.date)));
  const favoriteItems = visibleFeedItems.filter((item) => favorites.includes(agendaPreferenceKey(item)));
  const reminderItems = visibleFeedItems.filter((item) => reminders.includes(agendaPreferenceKey(item)));
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
      .map((item) => ({ date: item.date, title: item.title, body: item.body, scope: item.scope, imageUrl: item.imageUrl, mapUrl: item.mapUrl }));
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

  async function persistNotilestraPreferences(nextFavorites: string[], nextReminders: string[]) {
    try {
      await AsyncStorage.setItem(preferenceStorageKey, JSON.stringify({ favorites: nextFavorites, reminders: nextReminders }));
    } catch (error) {
      console.error('save notilestra preferences', error);
    }
  }

  function toggleFavorite(item: AgendaItem) {
    const itemKey = agendaPreferenceKey(item);
    const enabled = !favorites.includes(itemKey);
    const nextFavorites = enabled ? [...favorites, itemKey] : favorites.filter((key) => key !== itemKey);
    setFavorites(nextFavorites);
    persistNotilestraPreferences(nextFavorites, reminders);
    if (session?.id) {
      setUserAgendaPreference({
        itemKey,
        preferenceType: 'favorite',
        enabled,
        itemTitle: item.title,
        itemDate: item.date,
        itemSource: item.source ?? 'local'
      }).catch((error) => console.error('remote favorite preference', error));
    }
  }

  async function toggleReminder(item: AgendaItem) {
    const itemKey = agendaPreferenceKey(item);
    const enabled = !reminders.includes(itemKey);
    const nextReminders = enabled ? [...reminders, itemKey] : reminders.filter((key) => key !== itemKey);
    setReminders(nextReminders);
    persistNotilestraPreferences(favorites, nextReminders);
    try {
      if (enabled) {
        const notificationId = await scheduleLocalReminderNotification(session, item);
        setNotilestraActionMessage(notificationId ? 'Recordatorio guardado y notificacion programada.' : 'Recordatorio guardado. No se pudo programar notificacion local para esta fecha/dispositivo.');
      } else {
        await cancelLocalReminderNotification(session, itemKey);
        setNotilestraActionMessage('Recordatorio eliminado y notificacion cancelada.');
      }
    } catch (error) {
      console.error('local reminder notification', error);
      setNotilestraActionMessage('Recordatorio guardado, pero no se pudo programar la notificacion local.');
    }
    if (session?.id) {
      setUserAgendaPreference({
        itemKey,
        preferenceType: 'reminder',
        enabled,
        itemTitle: item.title,
        itemDate: item.date,
        itemSource: item.source ?? 'local'
      }).catch((error) => console.error('remote reminder preference', error));
    }
  }

  function startNotilestraEdit(item: AgendaItem) {
    if (!item.id || item.source !== 'event') {
      return;
    }
    setNotilestraEditId(item.id);
    setNotilestraEditTitle(item.title);
    setNotilestraEditBody(item.body);
    setNotilestraEditDate(item.date);
    setNotilestraActionMessage('');
  }

  async function saveNotilestraEdit() {
    if (!notilestraEditId) {
      return;
    }
    if (!notilestraEditTitle.trim() || !notilestraEditBody.trim() || !notilestraEditDate.trim()) {
      setNotilestraActionMessage('Completa titulo, contenido y fecha.');
      return;
    }
    const { error } = await updateAgendaEvent({
      id: notilestraEditId,
      title: notilestraEditTitle.trim(),
      body: notilestraEditBody.trim(),
      startsAt: `${notilestraEditDate}T09:00:00-03:00`
    });
    if (error) {
      setNotilestraActionMessage(error.message);
      return;
    }
    setNotilestraEditId(null);
    setNotilestraEditTitle('');
    setNotilestraEditBody('');
    setNotilestraEditDate('');
    setNotilestraActionMessage(changeDone('Cambios realizados'));
    setNotilestraRefreshKey((current) => current + 1);
  }

  async function removeNotilestraItem(item: AgendaItem) {
    if (!item.id || item.source !== 'event') {
      return;
    }
    const confirmed = Platform.OS === 'web'
      ? (typeof window === 'undefined' ? true : window.confirm('¿Seguro que deseas eliminar esta entrada de Notilestra?'))
      : await new Promise<boolean>((resolve) => {
        Alert.alert('Eliminar entrada', '¿Seguro que deseas eliminar esta entrada de Notilestra?', [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) }
        ]);
      });
    if (!confirmed) {
      return;
    }
    const { error } = await archiveAgendaEvent(item.id);
    if (error) {
      setNotilestraActionMessage(error.message);
      return;
    }
    setNotilestraActionMessage(changeDone('Cambios realizados'));
    setNotilestraRefreshKey((current) => current + 1);
  }

  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      {notilestraActionMessage ? <Text style={styles.noticeText}>{notilestraActionMessage}</Text> : null}
      <Modal visible={dueReminderItems.length > 0 && !dismissedReminderPopup} transparent animationType="fade" onRequestClose={() => setDismissedReminderPopup(true)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalPanel, isDark && styles.surfacePanelDark]}>
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
      {subtab === 'noticias' && runtimeConfig.featureFlags.externalCatholicNews !== false && runtimeConfig.catholicNews.enabled ? (
        <ExternalNewsCarousel items={externalNews} loading={externalNewsLoading} error={externalNewsError} dark={isDark} />
      ) : null}
      <View style={[styles.calendarCard, isDark && styles.surfacePanelDark]}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => setMonthOffset(monthOffset - 1)} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={18} color={palette.red} />
          </TouchableOpacity>
          <Text style={[styles.calendarTitle, isDark && styles.textDarkStrong]}>{monthLabel}</Text>
          <TouchableOpacity onPress={() => setMonthOffset(monthOffset + 1)} style={styles.iconButton}>
            <Ionicons name="chevron-forward" size={18} color={palette.red} />
          </TouchableOpacity>
        </View>
        <View style={styles.calendarGrid}>
          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => <Text key={`${day}-${index}`} style={[styles.calendarWeekday, isDark && styles.textDarkMuted]}>{day}</Text>)}
          {Array.from({ length: firstDay }).map((_, index) => <View key={`empty-${index}`} style={styles.calendarDay} />)}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dayItems = calendarItemsByDay.get(day) ?? [];
            const hasEvent = eventDays.includes(day);
            const hasMotivador = dayItems.some((item) => item.source === 'motivador');
            const hasMultipleEvents = dayItems.length > 1;
            const activity = activityDays.find((item) => new Date(`${item.date}T00:00:00`).getDate() === day);
            const canOpenDay = hasEvent || Boolean(activity);
            return (
              <TouchableOpacity key={day} style={[styles.calendarDay, isDark && styles.calendarDayDark, hasEvent && styles.calendarEventDay, hasMotivador && styles.calendarMotivadorDay, activity && styles.calendarActivityDay]} activeOpacity={canOpenDay ? 0.75 : 1} onPress={() => canOpenDay && openCalendarDay(day)}>
                <Text style={[styles.calendarDayText, isDark && styles.textDarkBody, hasEvent && styles.calendarEventText, activity && styles.calendarActivityText]}>{day}</Text>
                {hasMultipleEvents ? <View style={styles.calendarMultiDot} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <Modal visible={selectedCalendarItems.length > 0} transparent animationType="fade" onRequestClose={() => setSelectedCalendarItems([])}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalPanel, isDark && styles.surfacePanelDark]}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setSelectedCalendarItems([])} activeOpacity={0.8}>
              <Ionicons name="close" size={22} color={palette.red} />
            </TouchableOpacity>
            <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{selectedCalendarItems[0]?.date}</Text>
            {selectedCalendarItems.map((item) => (
              <View key={`${item.date}-${item.title}`} style={styles.modalItem}>
                <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{item.scope ?? 'Notilestra'}</Text>
                <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{item.title}</Text>
                {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.cardImage} /> : null}
                {item.body ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{item.body}</Text> : null}
                {item.mapUrl ? (
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => Linking.openURL(item.mapUrl as string)}>
                    <Ionicons name="map-outline" size={17} color={palette.red} />
                    <Text style={styles.secondaryButtonText}>Abrir mapa</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      </Modal>
      {subtab === 'noticias' ? visibleFeedItems.map((item, index) => (
        <View key={`${item.title}-${index}`} style={[styles.card, styles.feedCard, isDark && styles.feedCardDark]}>
          <TouchableOpacity activeOpacity={0.86} onPress={() => {
            if (!(notilestraEditId && item.id === notilestraEditId)) {
              setExpandedItem(expandedItem === item.title ? null : item.title);
            }
          }}>
            <View style={styles.feedHeader}>
              <View style={styles.feedAvatar}>
                <Ionicons name="megaphone-outline" size={18} color={palette.red} />
              </View>
              <View style={styles.feedHeaderText}>
                <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{item.scope}</Text>
                <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>{new Date(`${item.date}T00:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              </View>
            </View>
            {notilestraEditId && item.id === notilestraEditId ? (
              <View style={styles.stackSmall}>
                <TextInput style={styles.input} placeholder="Titulo de la entrada" value={notilestraEditTitle} onChangeText={setNotilestraEditTitle} placeholderTextColor={inputPlaceholderColor} />
                <TextInput style={styles.input} placeholder="Fecha del evento (AAAA-MM-DD)" value={notilestraEditDate} onChangeText={setNotilestraEditDate} placeholderTextColor={inputPlaceholderColor} />
                <TextInput style={[styles.input, styles.textArea]} placeholder="Contenido completo" value={notilestraEditBody} onChangeText={setNotilestraEditBody} multiline placeholderTextColor={inputPlaceholderColor} />
                <View style={styles.inlineActions}>
                  <TouchableOpacity style={styles.primaryButton} onPress={saveNotilestraEdit}>
                    <Text style={styles.primaryButtonText}>Guardar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => setNotilestraEditId(null)}>
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
                  numberOfLines={expandedItem === item.title ? undefined : 2}
                />
              </>
            )}
          </TouchableOpacity>
          <View style={styles.inlineActions}>
            <TouchableOpacity style={[styles.actionPill, favorites.includes(agendaPreferenceKey(item)) && styles.actionPillActive]} onPress={() => toggleFavorite(item)}>
              <Ionicons name={favorites.includes(agendaPreferenceKey(item)) ? 'star' : 'star-outline'} size={16} color={favorites.includes(agendaPreferenceKey(item)) ? palette.white : palette.red} />
              <Text style={[styles.actionPillText, favorites.includes(agendaPreferenceKey(item)) && styles.actionPillTextActive]}>Favorito</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionPill, reminders.includes(agendaPreferenceKey(item)) && styles.actionPillActive]} onPress={() => toggleReminder(item)}>
              <Ionicons name={reminders.includes(agendaPreferenceKey(item)) ? 'notifications' : 'notifications-outline'} size={16} color={reminders.includes(agendaPreferenceKey(item)) ? palette.white : palette.red} />
              <Text style={[styles.actionPillText, reminders.includes(agendaPreferenceKey(item)) && styles.actionPillTextActive]}>Recordar</Text>
            </TouchableOpacity>
            {canManageNotilestraEntries && item.id && item.source === 'event' ? (
              <>
                <TouchableOpacity style={styles.actionPill} onPress={() => startNotilestraEdit(item)}>
                  <Ionicons name="create-outline" size={16} color={palette.red} />
                  <Text style={styles.actionPillText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionPill} onPress={() => removeNotilestraItem(item)}>
                  <Ionicons name="trash-outline" size={16} color={palette.red} />
                  <Text style={styles.actionPillText}>Eliminar</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      )) : null}
      {subtab === 'favoritos' ? <View style={styles.stack}>{favoriteItems.length > 0 ? favoriteItems.map((item, index) => (
        <View key={`${item.title}-${index}`} style={[styles.card, styles.feedCard, isDark && styles.feedCardDark]}>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{item.scope} - {item.date}</Text>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{item.title}</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{item.body}</Text>
        </View>
      )) : <View style={[styles.card, isDark && styles.surfaceCardDark]}><Text style={[styles.cardText, isDark && styles.textDarkBody]}>Todavia no marcaste favoritos.</Text></View>}</View> : null}
      {subtab === 'recordatorios' ? <View style={styles.stack}>{reminderItems.length > 0 ? reminderItems.map((item, index) => (
        <View key={`${item.title}-${index}`} style={[styles.card, styles.feedCard, isDark && styles.feedCardDark]}>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Recordatorio - {item.date}</Text>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{item.title}</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>La app mostrara un aviso interno 1 dia antes al abrir Notilestra.</Text>
        </View>
      )) : <View style={[styles.card, isDark && styles.surfaceCardDark]}><Text style={[styles.cardText, isDark && styles.textDarkBody]}>Todavia no marcaste recordatorios.</Text></View>}</View> : null}
    </View>
  );
}
