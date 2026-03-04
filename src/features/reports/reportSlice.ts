import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import { logout } from "../auth/authSlice";
import {
  createReport,
  getReportsByElection,
  getReportsByPollingUnit,
  getReportsByWard,
  getReportsByLga,
  getReportsByState,
  markReportReadApi,
  markReportUnreadApi,
} from "./reportApi";

const cacheKey = (action: { type: string; meta?: { arg?: unknown } }) => {
  const base = action.type.replace(/\/(pending|fulfilled|rejected)$/, "");
  const arg = action.meta?.arg;
  return arg !== undefined ? `${base}::${JSON.stringify(arg)}` : base;
};

interface ReportState {
  cache:   Record<string, unknown>;
  loading: Record<string, boolean>;
  error:   Record<string, string | null>;
}

const initialState: ReportState = {
  cache:   {},
  loading: {},
  error:   {},
};

const fetchThunks = [
  createReport,
  getReportsByElection,
  getReportsByPollingUnit,
  getReportsByWard,
  getReportsByLga,
  getReportsByState,
];

const pendingMatcher   = isAnyOf(...fetchThunks.map((t) => t.pending));
const fulfilledMatcher = isAnyOf(...fetchThunks.map((t) => t.fulfilled));
const rejectedMatcher  = isAnyOf(...fetchThunks.map((t) => t.rejected));

/**
 * After a mark-read or mark-unread response, patch every cache entry that
 * contains the affected report so the UI updates instantly without a refetch.
 */
function patchReadFlag(
  cache: Record<string, unknown>,
  reportId: string,
  isRead: boolean
) {
  for (const key of Object.keys(cache)) {
    const list = cache[key];
    if (!Array.isArray(list)) continue;
    cache[key] = (list as { _id?: string; isRead?: boolean }[]).map((r) =>
      r._id === reportId ? { ...r, isRead } : r
    );
  }
}

const reportSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    clearCache: (state) => {
      state.cache   = {};
      state.loading = {};
      state.error   = {};
    },
    clearCacheEntry: (state, action: { payload: string }) => {
      delete state.cache[action.payload];
      delete state.loading[action.payload];
      delete state.error[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logout, (state) => {
        state.cache   = {};
        state.loading = {};
        state.error   = {};
      })
      /* Mark read — optimistic update in all cache entries */
      .addCase(markReportReadApi.pending, (state, action) => {
        patchReadFlag(state.cache, action.meta.arg, true);
      })
      .addCase(markReportReadApi.fulfilled, (state, action) => {
        patchReadFlag(state.cache, action.payload._id, true);
      })
      .addCase(markReportReadApi.rejected, (state, action) => {
        // Revert optimistic update on failure
        patchReadFlag(state.cache, action.meta.arg as string, false);
      })
      /* Mark unread — optimistic update in all cache entries */
      .addCase(markReportUnreadApi.pending, (state, action) => {
        patchReadFlag(state.cache, action.meta.arg, false);
      })
      .addCase(markReportUnreadApi.fulfilled, (state, action) => {
        patchReadFlag(state.cache, action.payload._id, false);
      })
      .addCase(markReportUnreadApi.rejected, (state, action) => {
        // Revert optimistic update on failure
        patchReadFlag(state.cache, action.meta.arg as string, true);
      })
      .addMatcher(pendingMatcher, (state, action) => {
        const key = cacheKey(action);
        state.loading[key] = true;
        state.error[key]   = null;
      })
      .addMatcher(fulfilledMatcher, (state, action) => {
        const key = cacheKey(action);
        state.loading[key] = false;
        state.cache[key]   = action.payload;
        state.error[key]   = null;
      })
      .addMatcher(rejectedMatcher, (state, action) => {
        const key = cacheKey(action);
        state.loading[key] = false;
        state.error[key]   = (action.payload as string) ?? "Request failed";
      });
  },
});

export const { clearCache, clearCacheEntry } = reportSlice.actions;
export const reportReducer = reportSlice.reducer;
