import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../config/apiConfig";
import type { RootState } from "../../app/store";

export const getAllAdmins = createAsyncThunk(
  "admin/getAllAdmins",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as RootState).auth.token;
      const response = await api.get("/admin", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to get admins"
      );
    }
  }
);
