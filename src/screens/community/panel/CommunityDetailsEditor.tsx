import React, { useEffect, useState } from 'react';
import { Image, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppButton } from '../../../components/ui';
import { COMMUNITY_IMAGE_PICKER_ASPECT, COMMUNITY_IMAGE_RECOMMENDATION, inputPlaceholderColor } from '../../../lib/constants';
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
      aspect: COMMUNITY_IMAGE_PICKER_ASPECT,
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
      <Text style={[styles.body, isDark && styles.bodyDark]}>Imagen recomendada: {COMMUNITY_IMAGE_RECOMMENDATION}. El recorte mantiene esa proporción.</Text>
      {draftImageUrl ? <Image source={{ uri: draftImageUrl }} style={styles.image} resizeMode="cover" /> : null}
      <AppButton
        label={draftImageUrl ? 'Cambiar banner' : 'Agregar banner'}
        icon="image-outline"
        variant="secondary"
        size="compact"
        onPress={pickImage}
      />
      <TextInput
        style={[styles.input, styles.textArea, isDark && styles.inputDark]}
        value={draftDescription}
        onChangeText={setDraftDescription}
        placeholder="Descripción, frase o lema de la comunidad"
        placeholderTextColor={inputPlaceholderColor}
        multiline
        maxLength={1000}
      />
      <AppButton
        label="Guardar identidad"
        icon="save-outline"
        onPress={() => onSave({
          description: draftDescription.trim(),
          imageAsset,
          imageUrl: draftImageUrl || null
        })}
        loading={saving}
      />
    </View>
  );
}
