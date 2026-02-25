import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import type { AppDispatch, RootState } from "../app/store";
import {
  getElectionsByOrganizationId,
  createElectionByOrganizationId,
  updateElection,
  deleteElection,
  startVoting,
  concludeElection,
} from "../features/elections";
import { createAspirantByElectionId } from "../features/aspirants";
import {
  selectElectionsByOrganizationId,
  selectElectionsByOrganizationIdLoading,
  selectElectionsByOrganizationIdError,
} from "../features/elections/electionSelectors";
import SearchableSelect from "../components/SearchableSelect";
import "./Dashboard.css";

const ELECTION_TYPE_OPTIONS = [
  { value: "presidential", label: "Presidential" },
  { value: "governorship", label: "Governorship" },
  { value: "senate", label: "Senate" },
  { value: "house_of_rep", label: "House of Representatives" },
  { value: "house_of_representatives", label: "House of Representatives (alt)" },
  { value: "state_assembly", label: "State Assembly" },
  { value: "state_house_of_assembly", label: "State House of Assembly" },
  { value: "local_government_chairman", label: "Local Government Chairman" },
  { value: "councillor", label: "Councillor" },
];

/* eslint-disable max-len */
const IconCalendar = () => (
  <svg className="dash-sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);
const IconChevron = () => (
  <svg className="dash-feature__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6" />
  </svg>
);
/* eslint-enable max-len */

interface Aspirant {
  _id: string;
  name: string;
  office?: string;
  partyName?: string;
  partyCode?: string;
  party?: { name?: string; acronym?: string };
}

interface Election {
  _id: string;
  name: string;
  type: string;
  electionDate: string;
  status: "upcoming" | "active" | "concluded";
  electionGroup?: string;
  state?: { _id: string; name?: string; code?: string };
  organization?: { _id: string; name?: string; code?: string };
  votingStartedAt?: string;
  concludedAt?: string;
  aspirants?: Aspirant[];
}

const formatType = (type?: string) =>
  type ? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

const STATUS_LABELS: Record<string, string> = {
  upcoming: "Upcoming",
  active: "Active",
  concluded: "Concluded",
};

export default function Elections() {
  const dispatch = useDispatch<AppDispatch>();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    type: "governorship",
    electionDate: "",
    electionGroup: "",
  });
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [viewingElection, setViewingElection] = useState<Election | null>(null);
  const [editingElection, setEditingElection] = useState<Election | null>(null);
  const [editForm, setEditForm] = useState({ name: "", type: "", electionDate: "", electionGroup: "" });
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [showCreateAspirantModal, setShowCreateAspirantModal] = useState(false);
  const [createAspirantElection, setCreateAspirantElection] = useState<Election | null>(null);
  const [createAspirantForm, setCreateAspirantForm] = useState({ name: "", partyCode: "", party: "" });
  const [createAspirantError, setCreateAspirantError] = useState("");
  const [createAspirantLoading, setCreateAspirantLoading] = useState(false);

  const organizationName = useSelector((state: RootState) => state.auth.user?.organization?.name);
  const organizationId = useSelector((state: RootState) => state.auth.user?.organization?._id ?? state.auth.user?.organization?.id);
  const elections = useSelector((state: RootState) =>
    selectElectionsByOrganizationId(organizationId ?? "")(state)
  ) as Election[] | undefined;
  const loading = useSelector((state: RootState) =>
    selectElectionsByOrganizationIdLoading(organizationId ?? "")(state)
  );
  const error = useSelector((state: RootState) =>
    (selectElectionsByOrganizationIdError(organizationId ?? "")(state) as string | null) ?? null
  );

  useEffect(() => {
    if (organizationId) {
      dispatch(getElectionsByOrganizationId({ organizationId }));
    }
  }, [dispatch, organizationId]);

  const filteredElections = (elections ?? []).filter((e) => {
    const matchesStatus = !statusFilter || e.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (e.name ?? "").toLowerCase().includes(q) ||
      formatType(e.type).toLowerCase().includes(q) ||
      (e.electionGroup ?? "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const counts = {
    total: (elections ?? []).length,
    upcoming: (elections ?? []).filter((e) => e.status === "upcoming").length,
    active: (elections ?? []).filter((e) => e.status === "active").length,
    concluded: (elections ?? []).filter((e) => e.status === "concluded").length,
  };

  const handleOpenCreate = () => {
    setCreateForm({
      name: "",
      type: "governorship",
      electionDate: new Date().toISOString().split("T")[0],
      electionGroup: "",
    });
    setCreateError("");
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !createForm.name.trim() || !createForm.type || !createForm.electionDate) {
      setCreateError("Name, type and date are required.");
      return;
    }
    setCreateError("");
    setCreateLoading(true);
    try {
      await dispatch(
        createElectionByOrganizationId({
          organizationId,
          body: {
            name: createForm.name.trim(),
            type: createForm.type,
            electionDate: createForm.electionDate,
            electionGroup: createForm.electionGroup.trim() || undefined,
          },
        })
      ).unwrap();
      setShowCreateModal(false);
      dispatch(getElectionsByOrganizationId({ organizationId }));
    } catch (err: unknown) {
      setCreateError((err as { message?: string })?.message ?? "Failed to create election");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleView = (election: Election) => setViewingElection(election);
  const handleCloseView = () => setViewingElection(null);

  const handleEdit = (election: Election) => {
    setEditingElection(election);
    setEditForm({
      name: election.name ?? "",
      type: election.type ?? "governorship",
      electionDate: election.electionDate ? new Date(election.electionDate).toISOString().split("T")[0] : "",
      electionGroup: election.electionGroup ?? "",
    });
    setEditError("");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingElection) return;
    setEditError("");
    setEditLoading(true);
    try {
      await dispatch(
        updateElection({
          id: editingElection._id,
          body: {
            name: editForm.name.trim(),
            type: editForm.type,
            electionDate: editForm.electionDate,
            electionGroup: editForm.electionGroup.trim() || undefined,
          },
        })
      ).unwrap();
      setEditingElection(null);
      if (organizationId) dispatch(getElectionsByOrganizationId({ organizationId }));
    } catch (err: unknown) {
      setEditError((err as { message?: string })?.message ?? "Failed to update election");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (election: Election) => {
    const result = await Swal.fire({
      title: "Delete Election",
      html: `Are you sure you want to delete <strong>"${election.name}"</strong>? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed || !organizationId) return;
    try {
      await dispatch(deleteElection(election._id)).unwrap();
      Swal.fire({ icon: "success", title: "Deleted", text: "Election deleted successfully." });
      dispatch(getElectionsByOrganizationId({ organizationId }));
    } catch (err: unknown) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: (err as { message?: string })?.message ?? "Failed to delete election",
      });
    }
  };

  const handleStartVoting = async (election: Election) => {
    const result = await Swal.fire({
      title: "Start Voting",
      html: `Start voting for <strong>"${election.name}"</strong>? This will set the election status to Active.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, start",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    try {
      await dispatch(startVoting(election._id)).unwrap();
      Swal.fire({ icon: "success", title: "Started", text: "Voting has started." });
      if (organizationId) dispatch(getElectionsByOrganizationId({ organizationId }));
    } catch (err: unknown) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: (err as { message?: string })?.message ?? "Failed to start voting",
      });
    }
  };

  const handleConclude = async (election: Election) => {
    const result = await Swal.fire({
      title: "Conclude Election",
      html: `Conclude <strong>"${election.name}"</strong>? This will set the status to Concluded.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, conclude",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    try {
      await dispatch(concludeElection(election._id)).unwrap();
      Swal.fire({ icon: "success", title: "Concluded", text: "Election has been concluded." });
      if (organizationId) dispatch(getElectionsByOrganizationId({ organizationId }));
    } catch (err: unknown) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: (err as { message?: string })?.message ?? "Failed to conclude election",
      });
    }
  };

  const handleOpenCreateAspirant = (election: Election) => {
    setCreateAspirantElection(election);
    setCreateAspirantForm({ name: "", partyCode: "", party: "" });
    setCreateAspirantError("");
    setShowCreateAspirantModal(true);
  };

  const handleCloseCreateAspirant = () => {
    setShowCreateAspirantModal(false);
    setCreateAspirantElection(null);
  };

  const handleCreateAspirantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createAspirantElection || !createAspirantForm.name.trim() || !createAspirantForm.partyCode.trim()) {
      setCreateAspirantError("Name and party code are required.");
      return;
    }
    setCreateAspirantError("");
    setCreateAspirantLoading(true);
    try {
      await dispatch(
        createAspirantByElectionId({
          electionId: createAspirantElection._id,
          body: {
            name: createAspirantForm.name.trim(),
            partyCode: createAspirantForm.partyCode.trim().toUpperCase(),
            party: createAspirantForm.party.trim() || createAspirantForm.partyCode.trim(),
          },
        })
      ).unwrap();
      handleCloseCreateAspirant();
      if (organizationId) dispatch(getElectionsByOrganizationId({ organizationId }));
      Swal.fire({ icon: "success", title: "Aspirant created", text: "Aspirant added successfully." });
    } catch (err: unknown) {
      setCreateAspirantError((err as { message?: string })?.message ?? "Failed to create aspirant");
    } finally {
      setCreateAspirantLoading(false);
    }
  };

  const role = useSelector((state: RootState) => state.auth.role);
  const canManage = role === "superadmin" || role === "executive" || role === "regular";

  return (
    <div className="dash-page">
      <div className="dash-page__top">
        <div>
          <p className="dash-page__breadcrumb">
            EMS {organizationName ? ` / ${organizationName}` : ""} / Elections
          </p>
          <h1 className="dash-page__title">Elections</h1>
        </div>
        <div className="dash-page__actions">
          {canManage && (
            <button
              type="button"
              className="dash-page__btn dash-page__btn--solid"
              onClick={handleOpenCreate}
            >
              <IconCalendar />
              Create Election
            </button>
          )}
        </div>
      </div>

      <div className="dash-cards">
        <div className="dash-card">
          <h3 className="dash-card__title">Total Elections</h3>
          <p className="dash-card__value">{counts.total}</p>
          <p className="dash-card__meta">In this organization</p>
          <div className="dash-card__row">
            <span />
            <IconChevron />
          </div>
        </div>
        <div className="dash-card">
          <h3 className="dash-card__title">Upcoming</h3>
          <p className="dash-card__value">{counts.upcoming}</p>
          <p className="dash-card__meta">Scheduled</p>
          <div className="dash-card__row">
            <span />
            <IconChevron />
          </div>
        </div>
        <div className="dash-card">
          <h3 className="dash-card__title">Active</h3>
          <p className="dash-card__value">{counts.active}</p>
          <p className="dash-card__meta">Voting in progress</p>
          <div className="dash-card__row">
            <span />
            <IconChevron />
          </div>
        </div>
        <div className="dash-card">
          <h3 className="dash-card__title">Concluded</h3>
          <p className="dash-card__value">{counts.concluded}</p>
          <p className="dash-card__meta">Completed</p>
          <div className="dash-card__row">
            <span />
            <IconChevron />
          </div>
        </div>
      </div>

      {/* Status filter cards */}
      <div className="dash-role-cards">
        <button
          type="button"
          className={`dash-role-card ${statusFilter === null ? "dash-role-card--active" : ""}`}
          onClick={() => setStatusFilter(null)}
        >
          <span className="dash-role-card__label">All</span>
          <span className="dash-role-card__count">{counts.total}</span>
        </button>
        <button
          type="button"
          className={`dash-role-card ${statusFilter === "upcoming" ? "dash-role-card--active" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "upcoming" ? null : "upcoming")}
        >
          <span className="dash-role-card__label">Upcoming</span>
          <span className="dash-role-card__count">{counts.upcoming}</span>
        </button>
        <button
          type="button"
          className={`dash-role-card ${statusFilter === "active" ? "dash-role-card--active" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "active" ? null : "active")}
        >
          <span className="dash-role-card__label">Active</span>
          <span className="dash-role-card__count">{counts.active}</span>
        </button>
        <button
          type="button"
          className={`dash-role-card ${statusFilter === "concluded" ? "dash-role-card--active" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "concluded" ? null : "concluded")}
        >
          <span className="dash-role-card__label">Concluded</span>
          <span className="dash-role-card__count">{counts.concluded}</span>
        </button>
      </div>

      <section className="dash-table-section">
        <div className="dash-table-section__head">
          <h2 className="dash-table-section__title">Elections ({filteredElections.length})</h2>
          <div className="dash-table-section__tools">
            <div className="dash-table-section__search">
              <IconSearch />
              <input
                type="text"
                placeholder="Search elections..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading && (elections ?? []).length === 0 ? (
          <p className="dash-table-section__meta">Loading elections...</p>
        ) : error ? (
          <p className="dash-page__error">{error}</p>
        ) : (
          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th className="dash-table__name-col">Name</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Status</th>
                  {/* <th>Group</th> */}
                  <th>Aspirants</th>
                  <th className="dash-table__actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredElections.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="dash-table__empty">
                      No elections found.
                    </td>
                  </tr>
                ) : (
                  filteredElections.map((e) => (
                    <tr key={e._id}>
                      <td className="dash-table__name-col">
                        <div className="dash-table__product">
                          <div className="dash-table__thumb">
                            {(e.name ?? "?").slice(0, 2).toUpperCase()}
                          </div>
                          <span>{e.name ?? "—"}</span>
                        </div>
                      </td>
                      <td>{formatType(e.type)}</td>
                      <td>{formatDate(e.electionDate)}</td>
                      <td>
                        <span
                          className={`dash-table__status ${
                            e.status === "active"
                              ? "dash-table__status--success"
                              : e.status === "concluded"
                                ? "dash-table__status"
                                : "dash-table__status--warning"
                          }`}
                        >
                          {STATUS_LABELS[e.status] ?? e.status}
                        </span>
                      </td>
                      {/* <td>{e.electionGroup ?? "—"}</td> */}
                      <td>{e.aspirants?.length ?? 0}</td>
                      <td className="dash-table__actions-col">
                        <div className="dash-table__actions-wrap">
                          <button
                            type="button"
                            className="dash-page__btn dash-page__btn--outline"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                            onClick={() => handleView(e)}
                          >
                            View
                          </button>
                          {canManage && (
                            <button
                              type="button"
                              className="dash-page__btn dash-page__btn--outline"
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", color: "#ffffff" }}
                              onClick={() => handleOpenCreateAspirant(e)}
                            >
                            Add Aspirant
                            </button>
                          )}
                          {e.status === "upcoming" && canManage && (
                            <button
                              type="button"
                              className="dash-page__btn dash-page__btn--outline"
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", color: "#059669" }}
                              onClick={() => handleStartVoting(e)}
                            >
                              Start
                            </button>
                          )}
                          {e.status === "active" && canManage && (
                            <button
                              type="button"
                              className="dash-page__btn dash-page__btn--outline"
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", color: "#d97706" }}
                              onClick={() => handleConclude(e)}
                            >
                              Conclude
                            </button>
                          )}
                          {canManage && (
                            <>
                              <button
                                type="button"
                                className="dash-page__btn dash-page__btn--outline"
                                style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                                onClick={() => handleEdit(e)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="dash-page__btn"
                                style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", background: "#dc2626", color: "#fff" }}
                                onClick={() => handleDelete(e)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Create modal */}
      {showCreateModal && (
        <div
          className="dash-modal-backdrop"
          onClick={() => setShowCreateModal(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowCreateModal(false)}
          role="button"
          tabIndex={0}
        >
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="dash-modal__title">Create Election</h3>
            <p className="dash-modal__subtitle">
              Add a new election for <strong>{organizationName ?? "this organization"}</strong>.
            </p>
            <form onSubmit={handleCreateSubmit} className="dash-modal__form dash-modal__form--create-user">
              <div className="dash-modal__field">
                <label htmlFor="ce-name">Name</label>
                <input
                  id="ce-name"
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. 2023 Governorship"
                  required
                />
              </div>
              <div className="dash-modal__field dash-modal__field--full">
                <SearchableSelect
                  id="ce-type"
                  label="Type"
                  value={createForm.type}
                  onChange={(val) => setCreateForm((f) => ({ ...f, type: val }))}
                  options={ELECTION_TYPE_OPTIONS}
                  placeholder="Search or select election type..."
                  required
                />
              </div>
              <div className="dash-modal__field">
                <label htmlFor="ce-date">Election Date</label>
                <input
                  id="ce-date"
                  type="date"
                  value={createForm.electionDate}
                  onChange={(e) => setCreateForm((f) => ({ ...f, electionDate: e.target.value }))}
                  required
                />
              </div>
              <div className="dash-modal__field">
                <label htmlFor="ce-group">Group (optional)</label>
                <input
                  id="ce-group"
                  type="text"
                  value={createForm.electionGroup}
                  onChange={(e) => setCreateForm((f) => ({ ...f, electionGroup: e.target.value }))}
                  placeholder="e.g. 2023 General"
                />
              </div>
              {createError && <p className="dash-table-section__error">{createError}</p>}
              <div className="dash-modal__actions">
                <button type="button" className="dash-page__btn dash-page__btn--outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="dash-page__btn dash-page__btn--solid" disabled={createLoading}>
                  {createLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingElection && (
        <div
          className="dash-modal-backdrop"
          onClick={() => setEditingElection(null)}
          onKeyDown={(e) => e.key === "Escape" && setEditingElection(null)}
          role="button"
          tabIndex={0}
        >
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="dash-modal__title">Edit Election</h3>
            <p className="dash-modal__subtitle">Update details for {editingElection.name}.</p>
            <form onSubmit={handleEditSubmit} className="dash-modal__form">
              <div className="dash-modal__field">
                <label>Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="dash-modal__field">
                <label>Type</label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}
                  required
                >
                  <option value="governorship">Governorship</option>
                  <option value="presidential">Presidential</option>
                  <option value="senate">Senate</option>
                  <option value="house_of_rep">House of Representatives</option>
                  <option value="state_assembly">State Assembly</option>
                  <option value="house_of_representatives">House of Representatives (alt)</option>
                  <option value="state_house_of_assembly">State House of Assembly</option>
                </select>
              </div>
              <div className="dash-modal__field">
                <label>Election Date</label>
                <input
                  type="date"
                  value={editForm.electionDate}
                  onChange={(e) => setEditForm((f) => ({ ...f, electionDate: e.target.value }))}
                  required
                />
              </div>
              <div className="dash-modal__field">
                <label>Group (optional)</label>
                <input
                  type="text"
                  value={editForm.electionGroup}
                  onChange={(e) => setEditForm((f) => ({ ...f, electionGroup: e.target.value }))}
                  placeholder="e.g. 2023 General"
                />
              </div>
              {editError && <p className="dash-table-section__error">{editError}</p>}
              <div className="dash-modal__actions">
                <button type="button" className="dash-page__btn dash-page__btn--outline" onClick={() => setEditingElection(null)}>
                  Cancel
                </button>
                <button type="submit" className="dash-page__btn dash-page__btn--solid" disabled={editLoading}>
                  {editLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View modal */}
      {viewingElection && (
        <div
          className="dash-modal-backdrop"
          onClick={handleCloseView}
          onKeyDown={(e) => e.key === "Escape" && handleCloseView()}
          role="button"
          tabIndex={0}
        >
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="dash-modal__title">Election Details</h3>
            <p className="dash-modal__subtitle">{viewingElection.name}</p>
            <div className="dash-modal__view-grid">
              <div className="dash-modal__view-row">
                <span className="dash-modal__view-label">Name</span>
                <span className="dash-modal__view-value">{viewingElection.name ?? "—"}</span>
              </div>
              <div className="dash-modal__view-row">
                <span className="dash-modal__view-label">Type</span>
                <span className="dash-modal__view-value">{formatType(viewingElection.type)}</span>
              </div>
              <div className="dash-modal__view-row">
                <span className="dash-modal__view-label">Election Date</span>
                <span className="dash-modal__view-value">{formatDate(viewingElection.electionDate)}</span>
              </div>
              <div className="dash-modal__view-row">
                <span className="dash-modal__view-label">Status</span>
                <span
                  className={`dash-table__status ${
                    viewingElection.status === "active"
                      ? "dash-table__status--success"
                      : viewingElection.status === "concluded"
                        ? "dash-table__status"
                        : "dash-table__status--warning"
                  }`}
                >
                  {STATUS_LABELS[viewingElection.status] ?? viewingElection.status}
                </span>
              </div>
              {viewingElection.electionGroup && (
                <div className="dash-modal__view-row">
                  <span className="dash-modal__view-label">Group</span>
                  <span className="dash-modal__view-value">{viewingElection.electionGroup}</span>
                </div>
              )}
              {viewingElection.state?.name && (
                <div className="dash-modal__view-row">
                  <span className="dash-modal__view-label">State</span>
                  <span className="dash-modal__view-value">{viewingElection.state.name}</span>
                </div>
              )}
              {viewingElection.votingStartedAt && (
                <div className="dash-modal__view-row">
                  <span className="dash-modal__view-label">Voting started</span>
                  <span className="dash-modal__view-value">{formatDate(viewingElection.votingStartedAt)}</span>
                </div>
              )}
              {viewingElection.concludedAt && (
                <div className="dash-modal__view-row">
                  <span className="dash-modal__view-label">Concluded</span>
                  <span className="dash-modal__view-value">{formatDate(viewingElection.concludedAt)}</span>
                </div>
              )}
              {viewingElection.aspirants && viewingElection.aspirants.length > 0 && (
                <div className="dash-modal__view-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.5rem" }}>
                  <span className="dash-modal__view-label">Aspirants ({viewingElection.aspirants.length})</span>
                  <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                    {viewingElection.aspirants.map((a) => (
                      <li key={a._id}>
                        {a.name}
                        {(a.partyCode || a.party?.acronym) && (
                          <span style={{ color: "#6b7280", marginLeft: "0.5rem" }}>
                            ({(a.partyCode ?? a.party?.acronym ?? "").toUpperCase()})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="dash-modal__actions">
              <button type="button" className="dash-page__btn dash-page__btn--outline" onClick={handleCloseView}>
                Close
              </button>
              {canManage && (
                <>
                  <button
                    type="button"
                    className="dash-page__btn dash-page__btn--outline"
                    style={{ color: "#2563eb" }}
                    onClick={() => {
                      handleCloseView();
                      handleOpenCreateAspirant(viewingElection);
                    }}
                  >
                    Create Aspirant
                  </button>
                  <button
                    type="button"
                    className="dash-page__btn dash-page__btn--solid"
                    onClick={() => {
                      handleCloseView();
                      handleEdit(viewingElection);
                    }}
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Aspirant modal */}
      {showCreateAspirantModal && createAspirantElection && (
        <div
          className="dash-modal-backdrop"
          onClick={handleCloseCreateAspirant}
          onKeyDown={(e) => e.key === "Escape" && handleCloseCreateAspirant()}
          role="button"
          tabIndex={0}
        >
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="dash-modal__title">Create Aspirant</h3>
            <p className="dash-modal__subtitle">
              Add an aspirant for <strong>{createAspirantElection.name}</strong>
            </p>
            <form onSubmit={handleCreateAspirantSubmit} className="dash-modal__form">
              <div className="dash-modal__field">
                <label htmlFor="ca-name">Name</label>
                <input
                  id="ca-name"
                  type="text"
                  value={createAspirantForm.name}
                  onChange={(e) => setCreateAspirantForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Aspirant full name"
                  required
                />
              </div>
              <div className="dash-modal__field">
                <label htmlFor="ca-party-code">Party Code</label>
                <input
                  id="ca-party-code"
                  type="text"
                  value={createAspirantForm.partyCode}
                  onChange={(e) => setCreateAspirantForm((f) => ({ ...f, partyCode: e.target.value.toUpperCase() }))}
                  placeholder="e.g. PDP, APC"
                  required
                />
              </div>
              <div className="dash-modal__field">
                <label htmlFor="ca-party">Party Name (optional)</label>
                <input
                  id="ca-party"
                  type="text"
                  value={createAspirantForm.party}
                  onChange={(e) => setCreateAspirantForm((f) => ({ ...f, party: e.target.value }))}
                  placeholder="e.g. Peoples Democratic Party"
                />
              </div>
              {createAspirantError && <p className="dash-table-section__error">{createAspirantError}</p>}
              <div className="dash-modal__actions">
                <button type="button" className="dash-page__btn dash-page__btn--outline" onClick={handleCloseCreateAspirant}>
                  Cancel
                </button>
                <button type="submit" className="dash-page__btn dash-page__btn--solid" disabled={createAspirantLoading}>
                  {createAspirantLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
