import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/** Host for tenant resolution. On localhost use VITE_STATE_HOST; on production use current host (e.g. imo.pdp.emsafrica.net). */
const getStateHost = (): string | undefined => {
  if (typeof window === "undefined") return import.meta.env.VITE_STATE_HOST as string | undefined;
  const host = window.location?.host;
  if (!host || host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
    return import.meta.env.VITE_STATE_HOST as string | undefined;
  }
  return host;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const host = getStateHost();
  if (host) config.headers["X-State-Host"] = host;
  return config;
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
