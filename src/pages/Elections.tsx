import { useEffect, useRef, useState } from "react";
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
import { createAspirantByElectionId, deleteAspirant } from "../features/aspirants";
import {
  selectElectionsByOrganizationId,
  selectElectionsByOrganizationIdLoading,
  selectElectionsByOrganizationIdError,
} from "../features/elections/electionSelectors";
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
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconLayers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
  </svg>
);
const IconActivity = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const IconCheckCircle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
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
const IconChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M6 9l6 6 6-6" />
  </svg>
);
const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
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

type AspirantTotals = {
  aspirants?: Array<{
    aspirant: { _id?: string; name?: string; partyCode?: string; party?: string };
    totalVotes: number;
    isLeading: boolean;
    position: number;
    positionLabel?: string;
  }>;
};

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
  aspirantTotals?: AspirantTotals;
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

/** Renders leading party code and percentage for an election (used in table) */
function LeadingCell({ totals }: { totals: AspirantTotals | null | undefined }) {
  if (!totals?.aspirants?.length) return <span className="dash-table__leading">—</span>;
  const totalVotes = totals.aspirants.reduce((s: number, t: { totalVotes?: number }) => s + (t.totalVotes ?? 0), 0);
  if (totalVotes === 0) return <span className="dash-table__leading">—</span>;
  const leader = totals.aspirants[0];
  const leaderVotes = leader?.totalVotes ?? 0;
  const pct = (leaderVotes / totalVotes) * 100;
  const partyCode = (leader?.aspirant?.partyCode ?? "").toUpperCase();
  return (
    <span className="dash-table__leading">
      <span className="dash-table__leading-party">{partyCode}</span>
      <span className="dash-table__leading-pct">{pct.toFixed(1)}%</span>
      <span className="dash-table__leading-votes">({leaderVotes.toLocaleString()} votes)</span>
    </span>
  );
}

const formatPosition = (pos: number, label?: string) => {
  if (label) return label.charAt(0).toUpperCase() + label.slice(1);
  const ord = ["1st", "2nd", "3rd"];
  return pos <= 3 ? ord[pos - 1] ?? `${pos}th` : `${pos}th`;
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
  const [actionsOpenId, setActionsOpenId] = useState<string | null>(null);
  const lastFetchedOrgRef = useRef<string | null>(null);

  const organizationName = useSelector((state: RootState) => state.auth.user?.organization?.name);
  const organizationId = useSelector((state: RootState) => state.auth.user?.organization?._id ?? state.auth.user?.organization?.id);
  const electionsQuery = { includeResults: true };
  const elections = useSelector((state: RootState) =>
    selectElectionsByOrganizationId(organizationId ?? "", electionsQuery)(state)
  ) as Election[] | undefined;
  const loading = useSelector((state: RootState) =>
    selectElectionsByOrganizationIdLoading(organizationId ?? "", electionsQuery)(state)
  );
  const error = useSelector((state: RootState) =>
    (selectElectionsByOrganizationIdError(organizationId ?? "", electionsQuery)(state) as string | null) ?? null
  );

  useEffect(() => {
    if (!organizationId) {
      lastFetchedOrgRef.current = null;
      return;
    }
    if (lastFetchedOrgRef.current === organizationId) return;
    lastFetchedOrgRef.current = organizationId;
    dispatch(getElectionsByOrganizationId({ organizationId, query: { includeResults: true } }));
  }, [dispatch, organizationId]);

  useEffect(() => {
    if (!actionsOpenId) return;
    const close = () => setActionsOpenId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [actionsOpenId]);

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
      dispatch(getElectionsByOrganizationId({ organizationId, query: { includeResults: true } }));
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
      if (organizationId) dispatch(getElectionsByOrganizationId({ organizationId, query: { includeResults: true } }));
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
      dispatch(getElectionsByOrganizationId({ organizationId, query: { includeResults: true } }));
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
      if (organizationId) dispatch(getElectionsByOrganizationId({ organizationId, query: { includeResults: true } }));
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
      if (organizationId) dispatch(getElectionsByOrganizationId({ organizationId, query: { includeResults: true } }));
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

  const handleRemoveAspirant = async (aspirant: Aspirant, election: Election) => {
    const result = await Swal.fire({
      title: "Remove Aspirant",
      html: `Are you sure you want to remove <strong>"${aspirant.name}"</strong> from this election? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    try {
      await dispatch(deleteAspirant(aspirant._id)).unwrap();
      setViewingElection((prev) =>
        prev && prev._id === election._id
          ? {
              ...prev,
              aspirants: (prev.aspirants ?? []).filter((a) => a._id !== aspirant._id),
            }
          : prev
      );
      if (organizationId) dispatch(getElectionsByOrganizationId({ organizationId, query: { includeResults: true } }));
      Swal.fire({ icon: "success", title: "Removed", text: "Aspirant removed successfully." });
    } catch (err: unknown) {
      Swal.fire({
        icon: "error",
        title: "Remove failed",
        text: (err as { message?: string })?.message ?? "Failed to remove aspirant",
      });
    }
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
      if (organizationId) dispatch(getElectionsByOrganizationId({ organizationId, query: { includeResults: true } }));
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
        <button
          type="button"
          className={`dash-card dash-card--filter ${statusFilter === null ? "dash-card--active" : ""}`}
          onClick={() => setStatusFilter(null)}
        >
          <div className="dash-card__icon-wrap dash-card__icon-wrap--total">
            <IconLayers />
          </div>
          <div className="dash-card__body">
            <h3 className="dash-card__title">Total Elections</h3>
            <p className="dash-card__value">{counts.total}</p>
            <p className="dash-card__meta">In this organization</p>
          </div>
          <span className="dash-card__chevron"><IconChevron /></span>
        </button>
        <button
          type="button"
          className={`dash-card dash-card--filter ${statusFilter === "upcoming" ? "dash-card--active" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "upcoming" ? null : "upcoming")}
        >
          <div className="dash-card__icon-wrap dash-card__icon-wrap--upcoming">
            <IconCalendar />
          </div>
          <div className="dash-card__body">
            <h3 className="dash-card__title">Upcoming</h3>
            <p className="dash-card__value">{counts.upcoming}</p>
            <p className="dash-card__meta">Scheduled</p>
          </div>
          <span className="dash-card__chevron"><IconChevron /></span>
        </button>
        <button
          type="button"
          className={`dash-card dash-card--filter ${statusFilter === "active" ? "dash-card--active" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "active" ? null : "active")}
        >
          <div className="dash-card__icon-wrap dash-card__icon-wrap--active">
            <IconActivity />
          </div>
          <div className="dash-card__body">
            <h3 className="dash-card__title">Active</h3>
            <p className="dash-card__value">{counts.active}</p>
            <p className="dash-card__meta">Voting in progress</p>
          </div>
          <span className="dash-card__chevron"><IconChevron /></span>
        </button>
        <button
          type="button"
          className={`dash-card dash-card--filter ${statusFilter === "concluded" ? "dash-card--active" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "concluded" ? null : "concluded")}
        >
          <div className="dash-card__icon-wrap dash-card__icon-wrap--concluded">
            <IconCheckCircle />
          </div>
          <div className="dash-card__body">
            <h3 className="dash-card__title">Concluded</h3>
            <p className="dash-card__value">{counts.concluded}</p>
            <p className="dash-card__meta">Completed</p>
          </div>
          <span className="dash-card__chevron"><IconChevron /></span>
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
                  <th>Leading</th>
                  <th>Aspirants</th>
                  <th className="dash-table__actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredElections.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="dash-table__empty">
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
                      <td>
                        <LeadingCell totals={e.aspirantTotals} />
                      </td>
                      <td>{e.aspirants?.length ?? 0}</td>
                      <td className="dash-table__actions-col">
                        <div
                          className="dash-table__actions-dropdown"
                          onClick={(ev) => ev.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="dash-table__actions-trigger"
                            onClick={() => setActionsOpenId(actionsOpenId === e._id ? null : e._id)}
                            aria-expanded={actionsOpenId === e._id}
                            aria-haspopup="true"
                          >
                            Actions
                            <IconChevronDown />
                          </button>
                          {actionsOpenId === e._id && (
                            <div className="dash-table__actions-menu">
                              <button type="button" onClick={() => { handleView(e); setActionsOpenId(null); }}>
                                View
                              </button>
                              {canManage && (
                                <>
                                  <button type="button" onClick={() => { handleOpenCreateAspirant(e); setActionsOpenId(null); }}>
                                    Add Aspirant
                                  </button>
                                  {e.status === "upcoming" && (
                                    <button type="button" onClick={() => { handleStartVoting(e); setActionsOpenId(null); }}>
                                      Start
                                    </button>
                                  )}
                                  {e.status === "active" && (
                                    <button type="button" onClick={() => { handleConclude(e); setActionsOpenId(null); }}>
                                      Conclude
                                    </button>
                                  )}
                                  <button type="button" onClick={() => { handleEdit(e); setActionsOpenId(null); }}>
                                    Edit
                                  </button>
                                  {e.status === "upcoming" && (
                                    <button
                                      type="button"
                                      className="dash-table__actions-menu-item--danger"
                                      onClick={() => { handleDelete(e); setActionsOpenId(null); }}
                                    >
                                      Delete
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
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
              <div className="dash-modal__field dash-modal__field--full">
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
                <label htmlFor="ce-type">Type</label>
                <select
                  id="ce-type"
                  value={createForm.type}
                  onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value }))}
                  required
                >
                  {ELECTION_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="dash-modal__field dash-modal__field--full">
                <label htmlFor="ce-date">Election Date</label>
                <input
                  id="ce-date"
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={createForm.electionDate}
                  onChange={(e) => setCreateForm((f) => ({ ...f, electionDate: e.target.value }))}
                  required
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
                <div className="dash-modal__aspirants">
                  {(() => {
                    const totals = viewingElection.aspirantTotals;
                    const totalsList = totals?.aspirants ?? [];
                    const totalVotes = totalsList.reduce((s: number, t: { totalVotes?: number }) => s + (t.totalVotes ?? 0), 0);
                    const displayList = totalsList.length > 0
                      ? totalsList
                      : (viewingElection.aspirants ?? []).map((a) => ({
                          position: 0,
                          positionLabel: undefined as string | undefined,
                          isLeading: false,
                          aspirant: { _id: a._id, name: a.name, partyCode: a.partyCode ?? (a.party as { acronym?: string })?.acronym, party: "" },
                          totalVotes: 0,
                        }));
                    const aspirantCount = totalsList.length > 0 ? totalsList.length : (viewingElection.aspirants ?? []).length;
                    const findFullAspirant = (id: string) => (viewingElection.aspirants ?? []).find((a) => a._id === id);
                    return (
                      <>
                        <div className="dash-modal__aspirants-header">
                          <span className="dash-modal__aspirants-label">Aspirants ({aspirantCount})</span>
                          {totalsList.length > 0 && (
                            <>
                              <span className="dash-modal__aspirants-meta">
                                Total: {totalVotes.toLocaleString()} votes
                              </span>
                              {totalsList[0]?.isLeading && (
                                <span className="dash-modal__aspirants-leading">
                                  Leading: {totalsList[0]?.aspirant?.name ?? "—"} ({(totalsList[0]?.totalVotes ?? 0).toLocaleString()})
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        {totalVotes > 0 && (
                          <div className="dash-modal__aspirants-progress">
                            <div className="dash-modal__aspirants-progress-bar">
                              {displayList.map((t, i) => {
                                const pct = (t.totalVotes / totalVotes) * 100;
                                const n = displayList.length;
                                const color = n === 1
                                  ? "#059669"
                                  : i === 0
                                    ? "#059669"
                                    : i === n - 1
                                      ? "#dc2626"
                                      : ["#2563eb", "#7c3aed", "#d97706"][(i - 1) % 3];
                                return (
                                  <div
                                    key={t.aspirant?._id ?? i}
                                    className="dash-modal__aspirants-progress-segment"
                                    style={{ width: `${pct}%`, background: color }}
                                    title={`${t.aspirant?.name ?? "—"}: ${t.totalVotes.toLocaleString()} (${pct.toFixed(1)}%)`}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <div className="dash-modal__aspirants-list">
                          {displayList.map((t) => {
                            const pct = totalVotes > 0 ? (t.totalVotes / totalVotes) * 100 : 0;
                            const fullAspirant = findFullAspirant(t.aspirant?._id ?? "");
                            const aspirantForDelete = fullAspirant ?? { _id: t.aspirant?._id ?? "", name: t.aspirant?.name ?? "—" } as Aspirant;
                            const barColor = t.isLeading
                              ? "#059669"
                              : ["#2563eb", "#7c3aed", "#d97706", "#dc2626"][(t.position - 1) % 4] ?? "#6b7280";
                            return (
                              <div key={t.aspirant?._id ?? ""} className="dash-modal__aspirant-item">
                                <div className="dash-modal__aspirant-main">
                                  <span className="dash-modal__aspirant-name">
                                    {t.aspirant?.name ?? "—"}
                                    {t.isLeading && <span className="dash-modal__aspirant-badge">Leading</span>}
                                  </span>
                                  {t.aspirant?.partyCode && (
                                    <span className="dash-modal__aspirant-party">
                                      {(t.aspirant.partyCode ?? "").toUpperCase()}
                                    </span>
                                  )}
                                  <div className="dash-modal__aspirant-votes">
                                    <div className="dash-modal__aspirant-progress-bar">
                                      <div className="dash-modal__aspirant-progress-fill" style={{ width: `${pct}%`, background: barColor }} />
                                    </div>
                                    <span className="dash-modal__aspirant-count">
                                      {t.totalVotes.toLocaleString()} votes{t.totalVotes > 0 ? ` (${pct.toFixed(1)}%)` : ""}
                                    </span>
                                  </div>
                                </div>
                                <div className="dash-modal__aspirant-right">
                                  {t.position > 0 && (
                                    <span className="dash-modal__aspirant-position">{formatPosition(t.position, t.positionLabel)}</span>
                                  )}
                                  {canManage && viewingElection.status === "upcoming" && (
                                    <button
                                      type="button"
                                      className="dash-modal__aspirant-remove"
                                      onClick={() => handleRemoveAspirant(aspirantForDelete, viewingElection)}
                                      title="Remove aspirant"
                                    >
                                      <IconTrash />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
            <div className="dash-modal__actions">
              <button type="button" className="dash-page__btn dash-page__btn--outline" onClick={handleCloseView}>
                Close
              </button>
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
