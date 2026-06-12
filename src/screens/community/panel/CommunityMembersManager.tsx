import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommunityMember } from '../../../lib/profiles';
import { communityPanelStyles as styles } from './communityPanelStyles';

export function CommunityMembersManager({
  members,
  isDark,
  onViewProfile
}: {
  members: CommunityMember[];
  isDark: boolean;
  onViewProfile: (member: CommunityMember) => void;
}) {
  return (
    <View style={[styles.panel, isDark && styles.panelDark]}>
      <Text style={[styles.sectionTitle, isDark && styles.titleDark]}>Miembros</Text>
      <Text style={[styles.body, isDark && styles.bodyDark]}>{members.length} personas vinculadas a la comunidad.</Text>
      {members.length === 0 ? (
        <Text style={styles.empty}>No hay miembros cargados.</Text>
      ) : (
        <ScrollView style={styles.membersList} nestedScrollEnabled>
          {members.map((member) => (
            <TouchableOpacity key={member.id} style={styles.memberRow} onPress={() => onViewProfile(member)}>
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, isDark && styles.titleDark]}>{member.full_name || member.nickname || 'Palestrista'}</Text>
                <Text style={[styles.body, isDark && styles.bodyDark]}>{member.nickname ? `@${member.nickname} · ` : ''}{member.role}</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color="#2D8DC8" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
