import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Role } from '../../types/auth';
import { CommunityMember, ProvinceRoleLabelRecord } from '../../lib/profiles';
import { RoleAliasConfig } from '../../lib/appConfig';
import { roleLabelForProvince } from '../../lib/profileDisplay';
import { palette } from '../../theme/palette';
import { communityStyles } from './communityStyles';

const visibleLeaderRoles = new Set(['animador_comunidad', 'coordinador_comunidad', 'asesor']);

export function CommunityLeaders({
  members,
  viewerId,
  isDark,
  provinceRoleLabels,
  roleAliases,
  onViewProfile,
  onMessage
}: {
  members: CommunityMember[];
  viewerId?: string | null;
  isDark: boolean;
  provinceRoleLabels: ProvinceRoleLabelRecord[];
  roleAliases: RoleAliasConfig[];
  onViewProfile: (member: CommunityMember) => void;
  onMessage: (member: CommunityMember) => void;
}) {
  const leaders = members.filter((member) => visibleLeaderRoles.has(member.role));

  return (
    <View style={communityStyles.section}>
      <View>
        <Text style={[communityStyles.sectionTitle, isDark && communityStyles.sectionTitleDark]}>Encargados y acompañamiento</Text>
        <Text style={[communityStyles.sectionHint, isDark && communityStyles.sectionHintDark]}>
          Animación, coordinación y asesoría vinculadas a la comunidad.
        </Text>
      </View>
      {leaders.length === 0 ? (
        <View style={communityStyles.emptyState}>
          <Ionicons name="people-outline" size={26} color={palette.red} />
          <Text style={[communityStyles.emptyText, isDark && communityStyles.emptyTextDark]}>No hay encargados cargados por el momento.</Text>
        </View>
      ) : (
        <View style={communityStyles.peopleGrid}>
          {leaders.map((member) => {
            const name = member.full_name?.trim() || member.nickname?.trim() || 'Palestrista';
            const role = roleLabelForProvince(
              (member.role || 'palestrista') as Role,
              member.province,
              provinceRoleLabels,
              roleAliases,
              member.gender_preference ?? null
            );
            return (
              <TouchableOpacity
                key={member.id}
                style={[communityStyles.personCard, isDark && communityStyles.personCardDark]}
                onPress={() => onViewProfile(member)}
                activeOpacity={0.86}
              >
                <View style={communityStyles.avatar}>
                  {member.avatar_url ? (
                    <Image source={{ uri: member.avatar_url }} style={communityStyles.avatarImage} />
                  ) : (
                    <Text style={communityStyles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                  )}
                </View>
                <View style={communityStyles.personInfo}>
                  <Text numberOfLines={1} style={[communityStyles.personName, isDark && communityStyles.personNameDark]}>{name}</Text>
                  <Text numberOfLines={2} style={[communityStyles.personRole, isDark && communityStyles.personRoleDark]}>{role}</Text>
                </View>
                {member.id !== viewerId ? (
                  <TouchableOpacity
                    style={[communityStyles.messageButton, isDark && communityStyles.messageButtonDark]}
                    onPress={(event) => {
                      event.stopPropagation();
                      onMessage(member);
                    }}
                    accessibilityLabel={`Enviar mensaje a ${name}`}
                  >
                    <Ionicons name="chatbubble-outline" size={18} color={palette.red} />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
