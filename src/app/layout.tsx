import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import type { RootState } from "../app/store";
import UserDetailsModal from "../components/UserDetailsModal";
import "./Layout.css";

/* eslint-disable max-len */
const IconGrid = () => (
  <svg
    className="dash-sidebar__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const IconChart = () => (
  <svg
    className="dash-sidebar__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M18 20V10" />
    <path d="M12 20V4" />
    <path d="M6 20v-6" />
  </svg>
);
const IconFile = () => (
  <svg
    className="dash-sidebar__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);
const IconCheck = () => (
  <svg
    className="dash-sidebar__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="M22 4 12 14.01l-3-3" />
  </svg>
);
const IconMapPin = () => (
  <svg
    className="dash-sidebar__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconTrophy = () => (
  <svg
    className="dash-sidebar__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);
const IconEdit = () => (
  <svg
    className="dash-sidebar__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconChevronRight = () => (
  <svg
    className="dash-sidebar__chevron"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);
const IconSettings = () => (
  <svg
    className="dash-sidebar__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const IconUsers = () => (
  <svg
    className="dash-sidebar__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconHelp = () => (
  <svg
    className="dash-sidebar__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);
const IconShield = () => (
  <svg
    className="dash-sidebar__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconBell = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    width="20"
    height="20"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const IconMenu = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    width="20"
    height="20"
  >
    <path d="M3 12h18" />
    <path d="M3 6h18" />
    <path d="M3 18h18" />
  </svg>
);
/* eslint-enable max-len */

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const role = useSelector((state: RootState) => state.auth.role);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() || "U";

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="dash-layout">
      <div
        className={`dash-sidebar__overlay ${sidebarOpen ? "dash-sidebar__overlay--visible" : ""}`}
        onClick={closeSidebar}
        aria-hidden
      />
      <aside
        className={`dash-sidebar ${sidebarOpen ? "dash-sidebar--open" : ""}`}
      >
        <div className="dash-sidebar__logo">EMS</div>
        <nav className="dash-sidebar__nav">
          <div className="dash-sidebar__section">
            <div className="dash-sidebar__section-title">Menu</div>
            <Link
              to="/dashboard"
              className={`dash-sidebar__link ${location.pathname === "/dashboard" ? "dash-sidebar__link--active" : ""}`}
              onClick={closeSidebar}
            >
              <IconGrid /> Dashboard{" "}
              {location.pathname === "/dashboard" && <IconChevronRight />}
            </Link>
            <Link
              to="/dashboard"
              className="dash-sidebar__link"
              onClick={closeSidebar}
            >
              <IconChart /> Analytics
            </Link>
            <Link
              to="/dashboard"
              className="dash-sidebar__link"
              onClick={closeSidebar}
            >
              <IconFile /> Reports
            </Link>
            <Link
              to="/dashboard"
              className="dash-sidebar__link"
              onClick={closeSidebar}
            >
              <IconCheck /> Accreditation
            </Link>
            <Link
              to="/dashboard"
              className="dash-sidebar__link"
              onClick={closeSidebar}
            >
              <IconMapPin /> Polling Units
            </Link>
            <Link
              to="/results"
              className={`dash-sidebar__link ${location.pathname === "/results" ? "dash-sidebar__link--active" : ""}`}
              onClick={closeSidebar}
            >
              <IconEdit /> Results{" "}
              {location.pathname === "/results" && <IconChevronRight />}
            </Link>
            <Link
              to="/results/winning-analysis"
              className={`dash-sidebar__link ${location.pathname === "/results/winning-analysis" ? "dash-sidebar__link--active" : ""}`}
              onClick={closeSidebar}
            >
              <IconTrophy /> Result Winning Analysis{" "}
              {location.pathname === "/results/winning-analysis" && (
                <IconChevronRight />
              )}
            </Link>
            {role !== "user" && (
              <Link
                to="/admin"
                className={`dash-sidebar__link ${location.pathname === "/admin" ? "dash-sidebar__link--active" : ""}`}
                onClick={closeSidebar}
              >
                <IconShield /> Admin Panel
              </Link>
            )}
          </div>
          <div className="dash-sidebar__section">
            <div className="dash-sidebar__section-title">Settings</div>
            <button
              type="button"
              className="dash-sidebar__link dash-sidebar__link--btn"
              onClick={() => {
                setUserModalOpen(true);
                closeSidebar();
              }}
            >
              <IconUsers /> User Details
            </button>
            <button
              type="button"
              className="dash-sidebar__link dash-sidebar__link--btn"
              onClick={() => {
                handleLogout();
                closeSidebar();
              }}
            >
              <svg className="dash-sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
            <Link
              to="/dashboard"
              className="dash-sidebar__link"
              onClick={closeSidebar}
            >
              <IconUsers /> User Management
            </Link>
            <Link
              to="/dashboard"
              className="dash-sidebar__link"
              onClick={closeSidebar}
            >
              <IconSettings /> System Settings
            </Link>
            <Link
              to="/dashboard"
              className="dash-sidebar__link"
              onClick={closeSidebar}
            >
              <IconHelp /> Support
            </Link>
          </div>
        </nav>
      </aside>

      <button
        type="button"
        className="dash-sidebar__toggle"
        onClick={() => setSidebarOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        <IconMenu />
      </button>

      <main className="dash-main">
        <header className="dash-header">
          <h2 className="dash-header__greeting">
            Good{" "}
            {new Date().getHours() < 12
              ? "morning"
              : new Date().getHours() < 18
                ? "afternoon"
                : "evening"}
            , {user?.username || "User"}!
          </h2>
          <div className="dash-header__actions">
            <button
              type="button"
              className="dash-header__btn"
              aria-label="Notifications"
            >
              <IconBell />
            </button>
            <div
              className="dash-header__avatar"
              title={user?.username || "User"}
            >
              {initials}
            </div>
            <button
              type="button"
              className="dash-header__btn"
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="18"
                height="18"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </header>
        <div className="dash-content">
          <Outlet />
        </div>
      </main>

      <UserDetailsModal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        user={{
          username: user?.username,
          email: user?.email,
          role: role ?? undefined,
        }}
      />
    </div>
  );
}
