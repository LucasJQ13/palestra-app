import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';
import { inputPlaceholderColor } from '../../lib/constants';
import { AdminUser, MailboxMessageRecord, MailboxTargetMode, ProvinceRoleLabelRecord } from '../../lib/profiles';
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
  messages,
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
  onResponseChange,
  onSubmitResponse,
  onUpdateStatus
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
  filteredUserOptions: AdminUser[];
  selectedUsers: AdminUser[];
  provinceRoleLabels: ProvinceRoleLabelRecord[];
  roleAliases: RoleAliasConfig[];
  estimatedRecipients: number;
  draft: string;
  filter: 'recibidos' | 'leidos';
  messages: MailboxMessageRecord[];
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
  onFilterChange: (filter: 'recibidos' | 'leidos') => void;
  onResponseChange: (messageId: string, value: string) => void;
  onSubmitResponse: (messageId: string) => void;
  onUpdateStatus: (messageId: string, status: MailboxMessageRecord['status']) => void;
}) {
  const selectedCommunityId = targetCommunityId || communityOptions[0]?.id;

  return (
    <View style={[styles.profileCommunityPanel, isDark && styles.surfacePanelDark]}>
      <SectionTitle title="Buzon de mensajes" />
      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Consultas enviadas y mensajes recibidos por tu comunidad o jurisdiccion.</Text>
      <View style={styles.compactToolRow}>
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
                    const userName = user.full_name?.trim() || user.nickname?.trim() || user.email?.trim() || 'Usuario sin nombre';
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

      <View style={styles.compactTabs}>
        {(['recibidos', 'leidos'] as const).map((item) => (
          <TouchableOpacity key={item} style={[styles.filterChip, filter === item && styles.filterChipActive]} onPress={() => onFilterChange(item)}>
            <Text style={[styles.filterChipText, filter === item && styles.filterChipTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {messages.length === 0 ? (
        <View style={[styles.card, isDark && styles.surfaceRowDark]}>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>No tienes mensajes actualmente</Text>
        </View>
      ) : null}

      {messages.map((message) => (
        <View key={message.id} style={[styles.innerNewsCard, isDark && styles.surfaceRowDark]}>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{message.status} - {message.community_name || 'Mensaje directo'} {message.province ? `(${message.province})` : ''}</Text>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{message.sender_name ?? 'Consulta externa'}</Text>
          {message.sender_contact ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Contacto: {message.sender_contact}</Text> : null}
          <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>{new Date(message.created_at).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{message.message}</Text>
          {message.response ? (
            <View style={styles.notice}>
              <Ionicons name="return-up-forward-outline" size={18} color={palette.red} />
              <Text style={styles.noticeText}>{message.response}</Text>
            </View>
          ) : null}
          {message.can_respond && message.status !== 'cerrado' && message.status !== 'archivado' ? (
            <View style={[styles.inlineEditorPanel, isDark && styles.surfacePanelDark]}>
              <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Respuesta</Text>
              <TextInput
                style={[styles.input, styles.textArea, isDark && styles.inputDark]}
                placeholder="Escribe una respuesta clara"
                value={responses[message.id] ?? ''}
                onChangeText={(value) => onResponseChange(message.id, value.slice(0, 1000))}
                multiline
                placeholderTextColor={inputPlaceholderColor}
              />
              <TouchableOpacity style={styles.primaryButton} onPress={() => onSubmitResponse(message.id)}>
                <Text style={styles.primaryButtonText}>Responder</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <View style={styles.inlineActions}>
            <TouchableOpacity style={styles.actionPill} onPress={() => onUpdateStatus(message.id, 'leido')}>
              <Ionicons name="mail-open-outline" size={16} color={palette.red} />
              <Text style={styles.actionPillText}>Leido</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionPill} onPress={() => onUpdateStatus(message.id, 'nuevo')}>
              <Ionicons name="mail-unread-outline" size={16} color={palette.red} />
              <Text style={styles.actionPillText}>No leido</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionPill} onPress={() => onUpdateStatus(message.id, 'cerrado')}>
              <Ionicons name="checkmark-done-outline" size={16} color={palette.red} />
              <Text style={styles.actionPillText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}
