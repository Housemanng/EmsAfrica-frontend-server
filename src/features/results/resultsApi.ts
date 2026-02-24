import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../config/apiConfig";
import type { RootState } from "../../app/store";

const getAuthHeaders = (getState: () => unknown) => {
  const token = (getState() as RootState).auth.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── Elections & Parties (used by Results page) ───────────────────────────────
export const getElections = createAsyncThunk(
  "results/getElections",
  async (_, { getState, rejectWithValue }) => {
    try {
      const res = await api.get("/elections", { headers: getAuthHeaders(getState) });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get elections"
      );
    }
  }
);

export const getParties = createAsyncThunk(
  "results/getParties",
  async (_, { getState, rejectWithValue }) => {
    try {
      const res = await api.get("/parties", { headers: getAuthHeaders(getState) });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get parties"
      );
    }
  }
);

// ─── GET ─────────────────────────────────────────────────────────────────────
export const getResultsByElection = createAsyncThunk(
  "results/getResultsByElection",
  async (
    { electionId, params }: { electionId: string; params?: { pollingUnitId?: string; source?: string } },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(`/results/election/${electionId}`, {
        params,
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get results by election"
      );
    }
  }
);

export const getResultsByElectionAndPollingUnit = createAsyncThunk(
  "results/getResultsByElectionAndPollingUnit",
  async (
    { electionId, pollingUnitId, params }: { electionId: string; pollingUnitId: string; params?: { source?: string } },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(
        `/results/election/${electionId}/polling-unit/${pollingUnitId}`,
        { params, headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get results by polling unit"
      );
    }
  }
);

export const getAspirantTotalsByElection = createAsyncThunk(
  "results/getAspirantTotalsByElection",
  async (electionId: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/results/election/${electionId}/aspirant-totals`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get aspirant totals"
      );
    }
  }
);

export const getAspirantTotalsFromLgaByElection = createAsyncThunk(
  "results/getAspirantTotalsFromLgaByElection",
  async (
    { electionId, params }: { electionId: string; params?: { lgaId?: string; aspirantId?: string } },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(`/results/election/${electionId}/lga-totals`, {
        params,
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get LGA totals"
      );
    }
  }
);

export const getAspirantTotalsFromWardByElection = createAsyncThunk(
  "results/getAspirantTotalsFromWardByElection",
  async (
    { electionId, params }: { electionId: string; params?: { wardId?: string; aspirantId?: string } },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(`/results/election/${electionId}/ward-totals`, {
        params,
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get ward totals"
      );
    }
  }
);

export const getAspirantTotalsFromPollingUnitByElection = createAsyncThunk(
  "results/getAspirantTotalsFromPollingUnitByElection",
  async (
    { electionId, params }: { electionId: string; params?: { pollingUnitId?: string; aspirantId?: string; source?: string } },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(`/results/election/${electionId}/polling-unit-totals`, {
        params,
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get polling unit totals"
      );
    }
  }
);

export const getAspirantTotalsFromStateByElection = createAsyncThunk(
  "results/getAspirantTotalsFromStateByElection",
  async (
    { electionId, params }: { electionId: string; params?: { stateId?: string; aspirantId?: string } },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(`/results/election/${electionId}/state-totals`, {
        params,
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get state totals"
      );
    }
  }
);

export const getResultsOverview = createAsyncThunk(
  "results/getResultsOverview",
  async (electionId: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/results/election/${electionId}/overview`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get results overview"
      );
    }
  }
);

export const getDashboardSummary = createAsyncThunk(
  "results/getDashboardSummary",
  async (electionId: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/results/election/${electionId}/dashboard-summary`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get dashboard summary"
      );
    }
  }
);

export const exportResultsCsv = createAsyncThunk(
  "results/exportResultsCsv",
  async (
    { electionId, params }: { electionId: string; params?: { source?: string } },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(`/results/election/${electionId}/export/csv`, {
        params,
        headers: getAuthHeaders(getState),
        responseType: "text",
      });
      return res.data as string;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to export CSV"
      );
    }
  }
);

export const getMyPartyOverview = createAsyncThunk(
  "results/getMyPartyOverview",
  async (
    { electionId, params }: { electionId: string; params?: { source?: string } },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(`/results/election/${electionId}/my-party-overview`, {
        params,
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get my party overview"
      );
    }
  }
);

export const getMyPartyAreasLosing = createAsyncThunk(
  "results/getMyPartyAreasLosing",
  async (
    { electionId, params }: { electionId: string; params?: { source?: string } },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(`/results/election/${electionId}/my-party/areas-losing`, {
        params,
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get areas losing"
      );
    }
  }
);

export const getMyPartyNeedsAttention = createAsyncThunk(
  "results/getMyPartyNeedsAttention",
  async (
    { electionId, params }: { electionId: string; params?: { source?: string; marginThreshold?: number } },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(`/results/election/${electionId}/my-party/needs-attention`, {
        params,
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get needs attention"
      );
    }
  }
);

// State-level
export const getResultsByState = createAsyncThunk(
  "results/getResultsByState",
  async (params: { electionId: string; stateId: string }, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(
        `/results/election/${params.electionId}/state/${params.stateId}`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get results by state"
      );
    }
  }
);

export const getAspirantTotalsByElectionAndState = createAsyncThunk(
  "results/getAspirantTotalsByElectionAndState",
  async (params: { electionId: string; stateId: string }, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(
        `/results/election/${params.electionId}/state/${params.stateId}/aspirant-totals`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get state aspirant totals"
      );
    }
  }
);

export const getResultsByElectionAndState = createAsyncThunk(
  "results/getResultsByElectionAndState",
  async (params: { electionId: string; stateId: string }, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(
        `/results/election/${params.electionId}/state/${params.stateId}/collation`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get state collation"
      );
    }
  }
);

export const getStateResultByElectionStateAspirant = createAsyncThunk(
  "results/getStateResultByElectionStateAspirant",
  async (
    params: { electionId: string; stateId: string; aspirantId: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(
        `/results/election/${params.electionId}/state/${params.stateId}/aspirant/${params.aspirantId}`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get state result"
      );
    }
  }
);

// LGA-level
export const getResultsByLGA = createAsyncThunk(
  "results/getResultsByLGA",
  async (params: { electionId: string; lgaId: string }, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(
        `/results/election/${params.electionId}/lga/${params.lgaId}`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get results by LGA"
      );
    }
  }
);

export const getAspirantTotalsByElectionAndLga = createAsyncThunk(
  "results/getAspirantTotalsByElectionAndLga",
  async (params: { electionId: string; lgaId: string }, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(
        `/results/election/${params.electionId}/lga/${params.lgaId}/aspirant-totals`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get LGA aspirant totals"
      );
    }
  }
);

export const getResultsByElectionAndLga = createAsyncThunk(
  "results/getResultsByElectionAndLga",
  async (params: { electionId: string; lgaId: string }, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(
        `/results/election/${params.electionId}/lga/${params.lgaId}/collation`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get LGA collation"
      );
    }
  }
);

export const getLgaResultByElectionLgaAspirant = createAsyncThunk(
  "results/getLgaResultByElectionLgaAspirant",
  async (
    params: { electionId: string; lgaId: string; aspirantId: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(
        `/results/election/${params.electionId}/lga/${params.lgaId}/aspirant/${params.aspirantId}`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get LGA result"
      );
    }
  }
);

// Ward-level
export const getResultsByWard = createAsyncThunk(
  "results/getResultsByWard",
  async (params: { electionId: string; wardId: string }, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(
        `/results/election/${params.electionId}/ward/${params.wardId}`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get results by ward"
      );
    }
  }
);

export const getAspirantTotalsByElectionAndWard = createAsyncThunk(
  "results/getAspirantTotalsByElectionAndWard",
  async (params: { electionId: string; wardId: string }, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(
        `/results/election/${params.electionId}/ward/${params.wardId}/aspirant-totals`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get ward aspirant totals"
      );
    }
  }
);

export const getResultsByElectionAndWard = createAsyncThunk(
  "results/getResultsByElectionAndWard",
  async (params: { electionId: string; wardId: string }, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(
        `/results/election/${params.electionId}/ward/${params.wardId}/collation`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get ward collation"
      );
    }
  }
);

export const getWardResultByElectionWardAspirant = createAsyncThunk(
  "results/getWardResultByElectionWardAspirant",
  async (
    params: { electionId: string; wardId: string; aspirantId: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.get(
        `/results/election/${params.electionId}/ward/${params.wardId}/aspirant/${params.aspirantId}`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get ward result"
      );
    }
  }
);

// ─── POST / PUT / DELETE ─────────────────────────────────────────────────────
export const upsertResult = createAsyncThunk(
  "results/upsertResult",
  async (
    body: { election: string; pollingUnit: string; party: string; votes: number; source?: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post("/results", body, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to upsert result"
      );
    }
  }
);

export const enterResultByElectionAndAspirant = createAsyncThunk(
  "results/enterResultByElectionAndAspirant",
  async (
    params: { electionId: string; pollingUnitId: string; aspirantId: string; votes: number },
    { getState, rejectWithValue }
  ) => {
    try {
      const { electionId, pollingUnitId, aspirantId, votes } = params;
      const res = await api.post(
        `/results/election/${electionId}/polling-unit/${pollingUnitId}/aspirant/${aspirantId}`,
        { votes },
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to enter result"
      );
    }
  }
);

export const enterResultByElectionAndLgaAndAspirant = createAsyncThunk(
  "results/enterResultByElectionAndLgaAndAspirant",
  async (
    params: { electionId: string; lgaId: string; aspirantId: string; votes: number },
    { getState, rejectWithValue }
  ) => {
    try {
      const { electionId, lgaId, aspirantId, votes } = params;
      const res = await api.post(
        `/results/election/${electionId}/lga/${lgaId}/aspirant/${aspirantId}`,
        { votes },
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to enter LGA result"
      );
    }
  }
);

export const enterResultByElectionAndWardAndAspirant = createAsyncThunk(
  "results/enterResultByElectionAndWardAndAspirant",
  async (
    params: { electionId: string; wardId: string; aspirantId: string; votes: number },
    { getState, rejectWithValue }
  ) => {
    try {
      const { electionId, wardId, aspirantId, votes } = params;
      const res = await api.post(
        `/results/election/${electionId}/ward/${wardId}/aspirant/${aspirantId}`,
        { votes },
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to enter ward result"
      );
    }
  }
);

export const enterResultByElectionAndStateAndAspirant = createAsyncThunk(
  "results/enterResultByElectionAndStateAndAspirant",
  async (
    params: { electionId: string; stateId: string; aspirantId: string; votes: number },
    { getState, rejectWithValue }
  ) => {
    try {
      const { electionId, stateId, aspirantId, votes } = params;
      const res = await api.post(
        `/results/election/${electionId}/state/${stateId}/aspirant/${aspirantId}`,
        { votes },
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to enter state result"
      );
    }
  }
);

export const setDeclaredWinner = createAsyncThunk(
  "results/setDeclaredWinner",
  async (
    params: { electionId: string; pollingUnitId: string; partyId: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.put(
        `/results/election/${params.electionId}/polling-unit/${params.pollingUnitId}/declared-winner`,
        { partyId: params.partyId },
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to set declared winner"
      );
    }
  }
);

export const saveResultsFromScan = createAsyncThunk(
  "results/saveResultsFromScan",
  async (
    body: { electionId: string; pollingUnitId: string; entries: Array<{ partyId: string; votes: number }> },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.post("/results/from-scan", body, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to save results from scan"
      );
    }
  }
);

export const deleteResult = createAsyncThunk(
  "results/deleteResult",
  async (resultId: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.delete(`/results/${resultId}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to delete result"
      );
    }
  }
);
