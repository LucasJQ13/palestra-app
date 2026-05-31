import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { RemoteAgendaItem } from './remoteData';
import { UserAgendaPreferenceRecord } from './profiles';
import { localReminderNotificationKey } from './constants';
import { hasPermission } from './sessionAccess';
import { Session } from '../types/auth';

export type AgendaItem = {
  title: string;
  date: string;
  scope: string;
  body: string;
} & Partial<Pick<RemoteAgendaItem, 'id' | 'source' | 'imageUrl' | 'mapUrl' | 'province' | 'dateGroupKey'>>;

export function agendaPreferenceKey(item: AgendaItem) {
  if (item.id) {
    return `${item.source ?? 'agenda'}:${item.id}`;
  }
  return `local:${item.date}:${item.title}`;
}

export function splitAgendaPreferences(records: UserAgendaPreferenceRecord[]) {
  return {
    favorites: records.filter((item) => item.preference_type === 'favorite').map((item) => item.item_key),
    reminders: records.filter((item) => item.preference_type === 'reminder').map((item) => item.item_key)
  };
}

export function reminderNotificationStorageKey(session: Session | null) {
  return `${localReminderNotificationKey}.${session?.id ?? session?.email ?? 'guest'}`;
}

export function reminderTriggerDate(item: AgendaItem) {
  const eventDate = new Date(`${item.date}T09:00:00`);
  if (Number.isNaN(eventDate.getTime())) {
    return null;
  }
  return eventDate;
}

export async function readReminderNotificationMap(session: Session | null): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(reminderNotificationStorageKey(session));
    return raw ? JSON.parse(raw) as Record<string, string> : {};
  } catch {
    return {};
  }
}

export async function writeReminderNotificationMap(session: Session | null, values: Record<string, string>) {
  await AsyncStorage.setItem(reminderNotificationStorageKey(session), JSON.stringify(values));
}

export async function scheduleLocalReminderNotification(session: Session | null, item: AgendaItem) {
  if (Platform.OS === 'web') {
    return null;
  }
  const triggerDate = reminderTriggerDate(item);
  if (!triggerDate || triggerDate.getTime() <= Date.now()) {
    return null;
  }

  const permission = await Notifications.getPermissionsAsync();
  let status = permission.status;
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Recordatorios',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2d8dc8',
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
    });
  }

  const itemKey = agendaPreferenceKey(item);
  const scheduled = await readReminderNotificationMap(session);
  if (scheduled[itemKey]) {
    await Notifications.cancelScheduledNotificationAsync(scheduled[itemKey]).catch(() => undefined);
  }
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: item.source === 'motivador' ? 'Recordatorio de PM' : 'Recordatorio Palestra',
      body: `${item.title} - ${new Date(`${item.date}T00:00:00`).toLocaleDateString('es-AR')}`,
      sound: 'default',
      data: {
        tabKey: item.source === 'motivador' ? 'periodo_motivador' : 'notilestra',
        sourceType: item.source ?? 'agenda',
        sourceId: item.id ?? itemKey
      }
    },
    trigger: {
      channelId: Platform.OS === 'android' ? 'reminders' : undefined,
      date: triggerDate
    } as Notifications.NotificationTriggerInput
  });
  await writeReminderNotificationMap(session, { ...scheduled, [itemKey]: notificationId });
  return notificationId;
}

export async function cancelLocalReminderNotification(session: Session | null, itemKey: string) {
  if (Platform.OS === 'web') {
    return;
  }
  const scheduled = await readReminderNotificationMap(session);
  const notificationId = scheduled[itemKey];
  if (notificationId) {
    await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => undefined);
  }
  const next = { ...scheduled };
  delete next[itemKey];
  await writeReminderNotificationMap(session, next);
}

export function groupMotivadorFeedItems(items: AgendaItem[]) {
  const grouped = new Map<string, AgendaItem>();
  const output: AgendaItem[] = [];

  items.forEach((item) => {
    if (item.source !== 'motivador') {
      output.push(item);
      return;
    }

    const groupKey = item.dateGroupKey ?? item.id ?? `${item.title}-${item.scope}`;
    const current = grouped.get(groupKey);
    if (!current) {
      const feedItem = { ...item, id: `${groupKey}-feed`, dateGroupKey: groupKey };
      grouped.set(groupKey, feedItem);
      output.push(feedItem);
      return;
    }

    if (Date.parse(item.date) < Date.parse(current.date)) {
      current.date = item.date;
    }
  });

  return output.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

export function notificationPermissionLabel(session: Session | null) {
  if (!session || (!hasPermission(session, 'enviar_notificaciones') && !['animador_comunidad', 'coordinador_comunidad'].includes(session.role))) {
    return 'La notificacion quedara disponible solo para roles con permiso de enviar notificaciones.';
  }
  return 'También se dejará preparada una notificación push para los usuarios alcanzados.';
}
