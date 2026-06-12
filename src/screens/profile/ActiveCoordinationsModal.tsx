import React, { useMemo } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoleAliasConfig } from '../../lib/appConfig';
import { ActiveCoordinationUser, selectActiveCoordinations } from '../../lib/activeCoordinations';
import { AdminUser, ProvinceRoleLabelRecord, PublicUserDirectoryRecord } from '../../lib/profiles';
import { displayRoleLabel } from '../../lib/profileDisplay';
import { Role } from '../../types/auth';
import { PublicProfilePreview } from '../../types/appUi';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';

export function ActiveCoordinationsModal({
  visible,
  isDark,
  viewerProvince,
  publicDirectory,
  adminUsers,
  provinceRoleLabels,
  roleAliases,
  onClose,
  onOpenPublicProfile
}: {
  visible: boolean;
  isDark: boolean;
  viewerProvince: string;
  publicDirectory: PublicUserDirectoryRecord[];
  adminUsers: AdminUser[];
  provinceRoleLabels: ProvinceRoleLabelRecord[];
  roleAliases: RoleAliasConfig[];
  onClose: () => void;
  onOpenPublicProfile: (profile: PublicProfilePreview) => void;
}) {
  const activeCoordinators = useMemo(
    () => selectActiveCoordinations([publicDirectory, adminUsers], viewerProvince),
    [adminUsers, publicDirectory, viewerProvince]
  );

  function openCoordinator(user: ActiveCoordinationUser) {
    const role = user.role as Role;
    onClose();
    onOpenPublicProfile({
      id: user.id,
      fullName: user.full_name ?? 'Usuario sin nombre',
      role,
      province: user.province,
      communityName: user.community_name,
      avatarUrl: user.avatar_url,
      contact: user.phone ?? '',
      displayRoleLabel: user.display_role_label ?? null,
      genderPreference: user.gender_preference ?? null,
      nickname: user.nickname ?? null,
      credentialNameMode: user.credential_name_mode ?? 'name',
      perseveranceStartYear: user.perseverance_start_year ?? null,
      personalPmType: user.personal_pm_type ?? null,
      personalPmNumber: user.personal_pm_number ?? null,
      personalPmProvince: user.personal_pm_province ?? null,
      personalPmMotto: user.personal_pm_motto ?? user.pm_motto ?? null,
      pmMotto: user.pm_motto ?? null
    });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalPanel, isDark && styles.surfacePanelDark]}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose} activeOpacity={0.8}>
            <Ionicons name="close-outline" size={22} color={palette.red} />
          </TouchableOpacity>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Coordinaciones Activas</Text>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Coordinadores nacionales y diocesanos</Text>
          <ScrollView style={styles.leadershipUsersList} nestedScrollEnabled showsVerticalScrollIndicator>
            {activeCoordinators.length === 0 ? (
              <Text style={[styles.cardText, isDark && styles.textDarkBody]}>
                No hay coordinadores nacionales ni diocesanos activos.
              </Text>
            ) : null}
            {activeCoordinators.map((user) => {
              const role = user.role as Role;
              return (
                <TouchableOpacity
                  key={`coord-${user.id}`}
                  style={[styles.leadershipUserRow, isDark && styles.surfaceRowDark]}
                  activeOpacity={0.86}
                  onPress={() => openCoordinator(user)}
                >
                  <View style={styles.adminUserHeaderText}>
                    <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{user.full_name ?? 'Usuario sin nombre'}</Text>
                    <Text style={[styles.cardText, isDark && styles.textDarkBody]}>
                      {displayRoleLabel(role, user.province, provinceRoleLabels, roleAliases, user.display_role_label, user.gender_preference ?? null)}
                    </Text>
                    <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>
                      {user.province ?? 'Nacional'} - {user.community_name ?? 'Sin comunidad'}
                    </Text>
                  </View>
                  <Ionicons name="id-card-outline" size={18} color={palette.red} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
