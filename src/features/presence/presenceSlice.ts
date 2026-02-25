import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import { checkIn, reportMyPresence, listPresence } from "./presenceApi";

const cacheKey = (action: { type: string; meta?: { arg?: unknown } }) => {
  const base = action.type.replace(/\/(pending|fulfilled|rejected)$/, "");
  const arg = action.meta?.arg;
  if (arg === undefined) return base;
  // For checkIn/reportMyPresence, use only pollingUnitId+electionId so selectors can match
  if (base === "presence/checkIn" || base === "presence/reportMyPresence") {
    const p = arg as { pollingUnitId?: string; electionId?: string };
    if (p?.pollingUnitId && p?.electionId) {
      return `${base}::${JSON.stringify({ pollingUnitId: p.pollingUnitId, electionId: p.electionId })}`;
    }
  }
  return `${base}::${JSON.stringify(arg)}`;
};

interface PresenceState {
  cache: Record<string, unknown>;
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
}

const initialState: PresenceState = {
  cache: {},
  loading: {},
  error: {},
};

const allThunks = [checkIn, reportMyPresence, listPresence];

const pendingMatcher = isAnyOf(...allThunks.map((t) => t.pending));
const fulfilledMatcher = isAnyOf(...allThunks.map((t) => t.fulfilled));
const rejectedMatcher = isAnyOf(...allThunks.map((t) => t.rejected));

const presenceSlice = createSlice({
  name: "presence",
  initialState,
  reducers: {
    clearCache: (state) => {
      state.cache = {};
      state.loading = {};
      state.error = {};
    },
    clearCacheEntry: (state, action: { payload: string }) => {
      delete state.cache[action.payload];
      delete state.loading[action.payload];
      delete state.error[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(pendingMatcher, (state, action) => {
        const key = cacheKey(action);
        state.loading[key] = true;
        state.error[key] = null;
      })
      .addMatcher(fulfilledMatcher, (state, action) => {
        const key = cacheKey(action);
        state.loading[key] = false;
        state.cache[key] = action.payload;
        state.error[key] = null;
      })
      .addMatcher(rejectedMatcher, (state, action) => {
        const key = cacheKey(action);
        state.loading[key] = false;
        state.error[key] = (action.payload as string) ?? "Request failed";
      });
  },
});

export const { clearCache, clearCacheEntry } = presenceSlice.actions;
export const presenceReducer = presenceSlice.reducer;
