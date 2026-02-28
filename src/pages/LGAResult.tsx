import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../app/store";
import {
  getElections,
  getParties,
  getLgasCoverage,
  getAspirantTotalsByElectionAndLga,
  getAspirantTotalsFromLgaByElection,
  getResultsByElectionAndLga,
  enterResultByElectionAndLgaAndAspirant,
} from "../features/results/resultsApi";
import {
  selectElections,
  selectElectionsLoading,
  selectLgasCoverage,
  selectAspirantTotalsByLgaLocal,
  selectAspirantTotalsFromLgaByElection,
  selectLgaCollation,
} from "../features/results/resultsSelectors";
import {
  getElectionsByOrganizationId,
} from "../features/elections/electionApi";
import {
  selectElectionsByOrganizationId,
} from "../features/elections/electionSelectors";
import {
  getAspirantsByElection,
  selectAspirantsByElection,
  selectAspirantsByElectionLoading,
} from "../features/aspirants";
import { selectRole } from "../features/auth/authSelectors";
import "./Results.css";

const IconChevronDown = () => (
  <svg className="results-election-card__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);
const IconChevronRight = () => (
  <svg className="results-election-card__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

type LocationRef = { _id?: string; name?: string } | string;
const getLocationId = (loc: LocationRef | undefined | null): string | null => {
  if (!loc) return null;
  return typeof loc === "object" ? (loc._id ?? null) ?? null : loc;
};
const getLocationName = (loc: { name?: string } | string | undefined) =>
  !loc ? "—" : typeof loc === "object" ? loc.name ?? "—" : loc;

type AspirantTotalsShape = {
  aspirants?: Array<{
    position?: number;
    positionLabel?: string;
    aspirant?: { _id?: string; name?: string };
    totalVotes?: number;
  }>;
};

type LgaCollationResult = {
  _id: string;
  votes: number;
  aspirant: {
    _id: string;
    name: string;
    partyName?: string;
    partyCode?: string;
  };
  lga?: { _id?: string; name?: string; code?: string };
  source?: string;
  enteredBy?: { _id?: string; email?: string };
  updatedAt?: string;
};

function LgaCoverageBadge({ electionId }: { electionId: string }) {
  const coverage = useSelector(selectLgasCoverage(electionId));
  if (!coverage || coverage.total === 0) return null;
  const pct = ((coverage.entered / coverage.total) * 100).toFixed(1);
  const remaining = coverage.total - coverage.entered;
  return (
    <span className="results-election-card__coverage">
      {coverage.entered} of {coverage.total} LGAs ({pct}%) — {remaining} remaining
    </span>
  );
}

function ElectionLeadingBadge({
  aspirantTotals,
  collationResults,
}: {
  aspirantTotals?: AspirantTotalsShape | null;
  collationResults?: LgaCollationResult[];
}) {
  const totalsList = aspirantTotals?.aspirants ?? [];

  if (totalsList.length > 0) {
    const leader = totalsList[0];
    const leaderVotes = leader?.totalVotes ?? 0;
    if (leaderVotes > 0) {
      const name = leader?.aspirant?.name ?? "—";
      const positionLabel = leader?.positionLabel ?? "1st";
      return (
        <span className="results-election-card__leading">
          Leading ({positionLabel}): {name} — {leaderVotes.toLocaleString()} votes
        </span>
      );
    }
  }

  if (collationResults && collationResults.length > 0) {
    const sorted = [...collationResults].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
    const leader = sorted[0];
    if ((leader?.votes ?? 0) > 0) {
      return (
        <span className="results-election-card__leading">
          Leading: {leader.aspirant?.name ?? "—"} ({leader.aspirant?.partyCode ?? ""}) — {leader.votes.toLocaleString()} votes
        </span>
      );
    }
  }

  return null;
}

function LgaElectionCard({
  el,
  lgaId,
  expandedElectionId,
  onToggle,
  expandedAspirants,
  expandedAspirantsLoading,
  aspirantVotes,
  accordionSavingId,
  accordionSavingAll,
  onVoteChange,
  onSave,
  onSaveAll,
  isReadOnly,
}: {
  el: { _id: string; name: string; status?: string };
  lgaId: string;
  expandedElectionId: string | null;
  onToggle: (id: string) => void;
  expandedAspirants: Array<{ _id: string; name: string; partyCode?: string; party?: { name?: string; acronym?: string } }> | undefined;
  expandedAspirantsLoading: boolean;
  aspirantVotes: Record<string, Record<string, string>>;
  accordionSavingId: string | null;
  accordionSavingAll: boolean;
  onVoteChange: (electionId: string, aspirantId: string, value: string) => void;
  onSave: (electionId: string, aspirantId: string) => void;
  onSaveAll: (electionId: string) => void;
  isReadOnly?: boolean;
}) {
  const lgaTotalsSpecific = useSelector(
    selectAspirantTotalsByLgaLocal(el._id, lgaId)
  ) as AspirantTotalsShape | undefined;
  const lgaTotalsAggregated = useSelector(
    selectAspirantTotalsFromLgaByElection(el._id)
  ) as AspirantTotalsShape | undefined;
  // LGA-specific if available, otherwise fall back to election-wide aggregated LGA totals
  const lgaTotals = (lgaTotalsSpecific?.aspirants?.length ? lgaTotalsSpecific : lgaTotalsAggregated) as AspirantTotalsShape | undefined;

  const collationData = useSelector(selectLgaCollation(el._id, lgaId));
  const collationResults: LgaCollationResult[] = collationData?.results ?? [];

  const coverage = useSelector(selectLgasCoverage(el._id));
  const aspirantLgaWins = coverage?.aspirantLgaWins ?? [];

  const isExpanded = expandedElectionId === el._id;

  const getCollationEntry = (aspirantId: string) =>
    collationResults.find((r) => String(r.aspirant?._id) === String(aspirantId));

  // Total votes: prefer sum from collation results; fall back to summing aggregated totals
  const totalFromCollation = collationResults.reduce((sum, r) => sum + (r.votes ?? 0), 0);
  const totalFromAggregated = (lgaTotals?.aspirants ?? []).reduce((sum, a) => sum + (a.totalVotes ?? 0), 0);
  const totalSubmitted = totalFromCollation > 0 ? totalFromCollation : totalFromAggregated;

  // Leading aspirant ID
  const leadingAspirantId = (() => {
    const totals = lgaTotals?.aspirants ?? [];
    if (totals.length > 0 && (totals[0]?.totalVotes ?? 0) > 0) {
      return totals[0]?.aspirant?._id ?? null;
    }
    if (collationResults.length > 0) {
      const sorted = [...collationResults].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
      return sorted[0]?.aspirant?._id ?? null;
    }
    return null;
  })();

  const leadingLgaWins = leadingAspirantId
    ? (aspirantLgaWins.find((w) => String(w.aspirantId) === String(leadingAspirantId))?.lgasWon ?? null)
    : null;

  return (
    <div className="results-election-card">
      <button
        type="button"
        className={`results-election-card__header ${isExpanded ? "results-election-card__header--open" : ""}`}
        onClick={() => onToggle(el._id)}
      >
        <div className="results-election-card__header-main">
          <div className="results-election-card__header-top">
            <span className="results-election-card__title">{el.name}</span>
            <span className="results-election-card__header-coverage">
              <LgaCoverageBadge electionId={el._id} />
            </span>
          </div>
          <div className="results-election-card__header-meta results-election-card__header-meta--spaced">
            <ElectionLeadingBadge aspirantTotals={lgaTotals} collationResults={collationResults} />
            {totalSubmitted > 0 && (
              <span className="results-election-card__total-votes results-election-card__total-votes--right">
                Total LGA votes: {totalSubmitted.toLocaleString()}
                {leadingLgaWins !== null && (
                  <span className="results-election-card__ward-wins">
                    &nbsp;· Winning {leadingLgaWins} LGA{leadingLgaWins !== 1 ? "s" : ""}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
        <span className="results-election-card__chevron-wrap">
          {isExpanded ? <IconChevronDown /> : <IconChevronRight />}
        </span>
      </button>

      {isExpanded && (
        <div className="results-election-card__body">
          {expandedAspirantsLoading ? (
            <p className="results-view__empty" style={{ margin: 0 }}>Loading aspirants…</p>
          ) : !expandedAspirants?.length ? (
            <p className="results-view__empty" style={{ margin: 0 }}>No aspirants for this election.</p>
          ) : (
            <>
              <div className="results-aspirants-list">
                {expandedAspirants.map((a) => {
                  const totalsEntry = lgaTotals?.aspirants?.find(
                    (t) => String(t.aspirant?._id) === String(a._id)
                  );
                  const positionLabel = totalsEntry?.positionLabel ?? null;
                  const collationEntry = getCollationEntry(a._id);
                  // Use LGA-specific collation votes if available, otherwise show aggregated total votes
                  const submittedVotes = collationEntry?.votes ?? totalsEntry?.totalVotes ?? null;
                  const partyCode = (
                    a.partyCode ?? a.party?.acronym ?? collationEntry?.aspirant?.partyCode ?? ""
                  ).toUpperCase();

                  return (
                    <div
                      key={a._id}
                      className={`results-aspirant-row${submittedVotes !== null ? " results-aspirant-row--submitted" : ""}`}
                    >
                      <div className="results-aspirant-row__info">
                        {partyCode && (
                          <span className="results-aspirant-row__party">{partyCode}</span>
                        )}
                        <span className="results-aspirant-row__name">{a.name}</span>
                      </div>

                      <div className="results-aspirant-row__actions">
                        {(positionLabel || submittedVotes !== null) && (
                          <div className="results-aspirant-row__meta">
                            {positionLabel && (
                              <span className="results-aspirant-row__position">{positionLabel}</span>
                            )}
                            {submittedVotes !== null && (
                              <span className="results-aspirant-row__submitted">
                                {submittedVotes.toLocaleString()} votes
                              </span>
                            )}
                          </div>
                        )}
                        {!isReadOnly && (
                          <>
                            <input
                              type="number"
                              min={0}
                              className="results-table__votes-input"
                              placeholder="0"
                              value={aspirantVotes[el._id]?.[a._id] ?? ""}
                              onChange={(e) => onVoteChange(el._id, a._id, e.target.value)}
                            />
                            <button
                              type="button"
                              className="results-table__save-btn"
                              onClick={() => onSave(el._id, a._id)}
                              disabled={accordionSavingId === a._id || accordionSavingAll}
                            >
                              {accordionSavingId === a._id
                                ? "Saving…"
                                : submittedVotes !== null
                                ? "Update"
                                : "Save"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!isReadOnly && (
                <div className="results-actions" style={{ marginTop: "1rem" }}>
                  <label className="results-upload-zone">
                    <span className="results-upload-zone__icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </span>
                    <span className="results-upload-zone__label">Upload result sheet</span>
                    <span className="results-upload-zone__hint">PDF, JPG or PNG — click to browse</span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} />
                  </label>
                  <button
                    type="button"
                    className="results-btn results-btn--primary"
                    onClick={() => onSaveAll(el._id)}
                    disabled={accordionSavingAll || accordionSavingId !== null}
                  >
                    {accordionSavingAll ? "Saving…" : "Save all"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const LGA_AGENT_ROLE = "lga_collation_officer_agent";
const OVERVIEW_ROLES = ["superadmin", "executive", "regular"];

export default function LGAResult() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const role = useSelector(selectRole) ?? "";

  const [expandedElectionId, setExpandedElectionId] = useState<string | null>(null);
  const [aspirantVotes, setAspirantVotes] = useState<Record<string, Record<string, string>>>({});
  const [accordionMessage, setAccordionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [accordionSavingId, setAccordionSavingId] = useState<string | null>(null);
  const [accordionSavingAll, setAccordionSavingAll] = useState(false);

  const organizationId = (user as { organization?: { _id?: string; id?: string } })?.organization?._id
    ?? (user as { organization?: { _id?: string; id?: string } })?.organization?.id
    ?? "";

  const u = user as { lga?: LocationRef } | null;
  const lgaId = getLocationId(u?.lga);
  const lgaName = getLocationName(u?.lga);

  const electionsFromResults = useSelector(selectElections) ?? [];
  const electionsWithTotals = useSelector(
    selectElectionsByOrganizationId(organizationId ?? "", { includeResults: true })
  ) ?? [];
  const elections = (electionsWithTotals?.length ? electionsWithTotals : electionsFromResults) ?? electionsFromResults ?? [];
  const electionsLoading = useSelector(selectElectionsLoading);

  const electionsList = (Array.isArray(elections) ? elections : []).filter(
    (e: { _id?: string; name?: string; status?: string }) => e.status === "active"
  );

  useEffect(() => {
    dispatch(getElections());
    dispatch(getParties());
  }, [dispatch]);

  useEffect(() => {
    if (organizationId) {
      dispatch(getElectionsByOrganizationId({ organizationId, query: { includeResults: true } }));
    }
  }, [dispatch, organizationId]);

  useEffect(() => {
    if (expandedElectionId) {
      dispatch(getAspirantsByElection(expandedElectionId));
      if (lgaId) {
        dispatch(getResultsByElectionAndLga({ electionId: expandedElectionId, lgaId }));
      }
    }
  }, [dispatch, expandedElectionId, lgaId]);

  useEffect(() => {
    if (electionsList.length > 0) {
      electionsList.forEach((el) => {
        dispatch(getLgasCoverage({ electionId: el._id }));
        if (OVERVIEW_ROLES.includes(role)) {
          dispatch(getAspirantTotalsFromLgaByElection({ electionId: el._id }));
        }
        if (lgaId) {
          dispatch(getAspirantTotalsByElectionAndLga({ electionId: el._id, lgaId }));
          dispatch(getResultsByElectionAndLga({ electionId: el._id, lgaId }));
        }
      });
    }
  }, [dispatch, electionsList.map((e) => e._id).join(","), lgaId, role]);

  const handleAccordionToggle = (id: string) => {
    setExpandedElectionId((prev) => (prev === id ? null : id));
    setAccordionMessage(null);
    dispatch(getLgasCoverage({ electionId: id }));
    if (OVERVIEW_ROLES.includes(role)) {
      dispatch(getAspirantTotalsFromLgaByElection({ electionId: id }));
    }
    if (id && lgaId) {
      dispatch(getAspirantTotalsByElectionAndLga({ electionId: id, lgaId }));
      dispatch(getResultsByElectionAndLga({ electionId: id, lgaId }));
    }
    if (id) {
      dispatch(getAspirantsByElection(id));
    }
  };

  const handleAspirantVoteChange = (electionId: string, aspirantId: string, value: string) => {
    setAspirantVotes((prev) => ({
      ...prev,
      [electionId]: {
        ...(prev[electionId] ?? {}),
        [aspirantId]: value,
      },
    }));
    setAccordionMessage(null);
  };

  const handleSaveAspirantResult = async (electionId: string, aspirantId: string) => {
    if (!lgaId) {
      setAccordionMessage({
        type: "error",
        text: "Your account is not assigned to an LGA.",
      });
      return;
    }
    const votesStr = aspirantVotes[electionId]?.[aspirantId]?.trim();
    if (!votesStr) {
      setAccordionMessage({ type: "error", text: "Enter votes for this aspirant." });
      return;
    }
    const votes = parseInt(votesStr, 10);
    if (isNaN(votes) || votes < 0) {
      setAccordionMessage({ type: "error", text: "Votes must be a non-negative number." });
      return;
    }
    setAccordionSavingId(aspirantId);
    setAccordionMessage(null);
    try {
      await dispatch(
        enterResultByElectionAndLgaAndAspirant({
          electionId,
          lgaId,
          aspirantId,
          votes,
        })
      ).unwrap();
      setAccordionMessage({ type: "success", text: "LGA result saved successfully." });
      dispatch(getLgasCoverage({ electionId }));
      dispatch(getAspirantTotalsByElectionAndLga({ electionId, lgaId }));
      dispatch(getResultsByElectionAndLga({ electionId, lgaId }));
      setAspirantVotes((prev) => ({
        ...prev,
        [electionId]: {
          ...(prev[electionId] ?? {}),
          [aspirantId]: "",
        },
      }));
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : "Failed to save LGA result.";
      setAccordionMessage({ type: "error", text: String(msg) });
    } finally {
      setAccordionSavingId(null);
    }
  };

  const handleSaveAllAspirantResults = async (electionId: string) => {
    if (!lgaId) {
      setAccordionMessage({
        type: "error",
        text: "Your account is not assigned to an LGA.",
      });
      return;
    }
    const votes = aspirantVotes[electionId] ?? {};
    const entries = Object.entries(votes).filter(
      ([_, v]) => v !== undefined && String(v).trim() !== ""
    );
    if (entries.length === 0) {
      setAccordionMessage({ type: "error", text: "Enter votes for at least one aspirant." });
      return;
    }
    setAccordionSavingAll(true);
    setAccordionMessage(null);
    let ok = 0;
    let errMsg = "";
    for (const [aspirantId, votesStr] of entries) {
      const v = parseInt(String(votesStr).trim(), 10);
      if (isNaN(v) || v < 0) continue;
      try {
        await dispatch(
          enterResultByElectionAndLgaAndAspirant({
            electionId,
            lgaId,
            aspirantId,
            votes: v,
          })
        ).unwrap();
        ok++;
      } catch (err: unknown) {
        errMsg =
          err && typeof err === "object" && "data" in err
            ? String((err as { data?: { message?: string } }).data?.message)
            : "Failed to save.";
        break;
      }
    }
    setAccordionSavingAll(false);
    if (ok > 0) {
      setAccordionMessage({
        type: "success",
        text: errMsg
          ? `Saved ${ok} result(s). Error: ${errMsg}`
          : `All ${ok} LGA result(s) saved successfully.`,
      });
      dispatch(getLgasCoverage({ electionId }));
      dispatch(getAspirantTotalsByElectionAndLga({ electionId, lgaId }));
      dispatch(getResultsByElectionAndLga({ electionId, lgaId }));
      setAspirantVotes((prev) => ({
        ...prev,
        [electionId]: {},
      }));
    }
    if (errMsg && ok === 0) setAccordionMessage({ type: "error", text: errMsg });
  };

  const expandedAspirants = useSelector(
    selectAspirantsByElection(expandedElectionId ?? "")
  ) as Array<{
    _id: string;
    name: string;
    partyCode?: string;
    party?: { name?: string; acronym?: string };
  }> | undefined;
  const expandedAspirantsLoading = useSelector(
    selectAspirantsByElectionLoading(expandedElectionId ?? "")
  );

  const isOverviewRole = OVERVIEW_ROLES.includes(role);

  if (role !== LGA_AGENT_ROLE && !isOverviewRole) {
    return (
      <div className="results-page">
        <div>
          <p className="results-page__breadcrumb">EMS / LGA Results</p>
          <h1 className="results-page__title">LGA Results</h1>
        </div>
        <div className="results-card" style={{ marginTop: "1rem" }}>
          <p className="results-view__empty">
            This page is for LGA Collation Officers only. You need the{" "}
            <strong>lga_collation_officer_agent</strong> role to enter LGA results and votes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-page">
      <div>
        <p className="results-page__breadcrumb">EMS / LGA Results</p>
        <h1 className="results-page__title">LGA Results</h1>
      </div>

      <div className="results-polling-unit">
        <div className="results-polling-unit__item">
          <span className="results-polling-unit__label">User</span>
          <span className="results-polling-unit__value">{user?.username || "—"}</span>
        </div>
        <div className="results-polling-unit__item">
          <span className="results-polling-unit__label">Role</span>
          <span className="results-polling-unit__value">{role || "—"}</span>
        </div>
        <div className="results-polling-unit__item">
          <span className="results-polling-unit__label">LGA</span>
          <span className="results-polling-unit__value">{lgaName}</span>
        </div>
      </div>

      {electionsList.length > 0 && (
        <div className="results-card results-elections-section">
          <h2 className="results-card__heading">Elections – LGA Collation</h2>
          <p className="results-elections-section__hint">
            Expand an election to view aspirants and enter or review votes.
          </p>
          {accordionMessage && (
            <div
              className={`results-message results-message--${accordionMessage.type}`}
              style={{ marginBottom: "1rem" }}
            >
              {accordionMessage.text}
            </div>
          )}
          <div className="results-elections-grid">
            {electionsList.map((el) => (
              <LgaElectionCard
                key={el._id}
                el={el}
                lgaId={lgaId ?? ""}
                expandedElectionId={expandedElectionId}
                onToggle={handleAccordionToggle}
                expandedAspirants={expandedElectionId === el._id ? expandedAspirants : undefined}
                expandedAspirantsLoading={expandedElectionId === el._id ? expandedAspirantsLoading : false}
                aspirantVotes={aspirantVotes}
                accordionSavingId={accordionSavingId}
                accordionSavingAll={accordionSavingAll}
                onVoteChange={handleAspirantVoteChange}
                onSave={handleSaveAspirantResult}
                onSaveAll={handleSaveAllAspirantResults}
                isReadOnly={false}
              />
            ))}
          </div>
          {electionsList.length === 0 && !electionsLoading && (
            <p className="results-view__empty">No elections found.</p>
          )}
        </div>
      )}
      {electionsList.length === 0 && !electionsLoading && (
        <div className="results-card" style={{ marginTop: "1rem" }}>
          <p className="results-view__empty">No active elections found.</p>
        </div>
      )}
    </div>
  );
}
