import React, { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppCommunity } from '../../lib/remoteData';
import { ArgentinaProvinceDefinition } from '../../lib/argentinaProvinces';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';

export function ProvinceCreateDropdown({
  isDark,
  provinces,
  selectedProvince,
  open,
  onToggle,
  onSelect
}: {
  isDark: boolean;
  provinces: ArgentinaProvinceDefinition[];
  selectedProvince: ArgentinaProvinceDefinition | null;
  open: boolean;
  onToggle: () => void;
  onSelect: (provinceName: string) => void;
}) {
  return (
    <>
      <TouchableOpacity style={[styles.dropdownButton, isDark && styles.dropdownButtonDark]} onPress={onToggle} activeOpacity={0.85}>
        <Text style={[styles.dropdownButtonText, isDark && styles.dropdownButtonTextDark]}>{selectedProvince?.name ?? 'Seleccionar provincia'}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
      </TouchableOpacity>
      {open ? (
        <ScrollView style={[styles.dropdownList, isDark && styles.dropdownListDark]} nestedScrollEnabled>
          {provinces.map((item) => (
            <TouchableOpacity key={item.name} style={[styles.dropdownItem, selectedProvince?.name === item.name && styles.adminListRowActive]} onPress={() => onSelect(item.name)}>
              <Text style={[styles.dropdownItemText, isDark && styles.dropdownItemTextDark]}>{item.name}</Text>
              <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>{item.region}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}
    </>
  );
}

export function ProvinceAdminPanel({
  isDark,
  missingProvinces,
  selectedProvince,
  loadedProvinces,
  logoDrafts,
  logoUploading,
  onSelectProvince,
  onPickLogo,
  onCreateProvince,
  onToggleProvince,
  onArchiveProvince
}: {
  isDark: boolean;
  missingProvinces: ArgentinaProvinceDefinition[];
  selectedProvince: ArgentinaProvinceDefinition | null;
  loadedProvinces: AppCommunity[];
  logoDrafts: Record<string, string>;
  logoUploading: string;
  onSelectProvince: (provinceName: string) => void;
  onPickLogo: (provinceName: string) => void;
  onCreateProvince: () => void;
  onToggleProvince: (provinceName: string, nextActive: boolean) => void;
  onArchiveProvince: (provinceName: string) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
      <Text style={styles.cardTitle}>Crear provincia</Text>
      <Text style={styles.cardText}>Seleccioná una provincia argentina faltante. El nombre y la región vienen predefinidos; solo se administra el logo y el estado.</Text>
      {missingProvinces.length > 0 ? (
        <>
          <Text style={styles.cardEyebrow}>Provincia faltante</Text>
          <TouchableOpacity style={[styles.dropdownButton, isDark && styles.dropdownButtonDark]} onPress={() => setDropdownOpen((current) => !current)} activeOpacity={0.85}>
            <Text style={[styles.dropdownButtonText, isDark && styles.dropdownButtonTextDark]}>{selectedProvince?.name ?? 'Seleccionar provincia'}</Text>
            <Ionicons name={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
          </TouchableOpacity>
          {dropdownOpen ? (
            <ScrollView style={[styles.dropdownList, isDark && styles.dropdownListDark]} nestedScrollEnabled>
              {missingProvinces.map((item) => (
                <TouchableOpacity key={item.name} style={[styles.dropdownItem, selectedProvince?.name === item.name && styles.adminListRowActive]} onPress={() => { onSelectProvince(item.name); setDropdownOpen(false); }}>
                  <Text style={[styles.dropdownItemText, isDark && styles.dropdownItemTextDark]}>{item.name}</Text>
                  <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>{item.region}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
          {selectedProvince ? (
            <View style={styles.profileCommunityPanel}>
              <Text style={styles.cardEyebrow}>{selectedProvince.region}</Text>
              <Text style={styles.cardTitle}>{selectedProvince.name}</Text>
              <Text style={styles.cardText}>La región se asigna automáticamente y no es editable.</Text>
              {logoDrafts[selectedProvince.name] ? <Image source={{ uri: logoDrafts[selectedProvince.name] }} style={styles.adminDocumentThumb} /> : null}
              <View style={styles.inlineActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => onPickLogo(selectedProvince.name)} disabled={logoUploading === selectedProvince.name}>
                  <Ionicons name="image-outline" size={17} color={palette.red} />
                  <Text style={styles.secondaryButtonText}>{logoUploading === selectedProvince.name ? 'Subiendo...' : 'Cargar logo'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={onCreateProvince}>
                  <Ionicons name="map-outline" size={17} color={palette.white} />
                  <Text style={styles.primaryButtonText}>Crear provincia</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </>
      ) : (
        <Text style={styles.cardText}>Todas las provincias argentinas ya están cargadas.</Text>
      )}
      <Text style={styles.cardEyebrow}>Provincias cargadas</Text>
      {loadedProvinces.filter((item) => !item.archivedAt).map((item) => {
        const active = item.isActive !== false;
        const logoUrl = logoDrafts[item.province] ?? item.logoUrl ?? null;
        return (
          <View key={`province-${item.province}`} style={[styles.adminListRow, styles.provinceAdminRow, !active && styles.lockedCard]}>
            <View style={styles.provinceAdminInfo}>
              {logoUrl ? <Image source={{ uri: logoUrl }} style={styles.adminDocumentThumb} /> : <View style={styles.adminDocumentThumb}><Ionicons name="location-outline" size={20} color={palette.red} /></View>}
              <View style={styles.adminUserHeaderText}>
                <Text style={styles.adminQuickText}>{item.province}</Text>
                <Text style={styles.cardText}>{item.region} - {item.locations.length} comunidades - {active ? 'habilitada' : 'deshabilitada'}</Text>
              </View>
            </View>
            <View style={styles.provinceAdminActions}>
              <TouchableOpacity style={styles.rowActionButton} onPress={() => onPickLogo(item.province)} disabled={logoUploading === item.province}>
                <Ionicons name="image-outline" size={14} color={palette.red} />
                <Text style={styles.rowActionButtonText}>{logoUploading === item.province ? 'Subiendo...' : 'Logo'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rowActionButton} onPress={() => onToggleProvince(item.province, !active)}>
                <Ionicons name={active ? 'pause-circle-outline' : 'checkmark-circle-outline'} size={14} color={palette.red} />
                <Text style={styles.rowActionButtonText}>{active ? 'Deshabilitar' : 'Habilitar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.rowActionButton, styles.rowActionButtonDanger]} onPress={() => onArchiveProvince(item.province)}>
                <Ionicons name="trash-outline" size={14} color="#B93232" />
                <Text style={[styles.rowActionButtonText, styles.rowActionButtonTextDanger]}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
}
