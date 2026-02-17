import { createBrowserRouter } from "react-router-dom";
import Layout from "./layout";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import AdminDashboard from "../pages/AdminDashboard";
import NotFound from "../pages/ErrorPage";
import ErrorPage from "../pages/ErrorPage";
import { ProtectedRoute } from "../middleware/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />, // default route
    errorElement: <ErrorPage />, // catches global errors
  },

  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },

  {
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />, // handles errors inside protected routes
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/admin", element: <AdminDashboard /> },
    ],
  },

  // ✅ THIS HANDLES ALL UNKNOWN ROUTES (404)
  {
    path: "*",
    element: <NotFound />,
  },
]);
