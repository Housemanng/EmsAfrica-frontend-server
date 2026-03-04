import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import type { JSX } from "react";

const OVERVIEW_ROLES = new Set(["executive", "regular", "superadmin"]);

/** When user is signed in, redirect to dashboard (overview roles) or results (agent roles). Otherwise show the auth page. */
export const GuestRoute = ({ children }: { children: JSX.Element }) => {
  const token = useSelector((state: RootState) => state.auth.token);
  const role = useSelector((state: RootState) => state.auth.role);

  if (token) {
    const destination = !role || OVERVIEW_ROLES.has(role) ? "/dashboard" : "/results";
    return <Navigate to={destination} replace />;
  }

  return children;
};
