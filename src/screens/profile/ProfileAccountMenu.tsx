import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProvinceRoleLabelRecord } from '../../lib/profiles';
import { RoleAliasConfig } from '../../lib/appConfig';
import { displayRoleLabel } from '../../lib/profileDisplay';
import { Session } from '../../types/auth';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  action: () => void;
};

export function ProfileAccountMenu({
  session,
  isDark,
  provinceRoleLabels,
  roleAliases,
  items,
  onSignOut
}: {
  session: Session;
  isDark: boolean;
  provinceRoleLabels: ProvinceRoleLabelRecord[];
  roleAliases: RoleAliasConfig[];
  items: MenuItem[];
  onSignOut: () => void;
}) {
  return (
    <View style={[styles.accountMenu, isDark && styles.surfacePanelDark]}>
      <View style={styles.accountMenuHeader}>
        <View style={styles.accountMenuAvatar}>
          {session.avatarUrl ? <Image source={{ uri: session.avatarUrl }} style={styles.accountMenuAvatarImage} /> : <Ionicons name="person-outline" size={18} color={palette.red} />}
        </View>
        <View style={styles.adminUserHeaderText}>
          <Text style={[styles.accountMenuName, isDark && styles.textDarkStrong]}>{session.fullName}</Text>
          <Text style={[styles.accountMenuSub, isDark && styles.textDarkMuted]}>{displayRoleLabel(session.role, session.province, provinceRoleLabels, roleAliases, session.displayRoleLabel, session.genderPreference)}</Text>
        </View>
      </View>
      {items.map((item) => (
        <TouchableOpacity key={item.label} style={styles.accountMenuItem} onPress={item.action}>
          <Ionicons name={item.icon} size={18} color={palette.inkMuted} />
          <Text style={[styles.accountMenuItemText, isDark && styles.textDarkBody]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.accountMenuItem} onPress={onSignOut}>
        <Ionicons name="log-out-outline" size={18} color={palette.red} />
        <Text style={[styles.accountMenuItemText, styles.accountMenuDanger]}>Cerrar sesion</Text>
      </TouchableOpacity>
    </View>
  );
}
