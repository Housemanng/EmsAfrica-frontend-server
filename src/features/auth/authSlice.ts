import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  organization?: { _id?: string; id?: string; name: string };
  state?: { _id?: string; name: string };
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  role: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  role: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        token: string;
        role: string;
        user: AuthUser;
      }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.role = action.payload.role;
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("userAuth");
      }
    },

    restoreFromStorage: (state) => {
      if (typeof localStorage === "undefined") return;
      try {
        const raw = localStorage.getItem("userAuth");
        if (!raw) return;
        const data = JSON.parse(raw) as { token?: string; user?: AuthUser; role?: string };
        if (data.token && data.user) {
          state.token = data.token;
          state.user = data.user;
          state.role = data.role ?? "user";
          localStorage.setItem("token", data.token);
        }
      } catch {
        localStorage.removeItem("userAuth");
        localStorage.removeItem("token");
      }
    },
  },
});

export const { setCredentials, logout, restoreFromStorage } = authSlice.actions;
export default authSlice.reducer;
