import React from 'react';
import { Image, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppCommunity } from '../../lib/remoteData';
import { CommunityGroupType, communitySectionOptions, resolveCommunitySectionVisibility } from '../../lib/communitySections';
import { Role } from '../../types/auth';
import { inputPlaceholderColor } from '../../lib/constants';
import { APP_MESSAGES } from '../../lib/appMessages';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';
import { AppButton } from '../../components/ui';
import { CommunityEditorFullScreen } from './community/CommunityEditorFullScreen';

type CommunityAdminPanelProps = {
  isDark: boolean;
  sessionRole: Role | null;
  manageableCommunities: AppCommunity[];
  selectedAdminProvince?: AppCommunity;
  adminCommunityProvince: string;
  adminCommunityId: string;
  adminCommunityName: string;
  adminCommunityAddress: string;
  adminCommunityPhone: string;
  adminCommunityDay: string;
  adminCommunityTime: string;
  adminCommunityDescription: string;
  adminCommunityLatitude: string;
  adminCommunityLongitude: string;
  adminCommunityImagePreview: string;
  adminCommunityImageAsset: unknown | null;
  adminCommunityImageUploading: boolean;
  adminCommunityGroupType: CommunityGroupType;
  adminCommunityIsActive: boolean;
  canAdministrateCommunities: boolean;
  showAdminCommunityCreate: boolean;
  feedback?: string;
  onSelectProvince: (province: string) => void;
  onSelectCommunity: (communityId: string) => void;
  onResetSelectedCommunity: () => void;
  onToggleCreateCommunity: () => void;
  setAdminCommunityName: (value: string) => void;
  setAdminCommunityAddress: (value: string) => void;
  setAdminCommunityPhone: (value: string) => void;
  setAdminCommunityDay: (value: string) => void;
  setAdminCommunityTime: (value: string) => void;
  setAdminCommunityDescription: (value: string) => void;
  setAdminCommunityLatitude: (value: string) => void;
  setAdminCommunityLongitude: (value: string) => void;
  setAdminCommunityGroupType: (value: CommunityGroupType) => void;
  setAdminCommunityIsActive: (value: boolean) => void;
  onPickImage: () => void;
  onCreateCommunity: () => void;
  onSetSectionEnabled: (groupType: CommunityGroupType, enabled: boolean) => void;
  onToggleCommunityStatus: (communityId: string, isActive: boolean) => void;
  onArchiveCommunity: (communityId: string) => void;
  onSaveCommunity: () => void;
};

export function CommunityAdminPanel({
  isDark,
  sessionRole,
  manageableCommunities,
  selectedAdminProvince,
  adminCommunityProvince,
  adminCommunityId,
  adminCommunityName,
  adminCommunityAddress,
  adminCommunityPhone,
  adminCommunityDay,
  adminCommunityTime,
  adminCommunityDescription,
  adminCommunityLatitude,
  adminCommunityLongitude,
  adminCommunityImagePreview,
  adminCommunityImageAsset,
  adminCommunityImageUploading,
  adminCommunityGroupType,
  adminCommunityIsActive,
  canAdministrateCommunities,
  showAdminCommunityCreate,
  feedback,
  onSelectProvince,
  onSelectCommunity,
  onResetSelectedCommunity,
  onToggleCreateCommunity,
  setAdminCommunityName,
  setAdminCommunityAddress,
  setAdminCommunityPhone,
  setAdminCommunityDay,
  setAdminCommunityTime,
  setAdminCommunityDescription,
  setAdminCommunityLatitude,
  setAdminCommunityLongitude,
  setAdminCommunityGroupType,
  setAdminCommunityIsActive,
  onPickImage,
  onCreateCommunity,
  onSetSectionEnabled,
  onToggleCommunityStatus,
  onArchiveCommunity,
  onSaveCommunity
}: CommunityAdminPanelProps) {
  const selectedAdminCommunity = selectedAdminProvince?.locations.find((item) => (item.id ?? item.name) === adminCommunityId);

  return (
    <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
      <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{APP_MESSAGES.community.adminTitle}</Text>
      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.community.adminHelp}</Text>
      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Provincia</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
        {manageableCommunities.map((item) => (
          <TouchableOpacity
            key={item.province}
            style={[styles.filterChip, isDark && styles.surfaceRowDark, adminCommunityProvince === item.province && styles.filterChipActive]}
            onPress={() => onSelectProvince(item.province)}
          >
            <Text style={[styles.filterChipText, isDark && styles.textDarkStrong, adminCommunityProvince === item.province && styles.filterChipTextActive]}>{item.province}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {manageableCommunities.length === 0 ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.community.adminNoEditable}</Text> : null}
      {sessionRole === 'administrador' && selectedAdminProvince ? (
        <View style={[styles.profileCommunityPanel, isDark && styles.surfacePanelDark]}>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{APP_MESSAGES.community.visibleSubsections}</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.community.visibleSubsectionsHelp(selectedAdminProvince.province)}</Text>
          {communitySectionOptions.map((item) => {
            const visibility = resolveCommunitySectionVisibility(selectedAdminProvince.province, selectedAdminProvince.sectionVisibility);
            return (
              <View key={item.key} style={[styles.adminListRow, isDark && styles.surfaceRowDark]}>
                <View style={styles.adminUserHeaderText}>
                  <Text style={[styles.adminQuickText, isDark && styles.textDarkStrong]}>{item.label}</Text>
                  <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{visibility[item.key] ? APP_MESSAGES.community.visibleInCommunities : APP_MESSAGES.community.hiddenForUsers}</Text>
                </View>
                <Switch
                  value={visibility[item.key]}
                  onValueChange={(value) => onSetSectionEnabled(item.key, value)}
                  trackColor={{ false: palette.line, true: palette.red }}
                  thumbColor={visibility[item.key] ? palette.red : palette.white}
                />
              </View>
            );
          })}
        </View>
      ) : null}
      {canAdministrateCommunities && selectedAdminProvince ? (
        <AppButton label={showAdminCommunityCreate ? APP_MESSAGES.community.closeCreation : APP_MESSAGES.community.createCommunity} icon={showAdminCommunityCreate ? 'chevron-up-outline' : 'add-circle-outline'} onPress={onToggleCreateCommunity} />
      ) : null}
      {canAdministrateCommunities && selectedAdminProvince && showAdminCommunityCreate ? (
        <View style={[styles.profileCommunityPanel, isDark && styles.surfacePanelDark]}>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{APP_MESSAGES.community.createCommunity}</Text>
          <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder={APP_MESSAGES.community.communityNamePlaceholder} value={adminCommunityId ? '' : adminCommunityName} onChangeText={(value) => { onResetSelectedCommunity(); setAdminCommunityName(value); }}  placeholderTextColor={inputPlaceholderColor} />
          <View style={styles.filterRow}>
            {communitySectionOptions.map((item) => (
              <TouchableOpacity key={item.key} style={[styles.filterChip, isDark && styles.surfaceRowDark, adminCommunityGroupType === item.key && styles.filterChipActive]} onPress={() => setAdminCommunityGroupType(item.key)}>
                <Text style={[styles.filterChipText, isDark && styles.textDarkStrong, adminCommunityGroupType === item.key && styles.filterChipTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.filterRow}>
            <TextInput style={[styles.input, styles.colorInput, isDark && styles.inputDark]} placeholder="Direccion" value={adminCommunityId ? '' : adminCommunityAddress} onChangeText={(value) => { onResetSelectedCommunity(); setAdminCommunityAddress(value); }}  placeholderTextColor={inputPlaceholderColor} />
            <TextInput style={[styles.input, styles.colorInput, isDark && styles.inputDark]} placeholder="Contacto" value={adminCommunityId ? '' : adminCommunityPhone} onChangeText={(value) => { onResetSelectedCommunity(); setAdminCommunityPhone(value); }}  placeholderTextColor={inputPlaceholderColor} />
          </View>
          <View style={styles.filterRow}>
            <TextInput style={[styles.input, styles.colorInput, isDark && styles.inputDark]} placeholder="Dia de reunion" value={adminCommunityId ? '' : adminCommunityDay} onChangeText={(value) => { onResetSelectedCommunity(); setAdminCommunityDay(value); }}  placeholderTextColor={inputPlaceholderColor} />
            <TextInput style={[styles.input, styles.colorInput, isDark && styles.inputDark]} placeholder="Horario" value={adminCommunityId ? '' : adminCommunityTime} onChangeText={(value) => { onResetSelectedCommunity(); setAdminCommunityTime(value); }}  placeholderTextColor={inputPlaceholderColor} />
          </View>
          <View style={styles.filterRow}>
            <TextInput style={[styles.input, styles.colorInput, isDark && styles.inputDark]} placeholder="Latitud" value={adminCommunityLatitude} onChangeText={setAdminCommunityLatitude} keyboardType="decimal-pad" placeholderTextColor={inputPlaceholderColor} />
            <TextInput style={[styles.input, styles.colorInput, isDark && styles.inputDark]} placeholder="Longitud" value={adminCommunityLongitude} onChangeText={setAdminCommunityLongitude} keyboardType="decimal-pad" placeholderTextColor={inputPlaceholderColor} />
          </View>
          <TextInput style={[styles.input, styles.textArea, isDark && styles.inputDark]} placeholder="descripcion" value={adminCommunityId ? '' : adminCommunityDescription} onChangeText={(value) => { onResetSelectedCommunity(); setAdminCommunityDescription(value); }} multiline  placeholderTextColor={inputPlaceholderColor} />
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Imagen</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.community.optionalImageHelp}</Text>
          {adminCommunityImagePreview ? <Image source={{ uri: adminCommunityImagePreview }} style={styles.communityModalImage} /> : null}
          <AppButton label={adminCommunityImagePreview ? 'Cambiar imagen' : 'Subir imagen'} icon="image-outline" variant="secondary" onPress={onPickImage} />
          <TouchableOpacity style={[styles.filterChip, adminCommunityIsActive && styles.filterChipActive]} onPress={() => setAdminCommunityIsActive(!adminCommunityIsActive)}>
            <Text style={[styles.filterChipText, adminCommunityIsActive && styles.filterChipTextActive]}>{adminCommunityIsActive ? 'Activa' : 'Inactiva'}</Text>
          </TouchableOpacity>
          <AppButton label={APP_MESSAGES.community.createCommunity} icon="save-outline" loading={adminCommunityImageUploading} onPress={onCreateCommunity} />
        </View>
      ) : null}
      {selectedAdminProvince ? (
        <>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{APP_MESSAGES.community.existingCommunities}</Text>
          <ScrollView style={[styles.dropdownList, isDark && styles.dropdownListDark]} nestedScrollEnabled>
            {selectedAdminProvince.locations.map((item) => {
              const itemKey = item.id ?? item.name;
              const itemName = item.name?.trim() || APP_MESSAGES.community.unnamedCommunity;
              const selected = adminCommunityId === itemKey;
              const isActive = !('isActive' in item) || Boolean(item.isActive);
              return (
                <TouchableOpacity
                  key={itemKey}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar comunidad ${itemName}`}
                  style={[styles.dropdownItem, styles.adminEditableRow, isDark && styles.dropdownItemDark, selected && styles.communityChoiceActive]}
                  onPress={() => onSelectCommunity(itemKey)}
                >
                  <View style={styles.adminUserHeaderText}>
                    <Text numberOfLines={2} style={[styles.dropdownItemText, isDark && styles.dropdownItemTextDark, selected && styles.filterChipTextActive]}>{itemName}</Text>
                    <Text style={[styles.feedMeta, isDark && styles.textDarkMuted, selected && styles.filterChipTextActive]}>{isActive ? 'Habilitada' : 'Deshabilitada'} · Editar</Text>
                  </View>
                  <Ionicons name="create-outline" size={18} color={selected ? palette.white : palette.red} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <CommunityEditorFullScreen
            visible={Boolean(selectedAdminCommunity)}
            community={selectedAdminCommunity}
            province={adminCommunityProvince}
            isDark={isDark}
            name={adminCommunityName}
            address={adminCommunityAddress}
            phone={adminCommunityPhone}
            meetingDay={adminCommunityDay}
            meetingTime={adminCommunityTime}
            description={adminCommunityDescription}
            latitude={adminCommunityLatitude}
            longitude={adminCommunityLongitude}
            imagePreview={adminCommunityImagePreview}
            imageAsset={adminCommunityImageAsset}
            imageUploading={adminCommunityImageUploading}
            groupType={adminCommunityGroupType}
            canAdministrate={canAdministrateCommunities}
            feedback={feedback}
            setName={setAdminCommunityName}
            setAddress={setAdminCommunityAddress}
            setPhone={setAdminCommunityPhone}
            setMeetingDay={setAdminCommunityDay}
            setMeetingTime={setAdminCommunityTime}
            setDescription={setAdminCommunityDescription}
            setLatitude={setAdminCommunityLatitude}
            setLongitude={setAdminCommunityLongitude}
            setGroupType={setAdminCommunityGroupType}
            onPickImage={onPickImage}
            onToggleStatus={onToggleCommunityStatus}
            onArchive={onArchiveCommunity}
            onSave={onSaveCommunity}
            onCancel={() => onSelectCommunity('')}
          />
        </>
      ) : null}
    </View>
  );
}
