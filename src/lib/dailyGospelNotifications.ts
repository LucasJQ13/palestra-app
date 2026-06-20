import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  DAILY_GOSPEL_NOTIFICATION_CHANNEL_ID,
  DAILY_GOSPEL_NOTIFICATION_HOUR,
  DAILY_GOSPEL_NOTIFICATION_MINUTE
} from './constants';
import { DailyGospelRecord } from './dailyGospel';

const DAILY_GOSPEL_NOTIFICATION_KIND = 'daily-gospel';
const DAILY_GOSPEL_NOTIFICATION_TITLE = 'Evangelio del día';
const DAILY_GOSPEL_NOTIFICATION_PREFIX = 'Hey Recordá leer el evangelio de hoy!';
const DAILY_GOSPEL_NOTIFICATION_FALLBACK = `${DAILY_GOSPEL_NOTIFICATION_PREFIX} Abrí la app y leé el texto completo.`;
const MIN_FRAGMENT_LENGTH = 32;
const MAX_FRAGMENT_LENGTH = 128;

type DailyGospelNotificationResult = {
  status: 'scheduled' | 'unchanged' | 'permission-denied' | 'web';
  identifier: string | null;
  usedFallback: boolean;
};

let scheduleQueue: Promise<void> = Promise.resolve();

function normalizeGospelText(text?: string | null) {
  return (text ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeFragment(value: string) {
  return value
    .trim()
    .replace(/^[\s\-–—"“”«»]+/, '')
    .replace(/[\s"“”«»]+$/, '')
    .trim();
}

function fragmentScore(fragment: string) {
  const normalized = fragment.toLocaleLowerCase('es-AR');
  const inspirationalTerms = [
    'jesús',
    'señor',
    'dios',
    'amor',
    'fe',
    'vida',
    'paz',
    'perdón',
    'padre',
    'reino',
    'sígueme',
    'bienaventurados'
  ];
  const termScore = inspirationalTerms.reduce((score, term) => score + (normalized.includes(term) ? 2 : 0), 0);
  const quoteScore = /["“”«»]/.test(fragment) ? 2 : 0;
  const lengthScore = fragment.length >= 48 && fragment.length <= 110 ? 2 : 0;
  const introPenalty = normalized.startsWith('lectura del santo evangelio') || normalized.startsWith('evangelio según') ? 8 : 0;
  const closingPenalty = normalized.includes('palabra del señor') ? 8 : 0;
  return termScore + quoteScore + lengthScore - introPenalty - closingPenalty;
}

export function selectDailyGospelNotificationFragment(text?: string | null) {
  const normalized = normalizeGospelText(text);
  if (!normalized) {
    return null;
  }

  const candidates = (normalized.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) ?? [])
    .map(normalizeFragment)
    .filter((fragment) => fragment.length >= MIN_FRAGMENT_LENGTH && fragment.length <= MAX_FRAGMENT_LENGTH)
    .filter((fragment) => {
      const value = fragment.toLocaleLowerCase('es-AR');
      return !value.startsWith('lectura del santo evangelio')
        && !value.startsWith('evangelio según')
        && !value.includes('palabra del señor');
    });

  return candidates
    .map((fragment, index) => ({ fragment, index, score: fragmentScore(fragment) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)[0]?.fragment ?? null;
}

export function buildDailyGospelNotificationBody(gospel?: DailyGospelRecord | null) {
  const fragment = selectDailyGospelNotificationFragment(gospel?.gospel_text);
  return fragment ? `${DAILY_GOSPEL_NOTIFICATION_PREFIX} “${fragment}”` : DAILY_GOSPEL_NOTIFICATION_FALLBACK;
}

function isDailyGospelRequest(request: Notifications.NotificationRequest) {
  return request.content.data?.notificationKind === DAILY_GOSPEL_NOTIFICATION_KIND;
}

async function cancelRequests(requests: Notifications.NotificationRequest[]) {
  await Promise.all(requests.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)));
}

export async function cancelDailyGospelNotification() {
  if (Platform.OS === 'web') {
    return;
  }
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await cancelRequests(scheduled.filter(isDailyGospelRequest));
}

async function reconcileDailyGospelNotification(gospel?: DailyGospelRecord | null): Promise<DailyGospelNotificationResult> {
  const body = buildDailyGospelNotificationBody(gospel);
  const usedFallback = body === DAILY_GOSPEL_NOTIFICATION_FALLBACK;
  if (Platform.OS === 'web') {
    return { status: 'web', identifier: null, usedFallback };
  }

  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') {
    await cancelDailyGospelNotification();
    return { status: 'permission-denied', identifier: null, usedFallback };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(DAILY_GOSPEL_NOTIFICATION_CHANNEL_ID, {
      name: 'Evangelio diario',
      description: 'Recordatorio diario para leer el Evangelio del día.',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: '#2d8dc8',
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
    });
  }

  const gospelDate = gospel?.date ?? 'fallback';
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const existing = scheduled.filter(isDailyGospelRequest);
  const matching = existing.find((request) => {
    const trigger = request.trigger as { type?: string; hour?: number; minute?: number };
    const dailyTrigger = trigger.type === Notifications.SchedulableTriggerInputTypes.DAILY
      || trigger.type === Notifications.SchedulableTriggerInputTypes.CALENDAR;
    return request.content.body === body
      && request.content.data?.gospelDate === gospelDate
      && dailyTrigger
      && trigger.hour === DAILY_GOSPEL_NOTIFICATION_HOUR
      && trigger.minute === DAILY_GOSPEL_NOTIFICATION_MINUTE;
  });

  if (matching && existing.length === 1) {
    return { status: 'unchanged', identifier: matching.identifier, usedFallback };
  }

  await cancelRequests(existing);
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: DAILY_GOSPEL_NOTIFICATION_TITLE,
      body,
      sound: 'default',
      data: {
        tabKey: 'inicio',
        action: 'open-daily-gospel',
        notificationKind: DAILY_GOSPEL_NOTIFICATION_KIND,
        gospelDate
      }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: DAILY_GOSPEL_NOTIFICATION_HOUR,
      minute: DAILY_GOSPEL_NOTIFICATION_MINUTE,
      channelId: Platform.OS === 'android' ? DAILY_GOSPEL_NOTIFICATION_CHANNEL_ID : undefined
    }
  });

  return { status: 'scheduled', identifier, usedFallback };
}

export function ensureDailyGospelNotification(gospel?: DailyGospelRecord | null) {
  const task = scheduleQueue.then(
    () => reconcileDailyGospelNotification(gospel),
    () => reconcileDailyGospelNotification(gospel)
  );
  scheduleQueue = task.then(() => undefined, () => undefined);
  return task;
}
