import React, { ReactNode, useEffect, useState } from 'react';
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
  canOpenManagement,
  managementButtonLabel,
  managementContent,
  editingNoticeId,
  canManageNotice,
  onBack,
  onRefresh,
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
  canOpenManagement: boolean;
  managementButtonLabel?: string;
  managementContent?: ReactNode;
  editingNoticeId?: string | null;
  canManageNotice: (notice: CommunityNoticePreview) => boolean;
  onBack: () => void;
  onRefresh: () => void;
  onViewProfile: (member: CommunityMember) => void;
  onMessage: (member: CommunityMember) => void;
  onEditNotice: (notice: CommunityNoticePreview) => void;
  onDeleteNotice: (noticeId: string) => void;
}) {
  const [managementOpen, setManagementOpen] = useState(false);

  useEffect(() => {
    if (editingNoticeId) {
      setManagementOpen(true);
    }
  }, [editingNoticeId]);

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

      {canOpenManagement ? (
        <>
          <TouchableOpacity style={communityStyles.managementButton} onPress={() => setManagementOpen((current) => !current)} activeOpacity={0.88}>
            <Ionicons name={managementOpen ? 'close-outline' : 'settings-outline'} size={18} color="#FFFFFF" />
            <Text style={communityStyles.managementButtonText}>
              {managementOpen ? 'Cerrar herramientas' : (managementButtonLabel || 'Abrir Panel de Comunidad')}
            </Text>
          </TouchableOpacity>
          {managementOpen ? (
            <View style={[communityStyles.managementPanel, isDark && communityStyles.managementPanelDark]}>
              {managementContent}
            </View>
          ) : null}
        </>
      ) : null}

      <CommunityLeaders
        members={members}
        viewerId={session.id}
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
        isDark={isDark}
        provinceRoleLabels={provinceRoleLabels}
        roleAliases={roleAliases}
        onViewProfile={onViewProfile}
        onMessage={onMessage}
      />
    </View>
  );
}
