import api from "../../config/apiConfig";

export const loginUser = async (data: { identifier: string; password: string }) => {
  const res = await api.post("/auth/login", data);
  return res.data;
};

export const signupUser = async (data: Record<string, unknown>) => {
  const res = await api.post("/auth/signup", data);
  return res.data;
};

/** Get available user roles for dropdown. GET /api/auth/roles */
export const getUserRoles = async (): Promise<Array<{ value: string; label: string }>> => {
  const res = await api.get<{ roles: Array<{ value: string; label: string }> }>("/auth/roles");
  return res.data.roles ?? [];
};
