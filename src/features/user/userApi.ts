import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL, API_ENDPOINTS } from "../../config/apiConfig";

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getAllUsers: builder.query({
      query: () => `${API_ENDPOINTS.USERS}`,
    }),

    getUserById: builder.query({
      query: (id) => `${API_ENDPOINTS.USERS}/${id}`,
    }),

    changePassword: builder.mutation({
      query: (data) => ({
        url: `${API_ENDPOINTS.USERS}/change-password`,
        method: "PUT",
        body: data,
      }),
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useChangePasswordMutation,
} = userApi;
