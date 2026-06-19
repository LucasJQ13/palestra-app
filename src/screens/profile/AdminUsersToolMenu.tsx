import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Role } from '../../types/auth';
import { AdminUsersTool } from '../../types/appUi';
import { APP_MESSAGES } from '../../lib/appMessages';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';

function adminUsersToolLabel(tool: AdminUsersTool) {
  if (tool === 'crear') {
    return APP_MESSAGES.adminPanels.users.createLabel;
  }
  if (tool === 'pendientes') {
    return APP_MESSAGES.adminPanels.users.pendingFullLabel;
  }
  if (tool === 'diagnostico') {
    return APP_MESSAGES.adminPanels.users.diagnosticFullLabel;
  }
  return APP_MESSAGES.adminPanels.users.listLabel;
}

export function AdminUsersToolMenu({
  role,
  tool,
  open,
  isDark,
  onToggle,
  onSelect
}: {
  role: Role;
  tool: AdminUsersTool;
  open: boolean;
  isDark: boolean;
  onToggle: () => void;
  onSelect: (tool: AdminUsersTool) => void;
}) {
  const options: { key: AdminUsersTool; label: string; detail: string }[] = [
    { key: 'listado', label: APP_MESSAGES.adminPanels.users.listLabel, detail: APP_MESSAGES.adminPanels.users.listDetail },
    ...(role === 'administrador' ? [{ key: 'crear' as const, label: APP_MESSAGES.adminPanels.users.createLabel, detail: APP_MESSAGES.adminPanels.users.createDetail }] : []),
    { key: 'pendientes', label: APP_MESSAGES.adminPanels.users.pendingLabel, detail: APP_MESSAGES.adminPanels.users.pendingDetail },
    ...(role === 'administrador' ? [{ key: 'diagnostico' as const, label: APP_MESSAGES.adminPanels.users.diagnosticLabel, detail: APP_MESSAGES.adminPanels.users.diagnosticDetail }] : [])
  ];

  return (
    <>
      <TouchableOpacity style={[styles.dropdownButton, isDark && styles.dropdownButtonDark]} onPress={onToggle} activeOpacity={0.86}>
        <View style={styles.adminUserHeaderText}>
          <Text style={styles.cardEyebrow}>{APP_MESSAGES.adminPanels.users.toolEyebrow}</Text>
          <Text style={[styles.dropdownButtonText, isDark && styles.dropdownButtonTextDark]}>{adminUsersToolLabel(tool)}</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
      </TouchableOpacity>
      {open ? (
        <ScrollView style={[styles.dropdownList, styles.adminUsersToolList, isDark && styles.dropdownListDark]} nestedScrollEnabled>
          {options.map((item) => (
            <TouchableOpacity key={item.key} style={[styles.dropdownItem, styles.adminUsersToolItem, isDark && styles.dropdownItemDark, tool === item.key && styles.adminUsersToolItemActive]} onPress={() => onSelect(item.key)}>
              <View style={styles.adminUserHeaderText}>
                <Text style={[styles.dropdownItemText, isDark && styles.dropdownItemTextDark, tool === item.key && styles.adminUsersToolItemTextActive]}>{item.label}</Text>
                <Text style={[styles.feedMeta, isDark && styles.textDarkMuted, tool === item.key && styles.adminUsersToolItemMetaActive]}>{item.detail}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}
    </>
  );
}
