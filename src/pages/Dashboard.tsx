import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../app/store";
import {
  getStatesByOrganizationId,
  selectStatesByOrganizationId,
} from "../features/states";
import { getLGAsByState, selectLGAsByState } from "../features/lgas";
import { getWardsByLGA, selectWardsByLGA } from "../features/wards";
import {
  getPollingUnitsByWard,
  selectPollingUnitsByWard,
} from "../features/pollingUnits";
import {
  getUsersByOrganizationId,
  getUsersByStateId,
  getUsersByLgaId,
  getUsersByWardId,
  getUsersByPollingUnitId,
  signupUserByOrganizationId,
} from "../features/user";
import { getUserRoles as fetchUserRoles } from "../features/auth/authApi";
import {
  selectUsersByOrganizationId,
  selectUsersByStateId,
  selectUsersByStateIdLoading,
  selectUsersByLgaId,
  selectUsersByLgaIdLoading,
  selectUsersByWardId,
  selectUsersByWardIdLoading,
  selectUsersByPollingUnitId,
  selectUsersByPollingUnitIdLoading,
} from "../features/user/userSelectors";
import { selectRole } from "../features/auth/authSelectors";
import SearchableSelect from "../components/SearchableSelect";
import "./Dashboard.css";

const OVERVIEW_ROLES = ["superadmin", "executive", "regular"];

/* eslint-disable max-len */
const IconChevronCard = () => (
  <svg className="dash-card__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
);
const IconChevronFeature = () => (
  <svg className="dash-feature__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
);
const IconFile = () => (
  <svg className="dash-feature__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
);
const IconMapPin = () => (
  <svg className="dash-feature__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);
const IconBarChart = () => (
  <svg className="dash-feature__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
);
const IconUsers = () => (
  <svg className="dash-feature__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const IconCamera = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
);
const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
);
/* eslint-enable max-len */

/** Fallback roles if API fails. */
const DEFAULT_CREATE_ROLES = [
  { value: "executive", label: "Executive" },
  { value: "regular", label: "Regular" },
  { value: "superadmin", label: "Super Admin" },
];

interface OrgUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  isSuspended?: boolean;
  sex?: string;
  dateOfBirth?: string;
  description?: string;
  createdAt?: string;
  createdBy?: { firstName?: string; lastName?: string } | string;
}

/** Org-level roles: no state/lga/ward/pollingUnit required */
const ORG_LEVEL_ROLES = ["regular", "executive", "superadmin"];
/** State-level roles: state only */
const STATE_LEVEL_ROLES = ["state_constituency_returning_officer_agent", "state_returning_officer_agent"];
/** LGA collation: state + lga */
const LGA_COLLATION_ROLE = "lga_collation_officer_agent";
/** Ward collation: state + lga + ward (no pollingUnit) */
const WARD_COLLATION_ROLE = "ra_ward_collation_officer_agent";

/** Stable empty array for selectors to avoid "different result" rerender warnings */
const EMPTY_OPTIONS: { _id?: string; name?: string; code?: string }[] = [];

const formatRoleLabel = (role?: string) =>
  role ? role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";

interface AssignedAgent {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: string;
  photo?: string;
}

const getInitials = (agent: AssignedAgent) => {
  const first = (agent.firstName ?? "").trim();
  const last = (agent.lastName ?? "").trim();
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  if (last) return last.slice(0, 2).toUpperCase();
  return "?";
};

const AssignedAgentCard = ({ agent }: { agent: AssignedAgent }) => (
  <div className="dash-agent-card">
    <div className="dash-agent-card__photo">
      {agent.photo ? (
        <img src={agent.photo} alt="" className="dash-agent-card__img" />
      ) : (
        <span className="dash-agent-card__initials">{getInitials(agent)}</span>
      )}
    </div>
    <div className="dash-agent-card__details">
      <div className="dash-agent-card__name">
        {[agent.firstName, agent.lastName].filter(Boolean).join(" ") || "—"}
      </div>
      {agent.phoneNumber && (
        <div className="dash-agent-card__phone">{agent.phoneNumber}</div>
      )}
      {agent.role && (
        <div className="dash-agent-card__role">{formatRoleLabel(agent.role)}</div>
      )}
    </div>
  </div>
);

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    role: "executive",
    state: "",
    lga: "",
    ward: "",
    pollingUnit: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    sex: "male" as "male" | "female",
    dateOfBirth: "",
    password: "",
    photo: "" as string,
    description: "",
  });
  const [createUserError, setCreateUserError] = useState("");
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserRoles, setCreateUserRoles] = useState<Array<{ value: string; label: string }>>(DEFAULT_CREATE_ROLES);
  const [showAssignedDetails, setShowAssignedDetails] = useState(true);
  const [createUserSuccess, setCreateUserSuccess] = useState(false);

  const organizationName = useSelector((state: RootState) => state.auth.user?.organization?.name);
  const stateName = useSelector((state: RootState) => state.auth.user?.state?.name);
  const organizationId = useSelector((state: RootState) => state.auth.user?.organization?._id ?? state.auth.user?.organization?.id);
  const role = useSelector(selectRole) ?? "";
  const orgStates = useSelector(selectStatesByOrganizationId(organizationId ?? ""));
  const orgUsers = useSelector((state: RootState) =>
    selectUsersByOrganizationId(organizationId ?? "")(state)
  ) as OrgUser[] | undefined;

  useEffect(() => {
    if (organizationId && OVERVIEW_ROLES.includes(role)) {
      dispatch(getStatesByOrganizationId(organizationId));
      dispatch(getUsersByOrganizationId(organizationId));
    }
  }, [dispatch, organizationId, role]);

  const selectedRole = createUserForm.role;
  const needsState = !ORG_LEVEL_ROLES.includes(selectedRole);
  const needsLga = needsState && !STATE_LEVEL_ROLES.includes(selectedRole);
  const needsWard = needsLga && selectedRole !== LGA_COLLATION_ROLE;
  const needsPollingUnit = needsWard && selectedRole !== WARD_COLLATION_ROLE;

  const createLgas = useSelector(
    (s: RootState) =>
      (selectLGAsByState(createUserForm.state)(s) as { _id?: string; name?: string; code?: string }[] | undefined) ?? EMPTY_OPTIONS
  );
  const createWards = useSelector(
    (s: RootState) =>
      (selectWardsByLGA(createUserForm.lga)(s) as { _id?: string; name?: string; code?: string }[] | undefined) ?? EMPTY_OPTIONS
  );
  const createPollingUnitsRaw = useSelector((s: RootState) =>
    selectPollingUnitsByWard(organizationId ?? "", createUserForm.ward)(s)
  );
  const createPollingUnits = Array.isArray(createPollingUnitsRaw)
    ? (createPollingUnitsRaw as { _id?: string; name?: string; code?: string }[])
    : ((createPollingUnitsRaw as { pollingUnits?: { _id?: string; name?: string; code?: string }[] })?.pollingUnits ?? []);

  useEffect(() => {
    if (createUserForm.state && needsState) {
      dispatch(getLGAsByState(createUserForm.state));
    }
  }, [dispatch, createUserForm.state, needsState]);

  useEffect(() => {
    if (createUserForm.lga && needsLga) {
      dispatch(getWardsByLGA(createUserForm.lga));
    }
  }, [dispatch, createUserForm.lga, needsLga]);

  useEffect(() => {
    if (organizationId && createUserForm.state && needsState) {
      dispatch(
        getUsersByStateId({
          organizationId,
          stateId: createUserForm.state,
        })
      );
    }
  }, [dispatch, organizationId, createUserForm.state, needsState]);

  useEffect(() => {
    if (organizationId && createUserForm.ward && needsWard) {
      dispatch(getPollingUnitsByWard({ organizationId, wardId: createUserForm.ward }));
    }
  }, [dispatch, organizationId, createUserForm.ward, needsWard]);

  useEffect(() => {
    if (organizationId && createUserForm.lga && needsLga) {
      dispatch(
        getUsersByLgaId({
          organizationId,
          lgaId: createUserForm.lga,
        })
      );
    }
  }, [dispatch, organizationId, createUserForm.lga, needsLga]);

  useEffect(() => {
    if (organizationId && createUserForm.ward && needsWard) {
      dispatch(
        getUsersByWardId({
          organizationId,
          wardId: createUserForm.ward,
        })
      );
    }
  }, [dispatch, organizationId, createUserForm.ward, needsWard]);

  useEffect(() => {
    if (organizationId && createUserForm.pollingUnit && needsPollingUnit) {
      dispatch(
        getUsersByPollingUnitId({
          organizationId,
          pollingUnitId: createUserForm.pollingUnit,
        })
      );
    }
  }, [dispatch, organizationId, createUserForm.pollingUnit, needsPollingUnit]);

  const stateUsersPayload = useSelector((s: RootState) =>
    selectUsersByStateId(organizationId ?? "", createUserForm.state)(s)
  ) as { users?: Array<{ firstName?: string; lastName?: string }> } | undefined;
  const stateUsersLoading = useSelector((s: RootState) =>
    selectUsersByStateIdLoading(organizationId ?? "", createUserForm.state)(s)
  );
  const stateAssignedUsers = stateUsersPayload?.users ?? [];

  const lgaUsersPayload = useSelector((s: RootState) =>
    selectUsersByLgaId(organizationId ?? "", createUserForm.lga)(s)
  ) as { users?: Array<{ firstName?: string; lastName?: string }> } | undefined;
  const lgaUsersLoading = useSelector((s: RootState) =>
    selectUsersByLgaIdLoading(organizationId ?? "", createUserForm.lga)(s)
  );
  const lgaAssignedUsers = lgaUsersPayload?.users ?? [];

  const wardUsersPayload = useSelector((s: RootState) =>
    selectUsersByWardId(organizationId ?? "", createUserForm.ward)(s)
  ) as { users?: Array<{ firstName?: string; lastName?: string }> } | undefined;
  const wardUsersLoading = useSelector((s: RootState) =>
    selectUsersByWardIdLoading(organizationId ?? "", createUserForm.ward)(s)
  );
  const wardAssignedUsers = wardUsersPayload?.users ?? [];

  const puUsersPayload = useSelector((s: RootState) =>
    selectUsersByPollingUnitId(organizationId ?? "", createUserForm.pollingUnit)(s)
  ) as { users?: Array<{ firstName?: string; lastName?: string }> } | undefined;
  const puUsersLoading = useSelector((s: RootState) =>
    selectUsersByPollingUnitIdLoading(organizationId ?? "", createUserForm.pollingUnit)(s)
  );
  const puAssignedUsers = puUsersPayload?.users ?? [];

  const refetchUsers = () => {
    if (organizationId && OVERVIEW_ROLES.includes(role)) dispatch(getUsersByOrganizationId(organizationId));
  };

  const handleOpenCreateUser = async () => {
    setCreateUserForm({
      role: "executive",
      state: "",
      lga: "",
      ward: "",
      pollingUnit: "",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      sex: "male",
      dateOfBirth: "",
      password: "",
      photo: "",
      description: "",
    });
    setCreateUserError("");
    setCreateUserSuccess(false);
    setShowCreateUserModal(true);
    try {
      const roles = await fetchUserRoles();
      if (roles.length > 0) setCreateUserRoles(roles);
    } catch {
      setCreateUserRoles(DEFAULT_CREATE_ROLES);
    }
  };

  const handleCloseCreateUser = () => {
    setShowCreateUserModal(false);
    setCreateUserError("");
    setCreateUserSuccess(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCreateUserForm((f) => ({ ...f, photo: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;
    if (needsState && !createUserForm.state) {
      setCreateUserError("Please select a state.");
      return;
    }
    if (needsLga && !createUserForm.lga) {
      setCreateUserError("Please select an LGA.");
      return;
    }
    if (needsWard && !createUserForm.ward) {
      setCreateUserError("Please select a ward.");
      return;
    }
    if (needsPollingUnit && !createUserForm.pollingUnit) {
      setCreateUserError("Please select a polling unit.");
      return;
    }
    setCreateUserError("");
    setCreateUserLoading(true);
    try {
      const signupBody: {
            firstName: string;
            lastName: string;
            email: string;
            phoneNumber: string;
            sex: string;
            dateOfBirth: string;
            password: string;
            role?: string;
            photo?: string;
            description?: string;
            state?: string;
            lga?: string;
            ward?: string;
            pollingUnit?: string;
          } = {
            firstName: createUserForm.firstName.trim(),
            lastName: createUserForm.lastName.trim(),
            email: createUserForm.email.trim(),
            phoneNumber: createUserForm.phoneNumber.trim(),
            sex: createUserForm.sex,
            dateOfBirth: createUserForm.dateOfBirth,
            password: createUserForm.password,
            role: createUserForm.role,
            photo: createUserForm.photo || undefined,
            description: createUserForm.description.trim() || undefined,
          };
          if (needsState && createUserForm.state) signupBody.state = createUserForm.state;
          if (needsLga && createUserForm.lga) signupBody.lga = createUserForm.lga;
          if (needsWard && createUserForm.ward) signupBody.ward = createUserForm.ward;
          if (needsPollingUnit && createUserForm.pollingUnit) signupBody.pollingUnit = createUserForm.pollingUnit;
      await dispatch(
        signupUserByOrganizationId({
          organizationId,
          body: signupBody,
        })
      ).unwrap();
      refetchUsers();
      setCreateUserSuccess(true);
    } catch (err: unknown) {
      setCreateUserError((err as { message?: string })?.message ?? "Failed to create user");
    } finally {
      setCreateUserLoading(false);
    }
  };

  return (
    <div className="dash-page">
      <div className="dash-page__top">
        <div>
          <p className="dash-page__breadcrumb">
            EMS
            {organizationName ? ` / ${organizationName}` : ""}
            {stateName ? ` / ${stateName}` : ""}
            {" / Dashboard"}
          </p>
          <h1 className="dash-page__title">Dashboard</h1>
        </div>
        <div className="dash-page__actions">
          <button type="button" className="dash-page__btn dash-page__btn--outline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Filter date
          </button>
          <button type="button" className="dash-page__btn dash-page__btn--solid">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
        </div>
      </div>

      <div className="dash-cards">
        <div className="dash-card">
          <h3 className="dash-card__title">Users</h3>
          <p className="dash-card__value">{(orgUsers ?? []).length}</p>
          <p className="dash-card__meta">In this organization</p>
          <div className="dash-card__row">
            <span />
            <IconChevronCard />
          </div>
        </div>
        <div className="dash-card">
          <h3 className="dash-card__title">States</h3>
          <p className="dash-card__value">{(orgStates ?? []).length}</p>
          <p className="dash-card__meta">Under this organization</p>
          <div className="dash-card__row">
            <span />
            <IconChevronCard />
          </div>
        </div>
        <div className="dash-card">
          <h3 className="dash-card__title">Polling Units</h3>
          <p className="dash-card__value">1,247</p>
          <p className="dash-card__meta">Last Update: 2hrs ago</p>
          <div className="dash-card__row">
            <span />
            <IconChevronCard />
          </div>
        </div>
        <div className="dash-card dash-card--banner">
          <div className="dash-card__banner-inner">
            <h3 className="dash-card__banner-title">Manage Party Agents</h3>
            <div className="dash-card__banner-actions">
              <button
                type="button"
                className="dash-card__cta dash-card__cta--primary"
                onClick={handleOpenCreateUser}
              >
                Create Party Agent
              </button>
            </div>
            <p className="dash-card__banner-meta">Create party agents in this organization and manage the list below</p>
          </div>
        </div>
      </div>

      <div className="dash-features">
        <Link to="/dashboard/user-management" className="dash-feature">
          <div className="dash-feature__row">
            <IconUsers />
            <IconChevronFeature />
          </div>
          <h3 className="dash-feature__title">Agents</h3>
          <p className="dash-feature__desc">{(orgUsers ?? []).length} Agent{(orgUsers ?? []).length !== 1 ? "s" : ""} in this organization</p>
        </Link>
        <div className="dash-feature">
          <div className="dash-feature__row">
            <IconMapPin />
            <IconChevronFeature />
          </div>
          <h3 className="dash-feature__title">States</h3>
          <p className="dash-feature__desc">{(orgStates ?? []).length} state{(orgStates ?? []).length !== 1 ? "s" : ""} under this organization</p>
        </div>
        <a href="#reports" className="dash-feature">
          <div className="dash-feature__row">
            <IconFile />
            <IconChevronFeature />
          </div>
          <h3 className="dash-feature__title">Reports</h3>
          <p className="dash-feature__desc">Create and view election reports</p>
        </a>
        <a href="#results" className="dash-feature">
          <div className="dash-feature__row">
            <IconBarChart />
            <IconChevronFeature />
          </div>
          <h3 className="dash-feature__title">Results</h3>
          <p className="dash-feature__desc">Collate and manage result sheets</p>
        </a>
      </div>

      {/* Create Party Agent modal - same as admin OrganizationDetail */}
      {showCreateUserModal && (
        <div
          className="dash-modal-backdrop"
          onClick={handleCloseCreateUser}
          onKeyDown={(e) => e.key === "Escape" && handleCloseCreateUser()}
          role="button"
          tabIndex={0}
        >
          <div className="dash-modal dash-modal--form-large" onClick={(e) => e.stopPropagation()}>
            {createUserSuccess ? (
              <div className="dash-modal__success">
                <div className="dash-modal__success-icon">✓</div>
                <h3 className="dash-modal__success-title">User created</h3>
                <p className="dash-modal__success-text">The user can now sign in.</p>
                <button
                  type="button"
                  className="dash-page__btn dash-page__btn--solid"
                  onClick={handleCloseCreateUser}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
            <h3 className="dash-modal__title">Create Party Agent</h3>
            <p className="dash-modal__subtitle">
              Create a new party agent for <strong>{organizationName ?? "this organization"}</strong>. The party Agent can sign in with email, phone number  and password.
            </p>
            <form onSubmit={handleCreateUserSubmit} className="dash-modal__form dash-modal__form--create-user">
              {/* Role & Assignment section */}
              <div className="dash-modal__section">
                <div className="dash-modal__section-header">
                  <h4 className="dash-modal__section-title">Role & Assignment</h4>
                  {needsState && (
                    <button
                      type="button"
                      className={`dash-modal__toggle-details ${showAssignedDetails ? "dash-modal__toggle-details--on" : ""}`}
                      onClick={() => setShowAssignedDetails((v) => !v)}
                      title={showAssignedDetails ? "Hide assigned agent details" : "Show assigned agent details"}
                    >
                      {showAssignedDetails ? "Hide" : "Show"} assigned details
                    </button>
                  )}
                </div>
              </div>
              <div className="dash-modal__field--full">
                <SearchableSelect
                  id="cu-role"
                  label="Role"
                  value={createUserForm.role}
                  onChange={(val) => {
                    setCreateUserForm((f) => ({
                      ...f,
                      role: val,
                      state: ORG_LEVEL_ROLES.includes(val) ? "" : f.state,
                      lga: STATE_LEVEL_ROLES.includes(val) ? "" : f.lga,
                      ward: STATE_LEVEL_ROLES.includes(val) || val === LGA_COLLATION_ROLE ? "" : f.ward,
                      pollingUnit: val === WARD_COLLATION_ROLE ? "" : f.pollingUnit,
                    }));
                  }}
                  options={createUserRoles}
                  placeholder="Search or select role..."
                  required
                />
              </div>
              {needsState && (
                <div className="dash-modal__location-cell">
                  <SearchableSelect
                    id="cu-state"
                    label="State"
                    value={createUserForm.state}
                    onChange={(val) =>
                      setCreateUserForm((f) => ({
                        ...f,
                        state: val,
                        lga: "",
                        ward: "",
                        pollingUnit: "",
                      }))
                    }
                    options={[
                      { value: "", label: "Select state" },
                      ...(orgStates ?? []).map((s: { _id?: string; name?: string; code?: string }) => ({
                        value: s._id ?? s.code ?? s.name ?? "",
                        label: s.name ?? s.code ?? "—",
                      })),
                    ]}
                    placeholder="Search or select state..."
                    required={needsState}
                  />
                  {showAssignedDetails && createUserForm.state && (
                    <div className="dash-modal__pu-assigned dash-modal__pu-assigned--inline">
                      {stateUsersLoading ? (
                        <span className="dash-modal__pu-assigned-text">Loading...</span>
                      ) : stateAssignedUsers.length > 0 ? (
                        <div className="dash-agent-cards">
                          {stateAssignedUsers.map((u, i) => (
                            <AssignedAgentCard key={(u as { _id?: string })?._id ?? i} agent={u as AssignedAgent} />
                          ))}
                        </div>
                      ) : (
                        <span className="dash-modal__pu-assigned-text dash-modal__pu-assigned-text--empty">
                          No user has been assigned to this state
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              {needsLga && (
                <div className="dash-modal__location-cell">
                  <SearchableSelect
                    id="cu-lga"
                    label="LGA"
                    value={createUserForm.lga}
                    onChange={(val) =>
                      setCreateUserForm((f) => ({
                        ...f,
                        lga: val,
                        ward: "",
                        pollingUnit: "",
                      }))
                    }
                    options={createLgas.map((l) => ({
                      value: l._id ?? l.code ?? l.name ?? "",
                      label: l.name ?? l.code ?? "—",
                    }))}
                    placeholder="Search or select LGA..."
                    required={needsLga}
                  />
                  {showAssignedDetails && createUserForm.lga && (
                    <div className="dash-modal__pu-assigned dash-modal__pu-assigned--inline">
                      {lgaUsersLoading ? (
                        <span className="dash-modal__pu-assigned-text">Loading...</span>
                      ) : lgaAssignedUsers.length > 0 ? (
                        <div className="dash-agent-cards">
                          {lgaAssignedUsers.map((u, i) => (
                            <AssignedAgentCard key={(u as { _id?: string })?._id ?? i} agent={u as AssignedAgent} />
                          ))}
                        </div>
                      ) : (
                        <span className="dash-modal__pu-assigned-text dash-modal__pu-assigned-text--empty">
                          No user has been assigned to this LGA
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              {needsWard && (
                <div className="dash-modal__location-cell">
                  <SearchableSelect
                    id="cu-ward"
                    label="Ward"
                    value={createUserForm.ward}
                    onChange={(val) =>
                      setCreateUserForm((f) => ({
                        ...f,
                        ward: val,
                        pollingUnit: "",
                      }))
                    }
                    options={createWards.map((w) => ({
                      value: w._id ?? w.code ?? w.name ?? "",
                      label: w.name ?? w.code ?? "—",
                    }))}
                    placeholder="Search or select ward..."
                    required={needsWard}
                  />
                  {showAssignedDetails && createUserForm.ward && (
                    <div className="dash-modal__pu-assigned dash-modal__pu-assigned--inline">
                      {wardUsersLoading ? (
                        <span className="dash-modal__pu-assigned-text">Loading...</span>
                      ) : wardAssignedUsers.length > 0 ? (
                        <div className="dash-agent-cards">
                          {wardAssignedUsers.map((u, i) => (
                            <AssignedAgentCard key={(u as { _id?: string })?._id ?? i} agent={u as AssignedAgent} />
                          ))}
                        </div>
                      ) : (
                        <span className="dash-modal__pu-assigned-text dash-modal__pu-assigned-text--empty">
                          No user has been assigned to this ward
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              {needsPollingUnit && (
                <div className="dash-modal__location-cell">
                  <SearchableSelect
                    id="cu-pollingUnit"
                    label="Polling Unit"
                    value={createUserForm.pollingUnit}
                    onChange={(val) =>
                      setCreateUserForm((f) => ({
                        ...f,
                        pollingUnit: val,
                      }))
                    }
                    options={createPollingUnits.map((pu) => ({
                      value: pu._id ?? pu.code ?? pu.name ?? "",
                      label: pu.name ?? pu.code ?? "—",
                    }))}
                    placeholder="Search or select polling unit..."
                    required={needsPollingUnit}
                  />
                  {showAssignedDetails && createUserForm.pollingUnit && (
                    <div className="dash-modal__pu-assigned dash-modal__pu-assigned--inline">
                      {puUsersLoading ? (
                        <span className="dash-modal__pu-assigned-text">Loading...</span>
                      ) : puAssignedUsers.length > 0 ? (
                        <div className="dash-agent-cards">
                          {puAssignedUsers.map((u, i) => (
                            <AssignedAgentCard key={(u as { _id?: string })?._id ?? i} agent={u as AssignedAgent} />
                          ))}
                        </div>
                      ) : (
                        <span className="dash-modal__pu-assigned-text dash-modal__pu-assigned-text--empty">
                          No user has been assigned to this polling unit
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Personal Information section */}
              <div className="dash-modal__section">
                <h4 className="dash-modal__section-title">Personal Information</h4>
              </div>
              <div className="dash-modal__field dash-modal__field--full">
                <label>Profile picture (optional)</label>
                <div className="dash-modal__photo-wrap">
                  <div className="dash-modal__photo-preview">
                    {createUserForm.photo ? (
                      <img src={createUserForm.photo} alt="Preview" className="dash-modal__photo-img" />
                    ) : (
                      <span className="dash-modal__photo-placeholder">No photo</span>
                    )}
                  </div>
                  {createUserForm.photo ? (
                    <button
                      type="button"
                      className="dash-modal__photo-delete"
                      onClick={() => setCreateUserForm((f) => ({ ...f, photo: "" }))}
                      title="Remove photo"
                    >
                      <IconTrash />
                    </button>
                  ) : (
                    <label htmlFor="cu-photo" className="dash-modal__photo-camera">
                      <IconCamera />
                      <span>Add photo</span>
                      <input
                        id="cu-photo"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoChange}
                        className="dash-modal__photo-input"
                      />
                    </label>
                  )}
                </div>
              </div>
              <div className="dash-modal__field">
                <label htmlFor="cu-firstName">First name</label>
                <input
                  id="cu-firstName"
                  type="text"
                  value={createUserForm.firstName}
                  onChange={(e) => setCreateUserForm((f) => ({ ...f, firstName: e.target.value }))}
                  placeholder="e.g. John"
                  required
                />
              </div>
              <div className="dash-modal__field">
                <label htmlFor="cu-lastName">Last name</label>
                <input
                  id="cu-lastName"
                  type="text"
                  value={createUserForm.lastName}
                  onChange={(e) => setCreateUserForm((f) => ({ ...f, lastName: e.target.value }))}
                  placeholder="e.g. Doe"
                  required
                />
              </div>
              <div className="dash-modal__field">
                <label htmlFor="cu-email">Email</label>
                <input
                  id="cu-email"
                  type="email"
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="e.g. john@example.com"
                  required
                />
              </div>
              <div className="dash-modal__field">
                <label htmlFor="cu-phone">Phone number</label>
                <input
                  id="cu-phone"
                  type="text"
                  value={createUserForm.phoneNumber}
                  onChange={(e) => setCreateUserForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                  placeholder="e.g. +2348012345678"
                  required
                />
              </div>
              <SearchableSelect
                id="cu-sex"
                label="Sex"
                value={createUserForm.sex}
                onChange={(val) =>
                  setCreateUserForm((f) => ({ ...f, sex: val as "male" | "female" }))
                }
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ]}
                placeholder="Search or select sex..."
                required
              />
              <div className="dash-modal__field">
                <label htmlFor="cu-dob">Date of birth</label>
                <input
                  id="cu-dob"
                  type="date"
                  value={createUserForm.dateOfBirth}
                  onChange={(e) => setCreateUserForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div className="dash-modal__field">
                <label htmlFor="cu-password">Password</label>
                <input
                  id="cu-password"
                  type="password"
                  value={createUserForm.password}
                  onChange={(e) => setCreateUserForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                />
              </div>
              <div className="dash-modal__field dash-modal__field--full">
                <label htmlFor="cu-description">Description (optional)</label>
                <textarea
                  id="cu-description"
                  value={createUserForm.description}
                  onChange={(e) => setCreateUserForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Executive officer for Rivers state"
                  rows={3}
                />
              </div>
              {createUserError && (
                <div className="dash-modal__error-box dash-modal__field--full">
                  <span className="dash-modal__error-icon">!</span>
                  <span className="dash-modal__error-text">{createUserError}</span>
                </div>
              )}
              <div className="dash-modal__actions">
                <button type="button" className="dash-page__btn dash-page__btn--outline" onClick={handleCloseCreateUser}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dash-page__btn dash-page__btn--solid"
                  disabled={createUserLoading}
                >
                  {createUserLoading ? "Creating..." : "Create Party Agent"}
                </button>
              </div>
            </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
