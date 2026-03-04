import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../config/apiConfig";
import type { RootState } from "../../app/store";

const getAuthHeaders = (getState: () => unknown) => {
  const token = (getState() as RootState).auth.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ── Shared types ──────────────────────────────────────────────────────────────

export type ReportCategory =
  | "ELECTORAL_VIOLENCE"
  | "LOGISTICS"
  | "MALPRACTICE"
  | "TECHNICAL"
  | "ADMINISTRATIVE";

export const REPORT_CATEGORIES: ReportCategory[] = [
  "ELECTORAL_VIOLENCE",
  "LOGISTICS",
  "MALPRACTICE",
  "TECHNICAL",
  "ADMINISTRATIVE",
];

export const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  ELECTORAL_VIOLENCE: "Electoral Violence",
  LOGISTICS:          "Logistics",
  MALPRACTICE:        "Malpractice",
  TECHNICAL:          "Technical",
  ADMINISTRATIVE:     "Administrative",
};

export const REPORT_ITEMS_BY_CATEGORY: Record<ReportCategory, string[]> = {
  ELECTORAL_VIOLENCE: [
    "Electoral Violence",
    "Ballot Box Snatching",
    "Intimidation and Harassment",
    "Poor Security Presence",
    "Disruption of Collation Process",
  ],
  LOGISTICS: [
    "Late Arrival of Electoral Materials",
    "Logistics Challenges",
  ],
  MALPRACTICE: [
    "Vote Buying",
    "Forgery or Manipulation of Results",
    "Underage Voting",
    "Multiple Voting Attempts",
    "Bribery or Compromise of Polling Officials",
  ],
  TECHNICAL: [
    "Malfunction of BVAS/INEC Machines",
    "Internet/Network Failures",
    "Power Outage",
  ],
  ADMINISTRATIVE: [
    "Delay in Opening Polling Units",
    "Disenfranchisement of Voters",
    "Overcrowding at the Polling Units",
    "Lack of Accessibility",
    "Voter Apathy",
  ],
};

export interface CreateReportBody {
  electionId: string;
  category: ReportCategory;
  items: string[];
  notes?: string;
  /** Location — provide the one matching your role */
  pollingUnitId?: string;
  wardId?: string;
  lgaId?: string;
  stateId?: string;
}

/** POST /api/reports */
export const createReport = createAsyncThunk(
  "reports/createReport",
  async (body: CreateReportBody, { getState, rejectWithValue }) => {
    try {
      const res = await api.post("/reports", body, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message ?? "Failed to create report");
    }
  }
);

/** GET /api/reports/election/:electionId – Query: pollingUnitId?, wardId?, lgaId?, stateId?, category? */
export const getReportsByElection = createAsyncThunk(
  "reports/getReportsByElection",
  async (
    params: {
      electionId: string;
      pollingUnitId?: string;
      wardId?: string;
      lgaId?: string;
      stateId?: string;
      category?: ReportCategory;
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
      return rejectWithValue(err.response?.data?.message ?? "Failed to get reports by election");
    }
  }
);

/** GET /api/reports/polling-unit/:pollingUnitId – Query: electionId?, category? */
export const getReportsByPollingUnit = createAsyncThunk(
  "reports/getReportsByPollingUnit",
  async (
    params: { pollingUnitId: string; electionId?: string; category?: ReportCategory },
    { getState, rejectWithValue }
  ) => {
    try {
      const { pollingUnitId, ...query } = params;
      const res = await api.get(`/reports/polling-unit/${pollingUnitId}`, {
        params: query,
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message ?? "Failed to get reports by polling unit");
    }
  }
);

/** GET /api/reports/ward/:wardId – Query: electionId?, category? */
export const getReportsByWard = createAsyncThunk(
  "reports/getReportsByWard",
  async (
    params: { wardId: string; electionId?: string; category?: ReportCategory },
    { getState, rejectWithValue }
  ) => {
    try {
      const { wardId, ...query } = params;
      const res = await api.get(`/reports/ward/${wardId}`, {
        params: query,
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message ?? "Failed to get reports by ward");
    }
  }
);

/** GET /api/reports/lga/:lgaId – Query: electionId?, category? */
export const getReportsByLga = createAsyncThunk(
  "reports/getReportsByLga",
  async (
    params: { lgaId: string; electionId?: string; category?: ReportCategory },
    { getState, rejectWithValue }
  ) => {
    try {
      const { lgaId, ...query } = params;
      const res = await api.get(`/reports/lga/${lgaId}`, {
        params: query,
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message ?? "Failed to get reports by LGA");
    }
  }
);

/** GET /api/reports/state/:stateId – Query: electionId?, category? */
export const getReportsByState = createAsyncThunk(
  "reports/getReportsByState",
  async (
    params: { stateId: string; electionId?: string; category?: ReportCategory },
    { getState, rejectWithValue }
  ) => {
    try {
      const { stateId, ...query } = params;
      const res = await api.get(`/reports/state/${stateId}`, {
        params: query,
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message ?? "Failed to get reports by state");
    }
  }
);

/** PATCH /api/reports/:reportId/read  — mark a report read for the current user */
export const markReportReadApi = createAsyncThunk(
  "reports/markReportRead",
  async (reportId: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.patch(`/reports/${reportId}/read`, {}, {
        headers: getAuthHeaders(getState),
      });
      return res.data as { _id: string; isRead: boolean };
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message ?? "Failed to mark report as read");
    }
  }
);

/** PATCH /api/reports/:reportId/unread  — mark a report unread for the current user */
export const markReportUnreadApi = createAsyncThunk(
  "reports/markReportUnread",
  async (reportId: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.patch(`/reports/${reportId}/unread`, {}, {
        headers: getAuthHeaders(getState),
      });
      return res.data as { _id: string; isRead: boolean };
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      return rejectWithValue(err.response?.data?.message ?? "Failed to mark report as unread");
    }
  }
);
