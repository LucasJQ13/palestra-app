import { Role, Session } from '../../types/auth';

type MailboxRecipient = {
  id: string;
  role: string;
  province?: string | null;
  community_name?: string | null;
};

type CommunityOption = {
  id?: string | null;
  name: string;
};

export function resolveMailboxRecipientIds(values: {
  mode: string;
  session: Session;
  users: MailboxRecipient[];
  selectedUserIds: string[];
  targetRole: Role;
  targetProvince: string;
  targetCommunityId: string;
  communities: CommunityOption[];
}) {
  const { mode, session, users, selectedUserIds, targetRole, targetProvince, targetCommunityId, communities } = values;
  if (mode === 'user') {
    return selectedUserIds;
  }
  if (mode === 'all') {
    return users.map((user) => user.id);
  }
  if (mode === 'role') {
    return users.filter((user) => user.role === targetRole).map((user) => user.id);
  }
  if (mode === 'province') {
    const province = targetProvince || session.province;
    return users.filter((user) => user.province === province).map((user) => user.id);
  }
  if (mode === 'role_province') {
    const province = targetProvince || session.province;
    return users.filter((user) => user.role === targetRole && user.province === province).map((user) => user.id);
  }
  if (mode === 'diocesan_leadership') {
    return users
      .filter((user) => ['vocal', 'coordinador_diocesano'].includes(user.role) && (!targetProvince || user.province === targetProvince))
      .map((user) => user.id);
  }
  if (mode === 'province_communities') {
    return users
      .filter((user) => ['animador_comunidad', 'coordinador_comunidad'].includes(user.role) && user.province === session.province)
      .map((user) => user.id);
  }
  if (mode === 'community' || mode === 'my_community') {
    const communityName = communities.find((community) => community.id === (targetCommunityId || communities[0]?.id))?.name
      ?? session.communityOfOrigin;
    return users
      .filter((user) => ['animador_comunidad', 'coordinador_comunidad'].includes(user.role) && user.community_name === communityName)
      .map((user) => user.id);
  }
  return [];
}
