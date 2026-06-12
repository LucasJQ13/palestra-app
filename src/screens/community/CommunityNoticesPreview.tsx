import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Role } from '../../types/auth';
import { ProvinceRoleLabelRecord } from '../../lib/profiles';
import { RoleAliasConfig } from '../../lib/appConfig';
import { roleLabelForProvince } from '../../lib/profileDisplay';
import { palette } from '../../theme/palette';
import { communityStyles } from './communityStyles';

export type CommunityNoticePreview = {
  id?: string | null;
  title: string;
  body: string;
  kind?: string | null;
  visibility?: string | null;
  status?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
  authorName?: string | null;
  authorRole?: string | null;
  imageUrl?: string;
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
              ? new Date(notice.createdAt).toLocaleString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
              : 'Fecha no disponible';
            return (
              <View key={`${notice.id || notice.title}-${index}`} style={[communityStyles.notice, isDark && communityStyles.noticeDark]}>
                <View style={communityStyles.noticeMeta}>
                  <Text style={communityStyles.noticeBadge}>{notice.kind || 'Aviso'}</Text>
                  <Text style={[communityStyles.noticeDate, isDark && communityStyles.noticeDateDark]}>{date}</Text>
                </View>
                <Text style={[communityStyles.noticeTitle, isDark && communityStyles.noticeTitleDark]}>{notice.title || 'Aviso comunitario'}</Text>
                <Text selectable style={[communityStyles.noticeBody, isDark && communityStyles.noticeBodyDark]}>{notice.body}</Text>
                {notice.imageUrl ? <Image source={{ uri: notice.imageUrl }} style={communityStyles.noticeImage} resizeMode="cover" /> : null}
                <Text style={[communityStyles.noticeAuthor, isDark && communityStyles.noticeDateDark]}>
                  {notice.authorName || 'Palestrista'} · {role}
                </Text>
                {notice.id && canManage(notice) ? (
                  <View style={communityStyles.noticeMeta}>
                    <TouchableOpacity style={communityStyles.membersToggle} onPress={() => onEdit(notice)}>
                      <Ionicons name={editingId === notice.id ? 'close-outline' : 'create-outline'} size={16} color={palette.red} />
                      <Text style={communityStyles.membersToggleText}>{editingId === notice.id ? 'Cerrar edición' : 'Editar'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={communityStyles.membersToggle} onPress={() => onDelete(notice.id as string)}>
                      <Ionicons name="trash-outline" size={16} color={palette.red} />
                      <Text style={communityStyles.membersToggleText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
