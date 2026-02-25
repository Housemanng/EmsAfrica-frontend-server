import { createBrowserRouter } from "react-router-dom";
import Layout from "./layout";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import UserManagement from "../pages/UserManagement";
import Elections from "../pages/Elections";
import Results from "../pages/Results";
import ResultWinningAnalysis from "../pages/ResultWinningAnalysis";
import AdminDashboard from "../pages/AdminDashboard";
import NotFound from "../pages/ErrorPage";
import ErrorPage from "../pages/ErrorPage";
import { ProtectedRoute } from "../middleware/ProtectedRoute";
import { GuestRoute } from "../middleware/GuestRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <GuestRoute>
        <Login />
      </GuestRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/login",
    element: (
      <GuestRoute>
        <Login />
      </GuestRoute>
    ),
  },
  {
    path: "/signup",
    element: (
      <GuestRoute>
        <Signup />
      </GuestRoute>
    ),
  },

  {
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />, // handles errors inside protected routes
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/dashboard/user-management", element: <UserManagement /> },
      { path: "/elections", element: <Elections /> },
      { path: "/results", element: <Results /> },
      { path: "/results/winning-analysis", element: <ResultWinningAnalysis /> },
      { path: "/admin", element: <AdminDashboard /> },
    ],
  },

  // ✅ THIS HANDLES ALL UNKNOWN ROUTES (404)
  {
    path: "*",
    element: <NotFound />,
  },
]);
