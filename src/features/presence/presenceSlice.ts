import { createSlice } from "@reduxjs/toolkit";

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

const presenceSlice = createSlice({
  name: "presence",
  initialState,
  reducers: {
    clearCache: (state) => {
      state.cache = {};
      state.loading = {};
      state.error = {};
    },
  },
});

export const presenceReducer = presenceSlice.reducer;
