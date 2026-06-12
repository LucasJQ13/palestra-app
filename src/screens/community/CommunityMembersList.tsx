import React, { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommunityMember, ProvinceRoleLabelRecord } from '../../lib/profiles';
import { RoleAliasConfig } from '../../lib/appConfig';
import { Role } from '../../types/auth';
import { roleLabelForProvince } from '../../lib/profileDisplay';
import { palette } from '../../theme/palette';
import { communityStyles } from './communityStyles';

export function CommunityMembersList({
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
  const [open, setOpen] = useState(false);

  return (
    <View style={communityStyles.section}>
      <View style={communityStyles.sectionHeader}>
        <View>
          <Text style={[communityStyles.sectionTitle, isDark && communityStyles.sectionTitleDark]}>Miembros</Text>
          <Text style={[communityStyles.sectionHint, isDark && communityStyles.sectionHintDark]}>{members.length} integrante/s</Text>
        </View>
        <TouchableOpacity
          style={[communityStyles.membersToggle, isDark && communityStyles.membersToggleDark]}
          onPress={() => setOpen((current) => !current)}
          activeOpacity={0.86}
        >
          <Ionicons name="people-outline" size={16} color={palette.red} />
          <Text style={communityStyles.membersToggleText}>{open ? 'Ocultar lista' : 'Ver miembros'}</Text>
          <Ionicons name={open ? 'chevron-up-outline' : 'chevron-down-outline'} size={15} color={palette.red} />
        </TouchableOpacity>
      </View>
      {open ? (
        <ScrollView style={communityStyles.membersList} nestedScrollEnabled showsVerticalScrollIndicator>
          {members.map((member) => {
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
                style={[communityStyles.memberRow, isDark && communityStyles.memberRowDark]}
                onPress={() => onViewProfile(member)}
                activeOpacity={0.86}
              >
                <View style={communityStyles.avatar}>
                  {member.avatar_url ? <Image source={{ uri: member.avatar_url }} style={communityStyles.avatarImage} /> : <Text style={communityStyles.avatarText}>{name.charAt(0).toUpperCase()}</Text>}
                </View>
                <View style={communityStyles.personInfo}>
                  <Text numberOfLines={1} style={[communityStyles.personName, isDark && communityStyles.personNameDark]}>{name}</Text>
                  {member.nickname ? <Text style={[communityStyles.personRole, isDark && communityStyles.personRoleDark]}>“{member.nickname}”</Text> : null}
                  <Text numberOfLines={1} style={[communityStyles.personRole, isDark && communityStyles.personRoleDark]}>{role}</Text>
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
        </ScrollView>
      ) : null}
    </View>
  );
}
