import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../app/store";
import {
  getElectionsByOrganizationId,
} from "../features/elections/electionApi";
import {
  selectElectionsByOrganizationId,
  selectElectionsByOrganizationIdLoading,
} from "../features/elections/electionSelectors";
import {
  getAspirantTotalsByElection,
  getResultsByElection,
  getParties,
} from "../features/results/resultsApi";
import {
  selectAspirantTotalsByElection,
  selectAspirantTotalsByElectionLoading,
  selectParties,
} from "../features/results/resultsSelectors";
import { selectLoadingByKey } from "../features/results/resultsSelectors";
import { getLGAsByState } from "../features/lgas/lgaApi";
import { selectLGAsByState } from "../features/lgas/lgaSelectors";
import { getWardsByLGA } from "../features/wards/wardApi";
import { selectWardsByLGA } from "../features/wards/wardSelectors";
import { getPollingUnitsByWard, getAllAccreditationByOrganization, getOverVotingByOrganization } from "../features/pollingUnits/pollingUnitApi";
import { selectPollingUnitsByWard, selectAllAccreditationByOrganization, selectOverVotingByOrganization } from "../features/pollingUnits/pollingUnitSelectors";
import { useResultSocket } from "../hooks/useResultSocket";
import "./ResultWinningAnalysis.css";

const POSITION_LABELS = ["Leading", "Runner-up", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth"];
const DEFAULT_COLORS = ["#0ea5e9", "#22c55e", "#eab308", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

const CONSTITUENCY_TYPES = ["senate", "house_of_rep", "state_house_of_assembly", "state_assembly"];

function PartyThumb({
  party,
  parties,
}: {
  party: { partyCode: string; name: string; color?: string; logo?: string };
  parties: { _id?: string; acronym?: string; logo?: string; color?: string }[];
}) {
  const [imgError, setImgError] = useState(false);
  const p = parties.find(
    (x) =>
      (x.acronym || "").toUpperCase() === (party.partyCode || "").toUpperCase()
  );
  const logo = party.logo ?? p?.logo ?? null;
  const color = party.color ?? p?.color ?? "#6b7280";
  const short = party.partyCode || p?.acronym || "?";

  return (
    <div
      className="result-list__thumb"
      style={{ background: color, color: "#fff" }}
      title={party.name}
    >
      {logo && !imgError ? (
        <img src={logo} alt={short} onError={() => setImgError(true)} />
      ) : (
        <span>{short}</span>
      )}
    </div>
  );
}

function buildResultsByElectionKey(
  electionId: string | null,
  params: { lgaId?: string; wardId?: string; pollingUnitId?: string }
) {
  if (!electionId) return "";
  const p: Record<string, string> = {};
  if (params.pollingUnitId) p.pollingUnitId = params.pollingUnitId;
  else if (params.wardId) p.wardId = params.wardId;
  else if (params.lgaId) p.lgaId = params.lgaId;
  return `results/getResultsByElection::${JSON.stringify({ electionId, params: p })}`;
}

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const organizationId = useSelector(
    (s: RootState) =>
      s.auth.user?.organization?._id ?? s.auth.user?.organization?.id
  );
  const [selectedElectionId, setSelectedElectionId] = useState<string>("");
  const [electionTypeFilter, setElectionTypeFilter] = useState<string>("governorship");
  const [filter, setFilter] = useState<{
    lgaId: string;
    wardId: string;
    pollingUnitId: string;
  }>({ lgaId: "", wardId: "", pollingUnitId: "" });
  const [showViewMorePartiesModal, setShowViewMorePartiesModal] = useState(false);

  const electionsQuery = { status: "concluded" as const, includeResults: true };
  const elections = useSelector((s: RootState) =>
    selectElectionsByOrganizationId(organizationId ?? "", electionsQuery)(s)
  ) ?? [];
  const electionsLoading = useSelector((s: RootState) =>
    selectElectionsByOrganizationIdLoading(
      organizationId ?? "",
      electionsQuery
    )(s)
  );

  useEffect(() => {
    if (!organizationId) return;
    dispatch(
      getElectionsByOrganizationId({
        organizationId,
        query: electionsQuery,
      })
    );
    dispatch(getParties());
  }, [dispatch, organizationId]);

  const electionTypeOptions = [
    { value: "governorship", label: "Governorship" },
    { value: "", label: "All types" },
    { value: "senate", label: "Senate" },
    { value: "house_of_rep", label: "House of Rep" },
    { value: "state_house_of_assembly", label: "State Assembly" },
    { value: "presidential", label: "Presidential" },
    { value: "local_government_chairman", label: "Chairmanship" },
    { value: "councillorship", label: "Councillorship" },
  ];
  const filteredElections = electionTypeFilter
    ? elections.filter((e) => {
        const t = (e.type as string) ?? "";
        if (electionTypeFilter === "councillorship") return t === "councillorship" || t === "councillor";
        return t === electionTypeFilter;
      })
    : elections;
  const selectedElection = elections.find((e) => e._id === selectedElectionId);

  useEffect(() => {
    if (electionTypeFilter === "governorship" && filteredElections.length > 0) {
      const currentInFiltered = selectedElectionId && filteredElections.some((e) => e._id === selectedElectionId);
      if (!currentInFiltered) {
        setSelectedElectionId(filteredElections[0]._id ?? "");
      }
    }
  }, [electionTypeFilter, filteredElections, selectedElectionId]);
  const stateId =
    selectedElection?.state?._id ??
    (selectedElection?.state as { id?: string })?.id ??
    "";

  useEffect(() => {
    if (stateId) dispatch(getLGAsByState(stateId));
  }, [dispatch, stateId]);

  useEffect(() => {
    if (filter.lgaId) dispatch(getWardsByLGA(filter.lgaId));
  }, [dispatch, filter.lgaId]);

  useEffect(() => {
    if (organizationId && filter.wardId) {
      dispatch(getPollingUnitsByWard({ organizationId, wardId: filter.wardId }));
    }
  }, [dispatch, organizationId, filter.wardId]);

  const allLgas = (useSelector((s: RootState) =>
    selectLGAsByState(stateId)(s)
  ) ?? []) as { _id: string; name?: string; code?: string }[];
  const coverageIds = (selectedElection as { coverage?: { type?: string; ids?: string[] } })?.coverage?.ids ?? [];
  const isConstituencyElection = CONSTITUENCY_TYPES.includes((selectedElection?.type ?? "") as string);
  const lgas = isConstituencyElection && coverageIds.length > 0
    ? allLgas.filter((l) => coverageIds.some((id) => String(id) === String(l._id)))
    : allLgas;
  const wards = (useSelector((s: RootState) =>
    selectWardsByLGA(filter.lgaId)(s)
  ) ?? []) as { _id: string; name?: string; code?: string }[];
  const pollingUnits = (useSelector((s: RootState) =>
    selectPollingUnitsByWard(organizationId ?? "", filter.wardId)(s)
  ) ?? []) as { _id: string; name?: string; code?: string }[];

  const hasFilter = !!(filter.lgaId || filter.wardId || filter.pollingUnitId);

  useEffect(() => {
    if (!selectedElectionId) return;
    if (hasFilter) {
      const params: Record<string, string> = {};
      if (filter.pollingUnitId) params.pollingUnitId = filter.pollingUnitId;
      else if (filter.wardId) params.wardId = filter.wardId;
      else if (filter.lgaId) params.lgaId = filter.lgaId;
      dispatch(
        getResultsByElection({
          electionId: selectedElectionId,
          params,
        })
      );
    } else {
      const arg =
        isConstituencyElection && coverageIds.length > 0
          ? { electionId: selectedElectionId, params: { lgaIds: coverageIds } }
          : selectedElectionId;
      dispatch(getAspirantTotalsByElection(arg));
    }
  }, [dispatch, selectedElectionId, hasFilter, filter.lgaId, filter.wardId, filter.pollingUnitId, isConstituencyElection, coverageIds]);

  useEffect(() => {
    if (organizationId && selectedElectionId) {
      const query: { stateId?: string; lgaId?: string; wardId?: string } = {};
      if (filter.lgaId) query.lgaId = filter.lgaId;
      else if (filter.wardId) query.wardId = filter.wardId;
      else if (stateId) query.stateId = stateId;
      dispatch(
        getAllAccreditationByOrganization({
          organizationId,
          electionId: selectedElectionId,
          query,
        })
      );
      dispatch(
        getOverVotingByOrganization({ organizationId, electionId: selectedElectionId })
      );
    }
  }, [dispatch, organizationId, selectedElectionId, stateId, filter.lgaId, filter.wardId]);

  // Real-time: refetch results when a result is saved for the selected election
  useResultSocket(
    selectedElectionId ? [selectedElectionId] : [],
    (electionId) => {
      if (electionId !== selectedElectionId) return;
      if (hasFilter) {
        const params: Record<string, string> = {};
        if (filter.pollingUnitId) params.pollingUnitId = filter.pollingUnitId;
        else if (filter.wardId) params.wardId = filter.wardId;
        else if (filter.lgaId) params.lgaId = filter.lgaId;
        dispatch(getResultsByElection({ electionId, params }));
      } else {
        const arg =
          isConstituencyElection && coverageIds.length > 0
            ? { electionId, params: { lgaIds: coverageIds } }
            : electionId;
        dispatch(getAspirantTotalsByElection(arg));
      }
      if (organizationId) {
        const query: { stateId?: string; lgaId?: string; wardId?: string } = {};
        if (filter.lgaId) query.lgaId = filter.lgaId;
        else if (filter.wardId) query.wardId = filter.wardId;
        else if (stateId) query.stateId = stateId;
        dispatch(
          getAllAccreditationByOrganization({
            organizationId,
            electionId,
            query,
          })
        );
        dispatch(getOverVotingByOrganization({ organizationId, electionId }));
      }
    },
    () => {
      if (organizationId) {
        dispatch(
          getElectionsByOrganizationId({
            organizationId,
            query: electionsQuery,
          })
        );
      }
    }
  );

  const aspirantTotalsParams =
    !hasFilter && isConstituencyElection && coverageIds.length > 0
      ? { lgaIds: coverageIds }
      : undefined;
  const aspirantTotalsData = useSelector((s: RootState) =>
    !hasFilter && selectedElectionId
      ? selectAspirantTotalsByElection(selectedElectionId, aspirantTotalsParams)(s)
      : null
  ) as {
    aspirants?: Array<{
      position: number;
      positionLabel: string;
      isLeading: boolean;
      aspirant: { _id: string; name: string; partyCode: string; party: string };
      totalVotes: number;
    }>;
  } | null;

  const resultsKey = buildResultsByElectionKey(selectedElectionId, filter);
  const resultsData = useSelector((s: RootState) =>
    resultsKey ? (s.results.cache[resultsKey] as any[] | null) : null
  ) as Array<{
    aspirant?: { _id?: string; name?: string; partyCode?: string };
    party?: { _id?: string; acronym?: string };
    votes: number;
  }> | null;

  const aspirantTotalsLoading = useSelector((s: RootState) =>
    !hasFilter && selectedElectionId
      ? selectAspirantTotalsByElectionLoading(selectedElectionId, aspirantTotalsParams)(s)
      : false
  );
  const resultsLoading = useSelector((s: RootState) =>
    resultsKey ? selectLoadingByKey(resultsKey)(s) : false
  );

  const accrQuery = filter.lgaId
    ? { lgaId: filter.lgaId }
    : filter.wardId
      ? { wardId: filter.wardId }
      : stateId
        ? { stateId }
        : {};
  const accreditationData = useSelector((s: RootState) =>
    organizationId && selectedElectionId
      ? selectAllAccreditationByOrganization(organizationId, selectedElectionId, Object.keys(accrQuery).length > 0 ? accrQuery : undefined)(s)
      : null
  ) as { totalAccreditedVoters?: number; accreditation?: Array<{ pollingUnit?: { _id?: string }; accreditedCount?: number }> } | null;

  const overVotingData = useSelector((s: RootState) =>
    organizationId && selectedElectionId
      ? selectOverVotingByOrganization(organizationId, selectedElectionId)(s)
      : null
  ) as {
    overVotingUnits?: Array<{ excess: number }>;
  } | null;

  const totalAccreditedVoters = (() => {
    if (!accreditationData) return 0;
    if (filter.pollingUnitId && Array.isArray(accreditationData.accreditation)) {
      const match = accreditationData.accreditation.find(
        (a) => String(a.pollingUnit?._id ?? "") === filter.pollingUnitId
      );
      return typeof match?.accreditedCount === "number" ? match.accreditedCount : 0;
    }
    return accreditationData.totalAccreditedVoters ?? 0;
  })();

  const loading = aspirantTotalsLoading || resultsLoading;

  const parties = (useSelector((s: RootState) => selectParties(s)) ?? []) as {
    _id?: string;
    acronym?: string;
    logo?: string;
    color?: string;
    name?: string;
  }[];

  const winningParties = (() => {
    if (hasFilter && Array.isArray(resultsData)) {
      const tally = new Map<
        string,
        { name: string; partyCode: string; totalVotes: number }
      >();
      for (const r of resultsData) {
        const code = (
          r.aspirant?.partyCode ?? r.party?.acronym ?? ""
        ).toUpperCase();
        if (!code) continue;
        const key = r.aspirant?._id ? `${r.aspirant._id}::${code}` : `party::${code}`;
        const name = r.aspirant?.name ?? code;
        const existing = tally.get(key);
        if (existing) {
          existing.totalVotes += r.votes ?? 0;
        } else {
          tally.set(key, { name, partyCode: code, totalVotes: r.votes ?? 0 });
        }
      }
      const arr = [...tally.entries()].map(([k, v]) => ({
        ...v,
        id: k,
      }));
      arr.sort((a, b) => b.totalVotes - a.totalVotes);
      return arr;
    }
    const asp = aspirantTotalsData?.aspirants ?? [];
    return asp.map((a, i) => ({
      id: a.aspirant._id,
      name: a.aspirant.name,
      partyCode: a.aspirant.partyCode || "",
      totalVotes: a.totalVotes,
      position: i + 1,
      isLeading: a.isLeading,
    }));
  })();

  const totalVotes = winningParties.reduce((s, p) => s + (p.totalVotes ?? 0), 0);
  const totalOverVoting = totalAccreditedVoters > 0 && totalVotes > totalAccreditedVoters
    ? totalVotes - totalAccreditedVoters
    : (overVotingData?.overVotingUnits ?? []).reduce((s, u) => s + (u.excess ?? 0), 0);
  const maxPartyVotes = Math.max(...winningParties.map((p) => p.totalVotes ?? 0), 1);
  const barScale = maxPartyVotes;

  const handleClearFilter = () => {
    setFilter({ lgaId: "", wardId: "", pollingUnitId: "" });
  };

  return (
    <div className="result-page-wrap">
      <div>
        <p className="dash-page__breadcrumb">EMS / Result Winning Analysis</p>
        <h1 className="dash-page__title">Result Winning Analysis</h1>
      </div>

      <div className="result-dash-filters">
        {elections.length > 0 && (
          <div className="result-dash-filters__item">
            <label>Election type</label>
            <select
              value={electionTypeFilter}
              onChange={(e) => {
                setElectionTypeFilter(e.target.value);
                setSelectedElectionId("");
                setFilter({ lgaId: "", wardId: "", pollingUnitId: "" });
              }}
            >
              {electionTypeOptions.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="result-dash-filters__item">
          <label>Election</label>
          <select
            value={selectedElectionId}
            onChange={(e) => {
              setSelectedElectionId(e.target.value);
              setFilter({ lgaId: "", wardId: "", pollingUnitId: "" });
            }}
          >
            <option value="">Select election…</option>
            {filteredElections.map((e) => (
              <option key={e._id} value={e._id}>
                {e.name ?? e._id}
              </option>
            ))}
          </select>
        </div>
        {selectedElectionId && stateId && (
          <>
            <div className="result-dash-filters__item">
              <label>{isConstituencyElection && coverageIds.length > 0 ? "Constituency (LGA)" : "LGA"}</label>
              <select
                value={filter.lgaId}
                onChange={(e) =>
                  setFilter({
                    ...filter,
                    lgaId: e.target.value,
                    wardId: "",
                    pollingUnitId: "",
                  })
                }
              >
                <option value="">
                  {isConstituencyElection && coverageIds.length > 0 ? "All in constituency" : "All LGAs"}
                </option>
                {lgas.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name ?? l.code ?? l._id}
                  </option>
                ))}
              </select>
            </div>
            <div className="result-dash-filters__item">
              <label>Ward</label>
              <select
                value={filter.wardId}
                onChange={(e) =>
                  setFilter({ ...filter, wardId: e.target.value, pollingUnitId: "" })
                }
                disabled={!filter.lgaId}
              >
                <option value="">All Wards</option>
                {wards.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name ?? w.code ?? w._id}
                  </option>
                ))}
              </select>
            </div>
            <div className="result-dash-filters__item">
              <label>Polling Unit</label>
              <select
                value={filter.pollingUnitId}
                onChange={(e) =>
                  setFilter({ ...filter, pollingUnitId: e.target.value })
                }
                disabled={!filter.wardId}
              >
                <option value="">All Polling Units</option>
                {pollingUnits.map((pu) => (
                  <option key={pu._id} value={pu._id}>
                    {pu.name ?? pu.code ?? pu._id}
                  </option>
                ))}
              </select>
            </div>
            {(filter.lgaId || filter.wardId || filter.pollingUnitId) && (
              <button type="button" onClick={handleClearFilter} className="result-dash-filters__btn">
                Clear filter
              </button>
            )}
          </>
        )}
      </div>

      {!selectedElectionId ? (
        <div className="result-chart" style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>
          Select an election to view winning analysis.
        </div>
      ) : electionsLoading || loading ? (
        <div className="result-chart results-pu-cards-loading" style={{ padding: "3rem", flexDirection: "column" }}>
          <span className="results-pu-cards-loading__spinner" />
          <span className="results-pu-cards-loading__text">Loading results…</span>
        </div>
      ) : (
        <div className="result-page">
          <aside className="result-list">
            <h2 className="result-list__title">Winning Parties</h2>
            {winningParties.length === 0 ? (
              <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>No results for this selection.</p>
            ) : (
              <>
                {(winningParties.length > 4 ? winningParties.slice(0, 4) : winningParties).map((party, i) => {
                  const pct =
                    totalVotes > 0
                      ? (((party.totalVotes ?? 0) / totalVotes) * 100).toFixed(1)
                      : "0";
                  const status =
                    i === 0
                      ? (selectedElection?.status === "concluded" ? "Winner" : "Leading")
                      : (POSITION_LABELS[i] ?? `${i + 1}th`);
                  const color = DEFAULT_COLORS[i % DEFAULT_COLORS.length];
                  const isLeading = i === 0;
                  return (
                    <div
                      key={party.id ?? i}
                      className={`result-list__item${isLeading ? " result-list__item--leading" : ""}`}
                    >
                      <PartyThumb
                        party={{
                          partyCode: party.partyCode,
                          name: party.name ?? party.partyCode,
                          color,
                        }}
                        parties={parties}
                      />
                      <div className="result-list__info">
                        <p className="result-list__name">{party.name ?? party.partyCode}</p>
                        <p className="result-list__meta">
                          {(party.totalVotes ?? 0).toLocaleString()} votes · {pct}%
                        </p>
                        <span className="result-list__status">{status}</span>
                      </div>
                    </div>
                  );
                })}
                {winningParties.length > 4 && (
                  <button
                    type="button"
                    className="result-list__view-more"
                    onClick={() => setShowViewMorePartiesModal(true)}
                  >
                    View More ({winningParties.length - 4} more)
                  </button>
                )}
              </>
            )}
          </aside>

          {/* View More Parties Modal */}
          {showViewMorePartiesModal && (
            <div
              className="result-view-more-backdrop"
              onClick={() => setShowViewMorePartiesModal(false)}
              aria-hidden
            >
              <div
                className="result-view-more-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="result-view-more-modal__header">
                  <h3 className="result-view-more-modal__title">All Winning Parties</h3>
                  <button
                    type="button"
                    className="result-view-more-modal__close"
                    onClick={() => setShowViewMorePartiesModal(false)}
                    aria-label="Close"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="result-view-more-modal__body">
                  {winningParties.map((party, i) => {
                    const pct =
                      totalVotes > 0
                        ? (((party.totalVotes ?? 0) / totalVotes) * 100).toFixed(1)
                        : "0";
                    const status =
                      i === 0
                        ? (selectedElection?.status === "concluded" ? "Winner" : "Leading")
                        : (POSITION_LABELS[i] ?? `${i + 1}th`);
                    const color = DEFAULT_COLORS[i % DEFAULT_COLORS.length];
                    const isLeading = i === 0;
                    return (
                      <div
                        key={party.id ?? i}
                        className={`result-list__item${isLeading ? " result-list__item--leading" : ""}`}
                      >
                        <PartyThumb
                          party={{
                            partyCode: party.partyCode,
                            name: party.name ?? party.partyCode,
                            color,
                          }}
                          parties={parties}
                        />
                        <div className="result-list__info">
                          <p className="result-list__name">{party.name ?? party.partyCode}</p>
                          <p className="result-list__meta">
                            {(party.totalVotes ?? 0).toLocaleString()} votes · {pct}%
                          </p>
                          <span className="result-list__status">{status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <section className="result-chart result-chart--dashboard">
            <div className="result-chart__header">
              <div className="result-chart__period">
                <span
                  className="result-chart__period-btn result-chart__period-btn--active"
                  style={{ cursor: "default" }}
                >
                  {hasFilter
                    ? filter.pollingUnitId
                      ? "Polling Unit"
                      : filter.wardId
                        ? "Ward"
                        : "LGA"
                    : "Election"}
                </span>
              </div>
              <span className="result-chart__label">
                Votes by party (bars scaled to total votes)
              </span>
            </div>

            <div className="result-chart__stats">
              <div className="result-chart__stat">
                <span className="result-chart__stat-dot result-chart__stat-dot--cream" />
                <div>
                  <div className="result-chart__stat-label">Total Accredited Voters</div>
                  <div className="result-chart__stat-value">
                    {totalAccreditedVoters.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="result-chart__stat">
                <span className="result-chart__stat-dot result-chart__stat-dot--amber" />
                <div>
                  <div className="result-chart__stat-label">Total Votes</div>
                  <div className="result-chart__stat-value">
                    {totalVotes.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="result-chart__stat">
                <span className="result-chart__stat-dot result-chart__stat-dot--amber" />
                <div>
                  <div className="result-chart__stat-label">Leading Party</div>
                  <div className="result-chart__stat-value">
                    {winningParties[0]?.partyCode ?? "—"}
                  </div>
                </div>
              </div>
              <div className="result-chart__stat">
                <span
                  className="result-chart__stat-dot"
                  style={{ background: totalOverVoting > 0 ? "#ef4444" : "#22c55e" }}
                />
                <div>
                  <div className="result-chart__stat-label">Overvoting</div>
                  <div className="result-chart__stat-value" style={{ color: totalOverVoting > 0 ? "#dc2626" : undefined }}>
                    {totalOverVoting > 0 ? `+${totalOverVoting.toLocaleString()}` : "0"}
                  </div>
                </div>
              </div>
            </div>

            <div className="result-chart__chart">
              <div className="result-chart__bars">
                {winningParties.length === 0 ? (
                  <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>No data</p>
                ) : (
                  winningParties.map((party, i) => {
                    const votes = party.totalVotes ?? 0;
                    const BAR_MAX_HEIGHT = 200;
                    const heightRatio = barScale > 0 ? Math.min(1, votes / barScale) : 0;
                    const barHeightPx = Math.max(4, Math.round(heightRatio * BAR_MAX_HEIGHT));
                    const pct = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : "0";
                    const isLeading = i === 0;
                    return (
                      <div key={party.id ?? i} className="result-chart__bar-wrap">
                        <div className="result-chart__bar-row">
                          <span className="result-chart__bar-pct">{pct}%</span>
                          <div
                            className={`result-chart__bar ${
                              isLeading
                                ? "result-chart__bar--highlight"
                                : "result-chart__bar--default"
                            }`}
                            style={{
                              height: `${barHeightPx}px`,
                            }}
                          />
                          <span className="result-chart__bar-votes" title={`${votes.toLocaleString()} votes (${pct}%)`}>
                            {votes.toLocaleString()}
                          </span>
                        </div>
                        <span className="result-chart__axis">
                          {party.partyCode || "?"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
