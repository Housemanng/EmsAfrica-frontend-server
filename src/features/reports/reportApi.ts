import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../config/apiConfig";
import type { RootState } from "../../app/store";

const getAuthHeaders = (getState: () => unknown) => {
  const token = (getState() as RootState).auth.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** POST /api/reports – Create report. Body: electionId, pollingUnitId, content */
export const createReport = createAsyncThunk(
  "reports/createReport",
  async (
    body: { electionId: string; pollingUnitId: string; content: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post("/reports", body, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to create report"
      );
    }
  }
);

/** GET /api/reports/election/:electionId – Query: pollingUnitId?, stateId?, lgaId?, wardId? */
export const getReportsByElection = createAsyncThunk(
  "reports/getReportsByElection",
  async (
    params: {
      electionId: string;
      pollingUnitId?: string;
      stateId?: string;
      lgaId?: string;
      wardId?: string;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const { electionId, ...query } = params;
      const res = await api.get(`/reports/election/${electionId}`, {
        params: query,
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to get reports by election"
      );
    }
  }
);

/** GET /api/reports/polling-unit/:pollingUnitId – Query: electionId? */
export const getReportsByPollingUnit = createAsyncThunk(
  "reports/getReportsByPollingUnit",
  async (
    params: { pollingUnitId: string; electionId?: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const { pollingUnitId, electionId } = params;
      const res = await api.get(`/reports/polling-unit/${pollingUnitId}`, {
        params: electionId ? { electionId } : {},
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to get reports by polling unit"
      );
    }
  }
);
