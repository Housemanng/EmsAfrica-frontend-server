import api from "../../config/apiConfig";

export const loginUser = async (data: { identifier: string; password: string }) => {
  const res = await api.post("/auth/login", data);
  return res.data;
};

export const signupUser = async (data: Record<string, unknown>) => {
  const res = await api.post("/auth/signup", data);
  return res.data;
};

