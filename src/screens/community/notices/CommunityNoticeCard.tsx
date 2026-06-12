import React from 'react';
import { Image, Linking, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinkedSelectableText } from '../../../components/LinkedSelectableText';
import { normalizeCommunityNoticeFormat, normalizeCommunityNoticeLink } from '../../../lib/community/notices';
import { palette } from '../../../theme/palette';
import { CommunityNoticePreview } from '../CommunityNoticesPreview';
import { communityStyles } from '../communityStyles';

export function CommunityNoticeCard({
  notice,
  roleLabel,
  dateLabel,
  isDark,
  canManage,
  isEditing,
  onEdit,
  onDelete
}: {
  notice: CommunityNoticePreview;
  roleLabel: string;
  dateLabel: string;
  isDark: boolean;
  canManage: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const bodyFormat = normalizeCommunityNoticeFormat(notice.bodyFormat);
  const linkUrl = notice.linkUrl ? normalizeCommunityNoticeLink(notice.linkUrl) : null;

  return (
    <View style={[communityStyles.notice, isDark && communityStyles.noticeDark]}>
      <View style={communityStyles.noticeMeta}>
        <View style={communityStyles.noticeBadgeRow}>
          <Ionicons name="megaphone-outline" size={14} color={palette.red} />
          <Text style={communityStyles.noticeBadge}>Comunicado oficial</Text>
        </View>
        <Text style={[communityStyles.noticeDate, isDark && communityStyles.noticeDateDark]}>{dateLabel}</Text>
      </View>
      <Text style={[communityStyles.noticeTitle, isDark && communityStyles.noticeTitleDark]}>{notice.title || 'Aviso comunitario'}</Text>
      {notice.subtitle ? (
        <Text style={[communityStyles.noticeSubtitle, isDark && communityStyles.noticeSubtitleDark]}>{notice.subtitle}</Text>
      ) : null}
      <LinkedSelectableText
        text={notice.body}
        style={[
          communityStyles.noticeBody,
          bodyFormat === 'bold' && communityStyles.noticeBodyBold,
          bodyFormat === 'underline' && communityStyles.noticeBodyUnderline,
          isDark && communityStyles.noticeBodyDark
        ]}
        linkStyle={communityStyles.noticeInlineLink}
      />
      {notice.imageUrl ? <Image source={{ uri: notice.imageUrl }} style={communityStyles.noticeImage} resizeMode="cover" /> : null}
      {linkUrl ? (
        <TouchableOpacity style={[communityStyles.noticeLinkButton, isDark && communityStyles.noticeLinkButtonDark]} onPress={() => Linking.openURL(linkUrl)}>
          <Ionicons name="open-outline" size={17} color={palette.red} />
          <Text style={communityStyles.noticeLinkText}>{notice.linkLabel || 'Abrir enlace'}</Text>
        </TouchableOpacity>
      ) : null}
      <View style={communityStyles.noticeFooter}>
        <Text style={[communityStyles.noticeAuthor, isDark && communityStyles.noticeDateDark]}>
          {notice.authorName || 'Palestrista'} · {roleLabel}
        </Text>
        <Text style={[communityStyles.noticeNoReplies, isDark && communityStyles.noticeDateDark]}>Solo lectura</Text>
      </View>
      {notice.id && canManage ? (
        <View style={communityStyles.noticeMeta}>
          <TouchableOpacity style={[communityStyles.membersToggle, isDark && communityStyles.membersToggleDark]} onPress={onEdit}>
            <Ionicons name={isEditing ? 'close-outline' : 'create-outline'} size={16} color={palette.red} />
            <Text style={communityStyles.membersToggleText}>{isEditing ? 'Cerrar edición' : 'Editar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[communityStyles.membersToggle, isDark && communityStyles.membersToggleDark]} onPress={onDelete}>
            <Ionicons name="archive-outline" size={16} color={palette.red} />
            <Text style={communityStyles.membersToggleText}>Archivar</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
