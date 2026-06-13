import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Role } from '../../types/auth';
import { CommunityMember, ProvinceRoleLabelRecord } from '../../lib/profiles';
import { RoleAliasConfig } from '../../lib/appConfig';
import { roleLabelForProvince } from '../../lib/profileDisplay';
import { isCommunityVisibleReferenceRole } from '../../lib/community/roles';
import { palette } from '../../theme/palette';
import { IconButton } from '../../components/ui';
import { communityStyles } from './communityStyles';

export function CommunityLeaders({
  members,
  advisorUserIds,
  viewerId,
  canMessageMembers,
  isDark,
  provinceRoleLabels,
  roleAliases,
  onViewProfile,
  onMessage
}: {
  members: CommunityMember[];
  advisorUserIds: string[];
  viewerId?: string | null;
  canMessageMembers: boolean;
  isDark: boolean;
  provinceRoleLabels: ProvinceRoleLabelRecord[];
  roleAliases: RoleAliasConfig[];
  onViewProfile: (member: CommunityMember) => void;
  onMessage: (member: CommunityMember) => void;
}) {
  const assignedAdvisorIds = new Set(advisorUserIds);
  const leaders = members.filter((member) => (
    isCommunityVisibleReferenceRole(member.role)
    && (member.role !== 'asesor' || assignedAdvisorIds.has(member.id))
  ));

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
                {canMessageMembers && member.id !== viewerId ? (
                  <IconButton
                    icon="chatbubble-outline"
                    variant="ghost"
                    size="sm"
                    onPress={(event) => {
                      event.stopPropagation();
                      onMessage(member);
                    }}
                    accessibilityLabel={`Enviar mensaje a ${name}`}
                  />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
