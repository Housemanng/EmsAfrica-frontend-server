import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../config/apiConfig";
import { loginUser } from "../features/auth/authApi";
import { setCredentials } from "../features/auth/authSlice";
import "./Login.css";

interface TenantContext {
  organization?: { _id: string; name: string; code?: string };
  state?: { _id: string; name: string; code?: string } | null;
  party?: { name: string; acronym: string; logo?: string; color?: string } | null;
}

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [tenantContext, setTenantContext] = useState<TenantContext | null>(null);
  const [suspendedOrg, setSuspendedOrg] = useState<{ name: string; code: string } | null>(null);

  useEffect(() => {
    api
      .get("/tenant-context")
      .then((res) => {
        const data = res.data;
        if (data?.suspended && data?.suspendedOrg) {
          setSuspendedOrg({
            name: data.suspendedOrg.organizationName ?? "This organization",
            code: data.suspendedOrg.organizationCode ?? "",
          });
          setTenantContext(null);
        } else if (data?.tenantContext?.organization || data?.organization) {
          setSuspendedOrg(null);
          setTenantContext({
            organization: data.tenantContext?.organization ?? data.organization,
            state: data.tenantContext?.state ?? data.state ?? null,
          });
        } else if (data?.state) {
          setSuspendedOrg(null);
          setTenantContext({ state: data.state });
        } else {
          setSuspendedOrg(null);
        }
      })
      .catch(() => {
        setSuspendedOrg(null);
      });
  }, []);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await loginUser({ identifier, password });

      const user = {
        id: res._id ?? res.id,
        username: res.firstName ? `${res.firstName} ${res.lastName || ""}`.trim() : res.email ?? res.username ?? "user",
        email: res.email,
        organization: res.organization ? { _id: res.organization._id ?? res.organization.id, name: res.organization.name } : undefined,
        state: res.state ? { _id: res.state._id ?? res.state.id, name: res.state.name } : undefined,
        lga: res.lga,
        ward: res.ward,
        pollingUnit: res.pollingUnit,
      };
      const role = res.role || "user";

      if (res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("userAuth", JSON.stringify({ token: res.token, user, role }));
      }
      dispatch(setCredentials({ token: res.token, role, user }));

      navigate("/dashboard");
    } catch (err: unknown) {
      console.error("Login failed:", err);
      const message = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      setError(message || "Login failed. Check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="login-page">
      <div className="login-page__grid" aria-hidden />

      <div className="login-page__container">
        {tenantContext?.organization?.name && (tenantContext.party?.logo || tenantContext.party) && (
          <div className="login-page__org-logo-top">
            {tenantContext.party?.logo ? (
              <img
                src={tenantContext.party.logo}
                alt={tenantContext.party.acronym}
                className="login-page__org-logo"
              />
            ) : (
              <div
                className="login-page__org-logo-placeholder"
                style={{ background: tenantContext.party?.color ?? "#374151" }}
              >
                {tenantContext.party?.acronym?.slice(0, 3) ?? "ORG"}
              </div>
            )}
          </div>
        )}
        <div className="login-page__card">
          {tenantContext?.organization?.name && (
            <div className="login-page__org-banner">
              {tenantContext.organization.name}
              {tenantContext.state?.name && (
                <span className="login-page__org-state"> — {tenantContext.state.name}</span>
              )}
            </div>
          )}
          <div className="login-page__title-wrap">
            <h1 className="login-page__logo">EMS</h1>
            <p className="login-page__subtitle">Electoral Monitoring System</p>
          </div>

          <h2 className="login-page__heading">Sign in</h2>

          {suspendedOrg ? (
            <div className="login-page__suspended" role="alert">
              <p><strong>{suspendedOrg.name}</strong> is currently suspended.</p>
              <p>Login and signup are disabled. Please contact your administrator.</p>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="login-page__form">
            <div className="login-page__field">
              <div className="login-page__input-wrap">
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  onFocus={(e) => e.currentTarget.parentElement?.classList.add("login-page__input-wrap--focused")}
                  onBlur={(e) => {
                    if (!e.currentTarget.value.trim()) e.currentTarget.parentElement?.classList.remove("login-page__input-wrap--focused");
                  }}
                  required
                  className="login-page__input"
                />
                <span className={`login-page__float ${identifier ? "login-page__float--up" : ""}`}>
                  Enter your email or phone number
                </span>
              </div>
            </div>

            <div className="login-page__field">
              <div className="login-page__input-wrap">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={(e) => e.currentTarget.parentElement?.classList.add("login-page__input-wrap--focused")}
                  onBlur={(e) => {
                    if (!e.currentTarget.value) e.currentTarget.parentElement?.classList.remove("login-page__input-wrap--focused");
                  }}
                  required
                  className="login-page__input"
                />
                <span className={`login-page__float ${password ? "login-page__float--up" : ""}`}>
                  Enter your password
                </span>
              </div>
            </div>

            {error && <p className="login-page__error">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="login-page__btn"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
          )}

          <p className="login-page__footer">Secure access for authorized agents only</p>
        </div>
      </div>

      <footer className="login-page__main-footer">
        This is a product of Cleeq24 Ltd. <br/>All rights reserved from 2015 to {currentYear}.
      </footer>
    </div>
  );
}
