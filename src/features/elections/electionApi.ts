import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../config/apiConfig";
import type { RootState } from "../../app/store";

const getAuthHeaders = (getState: () => unknown) => {
  const token = (getState() as RootState).auth.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── GET ─────────────────────────────────────────────────────────────────────
export const getAllElections = createAsyncThunk(
  "elections/getAllElections",
  async (
    params: { state?: string; status?: string; group?: string } | undefined,
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get("/elections", {
        params,
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get elections"
      );
    }
  }
);

export const getElectionById = createAsyncThunk(
  "elections/getElectionById",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/elections/${id}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get election"
      );
    }
  }
);

export const getElectionsByOrganizationId = createAsyncThunk(
  "elections/getElectionsByOrganizationId",
  async (
    params: { organizationId: string; query?: { state?: string; status?: string; group?: string } },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(
        `/elections/organization/${params.organizationId}`,
        { params: params.query, headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get elections by organization"
      );
    }
  }
);

export const getElectionsByLGAId = createAsyncThunk(
  "elections/getElectionsByLGAId",
  async (
    params: { lgaId: string; query?: { status?: string; group?: string } },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(`/elections/by-lga/${params.lgaId}`, {
        params: params.query,
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get elections by LGA"
      );
    }
  }
);

export const getElectionSettings = createAsyncThunk(
  "elections/getElectionSettings",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/elections/${id}/settings`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get election settings"
      );
    }
  }
);

export const listAccreditation = createAsyncThunk(
  "elections/listAccreditation",
  async (
    params: {
      electionId: string;
      query?: { stateId?: string; lgaId?: string; wardId?: string; pollingUnitId?: string };
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(`/elections/${params.electionId}/accreditation`, {
        params: params.query,
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to list accreditation"
      );
    }
  }
);

// ─── POST ────────────────────────────────────────────────────────────────────
export const startAccreditation = createAsyncThunk(
  "elections/startAccreditation",
  async (
    params: { electionId: string; pollingUnitId: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post(
        `/elections/${params.electionId}/accreditation/start`,
        { pollingUnitId: params.pollingUnitId },
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to start accreditation"
      );
    }
  }
);

export const endAccreditation = createAsyncThunk(
  "elections/endAccreditation",
  async (
    params: { electionId: string; pollingUnitId: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post(
        `/elections/${params.electionId}/accreditation/end`,
        { pollingUnitId: params.pollingUnitId },
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to end accreditation"
      );
    }
  }
);

export const startVoting = createAsyncThunk(
  "elections/startVoting",
  async (electionId: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.post(`/elections/${electionId}/start-voting`, {}, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to start voting"
      );
    }
  }
);

export const concludeElection = createAsyncThunk(
  "elections/concludeElection",
  async (electionId: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.post(`/elections/${electionId}/conclude`, {}, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to conclude election"
      );
    }
  }
);

export const createElectionByOrganizationId = createAsyncThunk(
  "elections/createElectionByOrganizationId",
  async (
    params: {
      organizationId: string;
      body: {
        name: string;
        type: string;
        electionDate: string;
        status?: string;
        electionGroup?: string;
        state?: string;
        settings?: Record<string, unknown>;
      };
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post(
        `/elections/organization/${params.organizationId}`,
        params.body,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to create election"
      );
    }
  }
);

// ─── PUT ────────────────────────────────────────────────────────────────────
export const updateElection = createAsyncThunk(
  "elections/updateElection",
  async (
    params: {
      id: string;
      body: Partial<{
        name: string;
        type: string;
        state: string;
        electionDate: string;
        status: string;
        electionGroup: string;
        settings: Record<string, unknown>;
      }>;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.put(`/elections/${params.id}`, params.body, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to update election"
      );
    }
  }
);

export const updateElectionSettings = createAsyncThunk(
  "elections/updateElectionSettings",
  async (
    params: { id: string; settings: Record<string, unknown> },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.put(`/elections/${params.id}/settings`, { settings: params.settings }, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to update election settings"
      );
    }
  }
);

// ─── DELETE ──────────────────────────────────────────────────────────────────
export const deleteElection = createAsyncThunk(
  "elections/deleteElection",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.delete(`/elections/${id}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to delete election"
      );
    }
  }
);
