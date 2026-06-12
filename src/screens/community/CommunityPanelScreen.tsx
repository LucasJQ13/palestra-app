import React from 'react';
import { Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppCommunityLocation } from '../../lib/remoteData';
import { CommunityMember } from '../../lib/profiles';
import { CommunityCapabilities } from '../../lib/community/types';
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
  noticeTitle,
  noticeBody,
  noticeNotify,
  editingNoticeId,
  editingNoticeTitle,
  editingNoticeBody,
  onBack,
  onSaveDetails,
  onNoticeTitleChange,
  onNoticeBodyChange,
  onNoticeNotifyChange,
  onPublishNotice,
  onStartEditNotice,
  onEditingNoticeTitleChange,
  onEditingNoticeBodyChange,
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
  noticeTitle: string;
  noticeBody: string;
  noticeNotify: boolean;
  editingNoticeId?: string | null;
  editingNoticeTitle: string;
  editingNoticeBody: string;
  onBack: () => void;
  onSaveDetails: (values: { description: string; imageAsset: ImagePicker.ImagePickerAsset | null; imageUrl: string | null }) => void;
  onNoticeTitleChange: (value: string) => void;
  onNoticeBodyChange: (value: string) => void;
  onNoticeNotifyChange: (value: boolean) => void;
  onPublishNotice: () => void;
  onStartEditNotice: (notice: CommunityNoticePreview) => void;
  onEditingNoticeTitleChange: (value: string) => void;
  onEditingNoticeBodyChange: (value: string) => void;
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
          title={noticeTitle}
          body={noticeBody}
          notify={noticeNotify}
          canNotify={capabilities.canNotifyMembers}
          editingId={editingNoticeId}
          editingTitle={editingNoticeTitle}
          editingBody={editingNoticeBody}
          onTitleChange={onNoticeTitleChange}
          onBodyChange={onNoticeBodyChange}
          onNotifyChange={onNoticeNotifyChange}
          onPublish={onPublishNotice}
          onStartEdit={onStartEditNotice}
          onEditingTitleChange={onEditingNoticeTitleChange}
          onEditingBodyChange={onEditingNoticeBodyChange}
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
