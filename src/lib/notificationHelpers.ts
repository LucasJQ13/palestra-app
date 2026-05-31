import { Platform, ToastAndroid } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '../types/auth';
import { appRuntimeOwner, appVersionLabel, easProjectId, pushDeviceIdKey } from './constants';
import { registerPushToken } from './profiles';

async function getPushDeviceId() {
  const current = await AsyncStorage.getItem(pushDeviceIdKey);
  if (current) {
    return current;
  }
  const next = `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(pushDeviceIdKey, next);
  return next;
}

type PushRegistrationResult = {
  status: string;
  token: string | null;
  projectId?: string;
  deviceId?: string | null;
  appRuntimeOwner?: string;
  saved?: boolean;
  error: string | null;
  technicalError?: string | null;
};

export function getTechnicalErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error ?? 'Error desconocido');
}

export function getFriendlyPushError(error: unknown) {
  const message = getTechnicalErrorMessage(error);
  if (
    message.includes('Default FirebaseApp is not initialized') ||
    message.includes('fcm-credentials') ||
    message.includes('google-services')
  ) {
    return 'No se pudo inicializar push remoto en esta APK. Revisá la configuración Firebase/FCM.';
  }
  return 'No se pudo activar push remoto en este dispositivo.';
}

export function notificationTitleFor(values: {
  notificationType: string;
  title: string;
  targetKind: string;
  targetValue?: string | null;
  province?: string | null;
  community?: string | null;
  sourceType?: string | null;
}) {
  if (values.notificationType.includes('privado')) {
    return 'Mensaje privado';
  }
  if (values.notificationType.includes('recordatorio') || values.sourceType === 'event') {
    return 'Recordatorio';
  }
  if (values.targetKind === 'comunidad') {
    return `Aviso comunitario · ${values.community || values.targetValue || 'Comunidad'}`;
  }
  if (values.targetKind === 'provincia') {
    return `Aviso provincial · ${values.province || values.targetValue || 'Provincia'}`;
  }
  return 'Aviso nacional · Palestra';
}

export async function requestAndRegisterPushToken(session: Session | null, requestPermission: boolean) {
  if (!session?.id) {
    return { status: 'missing-session', token: null, error: 'Iniciá sesión para activar notificaciones.', technicalError: null } satisfies PushRegistrationResult;
  }
  if (Platform.OS === 'web') {
    return { status: 'web', token: null, projectId: easProjectId, deviceId: null, appRuntimeOwner, saved: false, error: 'Las notificaciones push se prueban en celular.', technicalError: null } satisfies PushRegistrationResult;
  }

  const currentPermission = await Notifications.getPermissionsAsync();
  let finalStatus = currentPermission.status;
  if (requestPermission && currentPermission.status !== 'granted') {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermission.status;
  }
  if (finalStatus !== 'granted') {
    return { status: finalStatus, token: null, projectId: easProjectId, deviceId: null, appRuntimeOwner, saved: false, error: 'Permiso de notificaciones no habilitado.', technicalError: null } satisfies PushRegistrationResult;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Palestra',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2d8dc8',
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
    });
  }

  const projectId = easProjectId;
  let tokenResult: Notifications.ExpoPushToken;
  try {
    tokenResult = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  } catch (error) {
    return {
      status: 'push-config-error',
      token: null,
      projectId,
      deviceId: null,
      appRuntimeOwner,
      saved: false,
      error: getFriendlyPushError(error),
      technicalError: getTechnicalErrorMessage(error)
    } satisfies PushRegistrationResult;
  }
  const deviceId = await getPushDeviceId();
  const { error } = await registerPushToken({
    token: tokenResult.data,
    platform: Platform.OS,
    deviceId,
    deviceName: appRuntimeOwner,
    appVersion: `${appVersionLabel} - ${appRuntimeOwner}`,
    isActive: true
  });
  if (error) {
    return { status: 'error', token: tokenResult.data, projectId, deviceId, appRuntimeOwner, saved: false, error: error.message, technicalError: error.message } satisfies PushRegistrationResult;
  }
  return { status: 'granted', token: tokenResult.data, projectId, deviceId, appRuntimeOwner, saved: true, error: null, technicalError: null } satisfies PushRegistrationResult;
}

export function showFeedbackMessage(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
}

export async function getAndroidChannelDebug() {
  if (Platform.OS !== 'android') {
    return 'No aplica: plataforma no Android.';
  }
  try {
    const channels = await Notifications.getNotificationChannelsAsync();
    return JSON.stringify(channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      importance: channel.importance,
      sound: channel.sound,
      vibrationPattern: channel.vibrationPattern,
      lockscreenVisibility: channel.lockscreenVisibility
    })), null, 2);
  } catch (error) {
    return error instanceof Error ? error.message : 'No pude leer canales Android.';
  }
}
