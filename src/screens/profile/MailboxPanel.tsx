import React from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';
import { inputPlaceholderColor } from '../../lib/constants';
import { AdminUser, MailboxConversationRecord, MailboxMessageRecord, MailboxTargetMode, ProvinceRoleLabelRecord, PublicUserDirectoryRecord } from '../../lib/profiles';
import { Role, Session } from '../../types/auth';
import { RoleAliasConfig } from '../../lib/appConfig';
import { roleRank, visibleHierarchyFor } from '../../lib/roles';
import { roleLabel, roleLabelForProvince } from '../../lib/profileDisplay';
import { SectionTitle } from '../../components/SectionTitle';

type MailboxCommunityOption = {
  id?: string | null;
  name: string;
};

const adminTargetModes: [MailboxTargetMode, string][] = [
  ['user', 'Usuario'],
  ['role', 'Rango'],
  ['province', 'Provincia'],
  ['role_province', 'Rango + provincia'],
  ['all', 'Todos']
];

const nationalTargetModes: [MailboxTargetMode, string][] = [
  ['user', 'Usuario'],
  ['role', 'Rango'],
  ['diocesan_leadership', 'Dirigencia diocesana']
];

const diocesanTargetModes: [MailboxTargetMode, string][] = [
  ['user', 'Usuario'],
  ['role', 'Rango'],
  ['community', 'Comunidad'],
  ['province_communities', 'Todas de mi provincia']
];

const communityTargetModes: [MailboxTargetMode, string][] = [
  ['user', 'Usuario'],
  ['my_community', 'Responsables']
];

function targetModesForSession(session: Session): [MailboxTargetMode, string][] {
  if (session.role === 'administrador') {
    return adminTargetModes;
  }
  if (['vocal_nacional', 'coordinador_nacional'].includes(session.role)) {
    return nationalTargetModes;
  }
  if (['vocal', 'coordinador_diocesano'].includes(session.role)) {
    return diocesanTargetModes;
  }
  return communityTargetModes;
}

export function MailboxPanel({
  session,
  isDark,
  showComposer,
  targetMode,
  communityOptions,
  targetCommunityId,
  targetProvince,
  provinceDropdownOpen,
  provinceOptions,
  targetRole,
  roleDropdownOpen,
  recipientSearch,
  userDropdownOpen,
  selectedUserIds,
  filteredUserOptions,
  selectedUsers,
  provinceRoleLabels,
  roleAliases,
  estimatedRecipients,
  draft,
  filter,
  conversations,
  selectedConversationId,
  selectedConversation,
  conversationDraft,
  conversationSending,
  reportingMessageId,
  reportReason,
  reportComment,
  messages,
  expandedMessageIds,
  responses,
  onToggleComposer,
  onRefresh,
  onTargetModeChange,
  onTargetCommunityChange,
  onTargetProvinceChange,
  onProvinceDropdownChange,
  onTargetRoleChange,
  onRoleDropdownChange,
  onRecipientSearchChange,
  onUserDropdownChange,
  onToggleUser,
  onDraftChange,
  onSubmitNewMessage,
  onSaveDraft,
  onFilterChange,
  onOpenConversation,
  onCloseConversation,
  onConversationDraftChange,
  onSendConversationReply,
  onToggleReportMessage,
  onReportReasonChange,
  onReportCommentChange,
  onSubmitMessageReport,
  onResponseChange,
  onSubmitResponse,
  onStartDirectReply,
  onUpdateStatus,
  onOpenMessage,
  onDeleteForMe,
  onDeleteConversationForMe,
  onRestoreForMe
}: {
  session: Session;
  isDark: boolean;
  showComposer: boolean;
  targetMode: MailboxTargetMode;
  communityOptions: MailboxCommunityOption[];
  targetCommunityId: string;
  targetProvince: string;
  provinceDropdownOpen: boolean;
  provinceOptions: string[];
  targetRole: Role;
  roleDropdownOpen: boolean;
  recipientSearch: string;
  userDropdownOpen: boolean;
  selectedUserIds: string[];
  filteredUserOptions: Array<AdminUser | PublicUserDirectoryRecord>;
  selectedUsers: Array<AdminUser | PublicUserDirectoryRecord>;
  provinceRoleLabels: ProvinceRoleLabelRecord[];
  roleAliases: RoleAliasConfig[];
  estimatedRecipients: number;
  draft: string;
  filter: 'entrada' | 'enviados' | 'eliminados';
  conversations: MailboxConversationRecord[];
  selectedConversationId: string | null;
  selectedConversation: MailboxConversationRecord | null;
  conversationDraft: string;
  conversationSending: boolean;
  reportingMessageId: string | null;
  reportReason: string;
  reportComment: string;
  messages: MailboxMessageRecord[];
  expandedMessageIds: string[];
  responses: Record<string, string>;
  onToggleComposer: () => void;
  onRefresh: () => void;
  onTargetModeChange: (mode: MailboxTargetMode) => void;
  onTargetCommunityChange: (communityId: string) => void;
  onTargetProvinceChange: (province: string) => void;
  onProvinceDropdownChange: (open: boolean) => void;
  onTargetRoleChange: (role: Role) => void;
  onRoleDropdownChange: (open: boolean) => void;
  onRecipientSearchChange: (value: string) => void;
  onUserDropdownChange: (open: boolean) => void;
  onToggleUser: (userId: string) => void;
  onDraftChange: (value: string) => void;
  onSubmitNewMessage: () => void;
  onSaveDraft: () => void;
  onFilterChange: (filter: 'entrada' | 'enviados' | 'eliminados') => void;
  onOpenConversation: (conversationId: string) => void;
  onCloseConversation: () => void;
  onConversationDraftChange: (value: string) => void;
  onSendConversationReply: () => void;
  onToggleReportMessage: (messageId: string | null) => void;
  onReportReasonChange: (reason: string) => void;
  onReportCommentChange: (value: string) => void;
  onSubmitMessageReport: (message: MailboxMessageRecord) => void;
  onResponseChange: (messageId: string, value: string) => void;
  onSubmitResponse: (messageId: string) => void;
  onStartDirectReply: (message: MailboxMessageRecord) => void;
  onUpdateStatus: (messageId: string, status: MailboxMessageRecord['status']) => void;
  onOpenMessage: (message: MailboxMessageRecord) => void;
  onDeleteForMe: (message: MailboxMessageRecord) => void;
  onDeleteConversationForMe: (conversation: MailboxConversationRecord) => void;
  onRestoreForMe: (message: MailboxMessageRecord) => void;
}) {
  const selectedCommunityId = targetCommunityId || communityOptions[0]?.id;
  const confirmAction = (title: string, message: string, actionLabel: string, action: () => void) => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || window.confirm(message)) {
        action();
      }
      return;
    }
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: actionLabel, style: 'destructive', onPress: action }
    ]);
  };
  const openMessageActions = (message: MailboxMessageRecord) => {
    const deleted = (message.mailbox_folder ?? 'entrada') === 'eliminados';
    if (Platform.OS === 'web') {
      confirmAction(
        deleted ? 'Restaurar mensaje' : 'Eliminar mensaje',
        deleted ? '¿Querés restaurar este mensaje en tu vista?' : '¿Querés eliminar este mensaje solo de tu vista?',
        deleted ? 'Restaurar' : 'Eliminar',
        () => deleted ? onRestoreForMe(message) : onDeleteForMe(message)
      );
      return;
    }
    Alert.alert('Acciones del mensaje', 'Elegí qué hacer con este mensaje.', [
      { text: 'Cancelar', style: 'cancel' },
      deleted
        ? { text: 'Restaurar mensaje', onPress: () => onRestoreForMe(message) }
        : {
          text: 'Eliminar mensaje',
          style: 'destructive',
          onPress: () => confirmAction('Eliminar mensaje', 'Este mensaje se eliminará solo de tu vista. ¿Deseás continuar?', 'Eliminar', () => onDeleteForMe(message))
        }
    ]);
  };
  const openConversationActions = (conversation: MailboxConversationRecord) => {
    confirmAction(
      'Eliminar conversación',
      'Esta conversación se eliminará solo de tu vista. ¿Deseás continuar?',
      'Eliminar conversación',
      () => onDeleteConversationForMe(conversation)
    );
  };

  return (
    <View style={[styles.mailboxShell, isDark && styles.surfacePanelDark]}>
      <View style={styles.mailboxHeaderBar}>
        <View style={styles.adminUserHeaderText}>
          <SectionTitle title="Buzon de mensajes" />
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Conversaciones directas y consultas comunitarias.</Text>
        </View>
        <View style={styles.mailboxCountBadge}>
          <Text style={styles.mailboxCountValue}>{conversations.length}</Text>
          <Text style={styles.mailboxCountLabel}>{filter}</Text>
        </View>
      </View>
      <View style={styles.mailboxToolbar}>
        <TouchableOpacity style={[styles.compactSquareButton, showComposer && styles.compactSquareButtonActive]} onPress={onToggleComposer}>
          <Ionicons name="create-outline" size={17} color={showComposer ? palette.white : palette.red} />
          <Text style={[styles.compactSquareButtonText, showComposer && styles.compactSquareButtonTextActive]}>Nuevo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.compactSquareButton} onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={17} color={palette.red} />
          <Text style={styles.compactSquareButtonText}>Actualizar</Text>
        </TouchableOpacity>
      </View>

      {showComposer ? (
        <View style={[styles.inlineEditorPanel, isDark && styles.surfacePanelDark]}>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Nuevo mensaje</Text>
          <View style={styles.mailboxRulesNotice}>
            <Ionicons name="shield-checkmark-outline" size={18} color={palette.red} />
            <Text style={[styles.noticeText, isDark && styles.textDarkBody]}>
              Usa lenguaje respetuoso. No se permiten insultos, amenazas, acoso ni contenido sexual. Los mensajes pueden ser reportados y revisados por moderadores autorizados.
            </Text>
          </View>
          <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Destino</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
            {targetModesForSession(session).map(([mode, label]) => (
              <TouchableOpacity key={mode} style={[styles.filterChip, targetMode === mode && styles.filterChipActive]} onPress={() => onTargetModeChange(mode)}>
                <Text style={[styles.filterChipText, targetMode === mode && styles.filterChipTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {['community', 'my_community'].includes(targetMode) ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
              {communityOptions.map((community) => (
                <TouchableOpacity key={community.id} style={[styles.filterChip, selectedCommunityId === community.id && styles.filterChipActive]} onPress={() => onTargetCommunityChange(community.id ?? '')}>
                  <Text style={[styles.filterChipText, selectedCommunityId === community.id && styles.filterChipTextActive]}>{community.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}

          {['province', 'role_province', 'diocesan_leadership'].includes(targetMode) && (session.role === 'administrador' || ['vocal_nacional', 'coordinador_nacional'].includes(session.role)) ? (
            <>
              <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Provincia</Text>
              <TouchableOpacity style={[styles.dropdownButton, isDark && styles.dropdownButtonDark]} onPress={() => onProvinceDropdownChange(!provinceDropdownOpen)}>
                <Text style={[styles.dropdownButtonText, isDark && styles.dropdownButtonTextDark]}>{targetProvince || 'Todas / seleccionar provincia'}</Text>
                <Ionicons name={provinceDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
              </TouchableOpacity>
              {provinceDropdownOpen ? (
                <ScrollView style={[styles.dropdownList, isDark && styles.dropdownListDark]} nestedScrollEnabled>
                  {targetMode === 'diocesan_leadership' ? (
                    <TouchableOpacity style={[styles.dropdownItem, isDark && styles.dropdownItemDark]} onPress={() => { onTargetProvinceChange(''); onProvinceDropdownChange(false); }}>
                      <Text style={[styles.dropdownItemText, isDark && styles.dropdownItemTextDark]}>Todas las provincias</Text>
                    </TouchableOpacity>
                  ) : null}
                  {provinceOptions.map((province) => (
                    <TouchableOpacity key={province} style={[styles.dropdownItem, isDark && styles.dropdownItemDark]} onPress={() => { onTargetProvinceChange(province); onProvinceDropdownChange(false); }}>
                      <Text style={[styles.dropdownItemText, isDark && styles.dropdownItemTextDark]}>{province}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : null}
            </>
          ) : null}

          {['role', 'role_province'].includes(targetMode) ? (
            <>
              <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Rango</Text>
              <TouchableOpacity style={[styles.dropdownButton, isDark && styles.dropdownButtonDark]} onPress={() => onRoleDropdownChange(!roleDropdownOpen)}>
                <Text style={[styles.dropdownButtonText, isDark && styles.dropdownButtonTextDark]}>{roleLabel(targetRole)}</Text>
                <Ionicons name={roleDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
              </TouchableOpacity>
              {roleDropdownOpen ? (
                <ScrollView style={[styles.dropdownList, isDark && styles.dropdownListDark]} nestedScrollEnabled>
                  {visibleHierarchyFor(session).filter((item) => !['invitado', 'administrador'].includes(item.role) && roleRank(item.role as Role) < roleRank(session.role)).map((item) => (
                    <TouchableOpacity key={item.role} style={[styles.dropdownItem, isDark && styles.dropdownItemDark]} onPress={() => { onTargetRoleChange(item.role); onRoleDropdownChange(false); }}>
                      <Text style={[styles.dropdownItemText, isDark && styles.dropdownItemTextDark]}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : null}
            </>
          ) : null}

          {targetMode === 'user' ? (
            <View style={[styles.profileCommunityPanel, isDark && styles.surfaceRowDark]}>
              <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Buscar usuario</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                placeholder="Buscar por nombre, provincia, comunidad o rango"
                value={recipientSearch}
                onChangeText={onRecipientSearchChange}
                placeholderTextColor={inputPlaceholderColor}
              />
              <TouchableOpacity style={[styles.dropdownButton, isDark && styles.dropdownButtonDark]} onPress={() => onUserDropdownChange(!userDropdownOpen)}>
                <Text style={[styles.dropdownButtonText, isDark && styles.dropdownButtonTextDark]}>{selectedUserIds.length} usuario/s seleccionado/s</Text>
                <Ionicons name={userDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
              </TouchableOpacity>
              {userDropdownOpen ? (
                <ScrollView style={[styles.dropdownList, isDark && styles.dropdownListDark]} nestedScrollEnabled>
                  {filteredUserOptions.length === 0 ? <Text style={[styles.dropdownItemText, isDark && styles.dropdownItemTextDark]}>Sin resultados</Text> : null}
                  {filteredUserOptions.slice(0, 60).map((user) => {
                    const selectedUser = selectedUserIds.includes(user.id);
                    const userName = user.full_name?.trim() || user.nickname?.trim() || 'Usuario sin nombre';
                    const userMeta = [
                      roleLabelForProvince((user.role || 'palestrista') as Role, user.province, provinceRoleLabels, roleAliases, user.gender_preference ?? null),
                      user.community_name || 'Sin comunidad',
                      user.province || 'Sin provincia'
                    ].filter(Boolean).join(' - ');
                    return (
                      <TouchableOpacity key={user.id} style={[styles.mailboxRecipientItem, selectedUser && styles.mailboxRecipientItemSelected, isDark && styles.mailboxRecipientItemDark]} onPress={() => onToggleUser(user.id)}>
                        <Ionicons name={selectedUser ? 'checkbox-outline' : 'square-outline'} size={20} color={selectedUser ? palette.red : isDark ? '#E5F0F4' : palette.inkMuted} />
                        <View style={styles.adminUserHeaderText}>
                          <Text numberOfLines={1} style={[styles.mailboxRecipientName, isDark && styles.mailboxRecipientNameDark]}>{userName}</Text>
                          <Text numberOfLines={2} style={[styles.mailboxRecipientMeta, isDark && styles.mailboxRecipientMetaDark]}>{userMeta}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : null}
              {selectedUsers.length > 0 ? (
                <View style={styles.chipRow}>
                  {selectedUsers.slice(0, 8).map((user) => (
                    <TouchableOpacity key={user.id} style={[styles.filterChip, styles.filterChipActive]} onPress={() => onToggleUser(user.id)}>
                      <Text style={[styles.filterChipText, styles.filterChipTextActive]}>{user.full_name ?? 'Usuario'}</Text>
                    </TouchableOpacity>
                  ))}
                  {selectedUsers.length > 8 ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>+{selectedUsers.length - 8} mas</Text> : null}
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.notice}>
            <Ionicons name="people-outline" size={18} color={palette.red} />
            <Text style={styles.noticeText}>Destinatarios estimados: {estimatedRecipients}</Text>
          </View>
          <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Mensaje</Text>
          <TextInput
            style={[styles.input, styles.textArea, isDark && styles.inputDark]}
            placeholder="Escribe el mensaje para el buzon"
            value={draft}
            onChangeText={(value) => onDraftChange(value.slice(0, 500))}
            multiline
            placeholderTextColor={inputPlaceholderColor}
          />
          <View style={styles.compactToolRow}>
            <TouchableOpacity style={[styles.compactSquareButton, styles.compactSquareButtonActive]} onPress={onSubmitNewMessage}>
              <Ionicons name="send-outline" size={17} color={palette.white} />
              <Text style={[styles.compactSquareButtonText, styles.compactSquareButtonTextActive]}>Enviar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.compactSquareButton} onPress={onSaveDraft}>
              <Ionicons name="save-outline" size={17} color={palette.red} />
              <Text style={styles.compactSquareButtonText}>Borrador</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <View style={styles.mailboxTabs}>
        {(['entrada', 'enviados', 'eliminados'] as const).map((item) => (
          <TouchableOpacity key={item} style={[styles.filterChip, filter === item && styles.filterChipActive]} onPress={() => onFilterChange(item)}>
            <Text style={[styles.filterChipText, filter === item && styles.filterChipTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedConversation ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 92 : 74}
          style={[styles.mailboxThreadKeyboard, isDark && styles.surfacePanelDark]}
        >
          <View style={styles.mailboxThreadHeader}>
            <TouchableOpacity style={styles.iconButtonGhost} onPress={onCloseConversation} activeOpacity={0.84}>
              <Ionicons name="arrow-back-outline" size={18} color={palette.red} />
            </TouchableOpacity>
            <View style={styles.mailboxAvatar}>
              <Text style={styles.mailboxAvatarText}>{selectedConversation.title.trim().charAt(0).toUpperCase() || 'P'}</Text>
            </View>
            <View style={styles.adminUserHeaderText}>
              <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{selectedConversation.title}</Text>
              {selectedConversation.subtitle ? <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>{selectedConversation.subtitle}</Text> : null}
            </View>
            <TouchableOpacity style={styles.iconButtonGhost} onPress={() => openConversationActions(selectedConversation)} onLongPress={() => openConversationActions(selectedConversation)} activeOpacity={0.84}>
              <Ionicons name="ellipsis-vertical" size={18} color={palette.red} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.mailboxThreadScroll} contentContainerStyle={styles.mailboxThreadScrollContent} keyboardShouldPersistTaps="handled" nestedScrollEnabled showsVerticalScrollIndicator>
            {selectedConversation.messages.map((message) => {
              const sentByMe = message.sender_id === session.id || (message.mailbox_folder ?? 'entrada') === 'enviados';
              const canReport = !sentByMe && (message.mailbox_folder ?? 'entrada') === 'entrada';
              return (
                <TouchableOpacity key={`${message.source}-${message.id}-${message.mailbox_folder}`} style={[styles.mailboxBubble, sentByMe ? styles.mailboxBubbleSent : styles.mailboxBubbleReceived, isDark && !sentByMe && styles.surfaceRowDark]} activeOpacity={0.86} onPress={() => onOpenMessage(message)} onLongPress={() => openMessageActions(message)}>
                  <Text style={[styles.mailboxBubbleMeta, isDark && !sentByMe && styles.textDarkMuted, sentByMe && styles.mailboxBubbleTextSent]}>
                    {sentByMe ? 'Enviado' : 'Recibido'} · {new Date(message.created_at).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={[styles.mailboxBubbleText, sentByMe && styles.mailboxBubbleTextSent, isDark && !sentByMe && styles.textDarkBody]}>{message.message}</Text>
                  {message.response ? (
                    <View style={styles.notice}>
                      <Ionicons name="return-up-forward-outline" size={16} color={palette.red} />
                      <Text style={styles.noticeText}>{message.response}</Text>
                    </View>
                  ) : null}
                  {canReport ? (
                    <TouchableOpacity style={styles.mailboxReportLink} onPress={() => onToggleReportMessage(message.id)}>
                      <Ionicons name="flag-outline" size={14} color={palette.red} />
                      <Text style={styles.actionPillText}>Reportar</Text>
                    </TouchableOpacity>
                  ) : null}
                  {reportingMessageId === message.id ? (
                    <View style={styles.mailboxReportPanel}>
                      <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Motivo</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                        {[
                          ['lenguaje_ofensivo', 'Lenguaje ofensivo'],
                          ['contenido_sexual', 'Contenido sexual'],
                          ['acoso', 'Acoso'],
                          ['amenaza', 'Amenaza'],
                          ['spam', 'Spam'],
                          ['otro', 'Otro']
                        ].map(([key, label]) => (
                          <TouchableOpacity key={key} style={[styles.filterChip, reportReason === key && styles.filterChipActive]} onPress={() => onReportReasonChange(key)}>
                            <Text style={[styles.filterChipText, reportReason === key && styles.filterChipTextActive]}>{label}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <TextInput
                        style={[styles.input, isDark && styles.inputDark]}
                        placeholder="Comentario opcional"
                        value={reportComment}
                        onChangeText={(value) => onReportCommentChange(value.slice(0, 300))}
                        placeholderTextColor={inputPlaceholderColor}
                      />
                      <View style={styles.compactToolRow}>
                        <TouchableOpacity style={[styles.compactSquareButton, styles.compactSquareButtonActive]} onPress={() => onSubmitMessageReport(message)}>
                          <Ionicons name="flag-outline" size={16} color={palette.white} />
                          <Text style={[styles.compactSquareButtonText, styles.compactSquareButtonTextActive]}>Enviar reporte</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.compactSquareButton} onPress={() => onToggleReportMessage(null)}>
                          <Ionicons name="close-outline" size={16} color={palette.red} />
                          <Text style={styles.compactSquareButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.mailboxReplyBar}>
            <TextInput
              style={[styles.mailboxReplyInput, isDark && styles.inputDark]}
              placeholder={selectedConversation.counterpartUserId ? 'Responder en esta conversacion' : 'Respuesta directa no disponible'}
              value={conversationDraft}
              onChangeText={(value) => onConversationDraftChange(value.slice(0, 500))}
              editable={Boolean(selectedConversation.counterpartUserId) && !conversationSending}
              multiline
              placeholderTextColor={inputPlaceholderColor}
            />
            <TouchableOpacity
              style={[styles.compactSquareButton, styles.compactSquareButtonActive, (!selectedConversation.counterpartUserId || conversationSending) && styles.disabledButton]}
              onPress={onSendConversationReply}
              disabled={!selectedConversation.counterpartUserId || conversationSending}
            >
              <Ionicons name="send-outline" size={17} color={palette.white} />
              <Text style={[styles.compactSquareButtonText, styles.compactSquareButtonTextActive]}>{conversationSending ? '...' : 'Enviar'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : null}

      {!selectedConversation && conversations.length === 0 ? (
        <View style={[styles.card, isDark && styles.surfaceRowDark]}>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>No tienes mensajes actualmente</Text>
        </View>
      ) : null}

      {!selectedConversation && conversations.map((conversation) => {
        const preview = conversation.lastMessage.length > 96 ? `${conversation.lastMessage.slice(0, 96)}...` : conversation.lastMessage;
        const selected = selectedConversationId === conversation.id;
        const statusLabel = conversation.unreadCount > 0 ? 'Nuevo' : conversation.lastDirection === 'sent' ? 'Enviado' : conversation.hasSent && conversation.hasReceived ? 'Conversacion' : 'Recibido';
        return (
          <TouchableOpacity key={conversation.id} style={[styles.mailboxConversationRow, selected && styles.mailboxConversationRowActive, isDark && styles.surfaceRowDark]} onPress={() => onOpenConversation(conversation.id)} onLongPress={() => openConversationActions(conversation)} activeOpacity={0.86}>
            <View style={styles.mailboxAvatar}>
              <Text style={styles.mailboxAvatarText}>{conversation.title.trim().charAt(0).toUpperCase() || 'P'}</Text>
            </View>
            <View style={styles.adminUserHeaderText}>
              <View style={styles.mailboxConversationTop}>
                <Text numberOfLines={1} style={[styles.mailboxConversationTitle, isDark && styles.textDarkStrong]}>{conversation.title}</Text>
                <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>{new Date(conversation.lastAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</Text>
              </View>
              {conversation.subtitle ? <Text numberOfLines={1} style={[styles.mailboxRecipientMeta, isDark && styles.mailboxRecipientMetaDark]}>{conversation.subtitle}</Text> : null}
              <Text numberOfLines={2} style={[styles.cardText, isDark && styles.textDarkBody]}>
                {conversation.lastDirection === 'sent' ? 'Enviado: ' : 'Recibido: '}{preview}
              </Text>
            </View>
            <View style={styles.mailboxConversationBadges}>
              <View style={[styles.actionPill, conversation.unreadCount > 0 && styles.actionPillActive]}>
                <Text style={[styles.actionPillText, conversation.unreadCount > 0 && styles.actionPillTextActive]}>{statusLabel}</Text>
              </View>
              {conversation.unreadCount > 0 ? <View style={styles.mailboxUnreadDot} /> : null}
            </View>
          </TouchableOpacity>
        );
      })}

    </View>
  );
}
