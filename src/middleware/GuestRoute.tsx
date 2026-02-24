import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import type { JSX } from "react";

/** When user is signed in, redirect to dashboard. Otherwise show the auth page (Login/Signup). */
export const GuestRoute = ({ children }: { children: JSX.Element }) => {
  const token = useSelector((state: RootState) => state.auth.token);

  if (token) return <Navigate to="/dashboard" replace />;

  return children;
};
