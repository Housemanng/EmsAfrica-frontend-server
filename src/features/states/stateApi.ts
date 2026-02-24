import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../config/apiConfig";
import type { RootState } from "../../app/store";

const getAuthHeaders = (getState: () => unknown) => {
  const token = (getState() as RootState).auth.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── GET ─────────────────────────────────────────────────────────────────────
export const getAllStates = createAsyncThunk(
  "states/getAllStates",
  async (_, { getState, rejectWithValue }) => {
    try {
      const res = await api.get("/states", {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get states"
      );
    }
  }
);

export const getStateById = createAsyncThunk(
  "states/getStateById",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/states/${id}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get state"
      );
    }
  }
);

/** Get states under an organization. User must belong to that org. */
export const getStatesByOrganizationId = createAsyncThunk(
  "states/getStatesByOrganizationId",
  async (organizationId: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/organizations/${organizationId}/states`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get states by organization"
      );
    }
  }
);

/** Get LGAs under a state (nested route). */
export const getLGAsByState = createAsyncThunk(
  "states/getLGAsByState",
  async (stateId: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/states/${stateId}/lgas`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get LGAs by state"
      );
    }
  }
);

// ─── POST ────────────────────────────────────────────────────────────────────
export const createState = createAsyncThunk(
  "states/createState",
  async (
    body: { name: string; code: string; country?: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post("/states", body, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to create state"
      );
    }
  }
);

/** Create LGA under state. Body: { lga_name }. Code is auto-generated. */
export const createLGAUnderState = createAsyncThunk(
  "states/createLGAUnderState",
  async (
    params: { stateId: string; body: { lga_name: string } },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post(
        `/states/${params.stateId}/lgas`,
        params.body,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to create LGA"
      );
    }
  }
);

// ─── PUT ────────────────────────────────────────────────────────────────────
export const updateState = createAsyncThunk(
  "states/updateState",
  async (
    params: {
      id: string;
      body: Partial<{ name: string; code: string; country: string; subdomain: string }>;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.put(`/states/${params.id}`, params.body, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to update state"
      );
    }
  }
);

// ─── DELETE ──────────────────────────────────────────────────────────────────
export const deleteState = createAsyncThunk(
  "states/deleteState",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.delete(`/states/${id}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to delete state"
      );
    }
  }
);
