import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../config/apiConfig";
import type { RootState } from "../../app/store";

const getAuthHeaders = (getState: () => unknown) => {
  const state = getState() as RootState;
  const token =
    state.auth?.token ??
    (typeof localStorage !== "undefined" ? localStorage.getItem("token") : null);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export type PresenceStatus = "available" | "left";

/** POST /api/presence/me/polling-unit/:pollingUnitId/election/:electionId/check-in – Agent confirms arrival */
export const checkIn = createAsyncThunk(
  "presence/checkIn",
  async (
    params: {
      pollingUnitId: string;
      electionId: string;
      lat?: number;
      lng?: number;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const { pollingUnitId, electionId, lat, lng } = params;
      const res = await api.post(
        `/presence/me/polling-unit/${pollingUnitId}/election/${electionId}/check-in`,
        { lat, lng },
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; error?: string } } };
      return rejectWithValue(
        err.response?.data?.message ?? err.response?.data?.error ?? "Failed to check in"
      );
    }
  }
);

/** POST /api/presence/me/polling-unit/:pollingUnitId/election/:electionId/presence – Report presence (available/left) */
export const reportMyPresence = createAsyncThunk(
  "presence/reportMyPresence",
  async (
    params: {
      pollingUnitId: string;
      electionId: string;
      status?: PresenceStatus;
      lat?: number;
      lng?: number;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const { pollingUnitId, electionId, status, lat, lng } = params;
      const res = await api.post(
        `/presence/me/polling-unit/${pollingUnitId}/election/${electionId}/presence`,
        { status, lat, lng },
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; error?: string } } };
      return rejectWithValue(
        err.response?.data?.message ?? err.response?.data?.error ?? "Failed to report presence"
      );
    }
  }
);

/** GET /api/presence/organization/:organizationId/election/:electionId/report – Full presence report with PO agents, presence, voting */
export const getPresenceReport = createAsyncThunk(
  "presence/getPresenceReport",
  async (
    params: {
      organizationId: string;
      electionId: string;
      query?: { stateId?: string; lgaId?: string; wardId?: string };
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(
        `/presence/organization/${params.organizationId}/election/${params.electionId}/report`,
        { params: params.query, headers: getAuthHeaders(getState) }
      );
      return res.data as {
        organizationId: string;
        electionId: string;
        summary: { total: number; present: number; notPresent: number; votingStarted: number; votingEnded: number };
        rows: Array<{
          pollingUnitId: string;
          pollingUnitName: string;
          pollingUnitCode: string;
          wardName: string;
          lgaName: string;
          poAgentName: string;
          poPhoneNumber: string;
          presence: string;
          presenceCheckedInAt?: string | null;
          accreditedCount: number | null;
          votingStarted: string;
          votingEnded: string;
          accreditationStarted: boolean;
          accreditationEnded: boolean;
          votingStartedAt?: string;
          votingEndedAt?: string;
          accreditationStartedAt?: string;
          accreditationEndedAt?: string;
        }>;
      };
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; error?: string } } };
      return rejectWithValue(
        err.response?.data?.message ?? err.response?.data?.error ?? "Failed to get presence report"
      );
    }
  }
);

/** GET /api/presence?electionId=&stateId=&lgaId=&wardId=&pollingUnitId= – List agents currently available at polling units */
export const listPresence = createAsyncThunk(
  "presence/listPresence",
  async (
    params: {
      electionId?: string;
      stateId?: string;
      lgaId?: string;
      wardId?: string;
      pollingUnitId?: string;
    } = {},
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get("/presence", {
        params,
        headers: getAuthHeaders(getState),
      });
      return res.data as { presence: unknown[]; count: number };
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; error?: string } } };
      return rejectWithValue(
        err.response?.data?.message ?? err.response?.data?.error ?? "Failed to list presence"
      );
    }
  }
);

