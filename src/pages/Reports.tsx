import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import SearchableSelect from "../components/SearchableSelect";
import type { AppDispatch, RootState } from "../app/store";
import { getElectionsByOrganizationId } from "../features/elections/electionApi";
import { selectElectionsByOrganizationId } from "../features/elections/electionSelectors";
import {
  getReportsByElection,
  markReportReadApi,
  markReportUnreadApi,
  REPORT_CATEGORIES,
  REPORT_CATEGORY_LABELS,
  type ReportCategory,
} from "../features/reports/reportApi";
import { selectReportsByElection, selectReportsByElectionLoading } from "../features/reports/reportSelectors";
import { getStatesByOrganizationId } from "../features/states/stateApi";
import { selectStatesByOrganizationId } from "../features/states/stateSelectors";
import { getLGAsByState } from "../features/lgas/lgaApi";
import { selectLGAsByState } from "../features/lgas/lgaSelectors";
import { getWardsByLGA } from "../features/wards/wardApi";
import { selectWardsByLGA } from "../features/wards/wardSelectors";
import { getPollingUnitsByWard } from "../features/pollingUnits/pollingUnitApi";
import { selectPollingUnitsByWard } from "../features/pollingUnits/pollingUnitSelectors";
import { sortElectionsForSelect } from "../utils/sortElectionsForSelect";
import "./Reports.css";

/* ── Icons ────────────────────────────────────────────────────────────────── */
const IconFile = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const IconRefresh = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

/* ── Types ───────────────────────────────────────────────────────────────── */
interface ReportDoc {
  _id: string;
  category: ReportCategory;
  items: string[];
  notes?: string;
  createdAt: string;
  /** Server-computed flag: whether the requesting user has read this report */
  isRead?: boolean;
  election?: { _id?: string; name?: string; electionDate?: string };
  pollingUnit?: { _id?: string; name?: string; code?: string };
  ward?: { _id?: string; name?: string; code?: string };
  lga?: { _id?: string; name?: string };
  state?: { _id?: string; name?: string };
  reportedBy?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    role?: string;
    photo?: string;
    ward?: { _id?: string; name?: string; code?: string } | string;
    lga?:  { _id?: string; name?: string } | string;
  };
}

interface ElectionOption {
  _id: string;
  name: string;
  status?: string;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const CATEGORY_COLORS: Record<ReportCategory, { bg: string; text: string; border: string }> = {
  ELECTORAL_VIOLENCE: { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" },
  LOGISTICS:          { bg: "#fff7ed", text: "#9a3412", border: "#fed7aa" },
  MALPRACTICE:        { bg: "#fdf4ff", text: "#6b21a8", border: "#e9d5ff" },
  TECHNICAL:          { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  ADMINISTRATIVE:     { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" },
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const formatRole = (r?: string) =>
  r ? r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";

const getLocationLabel = (report: ReportDoc): string => {
  if (report.pollingUnit?.name) return `PU: ${report.pollingUnit.name}${report.pollingUnit.code ? ` (${report.pollingUnit.code})` : ""}`;
  if (report.ward?.name)        return `Ward: ${report.ward.name}`;
  if (report.lga?.name)         return `LGA: ${report.lga.name}`;
  if (report.state?.name)       return `State: ${report.state.name}`;
  return "—";
};

const getReporterName = (r?: ReportDoc["reportedBy"]) => {
  if (!r) return "Unknown";
  const name = [r.firstName, r.lastName].filter(Boolean).join(" ");
  return name || r.email || "Unknown";
};

/** Resolve lga/ward name — field may be a populated object or a bare ObjectId string */
const resolveObjName = (field?: { name?: string } | string): string | undefined => {
  if (!field) return undefined;
  if (typeof field === "object") return field.name;
  return undefined; // plain ObjectId string — no name to show
};

/** Get the best available LGA + Ward labels for a report card, falling back to the reporter's assignment */
const getCardLocation = (report: ReportDoc): string | undefined => {
  const lgaName  = report.lga?.name  ?? resolveObjName(report.reportedBy?.lga);
  const wardName = report.ward?.name ?? resolveObjName(report.reportedBy?.ward);
  const parts = [lgaName, wardName].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : undefined;
};

/* ── Component ───────────────────────────────────────────────────────────── */
export default function Reports() {
  const dispatch = useDispatch<AppDispatch>();

  const organizationId = useSelector(
    (state: RootState) =>
      state.auth.user?.organization?._id ?? state.auth.user?.organization?.id ?? ""
  );

  /* Elections list */
  const electionsRaw = useSelector(
    selectElectionsByOrganizationId(organizationId, { includeResults: false })
  ) as ElectionOption[] | undefined;
  const elections: ElectionOption[] = Array.isArray(electionsRaw) ? electionsRaw : [];

  /* Active election filter */
  const [selectedElectionId, setSelectedElectionId] = useState<string>("");

  /* Category filter */
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | "">("");

  /* Location filters */
  const [selectedStateId,       setSelectedStateId]       = useState<string>("");
  const [selectedLgaId,         setSelectedLgaId]         = useState<string>("");
  const [selectedWardId,        setSelectedWardId]        = useState<string>("");
  const [selectedPollingUnitId, setSelectedPollingUnitId] = useState<string>("");

  /* Search */
  const [search, setSearch] = useState("");

  /* Detail modal */
  const [detailReport, setDetailReport] = useState<ReportDoc | null>(null);

  /* Read / unread — server-driven: isRead field lives on each ReportDoc */

  /* Location data from Redux — declared FIRST so effects below can reference them.
     Selectors are memoized with useMemo so useSelector receives a stable function
     reference, preventing the "selector returned a different result" warning. */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const EMPTY = useMemo(() => [] as never[], []);

  const selectOrgStates    = useMemo(() => selectStatesByOrganizationId(organizationId),          [organizationId]);
  const selectLgas         = useMemo(() => selectLGAsByState(selectedStateId),                    [selectedStateId]);
  const selectWards        = useMemo(() => selectWardsByLGA(selectedLgaId),                       [selectedLgaId]);
  const selectPollingUnits = useMemo(() => selectPollingUnitsByWard(organizationId, selectedWardId), [organizationId, selectedWardId]);

  const orgStates     = (useSelector(selectOrgStates)    ?? EMPTY) as { _id: string; name: string }[];
  const lgasByState   = (useSelector(selectLgas)         ?? EMPTY) as { _id: string; lga_name?: string; name?: string }[];
  const wardsByLga    = (useSelector(selectWards)        ?? EMPTY) as { _id: string; name: string; code?: string }[];
  const pollingByWard =  useSelector(selectPollingUnits)           as { _id: string; name: string; code?: string }[];

  /* On mount — load elections + org states */
  useEffect(() => {
    if (organizationId) {
      dispatch(getElectionsByOrganizationId({ organizationId, query: { includeResults: false } }));
      dispatch(getStatesByOrganizationId(organizationId));
    }
  }, [dispatch, organizationId]);

  /* Auto-select first state once org states load */
  useEffect(() => {
    if (orgStates.length > 0 && !selectedStateId) {
      const first = orgStates[0];
      setSelectedStateId(first._id);
      dispatch(getLGAsByState(first._id));
    }
  }, [orgStates.length]);

  /* When state changes — load its LGAs */
  useEffect(() => {
    if (selectedStateId) {
      dispatch(getLGAsByState(selectedStateId));
    }
  }, [dispatch, selectedStateId]);

  /* When LGA changes — load its wards */
  useEffect(() => {
    if (selectedLgaId) {
      dispatch(getWardsByLGA(selectedLgaId));
    }
  }, [dispatch, selectedLgaId]);

  /* When ward changes — load its polling units */
  useEffect(() => {
    if (organizationId && selectedWardId) {
      dispatch(getPollingUnitsByWard({ organizationId, wardId: selectedWardId }));
    }
  }, [dispatch, organizationId, selectedWardId]);

  /* Auto-select first election once loaded */
  useEffect(() => {
    if (elections.length > 0 && !selectedElectionId) {
      setSelectedElectionId(elections[0]._id);
    }
  }, [elections.length]);

  /* Build the location params object passed to getReportsByElection */
  const locationParams = useMemo(() => {
    if (selectedPollingUnitId) return { pollingUnitId: selectedPollingUnitId };
    if (selectedWardId)        return { wardId:        selectedWardId        };
    if (selectedLgaId)         return { lgaId:         selectedLgaId        };
    if (selectedStateId)       return { stateId:       selectedStateId       };
    return {};
  }, [selectedPollingUnitId, selectedWardId, selectedLgaId, selectedStateId]);

  /* Build memoised report selector params — same object shape used for both fetch + select */
  const reportSelectorParams = useMemo(() => ({
    electionId: selectedElectionId,
    ...locationParams,
    ...(selectedCategory ? { category: selectedCategory } : {}),
  }), [selectedElectionId, locationParams, selectedCategory]);

  const selectReports        = useMemo(() => selectReportsByElection(reportSelectorParams),        [reportSelectorParams]);
  const selectReportsLoading = useMemo(() => selectReportsByElectionLoading(reportSelectorParams), [reportSelectorParams]);

  const rawReports = useSelector(selectReports)        as ReportDoc[] | undefined;
  const loading    = useSelector(selectReportsLoading) as boolean;

  /* Fetch reports whenever election or filters change */
  useEffect(() => {
    if (organizationId && selectedElectionId) {
      dispatch(getReportsByElection(reportSelectorParams));
    }
  }, [dispatch, organizationId, reportSelectorParams]);

  /* Client-side search filter */
  const reports = useMemo(() => {
    const list = Array.isArray(rawReports) ? rawReports : [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((r) =>
      r.items.some((i) => i.toLowerCase().includes(q)) ||
      getLocationLabel(r).toLowerCase().includes(q) ||
      getReporterName(r.reportedBy).toLowerCase().includes(q) ||
      (r.notes ?? "").toLowerCase().includes(q) ||
      REPORT_CATEGORY_LABELS[r.category]?.toLowerCase().includes(q)
    );
  }, [rawReports, search]);

  /* Summary counts by category */
  const categoryCounts = useMemo(() => {
    const all = Array.isArray(rawReports) ? rawReports : [];
    return REPORT_CATEGORIES.reduce((acc, cat) => {
      acc[cat] = all.filter((r) => r.category === cat).length;
      return acc;
    }, {} as Record<ReportCategory, number>);
  }, [rawReports]);

  const totalReports = Array.isArray(rawReports) ? rawReports.length : 0;

  const handleRefresh = () => {
    if (organizationId && selectedElectionId) {
      dispatch(
        getReportsByElection({
          electionId: selectedElectionId,
          ...locationParams,
          ...(selectedCategory ? { category: selectedCategory } : {}),
        })
      );
    }
  };

  const handleStateChange = (stateId: string) => {
    setSelectedStateId(stateId);
    setSelectedLgaId("");
    setSelectedWardId("");
    setSelectedPollingUnitId("");
    if (stateId) dispatch(getLGAsByState(stateId));
  };

  const handleLgaChange = (lgaId: string) => {
    setSelectedLgaId(lgaId);
    setSelectedWardId("");
    setSelectedPollingUnitId("");
    if (lgaId) dispatch(getWardsByLGA(lgaId));
  };

  const handleWardChange = (wardId: string) => {
    setSelectedWardId(wardId);
    setSelectedPollingUnitId("");
    if (wardId && organizationId) dispatch(getPollingUnitsByWard({ organizationId, wardId }));
  };

  const handleClearLocation = () => {
    setSelectedStateId("");
    setSelectedLgaId("");
    setSelectedWardId("");
    setSelectedPollingUnitId("");
  };

  return (
    <div className="rpt-page">
      {/* ── Top bar ── */}
      <div className="rpt-page__top">
        <div>
          <p className="rpt-page__breadcrumb">EMS / Reports</p>
          <h1 className="rpt-page__title">Incident Reports</h1>
        </div>
        <div className="rpt-page__actions">
          <button
            type="button"
            className="rpt-btn rpt-btn--outline"
            onClick={handleRefresh}
            disabled={loading || !selectedElectionId}
            title="Refresh reports"
          >
            <IconRefresh />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Filters card — same grid layout as create-user modal ── */}
      <div className="rpt-filters-card">

        {/* Row 1: Election · Search · Category  (3-col grid) */}
        <div className="rpt-filters-grid rpt-filters-grid--3">
          <div className="dash-modal__location-cell">
            <SearchableSelect
              id="rpt-election-select"
              label="Election"
              value={selectedElectionId}
              onChange={(val) => { setSelectedElectionId(val); setSelectedCategory(""); }}
              options={[
                { value: "", label: "— Select election —" },
                ...sortElectionsForSelect(elections).map((el) => ({ value: el._id, label: el.name })),
              ]}
              placeholder="Search or select election…"
            />
          </div>

          <div className="dash-modal__location-cell">
            <label className="rpt-search-label">Search</label>
            <div className="rpt-field__search">
              <IconSearch />
              <input
                type="text"
                className="rpt-field__search-input"
                placeholder="Location, reporter, item…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="dash-modal__location-cell">
            <SearchableSelect
              id="rpt-cat-select"
              label="Category"
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val as ReportCategory | "")}
              options={[
                { value: "", label: "All categories" },
                ...REPORT_CATEGORIES.map((cat) => ({ value: cat, label: REPORT_CATEGORY_LABELS[cat] })),
              ]}
              placeholder="Search or select category…"
            />
          </div>
        </div>

        {/* Row 2: Location filters  (4-col grid, only when election selected) */}
        {selectedElectionId && (
          <>
            <div className="rpt-filters-card__hr" />

            <div className="rpt-filters-grid rpt-filters-grid--4">
              <div className="dash-modal__location-cell">
                <SearchableSelect
                  id="rpt-state-select"
                  label="State"
                  value={selectedStateId}
                  onChange={handleStateChange}
                  options={[
                    { value: "", label: orgStates.length === 0 ? "Loading…" : "All States" },
                    ...orgStates.map((s) => ({ value: s._id, label: s.name })),
                  ]}
                  placeholder="Search or select state…"
                />
              </div>

              <div className="dash-modal__location-cell">
                <SearchableSelect
                  id="rpt-lga-select"
                  label="LGA"
                  value={selectedLgaId}
                  onChange={handleLgaChange}
                  disabled={!selectedStateId}
                  options={[
                    { value: "", label: !selectedStateId ? "Select state first" : "All LGAs" },
                    ...lgasByState.map((l) => ({ value: l._id, label: l.lga_name ?? l.name ?? l._id })),
                  ]}
                  placeholder="Search or select LGA…"
                />
              </div>

              <div className="dash-modal__location-cell">
                <SearchableSelect
                  id="rpt-ward-select"
                  label="Ward"
                  value={selectedWardId}
                  onChange={handleWardChange}
                  disabled={!selectedLgaId}
                  options={[
                    { value: "", label: !selectedLgaId ? "Select LGA first" : wardsByLga.length === 0 ? "Loading…" : "All Wards" },
                    ...wardsByLga.map((w) => ({ value: w._id, label: w.name + (w.code ? ` (${w.code})` : "") })),
                  ]}
                  placeholder="Search or select ward…"
                />
              </div>

              <div className="dash-modal__location-cell">
                <SearchableSelect
                  id="rpt-pu-select"
                  label="Polling Unit"
                  value={selectedPollingUnitId}
                  onChange={setSelectedPollingUnitId}
                  disabled={!selectedWardId}
                  options={[
                    { value: "", label: !selectedWardId ? "Select ward first" : pollingByWard.length === 0 ? "Loading…" : "All Polling Units" },
                    ...pollingByWard.map((p) => ({ value: p._id, label: p.name + (p.code ? ` (${p.code})` : "") })),
                  ]}
                  placeholder="Search or select polling unit…"
                />
              </div>
            </div>

            {/* Clear link — only when any location is active */}
            {(selectedStateId || selectedLgaId || selectedWardId || selectedPollingUnitId) && (
              <div className="rpt-filters-clear-row">
                <button
                  type="button"
                  className="rpt-filters-row__clear"
                  onClick={handleClearLocation}
                >
                  ✕ Clear location filters
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Summary category chips ── */}
      {selectedElectionId && !loading && totalReports > 0 && (
        <div className="rpt-summary">
          <button
            type="button"
            className={`rpt-summary__chip${selectedCategory === "" ? " rpt-summary__chip--active" : ""}`}
            onClick={() => setSelectedCategory("")}
          >
            All
            <span className="rpt-summary__chip-count">{totalReports}</span>
          </button>
          {REPORT_CATEGORIES.map((cat) => {
            const count = categoryCounts[cat];
            if (count === 0) return null;
            const colors = CATEGORY_COLORS[cat];
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                className={`rpt-summary__chip${isActive ? " rpt-summary__chip--active" : ""}`}
                style={isActive ? { background: colors.bg, color: colors.text, borderColor: colors.border } : {}}
                onClick={() => setSelectedCategory(isActive ? "" : cat)}
              >
                {REPORT_CATEGORY_LABELS[cat]}
                <span className="rpt-summary__chip-count">{count}</span>
              </button>
            );
          })}
        </div>
      )}


      {/* ── Content area ── */}
      <div className="rpt-content">
        {/* No election selected */}
        {!selectedElectionId && (
          <div className="rpt-empty">
            <IconFile />
            <p className="rpt-empty__title">Select an election</p>
            <p className="rpt-empty__sub">Choose an election above to view its incident reports.</p>
          </div>
        )}

        {/* Loading */}
        {selectedElectionId && loading && (
          <div className="rpt-loading">
            <span className="rpt-loading__spinner" />
            <span>Loading reports…</span>
          </div>
        )}

        {/* Empty */}
        {selectedElectionId && !loading && reports.length === 0 && (
          <div className="rpt-empty">
            <IconFile />
            <p className="rpt-empty__title">No reports found</p>
            <p className="rpt-empty__sub">
              {search
                ? "No reports match your search."
                : selectedCategory
                  ? `No ${REPORT_CATEGORY_LABELS[selectedCategory as ReportCategory]} reports for this scope.`
                  : selectedPollingUnitId
                    ? "No incident reports from this polling unit yet."
                    : selectedWardId
                      ? "No incident reports from this ward yet."
                      : selectedLgaId
                        ? "No incident reports from this LGA yet."
                        : "No incident reports have been submitted for this election yet."}
            </p>
          </div>
        )}

        {/* Reports grid */}
        {selectedElectionId && !loading && reports.length > 0 && (
          <div className="rpt-grid">
            {reports.map((report) => {
              const colors = CATEGORY_COLORS[report.category] ?? CATEGORY_COLORS.ADMINISTRATIVE;
              return (
                <button
                  key={report._id}
                  type="button"
                  className={`rpt-card${report.isRead ? " rpt-card--read" : " rpt-card--unread"}`}
                  onClick={() => {
                    setDetailReport(report);
                    if (!report.isRead) dispatch(markReportReadApi(report._id));
                  }}
                >
                  {/* Category badge + read/unread label */}
                  <div className="rpt-card__top">
                    <span
                      className="rpt-card__category"
                      style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
                    >
                      {REPORT_CATEGORY_LABELS[report.category]}
                    </span>
                    <div className="rpt-card__top-right">
                      {report.isRead
                        ? <span className="rpt-card__status rpt-card__status--read">Read</span>
                        : <span className="rpt-card__status rpt-card__status--unread">Unread</span>
                      }
                      <span className="rpt-card__date">{formatDate(report.createdAt)}</span>
                    </div>
                  </div>

                  {/* Location */}
                  <p className="rpt-card__location">{getLocationLabel(report)}</p>

                  {/* Items */}
                  <div className="rpt-card__items">
                    {report.items.slice(0, 3).map((item) => (
                      <span key={item} className="rpt-card__item-tag">{item}</span>
                    ))}
                    {report.items.length > 3 && (
                      <span className="rpt-card__item-more">+{report.items.length - 3} more</span>
                    )}
                  </div>

                  {/* Notes preview */}
                  {report.notes && (
                    <p className="rpt-card__notes">{report.notes}</p>
                  )}

                  {/* Reporter */}
                  <div className="rpt-card__footer">
                    <div className="rpt-card__reporter">
                      {report.reportedBy?.photo ? (
                        <img src={report.reportedBy.photo} alt="" className="rpt-card__reporter-img" />
                      ) : (
                        <span className="rpt-card__reporter-initials">
                          {(report.reportedBy?.firstName?.[0] ?? report.reportedBy?.email?.[0] ?? "?").toUpperCase()}
                        </span>
                      )}
                      <div className="rpt-card__reporter-info">
                        <span className="rpt-card__reporter-name">{getReporterName(report.reportedBy)}</span>
                        <span className="rpt-card__reporter-role">{formatRole(report.reportedBy?.role)}</span>
                        {report.reportedBy?.phoneNumber && (
                          <span className="rpt-card__reporter-phone">{report.reportedBy.phoneNumber}</span>
                        )}
                        {getCardLocation(report) && (
                          <span className="rpt-card__reporter-location">
                            {getCardLocation(report)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="rpt-card__view-link">View →</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {detailReport && (
        <div
          className="rpt-modal-backdrop"
          onClick={() => setDetailReport(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="rpt-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className="rpt-modal__header">
              <div className="rpt-modal__header-left">
                {(() => {
                  const colors = CATEGORY_COLORS[detailReport.category] ?? CATEGORY_COLORS.ADMINISTRATIVE;
                  return (
                    <span
                      className="rpt-modal__category"
                      style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
                    >
                      {REPORT_CATEGORY_LABELS[detailReport.category]}
                    </span>
                  );
                })()}
                <div>
                  <h2 className="rpt-modal__title">
                    {getLocationLabel(detailReport)}
                  </h2>
                  <p className="rpt-modal__meta">{formatDate(detailReport.createdAt)}</p>
                </div>
              </div>
              <div className="rpt-modal__header-actions">
                {detailReport.isRead ? (
                  <button
                    type="button"
                    className="rpt-modal__read-btn rpt-modal__read-btn--unread"
                    onClick={() => dispatch(markReportUnreadApi(detailReport._id))}
                    title="Mark as unread"
                  >
                    ● Mark Unread
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rpt-modal__read-btn rpt-modal__read-btn--read"
                    onClick={() => dispatch(markReportReadApi(detailReport._id))}
                    title="Mark as read"
                  >
                    ✓ Mark as Read
                  </button>
                )}
                <button
                  type="button"
                  className="rpt-modal__close"
                  onClick={() => setDetailReport(null)}
                  aria-label="Close"
                >✕</button>
              </div>
            </div>

            {/* Modal body */}
            <div className="rpt-modal__body">
              {/* Reporter */}
              <div className="rpt-modal__section">
                <h3 className="rpt-modal__section-title">Reported By</h3>
                <div className="rpt-modal__reporter">
                  {detailReport.reportedBy?.photo ? (
                    <img src={detailReport.reportedBy.photo} alt="" className="rpt-modal__reporter-img" />
                  ) : (
                    <span className="rpt-modal__reporter-initials">
                      {(detailReport.reportedBy?.firstName?.[0] ?? detailReport.reportedBy?.email?.[0] ?? "?").toUpperCase()}
                    </span>
                  )}
                  <div>
                    <p className="rpt-modal__reporter-name">{getReporterName(detailReport.reportedBy)}</p>
                    <p className="rpt-modal__reporter-role">{formatRole(detailReport.reportedBy?.role)}</p>
                    {detailReport.reportedBy?.email && (
                      <p className="rpt-modal__reporter-email">{detailReport.reportedBy.email}</p>
                    )}
                    {detailReport.reportedBy?.phoneNumber && (
                      <p className="rpt-modal__reporter-phone">{detailReport.reportedBy.phoneNumber}</p>
                    )}
                    {(() => {
                      const loc = getCardLocation(detailReport);
                      return loc ? <p className="rpt-modal__reporter-location">{loc}</p> : null;
                    })()}
                  </div>
                </div>
              </div>

              {/* Location breakdown */}
              <div className="rpt-modal__section">
                <h3 className="rpt-modal__section-title">Location</h3>
                <div className="rpt-modal__location-grid">
                  {detailReport.state?.name && (
                    <div className="rpt-modal__location-item">
                      <span className="rpt-modal__location-label">State</span>
                      <span className="rpt-modal__location-value">{detailReport.state.name}</span>
                    </div>
                  )}
                  {detailReport.lga?.name && (
                    <div className="rpt-modal__location-item">
                      <span className="rpt-modal__location-label">LGA</span>
                      <span className="rpt-modal__location-value">{detailReport.lga.name}</span>
                    </div>
                  )}
                  {detailReport.ward?.name && (
                    <div className="rpt-modal__location-item">
                      <span className="rpt-modal__location-label">Ward</span>
                      <span className="rpt-modal__location-value">{detailReport.ward.name}</span>
                    </div>
                  )}
                  {detailReport.pollingUnit?.name && (
                    <div className="rpt-modal__location-item">
                      <span className="rpt-modal__location-label">Polling Unit</span>
                      <span className="rpt-modal__location-value">
                        {detailReport.pollingUnit.name}
                        {detailReport.pollingUnit.code && ` (${detailReport.pollingUnit.code})`}
                      </span>
                    </div>
                  )}
                  {detailReport.election?.name && (
                    <div className="rpt-modal__location-item">
                      <span className="rpt-modal__location-label">Election</span>
                      <span className="rpt-modal__location-value">{detailReport.election.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Incident items */}
              <div className="rpt-modal__section">
                <h3 className="rpt-modal__section-title">Incident Items</h3>
                <div className="rpt-modal__items">
                  {detailReport.items.map((item) => (
                    <span key={item} className="rpt-modal__item-tag">{item}</span>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {detailReport.notes && (
                <div className="rpt-modal__section">
                  <h3 className="rpt-modal__section-title">Additional Notes</h3>
                  <p className="rpt-modal__notes">{detailReport.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
