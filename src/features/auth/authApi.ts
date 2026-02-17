import axios from "axios";
import { endpoints } from "../../config/apiConfig";

export const loginUser = async (data: { identifier: string; password: string }) => {
  const res = await axios.post(endpoints.auth.login, data);
  return res.data;
};

export const signupUser = async (data: any) => {
  const res = await axios.post(endpoints.auth.signup, data);
  return res.data;
};

