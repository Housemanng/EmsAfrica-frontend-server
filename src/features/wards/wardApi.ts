import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../config/apiConfig";
import type { RootState } from "../../app/store";

const getAuthHeaders = (getState: () => unknown) => {
  const token = (getState() as RootState).auth.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── GET ─────────────────────────────────────────────────────────────────────
export const getAllWards = createAsyncThunk(
  "wards/getAllWards",
  async (_, { getState, rejectWithValue }) => {
    try {
      const res = await api.get("/wards", {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get wards"
      );
    }
  }
);

export const getWardsByLGA = createAsyncThunk(
  "wards/getWardsByLGA",
  async (lgaId: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/wards/by-lga/${lgaId}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get wards by LGA"
      );
    }
  }
);

export const getWardById = createAsyncThunk(
  "wards/getWardById",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/wards/${id}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get ward"
      );
    }
  }
);

export const getPollingUnitsByWard = createAsyncThunk(
  "wards/getPollingUnitsByWard",
  async (wardId: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/wards/${wardId}/polling-units`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get polling units by ward"
      );
    }
  }
);

// ─── POST ────────────────────────────────────────────────────────────────────
export const createWard = createAsyncThunk(
  "wards/createWard",
  async (
    body: { name: string; code: string; lga: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post("/wards", body, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to create ward"
      );
    }
  }
);

export const createPollingUnitUnderWard = createAsyncThunk(
  "wards/createPollingUnitUnderWard",
  async (
    params: {
      wardId: string;
      body: {
        name: string;
        code: string;
        address?: string;
        location?: string;
        coordinates?: { lat: number; lng: number };
      };
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post(
        `/wards/${params.wardId}/polling-units`,
        params.body,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to create polling unit"
      );
    }
  }
);

// ─── PUT ────────────────────────────────────────────────────────────────────
export const updateWard = createAsyncThunk(
  "wards/updateWard",
  async (
    params: {
      id: string;
      body: Partial<{ name: string; code: string; lga: string }>;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.put(`/wards/${params.id}`, params.body, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to update ward"
      );
    }
  }
);

// ─── DELETE ──────────────────────────────────────────────────────────────────
export const deleteWard = createAsyncThunk(
  "wards/deleteWard",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.delete(`/wards/${id}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to delete ward"
      );
    }
  }
);
