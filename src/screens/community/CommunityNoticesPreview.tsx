import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Role } from '../../types/auth';
import { ProvinceRoleLabelRecord } from '../../lib/profiles';
import { RoleAliasConfig } from '../../lib/appConfig';
import { roleLabelForProvince } from '../../lib/profileDisplay';
import { palette } from '../../theme/palette';
import { communityStyles } from './communityStyles';
import { CommunityNoticeCard } from './notices/CommunityNoticeCard';

export type CommunityNoticePreview = {
  id?: string | null;
  title: string;
  subtitle?: string | null;
  body: string;
  bodyFormat?: string | null;
  kind?: string | null;
  visibility?: string | null;
  status?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
  authorName?: string | null;
  authorRole?: string | null;
  imageUrl?: string;
  linkLabel?: string | null;
  linkUrl?: string | null;
};

export function CommunityNoticesPreview({
  notices,
  province,
  isDark,
  provinceRoleLabels,
  roleAliases,
  canManage,
  editingId,
  onEdit,
  onDelete
}: {
  notices: CommunityNoticePreview[];
  province: string;
  isDark: boolean;
  provinceRoleLabels: ProvinceRoleLabelRecord[];
  roleAliases: RoleAliasConfig[];
  canManage: (notice: CommunityNoticePreview) => boolean;
  editingId?: string | null;
  onEdit: (notice: CommunityNoticePreview) => void;
  onDelete: (noticeId: string) => void;
}) {
  return (
    <View style={communityStyles.section}>
      <View>
        <Text style={[communityStyles.sectionTitle, isDark && communityStyles.sectionTitleDark]}>Avisos comunitarios</Text>
        <Text style={[communityStyles.sectionHint, isDark && communityStyles.sectionHintDark]}>Comunicados oficiales de tu comunidad.</Text>
      </View>
      {notices.length === 0 ? (
        <View style={communityStyles.emptyState}>
          <Ionicons name="megaphone-outline" size={26} color={palette.red} />
          <Text style={[communityStyles.emptyText, isDark && communityStyles.emptyTextDark]}>No hay avisos para tu comunidad actualmente.</Text>
        </View>
      ) : (
        <View style={communityStyles.noticeList}>
          {notices.map((notice, index) => {
            const role = roleLabelForProvince(
              (notice.authorRole || 'palestrista') as Role,
              province,
              provinceRoleLabels,
              roleAliases
            );
            const date = notice.createdAt
              ? new Date(notice.createdAt).toLocaleString('es-AR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Fecha no disponible';
            return (
              <CommunityNoticeCard
                key={`${notice.id || notice.title}-${index}`}
                notice={notice}
                roleLabel={role}
                dateLabel={date}
                isDark={isDark}
                canManage={Boolean(notice.id && canManage(notice))}
                isEditing={editingId === notice.id}
                onEdit={() => onEdit(notice)}
                onDelete={() => notice.id && onDelete(notice.id)}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}
