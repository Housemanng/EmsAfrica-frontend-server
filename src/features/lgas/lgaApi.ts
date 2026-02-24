import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../config/apiConfig";
import type { RootState } from "../../app/store";

const getAuthHeaders = (getState: () => unknown) => {
  const token = (getState() as RootState).auth.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── GET ─────────────────────────────────────────────────────────────────────
export const getAllLGAs = createAsyncThunk(
  "lgas/getAllLGAs",
  async (_, { getState, rejectWithValue }) => {
    try {
      const res = await api.get("/lgas", {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get LGAs"
      );
    }
  }
);

export const getLGAsByState = createAsyncThunk(
  "lgas/getLGAsByState",
  async (stateId: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/lgas/by-state/${stateId}`, {
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

export const getLGAsByStateName = createAsyncThunk(
  "lgas/getLGAsByStateName",
  async (stateName: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/lgas/by-state-name/${encodeURIComponent(stateName)}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get LGAs by state name"
      );
    }
  }
);

export const getLGAById = createAsyncThunk(
  "lgas/getLGAById",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/lgas/${id}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get LGA"
      );
    }
  }
);

// ─── POST ────────────────────────────────────────────────────────────────────
/** Create LGA under state. Body: { lga_name }. Code is auto-generated. */
export const createLGAUnderState = createAsyncThunk(
  "lgas/createLGAUnderState",
  async (
    params: { stateId: string; body: { lga_name: string } },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post(
        `/lgas/lga/${params.stateId}`,
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

/** Create LGA with state in body. Body: { lga_name, state }. Code is auto-generated. */
export const createLGA = createAsyncThunk(
  "lgas/createLGA",
  async (
    body: { lga_name: string; state: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post("/lgas", body, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to create LGA"
      );
    }
  }
);

// ─── PUT ────────────────────────────────────────────────────────────────────
export const updateLGA = createAsyncThunk(
  "lgas/updateLGA",
  async (
    params: {
      id: string;
      body: Partial<{ name: string; code: string; state: string }>;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.put(`/lgas/${params.id}`, params.body, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to update LGA"
      );
    }
  }
);

// ─── DELETE ──────────────────────────────────────────────────────────────────
export const deleteLGA = createAsyncThunk(
  "lgas/deleteLGA",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.delete(`/lgas/${id}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to delete LGA"
      );
    }
  }
);
