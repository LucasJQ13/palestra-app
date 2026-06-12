import React from 'react';
import { Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppCommunityLocation } from '../../lib/remoteData';
import { CommunityMember } from '../../lib/profiles';
import { CommunityCapabilities } from '../../lib/community/types';
import { CommunityNoticeDraft } from '../../lib/community/notices';
import { CommunityNoticePreview } from './CommunityNoticesPreview';
import { CommunityPanelHeader } from './panel/CommunityPanelHeader';
import { CommunityDetailsEditor } from './panel/CommunityDetailsEditor';
import { CommunityNoticeManager } from './panel/CommunityNoticeManager';
import { CommunityMembersManager } from './panel/CommunityMembersManager';
import { communityPanelStyles as styles } from './panel/communityPanelStyles';

export function CommunityPanelScreen({
  community,
  members,
  notices,
  capabilities,
  isDark,
  feedback,
  savingDetails,
  noticeDraft,
  noticeNotify,
  editingNoticeId,
  editingNoticeDraft,
  onBack,
  onSaveDetails,
  onNoticeDraftChange,
  onNoticeNotifyChange,
  onPublishNotice,
  onStartEditNotice,
  onEditingNoticeDraftChange,
  onSaveNotice,
  onCancelEditNotice,
  onArchiveNotice,
  canManageNotice,
  onViewProfile
}: {
  community?: AppCommunityLocation | null;
  members: CommunityMember[];
  notices: CommunityNoticePreview[];
  capabilities: CommunityCapabilities;
  isDark: boolean;
  feedback?: string;
  savingDetails: boolean;
  noticeDraft: CommunityNoticeDraft;
  noticeNotify: boolean;
  editingNoticeId?: string | null;
  editingNoticeDraft: CommunityNoticeDraft;
  onBack: () => void;
  onSaveDetails: (values: { description: string; imageAsset: ImagePicker.ImagePickerAsset | null; imageUrl: string | null }) => void;
  onNoticeDraftChange: (value: CommunityNoticeDraft) => void;
  onNoticeNotifyChange: (value: boolean) => void;
  onPublishNotice: () => void;
  onStartEditNotice: (notice: CommunityNoticePreview) => void;
  onEditingNoticeDraftChange: (value: CommunityNoticeDraft) => void;
  onSaveNotice: () => void;
  onCancelEditNotice: () => void;
  onArchiveNotice: (noticeId: string) => void;
  canManageNotice: (notice: CommunityNoticePreview) => boolean;
  onViewProfile: (member: CommunityMember) => void;
}) {
  return (
    <View style={styles.screen}>
      <CommunityPanelHeader communityName={community?.name || ''} isDark={isDark} onBack={onBack} />

      {capabilities.canEditCommunityDetails ? (
        <CommunityDetailsEditor
          description={community?.description}
          imageUrl={community?.imageUrl}
          isDark={isDark}
          saving={savingDetails}
          onSave={onSaveDetails}
        />
      ) : null}

      {capabilities.canPublishNotices ? (
        <CommunityNoticeManager
          notices={notices}
          isDark={isDark}
          draft={noticeDraft}
          notify={noticeNotify}
          canNotify={capabilities.canNotifyMembers}
          editingId={editingNoticeId}
          editingDraft={editingNoticeDraft}
          onDraftChange={onNoticeDraftChange}
          onNotifyChange={onNoticeNotifyChange}
          onPublish={onPublishNotice}
          onStartEdit={onStartEditNotice}
          onEditingDraftChange={onEditingNoticeDraftChange}
          onSaveEdit={onSaveNotice}
          onCancelEdit={onCancelEditNotice}
          onArchive={onArchiveNotice}
          canManageNotice={canManageNotice}
        />
      ) : null}

      {capabilities.canViewMembers ? (
        <CommunityMembersManager members={members} isDark={isDark} onViewProfile={onViewProfile} />
      ) : null}

      {feedback ? (
        <View style={[styles.panel, isDark && styles.panelDark]}>
          <Text style={[styles.body, isDark && styles.bodyDark]}>{feedback}</Text>
        </View>
      ) : null}
    </View>
  );
}
