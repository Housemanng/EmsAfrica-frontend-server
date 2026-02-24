import { createSlice } from "@reduxjs/toolkit";
import { getAllAdmins } from "./adminApi";

interface AdminState {
  admins: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  admins: [],
  isLoading: false,
  error: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllAdmins.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllAdmins.fulfilled, (state, action) => {
        state.isLoading = false;
        state.admins = action.payload ?? [];
        state.error = null;
      })
      .addCase(getAllAdmins.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? "Failed to get admins";
      });
  },
});

export const adminReducer = adminSlice.reducer;
