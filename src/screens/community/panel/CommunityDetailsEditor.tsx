import React, { useEffect, useState } from 'react';
import { Image, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppButton } from '../../../components/ui';
import { inputPlaceholderColor } from '../../../lib/constants';
import { APP_MESSAGES } from '../../../lib/appMessages';
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
      <Text style={[styles.sectionTitle, isDark && styles.titleDark]}>{APP_MESSAGES.community.detailsTitle}</Text>
      <Text style={[styles.body, isDark && styles.bodyDark]}>{APP_MESSAGES.community.detailsHelp}</Text>
      {draftImageUrl ? <Image source={{ uri: draftImageUrl }} style={styles.image} resizeMode="cover" /> : null}
      <AppButton
        label={draftImageUrl ? APP_MESSAGES.community.bannerChange : APP_MESSAGES.community.bannerAdd}
        icon="image-outline"
        variant="secondary"
        size="compact"
        onPress={pickImage}
      />
      <TextInput
        style={[styles.input, styles.textArea, isDark && styles.inputDark]}
        value={draftDescription}
        onChangeText={setDraftDescription}
        placeholder={APP_MESSAGES.community.detailsPlaceholder}
        placeholderTextColor={inputPlaceholderColor}
        multiline
        maxLength={1000}
      />
      <AppButton
        label={APP_MESSAGES.community.detailsSave}
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
