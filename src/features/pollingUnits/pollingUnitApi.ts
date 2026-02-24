import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../config/apiConfig";
import type { RootState } from "../../app/store";

const getAuthHeaders = (getState: () => unknown) => {
  const token = (getState() as RootState).auth.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── User-accessible routes (protect) ─────────────────────────────────────────
export const getUsersByPollingUnitId = createAsyncThunk(
  "pollingUnits/getUsersByPollingUnitId",
  async (
    params: { organizationId: string; pollingUnitId: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(
        `/polling-units/organization/${params.organizationId}/polling-unit/${params.pollingUnitId}`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get users by polling unit"
      );
    }
  }
);

export const getPollingUnitsByWard = createAsyncThunk(
  "pollingUnits/getPollingUnitsByWard",
  async (
    params: { organizationId: string; wardId: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(
        `/polling-units/organization/${params.organizationId}/by-ward/${params.wardId}`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get polling units by ward"
      );
    }
  }
);

export const getAllAccreditationByOrganization = createAsyncThunk(
  "pollingUnits/getAllAccreditationByOrganization",
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
        `/polling-units/organization/${params.organizationId}/election/${params.electionId}/accreditation`,
        { params: params.query, headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get accreditation"
      );
    }
  }
);

export const getAccreditedVotersByPollingUnit = createAsyncThunk(
  "pollingUnits/getAccreditedVotersByPollingUnit",
  async (
    params: { organizationId: string; pollingUnitId: string; electionId: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(
        `/polling-units/organization/${params.organizationId}/polling-unit/${params.pollingUnitId}/election/${params.electionId}/accredited-voters`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get accredited voters"
      );
    }
  }
);

export const enterAccreditedVotersByPollingUnit = createAsyncThunk(
  "pollingUnits/enterAccreditedVotersByPollingUnit",
  async (
    params: {
      organizationId: string;
      pollingUnitId: string;
      electionId: string;
      accreditedCount: number;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post(
        `/polling-units/organization/${params.organizationId}/polling-unit/${params.pollingUnitId}/election/${params.electionId}/accredited-voters`,
        { accreditedCount: params.accreditedCount },
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to enter accredited voters"
      );
    }
  }
);

// ─── Platform admin routes ───────────────────────────────────────────────────
export const getAllPollingUnits = createAsyncThunk(
  "pollingUnits/getAllPollingUnits",
  async (_, { getState, rejectWithValue }) => {
    try {
      const res = await api.get("/polling-units", {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get polling units"
      );
    }
  }
);

export const getPollingUnitsWithPresence = createAsyncThunk(
  "pollingUnits/getPollingUnitsWithPresence",
  async (
    params:
      | { electionId?: string; stateId?: string; lgaId?: string; wardId?: string }
      | undefined,
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get("/polling-units/with-presence", {
        params,
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get polling units with presence"
      );
    }
  }
);

export const getPollingUnitsByWardAdmin = createAsyncThunk(
  "pollingUnits/getPollingUnitsByWardAdmin",
  async (wardId: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/polling-units/by-ward/${wardId}`, {
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

/** Admin: get users at a polling unit (no org in path). */
export const getUsersByPollingUnitIdAdmin = createAsyncThunk(
  "pollingUnits/getUsersByPollingUnitIdAdmin",
  async (pollingUnitId: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/polling-units/${pollingUnitId}/users`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get users by polling unit"
      );
    }
  }
);

export const getPollingUnitById = createAsyncThunk(
  "pollingUnits/getPollingUnitById",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/polling-units/${id}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get polling unit"
      );
    }
  }
);

export const createPollingUnit = createAsyncThunk(
  "pollingUnits/createPollingUnit",
  async (
    body: {
      name: string;
      code: string;
      ward: string;
      address?: string;
      location?: string;
      coordinates?: { lat: number; lng: number };
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post("/polling-units", body, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to create polling unit"
      );
    }
  }
);

export const updatePollingUnit = createAsyncThunk(
  "pollingUnits/updatePollingUnit",
  async (
    params: {
      id: string;
      body: Partial<{
        name: string;
        code: string;
        ward: string;
        address: string;
        location: string;
        coordinates: { lat: number; lng: number };
      }>;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.put(`/polling-units/${params.id}`, params.body, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to update polling unit"
      );
    }
  }
);

export const deletePollingUnit = createAsyncThunk(
  "pollingUnits/deletePollingUnit",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.delete(`/polling-units/${id}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to delete polling unit"
      );
    }
  }
);
