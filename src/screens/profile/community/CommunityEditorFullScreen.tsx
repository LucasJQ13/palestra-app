import React from 'react';
import { Image, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppButton, ButtonGroup } from '../../../components/ui';
import { FullScreenEditor } from '../../../components/layout';
import { CommunityGroupType, communityGroupLabel, communitySectionOptions } from '../../../lib/communitySections';
import { COMMUNITY_IMAGE_ASPECT_RATIO, COMMUNITY_IMAGE_RECOMMENDATION, inputPlaceholderColor } from '../../../lib/constants';
import { AppCommunityLocation } from '../../../lib/remoteData';
import { styles } from '../../../theme/appStyles';
import { useAppTheme } from '../../../theme/ThemeContext';

type CommunityEditorFullScreenProps = {
  visible: boolean;
  community?: AppCommunityLocation;
  province: string;
  isDark: boolean;
  name: string;
  address: string;
  phone: string;
  meetingDay: string;
  meetingTime: string;
  description: string;
  latitude: string;
  longitude: string;
  imagePreview: string;
  imageAsset: unknown | null;
  imageUploading: boolean;
  groupType: CommunityGroupType;
  canAdministrate: boolean;
  feedback?: string;
  setName: (value: string) => void;
  setAddress: (value: string) => void;
  setPhone: (value: string) => void;
  setMeetingDay: (value: string) => void;
  setMeetingTime: (value: string) => void;
  setDescription: (value: string) => void;
  setLatitude: (value: string) => void;
  setLongitude: (value: string) => void;
  setGroupType: (value: CommunityGroupType) => void;
  onPickImage: () => void;
  onToggleStatus: (communityId: string, isActive: boolean) => void;
  onArchive: (communityId: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function CommunityEditorFullScreen({
  visible,
  community,
  province,
  isDark,
  name,
  address,
  phone,
  meetingDay,
  meetingTime,
  description,
  latitude,
  longitude,
  imagePreview,
  imageAsset,
  imageUploading,
  groupType,
  canAdministrate,
  feedback,
  setName,
  setAddress,
  setPhone,
  setMeetingDay,
  setMeetingTime,
  setDescription,
  setLatitude,
  setLongitude,
  setGroupType,
  onPickImage,
  onToggleStatus,
  onArchive,
  onSave,
  onCancel
}: CommunityEditorFullScreenProps) {
  const theme = useAppTheme();
  const communityId = community?.id ?? community?.name ?? '';
  const isActive = community?.isActive !== false;

  return (
    <FullScreenEditor
      visible={visible}
      title="Editar comunidad"
      subtitle={[community?.name || name, province].filter(Boolean).join(' · ')}
      onClose={onCancel}
      testID="community-editor-full-screen"
      footer={(
        <ButtonGroup wrap={false}>
          <AppButton
            label="Cancelar"
            icon="close-outline"
            variant="secondary"
            disabled={imageUploading}
            style={editorStyles.footerButton}
            onPress={onCancel}
          />
          <AppButton
            label="Guardar comunidad"
            icon="save-outline"
            loading={imageUploading}
            style={editorStyles.footerButton}
            onPress={onSave}
          />
        </ButtonGroup>
      )}
    >
      {feedback ? (
        <View style={[editorStyles.feedback, { backgroundColor: theme.colors.surfaceSoft, borderColor: theme.colors.border }]}>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{feedback}</Text>
        </View>
      ) : null}

      <View style={editorStyles.section}>
        <Text style={[editorStyles.sectionTitle, { color: theme.colors.text }]}>Datos principales</Text>
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder="Nombre"
          value={name}
          onChangeText={setName}
          placeholderTextColor={inputPlaceholderColor}
        />
        <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Subsección</Text>
        <View style={styles.filterRow}>
          {communitySectionOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[styles.filterChip, isDark && styles.surfaceRowDark, groupType === option.key && styles.filterChipActive]}
              onPress={() => setGroupType(option.key)}
            >
              <Text style={[styles.filterChipText, isDark && styles.textDarkStrong, groupType === option.key && styles.filterChipTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Actual: {communityGroupLabel(community?.group)}</Text>
        <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Dirección" value={address} onChangeText={setAddress} placeholderTextColor={inputPlaceholderColor} />
        <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Contacto" value={phone} onChangeText={setPhone} placeholderTextColor={inputPlaceholderColor} />
        <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Día de reunión" value={meetingDay} onChangeText={setMeetingDay} placeholderTextColor={inputPlaceholderColor} />
        <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Horario" value={meetingTime} onChangeText={setMeetingTime} placeholderTextColor={inputPlaceholderColor} />
      </View>

      <View style={[editorStyles.divider, { backgroundColor: theme.colors.border }]} />

      <View style={editorStyles.section}>
        <Text style={[editorStyles.sectionTitle, { color: theme.colors.text }]}>Ubicación</Text>
        <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Cargar coordenadas habilita Buscar Comunidad Cercana. Podés copiarlas desde Google Maps.</Text>
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder="Latitud. Ej: -31.4167"
          value={latitude}
          onChangeText={setLatitude}
          keyboardType="decimal-pad"
          placeholderTextColor={inputPlaceholderColor}
        />
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholder="Longitud. Ej: -64.1833"
          value={longitude}
          onChangeText={setLongitude}
          keyboardType="decimal-pad"
          placeholderTextColor={inputPlaceholderColor}
        />
        <AppButton
          label="Ver dirección en Maps"
          icon="map-outline"
          variant="secondary"
          size="compact"
          disabled={!address.trim()}
          onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${province}, Argentina`)}`)}
        />
      </View>

      <View style={[editorStyles.divider, { backgroundColor: theme.colors.border }]} />

      <View style={editorStyles.section}>
        <Text style={[editorStyles.sectionTitle, { color: theme.colors.text }]}>Presentación</Text>
        <TextInput
          style={[styles.input, styles.textArea, isDark && styles.inputDark]}
          placeholder="Descripción e historia"
          value={description}
          onChangeText={setDescription}
          multiline
          placeholderTextColor={inputPlaceholderColor}
        />
        <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Imagen de comunidad</Text>
        <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Imagen recomendada: {COMMUNITY_IMAGE_RECOMMENDATION}. La app conserva esa proporción antes de guardar.</Text>
        {imagePreview ? <Image source={{ uri: imagePreview }} style={editorStyles.image} resizeMode="cover" /> : null}
        <AppButton label={imagePreview ? 'Cambiar imagen' : 'Subir imagen'} icon="image-outline" variant="secondary" onPress={onPickImage} />
        {imageAsset ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Vista previa lista. Guardá la comunidad para subirla y asociarla.</Text> : null}
      </View>

      {canAdministrate && communityId ? (
        <>
          <View style={[editorStyles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={editorStyles.section}>
            <Text style={[editorStyles.sectionTitle, { color: theme.colors.text }]}>Estado de la comunidad</Text>
            <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{isActive ? 'La comunidad está habilitada.' : 'La comunidad está deshabilitada.'}</Text>
            <ButtonGroup>
              <AppButton
                label={isActive ? 'Deshabilitar' : 'Habilitar'}
                icon={isActive ? 'pause-circle-outline' : 'checkmark-circle-outline'}
                variant="secondary"
                size="compact"
                onPress={() => onToggleStatus(communityId, !isActive)}
              />
              <AppButton label="Eliminar" icon="trash-outline" variant="dangerGhost" size="compact" onPress={() => onArchive(communityId)} />
            </ButtonGroup>
          </View>
        </>
      ) : null}
    </FullScreenEditor>
  );
}

const editorStyles = StyleSheet.create({
  section: {
    gap: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900'
  },
  divider: {
    height: StyleSheet.hairlineWidth
  },
  feedback: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  image: {
    width: '100%',
    aspectRatio: COMMUNITY_IMAGE_ASPECT_RATIO,
    borderRadius: 16,
    backgroundColor: '#DDEBF0'
  },
  footerButton: {
    flex: 1
  }
});
