export type CommunityInternalRole =
  | 'member'
  | 'animator'
  | 'coordinator'
  | 'advisor'
  | 'administrator';

export type CommunityScope = {
  name?: string | null;
  province?: string | null;
};

export type CommunityCapabilities = {
  role: CommunityInternalRole | null;
  canView: boolean;
  canViewMembers: boolean;
  canMessageMembers: boolean;
  canOpenPanel: boolean;
  canPublishNotices: boolean;
  canManageAllNotices: boolean;
  canManageOwnNotices: boolean;
  canEditCommunityDetails: boolean;
  canManageMembers: boolean;
  canNotifyMembers: boolean;
};
