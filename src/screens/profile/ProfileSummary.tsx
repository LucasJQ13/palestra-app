import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProvinceRoleLabelRecord } from '../../lib/profiles';
import { RoleAliasConfig } from '../../lib/appConfig';
import { displayRoleLabel, perseveranceLabel, personalPmSummary } from '../../lib/profileDisplay';
import { roleRank } from '../../lib/roles';
import { Session } from '../../types/auth';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';

export function ProfileSummary({
  session,
  isDark,
  provinceRoleLabels,
  roleAliases,
  onUploadPhoto
}: {
  session: Session;
  isDark: boolean;
  provinceRoleLabels: ProvinceRoleLabelRecord[];
  roleAliases: RoleAliasConfig[];
  onUploadPhoto: () => void;
}) {
  const role = displayRoleLabel(session.role, session.province, provinceRoleLabels, roleAliases, session.displayRoleLabel, session.genderPreference);
  const perseverance = perseveranceLabel(session.perseveranceStartYear);
  const pmSummary = personalPmSummary({
    type: session.personalPmType,
    number: session.personalPmNumber,
    province: session.personalPmProvince,
    motto: session.personalPmMotto ?? session.pmMotto
  });
  const metaItems = [
    { label: 'Provincia', value: session.province, icon: 'map-outline' },
    { label: 'Rango', value: role, icon: 'ribbon-outline' },
    ...(perseverance ? [{ label: 'Perseverancia', value: perseverance, icon: 'time-outline' }] : []),
    { label: 'Contacto', value: session.contact, icon: 'chatbubble-ellipses-outline' },
    { label: 'Comunidad', value: session.communityOfOrigin, icon: 'people-outline' }
  ];

  return (
    <>
      <View style={[styles.profileHero, isDark && styles.surfacePanelDark]}>
        <TouchableOpacity style={styles.avatarFrameLarge} onPress={onUploadPhoto} activeOpacity={0.88}>
          {session.avatarUrl ? <Image source={{ uri: session.avatarUrl }} style={styles.avatarImageLarge} /> : <Ionicons name="camera-outline" size={42} color={palette.red} />}
        </TouchableOpacity>
        <View style={styles.profileHeroInfo}>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Mi Perfil</Text>
          <View style={styles.profileNameRow}>
            <Text style={[styles.profileName, isDark && styles.textDarkStrong]}>{session.fullName}</Text>
            <View style={styles.verifiedRow}>
              <Ionicons name="shield-checkmark-outline" size={22} color={palette.green} />
            </View>
          </View>
          <View style={styles.profileRolePill}>
            <Ionicons name="ribbon-outline" size={15} color={palette.red} />
            <Text style={styles.profileRolePillText}>{role}</Text>
          </View>
          {session.email ? <Text style={[styles.profileEmailText, isDark && styles.textDarkBody]}>{session.email}</Text> : null}
          {perseverance ? <Text style={[styles.profileHonorText, isDark && styles.textDarkAccent]}>{perseverance}</Text> : null}
          {roleRank(session.role) >= roleRank('sedimentador') && pmSummary ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{pmSummary}</Text> : null}
          <TouchableOpacity style={[styles.photoChangeButton, isDark && styles.darkSoftButton]} onPress={onUploadPhoto}>
            <Ionicons name="camera-outline" size={16} color={palette.red} />
            <Text style={styles.photoChangeText}>{session.avatarUrl ? 'Cambiar foto de perfil' : 'Subir foto de perfil'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.profileMetaGrid}>
        {metaItems.map((item) => (
          <View key={item.label} style={[styles.profileMetaItem, isDark && styles.surfaceCardDark]}>
            <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={17} color={palette.red} />
            <View style={styles.profileMetaText}>
              <Text style={[styles.profileMetaLabel, isDark && styles.textDarkMuted]}>{item.label}</Text>
              <Text style={[styles.profileMetaValue, isDark && styles.textDarkStrong]}>{item.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}
