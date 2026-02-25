import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../config/apiConfig";
import type { RootState } from "../../app/store";

const getAuthHeaders = (getState: () => unknown) => {
  const token = (getState() as RootState).auth.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── GET ─────────────────────────────────────────────────────────────────────
/** GET /api/users?role=&organizationId= – superadmin, executive */
export const getAllUsers = createAsyncThunk(
  "user/getAllUsers",
  async (
    params: { role?: string; organizationId?: string } | undefined,
    { getState, rejectWithValue }
  ) => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.role) searchParams.set("role", params.role);
      if (params?.organizationId) searchParams.set("organizationId", params.organizationId);
      const qs = searchParams.toString();
      const url = qs ? `/users?${qs}` : "/users";
      const res = await api.get(url, { headers: getAuthHeaders(getState) });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get users"
      );
    }
  }
);

/** GET /api/users/:id – own profile only */
export const getUserById = createAsyncThunk(
  "user/getUserById",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/users/${id}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get user"
      );
    }
  }
);

/** GET /api/users/organization/:organizationId – list users in org */
export const getUsersByOrganizationId = createAsyncThunk(
  "user/getUsersByOrganizationId",
  async (organizationId: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(`/users/organization/${organizationId}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get users by organization"
      );
    }
  }
);

/** GET /api/users/organization/:organizationId/lga-collation-officers */
export const getLgaCollationOfficersByOrganizationId = createAsyncThunk(
  "user/getLgaCollationOfficersByOrganizationId",
  async (organizationId: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.get(
        `/users/organization/${organizationId}/lga-collation-officers`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get LGA collation officers"
      );
    }
  }
);

/** GET /api/users/organization/:organizationId/state/:stateId */
export const getUsersByStateId = createAsyncThunk(
  "user/getUsersByStateId",
  async (
    params: { organizationId: string; stateId: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const { organizationId, stateId } = params;
      const res = await api.get(
        `/users/organization/${organizationId}/state/${stateId}`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; error?: string } } };
      return rejectWithValue(
        err.response?.data?.message ?? err.response?.data?.error ?? "Failed to get users by state"
      );
    }
  }
);

/** GET /api/users/organization/:organizationId/lga/:lgaId */
export const getUsersByLgaId = createAsyncThunk(
  "user/getUsersByLgaId",
  async (
    params: { organizationId: string; lgaId: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const { organizationId, lgaId } = params;
      const res = await api.get(
        `/users/organization/${organizationId}/lga/${lgaId}`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; error?: string } } };
      return rejectWithValue(
        err.response?.data?.message ?? err.response?.data?.error ?? "Failed to get users by LGA"
      );
    }
  }
);

/** GET /api/users/organization/:organizationId/ward/:wardId */
export const getUsersByWardId = createAsyncThunk(
  "user/getUsersByWardId",
  async (
    params: { organizationId: string; wardId: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const { organizationId, wardId } = params;
      const res = await api.get(
        `/users/organization/${organizationId}/ward/${wardId}`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; error?: string } } };
      return rejectWithValue(
        err.response?.data?.message ?? err.response?.data?.error ?? "Failed to get users by ward"
      );
    }
  }
);

/** GET /api/users/organization/:organizationId/polling-unit/:pollingUnitId */
export const getUsersByPollingUnitId = createAsyncThunk(
  "user/getUsersByPollingUnitId",
  async (
    params: { organizationId: string; pollingUnitId: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const { organizationId, pollingUnitId } = params;
      const res = await api.get(
        `/users/organization/${organizationId}/polling-unit/${pollingUnitId}`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to get users by polling unit"
      );
    }
  }
);

// ─── POST ────────────────────────────────────────────────────────────────────
/** POST /api/auth/signup/:organizationId – org staff (regular/executive/superadmin) create user in their org */
export const signupUserByOrganizationId = createAsyncThunk(
  "user/signupUserByOrganizationId",
  async (
    params: {
      organizationId: string;
      body: {
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
        sex: string;
        dateOfBirth: string;
        password: string;
        role?: string;
        middleName?: string;
        photo?: string;
        description?: string;
        state?: string;
        lga?: string;
        ward?: string;
        pollingUnit?: string;
      };
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const { organizationId, body } = params;
      const res = await api.post(`/auth/signup/${organizationId}`, body, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; error?: string } } };
      return rejectWithValue(
        err.response?.data?.message ?? err.response?.data?.error ?? "Failed to create user"
      );
    }
  }
);

/** Create user under organization (platform admin only). Body: firstName, lastName, email, phoneNumber, sex, dateOfBirth, password (required); role?, middleName?, state?, lga?, ward?, pollingUnit?, photo? */
export const createUserByOrganizationId = createAsyncThunk(
  "user/createUserByOrganizationId",
  async (
    params: {
      organizationId: string;
      body: {
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
        sex: string;
        dateOfBirth: string;
        password: string;
        role?: string;
        middleName?: string;
        state?: string;
        lga?: string;
        ward?: string;
        pollingUnit?: string;
        photo?: string;
      };
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const { organizationId, body } = params;
      const res = await api.post(`/users/organization/${organizationId}`, body, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to create user"
      );
    }
  }
);

// ─── PUT ────────────────────────────────────────────────────────────────────
/** PUT /api/users/change-password – oldPassword, newPassword */
export const changePassword = createAsyncThunk(
  "user/changePassword",
  async (
    body: { oldPassword: string; newPassword: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const res = await api.put("/users/change-password", body, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to change password"
      );
    }
  }
);

/** PUT /api/users/organization/:organizationId/:id – update user (superadmin, executive) */
export const updateUserByOrganizationId = createAsyncThunk(
  "user/updateUserByOrganizationId",
  async (
    params: {
      organizationId: string;
      id: string;
      body: {
        firstName?: string;
        lastName?: string;
        middleName?: string;
        email?: string;
        phoneNumber?: string;
        sex?: string;
        dateOfBirth?: string;
        description?: string;
        isSuspended?: boolean;
      };
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const { organizationId, id, body } = params;
      const res = await api.put(`/users/organization/${organizationId}/${id}`, body, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to update user"
      );
    }
  }
);

/** PUT /api/users/organization/:organizationId/:id/password – set user password (superadmin, executive) */
export const changeUserPasswordByOrganizationId = createAsyncThunk(
  "user/changeUserPasswordByOrganizationId",
  async (
    params: { organizationId: string; id: string; newPassword: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const { organizationId, id, newPassword } = params;
      const res = await api.put(
        `/users/organization/${organizationId}/${id}/password`,
        { newPassword },
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to change password"
      );
    }
  }
);

/** PUT /api/users/block/:id – superadmin, executive */
export const blockUserById = createAsyncThunk(
  "user/blockUserById",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.put(`/users/block/${id}`, {}, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to block user"
      );
    }
  }
);

/** PUT /api/users/unblock/:id – superadmin, executive */
export const unblockUserById = createAsyncThunk(
  "user/unblockUserById",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.put(`/users/unblock/${id}`, {}, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to unblock user"
      );
    }
  }
);

// ─── DELETE ──────────────────────────────────────────────────────────────────
/** DELETE /api/users/:id – self-delete only */
export const deleteUserById = createAsyncThunk(
  "user/deleteUserById",
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const res = await api.delete(`/users/${id}`, {
        headers: getAuthHeaders(getState),
      });
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to delete user"
      );
    }
  }
);

/** DELETE /api/users/organization/:organizationId/:id – delete user in org */
export const deleteUserByOrganizationId = createAsyncThunk(
  "user/deleteUserByOrganizationId",
  async (
    params: { organizationId: string; id: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const { organizationId, id } = params;
      const res = await api.delete(
        `/users/organization/${organizationId}/${id}`,
        { headers: getAuthHeaders(getState) }
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed to delete user"
      );
    }
  }
);
