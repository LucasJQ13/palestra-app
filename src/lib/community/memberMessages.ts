import { MailboxMessageRecord } from '../profiles';

export type CommunityMemberConversationTarget = {
  conversationId: string;
  folder: 'entrada' | 'enviados';
};

export function directConversationId(userId: string) {
  return `user:${userId}`;
}

export function findCommunityMemberConversation(
  messages: MailboxMessageRecord[],
  viewerId: string,
  memberId: string
): CommunityMemberConversationTarget | null {
  const directMessages = messages.filter((message) => {
    if (message.source !== 'direct' || (message.mailbox_folder ?? 'entrada') === 'eliminados') {
      return false;
    }
    return (
      (message.sender_id === viewerId && message.recipient_id === memberId)
      || (message.sender_id === memberId && message.recipient_id === viewerId)
    );
  });

  if (directMessages.length === 0) {
    return null;
  }

  const hasReceived = directMessages.some((message) => (
    message.sender_id === memberId
    && (message.mailbox_folder ?? 'entrada') === 'entrada'
  ));

  return {
    conversationId: directConversationId(memberId),
    folder: hasReceived ? 'entrada' : 'enviados'
  };
}
