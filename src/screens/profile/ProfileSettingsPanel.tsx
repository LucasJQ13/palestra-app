import React from 'react';
import { Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme/palette';
import { AppTheme, ThemeName } from '../../theme/themes';
import { styles } from '../../theme/appStyles';
import { appRuntimeOwner, easProjectId, inputPlaceholderColor } from '../../lib/constants';
import { Session } from '../../types/auth';

export function ProfileSettingsPanel({
  session,
  isDark,
  themeName,
  appTheme,
  notificationPermissionStatus,
  showPushDiagnostics,
  pushTokenPreview,
  pushDebugInfo,
  pushChannelDebug,
  pushTestResult,
  newEmail,
  newPassword,
  authMessage,
  onThemeChange,
  onRequestNotifications,
  onNotificationsDisabled,
  onTogglePushDiagnostics,
  onSendLocalNotificationDebug,
  onSendRemotePushDebug,
  onNewEmailChange,
  onNewPasswordChange,
  onSaveAccountSettings
}: {
  session: Session;
  isDark: boolean;
  themeName: ThemeName;
  appTheme: AppTheme;
  notificationPermissionStatus: string;
  showPushDiagnostics: boolean;
  pushTokenPreview: string;
  pushDebugInfo: string;
  pushChannelDebug: string;
  pushTestResult: string;
  newEmail: string;
  newPassword: string;
  authMessage: string;
  onThemeChange: (theme: ThemeName) => Promise<void>;
  onRequestNotifications: () => void;
  onNotificationsDisabled: () => void;
  onTogglePushDiagnostics: (value: boolean) => void;
  onSendLocalNotificationDebug: () => void;
  onSendRemotePushDebug: () => void;
  onNewEmailChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onSaveAccountSettings: () => void;
}) {
  return (
    <View style={[styles.profileCommunityPanel, isDark && styles.surfacePanelDark]}>
      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Configuracion de usuario</Text>
      <View style={styles.settingRow}>
        <View style={styles.settingRowText}>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Modo dark</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Preferencia visual guardada en este dispositivo.</Text>
        </View>
        <Switch
          value={themeName === 'dark'}
          onValueChange={(enabled) => onThemeChange(enabled ? 'dark' : 'default')}
          trackColor={{ false: 'rgba(94, 131, 150, 0.22)', true: 'rgba(45, 141, 200, 0.36)' }}
          thumbColor={themeName === 'dark' ? palette.red : palette.white}
        />
      </View>
      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Tema activo: {appTheme.name === 'dark' ? 'Oscuro' : 'Predeterminado'}.</Text>
      <View style={styles.settingRow}>
        <View style={styles.settingRowText}>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Permitir notificaciones</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Estado actual: {notificationPermissionStatus}. Activa este dispositivo para recibir avisos importantes.</Text>
        </View>
        <Switch
          value={notificationPermissionStatus === 'granted'}
          onValueChange={(enabled) => {
            if (enabled) {
              onRequestNotifications();
            } else {
              onNotificationsDisabled();
            }
          }}
          trackColor={{ false: 'rgba(94, 131, 150, 0.22)', true: 'rgba(45, 141, 200, 0.36)' }}
          thumbColor={notificationPermissionStatus === 'granted' ? palette.red : palette.white}
        />
      </View>
      {session.role === 'administrador' ? (
        <View style={[styles.inlineEditorPanel, isDark && styles.surfacePanelDark]}>
          <View style={styles.settingRow}>
            <View style={styles.settingRowText}>
              <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Diagnostico de notificaciones</Text>
              <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Herramientas tecnicas visibles solo para Administrador.</Text>
            </View>
            <Switch value={showPushDiagnostics} onValueChange={onTogglePushDiagnostics} />
          </View>
          {showPushDiagnostics ? (
            <>
              {pushTokenPreview ? <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>Token registrado: {pushTokenPreview}</Text> : null}
              <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>Runtime: {appRuntimeOwner} - ProjectId: {easProjectId}</Text>
              {pushDebugInfo ? <Text selectable style={[styles.feedMeta, isDark && styles.textDarkMuted]}>{pushDebugInfo}</Text> : null}
              {pushChannelDebug ? (
                <>
                  <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Canales Android</Text>
                  <Text selectable style={[styles.feedMeta, isDark && styles.textDarkMuted]}>{pushChannelDebug}</Text>
                </>
              ) : null}
              <TouchableOpacity style={[styles.secondaryButton, isDark && styles.darkSoftButton]} onPress={onSendLocalNotificationDebug}>
                <Ionicons name="phone-portrait-outline" size={17} color={palette.red} />
                <Text style={[styles.secondaryButtonText, isDark && styles.textDarkAccent]}>Probar canal local Android</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={onSendRemotePushDebug}>
                <Ionicons name="notifications-outline" size={17} color={palette.white} />
                <Text style={styles.primaryButtonText}>Enviar notificacion de prueba a este dispositivo</Text>
              </TouchableOpacity>
              {pushTestResult ? <Text selectable style={[styles.feedMeta, isDark && styles.textDarkMuted]}>{pushTestResult}</Text> : null}
            </>
          ) : null}
        </View>
      ) : null}
      <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Nuevo mail" value={newEmail} onChangeText={onNewEmailChange} autoCapitalize="none" placeholderTextColor={inputPlaceholderColor} />
      <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Nueva contrasena" value={newPassword} onChangeText={onNewPasswordChange} secureTextEntry placeholderTextColor={inputPlaceholderColor} />
      <TouchableOpacity style={styles.primaryButton} onPress={onSaveAccountSettings}>
        <Text style={styles.primaryButtonText}>Guardar ajustes</Text>
      </TouchableOpacity>
      {authMessage ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{authMessage}</Text> : null}
    </View>
  );
}
