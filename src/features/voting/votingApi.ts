import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../config/apiConfig";
import type { RootState } from "../../app/store";

const getAuthHeaders = (getState: () => unknown) => {
  const token = (getState() as RootState).auth.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** Record that voting has started at a polling unit. */
export const startVotingAtPollingUnit = createAsyncThunk(
  "voting/startVotingAtPollingUnit",
  async (
    params: { organizationId: string; electionId: string; pollingUnitId: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post(
        `/voting/organization/${params.organizationId}/election/${params.electionId}/polling-unit/${params.pollingUnitId}/start`,
        {},
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to start voting"
      );
    }
  }
);

/** Record that voting has ended at a polling unit. */
export const endVotingAtPollingUnit = createAsyncThunk(
  "voting/endVotingAtPollingUnit",
  async (
    params: { organizationId: string; electionId: string; pollingUnitId: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post(
        `/voting/organization/${params.organizationId}/election/${params.electionId}/polling-unit/${params.pollingUnitId}/end`,
        {},
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to end voting"
      );
    }
  }
);

/** Get voting report (start/end times per polling unit). Query: stateId?, lgaId?, wardId?, pollingUnitId? */
export const getVotingReport = createAsyncThunk(
  "voting/getVotingReport",
  async (
    params: {
      organizationId: string;
      electionId: string;
      query?: { stateId?: string; lgaId?: string; wardId?: string; pollingUnitId?: string };
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(
        `/voting/organization/${params.organizationId}/election/${params.electionId}/report`,
        { params: params.query, headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get voting report"
      );
    }
  }
);
