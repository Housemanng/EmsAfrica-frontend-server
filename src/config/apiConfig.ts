import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL = "http://localhost:5000/api";

/** On localhost, send the org subdomain host so the backend resolves the correct tenant. */
const STATE_HOST = import.meta.env.VITE_STATE_HOST as string | undefined;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    ...(STATE_HOST && { "X-State-Host": STATE_HOST }),
  },
});

export default api;

export const API_ENDPOINTS = {
  AUTH: "/auth",
  USERS: "/users",
  ADMIN: "/admin",
};

export const endpoints = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    signup: `${API_BASE_URL}/auth/signup`,
  },
  user: {
    getProfile: `${API_BASE_URL}/users/me`,
    changePassword: `${API_BASE_URL}/users/change-password`,
  },
  admin: {
    login: `${API_BASE_URL}/admin/login`,
    signup: `${API_BASE_URL}/admin/signup`,
    getAllAdmins: `${API_BASE_URL}/admin`,
  },
};
