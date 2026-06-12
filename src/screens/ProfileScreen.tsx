import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Linking, Modal, Platform, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { BarcodeScanningResult, Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../theme/palette';
import { AppTheme, ThemeName, themePresets } from '../theme/themes';
import { auditLog, calendarActivities, communities, contactInfo, communityNews, internalMessages, materials, news, notilestra, pendingUsers, roleDefinitions } from '../data/content';
import { Permission, PersonalPmType, Role, Session } from '../types/auth';
import { getPermissionsForRole, rolePermissions } from '../lib/permissions';
import { AppCommunity, PublicationComment, RemoteAgendaItem, adminCommunitiesFetchOptions, archiveAgendaEvent, archiveCommunityPublication, archiveNewsEntry, createCommunityPublication, createPublicationComment, fetchCommunities, fetchCommunityPublications, fetchMotivadorPeriods, fetchNews, fetchNotilestra, fetchPublicationComments, reactToPublication, reportPublication, updateAgendaEvent, updateCommunityPublication, updateNewsEntry, voteCommunityPoll } from '../lib/remoteData';
import { CommunityGroupType } from '../lib/communitySections';
import { AdminUser, AdminUserLoginDiagnostic, AppContentBlock, AppMaterialRecord, AppTabSectionType, ChurchDocumentButtonRecord, CommunityMember, ContentEditorBlock, CredentialQrRecord, CredentialValidationRecord, MotivadorPeriodRecord, NewsDraftRecord, PrayerIntentionRecord, PrayerRemovalNoticeRecord, ProvinceRoleLabelRecord, PublicUserDirectoryRecord, QrActivityAttendanceRecord, QrActivityListRecord, QrActivityListShareRecord, QrActivityMemberRecord, RoleAliasRecord, RolePermissionRecord, UserAgendaPreferenceRecord, UserRequestRecord, acceptDiocesanCoordinatorRequest, addQrActivityMember, addQrActivityMembersByScope, approveProfile, archiveAppMaterial, archiveChurchDocumentButton, archiveCommunity, archivePrayerIntention, archiveProvince, archiveQrActivityList, confirmAdminUserEmail, createAdminBasicUser, createAppTab, createCommunity, createCommunityContactMessage, createEmailConfirmationRequest, createEvent, createNews, createLeadershipChangeRequest, createNotificationIntent, createProvince, createQrActivityList, createUserRequest, debugPushToDevice, deleteAdminUserByEmail, deleteAppTab, deliverNotificationIntent, diagnoseAdminUserLogin, fetchAdminConfig, fetchAdminMotivadorPeriods, fetchAdminPrayerIntentions, fetchAdminRequests, fetchAdminUsers, fetchAppContent, fetchAppMaterials, fetchAppTabs, fetchAssignableRoleAliases, fetchChurchDocumentButtons, fetchMyCommunityMembers, fetchMyPrayerIntentions, fetchMyPrayerRemovalNotices, fetchMyRequests, fetchNewsDrafts, fetchPendingProfiles, fetchProvinceRoleLabels, fetchPublicProfile, fetchPublicUserDirectory, fetchQrActivityAttendance, fetchQrActivityListShares, fetchQrActivityLists, fetchQrActivityMembers, fetchRolePermissions, fetchUserAgendaPreferences, markPrayerRemovalNoticesSeen, PendingProfile, removeQrActivityMember, repairAdminUserLogin, resolveUserRequest, restoreDefaultAppTabs, saveAdminConfig, saveAdminInstagram, saveAppMaterial, saveChurchDocumentButton, saveMotivadorPeriod, saveNewsDraft, saveProvinceRoleLabel, saveRoleAlias, saveRolePermissions, setCommunityStatus, setMotivadorPeriodStatus, setProvinceCommunitySectionVisibility, setProvinceStatus, setRoleAliasStatus, setUserAgendaPreference, shareQrActivityList, softDeleteAdminUser, updateAdminUser, updateAppContent, updateAppTab, updateAppTabPosition, updateCommunity, updateMyAvatar, updateMyCommunityDetails, updateMyProfile, updateMyProfileDetails, updateProvinceLogo, updateQrActivityList, issueMyCredentialQr, validateCredentialQrToken, validateQrActivityAttendance } from '../lib/profiles';
import { supabase } from '../lib/supabase';
import { getMyProfileSession } from '../lib/authProfile';
import { assignableRolesFor, canAccessProvince, canApproveRole, canEditCommunity, canManageProvince, canSeeAllProvinces, roleRank, visibleHierarchyFor } from '../lib/roles';
import { ExternalCatholicNewsItem, fetchExternalCatholicNews } from '../lib/externalNews';
import { ActionButton } from '../components/ActionButton';
import { SectionTitle } from '../components/SectionTitle';
import { RoleDropdown } from '../components/RoleDropdown';
import { CredentialQrCode } from '../components/CredentialQrCode';
import { styles } from '../theme/appStyles';
import { AppRuntimeConfig, CatholicNewsSourceKey, defaultRuntimeConfig, fetchAppRuntimeConfig, saveAppRuntimeConfig } from '../lib/runtimeConfig';
import { appRuntimeOwner, appVersionLabel, authDeepLinkBaseUrl, currentYear, defaultProvinceInstagram, easProjectId, inputPlaceholderColor, localReminderNotificationKey, officialInstagramUrl, palestraLogo, perseveranceStartYears, provinceDisplayNames, provinceLogos } from '../lib/constants';
import { adminModuleCatalog, AppTabDisplay, defaultTabByKey, defaultTabs, isIoniconName, navigationIconSuggestions, navigationSectionTypes, normalizeTabKey, protectedTabKeys } from '../lib/navigationConstants';
import { AppAdminConfig, defaultAdminConfig, normalizeAdminConfig, RoleAliasConfig } from '../lib/appConfig';
import { normalizeExternalUrl } from '../lib/urls';
import { uploadPickedImageToPublicUrl } from '../lib/uploads';
import { argentinaProvinceDefinitions, provinceDefinitionFor } from '../lib/argentinaProvinces';
import { credentialDisplayName, displayRoleLabel, firstNameOf, GenderPreference, genderNarratives, homeGreetingName, perseveranceLabel, personalPmSummary, personalPmTypeLabel, renderGreetingTemplate, roleLabel, roleLabelForProvince, roleShortLabel } from '../lib/profileDisplay';
import { APP_MESSAGES, changeDone, communityDowngradesRole, friendlyUploadError, hasPlausibleEmailDomain, isMissingProfileScope, isValidEmail, provinceDowngradesRole, roleAfterScopeChange, safeAuthError, verifyEmailDomainExists } from '../lib/appMessages';
import { buildInitialBlocksForSection, tabLabelFromKey } from '../lib/contentBlocks';
import { canCreateOrAdministrateCommunities, canEditAdminUser, canEditStaticInstitutionalPage, canManageFormationPathAdmin, canManageGlobalInstagram, canManageMotivadorPanel, canManageNewsContent, canManagePublishedContent, canManageRequestsPanel, canManageUsersPanel, canUseCommunityAdmin, hasPermission, isCommunityLeaderRole, leadershipPanelTitle } from '../lib/sessionAccess';
import { AdminModule, AdminRequest, AdminUsersTool, ProfilePanel, PublicProfilePreview, TabKey } from '../types/appUi';
import { internalTestSessions } from '../lib/internalTestSessions';
import { permissionOptions } from '../lib/permissionLabels';
import { subroleLabel, subrolesForRole } from '../lib/subroles';
import { buildCredentialQrPayload, parseCredentialQrPayload } from '../lib/credentialQr';
import { getAndroidChannelDebug, getFriendlyPushError, notificationTitleFor, requestAndRegisterPushToken, showFeedbackMessage } from '../lib/notificationHelpers';
import { ProfilePublicProfileModal } from './profile/ProfilePublicProfileModal';
import { ProfileAccountMenu } from './profile/ProfileAccountMenu';
import { ProfileSummary } from './profile/ProfileSummary';
import { PendingEmailProfile } from './profile/PendingEmailProfile';
import { GuestProfileAuthCard } from './profile/GuestProfileAuthCard';
import { AdminOverviewPanel } from './profile/AdminOverviewPanel';
import { ProvinceCreateDropdown } from './profile/ProvinceAdminPanel';
import { AdminUsersToolMenu } from './profile/AdminUsersToolMenu';
import { IdentityAdminPanel } from './profile/IdentityAdminPanel';
import { GeneralSettingsAdminPanel } from './profile/GeneralSettingsAdminPanel';
import { IntentionsAdminPanel } from './profile/IntentionsAdminPanel';
import { DailyGospelAdminPanel } from './profile/DailyGospelAdminPanel';
import { HomeAdminPanel } from './profile/HomeAdminPanel';
import { ContactAdminPanel } from './profile/ContactAdminPanel';
import { PublishedContentAdminPanel } from './profile/PublishedContentAdminPanel';
import { ProfileSettingsPanel } from './profile/ProfileSettingsPanel';
import { ProfileIntentionsPanel } from './profile/ProfileIntentionsPanel';
import { HistoryAdminPanel } from './profile/HistoryAdminPanel';
import { MailboxPanel } from './profile/MailboxPanel';
import { useMailboxController } from './profile/useMailboxController';
import { CommunityAdminPanel } from './profile/CommunityAdminPanel';
import { DownloadsAdminPanel } from './profile/DownloadsAdminPanel';
import { FormationPathAdminPanel } from './profile/FormationPathAdminPanel';
import { MessageModerationAdminPanel } from './profile/MessageModerationAdminPanel';
import { MyCommunityScreen } from './community/MyCommunityScreen';
import { CommunityNoticePreview } from './community/CommunityNoticesPreview';
import { CommunityPanelScreen } from './community/CommunityPanelScreen';
import { canManageCommunityNotice, getCommunityCapabilities } from '../lib/community/permissions';
import { CommunityNoticeDraft, emptyCommunityNoticeDraft, normalizeCommunityNoticeFormat, normalizeCommunityNoticeLink, validateCommunityNoticeDraft } from '../lib/community/notices';

type CommunityPublication = Awaited<ReturnType<typeof fetchCommunityPublications>>[number];

function notificationPermissionLabel(session: Session | null) {
  if (!session || (!hasPermission(session, 'enviar_notificaciones') && !['animador_comunidad', 'coordinador_comunidad'].includes(session.role))) {
    return 'La notificación quedará disponible solo para roles con permiso de enviar notificaciones.';
  }
  return 'También se dejará preparada una notificación push para los usuarios alcanzados.';
}

function canScanCredentialQr(session: Session | null) {
  return Boolean(session && ['vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador'].includes(session.role));
}

function canSeeUserInUsersPanel(session: Session | null, user: AdminUser) {
  if (!session || session.role === 'invitado') {
    return false;
  }
  if (session.role === 'administrador' || ['vocal_nacional', 'coordinador_nacional'].includes(session.role)) {
    return true;
  }
  if (['vocal', 'coordinador_diocesano', 'asesor'].includes(session.role)) {
    return user.province === session.province;
  }
  if (['animador_comunidad', 'coordinador_comunidad'].includes(session.role)) {
    return user.province === session.province && user.community_name === session.communityOfOrigin;
  }
  return canAccessProvince(session, user.province);
}

function defaultUsersProvinceFor(session: Session | null, users: AdminUser[]) {
  const scopedUsers = users.filter((user) => canSeeUserInUsersPanel(session, user));
  if (session && ['vocal', 'coordinador_diocesano', 'asesor'].includes(session.role) && session.province) {
    return session.province;
  }
  return scopedUsers.find((item) => item.province)?.province ?? scopedUsers[0]?.province ?? 'Sin provincia';
}

function userListDisplayName(user: { id?: string; user_id?: string | null; full_name?: string | null; email?: string | null; nickname?: string | null; phone?: string | null }) {
  const fallbackId = user.id ?? user.user_id ?? '';
  return user.full_name?.trim()
    || user.nickname?.trim()
    || user.email?.trim()
    || user.phone?.trim()
    || (fallbackId ? `Usuario ${fallbackId.slice(0, 8)}` : 'Usuario');
}

const personalGreetingColorOptions = ['#2fb66d', '#2d8dc8', '#f28c28', '#ef4444', '#8b5cf6', '#d946ef', '#14b8a6', '#0f766e'];

function normalizeOptionalHexColor(value?: string | null) {
  const raw = (value ?? '').trim();
  if (!raw) {
    return null;
  }
  const color = raw.startsWith('#') ? raw : `#${raw}`;
  return /^#[0-9a-f]{6}$/i.test(color) ? color.toUpperCase() : color;
}

function isValidHexColor(value?: string | null) {
  return /^#[0-9a-f]{6}$/i.test((value ?? '').trim());
}

function hexLuminance(hex: string) {
  const normalized = hex.replace('#', '');
  const [red, green, blue] = [0, 2, 4].map((start) => {
    const channel = parseInt(normalized.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function personalGreetingColorError(value?: string | null) {
  const normalized = normalizeOptionalHexColor(value);
  if (!normalized) {
    return '';
  }
  if (!isValidHexColor(normalized)) {
    return 'El color del saludo debe guardarse como HEX, por ejemplo #2FB66D.';
  }
  const luminance = hexLuminance(normalized);
  if (luminance < 0.08 || luminance > 0.9) {
    return 'Elegí un color con contraste suficiente para que el saludo sea legible.';
  }
  return '';
}

const territorialProfileCooldownDays = 15;
const profileFallbackValues = new Set(['Sin provincia', 'Sin comunidad asignada', 'Sin contacto']);

function profileDraftValue(value?: string | null) {
  const normalized = value?.trim() ?? '';
  return profileFallbackValues.has(normalized) ? '' : normalized;
}

function territorialCooldownInfo(session: Session | null) {
  if (!session?.provinceCommunityChangedAt || !profileDraftValue(session.province) || !profileDraftValue(session.communityOfOrigin)) {
    return { active: false, daysLeft: 0 };
  }
  const changedAt = new Date(session.provinceCommunityChangedAt).getTime();
  if (!Number.isFinite(changedAt)) {
    return { active: false, daysLeft: 0 };
  }
  const unlockAt = changedAt + territorialProfileCooldownDays * 24 * 60 * 60 * 1000;
  const remainingMs = unlockAt - Date.now();
  if (remainingMs <= 0) {
    return { active: false, daysLeft: 0 };
  }
  return { active: true, daysLeft: Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000))) };
}

export function ProfileScreen({
  session,
  onSessionChange,
  tabs,
  appContent,
  adminConfig,
  runtimeConfig,
  onRuntimeConfigChange,
  touchPointerEnabled,
  onTouchPointerEnabledChange,
  themeName,
  appTheme,
  onThemeChange,
  onAdminConfigChange,
  onTabsChanged,
  onContentChanged,
  onNavigate,
  onSavedFeedback,
  onErrorFeedback,
  onViewAsSession,
  initialPanel = 'vista',
  initialPublicProfile,
  onInitialPublicProfileHandled
}: {
  session: Session | null;
  onSessionChange: (session: Session | null) => void;
  tabs: AppTabDisplay[];
  appContent: AppContentBlock[];
  adminConfig: AppAdminConfig;
  runtimeConfig: AppRuntimeConfig;
  onRuntimeConfigChange: (config: AppRuntimeConfig) => void;
  touchPointerEnabled: boolean;
  onTouchPointerEnabledChange: (value: boolean) => void;
  themeName: ThemeName;
  appTheme: AppTheme;
  onThemeChange: (theme: ThemeName) => Promise<void>;
  onAdminConfigChange: (config: AppAdminConfig) => void;
  onTabsChanged: () => Promise<void>;
  onContentChanged: () => Promise<void>;
  onNavigate: (tab: TabKey) => void;
  onSavedFeedback: (message?: string) => void;
  onErrorFeedback: (message?: string) => void;
  onViewAsSession: (session: Session) => void;
  initialPanel?: ProfilePanel;
  initialPublicProfile?: PublicProfilePreview | null;
  onInitialPublicProfileHandled?: () => void;
}) {
  const isDark = appTheme.mode === 'dark';
  const [showLeadershipUsersSummary, setShowLeadershipUsersSummary] = useState(false);
  const [showActiveCoordinations, setShowActiveCoordinations] = useState(false);
  const [showProfilePhoto, setShowProfilePhoto] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [userRequestText, setUserRequestText] = useState('');
  const [selectedSentRequestId, setSelectedSentRequestId] = useState('');
  const [showSentRequests, setShowSentRequests] = useState(false);
  const [profilePanel, setProfilePanel] = useState<ProfilePanel>(initialPanel);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPasswordConfirm, setAuthPasswordConfirm] = useState('');
  const [authPasswordVisible, setAuthPasswordVisible] = useState(false);
  const [authFocusedField, setAuthFocusedField] = useState('');
  const [authErrors, setAuthErrors] = useState<Record<string, string>>({});
  const [authMessage, setAuthMessage] = useState('');
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState('desconocido');
  const [pushTokenPreview, setPushTokenPreview] = useState('');
  const [pushDebugInfo, setPushDebugInfo] = useState('');
  const [pushCurrentToken, setPushCurrentToken] = useState('');
  const [pushChannelDebug, setPushChannelDebug] = useState('');
  const [pushTestResult, setPushTestResult] = useState('');
  const [showPushDiagnostics, setShowPushDiagnostics] = useState(false);
  const [myPrayerIntentions, setMyPrayerIntentions] = useState<PrayerIntentionRecord[]>([]);
  const [prayerIntentionsMessage, setPrayerIntentionsMessage] = useState('');
  const [prayerRemovalNotices, setPrayerRemovalNotices] = useState<PrayerRemovalNoticeRecord[]>([]);
  const [prayerRemovalNoticeVisible, setPrayerRemovalNoticeVisible] = useState(false);
  const [credentialQr, setCredentialQr] = useState<CredentialQrRecord | null>(null);
  const [credentialQrPayload, setCredentialQrPayload] = useState('');
  const [credentialQrMessage, setCredentialQrMessage] = useState('');
  const [credentialQrExpanded, setCredentialQrExpanded] = useState(false);
  const [qrScannerVisible, setQrScannerVisible] = useState(false);
  const [qrScannerActive, setQrScannerActive] = useState(false);
  const [qrScannerMode, setQrScannerMode] = useState<'credential' | 'activity'>('credential');
  const [qrValidationResult, setQrValidationResult] = useState<CredentialValidationRecord | null>(null);
  const [qrValidationMessage, setQrValidationMessage] = useState('');
  const [qrActivityLists, setQrActivityLists] = useState<QrActivityListRecord[]>([]);
  const [selectedQrActivityListId, setSelectedQrActivityListId] = useState('');
  const [qrActivityMembers, setQrActivityMembers] = useState<QrActivityMemberRecord[]>([]);
  const [qrActivityAttendance, setQrActivityAttendance] = useState<QrActivityAttendanceRecord[]>([]);
  const [qrActivityShares, setQrActivityShares] = useState<QrActivityListShareRecord[]>([]);
  const [qrActivityTitle, setQrActivityTitle] = useState('');
  const [qrActivityEditTitle, setQrActivityEditTitle] = useState('');
  const [qrActivityProvince, setQrActivityProvince] = useState(session?.province ?? '');
  const [qrActivityCommunity, setQrActivityCommunity] = useState('');
  const [qrActivityUserSearch, setQrActivityUserSearch] = useState('');
  const [qrActivityCreateSelectedUserIds, setQrActivityCreateSelectedUserIds] = useState<string[]>([]);
  const [qrActivityProvinceDropdownOpen, setQrActivityProvinceDropdownOpen] = useState(false);
  const [qrActivityCommunityDropdownOpen, setQrActivityCommunityDropdownOpen] = useState(false);
  const [qrActivityShareDropdownOpen, setQrActivityShareDropdownOpen] = useState(false);
  const [qrActivityCreateShareUserIds, setQrActivityCreateShareUserIds] = useState<string[]>([]);
  const [qrActivityCreateShareRoles, setQrActivityCreateShareRoles] = useState<string[]>([]);
  const [qrActivityEditShareUserIds, setQrActivityEditShareUserIds] = useState<string[]>([]);
  const [qrActivityEditShareRoles, setQrActivityEditShareRoles] = useState<string[]>([]);
  const [qrActivityUserMode, setQrActivityUserMode] = useState<'usuarios' | 'todos'>('usuarios');
  const [showQrActivityCreateMenu, setShowQrActivityCreateMenu] = useState(false);
  const [showQrActivityListsMenu, setShowQrActivityListsMenu] = useState(false);
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerContact, setRegisterContact] = useState('');
  const [registerProvince, setRegisterProvince] = useState('');
  const [registerCommunity, setRegisterCommunity] = useState('');
  const [registerPerseveranceStartYear, setRegisterPerseveranceStartYear] = useState('');
  const [registrationCommunities, setRegistrationCommunities] = useState<AppCommunity[]>(communities);
  const [provinceDropdownOpen, setProvinceDropdownOpen] = useState(false);
  const [communityDropdownOpen, setCommunityDropdownOpen] = useState(false);
  const [registerPerseveranceYearDropdownOpen, setRegisterPerseveranceYearDropdownOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [editFullName, setEditFullName] = useState(profileDraftValue(session?.fullName));
  const [editContact, setEditContact] = useState(profileDraftValue(session?.contact));
  const [editProvince, setEditProvince] = useState(profileDraftValue(session?.province));
  const [editCommunity, setEditCommunity] = useState(profileDraftValue(session?.communityOfOrigin));
  const [editGenderPreference, setEditGenderPreference] = useState<'male' | 'female' | null>(session?.genderPreference ?? null);
  const [editNickname, setEditNickname] = useState(session?.nickname ?? '');
  const [editUseNicknameInGreetings, setEditUseNicknameInGreetings] = useState(Boolean(session?.useNicknameInGreetings));
  const [editCredentialNameMode, setEditCredentialNameMode] = useState<'name' | 'nickname' | 'both'>(session?.credentialNameMode ?? 'name');
  const [editPersonalGreetingColor, setEditPersonalGreetingColor] = useState(session?.personalGreetingColor ?? '');
  const [editPerseveranceStartYear, setEditPerseveranceStartYear] = useState(session?.perseveranceStartYear ? String(session.perseveranceStartYear) : '');
  const [editPerseveranceYearDropdownOpen, setEditPerseveranceYearDropdownOpen] = useState(false);
  const [editPmType, setEditPmType] = useState<PersonalPmType | ''>(session?.personalPmType ?? '');
  const [editPmNumber, setEditPmNumber] = useState(session?.personalPmNumber ? String(session.personalPmNumber) : '');
  const [editPmProvince, setEditPmProvince] = useState(session?.personalPmProvince ?? session?.province ?? '');
  const [editPmProvinceDropdownOpen, setEditPmProvinceDropdownOpen] = useState(false);
  const [editPmMotto, setEditPmMotto] = useState(session?.personalPmMotto ?? session?.pmMotto ?? '');
  const [profileEditUnlocked, setProfileEditUnlocked] = useState(false);
  const [editProvinceDropdownOpen, setEditProvinceDropdownOpen] = useState(false);
  const [editCommunityDropdownOpen, setEditCommunityDropdownOpen] = useState(false);
  const [realPendingProfiles, setRealPendingProfiles] = useState<PendingProfile[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [publicUserDirectory, setPublicUserDirectory] = useState<PublicUserDirectoryRecord[]>([]);
  const [selectedAdminUserId, setSelectedAdminUserId] = useState('');
  const [adminUsersTool, setAdminUsersTool] = useState<AdminUsersTool>('listado');
  const [adminUsersToolMenuOpen, setAdminUsersToolMenuOpen] = useState(false);
  const [adminUserSearch, setAdminUserSearch] = useState('');
  const [selectedUsersProvince, setSelectedUsersProvince] = useState('');
  const [adminUserFullName, setAdminUserFullName] = useState('');
  const [adminUserEmail, setAdminUserEmail] = useState('');
  const [adminUserPassword, setAdminUserPassword] = useState('');
  const [adminUserPhone, setAdminUserPhone] = useState('');
  const [adminUserProvince, setAdminUserProvince] = useState('');
  const [adminUserCommunity, setAdminUserCommunity] = useState('');
  const [adminUserProvinceDropdownOpen, setAdminUserProvinceDropdownOpen] = useState(false);
  const [adminUserCommunityDropdownOpen, setAdminUserCommunityDropdownOpen] = useState(false);
  const [adminUserRoleDropdownOpen, setAdminUserRoleDropdownOpen] = useState(false);
  const [adminUserRoleAliasDropdownOpen, setAdminUserRoleAliasDropdownOpen] = useState(false);
  const [adminUserSubroleDropdownOpen, setAdminUserSubroleDropdownOpen] = useState(false);
  const [adminUserStatus, setAdminUserStatus] = useState('pendiente');
  const [adminUserRole, setAdminUserRole] = useState<Role>('palestrista');
  const [adminUserSubroleKey, setAdminUserSubroleKey] = useState<string | null>(null);
  const [adminUserDisplayRoleLabel, setAdminUserDisplayRoleLabel] = useState('');
  const [adminUserNickname, setAdminUserNickname] = useState('');
  const [adminUserUseNicknameInGreetings, setAdminUserUseNicknameInGreetings] = useState(false);
  const [adminUserCredentialNameMode, setAdminUserCredentialNameMode] = useState<'name' | 'nickname' | 'both'>('name');
  const [adminUserPerseveranceStartYear, setAdminUserPerseveranceStartYear] = useState('');
  const [adminUserPerseveranceYearDropdownOpen, setAdminUserPerseveranceYearDropdownOpen] = useState(false);
  const [adminUserPmType, setAdminUserPmType] = useState<PersonalPmType | ''>('');
  const [adminUserPmNumber, setAdminUserPmNumber] = useState('');
  const [adminUserPmProvince, setAdminUserPmProvince] = useState('');
  const [adminUserPmProvinceDropdownOpen, setAdminUserPmProvinceDropdownOpen] = useState(false);
  const [adminUserPmMotto, setAdminUserPmMotto] = useState('');
  const [adminCreateEmail, setAdminCreateEmail] = useState('');
  const [adminCreatePassword, setAdminCreatePassword] = useState('');
  const [adminCreatePasswordVisible, setAdminCreatePasswordVisible] = useState(false);
  const [adminDiagnosticEmail, setAdminDiagnosticEmail] = useState('lucas.lsd.13@gmail.com');
  const [adminLoginDiagnostic, setAdminLoginDiagnostic] = useState<AdminUserLoginDiagnostic | null>(null);
  const [permissionRole, setPermissionRole] = useState<Role>('palestrista');
  const [permissionRoleDropdownOpen, setPermissionRoleDropdownOpen] = useState(false);
  const [rolePermissionRows, setRolePermissionRows] = useState<RolePermissionRecord[]>([]);
  const [rolePermissionDraft, setRolePermissionDraft] = useState<Permission[]>(rolePermissions.palestrista);
  const [provinceRoleLabels, setProvinceRoleLabels] = useState<ProvinceRoleLabelRecord[]>([]);
  const [roleAliases, setRoleAliases] = useState<RoleAliasRecord[]>([]);
  const [roleLabelProvince, setRoleLabelProvince] = useState(session?.province ?? '');
  const [roleLabelRole, setRoleLabelRole] = useState<Role>('animador_comunidad');
  const [roleLabelDraft, setRoleLabelDraft] = useState('');
  const [roleLabelDescription, setRoleLabelDescription] = useState('');
  const [roleLabelActive, setRoleLabelActive] = useState(true);
  const [roleLabelProvinceDropdownOpen, setRoleLabelProvinceDropdownOpen] = useState(false);
  const [roleLabelRoleDropdownOpen, setRoleLabelRoleDropdownOpen] = useState(false);
  const [roleAliasBaseRole, setRoleAliasBaseRole] = useState<Role>('animador_comunidad');
  const [roleAliasLabel, setRoleAliasLabel] = useState('');
  const [roleAliasProvince, setRoleAliasProvince] = useState('');
  const [roleAliasIsGlobal, setRoleAliasIsGlobal] = useState(true);
  const [roleAliasActive, setRoleAliasActive] = useState(true);
  const [roleAliasRoleDropdownOpen, setRoleAliasRoleDropdownOpen] = useState(false);
  const [roleAliasProvinceDropdownOpen, setRoleAliasProvinceDropdownOpen] = useState(false);
  const [adminNewsTitle, setAdminNewsTitle] = useState('');
  const [adminNewsBody, setAdminNewsBody] = useState('');
  const [adminNewsCategory, setAdminNewsCategory] = useState('General');
  const [adminNewsImage, setAdminNewsImage] = useState('');
  const [adminNewsDraft, setAdminNewsDraft] = useState(false);
  const [adminNewsFeatured, setAdminNewsFeatured] = useState(false);
  const [adminNewsNotify, setAdminNewsNotify] = useState(false);
  const [adminNewsScope, setAdminNewsScope] = useState<'nacional' | 'provincial'>('provincial');
  const [adminNewsProvince, setAdminNewsProvince] = useState('');
  const [adminNewsProvinceDropdownOpen, setAdminNewsProvinceDropdownOpen] = useState(false);
  const [newsDrafts, setNewsDrafts] = useState<NewsDraftRecord[]>([]);
  const [adminMaterials, setAdminMaterials] = useState<AppMaterialRecord[]>([]);
  const [adminChurchDocuments, setAdminChurchDocuments] = useState<ChurchDocumentButtonRecord[]>([]);
  const [churchDocumentEditingId, setChurchDocumentEditingId] = useState<string | null>(null);
  const [churchDocumentTitle, setChurchDocumentTitle] = useState('');
  const [churchDocumentLogoUrl, setChurchDocumentLogoUrl] = useState('');
  const [churchDocumentTargetUrl, setChurchDocumentTargetUrl] = useState('');
  const [churchDocumentEnabled, setChurchDocumentEnabled] = useState(true);
  const [churchDocumentSortOrder, setChurchDocumentSortOrder] = useState('1');
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [materialCategory, setMaterialCategory] = useState('General');
  const [materialVisibility, setMaterialVisibility] = useState('interno');
  const [materialPermission, setMaterialPermission] = useState('');
  const [materialFileUrl, setMaterialFileUrl] = useState('');
  const [adminEventTitle, setAdminEventTitle] = useState('');
  const [adminEventBody, setAdminEventBody] = useState('');
  const [adminEventDate, setAdminEventDate] = useState('');
  const [adminEventNotify, setAdminEventNotify] = useState(false);
  const [adminEventCalendarOpen, setAdminEventCalendarOpen] = useState(false);
  const [adminEventCalendarMonth, setAdminEventCalendarMonth] = useState(new Date());
  const [adminMotivadorPeriods, setAdminMotivadorPeriods] = useState<MotivadorPeriodRecord[]>([]);
  const [pmEditingId, setPmEditingId] = useState<string | null>(null);
  const [pmGender, setPmGender] = useState<'masculino' | 'femenino'>('masculino');
  const [pmNumber, setPmNumber] = useState('');
  const [pmProvince, setPmProvince] = useState(session?.role === 'administrador' ? '' : session?.province ?? '');
  const [pmSelectedDates, setPmSelectedDates] = useState<string[]>([]);
  const [pmCalendarOpen, setPmCalendarOpen] = useState(false);
  const [pmCalendarMonth, setPmCalendarMonth] = useState(new Date());
  const [pmRetreatHouse, setPmRetreatHouse] = useState('');
  const [pmAddress, setPmAddress] = useState('');
  const [pmOpeningTime, setPmOpeningTime] = useState('');
  const [pmClosingTime, setPmClosingTime] = useState('');
  const [pmDescription, setPmDescription] = useState('');
  const [pmPlacePhotoUrl, setPmPlacePhotoUrl] = useState('');
  const [pmFlyerUrl, setPmFlyerUrl] = useState('');
  const [pmVisibleToLowerRoles, setPmVisibleToLowerRoles] = useState(false);
  const [pmStatus, setPmStatus] = useState<'activo' | 'inactivo' | 'borrador' | 'archivado'>('borrador');
  const [pmProvinceFilter, setPmProvinceFilter] = useState('');
  const [pmGenderFilter, setPmGenderFilter] = useState<'todos' | 'masculino' | 'femenino'>('todos');
  const [pmStatusFilter, setPmStatusFilter] = useState<'todos' | 'activo' | 'inactivo' | 'borrador'>('todos');
  const [pmTimeFilter, setPmTimeFilter] = useState<'todos' | 'proximos' | 'pasados'>('todos');
  const [pmYearFilter, setPmYearFilter] = useState('todos');
  const [pmFilterDropdownOpen, setPmFilterDropdownOpen] = useState<'' | 'province' | 'gender' | 'status' | 'time' | 'year'>('');
  const [showPmForm, setShowPmForm] = useState(false);
  const [adminModule, setAdminModule] = useState<AdminModule>('resumen');
  const [adminConfigDraft, setAdminConfigDraft] = useState<AppAdminConfig>(adminConfig);
  const [runtimeConfigDraft, setRuntimeConfigDraft] = useState<AppRuntimeConfig>(runtimeConfig);
  const [adminCommunityProvince, setAdminCommunityProvince] = useState('');
  const [adminCommunityId, setAdminCommunityId] = useState('');
  const [adminCommunityName, setAdminCommunityName] = useState('');
  const [adminCommunityAddress, setAdminCommunityAddress] = useState('');
  const [adminCommunityPhone, setAdminCommunityPhone] = useState('');
  const [adminCommunityDay, setAdminCommunityDay] = useState('');
  const [adminCommunityTime, setAdminCommunityTime] = useState('');
  const [adminCommunityDescription, setAdminCommunityDescription] = useState('');
  const [adminCommunityLatitude, setAdminCommunityLatitude] = useState('');
  const [adminCommunityLongitude, setAdminCommunityLongitude] = useState('');
  const [adminCommunityImageUrl, setAdminCommunityImageUrl] = useState('');
  const [adminCommunityImagePreview, setAdminCommunityImagePreview] = useState('');
  const [adminCommunityImageAsset, setAdminCommunityImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [adminCommunityImageUploading, setAdminCommunityImageUploading] = useState(false);
  const [adminCommunityGroupType, setAdminCommunityGroupType] = useState<CommunityGroupType>('jovenes');
  const [adminCommunityIsActive, setAdminCommunityIsActive] = useState(true);
  const [newProvinceName, setNewProvinceName] = useState('');
  const [provinceCreateDropdownOpen, setProvinceCreateDropdownOpen] = useState(false);
  const [provinceLogoDrafts, setProvinceLogoDrafts] = useState<Record<string, string>>({});
  const [provinceLogoUploading, setProvinceLogoUploading] = useState('');
  const [showAdminCommunityCreate, setShowAdminCommunityCreate] = useState(false);
  const [editingTabs, setEditingTabs] = useState<Record<string, { label: string; iconName: string; sectionType: AppTabSectionType; isVisible: boolean; visibleRoles: string[] | null }>>({});
  const [newTabLabel, setNewTabLabel] = useState('');
  const [newTabKey, setNewTabKey] = useState('');
  const [newTabIcon, setNewTabIcon] = useState('document-text-outline');
  const [newTabSectionType, setNewTabSectionType] = useState<AppTabSectionType>('simple');
  const [newTabRoles, setNewTabRoles] = useState<string[]>(['sedimentador', 'coordinador_comunidad', 'animador_comunidad', 'vocal', 'coordinador_diocesano', 'asesor', 'vocal_nacional', 'coordinador_nacional', 'administrador']);
  const [selectedNavigationTabKey, setSelectedNavigationTabKey] = useState('');
  const [navigationRolesDropdownOpen, setNavigationRolesDropdownOpen] = useState(false);
  const [newNavigationRolesDropdownOpen, setNewNavigationRolesDropdownOpen] = useState(false);
  const [selectedContentTab, setSelectedContentTab] = useState<TabKey>('inicio');
  const [contentTitle, setContentTitle] = useState('');
  const [contentBody, setContentBody] = useState('');
  const [contentBlocks, setContentBlocks] = useState<ContentEditorBlock[]>([]);
  const [adminRequestMessage, setAdminRequestMessage] = useState('');
  const [perseveranceRole, setPerseveranceRole] = useState<Role>('sedimentador');
  const [perseveranceRoleDropdownOpen, setPerseveranceRoleDropdownOpen] = useState(false);
  const [communityMembers, setCommunityMembers] = useState<CommunityMember[]>([]);
  const [leadershipRole, setLeadershipRole] = useState<Role>('animador_comunidad');
  const [leadershipRoleDropdownOpen, setLeadershipRoleDropdownOpen] = useState(false);
  const [successorUserId, setSuccessorUserId] = useState('');
  const [successorDropdownOpen, setSuccessorDropdownOpen] = useState(false);
  const [communityPostKind, setCommunityPostKind] = useState<'aviso' | 'noticia' | 'fecha' | 'encuesta'>('aviso');
  const [communityPostVisibility, setCommunityPostVisibility] = useState<'publica' | 'registrados' | 'sedimentadores'>('publica');
  const [communityNoticeDraft, setCommunityNoticeDraft] = useState<CommunityNoticeDraft>(emptyCommunityNoticeDraft);
  const [communityPostDate, setCommunityPostDate] = useState('');
  const [communityPollOptions, setCommunityPollOptions] = useState('');
  const [communityPostNotify, setCommunityPostNotify] = useState(false);
  const [editingCommunityPublicationId, setEditingCommunityPublicationId] = useState<string | null>(null);
  const [editingCommunityNoticeDraft, setEditingCommunityNoticeDraft] = useState<CommunityNoticeDraft>(emptyCommunityNoticeDraft);
  const [myCommunityPublications, setMyCommunityPublications] = useState<CommunityPublication[]>([]);
  const [communityPanelOpen, setCommunityPanelOpen] = useState(false);
  const [communityDetailsSaving, setCommunityDetailsSaving] = useState(false);
  const [localPollVotes, setLocalPollVotes] = useState<Record<string, string>>({});
  const [forumComments, setForumComments] = useState<Record<string, PublicationComment[]>>({});
  const [forumCommentDrafts, setForumCommentDrafts] = useState<Record<string, string>>({});
  const [forumReportDrafts, setForumReportDrafts] = useState<Record<string, string>>({});
  const [expandedForumItem, setExpandedForumItem] = useState<string | null>(null);
  const [selectedPublicProfile, setSelectedPublicProfile] = useState<PublicProfilePreview | null>(null);
  const [showLeadershipPanel, setShowLeadershipPanel] = useState(false);
  const [sentRequests, setSentRequests] = useState<AdminRequest[]>([]);
  const [requestSubtab, setRequestSubtab] = useState<'pendientes' | 'resueltas'>('pendientes');
  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>([
    {
      id: 'req-001',
      title: 'Solicitud de perseverancia',
      requester: 'Usuario de prueba 1',
      definition: 'Pide revision para acceder al rango de Sedimentador.',
      createdAt: '2026-05-10T09:00:00-03:00',
      status: 'pendiente'
    },
    {
      id: 'req-002',
      title: 'Solicitud de material exclusivo',
      requester: 'Usuario de prueba 2',
      definition: 'Pide acceso a material interno de formacion.',
      createdAt: '2026-05-14T08:15:00-03:00',
      status: 'pendiente'
    }
  ]);
  const selectedRegistrationProvince = registrationCommunities.find((item) => item.province === registerProvince);
  const selectedEditProvince = registrationCommunities.find((item) => item.province === editProvince);
  const visibleRegistrationCommunities = useMemo(() => registrationCommunities.filter((item) => item.isActive !== false && !item.archivedAt && canAccessProvince(session, item.province)), [registrationCommunities, session?.province, session?.role]);
  const manageableCommunities = useMemo(() => registrationCommunities
    .map((province) => ({
      ...province,
      locations: province.locations.filter((community) => canEditCommunity(session, province.province, community.name))
    }))
    .filter((province) => province.locations.length > 0 || canManageProvince(session, province.province) || canSeeAllProvinces(session)), [registrationCommunities, session?.province, session?.role, session?.communityOfOrigin]);
  const motivadorProvinceOptions = useMemo(() => {
    if (session?.role === 'administrador') {
      return registrationCommunities.map((item) => item.province);
    }
    return session?.province ? [session.province] : [];
  }, [registrationCommunities, session?.province, session?.role]);
  const newsProvinceOptions = useMemo(() => {
    if (['vocal_nacional', 'coordinador_nacional', 'administrador'].includes(session?.role ?? 'invitado')) {
      return registrationCommunities.map((item) => item.province);
    }
    return session?.province ? [session.province] : [];
  }, [registrationCommunities, session?.province, session?.role]);
  const selectedAdminProvince = manageableCommunities.find((item) => item.province === adminCommunityProvince);
  const selectedAdminCommunity = selectedAdminProvince?.locations.find((item) => (item.id ?? item.name) === adminCommunityId);
  const selectedAdminUser = adminUsers.find((item) => item.id === selectedAdminUserId && canSeeUserInUsersPanel(session, item));
  const selectedQrActivityList = qrActivityLists.find((item) => item.id === selectedQrActivityListId) ?? null;
  const qrActivityProvinceOptions = session?.role === 'administrador'
    ? ['', ...registrationCommunities.map((item) => item.province)]
    : ['vocal_nacional', 'coordinador_nacional'].includes(session?.role ?? '')
      ? ['', ...registrationCommunities.map((item) => item.province)]
      : session?.province ? [session.province] : [];
  const qrActivityCommunityOptions = registrationCommunities.find((item) => item.province === (qrActivityProvince || session?.province))?.locations ?? [];
  const qrActivityCommunityDisabled = !qrActivityProvince;
  const qrActivityUserSelectionDisabled = !selectedQrActivityList?.province || !selectedQrActivityList?.community_name;
  const qrActivityCreateUserOptions = adminUsers.filter((user) => {
    if (['vocal', 'coordinador_diocesano'].includes(session?.role ?? '') && user.province !== session?.province) {
      return false;
    }
    if (qrActivityProvince && user.province !== qrActivityProvince) {
      return false;
    }
    if (qrActivityCommunity && user.community_name !== qrActivityCommunity) {
      return false;
    }
    const query = qrActivityUserSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return [user.full_name, user.nickname, user.email, user.community_name, user.province]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });
  const qrActivityShareUserOptions = adminUsers.filter((user) => {
    if (['vocal', 'coordinador_diocesano'].includes(session?.role ?? '') && user.province !== session?.province) {
      return false;
    }
    return user.status === 'aprobado';
  });
  const qrActivityShareRoleOptions = roleDefinitions
    .filter((item) => !['invitado', 'palestrista', 'administrador'].includes(item.role))
    .filter((item) => {
      if (session?.role === 'administrador') {
        return true;
      }
      if (['vocal_nacional', 'coordinador_nacional'].includes(session?.role ?? '')) {
        return ['vocal_nacional', 'coordinador_nacional', 'vocal', 'coordinador_diocesano', 'animador_comunidad', 'coordinador_comunidad', 'sedimentador'].includes(item.role);
      }
      return ['vocal', 'coordinador_diocesano', 'animador_comunidad', 'coordinador_comunidad', 'sedimentador'].includes(item.role);
    });
  const qrActivityMemberOptions = adminUsers.filter((user) => {
    if (!selectedQrActivityList) {
      return false;
    }
    if (selectedQrActivityList.province && user.province !== selectedQrActivityList.province) {
      return false;
    }
    if (selectedQrActivityList.community_name && user.community_name !== selectedQrActivityList.community_name) {
      return false;
    }
    if (['animador_comunidad', 'coordinador_comunidad'].includes(session?.role ?? '') && user.community_name !== session?.communityOfOrigin) {
      return false;
    }
    const query = qrActivityUserSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return [user.full_name, user.nickname, user.email, user.community_name]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });
  const selectedAdminUserProvince = visibleRegistrationCommunities.find((item) => item.province === adminUserProvince);
  const assignableRoles = useMemo(() => assignableRolesFor(session), [session?.role]);
  const selectedEditableContent = appContent.find((item) => item.tab_key === selectedContentTab);
  const canOpenCommunityAdmin = canUseCommunityAdmin(session);
  const editableTabs = useMemo(
    () => (tabs.length > 0 ? tabs : defaultTabs.map((tab, index) => ({ ...tab, sectionType: (tab.key === 'proceso_educativo' ? 'formation_path' : 'internal') as AppTabSectionType, visible: true, sortOrder: index, visibleRoles: null }))),
    [tabs]
  );
  const selectedNavigationTab = editableTabs.find((tab) => tab.key === selectedNavigationTabKey) ?? editableTabs[0];
  const selectedNavigationDraft = selectedNavigationTab
    ? (editingTabs[selectedNavigationTab.key] ?? {
      label: selectedNavigationTab.label,
      iconName: selectedNavigationTab.icon,
      sectionType: selectedNavigationTab.sectionType,
      isVisible: selectedNavigationTab.visible,
      visibleRoles: selectedNavigationTab.visibleRoles
    })
    : null;
  const tabLabel = (key: TabKey) => editableTabs.find((tab) => tab.key === key)?.label ?? defaultTabs.find((tab) => tab.key === key)?.label ?? key;
  const profileNews = session ? communityNews.filter((item) => item.community === session.communityOfOrigin) : [];
  const isCommunityLeader = isCommunityLeaderRole(session);
  const currentCommunity = useMemo(() => {
    if (!session) {
      return null;
    }
    const normalize = (value?: string | null) => (value ?? '').trim().toLocaleLowerCase('es');
    const province = registrationCommunities.find((item) => normalize(item.province) === normalize(session.province));
    return province?.locations.find((item) => normalize(item.name) === normalize(session.communityOfOrigin)) ?? null;
  }, [registrationCommunities, session?.province, session?.communityOfOrigin]);
  const myCommunityScope = {
    name: session?.communityOfOrigin,
    province: session?.province
  };
  const communityCapabilities = getCommunityCapabilities(session, myCommunityScope);
  const myCommunityNotices = useMemo(
    () => myCommunityPublications.filter((item) => item.kind === 'aviso'),
    [myCommunityPublications]
  );
  const canManageUsers = canManageUsersPanel(session);
  const canAdministrateCommunities = canCreateOrAdministrateCommunities(session);
  const canReviewLeadershipRequests = Boolean(session && ['vocal', 'coordinador_diocesano', 'administrador'].includes(session.role));
  const showDedicatedNavigationManager = adminModule === 'navegacion' && session?.role === 'administrador';
  const selectableCommunityMembers = communityMembers.filter((member) => (
    member.email !== session?.email
    && member.full_name !== session?.fullName
  ));
  const pendingAdminRequests = adminRequests.filter((item) => item.status === 'pendiente').sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const resolvedAdminRequests = adminRequests.filter((item) => item.status !== 'pendiente').sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const scopedAdminUsers = adminUsers.filter((user) => canSeeUserInUsersPanel(session, user));
  const filteredAdminUsers = scopedAdminUsers.filter((user) => {
    const query = adminUserSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return [user.full_name, user.nickname]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });
  const navigationVisibleCount = editableTabs.filter((tab) => {
    const draft = editingTabs[tab.key] ?? { label: tab.label, iconName: tab.icon, sectionType: tab.sectionType, isVisible: tab.visible, visibleRoles: tab.visibleRoles };
    return draft.isVisible;
  }).length;
  const navigationLockedCount = editableTabs.filter((tab) => protectedTabKeys.has(tab.key) || defaultTabByKey.has(tab.key)).length;
  const adminUsersByProvince = filteredAdminUsers.reduce<Record<string, AdminUser[]>>((groups, user) => {
    const province = user.province || 'Sin provincia';
    groups[province] = groups[province] ?? [];
    groups[province].push(user);
    return groups;
  }, {});
  const userProvinceOptions = Object.keys(adminUsersByProvince).sort((a, b) => a.localeCompare(b));
  const visibleAdminUsers = selectedUsersProvince ? (adminUsersByProvince[selectedUsersProvince] ?? []) : [];
  const editableProvinceUsers = scopedAdminUsers;
  const usersSummaryCount = session?.role === 'administrador'
    ? adminUsers.length || realPendingProfiles.length
    : editableProvinceUsers.length;
  const leadershipSummaryUsers = (session?.role === 'administrador' || canSeeAllProvinces(session))
    ? scopedAdminUsers
    : editableProvinceUsers;
  const activeCoordinators = adminUsers
    .filter((user) => ['coordinador_nacional', 'coordinador_diocesano'].includes(user.role) && user.status === 'aprobado')
    .sort((a, b) => {
      const rankA = a.role === 'coordinador_nacional' ? 0 : 1;
      const rankB = b.role === 'coordinador_nacional' ? 0 : 1;
      return rankA - rankB || (a.province ?? '').localeCompare(b.province ?? '') || (a.full_name ?? '').localeCompare(b.full_name ?? '');
    });
  const existingProvinceNames = new Set(registrationCommunities.filter((item) => !item.archivedAt).map((item) => item.province));
  const missingArgentinaProvinces = argentinaProvinceDefinitions.filter((item) => !existingProvinceNames.has(item.name));
  const selectedNewProvinceDefinition = provinceDefinitionFor(newProvinceName) ?? missingArgentinaProvinces[0] ?? null;
  const motivadorYearOptions = Array.from(new Set(adminMotivadorPeriods.map((period) => String(new Date(`${period.starts_on}T00:00:00`).getFullYear()))))
    .filter((year) => year !== 'NaN')
    .sort((a, b) => Number(b) - Number(a));
  const filteredMotivadorPeriods = adminMotivadorPeriods.filter((period) => {
    if (pmProvinceFilter && period.province !== pmProvinceFilter) {
      return false;
    }
    if (pmGenderFilter !== 'todos' && period.gender !== pmGenderFilter) {
      return false;
    }
    if (pmStatusFilter !== 'todos' && period.status !== pmStatusFilter) {
      return false;
    }
    if (pmYearFilter !== 'todos' && String(new Date(`${period.starts_on}T00:00:00`).getFullYear()) !== pmYearFilter) {
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endsAt = new Date(`${period.ends_on}T00:00:00`);
    if (pmTimeFilter === 'proximos' && endsAt < today) {
      return false;
    }
    if (pmTimeFilter === 'pasados' && endsAt >= today) {
      return false;
    }
    return true;
  });
  const enabledAdminModules = adminModuleCatalog.filter((item) => {
    if (item.key === 'navegacion') {
      return session?.role === 'administrador';
    }
    if (item.key === 'proceso_educativo') {
      return canManageFormationPathAdmin(session);
    }
    if (item.key === 'solicitudes') {
      return canManageRequestsPanel(session);
    }
    if (item.key === 'usuarios') {
      return canManageUsers;
    }
    if (item.key === 'moderacion') {
      return Boolean(session && ['administrador', 'coordinador_nacional', 'vocal_nacional', 'coordinador_diocesano'].includes(session.role));
    }
    if (item.key === 'home') {
      return session?.role === 'administrador';
    }
    if (item.key === 'noticias') {
      return canManageNewsContent(session);
    }
    if (item.key === 'comunidades') {
      return canOpenCommunityAdmin;
    }
    if (item.key === 'descargas') {
      return session?.role === 'administrador';
    }
    if (hasPermission(session, 'gestionar_sistema')) {
      return true;
    }
    if (item.key === 'resumen') {
      return true;
    }
    if (item.key === 'periodo_motivador') {
      return canManageMotivadorPanel(session);
    }
    if (canEditStaticInstitutionalPage(session) && ['contacto_admin'].includes(item.key)) {
      return true;
    }
    return !item.systemOnly;
  });
  const canManageRequests = canManageRequestsPanel(session);
  const canManageFormationPath = canManageFormationPathAdmin(session);
  const adminDraftSummary = [
    { label: 'Usuarios', value: String(usersSummaryCount), icon: 'people-outline' as keyof typeof Ionicons.glyphMap },
    ...(canManageRequests ? [{ label: 'Solicitudes', value: String(pendingAdminRequests.length), icon: 'mail-unread-outline' as keyof typeof Ionicons.glyphMap }] : []),
    { label: 'Comunidades', value: String(manageableCommunities.reduce((total, item) => total + item.locations.length, 0)), icon: 'location-outline' as keyof typeof Ionicons.glyphMap }
  ];
  useEffect(() => {
    if (adminModule === 'proceso_educativo' && !canManageFormationPath) {
      setAdminModule('resumen');
    }
    if (adminModule === 'solicitudes' && !canManageRequests) {
      setAdminModule('resumen');
    }
    if (adminModule === 'moderacion' && !['administrador', 'coordinador_nacional', 'vocal_nacional', 'coordinador_diocesano'].includes(session?.role ?? 'invitado')) {
      setAdminModule('resumen');
    }
  }, [adminModule, canManageFormationPath, canManageRequests, session?.role]);
  const mailboxController = useMailboxController({
    session,
    registrationCommunities,
    adminUsers: publicUserDirectory.length > 0 ? publicUserDirectory : adminUsers,
    provinceRoleLabels,
    roleAliases: adminConfig.settings.roleAliases,
    setAuthMessage,
    onEnsureAdminUsers: loadAdminUsers
  });
  const institutionalGreetingColor = isValidHexColor(adminConfig.identity.greetingNameColor) ? adminConfig.identity.greetingNameColor!.trim() : '#2fb66d';
  const normalizedEditGreetingColor = normalizeOptionalHexColor(editPersonalGreetingColor);
  const editGreetingPreviewColor = normalizedEditGreetingColor && isValidHexColor(normalizedEditGreetingColor) ? normalizedEditGreetingColor : institutionalGreetingColor;
  const editGreetingPreviewName = session ? homeGreetingName({
    ...session,
    nickname: editNickname.trim() || null,
    useNicknameInGreetings: editUseNicknameInGreetings
  }) : 'Palestrista';
  const territorialCooldown = territorialCooldownInfo(session);
  const territorialFieldsLocked = territorialCooldown.active && !isMissingProfileScope(session);
  const editFormLocked = !profileEditUnlocked;
  const territorialControlsLocked = editFormLocked || territorialFieldsLocked;
  useEffect(() => {
    setEditFullName(profileDraftValue(session?.fullName));
    setEditContact(profileDraftValue(session?.contact));
    setEditProvince(profileDraftValue(session?.province));
    setEditCommunity(profileDraftValue(session?.communityOfOrigin));
    setEditGenderPreference(session?.genderPreference ?? null);
    setEditNickname(session?.nickname ?? '');
    setEditUseNicknameInGreetings(Boolean(session?.useNicknameInGreetings));
    setEditCredentialNameMode(session?.credentialNameMode ?? 'name');
    setEditPersonalGreetingColor(session?.personalGreetingColor ?? '');
    setEditPerseveranceStartYear(session?.perseveranceStartYear ? String(session.perseveranceStartYear) : '');
    setEditPmType(session?.personalPmType ?? '');
    setEditPmNumber(session?.personalPmNumber ? String(session.personalPmNumber) : '');
    setEditPmProvince(session?.personalPmProvince ?? session?.province ?? '');
    setEditPmMotto(session?.personalPmMotto ?? session?.pmMotto ?? '');
    setProfileEditUnlocked(false);
  }, [session]);

  useEffect(() => {
    if (profilePanel !== 'editar') {
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        loadRealProfile(data.user.id, data.user.email ?? session?.email ?? 'Usuario');
      }
    });
  }, [profilePanel, session?.id]);

  useEffect(() => {
    setAdminConfigDraft(adminConfig);
  }, [adminConfig]);

  useEffect(() => {
    setRuntimeConfigDraft(runtimeConfig);
  }, [runtimeConfig]);

  useEffect(() => {
    let alive = true;
    async function loadNotificationStatus() {
      if (Platform.OS === 'web') {
        setNotificationPermissionStatus('solo celular');
        return;
      }
      try {
        const permission = await Notifications.getPermissionsAsync();
        if (alive) {
          setNotificationPermissionStatus(permission.status);
        }
      } catch {
        if (alive) {
          setNotificationPermissionStatus('no disponible');
        }
      }
    }
    loadNotificationStatus();
    return () => {
      alive = false;
    };
  }, [session?.id, profilePanel]);

  useEffect(() => {
    if (session?.role !== 'administrador') {
      setPmProvince(session?.province ?? '');
      setPmProvinceFilter('');
    }
  }, [session?.province, session?.role]);

  useEffect(() => {
    if (isMissingProfileScope(session)) {
      setProfilePanel('editar');
      setAuthMessage('Completa provincia y comunidad para continuar.');
    }
  }, [session]);

  useEffect(() => {
    if (!isMissingProfileScope(session)) {
      setProfilePanel(initialPanel);
    }
  }, [initialPanel]);

  useEffect(() => {
    if (!initialPublicProfile) {
      return;
    }
    setProfilePanel('vista');
    openPublicProfile(initialPublicProfile);
    onInitialPublicProfileHandled?.();
  }, [initialPublicProfile?.id]);

  useEffect(() => {
    fetchProvinceRoleLabels().then(setProvinceRoleLabels);
  }, [session?.id]);

  useEffect(() => {
    if (authMessage.startsWith('Cambio realizado.')) {
      onSavedFeedback('Cambios guardados');
    } else if (authMessage && !authMessage.startsWith('Completa provincia')) {
      const lowerMessage = authMessage.toLowerCase();
      if (lowerMessage.includes('error') || lowerMessage.includes('no se pudo') || lowerMessage.includes('failed')) {
        onErrorFeedback(authMessage);
      }
    }
  }, [authMessage, onErrorFeedback, onSavedFeedback]);

  function updateAdminConfigSection<K extends keyof AppAdminConfig>(section: K, patch: Partial<AppAdminConfig[K]>) {
    setAdminConfigDraft((current) => ({
      ...current,
      [section]: {
        ...current[section],
        ...patch
      }
    }));
  }

  function updateRuntimeCatholicNews(patch: Partial<Omit<AppRuntimeConfig['catholicNews'], 'sources' | 'sourceLabels' | 'sourceUrls'>> & {
    sources?: Partial<Record<CatholicNewsSourceKey, boolean>>;
    sourceLabels?: Partial<Record<CatholicNewsSourceKey, string>>;
    sourceUrls?: Partial<Record<CatholicNewsSourceKey, string>>;
  }) {
    setRuntimeConfigDraft((current) => ({
      ...current,
      catholicNews: {
        ...current.catholicNews,
        ...patch,
        sources: {
          ...current.catholicNews.sources,
          ...(patch.sources ?? {})
        },
        sourceLabels: {
          ...current.catholicNews.sourceLabels,
          ...(patch.sourceLabels ?? {})
        },
        sourceUrls: {
          ...current.catholicNews.sourceUrls,
          ...(patch.sourceUrls ?? {})
        }
      },
      featureFlags: {
        ...current.featureFlags,
        externalCatholicNews: patch.enabled ?? current.featureFlags.externalCatholicNews
      }
    }));
  }

  async function saveRuntimeConfigDraft() {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo el administrador puede guardar configuracion remota.');
      return;
    }
    setAuthMessage('Guardando configuracion remota...');
    const { error } = await saveAppRuntimeConfig(runtimeConfigDraft);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    onRuntimeConfigChange(runtimeConfigDraft);
    setAuthMessage(changeDone('Configuracion remota guardada en Supabase.'));
  }

  function toggleAdminConfigList(section: 'home', key: string) {
    setAdminConfigDraft((current) => {
      const currentList = current[section].visibleModules;
      const nextList = currentList.includes(key) ? currentList.filter((item) => item !== key) : [...currentList, key];
      return { ...current, [section]: { ...current[section], visibleModules: nextList } };
    });
  }

  async function saveAdminConfigDraft(scope: string) {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo el administrador puede guardar configuración global.');
      return;
    }
    setAuthMessage(`Guardando ${scope}...`);
    const { error } = await saveAdminConfig(adminConfigDraft);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    onAdminConfigChange(adminConfigDraft);
    setAuthMessage(changeDone(`${scope} guardado en Supabase.`));
  }

  async function setFallbackContentHidden(key: string, hidden: boolean) {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo Administrador puede gestionar contenido publicado.');
      return;
    }
    const current = adminConfigDraft.settings.hiddenFallbackContent ?? [];
    const nextHidden = hidden ? Array.from(new Set([...current, key])) : current.filter((item) => item !== key);
    const nextConfig = {
      ...adminConfigDraft,
      settings: {
        ...adminConfigDraft.settings,
        hiddenFallbackContent: nextHidden
      }
    };
    setAuthMessage('Guardando visibilidad de contenido...');
    const { error } = await saveAdminConfig(nextConfig);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAdminConfigDraft(nextConfig);
    onAdminConfigChange(nextConfig);
    setAuthMessage(changeDone(hidden ? 'Contenido ocultado.' : 'Contenido restaurado.'));
  }

  async function saveRoleAliasDraft() {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo Administrador puede duplicar o renombrar rangos.');
      return;
    }
    if (!roleAliasLabel.trim()) {
      setAuthMessage('Escribir el nuevo nombre visible del rango.');
      return;
    }
    if (!roleAliasIsGlobal && !roleAliasProvince) {
      setAuthMessage('Elegir provincia o marcar alcance global.');
      return;
    }
    setAuthMessage('Guardando alias de rango...');
    const { error } = await saveRoleAlias({
      baseRole: roleAliasBaseRole,
      displayLabel: roleAliasLabel.trim(),
      province: roleAliasIsGlobal ? null : roleAliasProvince,
      isActive: roleAliasActive
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await loadRoleAliases(false);
    setRoleAliasLabel('');
    setAuthMessage(changeDone('Alias de rango guardado y disponible para asignar.'));
  }

  async function toggleSavedRoleAlias(aliasId: string, active: boolean) {
    const { error } = await setRoleAliasStatus(aliasId, active);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await loadRoleAliases(false);
    setAuthMessage(changeDone(active ? 'Alias activado.' : 'Alias desactivado.'));
  }

  async function saveInstagramConfigDraft() {
    if (!canManageGlobalInstagram(session)) {
      setAuthMessage('Solo Coordinador Nacional y Administrador pueden modificar Instagram.');
      return;
    }
    setAuthMessage('Guardando Instagram...');
    const instagram = adminConfigDraft.contact.instagram.trim();
    const nextConfig = {
      ...adminConfig,
      contact: {
        ...adminConfig.contact,
        instagram
      }
    };
    const { error } = await saveAdminInstagram(instagram);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAdminConfigDraft(nextConfig);
    onAdminConfigChange(nextConfig);
    setAuthMessage(changeDone('Instagram guardado en Supabase.'));
  }

  function formatPmDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function isoDate(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function selectedDatesSummary(dates: string[]) {
    if (dates.length === 0) {
      return 'Sin fechas seleccionadas';
    }
    return [...dates].sort().map(formatPmDate).join(', ');
  }

  function togglePmDate(date: string) {
    setPmSelectedDates((current) => current.includes(date)
      ? current.filter((item) => item !== date)
      : [...current, date].sort());
  }

  function selectAdminEventDate(date: string) {
    setAdminEventDate(`${date}T09:00:00-03:00`);
    setAdminEventCalendarOpen(false);
  }

  async function loadMotivadorAdminPeriods() {
    if (!canManageMotivadorPanel(session)) {
      setAdminMotivadorPeriods([]);
      return;
    }
    const items = await fetchAdminMotivadorPeriods();
    setAdminMotivadorPeriods(items);
  }

  function resetMotivadorForm() {
    setPmEditingId(null);
    setPmGender('masculino');
    setPmNumber('');
    setPmProvince(session?.role === 'administrador' ? (motivadorProvinceOptions[0] ?? '') : session?.province ?? '');
    setPmSelectedDates([]);
    setPmRetreatHouse('');
    setPmAddress('');
    setPmOpeningTime('');
    setPmClosingTime('');
    setPmDescription('');
    setPmPlacePhotoUrl('');
    setPmFlyerUrl('');
    setPmVisibleToLowerRoles(false);
    setPmStatus('borrador');
    setPmCalendarOpen(false);
    setShowPmForm(false);
  }

  function editMotivadorPeriod(period: MotivadorPeriodRecord) {
    setPmEditingId(period.id);
    setPmGender(period.gender);
    setPmNumber(String(period.pm_number));
    setPmProvince(period.province ?? session?.province ?? '');
    setPmSelectedDates((period.selected_dates?.length ? period.selected_dates : [period.starts_on, period.ends_on]).map((date) => String(date).slice(0, 10)).filter(Boolean));
    setPmRetreatHouse(period.retreat_house ?? '');
    setPmAddress(period.address ?? '');
    setPmOpeningTime(period.opening_time ?? '');
    setPmClosingTime(period.closing_time ?? '');
    setPmDescription(period.description ?? '');
    setPmPlacePhotoUrl(period.place_photo_url ?? '');
    setPmFlyerUrl(period.flyer_url ?? '');
    setPmVisibleToLowerRoles(Boolean(period.visible_to_lower_roles));
    setPmStatus(period.status === 'archivado' ? 'inactivo' : period.status);
    setPmCalendarOpen(true);
    setShowPmForm(true);
  }

  async function submitMotivadorPeriod() {
    if (!canManageMotivadorPanel(session)) {
      setAuthMessage('No tenes permisos para gestionar PM.');
      return;
    }
    if (!pmProvince || !pmNumber.trim() || pmSelectedDates.length === 0 || !pmRetreatHouse.trim() || !pmAddress.trim() || !pmOpeningTime.trim() || !pmClosingTime.trim()) {
      setAuthMessage('Completá tipo, número, provincia, fechas, casa, dirección y horarios.');
      return;
    }
    const { error } = await saveMotivadorPeriod({
      id: pmEditingId,
      province: pmProvince,
      gender: pmGender,
      pmNumber: Number.parseInt(pmNumber, 10),
      selectedDates: pmSelectedDates,
      retreatHouse: pmRetreatHouse.trim(),
      address: pmAddress.trim(),
      openingTime: pmOpeningTime.trim(),
      closingTime: pmClosingTime.trim(),
      description: pmDescription.trim(),
      placePhotoUrl: pmPlacePhotoUrl.trim(),
      flyerUrl: pmFlyerUrl.trim(),
      visibleToLowerRoles: pmVisibleToLowerRoles,
      status: pmStatus
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAuthMessage(changeDone('PM guardado.'));
    resetMotivadorForm();
    await loadMotivadorAdminPeriods();
  }

  async function updateMotivadorStatus(id: string, status: 'activo' | 'inactivo' | 'borrador' | 'archivado') {
    const { error } = await setMotivadorPeriodStatus(id, status);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAuthMessage(changeDone(status === 'archivado' ? 'PM archivado.' : `Estado actualizado a ${status}.`));
    await loadMotivadorAdminPeriods();
  }

  useEffect(() => {
    const tab = editableTabs.find((item) => item.key === selectedContentTab);
    setContentTitle(selectedEditableContent?.title ?? tab?.label ?? '');
    setContentBody(selectedEditableContent?.body ?? '');
    setContentBlocks(selectedEditableContent?.blocks?.length ? selectedEditableContent.blocks : [
      { id: 'block-title', type: 'titulo', value: selectedEditableContent?.title ?? tab?.label ?? '' },
      { id: 'block-body', type: 'texto', value: selectedEditableContent?.body ?? '' }
    ]);
  }, [selectedContentTab, selectedEditableContent, editableTabs]);

  useEffect(() => {
    let alive = true;
    fetchCommunities().then((items) => {
      if (alive) {
        setRegistrationCommunities(items);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (adminModule === 'periodo_motivador') {
      loadMotivadorAdminPeriods();
      if (!pmProvince && motivadorProvinceOptions.length > 0) {
        setPmProvince(motivadorProvinceOptions[0]);
      }
    }
  }, [adminModule, session?.role, session?.province, motivadorProvinceOptions.length]);

  useEffect(() => {
    if (adminModule !== 'comunidades' || manageableCommunities.length === 0) {
      return;
    }
    if (!manageableCommunities.some((item) => item.province === adminCommunityProvince)) {
      setAdminCommunityProvince(manageableCommunities[0].province);
      setAdminCommunityId('');
    }
  }, [adminModule, manageableCommunities, adminCommunityProvince]);

  useEffect(() => {
    let alive = true;
    if (adminModule === 'comunidades' && canOpenCommunityAdmin) {
      fetchCommunities(adminCommunitiesFetchOptions).then((items) => {
        if (alive) {
          setRegistrationCommunities(items);
        }
      });
    }
    return () => {
      alive = false;
    };
  }, [adminModule, canOpenCommunityAdmin]);

  useEffect(() => {
    if (!canManageNewsContent(session)) {
      setAdminNewsScope('provincial');
      setAdminNewsProvince('');
      return;
    }
    if (session && ['vocal', 'coordinador_diocesano'].includes(session.role)) {
      setAdminNewsScope('provincial');
      setAdminNewsProvince(session.province);
      return;
    }
    if (!adminNewsProvince && newsProvinceOptions.length > 0) {
      setAdminNewsProvince(newsProvinceOptions[0]);
    }
  }, [session?.role, session?.province, newsProvinceOptions.length]);

  useEffect(() => {
    if (adminModule === 'etiquetas_roles' && session?.role === 'administrador') {
      loadProvinceRoleLabels();
    }
  }, [adminModule, session?.role]);

  useEffect(() => {
    if (['rangos_alias', 'usuarios', 'permisos_roles'].includes(adminModule) && session?.role === 'administrador') {
      loadRoleAliases(false);
    }
  }, [adminModule, session?.role]);

  useEffect(() => {
    const current = provinceRoleLabels.find((item) => item.province === roleLabelProvince && item.role_key === roleLabelRole);
    setRoleLabelDraft(current?.display_label ?? roleLabel(roleLabelRole));
    setRoleLabelDescription(current?.description ?? '');
    setRoleLabelActive(current?.is_active ?? true);
  }, [provinceRoleLabels, roleLabelProvince, roleLabelRole]);

  useEffect(() => {
    if (!selectedAdminCommunity) {
      setAdminCommunityName('');
      setAdminCommunityAddress('');
      setAdminCommunityPhone('');
      setAdminCommunityDay('');
      setAdminCommunityTime('');
      setAdminCommunityDescription('');
      setAdminCommunityLatitude('');
      setAdminCommunityLongitude('');
      setAdminCommunityImageUrl('');
      setAdminCommunityImagePreview('');
      setAdminCommunityImageAsset(null);
      return;
    }

    setAdminCommunityName(selectedAdminCommunity.name);
    setAdminCommunityAddress(selectedAdminCommunity.address);
    setAdminCommunityPhone(selectedAdminCommunity.phone);
    setAdminCommunityDay(selectedAdminCommunity.meetingDay);
    setAdminCommunityTime(selectedAdminCommunity.meetingTime);
    setAdminCommunityDescription(selectedAdminCommunity.description);
    setAdminCommunityLatitude(selectedAdminCommunity.latitude != null ? String(selectedAdminCommunity.latitude) : '');
    setAdminCommunityLongitude(selectedAdminCommunity.longitude != null ? String(selectedAdminCommunity.longitude) : '');
    setAdminCommunityImageUrl(selectedAdminCommunity.imageUrl ?? '');
    setAdminCommunityImagePreview(selectedAdminCommunity.imageUrl ?? '');
    setAdminCommunityImageAsset(null);
    setAdminCommunityGroupType(selectedAdminCommunity.group ?? 'jovenes');
    setAdminCommunityIsActive(true);
  }, [selectedAdminCommunity]);

  useEffect(() => {
    if (!selectedAdminUser) {
      setAdminUserFullName('');
      setAdminUserPhone('');
      setAdminUserProvince('');
      setAdminUserCommunity('');
      setAdminUserStatus('pendiente');
      setAdminUserRole('palestrista');
      setAdminUserSubroleKey(null);
      setAdminUserDisplayRoleLabel('');
      setAdminUserNickname('');
      setAdminUserUseNicknameInGreetings(false);
      setAdminUserCredentialNameMode('name');
      setAdminUserPerseveranceStartYear('');
      setAdminUserPmType('');
      setAdminUserPmNumber('');
      setAdminUserPmProvince('');
      setAdminUserPmMotto('');
      return;
    }

    setAdminUserFullName(selectedAdminUser.full_name ?? '');
    setAdminUserEmail(selectedAdminUser.email ?? '');
    setAdminUserPassword('');
    setAdminUserPhone(selectedAdminUser.phone ?? '');
    setAdminUserProvince(selectedAdminUser.province ?? '');
    setAdminUserCommunity(selectedAdminUser.community_name ?? '');
    setAdminUserStatus(selectedAdminUser.status);
    setAdminUserRole((selectedAdminUser.role || 'palestrista') as Role);
    setAdminUserSubroleKey(selectedAdminUser.subrole_key ?? null);
    setAdminUserDisplayRoleLabel(selectedAdminUser.display_role_label ?? '');
    setAdminUserNickname(selectedAdminUser.nickname ?? '');
    setAdminUserUseNicknameInGreetings(Boolean(selectedAdminUser.use_nickname_in_greetings));
    setAdminUserCredentialNameMode(selectedAdminUser.credential_name_mode ?? 'name');
    setAdminUserPerseveranceStartYear(selectedAdminUser.perseverance_start_year ? String(selectedAdminUser.perseverance_start_year) : '');
    setAdminUserPmType(selectedAdminUser.personal_pm_type ?? '');
    setAdminUserPmNumber(selectedAdminUser.personal_pm_number ? String(selectedAdminUser.personal_pm_number) : '');
    setAdminUserPmProvince(selectedAdminUser.personal_pm_province ?? selectedAdminUser.province ?? '');
    setAdminUserPmMotto(selectedAdminUser.personal_pm_motto ?? selectedAdminUser.pm_motto ?? '');
  }, [selectedAdminUser]);

  async function refreshCredentialQr() {
    if (!session || session.role === 'invitado') {
      setCredentialQr(null);
      setCredentialQrPayload('');
      return;
    }
    setCredentialQrMessage('Generando credencial verificable...');
    const { data, error } = await issueMyCredentialQr();
    if (error || !data?.token) {
      setCredentialQrMessage(error?.message ?? 'No pude generar la credencial QR. Ejecuta el patch SQL de credenciales en Supabase.');
      return;
    }
    setCredentialQr(data);
    const payload = buildCredentialQrPayload({
      credentialId: data.credential_id,
      token: data.token,
      issuedAt: data.issued_at
    });
    setCredentialQrPayload(payload);
    setCredentialQrMessage('Credencial verificable activa.');
  }

  async function openQrScanner(mode: 'credential' | 'activity' = 'credential') {
    if (!canScanCredentialQr(session)) {
      setAuthMessage('Tu rango no tiene acceso a Escanear QR.');
      return;
    }
    if (mode === 'activity' && !selectedQrActivityListId) {
      setAuthMessage('Selecciona una lista QR antes de escanear.');
      return;
    }
    const permission = await Camera.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      setAuthMessage('Necesito permiso de camara para escanear credenciales.');
      return;
    }
    setQrValidationResult(null);
    setQrScannerMode(mode);
    setQrValidationMessage(mode === 'activity' ? 'Apunta la camara al QR para validar la lista.' : 'Apunta la camara al QR de la credencial.');
    setQrScannerActive(true);
    setQrScannerVisible(true);
  }

  async function validateScannedCredential(data: string) {
    const payload = parseCredentialQrPayload(data);
    if (!payload) {
      setQrValidationResult({ status: 'invalid', message: 'Credencial no valida', credential_id: null, user_id: null, full_name: null, role: null, province: null, community_name: null, user_status: null, issued_at: null, expires_at: null });
      setQrValidationMessage('Credencial no valida.');
      return;
    }
    setQrValidationMessage('Validando credencial en Supabase...');
    const { data: validation, error } = await validateCredentialQrToken(payload.token);
    if (error || !validation) {
      setQrValidationResult({ status: 'invalid', message: error?.message ?? 'Credencial no valida', credential_id: payload.credentialId, user_id: null, full_name: null, role: null, province: null, community_name: null, user_status: null, issued_at: null, expires_at: null });
      setQrValidationMessage(error?.message ?? 'Credencial no valida.');
      return;
    }
    setQrValidationResult(validation);
    setQrValidationMessage(validation.message);
  }

  async function loadQrActivityLists() {
    const items = await fetchQrActivityLists();
    setQrActivityLists(items);
    if (!selectedQrActivityListId && items.length > 0) {
      setSelectedQrActivityListId(items[0].id);
    }
  }

  async function loadQrActivityDetails(listId = selectedQrActivityListId) {
    if (!listId) {
      setQrActivityMembers([]);
      setQrActivityAttendance([]);
      setQrActivityShares([]);
      return;
    }
    const [members, attendance, shares] = await Promise.all([
      fetchQrActivityMembers(listId),
      fetchQrActivityAttendance(listId),
      fetchQrActivityListShares(listId)
    ]);
    setQrActivityMembers(members);
    setQrActivityAttendance(attendance);
    setQrActivityShares(shares);
  }

  async function saveQrActivityList() {
    if (!session || !['vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador'].includes(session.role)) {
      setAuthMessage('Tu rango no puede crear listas QR.');
      return;
    }
    const title = qrActivityTitle.trim();
    const province = qrActivityProvince || (['administrador', 'vocal_nacional', 'coordinador_nacional'].includes(session.role) ? null : session.province);
    if (!title) {
      setAuthMessage('Completa el nombre de la lista.');
      return;
    }
    if (qrActivityCreateSelectedUserIds.length === 0) {
      setAuthMessage('Selecciona al menos un usuario para crear la lista.');
      return;
    }
    const { data, error } = await createQrActivityList({ title, province, communityName: qrActivityCommunity || null });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    const listId = data ? String(data) : '';
    if (listId) {
      for (const userId of qrActivityCreateSelectedUserIds) {
        const { error: memberError } = await addQrActivityMember(listId, userId);
        if (memberError) {
          setAuthMessage(memberError.message);
          await loadQrActivityLists();
          return;
        }
      }
      if (qrActivityCreateShareUserIds.length > 0 || qrActivityCreateShareRoles.length > 0) {
        const { error: shareError } = await shareQrActivityList({
          listId,
          userIds: qrActivityCreateShareUserIds,
          roles: qrActivityCreateShareRoles
        });
        if (shareError) {
          setAuthMessage(shareError.message);
          await loadQrActivityLists();
          return;
        }
      }
    }
    setQrActivityTitle('');
    setQrActivityCommunity('');
    setQrActivityCreateSelectedUserIds([]);
    setQrActivityCreateShareUserIds([]);
    setQrActivityCreateShareRoles([]);
    if (data) {
      setSelectedQrActivityListId(String(data));
    }
    setShowQrActivityCreateMenu(false);
    setShowQrActivityListsMenu(true);
    setAuthMessage(changeDone('Lista QR creada.'));
    await loadQrActivityLists();
    if (listId) {
      await loadQrActivityDetails(listId);
    }
  }

  function toggleQrActivityCreateUser(userId: string) {
    setQrActivityCreateSelectedUserIds((current) =>
      current.includes(userId) ? current.filter((item) => item !== userId) : [...current, userId]
    );
  }

  function markAllQrActivityCreateUsers() {
    const ids = qrActivityCreateUserOptions.map((user) => user.id);
    setQrActivityCreateSelectedUserIds((current) => current.length === ids.length && ids.every((id) => current.includes(id)) ? [] : ids);
  }

  function toggleQrActivityShareUser(userId: string, mode: 'create' | 'edit' = 'create') {
    const setter = mode === 'create' ? setQrActivityCreateShareUserIds : setQrActivityEditShareUserIds;
    setter((current) => current.includes(userId) ? current.filter((item) => item !== userId) : [...current, userId]);
  }

  function toggleQrActivityShareRole(role: string, mode: 'create' | 'edit' = 'create') {
    const setter = mode === 'create' ? setQrActivityCreateShareRoles : setQrActivityEditShareRoles;
    setter((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role]);
  }

  async function saveQrActivityShares() {
    if (!selectedQrActivityList) {
      setAuthMessage(APP_MESSAGES.selectQrList);
      return;
    }
    const { error } = await shareQrActivityList({
      listId: selectedQrActivityList.id,
      userIds: qrActivityEditShareUserIds,
      roles: qrActivityEditShareRoles
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setQrActivityEditShareUserIds([]);
    setQrActivityEditShareRoles([]);
    setAuthMessage(changeDone('Lista compartida.'));
    await loadQrActivityDetails(selectedQrActivityList.id);
  }

  async function saveQrActivityListEdit() {
    if (!selectedQrActivityList) {
      setAuthMessage(APP_MESSAGES.selectQrList);
      return;
    }
    const title = qrActivityEditTitle.trim();
    if (!title) {
      setAuthMessage('El nombre de la lista no puede quedar vacio.');
      return;
    }
    const { error } = await updateQrActivityList({
      listId: selectedQrActivityList.id,
      title,
      province: qrActivityProvince || null,
      communityName: qrActivityCommunity || null
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAuthMessage(changeDone('Lista QR actualizada.'));
    await loadQrActivityLists();
    await loadQrActivityDetails(selectedQrActivityList.id);
  }

  async function addUserToQrActivity(userId: string) {
    if (!selectedQrActivityListId) {
      setAuthMessage(APP_MESSAGES.selectQrList);
      return;
    }
    const { error } = await addQrActivityMember(selectedQrActivityListId, userId);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAuthMessage(changeDone('Usuario agregado a la lista.'));
    await loadQrActivityDetails(selectedQrActivityListId);
  }

  async function addAllUsersToQrActivity() {
    if (!selectedQrActivityList) {
      setAuthMessage(APP_MESSAGES.selectQrList);
      return;
    }
    const { error } = await addQrActivityMembersByScope(selectedQrActivityList.id, selectedQrActivityList.province, selectedQrActivityList.community_name);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAuthMessage(changeDone('Usuarios agregados a la lista.'));
    await loadQrActivityDetails(selectedQrActivityList.id);
  }

  async function removeUserFromQrActivity(userId: string) {
    if (!selectedQrActivityList) {
      return;
    }
    const { error } = await removeQrActivityMember(selectedQrActivityList.id, userId);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAuthMessage(changeDone('Usuario quitado de la lista.'));
    await loadQrActivityDetails(selectedQrActivityList.id);
  }

  async function deleteQrActivityList(list = selectedQrActivityList) {
    if (!list) {
      return;
    }
    const confirmed = Platform.OS === 'web'
      ? (typeof window === 'undefined' ? true : window.confirm(`Eliminar lista ${list.title}?`))
      : true;
    if (!confirmed) {
      return;
    }
    const { error } = await archiveQrActivityList(list.id);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setSelectedQrActivityListId('');
    setQrActivityMembers([]);
    setQrActivityAttendance([]);
    setAuthMessage(changeDone('Lista QR eliminada.'));
    await loadQrActivityLists();
  }

  async function validateScannedCredentialForActivity(data: string) {
    const payload = parseCredentialQrPayload(data);
    if (!payload || !selectedQrActivityListId) {
      setQrValidationResult({ status: 'invalid', message: 'Credencial no valida', credential_id: null, user_id: null, full_name: null, role: null, province: null, community_name: null, user_status: null, issued_at: null, expires_at: null });
      setQrValidationMessage('Credencial no valida.');
      return;
    }
    setQrValidationMessage('Validando credencial contra la lista...');
    const { data: validation, error } = await validateQrActivityAttendance(selectedQrActivityListId, payload.token);
    if (error || !validation) {
      setQrValidationResult({ status: 'invalid', message: error?.message ?? 'Usuario no Registrado para esta actividad', credential_id: payload.credentialId, user_id: null, full_name: null, role: null, province: null, community_name: null, user_status: null, issued_at: null, expires_at: null });
      setQrValidationMessage(error?.message ?? 'Usuario no Registrado para esta actividad');
      return;
    }
    const row = Array.isArray(validation) ? validation[0] : validation;
    setQrValidationResult(row as CredentialValidationRecord);
    setQrValidationMessage((row as CredentialValidationRecord).message);
    await loadQrActivityDetails(selectedQrActivityListId);
  }

  function exportQrActivityAttendanceDoc() {
    if (!selectedQrActivityList) {
      setAuthMessage('Selecciona una lista para exportar.');
      return;
    }
    const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char));
    const rows = qrActivityAttendance.map((item) => `<tr><td>${escapeHtml(item.full_name ?? '')}</td><td>${escapeHtml(roleLabel((item.role ?? 'palestrista') as Role))}</td><td>${escapeHtml(item.province ?? '')}</td><td>${escapeHtml(item.community_name ?? '')}</td><td>${escapeHtml(item.validated_at ? new Date(item.validated_at).toLocaleString('es-AR') : '')}</td></tr>`).join('');
    const html = `<html><head><meta charset="utf-8"><title>${escapeHtml(selectedQrActivityList.title)}</title></head><body><h1>${escapeHtml(selectedQrActivityList.title)}</h1><p>${escapeHtml(selectedQrActivityList.province ?? 'Todas las provincias')} - ${escapeHtml(selectedQrActivityList.community_name ?? 'Todas las comunidades')}</p><table border="1" cellspacing="0" cellpadding="6"><thead><tr><th>Nombre</th><th>Rango</th><th>Provincia</th><th>Comunidad</th><th>Validado</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    if (Platform.OS === 'web') {
      const url = `data:application/msword;charset=utf-8,${encodeURIComponent(html)}`;
      Linking.openURL(url);
      return;
    }
    setAuthMessage('Exportacion DOC disponible en web. En Android se puede copiar desde la lista por ahora.');
  }

  async function handleCredentialBarcode(scanningResult: BarcodeScanningResult) {
    if (!qrScannerActive) {
      return;
    }
    setQrScannerActive(false);
    if (qrScannerMode === 'activity') {
      await validateScannedCredentialForActivity(scanningResult.data);
      return;
    }
    await validateScannedCredential(scanningResult.data);
  }

  function normalizeRequest(item: UserRequestRecord): AdminRequest {
    return {
      id: item.id,
      userId: item.user_id,
      title: item.title,
      requester: item.requester,
      definition: item.definition,
      createdAt: item.created_at,
      status: item.status === 'rechazada' ? 'denegada' : item.status as AdminRequest['status'],
      message: item.admin_message ?? undefined,
      resolvedAt: item.resolved_at ?? undefined,
      resolvedBy: item.resolved_by_name ? `${item.resolved_by_name}${item.resolved_by_role ? ` - ${roleLabel(item.resolved_by_role as Role)}` : ''}` : undefined,
      targetUserId: item.target_user_id,
      targetUserName: item.target_user_name,
      targetRole: item.target_role,
      communityName: item.community_name
    };
  }

  async function loadMyRequests() {
    const items = await fetchMyRequests();
    if (items.length > 0) {
      setSentRequests(items.map(normalizeRequest));
    }
  }

  async function loadAdminRequests() {
    if (!canManageRequestsPanel(session)) {
      setAdminRequests([]);
      return;
    }
    const items = await fetchAdminRequests();
    if (items.length > 0) {
      setAdminRequests(items.map(normalizeRequest));
    } else {
      setAdminRequests([]);
    }
  }

  async function refreshCommunityForum() {
    if (!session) {
      setMyCommunityPublications([]);
      setForumComments({});
      return;
    }
    const normalizeCommunity = (value?: string | null) => (value ?? '').trim().toLowerCase();
    const items = await fetchCommunityPublications(session);
    const scopedItems = items.filter((item) => normalizeCommunity(item.communityName) === normalizeCommunity(session.communityOfOrigin));
    setMyCommunityPublications(scopedItems);
    const ids = scopedItems.map((item) => item.id).filter(Boolean) as string[];
    setForumComments(await fetchPublicationComments(ids));
  }

  async function loadPrayerIntentionsPanel() {
    if (!session || session.role === 'invitado') {
      setMyPrayerIntentions([]);
      return;
    }
    setPrayerIntentionsMessage('Cargando intenciones...');
    const items = session.role === 'administrador'
      ? await fetchAdminPrayerIntentions()
      : await fetchMyPrayerIntentions();
    setMyPrayerIntentions(items);
    const notices = await fetchMyPrayerRemovalNotices();
    setPrayerRemovalNotices(notices);
    setPrayerRemovalNoticeVisible(notices.length > 0);
    setPrayerIntentionsMessage(items.length === 0 ? 'No hay intenciones publicadas para mostrar.' : '');
  }

  async function closePrayerRemovalNotice() {
    const ids = prayerRemovalNotices.map((notice) => notice.id);
    setPrayerRemovalNoticeVisible(false);
    setPrayerRemovalNotices([]);
    if (ids.length > 0) {
      await markPrayerRemovalNoticesSeen(ids);
    }
  }

  async function deletePrayerIntentionFromAdmin(item: PrayerIntentionRecord) {
    if (session?.role !== 'administrador') {
      setPrayerIntentionsMessage(APP_MESSAGES.adminOnly('eliminar intenciones'));
      return;
    }
    const confirmed = Platform.OS === 'web'
      ? (typeof window === 'undefined' ? true : window.confirm('¿Eliminar esta intencion y notificar al autor?'))
      : await new Promise<boolean>((resolve) => {
        Alert.alert('Eliminar intencion', 'Se notificara al autor que fue removida por considerarse inadecuada.', [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) }
        ]);
      });
    if (!confirmed) {
      return;
    }
    setPrayerIntentionsMessage('Eliminando intencion...');
    const { data, error } = await archivePrayerIntention(item.id);
    if (error) {
      setPrayerIntentionsMessage(error.message);
      return;
    }
    const intentId = Array.isArray(data) ? data[0]?.notification_intent_id : data?.notification_intent_id;
    if (intentId) {
      await deliverNotificationIntent(intentId).catch(() => undefined);
    }
    setPrayerIntentionsMessage(changeDone('Intencion eliminada y autor notificado.'));
    await loadPrayerIntentionsPanel();
  }

  useEffect(() => {
    if (session) {
      loadMyRequests();
      refreshCommunityForum();
      if (['animador_comunidad', 'coordinador_comunidad'].includes(session.role)) {
        fetchMyCommunityMembers().then(setCommunityMembers);
      }
      if (canManageRequestsPanel(session)) {
        loadAdminRequests();
      }
    }
  }, [session?.email, session?.role, session?.communityOfOrigin]);

  useEffect(() => {
    if (profilePanel === 'comunidad') {
      refreshCommunityForum();
      if (session && communityMembers.length === 0) {
        fetchMyCommunityMembers().then(setCommunityMembers);
      }
    }
    if (adminModule === 'listas_qr') {
      loadQrActivityLists();
      if (canManageUsersPanel(session) && adminUsers.length === 0) {
        loadAdminUsers();
      }
      if (isCommunityLeaderRole(session) && communityMembers.length === 0) {
        fetchMyCommunityMembers().then(setCommunityMembers);
      }
    }
  }, [profilePanel, session?.email, session?.communityOfOrigin, adminUsers.length, communityMembers.length]);

  useEffect(() => {
    if (adminModule === 'listas_qr') {
      loadQrActivityDetails();
      if (selectedQrActivityList) {
        setQrActivityEditTitle(selectedQrActivityList.title);
        setQrActivityProvince(selectedQrActivityList.province ?? '');
        setQrActivityCommunity(selectedQrActivityList.community_name ?? '');
      }
    }
  }, [adminModule, selectedQrActivityListId, selectedQrActivityList?.title, selectedQrActivityList?.province, selectedQrActivityList?.community_name]);

  useEffect(() => {
    if (canManageUsersPanel(session) && adminUsers.length === 0) {
      fetchAdminUsers().then((items) => {
        setAdminUsers(items);
        if (!selectedUsersProvince && items.length > 0) {
          setSelectedUsersProvince(defaultUsersProvinceFor(session, items));
        }
      });
    }
  }, [session?.email, session?.role, adminUsers.length, selectedUsersProvince]);

  useEffect(() => {
    let alive = true;
    async function loadPublicDirectory() {
      if (!session || session.role === 'invitado' || session.status !== 'aprobado') {
        setPublicUserDirectory([]);
        return;
      }
      const items = await fetchPublicUserDirectory();
      if (alive) {
        setPublicUserDirectory(items);
      }
    }
    loadPublicDirectory();
    return () => {
      alive = false;
    };
  }, [session?.id, session?.role, session?.status]);

  async function loadRealProfile(userId: string, fallbackEmail: string) {
    const result = await getMyProfileSession(fallbackEmail);
    if (result.error) {
      setAuthMessage(`No pude leer tu perfil: ${result.error}`);
      return;
    }
    if (result.session) {
      if (result.session.status === 'bloqueado') {
        await supabase.auth.signOut();
        onSessionChange(null);
        setAuthMessage('Este usuario esta bloqueado o eliminado. Contacta a un administrador.');
        return;
      }
      onSessionChange(session ? {
        ...result.session,
        subroleKey: result.session.subroleKey ?? session.subroleKey,
        displayRoleLabel: result.session.displayRoleLabel ?? session.displayRoleLabel,
        genderPreference: result.session.genderPreference ?? session.genderPreference,
        nickname: result.session.nickname ?? session.nickname,
        credentialNameMode: result.session.credentialNameMode ?? session.credentialNameMode,
        perseveranceStartYear: result.session.perseveranceStartYear ?? session.perseveranceStartYear,
        personalPmType: result.session.personalPmType ?? session.personalPmType,
        personalPmNumber: result.session.personalPmNumber ?? session.personalPmNumber,
        personalPmProvince: result.session.personalPmProvince ?? session.personalPmProvince,
        personalPmMotto: result.session.personalPmMotto ?? session.personalPmMotto,
        pmMotto: result.session.pmMotto ?? session.pmMotto,
        personalGreetingColor: result.session.personalGreetingColor ?? session.personalGreetingColor,
        provinceCommunityChangedAt: result.session.provinceCommunityChangedAt ?? session.provinceCommunityChangedAt
      } : result.session);
    }
  }

  function resetProfileDraft() {
    setEditFullName(profileDraftValue(session?.fullName));
    setEditContact(profileDraftValue(session?.contact));
    setEditProvince(profileDraftValue(session?.province));
    setEditCommunity(profileDraftValue(session?.communityOfOrigin));
    setEditGenderPreference(session?.genderPreference ?? null);
    setEditNickname(session?.nickname ?? '');
    setEditUseNicknameInGreetings(Boolean(session?.useNicknameInGreetings));
    setEditCredentialNameMode(session?.credentialNameMode ?? 'name');
    setEditPersonalGreetingColor(session?.personalGreetingColor ?? '');
    setEditPerseveranceStartYear(session?.perseveranceStartYear ? String(session.perseveranceStartYear) : '');
    setEditPmType(session?.personalPmType ?? '');
    setEditPmNumber(session?.personalPmNumber ? String(session.personalPmNumber) : '');
    setEditPmProvince(session?.personalPmProvince ?? profileDraftValue(session?.province));
    setEditPmMotto(session?.personalPmMotto ?? session?.pmMotto ?? '');
    setEditProvinceDropdownOpen(false);
    setEditCommunityDropdownOpen(false);
    setEditPerseveranceYearDropdownOpen(false);
    setEditPmProvinceDropdownOpen(false);
    setProfileEditUnlocked(false);
    setAuthMessage('');
  }

  function validateAuthForm() {
    const nextErrors: Record<string, string> = {};
    if (!isValidEmail(authEmail)) {
      nextErrors.email = 'Ingresa un correo valido';
    }
    if (!authPassword) {
      nextErrors.password = 'La contraseña es obligatoria';
    }
    if (authMode === 'register') {
      if (!registerFullName.trim()) {
        nextErrors.fullName = 'Ingresa tu nombre completo';
      }
      if (!registerProvince) {
        nextErrors.province = 'Selecciona tu provincia';
      }
      if (!registerCommunity) {
        nextErrors.community = 'Selecciona tu comunidad';
      }
      if (!registerPerseveranceStartYear) {
        nextErrors.perseverance = 'Selecciona el año de inicio';
      }
      if (authPassword.length < 6) {
        nextErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
      if (authPasswordConfirm !== authPassword) {
        nextErrors.confirm = 'Las contraseñas no coinciden';
      }
    }
    setAuthErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function confirmProfileChangeIfNeeded() {
    if (!session) {
      return Promise.resolve(false);
    }
    const changesProvince = editProvince && editProvince !== session.province;
    const changesCommunity = editCommunity && editCommunity !== session.communityOfOrigin;
    const canDowngrade = (changesProvince && provinceDowngradesRole(session.role)) || (changesCommunity && communityDowngradesRole(session.role));
    if (!canDowngrade) {
      return Promise.resolve(true);
    }

    const message = 'Al cambiar tu provincia o comunidad, tu rango actual puede volver a Sedimentador hasta nueva aprobación.';
    if (Platform.OS === 'web') {
      return Promise.resolve(typeof window === 'undefined' ? true : window.confirm(message));
    }

    return new Promise<boolean>((resolve) => {
      Alert.alert('Confirmar cambio', message, [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Continuar', style: 'destructive', onPress: () => resolve(true) }
      ]);
    });
  }

  async function signInReal() {
    if (!validateAuthForm()) {
      return;
    }
    setAuthMessage('Ingresando...');
    const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
    if (error || !data.user) {
      setAuthMessage(safeAuthError(error?.message));
      return;
    }
    await loadRealProfile(data.user.id, authEmail.trim());
    setAuthMessage('Sesión iniciada.');
  }

  async function registerReal() {
    if (!validateAuthForm()) {
      return;
    }

    setAuthMessage('Registrando...');
    const { data, error } = await supabase.auth.signUp({
      email: authEmail.trim(),
      password: authPassword,
      options: {
        emailRedirectTo: authDeepLinkBaseUrl,
        data: {
          full_name: registerFullName.trim() || authEmail.trim(),
          phone: registerContact.trim(),
          province: registerProvince.trim(),
          community_name: registerCommunity.trim(),
          perseverance_start_year: registerPerseveranceStartYear
        }
      }
    });
    if (error || !data.user) {
      setAuthMessage(safeAuthError(error?.message));
      return;
    }

    if (data.session) {
      await loadRealProfile(data.user.id, authEmail.trim());
      setAuthMessage('Registro creado. Queda pendiente de aprobación.');
      return;
    }

    setAuthMessage('Registro creado como Palestrista pendiente. Iniciá sesión cuando el email esté confirmado o un administrador lo habilite.');
  }

  async function signOutReal() {
    await supabase.auth.signOut();
    setAuthMessage('');
    onSessionChange(null);
  }

  async function refreshRealProfile() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setAuthMessage('No hay una sesión real activa. Cerrá e iniciá sesión otra vez.');
      return;
    }

    await loadRealProfile(data.user.id, data.user.email ?? 'Usuario');
    setAuthMessage('Estado actualizado desde Supabase.');
  }

  async function saveProfile() {
    if (!session) {
      return;
    }
    if (!profileEditUnlocked) {
      setAuthMessage('Presiona Editar para habilitar cambios en tu perfil.');
      return;
    }

    if (!editProvince || !editCommunity) {
      setAuthMessage('Elegir provincia y comunidad es obligatorio.');
      return;
    }
    const greetingColorValidation = personalGreetingColorError(editPersonalGreetingColor);
    if (greetingColorValidation) {
      setAuthMessage(greetingColorValidation);
      return;
    }
    const personalGreetingColor = normalizeOptionalHexColor(editPersonalGreetingColor);
    const canUsePersonalPm = roleRank(session.role) >= roleRank('sedimentador');
    if (canUsePersonalPm && (editPmType || editPmNumber || editPmProvince || editPmMotto.trim())) {
      if (!editPmType || !editPmNumber.trim() || !editPmProvince) {
        setAuthMessage('Para cargar tu PM personal completá tipo, número y provincia.');
        return;
      }
      const pmNumberValue = Number(editPmNumber);
      if (!Number.isInteger(pmNumberValue) || pmNumberValue <= 0) {
        setAuthMessage('El número de PM debe ser un número válido.');
        return;
      }
    }

    const confirmed = await confirmProfileChangeIfNeeded();
    if (!confirmed) {
      return;
    }
    const changesProvince = editProvince !== session.province;
    const changesCommunity = editCommunity !== session.communityOfOrigin;
    if ((changesProvince || changesCommunity) && territorialFieldsLocked) {
      setAuthMessage(`Provincia y comunidad solo pueden cambiarse cada ${territorialProfileCooldownDays} dias. Podras volver a modificarlas en ${territorialCooldown.daysLeft} dia(s). El resto del perfil sigue editable.`);
      return;
    }
    const finalSessionRole = roleAfterScopeChange(session.role, changesProvince, changesCommunity);
    const mayDowngrade = finalSessionRole !== session.role;
    const coreProfileChanged = (
      (editFullName || session.fullName) !== session.fullName
      || (editContact || session.contact) !== session.contact
      || (editProvince || session.province) !== session.province
      || (editCommunity || session.communityOfOrigin) !== session.communityOfOrigin
      || editGenderPreference !== (session.genderPreference ?? null)
    );

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setAuthMessage('Perfil de prueba actualizado visualmente. Iniciá sesión real para guardar en Supabase.');
      const changedTerritoryAt = changesProvince || changesCommunity ? new Date().toISOString() : session.provinceCommunityChangedAt;
      onSessionChange({
        ...session,
        fullName: editFullName || session.fullName,
        province: editProvince || session.province,
        contact: editContact || session.contact,
        communityOfOrigin: editCommunity || session.communityOfOrigin,
        role: finalSessionRole,
        subroleKey: finalSessionRole === session.role ? session.subroleKey : null,
        genderPreference: editGenderPreference,
        nickname: editNickname.trim() || null,
        useNicknameInGreetings: editUseNicknameInGreetings,
        credentialNameMode: editCredentialNameMode,
        perseveranceStartYear: editPerseveranceStartYear ? Number(editPerseveranceStartYear) : null,
        personalPmType: canUsePersonalPm ? (editPmType || null) : null,
        personalPmNumber: canUsePersonalPm && editPmNumber ? Number(editPmNumber) : null,
        personalPmProvince: canUsePersonalPm ? (editPmProvince || null) : null,
        personalPmMotto: canUsePersonalPm ? (editPmMotto.trim() || null) : null,
        pmMotto: canUsePersonalPm ? (editPmMotto.trim() || null) : null,
        personalGreetingColor,
        provinceCommunityChangedAt: changedTerritoryAt
      });
      return;
    }

    const profileDetails = {
      nickname: editNickname.trim() || null,
      useNicknameInGreetings: editUseNicknameInGreetings,
      credentialNameMode: editCredentialNameMode,
      perseveranceStartYear: editPerseveranceStartYear ? Number(editPerseveranceStartYear) : null,
      personalPmType: canUsePersonalPm ? (editPmType || null) : null,
      personalPmNumber: canUsePersonalPm && editPmNumber ? Number(editPmNumber) : null,
      personalPmProvince: canUsePersonalPm ? (editPmProvince || null) : null,
      personalPmMotto: canUsePersonalPm ? (editPmMotto.trim() || null) : null,
      pmMotto: canUsePersonalPm ? (editPmMotto.trim() || null) : null,
      personalGreetingColor: personalGreetingColor ?? ''
    };
    const { error } = coreProfileChanged ? await updateMyProfile({
      fullName: editFullName || session.fullName,
      phone: editContact || session.contact,
      province: editProvince || session.province,
      communityName: editCommunity || session.communityOfOrigin,
      genderPreference: editGenderPreference,
      ...profileDetails
    }) : await updateMyProfileDetails(profileDetails);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    const changedTerritoryAt = changesProvince || changesCommunity ? new Date().toISOString() : session.provinceCommunityChangedAt;
    onSessionChange({
      ...session,
      fullName: editFullName || session.fullName,
      province: editProvince || session.province,
      contact: editContact || session.contact,
      communityOfOrigin: editCommunity || session.communityOfOrigin,
      role: finalSessionRole,
      subroleKey: finalSessionRole === session.role ? session.subroleKey : null,
      genderPreference: editGenderPreference,
      nickname: editNickname.trim() || null,
      useNicknameInGreetings: editUseNicknameInGreetings,
      credentialNameMode: editCredentialNameMode,
      perseveranceStartYear: editPerseveranceStartYear ? Number(editPerseveranceStartYear) : null,
      personalPmType: canUsePersonalPm ? (editPmType || null) : null,
      personalPmNumber: canUsePersonalPm && editPmNumber ? Number(editPmNumber) : null,
      personalPmProvince: canUsePersonalPm ? (editPmProvince || null) : null,
      personalPmMotto: canUsePersonalPm ? (editPmMotto.trim() || null) : null,
      pmMotto: canUsePersonalPm ? (editPmMotto.trim() || null) : null,
      personalGreetingColor,
      provinceCommunityChangedAt: changedTerritoryAt
    });
    await loadRealProfile(authData.user.id, authData.user.email ?? session.email ?? session.fullName);
    setProfileEditUnlocked(false);
    setAuthMessage(mayDowngrade
      ? 'Tu provincia/comunidad fue actualizada. Tu rango fue ajustado a Sedimentador según las reglas del movimiento.'
      : changeDone('Perfil guardado.'));
  }

  async function uploadProfilePhoto() {
    if (!session) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAuthMessage(APP_MESSAGES.photoPermission);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setAuthMessage('Iniciá sesión real para subir una foto.');
      return;
    }

    try {
      setAuthMessage('Subiendo foto...');
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const bytes = await response.arrayBuffer();
      const extension = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      const path = `${authData.user.id}/profile-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(path, bytes, {
          contentType: asset.mimeType ?? 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        setAuthMessage(uploadError.message);
        return;
      }

      const { data: publicUrl } = supabase.storage.from('profile-photos').getPublicUrl(path);
      const avatarUrl = publicUrl.publicUrl;
      const { error } = await updateMyAvatar(avatarUrl);
      if (error) {
        setAuthMessage(error.message);
        return;
      }

      onSessionChange({ ...session, avatarUrl });
      setAuthMessage(changeDone('Foto de perfil actualizada.'));
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'No pude subir la foto.');
    }
  }

  async function loadPendingProfiles() {
    const items = await fetchPendingProfiles();
    setRealPendingProfiles(items);
  }

  async function loadAdminUsers() {
    if (!canManageUsersPanel(session)) {
      setAuthMessage('Tu rango no tiene acceso a la herramienta Usuarios.');
      return;
    }
    setAuthMessage('Cargando usuarios...');
    const items = await fetchAdminUsers();
    setAdminUsers(items);
    if (!selectedUsersProvince && items.length > 0) {
      setSelectedUsersProvince(defaultUsersProvinceFor(session, items));
    }
    setAuthMessage(items.length > 0 ? 'Usuarios cargados.' : 'No se encontraron usuarios visibles para tu rango.');
  }

  async function createBasicAdminUser() {
    if (session?.role !== 'administrador') {
      setAuthMessage(APP_MESSAGES.adminOnly('crear usuarios'));
      return;
    }
    if (!isValidEmail(adminCreateEmail)) {
      setAuthMessage('Ingresa un correo valido.');
      return;
    }
    if (adminCreatePassword.length < 6) {
      setAuthMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setAuthMessage('Creando usuario...');
    const { error } = await createAdminBasicUser(adminCreateEmail.trim(), adminCreatePassword);
    if (error) {
      setAuthMessage(safeAuthError(error.message));
      return;
    }
    setAdminCreateEmail('');
    setAdminCreatePassword('');
    await loadAdminUsers();
    setAuthMessage(changeDone('Usuario creado y habilitado. Debera completar provincia y comunidad al ingresar.'));
  }

  async function approvePendingProfile(id: string, role: Role) {
    const { error } = await approveProfile(id, role);
    setAuthMessage(error ? error.message : changeDone('Usuario aprobado.'));
    await loadPendingProfiles();
  }

  async function saveAdminUser() {
    if (!selectedAdminUser) {
      setAuthMessage('Elegir un usuario para editar.');
      return;
    }
    if (!canEditAdminUser(session, selectedAdminUser)) {
      setAuthMessage('No podes editar administradores, usuarios superiores o usuarios fuera de tu alcance.');
      return;
    }
    const preserveText = (draft: string, current?: string | null) => {
      const trimmed = draft.trim();
      return trimmed || current || '';
    };
    const preserveOptionalText = (draft: string, current?: string | null) => {
      const trimmed = draft.trim();
      return trimmed || current || null;
    };
    const previousRole = (selectedAdminUser.role || 'palestrista') as Role;
    const nextEmail = session?.role === 'administrador' ? preserveText(adminUserEmail, selectedAdminUser.email) : (selectedAdminUser.email ?? '');
    const nextFullName = preserveText(adminUserFullName, selectedAdminUser.full_name);
    const nextPhone = preserveText(adminUserPhone, selectedAdminUser.phone);
    const nextProvince = preserveText(adminUserProvince, selectedAdminUser.province);
    const nextCommunity = preserveText(adminUserCommunity, selectedAdminUser.community_name);
    const requestedRole = adminUserRole || previousRole;
    const changesProvince = Boolean(nextProvince && nextProvince !== selectedAdminUser.province);
    const changesCommunity = Boolean(nextCommunity && nextCommunity !== selectedAdminUser.community_name);
    let finalRole = roleAfterScopeChange(requestedRole, changesProvince, changesCommunity);
    if (previousRole === 'administrador' && requestedRole !== 'administrador' && session?.role !== 'administrador') {
      setAuthMessage('Solo otro Administrador puede quitar el rango Administrador.');
      return;
    }
    if (requestedRole === 'administrador') {
      if (session?.role !== 'administrador') {
        setAuthMessage('Solo Administrador puede otorgar Administrador.');
        return;
      }
      const firstMessage = `Vas a otorgar Administrador a ${nextFullName || selectedAdminUser.email}. Este rango puede modificar toda la app. Confirmas?`;
      const secondMessage = 'Confirmacion final: otorgar Administrador puede cambiar permisos, usuarios y contenido global. Escribe aceptar en la siguiente confirmacion visual.';
      const firstConfirmed = Platform.OS === 'web'
        ? (typeof window === 'undefined' ? true : window.confirm(firstMessage))
        : await new Promise<boolean>((resolve) => {
          Alert.alert('Otorgar Administrador', firstMessage, [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Confirmar', style: 'destructive', onPress: () => resolve(true) }
          ]);
        });
      if (!firstConfirmed) {
        return;
      }
      const secondConfirmed = Platform.OS === 'web'
        ? (typeof window === 'undefined' ? true : window.confirm(secondMessage))
        : await new Promise<boolean>((resolve) => {
          Alert.alert('Confirmacion obligatoria', secondMessage, [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Otorgar Administrador', style: 'destructive', onPress: () => resolve(true) }
          ]);
        });
      if (!secondConfirmed) {
        return;
      }
      finalRole = 'administrador';
    }
    if (!canAccessProvince(session, nextProvince)) {
      setAuthMessage('No podes editar usuarios de otra provincia.');
      return;
    }
    if (!canApproveRole(session, finalRole)) {
      setAuthMessage(`Tu rango no puede asignar el rol ${roleLabel(finalRole)}.`);
      return;
    }
    if (finalRole !== requestedRole) {
      const warning = `Al cambiar provincia/comunidad, ${roleLabel(requestedRole)} pierde rango y pasa a Sedimentador. Confirmas guardar?`;
      const confirmed = Platform.OS === 'web'
        ? (typeof window === 'undefined' ? true : window.confirm(warning))
        : await new Promise<boolean>((resolve) => {
          Alert.alert('Advertencia obligatoria', warning, [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Guardar y ajustar rango', style: 'destructive', onPress: () => resolve(true) }
          ]);
        });
      if (!confirmed) {
        return;
      }
    }
    const nextPerseveranceStartYear = adminUserPerseveranceStartYear
      ? Number(adminUserPerseveranceStartYear)
      : selectedAdminUser.perseverance_start_year ?? null;
    const nextPmType = (adminUserPmType || selectedAdminUser.personal_pm_type || null) as PersonalPmType | null;
    const nextPmNumberText = adminUserPmNumber.trim() || (selectedAdminUser.personal_pm_number ? String(selectedAdminUser.personal_pm_number) : '');
    const nextPmNumber = nextPmNumberText ? Number(nextPmNumberText) : null;
    const nextPmProvince = preserveOptionalText(adminUserPmProvince, selectedAdminUser.personal_pm_province);
    const nextPmMotto = preserveOptionalText(adminUserPmMotto, selectedAdminUser.personal_pm_motto ?? selectedAdminUser.pm_motto);
    const hasAdminPersonalPm = Boolean(nextPmType || nextPmNumberText || nextPmProvince || nextPmMotto);
    if (nextPmNumberText) {
      const parsedPmNumber = Number(nextPmNumberText);
      if (!Number.isInteger(parsedPmNumber) || parsedPmNumber <= 0) {
        setAuthMessage('El número de PM debe ser válido.');
        return;
      }
    }

    setAuthMessage('Guardando usuario...');
    const { error } = await updateAdminUser({
      id: selectedAdminUser.id,
      email: nextEmail,
      password: session?.role === 'administrador' ? adminUserPassword : '',
      fullName: nextFullName,
      phone: nextPhone,
      province: nextProvince,
      communityName: nextCommunity,
      status: adminUserStatus,
      role: finalRole,
      subroleKey: subrolesForRole(finalRole).some((item) => item.key === adminUserSubroleKey) ? adminUserSubroleKey : null,
      displayRoleLabel: preserveOptionalText(adminUserDisplayRoleLabel, selectedAdminUser.display_role_label),
      nickname: preserveOptionalText(adminUserNickname, selectedAdminUser.nickname),
      useNicknameInGreetings: selectedAdminUser.use_nickname_in_greetings == null ? null : adminUserUseNicknameInGreetings,
      credentialNameMode: selectedAdminUser.credential_name_mode == null && adminUserCredentialNameMode === 'name' ? null : adminUserCredentialNameMode,
      perseveranceStartYear: nextPerseveranceStartYear,
      personalPmType: hasAdminPersonalPm ? nextPmType : null,
      personalPmNumber: hasAdminPersonalPm ? nextPmNumber : null,
      personalPmProvince: hasAdminPersonalPm ? nextPmProvince : null,
      personalPmMotto: hasAdminPersonalPm ? nextPmMotto : null,
      pmMotto: hasAdminPersonalPm ? nextPmMotto : null
    });
    if (error) {
      setAuthMessage(error.message || 'No se pudo guardar el usuario. Revisa permisos y datos.');
      return;
    }
    await loadAdminUsers();
    setSelectedAdminUserId('');
    setAuthMessage(changeDone(finalRole !== requestedRole ? `Usuario actualizado. Rango ajustado a ${roleLabel(finalRole)}.` : 'Usuario actualizado.'));
  }

  async function confirmSelectedUserEmail() {
    if (session?.role !== 'administrador') {
      setAuthMessage(APP_MESSAGES.adminOnly('confirmar mails desde Auth'));
      return;
    }
    if (!selectedAdminUser) {
      setAuthMessage('Elegir un usuario para aprobar email.');
      return;
    }
    if (selectedAdminUser.email_confirmed_at) {
      setAuthMessage('Este usuario ya confirmo el mail. Si corresponde, aprobalo como usuario desde Estado/Rol.');
      return;
    }

    const { error } = await confirmAdminUserEmail(selectedAdminUser.id);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await loadAdminUsers();
    setAuthMessage(changeDone('Mail confirmado correctamente.'));
  }

  async function deleteSelectedAdminUser() {
    if (session?.role !== 'administrador') {
      setAuthMessage(APP_MESSAGES.adminOnly('eliminar usuarios y liberar mails'));
      return;
    }
    if (!selectedAdminUser) {
      setAuthMessage('Elegir un usuario para eliminar.');
      return;
    }
    if (!canEditAdminUser(session, selectedAdminUser)) {
      setAuthMessage('No podes eliminar administradores, usuarios superiores o usuarios fuera de tu alcance.');
      return;
    }

    const message = 'Esta acción eliminará el acceso del usuario y liberará su correo para reutilizarlo. Se guardará un backup interno antes de eliminar.';
    const confirmed = Platform.OS === 'web'
      ? (typeof window === 'undefined' ? true : window.confirm(message))
      : await new Promise<boolean>((resolve) => {
        Alert.alert('Eliminar usuario', message, [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) }
        ]);
      });
    if (!confirmed) {
      return;
    }

    setAuthMessage('Eliminando usuario...');
    const { error } = await softDeleteAdminUser(selectedAdminUser.id);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setSelectedAdminUserId('');
    await loadAdminUsers();
    setAuthMessage(changeDone('Usuario eliminado y correo liberado correctamente.'));
  }

  async function diagnoseUserLogin() {
    const email = adminDiagnosticEmail.trim();
    if (!isValidEmail(email)) {
      setAuthMessage('Ingresa un mail valido para diagnosticar.');
      return;
    }
    setAuthMessage('Diagnosticando usuario...');
    const { data, error } = await diagnoseAdminUserLogin(email);
    if (error) {
      setAuthMessage(error.message || 'No pude diagnosticar el usuario.');
      return;
    }
    setAdminLoginDiagnostic(data);
    setAuthMessage(data ? 'Diagnostico listo.' : 'No hubo respuesta de diagnostico.');
  }

  async function repairUserLogin() {
    const email = adminDiagnosticEmail.trim();
    if (!isValidEmail(email)) {
      setAuthMessage('Ingresa un mail valido para reparar.');
      return;
    }
    setAuthMessage('Reparando usuario...');
    const { error } = await repairAdminUserLogin(email);
    if (error) {
      setAuthMessage(error.message || 'No pude reparar el usuario.');
      return;
    }
    await diagnoseUserLogin();
    await loadAdminUsers();
    setAuthMessage(changeDone('Usuario reparado. Probalo iniciando sesión nuevamente.'));
  }

  async function deleteUserByDiagnosticEmail() {
    const email = adminDiagnosticEmail.trim();
    if (!isValidEmail(email)) {
      setAuthMessage('Ingresa un mail valido para liberar.');
      return;
    }
    const message = `Esta acción eliminará Auth/Profile/datos vinculados de ${email} y liberará el correo. Se guardará backup interno antes de eliminar.`;
    const confirmed = Platform.OS === 'web'
      ? (typeof window === 'undefined' ? true : window.confirm(message))
      : await new Promise<boolean>((resolve) => {
        Alert.alert('Liberar correo', message, [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Eliminar y liberar', style: 'destructive', onPress: () => resolve(true) }
        ]);
      });
    if (!confirmed) {
      return;
    }

    setAuthMessage('Liberando correo...');
    const { error } = await deleteAdminUserByEmail(email, 'Liberacion manual de correo desde panel administrador');
    if (error) {
      setAuthMessage(error.message || 'No pude liberar el correo.');
      return;
    }
    setSelectedAdminUserId('');
    setAdminLoginDiagnostic(null);
    await loadAdminUsers();
    setAuthMessage(changeDone('Usuario eliminado y correo liberado correctamente.'));
  }

  async function loadRolePermissionDraft(role: Role = permissionRole) {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo Administrador puede gestionar permisos de rangos.');
      return;
    }
    setAuthMessage('Cargando permisos del rango...');
    const rows = await fetchRolePermissions(role);
    setRolePermissionRows(rows);
    if (rows.length > 0) {
      setRolePermissionDraft(rows.filter((item) => item.enabled).map((item) => item.permission_key as Permission));
    } else {
      setRolePermissionDraft(rolePermissions[role] ?? []);
    }
    setAuthMessage(rows.length > 0 ? 'Permisos cargados.' : 'No hay permisos remotos cargados; se muestra base local.');
  }

  function toggleRolePermission(permission: Permission) {
    setRolePermissionDraft((current) => (
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission]
    ));
  }

  async function saveRolePermissionDraft() {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo Administrador puede guardar permisos de rangos.');
      return;
    }
    const { error } = await saveRolePermissions(permissionRole, rolePermissionDraft);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await loadRolePermissionDraft(permissionRole);
    if (session?.role === permissionRole) {
      onSessionChange({ ...session, permissions: rolePermissionDraft });
    }
    setAuthMessage(changeDone('Permisos del rango actualizados.'));
  }

  async function loadProvinceRoleLabels() {
    setAuthMessage('Cargando etiquetas de rangos...');
    const rows = await fetchProvinceRoleLabels();
    setProvinceRoleLabels(rows);
    setAuthMessage(rows.length > 0 ? 'Etiquetas cargadas.' : 'No hay etiquetas personalizadas cargadas.');
  }

  async function saveProvinceRoleLabelDraft() {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo Administrador puede editar nombres visibles de rangos.');
      return;
    }
    if (!roleLabelProvince) {
      setAuthMessage('Elegir provincia.');
      return;
    }
    if (!roleLabelDraft.trim()) {
      setAuthMessage('Escribir el nombre visible del rango.');
      return;
    }

    const { error } = await saveProvinceRoleLabel({
      province: roleLabelProvince,
      roleKey: roleLabelRole,
      displayLabel: roleLabelDraft.trim(),
      description: roleLabelDescription.trim(),
      isActive: roleLabelActive
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await loadProvinceRoleLabels();
    setAuthMessage(changeDone('Etiqueta de rango actualizada.'));
  }

  async function loadRoleAliases(showMessage = true) {
    if (showMessage) {
      setAuthMessage('Cargando alias de rangos...');
    }
    const rows = await fetchAssignableRoleAliases();
    setRoleAliases(rows);
    if (showMessage) {
      setAuthMessage(rows.length > 0 ? 'Alias cargados.' : 'No hay alias asignables cargados.');
    }
  }

  async function queueNotificationIfRequested(enabled: boolean, values: {
    notificationType: string;
    title: string;
    body: string;
    targetKind: string;
    targetValue?: string | null;
    targetScope?: string | null;
    province?: string | null;
    community?: string | null;
    minRole?: string | null;
    tabKey?: string | null;
    sourceType?: string | null;
    sourceId?: string | null;
  }) {
    if (!enabled) {
      return null;
    }
    const canNotify = hasPermission(session, 'enviar_notificaciones') || (values.targetKind === 'comunidad' && Boolean(session && ['animador_comunidad', 'coordinador_comunidad'].includes(session.role)));
    if (!canNotify) {
      return 'El aviso se publico, pero tu rango no tiene permiso para notificar usuarios.';
    }
    const { data, error } = await createNotificationIntent({
      ...values,
      title: notificationTitleFor(values),
      body: values.body.slice(0, 220),
      targetScope: values.targetScope ?? values.targetKind,
      minRole: values.minRole ?? 'palestrista'
    });
    if (error) {
      return `El aviso se publico, pero no pude preparar la notificacion: ${error.message}`;
    }
    const intentId = typeof data === 'string' ? data : Array.isArray(data) ? data[0] : null;
    if (intentId) {
      const delivery = await deliverNotificationIntent(intentId);
      if (delivery.error) {
        return `El aviso se publico, pero no pude enviar la notificacion: ${delivery.error.message}`;
      }
    }
    return null;
  }

  async function adminCreateNews() {
    if (!canManageNewsContent(session)) {
      setAuthMessage('Tu rango no puede publicar noticias.');
      return;
    }
    if (!adminNewsTitle.trim() || !adminNewsBody.trim()) {
      setAuthMessage('Completa titulo y texto antes de publicar la noticia.');
      return;
    }
    const forcedProvincial = session && ['vocal', 'coordinador_diocesano'].includes(session.role);
    const finalScope = forcedProvincial ? 'provincial' : adminNewsScope;
    const finalProvince = finalScope === 'provincial' ? (forcedProvincial ? session?.province : adminNewsProvince) : null;
    if (finalScope === 'provincial' && !finalProvince) {
      setAuthMessage('Elegí provincia para publicar la noticia provincial.');
      return;
    }

    setAuthMessage('Publicando noticia...');
    const { data: newsId, error } = await createNews(adminNewsTitle.trim(), adminNewsBody.trim(), true, finalProvince, adminNewsImage.trim() || null);
    const newsTargetKind = finalScope === 'provincial' ? 'provincia' : 'nacional';
    const notificationWarning = !error ? await queueNotificationIfRequested(adminNewsNotify, {
      notificationType: 'aviso_dirigencial',
      title: adminNewsTitle.trim(),
      body: adminNewsBody.trim(),
      targetKind: newsTargetKind,
      targetValue: newsTargetKind === 'provincia' ? finalProvince ?? null : null,
      targetScope: newsTargetKind,
      province: newsTargetKind === 'provincia' ? finalProvince ?? null : null,
      minRole: 'palestrista',
      tabKey: 'notilestra',
      sourceType: 'news',
      sourceId: typeof newsId === 'string' ? newsId : null
    }) : null;
    setAuthMessage(error ? error.message : notificationWarning ?? changeDone(adminNewsNotify ? 'Noticia creada y notificacion preparada.' : 'Noticia creada.'));
    if (!error) {
      setAdminNewsTitle('');
      setAdminNewsBody('');
      setAdminNewsImage('');
      setAdminNewsDraft(false);
      setAdminNewsFeatured(false);
      setAdminNewsNotify(false);
      setAdminNewsScope(forcedProvincial ? 'provincial' : 'nacional');
      await onContentChanged();
    }
  }

  async function loadNewsDrafts() {
    const items = await fetchNewsDrafts();
    setNewsDrafts(items);
    setAuthMessage(items.length > 0 ? 'Borradores cargados.' : 'No hay borradores guardados.');
  }

  async function uploadAdminNewsImage() {
    if (!canManageNewsContent(session)) {
      setAuthMessage('Tu rango no puede cargar imagenes de noticias.');
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAuthMessage(APP_MESSAGES.imageSelectionPermissionWithArticle);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.82
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    try {
      setAuthMessage('Subiendo imagen...');
      const publicUrl = await uploadPickedImageToPublicUrl(result.assets[0], 'news');
      setAdminNewsImage(publicUrl);
      setAuthMessage('Imagen cargada. La noticia se publica recien al tocar Publicar noticia.');
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'No se pudo subir la imagen.');
    }
  }

  async function adminSaveNewsDraft(status = 'borrador') {
    if (!adminNewsTitle.trim() || !adminNewsBody.trim()) {
      setAuthMessage('Completa titulo y texto antes de guardar el borrador.');
      return;
    }

    setAuthMessage('Guardando borrador...');
    const { error } = await saveNewsDraft({
      title: adminNewsTitle.trim(),
      body: adminNewsBody.trim(),
      category: adminNewsCategory,
      imageUrl: adminNewsImage.trim() || null,
      isFeatured: adminNewsFeatured,
      status
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAdminNewsTitle('');
    setAdminNewsBody('');
    setAdminNewsImage('');
    setAdminNewsDraft(false);
    setAdminNewsFeatured(false);
    await loadNewsDrafts();
    setAuthMessage(changeDone(status === 'borrador' ? 'Borrador guardado.' : 'Borrador actualizado.'));
  }

  async function loadAdminMaterials() {
    const [items, documents] = await Promise.all([fetchAppMaterials(session?.role === 'administrador'), fetchChurchDocumentButtons(true)]);
    setAdminMaterials(items);
    setAdminChurchDocuments(documents);
    setAuthMessage(items.length > 0 || documents.length > 0 ? 'Descargas cargadas.' : 'No hay descargas guardadas.');
  }

  async function adminSaveMaterial() {
    if (!canManagePublishedContent(session)) {
      setAuthMessage('Solo Vocal Diocesano en adelante puede guardar materiales.');
      return;
    }
    if (!materialTitle.trim() || !materialDescription.trim()) {
      setAuthMessage('Completa nombre y descripcion del material.');
      return;
    }

    setAuthMessage('Guardando material...');
    const { error } = await saveAppMaterial({
      title: materialTitle.trim(),
      description: materialDescription.trim(),
      category: materialCategory.trim() || 'General',
      visibility: materialVisibility,
      requiredPermission: materialPermission.trim() || null,
      fileUrl: materialFileUrl.trim() || null,
      filePath: null,
      sortOrder: 100
    });
    if (error) {
      setAuthMessage(friendlyUploadError(error.message));
      return;
    }
    setMaterialTitle('');
    setMaterialDescription('');
    setMaterialFileUrl('');
    setMaterialPermission('');
    await loadAdminMaterials();
    setAuthMessage(changeDone('Material guardado y visible segun permisos.'));
  }

  async function adminArchiveMaterial(id: string) {
    const { error } = await archiveAppMaterial(id);
    if (error) {
      setAuthMessage(friendlyUploadError(error.message));
      return;
    }
    await loadAdminMaterials();
    setAuthMessage(changeDone('Material archivado.'));
  }

  function resetChurchDocumentForm() {
    setChurchDocumentEditingId(null);
    setChurchDocumentTitle('');
    setChurchDocumentLogoUrl('');
    setChurchDocumentTargetUrl('');
    setChurchDocumentEnabled(true);
    setChurchDocumentSortOrder(String(Math.min(adminChurchDocuments.length + 1, 6)));
  }

  function editChurchDocument(document: ChurchDocumentButtonRecord) {
    setChurchDocumentEditingId(document.id);
    setChurchDocumentTitle(document.title);
    setChurchDocumentLogoUrl(document.logo_url ?? '');
    setChurchDocumentTargetUrl(document.target_url);
    setChurchDocumentEnabled(document.enabled);
    setChurchDocumentSortOrder(String(document.sort_order ?? 1));
  }

  async function uploadChurchDocumentLogo() {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo Administrador puede subir logos de documentos.');
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAuthMessage(APP_MESSAGES.imageSelectionPermission);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.82,
      allowsEditing: true,
      aspect: [1, 1]
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    try {
      setAuthMessage('Subiendo logo...');
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const bytes = await response.arrayBuffer();
      const extension = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      const path = `church-documents/${Date.now()}.${extension.replace(/[^a-zA-Z0-9]/g, '') || 'jpg'}`;
      const { error } = await supabase.storage
        .from('materials')
        .upload(path, bytes, { contentType: asset.mimeType ?? 'image/jpeg', upsert: true });
      if (error) {
        setAuthMessage(error.message);
        return;
      }
      const { data } = supabase.storage.from('materials').getPublicUrl(path);
      setChurchDocumentLogoUrl(data.publicUrl);
      setAuthMessage('Logo cargado.');
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'No se pudo subir el logo.');
    }
  }

  async function saveChurchDocumentDraft() {
    if (session?.role !== 'administrador') {
      setAuthMessage(APP_MESSAGES.adminOnly('gestionar documentos de la Iglesia'));
      return;
    }
    if (!churchDocumentTitle.trim() || !churchDocumentTargetUrl.trim()) {
      setAuthMessage('Completa titulo y link destino.');
      return;
    }
    if (!/^https?:\/\//i.test(churchDocumentTargetUrl.trim())) {
      setAuthMessage('El link debe empezar con https://');
      return;
    }
    const maxReached = !churchDocumentEditingId && adminChurchDocuments.filter((item) => !item.archived_at).length >= 6;
    if (maxReached) {
      setAuthMessage('Solo se permiten hasta 6 botones.');
      return;
    }
    const { error } = await saveChurchDocumentButton({
      id: churchDocumentEditingId,
      title: churchDocumentTitle.trim(),
      logoUrl: churchDocumentLogoUrl.trim() || null,
      targetUrl: churchDocumentTargetUrl.trim(),
      enabled: churchDocumentEnabled,
      sortOrder: Number(churchDocumentSortOrder) || 1
    });
    if (error) {
      setAuthMessage(friendlyUploadError(error.message));
      return;
    }
    resetChurchDocumentForm();
    await loadAdminMaterials();
    setAuthMessage(changeDone('Documento de la Iglesia guardado.'));
  }

  async function duplicateChurchDocument(document: ChurchDocumentButtonRecord) {
    setChurchDocumentEditingId(null);
    setChurchDocumentTitle(`${document.title} copia`);
    setChurchDocumentLogoUrl(document.logo_url ?? '');
    setChurchDocumentTargetUrl(document.target_url);
    setChurchDocumentEnabled(document.enabled);
    setChurchDocumentSortOrder(String(Math.min(adminChurchDocuments.length + 1, 6)));
  }

  async function toggleChurchDocument(document: ChurchDocumentButtonRecord) {
    const { error } = await saveChurchDocumentButton({
      id: document.id,
      title: document.title,
      logoUrl: document.logo_url,
      targetUrl: document.target_url,
      enabled: !document.enabled,
      sortOrder: document.sort_order
    });
    if (error) {
      setAuthMessage(friendlyUploadError(error.message));
      return;
    }
    await loadAdminMaterials();
    setAuthMessage(changeDone('Estado actualizado.'));
  }

  async function moveChurchDocument(document: ChurchDocumentButtonRecord, direction: -1 | 1) {
    const nextOrder = Math.max(1, Math.min(6, (document.sort_order ?? 1) + direction));
    const { error } = await saveChurchDocumentButton({
      id: document.id,
      title: document.title,
      logoUrl: document.logo_url,
      targetUrl: document.target_url,
      enabled: document.enabled,
      sortOrder: nextOrder
    });
    if (error) {
      setAuthMessage(friendlyUploadError(error.message));
      return;
    }
    await loadAdminMaterials();
  }

  async function deleteChurchDocument(id: string) {
    const { error } = await archiveChurchDocumentButton(id);
    if (error) {
      setAuthMessage(friendlyUploadError(error.message));
      return;
    }
    await loadAdminMaterials();
    setAuthMessage(changeDone('Documento eliminado.'));
  }

  async function adminCreateEvent() {
    if (!adminEventTitle.trim() || !adminEventBody.trim() || !adminEventDate.trim()) {
      setAuthMessage('Completa titulo, descripcion y fecha antes de publicar el evento.');
      return;
    }
    if (Number.isNaN(Date.parse(adminEventDate))) {
      setAuthMessage('La fecha debe tener formato valido. Ejemplo: 2026-05-28T21:00:00-03:00');
      return;
    }

    setAuthMessage('Publicando evento...');
    const { data: eventId, error } = await createEvent(adminEventTitle.trim(), adminEventBody.trim(), adminEventDate.trim(), true);
    const eventTargetKind = session && ['vocal', 'asesor', 'coordinador_diocesano'].includes(session.role) ? 'provincia' : 'nacional';
    const notificationWarning = !error ? await queueNotificationIfRequested(adminEventNotify, {
      notificationType: 'recordatorio_evento',
      title: adminEventTitle.trim(),
      body: adminEventBody.trim(),
      targetKind: eventTargetKind,
      targetValue: eventTargetKind === 'provincia' ? session?.province ?? null : null,
      targetScope: eventTargetKind,
      province: eventTargetKind === 'provincia' ? session?.province ?? null : null,
      minRole: 'palestrista',
      tabKey: 'notilestra',
      sourceType: 'event',
      sourceId: typeof eventId === 'string' ? eventId : null
    }) : null;
    setAuthMessage(error ? error.message : notificationWarning ?? changeDone(adminEventNotify ? 'Evento creado y notificacion preparada.' : 'Evento creado.'));
    if (!error) {
      setAdminEventTitle('');
      setAdminEventBody('');
      setAdminEventDate('');
      setAdminEventNotify(false);
      await onContentChanged();
    }
  }

  async function adminSaveTab(key: string, fallbackLabel: string) {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo el administrador puede modificar los accesos.');
      return;
    }
    const tab = editableTabs.find((item) => item.key === key);
    const draft = editingTabs[key] ?? { label: fallbackLabel, iconName: tab?.icon ?? 'document-text-outline', sectionType: tab?.sectionType ?? 'simple', isVisible: true, visibleRoles: tab?.visibleRoles ?? null };
    if (!draft.label.trim()) {
      setAuthMessage('El nombre visible no puede quedar vacio.');
      return;
    }
    if (!isIoniconName(draft.iconName)) {
      setAuthMessage(`El icono "${draft.iconName}" no existe en Ionicons.`);
      return;
    }
    const { error } = await updateAppTab(key, draft.label.trim() || fallbackLabel, draft.isVisible, draft.visibleRoles, draft.iconName, draft.sectionType);
    setAuthMessage(error ? error.message : changeDone('Pestana actualizada.'));
    await onTabsChanged();
  }

  async function adminCreatePage() {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo el administrador puede crear paginas nuevas.');
      return;
    }
    if (!newTabLabel.trim()) {
      setAuthMessage('Escribir un nombre para la nueva pagina.');
      return;
    }
    const key = normalizeTabKey(newTabKey || newTabLabel);
    if (!key) {
      setAuthMessage('La clave interna no puede quedar vacia.');
      return;
    }
    if (editableTabs.some((item) => item.key === key)) {
      setAuthMessage('Ya existe una sección con esa clave interna.');
      return;
    }
    if (!isIoniconName(newTabIcon)) {
      setAuthMessage(`El icono "${newTabIcon}" no existe en Ionicons.`);
      return;
    }
    const { error } = await createAppTab(key, newTabLabel.trim(), newTabRoles, newTabIcon, newTabSectionType);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await updateAppContent(key, newTabLabel.trim(), 'Contenido inicial de la pagina.', buildInitialBlocksForSection(newTabSectionType, newTabLabel.trim()));
    setNewTabLabel('');
    setNewTabKey('');
    setNewTabIcon('document-text-outline');
    setNewTabSectionType('simple');
    await onTabsChanged();
    await onContentChanged();
    setAuthMessage(changeDone('Pagina creada con visibilidad por rol.'));
  }

  async function adminMoveTab(key: string, direction: -1 | 1) {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo el administrador puede ordenar los accesos.');
      return;
    }
    const sorted = editableTabs.map((tab, index) => ({ ...tab, sortOrder: Number.isFinite(tab.sortOrder) ? tab.sortOrder : index * 10 })).sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex((item) => item.key === key);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) {
      return;
    }
    const nextOrder = [...sorted];
    const [moved] = nextOrder.splice(index, 1);
    nextOrder.splice(targetIndex, 0, moved);

    setAuthMessage('Actualizando orden de accesos...');
    for (const [orderIndex, tab] of nextOrder.entries()) {
      const draft = editingTabs[tab.key] ?? { label: tab.label, iconName: tab.icon, sectionType: tab.sectionType, isVisible: tab.visible, visibleRoles: tab.visibleRoles };
      const { error } = await updateAppTabPosition({
        key: tab.key,
        label: draft.label || tab.label,
        isVisible: draft.isVisible,
        sortOrder: (orderIndex + 1) * 10,
        visibleRoles: draft.visibleRoles,
        iconName: draft.iconName || tab.icon,
        sectionType: draft.sectionType
      });
      if (error) {
        setAuthMessage(error.message);
        return;
      }
    }
    await onTabsChanged();
    setAuthMessage(changeDone('Orden de accesos actualizado.'));
  }

  function updateTabRole(key: string, role: Role, checked: boolean) {
    const tab = editableTabs.find((item) => item.key === key);
    const currentDraft = editingTabs[key] ?? { label: tab?.label ?? key, iconName: tab?.icon ?? 'document-text-outline', sectionType: tab?.sectionType ?? 'simple', isVisible: tab?.visible ?? true, visibleRoles: tab?.visibleRoles ?? null };
    const currentRoles = currentDraft.visibleRoles ?? roleDefinitions.map((item) => item.role);
    const nextRoles = checked ? Array.from(new Set([...currentRoles, role])) : currentRoles.filter((item) => item !== role);
    setEditingTabs((current) => ({ ...current, [key]: { ...currentDraft, visibleRoles: nextRoles } }));
  }

  function toggleNewTabRole(role: Role) {
    setNewTabRoles((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role]);
  }

  async function adminDeleteTab(key: string) {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo el administrador puede eliminar secciones.');
      return;
    }
    if (protectedTabKeys.has(key) || defaultTabByKey.has(key)) {
      setAuthMessage('Esta sección es crítica o propia de la app. Podés ocultarla, pero no eliminarla.');
      return;
    }
    const confirmed = Platform.OS === 'web'
      ? (typeof window === 'undefined' ? true : window.confirm('¿Seguro que deseas eliminar esta sección? También se puede perder contenido asociado.'))
      : await new Promise<boolean>((resolve) => {
        Alert.alert('Eliminar sección', '¿Seguro que deseas eliminar esta sección? También se puede perder contenido asociado.', [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) }
        ]);
      });
    if (!confirmed) {
      return;
    }
    const { error } = await deleteAppTab(key);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await onTabsChanged();
    await onContentChanged();
    setAuthMessage(changeDone('Sección eliminada.'));
  }

  async function adminRestoreDefaultNavigation() {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo el administrador puede restaurar navegación.');
      return;
    }
    const confirmed = Platform.OS === 'web'
      ? (typeof window === 'undefined' ? true : window.confirm('¿Restaurar la navegación predeterminada? Se reemplazarán nombres, iconos, orden y visibilidad base.'))
      : await new Promise<boolean>((resolve) => {
        Alert.alert('Restaurar navegación', '¿Restaurar la navegación predeterminada? Se reemplazarán nombres, iconos, orden y visibilidad base.', [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Restaurar', style: 'destructive', onPress: () => resolve(true) }
        ]);
      });
    if (!confirmed) {
      return;
    }
    const { error } = await restoreDefaultAppTabs();
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setEditingTabs({});
    await onTabsChanged();
    setAuthMessage(changeDone('Navegación predeterminada restaurada.'));
  }

  async function adminSaveContent() {
    if (!contentTitle.trim() || !contentBody.trim()) {
      setAuthMessage('Completa titulo y texto antes de guardar el contenido.');
      return;
    }

    setAuthMessage('Guardando contenido...');
    const normalizedBlocks = contentBlocks
      .map((block) => ({ ...block, value: block.value.trim() }))
      .filter((block) => block.value.length > 0);
    const { error } = await updateAppContent(selectedContentTab, contentTitle.trim(), contentBody.trim(), normalizedBlocks);
    setAuthMessage(error ? error.message : changeDone('Contenido actualizado.'));
    if (!error) {
      await onContentChanged();
    }
  }

  async function pickAdminCommunityImage() {
    const isCreatingCommunity = showAdminCommunityCreate && !selectedAdminCommunity?.id;
    if (!isCreatingCommunity && !selectedAdminCommunity?.id) {
      setAuthMessage('Elegir una comunidad antes de cargar imagen.');
      return;
    }
    if (isCreatingCommunity && !canAdministrateCommunities) {
      setAuthMessage('Tu rango no puede cargar imagen al crear comunidades.');
      return;
    }
    if (!isCreatingCommunity && selectedAdminCommunity && !canEditCommunity(session, adminCommunityProvince, selectedAdminCommunity.name)) {
      setAuthMessage('Tu rango no puede cambiar la imagen de esta comunidad.');
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAuthMessage(APP_MESSAGES.chooseImagePermission);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [2, 1],
      quality: 0.85
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    setAdminCommunityImageAsset(result.assets[0]);
    setAdminCommunityImagePreview(result.assets[0].uri);
    setAuthMessage('Imagen seleccionada. Revisá la vista previa y guardá la comunidad.');
  }

  async function pickProvinceLogo(provinceName: string) {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo Administrador puede cambiar logos de provincias.');
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAuthMessage(APP_MESSAGES.chooseImagePermission);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    setProvinceLogoUploading(provinceName);
    try {
      const folder = `province-logos/${provinceName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
      const publicUrl = await uploadPickedImageToPublicUrl(result.assets[0], folder);
      setProvinceLogoDrafts((current) => ({ ...current, [provinceName]: publicUrl }));
      if (existingProvinceNames.has(provinceName)) {
        const { error } = await updateProvinceLogo({ name: provinceName, logoUrl: publicUrl });
        if (error) {
          setAuthMessage(error.message);
          return;
        }
        setRegistrationCommunities(await fetchCommunities(adminCommunitiesFetchOptions));
        await onContentChanged();
        setAuthMessage(changeDone('Logo de provincia actualizado.'));
        return;
      }
      setAuthMessage('Logo seleccionado. Creá la provincia para guardarlo.');
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'No pude subir el logo de la provincia.');
    } finally {
      setProvinceLogoUploading('');
    }
  }

  async function uploadAdminCommunityImage(communityId = selectedAdminCommunity?.id, fallbackUrl = adminCommunityImageUrl) {
    if (!adminCommunityImageAsset || !communityId) {
      return fallbackUrl;
    }
    setAdminCommunityImageUploading(true);
    try {
      const response = await fetch(adminCommunityImageAsset.uri);
      const bytes = await response.arrayBuffer();
      const extension = adminCommunityImageAsset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      const safeExtension = extension.length <= 5 ? extension : 'jpg';
      const path = `${communityId}/community-${Date.now()}.${safeExtension}`;
      const { error: uploadError } = await supabase.storage
        .from('community-images')
        .upload(path, bytes, {
          contentType: adminCommunityImageAsset.mimeType ?? 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrl } = supabase.storage.from('community-images').getPublicUrl(path);
      return publicUrl.publicUrl;
    } finally {
      setAdminCommunityImageUploading(false);
    }
  }

  async function adminSaveCommunity() {
    if (!selectedAdminCommunity?.id) {
      setAuthMessage('Elegir una comunidad cargada desde Supabase para editar.');
      return;
    }
    if (!canEditCommunity(session, adminCommunityProvince, selectedAdminCommunity.name)) {
      setAuthMessage('Tu rango solo puede editar comunidades de tu provincia o de tu alcance.');
      return;
    }

    setAuthMessage('Guardando comunidad...');
    let imageUrl = adminCommunityImageUrl;
    const latitude = adminCommunityLatitude.trim() ? Number(adminCommunityLatitude.replace(',', '.')) : null;
    const longitude = adminCommunityLongitude.trim() ? Number(adminCommunityLongitude.replace(',', '.')) : null;
    if ((latitude != null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) || (longitude != null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))) {
      setAuthMessage('Coordenadas invalidas. Latitud debe estar entre -90 y 90, longitud entre -180 y 180.');
      return;
    }
    try {
      imageUrl = await uploadAdminCommunityImage();
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'No se pudo subir la imagen de comunidad.');
      return;
    }
    const { error } = await updateCommunity(selectedAdminCommunity.id, {
      name: adminCommunityName,
      address: adminCommunityAddress,
      phone: adminCommunityPhone,
      meeting_day: adminCommunityDay,
      meeting_time: adminCommunityTime,
      description: adminCommunityDescription,
      image_url: imageUrl,
      latitude,
      longitude,
      group_type: adminCommunityGroupType
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }

    const items = await fetchCommunities(adminCommunitiesFetchOptions);
    setRegistrationCommunities(items);
    setAdminCommunityId('');
    setAdminCommunityImageAsset(null);
    setAdminCommunityImageUrl(imageUrl);
    setAdminCommunityImagePreview(imageUrl);
    setAuthMessage(changeDone('Cambios guardados.'));
    if (session?.communityOfOrigin === selectedAdminCommunity.name) {
      onSessionChange({ ...session, communityOfOrigin: adminCommunityName || selectedAdminCommunity.name });
    }
    await onContentChanged();
  }

  async function adminCreateCommunity() {
    if (!canAdministrateCommunities) {
      setAuthMessage('Tu rango no puede crear comunidades.');
      return;
    }
    if (!adminCommunityProvince || !adminCommunityName.trim()) {
      setAuthMessage('Nombre y provincia son obligatorios.');
      return;
    }
    if (!canManageProvince(session, adminCommunityProvince) && !canSeeAllProvinces(session)) {
      setAuthMessage('Tu rango solo puede crear comunidades dentro de su jurisdiccion.');
      return;
    }

    setAuthMessage('Creando comunidad...');
    const latitude = adminCommunityLatitude.trim() ? Number(adminCommunityLatitude.replace(',', '.')) : null;
    const longitude = adminCommunityLongitude.trim() ? Number(adminCommunityLongitude.replace(',', '.')) : null;
    if ((latitude != null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) || (longitude != null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))) {
      setAuthMessage('Coordenadas invalidas. Latitud debe estar entre -90 y 90, longitud entre -180 y 180.');
      return;
    }
    const { data: createdCommunityId, error } = await createCommunity({
      province: adminCommunityProvince,
      name: adminCommunityName.trim(),
      groupType: adminCommunityGroupType,
      address: adminCommunityAddress.trim(),
      phone: adminCommunityPhone.trim(),
      meetingDay: adminCommunityDay.trim(),
      meetingTime: adminCommunityTime.trim(),
      description: adminCommunityDescription.trim(),
      latitude,
      longitude,
      isActive: adminCommunityIsActive
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    if (adminCommunityImageAsset && createdCommunityId) {
      try {
        const imageUrl = await uploadAdminCommunityImage(String(createdCommunityId), '');
        const { error: imageError } = await updateCommunity(String(createdCommunityId), { image_url: imageUrl });
        if (imageError) {
          setAuthMessage(imageError.message);
          return;
        }
      } catch (uploadError) {
        setAuthMessage(uploadError instanceof Error ? uploadError.message : 'Comunidad creada, pero no se pudo subir la imagen.');
        return;
      }
    }
    const items = await fetchCommunities(adminCommunitiesFetchOptions);
    setRegistrationCommunities(items);
    setAdminCommunityName('');
    setAdminCommunityAddress('');
    setAdminCommunityPhone('');
    setAdminCommunityDay('');
    setAdminCommunityTime('');
    setAdminCommunityDescription('');
    setAdminCommunityLatitude('');
    setAdminCommunityLongitude('');
    setAdminCommunityImageAsset(null);
    setAdminCommunityImageUrl('');
    setAdminCommunityImagePreview('');
    setShowAdminCommunityCreate(false);
    setAuthMessage(changeDone('Comunidad creada.'));
    await onContentChanged();
  }

  async function adminSetCommunitySectionEnabled(groupType: CommunityGroupType, isEnabled: boolean) {
    if (session?.role !== 'administrador') {
      setAuthMessage('Solo Administrador puede configurar subsecciones de comunidades.');
      return;
    }
    if (!selectedAdminProvince) {
      setAuthMessage('Elegir una provincia para configurar sus subsecciones.');
      return;
    }
    setAuthMessage('Guardando subseccion...');
    const { error } = await setProvinceCommunitySectionVisibility({
      province: selectedAdminProvince.province,
      groupType,
      isEnabled
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    const items = await fetchCommunities(adminCommunitiesFetchOptions);
    setRegistrationCommunities(items);
    setAuthMessage(changeDone('Cambios guardados.'));
    await onContentChanged();
  }

  async function adminCreateProvince() {
    if (session?.role !== 'administrador') {
      setAuthMessage(APP_MESSAGES.adminOnly('crear provincias'));
      return;
    }
    const definition = provinceDefinitionFor(newProvinceName) ?? selectedNewProvinceDefinition;
    if (!definition) {
      setAuthMessage('Seleccioná una provincia disponible.');
      return;
    }
    setAuthMessage('Creando provincia...');
    const { error } = await createProvince({
      name: definition.name,
      region: definition.region,
      logoUrl: provinceLogoDrafts[definition.name] ?? null
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    const items = await fetchCommunities(adminCommunitiesFetchOptions);
    setRegistrationCommunities(items);
    setAdminCommunityProvince(definition.name);
    setAdminCommunityId('');
    setNewProvinceName('');
    setAuthMessage(changeDone('Provincia creada. Ya podés seleccionarla y cargar comunidades.'));
    await onContentChanged();
  }

  async function adminSetProvinceActive(name: string, isActive: boolean) {
    const { error } = await setProvinceStatus(name, isActive);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setRegistrationCommunities(await fetchCommunities(adminCommunitiesFetchOptions));
    setAuthMessage(changeDone(isActive ? 'Provincia habilitada.' : 'Provincia deshabilitada.'));
    await onContentChanged();
  }

  async function adminArchiveProvince(name: string) {
    const message = `¿Seguro que querés eliminar ${name}? Las comunidades y usuarios vinculados pueden dejar de aparecer como seleccionables.`;
    const confirmed = Platform.OS === 'web' ? (typeof window === 'undefined' ? true : window.confirm(message)) : await new Promise<boolean>((resolve) => {
      Alert.alert('Eliminar provincia', message, [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) }
      ]);
    });
    if (!confirmed) {
      return;
    }
    const { error } = await archiveProvince(name);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setRegistrationCommunities(await fetchCommunities(adminCommunitiesFetchOptions));
    setAuthMessage(changeDone('Provincia eliminada.'));
    await onContentChanged();
  }

  async function adminToggleCommunityStatus(id: string, isActive: boolean) {
    const { error } = await setCommunityStatus(id, isActive);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setRegistrationCommunities(await fetchCommunities(adminCommunitiesFetchOptions));
    setAuthMessage(changeDone(isActive ? 'Comunidad habilitada.' : 'Comunidad deshabilitada.'));
  }

  async function adminArchiveCommunity(id: string) {
    const message = '¿Seguro que deseas eliminar esta comunidad? Esta acción puede afectar usuarios, avisos y publicaciones vinculadas.';
    const confirmed = Platform.OS === 'web' ? (typeof window === 'undefined' ? true : window.confirm(message)) : await new Promise<boolean>((resolve) => {
      Alert.alert('Eliminar comunidad', message, [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) }
      ]);
    });
    if (!confirmed) {
      return;
    }
    const { error } = await archiveCommunity(id);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setRegistrationCommunities(await fetchCommunities(adminCommunitiesFetchOptions));
    setAdminCommunityId('');
    setAuthMessage(changeDone('Comunidad eliminada.'));
  }

  function addContentBlock(type: ContentEditorBlock['type']) {
    const defaultValue =
      type === 'imagen'
        ? 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png'
        : type === 'enlace'
          ? 'Etiqueta|https://palestra.org.ar'
          : type === 'campo'
            ? 'destino=Panel de solicitudes'
            : type === 'modulo'
              ? 'inicio'
              : '';
    setContentBlocks((current) => [
      ...current,
      { id: `${type}-${Date.now()}`, type, value: defaultValue }
    ]);
  }

  function moveContentBlock(index: number, direction: -1 | 1) {
    setContentBlocks((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  }

  function updateContentBlock(id: string, value: string) {
    setContentBlocks((current) => current.map((block) => block.id === id ? { ...block, value } : block));
  }

  function deleteContentBlock(id: string) {
    setContentBlocks((current) => current.filter((block) => block.id !== id));
  }

  async function resolveAdminRequest(id: string, status: 'aprobada' | 'denegada') {
    const request = adminRequests.find((item) => item.id === id);
    const assignRole = status === 'aprobada' && request?.title === 'Solicitud de perseverancia' ? perseveranceRole : status === 'aprobada' && request?.title === 'Cambio de dirigencia' ? (request.targetRole as Role | undefined ?? leadershipRole) : null;
    if (assignRole && !canApproveRole(session, assignRole)) {
      setAuthMessage(`Tu rango no puede aprobar el rol ${roleLabel(assignRole)}.`);
      return;
    }
    if (status === 'aprobada' && request?.title === 'Confirmacion de mail' && request.userId) {
      const confirmation = await confirmAdminUserEmail(request.userId);
      if (confirmation.error) {
        setAuthMessage(confirmation.error.message);
        return;
      }
    }
    const { error } = await resolveUserRequest(id, status === 'denegada' ? 'rechazada' : status, adminRequestMessage || 'Sin mensaje del administrador', assignRole);
    if (!error) {
      await loadAdminRequests();
      setRequestSubtab('resueltas');
      setAuthMessage(changeDone(assignRole ? `Solicitud aprobada y rol ${roleLabel(assignRole)} asignado.` : `Solicitud ${status}. El usuario vera la resolucion en su perfil.`));
      setAdminRequestMessage('');
      return;
    }

    setAdminRequests((current) => current.map((request) => (
      request.id === id
        ? { ...request, status, message: adminRequestMessage || 'Sin mensaje del administrador', resolvedAt: new Date().toISOString(), resolvedBy: `${session?.fullName ?? 'Administrador'} - ${roleLabel(session?.role ?? 'administrador')}` }
        : request
    )));
    setRequestSubtab('resueltas');
    setAuthMessage(changeDone(`Solicitud ${status}. El usuario vera la resolucion en su perfil.`));
    setAdminRequestMessage('');
  }

  async function acceptDiocesanRequest(id: string) {
    const { error } = await acceptDiocesanCoordinatorRequest(id);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await loadMyRequests();
    await refreshRealProfile();
    setAuthMessage(changeDone('Aceptaste el nuevo rango de coordinación.'));
  }

  async function submitUserRequest(title: string) {
    if (!session) {
      return;
    }
    if (userRequestText.trim().length === 0) {
      setAuthMessage('Escribí una descripción de hasta 500 caracteres para enviar la solicitud.');
      return;
    }

    const newRequest = {
      id: `req-${Date.now()}`,
      title,
      requester: session.fullName,
      definition: userRequestText.trim().slice(0, 500),
      createdAt: new Date().toISOString(),
      status: 'pendiente' as const
    };
    const { error } = await createUserRequest(title, newRequest.definition);
    if (error) {
      setAuthMessage(error.message || 'No se pudo enviar la solicitud.');
      return;
    }
    await loadMyRequests();
    if (canManageRequestsPanel(session)) {
      await loadAdminRequests();
    }
    setSentRequests((current) => [
      ...current,
      newRequest
    ]);
    if (canManageRequestsPanel(session)) {
      setAdminRequests((current) => [
        ...current,
        newRequest
      ]);
    }
    setSelectedRequest(null);
    setUserRequestText('');
    setAuthMessage(changeDone(title === 'Solicitud Especial' ? 'Solicitud enviada a la dirigencia diocesana.' : 'Solicitud enviada al panel del administrador.'));
  }

  async function submitLeadershipChangeRequest() {
    if (!session || !isCommunityLeader) {
      return;
    }
    if (!successorUserId) {
      setAuthMessage('Selecciona el sucesor dentro de tu comunidad.');
      return;
    }
    if (!userRequestText.trim()) {
      setAuthMessage('Escribi un mensaje para fundamentar el cambio de dirigencia.');
      return;
    }

    const successor = selectableCommunityMembers.find((member) => member.id === successorUserId);
    const details = `${userRequestText.trim().slice(0, 500)}\n\nSucesor propuesto: ${successor?.full_name ?? 'Usuario seleccionado'}\nRol propuesto: ${roleLabel(leadershipRole)}\nComunidad: ${session.communityOfOrigin}`;
    const { error } = await createLeadershipChangeRequest({
      successorUserId,
      successorRole: leadershipRole,
      details
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    await loadMyRequests();
    setSelectedRequest(null);
    setUserRequestText('');
    setSuccessorUserId('');
    setAuthMessage(changeDone('Solicitud de cambio de dirigencia enviada al Vocal Diocesano.'));
  }

  async function saveAccountSettings() {
    setAuthMessage('Guardando ajustes...');
    const updates: { email?: string; password?: string } = {};
    if (newEmail.trim()) {
      updates.email = newEmail.trim();
    }
    if (newPassword.trim()) {
      updates.password = newPassword;
    }
    if (!updates.email && !updates.password) {
      setAuthMessage('No hay cambios de mail o contraseña para guardar.');
      return;
    }
    const { error } = await supabase.auth.updateUser(updates);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setNewEmail('');
    setNewPassword('');
    await refreshRealProfile();
    setAuthMessage(changeDone('Ajustes de cuenta actualizados.'));
  }

  async function enablePushNotificationsFromSettings() {
    if (!session) {
      setAuthMessage('Iniciá sesión para activar notificaciones.');
      return;
    }
    setAuthMessage('Solicitando permiso de notificaciones...');
    try {
      const result = await requestAndRegisterPushToken(session, true);
      setNotificationPermissionStatus(result.status);
      if (result.token) {
        setPushTokenPreview(`${result.token.slice(0, 18)}...`);
        setPushCurrentToken(result.token);
      }
      const channelDebug = await getAndroidChannelDebug();
      setPushChannelDebug(channelDebug);
      setPushDebugInfo([
        `Permiso: ${result.status}`,
        `ProjectId: ${result.projectId}`,
        `Runtime: ${result.appRuntimeOwner}`,
        `DeviceId: ${result.deviceId ?? 'sin-device-id'}`,
        `Usuario: ${session.email}`,
        `Guardado Supabase: ${result.saved ? 'si' : 'no'}`,
        `Token: ${result.token ?? 'sin-token'}`,
        `Error técnico: ${result.technicalError ?? 'sin-error-técnico'}`
      ].join('\n'));
      setAuthMessage(result.error ? result.error : changeDone('Notificaciones activadas en este dispositivo.'));
    } catch (error) {
      setAuthMessage(getFriendlyPushError(error));
    }
  }

  async function sendLocalNotificationDebug() {
    setPushTestResult('Enviando notificacion local...');
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Palestra',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2d8dc8',
          sound: 'default',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
        });
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Prueba local Palestra',
          body: 'Si ves esto, Android y el canal local muestran notificaciones.',
          sound: 'default'
        },
        trigger: null
      });
      setPushChannelDebug(await getAndroidChannelDebug());
      setPushTestResult('Notificacion local solicitada. Si aparece, el canal Android funciona.');
    } catch (error) {
      setPushTestResult(error instanceof Error ? error.message : 'Fallo la prueba local.');
    }
  }

  async function sendRemotePushDebug() {
    if (session?.role !== 'administrador') {
      setPushTestResult('Solo Administrador puede enviar prueba push.');
      return;
    }
    let token = pushCurrentToken;
    if (!token) {
      const result = await requestAndRegisterPushToken(session, true);
      token = result.token ?? '';
      setNotificationPermissionStatus(result.status);
      setPushCurrentToken(token);
      setPushTokenPreview(token ? `${token.slice(0, 18)}...` : '');
      setPushDebugInfo([
        `Permiso: ${result.status}`,
        `ProjectId: ${result.projectId}`,
        `Runtime: ${result.appRuntimeOwner}`,
        `DeviceId: ${result.deviceId ?? 'sin-device-id'}`,
        `Usuario: ${session.email}`,
        `Guardado Supabase: ${result.saved ? 'si' : 'no'}`,
        `Token: ${result.token ?? 'sin-token'}`,
        `Error técnico: ${result.technicalError ?? 'sin-error-técnico'}`
      ].join('\n'));
    }
    if (!token) {
      setPushTestResult('No hay token actual para probar.');
      return;
    }
    setPushTestResult('Enviando push remoto a Expo Push API...');
    const response = await debugPushToDevice({
      token,
      projectId: easProjectId,
      runtime: appRuntimeOwner
    });
    setPushChannelDebug(await getAndroidChannelDebug());
    setPushTestResult(JSON.stringify({
      error: response.error?.message ?? null,
      data: response.data ?? null
    }, null, 2));
  }

  async function publishCommunityPost() {
    if (!session || !communityCapabilities.canPublishNotices) {
      setAuthMessage('No tenés permiso para publicar avisos en esta comunidad.');
      return;
    }
    const validationMessage = validateCommunityNoticeDraft(communityNoticeDraft);
    if (validationMessage) {
      setAuthMessage(validationMessage);
      return;
    }
    if (communityPostKind === 'fecha' && !communityPostDate.trim()) {
      setAuthMessage('Las fechas de calendario necesitan una fecha.');
      return;
    }

    const visibility = session.role === 'animador_comunidad' ? 'publica' : communityPostVisibility;
    const pollOptions = communityPostKind === 'encuesta'
      ? communityPollOptions.split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 8)
      : [];
    if (communityPostKind === 'encuesta' && pollOptions.length < 2) {
      setAuthMessage('Las encuestas necesitan al menos 2 opciones, una por linea.');
      return;
    }
    let imageUrl = communityNoticeDraft.imageUrl.trim() || null;
    try {
      if (communityNoticeDraft.imageAsset) {
        imageUrl = await uploadPickedImageToPublicUrl(
          communityNoticeDraft.imageAsset,
          `${currentCommunity?.id || 'community'}/notices`,
          'community-images'
        );
      }
    } catch (uploadError) {
      setAuthMessage(uploadError instanceof Error ? uploadError.message : 'No se pudo subir la imagen del aviso.');
      return;
    }
    const { data: communityPublicationId, error } = await createCommunityPublication({
      kind: communityPostKind,
      title: communityNoticeDraft.title.trim() || 'Aviso comunitario',
      subtitle: communityNoticeDraft.subtitle.trim() || null,
      body: communityNoticeDraft.body.trim(),
      bodyFormat: communityNoticeDraft.bodyFormat,
      imageUrl,
      linkLabel: communityNoticeDraft.linkLabel.trim() || null,
      linkUrl: normalizeCommunityNoticeLink(communityNoticeDraft.linkUrl),
      eventDate: communityPostKind === 'fecha' ? communityPostDate.trim() : null,
      visibility,
      pollOptions
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    const notificationWarning = await queueNotificationIfRequested(
      communityCapabilities.canNotifyMembers && communityPostNotify,
      {
        notificationType: 'mensaje_comunidad',
        title: communityNoticeDraft.title.trim() || 'Aviso comunitario',
        body: communityNoticeDraft.body.trim(),
        targetKind: 'comunidad',
        targetValue: session.communityOfOrigin,
        targetScope: visibility,
        province: session.province,
        community: session.communityOfOrigin,
        minRole: visibility === 'sedimentadores' ? 'sedimentador' : 'palestrista',
        tabKey: 'perfil',
        sourceType: 'community_publication',
        sourceId: typeof communityPublicationId === 'string' ? communityPublicationId : null
      }
    );
    setCommunityNoticeDraft({ ...emptyCommunityNoticeDraft });
    setCommunityPostDate('');
    setCommunityPollOptions('');
    setCommunityPostNotify(false);
    const successMessage = notificationWarning ?? changeDone(APP_MESSAGES.messageSentCorrectly);
    setAuthMessage(successMessage);
    if (!notificationWarning) {
      showFeedbackMessage(APP_MESSAGES.messageSentCorrectly);
    }
    await refreshCommunityForum();
    await onContentChanged();
  }

  function startEditCommunityPublication(item: CommunityPublication) {
    setEditingCommunityPublicationId(item.id ?? null);
    setEditingCommunityNoticeDraft({
      title: item.title,
      subtitle: item.subtitle ?? '',
      body: item.body,
      bodyFormat: normalizeCommunityNoticeFormat(item.bodyFormat),
      imageUrl: item.imageUrl ?? '',
      imageAsset: null,
      linkLabel: item.linkLabel ?? '',
      linkUrl: item.linkUrl ?? ''
    });
  }

  async function saveCommunityPublicationEdit(status: 'activo' | 'cerrado' = 'activo') {
    if (!editingCommunityPublicationId) {
      return;
    }
    const validationMessage = validateCommunityNoticeDraft(editingCommunityNoticeDraft);
    if (validationMessage) {
      setAuthMessage(validationMessage);
      return;
    }
    let imageUrl = editingCommunityNoticeDraft.imageUrl.trim() || null;
    try {
      if (editingCommunityNoticeDraft.imageAsset) {
        imageUrl = await uploadPickedImageToPublicUrl(
          editingCommunityNoticeDraft.imageAsset,
          `${currentCommunity?.id || 'community'}/notices`,
          'community-images'
        );
      }
    } catch (uploadError) {
      setAuthMessage(uploadError instanceof Error ? uploadError.message : 'No se pudo subir la imagen del aviso.');
      return;
    }
    const { error } = await updateCommunityPublication({
      publicationId: editingCommunityPublicationId,
      title: editingCommunityNoticeDraft.title.trim() || 'Aviso comunitario',
      subtitle: editingCommunityNoticeDraft.subtitle.trim() || null,
      body: editingCommunityNoticeDraft.body.trim(),
      bodyFormat: editingCommunityNoticeDraft.bodyFormat,
      imageUrl,
      linkLabel: editingCommunityNoticeDraft.linkLabel.trim() || null,
      linkUrl: normalizeCommunityNoticeLink(editingCommunityNoticeDraft.linkUrl),
      status
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setEditingCommunityPublicationId(null);
    setEditingCommunityNoticeDraft({ ...emptyCommunityNoticeDraft });
    setAuthMessage(changeDone(status === 'cerrado' ? 'Aviso cerrado.' : 'Aviso actualizado.'));
    await refreshCommunityForum();
  }

  async function removeCommunityPublication(publicationId: string) {
    const { error } = await archiveCommunityPublication(publicationId);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAuthMessage(changeDone('Aviso eliminado.'));
    await refreshCommunityForum();
  }

  async function saveMyCommunityDetails(values: {
    description: string;
    imageAsset: ImagePicker.ImagePickerAsset | null;
    imageUrl: string | null;
  }) {
    if (!session || !communityCapabilities.canEditCommunityDetails || !currentCommunity?.id) {
      setAuthMessage('No tenés permiso para editar esta comunidad.');
      return;
    }

    setCommunityDetailsSaving(true);
    setAuthMessage('Guardando datos de la comunidad...');
    try {
      let imageUrl = values.imageUrl;
      if (values.imageAsset) {
        imageUrl = await uploadPickedImageToPublicUrl(
          values.imageAsset,
          currentCommunity.id,
          'community-images'
        );
      }
      const { error } = await updateMyCommunityDetails({
        description: values.description,
        imageUrl
      });
      if (error) {
        setAuthMessage(error.message);
        return;
      }
      setRegistrationCommunities(await fetchCommunities());
      await onContentChanged();
      setAuthMessage(changeDone('Datos de la comunidad actualizados.'));
      showFeedbackMessage('Cambios guardados');
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'No se pudieron guardar los datos de la comunidad.');
    } finally {
      setCommunityDetailsSaving(false);
    }
  }

  async function votePoll(publication: CommunityPublication, option: string) {
    if (!publication.id) {
      return;
    }
    const { error } = await voteCommunityPoll(publication.id, option);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setLocalPollVotes((current) => ({ ...current, [publication.id]: option }));
    await refreshCommunityForum();
  }

  async function submitForumComment(publicationId: string) {
    const body = (forumCommentDrafts[publicationId] ?? '').trim();
    if (!body) {
      setAuthMessage('Escribi un comentario antes de publicar.');
      return;
    }
    const { error } = await createPublicationComment(publicationId, body);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setForumCommentDrafts((current) => ({ ...current, [publicationId]: '' }));
    setAuthMessage(changeDone('Comentario publicado.'));
    await refreshCommunityForum();
  }

  async function submitForumReaction(publicationId: string) {
    const { error } = await reactToPublication(publicationId, 'amen');
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setAuthMessage(changeDone('Reacción registrada.'));
  }

  async function submitForumReport(publicationId: string) {
    const reason = (forumReportDrafts[publicationId] ?? '').trim();
    if (!reason) {
      setAuthMessage('Escribi un motivo para reportar.');
      return;
    }
    const { error } = await reportPublication(publicationId, reason);
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    setForumReportDrafts((current) => ({ ...current, [publicationId]: '' }));
    setAuthMessage(changeDone(APP_MESSAGES.reportSentForModeration));
  }

  async function openPublicProfile(profile: PublicProfilePreview) {
    setSelectedPublicProfile(profile);
    if (!profile.id) {
      return;
    }
    const remoteProfile = await fetchPublicProfile(profile.id);
    if (!remoteProfile) {
      return;
    }
    setSelectedPublicProfile((current) => {
      if (!current || current.id !== profile.id) {
        return current;
      }
      return {
        ...current,
        fullName: remoteProfile.full_name ?? current.fullName,
        role: (remoteProfile.role || current.role) as Role,
        province: remoteProfile.province ?? current.province,
        communityName: remoteProfile.community_name ?? current.communityName,
        contact: remoteProfile.phone ?? current.contact,
        avatarUrl: remoteProfile.avatar_url ?? current.avatarUrl,
        displayRoleLabel: remoteProfile.display_role_label ?? current.displayRoleLabel,
        genderPreference: remoteProfile.gender_preference ?? current.genderPreference,
        nickname: remoteProfile.nickname ?? current.nickname,
        credentialNameMode: remoteProfile.credential_name_mode ?? current.credentialNameMode,
        perseveranceStartYear: remoteProfile.perseverance_start_year ?? current.perseveranceStartYear,
        personalPmType: remoteProfile.personal_pm_type ?? current.personalPmType,
        personalPmNumber: remoteProfile.personal_pm_number ?? current.personalPmNumber,
        personalPmProvince: remoteProfile.personal_pm_province ?? current.personalPmProvince,
        personalPmMotto: remoteProfile.personal_pm_motto ?? remoteProfile.pm_motto ?? current.personalPmMotto,
        pmMotto: remoteProfile.pm_motto ?? current.pmMotto
      };
    });
  }

  function openCommunityMemberProfile(member: CommunityMember) {
    openPublicProfile({
      id: member.id,
      fullName: member.full_name?.trim() || member.nickname?.trim() || 'Palestrista',
      role: (member.role || 'palestrista') as Role,
      province: member.province,
      communityName: member.community_name,
      contact: '',
      avatarUrl: member.avatar_url,
      genderPreference: member.gender_preference ?? null,
      nickname: member.nickname ?? null
    });
  }

  function messageCommunityMember(member: CommunityMember) {
    mailboxController.onComposeToUser(member.id, member.full_name ?? member.nickname ?? 'Palestrista');
    setProfilePanel('buzon');
  }

  async function requestEmailConfirmationHelp() {
    if (!session) {
      return;
    }
    const { error } = await createEmailConfirmationRequest({
      userId: session.id ?? '',
      email: session.email ?? '',
      fullName: session.fullName,
      province: session.province,
      communityName: session.communityOfOrigin,
      contact: session.contact
    });
    setAuthMessage(error ? error.message : APP_MESSAGES.messageSent);
    if (!error) {
      await loadMyRequests();
    }
  }

  function renderPmFilterDropdown<T extends string>(
    key: 'province' | 'gender' | 'status' | 'time' | 'year',
    label: string,
    value: T,
    options: Array<{ label: string; value: T }>,
    onSelect: (value: T) => void
  ) {
    const currentLabel = options.find((option) => option.value === value)?.label ?? label;
    const open = pmFilterDropdownOpen === key;
    return (
      <View style={styles.pmFilterField}>
        <Text style={styles.cardEyebrow}>{label}</Text>
        <TouchableOpacity style={styles.dropdownButton} onPress={() => setPmFilterDropdownOpen(open ? '' : key)} activeOpacity={0.85}>
          <Text style={styles.dropdownButtonText}>{currentLabel}</Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
        </TouchableOpacity>
        {open ? (
          <View style={styles.pmFilterDropdownList}>
            {options.map((option) => (
              <TouchableOpacity key={`${key}-${option.value}`} style={styles.dropdownItem} onPress={() => { onSelect(option.value); setPmFilterDropdownOpen(''); }}>
                <Text style={styles.dropdownItemText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  if (session && session.status === 'pendiente' && !session.emailConfirmedAt) {
    return (
      <PendingEmailProfile
        session={session}
        isDark={isDark}
        authMessage={authMessage}
        onRequestHelp={requestEmailConfirmationHelp}
        onSignOut={() => onSessionChange(null)}
      />
    );
  }

  if (session && profilePanel === 'comunidad') {
    return (
      <>
        <ProfilePublicProfileModal
          profile={selectedPublicProfile}
          viewerSession={session}
          isDark={isDark}
          provinceRoleLabels={provinceRoleLabels}
          roleAliases={adminConfig.settings.roleAliases}
          onClose={() => setSelectedPublicProfile(null)}
        />
        {communityPanelOpen ? (
          <CommunityPanelScreen
            community={currentCommunity}
            members={communityMembers}
            notices={myCommunityNotices}
            capabilities={communityCapabilities}
            isDark={isDark}
            feedback={authMessage}
            savingDetails={communityDetailsSaving}
            noticeDraft={communityNoticeDraft}
            noticeNotify={communityPostNotify}
            editingNoticeId={editingCommunityPublicationId}
            editingNoticeDraft={editingCommunityNoticeDraft}
            onBack={() => setCommunityPanelOpen(false)}
            onSaveDetails={saveMyCommunityDetails}
            onNoticeDraftChange={setCommunityNoticeDraft}
            onNoticeNotifyChange={setCommunityPostNotify}
            onPublishNotice={publishCommunityPost}
            onStartEditNotice={(notice) => startEditCommunityPublication(notice as CommunityPublication)}
            onEditingNoticeDraftChange={setEditingCommunityNoticeDraft}
            onSaveNotice={() => saveCommunityPublicationEdit('activo')}
            onCancelEditNotice={() => setEditingCommunityPublicationId(null)}
            onArchiveNotice={removeCommunityPublication}
            canManageNotice={(notice) => canManageCommunityNotice(session, myCommunityScope, notice.createdBy)}
            onViewProfile={openCommunityMemberProfile}
          />
        ) : (
          <MyCommunityScreen
            session={session}
            community={currentCommunity}
            members={communityMembers}
            notices={myCommunityNotices}
            isDark={isDark}
            provinceRoleLabels={provinceRoleLabels}
            roleAliases={adminConfig.settings.roleAliases}
            canAccessPanel={communityCapabilities.canOpenPanel}
            canMessageMembers={communityCapabilities.canMessageMembers}
            editingNoticeId={editingCommunityPublicationId}
            canManageNotice={(notice: CommunityNoticePreview) => Boolean(
              notice.id
              && canManageCommunityNotice(session, myCommunityScope, notice.createdBy)
            )}
            onBack={() => {
              setCommunityPanelOpen(false);
              setProfilePanel('vista');
            }}
            onRefresh={async () => {
              await Promise.all([
                refreshCommunityForum(),
                fetchMyCommunityMembers().then(setCommunityMembers)
              ]);
            }}
            onOpenPanel={() => setCommunityPanelOpen(true)}
            onViewProfile={openCommunityMemberProfile}
            onMessage={messageCommunityMember}
            onEditNotice={(notice) => {
              startEditCommunityPublication(notice as CommunityPublication);
              setCommunityPanelOpen(true);
            }}
            onDeleteNotice={removeCommunityPublication}
          />
        )}
      </>
    );
  }

  return (
    <View style={styles.stack}>
      <SectionTitle title={`${tabLabel('perfil')} y acceso`} />
      <ProfilePublicProfileModal
        profile={selectedPublicProfile}
        viewerSession={session}
        isDark={isDark}
        provinceRoleLabels={provinceRoleLabels}
        roleAliases={adminConfig.settings.roleAliases}
        onClose={() => setSelectedPublicProfile(null)}
      />
      {session ? (
        <View style={[styles.profileShell, isDark && styles.surfacePanelDark]}>
          <View style={styles.profileTopRow}>
            <View />
            <TouchableOpacity style={styles.iconButton} onPress={() => setShowAccountMenu(!showAccountMenu)}>
              <Ionicons name="ellipsis-vertical" size={20} color={palette.red} />
            </TouchableOpacity>
          </View>
          {showAccountMenu ? (
            <ProfileAccountMenu
              session={session}
              isDark={isDark}
              provinceRoleLabels={provinceRoleLabels}
              roleAliases={adminConfig.settings.roleAliases}
              items={[
                { icon: 'person-outline', label: 'Mi perfil', action: () => { setProfilePanel('vista'); setShowAccountMenu(false); } },
                { icon: 'create-outline', label: 'Editar perfil', action: () => { setProfilePanel('editar'); setShowAccountMenu(false); } },
                { icon: 'people-outline', label: 'Mi comunidad', action: () => { setCommunityPanelOpen(false); setProfilePanel('comunidad'); refreshCommunityForum(); setShowAccountMenu(false); } },
                ...(session.role === 'palestrista' ? [{ icon: 'mail-unread-outline' as const, label: 'Solicitudes', action: () => { setProfilePanel('vista'); setSelectedRequest('menu'); setShowSentRequests(true); loadMyRequests(); setShowAccountMenu(false); } }] : []),
                { icon: 'flame-outline', label: 'Ver intenciones', action: () => { setProfilePanel('intenciones'); loadPrayerIntentionsPanel(); setShowAccountMenu(false); } },
                { icon: 'mail-outline', label: 'Buzon', action: () => { setProfilePanel('buzon'); setShowAccountMenu(false); } },
                { icon: 'settings-outline', label: 'Ajustes', action: () => { setProfilePanel('configuracion'); setShowAccountMenu(false); } }
              ]}
              onSignOut={signOutReal}
            />
          ) : null}
          {profilePanel === 'intenciones' ? (
            <ProfileIntentionsPanel
              isAdmin={session.role === 'administrador'}
              isDark={isDark}
              intentions={myPrayerIntentions}
              message={prayerIntentionsMessage}
              notices={prayerRemovalNotices}
              noticeVisible={prayerRemovalNoticeVisible}
              onCloseNotice={closePrayerRemovalNotice}
              onDeleteIntention={deletePrayerIntentionFromAdmin}
              onRefresh={loadPrayerIntentionsPanel}
            />
          ) : null}
          {profilePanel === 'vista' && !session.perseveranceStartYear ? (
            <TouchableOpacity style={styles.completionNotice} onPress={() => setProfilePanel('editar')} activeOpacity={0.86}>
              <Ionicons name="time-outline" size={20} color={palette.red} />
              <Text style={styles.completionNoticeText}>Agregar años de perseverancia</Text>
            </TouchableOpacity>
          ) : null}
          {profilePanel === 'vista' ? (
            <ProfileSummary
              session={session}
              isDark={isDark}
              provinceRoleLabels={provinceRoleLabels}
              roleAliases={adminConfig.settings.roleAliases}
              onUploadPhoto={uploadProfilePhoto}
            />
          ) : null}
          {profilePanel === 'editar' ? <View style={[styles.profileCommunityPanel, isDark && styles.surfacePanelDark]}>
            <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Editar perfil</Text>
            {isMissingProfileScope(session) ? (
              <View style={styles.completionNotice}>
                <Ionicons name="alert-circle-outline" size={20} color={palette.red} />
                <Text style={styles.completionNoticeText}>Completa provincia y comunidad para usar normalmente la app.</Text>
              </View>
            ) : null}
            <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Tus datos personales pueden editarse normalmente. Provincia y comunidad solo pueden cambiarse cada {territorialProfileCooldownDays} dias.</Text>
            {!profileEditUnlocked ? (
              <TouchableOpacity style={styles.primaryButton} onPress={() => setProfileEditUnlocked(true)}>
                <Ionicons name="create-outline" size={18} color={palette.white} />
                <Text style={styles.primaryButtonText}>Editar</Text>
              </TouchableOpacity>
            ) : null}
            {territorialFieldsLocked ? (
              <View style={styles.completionNotice}>
                <Ionicons name="lock-closed-outline" size={20} color={palette.red} />
                <Text style={styles.completionNoticeText}>Provincia y comunidad estan bloqueadas por {territorialCooldown.daysLeft} dia(s). El resto del perfil sigue editable.</Text>
              </View>
            ) : null}
            <TextInput editable={profileEditUnlocked} style={[styles.input, isDark && styles.inputDark, editFormLocked && { opacity: 0.62 }]} placeholder="Nombre y apellido" value={editFullName} onChangeText={setEditFullName}  placeholderTextColor={inputPlaceholderColor} />
            <TextInput editable={profileEditUnlocked} style={[styles.input, isDark && styles.inputDark, editFormLocked && { opacity: 0.62 }]} placeholder="Apodo" value={editNickname} onChangeText={setEditNickname}  placeholderTextColor={inputPlaceholderColor} />
            <TextInput editable={profileEditUnlocked} style={[styles.input, isDark && styles.inputDark, editFormLocked && { opacity: 0.62 }]} placeholder="Contacto" value={editContact} onChangeText={setEditContact}  placeholderTextColor={inputPlaceholderColor} />
            <View style={styles.settingRow}>
              <View style={styles.settingRowText}>
                <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Usar apodo en saludos</Text>
                <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Home y saludos usan tu apodo si esta cargado.</Text>
              </View>
              <Switch
                value={editUseNicknameInGreetings}
                onValueChange={setEditUseNicknameInGreetings}
                disabled={editFormLocked}
                trackColor={{ false: 'rgba(94, 131, 150, 0.22)', true: 'rgba(45, 141, 200, 0.36)' }}
                thumbColor={editUseNicknameInGreetings ? palette.red : palette.white}
              />
            </View>
            <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Color personal del saludo</Text>
            <View style={[styles.card, isDark && styles.surfaceCardDark]}>
              <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Vista previa</Text>
              <Text style={[styles.cardTitle, { color: editGreetingPreviewColor }]}>{editGreetingPreviewName}</Text>
              <View style={styles.filterRow}>
                {personalGreetingColorOptions.map((color) => (
                  <TouchableOpacity
                    key={color}
                    accessibilityLabel={`Elegir color ${color}`}
                    style={[
                      styles.iconButton,
                      {
                        backgroundColor: color,
                        borderColor: normalizeOptionalHexColor(editPersonalGreetingColor) === color ? palette.ink : 'rgba(45, 141, 200, 0.24)',
                        borderWidth: normalizeOptionalHexColor(editPersonalGreetingColor) === color ? 3 : 1
                      }
                    ]}
                    disabled={editFormLocked}
                    onPress={() => setEditPersonalGreetingColor(color)}
                  >
                    {normalizeOptionalHexColor(editPersonalGreetingColor) === color ? <Ionicons name="checkmark" size={18} color={palette.white} /> : null}
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.input, styles.colorInput, isDark && styles.inputDark]}
                placeholder={`Institucional ${institutionalGreetingColor}`}
                value={editPersonalGreetingColor}
                onChangeText={setEditPersonalGreetingColor}
                editable={profileEditUnlocked}
                autoCapitalize="characters"
                placeholderTextColor={inputPlaceholderColor}
              />
              {personalGreetingColorError(editPersonalGreetingColor) ? <Text style={[styles.cardText, { color: palette.red }]}>{personalGreetingColorError(editPersonalGreetingColor)}</Text> : null}
              <TouchableOpacity style={[styles.actionPill, editFormLocked && { opacity: 0.62 }]} disabled={editFormLocked} onPress={() => setEditPersonalGreetingColor('')}>
                <Ionicons name="refresh-outline" size={16} color={palette.red} />
                <Text style={styles.actionPillText}>Usar color institucional</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Mostrar en credencial</Text>
            <View style={styles.filterRow}>
              {(['name', 'nickname', 'both'] as const).map((mode) => (
                <TouchableOpacity key={mode} disabled={editFormLocked} style={[styles.filterChip, editCredentialNameMode === mode && styles.filterChipActive, editFormLocked && { opacity: 0.62 }]} onPress={() => setEditCredentialNameMode(mode)}>
                  <Text style={[styles.filterChipText, editCredentialNameMode === mode && styles.filterChipTextActive]}>{mode === 'name' ? 'Nombre' : mode === 'nickname' ? 'Apodo' : 'Ambos'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Año de inicio en el Movimiento</Text>
            <TouchableOpacity style={[styles.dropdownButton, isDark && styles.dropdownButtonDark, editFormLocked && { opacity: 0.62 }]} disabled={editFormLocked} onPress={() => setEditPerseveranceYearDropdownOpen(!editPerseveranceYearDropdownOpen)}>
              <Text style={[styles.dropdownButtonText, isDark && styles.dropdownButtonTextDark]}>{editPerseveranceStartYear || 'Seleccionar año'}</Text>
              <Ionicons name={editPerseveranceYearDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
            </TouchableOpacity>
            {editPerseveranceYearDropdownOpen && profileEditUnlocked ? (
              <ScrollView style={[styles.dropdownList, isDark && styles.dropdownListDark]} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {perseveranceStartYears.map((year) => (
                  <TouchableOpacity key={year} style={[styles.dropdownItem, isDark && styles.dropdownItemDark]} onPress={() => { setEditPerseveranceStartYear(year); setEditPerseveranceYearDropdownOpen(false); }}>
                    <Text style={[styles.dropdownItemText, isDark && styles.dropdownItemTextDark]}>{year}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}
            {perseveranceLabel(Number(editPerseveranceStartYear)) ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{perseveranceLabel(Number(editPerseveranceStartYear))}</Text> : null}
            {roleRank(session.role) >= roleRank('sedimentador') ? (
              <>
                <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>PM personal</Text>
                <View style={styles.filterRow}>
                  {(['pmm', 'pmf'] as const).map((type) => (
                    <TouchableOpacity key={type} disabled={editFormLocked} style={[styles.filterChip, editPmType === type && styles.filterChipActive, editFormLocked && { opacity: 0.62 }]} onPress={() => setEditPmType(type)}>
                      <Text style={[styles.filterChipText, editPmType === type && styles.filterChipTextActive]}>{personalPmTypeLabel(type)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput editable={profileEditUnlocked} style={[styles.input, isDark && styles.inputDark, editFormLocked && { opacity: 0.62 }]} placeholder="Numero de PM" value={editPmNumber} onChangeText={(value) => setEditPmNumber(value.replace(/[^0-9]/g, '').slice(0, 4))} keyboardType="number-pad" placeholderTextColor={inputPlaceholderColor} />
                <TouchableOpacity style={[styles.dropdownButton, isDark && styles.dropdownButtonDark, editFormLocked && { opacity: 0.62 }]} disabled={editFormLocked} onPress={() => setEditPmProvinceDropdownOpen(!editPmProvinceDropdownOpen)}>
                  <Text style={[styles.dropdownButtonText, isDark && styles.dropdownButtonTextDark]}>{editPmProvince || 'Provincia donde hiciste el PM'}</Text>
                  <Ionicons name={editPmProvinceDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                </TouchableOpacity>
                {editPmProvinceDropdownOpen && profileEditUnlocked ? (
                  <ScrollView style={[styles.dropdownList, isDark && styles.dropdownListDark]} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {registrationCommunities.map((item) => (
                      <TouchableOpacity key={`pm-${item.province}`} style={[styles.dropdownItem, isDark && styles.dropdownItemDark]} onPress={() => { setEditPmProvince(item.province); setEditPmProvinceDropdownOpen(false); }}>
                        <Text style={[styles.dropdownItemText, isDark && styles.dropdownItemTextDark]}>{item.province}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : null}
                <TextInput editable={profileEditUnlocked} style={[styles.input, isDark && styles.inputDark, editFormLocked && { opacity: 0.62 }]} placeholder="Lema o idea fuerza del PM" value={editPmMotto} onChangeText={setEditPmMotto}  placeholderTextColor={inputPlaceholderColor} />
                {personalPmSummary({ type: editPmType, number: editPmNumber, province: editPmProvince, motto: editPmMotto }) ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{personalPmSummary({ type: editPmType, number: editPmNumber, province: editPmProvince, motto: editPmMotto })}</Text> : null}
              </>
            ) : null}
            <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Provincia</Text>
            <TouchableOpacity
              style={[styles.dropdownButton, isDark && styles.dropdownButtonDark, territorialControlsLocked && { opacity: 0.58 }]}
              disabled={territorialControlsLocked}
              onPress={() => setEditProvinceDropdownOpen(!editProvinceDropdownOpen)}
            >
              <Text style={[styles.dropdownButtonText, isDark && styles.dropdownButtonTextDark]}>{editProvince || 'Seleccionar provincia'}</Text>
              <Ionicons name={territorialControlsLocked ? 'lock-closed-outline' : editProvinceDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
            </TouchableOpacity>
            {editProvinceDropdownOpen && !territorialControlsLocked ? (
              <ScrollView style={[styles.dropdownList, isDark && styles.dropdownListDark]} nestedScrollEnabled>
                {registrationCommunities.map((item) => (
                  <TouchableOpacity
                    key={item.province}
                    style={[styles.dropdownItem, isDark && styles.dropdownItemDark]}
                    onPress={() => {
                      setEditProvince(item.province);
                      setEditCommunity('');
                      setEditProvinceDropdownOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, isDark && styles.dropdownItemTextDark]}>{item.province}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}
            {selectedEditProvince ? (
              <>
                <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Comunidad de origen</Text>
                <TouchableOpacity
                  style={[styles.dropdownButton, isDark && styles.dropdownButtonDark, territorialControlsLocked && { opacity: 0.58 }]}
                  disabled={territorialControlsLocked}
                  onPress={() => setEditCommunityDropdownOpen(!editCommunityDropdownOpen)}
                >
                  <Text style={[styles.dropdownButtonText, isDark && styles.dropdownButtonTextDark]}>{editCommunity || 'Seleccionar comunidad'}</Text>
                  <Ionicons name={territorialControlsLocked ? 'lock-closed-outline' : editCommunityDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                </TouchableOpacity>
                {editCommunityDropdownOpen && !territorialControlsLocked ? (
                  <ScrollView style={[styles.dropdownList, isDark && styles.dropdownListDark]} nestedScrollEnabled>
                    {selectedEditProvince.locations.map((item) => (
                      <TouchableOpacity key={item.name} style={[styles.dropdownItem, isDark && styles.dropdownItemDark]} onPress={() => { setEditCommunity(item.name); setEditCommunityDropdownOpen(false); }}>
                        <Text style={[styles.dropdownItemText, isDark && styles.dropdownItemTextDark]}>{item.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : null}
              </>
            ) : null}
            <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Narrativa</Text>
            <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Elegí cómo querés que la app adapte los textos automáticos del sistema.</Text>
            {(['male', 'female'] as const).map((option) => {
              const selected = editGenderPreference === option;
              const narrative = genderNarratives[option];
              return (
                <TouchableOpacity key={option} disabled={editFormLocked} style={[styles.narrativeEditCard, isDark && styles.surfaceRowDark, selected && styles.narrativeEditCardActive, editFormLocked && { opacity: 0.62 }]} onPress={() => setEditGenderPreference(option)} activeOpacity={0.86}>
                  <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={selected ? palette.white : palette.red} />
                  <View style={styles.narrativeEditTextBlock}>
                    <Text style={[styles.narrativeEditTitle, isDark && styles.textDarkStrong, selected && styles.narrativeEditTitleActive]}>{narrative.title}</Text>
                    <Text numberOfLines={3} style={[styles.narrativeEditText, isDark && styles.textDarkBody, selected && styles.narrativeEditTextActive]}>{narrative.text}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {profileEditUnlocked ? <View style={styles.filterRow}>
              <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]} onPress={saveProfile}>
                <Text style={styles.primaryButtonText}>Guardar perfil</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionPill} onPress={resetProfileDraft}>
                <Ionicons name="close-outline" size={16} color={palette.red} />
                <Text style={styles.actionPillText}>Cancelar</Text>
              </TouchableOpacity>
            </View> : null}
            {authMessage ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{authMessage}</Text> : null}
          </View> : null}
          {profilePanel === 'configuracion' ? (
            <ProfileSettingsPanel
              session={session}
              isDark={isDark}
              themeName={themeName}
              appTheme={appTheme}
              notificationPermissionStatus={notificationPermissionStatus}
              showPushDiagnostics={showPushDiagnostics}
              pushTokenPreview={pushTokenPreview}
              pushDebugInfo={pushDebugInfo}
              pushChannelDebug={pushChannelDebug}
              pushTestResult={pushTestResult}
              newEmail={newEmail}
              newPassword={newPassword}
              authMessage={authMessage}
              onThemeChange={onThemeChange}
              onRequestNotifications={enablePushNotificationsFromSettings}
              onNotificationsDisabled={() => setAuthMessage('Las notificaciones se desactivan desde los ajustes del dispositivo.')}
              onTogglePushDiagnostics={setShowPushDiagnostics}
              onSendLocalNotificationDebug={sendLocalNotificationDebug}
              onSendRemotePushDebug={sendRemotePushDebug}
              onNewEmailChange={setNewEmail}
              onNewPasswordChange={setNewPassword}
              onSaveAccountSettings={saveAccountSettings}
            />
          ) : null}
          {profilePanel === 'buzon' ? (
            <MailboxPanel
              isDark={isDark}
              {...mailboxController}
            />
          ) : null}
          {profilePanel === 'vista' ? (
            <>
          <View style={[styles.profileCommunityPanel, isDark && styles.surfacePanelDark]}>
            <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Credencial digital</Text>
            <View style={[styles.digitalCredential, isDark && styles.digitalCredentialDark]}>
              <View style={styles.credentialAvatar}>
                {session.avatarUrl ? <Image source={{ uri: session.avatarUrl }} style={styles.credentialAvatarImage} /> : <Ionicons name="person-outline" size={18} color={palette.red} />}
              </View>
              <View style={styles.adminUserHeaderText}>
                <Text style={[styles.credentialName, isDark && styles.textDarkStrong]}>{credentialDisplayName(session)}</Text>
                <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{displayRoleLabel(session.role, session.province, provinceRoleLabels, adminConfig.settings.roleAliases, session.displayRoleLabel, session.genderPreference)}</Text>
                {session.subroleKey ? <Text style={[styles.cardText, isDark && styles.textDarkAccent]}>{subroleLabel(session.subroleKey, session.genderPreference)}</Text> : null}
                {perseveranceLabel(session.perseveranceStartYear) ? <Text style={[styles.cardText, isDark && styles.textDarkAccent]}>{perseveranceLabel(session.perseveranceStartYear)}</Text> : null}
                {roleRank(session.role) >= roleRank('sedimentador') && personalPmSummary({
                  type: session.personalPmType,
                  number: session.personalPmNumber,
                  province: session.personalPmProvince,
                  motto: session.personalPmMotto ?? session.pmMotto
                }) ? <Text style={[styles.cardText, isDark && styles.textDarkBody]} numberOfLines={1}>{personalPmSummary({
                    type: session.personalPmType,
                    number: session.personalPmNumber,
                    province: session.personalPmProvince,
                    motto: session.personalPmMotto ?? session.pmMotto
                  })}</Text> : null}
                <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{session.communityOfOrigin}, {session.province}</Text>
              </View>
            </View>
            {credentialQrPayload ? (
              <View style={styles.credentialQrPanel}>
                <TouchableOpacity style={styles.credentialQrImage} activeOpacity={0.86} onPress={() => setCredentialQrExpanded(true)}>
                  <CredentialQrCode value={credentialQrPayload} size={104} province={session.province} role={session.role} />
                </TouchableOpacity>
                <View style={styles.adminUserHeaderText}>
                  <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>QR verificable</Text>
                  <Text style={[styles.cardText, isDark && styles.textDarkBody]}>ID: {credentialQr?.credential_id.slice(0, 8) ?? 'pendiente'} - v{credentialQr?.version ?? 1}</Text>
                  <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Generada: {credentialQr?.issued_at ? new Date(credentialQr.issued_at).toLocaleDateString('es-AR') : 'pendiente'}</Text>
                  <TouchableOpacity style={styles.actionPill} onPress={() => setCredentialQrExpanded(true)}>
                    <Ionicons name="expand-outline" size={16} color={palette.red} />
                    <Text style={styles.actionPillText}>Ampliar QR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionPill} onPress={() => { setCredentialQrExpanded(false); setCredentialQrPayload(''); setCredentialQr(null); setCredentialQrMessage('QR cerrado. Puedes generarlo nuevamente cuando lo necesites.'); }}>
                    <Ionicons name="close-outline" size={16} color={palette.red} />
                    <Text style={styles.actionPillText}>Cerrar QR</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.secondaryButton} onPress={refreshCredentialQr}>
                <Ionicons name="qr-code-outline" size={17} color={palette.red} />
                <Text style={styles.secondaryButtonText}>Generar QR verificable</Text>
              </TouchableOpacity>
            )}
            {credentialQrMessage ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{credentialQrMessage}</Text> : null}
            {canScanCredentialQr(session) ? (
              <TouchableOpacity style={styles.primaryButton} onPress={() => openQrScanner('credential')}>
                <Ionicons name="scan-outline" size={17} color={palette.white} />
                <Text style={styles.primaryButtonText}>Escanear QR</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <Modal visible={credentialQrExpanded} transparent animationType="fade" onRequestClose={() => setCredentialQrExpanded(false)} statusBarTranslucent>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalPanel, styles.credentialQrExpandedPanel, isDark && styles.surfacePanelDark]}>
                <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>QR verificable</Text>
                {credentialQrPayload ? (
                  <View style={styles.credentialQrExpandedImage}>
                    <CredentialQrCode value={credentialQrPayload} size={260} province={session.province} role={session.role} />
                  </View>
                ) : null}
                <TouchableOpacity style={styles.primaryButton} onPress={() => setCredentialQrExpanded(false)}>
                  <Ionicons name="close-outline" size={17} color={palette.white} />
                  <Text style={styles.primaryButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <Modal visible={qrScannerVisible} transparent animationType="slide" onRequestClose={() => { setQrScannerVisible(false); setQrScannerActive(false); }} statusBarTranslucent>
            <View style={styles.modalOverlay} pointerEvents="box-none">
              <TouchableOpacity style={styles.modalBackdropTouch} activeOpacity={1} onPress={() => { setQrScannerVisible(false); setQrScannerActive(false); }} />
              <View style={[styles.modalPanel, isDark && styles.surfacePanelDark]} pointerEvents="auto">
                <TouchableOpacity style={styles.modalCloseButton} onPress={() => { setQrScannerVisible(false); setQrScannerActive(false); }} activeOpacity={0.8}>
                  <Ionicons name="close" size={22} color={palette.red} />
                </TouchableOpacity>
                <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Escanear QR</Text>
                <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{qrValidationMessage || 'Apunta la camara al QR de la credencial.'}</Text>
                {qrScannerActive ? (
                  <CameraView
                    style={styles.qrCamera}
                    facing="back"
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={handleCredentialBarcode}
                  />
                ) : null}
                {qrValidationResult ? (
                  <View style={[styles.inlineEditorPanel, isDark && styles.surfacePanelDark]}>
                    {qrValidationResult.status === 'valid' ? (
                      <>
                        <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Credencial valida</Text>
                        <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{qrValidationResult.full_name}</Text>
                        <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{displayRoleLabel((qrValidationResult.role === 'administrador' && session.role !== 'administrador' && qrValidationResult.user_id !== session.id ? 'vocal' : (qrValidationResult.role ?? 'palestrista')) as Role, qrValidationResult.province, provinceRoleLabels, adminConfig.settings.roleAliases, null, null)}</Text>
                        {qrValidationResult.subrole_key ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{subroleLabel(qrValidationResult.subrole_key)}</Text> : null}
                        <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{qrValidationResult.community_name ?? 'Sin comunidad'}, {qrValidationResult.province ?? 'Sin provincia'}</Text>
                        <Text style={[styles.profileHonorText, isDark && styles.textDarkAccent]}>Estado: Credencial valida</Text>
                      </>
                    ) : (
                      <>
                        <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{qrValidationResult.status === 'expired' ? 'Credencial vencida' : qrValidationResult.status === 'revoked' ? 'Credencial revocada' : 'Credencial no valida'}</Text>
                        <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{qrValidationResult.message || 'Credencial no valida'}</Text>
                      </>
                    )}
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => { setQrValidationResult(null); setQrValidationMessage(qrScannerMode === 'activity' ? 'Apunta la camara al QR para validar la lista.' : 'Apunta la camara al QR de la credencial.'); setQrScannerActive(true); }}>
                      <Ionicons name="scan-outline" size={17} color={palette.red} />
                      <Text style={styles.secondaryButtonText}>Escanear otra</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            </View>
          </Modal>
            </>
          ) : null}
          {profilePanel === 'vista' && session.role === 'palestrista' && selectedRequest ? (
            <View style={styles.profileCommunityPanel}>
              <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Solicitudes</Text>
              {selectedRequest === 'menu' || selectedRequest === 'Solicitud de perseverancia' ? (
                <View style={styles.inlineEditorPanel}>
                  {roleRank(session.role) < roleRank('sedimentador') ? (
                    <TouchableOpacity style={styles.innerNewsCard} onPress={() => setSelectedRequest(selectedRequest === 'Solicitud de perseverancia' ? 'menu' : 'Solicitud de perseverancia')}>
                      <Text style={styles.cardTitle}>Solicitud de Perseverancia</Text>
                      <Text style={styles.cardText}>Para pedir revisión del camino de perseverancia.</Text>
                      <Text style={styles.expandHint}>{selectedRequest === 'Solicitud de perseverancia' ? 'Cerrar solicitud' : 'Abrir solicitud'}</Text>
                    </TouchableOpacity>
                  ) : null}
                  {selectedRequest && selectedRequest !== 'menu' ? (
                    <View style={styles.profileCommunityPanel}>
                      <Text style={styles.cardEyebrow}>Solicitud</Text>
                      <Text style={styles.cardTitle}>{selectedRequest === 'Solicitud de perseverancia' ? 'Solicitud de Perseverancia' : selectedRequest}</Text>
                      <Text style={styles.cardText}>Escribí el motivo de la solicitud. Máximo 500 caracteres.</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Detalle de la solicitud"
                        value={userRequestText}
                        onChangeText={(value) => setUserRequestText(value.slice(0, 500))}
                        multiline
                       placeholderTextColor={inputPlaceholderColor} />
                      <Text style={styles.cardText}>{userRequestText.length}/500</Text>
                      <TouchableOpacity style={styles.primaryButton} onPress={() => submitUserRequest(selectedRequest)}>
                        <Text style={styles.primaryButtonText}>Enviar solicitud</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : null}
          {profilePanel === 'vista' && session.role !== 'administrador' && showSentRequests ? (
            <View style={styles.profileCommunityPanel}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={async () => {
                  const next = !showSentRequests;
                  setShowSentRequests(next);
                  if (next) {
                    await loadMyRequests();
                  }
                }}
              >
                <Ionicons name="mail-open-outline" size={18} color={palette.red} />
                <Text style={styles.secondaryButtonText}>Solicitudes enviadas</Text>
              </TouchableOpacity>
              {showSentRequests ? (
                <View style={styles.profileCommunityPanel}>
                  <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Historial de solicitudes</Text>
              {sentRequests.length === 0 ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Todavia no enviaste solicitudes.</Text> : null}
              {sentRequests.map((item) => (
                <View key={item.id}>
                  <TouchableOpacity style={styles.innerNewsCard} onPress={() => setSelectedSentRequestId(selectedSentRequestId === item.id ? '' : item.id)}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardText}>Estado: {item.status}</Text>
                    <Text style={styles.expandHint}>{selectedSentRequestId === item.id ? 'Ocultar detalle' : 'Ver detalle'}</Text>
                  </TouchableOpacity>
                  {selectedSentRequestId === item.id ? (
                    <View style={styles.profileCommunityPanel}>
                      <Text style={styles.cardText}>Enviada: {new Date(item.createdAt).toLocaleString('es-AR')}</Text>
                      <Text style={styles.cardText}>Detalle: {item.definition}</Text>
                      <Text style={styles.cardText}>Respondio: {item.resolvedBy ?? 'Pendiente'}</Text>
                      <Text style={styles.cardText}>Fecha de resolucion: {item.resolvedAt ? new Date(item.resolvedAt).toLocaleString('es-AR') : 'Pendiente'}</Text>
                      <Text style={styles.cardText}>Mensaje: {item.message ?? 'Sin mensaje todavía'}</Text>
                      {['Propuesta Coordinador Diocesano', 'Propuesta Coordinador Nacional', 'Solicitud de Coordinación Diocesana', 'Solicitud de Coordinación Nacional', 'Solicitud de Coordinacion Diocesana', 'Solicitud de Coordinacion Nacional'].includes(item.title) && item.status === 'pendiente' && item.targetUserId === session.id ? (
                        <TouchableOpacity style={styles.primaryButton} onPress={() => acceptDiocesanRequest(item.id)}>
                          <Text style={styles.primaryButtonText}>Aceptar rango {roleLabel((item.targetRole ?? 'coordinador_diocesano') as Role)}</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
            </View>
          ) : null}
          {(hasPermission(session, 'gestionar_sistema') || canAdministrateCommunities || hasPermission(session, 'gestionar_contenido') || hasPermission(session, 'gestionar_permisos') || canReviewLeadershipRequests || isCommunityLeader) ? (
            showDedicatedNavigationManager ? (
                <View style={styles.navigationDedicatedShell}>
                  <View style={styles.navigationDedicatedTopbar}>
                    <View style={styles.navigationDedicatedBrand}>
                      <View style={styles.navigationDedicatedLogo}>
                        <Ionicons name="navigate-outline" size={22} color={palette.white} />
                      </View>
                      <View style={styles.adminUserHeaderText}>
                        <Text style={styles.navigationDedicatedTitle}>Consola de navegación</Text>
                        <Text style={styles.navigationDedicatedSubtitle}>Gestión visual de secciones, roles y barra inferior.</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.navigationBackButton} onPress={() => setAdminModule('resumen')} activeOpacity={0.85}>
                      <Ionicons name="arrow-back-outline" size={17} color={palette.red} />
                      <Text style={styles.navigationBackButtonText}>Regresar a Palestra APP</Text>
                    </TouchableOpacity>
                  </View>

                  {authMessage ? <Text style={styles.navigationDedicatedMessage}>{authMessage}</Text> : null}

                  <View style={styles.navigationBuilderScreen}>
                    <View style={styles.navigationBuilderHero}>
                      <View style={styles.navigationHeroText}>
                        <Text style={styles.navigationHeroEyebrow}>Constructor visual</Text>
                        <Text style={styles.navigationHeroTitle}>Navegación de la app</Text>
                        <Text style={styles.navigationHeroBody}>Edita la barra inferior como un panel profesional: orden, iconos, nombres, visibilidad y roles desde una sola pantalla.</Text>
                      </View>
                      <View style={styles.navigationHeroBadge}>
                        <Ionicons name="phone-portrait-outline" size={22} color={palette.white} />
                      </View>
                    </View>

                    <View style={styles.navigationStatsRow}>
                      <View style={styles.navigationStatPill}>
                        <Text style={styles.navigationStatValue}>{editableTabs.length}</Text>
                        <Text style={styles.navigationStatLabel}>Secciones</Text>
                      </View>
                      <View style={styles.navigationStatPill}>
                        <Text style={styles.navigationStatValue}>{navigationVisibleCount}</Text>
                        <Text style={styles.navigationStatLabel}>Visibles</Text>
                      </View>
                      <View style={styles.navigationStatPill}>
                        <Text style={styles.navigationStatValue}>{navigationLockedCount}</Text>
                        <Text style={styles.navigationStatLabel}>Base</Text>
                      </View>
                    </View>

                    <View style={styles.navigationPhonePreview}>
                      <View style={styles.navigationPhoneTop}>
                        <View>
                          <Text style={styles.navigationPhoneTitle}>Palestra</Text>
                          <Text style={styles.navigationPhoneSub}>Vista previa en vivo</Text>
                        </View>
                        <View style={styles.navigationPhoneStatus} />
                      </View>
                      <View style={styles.navigationPreviewContent}>
                        <Text style={styles.navigationPreviewLabel}>Barra inferior</Text>
                        <Text style={styles.navigationPreviewHint}>Los cambios guardados impactan globalmente al refrescar la app.</Text>
                      </View>
                      <View style={styles.navPreviewBar}>
                        {editableTabs.slice(0, 7).map((tab) => {
                          const draft = editingTabs[tab.key] ?? { label: tab.label, iconName: tab.icon, sectionType: tab.sectionType, isVisible: tab.visible, visibleRoles: tab.visibleRoles };
                          const iconName = isIoniconName(draft.iconName) ? draft.iconName : 'help-circle-outline';
                          const selected = selectedNavigationTab?.key === tab.key;
                          return (
                            <TouchableOpacity key={`preview-dedicated-${tab.key}`} style={[styles.navPreviewItem, !draft.isVisible && styles.navPreviewItemHidden, selected && styles.navPreviewItemSelected]} onPress={() => setSelectedNavigationTabKey(tab.key)} activeOpacity={0.85}>
                              <Ionicons name={iconName} size={18} color={selected ? palette.white : draft.isVisible ? palette.red : palette.inkMuted} />
                              <Text numberOfLines={1} style={[styles.navPreviewText, selected && styles.navPreviewTextSelected]}>{draft.label || tab.label}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navigationRail}>
                      {editableTabs.map((tab, index) => {
                        const draft = editingTabs[tab.key] ?? { label: tab.label, iconName: tab.icon, sectionType: tab.sectionType, isVisible: tab.visible, visibleRoles: tab.visibleRoles };
                        const iconName = isIoniconName(draft.iconName) ? draft.iconName : 'help-circle-outline';
                        const selected = selectedNavigationTab?.key === tab.key;
                        return (
                          <TouchableOpacity key={`rail-dedicated-${tab.key}`} style={[styles.navigationRailItem, selected && styles.navigationRailItemActive]} onPress={() => { setSelectedNavigationTabKey(tab.key); setNavigationRolesDropdownOpen(false); }} activeOpacity={0.85}>
                            <Ionicons name={iconName} size={20} color={selected ? palette.white : palette.red} />
                            <Text numberOfLines={1} style={[styles.navigationRailText, selected && styles.navigationRailTextActive]}>{draft.label || tab.label}</Text>
                            <Text style={[styles.navigationRailMeta, selected && styles.navigationRailTextActive]}>#{index + 1}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {selectedNavigationTab && selectedNavigationDraft ? (
                      <View style={styles.navigationFocusPanel}>
                        <View style={styles.navigationFocusHeader}>
                          <View style={styles.navigationFocusIcon}>
                            <Ionicons name={isIoniconName(selectedNavigationDraft.iconName) ? selectedNavigationDraft.iconName : 'help-circle-outline'} size={28} color={palette.red} />
                          </View>
                          <View style={styles.adminUserHeaderText}>
                            <Text style={styles.navigationFocusTitle}>{selectedNavigationDraft.label || selectedNavigationTab.label}</Text>
                            <Text style={styles.feedMeta}>Clave interna: {selectedNavigationTab.key}</Text>
                            <Text style={styles.feedMeta}>Orden actual: {selectedNavigationTab.sortOrder}</Text>
                          </View>
                        </View>

                        <View style={styles.navigationFieldGrid}>
                          <View style={styles.navigationField}>
                            <Text style={styles.cardEyebrow}>Nombre visible</Text>
                            <TextInput
                              style={styles.input}
                              placeholder="Ej: Noticias"
                              value={selectedNavigationDraft.label}
                              onChangeText={(value) => setEditingTabs((current) => ({ ...current, [selectedNavigationTab.key]: { ...selectedNavigationDraft, label: value } }))}
                              placeholderTextColor={inputPlaceholderColor}
                            />
                          </View>
                          <View style={styles.navigationField}>
                            <Text style={styles.cardEyebrow}>Icono Ionicons</Text>
                            <TextInput
                              style={styles.input}
                              placeholder="Ej: newspaper-outline"
                              value={selectedNavigationDraft.iconName}
                              onChangeText={(value) => setEditingTabs((current) => ({ ...current, [selectedNavigationTab.key]: { ...selectedNavigationDraft, iconName: value } }))}
                              autoCapitalize="none"
                              placeholderTextColor={inputPlaceholderColor}
                            />
                          </View>
                        </View>

                        <Text style={styles.cardEyebrow}>Iconos rápidos</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navigationIconPicker}>
                          {navigationIconSuggestions.map((icon) => (
                            <TouchableOpacity key={`dedicated-${icon}`} style={[styles.navigationIconChoice, selectedNavigationDraft.iconName === icon && styles.navigationIconChoiceActive]} onPress={() => setEditingTabs((current) => ({ ...current, [selectedNavigationTab.key]: { ...selectedNavigationDraft, iconName: icon } }))}>
                              <Ionicons name={icon} size={21} color={selectedNavigationDraft.iconName === icon ? palette.white : palette.red} />
                            </TouchableOpacity>
                          ))}
                        </ScrollView>

                        <Text style={styles.cardEyebrow}>Tipo de seccion</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                          {navigationSectionTypes.map((type) => {
                            const selected = selectedNavigationDraft.sectionType === type.key;
                            const lockedInternal = defaultTabByKey.has(selectedNavigationTab.key) && type.key !== 'internal';
                            return (
                              <TouchableOpacity
                                key={`dedicated-type-${type.key}`}
                                style={[styles.filterChip, selected && styles.filterChipActive, lockedInternal && styles.disabledChip]}
                                disabled={lockedInternal}
                                onPress={() => setEditingTabs((current) => ({ ...current, [selectedNavigationTab.key]: { ...selectedNavigationDraft, sectionType: type.key } }))}
                              >
                                <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>{type.label}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                        <Text style={styles.feedMeta}>{navigationSectionTypes.find((type) => type.key === selectedNavigationDraft.sectionType)?.description ?? 'Pagina simple.'}</Text>

                        <View style={styles.navigationActionGrid}>
                          <TouchableOpacity style={styles.navigationMiniAction} onPress={() => adminMoveTab(selectedNavigationTab.key, -1)} disabled={editableTabs[0]?.key === selectedNavigationTab.key}>
                            <Ionicons name="arrow-back-outline" size={17} color={palette.red} />
                            <Text style={styles.navigationMiniActionText}>Mover izq.</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.navigationMiniAction} onPress={() => adminMoveTab(selectedNavigationTab.key, 1)} disabled={editableTabs[editableTabs.length - 1]?.key === selectedNavigationTab.key}>
                            <Ionicons name="arrow-forward-outline" size={17} color={palette.red} />
                            <Text style={styles.navigationMiniActionText}>Mover der.</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.navigationMiniAction, selectedNavigationDraft.isVisible && styles.navigationMiniActionActive]}
                            onPress={() => setEditingTabs((current) => ({ ...current, [selectedNavigationTab.key]: { ...selectedNavigationDraft, isVisible: !selectedNavigationDraft.isVisible } }))}
                          >
                            <Ionicons name={selectedNavigationDraft.isVisible ? 'eye-outline' : 'eye-off-outline'} size={17} color={selectedNavigationDraft.isVisible ? palette.white : palette.red} />
                            <Text style={[styles.navigationMiniActionText, selectedNavigationDraft.isVisible && styles.navigationMiniActionTextActive]}>{selectedNavigationDraft.isVisible ? 'Visible' : 'Oculta'}</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.navigationRolesPanel}>
                          <TouchableOpacity style={styles.navigationRolesButton} onPress={() => setNavigationRolesDropdownOpen(!navigationRolesDropdownOpen)} activeOpacity={0.85}>
                            <View style={styles.adminUserHeaderText}>
                              <Text style={styles.cardEyebrow}>Roles que ven esta sección</Text>
                              <Text style={styles.navigationRolesSummary}>{(selectedNavigationDraft.visibleRoles ?? visibleHierarchyFor(session).map((item) => item.role)).length} roles seleccionados</Text>
                            </View>
                            <Ionicons name={navigationRolesDropdownOpen ? 'chevron-up-outline' : 'chevron-down-outline'} size={18} color={palette.red} />
                          </TouchableOpacity>
                          <View style={styles.navigationSelectedRolesWrap}>
                            {(selectedNavigationDraft.visibleRoles ?? visibleHierarchyFor(session).map((item) => item.role)).slice(0, 5).map((role) => (
                              <TouchableOpacity key={`selected-role-${role}`} style={styles.navigationSelectedRoleChip} onPress={() => updateTabRole(selectedNavigationTab.key, role as Role, false)}>
                                <Text style={styles.navigationSelectedRoleText}>{roleShortLabel(role as Role)}</Text>
                                <Ionicons name="close-outline" size={13} color={palette.red} />
                              </TouchableOpacity>
                            ))}
                          </View>
                          {navigationRolesDropdownOpen ? (
                            <View style={styles.navigationRolesDropdown}>
                              {visibleHierarchyFor(session).map((role) => {
                                const roles = selectedNavigationDraft.visibleRoles ?? visibleHierarchyFor(session).map((item) => item.role);
                                const checked = roles.includes(role.role);
                                return (
                                  <TouchableOpacity key={`role-option-${role.role}`} style={styles.navigationRoleOption} onPress={() => updateTabRole(selectedNavigationTab.key, role.role as Role, !checked)} activeOpacity={0.82}>
                                    <Ionicons name={checked ? 'checkbox-outline' : 'square-outline'} size={18} color={checked ? palette.red : palette.inkMuted} />
                                    <Text style={styles.navigationRoleOptionText}>{role.label}</Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          ) : null}
                        </View>

                        <View style={styles.inlineActions}>
                          <TouchableOpacity style={[styles.primaryButton, styles.navigationLargeButton]} onPress={() => adminSaveTab(selectedNavigationTab.key, selectedNavigationTab.label)}>
                            <Ionicons name="save-outline" size={17} color={palette.white} />
                            <Text style={styles.primaryButtonText}>Guardar sección</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.secondaryButton, styles.navigationLargeButton]} onPress={() => adminDeleteTab(selectedNavigationTab.key)}>
                            <Ionicons name="trash-outline" size={17} color={palette.red} />
                            <Text style={styles.secondaryButtonText}>{(!protectedTabKeys.has(selectedNavigationTab.key) && !defaultTabByKey.has(selectedNavigationTab.key)) ? 'Eliminar' : 'No eliminable'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : null}

                    <View style={styles.navigationCreatePanel}>
                      <View style={styles.navigationCreateHeader}>
                        <Ionicons name="add-circle-outline" size={22} color={palette.red} />
                        <Text style={styles.navigationFocusTitle}>Nueva sección</Text>
                      </View>
                      <TextInput style={styles.input} placeholder="Nombre visible. Ej: Noticias" value={newTabLabel} onChangeText={setNewTabLabel} placeholderTextColor={inputPlaceholderColor} />
                      <TextInput style={styles.input} placeholder="Clave interna. Ej: noticias" value={newTabKey} onChangeText={(value) => setNewTabKey(normalizeTabKey(value))} autoCapitalize="none" placeholderTextColor={inputPlaceholderColor} />
                      <TextInput style={styles.input} placeholder="Icono. Ej: newspaper-outline" value={newTabIcon} onChangeText={setNewTabIcon} autoCapitalize="none" placeholderTextColor={inputPlaceholderColor} />
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navigationIconPicker}>
                        {navigationIconSuggestions.map((icon) => (
                          <TouchableOpacity key={`new-dedicated-${icon}`} style={[styles.navigationIconChoice, newTabIcon === icon && styles.navigationIconChoiceActive]} onPress={() => setNewTabIcon(icon)}>
                            <Ionicons name={icon} size={21} color={newTabIcon === icon ? palette.white : palette.red} />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <Text style={styles.cardEyebrow}>Tipo de seccion</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                        {navigationSectionTypes.map((type) => (
                          <TouchableOpacity key={`new-dedicated-type-${type.key}`} style={[styles.filterChip, newTabSectionType === type.key && styles.filterChipActive]} onPress={() => setNewTabSectionType(type.key)}>
                            <Text style={[styles.filterChipText, newTabSectionType === type.key && styles.filterChipTextActive]}>{type.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <Text style={styles.feedMeta}>{navigationSectionTypes.find((type) => type.key === newTabSectionType)?.description}</Text>
                      <TouchableOpacity style={styles.navigationRolesButton} onPress={() => setNewNavigationRolesDropdownOpen(!newNavigationRolesDropdownOpen)} activeOpacity={0.85}>
                        <View style={styles.adminUserHeaderText}>
                          <Text style={styles.cardEyebrow}>Roles visibles</Text>
                          <Text style={styles.navigationRolesSummary}>{newTabRoles.length} roles seleccionados</Text>
                        </View>
                        <Ionicons name={newNavigationRolesDropdownOpen ? 'chevron-up-outline' : 'chevron-down-outline'} size={18} color={palette.red} />
                      </TouchableOpacity>
                      {newNavigationRolesDropdownOpen ? (
                        <View style={styles.navigationRolesDropdown}>
                          {visibleHierarchyFor(session).map((role) => {
                            const checked = newTabRoles.includes(role.role as Role);
                            return (
                              <TouchableOpacity key={`new-role-option-${role.role}`} style={styles.navigationRoleOption} onPress={() => toggleNewTabRole(role.role as Role)} activeOpacity={0.82}>
                                <Ionicons name={checked ? 'checkbox-outline' : 'square-outline'} size={18} color={checked ? palette.red : palette.inkMuted} />
                                <Text style={styles.navigationRoleOptionText}>{role.label}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ) : null}
                      <TouchableOpacity style={[styles.primaryButton, styles.navigationLargeButton]} onPress={adminCreatePage}>
                        <Ionicons name="add-circle-outline" size={17} color={palette.white} />
                        <Text style={styles.primaryButtonText}>Crear sección</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.navigationRestoreButton} onPress={adminRestoreDefaultNavigation}>
                      <Ionicons name="refresh-circle-outline" size={18} color={palette.red} />
                      <Text style={styles.secondaryButtonText}>Restaurar navegación predeterminada</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
            <View style={styles.stack}>
              <TouchableOpacity style={[styles.profileCommunityPanel, isDark && styles.surfacePanelDark]} onPress={() => setShowLeadershipPanel((current) => !current)} activeOpacity={0.86}>
                <View style={styles.settingRow}>
                  <View style={styles.settingRowText}>
                    <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{session.role === 'administrador' ? 'Administrador' : 'Dirigencia'}</Text>
                    <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{leadershipPanelTitle(session)}</Text>
                  </View>
                  <Ionicons name={showLeadershipPanel ? 'chevron-up-outline' : 'chevron-down-outline'} size={20} color={palette.red} />
                </View>
              </TouchableOpacity>
            <View style={[styles.adminPanel, isDark && styles.surfacePanelDark, !showLeadershipPanel && styles.collapsedPanel]}>
              <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{session.role === 'administrador' ? 'Administrador' : 'Dirigencia'}</Text>
              <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{leadershipPanelTitle(session)}</Text>
              {authMessage ? <Text style={styles.adminMessage}>{authMessage}</Text> : null}
              {adminConfigDraft.settings.maintenanceMode ? (
                <View style={styles.adminStatusPill}>
                  <Ionicons name="warning-outline" size={17} color={palette.gold} />
                  <Text style={styles.adminStatusText}>Modo mantenimiento activo</Text>
                </View>
              ) : null}
              <View style={[styles.adminModuleGrid, isDark && styles.adminModuleGridDark]}>
                {enabledAdminModules.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.adminModuleButton, isDark && styles.adminModuleButtonDark, adminModule === item.key && styles.adminModuleButtonActive]}
                    onPress={() => setAdminModule(item.key as AdminModule)}
                  >
                    <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color={adminModule === item.key ? palette.white : palette.red} />
                    <Text style={[styles.adminModuleText, isDark && styles.adminModuleTextDark, adminModule === item.key && styles.adminModuleTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {adminModule === 'resumen' ? (
                <AdminOverviewPanel
                  isDark={isDark}
                  session={session}
                  adminDraftSummary={adminDraftSummary}
                  showLeadershipUsersSummary={showLeadershipUsersSummary}
                  canManageUsers={canManageUsers}
                  leadershipSummaryUsers={leadershipSummaryUsers}
                  provinceRoleLabels={provinceRoleLabels}
                  roleAliases={adminConfig.settings.roleAliases}
                  isCommunityLeader={isCommunityLeader}
                  canAdministrateCommunities={canAdministrateCommunities}
                  canOpenCommunityAdmin={canOpenCommunityAdmin}
                  onToggleLeadershipUsers={() => setShowLeadershipUsersSummary((current) => !current)}
                  onOpenCoordinations={() => setShowActiveCoordinations(true)}
                  onOpenPublicProfile={openPublicProfile}
                  onSetAdminModule={setAdminModule}
                  onSetCommunityPanel={() => setProfilePanel('comunidad')}
                  onViewAsSession={onViewAsSession}
                />
              ) : null}

              <Modal visible={showActiveCoordinations} transparent animationType="fade" onRequestClose={() => setShowActiveCoordinations(false)} statusBarTranslucent>
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalPanel, isDark && styles.surfacePanelDark]}>
                    <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowActiveCoordinations(false)} activeOpacity={0.8}>
                      <Ionicons name="close-outline" size={22} color={palette.red} />
                    </TouchableOpacity>
                    <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Coordinaciones Activas</Text>
                    <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Coordinadores nacionales y diocesanos</Text>
                    <ScrollView style={styles.leadershipUsersList} nestedScrollEnabled showsVerticalScrollIndicator>
                      {activeCoordinators.length === 0 ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>No hay coordinadores activos cargados.</Text> : null}
                      {activeCoordinators.map((user) => {
                        const role = (user.role || 'palestrista') as Role;
                        return (
                          <TouchableOpacity
                            key={`coord-${user.id}`}
                            style={[styles.leadershipUserRow, isDark && styles.surfaceRowDark]}
                            activeOpacity={0.86}
                            onPress={() => {
                              setShowActiveCoordinations(false);
                              openPublicProfile({
                                id: user.id,
                                fullName: user.full_name ?? 'Usuario sin nombre',
                                role,
                                province: user.province,
                                communityName: user.community_name,
                                avatarUrl: user.avatar_url,
                                contact: user.phone ?? '',
                                displayRoleLabel: user.display_role_label ?? null,
                                genderPreference: user.gender_preference ?? null,
                                nickname: user.nickname ?? null,
                                credentialNameMode: user.credential_name_mode ?? 'name',
                                perseveranceStartYear: user.perseverance_start_year ?? null,
                                personalPmType: user.personal_pm_type ?? null,
                                personalPmNumber: user.personal_pm_number ?? null,
                                personalPmProvince: user.personal_pm_province ?? null,
                                personalPmMotto: user.personal_pm_motto ?? user.pm_motto ?? null,
                                pmMotto: user.pm_motto ?? null
                              });
                            }}
                          >
                            <View style={styles.adminUserHeaderText}>
                              <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{user.full_name ?? 'Usuario sin nombre'}</Text>
                              <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{displayRoleLabel(role, user.province, provinceRoleLabels, adminConfig.settings.roleAliases, user.display_role_label, user.gender_preference ?? null)}</Text>
                              <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>{user.province ?? 'Nacional'} - {user.community_name ?? 'Sin comunidad'}</Text>
                            </View>
                            <Ionicons name="id-card-outline" size={18} color={palette.red} />
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
              </Modal>

              {adminModule === 'identidad' ? (
                <IdentityAdminPanel
                  config={adminConfigDraft}
                  isDark={isDark}
                  onPatch={(patch) => updateAdminConfigSection('identity', patch)}
                  onSave={() => saveAdminConfigDraft('Identidad')}
                />
              ) : null}

              {adminModule === 'home' ? (
                <HomeAdminPanel
                  config={adminConfigDraft}
                  isDark={isDark}
                  onPatch={(patch) => updateAdminConfigSection('home', patch)}
                  onToggleModule={(moduleKey) => toggleAdminConfigList('home', moduleKey)}
                  onQuickLabelChange={(moduleKey, label) => setAdminConfigDraft((current) => ({
                    ...current,
                    home: {
                      ...current.home,
                      quickAccessLabels: {
                        ...(current.home.quickAccessLabels ?? {}),
                        [moduleKey]: label
                      }
                    }
                  }))}
                  onSave={() => saveAdminConfigDraft('Home')}
                />
              ) : null}

              {adminModule === 'contenido_publicado' ? (
                <PublishedContentAdminPanel
                  appContent={appContent}
                  hiddenFallbackContent={adminConfigDraft.settings.hiddenFallbackContent ?? []}
                  isDark={isDark}
                  onEditContent={(tabKey) => {
                    setSelectedContentTab(tabKey);
                    setAdminModule('contenido_general');
                  }}
                  onToggleFallback={setFallbackContentHidden}
                />
              ) : null}

              {adminModule === 'descargas' ? (
                <DownloadsAdminPanel
                  isDark={isDark}
                  sessionRole={session?.role ?? null}
                  adminChurchDocuments={adminChurchDocuments}
                  adminMaterials={adminMaterials}
                  fallbackMaterials={materials}
                  churchDocumentEditingId={churchDocumentEditingId}
                  churchDocumentTitle={churchDocumentTitle}
                  churchDocumentTargetUrl={churchDocumentTargetUrl}
                  churchDocumentLogoUrl={churchDocumentLogoUrl}
                  churchDocumentSortOrder={churchDocumentSortOrder}
                  churchDocumentEnabled={churchDocumentEnabled}
                  materialTitle={materialTitle}
                  materialCategory={materialCategory}
                  materialFileUrl={materialFileUrl}
                  materialDescription={materialDescription}
                  materialVisibility={materialVisibility}
                  materialPermission={materialPermission}
                  onLoadMaterials={loadAdminMaterials}
                  onEditChurchDocument={editChurchDocument}
                  onMoveChurchDocument={moveChurchDocument}
                  onDuplicateChurchDocument={duplicateChurchDocument}
                  onToggleChurchDocument={toggleChurchDocument}
                  onDeleteChurchDocument={deleteChurchDocument}
                  onUploadChurchDocumentLogo={uploadChurchDocumentLogo}
                  onSaveChurchDocumentDraft={saveChurchDocumentDraft}
                  onResetChurchDocumentForm={resetChurchDocumentForm}
                  setChurchDocumentTitle={setChurchDocumentTitle}
                  setChurchDocumentTargetUrl={setChurchDocumentTargetUrl}
                  setChurchDocumentLogoUrl={setChurchDocumentLogoUrl}
                  setChurchDocumentSortOrder={setChurchDocumentSortOrder}
                  setChurchDocumentEnabled={setChurchDocumentEnabled}
                  setMaterialTitle={setMaterialTitle}
                  setMaterialCategory={setMaterialCategory}
                  setMaterialFileUrl={setMaterialFileUrl}
                  setMaterialDescription={setMaterialDescription}
                  setMaterialVisibility={setMaterialVisibility}
                  setMaterialPermission={setMaterialPermission}
                  onArchiveMaterial={adminArchiveMaterial}
                  onSaveMaterial={adminSaveMaterial}
                />
              ) : null}

              {adminModule === 'historia_admin' ? (
                <HistoryAdminPanel
                  isDark={isDark}
                  onOpenEditor={() => {
                    setSelectedContentTab('historia');
                    setAdminModule('contenido_general');
                  }}
                />
              ) : null}

              {adminModule === 'contacto_admin' ? (
                <ContactAdminPanel
                  config={adminConfigDraft}
                  session={session}
                  isDark={isDark}
                  onPatch={(patch) => updateAdminConfigSection('contact', patch)}
                  onSaveInstagram={saveInstagramConfigDraft}
                  onSaveFullContact={() => saveAdminConfigDraft('Contacto')}
                />
              ) : null}

              {adminModule === 'periodo_motivador' ? (
                <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
                  <Text style={styles.cardTitle}>Período Motivador</Text>
                  <Text style={styles.cardText}>Gestión real de PM por provincia. Solo Vocal Diocesano, Coordinador Diocesano y Administrador pueden administrar esta sección.</Text>
                  {!canManageMotivadorPanel(session) ? (
                    <View style={styles.notice}>
                      <Ionicons name="lock-closed-outline" size={20} color={palette.red} />
                      <Text style={styles.noticeText}>No tenés permisos para gestionar Períodos Motivadores.</Text>
                    </View>
                  ) : null}
                  {canManageMotivadorPanel(session) ? (
                    <>
                      <TouchableOpacity style={styles.primaryButton} onPress={() => setShowPmForm((current) => !current)}>
                        <Ionicons name={showPmForm ? 'chevron-up-outline' : 'add-circle-outline'} size={17} color={palette.white} />
                        <Text style={styles.primaryButtonText}>Cargar Nuevo PM</Text>
                      </TouchableOpacity>
                      {showPmForm ? <View style={styles.inlineEditorPanel}>
                        <Text style={styles.cardEyebrow}>{pmEditingId ? 'Editar PM' : 'Nuevo PM'}</Text>
                        <View style={styles.filterRow}>
                          {(['masculino', 'femenino'] as const).map((item) => (
                            <TouchableOpacity key={item} style={[styles.filterChip, pmGender === item && styles.filterChipActive]} onPress={() => setPmGender(item)}>
                              <Text style={[styles.filterChipText, pmGender === item && styles.filterChipTextActive]}>PM {item === 'masculino' ? 'Masculino' : 'Femenino'}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <TextInput style={styles.input} placeholder="Número de PM" value={pmNumber} onChangeText={setPmNumber} keyboardType="numeric"  placeholderTextColor={inputPlaceholderColor} />
                        <Text style={styles.cardEyebrow}>Provincia</Text>
                        <View style={styles.filterRow}>
                          {motivadorProvinceOptions.map((province) => (
                            <TouchableOpacity
                              key={province}
                              style={[styles.filterChip, pmProvince === province && styles.filterChipActive]}
                              onPress={() => session?.role === 'administrador' ? setPmProvince(province) : undefined}
                              disabled={session?.role !== 'administrador'}
                            >
                              <Text style={[styles.filterChipText, pmProvince === province && styles.filterChipTextActive]}>{province}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <TouchableOpacity style={styles.secondaryButton} onPress={() => setPmCalendarOpen(!pmCalendarOpen)}>
                          <Ionicons name="calendar-outline" size={17} color={palette.red} />
                          <Text style={styles.secondaryButtonText}>Seleccionar fechas</Text>
                        </TouchableOpacity>
                        <Text style={styles.cardText}>{selectedDatesSummary(pmSelectedDates)}</Text>
                        {pmCalendarOpen ? (
                          <View style={styles.pmCalendarPanel}>
                            <View style={styles.pmCalendarHeader}>
                              <TouchableOpacity style={styles.pmCalendarNavButton} onPress={() => setPmCalendarMonth(new Date(pmCalendarMonth.getFullYear(), pmCalendarMonth.getMonth() - 1, 1))}>
                                <Text style={styles.pmCalendarNavText}>←</Text>
                              </TouchableOpacity>
                              <Text style={styles.pmCalendarTitle}>{pmCalendarMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</Text>
                              <TouchableOpacity style={styles.pmCalendarNavButton} onPress={() => setPmCalendarMonth(new Date(pmCalendarMonth.getFullYear(), pmCalendarMonth.getMonth() + 1, 1))}>
                                <Text style={styles.pmCalendarNavText}>→</Text>
                              </TouchableOpacity>
                            </View>
                            <View style={styles.pmCalendarWeekRow}>
                              {['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'].map((day) => (
                                <Text key={day} style={styles.pmWeekdayText}>{day}</Text>
                              ))}
                            </View>
                            <View style={styles.pmCalendarGrid}>
                              {Array.from({ length: new Date(pmCalendarMonth.getFullYear(), pmCalendarMonth.getMonth(), 1).getDay() }, (_, index) => (
                                <View key={`blank-${index}`} style={styles.pmDaySpacer} />
                              ))}
                              {Array.from({ length: new Date(pmCalendarMonth.getFullYear(), pmCalendarMonth.getMonth() + 1, 0).getDate() }, (_, index) => {
                                const day = index + 1;
                                const date = isoDate(pmCalendarMonth.getFullYear(), pmCalendarMonth.getMonth(), day);
                                const selected = pmSelectedDates.includes(date);
                                return (
                                  <TouchableOpacity key={date} style={[styles.pmDayButton, selected && styles.pmDayButtonSelected]} onPress={() => togglePmDate(date)}>
                                    <Text style={[styles.pmDayText, selected && styles.pmDayTextSelected]}>{day}</Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </View>
                        ) : null}
                        <TextInput style={styles.input} placeholder="Casa de retiro" value={pmRetreatHouse} onChangeText={setPmRetreatHouse}  placeholderTextColor={inputPlaceholderColor} />
                        <TextInput style={styles.input} placeholder="Dirección de la casa de retiro" value={pmAddress} onChangeText={setPmAddress}  placeholderTextColor={inputPlaceholderColor} />
                        <TextInput style={styles.input} placeholder="Horario estimado de apertura. Ej: Viernes 18:00" value={pmOpeningTime} onChangeText={setPmOpeningTime}  placeholderTextColor={inputPlaceholderColor} />
                        <TextInput style={styles.input} placeholder="Horario estimado de clausura. Ej: Domingo 17:00" value={pmClosingTime} onChangeText={setPmClosingTime}  placeholderTextColor={inputPlaceholderColor} />
                        <TextInput style={[styles.input, styles.textArea]} placeholder="Descripcion opcional" value={pmDescription} onChangeText={setPmDescription} multiline  placeholderTextColor={inputPlaceholderColor} />
                        <TextInput style={styles.input} placeholder="URL foto del lugar opcional" value={pmPlacePhotoUrl} onChangeText={setPmPlacePhotoUrl} autoCapitalize="none"  placeholderTextColor={inputPlaceholderColor} />
                        <TextInput style={styles.input} placeholder="URL flyer o invitacion opcional" value={pmFlyerUrl} onChangeText={setPmFlyerUrl} autoCapitalize="none"  placeholderTextColor={inputPlaceholderColor} />
                        <TouchableOpacity style={[styles.filterChip, pmVisibleToLowerRoles && styles.filterChipActive]} onPress={() => setPmVisibleToLowerRoles(!pmVisibleToLowerRoles)}>
                          <Text style={[styles.filterChipText, pmVisibleToLowerRoles && styles.filterChipTextActive]}>{pmVisibleToLowerRoles ? 'Visible para inferiores a Sedimentador' : 'Invisible para inferiores a Sedimentador'}</Text>
                        </TouchableOpacity>
                        <Text style={styles.cardEyebrow}>Estado</Text>
                        <View style={styles.filterRow}>
                          {(['activo', 'inactivo', 'borrador'] as const).map((status) => (
                            <TouchableOpacity key={status} style={[styles.filterChip, pmStatus === status && styles.filterChipActive]} onPress={() => setPmStatus(status)}>
                              <Text style={[styles.filterChipText, pmStatus === status && styles.filterChipTextActive]}>{status}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <TouchableOpacity style={styles.primaryButton} onPress={submitMotivadorPeriod}>
                          <Text style={styles.primaryButtonText}>{pmEditingId ? 'Guardar cambios' : 'Crear PM'}</Text>
                        </TouchableOpacity>
                        {pmEditingId ? (
                          <TouchableOpacity style={styles.secondaryButton} onPress={resetMotivadorForm}>
                            <Text style={styles.secondaryButtonText}>Cancelar edición</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View> : null}
                      <SectionTitle title="PM cargados" />
                      <View style={styles.pmFilterGrid}>
                        {session?.role === 'administrador' ? renderPmFilterDropdown(
                          'province',
                          'Provincia',
                          pmProvinceFilter,
                          [{ label: 'Todas', value: '' }, ...motivadorProvinceOptions.map((province) => ({ label: province, value: province }))],
                          setPmProvinceFilter
                        ) : null}
                        {renderPmFilterDropdown(
                          'gender',
                          'Tipo',
                          pmGenderFilter,
                          [
                            { label: 'Todos', value: 'todos' },
                            { label: 'Masculino', value: 'masculino' },
                            { label: 'Femenino', value: 'femenino' }
                          ],
                          setPmGenderFilter
                        )}
                        {renderPmFilterDropdown(
                          'status',
                          'Estado',
                          pmStatusFilter,
                          [
                            { label: 'Todos', value: 'todos' },
                            { label: 'Activo', value: 'activo' },
                            { label: 'Inactivo', value: 'inactivo' },
                            { label: 'Borrador', value: 'borrador' }
                          ],
                          setPmStatusFilter
                        )}
                        {renderPmFilterDropdown(
                          'time',
                          'Fecha',
                          pmTimeFilter,
                          [
                            { label: 'Todos', value: 'todos' },
                            { label: 'Proximos', value: 'proximos' },
                            { label: 'Pasados', value: 'pasados' }
                          ],
                          setPmTimeFilter
                        )}
                        {renderPmFilterDropdown(
                          'year',
                          'Año',
                          pmYearFilter,
                          [{ label: 'Todos', value: 'todos' }, ...motivadorYearOptions.map((year) => ({ label: year, value: year }))],
                          setPmYearFilter
                        )}
                      </View>
                      {filteredMotivadorPeriods.length === 0 ? <Text style={styles.cardText}>No hay PM cargados para los filtros seleccionados.</Text> : null}
                      {filteredMotivadorPeriods.map((period) => (
                        <View key={period.id} style={styles.adminListRow}>
                          <Ionicons name="flame-outline" size={20} color={palette.red} />
                          <View style={styles.adminUserHeaderText}>
                            <Text style={styles.cardTitle}>PM {period.gender === 'femenino' ? 'Femenino' : 'Masculino'} {period.pm_number} - {period.province}</Text>
                            <Text style={styles.cardText}>Fechas: {selectedDatesSummary(period.selected_dates?.map((date) => String(date).slice(0, 10)) ?? [period.starts_on, period.ends_on])}</Text>
                            <Text style={styles.cardText}>Casa: {period.retreat_house}. Dirección: {period.address}</Text>
                            <Text style={styles.cardText}>Apertura: {period.opening_time ?? 'Sin horario'} - Clausura: {period.closing_time ?? 'Sin horario'}</Text>
                            <Text style={styles.cardText}>Estado: {period.status}. Última edición: {period.updated_by_name ?? 'Sin registro'}</Text>
                            <View style={styles.inlineActions}>
                              <TouchableOpacity style={styles.rowActionButton} onPress={() => editMotivadorPeriod(period)}>
                                <Ionicons name="create-outline" size={14} color={palette.red} />
                                <Text style={styles.rowActionButtonText}>Editar</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.rowActionButton} onPress={() => updateMotivadorStatus(period.id, period.status === 'activo' ? 'inactivo' : 'activo')}>
                                <Ionicons name={period.status === 'activo' ? 'pause-circle-outline' : 'checkmark-circle-outline'} size={14} color={palette.red} />
                                <Text style={styles.rowActionButtonText}>{period.status === 'activo' ? 'Inhabilitar' : 'Habilitar'}</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={[styles.rowActionButton, styles.rowActionButtonDanger]} onPress={() => updateMotivadorStatus(period.id, 'archivado')}>
                                <Ionicons name="trash-outline" size={14} color="#B93232" />
                                <Text style={[styles.rowActionButtonText, styles.rowActionButtonTextDanger]}>Eliminar</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      ))}
                    </>
                  ) : null}
                </View>
              ) : null}

              {adminModule === 'permisos_roles' ? (
                <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
                  <Text style={styles.cardTitle}>Permisos de Rangos</Text>
                  <Text style={styles.cardText}>Activa o desactiva permisos reales por rango. Los cambios se guardan en Supabase, se leen al iniciar sesion y actualizan la sesion actual si corresponde.</Text>
                  <Text style={styles.cardEyebrow}>Rango</Text>
                  <TouchableOpacity style={styles.dropdownButton} onPress={() => setPermissionRoleDropdownOpen(!permissionRoleDropdownOpen)}>
                    <Text style={styles.dropdownButtonText}>{roleLabel(permissionRole)}</Text>
                    <Ionicons name={permissionRoleDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                  </TouchableOpacity>
                  {permissionRoleDropdownOpen ? (
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                      {roleDefinitions.map((role) => (
                        <TouchableOpacity key={role.role} style={styles.dropdownItem} onPress={() => {
                          const nextRole = role.role as Role;
                          setPermissionRole(nextRole);
                          setRolePermissionDraft(rolePermissions[nextRole] ?? []);
                          setRolePermissionRows([]);
                          setPermissionRoleDropdownOpen(false);
                          loadRolePermissionDraft(nextRole);
                        }}>
                          <Text style={styles.dropdownItemText}>{role.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : null}
                  <View style={styles.inlineActions}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => loadRolePermissionDraft(permissionRole)}>
                      <Ionicons name="refresh-outline" size={17} color={palette.red} />
                      <Text style={styles.secondaryButtonText}>Cargar permisos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButton} onPress={saveRolePermissionDraft}>
                      <Ionicons name="save-outline" size={17} color={palette.white} />
                      <Text style={styles.primaryButtonText}>Guardar permisos</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cardEyebrow}>Permisos disponibles</Text>
                  <Text style={styles.cardText}>Activos: {rolePermissionDraft.length} de {permissionOptions.length}. Inactivos: {permissionOptions.length - rolePermissionDraft.length}.</Text>
                  <View style={styles.permissionGrid}>
                    {permissionOptions.map((permission) => {
                      const checked = rolePermissionDraft.includes(permission.key);
                      const remoteRow = rolePermissionRows.find((item) => item.permission_key === permission.key);
                      return (
                        <TouchableOpacity key={permission.key} style={[styles.permissionToggle, checked && styles.permissionToggleActive]} onPress={() => toggleRolePermission(permission.key)} activeOpacity={0.85}>
                          <Ionicons name={checked ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={checked ? palette.white : palette.red} />
                          <View style={styles.adminUserHeaderText}>
                            <Text style={[styles.permissionToggleTitle, checked && styles.permissionToggleTitleActive]}>{remoteRow?.permission_label || permission.label}</Text>
                            <Text style={[styles.permissionToggleMeta, checked && styles.permissionToggleMetaActive]}>{permission.key}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {adminModule === 'etiquetas_roles' ? (
                <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
                  <Text style={styles.cardTitle}>Nombres visibles por provincia</Text>
                  <Text style={styles.cardText}>Personaliza como se ve un rango en una provincia sin cambiar su role_key interno, permisos ni jerarquia.</Text>
                  <Text style={styles.cardEyebrow}>Provincia</Text>
                  <TouchableOpacity style={styles.dropdownButton} onPress={() => setRoleLabelProvinceDropdownOpen(!roleLabelProvinceDropdownOpen)}>
                    <Text style={styles.dropdownButtonText}>{roleLabelProvince || 'Seleccionar provincia'}</Text>
                    <Ionicons name={roleLabelProvinceDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                  </TouchableOpacity>
                  {roleLabelProvinceDropdownOpen ? (
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                      {registrationCommunities.map((item) => (
                        <TouchableOpacity key={item.province} style={styles.dropdownItem} onPress={() => { setRoleLabelProvince(item.province); setRoleLabelProvinceDropdownOpen(false); }}>
                          <Text style={styles.dropdownItemText}>{item.province}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : null}
                  <Text style={styles.cardEyebrow}>Rango interno</Text>
                  <TouchableOpacity style={styles.dropdownButton} onPress={() => setRoleLabelRoleDropdownOpen(!roleLabelRoleDropdownOpen)}>
                    <Text style={styles.dropdownButtonText}>{roleLabel(roleLabelRole)}</Text>
                    <Ionicons name={roleLabelRoleDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                  </TouchableOpacity>
                  {roleLabelRoleDropdownOpen ? (
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                      {roleDefinitions.filter((role) => role.role !== 'invitado' && role.role !== 'administrador').map((role) => (
                        <TouchableOpacity key={role.role} style={styles.dropdownItem} onPress={() => { setRoleLabelRole(role.role as Role); setRoleLabelRoleDropdownOpen(false); }}>
                          <Text style={styles.dropdownItemText}>{role.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : null}
                  <TextInput style={styles.input} placeholder="Nombre visible para esta provincia" value={roleLabelDraft} onChangeText={setRoleLabelDraft} placeholderTextColor={inputPlaceholderColor} />
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Descripcion interna opcional" value={roleLabelDescription} onChangeText={setRoleLabelDescription} multiline placeholderTextColor={inputPlaceholderColor} />
                  <TouchableOpacity style={[styles.adminListRow, roleLabelActive && styles.adminListRowActive]} onPress={() => setRoleLabelActive(!roleLabelActive)}>
                    <Ionicons name={roleLabelActive ? 'toggle' : 'toggle-outline'} size={24} color={roleLabelActive ? palette.red : palette.inkMuted} />
                    <Text style={styles.adminQuickText}>{roleLabelActive ? 'Etiqueta activa' : 'Etiqueta inactiva: se usa nombre estandar'}</Text>
                  </TouchableOpacity>
                  <View style={styles.profileCommunityPanel}>
                    <Text style={styles.cardEyebrow}>Vista previa</Text>
                    <Text style={styles.cardTitle}>{roleLabelForProvince(roleLabelRole, roleLabelProvince, provinceRoleLabels)}</Text>
                    <Text style={styles.cardText}>Interno: {roleLabelRole}. Los permisos siguen usando este valor interno.</Text>
                  </View>
                  <View style={styles.inlineActions}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={loadProvinceRoleLabels}>
                      <Ionicons name="refresh-outline" size={17} color={palette.red} />
                      <Text style={styles.secondaryButtonText}>Cargar etiquetas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButton} onPress={saveProvinceRoleLabelDraft}>
                      <Ionicons name="save-outline" size={17} color={palette.white} />
                      <Text style={styles.primaryButtonText}>Guardar etiqueta</Text>
                    </TouchableOpacity>
                  </View>
                  {provinceRoleLabels.length > 0 ? (
                    <View style={styles.profileCommunityPanel}>
                      <Text style={styles.cardEyebrow}>Etiquetas cargadas</Text>
                      {provinceRoleLabels.map((item) => (
                        <View key={item.id} style={styles.adminListRow}>
                          <Ionicons name={item.is_active ? 'pricetag-outline' : 'eye-off-outline'} size={20} color={palette.red} />
                          <View style={styles.adminUserHeaderText}>
                            <Text style={styles.adminQuickText}>{item.province} - {roleLabel(item.role_key as Role)}</Text>
                            <Text style={styles.cardText}>{item.display_label}{item.is_active ? '' : ' (inactiva)'}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {adminModule === 'rangos_alias' ? (
                <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
                  <Text style={styles.cardTitle}>Duplicar / renombrar rangos</Text>
                  <Text style={styles.cardText}>Crea alias asignables que heredan permisos y jerarquia del rango base. Se guardan en Supabase y se aplican al usuario como nombre visible persistente.</Text>
                  <Text style={styles.cardEyebrow}>Rango base</Text>
                  <TouchableOpacity style={styles.dropdownButton} onPress={() => setRoleAliasRoleDropdownOpen(!roleAliasRoleDropdownOpen)}>
                    <Text style={styles.dropdownButtonText}>{roleLabel(roleAliasBaseRole)}</Text>
                    <Ionicons name={roleAliasRoleDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                  </TouchableOpacity>
                  {roleAliasRoleDropdownOpen ? (
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                      {roleDefinitions.filter((role) => role.role !== 'invitado' && role.role !== 'administrador').map((role) => (
                        <TouchableOpacity key={role.role} style={styles.dropdownItem} onPress={() => { setRoleAliasBaseRole(role.role as Role); setRoleAliasRoleDropdownOpen(false); }}>
                          <Text style={styles.dropdownItemText}>{role.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : null}
                  <TextInput style={styles.input} placeholder="Nuevo nombre visible" value={roleAliasLabel} onChangeText={setRoleAliasLabel} placeholderTextColor={inputPlaceholderColor} />
                  <TouchableOpacity style={[styles.adminListRow, roleAliasIsGlobal && styles.adminListRowActive]} onPress={() => setRoleAliasIsGlobal(!roleAliasIsGlobal)}>
                    <Ionicons name={roleAliasIsGlobal ? 'earth-outline' : 'map-outline'} size={22} color={palette.red} />
                    <Text style={styles.adminQuickText}>{roleAliasIsGlobal ? 'Aplica globalmente' : 'Aplica por provincia'}</Text>
                  </TouchableOpacity>
                  {!roleAliasIsGlobal ? (
                    <>
                      <Text style={styles.cardEyebrow}>Provincia</Text>
                      <TouchableOpacity style={styles.dropdownButton} onPress={() => setRoleAliasProvinceDropdownOpen(!roleAliasProvinceDropdownOpen)}>
                        <Text style={styles.dropdownButtonText}>{roleAliasProvince || 'Seleccionar provincia'}</Text>
                        <Ionicons name={roleAliasProvinceDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                      </TouchableOpacity>
                      {roleAliasProvinceDropdownOpen ? (
                        <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                          {registrationCommunities.map((item) => (
                            <TouchableOpacity key={item.province} style={styles.dropdownItem} onPress={() => { setRoleAliasProvince(item.province); setRoleAliasProvinceDropdownOpen(false); }}>
                              <Text style={styles.dropdownItemText}>{item.province}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      ) : null}
                    </>
                  ) : null}
                  <TouchableOpacity style={[styles.adminListRow, roleAliasActive && styles.adminListRowActive]} onPress={() => setRoleAliasActive(!roleAliasActive)}>
                    <Ionicons name={roleAliasActive ? 'toggle' : 'toggle-outline'} size={24} color={roleAliasActive ? palette.red : palette.inkMuted} />
                    <Text style={styles.adminQuickText}>{roleAliasActive ? 'Alias activo y visible' : 'Alias guardado inactivo'}</Text>
                  </TouchableOpacity>
                  <View style={styles.profileCommunityPanel}>
                    <Text style={styles.cardEyebrow}>Vista previa</Text>
                    <Text style={styles.cardTitle}>{roleAliasLabel.trim() || roleLabel(roleAliasBaseRole)}</Text>
                    <Text style={styles.cardText}>Hereda permisos de {roleLabel(roleAliasBaseRole)}. Alcance: {roleAliasIsGlobal ? 'global' : roleAliasProvince || 'provincia pendiente'}.</Text>
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={saveRoleAliasDraft}>
                    <Ionicons name="save-outline" size={17} color={palette.white} />
                    <Text style={styles.primaryButtonText}>Guardar alias</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => loadRoleAliases(true)}>
                    <Ionicons name="refresh-outline" size={17} color={palette.red} />
                    <Text style={styles.secondaryButtonText}>Cargar alias</Text>
                  </TouchableOpacity>
                  <Text style={styles.cardEyebrow}>Alias guardados</Text>
                  {roleAliases.length === 0 ? <Text style={styles.cardText}>No hay alias cargados.</Text> : null}
                  {roleAliases.map((alias) => (
                    <View key={alias.id} style={[styles.adminListRow, !alias.is_active && styles.lockedCard]}>
                      <Ionicons name="copy-outline" size={20} color={palette.red} />
                      <View style={styles.adminUserHeaderText}>
                        <Text style={styles.adminQuickText}>{alias.display_label}</Text>
                        <Text style={styles.cardText}>Base: {roleLabel(alias.base_role as Role)} - {alias.province ?? 'Global'} - {alias.is_active ? 'activo' : 'inactivo'}</Text>
                      </View>
                      <TouchableOpacity style={styles.actionPill} onPress={() => toggleSavedRoleAlias(alias.id, !alias.is_active)}>
                        <Text style={styles.actionPillText}>{alias.is_active ? 'Desactivar' : 'Activar'}</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : null}

              {adminModule === 'configuracion' ? (
                <GeneralSettingsAdminPanel
                  config={adminConfigDraft}
                  isDark={isDark}
                  onPatch={(patch) => updateAdminConfigSection('settings', patch)}
                  onSave={() => saveAdminConfigDraft('Configuraci?n general')}
                />
              ) : null}

              {adminModule === 'intenciones' && session?.role === 'administrador' ? (
                <IntentionsAdminPanel
                  config={adminConfigDraft}
                  isDark={isDark}
                  intentions={myPrayerIntentions}
                  message={prayerIntentionsMessage}
                  onPatch={(patch) => updateAdminConfigSection('intentions', patch)}
                  onSave={() => saveAdminConfigDraft('Intenciones')}
                  onLoad={loadPrayerIntentionsPanel}
                  onDelete={deletePrayerIntentionFromAdmin}
                />
              ) : null}

              {adminModule === 'moderacion' && ['administrador', 'coordinador_nacional', 'vocal_nacional', 'coordinador_diocesano'].includes(session?.role ?? 'invitado') ? (
                <MessageModerationAdminPanel isDark={isDark} onMessage={setAuthMessage} />
              ) : null}

              {adminModule === 'proceso_educativo' && canManageFormationPath ? (
                <FormationPathAdminPanel session={session} isDark={isDark} />
              ) : null}

              {adminModule === 'evangelio_dia' && session?.role === 'administrador' ? (
                <DailyGospelAdminPanel
                  config={adminConfigDraft}
                  isDark={isDark}
                  onPatch={(patch) => updateAdminConfigSection('gospel', patch)}
                  onSave={() => saveAdminConfigDraft('Evangelio del Dia')}
                />
              ) : null}

                  {adminModule === 'configuracion' && session?.role === 'administrador' ? (
                    <View style={styles.inlineEditorPanel}>
                      <Text style={styles.cardEyebrow}>Noticias de la Iglesia</Text>
                      <Text style={styles.cardText}>Controla el carrusel externo visible en Noticias. Se guarda en app_runtime_config.</Text>
                      <TouchableOpacity style={[styles.adminListRow, runtimeConfigDraft.catholicNews.enabled && styles.adminListRowActive]} onPress={() => updateRuntimeCatholicNews({ enabled: !runtimeConfigDraft.catholicNews.enabled })}>
                        <Ionicons name={runtimeConfigDraft.catholicNews.enabled ? 'toggle' : 'toggle-outline'} size={24} color={runtimeConfigDraft.catholicNews.enabled ? palette.red : palette.inkMuted} />
                        <Text style={styles.adminQuickText}>{runtimeConfigDraft.catholicNews.enabled ? 'Carrusel activo' : 'Carrusel desactivado'}</Text>
                      </TouchableOpacity>
                      <Text style={styles.inputLabel}>Cantidad maxima de noticias</Text>
                      <View style={styles.filterRow}>
                        {[3, 4, 5, 6].map((amount) => (
                          <TouchableOpacity key={amount} style={[styles.filterChip, runtimeConfigDraft.catholicNews.maxItems === amount && styles.filterChipActive]} onPress={() => updateRuntimeCatholicNews({ maxItems: amount })}>
                            <Text style={[styles.filterChipText, runtimeConfigDraft.catholicNews.maxItems === amount && styles.filterChipTextActive]}>{amount}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <Text style={styles.cardEyebrow}>Fuentes</Text>
                      {([
                        { key: 'vatican', label: 'Vatican News' },
                        { key: 'episcopado', label: 'Episcopado Argentino' },
                        { key: 'aci', label: 'ACI Prensa' }
                      ] as Array<{ key: CatholicNewsSourceKey; label: string }>).map((source) => {
                        const active = runtimeConfigDraft.catholicNews.sources[source.key] !== false;
                        return (
                          <View key={source.key} style={[styles.profileCommunityPanel, active && styles.adminListRowActive]}>
                            <TouchableOpacity style={styles.adminListRow} onPress={() => updateRuntimeCatholicNews({ sources: { [source.key]: !active } as Partial<Record<CatholicNewsSourceKey, boolean>> })}>
                              <Ionicons name={active ? 'checkbox-outline' : 'square-outline'} size={22} color={active ? palette.red : palette.inkMuted} />
                              <Text style={styles.adminQuickText}>{runtimeConfigDraft.catholicNews.sourceLabels[source.key] || source.label}</Text>
                            </TouchableOpacity>
                            <TextInput
                              style={styles.input}
                              placeholder="Nombre visible de la fuente"
                              value={runtimeConfigDraft.catholicNews.sourceLabels[source.key] ?? source.label}
                              onChangeText={(value) => updateRuntimeCatholicNews({ sourceLabels: { [source.key]: value } as Partial<Record<CatholicNewsSourceKey, string>> })}
                              placeholderTextColor={inputPlaceholderColor}
                            />
                            <TextInput
                              style={styles.input}
                              placeholder="Link RSS o pagina fuente"
                              value={runtimeConfigDraft.catholicNews.sourceUrls[source.key] ?? ''}
                              onChangeText={(value) => updateRuntimeCatholicNews({ sourceUrls: { [source.key]: value } as Partial<Record<CatholicNewsSourceKey, string>> })}
                              autoCapitalize="none"
                              placeholderTextColor={inputPlaceholderColor}
                            />
                          </View>
                        );
                      })}
                      <Text style={styles.cardEyebrow}>Orden visual</Text>
                      <View style={styles.filterRow}>
                        {runtimeConfigDraft.catholicNews.sourceOrder.map((sourceKey, index) => (
                          <TouchableOpacity
                            key={`${sourceKey}-${index}`}
                            style={styles.filterChip}
                            onPress={() => {
                              const order = [...runtimeConfigDraft.catholicNews.sourceOrder];
                              if (index === 0) {
                                order.push(order.shift() as CatholicNewsSourceKey);
                              } else {
                                [order[index - 1], order[index]] = [order[index], order[index - 1]];
                              }
                              updateRuntimeCatholicNews({ sourceOrder: order });
                            }}
                          >
                            <Text style={styles.filterChipText}>{index + 1}. {sourceKey}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TouchableOpacity style={styles.primaryButton} onPress={saveRuntimeConfigDraft}>
                        <Text style={styles.primaryButtonText}>Guardar carrusel externo</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

              {adminModule === 'usuarios' ? (
                <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
                  <Text style={styles.cardTitle}>Usuarios registrados</Text>
                  <AdminUsersToolMenu
                    role={session.role}
                    tool={adminUsersTool}
                    open={adminUsersToolMenuOpen}
                    isDark={isDark}
                    onToggle={() => setAdminUsersToolMenuOpen((current) => !current)}
                    onSelect={(tool) => { setAdminUsersTool(tool); setAdminUsersToolMenuOpen(false); setSelectedAdminUserId(''); }}
                  />
                  {session.role === 'administrador' && adminUsersTool === 'crear' ? (
                    <View style={styles.profileCommunityPanel}>
                      <Text style={styles.cardEyebrow}>Crear usuario básico</Text>
                      <Text style={styles.cardText}>Crea una cuenta habilitada con mail y contraseña. Al ingresar, el usuario deberá completar provincia y comunidad.</Text>
                      <Text style={styles.inputLabel}>Mail</Text>
                      <TextInput style={styles.input} placeholder="Ingresá el correo electrónico" value={adminCreateEmail} onChangeText={setAdminCreateEmail} autoCapitalize="none" keyboardType="email-address"  placeholderTextColor={inputPlaceholderColor} />
                      <Text style={styles.inputLabel}>Contraseña</Text>
                      <View style={styles.passwordInputWrap}>
                        <TextInput
                          style={[styles.input, styles.inputWithIcon]}
                          placeholder="Mínimo 6 caracteres"
                          value={adminCreatePassword}
                          onChangeText={setAdminCreatePassword}
                          secureTextEntry={!adminCreatePasswordVisible}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                         placeholderTextColor={inputPlaceholderColor} />
                        <TouchableOpacity style={styles.passwordEyeButton} onPress={() => setAdminCreatePasswordVisible(!adminCreatePasswordVisible)} activeOpacity={0.82}>
                          <Ionicons name={adminCreatePasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={palette.red} />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity style={styles.primaryButton} onPress={createBasicAdminUser}>
                        <Text style={styles.primaryButtonText}>Crear usuario</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                  {adminUsersTool === 'listado' ? (
                    <>
                      <TextInput style={styles.input} placeholder="Buscar por nombre, apellido o apodo" value={adminUserSearch} onChangeText={setAdminUserSearch}  placeholderTextColor={inputPlaceholderColor} />
                      <View style={styles.communityActionRow}>
                        <TouchableOpacity style={styles.communityMiniButton} onPress={loadAdminUsers} activeOpacity={0.85}>
                          <Ionicons name="refresh-outline" size={15} color={palette.red} />
                          <Text style={styles.communityMiniButtonText}>Actualizar usuarios</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : null}
                  {session.role === 'administrador' && adminUsersTool === 'diagnostico' ? (
                    <View style={styles.profileCommunityPanel}>
                      <Text style={styles.cardEyebrow}>Diagnostico y liberacion de login</Text>
                      <Text style={styles.cardText}>Usalo cuando un mail no puede ingresar, no aparece en usuarios o quedo atrapado en Auth/Profile.</Text>
                      <TextInput style={styles.input} placeholder="Mail a diagnosticar" value={adminDiagnosticEmail} onChangeText={setAdminDiagnosticEmail} autoCapitalize="none" keyboardType="email-address"  placeholderTextColor={inputPlaceholderColor} />
                      <View style={styles.inlineActions}>
                        <TouchableOpacity style={styles.secondaryButton} onPress={diagnoseUserLogin}>
                          <Ionicons name="search-outline" size={17} color={palette.red} />
                          <Text style={styles.secondaryButtonText}>Diagnosticar login</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryButton} onPress={repairUserLogin}>
                          <Ionicons name="construct-outline" size={17} color={palette.red} />
                          <Text style={styles.secondaryButtonText}>Reparar usuario</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.rowActionButton, styles.rowActionButtonDanger]} onPress={deleteUserByDiagnosticEmail}>
                          <Ionicons name="trash-outline" size={14} color="#B93232" />
                          <Text style={[styles.rowActionButtonText, styles.rowActionButtonTextDanger]}>Eliminar y liberar mail</Text>
                        </TouchableOpacity>
                      </View>
                      {adminLoginDiagnostic ? (
                        <View style={styles.innerNewsCard}>
                          <Text style={styles.cardTitle}>Informe de {adminLoginDiagnostic.searched_email}</Text>
                          <Text style={styles.cardText}>Auth: {adminLoginDiagnostic.auth_exists ? 'existe' : 'no existe'} ({adminLoginDiagnostic.auth_count})</Text>
                          <Text style={styles.cardText}>Auth email: {adminLoginDiagnostic.auth_email ?? 'sin email'} - creado: {adminLoginDiagnostic.auth_created_at ? new Date(adminLoginDiagnostic.auth_created_at).toLocaleString('es-AR') : 'sin fecha'}</Text>
                          <Text style={styles.cardText}>Identities: {adminLoginDiagnostic.identity_exists ? 'existe' : 'no existe'} ({adminLoginDiagnostic.identities_count ?? 0}) - {adminLoginDiagnostic.identities_provider ?? 'sin provider'}</Text>
                          <Text style={styles.cardText}>Profile: {adminLoginDiagnostic.profile_exists ? 'existe' : 'no existe'} ({adminLoginDiagnostic.profile_count})</Text>
                          <Text style={styles.cardText}>Confirmado: {adminLoginDiagnostic.email_confirmed_at ? 'si' : 'no'}</Text>
                          <Text style={styles.cardText}>Estado/Rol: {adminLoginDiagnostic.profile_status ?? adminLoginDiagnostic.status ?? 'sin estado'} - {adminLoginDiagnostic.profile_role ?? adminLoginDiagnostic.role ?? 'sin rol'}</Text>
                          <Text style={styles.cardText}>Provincia/Comunidad: {adminLoginDiagnostic.province ?? 'sin provincia'} - {adminLoginDiagnostic.community ?? 'sin comunidad'}</Text>
                          <Text style={styles.cardText}>Backups: {adminLoginDiagnostic.backups_exists ? `si (${adminLoginDiagnostic.backup_count ?? 0})` : 'no'}</Text>
                          <Text style={styles.cardText}>Solicitudes/Tokens/Mensajes: {adminLoginDiagnostic.user_requests_exists ? 'solicitudes ' : ''}{adminLoginDiagnostic.device_push_tokens_exists ? 'tokens ' : ''}{adminLoginDiagnostic.internal_messages_exists ? 'mensajes' : ''}{(!adminLoginDiagnostic.user_requests_exists && !adminLoginDiagnostic.device_push_tokens_exists && !adminLoginDiagnostic.internal_messages_exists) ? 'sin relaciones visibles' : ''}</Text>
                          <Text style={styles.cardText}>Tablas afectadas: {adminLoginDiagnostic.affected_tables?.length ? adminLoginDiagnostic.affected_tables.join(' | ') : 'sin tablas activas detectadas'}</Text>
                          <Text style={styles.cardText}>Inconsistencias: {adminLoginDiagnostic.inconsistencies?.length ? adminLoginDiagnostic.inconsistencies.join(' | ') : 'Sin inconsistencias evidentes'}</Text>
                          <Text style={styles.cardText}>Causa probable: {adminLoginDiagnostic.possible_cause}</Text>
                          <Text style={styles.cardText}>Accion recomendada: {adminLoginDiagnostic.recommended_action}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                  {adminUsersTool === 'listado' && adminUsers.length === 0 ? <Text style={styles.cardText}>No hay usuarios cargados.</Text> : null}
                  {adminUsersTool === 'listado' && userProvinceOptions.length > 0 ? (
                    <>
                      <Text style={styles.cardEyebrow}>Provincia</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                        {userProvinceOptions.map((province) => (
                          <TouchableOpacity key={province} style={[styles.filterChip, selectedUsersProvince === province && styles.filterChipActive]} onPress={() => { setSelectedUsersProvince(province); setSelectedAdminUserId(''); }}>
                            <Text style={[styles.filterChipText, selectedUsersProvince === province && styles.filterChipTextActive]}>{province}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  ) : null}
                  {selectedUsersProvince && adminUsersTool === 'listado' ? (
                    <View style={styles.profileCommunityPanel}>
                      <Text style={styles.cardEyebrow}>{selectedUsersProvince}</Text>
                      {visibleAdminUsers.length === 0 ? <Text style={styles.cardText}>No hay usuarios para esta provincia.</Text> : null}
                      {visibleAdminUsers.map((user) => {
                        const selected = selectedAdminUserId === user.id;
                        const canEditThisUser = canEditAdminUser(session, user);
                        return (
                          <View key={user.id}>
                            <View style={[styles.innerNewsCard, !canEditThisUser && styles.lockedCard]}>
                              <View style={styles.adminUserHeader}>
                                <View style={styles.adminUserAvatar}>
                                  {user.avatar_url ? <Image source={{ uri: user.avatar_url }} style={styles.adminUserAvatarImage} /> : <Ionicons name="person-outline" size={20} color={palette.red} />}
                                </View>
                                <View style={styles.adminUserHeaderText}>
                                  <Text style={styles.cardTitle}>{user.full_name ?? 'Usuario sin nombre'}</Text>
                                  <Text style={styles.cardText}>{user.status} - {displayRoleLabel((user.role || 'palestrista') as Role, user.province, provinceRoleLabels, adminConfig.settings.roleAliases, user.display_role_label, user.gender_preference ?? null)} - {user.community_name ?? 'Sin comunidad'}</Text>
                                  {user.subrole_key ? <Text style={styles.feedMeta}>Subrango: {subroleLabel(user.subrole_key, user.gender_preference ?? null)}</Text> : null}
                                  {perseveranceLabel(user.perseverance_start_year) ? <Text style={styles.feedMeta}>{perseveranceLabel(user.perseverance_start_year)}</Text> : null}
                                  {session.role === 'administrador' ? <Text style={styles.cardText}>{user.email ?? 'Sin email'}</Text> : null}
                                </View>
                              </View>
                              {session.role === 'administrador' ? <Text style={styles.cardText}>Email: {user.email_confirmed_at ? 'confirmado' : 'sin confirmar'}</Text> : null}
                              <TouchableOpacity
                                style={styles.actionPill}
                                onPress={() => openPublicProfile({
                                  id: user.id,
                                  fullName: user.full_name ?? 'Usuario sin nombre',
                                  role: (user.role || 'palestrista') as Role,
                                  province: user.province,
                                  communityName: user.community_name,
                                  avatarUrl: user.avatar_url,
                                  contact: user.phone ?? '',
                                  displayRoleLabel: user.display_role_label ?? null,
                                  genderPreference: user.gender_preference ?? null,
                                  nickname: user.nickname ?? null,
                                  credentialNameMode: user.credential_name_mode ?? 'name',
                                  perseveranceStartYear: user.perseverance_start_year ?? null,
                                  personalPmType: user.personal_pm_type ?? null,
                                  personalPmNumber: user.personal_pm_number ?? null,
                                  personalPmProvince: user.personal_pm_province ?? null,
                                  personalPmMotto: user.personal_pm_motto ?? user.pm_motto ?? null,
                                  pmMotto: user.pm_motto ?? null
                                })}
                              >
                                <Ionicons name="person-circle-outline" size={16} color={palette.red} />
                                <Text style={styles.actionPillText}>Ver perfil</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.actionPill, !canEditThisUser && styles.lockedCard]}
                                onPress={() => canEditThisUser ? setSelectedAdminUserId(selected ? '' : user.id) : setAuthMessage('No podes editar administradores, usuarios superiores o usuarios fuera de tu alcance.')}
                              >
                                <Ionicons name={selected ? 'close-outline' : 'create-outline'} size={16} color={palette.red} />
                                <Text style={styles.actionPillText}>{selected ? 'Cerrar' : 'Editar'}</Text>
                              </TouchableOpacity>
                              {!canEditThisUser ? <Text style={styles.expandHint}>Edición bloqueada por jerarquía</Text> : null}
                            </View>
                            {selected ? (
                              <View style={styles.adminInlineEditor}>
                                <TextInput style={styles.input} placeholder="Nombre y apellido" value={adminUserFullName} onChangeText={setAdminUserFullName}  placeholderTextColor={inputPlaceholderColor} />
                                {session.role === 'administrador' ? (
                                  <>
                                    <TextInput style={styles.input} placeholder="Email" value={adminUserEmail} onChangeText={setAdminUserEmail} autoCapitalize="none"  placeholderTextColor={inputPlaceholderColor} />
                                    <TextInput style={styles.input} placeholder="Nueva contraseña opcional" value={adminUserPassword} onChangeText={setAdminUserPassword} secureTextEntry  placeholderTextColor={inputPlaceholderColor} />
                                  </>
                                ) : (
                                  null
                                )}
                                <TextInput style={styles.input} placeholder="Contacto" value={adminUserPhone} onChangeText={setAdminUserPhone}  placeholderTextColor={inputPlaceholderColor} />
                                <TextInput style={styles.input} placeholder="Apodo" value={adminUserNickname} onChangeText={setAdminUserNickname}  placeholderTextColor={inputPlaceholderColor} />
                                <View style={styles.settingRow}>
                                  <View style={styles.settingRowText}>
                                    <Text style={styles.cardTitle}>Usar apodo en saludos</Text>
                                    <Text style={styles.cardText}>Aplica en Home y saludos si el apodo esta cargado.</Text>
                                  </View>
                                  <Switch
                                    value={adminUserUseNicknameInGreetings}
                                    onValueChange={setAdminUserUseNicknameInGreetings}
                                    trackColor={{ false: 'rgba(94, 131, 150, 0.22)', true: 'rgba(45, 141, 200, 0.36)' }}
                                    thumbColor={adminUserUseNicknameInGreetings ? palette.red : palette.white}
                                  />
                                </View>
                                <Text style={styles.cardEyebrow}>Mostrar en credencial</Text>
                                <View style={styles.filterRow}>
                                  {(['name', 'nickname', 'both'] as const).map((mode) => (
                                    <TouchableOpacity key={mode} style={[styles.filterChip, adminUserCredentialNameMode === mode && styles.filterChipActive]} onPress={() => setAdminUserCredentialNameMode(mode)}>
                                      <Text style={[styles.filterChipText, adminUserCredentialNameMode === mode && styles.filterChipTextActive]}>{mode === 'name' ? 'Nombre' : mode === 'nickname' ? 'Apodo' : 'Ambos'}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                                <Text style={styles.cardEyebrow}>Año de inicio en el Movimiento</Text>
                                <TouchableOpacity style={styles.dropdownButton} onPress={() => setAdminUserPerseveranceYearDropdownOpen(!adminUserPerseveranceYearDropdownOpen)}>
                                  <Text style={styles.dropdownButtonText}>{adminUserPerseveranceStartYear || 'Seleccionar año'}</Text>
                                  <Ionicons name={adminUserPerseveranceYearDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                                </TouchableOpacity>
                                {adminUserPerseveranceYearDropdownOpen ? (
                                  <ScrollView style={styles.dropdownList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                                    {perseveranceStartYears.map((year) => (
                                      <TouchableOpacity key={year} style={styles.dropdownItem} onPress={() => { setAdminUserPerseveranceStartYear(year); setAdminUserPerseveranceYearDropdownOpen(false); }}>
                                        <Text style={styles.dropdownItemText}>{year}</Text>
                                      </TouchableOpacity>
                                    ))}
                                  </ScrollView>
                                ) : null}
                                {perseveranceLabel(Number(adminUserPerseveranceStartYear)) ? <Text style={styles.cardText}>{perseveranceLabel(Number(adminUserPerseveranceStartYear))}</Text> : null}
                                {roleRank(adminUserRole) >= roleRank('sedimentador') ? (
                                  <>
                                    <Text style={styles.cardEyebrow}>PM personal</Text>
                                    <View style={styles.filterRow}>
                                      {(['pmm', 'pmf'] as const).map((type) => (
                                        <TouchableOpacity key={`admin-${type}`} style={[styles.filterChip, adminUserPmType === type && styles.filterChipActive]} onPress={() => setAdminUserPmType(type)}>
                                          <Text style={[styles.filterChipText, adminUserPmType === type && styles.filterChipTextActive]}>{personalPmTypeLabel(type)}</Text>
                                        </TouchableOpacity>
                                      ))}
                                    </View>
                                    <TextInput style={styles.input} placeholder="Numero de PM" value={adminUserPmNumber} onChangeText={(value) => setAdminUserPmNumber(value.replace(/[^0-9]/g, '').slice(0, 4))} keyboardType="number-pad" placeholderTextColor={inputPlaceholderColor} />
                                    <TouchableOpacity style={styles.dropdownButton} onPress={() => setAdminUserPmProvinceDropdownOpen(!adminUserPmProvinceDropdownOpen)}>
                                      <Text style={styles.dropdownButtonText}>{adminUserPmProvince || 'Provincia donde hizo el PM'}</Text>
                                      <Ionicons name={adminUserPmProvinceDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                                    </TouchableOpacity>
                                    {adminUserPmProvinceDropdownOpen ? (
                                      <ScrollView style={styles.dropdownList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                                        {visibleRegistrationCommunities.map((item) => (
                                          <TouchableOpacity key={`admin-pm-${item.province}`} style={styles.dropdownItem} onPress={() => { setAdminUserPmProvince(item.province); setAdminUserPmProvinceDropdownOpen(false); }}>
                                            <Text style={styles.dropdownItemText}>{item.province}</Text>
                                          </TouchableOpacity>
                                        ))}
                                      </ScrollView>
                                    ) : null}
                                    <TextInput style={styles.input} placeholder="Lema o idea fuerza del PM" value={adminUserPmMotto} onChangeText={setAdminUserPmMotto}  placeholderTextColor={inputPlaceholderColor} />
                                    {personalPmSummary({ type: adminUserPmType, number: adminUserPmNumber, province: adminUserPmProvince, motto: adminUserPmMotto }) ? <Text style={styles.cardText}>{personalPmSummary({ type: adminUserPmType, number: adminUserPmNumber, province: adminUserPmProvince, motto: adminUserPmMotto })}</Text> : null}
                                  </>
                                ) : null}
                                <Text style={styles.cardEyebrow}>Provincia</Text>
                                <TouchableOpacity style={styles.dropdownButton} onPress={() => setAdminUserProvinceDropdownOpen(!adminUserProvinceDropdownOpen)}>
                                  <Text style={styles.dropdownButtonText}>{adminUserProvince || 'Seleccionar provincia'}</Text>
                                  <Ionicons name={adminUserProvinceDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                                </TouchableOpacity>
                                {adminUserProvinceDropdownOpen ? (
                                  <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                                    {visibleRegistrationCommunities.map((item) => (
                                      <TouchableOpacity key={item.province} style={styles.dropdownItem} onPress={() => { setAdminUserProvince(item.province); setAdminUserCommunity(''); setAdminUserProvinceDropdownOpen(false); }}>
                                        <Text style={styles.dropdownItemText}>{item.province}</Text>
                                      </TouchableOpacity>
                                    ))}
                                  </ScrollView>
                                ) : null}
                                {selectedAdminUserProvince ? (
                                  <>
                                    <Text style={styles.cardEyebrow}>Comunidad</Text>
                                    <TouchableOpacity style={styles.dropdownButton} onPress={() => setAdminUserCommunityDropdownOpen(!adminUserCommunityDropdownOpen)}>
                                      <Text style={styles.dropdownButtonText}>{adminUserCommunity || 'Seleccionar comunidad'}</Text>
                                      <Ionicons name={adminUserCommunityDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                                    </TouchableOpacity>
                                    {adminUserCommunityDropdownOpen ? (
                                      <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                                        {selectedAdminUserProvince.locations.map((item) => (
                                          <TouchableOpacity key={item.id ?? item.name} style={styles.dropdownItem} onPress={() => { setAdminUserCommunity(item.name); setAdminUserCommunityDropdownOpen(false); }}>
                                            <Text style={styles.dropdownItemText}>{item.name}</Text>
                                          </TouchableOpacity>
                                        ))}
                                      </ScrollView>
                                    ) : null}
                                  </>
                                ) : null}
                                <Text style={styles.cardEyebrow}>Estado</Text>
                                <View style={styles.filterRow}>
                                  {['pendiente', 'aprobado', 'bloqueado'].map((status) => (
                                    <TouchableOpacity key={status} style={[styles.filterChip, adminUserStatus === status && styles.filterChipActive]} onPress={() => setAdminUserStatus(status)}>
                                      <Text style={[styles.filterChipText, adminUserStatus === status && styles.filterChipTextActive]}>{status}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                                <Text style={styles.cardEyebrow}>Rol</Text>
                                <TouchableOpacity style={styles.dropdownButton} onPress={() => setAdminUserRoleDropdownOpen(!adminUserRoleDropdownOpen)}>
                                  <Text style={styles.dropdownButtonText}>{displayRoleLabel(adminUserRole, adminUserProvince, provinceRoleLabels, adminConfig.settings.roleAliases, adminUserDisplayRoleLabel)}</Text>
                                  <Ionicons name={adminUserRoleDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                                </TouchableOpacity>
                                {adminUserRoleDropdownOpen ? (
                                  <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                                    {roleDefinitions.filter((role) => role.role === selectedAdminUser?.role || assignableRoles.some((item) => item.role === role.role)).map((role) => (
                                      <TouchableOpacity key={role.role} style={styles.dropdownItem} onPress={() => { setAdminUserRole(role.role as Role); setAdminUserSubroleKey(null); setAdminUserDisplayRoleLabel(''); setAdminUserRoleDropdownOpen(false); }}>
                                        <Text style={styles.dropdownItemText}>{role.label}</Text>
                                      </TouchableOpacity>
                                    ))}
                                  </ScrollView>
                                ) : null}
                                {subrolesForRole(adminUserRole).length > 0 ? (
                                  <>
                                    <Text style={styles.cardEyebrow}>Subrango dirigencial</Text>
                                    <TouchableOpacity style={styles.dropdownButton} onPress={() => setAdminUserSubroleDropdownOpen(!adminUserSubroleDropdownOpen)}>
                                      <Text style={styles.dropdownButtonText}>{subroleLabel(adminUserSubroleKey, selectedAdminUser?.gender_preference ?? null)}</Text>
                                      <Ionicons name={adminUserSubroleDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                                    </TouchableOpacity>
                                    {adminUserSubroleDropdownOpen ? (
                                      <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                                        <TouchableOpacity style={styles.dropdownItem} onPress={() => { setAdminUserSubroleKey(null); setAdminUserSubroleDropdownOpen(false); }}>
                                          <Text style={styles.dropdownItemText}>Sin subrango</Text>
                                        </TouchableOpacity>
                                        {subrolesForRole(adminUserRole).map((subrole) => (
                                          <TouchableOpacity key={subrole.key} style={styles.dropdownItem} onPress={() => { setAdminUserSubroleKey(subrole.key); setAdminUserSubroleDropdownOpen(false); }}>
                                            <Text style={styles.dropdownItemText}>{subrole.label}</Text>
                                          </TouchableOpacity>
                                        ))}
                                      </ScrollView>
                                    ) : null}
                                    <Text style={styles.cardText}>No crea rangos nuevos: se guarda como role + subrole_key y mantiene permisos del rango base.</Text>
                                  </>
                                ) : null}
                                <Text style={styles.cardEyebrow}>Alias asignable</Text>
                                <TouchableOpacity style={styles.dropdownButton} onPress={() => setAdminUserRoleAliasDropdownOpen(!adminUserRoleAliasDropdownOpen)}>
                                  <Text style={styles.dropdownButtonText}>{adminUserDisplayRoleLabel || 'Sin alias: usar nombre del rol base'}</Text>
                                  <Ionicons name={adminUserRoleAliasDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                                </TouchableOpacity>
                                {adminUserRoleAliasDropdownOpen ? (
                                  <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                                    <TouchableOpacity style={styles.dropdownItem} onPress={() => { setAdminUserDisplayRoleLabel(''); setAdminUserRoleAliasDropdownOpen(false); }}>
                                      <Text style={styles.dropdownItemText}>Sin alias</Text>
                                    </TouchableOpacity>
                                    {roleAliases
                                      .filter((alias) => alias.is_active && (!alias.province || !adminUserProvince || alias.province === adminUserProvince))
                                      .filter((alias) => alias.base_role === selectedAdminUser?.role || assignableRoles.some((item) => item.role === alias.base_role))
                                      .map((alias) => (
                                        <TouchableOpacity key={alias.id} style={styles.dropdownItem} onPress={() => {
                                          setAdminUserRole(alias.base_role as Role);
                                          setAdminUserDisplayRoleLabel(alias.display_label);
                                          setAdminUserRoleAliasDropdownOpen(false);
                                        }}>
                                          <Text style={styles.dropdownItemText}>{alias.display_label} ({roleLabel(alias.base_role as Role)})</Text>
                                        </TouchableOpacity>
                                      ))}
                                  </ScrollView>
                                ) : null}
                                <Text style={styles.cardText}>Los alias heredan permisos y jerarquia del rol base seleccionado.</Text>
                                <TouchableOpacity style={styles.primaryButton} onPress={saveAdminUser}>
                                  <Text style={styles.primaryButtonText}>Guardar usuario</Text>
                                </TouchableOpacity>
                                {session.role === 'administrador' ? (
                                  <>
                                    {!selectedAdminUser?.email_confirmed_at ? (
                                      <TouchableOpacity style={styles.secondaryButton} onPress={confirmSelectedUserEmail}>
                                        <Text style={styles.secondaryButtonText}>Confirmar email</Text>
                                      </TouchableOpacity>
                                    ) : null}
                                    <TouchableOpacity style={[styles.rowActionButton, styles.rowActionButtonDanger]} onPress={deleteSelectedAdminUser}>
                                      <Ionicons name="trash-outline" size={14} color="#B93232" />
                                      <Text style={[styles.rowActionButtonText, styles.rowActionButtonTextDanger]}>Eliminar usuario</Text>
                                    </TouchableOpacity>
                                  </>
                                ) : null}
                              </View>
                            ) : null}
                          </View>
                        );
                      })}
                    </View>
                  ) : adminUsersTool === 'listado' && adminUsers.length > 0 ? <Text style={styles.cardText}>Elegir una provincia para ver sus usuarios.</Text> : null}
                  {adminUsersTool === 'pendientes' ? <View style={styles.profileCommunityPanel}>
                    <Text style={styles.cardEyebrow}>Pendientes rapido</Text>
                    <TouchableOpacity style={styles.secondaryButton} onPress={loadPendingProfiles}>
                      <Text style={styles.secondaryButtonText}>Cargar pendientes</Text>
                    </TouchableOpacity>
                    {realPendingProfiles.map((user) => (
                      <View key={user.id} style={styles.innerNewsCard}>
                        <Text style={styles.cardTitle}>{user.full_name}</Text>
                        <Text style={styles.cardText}>{user.email ?? 'Sin email'}</Text>
                        <Text style={styles.cardText}>{user.email_confirmed_at ? 'Mail confirmado - pendiente de aprobacion dirigencial' : 'Mail pendiente de confirmacion'}</Text>
                        <Text style={styles.cardText}>Rol actual: {user.role}</Text>
                        <Text style={styles.cardText}>Comunidad: {user.community_name ?? 'Sin comunidad'}</Text>
                        <TouchableOpacity style={styles.secondaryButton} onPress={() => approvePendingProfile(user.id, 'palestrista')}>
                          <Text style={styles.secondaryButtonText}>Aprobar como Palestrista</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View> : null}
                </View>
              ) : null}

              {adminModule === 'solicitudes' && canManageRequests ? (
                <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
                  <Text style={styles.cardTitle}>Solicitudes</Text>
                  <View style={styles.filterRow}>
                    <TouchableOpacity style={[styles.filterChip, requestSubtab === 'pendientes' && styles.filterChipActive]} onPress={() => setRequestSubtab('pendientes')}>
                      <Text style={[styles.filterChipText, requestSubtab === 'pendientes' && styles.filterChipTextActive]}>Pendientes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.filterChip, requestSubtab === 'resueltas' && styles.filterChipActive]} onPress={() => setRequestSubtab('resueltas')}>
                      <Text style={[styles.filterChipText, requestSubtab === 'resueltas' && styles.filterChipTextActive]}>Resueltas</Text>
                    </TouchableOpacity>
                  </View>
                  {requestSubtab === 'pendientes' && pendingAdminRequests.length === 0 ? <Text style={styles.cardText}>No hay solicitudes pendientes.</Text> : null}
                  {requestSubtab === 'pendientes' ? pendingAdminRequests.map((item, index) => (
                    <View key={item.id} style={styles.innerNewsCard}>
                      <Text style={styles.cardEyebrow}>Llegada #{index + 1} - {new Date(item.createdAt).toLocaleDateString('es-AR')}</Text>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardText}>Solicitante: {item.requester}</Text>
                      {item.communityName ? <Text style={styles.cardText}>Comunidad: {item.communityName}</Text> : null}
                      {item.targetUserName ? <Text style={styles.cardText}>Sucesor propuesto: {item.targetUserName} - {roleLabel((item.targetRole ?? 'palestrista') as Role)}</Text> : null}
                      <Text style={styles.cardText}>Definicion: {item.definition}</Text>
                      <TextInput style={[styles.input, styles.textArea]} placeholder="Mensaje opcional para el usuario" value={adminRequestMessage} onChangeText={setAdminRequestMessage} multiline  placeholderTextColor={inputPlaceholderColor} />
                      {item.title === 'Solicitud de perseverancia' ? (
                        <View style={styles.profileCommunityPanel}>
                          <Text style={styles.cardEyebrow}>Rol a designar si se aprueba</Text>
                          <TouchableOpacity style={styles.dropdownButton} onPress={() => setPerseveranceRoleDropdownOpen(!perseveranceRoleDropdownOpen)}>
                            <Text style={styles.dropdownButtonText}>{roleLabel(perseveranceRole)}</Text>
                            <Ionicons name={perseveranceRoleDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                          </TouchableOpacity>
                          {perseveranceRoleDropdownOpen ? (
                            <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                              {assignableRoles.filter((role) => role.role !== 'palestrista').map((role) => (
                                <TouchableOpacity key={role.role} style={styles.dropdownItem} onPress={() => { setPerseveranceRole(role.role as Role); setPerseveranceRoleDropdownOpen(false); }}>
                                  <Text style={styles.dropdownItemText}>{role.label}</Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          ) : null}
                        </View>
                      ) : null}
                      {item.title === 'Cambio de dirigencia' ? (
                        <View style={styles.profileCommunityPanel}>
                          <Text style={styles.cardEyebrow}>Resolucion de dirigencia</Text>
                          <Text style={styles.cardText}>Al aprobar se asignara {roleLabel((item.targetRole ?? 'animador_comunidad') as Role)} al sucesor propuesto.</Text>
                        </View>
                      ) : null}
                      <View style={styles.inlineActions}>
                        <TouchableOpacity style={styles.primaryButton} onPress={() => resolveAdminRequest(item.id, 'aprobada')}>
                          <Text style={styles.primaryButtonText}>{item.title === 'Confirmacion de mail' ? 'Confirmar mail' : 'Aprobar'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryButton} onPress={() => resolveAdminRequest(item.id, 'denegada')}>
                          <Text style={styles.secondaryButtonText}>Denegar</Text>
                        </TouchableOpacity>
                      </View>
                      {item.title === 'Solicitud de perseverancia' ? <Text style={styles.cardText}>Al aprobar esta solicitud se asignara el rol seleccionado.</Text> : null}
                    </View>
                  )) : null}
                  {requestSubtab === 'resueltas' && resolvedAdminRequests.length === 0 ? <Text style={styles.cardText}>Todavia no hay solicitudes resueltas.</Text> : null}
                  {requestSubtab === 'resueltas' ? resolvedAdminRequests.map((item) => (
                    <View key={item.id} style={styles.innerNewsCard}>
                      <Text style={styles.cardEyebrow}>{item.status.toUpperCase()} - {new Date(item.createdAt).toLocaleDateString('es-AR')}</Text>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardText}>Solicitante: {item.requester}</Text>
                      {item.communityName ? <Text style={styles.cardText}>Comunidad: {item.communityName}</Text> : null}
                      {item.targetUserName ? <Text style={styles.cardText}>Sucesor: {item.targetUserName} - {roleLabel((item.targetRole ?? 'palestrista') as Role)}</Text> : null}
                      <Text style={styles.cardText}>Definicion: {item.definition}</Text>
                      <Text style={styles.cardText}>Resolvio: {item.resolvedBy ?? 'Sin responsable'}</Text>
                      <Text style={styles.cardText}>Fecha de resolucion: {item.resolvedAt ? new Date(item.resolvedAt).toLocaleString('es-AR') : 'Sin fecha'}</Text>
                      <Text style={styles.cardText}>Mensaje enviado: {item.message ?? 'Sin mensaje'}</Text>
                    </View>
                  )) : null}
                </View>
              ) : null}

              {adminModule === 'noticias' ? (
                <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
                  <Text style={styles.cardTitle}>Noticias</Text>
                  <Text style={styles.cardText}>Crear noticias segun tu alcance real. Asesores y rangos comunitarios no pueden publicar.</Text>
                  <Text style={styles.cardEyebrow}>Alcance</Text>
                  {['vocal', 'coordinador_diocesano'].includes(session?.role ?? 'invitado') ? (
                    <Text style={styles.cardText}>Noticia Provincial - {session?.province}</Text>
                  ) : (
                    <View style={styles.filterRow}>
                      {(['nacional', 'provincial'] as const).map((scope) => (
                        <TouchableOpacity key={scope} style={[styles.filterChip, adminNewsScope === scope && styles.filterChipActive]} onPress={() => setAdminNewsScope(scope)}>
                          <Text style={[styles.filterChipText, adminNewsScope === scope && styles.filterChipTextActive]}>{scope === 'nacional' ? 'Noticia Nacional' : 'Noticia Provincial'}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {adminNewsScope === 'provincial' || ['vocal', 'coordinador_diocesano'].includes(session?.role ?? 'invitado') ? (
                    <View>
                      <Text style={styles.cardEyebrow}>Provincia</Text>
                      {['vocal', 'coordinador_diocesano'].includes(session?.role ?? 'invitado') ? (
                        <Text style={styles.cardText}>{session?.province}</Text>
                      ) : (
                        <>
                          <TouchableOpacity style={styles.dropdownButton} onPress={() => setAdminNewsProvinceDropdownOpen(!adminNewsProvinceDropdownOpen)}>
                            <Text style={styles.dropdownButtonText}>{adminNewsProvince || 'Seleccionar provincia'}</Text>
                            <Ionicons name={adminNewsProvinceDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                          </TouchableOpacity>
                          {adminNewsProvinceDropdownOpen ? (
                            <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                              {newsProvinceOptions.map((province) => (
                                <TouchableOpacity key={province} style={styles.dropdownItem} onPress={() => { setAdminNewsProvince(province); setAdminNewsProvinceDropdownOpen(false); }}>
                                  <Text style={styles.dropdownItemText}>{province}</Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          ) : null}
                        </>
                      )}
                    </View>
                  ) : null}
                  <TextInput style={styles.input} placeholder="Titulo de la noticia" value={adminNewsTitle} onChangeText={setAdminNewsTitle}  placeholderTextColor={inputPlaceholderColor} />
                  <TextInput style={styles.input} placeholder="URL de imagen opcional" value={adminNewsImage} onChangeText={setAdminNewsImage} autoCapitalize="none"  placeholderTextColor={inputPlaceholderColor} />
                  <View style={styles.inlineActions}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={uploadAdminNewsImage}>
                      <Ionicons name="image-outline" size={16} color={palette.red} />
                      <Text style={styles.secondaryButtonText}>Subir imagen</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => setAdminNewsImage('')}>
                      <Ionicons name="close-circle-outline" size={16} color={palette.red} />
                      <Text style={styles.secondaryButtonText}>Sin imagen</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Contenido completo de la noticia" value={adminNewsBody} onChangeText={setAdminNewsBody} multiline  placeholderTextColor={inputPlaceholderColor} />
                  <View style={styles.filterRow}>
                    <TouchableOpacity style={[styles.filterChip, adminNewsDraft && styles.filterChipActive]} onPress={() => setAdminNewsDraft(!adminNewsDraft)}>
                      <Text style={[styles.filterChipText, adminNewsDraft && styles.filterChipTextActive]}>{adminNewsDraft ? 'Borrador' : 'Publicar'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.filterChip, adminNewsFeatured && styles.filterChipActive]} onPress={() => setAdminNewsFeatured(!adminNewsFeatured)}>
                      <Text style={[styles.filterChipText, adminNewsFeatured && styles.filterChipTextActive]}>Destacada</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.settingRow}>
                    <View style={styles.settingRowText}>
                      <Text style={styles.cardTitle}>Notificar usuarios</Text>
                      <Text style={styles.cardText}>{notificationPermissionLabel(session)}</Text>
                    </View>
                    <Switch value={adminNewsNotify} onValueChange={setAdminNewsNotify} />
                  </View>
                  <View style={styles.adminPreviewPane}>
                    <Text style={styles.cardEyebrow}>{adminNewsCategory}{adminNewsFeatured ? ' - destacada' : ''}</Text>
                    <Text style={styles.cardTitle}>{adminNewsTitle || 'Titulo de noticia'}</Text>
                    <Text style={styles.cardText}>{adminNewsBody || 'Previsualizacion del contenido antes de publicar.'}</Text>
                    {adminNewsImage ? <Image source={{ uri: adminNewsImage }} style={styles.cardImage} /> : null}
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={adminNewsDraft ? () => adminSaveNewsDraft('borrador') : adminCreateNews}>
                    <Text style={styles.primaryButtonText}>{adminNewsDraft ? 'Guardar borrador' : 'Publicar noticia'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={loadNewsDrafts}>
                    <Text style={styles.secondaryButtonText}>Cargar borradores</Text>
                  </TouchableOpacity>
                  {newsDrafts.map((draft) => (
                    <View key={draft.id} style={styles.adminListRow}>
                      <Ionicons name={draft.status === 'borrador' ? 'document-outline' : 'checkmark-circle-outline'} size={19} color={palette.red} />
                      <View style={styles.adminUserHeaderText}>
                        <Text style={styles.cardTitle}>{draft.title}</Text>
                        <Text style={styles.cardText}>{draft.category} - {draft.status}{draft.is_featured ? ' - destacada' : ''}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}

              {adminModule === 'eventos' ? (
                <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
                <Text style={styles.cardTitle}>Crear evento {tabLabel('notilestra')}</Text>
                <TextInput style={styles.input} placeholder="Titulo del evento" value={adminEventTitle} onChangeText={setAdminEventTitle}  placeholderTextColor={inputPlaceholderColor} />
                <TextInput style={[styles.input, styles.textArea]} placeholder="Descripcion o detalle del evento" value={adminEventBody} onChangeText={setAdminEventBody} multiline  placeholderTextColor={inputPlaceholderColor} />
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setAdminEventCalendarOpen(!adminEventCalendarOpen)}>
                  <Ionicons name="calendar-outline" size={17} color={palette.red} />
                  <Text style={styles.secondaryButtonText}>Seleccionar fecha</Text>
                </TouchableOpacity>
                {adminEventCalendarOpen ? (
                  <View style={styles.pmCalendarPanel}>
                    <View style={styles.pmCalendarHeader}>
                      <TouchableOpacity style={styles.pmCalendarNavButton} onPress={() => setAdminEventCalendarMonth(new Date(adminEventCalendarMonth.getFullYear(), adminEventCalendarMonth.getMonth() - 1, 1))}>
                        <Text style={styles.pmCalendarNavText}>←</Text>
                      </TouchableOpacity>
                      <Text style={styles.pmCalendarTitle}>{adminEventCalendarMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</Text>
                      <TouchableOpacity style={styles.pmCalendarNavButton} onPress={() => setAdminEventCalendarMonth(new Date(adminEventCalendarMonth.getFullYear(), adminEventCalendarMonth.getMonth() + 1, 1))}>
                        <Text style={styles.pmCalendarNavText}>→</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.pmCalendarWeekRow}>
                      {['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'].map((day) => (
                        <Text key={day} style={styles.pmWeekdayText}>{day}</Text>
                      ))}
                    </View>
                    <View style={styles.pmCalendarGrid}>
                      {Array.from({ length: new Date(adminEventCalendarMonth.getFullYear(), adminEventCalendarMonth.getMonth(), 1).getDay() }, (_, index) => (
                        <View key={`event-blank-${index}`} style={styles.pmDaySpacer} />
                      ))}
                      {Array.from({ length: new Date(adminEventCalendarMonth.getFullYear(), adminEventCalendarMonth.getMonth() + 1, 0).getDate() }, (_, index) => {
                        const day = index + 1;
                        const date = isoDate(adminEventCalendarMonth.getFullYear(), adminEventCalendarMonth.getMonth(), day);
                        const selected = adminEventDate.slice(0, 10) === date;
                        return (
                          <TouchableOpacity key={date} style={[styles.pmDayButton, selected && styles.pmDayButtonSelected]} onPress={() => selectAdminEventDate(date)}>
                            <Text style={[styles.pmDayText, selected && styles.pmDayTextSelected]}>{day}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
                <TextInput style={styles.input} placeholder="Fecha y hora del evento. Ej: 2026-05-28T21:00:00-03:00" value={adminEventDate} onChangeText={setAdminEventDate}  placeholderTextColor={inputPlaceholderColor} />
                <View style={styles.settingRow}>
                  <View style={styles.settingRowText}>
                    <Text style={styles.cardTitle}>Notificar usuarios</Text>
                    <Text style={styles.cardText}>{notificationPermissionLabel(session)}</Text>
                  </View>
                  <Switch value={adminEventNotify} onValueChange={setAdminEventNotify} />
                </View>
                <TouchableOpacity style={styles.primaryButton} onPress={adminCreateEvent}>
                  <Text style={styles.primaryButtonText}>Publicar evento</Text>
                </TouchableOpacity>
                </View>
              ) : null}

              {adminModule === 'crear_provincia' && session.role === 'administrador' ? (
                <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
                  <Text style={styles.cardTitle}>Crear provincia</Text>
                  <Text style={styles.cardText}>Seleccioná una provincia argentina faltante. El nombre y la región vienen predefinidos; solo se administra el logo y el estado.</Text>
                  {missingArgentinaProvinces.length > 0 ? (
                    <>
                      <Text style={styles.cardEyebrow}>Provincia faltante</Text>
                      <ProvinceCreateDropdown
                        isDark={isDark}
                        provinces={missingArgentinaProvinces}
                        selectedProvince={selectedNewProvinceDefinition}
                        open={provinceCreateDropdownOpen}
                        onToggle={() => setProvinceCreateDropdownOpen((current) => !current)}
                        onSelect={(provinceName) => { setNewProvinceName(provinceName); setProvinceCreateDropdownOpen(false); }}
                      />
                      {selectedNewProvinceDefinition ? (
                        <View style={styles.profileCommunityPanel}>
                          <Text style={styles.cardEyebrow}>{selectedNewProvinceDefinition.region}</Text>
                          <Text style={styles.cardTitle}>{selectedNewProvinceDefinition.name}</Text>
                          <Text style={styles.cardText}>La región se asigna automáticamente y no es editable.</Text>
                          {provinceLogoDrafts[selectedNewProvinceDefinition.name] ? <Image source={{ uri: provinceLogoDrafts[selectedNewProvinceDefinition.name] }} style={styles.adminDocumentThumb} /> : null}
                          <View style={styles.inlineActions}>
                            <TouchableOpacity style={styles.secondaryButton} onPress={() => pickProvinceLogo(selectedNewProvinceDefinition.name)} disabled={provinceLogoUploading === selectedNewProvinceDefinition.name}>
                              <Ionicons name="image-outline" size={17} color={palette.red} />
                              <Text style={styles.secondaryButtonText}>{provinceLogoUploading === selectedNewProvinceDefinition.name ? 'Subiendo...' : 'Cargar logo'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.primaryButton} onPress={adminCreateProvince}>
                              <Ionicons name="map-outline" size={17} color={palette.white} />
                              <Text style={styles.primaryButtonText}>Crear provincia</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : null}
                    </>
                  ) : (
                    <Text style={styles.cardText}>Todas las provincias argentinas ya están cargadas.</Text>
                  )}
                  <Text style={styles.cardEyebrow}>Provincias cargadas</Text>
                  {registrationCommunities.filter((item) => !item.archivedAt).map((item) => {
                    const active = item.isActive !== false;
                    const logoUrl = provinceLogoDrafts[item.province] ?? item.logoUrl ?? null;
                    return (
                      <View key={`province-${item.province}`} style={[styles.adminListRow, styles.provinceAdminRow, !active && styles.lockedCard]}>
                        <View style={styles.provinceAdminInfo}>
                          {logoUrl ? <Image source={{ uri: logoUrl }} style={styles.adminDocumentThumb} /> : <View style={styles.adminDocumentThumb}><Ionicons name="location-outline" size={20} color={palette.red} /></View>}
                          <View style={styles.adminUserHeaderText}>
                            <Text style={styles.adminQuickText}>{item.province}</Text>
                            <Text style={styles.cardText}>{item.region} - {item.locations.length} comunidades - {active ? 'habilitada' : 'deshabilitada'}</Text>
                          </View>
                        </View>
                        <View style={styles.provinceAdminActions}>
                          <TouchableOpacity style={styles.rowActionButton} onPress={() => pickProvinceLogo(item.province)} disabled={provinceLogoUploading === item.province}>
                            <Ionicons name="image-outline" size={14} color={palette.red} />
                            <Text style={styles.rowActionButtonText}>{provinceLogoUploading === item.province ? 'Subiendo...' : 'Logo'}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.rowActionButton} onPress={() => adminSetProvinceActive(item.province, !active)}>
                            <Ionicons name={active ? 'pause-circle-outline' : 'checkmark-circle-outline'} size={14} color={palette.red} />
                            <Text style={styles.rowActionButtonText}>{active ? 'Deshabilitar' : 'Habilitar'}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.rowActionButton, styles.rowActionButtonDanger]} onPress={() => adminArchiveProvince(item.province)}>
                            <Ionicons name="trash-outline" size={14} color="#B93232" />
                            <Text style={[styles.rowActionButtonText, styles.rowActionButtonTextDanger]}>Eliminar</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              {adminModule === 'comunidades' ? (
                <CommunityAdminPanel
                  isDark={isDark}
                  sessionRole={session?.role ?? null}
                  manageableCommunities={manageableCommunities}
                  selectedAdminProvince={selectedAdminProvince}
                  adminCommunityProvince={adminCommunityProvince}
                  adminCommunityId={adminCommunityId}
                  adminCommunityName={adminCommunityName}
                  adminCommunityAddress={adminCommunityAddress}
                  adminCommunityPhone={adminCommunityPhone}
                  adminCommunityDay={adminCommunityDay}
                  adminCommunityTime={adminCommunityTime}
                  adminCommunityDescription={adminCommunityDescription}
                  adminCommunityLatitude={adminCommunityLatitude}
                  adminCommunityLongitude={adminCommunityLongitude}
                  adminCommunityImagePreview={adminCommunityImagePreview}
                  adminCommunityImageAsset={adminCommunityImageAsset}
                  adminCommunityImageUploading={adminCommunityImageUploading}
                  adminCommunityGroupType={adminCommunityGroupType}
                  adminCommunityIsActive={adminCommunityIsActive}
                  canAdministrateCommunities={canAdministrateCommunities}
                  showAdminCommunityCreate={showAdminCommunityCreate}
                  onSelectProvince={(province) => {
                    setAdminCommunityProvince(province);
                    setAdminCommunityId('');
                  }}
                  onSelectCommunity={setAdminCommunityId}
                  onResetSelectedCommunity={() => setAdminCommunityId('')}
                  onToggleCreateCommunity={() => {
                    setShowAdminCommunityCreate((current) => !current);
                    setAdminCommunityId('');
                    setAdminCommunityImageAsset(null);
                    setAdminCommunityImageUrl('');
                    setAdminCommunityImagePreview('');
                  }}
                  setAdminCommunityName={setAdminCommunityName}
                  setAdminCommunityAddress={setAdminCommunityAddress}
                  setAdminCommunityPhone={setAdminCommunityPhone}
                  setAdminCommunityDay={setAdminCommunityDay}
                  setAdminCommunityTime={setAdminCommunityTime}
                  setAdminCommunityDescription={setAdminCommunityDescription}
                  setAdminCommunityLatitude={setAdminCommunityLatitude}
                  setAdminCommunityLongitude={setAdminCommunityLongitude}
                  setAdminCommunityGroupType={setAdminCommunityGroupType}
                  setAdminCommunityIsActive={setAdminCommunityIsActive}
                  onPickImage={pickAdminCommunityImage}
                  onCreateCommunity={adminCreateCommunity}
                  onSetSectionEnabled={adminSetCommunitySectionEnabled}
                  onToggleCommunityStatus={adminToggleCommunityStatus}
                  onArchiveCommunity={adminArchiveCommunity}
                  onSaveCommunity={adminSaveCommunity}
                />
              ) : null}

              {adminModule === 'listas_qr' ? (
                <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
                  <Text style={styles.cardTitle}>Listas QR</Text>
                  <Text style={styles.cardText}>Crea listas por actividad, carga miembros y valida asistencia escaneando credenciales.</Text>
                  <View style={styles.compactToolRow}>
                    {['vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador'].includes(session.role) ? (
                      <TouchableOpacity style={[styles.compactSquareButton, showQrActivityCreateMenu && styles.compactSquareButtonActive]} onPress={() => setShowQrActivityCreateMenu((current) => !current)}>
                        <Ionicons name={showQrActivityCreateMenu ? 'chevron-up-outline' : 'add-circle-outline'} size={17} color={showQrActivityCreateMenu ? palette.white : palette.red} />
                        <Text style={[styles.compactSquareButtonText, showQrActivityCreateMenu && styles.compactSquareButtonTextActive]}>Crear Lista</Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity style={[styles.compactSquareButton, showQrActivityListsMenu && styles.compactSquareButtonActive]} onPress={async () => { await loadQrActivityLists(); setShowQrActivityListsMenu((current) => !current); }}>
                      <Ionicons name={showQrActivityListsMenu ? 'chevron-up-outline' : 'refresh-outline'} size={17} color={showQrActivityListsMenu ? palette.white : palette.red} />
                      <Text style={[styles.compactSquareButtonText, showQrActivityListsMenu && styles.compactSquareButtonTextActive]}>Actualizar</Text>
                    </TouchableOpacity>
                  </View>
                  {showQrActivityCreateMenu && ['vocal', 'coordinador_diocesano', 'vocal_nacional', 'coordinador_nacional', 'administrador'].includes(session.role) ? (
                    <View style={styles.profileCommunityPanel}>
                      <Text style={styles.cardEyebrow}>Crear lista</Text>
                      <TextInput style={styles.input} placeholder="Ej: Equipistas de PMF N 102" value={qrActivityTitle} onChangeText={setQrActivityTitle} placeholderTextColor={inputPlaceholderColor} />
                      <Text style={styles.inputLabel}>Provincia</Text>
                      <TouchableOpacity style={styles.dropdownButton} onPress={() => setQrActivityProvinceDropdownOpen((current) => !current)}>
                        <Text style={styles.dropdownButtonText}>{qrActivityProvince || 'Todas'}</Text>
                        <Ionicons name={qrActivityProvinceDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                      </TouchableOpacity>
                      {qrActivityProvinceDropdownOpen ? (
                        <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                          {qrActivityProvinceOptions.map((province) => (
                            <TouchableOpacity key={province || 'todas'} style={styles.dropdownItem} onPress={() => { setQrActivityProvince(province); setQrActivityCommunity(''); setQrActivityCreateSelectedUserIds([]); setQrActivityProvinceDropdownOpen(false); }}>
                              <Text style={styles.dropdownItemText}>{province || 'Todas'}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      ) : null}
                      <Text style={styles.inputLabel}>Comunidad</Text>
                      <TouchableOpacity style={[styles.dropdownButton, qrActivityCommunityDisabled && styles.lockedCard]} disabled={qrActivityCommunityDisabled} onPress={() => setQrActivityCommunityDropdownOpen((current) => !current)}>
                        <Text style={styles.dropdownButtonText}>{qrActivityCommunityDisabled ? 'Inhabilitado por Todas las provincias' : qrActivityCommunity || 'Todas'}</Text>
                        <Ionicons name={qrActivityCommunityDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                      </TouchableOpacity>
                      {qrActivityCommunityDropdownOpen && !qrActivityCommunityDisabled ? (
                        <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                          <TouchableOpacity style={styles.dropdownItem} onPress={() => { setQrActivityCommunity(''); setQrActivityCreateSelectedUserIds([]); setQrActivityCommunityDropdownOpen(false); }}>
                            <Text style={styles.dropdownItemText}>Todas</Text>
                          </TouchableOpacity>
                          {qrActivityCommunityOptions.map((community) => (
                            <TouchableOpacity key={community.id ?? community.name} style={styles.dropdownItem} onPress={() => { setQrActivityCommunity(community.name); setQrActivityCreateSelectedUserIds([]); setQrActivityCommunityDropdownOpen(false); }}>
                              <Text style={styles.dropdownItemText}>{community.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      ) : null}
                      <Text style={styles.inputLabel}>Usuarios seleccionados ({qrActivityCreateSelectedUserIds.length})</Text>
                      <TouchableOpacity style={styles.secondaryButton} onPress={markAllQrActivityCreateUsers}>
                        <Ionicons name={qrActivityCreateSelectedUserIds.length > 0 && qrActivityCreateSelectedUserIds.length === qrActivityCreateUserOptions.length ? 'remove-circle-outline' : 'checkmark-done-outline'} size={17} color={palette.red} />
                        <Text style={styles.secondaryButtonText}>{qrActivityCreateSelectedUserIds.length > 0 && qrActivityCreateSelectedUserIds.length === qrActivityCreateUserOptions.length ? 'Desmarcar todos' : 'Marcar a todos'}</Text>
                      </TouchableOpacity>
                      <TextInput style={styles.input} placeholder="Buscar usuario para agregar" value={qrActivityUserSearch} onChangeText={setQrActivityUserSearch} placeholderTextColor={inputPlaceholderColor} />
                      <ScrollView style={styles.dropdownList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                        {qrActivityCreateUserOptions.slice(0, 90).map((user) => {
                          const selected = qrActivityCreateSelectedUserIds.includes(user.id);
                          return (
                            <TouchableOpacity key={user.id} style={[styles.dropdownItem, selected && styles.qrActivityUserSelected]} onPress={() => toggleQrActivityCreateUser(user.id)}>
                              <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={selected ? palette.white : palette.red} />
                              <View style={styles.adminUserHeaderText}>
                                <Text style={[styles.dropdownItemText, selected && styles.qrActivityUserSelectedText]}>{userListDisplayName(user)}</Text>
                                <Text style={[styles.feedMeta, selected && styles.qrActivityUserSelectedText]}>{user.province ?? 'Sin provincia'} - {user.community_name ?? 'Sin comunidad'}</Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                        {qrActivityCreateUserOptions.length === 0 ? <Text style={styles.cardText}>No hay usuarios disponibles con este filtro.</Text> : null}
                      </ScrollView>
                      <TouchableOpacity style={styles.dropdownButton} onPress={() => setQrActivityShareDropdownOpen((current) => !current)}>
                        <Text style={styles.dropdownButtonText}>Compartir lista ({qrActivityCreateShareUserIds.length + qrActivityCreateShareRoles.length})</Text>
                        <Ionicons name={qrActivityShareDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                      </TouchableOpacity>
                      {qrActivityShareDropdownOpen ? (
                        <View style={styles.profileCommunityPanel}>
                          <Text style={styles.cardEyebrow}>Compartir con rangos</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                            {qrActivityShareRoleOptions.map((role) => {
                              const selected = qrActivityCreateShareRoles.includes(role.role);
                              return (
                                <TouchableOpacity key={role.role} style={[styles.filterChip, selected && styles.filterChipActive]} onPress={() => toggleQrActivityShareRole(role.role)}>
                                  <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>{role.label}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                          <Text style={styles.cardEyebrow}>Compartir con usuarios</Text>
                          <ScrollView style={styles.dropdownList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                            {qrActivityShareUserOptions.slice(0, 80).map((user) => {
                              const selected = qrActivityCreateShareUserIds.includes(user.id);
                              return (
                                <TouchableOpacity key={user.id} style={[styles.dropdownItem, selected && styles.qrActivityUserSelected]} onPress={() => toggleQrActivityShareUser(user.id)}>
                                  <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={selected ? palette.white : palette.red} />
                                  <View style={styles.adminUserHeaderText}>
                                    <Text style={[styles.dropdownItemText, selected && styles.qrActivityUserSelectedText]}>{userListDisplayName(user)}</Text>
                                    <Text style={[styles.feedMeta, selected && styles.qrActivityUserSelectedText]}>{roleLabel((user.role || 'palestrista') as Role)} - {user.province ?? 'Sin provincia'}</Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>
                      ) : null}
                      <TouchableOpacity style={styles.primaryButton} onPress={saveQrActivityList}>
                        <Text style={styles.primaryButtonText}>Crear lista QR</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                  {session.role === 'administrador' && adminUsersTool === 'diagnostico' ? (
                    <Text style={styles.cardText}>Administrador: selecciona una provincia en cada lista para ver sus registros.</Text>
                  ) : null}
                  {showQrActivityListsMenu ? (
                    <View style={styles.profileCommunityPanel}>
                      <View style={styles.settingRow}>
                        <Text style={styles.cardEyebrow}>Listas activas</Text>
                        <TouchableOpacity style={styles.actionPill} onPress={() => { setShowQrActivityListsMenu(false); setSelectedQrActivityListId(''); }}>
                          <Ionicons name="close-outline" size={16} color={palette.red} />
                          <Text style={styles.actionPillText}>Cerrar</Text>
                        </TouchableOpacity>
                      </View>
                      {qrActivityLists.length === 0 ? <Text style={styles.cardText}>No hay listas QR visibles para tu rango.</Text> : null}
                      {qrActivityLists.map((list) => (
                        <TouchableOpacity key={list.id} style={[styles.qrActivityListRow, selectedQrActivityListId === list.id && styles.qrActivityListRowActive]} onPress={() => setSelectedQrActivityListId(selectedQrActivityListId === list.id ? '' : list.id)}>
                          <View style={styles.adminUserHeaderText}>
                            <Text style={styles.adminQuickText}>{list.title}</Text>
                            <Text style={styles.cardText}>{list.province ?? 'Todas las provincias'} - {list.community_name ?? 'Todas las comunidades'}</Text>
                          </View>
                          <View style={styles.inlineActions}>
                            <TouchableOpacity style={styles.actionPill} onPress={() => setSelectedQrActivityListId(list.id)}>
                              <Text style={styles.actionPillText}>Editar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionPill} onPress={() => deleteQrActivityList(list)}>
                              <Text style={styles.actionPillText}>Eliminar</Text>
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                  {showQrActivityListsMenu && selectedQrActivityList ? (
                    <View style={styles.profileCommunityPanel}>
                      <Text style={styles.cardEyebrow}>{selectedQrActivityList.province ?? 'Todas las provincias'} - {selectedQrActivityList.community_name ?? 'Todas las comunidades'}</Text>
                      <Text style={styles.cardTitle}>{selectedQrActivityList.title}</Text>
                      <Text style={styles.cardEyebrow}>Editar lista</Text>
                      <TextInput style={styles.input} placeholder="Nombre de la lista" value={qrActivityEditTitle} onChangeText={setQrActivityEditTitle} placeholderTextColor={inputPlaceholderColor} />
                      <View style={styles.inlineActions}>
                        <TouchableOpacity style={styles.secondaryButton} onPress={saveQrActivityListEdit}>
                          <Ionicons name="save-outline" size={17} color={palette.red} />
                          <Text style={styles.secondaryButtonText}>Guardar lista</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.cardEyebrow}>Compartir / Ver lista</Text>
                      {qrActivityShares.length === 0 ? <Text style={styles.cardText}>Solo visible para el creador y el alcance base.</Text> : null}
                      {qrActivityShares.map((share) => (
                        <Text key={share.id} style={styles.cardText}>
                          {share.shared_with_role ? `Rango: ${roleLabel(share.shared_with_role as Role)}` : `Usuario: ${share.shared_with_user_name?.trim() || share.shared_with_user_id || 'Usuario'}`}
                        </Text>
                      ))}
                      <TouchableOpacity style={styles.dropdownButton} onPress={() => setQrActivityShareDropdownOpen((current) => !current)}>
                        <Text style={styles.dropdownButtonText}>Agregar comparticion ({qrActivityEditShareUserIds.length + qrActivityEditShareRoles.length})</Text>
                        <Ionicons name={qrActivityShareDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={palette.red} />
                      </TouchableOpacity>
                      {qrActivityShareDropdownOpen ? (
                        <View style={styles.profileCommunityPanel}>
                          <Text style={styles.cardEyebrow}>Rangos</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                            {qrActivityShareRoleOptions.map((role) => {
                              const selected = qrActivityEditShareRoles.includes(role.role);
                              return (
                                <TouchableOpacity key={role.role} style={[styles.filterChip, selected && styles.filterChipActive]} onPress={() => toggleQrActivityShareRole(role.role, 'edit')}>
                                  <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>{role.label}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                          <Text style={styles.cardEyebrow}>Usuarios</Text>
                          <ScrollView style={styles.dropdownList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                            {qrActivityShareUserOptions.slice(0, 80).map((user) => {
                              const selected = qrActivityEditShareUserIds.includes(user.id);
                              return (
                                <TouchableOpacity key={user.id} style={[styles.dropdownItem, selected && styles.qrActivityUserSelected]} onPress={() => toggleQrActivityShareUser(user.id, 'edit')}>
                                  <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={selected ? palette.white : palette.red} />
                                  <View style={styles.adminUserHeaderText}>
                                    <Text style={[styles.dropdownItemText, selected && styles.qrActivityUserSelectedText]}>{userListDisplayName(user)}</Text>
                                    <Text style={[styles.feedMeta, selected && styles.qrActivityUserSelectedText]}>{roleLabel((user.role || 'palestrista') as Role)} - {user.province ?? 'Sin provincia'}</Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                          <TouchableOpacity style={styles.primaryButton} onPress={saveQrActivityShares}>
                            <Text style={styles.primaryButtonText}>Guardar comparticion</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}
                      {['animador_comunidad', 'coordinador_comunidad'].includes(session.role) || roleRank(session.role) >= roleRank('vocal') ? (
                        <>
                          <Text style={styles.cardEyebrow}>Agregar miembros</Text>
                          <View style={styles.filterRow}>
                            {(['usuarios', 'todos'] as const).map((mode) => (
                              <TouchableOpacity key={mode} style={[styles.filterChip, qrActivityUserMode === mode && styles.filterChipActive, qrActivityUserSelectionDisabled && styles.lockedCard]} disabled={qrActivityUserSelectionDisabled} onPress={() => setQrActivityUserMode(mode)}>
                                <Text style={[styles.filterChipText, qrActivityUserMode === mode && styles.filterChipTextActive]}>{mode === 'usuarios' ? 'Usuarios' : 'Todos'}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                          {qrActivityUserSelectionDisabled ? <Text style={styles.cardText}>La seleccion de usuarios queda inhabilitada por el alcance Todas.</Text> : null}
                          {qrActivityUserMode === 'todos' && !qrActivityUserSelectionDisabled ? (
                            <TouchableOpacity style={styles.primaryButton} onPress={addAllUsersToQrActivity}>
                              <Text style={styles.primaryButtonText}>Agregar todos los usuarios del alcance</Text>
                            </TouchableOpacity>
                          ) : null}
                          {qrActivityUserMode === 'usuarios' && !qrActivityUserSelectionDisabled ? (
                            <>
                          <TextInput style={styles.input} placeholder="Buscar usuario" value={qrActivityUserSearch} onChangeText={setQrActivityUserSearch} placeholderTextColor={inputPlaceholderColor} />
                          <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                            {(['animador_comunidad', 'coordinador_comunidad'].includes(session.role) ? communityMembers : qrActivityMemberOptions).slice(0, 80).map((user) => {
                              const userId = user.id;
                              const alreadyAdded = qrActivityMembers.some((member) => member.user_id === userId);
                              return (
                                <TouchableOpacity key={userId} style={styles.dropdownItem} onPress={() => addUserToQrActivity(userId)} disabled={alreadyAdded}>
                                  <Ionicons name={alreadyAdded ? 'checkmark-circle-outline' : 'add-circle-outline'} size={18} color={alreadyAdded ? palette.green : palette.red} />
                                  <View style={styles.adminUserHeaderText}>
                                    <Text style={styles.dropdownItemText}>{userListDisplayName(user)}</Text>
                                    <Text style={styles.feedMeta}>{'community_name' in user ? user.community_name ?? 'Sin comunidad' : ''}</Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                            </>
                          ) : null}
                        </>
                      ) : null}
                      <View style={styles.inlineActions}>
                        {canScanCredentialQr(session) ? (
                          <TouchableOpacity style={styles.primaryButton} onPress={() => openQrScanner('activity')}>
                            <Ionicons name="scan-outline" size={17} color={palette.white} />
                            <Text style={styles.primaryButtonText}>Validar QR</Text>
                          </TouchableOpacity>
                        ) : null}
                        <TouchableOpacity style={styles.secondaryButton} onPress={exportQrActivityAttendanceDoc}>
                          <Ionicons name="download-outline" size={17} color={palette.red} />
                          <Text style={styles.secondaryButtonText}>Exportar DOC</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.cardEyebrow}>Miembros cargados ({qrActivityMembers.length})</Text>
                      {qrActivityMembers.map((member) => (
                        <View key={member.id} style={styles.adminListRow}>
                          <View style={styles.adminUserHeaderText}>
                            <Text style={styles.adminQuickText}>{userListDisplayName(member)}</Text>
                            <Text style={styles.cardText}>{member.community_name ?? 'Sin comunidad'}</Text>
                          </View>
                          <TouchableOpacity style={styles.actionPill} onPress={() => removeUserFromQrActivity(member.user_id)}>
                            <Ionicons name="trash-outline" size={16} color={palette.red} />
                            <Text style={styles.actionPillText}>Quitar</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                      <Text style={styles.cardEyebrow}>Validados por QR ({qrActivityAttendance.length})</Text>
                      {qrActivityAttendance.map((item) => (
                        <View key={item.id} style={styles.adminListRow}>
                          <Ionicons name="checkmark-circle-outline" size={20} color={palette.green} />
                          <View style={styles.adminUserHeaderText}>
                            <Text style={styles.adminQuickText}>{userListDisplayName(item)}</Text>
                            <Text style={styles.cardText}>{item.community_name ?? 'Sin comunidad'} - {item.validated_at ? new Date(item.validated_at).toLocaleString('es-AR') : ''}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {adminModule === 'navegacion' ? (
                <View style={styles.navigationBuilderScreen}>
                  <View style={styles.navigationBuilderHero}>
                    <View style={styles.navigationHeroText}>
                      <Text style={styles.navigationHeroEyebrow}>Constructor visual</Text>
                      <Text style={styles.navigationHeroTitle}>Navegación de la app</Text>
                      <Text style={styles.navigationHeroBody}>Edita la barra inferior como un panel profesional: orden, iconos, nombres, visibilidad y roles desde una sola pantalla.</Text>
                    </View>
                    <View style={styles.navigationHeroBadge}>
                      <Ionicons name="phone-portrait-outline" size={22} color={palette.white} />
                    </View>
                  </View>

                  <View style={styles.navigationStatsRow}>
                    <View style={styles.navigationStatPill}>
                      <Text style={styles.navigationStatValue}>{editableTabs.length}</Text>
                      <Text style={styles.navigationStatLabel}>Secciones</Text>
                    </View>
                    <View style={styles.navigationStatPill}>
                      <Text style={styles.navigationStatValue}>{navigationVisibleCount}</Text>
                      <Text style={styles.navigationStatLabel}>Visibles</Text>
                    </View>
                    <View style={styles.navigationStatPill}>
                      <Text style={styles.navigationStatValue}>{navigationLockedCount}</Text>
                      <Text style={styles.navigationStatLabel}>Base</Text>
                    </View>
                  </View>

                  <View style={styles.navigationPhonePreview}>
                    <View style={styles.navigationPhoneTop}>
                      <View>
                        <Text style={styles.navigationPhoneTitle}>Palestra</Text>
                        <Text style={styles.navigationPhoneSub}>Vista previa en vivo</Text>
                      </View>
                      <View style={styles.navigationPhoneStatus} />
                    </View>
                    <View style={styles.navigationPreviewContent}>
                      <Text style={styles.navigationPreviewLabel}>Barra inferior</Text>
                      <Text style={styles.navigationPreviewHint}>Los cambios de esta pantalla impactan globalmente al refrescar la app.</Text>
                    </View>
                    <View style={styles.navPreviewBar}>
                      {editableTabs.slice(0, 7).map((tab) => {
                        const draft = editingTabs[tab.key] ?? { label: tab.label, iconName: tab.icon, sectionType: tab.sectionType, isVisible: tab.visible, visibleRoles: tab.visibleRoles };
                        const iconName = isIoniconName(draft.iconName) ? draft.iconName : 'help-circle-outline';
                        const selected = selectedNavigationTab?.key === tab.key;
                        return (
                          <TouchableOpacity key={`preview-${tab.key}`} style={[styles.navPreviewItem, !draft.isVisible && styles.navPreviewItemHidden, selected && styles.navPreviewItemSelected]} onPress={() => setSelectedNavigationTabKey(tab.key)} activeOpacity={0.85}>
                            <Ionicons name={iconName} size={18} color={selected ? palette.white : draft.isVisible ? palette.red : palette.inkMuted} />
                            <Text numberOfLines={1} style={[styles.navPreviewText, selected && styles.navPreviewTextSelected]}>{draft.label || tab.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navigationRail}>
                    {editableTabs.map((tab, index) => {
                      const draft = editingTabs[tab.key] ?? { label: tab.label, iconName: tab.icon, sectionType: tab.sectionType, isVisible: tab.visible, visibleRoles: tab.visibleRoles };
                      const iconName = isIoniconName(draft.iconName) ? draft.iconName : 'help-circle-outline';
                      const selected = selectedNavigationTab?.key === tab.key;
                      return (
                        <TouchableOpacity key={`rail-${tab.key}`} style={[styles.navigationRailItem, selected && styles.navigationRailItemActive]} onPress={() => setSelectedNavigationTabKey(tab.key)} activeOpacity={0.85}>
                          <Ionicons name={iconName} size={20} color={selected ? palette.white : palette.red} />
                          <Text numberOfLines={1} style={[styles.navigationRailText, selected && styles.navigationRailTextActive]}>{draft.label || tab.label}</Text>
                          <Text style={[styles.navigationRailMeta, selected && styles.navigationRailTextActive]}>#{index + 1}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {selectedNavigationTab && selectedNavigationDraft ? (
                    <View style={styles.navigationFocusPanel}>
                      <View style={styles.navigationFocusHeader}>
                        <View style={styles.navigationFocusIcon}>
                          <Ionicons name={isIoniconName(selectedNavigationDraft.iconName) ? selectedNavigationDraft.iconName : 'help-circle-outline'} size={28} color={palette.red} />
                        </View>
                        <View style={styles.adminUserHeaderText}>
                          <Text style={styles.navigationFocusTitle}>{selectedNavigationDraft.label || selectedNavigationTab.label}</Text>
                          <Text style={styles.feedMeta}>Clave interna: {selectedNavigationTab.key}</Text>
                          <Text style={styles.feedMeta}>Orden actual: {selectedNavigationTab.sortOrder}</Text>
                        </View>
                      </View>

                      <View style={styles.navigationFieldGrid}>
                        <View style={styles.navigationField}>
                          <Text style={styles.cardEyebrow}>Nombre visible</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Ej: Noticias"
                            value={selectedNavigationDraft.label}
                            onChangeText={(value) => setEditingTabs((current) => ({ ...current, [selectedNavigationTab.key]: { ...selectedNavigationDraft, label: value } }))}
                           placeholderTextColor={inputPlaceholderColor} />
                        </View>
                        <View style={styles.navigationField}>
                          <Text style={styles.cardEyebrow}>Icono Ionicons</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Ej: newspaper-outline"
                            value={selectedNavigationDraft.iconName}
                            onChangeText={(value) => setEditingTabs((current) => ({ ...current, [selectedNavigationTab.key]: { ...selectedNavigationDraft, iconName: value } }))}
                            autoCapitalize="none"
                           placeholderTextColor={inputPlaceholderColor} />
                        </View>
                      </View>

                      <Text style={styles.cardEyebrow}>Iconos rápidos</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navigationIconPicker}>
                        {navigationIconSuggestions.map((icon) => (
                          <TouchableOpacity key={icon} style={[styles.navigationIconChoice, selectedNavigationDraft.iconName === icon && styles.navigationIconChoiceActive]} onPress={() => setEditingTabs((current) => ({ ...current, [selectedNavigationTab.key]: { ...selectedNavigationDraft, iconName: icon } }))}>
                            <Ionicons name={icon} size={21} color={selectedNavigationDraft.iconName === icon ? palette.white : palette.red} />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      <Text style={styles.cardEyebrow}>Tipo de seccion</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                        {navigationSectionTypes.map((type) => {
                          const selected = selectedNavigationDraft.sectionType === type.key;
                          const lockedInternal = defaultTabByKey.has(selectedNavigationTab.key) && type.key !== 'internal';
                          return (
                            <TouchableOpacity
                              key={`type-${type.key}`}
                              style={[styles.filterChip, selected && styles.filterChipActive, lockedInternal && styles.disabledChip]}
                              disabled={lockedInternal}
                              onPress={() => setEditingTabs((current) => ({ ...current, [selectedNavigationTab.key]: { ...selectedNavigationDraft, sectionType: type.key } }))}
                            >
                              <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>{type.label}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                      <Text style={styles.feedMeta}>{navigationSectionTypes.find((type) => type.key === selectedNavigationDraft.sectionType)?.description ?? 'Pagina simple.'}</Text>

                      <View style={styles.navigationActionGrid}>
                        <TouchableOpacity style={styles.navigationMiniAction} onPress={() => adminMoveTab(selectedNavigationTab.key, -1)} disabled={editableTabs[0]?.key === selectedNavigationTab.key}>
                          <Ionicons name="arrow-back-outline" size={17} color={palette.red} />
                          <Text style={styles.navigationMiniActionText}>Mover izq.</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.navigationMiniAction} onPress={() => adminMoveTab(selectedNavigationTab.key, 1)} disabled={editableTabs[editableTabs.length - 1]?.key === selectedNavigationTab.key}>
                          <Ionicons name="arrow-forward-outline" size={17} color={palette.red} />
                          <Text style={styles.navigationMiniActionText}>Mover der.</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.navigationMiniAction, selectedNavigationDraft.isVisible && styles.navigationMiniActionActive]}
                          onPress={() => setEditingTabs((current) => ({ ...current, [selectedNavigationTab.key]: { ...selectedNavigationDraft, isVisible: !selectedNavigationDraft.isVisible } }))}
                        >
                          <Ionicons name={selectedNavigationDraft.isVisible ? 'eye-outline' : 'eye-off-outline'} size={17} color={selectedNavigationDraft.isVisible ? palette.white : palette.red} />
                          <Text style={[styles.navigationMiniActionText, selectedNavigationDraft.isVisible && styles.navigationMiniActionTextActive]}>{selectedNavigationDraft.isVisible ? 'Visible' : 'Oculta'}</Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.cardEyebrow}>Roles que ven esta sección</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                        {visibleHierarchyFor(session).map((role) => {
                          const roles = selectedNavigationDraft.visibleRoles ?? visibleHierarchyFor(session).map((item) => item.role);
                          const checked = roles.includes(role.role);
                          return (
                            <TouchableOpacity key={role.role} style={[styles.filterChip, checked && styles.filterChipActive]} onPress={() => updateTabRole(selectedNavigationTab.key, role.role as Role, !checked)}>
                              <Text style={[styles.filterChipText, checked && styles.filterChipTextActive]}>{role.label}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>

                      <View style={styles.inlineActions}>
                        <TouchableOpacity style={styles.primaryButton} onPress={() => adminSaveTab(selectedNavigationTab.key, selectedNavigationTab.label)}>
                          <Ionicons name="save-outline" size={17} color={palette.white} />
                          <Text style={styles.primaryButtonText}>Guardar sección</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryButton} onPress={() => adminDeleteTab(selectedNavigationTab.key)}>
                          <Ionicons name="trash-outline" size={17} color={palette.red} />
                          <Text style={styles.secondaryButtonText}>{(!protectedTabKeys.has(selectedNavigationTab.key) && !defaultTabByKey.has(selectedNavigationTab.key)) ? 'Eliminar' : 'No eliminable'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}

                  <View style={styles.navigationCreatePanel}>
                    <View style={styles.navigationCreateHeader}>
                      <Ionicons name="add-circle-outline" size={22} color={palette.red} />
                      <Text style={styles.navigationFocusTitle}>Nueva sección</Text>
                    </View>
                    <TextInput style={styles.input} placeholder="Nombre visible. Ej: Noticias" value={newTabLabel} onChangeText={setNewTabLabel}  placeholderTextColor={inputPlaceholderColor} />
                    <TextInput style={styles.input} placeholder="Clave interna. Ej: noticias" value={newTabKey} onChangeText={(value) => setNewTabKey(normalizeTabKey(value))} autoCapitalize="none"  placeholderTextColor={inputPlaceholderColor} />
                    <TextInput style={styles.input} placeholder="Icono. Ej: newspaper-outline" value={newTabIcon} onChangeText={setNewTabIcon} autoCapitalize="none"  placeholderTextColor={inputPlaceholderColor} />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navigationIconPicker}>
                      {navigationIconSuggestions.map((icon) => (
                        <TouchableOpacity key={`new-${icon}`} style={[styles.navigationIconChoice, newTabIcon === icon && styles.navigationIconChoiceActive]} onPress={() => setNewTabIcon(icon)}>
                          <Ionicons name={icon} size={21} color={newTabIcon === icon ? palette.white : palette.red} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <Text style={styles.cardEyebrow}>Tipo de seccion</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                      {navigationSectionTypes.map((type) => (
                        <TouchableOpacity key={`new-type-${type.key}`} style={[styles.filterChip, newTabSectionType === type.key && styles.filterChipActive]} onPress={() => setNewTabSectionType(type.key)}>
                          <Text style={[styles.filterChipText, newTabSectionType === type.key && styles.filterChipTextActive]}>{type.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <Text style={styles.feedMeta}>{navigationSectionTypes.find((type) => type.key === newTabSectionType)?.description}</Text>
                    <Text style={styles.cardEyebrow}>Roles visibles</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                      {visibleHierarchyFor(session).map((role) => (
                        <TouchableOpacity key={role.role} style={[styles.filterChip, newTabRoles.includes(role.role as Role) && styles.filterChipActive]} onPress={() => toggleNewTabRole(role.role as Role)}>
                          <Text style={[styles.filterChipText, newTabRoles.includes(role.role as Role) && styles.filterChipTextActive]}>{role.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <TouchableOpacity style={styles.primaryButton} onPress={adminCreatePage}>
                      <Ionicons name="add-circle-outline" size={17} color={palette.white} />
                      <Text style={styles.primaryButtonText}>Crear sección</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.navigationRestoreButton} onPress={adminRestoreDefaultNavigation}>
                    <Ionicons name="refresh-circle-outline" size={18} color={palette.red} />
                    <Text style={styles.secondaryButtonText}>Restaurar navegación predeterminada</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {adminModule === 'contenido_general' ? (
                <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
                <Text style={styles.cardTitle}>Contenido General</Text>
                <Text style={styles.cardText}>Modificar nombres de pestanas y editar el contenido completo de cada pagina.</Text>
                {session?.role === 'administrador' ? (
                  <>
                    <Text style={styles.cardEyebrow}>Crear pagina nueva</Text>
                    <TextInput style={styles.input} placeholder="Nombre de la pagina" value={newTabLabel} onChangeText={setNewTabLabel}  placeholderTextColor={inputPlaceholderColor} />
                    <Text style={styles.cardText}>Roles que pueden verla</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                      {visibleHierarchyFor(session).map((role) => (
                        <TouchableOpacity key={role.role} style={[styles.filterChip, newTabRoles.includes(role.role as Role) && styles.filterChipActive]} onPress={() => toggleNewTabRole(role.role as Role)}>
                          <Text style={[styles.filterChipText, newTabRoles.includes(role.role as Role) && styles.filterChipTextActive]}>{role.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <TouchableOpacity style={styles.primaryButton} onPress={adminCreatePage}>
                      <Text style={styles.primaryButtonText}>Crear pagina</Text>
                    </TouchableOpacity>
                    <Text style={styles.cardEyebrow}>Accesos, orden y visibilidad</Text>
                    {editableTabs.map((tab, index) => {
                      const draft = editingTabs[tab.key] ?? { label: tab.label, iconName: tab.icon, sectionType: tab.sectionType, isVisible: tab.visible, visibleRoles: tab.visibleRoles };
                      return (
                        <View key={tab.key} style={styles.tabEditorRow}>
                          <Text style={styles.cardEyebrow}>{tab.key}</Text>
                          <TextInput
                            style={styles.input}
                            value={draft.label}
                            onChangeText={(value) => setEditingTabs((current) => ({ ...current, [tab.key]: { ...draft, label: value } }))}
                           placeholderTextColor={inputPlaceholderColor} />
                          <View style={styles.inlineActions}>
                            <TouchableOpacity style={styles.secondaryButton} onPress={() => adminMoveTab(tab.key, -1)} disabled={index === 0}>
                              <Text style={styles.secondaryButtonText}>Subir</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryButton} onPress={() => adminMoveTab(tab.key, 1)} disabled={index === editableTabs.length - 1}>
                              <Text style={styles.secondaryButtonText}>Bajar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.secondaryButton, draft.isVisible && styles.filterChipActive]}
                              onPress={() => setEditingTabs((current) => ({ ...current, [tab.key]: { ...draft, isVisible: !draft.isVisible } }))}
                            >
                              <Text style={[styles.secondaryButtonText, draft.isVisible && styles.filterChipTextActive]}>{draft.isVisible ? 'Visible' : 'Oculta'}</Text>
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity style={styles.primaryButton} onPress={() => adminSaveTab(tab.key, tab.label)}>
                            <Text style={styles.primaryButtonText}>Guardar pestana</Text>
                          </TouchableOpacity>
                          <Text style={styles.cardEyebrow}>Visible para roles</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                            {visibleHierarchyFor(session).map((role) => {
                              const roles = draft.visibleRoles ?? visibleHierarchyFor(session).map((item) => item.role);
                              const checked = roles.includes(role.role);
                              return (
                                <TouchableOpacity key={role.role} style={[styles.filterChip, checked && styles.filterChipActive]} onPress={() => updateTabRole(tab.key, role.role as Role, !checked)}>
                                  <Text style={[styles.filterChipText, checked && styles.filterChipTextActive]}>{role.label}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>
                      );
                    })}
                  </>
                ) : (
                  <Text style={styles.cardText}>La creacion, orden y visibilidad de accesos queda reservada al administrador.</Text>
                )}
                <Text style={styles.cardEyebrow}>Contenido de pagina</Text>
                <Text style={styles.cardText}>Editor por bloques: podes mover, borrar, cambiar titulos, texto e imagenes.</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                  {editableTabs.filter((tab) => tab.key !== 'perfil').map((tab) => (
                    <TouchableOpacity
                      key={tab.key}
                      style={[styles.filterChip, selectedContentTab === tab.key && styles.filterChipActive]}
                      onPress={() => setSelectedContentTab(tab.key)}
                    >
                      <Text style={[styles.filterChipText, selectedContentTab === tab.key && styles.filterChipTextActive]}>{tab.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TextInput style={styles.input} placeholder="Título de la sección" value={contentTitle} onChangeText={setContentTitle}  placeholderTextColor={inputPlaceholderColor} />
                <TextInput style={[styles.input, styles.textArea]} placeholder="Texto de la sección" value={contentBody} onChangeText={setContentBody} multiline  placeholderTextColor={inputPlaceholderColor} />
                <View style={styles.inlineActions}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => addContentBlock('titulo')}>
                    <Text style={styles.secondaryButtonText}>+ Titulo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => addContentBlock('texto')}>
                    <Text style={styles.secondaryButtonText}>+ Texto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => addContentBlock('imagen')}>
                    <Text style={styles.secondaryButtonText}>+ Imagen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => addContentBlock('enlace')}>
                    <Text style={styles.secondaryButtonText}>+ Enlace</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => addContentBlock('campo')}>
                    <Text style={styles.secondaryButtonText}>+ Campo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => addContentBlock('modulo')}>
                    <Text style={styles.secondaryButtonText}>+ Modulo</Text>
                  </TouchableOpacity>
                </View>
                {contentBlocks.map((block, index) => (
                  <View key={`${block.id}-${index}`} style={styles.blockEditorCard}>
                    <Text style={styles.cardEyebrow}>{block.type}</Text>
                    <TextInput
                      style={[styles.input, block.type === 'texto' && styles.textArea]}
                      placeholder={
                        block.type === 'imagen'
                          ? 'URL de imagen'
                          : block.type === 'enlace'
                            ? 'Etiqueta|https://...'
                            : block.type === 'campo'
                              ? 'destino=Panel de solicitudes'
                              : block.type === 'modulo'
                                ? 'inicio, noticias, comunidades, descargas...'
                                : 'Contenido'
                      }
                      value={block.value}
                      onChangeText={(value) => updateContentBlock(block.id, value)}
                      multiline={block.type !== 'titulo'}
                     placeholderTextColor={inputPlaceholderColor} />
                    <View style={styles.inlineActions}>
                      <TouchableOpacity style={styles.rowActionButton} onPress={() => moveContentBlock(index, -1)}>
                        <Ionicons name="arrow-up-outline" size={14} color={palette.red} />
                        <Text style={styles.rowActionButtonText}>Subir</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rowActionButton} onPress={() => moveContentBlock(index, 1)}>
                        <Ionicons name="arrow-down-outline" size={14} color={palette.red} />
                        <Text style={styles.rowActionButtonText}>Bajar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.rowActionButton, styles.rowActionButtonDanger]} onPress={() => deleteContentBlock(block.id)}>
                        <Ionicons name="trash-outline" size={14} color="#B93232" />
                        <Text style={[styles.rowActionButtonText, styles.rowActionButtonTextDanger]}>Borrar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={styles.primaryButton} onPress={adminSaveContent}>
                  <Text style={styles.primaryButtonText}>Guardar contenido</Text>
                </TouchableOpacity>
                </View>
              ) : null}
            </View>
            </View>
              )
          ) : null}
        </View>
      ) : (
        <GuestProfileAuthCard
          authMode={authMode}
          setAuthMode={setAuthMode}
          authFocusedField={authFocusedField}
          setAuthFocusedField={setAuthFocusedField}
          authErrors={authErrors}
          setAuthErrors={setAuthErrors}
          authMessage={authMessage}
          authEmail={authEmail}
          setAuthEmail={setAuthEmail}
          authPassword={authPassword}
          setAuthPassword={setAuthPassword}
          authPasswordConfirm={authPasswordConfirm}
          setAuthPasswordConfirm={setAuthPasswordConfirm}
          authPasswordVisible={authPasswordVisible}
          setAuthPasswordVisible={setAuthPasswordVisible}
          registerFullName={registerFullName}
          setRegisterFullName={setRegisterFullName}
          registerContact={registerContact}
          setRegisterContact={setRegisterContact}
          registerProvince={registerProvince}
          setRegisterProvince={setRegisterProvince}
          registerCommunity={registerCommunity}
          setRegisterCommunity={setRegisterCommunity}
          registerPerseveranceStartYear={registerPerseveranceStartYear}
          setRegisterPerseveranceStartYear={setRegisterPerseveranceStartYear}
          registrationCommunities={registrationCommunities}
          selectedRegistrationProvince={selectedRegistrationProvince}
          provinceDropdownOpen={provinceDropdownOpen}
          setProvinceDropdownOpen={setProvinceDropdownOpen}
          communityDropdownOpen={communityDropdownOpen}
          setCommunityDropdownOpen={setCommunityDropdownOpen}
          registerPerseveranceYearDropdownOpen={registerPerseveranceYearDropdownOpen}
          setRegisterPerseveranceYearDropdownOpen={setRegisterPerseveranceYearDropdownOpen}
          onRegister={registerReal}
          onSignIn={signInReal}
        />
      )}
    </View>
  );
}
