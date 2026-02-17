import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import { userApi } from "../features/user/userApi";
import { adminApi } from "../features/admin/adminApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [userApi.reducerPath]: userApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
  },
  middleware: (getDefault) =>
    getDefault().concat(userApi.middleware, adminApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
