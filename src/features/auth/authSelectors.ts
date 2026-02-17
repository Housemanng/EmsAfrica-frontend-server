import type { RootState } from "../../app/store";

export const selectUser = (state: RootState) => state.auth.user;
export const selectRole = (state: RootState) => state.auth.role;