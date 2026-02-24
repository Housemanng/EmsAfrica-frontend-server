import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../config/apiConfig";
import type { RootState } from "../../app/store";

const getAuthHeaders = (getState: () => unknown) => {
  const token = (getState() as RootState).auth.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** Upload result sheet. Multipart FormData with "file" + election, pollingUnit; or JSON body: { election, pollingUnit, fileUrl }. */
export const uploadResultSheet = createAsyncThunk(
  "resultSheets/uploadResultSheet",
  async (
    payload: FormData | { election: string; pollingUnit: string; fileUrl: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post("/result-sheets", payload, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to upload result sheet"
      );
    }
  }
);

/** Upload by level. FormData with "file" + optional fields; or JSON { fileUrl }. */
export const uploadResultSheetByPollingUnit = createAsyncThunk(
  "resultSheets/uploadResultSheetByPollingUnit",
  async (
    params: { electionId: string; pollingUnitId: string; payload: FormData | { fileUrl: string } },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post(
        `/result-sheets/election/${params.electionId}/polling-unit/${params.pollingUnitId}`,
        params.payload,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to upload result sheet"
      );
    }
  }
);

export const uploadResultSheetByWard = createAsyncThunk(
  "resultSheets/uploadResultSheetByWard",
  async (
    params: { electionId: string; wardId: string; payload: FormData | { fileUrl: string } },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post(
        `/result-sheets/election/${params.electionId}/ward/${params.wardId}`,
        params.payload,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to upload result sheet"
      );
    }
  }
);

export const uploadResultSheetByLga = createAsyncThunk(
  "resultSheets/uploadResultSheetByLga",
  async (
    params: { electionId: string; lgaId: string; payload: FormData | { fileUrl: string } },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post(
        `/result-sheets/election/${params.electionId}/lga/${params.lgaId}`,
        params.payload,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to upload result sheet"
      );
    }
  }
);

export const uploadResultSheetByState = createAsyncThunk(
  "resultSheets/uploadResultSheetByState",
  async (
    params: { electionId: string; stateId: string; payload: FormData | { fileUrl: string } },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post(
        `/result-sheets/election/${params.electionId}/state/${params.stateId}`,
        params.payload,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to upload result sheet"
      );
    }
  }
);

/** Scan image to extract vote figures. FormData with "file" + electionId. */
export const scanResultSheet = createAsyncThunk(
  "resultSheets/scanResultSheet",
  async (formData: FormData, { getState, rejectWithValue }) => {
    try {
      const res = await api.post("/result-sheets/scan", formData, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to scan result sheet"
      );
    }
  }
);

// ─── GET ─────────────────────────────────────────────────────────────────────
/** Get sheets by election. Query: pollingUnitId?, wardId?, lgaId?, stateId? */
export const getSheetsByElection = createAsyncThunk(
  "resultSheets/getSheetsByElection",
  async (
    params: {
      electionId: string;
      query?: { pollingUnitId?: string; wardId?: string; lgaId?: string; stateId?: string };
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(
        `/result-sheets/election/${params.electionId}`,
        { params: params.query, headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get result sheets"
      );
    }
  }
);

export const getSheetsByElectionAndPollingUnit = createAsyncThunk(
  "resultSheets/getSheetsByElectionAndPollingUnit",
  async (
    params: { electionId: string; pollingUnitId: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(
        `/result-sheets/election/${params.electionId}/polling-unit/${params.pollingUnitId}`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get result sheets"
      );
    }
  }
);

export const getSheetsByElectionAndWard = createAsyncThunk(
  "resultSheets/getSheetsByElectionAndWard",
  async (params: { electionId: string; wardId: string }, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(
        `/result-sheets/election/${params.electionId}/ward/${params.wardId}`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get result sheets"
      );
    }
  }
);

export const getSheetsByElectionAndLga = createAsyncThunk(
  "resultSheets/getSheetsByElectionAndLga",
  async (params: { electionId: string; lgaId: string }, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(
        `/result-sheets/election/${params.electionId}/lga/${params.lgaId}`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get result sheets"
      );
    }
  }
);

export const getSheetsByElectionAndState = createAsyncThunk(
  "resultSheets/getSheetsByElectionAndState",
  async (params: { electionId: string; stateId: string }, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(
        `/result-sheets/election/${params.electionId}/state/${params.stateId}`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get result sheets"
      );
    }
  }
);

export const getSheetsByPollingUnit = createAsyncThunk(
  "resultSheets/getSheetsByPollingUnit",
  async (pollingUnitId: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/result-sheets/polling-unit/${pollingUnitId}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get result sheets"
      );
    }
  }
);

// ─── PUT ────────────────────────────────────────────────────────────────────
export const setSheetVerified = createAsyncThunk(
  "resultSheets/setSheetVerified",
  async (
    params: { id: string; verified?: boolean },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.put(
        `/result-sheets/${params.id}/verify`,
        { verified: params.verified !== false },
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to verify sheet"
      );
    }
  }
);
