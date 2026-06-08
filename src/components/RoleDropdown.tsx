import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roleDefinitions } from '../data/content';
import { Role } from '../types/auth';
import { roleLabel } from '../lib/profileDisplay';
import { useIsDarkTheme } from '../theme/ThemeContext';
import { palette } from '../theme/palette';
import { styles } from '../theme/appStyles';

export function RoleDropdown({
  label,
  value,
  open,
  onToggle,
  onSelect,
  roles
}: {
  label: string;
  value: Role;
  open: boolean;
  onToggle: () => void;
  onSelect: (role: Role) => void;
  roles?: typeof roleDefinitions;
}) {
  const isDark = useIsDarkTheme();
  const options = (roles ?? roleDefinitions).filter((role) => role.role !== 'invitado');
  const selected = options.find((role) => role.role === value);
  return (
    <View>
      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{label}</Text>
      <TouchableOpacity style={[styles.dropdownButton, isDark && styles.dropdownButtonDark]} onPress={onToggle} activeOpacity={0.84}>
        <Text style={[styles.dropdownButtonText, isDark && styles.dropdownButtonTextDark]}>{selected?.label ?? roleLabel(value)}</Text>
        <Ionicons name={open ? 'chevron-up-outline' : 'chevron-down-outline'} size={18} color={palette.red} />
      </TouchableOpacity>
      {open ? (
        <ScrollView style={[styles.dropdownList, isDark && styles.dropdownListDark]} nestedScrollEnabled keyboardShouldPersistTaps="handled">
          {options.map((role) => (
            <TouchableOpacity
              key={role.role}
              style={[styles.dropdownItem, isDark && styles.dropdownItemDark, role.role === value && styles.communityChoiceActive]}
              onPress={() => {
                onSelect(role.role as Role);
                onToggle();
              }}
            >
              <Text style={[styles.dropdownItemText, isDark && styles.dropdownItemTextDark, role.role === value && styles.filterChipTextActive]}>{role.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}
