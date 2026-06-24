import { ProfilePanel } from '../types/appUi';
import { TabKey } from './navigationConstants';

export type MailboxNotificationTarget = {
  action: 'open-mailbox-message' | 'open-conversation';
  conversationId?: string | null;
  messageId?: string | null;
  senderId?: string | null;
};

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function tabFromNotificationData(data?: Record<string, unknown> | null): TabKey | null {
  if (!data) {
    return null;
  }
  return stringValue(data.tabKey) ?? stringValue(data.tab) ?? null;
}

export function profilePanelFromNotificationData(data?: Record<string, unknown> | null): ProfilePanel | null {
  const panel = stringValue(data?.profilePanel);
  return panel === 'buzon' ? 'buzon' : null;
}

export function mailboxTargetFromNotificationData(data?: Record<string, unknown> | null): MailboxNotificationTarget | null {
  if (!data) {
    return null;
  }
  const action = stringValue(data.action);
  if (action !== 'open-mailbox-message' && action !== 'open-conversation') {
    return null;
  }
  return {
    action,
    conversationId: stringValue(data.conversationId),
    messageId: stringValue(data.messageId),
    senderId: stringValue(data.senderId)
  };
}
