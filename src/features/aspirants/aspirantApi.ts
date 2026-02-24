import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../config/apiConfig";
import type { RootState } from "../../app/store";

const getAuthHeaders = (getState: () => unknown) => {
  const token = (getState() as RootState).auth.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── GET ─────────────────────────────────────────────────────────────────────
export const getAllAspirants = createAsyncThunk(
  "aspirants/getAllAspirants",
  async (_, { getState, rejectWithValue }) => {
    try {
      const res = await api.get("/aspirants", {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get aspirants"
      );
    }
  }
);

export const getOfficeCategories = createAsyncThunk(
  "aspirants/getOfficeCategories",
  async (_, { getState, rejectWithValue }) => {
    try {
      const res = await api.get("/aspirants/office-categories", {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get office categories"
      );
    }
  }
);

export const getAspirantsByParty = createAsyncThunk(
  "aspirants/getAspirantsByParty",
  async (partyId: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/aspirants/by-party/${partyId}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get aspirants by party"
      );
    }
  }
);

export const getAspirantsByElection = createAsyncThunk(
  "aspirants/getAspirantsByElection",
  async (electionId: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/aspirants/election/${electionId}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get aspirants by election"
      );
    }
  }
);

export const getAspirantsByElectionAndOffice = createAsyncThunk(
  "aspirants/getAspirantsByElectionAndOffice",
  async (
    params: { electionId: string; office: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(
        `/aspirants/by-election/${params.electionId}/by-office/${params.office}`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get aspirants by office"
      );
    }
  }
);

export const getAspirantById = createAsyncThunk(
  "aspirants/getAspirantById",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/aspirants/${id}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get aspirant"
      );
    }
  }
);

// ─── POST ────────────────────────────────────────────────────────────────────
/** Create aspirant under election. Body: name, partyCode, party (party name), photo? */
export const createAspirantByElectionId = createAsyncThunk(
  "aspirants/createAspirantByElectionId",
  async (
    params: {
      electionId: string;
      body: { name: string; partyCode: string; party: string; photo?: string };
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const { electionId, body } = params;
      const res = await api.post(`/aspirants/election/${electionId}`, body, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to create aspirant"
      );
    }
  }
);

/** Legacy: create aspirant with election in body. Body: name, party, election, office, photo? */
export const createAspirant = createAsyncThunk(
  "aspirants/createAspirant",
  async (
    body: { name: string; party: string; election: string; office: string; photo?: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post("/aspirants", body, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to create aspirant"
      );
    }
  }
);

/** Upload aspirant photo. Pass FormData with 'photo' file and optional partyId, electionId. */
export const uploadAspirantPhoto = createAsyncThunk(
  "aspirants/uploadAspirantPhoto",
  async (formData: FormData, { getState, rejectWithValue }) => {
    try {
      const res = await api.post("/aspirants/upload-photo", formData, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to upload photo"
      );
    }
  }
);

// ─── PUT ────────────────────────────────────────────────────────────────────
export const updateAspirant = createAsyncThunk(
  "aspirants/updateAspirant",
  async (
    params: { id: string; body: Partial<{ name: string; party: string; election: string; office: string; photo: string }> },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.put(`/aspirants/${params.id}`, params.body, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to update aspirant"
      );
    }
  }
);

// ─── DELETE ──────────────────────────────────────────────────────────────────
export const deleteAspirant = createAsyncThunk(
  "aspirants/deleteAspirant",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.delete(`/aspirants/${id}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to delete aspirant"
      );
    }
  }
);
