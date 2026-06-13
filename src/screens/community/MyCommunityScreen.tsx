import React from 'react';
import { Text, View } from 'react-native';
import { AppButton, IconButton } from '../../components/ui';
import { AppCommunityLocation } from '../../lib/remoteData';
import { CommunityMember, ProvinceRoleLabelRecord } from '../../lib/profiles';
import { RoleAliasConfig } from '../../lib/appConfig';
import { Session } from '../../types/auth';
import { CommunityHeader } from './CommunityHeader';
import { CommunityLeaders } from './CommunityLeaders';
import { CommunityMembersList } from './CommunityMembersList';
import { CommunityNoticePreview, CommunityNoticesPreview } from './CommunityNoticesPreview';
import { communityStyles } from './communityStyles';

export function MyCommunityScreen({
  session,
  community,
  members,
  advisorUserIds,
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
  advisorUserIds: string[];
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
        <IconButton icon="arrow-back-outline" onPress={onBack} accessibilityLabel="Volver a Mi Perfil" />
        <Text style={[communityStyles.topBarTitle, isDark && communityStyles.topBarTitleDark]}>Mi Comunidad</Text>
        <IconButton icon="refresh-outline" onPress={onRefresh} accessibilityLabel="Actualizar Mi Comunidad" />
      </View>

      <CommunityHeader community={community} province={session.province} />

      {canAccessPanel ? (
        <AppButton label="Abrir Panel de Comunidad" icon="settings-outline" onPress={onOpenPanel} fullWidth />
      ) : null}

      <CommunityLeaders
        members={members}
        advisorUserIds={advisorUserIds}
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
