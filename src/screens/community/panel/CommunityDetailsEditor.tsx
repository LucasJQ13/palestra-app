import React, { useEffect, useState } from 'react';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { inputPlaceholderColor } from '../../../lib/constants';
import { communityPanelStyles as styles } from './communityPanelStyles';

export function CommunityDetailsEditor({
  description,
  imageUrl,
  isDark,
  saving,
  onSave
}: {
  description?: string | null;
  imageUrl?: string | null;
  isDark: boolean;
  saving: boolean;
  onSave: (values: { description: string; imageAsset: ImagePicker.ImagePickerAsset | null; imageUrl: string | null }) => void;
}) {
  const [draftDescription, setDraftDescription] = useState(description ?? '');
  const [draftImageUrl, setDraftImageUrl] = useState(imageUrl ?? '');
  const [imageAsset, setImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);

  useEffect(() => {
    setDraftDescription(description ?? '');
    setDraftImageUrl(imageUrl ?? '');
    setImageAsset(null);
  }, [description, imageUrl]);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [2, 1],
      quality: 0.86
    });
    if (!result.canceled && result.assets[0]) {
      setImageAsset(result.assets[0]);
      setDraftImageUrl(result.assets[0].uri);
    }
  }

  return (
    <View style={[styles.panel, isDark && styles.panelDark]}>
      <Text style={[styles.sectionTitle, isDark && styles.titleDark]}>Identidad de la comunidad</Text>
      <Text style={[styles.body, isDark && styles.bodyDark]}>Actualizá la presentación y el banner de tu comunidad.</Text>
      {draftImageUrl ? <Image source={{ uri: draftImageUrl }} style={styles.image} resizeMode="cover" /> : null}
      <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
        <Ionicons name="image-outline" size={18} color="#2D8DC8" />
        <Text style={styles.secondaryButtonText}>{draftImageUrl ? 'Cambiar banner' : 'Agregar banner'}</Text>
      </TouchableOpacity>
      <TextInput
        style={[styles.input, styles.textArea, isDark && styles.inputDark]}
        value={draftDescription}
        onChangeText={setDraftDescription}
        placeholder="Descripción, frase o lema de la comunidad"
        placeholderTextColor={inputPlaceholderColor}
        multiline
        maxLength={1000}
      />
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => onSave({
          description: draftDescription.trim(),
          imageAsset,
          imageUrl: draftImageUrl || null
        })}
        disabled={saving}
      >
        <Ionicons name="save-outline" size={18} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>{saving ? 'Guardando...' : 'Guardar identidad'}</Text>
      </TouchableOpacity>
    </View>
  );
}
