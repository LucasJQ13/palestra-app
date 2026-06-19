import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';
import { inputPlaceholderColor } from '../../lib/constants';
import { AppAdminConfig } from '../../lib/appConfig';
import { APP_MESSAGES } from '../../lib/appMessages';
import { AppButton } from '../../components/ui';

export function IdentityAdminPanel({
  config,
  isDark,
  onPatch,
  onSave
}: {
  config: AppAdminConfig;
  isDark: boolean;
  onPatch: (patch: Partial<AppAdminConfig['identity']>) => void;
  onSave: () => void;
}) {
  return (
    <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
      <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{APP_MESSAGES.adminPanels.identity.title}</Text>
      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.adminPanels.identity.help}</Text>
      <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder={APP_MESSAGES.adminPanels.identity.appNamePlaceholder} value={config.identity.appName} onChangeText={(value) => onPatch({ appName: value })} placeholderTextColor={inputPlaceholderColor} />
      <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder={APP_MESSAGES.adminPanels.identity.subtitlePlaceholder} value={config.identity.subtitle} onChangeText={(value) => onPatch({ subtitle: value })} placeholderTextColor={inputPlaceholderColor} />
      <TextInput style={[styles.input, styles.textArea, isDark && styles.inputDark]} placeholder={APP_MESSAGES.adminPanels.identity.descriptionPlaceholder} value={config.identity.description} onChangeText={(value) => onPatch({ description: value })} multiline placeholderTextColor={inputPlaceholderColor} />
      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{APP_MESSAGES.adminPanels.identity.primaryColor(config.identity.primaryColor || '#2d8dc8')}</Text>
      <View style={styles.inlineActions}>
        <TextInput style={[styles.input, styles.colorInput, isDark && styles.inputDark]} placeholder="Principal #2d8dc8" value={config.identity.primaryColor} onChangeText={(value) => onPatch({ primaryColor: value })} placeholderTextColor={inputPlaceholderColor} />
        <TextInput style={[styles.input, styles.colorInput, isDark && styles.inputDark]} placeholder="Secundario #5da7db" value={config.identity.secondaryColor} onChangeText={(value) => onPatch({ secondaryColor: value })} placeholderTextColor={inputPlaceholderColor} />
      </View>
      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.adminPanels.identity.secondaryColorHelp(config.identity.secondaryColor || '#5da7db')}</Text>
      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{APP_MESSAGES.adminPanels.identity.textAndButton(config.identity.textColor || '#123245', config.identity.buttonColor || config.identity.primaryColor || '#2d8dc8')}</Text>
      <View style={styles.inlineActions}>
        <TextInput style={[styles.input, styles.colorInput, isDark && styles.inputDark]} placeholder="Texto #123245" value={config.identity.textColor ?? ''} onChangeText={(value) => onPatch({ textColor: value })} placeholderTextColor={inputPlaceholderColor} />
        <TextInput style={[styles.input, styles.colorInput, isDark && styles.inputDark]} placeholder="Boton #2d8dc8" value={config.identity.buttonColor ?? ''} onChangeText={(value) => onPatch({ buttonColor: value })} placeholderTextColor={inputPlaceholderColor} />
      </View>
      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{APP_MESSAGES.adminPanels.identity.greetingColor(config.identity.greetingNameColor || '#2fb66d')}</Text>
      <TextInput style={[styles.input, styles.colorInput, isDark && styles.inputDark]} placeholder="Nombre del saludo #2fb66d" value={config.identity.greetingNameColor ?? ''} onChangeText={(value) => onPatch({ greetingNameColor: value })} placeholderTextColor={inputPlaceholderColor} />
      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{APP_MESSAGES.adminPanels.identity.versionLegend}</Text>
      <View style={styles.inlineActions}>
        <TextInput style={[styles.input, styles.colorInput, isDark && styles.inputDark]} placeholder="Texto. Ej: BETA" value={config.identity.releaseLabel ?? ''} onChangeText={(value) => onPatch({ releaseLabel: value })} autoCapitalize="characters" placeholderTextColor={inputPlaceholderColor} />
        <TextInput style={[styles.input, styles.colorInput, isDark && styles.inputDark]} placeholder="Numero. Ej: 0.1.38" value={config.identity.releaseVersion ?? ''} onChangeText={(value) => onPatch({ releaseVersion: value })} placeholderTextColor={inputPlaceholderColor} />
      </View>
      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{APP_MESSAGES.adminPanels.identity.designerLink}</Text>
      <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Instagram o web de A-Tec" value={config.identity.designerCreditUrl ?? ''} onChangeText={(value) => onPatch({ designerCreditUrl: value })} autoCapitalize="none" placeholderTextColor={inputPlaceholderColor} />
      <View style={[styles.adminPreviewPane, isDark && styles.surfaceRowDark, { borderColor: config.identity.primaryColor || palette.red }]}>
        <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{APP_MESSAGES.adminPanels.identity.preview}</Text>
        <Text style={[styles.cardTitle, isDark && styles.textDarkStrong, { color: config.identity.primaryColor || palette.red }]}>{config.identity.appName}</Text>
        <Text style={[styles.cardText, isDark && styles.textDarkBody, { color: config.identity.secondaryColor || palette.blueDeep }]}>{config.identity.subtitle}</Text>
        <Text style={styles.versionBadge}>{`${config.identity.releaseLabel || 'BETA'} ${config.identity.releaseVersion || '0.1.38'}`}</Text>
        <Text style={[styles.cardText, isDark && styles.textDarkBody, { color: config.identity.textColor || palette.ink }]}>Texto de ejemplo</Text>
        <Text style={[styles.cardTitle, { color: config.identity.greetingNameColor || '#2fb66d' }]}>Lucas</Text>
        <Text style={[styles.designerCreditHomeText, isDark && styles.textDarkMuted]}>Diseñado por A-Tec Soluciones Integrales</Text>
        <View style={[styles.previewButtonSwatch, { backgroundColor: config.identity.buttonColor || config.identity.primaryColor || palette.red }]}>
          <Text style={styles.primaryButtonText}>Boton</Text>
        </View>
      </View>
      <AppButton label={APP_MESSAGES.adminPanels.identity.save} icon="save-outline" onPress={onSave} />
      <View style={styles.keyboardSafeSpacer} />
    </View>
  );
}
