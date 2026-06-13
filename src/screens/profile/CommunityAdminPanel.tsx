import React from 'react';
import { Image, Linking, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppCommunity } from '../../lib/remoteData';
import { CommunityGroupType, communityGroupLabel, communitySectionOptions, resolveCommunitySectionVisibility } from '../../lib/communitySections';
import { Role } from '../../types/auth';
import { inputPlaceholderColor } from '../../lib/constants';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';
import { AppButton, ButtonGroup } from '../../components/ui';

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
  return (
    <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
      <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Gestionar comunidades</Text>
      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Crear, editar, habilitar, deshabilitar o archivar comunidades segun tu jurisdiccion.</Text>
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
      {manageableCommunities.length === 0 ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Tu rango no tiene comunidades editables.</Text> : null}
      {sessionRole === 'administrador' && selectedAdminProvince ? (
        <View style={[styles.profileCommunityPanel, isDark && styles.surfacePanelDark]}>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Subsecciones visibles</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Activar o desactivar secciones para {selectedAdminProvince.province}.</Text>
          {communitySectionOptions.map((item) => {
            const visibility = resolveCommunitySectionVisibility(selectedAdminProvince.province, selectedAdminProvince.sectionVisibility);
            return (
              <View key={item.key} style={[styles.adminListRow, isDark && styles.surfaceRowDark]}>
                <View style={styles.adminUserHeaderText}>
                  <Text style={[styles.adminQuickText, isDark && styles.textDarkStrong]}>{item.label}</Text>
                  <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{visibility[item.key] ? 'Visible en Comunidades' : 'Oculta para usuarios'}</Text>
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
        <AppButton label={showAdminCommunityCreate ? 'Cerrar creacion' : 'Crear Comunidad'} icon={showAdminCommunityCreate ? 'chevron-up-outline' : 'add-circle-outline'} onPress={onToggleCreateCommunity} />
      ) : null}
      {canAdministrateCommunities && selectedAdminProvince && showAdminCommunityCreate ? (
        <View style={[styles.profileCommunityPanel, isDark && styles.surfacePanelDark]}>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Crear comunidad</Text>
          <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Nombre de comunidad" value={adminCommunityId ? '' : adminCommunityName} onChangeText={(value) => { onResetSelectedCommunity(); setAdminCommunityName(value); }}  placeholderTextColor={inputPlaceholderColor} />
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
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Opcional. Podes guardar la comunidad sin imagen.</Text>
          {adminCommunityImagePreview ? <Image source={{ uri: adminCommunityImagePreview }} style={styles.communityModalImage} /> : null}
          <AppButton label={adminCommunityImagePreview ? 'Cambiar imagen' : 'Subir imagen'} icon="image-outline" variant="secondary" onPress={onPickImage} />
          <TouchableOpacity style={[styles.filterChip, adminCommunityIsActive && styles.filterChipActive]} onPress={() => setAdminCommunityIsActive(!adminCommunityIsActive)}>
            <Text style={[styles.filterChipText, adminCommunityIsActive && styles.filterChipTextActive]}>{adminCommunityIsActive ? 'Activa' : 'Inactiva'}</Text>
          </TouchableOpacity>
          <AppButton label="Crear comunidad" icon="save-outline" loading={adminCommunityImageUploading} onPress={onCreateCommunity} />
        </View>
      ) : null}
      {selectedAdminProvince ? (
        <>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Comunidades existentes</Text>
          <ScrollView style={[styles.dropdownList, isDark && styles.dropdownListDark]} nestedScrollEnabled>
            {selectedAdminProvince.locations.map((item) => {
              const itemKey = item.id ?? item.name;
              const selected = adminCommunityId === itemKey;
              const isActive = !('isActive' in item) || Boolean(item.isActive);
              return (
                <View key={itemKey}>
                  <TouchableOpacity
                    style={[styles.dropdownItem, isDark && styles.dropdownItemDark, selected && styles.communityChoiceActive]}
                    onPress={() => onSelectCommunity(selected ? '' : itemKey)}
                  >
                    <Text style={[styles.dropdownItemText, isDark && styles.dropdownItemTextDark, selected && styles.filterChipTextActive]}>{item.name}</Text>
                  </TouchableOpacity>
                  {selected ? (
                    <View style={[styles.adminInlineEditor, isDark && styles.surfacePanelDark]}>
                      <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Nombre" value={adminCommunityName} onChangeText={setAdminCommunityName}  placeholderTextColor={inputPlaceholderColor} />
                      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Subseccion</Text>
                      <View style={styles.filterRow}>
                        {communitySectionOptions.map((groupOption) => (
                          <TouchableOpacity key={groupOption.key} style={[styles.filterChip, isDark && styles.surfaceRowDark, adminCommunityGroupType === groupOption.key && styles.filterChipActive]} onPress={() => setAdminCommunityGroupType(groupOption.key)}>
                            <Text style={[styles.filterChipText, isDark && styles.textDarkStrong, adminCommunityGroupType === groupOption.key && styles.filterChipTextActive]}>{groupOption.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Actual: {communityGroupLabel(item.group)}</Text>
                      <View style={styles.filterRow}>
                        <TextInput style={[styles.input, styles.colorInput, isDark && styles.inputDark]} placeholder="Direccion" value={adminCommunityAddress} onChangeText={setAdminCommunityAddress}  placeholderTextColor={inputPlaceholderColor} />
                        <TextInput style={[styles.input, styles.colorInput, isDark && styles.inputDark]} placeholder="Contacto" value={adminCommunityPhone} onChangeText={setAdminCommunityPhone}  placeholderTextColor={inputPlaceholderColor} />
                      </View>
                      <View style={styles.filterRow}>
                        <TextInput style={[styles.input, styles.colorInput, isDark && styles.inputDark]} placeholder="Dia de reunion" value={adminCommunityDay} onChangeText={setAdminCommunityDay}  placeholderTextColor={inputPlaceholderColor} />
                        <TextInput style={[styles.input, styles.colorInput, isDark && styles.inputDark]} placeholder="Horario" value={adminCommunityTime} onChangeText={setAdminCommunityTime}  placeholderTextColor={inputPlaceholderColor} />
                      </View>
                      <View style={[styles.profileCommunityPanel, isDark && styles.surfaceRowDark]}>
                        <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Ubicacion</Text>
                        <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Cargar coordenadas habilita "Buscar Comunidad Cercana". Podes copiarlas desde Google Maps.</Text>
                        <View style={styles.filterRow}>
                          <TextInput style={[styles.input, styles.colorInput, isDark && styles.inputDark]} placeholder="Latitud. Ej: -31.4167" value={adminCommunityLatitude} onChangeText={setAdminCommunityLatitude} keyboardType="decimal-pad" placeholderTextColor={inputPlaceholderColor} />
                          <TextInput style={[styles.input, styles.colorInput, isDark && styles.inputDark]} placeholder="Longitud. Ej: -64.1833" value={adminCommunityLongitude} onChangeText={setAdminCommunityLongitude} keyboardType="decimal-pad" placeholderTextColor={inputPlaceholderColor} />
                        </View>
                        <AppButton label="Ver direccion en Maps" icon="map-outline" variant="secondary" size="compact" onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${adminCommunityAddress}, ${adminCommunityProvince}, Argentina`)}`)} />
                      </View>
                      <TextInput style={[styles.input, styles.textArea, isDark && styles.inputDark]} placeholder="descripcion e historia" value={adminCommunityDescription} onChangeText={setAdminCommunityDescription} multiline  placeholderTextColor={inputPlaceholderColor} />
                      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Imagen de comunidad</Text>
                      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Imagen recomendada: 1200x600 px. La app abre recorte 2:1 para encuadrar antes de guardar.</Text>
                      {adminCommunityImagePreview ? <Image source={{ uri: adminCommunityImagePreview }} style={styles.communityModalImage} /> : null}
                      <AppButton label={adminCommunityImagePreview ? 'Cambiar imagen' : 'Subir imagen'} icon="image-outline" variant="secondary" onPress={onPickImage} />
                      {adminCommunityImageAsset ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Vista previa lista. Toca Guardar comunidad para subirla y asociarla.</Text> : null}
                      <ButtonGroup>
                        {canAdministrateCommunities ? (
                          <AppButton label={isActive ? 'Deshabilitar' : 'Habilitar'} icon={isActive ? 'pause-circle-outline' : 'checkmark-circle-outline'} variant="secondary" size="compact" onPress={() => onToggleCommunityStatus(itemKey, !isActive)} />
                        ) : null}
                        {canAdministrateCommunities ? (
                          <AppButton label="Eliminar" icon="trash-outline" variant="dangerGhost" size="compact" onPress={() => onArchiveCommunity(itemKey)} />
                        ) : null}
                      </ButtonGroup>
                      <AppButton label="Guardar comunidad" icon="save-outline" loading={adminCommunityImageUploading} onPress={onSaveCommunity} />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        </>
      ) : null}
    </View>
  );
}
