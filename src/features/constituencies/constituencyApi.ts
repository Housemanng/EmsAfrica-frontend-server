import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../config/apiConfig";
import type { RootState } from "../../app/store";

const getAuthHeaders = (getState: () => unknown) => {
  const token = (getState() as RootState).auth.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export type ConstituencyType =
  | "governorship"
  | "senate"
  | "house_of_rep"
  | "state_house_of_assembly"
  | "chairmanship"
  | "councillorship";

export type ConstituencyCoverageType = "lga" | "wards";

export interface ConstituencyForm {
  name: string;
  type: ConstituencyType;
  state: string;
  coverageType: ConstituencyCoverageType;
  coverageIds: string[];
}

export const getConstituenciesByOrganization = createAsyncThunk(
  "constituencies/getConstituenciesByOrganization",
  async (
    params: { organizationId: string; stateId?: string; type?: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const query: Record<string, string> = {};
      if (params.stateId) query.stateId = params.stateId;
      if (params.type) query.type = params.type;
      const res = await api.get(
        `/constituencies/organization/${params.organizationId}`,
        { params: Object.keys(query).length ? query : undefined, headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get constituencies"
      );
    }
  }
);

export const getConstituencyById = createAsyncThunk(
  "constituencies/getConstituencyById",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/constituencies/${id}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get constituency"
      );
    }
  }
);

export const createConstituency = createAsyncThunk(
  "constituencies/createConstituency",
  async (body: ConstituencyForm, { getState, rejectWithValue }) => {
    try {
      const res = await api.post("/constituencies", body, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to create constituency"
      );
    }
  }
);

export const updateConstituency = createAsyncThunk(
  "constituencies/updateConstituency",
  async (
    params: { id: string; body: Partial<ConstituencyForm> },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.put(`/constituencies/${params.id}`, params.body, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to update constituency"
      );
    }
  }
);

export const deleteConstituency = createAsyncThunk(
  "constituencies/deleteConstituency",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.delete(`/constituencies/${id}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to delete constituency"
      );
    }
  }
);
