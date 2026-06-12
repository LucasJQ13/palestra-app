import React from 'react';
import { Switch, Text, View } from 'react-native';
import { CommunityNoticeDraft } from '../../../lib/community/notices';
import { CommunityNoticePreview } from '../CommunityNoticesPreview';
import { CommunityNoticeCard } from '../notices/CommunityNoticeCard';
import { CommunityNoticeEditor } from '../notices/CommunityNoticeEditor';
import { communityPanelStyles as styles } from './communityPanelStyles';

export function CommunityNoticeManager({
  notices,
  isDark,
  draft,
  notify,
  canNotify,
  editingId,
  editingDraft,
  onDraftChange,
  onNotifyChange,
  onPublish,
  onStartEdit,
  onEditingDraftChange,
  onSaveEdit,
  onCancelEdit,
  onArchive,
  canManageNotice
}: {
  notices: CommunityNoticePreview[];
  isDark: boolean;
  draft: CommunityNoticeDraft;
  notify: boolean;
  canNotify: boolean;
  editingId?: string | null;
  editingDraft: CommunityNoticeDraft;
  onDraftChange: (value: CommunityNoticeDraft) => void;
  onNotifyChange: (value: boolean) => void;
  onPublish: () => void;
  onStartEdit: (notice: CommunityNoticePreview) => void;
  onEditingDraftChange: (value: CommunityNoticeDraft) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onArchive: (noticeId: string) => void;
  canManageNotice: (notice: CommunityNoticePreview) => boolean;
}) {
  return (
    <View style={[styles.panel, isDark && styles.panelDark]}>
      <Text style={[styles.sectionTitle, isDark && styles.titleDark]}>Nuevo aviso comunitario</Text>
      <Text style={[styles.body, isDark && styles.bodyDark]}>
        Publicá un comunicado oficial. Los miembros podrán leerlo, pero no responderlo.
      </Text>
      <CommunityNoticeEditor
        value={draft}
        isDark={isDark}
        submitLabel="Publicar aviso"
        onChange={onDraftChange}
        onSubmit={onPublish}
      />
      {canNotify ? (
        <View style={styles.memberRow}>
          <View style={styles.memberInfo}>
            <Text style={[styles.noticeTitle, isDark && styles.titleDark]}>Notificar a miembros</Text>
            <Text style={[styles.body, isDark && styles.bodyDark]}>Además de publicar, genera una notificación para la comunidad.</Text>
          </View>
          <Switch value={notify} onValueChange={onNotifyChange} />
        </View>
      ) : null}

      {notices.length ? (
        <>
          <Text style={[styles.sectionTitle, isDark && styles.titleDark]}>Avisos publicados</Text>
          {notices.map((notice) => (
            <View key={notice.id || notice.title} style={styles.notice}>
              {editingId === notice.id ? (
                <CommunityNoticeEditor
                  value={editingDraft}
                  isDark={isDark}
                  submitLabel="Guardar cambios"
                  onChange={onEditingDraftChange}
                  onSubmit={onSaveEdit}
                  onCancel={onCancelEdit}
                />
              ) : (
                <CommunityNoticeCard
                  notice={notice}
                  roleLabel={notice.authorRole || 'Palestrista'}
                  dateLabel={notice.createdAt ? new Date(notice.createdAt).toLocaleString('es-AR') : 'Fecha no disponible'}
                  isDark={isDark}
                  canManage={Boolean(notice.id && canManageNotice(notice))}
                  isEditing={false}
                  onEdit={() => onStartEdit(notice)}
                  onDelete={() => notice.id && onArchive(notice.id)}
                />
              )}
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}
