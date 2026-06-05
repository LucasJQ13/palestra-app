import Constants from 'expo-constants';

export const palestraLogo = require('../../assets/logo-palestra.png');
export const provinceLogos: Record<string, any> = {
  Salta: require('../../assets/logo-provincia-salta.png'),
  Jujuy: require('../../assets/logo-provincia-jujuy.png'),
  Tucuman: require('../../assets/logo-provincia-tucuman.png'),
  Catamarca: require('../../assets/logo-provincia-catamarca.png'),
  Cordoba: require('../../assets/logo-provincia-cordoba.png'),
  'San Luis': require('../../assets/logo-provincia-san-luis.png')
};
export const provinceDisplayNames: Record<string, string> = {
  Cordoba: 'Córdoba',
  Tucuman: 'Tucumán',
  Catamarca: 'Catamarca',
  Salta: 'Salta',
  Jujuy: 'Jujuy',
  'San Luis': 'San Luis'
};
export const appBetaVersion = '0.1.38';
export const appStageLabel = 'BETA';
export const appVersionLabel = `${appStageLabel} ${appBetaVersion}`;
export const authDeepLinkBaseUrl = 'palestra://auth/callback';
export const authConfirmedPreviewUrl = `${authDeepLinkBaseUrl}?preview=mail-confirmed`;
export const authPasswordResetUrl = `${authDeepLinkBaseUrl}?flow=password-reset`;
export const touchPointerPreferenceKey = 'palestra.showTouchPointer';
export const themePreferenceKey = 'palestra.themePreference';
export const pushDeviceIdKey = 'palestra.push.deviceId';
export const localReminderNotificationKey = 'palestra.localReminderNotifications';
export const inputPlaceholderColor = '#5E8396';
export const currentYear = new Date().getFullYear();
export const perseveranceStartYears = Array.from({ length: currentYear - 1961 + 1 }, (_, index) => String(currentYear - index));
export const officialInstagramUrl = 'https://www.instagram.com/infopalestra.argentina?igsh=MXB2aGcwZG9qeGpvOA==';
export const defaultDesignerCreditUrl = 'https://www.instagram.com/ampertech.ar?igsh=MW5oZGRqZWZzaHBzNw==';
export const easProjectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? 'sin-project-id';
export const appRuntimeOwner = String((Constants as any).appOwnership ?? (Constants as any).executionEnvironment ?? 'standalone');
export const defaultProvinceInstagram: Record<string, string> = {
  Cordoba: 'https://www.instagram.com/infopalestra.cordoba?igsh=MXd2aTcwcmo4bzEwZw==',
  Catamarca: 'https://www.instagram.com/infopalestra.catamarca?igsh=MTB6ZXd0YWo1em4xdg==',
  Salta: 'https://www.instagram.com/palestrasaltaoficial?igsh=cGljYW51ajdqbTFn',
  'San Luis': 'https://www.instagram.com/infopalestra.sanluis?igsh=ZmJyZ2M0N2p5MDhv',
  Jujuy: 'https://www.instagram.com/infopalestra.jujuy?igsh=eGI4bnYyMnNlNXZn',
  Tucuman: 'https://www.instagram.com/infopalestra.tucuman?igsh=MTE5YzNqbXN1ZXdrag=='
};
