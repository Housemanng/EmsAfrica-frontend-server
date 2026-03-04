import type { RootState } from "../../app/store";

export const selectInbox          = (state: RootState) => state.messages.inbox;
export const selectInboxLoading   = (state: RootState) => state.messages.inboxLoading;
export const selectInboxError     = (state: RootState) => state.messages.inboxError;

export const selectAllMessages        = (state: RootState) => state.messages.allMessages;
export const selectAllMessagesLoading = (state: RootState) => state.messages.allMessagesLoading;

export const selectConversations        = (state: RootState) => state.messages.conversations;
export const selectConversationsLoading = (state: RootState) => state.messages.conversationsLoading;
export const selectConversationsError   = (state: RootState) => state.messages.conversationsError;

const EMPTY_THREAD: never[] = [];
export const selectThreads            = (state: RootState) => state.messages.threads;
export const selectThread = (agentId: string) => (state: RootState) =>
  state.messages.threads[agentId] ?? EMPTY_THREAD;
export const selectThreadLoading      = (state: RootState) => state.messages.threadLoading;
export const selectActiveThreadAgentId = (state: RootState) => state.messages.activeThreadAgentId;

export const selectOpenMessage        = (state: RootState) => state.messages.openMessage;
export const selectOpenMessageLoading = (state: RootState) => state.messages.openMessageLoading;
export const selectOpenMessageError   = (state: RootState) => state.messages.openMessageError;

export const selectReadIds = (state: RootState) => state.messages.readIds;

export const selectReplyLoading = (state: RootState) => state.messages.replyLoading;
export const selectReplyError   = (state: RootState) => state.messages.replyError;

export const selectBroadcastLoading = (state: RootState) => state.messages.broadcastLoading;
export const selectBroadcastError   = (state: RootState) => state.messages.broadcastError;

export const selectOnlineUserIds = (state: RootState) => state.messages.onlineUserIds;
export const selectTypingUserId = (state: RootState) => state.messages.typingUserId;

/** Total unread count across inbox (uses server isRead flag when available) */
export const selectUnreadCount = (state: RootState) => {
  const readIds = state.messages.readIds;
  return state.messages.inbox.filter((m) => {
    if (m.isRead !== undefined) return !m.isRead;
    return !readIds.includes(m._id);
  }).length;
};

/** Total unread count from conversations (for overview roles sidebar badge) */
export const selectTotalConversationUnread = (state: RootState) =>
  state.messages.conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
