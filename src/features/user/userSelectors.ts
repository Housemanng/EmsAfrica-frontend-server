import type { RootState } from "../../app/store";
export const selectSelectedUser = (state: RootState) =>
  state.user?.selectedUserId;
