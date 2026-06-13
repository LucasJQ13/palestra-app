import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from '../../theme/appStyles';
import { inputPlaceholderColor } from '../../lib/constants';
import { AppAdminConfig, defaultAdminConfig } from '../../lib/appConfig';
import { renderGreetingTemplate } from '../../lib/profileDisplay';
import { AppButton } from '../../components/ui';

const visibleModuleOptions = ['noticias', 'comunidades', 'materiales', 'foro', 'perfil', 'agenda', 'actividad'];
const quickAccessOptions = ['noticias', 'comunidades', 'materiales', 'foro', 'perfil'] as const;

export function HomeAdminPanel({
  config,
  isDark,
  onPatch,
  onToggleModule,
  onQuickLabelChange,
  onSave
}: {
  config: AppAdminConfig;
  isDark: boolean;
  onPatch: (patch: Partial<AppAdminConfig['home']>) => void;
  onToggleModule: (moduleKey: string) => void;
  onQuickLabelChange: (moduleKey: string, label: string) => void;
  onSave: () => void;
}) {
  return (
    <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
      <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Home</Text>
      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Control visual del panel inicial, accesos rápidos y secciones visibles.</Text>
      <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Titulo principal" value={config.home.heroTitle} onChangeText={(value) => onPatch({ heroTitle: value })} placeholderTextColor={inputPlaceholderColor} />
      <TextInput style={[styles.input, styles.textArea, isDark && styles.inputDark]} placeholder="Texto principal" value={config.home.heroText} onChangeText={(value) => onPatch({ heroText: value })} multiline placeholderTextColor={inputPlaceholderColor} />
      <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Banner destacado" value={config.home.featuredBanner} onChangeText={(value) => onPatch({ featuredBanner: value })} placeholderTextColor={inputPlaceholderColor} />
      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Saludo editable</Text>
      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Variables disponibles: {'{nombre}'}, {'{tratamiento}'}, {'{genero_bienvenida}'}, {'{rango}'}.</Text>
      <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Saludo masculino" value={config.home.greetingTemplateMale ?? defaultAdminConfig.home.greetingTemplateMale} onChangeText={(value) => onPatch({ greetingTemplateMale: value })} placeholderTextColor={inputPlaceholderColor} />
      <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Saludo femenino" value={config.home.greetingTemplateFemale ?? defaultAdminConfig.home.greetingTemplateFemale} onChangeText={(value) => onPatch({ greetingTemplateFemale: value })} placeholderTextColor={inputPlaceholderColor} />
      <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Saludo sin narrativa configurada" value={config.home.greetingTemplateNeutral ?? defaultAdminConfig.home.greetingTemplateNeutral} onChangeText={(value) => onPatch({ greetingTemplateNeutral: value })} placeholderTextColor={inputPlaceholderColor} />
      <View style={[styles.adminPreviewPane, isDark && styles.surfaceRowDark]}>
        <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Preview</Text>
        <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{renderGreetingTemplate(config.home.greetingTemplateMale, { nombre: 'Lucas', tratamiento: 'hno.', genero_bienvenida: 'Bienvenido', rango: 'Palestrista' }, 'Bienvenido hno. en Cristo Lucas, Oh Bella Ciao!')}</Text>
        <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{renderGreetingTemplate(config.home.greetingTemplateFemale, { nombre: 'Maria', tratamiento: 'hna.', genero_bienvenida: 'Bienvenida', rango: 'Palestrista' }, 'Bienvenida hna. en Cristo Maria, Oh Bella Ciao!')}</Text>
      </View>
      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Modulos visibles</Text>
      <View style={styles.filterRow}>
        {visibleModuleOptions.map((item, index) => (
          <TouchableOpacity key={`${item}-${index}`} style={[styles.filterChip, config.home.visibleModules.includes(item) && styles.filterChipActive]} onPress={() => onToggleModule(item)}>
            <Text style={[styles.filterChipText, config.home.visibleModules.includes(item) && styles.filterChipTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Nombres de accesos rápidos</Text>
      {quickAccessOptions.map((item) => (
        <TextInput
          key={`quick-${item}`}
          style={[styles.input, isDark && styles.inputDark]}
          placeholder={`Acceso ${item}`}
          value={config.home.quickAccessLabels?.[item] ?? ''}
          onChangeText={(value) => onQuickLabelChange(item, value)}
          placeholderTextColor={inputPlaceholderColor}
        />
      ))}
      <AppButton label="Guardar Home" icon="save-outline" onPress={onSave} />
    </View>
  );
}
