import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppCommunity } from '../../lib/remoteData';
import { Role, Session } from '../../types/auth';
import { RoleAliasConfig } from '../../lib/appConfig';
import { changeDone } from '../../lib/appMessages';
import {
  AdminUser,
  MailboxMessageRecord,
  MailboxTargetMode,
  ProvinceRoleLabelRecord,
  PublicUserDirectoryRecord,
  createMailboxMessage,
  deleteMailboxMessageForMe,
  fetchMailboxMessages,
  markMailboxMessageAsRead,
  respondMailboxMessage,
  restoreMailboxMessageForMe,
  sendDirectMailboxMessage,
  setMailboxMessageStatus
} from '../../lib/profiles';
import { roleRank } from '../../lib/roles';

type UseMailboxControllerParams = {
  session: Session | null;
  registrationCommunities: AppCommunity[];
  adminUsers: Array<AdminUser | PublicUserDirectoryRecord>;
  provinceRoleLabels: ProvinceRoleLabelRecord[];
  roleAliases: RoleAliasConfig[];
  setAuthMessage: (message: string) => void;
  onEnsureAdminUsers: () => void;
};

const guestMailboxSession: Session = {
  id: 'guest',
  fullName: 'Invitado',
  province: '',
  contact: '',
  communityOfOrigin: '',
  role: 'invitado',
  status: 'pendiente',
  permissions: []
};

function defaultTargetModeForSession(session: Session): MailboxTargetMode {
  if (session.role !== 'invitado') {
    return 'user';
  }
  return 'my_community';
}

async function confirmMailboxSend(total: number) {
  if (total <= 10) {
    return true;
  }
  const message = `Vas a enviar este mensaje a ${total} destinatarios. Confirmas el envio?`;
  if (Platform.OS === 'web') {
    return typeof window === 'undefined' ? true : window.confirm(message);
  }
  return new Promise<boolean>((resolve) => {
    Alert.alert('Confirmar envio', message, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Enviar', onPress: () => resolve(true) }
    ]);
  });
}

export function useMailboxController({
  session,
  registrationCommunities,
  adminUsers,
  provinceRoleLabels,
  roleAliases,
  setAuthMessage,
  onEnsureAdminUsers
}: UseMailboxControllerParams) {
  const activeSession = session ?? guestMailboxSession;
  const [messages, setMessages] = useState<MailboxMessageRecord[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'entrada' | 'enviados' | 'eliminados'>('entrada');
  const [expandedMessageIds, setExpandedMessageIds] = useState<string[]>([]);
  const [showComposer, setShowComposer] = useState(false);
  const [draft, setDraft] = useState('');
  const [targetMode, setTargetMode] = useState<MailboxTargetMode>(defaultTargetModeForSession(activeSession));
  const [targetCommunityId, setTargetCommunityId] = useState('');
  const [targetProvince, setTargetProvince] = useState('');
  const [targetRole, setTargetRole] = useState<Role>('palestrista');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [provinceDropdownOpen, setProvinceDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const communityOptions = useMemo(() => registrationCommunities
    .flatMap((province) => province.locations.map((community) => ({ ...community, province: province.province })))
    .filter((community) => {
      if (activeSession.role === 'administrador' || ['vocal_nacional', 'coordinador_nacional'].includes(activeSession.role)) {
        return true;
      }
      if (['vocal', 'coordinador_diocesano'].includes(activeSession.role)) {
        return community.province === activeSession.province;
      }
      return community.name === activeSession.communityOfOrigin;
    }), [registrationCommunities, activeSession.role, activeSession.province, activeSession.communityOfOrigin]);

  const provinceOptions = useMemo(() => Array.from(new Set(registrationCommunities.map((item) => item.province))).sort((a, b) => a.localeCompare(b)), [registrationCommunities]);

  const directUserOptions = useMemo(() => adminUsers.filter((user) => {
    if (user.id === activeSession.id || user.status !== 'aprobado' || user.role === 'invitado') {
      return false;
    }
    if (activeSession.role !== 'administrador' && user.role === 'administrador') {
      return false;
    }
    return true;
  }), [adminUsers, activeSession.id, activeSession.role]);

  const scopedUserOptions = useMemo(() => adminUsers.filter((user) => {
    if (user.role === 'administrador' || user.id === activeSession.id) {
      return false;
    }
    if (activeSession.role === 'administrador') {
      return true;
    }
    if (['vocal_nacional', 'coordinador_nacional'].includes(activeSession.role)) {
      return roleRank(user.role as Role) < roleRank(activeSession.role);
    }
    if (['vocal', 'coordinador_diocesano'].includes(activeSession.role)) {
      return user.province === activeSession.province && roleRank(user.role as Role) < roleRank(activeSession.role);
    }
    return user.province === activeSession.province && user.community_name === activeSession.communityOfOrigin && roleRank(user.role as Role) < roleRank(activeSession.role);
  }), [adminUsers, activeSession.id, activeSession.role, activeSession.province, activeSession.communityOfOrigin]);

  const recipientQuery = recipientSearch.trim().toLowerCase();
  const filteredUserOptions = useMemo(() => directUserOptions.filter((user) => {
    if (!recipientQuery) {
      return true;
    }
    return [user.full_name, user.province, user.community_name, user.role]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(recipientQuery));
  }), [recipientQuery, directUserOptions]);

  const selectedUsers = useMemo(() => directUserOptions.filter((user) => selectedUserIds.includes(user.id)), [selectedUserIds, directUserOptions]);

  const estimatedRecipients = useMemo(() => {
    if (targetMode === 'user') {
      return selectedUserIds.length;
    }
    if (targetMode === 'all') {
      return scopedUserOptions.length;
    }
    if (targetMode === 'role') {
      return scopedUserOptions.filter((user) => user.role === targetRole).length;
    }
    if (targetMode === 'province') {
      const province = targetProvince || activeSession.province;
      return scopedUserOptions.filter((user) => user.province === province).length;
    }
    if (targetMode === 'role_province') {
      const province = targetProvince || activeSession.province;
      return scopedUserOptions.filter((user) => user.role === targetRole && user.province === province).length;
    }
    if (targetMode === 'diocesan_leadership') {
      const province = targetProvince || '';
      return scopedUserOptions.filter((user) => ['vocal', 'coordinador_diocesano'].includes(user.role) && (!province || user.province === province)).length;
    }
    if (targetMode === 'province_communities') {
      return scopedUserOptions.filter((user) => ['animador_comunidad', 'coordinador_comunidad'].includes(user.role) && user.province === activeSession.province).length;
    }
    if (['community', 'my_community'].includes(targetMode)) {
      const communityName = communityOptions.find((community) => community.id === (targetCommunityId || communityOptions[0]?.id))?.name ?? activeSession.communityOfOrigin;
      return scopedUserOptions.filter((user) => ['animador_comunidad', 'coordinador_comunidad'].includes(user.role) && user.community_name === communityName).length;
    }
    return 0;
  }, [communityOptions, selectedUserIds.length, activeSession.communityOfOrigin, activeSession.province, targetCommunityId, targetMode, targetProvince, targetRole, scopedUserOptions]);

  const visibleMessages = useMemo(() => messages.filter((message) => (message.mailbox_folder ?? 'entrada') === filter), [filter, messages]);

  async function refresh() {
    if (activeSession.role === 'invitado') {
      setMessages([]);
      return;
    }
    setMessages(await fetchMailboxMessages());
  }

  function toggleUser(userId: string) {
    setSelectedUserIds((current) => current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId]);
  }

  async function submitNewMessage() {
    if (activeSession.role === 'invitado') {
      setAuthMessage('Iniciá sesión para enviar mensajes.');
      return;
    }
    if (!draft.trim()) {
      setAuthMessage('Escribe un mensaje antes de enviar.');
      return;
    }

    const mode = targetMode || defaultTargetModeForSession(activeSession);
    const fallbackCommunity = communityOptions[0];
    const communityId = mode === 'my_community' ? fallbackCommunity?.id : targetCommunityId || fallbackCommunity?.id;
    const province = targetProvince || activeSession.province;

    if (['my_community', 'community'].includes(mode) && !communityId) {
      setAuthMessage('No hay responsables asignados para tu comunidad actualmente.');
      return;
    }
    if (mode === 'user' && selectedUserIds.length === 0) {
      setAuthMessage('Selecciona al menos un usuario destinatario.');
      return;
    }
    if (estimatedRecipients === 0) {
      setAuthMessage('No hay destinatarios para el criterio seleccionado.');
      return;
    }

    const confirmed = await confirmMailboxSend(estimatedRecipients);
    if (!confirmed) {
      return;
    }

    const errors: string[] = [];
    if (mode === 'user') {
      const { error } = await sendDirectMailboxMessage({
        recipientIds: selectedUserIds,
        message: draft.trim()
      });
      if (error) {
        errors.push(error.message);
      }
    } else {
      const { error } = await createMailboxMessage({
        targetMode: mode,
        message: draft.trim(),
        communityId,
        province,
        role: targetRole,
        userId: null
      });
      if (error) {
        errors.push(error.message);
      }
    }

    if (errors.length > 0) {
      setAuthMessage(errors[0]);
      return;
    }

    setDraft('');
    setRecipientSearch('');
    setSelectedUserIds([]);
    setShowComposer(false);
    await AsyncStorage.removeItem(`palestra.mailboxDraft.${activeSession.id}`);
    setAuthMessage(changeDone('Mensaje enviado.'));
    await refresh();
  }

  async function saveDraft() {
    if (activeSession.role === 'invitado') {
      setAuthMessage('Inicia sesion para guardar borradores.');
      return;
    }
    if (!draft.trim()) {
      setAuthMessage('Escribe un mensaje antes de guardar el borrador.');
      return;
    }
    await AsyncStorage.setItem(`palestra.mailboxDraft.${activeSession.id}`, JSON.stringify({
      message: draft.slice(0, 500),
      targetMode,
      targetCommunityId,
      targetProvince,
      targetRole,
      selectedUserIds,
      savedAt: new Date().toISOString()
    }));
    setAuthMessage(changeDone('Borrador guardado en este dispositivo.'));
  }

  async function submitResponse(messageId: string) {
    const response = (responses[messageId] ?? '').trim();
    if (!response) {
      setAuthMessage('Escribi una respuesta antes de enviarla.');
      return;
    }
    const { error } = await respondMailboxMessage(messageId, response);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setResponses((current) => ({ ...current, [messageId]: '' }));
    setAuthMessage(changeDone('Respuesta enviada.'));
    await refresh();
  }

  async function updateStatus(messageId: string, status: MailboxMessageRecord['status']) {
    const message = messages.find((item) => item.id === messageId);
    if (message?.source === 'direct' && status === 'leido') {
      const { error } = await markMailboxMessageAsRead(message.id, message.source);
      if (error) {
        setAuthMessage(error.message);
        return;
      }
      setAuthMessage(changeDone('Mensaje marcado como leido.'));
      await refresh();
      return;
    }
    const { error } = await setMailboxMessageStatus(messageId, status);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAuthMessage(changeDone(`Mensaje marcado como ${status}.`));
    await refresh();
  }

  async function openMessage(message: MailboxMessageRecord) {
    setExpandedMessageIds((current) => current.includes(message.id) ? current.filter((id) => id !== message.id) : [...current, message.id]);
    if ((message.mailbox_folder ?? 'entrada') === 'entrada' && message.status === 'nuevo') {
      const { error } = await markMailboxMessageAsRead(message.id, message.source);
      if (error) {
        setAuthMessage(error.message);
        return;
      }
      await refresh();
    }
  }

  async function deleteForMe(message: MailboxMessageRecord) {
    const { error } = await deleteMailboxMessageForMe(message.id, message.source);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAuthMessage(changeDone('Mensaje eliminado de tu vista.'));
    await refresh();
  }

  function startDirectReply(message: MailboxMessageRecord) {
    if ((message.mailbox_folder ?? 'entrada') !== 'entrada' || message.source !== 'direct' || !message.sender_id || message.sender_id === activeSession.id) {
      setAuthMessage('Este mensaje no permite respuesta directa al remitente.');
      return;
    }
    setFilter('entrada');
    setTargetMode('user');
    setSelectedUserIds([message.sender_id]);
    setRecipientSearch(message.sender_name ?? '');
    setDraft((current) => current.trim() ? current : `Re: ${message.subject || 'Mensaje'}\n\n`);
    setShowComposer(true);
    setUserDropdownOpen(false);
    setAuthMessage('Respuesta preparada para el remitente original.');
  }

  async function restoreForMe(message: MailboxMessageRecord) {
    const { error } = await restoreMailboxMessageForMe(message.id, message.source);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAuthMessage(changeDone('Mensaje restaurado.'));
    await refresh();
  }

  useEffect(() => {
    setTargetMode(defaultTargetModeForSession(activeSession));
    refresh();
    if (activeSession.id && activeSession.role !== 'invitado') {
      AsyncStorage.getItem(`palestra.mailboxDraft.${activeSession.id}`).then((rawDraft) => {
        if (!rawDraft || draft.trim()) {
          return;
        }
        const savedDraft = JSON.parse(rawDraft) as {
          message?: string;
          targetMode?: MailboxTargetMode;
          targetCommunityId?: string;
          targetProvince?: string;
          targetRole?: Role;
          selectedUserIds?: string[];
        };
        setDraft(savedDraft.message ?? '');
        if (savedDraft.targetMode) {
          setTargetMode(savedDraft.targetMode);
        }
        setTargetCommunityId(savedDraft.targetCommunityId ?? '');
        setTargetProvince(savedDraft.targetProvince ?? '');
        if (savedDraft.targetRole) {
          setTargetRole(savedDraft.targetRole);
        }
        setSelectedUserIds(savedDraft.selectedUserIds ?? []);
      }).catch(() => undefined);
    }
    if (activeSession.role === 'administrador' && adminUsers.length === 0) {
      onEnsureAdminUsers();
    }
  }, [activeSession.email, activeSession.communityOfOrigin, activeSession.role]);

  return {
    session: activeSession,
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
    messages: visibleMessages,
    expandedMessageIds,
    responses,
    onToggleComposer: () => setShowComposer((current) => !current),
    onRefresh: refresh,
    onTargetModeChange: setTargetMode,
    onTargetCommunityChange: setTargetCommunityId,
    onTargetProvinceChange: setTargetProvince,
    onProvinceDropdownChange: setProvinceDropdownOpen,
    onTargetRoleChange: setTargetRole,
    onRoleDropdownChange: setRoleDropdownOpen,
    onRecipientSearchChange: setRecipientSearch,
    onUserDropdownChange: setUserDropdownOpen,
    onToggleUser: toggleUser,
    onDraftChange: setDraft,
    onSubmitNewMessage: submitNewMessage,
    onSaveDraft: saveDraft,
    onFilterChange: setFilter,
    onResponseChange: (messageId: string, value: string) => setResponses((current) => ({ ...current, [messageId]: value })),
    onSubmitResponse: submitResponse,
    onStartDirectReply: startDirectReply,
    onUpdateStatus: updateStatus,
    onOpenMessage: openMessage,
    onDeleteForMe: deleteForMe,
    onRestoreForMe: restoreForMe
  };
}
