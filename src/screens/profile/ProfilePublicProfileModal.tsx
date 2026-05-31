import React from 'react';
import { Image, Modal, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Role, Session } from '../../types/auth';
import { ProvinceRoleLabelRecord } from '../../lib/profiles';
import { RoleAliasConfig } from '../../lib/appConfig';
import { displayRoleLabel, perseveranceLabel, personalPmSummary } from '../../lib/profileDisplay';
import { roleRank } from '../../lib/roles';
import { PublicProfilePreview } from '../../types/appUi';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';

export function ProfilePublicProfileModal({
  profile,
  viewerSession,
  isDark,
  provinceRoleLabels,
  roleAliases,
  onClose
}: {
  profile: PublicProfilePreview | null;
  viewerSession: Session | null;
  isDark: boolean;
  provinceRoleLabels: ProvinceRoleLabelRecord[];
  roleAliases: RoleAliasConfig[];
  onClose: () => void;
}) {
  const maskAdminRole = Boolean(profile && profile.role === 'administrador' && viewerSession?.role !== 'administrador' && viewerSession?.id !== profile.id);
  const visibleRole = (maskAdminRole ? 'vocal' : profile?.role) as Role | undefined;
  const visibleAssignedRoleLabel = maskAdminRole ? null : profile?.displayRoleLabel;
  const pmSummary = profile ? personalPmSummary({
    type: profile.personalPmType,
    number: profile.personalPmNumber,
    province: profile.personalPmProvince,
    motto: profile.personalPmMotto ?? profile.pmMotto
  }) : '';

  return (
    <Modal visible={Boolean(profile)} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalPanel}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose} activeOpacity={0.8}>
            <Ionicons name="close" size={19} color={palette.red} />
          </TouchableOpacity>
          {profile ? (
            <View style={styles.publicProfilePanel}>
              <View style={styles.publicProfileAvatar}>
                {profile.avatarUrl ? <Image source={{ uri: profile.avatarUrl }} style={styles.publicProfileAvatarImage} /> : <Ionicons name="person-outline" size={28} color={palette.red} />}
              </View>
              <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Perfil palestrista</Text>
              <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{profile.fullName}</Text>
              {viewerSession?.role === 'administrador' && profile.id ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>ID interno: {profile.id}</Text> : null}
              <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{displayRoleLabel(visibleRole ?? profile.role, profile.province, provinceRoleLabels, roleAliases, visibleAssignedRoleLabel, profile.genderPreference)}</Text>
              {profile.communityName ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Comunidad: {profile.communityName}</Text> : null}
              {profile.province ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Provincia: {profile.province}</Text> : null}
              {profile.contact ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Contacto: {profile.contact}</Text> : null}
              {perseveranceLabel(profile.perseveranceStartYear) ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{perseveranceLabel(profile.perseveranceStartYear)}</Text> : null}
              {roleRank(profile.role) >= roleRank('sedimentador') && pmSummary ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>PM: {pmSummary}</Text> : null}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
