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

/** GET /api/presence?electionId=&stateId=&lgaId=&wardId=&pollingUnitId= – List agents currently available */
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
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; error?: string } } };
      return rejectWithValue(
        err.response?.data?.message ?? err.response?.data?.error ?? "Failed to list presence"
      );
    }
  }
);
