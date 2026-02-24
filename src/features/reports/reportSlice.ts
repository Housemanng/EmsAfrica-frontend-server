import { createSlice } from "@reduxjs/toolkit";

interface ReportState {
  cache: Record<string, unknown>;
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
}

const initialState: ReportState = {
  cache: {},
  loading: {},
  error: {},
};

const reportSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    clearCache: (state) => {
      state.cache = {};
      state.loading = {};
      state.error = {};
    },
  },
});

export const reportReducer = reportSlice.reducer;
