import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../app/store";
import {
  getPresenceReport,
  listPresence,
  selectPresenceReport,
  selectPresenceReportLoading,
} from "../features/presence";
import {
  getElectionsByOrganizationId,
  selectElectionsByOrganizationId,
  selectElectionsByOrganizationIdLoading,
} from "../features/elections";
import { getAllAccreditationByOrganization } from "../features/pollingUnits";
import {
  getStatesByOrganizationId,
  selectStatesByOrganizationId,
} from "../features/states";
import {
  getLGAsByState,
  selectLGAsByState,
} from "../features/lgas";
import {
  getWardsByLGA,
  selectWardsByLGA,
} from "../features/wards";
import SearchableSelect from "../components/SearchableSelect";
import { usePresenceSocket } from "../hooks/usePresenceSocket";
import "./Dashboard.css";

const IconChevronCard = () => (
  <svg className="dash-card__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6" />
  </svg>
);
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);
const formatDateTime = (d?: string) => {
  if (!d) return "";
  try {
    const date = new Date(d);
    const day = date.getDate();
    const suffix =
      day % 10 === 1 && day !== 11 ? "st" :
      day % 10 === 2 && day !== 12 ? "nd" :
      day % 10 === 3 && day !== 13 ? "rd" : "th";
    const month = date.toLocaleString("en-GB", { month: "long" });
    const year = date.getFullYear();
    const time = date.toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true });
    return `${day}${suffix} ${month}, ${year} ${time}`;
  } catch {
    return "";
  }
};

type ReportRow = {
  pollingUnitId: string;
  pollingUnitName: string;
  pollingUnitCode?: string;
  wardName: string;
  lgaName: string;
  poAgentName: string;
  poPhoneNumber: string;
  presence: string;
  presenceCheckedInAt?: string | null;
  accreditedCount?: number | null;
  votingStarted: string;
  votingEnded: string;
  accreditationStarted: boolean;
  accreditationEnded: boolean;
  votingStartedAt?: string;
  votingEndedAt?: string;
  accreditationStartedAt?: string;
  accreditationEndedAt?: string;
};

export default function Presence() {
  const dispatch = useDispatch<AppDispatch>();
  const organizationId = useSelector(
    (state: RootState) => state.auth.user?.organization?._id ?? state.auth.user?.organization?.id
  );
  const organizationName = useSelector((state: RootState) => state.auth.user?.organization?.name);
  const stateName = useSelector((state: RootState) => state.auth.user?.state?.name);

  const [electionId, setElectionId] = useState("");
  const [search, setSearch] = useState("");
  const [lgaFilter, setLgaFilter] = useState("");
  const [wardFilter, setWardFilter] = useState("");
  const [viewingRow, setViewingRow] = useState<ReportRow | null>(null);

  const elections = useSelector(
    (state: RootState) => selectElectionsByOrganizationId(organizationId ?? "")(state) as Array<{ _id: string; name: string; electionDate?: string }> | undefined
  ) ?? [];
  const electionsLoading = useSelector(
    (state: RootState) => selectElectionsByOrganizationIdLoading(organizationId ?? "")(state)
  );

  const reportQuery = { lgaId: lgaFilter || undefined, wardId: wardFilter || undefined };
  const reportParams = {
    organizationId: organizationId ?? "",
    electionId,
    query: reportQuery,
  };
  const reportData = useSelector((state: RootState) =>
    electionId ? selectPresenceReport(reportParams)(state) : undefined
  );
  const reportLoading = useSelector((state: RootState) =>
    electionId ? selectPresenceReportLoading(reportParams)(state) : false
  );

  const stateId = useSelector((state: RootState) => {
    const u = state.auth.user as { state?: { _id?: string; id?: string } } | null;
    const sid = u?.state?._id ?? u?.state?.id;
    if (sid) return String(sid);
    const orgStates = selectStatesByOrganizationId(organizationId ?? "")(state) as Array<{ _id?: string; id?: string }> | undefined;
    const first = orgStates?.[0];
    return first ? String(first._id ?? first.id) : "";
  });
  const lgas = useSelector(selectLGAsByState(stateId)) as Array<{ _id?: string; name?: string; code?: string }> | undefined;
  const wards = useSelector(selectWardsByLGA(lgaFilter)) as Array<{ _id?: string; name?: string; code?: string }> | undefined;

  const lgaOptions = [
    { value: "", label: "All LGAs" },
    ...(lgas ?? []).map((l) => ({ value: String(l._id ?? (l as { id?: string }).id ?? ""), label: l.name ?? l.code ?? "—" })),
  ];
  const wardOptions = [
    { value: "", label: "All Wards" },
    ...(wards ?? []).map((w) => ({ value: String(w._id ?? (w as { id?: string }).id ?? ""), label: w.name ?? w.code ?? "—" })),
  ];

  useEffect(() => {
    if (organizationId) {
      dispatch(getElectionsByOrganizationId({ organizationId }));
      dispatch(getStatesByOrganizationId(organizationId));
    }
  }, [dispatch, organizationId]);

  useEffect(() => {
    if (stateId && stateId.length > 0) {
      dispatch(getLGAsByState(stateId));
    }
  }, [dispatch, stateId]);

  useEffect(() => {
    if (lgaFilter) {
      dispatch(getWardsByLGA(lgaFilter));
    }
  }, [dispatch, lgaFilter]);

  useEffect(() => {
    if (lgaFilter) setWardFilter("");
  }, [lgaFilter]);

  useEffect(() => {
    if (organizationId && electionId) {
      dispatch(getPresenceReport({ organizationId, electionId, query: reportQuery }));
      dispatch(getAllAccreditationByOrganization({ organizationId, electionId, query: reportQuery }));
    }
  }, [dispatch, organizationId, electionId, lgaFilter, wardFilter]);

  useEffect(() => {
    if (electionId) {
      dispatch(listPresence({ electionId }));
    }
  }, [dispatch, electionId]);

  // Refetch when tab becomes visible (e.g. user marked presence on Results, then switched back)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        if (organizationId && electionId) {
          dispatch(getPresenceReport({ organizationId, electionId, query: reportQuery }));
          dispatch(getAllAccreditationByOrganization({ organizationId, electionId, query: reportQuery }));
        }
        if (electionId) dispatch(listPresence({ electionId }));
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [dispatch, organizationId, electionId, lgaFilter, wardFilter]);

  // Real-time presence: refetch when another user marks presence
  usePresenceSocket(electionId || undefined, () => {
        if (organizationId && electionId) {
          dispatch(getPresenceReport({ organizationId, electionId, query: reportQuery }));
          dispatch(getAllAccreditationByOrganization({ organizationId, electionId, query: reportQuery }));
        }
    if (electionId) dispatch(listPresence({ electionId }));
  });

  const electionOptions = [
    { value: "", label: "Select election" },
    ...(electionsLoading ? [] : elections.map((e) => ({
      value: e._id,
      label: e.electionDate
        ? `${e.name} (${new Date(e.electionDate).getFullYear()})`
        : (e.name ?? ""),
    }))),
  ];
  const reportRows = (reportData?.rows ?? []).filter((r) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (r.pollingUnitName ?? "").toLowerCase().includes(q) ||
      (r.pollingUnitCode ?? "").toLowerCase().includes(q) ||
      (r.poAgentName ?? "").toLowerCase().includes(q) ||
      (r.poPhoneNumber ?? "").toLowerCase().includes(q) ||
      (r.wardName ?? "").toLowerCase().includes(q) ||
      (r.lgaName ?? "").toLowerCase().includes(q)
    );
  });

  // Derive card counts from filtered reportRows so they update with search
  const filteredAgentsMarkedPresence = reportRows.filter((r) => r.presence === "Yes").length;
  const filteredNotPresent = reportRows.filter((r) => r.presence === "No").length;
  const filteredVotingStarted = reportRows.filter((r) => r.votingStarted === "Yes").length;
  const filteredVotingEnded = reportRows.filter((r) => r.votingEnded === "Yes").length;
  const filteredAccreditationStarted = reportRows.filter((r) => r.accreditationStarted).length;
  const filteredAccreditationEnded = reportRows.filter((r) => r.accreditationEnded).length;
  const filteredTotalAccredited = reportRows.reduce((s, r) => s + (r.accreditedCount ?? 0), 0);

  return (
    <div className="dash-page">
      <div className="dash-page__top">
        <div>
          <p className="dash-page__breadcrumb">
            EMS
            {organizationName ? ` / ${organizationName}` : ""}
            {stateName ? ` / ${stateName}` : ""}
            {" / Presence"}
          </p>
          <h1 className="dash-page__title">Presence</h1>
        </div>
      </div>

      <div className="dash-table-section__head" style={{ marginBottom: "1rem", alignItems: "flex-end" }}>
        <div style={{ minWidth: "260px" }}>
          <SearchableSelect
            id="presence-election"
            label="Election"
            value={electionId}
            onChange={setElectionId}
            options={electionOptions}
            placeholder="Search or select election..."
            disabled={electionsLoading}
          />
        </div>
        <div className="dash-table-section__search">
          <IconSearch />
          <input
            type="text"
            placeholder="Search polling units, PO agent, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className="dash-page__btn dash-page__btn--outline"
            style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", flexShrink: 0 }}
            onClick={() => setSearch("")}
            disabled={!search.trim()}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="dash-cards">
       
        <div className="dash-card">
          <h3 className="dash-card__title">Total Accredited Voters</h3>
          <p className="dash-card__value">
            {!electionId ? "0" : reportLoading ? "—" : String(filteredTotalAccredited.toLocaleString())}
          </p>
          <p className="dash-card__meta">Accredited voters for this election</p>
          <div className="dash-card__row">
            <span />
            <IconChevronCard />
          </div>
        </div>
        <div className="dash-card">
          <h3 className="dash-card__title">Agents Marked Presence</h3>
          <p className="dash-card__value">
            {!electionId ? "0" : reportLoading ? "—" : String(filteredAgentsMarkedPresence.toLocaleString())}
          </p>
          <p className="dash-card__meta">Agents who checked in</p>
          <div className="dash-card__row">
            <span />
            <IconChevronCard />
          </div>
        </div>
        <div className="dash-card">
          <h3 className="dash-card__title">Not Present</h3>
          <p className="dash-card__value">
            {!electionId ? "0" : reportLoading ? "—" : String(filteredNotPresent.toLocaleString())}
          </p>
          <p className="dash-card__meta">Polling units without agent</p>
          <div className="dash-card__row">
            <span />
            <IconChevronCard />
          </div>
        </div>
        <div className="dash-card">
          <h3 className="dash-card__title">Voting Started</h3>
          <p className="dash-card__value">
            {!electionId ? "0" : reportLoading ? "—" : String(filteredVotingStarted.toLocaleString())}
          </p>
          <p className="dash-card__meta">Polling units where voting started</p>
          <div className="dash-card__row">
            <span
              className="dash-card__meta--muted"
              style={{ fontSize: "0.85rem", fontWeight: 700 }}
            >
              {!electionId || reportLoading
                ? ""
                : `${(reportRows.length - filteredVotingStarted).toLocaleString()} not yet started`}
            </span>
            <IconChevronCard />
          </div>
        </div>
        <div className="dash-card">
          <h3 className="dash-card__title">Voting Ended</h3>
          <p className="dash-card__value">
            {!electionId ? "0" : reportLoading ? "—" : String(filteredVotingEnded.toLocaleString())}
          </p>
          <p className="dash-card__meta">Polling units where voting ended</p>
          <div className="dash-card__row">
            <span
              className="dash-card__meta--muted"
              style={{ fontSize: "0.85rem", fontWeight: 700 }}
            >
              {!electionId || reportLoading
                ? ""
                : `${(reportRows.length - filteredVotingEnded).toLocaleString()} not yet ended`}
            </span>
            <IconChevronCard />
          </div>
        </div>
        <div className="dash-card">
          <h3 className="dash-card__title">Accreditation Started</h3>
          <p className="dash-card__value">
            {!electionId ? "0" : reportLoading ? "—" : String(filteredAccreditationStarted.toLocaleString())}
          </p>
          <p className="dash-card__meta">Polling units where accreditation started</p>
          <div className="dash-card__row">
            <span
              className="dash-card__meta--muted"
              style={{ fontSize: "0.85rem", fontWeight: 700 }}
            >
              {!electionId || reportLoading
                ? ""
                : `${(reportRows.length - filteredAccreditationStarted).toLocaleString()} not yet started`}
            </span>
            <IconChevronCard />
          </div>
        </div>
        <div className="dash-card">
          <h3 className="dash-card__title">Accreditation Ended</h3>
          <p className="dash-card__value">
            {!electionId ? "0" : reportLoading ? "—" : String(filteredAccreditationEnded.toLocaleString())}
          </p>
          <p className="dash-card__meta">Polling units where accreditation ended</p>
          <div className="dash-card__row">
            <span
              className="dash-card__meta--muted"
              style={{ fontSize: "0.85rem", fontWeight: 700 }}
            >
              {!electionId || reportLoading
                ? ""
                : `${(reportRows.length - filteredAccreditationEnded).toLocaleString()} not yet ended`}
            </span>
            <IconChevronCard />
          </div>
        </div>
      </div>

      <section className="dash-table-section" id="presence-table">
        <div className="dash-table-section__head" style={{ flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
          <h2 className="dash-table-section__title">Presence Report ({reportRows.length})</h2>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ minWidth: "200px" }}>
              <SearchableSelect
                id="presence-lga-filter"
                label="Filter by LGA"
                value={lgaFilter}
                onChange={setLgaFilter}
                options={lgaOptions}
                placeholder="All LGAs"
                disabled={!stateId}
              />
            </div>
            <div style={{ minWidth: "200px" }}>
              <SearchableSelect
                id="presence-ward-filter"
                label="Filter by Ward"
                value={wardFilter}
                onChange={setWardFilter}
                options={wardOptions}
                placeholder="All Wards"
                disabled={!lgaFilter}
              />
            </div>
          </div>
        </div>
        <div className="dash-table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Polling Unit</th>
                <th>Ward</th>
                <th>LGA</th>
              
                <th>Accreditation Started</th>
                <th>Voting Started</th>
               
                <th className="dash-table__actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reportLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>
                    Loading...
                  </td>
                </tr>
              ) : !electionId ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>
                    Select an election to view presence report
                  </td>
                </tr>
              ) : reportRows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>
                    No polling units found
                  </td>
                </tr>
              ) : (
                reportRows.map((r) => (
                  <tr key={r.pollingUnitId}>
                    <td>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            flexShrink: 0,
                            marginTop: "0.4rem",
                            backgroundColor: r.presence === "Yes" ? "#22c55e" : "#ef4444",
                          }}
                          title={r.presence === "Yes" ? "Present" : "Not present"}
                        />
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                          <strong>{r.pollingUnitName}</strong>
                          {r.presence === "Yes" && "presenceCheckedInAt" in r && r.presenceCheckedInAt && (
                            <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                              {formatDateTime(r.presenceCheckedInAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{r.wardName}</td>
                    <td>{r.lgaName}</td>
                  
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                        <span>{r.accreditationStarted ? "Yes" : "No"}</span>
                        {r.accreditationStartedAt && (
                          <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                            {formatDateTime(r.accreditationStartedAt)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                        <span>{r.votingStarted}</span>
                        {r.votingStartedAt && (
                          <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                            {formatDateTime(r.votingStartedAt)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="dash-table__actions-col">
                      <button
                        type="button"
                        className="dash-page__btn dash-page__btn--outline"
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                        onClick={() => setViewingRow(r)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* View modal */}
      {viewingRow && (
        <div
          className="dash-modal-backdrop"
          onClick={() => setViewingRow(null)}
          onKeyDown={(e) => e.key === "Escape" && setViewingRow(null)}
          role="button"
          tabIndex={0}
        >
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="dash-modal__title">Presence Details</h3>
            <p className="dash-modal__subtitle">
              {viewingRow.pollingUnitName}
              {viewingRow.pollingUnitCode && ` (${viewingRow.pollingUnitCode})`}
            </p>
            <div className="dash-modal__view-grid">
              <div className="dash-modal__view-row">
                <span className="dash-modal__view-label">Polling Unit</span>
                <span className="dash-modal__view-value">{viewingRow.pollingUnitName ?? "—"}</span>
              </div>
              <div className="dash-modal__view-row">
                <span className="dash-modal__view-label">Ward</span>
                <span className="dash-modal__view-value">{viewingRow.wardName ?? "—"}</span>
              </div>
              <div className="dash-modal__view-row">
                <span className="dash-modal__view-label">LGA</span>
                <span className="dash-modal__view-value">{viewingRow.lgaName ?? "—"}</span>
              </div>
              <div className="dash-modal__view-row">
                <span className="dash-modal__view-label">PO Agent Name</span>
                <span className="dash-modal__view-value">{viewingRow.poAgentName?.trim() || "—"}</span>
              </div>
              <div className="dash-modal__view-row">
                <span className="dash-modal__view-label">Phone Number</span>
                <span className="dash-modal__view-value">{viewingRow.poPhoneNumber?.trim() || "—"}</span>
              </div>
              <div className="dash-modal__view-row">
                <span className="dash-modal__view-label">Presence</span>
                <span className="dash-modal__view-value">
                  {viewingRow.presence ?? "—"}
                  {viewingRow.presenceCheckedInAt && (
                    <span style={{ display: "block", fontSize: "0.85em", color: "#6b7280", marginTop: "0.25rem" }}>
                      {formatDateTime(viewingRow.presenceCheckedInAt)}
                    </span>
                  )}
                </span>
              </div>
              <div className="dash-modal__view-row">
                <span className="dash-modal__view-label">Accredited Voters</span>
                <span className="dash-modal__view-value">
                  {viewingRow.accreditedCount != null ? viewingRow.accreditedCount.toLocaleString() : "—"}
                </span>
              </div>
              <div className="dash-modal__view-row">
                <span className="dash-modal__view-label">Voting Started</span>
                <span className="dash-modal__view-value">
                  {viewingRow.votingStarted ?? "—"}
                  {viewingRow.votingStartedAt && (
                    <span style={{ display: "block", fontSize: "0.85em", color: "#6b7280", marginTop: "0.25rem" }}>
                      {formatDateTime(viewingRow.votingStartedAt)}
                    </span>
                  )}
                </span>
              </div>
              <div className="dash-modal__view-row">
                <span className="dash-modal__view-label">Voting Ended</span>
                <span className="dash-modal__view-value">
                  {viewingRow.votingEnded ?? "—"}
                  {viewingRow.votingEndedAt && (
                    <span style={{ display: "block", fontSize: "0.85em", color: "#6b7280", marginTop: "0.25rem" }}>
                      {formatDateTime(viewingRow.votingEndedAt)}
                    </span>
                  )}
                </span>
              </div>
              <div className="dash-modal__view-row">
                <span className="dash-modal__view-label">Acc Started</span>
                <span className="dash-modal__view-value">
                  {viewingRow.accreditationStarted ? "Yes" : "No"}
                  {viewingRow.accreditationStartedAt && (
                    <span style={{ display: "block", fontSize: "0.85em", color: "#6b7280", marginTop: "0.25rem" }}>
                      {formatDateTime(viewingRow.accreditationStartedAt)}
                    </span>
                  )}
                </span>
              </div>
              <div className="dash-modal__view-row">
                <span className="dash-modal__view-label">Accreditation Ended</span>
                <span className="dash-modal__view-value">
                  {viewingRow.accreditationEnded ? "Yes" : "No"}
                  {viewingRow.accreditationEndedAt && (
                    <span style={{ display: "block", fontSize: "0.85em", color: "#6b7280", marginTop: "0.25rem" }}>
                      {formatDateTime(viewingRow.accreditationEndedAt)}
                    </span>
                  )}
                </span>
              </div>
            </div>
            <div className="dash-modal__actions">
              <button
                type="button"
                className="dash-page__btn dash-page__btn--solid"
                onClick={() => setViewingRow(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
