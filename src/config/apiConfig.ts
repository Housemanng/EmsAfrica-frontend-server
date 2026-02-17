export const BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL = "http://localhost:5000/api";

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
