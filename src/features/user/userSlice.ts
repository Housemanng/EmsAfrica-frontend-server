import { createSlice } from "@reduxjs/toolkit";

interface UserState {
  selectedUserId: string | null;
}

const initialState: UserState = {
  selectedUserId: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setSelectedUser: (state, action) => {
      state.selectedUserId = action.payload;
    },
  },
});

export const { setSelectedUser } = userSlice.actions;
export default userSlice.reducer;
