import React from 'react';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { inputPlaceholderColor } from '../../../lib/constants';
import { CommunityNoticeBodyFormat, CommunityNoticeDraft } from '../../../lib/community/notices';
import { communityPanelStyles as styles } from '../panel/communityPanelStyles';

const formatOptions: Array<{ value: CommunityNoticeBodyFormat; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { value: 'normal', label: 'Normal', icon: 'text-outline' },
  { value: 'bold', label: 'Negrita', icon: 'text' },
  { value: 'underline', label: 'Subrayado', icon: 'remove-outline' }
];

export function CommunityNoticeEditor({
  value,
  isDark,
  submitLabel,
  onChange,
  onSubmit,
  onCancel
}: {
  value: CommunityNoticeDraft;
  isDark: boolean;
  submitLabel: string;
  onChange: (value: CommunityNoticeDraft) => void;
  onSubmit: () => void;
  onCancel?: () => void;
}) {
  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.82
    });
    if (!result.canceled && result.assets[0]) {
      onChange({ ...value, imageAsset: result.assets[0], imageUrl: '' });
    }
  }

  const previewUri = value.imageAsset?.uri || value.imageUrl.trim();

  return (
    <View style={styles.editorStack}>
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        value={value.title}
        onChangeText={(title) => onChange({ ...value, title })}
        placeholder="Título del aviso"
        placeholderTextColor={inputPlaceholderColor}
        maxLength={120}
      />
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        value={value.subtitle}
        onChangeText={(subtitle) => onChange({ ...value, subtitle })}
        placeholder="Subtítulo opcional"
        placeholderTextColor={inputPlaceholderColor}
        maxLength={160}
      />
      <TextInput
        style={[
          styles.input,
          styles.textArea,
          value.bodyFormat === 'bold' && styles.editorBold,
          value.bodyFormat === 'underline' && styles.editorUnderline,
          isDark && styles.inputDark
        ]}
        value={value.body}
        onChangeText={(body) => onChange({ ...value, body })}
        placeholder="Comunicado para la comunidad"
        placeholderTextColor={inputPlaceholderColor}
        multiline
        maxLength={4000}
      />

      <View style={styles.formatRow}>
        {formatOptions.map((option) => {
          const selected = value.bodyFormat === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.formatButton, isDark && styles.formatButtonDark, selected && styles.formatButtonActive]}
              onPress={() => onChange({ ...value, bodyFormat: option.value })}
            >
              <Ionicons name={option.icon} size={16} color={selected ? '#FFFFFF' : '#2D8DC8'} />
              <Text style={[styles.formatButtonText, selected && styles.formatButtonTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.mediaActions}>
        <TouchableOpacity style={[styles.secondaryButton, isDark && styles.secondaryButtonDark]} onPress={pickImage}>
          <Ionicons name="image-outline" size={18} color="#2D8DC8" />
          <Text style={styles.secondaryButtonText}>{previewUri ? 'Cambiar imagen' : 'Elegir imagen'}</Text>
        </TouchableOpacity>
        {previewUri ? (
          <TouchableOpacity
            style={[styles.secondaryButton, isDark && styles.secondaryButtonDark]}
            onPress={() => onChange({ ...value, imageAsset: null, imageUrl: '' })}
          >
            <Ionicons name="trash-outline" size={18} color="#2D8DC8" />
            <Text style={styles.secondaryButtonText}>Quitar</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        value={value.imageUrl}
        onChangeText={(imageUrl) => onChange({ ...value, imageUrl, imageAsset: null })}
        placeholder="O pegá un enlace https:// de imagen"
        placeholderTextColor={inputPlaceholderColor}
        autoCapitalize="none"
      />
      {previewUri ? <Image source={{ uri: previewUri }} style={styles.editorImage} resizeMode="cover" /> : null}

      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        value={value.linkLabel}
        onChangeText={(linkLabel) => onChange({ ...value, linkLabel })}
        placeholder="Texto del botón, por ejemplo: Ver inscripción"
        placeholderTextColor={inputPlaceholderColor}
        maxLength={80}
      />
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        value={value.linkUrl}
        onChangeText={(linkUrl) => onChange({ ...value, linkUrl })}
        placeholder="Enlace opcional https://"
        placeholderTextColor={inputPlaceholderColor}
        autoCapitalize="none"
      />

      <View style={styles.noticeActions}>
        <TouchableOpacity style={styles.primaryButton} onPress={onSubmit}>
          <Ionicons name="megaphone-outline" size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>{submitLabel}</Text>
        </TouchableOpacity>
        {onCancel ? (
          <TouchableOpacity style={[styles.secondaryButton, isDark && styles.secondaryButtonDark]} onPress={onCancel}>
            <Text style={styles.secondaryButtonText}>Cancelar</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
