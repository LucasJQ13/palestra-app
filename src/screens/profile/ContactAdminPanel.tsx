import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';
import { inputPlaceholderColor } from '../../lib/constants';
import { AppAdminConfig, ContactBlock, defaultAdminConfig } from '../../lib/appConfig';
import { Session } from '../../types/auth';
import { AppButton, ButtonGroup } from '../../components/ui';

const contactBlockTypes: ContactBlock['type'][] = ['texto', 'telefono', 'email', 'imagen', 'direccion', 'enlace', 'boton', 'red_social'];

export function ContactAdminPanel({
  config,
  session,
  isDark,
  onPatch,
  onSaveInstagram,
  onSaveFullContact
}: {
  config: AppAdminConfig;
  session: Session | null;
  isDark: boolean;
  onPatch: (patch: Partial<AppAdminConfig['contact']>) => void;
  onSaveInstagram: () => void;
  onSaveFullContact: () => void;
}) {
  const canManageFullContact = session?.role === 'administrador';

  function updateBlock(index: number, patch: Partial<ContactBlock>) {
    const blocks = [...(config.contact.blocks ?? [])];
    const block = blocks[index];
    if (!block) {
      return;
    }
    blocks[index] = { ...block, ...patch };
    onPatch({ blocks });
  }

  function removeBlock(id: string) {
    onPatch({ blocks: (config.contact.blocks ?? []).filter((item) => item.id !== id) });
  }

  function addBlock() {
    onPatch({
      blocks: [...(config.contact.blocks ?? []), { id: `contact-${Date.now()}`, type: 'texto', label: '', value: '' }]
    });
  }

  return (
    <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
      <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Contacto modular</Text>
      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Configura canales nacionales, Instagram por provincia y bloques dinamicos visibles en Contacto.</Text>

      {canManageFullContact ? (
        <>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Correo electronico oficial. Ej: contacto@palestra.org.ar"
            value={config.contact.email}
            onChangeText={(value) => onPatch({ email: value })}
            placeholderTextColor={inputPlaceholderColor}
          />
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Numero telefonico oficial. Ej: +54 351 000-0000"
            value={config.contact.phone}
            onChangeText={(value) => onPatch({ phone: value })}
            placeholderTextColor={inputPlaceholderColor}
          />
        </>
      ) : null}

      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Instagram nacional</Text>
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        placeholder="URL o usuario de Instagram nacional"
        value={config.contact.instagram}
        onChangeText={(value) => onPatch({ instagram: value })}
        placeholderTextColor={inputPlaceholderColor}
      />
      <AppButton label="Guardar Instagram" icon="save-outline" onPress={onSaveInstagram} />

      {canManageFullContact ? (
        <>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Instagram por provincia</Text>
          {Object.keys(defaultAdminConfig.contact.provinceInstagram).map((province) => (
            <TextInput
              key={province}
              style={[styles.input, isDark && styles.inputDark]}
              placeholder={`Instagram de ${province}`}
              value={config.contact.provinceInstagram?.[province] ?? ''}
              onChangeText={(value) => onPatch({
                provinceInstagram: { ...(config.contact.provinceInstagram ?? {}), [province]: value }
              })}
              autoCapitalize="none"
              placeholderTextColor={inputPlaceholderColor}
            />
          ))}
          <TextInput
            style={[styles.input, styles.textArea, isDark && styles.inputDark]}
            placeholder="Texto de ayuda para orientar a quien visita Contacto"
            value={config.contact.helpText}
            onChangeText={(value) => onPatch({ helpText: value })}
            multiline
            placeholderTextColor={inputPlaceholderColor}
          />
          <TextInput
            style={[styles.input, styles.textArea, isDark && styles.inputDark]}
            placeholder="Texto opcional de donaciones o colaboracion"
            value={config.contact.donationText}
            onChangeText={(value) => onPatch({ donationText: value })}
            multiline
            placeholderTextColor={inputPlaceholderColor}
          />
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Bloques dinamicos</Text>
          {(config.contact.blocks ?? []).map((block, index) => (
            <View key={block.id} style={[styles.innerNewsCard, isDark && styles.surfaceRowDark]}>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                placeholder="Titulo o etiqueta del bloque"
                value={block.label}
                onChangeText={(value) => updateBlock(index, { label: value })}
                placeholderTextColor={inputPlaceholderColor}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                {contactBlockTypes.map((type) => (
                  <TouchableOpacity key={type} style={[styles.filterChip, block.type === type && styles.filterChipActive]} onPress={() => updateBlock(index, { type })}>
                    <Text style={[styles.filterChipText, block.type === type && styles.filterChipTextActive]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput
                style={[styles.input, styles.textArea, isDark && styles.inputDark]}
                placeholder="Contenido, URL, telefono, email o direccion"
                value={block.value}
                onChangeText={(value) => updateBlock(index, { value })}
                multiline
                placeholderTextColor={inputPlaceholderColor}
              />
              <AppButton label="Eliminar bloque" icon="trash-outline" variant="dangerGhost" size="compact" onPress={() => removeBlock(block.id)} />
            </View>
          ))}
          <ButtonGroup>
            <AppButton label="Agregar bloque" icon="add-circle-outline" variant="secondary" onPress={addBlock} />
            <AppButton label="Guardar contacto completo" icon="save-outline" onPress={onSaveFullContact} />
          </ButtonGroup>
        </>
      ) : null}
    </View>
  );
}
