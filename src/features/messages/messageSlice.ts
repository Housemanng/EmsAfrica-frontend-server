import { createSlice, isAnyOf, type PayloadAction } from "@reduxjs/toolkit";
import {
  getMyMessages,
  getAllOrgMessages,
  getConversations,
  getThread,
  getMessageById,
  replyToMessage,
  sendDirectMessage,
  createBroadcastMessage,
  markMessageReadApi,
  type IMessage,
  type IConversation,
} from "./messageApi";

interface MessageState {
  /** Inbox for agents — messages targeted at them */
  inbox: IMessage[];
  inboxLoading: boolean;
  inboxError: string | null;

  /** All org messages (overview roles) */
  allMessages: IMessage[];
  allMessagesLoading: boolean;
  allMessagesError: string | null;

  /** Conversation list (overview roles) */
  conversations: IConversation[];
  conversationsLoading: boolean;
  conversationsError: string | null;

  /** Active thread messages — keyed by agentId */
  threads: Record<string, IMessage[]>;
  threadLoading: boolean;
  threadError: string | null;
  activeThreadAgentId: string | null;

  /** Currently open message detail */
  openMessage: IMessage | null;
  openMessageLoading: boolean;
  openMessageError: string | null;

  /** IDs the user has "read" (client-side fallback, real source is server isRead) */
  readIds: string[];

  /** Reply / send state */
  replyLoading: boolean;
  replyError: string | null;

  /** Broadcast state */
  broadcastLoading: boolean;
  broadcastError: string | null;

  /** User IDs currently online in the org (from socket users:online) */
  onlineUserIds: string[];

  /** User ID of someone typing to us (in current thread) — cleared on stop or timeout */
  typingUserId: string | null;
}

const initialState: MessageState = {
  inbox: [],
  inboxLoading: false,
  inboxError: null,

  allMessages: [],
  allMessagesLoading: false,
  allMessagesError: null,

  conversations: [],
  conversationsLoading: false,
  conversationsError: null,

  threads: {},
  threadLoading: false,
  threadError: null,
  activeThreadAgentId: null,

  openMessage: null,
  openMessageLoading: false,
  openMessageError: null,

  readIds: [],
  replyLoading: false,
  replyError: null,

  broadcastLoading: false,
  broadcastError: null,

  onlineUserIds: [],
  typingUserId: null,
};

const messageSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    markRead: (state, action: PayloadAction<string>) => {
      if (!state.readIds.includes(action.payload)) {
        state.readIds.push(action.payload);
      }
      // Also mark in inbox
      state.inbox = state.inbox.map((m) =>
        m._id === action.payload ? { ...m, isRead: true } : m
      );
    },
    clearOpenMessage: (state) => {
      state.openMessage = null;
      state.openMessageError = null;
    },
    clearReplyError: (state) => {
      state.replyError = null;
    },
    clearBroadcastError: (state) => {
      state.broadcastError = null;
    },
    setActiveThread: (state, action: PayloadAction<string | null>) => {
      state.activeThreadAgentId = action.payload;
    },
    clearThread: (state) => {
      state.activeThreadAgentId = null;
    },
    /** Optimistically append a message to a thread (for instant UI) */
    appendToThread: (state, action: PayloadAction<{ agentId: string; message: IMessage }>) => {
      const { agentId, message } = action.payload;
      if (!state.threads[agentId]) state.threads[agentId] = [];
      state.threads[agentId] = [...state.threads[agentId], message];
    },

    /** Socket: a new top-level message arrived for this org */
    socketNewMessage: (state, action: PayloadAction<IMessage>) => {
      const msg = action.payload;
      // Add to inbox if not already present
      if (!state.inbox.find((m) => m._id === msg._id)) {
        state.inbox = [msg, ...state.inbox];
      }
      // For direct messages, also seed/update the thread
      if (msg.targetType === "direct") {
        const fromId = (msg.from as { _id?: string })?._id ?? "";
        const targetId = msg.targetId ?? "";
        // The "agent" side is whoever is not the current user — we key threads by agentId.
        // We update BOTH possible keys so it shows up regardless of which side you're on.
        for (const key of [fromId, targetId]) {
          if (!key) continue;
          if (!state.threads[key]) state.threads[key] = [];
          if (!state.threads[key].find((m) => m._id === msg._id)) {
            state.threads[key] = [...state.threads[key], msg];
          }
        }
        // Update conversations sidebar
        const existing = state.conversations.find(
          (c) => c.agentId === fromId || c.agentId === targetId
        );
        if (existing) {
          state.conversations = state.conversations.map((c) =>
            c.agentId === existing.agentId
              ? { ...c, latestMessage: msg, unreadCount: c.unreadCount + 1 }
              : c
          );
        }
      }
    },

    /** Socket: users currently online in the org */
    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUserIds = action.payload;
    },

    /** Socket: someone is typing to us */
    setTypingUser: (state, action: PayloadAction<string | null>) => {
      state.typingUserId = action.payload;
    },

    /** Socket: a reply was added to an existing message */
    socketNewReply: (state, action: PayloadAction<{ reply: IMessage; parentId: string }>) => {
      const { reply, parentId } = action.payload;
      // Append to open message replies
      if (state.openMessage?._id === parentId) {
        const already = (state.openMessage.replies ?? []).find((r) => r._id === reply._id);
        if (!already) {
          state.openMessage = {
            ...state.openMessage,
            replies: [...(state.openMessage.replies ?? []), reply],
          };
        }
      }
      // Append to active thread
      const activeId = state.activeThreadAgentId;
      if (activeId && state.threads[activeId]) {
        if (!state.threads[activeId].find((m) => m._id === reply._id)) {
          state.threads[activeId] = [...state.threads[activeId], reply];
        }
      }
    },
  },
  extraReducers: (builder) => {
    // ── getMyMessages ──────────────────────────────────────────────────────────
    builder
      .addCase(getMyMessages.pending,   (state) => { state.inboxLoading = true;  state.inboxError = null; })
      .addCase(getMyMessages.fulfilled, (state, action) => {
        state.inboxLoading = false;
        state.inbox = action.payload;
      })
      .addCase(getMyMessages.rejected,  (state, action) => {
        state.inboxLoading = false;
        state.inboxError = (action.payload as string) ?? "Failed to load messages";
      });

    // ── getAllOrgMessages ──────────────────────────────────────────────────────
    builder
      .addCase(getAllOrgMessages.pending,   (state) => { state.allMessagesLoading = true;  state.allMessagesError = null; })
      .addCase(getAllOrgMessages.fulfilled, (state, action) => {
        state.allMessagesLoading = false;
        state.allMessages = action.payload;
      })
      .addCase(getAllOrgMessages.rejected,  (state, action) => {
        state.allMessagesLoading = false;
        state.allMessagesError = (action.payload as string) ?? "Failed to load all messages";
      });

    // ── getConversations ───────────────────────────────────────────────────────
    builder
      .addCase(getConversations.pending,   (state) => { state.conversationsLoading = true;  state.conversationsError = null; })
      .addCase(getConversations.fulfilled, (state, action) => {
        state.conversationsLoading = false;
        state.conversations = action.payload;
      })
      .addCase(getConversations.rejected,  (state, action) => {
        state.conversationsLoading = false;
        state.conversationsError = (action.payload as string) ?? "Failed to load conversations";
      });

    // ── getThread ──────────────────────────────────────────────────────────────
    builder
      .addCase(getThread.pending,   (state) => { state.threadLoading = true;  state.threadError = null; })
      .addCase(getThread.fulfilled, (state, action) => {
        state.threadLoading = false;
        state.threads[action.payload.agentId] = action.payload.messages;
        state.activeThreadAgentId = action.payload.agentId;
        // Update unread count in conversations list
        state.conversations = state.conversations.map((c) =>
          c.agentId === action.payload.agentId ? { ...c, unreadCount: 0 } : c
        );
      })
      .addCase(getThread.rejected,  (state, action) => {
        state.threadLoading = false;
        state.threadError = (action.payload as string) ?? "Failed to load thread";
      });

    // ── getMessageById ─────────────────────────────────────────────────────────
    builder
      .addCase(getMessageById.pending,   (state) => { state.openMessageLoading = true;  state.openMessageError = null; })
      .addCase(getMessageById.fulfilled, (state, action) => {
        state.openMessageLoading = false;
        state.openMessage = action.payload;
        if (!state.readIds.includes(action.payload._id)) {
          state.readIds.push(action.payload._id);
        }
        state.inbox = state.inbox.map((m) =>
          m._id === action.payload._id ? { ...m, isRead: true } : m
        );
      })
      .addCase(getMessageById.rejected,  (state, action) => {
        state.openMessageLoading = false;
        state.openMessageError = (action.payload as string) ?? "Failed to load message";
      })

      // ── markMessageReadApi (must be before addMatcher) ─────────────────────────
      .addCase(markMessageReadApi.fulfilled, (state, action) => {
        const id = action.payload._id;
        state.inbox = state.inbox.map((m) => m._id === id ? { ...m, isRead: true } : m);
        if (!state.readIds.includes(id)) state.readIds.push(id);
      });

    // ── replyToMessage ─────────────────────────────────────────────────────────
    builder
      .addMatcher(isAnyOf(replyToMessage.pending),   (state) => { state.replyError = null; })
      .addMatcher(isAnyOf(replyToMessage.fulfilled), (state, action) => {
        if (state.openMessage) {
          const reply = action.payload;
          const existing = (state.openMessage.replies ?? []).find((r) => r._id === reply._id);
          if (!existing) {
            state.openMessage.replies = [...(state.openMessage.replies ?? []), reply];
          }
        }
        // Also append to active thread (for thread-based chat view)
        const activeId = state.activeThreadAgentId;
        const reply = action.payload;
        if (activeId && state.threads[activeId] && !state.threads[activeId].find((m) => m._id === reply._id)) {
          state.threads[activeId] = [...state.threads[activeId], reply];
        }
      })
      .addMatcher(isAnyOf(replyToMessage.rejected),  (state, action) => {
        state.replyError = (action.payload as string) ?? "Failed to send reply";
      });

    // ── sendDirectMessage ──────────────────────────────────────────────────────
    builder
      .addMatcher(isAnyOf(sendDirectMessage.pending),   (state) => { state.replyError = null; })
      .addMatcher(isAnyOf(sendDirectMessage.fulfilled), (state, action) => {
        const { targetUserId, message } = action.payload;
        if (!state.threads[targetUserId]) state.threads[targetUserId] = [];
        const withoutOpt = state.threads[targetUserId].filter((m) => !String(m._id).startsWith("opt-"));
        if (!withoutOpt.find((m) => m._id === message._id)) {
          state.threads[targetUserId] = [...withoutOpt, message];
        } else {
          state.threads[targetUserId] = withoutOpt;
        }
        // Update conversations latest message
        state.conversations = state.conversations.map((c) =>
          c.agentId === targetUserId
            ? { ...c, latestMessage: message }
            : c
        );
      })
      .addMatcher(isAnyOf(sendDirectMessage.rejected),  (state, action) => {
        state.replyError = (action.payload as string) ?? "Failed to send message";
      })

    // ── createBroadcastMessage ─────────────────────────────────────────────────
    .addMatcher(isAnyOf(createBroadcastMessage.pending),   (state) => {
      state.broadcastLoading = true;
      state.broadcastError = null;
    })
    .addMatcher(isAnyOf(createBroadcastMessage.fulfilled), (state) => {
      state.broadcastLoading = false;
    })
    .addMatcher(isAnyOf(createBroadcastMessage.rejected),  (state, action) => {
      state.broadcastLoading = false;
      state.broadcastError = (action.payload as string) ?? "Failed to send broadcast";
    });
  },
});

export const {
  markRead,
  clearOpenMessage,
  clearReplyError,
  clearBroadcastError,
  setActiveThread,
  clearThread,
  appendToThread,
  setOnlineUsers,
  setTypingUser,
  socketNewMessage,
  socketNewReply,
} = messageSlice.actions;

export const messageReducer = messageSlice.reducer;
