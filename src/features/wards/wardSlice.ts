import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import {
  getAllWards,
  getWardsByLGA,
  getWardById,
  getPollingUnitsByWard,
  createWard,
  createPollingUnitUnderWard,
  updateWard,
  deleteWard,
} from "./wardApi";

const cacheKey = (action: { type: string; meta?: { arg?: unknown } }) => {
  const base = action.type.replace(/\/(pending|fulfilled|rejected)$/, "");
  const arg = action.meta?.arg;
  return arg !== undefined ? `${base}::${JSON.stringify(arg)}` : base;
};

interface WardState {
  cache: Record<string, unknown>;
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
}

const initialState: WardState = {
  cache: {},
  loading: {},
  error: {},
};

const allThunks = [
  getAllWards,
  getWardsByLGA,
  getWardById,
  getPollingUnitsByWard,
  createWard,
  createPollingUnitUnderWard,
  updateWard,
  deleteWard,
];

const pendingMatcher = isAnyOf(...allThunks.map((t) => t.pending));
const fulfilledMatcher = isAnyOf(...allThunks.map((t) => t.fulfilled));
const rejectedMatcher = isAnyOf(...allThunks.map((t) => t.rejected));

const wardSlice = createSlice({
  name: "wards",
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

export const { clearCache, clearCacheEntry } = wardSlice.actions;
export const wardReducer = wardSlice.reducer;
