import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppCommunityLocation } from '../../lib/remoteData';
import { CommunityMember, ProvinceRoleLabelRecord } from '../../lib/profiles';
import { RoleAliasConfig } from '../../lib/appConfig';
import { Session } from '../../types/auth';
import { palette } from '../../theme/palette';
import { CommunityHeader } from './CommunityHeader';
import { CommunityLeaders } from './CommunityLeaders';
import { CommunityMembersList } from './CommunityMembersList';
import { CommunityNoticePreview, CommunityNoticesPreview } from './CommunityNoticesPreview';
import { communityStyles } from './communityStyles';

export function MyCommunityScreen({
  session,
  community,
  members,
  notices,
  isDark,
  provinceRoleLabels,
  roleAliases,
  canAccessPanel,
  canMessageMembers,
  editingNoticeId,
  canManageNotice,
  onBack,
  onRefresh,
  onOpenPanel,
  onViewProfile,
  onMessage,
  onEditNotice,
  onDeleteNotice
}: {
  session: Session;
  community?: AppCommunityLocation | null;
  members: CommunityMember[];
  notices: CommunityNoticePreview[];
  isDark: boolean;
  provinceRoleLabels: ProvinceRoleLabelRecord[];
  roleAliases: RoleAliasConfig[];
  canAccessPanel: boolean;
  canMessageMembers: boolean;
  editingNoticeId?: string | null;
  canManageNotice: (notice: CommunityNoticePreview) => boolean;
  onBack: () => void;
  onRefresh: () => void;
  onOpenPanel: () => void;
  onViewProfile: (member: CommunityMember) => void;
  onMessage: (member: CommunityMember) => void;
  onEditNotice: (notice: CommunityNoticePreview) => void;
  onDeleteNotice: (noticeId: string) => void;
}) {
  return (
    <View style={communityStyles.screen}>
      <View style={communityStyles.topBar}>
        <TouchableOpacity style={[communityStyles.iconButton, isDark && communityStyles.iconButtonDark]} onPress={onBack} accessibilityLabel="Volver a Mi Perfil">
          <Ionicons name="arrow-back-outline" size={21} color={palette.red} />
        </TouchableOpacity>
        <Text style={[communityStyles.topBarTitle, isDark && communityStyles.topBarTitleDark]}>Mi Comunidad</Text>
        <TouchableOpacity style={[communityStyles.iconButton, isDark && communityStyles.iconButtonDark]} onPress={onRefresh} accessibilityLabel="Actualizar Mi Comunidad">
          <Ionicons name="refresh-outline" size={20} color={palette.red} />
        </TouchableOpacity>
      </View>

      <CommunityHeader community={community} province={session.province} />

      {canAccessPanel ? (
        <TouchableOpacity style={communityStyles.managementButton} onPress={onOpenPanel} activeOpacity={0.88}>
          <Ionicons name="settings-outline" size={18} color="#FFFFFF" />
          <Text style={communityStyles.managementButtonText}>Abrir Panel de Comunidad</Text>
          <Ionicons name="chevron-forward-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      ) : null}

      <CommunityLeaders
        members={members}
        viewerId={session.id}
        canMessageMembers={canMessageMembers}
        isDark={isDark}
        provinceRoleLabels={provinceRoleLabels}
        roleAliases={roleAliases}
        onViewProfile={onViewProfile}
        onMessage={onMessage}
      />

      <CommunityNoticesPreview
        notices={notices}
        province={session.province}
        isDark={isDark}
        provinceRoleLabels={provinceRoleLabels}
        roleAliases={roleAliases}
        canManage={canManageNotice}
        editingId={editingNoticeId}
        onEdit={onEditNotice}
        onDelete={onDeleteNotice}
      />

      <CommunityMembersList
        members={members}
        viewerId={session.id}
        canMessageMembers={canMessageMembers}
        isDark={isDark}
        provinceRoleLabels={provinceRoleLabels}
        roleAliases={roleAliases}
        onViewProfile={onViewProfile}
        onMessage={onMessage}
      />
    </View>
  );
}
