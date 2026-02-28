import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, updateUser } from "../features/auth/authSlice";
import type { RootState } from "../app/store";
import UserDetailsModal from "../components/UserDetailsModal";
import api from "../config/apiConfig";
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
const IconCalendar = () => (
  <svg className="dash-sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
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
const IconWard = () => (
  <svg
    className="dash-sidebar__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconLGA = () => (
  <svg
    className="dash-sidebar__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="16" />
    <line x1="10" y1="14" x2="14" y2="14" />
  </svg>
);
const IconState = () => (
  <svg
    className="dash-sidebar__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
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

  const token = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    if (!user?.id || !token) return;
    api
      .get(`/users/${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const data = res.data;
        if (data?.photo !== undefined) {
          dispatch(updateUser({ photo: data.photo }));
          const raw = localStorage.getItem("userAuth");
          if (raw) {
            try {
              const stored = JSON.parse(raw) as { user?: { photo?: string }; token?: string; role?: string };
              if (stored.user) {
                stored.user = { ...stored.user, photo: data.photo };
                localStorage.setItem("userAuth", JSON.stringify(stored));
              }
            } catch {
              // ignore
            }
          }
        }
      })
      .catch(() => {});
  }, [user?.id, token, dispatch]);

  const handlePhotoError = () => {
    dispatch(updateUser({ photo: undefined }));
    const raw = localStorage.getItem("userAuth");
    if (raw) {
      try {
        const stored = JSON.parse(raw) as { user?: { photo?: string } };
        if (stored.user && stored.user.photo) {
          stored.user = { ...stored.user, photo: undefined };
          localStorage.setItem("userAuth", JSON.stringify(stored));
        }
      } catch {
        // ignore
      }
    }
  };

  const closeSidebar = () => setSidebarOpen(false);

  const isOverviewRole = role === "executive" || role === "regular" || role === "superadmin";

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
            {isOverviewRole && (
              <Link
                to="/dashboard"
                className={`dash-sidebar__link ${location.pathname === "/dashboard" ? "dash-sidebar__link--active" : ""}`}
                onClick={closeSidebar}
              >
                <IconGrid /> Dashboard{" "}
                {location.pathname === "/dashboard" && <IconChevronRight />}
              </Link>
            )}
            {isOverviewRole && (
              <Link
                to="/dashboard/user-management"
                className={`dash-sidebar__link ${location.pathname === "/dashboard/user-management" ? "dash-sidebar__link--active" : ""}`}
                onClick={closeSidebar}
              >
                <IconUsers /> Agent Management
                {location.pathname === "/dashboard/user-management" && <IconChevronRight />}
              </Link>
            )}
            {isOverviewRole && (
              <Link
                to="/elections"
                className={`dash-sidebar__link ${location.pathname === "/elections" ? "dash-sidebar__link--active" : ""}`}
                onClick={closeSidebar}
              >
                <IconCalendar /> Elections
                {location.pathname === "/elections" && <IconChevronRight />}
              </Link>
            )}
            {isOverviewRole && (
              <Link
                to="/dashboard"
                className="dash-sidebar__link"
                onClick={closeSidebar}
              >
                <IconChart /> Analytics
              </Link>
            )}
            {isOverviewRole && (
              <Link
                to="/dashboard"
                className="dash-sidebar__link"
                onClick={closeSidebar}
              >
                <IconCheck /> Accreditation
              </Link>
            )}
           
            {/* <Link
              to="/results"
              className={`dash-sidebar__link ${location.pathname === "/results" ? "dash-sidebar__link--active" : ""}`}
              onClick={closeSidebar}
            >
              <IconEdit /> Polling Unit Results{" "}
              {location.pathname === "/results" && <IconChevronRight />}
            </Link> */}
            {(role === "presiding_officer_po_agent" || role === "superadmin" || role === "executive" || role === "regular") && (
              <Link
              to="/results"
              className={`dash-sidebar__link ${location.pathname === "/results" ? "dash-sidebar__link--active" : ""}`}
              onClick={closeSidebar}
            >
              <IconEdit /> Polling Unit Results{" "}
              {location.pathname === "/results" && <IconChevronRight />}
              </Link>
            )}
            {(role === "ra_ward_collation_officer_agent" || role === "superadmin" || role === "executive" || role === "regular") && (
              <Link
                to="/ward-results"
                className={`dash-sidebar__link ${location.pathname === "/ward-results" ? "dash-sidebar__link--active" : ""}`}
                onClick={closeSidebar}
              >
                <IconWard /> Ward Results{" "}
                {location.pathname === "/ward-results" && <IconChevronRight />}
              </Link>
            )}
            {(role === "lga_collation_officer_agent" || role === "superadmin" || role === "executive" || role === "regular") && (
              <Link
                to="/lga-results"
                className={`dash-sidebar__link ${location.pathname === "/lga-results" ? "dash-sidebar__link--active" : ""}`}
                onClick={closeSidebar}
              >
                <IconLGA /> LGA Results{" "}
                {location.pathname === "/lga-results" && <IconChevronRight />}
              </Link>
            )}
            {(role === "state_constituency_returning_officer_agent" || role === "superadmin" || role === "executive" || role === "regular") && (
              <Link
                to="/state-results"
                className={`dash-sidebar__link ${location.pathname === "/state-results" ? "dash-sidebar__link--active" : ""}`}
                onClick={closeSidebar}
              >
                <IconState /> State Results{" "}
                {location.pathname === "/state-results" && <IconChevronRight />}
              </Link>
            )}
            {isOverviewRole && (
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
            )}
            <Link
              to="/dashboard"
              className="dash-sidebar__link"
              onClick={closeSidebar}
            >
              <IconFile /> Reports
            </Link>
            {/* {role !== "user" && (
              <Link
                to="/admin"
                className={`dash-sidebar__link ${location.pathname === "/admin" ? "dash-sidebar__link--active" : ""}`}
                onClick={closeSidebar}
              >
                <IconShield /> Admin Panel
              </Link>
            )} */}
          </div>
          <div className="dash-sidebar__section">
            <div className="dash-sidebar__section-title">Settings</div>
           
         
            {/* <Link
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
            </Link> */}
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
          <div className="dash-header__avatar-top" aria-hidden>
            <div
              className="dash-header__avatar"
              title={user?.username || "User"}
            >
              {user?.photo ? (
                <img
                  src={user.photo}
                  alt=""
                  onError={handlePhotoError}
                />
              ) : (
                initials
              )}
            </div>
          </div>
          <div className="dash-header__row">
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
                className="dash-header__avatar dash-header__avatar--desktop"
                title={user?.username || "User"}
              >
                {user?.photo ? (
                  <img
                    src={user.photo}
                    alt=""
                    onError={handlePhotoError}
                  />
                ) : (
                  initials
                )}
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
