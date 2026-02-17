import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import type { JSX } from "react/jsx-dev-runtime";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = useSelector((state: RootState) => state.auth.token);

  if (!token) return <Navigate to="/login" />;

  return children;
};
