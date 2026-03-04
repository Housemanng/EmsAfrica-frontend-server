import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../config/apiConfig";
import type { RootState } from "../../app/store";

const getAuthHeaders = (getState: () => unknown) => {
  const token = (getState() as RootState).auth.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface IMessageUser {
  _id?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  photo?: string;
}

export interface IMessage {
  _id: string;
  title: string;
  body: string;
  targetType: string;
  targetId?: string;
  createdAt: string;
  updatedAt?: string;
  /** Server-annotated read status for the current user */
  isRead?: boolean;
  /** User IDs who have read this message (for delivery/read status) */
  readBy?: (string | { toString(): string })[];
  from?: IMessageUser;
  replies?: IMessage[];
}

export interface IConversation {
  agentId: string;
  agentInfo: IMessageUser;
  latestMessage: IMessage;
  unreadCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Thunks
// ─────────────────────────────────────────────────────────────────────────────

/** GET /my — inbox for any agent */
export const getMyMessages = createAsyncThunk(
  "messages/getMyMessages",
  async (organizationId: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/messages/organization/${organizationId}/my`, {
        headers: getAuthHeaders(getState),
      });
      return res.data as IMessage[];
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message ?? "Failed to fetch messages");
    }
  }
);

/** GET /organization/:orgId — all messages (overview roles only) */
export const getAllOrgMessages = createAsyncThunk(
  "messages/getAllOrgMessages",
  async (organizationId: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/messages/organization/${organizationId}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data as IMessage[];
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message ?? "Failed to fetch all messages");
    }
  }
);

/** GET /conversations — list of unique conversation threads (overview roles) */
export const getConversations = createAsyncThunk(
  "messages/getConversations",
  async (organizationId: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/messages/organization/${organizationId}/conversations`, {
        headers: getAuthHeaders(getState),
      });
      return res.data as IConversation[];
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message ?? "Failed to fetch conversations");
    }
  }
);

/** GET /thread/:agentId — chronological thread between current user and agentId */
export const getThread = createAsyncThunk(
  "messages/getThread",
  async (
    { organizationId, agentId }: { organizationId: string; agentId: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(`/messages/organization/${organizationId}/thread/${agentId}`, {
        headers: getAuthHeaders(getState),
      });
      return { agentId, messages: res.data as IMessage[] };
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message ?? "Failed to fetch thread");
    }
  }
);

/** GET /:id — single message with replies */
export const getMessageById = createAsyncThunk(
  "messages/getMessageById",
  async (
    { organizationId, messageId }: { organizationId: string; messageId: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(`/messages/organization/${organizationId}/${messageId}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data as IMessage;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message ?? "Failed to fetch message");
    }
  }
);

/** POST /:id/reply — reply to a message */
export const replyToMessage = createAsyncThunk(
  "messages/replyToMessage",
  async (
    { organizationId, messageId, body }: { organizationId: string; messageId: string; body: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post(
        `/messages/organization/${organizationId}/${messageId}/reply`,
        { body },
        { headers: getAuthHeaders(getState) }
      );
      return res.data as IMessage;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message ?? "Failed to send reply");
    }
  }
);

/**
 * POST /direct/:targetUserId — send a direct message to a specific user.
 * Used by agents to message overview roles, and vice versa.
 */
export const sendDirectMessage = createAsyncThunk(
  "messages/sendDirectMessage",
  async (
    { organizationId, targetUserId, body }: { organizationId: string; targetUserId: string; body: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post(
        `/messages/organization/${organizationId}/direct/${targetUserId}`,
        { body, title: "Direct Message" },
        { headers: getAuthHeaders(getState) }
      );
      return { targetUserId, message: res.data as IMessage };
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message ?? "Failed to send message");
    }
  }
);

/** Broadcast to all agents or by filter (overview roles only) */
export type BroadcastTarget =
  | { type: "all_agents" }
  | { type: "all_states" }
  | { type: "all_lgas_in_state"; stateId: string }
  | { type: "all_wards_in_lga"; lgaId: string }
  | { type: "all_pus_in_ward"; wardId: string }
  | { type: "by_state"; stateId: string }
  | { type: "by_lga"; lgaId: string }
  | { type: "by_ward"; wardId: string }
  | { type: "by_polling_unit"; pollingUnitId: string }
  | { type: "by_role"; role: string }
  | { type: "by_roles"; roles: string[] };

export const createBroadcastMessage = createAsyncThunk(
  "messages/createBroadcastMessage",
  async (
    {
      organizationId,
      title,
      body,
      target,
    }: { organizationId: string; title: string; body: string; target: BroadcastTarget },
    { getState, rejectWithValue }
  ) => {
    try {
      const payload = { title, body };
      let url: string;
      let body_ = payload as Record<string, unknown>;
      switch (target.type) {
        case "all_agents":
          url = `/messages/organization/${organizationId}/send-to-all`;
          break;
        case "all_states":
          url = `/messages/organization/${organizationId}/send-to-all-states`;
          break;
        case "all_lgas_in_state":
          url = `/messages/organization/${organizationId}/send-to-all-lgas-in-state/${target.stateId}`;
          break;
        case "all_wards_in_lga":
          url = `/messages/organization/${organizationId}/send-to-all-wards-in-lga/${target.lgaId}`;
          break;
        case "all_pus_in_ward":
          url = `/messages/organization/${organizationId}/send-to-all-pus-in-ward/${target.wardId}`;
          break;
        case "by_state":
          url = `/messages/organization/${organizationId}/send-to-state/${target.stateId}`;
          break;
        case "by_lga":
          url = `/messages/organization/${organizationId}/send-to-lga/${target.lgaId}`;
          break;
        case "by_ward":
          url = `/messages/organization/${organizationId}/send-to-ward/${target.wardId}`;
          break;
        case "by_polling_unit":
          url = `/messages/organization/${organizationId}/send-to-polling-unit/${target.pollingUnitId}`;
          break;
        case "by_role":
          url = `/messages/organization/${organizationId}/send-to-role/${encodeURIComponent(target.role)}`;
          break;
        case "by_roles":
          url = `/messages/organization/${organizationId}/send-to-roles`;
          body_ = { ...payload, roles: target.roles };
          break;
        default:
          return rejectWithValue("Invalid broadcast target");
      }
      const res = await api.post(url, body_, { headers: getAuthHeaders(getState) });
      return res.data as IMessage | { sent: number; roles: string[]; messages: IMessage[] };
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message ?? "Failed to send broadcast");
    }
  }
);

/** PATCH /:id/read — mark a message as read */
export const markMessageReadApi = createAsyncThunk(
  "messages/markMessageReadApi",
  async (
    { organizationId, messageId }: { organizationId: string; messageId: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.patch(
        `/messages/organization/${organizationId}/${messageId}/read`,
        {},
        { headers: getAuthHeaders(getState) }
      );
      return res.data as IMessage;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message ?? "Failed to mark message as read");
    }
  }
);
