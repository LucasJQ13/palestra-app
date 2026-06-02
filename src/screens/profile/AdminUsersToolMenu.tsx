import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Role } from '../../types/auth';
import { AdminUsersTool } from '../../types/appUi';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';

function adminUsersToolLabel(tool: AdminUsersTool) {
  if (tool === 'crear') {
    return 'Crear usuario';
  }
  if (tool === 'pendientes') {
    return 'Pendientes de aprobacion';
  }
  if (tool === 'diagnostico') {
    return 'Diagnostico y liberacion';
  }
  return 'Lista de usuarios';
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
    { key: 'listado', label: 'Lista de usuarios', detail: 'Buscar, filtrar y editar desde cada fila' },
    ...(role === 'administrador' ? [{ key: 'crear' as const, label: 'Crear usuario', detail: 'Alta basica con mail y clave' }] : []),
    { key: 'pendientes', label: 'Pendientes', detail: 'Aprobar registrados recientes' },
    ...(role === 'administrador' ? [{ key: 'diagnostico' as const, label: 'Diagnostico', detail: 'Reparar o liberar un correo' }] : [])
  ];

  return (
    <>
      <TouchableOpacity style={[styles.dropdownButton, isDark && styles.dropdownButtonDark]} onPress={onToggle} activeOpacity={0.86}>
        <View style={styles.adminUserHeaderText}>
          <Text style={styles.cardEyebrow}>Herramienta</Text>
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
