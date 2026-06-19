import React, { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommunityMember, ProvinceRoleLabelRecord } from '../../lib/profiles';
import { RoleAliasConfig } from '../../lib/appConfig';
import { Role } from '../../types/auth';
import { roleLabelForProvince } from '../../lib/profileDisplay';
import { APP_MESSAGES } from '../../lib/appMessages';
import { palette } from '../../theme/palette';
import { AppButton, IconButton } from '../../components/ui';
import { communityStyles } from './communityStyles';

export function CommunityMembersList({
  members,
  viewerId,
  canMessageMembers,
  isDark,
  provinceRoleLabels,
  roleAliases,
  onViewProfile,
  onMessage
}: {
  members: CommunityMember[];
  viewerId?: string | null;
  canMessageMembers: boolean;
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
          <Text style={[communityStyles.sectionTitle, isDark && communityStyles.sectionTitleDark]}>{APP_MESSAGES.community.membersTitle}</Text>
          <Text style={[communityStyles.sectionHint, isDark && communityStyles.sectionHintDark]}>{APP_MESSAGES.community.membersCount(members.length)}</Text>
        </View>
        <AppButton
          label={open ? APP_MESSAGES.community.membersHide : APP_MESSAGES.community.membersShow}
          icon={open ? 'chevron-up-outline' : 'people-outline'}
          variant="secondary"
          size="compact"
          onPress={() => setOpen((current) => !current)}
        />
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
                  {member.nickname ? <Text style={[communityStyles.personRole, isDark && communityStyles.personRoleDark]}>"{member.nickname}"</Text> : null}
                  <Text numberOfLines={1} style={[communityStyles.personRole, isDark && communityStyles.personRoleDark]}>{role}</Text>
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
        </ScrollView>
      ) : null}
    </View>
  );
}
