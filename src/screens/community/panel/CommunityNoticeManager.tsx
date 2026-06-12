import React from 'react';
import { Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inputPlaceholderColor } from '../../../lib/constants';
import { CommunityNoticePreview } from '../CommunityNoticesPreview';
import { communityPanelStyles as styles } from './communityPanelStyles';

export function CommunityNoticeManager({
  notices,
  isDark,
  title,
  body,
  notify,
  canNotify,
  editingId,
  editingTitle,
  editingBody,
  onTitleChange,
  onBodyChange,
  onNotifyChange,
  onPublish,
  onStartEdit,
  onEditingTitleChange,
  onEditingBodyChange,
  onSaveEdit,
  onCancelEdit,
  onArchive,
  canManageNotice
}: {
  notices: CommunityNoticePreview[];
  isDark: boolean;
  title: string;
  body: string;
  notify: boolean;
  canNotify: boolean;
  editingId?: string | null;
  editingTitle: string;
  editingBody: string;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onNotifyChange: (value: boolean) => void;
  onPublish: () => void;
  onStartEdit: (notice: CommunityNoticePreview) => void;
  onEditingTitleChange: (value: string) => void;
  onEditingBodyChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onArchive: (noticeId: string) => void;
  canManageNotice: (notice: CommunityNoticePreview) => boolean;
}) {
  return (
    <View style={[styles.panel, isDark && styles.panelDark]}>
      <Text style={[styles.sectionTitle, isDark && styles.titleDark]}>Avisos comunitarios</Text>
      <TextInput style={[styles.input, isDark && styles.inputDark]} value={title} onChangeText={onTitleChange} placeholder="Título del aviso" placeholderTextColor={inputPlaceholderColor} />
      <TextInput style={[styles.input, styles.textArea, isDark && styles.inputDark]} value={body} onChangeText={onBodyChange} placeholder="Mensaje para la comunidad" placeholderTextColor={inputPlaceholderColor} multiline />
      {canNotify ? (
        <View style={styles.memberRow}>
          <View style={styles.memberInfo}>
            <Text style={[styles.noticeTitle, isDark && styles.titleDark]}>Notificar a miembros</Text>
            <Text style={[styles.body, isDark && styles.bodyDark]}>Además de publicar, genera una notificación para la comunidad.</Text>
          </View>
          <Switch value={notify} onValueChange={onNotifyChange} />
        </View>
      ) : null}
      <TouchableOpacity style={styles.primaryButton} onPress={onPublish}>
        <Ionicons name="send-outline" size={18} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>Publicar aviso</Text>
      </TouchableOpacity>

      {notices.map((notice) => (
        <View key={notice.id || notice.title} style={styles.notice}>
          {editingId === notice.id ? (
            <>
              <TextInput style={[styles.input, isDark && styles.inputDark]} value={editingTitle} onChangeText={onEditingTitleChange} placeholder="Título" placeholderTextColor={inputPlaceholderColor} />
              <TextInput style={[styles.input, styles.textArea, isDark && styles.inputDark]} value={editingBody} onChangeText={onEditingBodyChange} placeholder="Contenido" placeholderTextColor={inputPlaceholderColor} multiline />
              <View style={styles.noticeActions}>
                <TouchableOpacity style={styles.primaryButton} onPress={onSaveEdit}>
                  <Text style={styles.primaryButtonText}>Guardar cambios</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={onCancelEdit}>
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.noticeTitle, isDark && styles.titleDark]}>{notice.title}</Text>
              <Text style={[styles.body, isDark && styles.bodyDark]} numberOfLines={4}>{notice.body}</Text>
              {notice.id && canManageNotice(notice) ? (
                <View style={styles.noticeActions}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => onStartEdit(notice)}>
                    <Ionicons name="create-outline" size={17} color="#2D8DC8" />
                    <Text style={styles.secondaryButtonText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => onArchive(notice.id as string)}>
                    <Ionicons name="archive-outline" size={17} color="#2D8DC8" />
                    <Text style={styles.secondaryButtonText}>Archivar</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </>
          )}
        </View>
      ))}
    </View>
  );
}
