import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../app/store";
import {
  getElections,
  getParties,
  getPollingUnitsCoverage,
  getAspirantTotalsByElection,
  enterResultByElectionAndAspirant,
  enterResultByElectionAndWardAndAspirant,
  enterResultByElectionAndLgaAndAspirant,
  enterResultByElectionAndStateAndAspirant,
} from "../features/results/resultsApi";
import {
  selectElections,
  selectElectionsLoading,
  selectPollingUnitsCoverage,
  selectAspirantTotalsByElection,
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
import { checkIn, listPresence } from "../features/presence/presenceApi";
import { selectListPresence } from "../features/presence/presenceSelectors";
import {
  getAccreditedVotersByPollingUnit,
  enterAccreditedVotersByPollingUnit,
} from "../features/pollingUnits/pollingUnitApi";
import {
  startVotingAtPollingUnit,
  endVotingAtPollingUnit,
} from "../features/voting/votingApi";
import {
  selectAccreditedVotersByPollingUnit,
  selectAccreditedVotersByPollingUnitLoading,
} from "../features/pollingUnits/pollingUnitSelectors";
import "./Results.css";

type LocationRef = { _id?: string; name?: string } | string;
const getLocationId = (loc: LocationRef | undefined | null): string | null => {
  if (!loc) return null;
  return typeof loc === "object" ? (loc._id ?? null) ?? null : loc;
};
const getLocationName = (loc: { name?: string } | string | undefined) =>
  !loc ? "—" : typeof loc === "object" ? loc.name ?? "—" : loc;

const AGENT_ROLES = {
  presiding_officer_po_agent: "polling_unit",
  ra_ward_collation_officer_agent: "ward",
  lga_collation_officer_agent: "lga",
  state_constituency_returning_officer_agent: "state",
} as const;
const OVERVIEW_ROLES = ["regular", "executive", "superadmin"] as const;
const isOverviewRole = (r: string) => OVERVIEW_ROLES.includes(r as (typeof OVERVIEW_ROLES)[number]);
const getAgentLevel = (r: string): keyof typeof AGENT_ROLES | null =>
  r in AGENT_ROLES ? (r as keyof typeof AGENT_ROLES) : null;

type AspirantTotalsShape = {
  aspirants?: Array<{
    position?: number;
    positionLabel?: string;
    aspirant?: { _id?: string; name?: string };
    totalVotes?: number;
  }>;
};

function ElectionCoverageBadge({ electionId }: { electionId: string }) {
  const coverage = useSelector(selectPollingUnitsCoverage(electionId));
  if (!coverage || coverage.total === 0) return null;
  const pct = coverage.total > 0 ? ((coverage.entered / coverage.total) * 100).toFixed(2) : "0";
  const remaining = coverage.total - coverage.entered;
  const remainingPct = coverage.total > 0 ? (((remaining / coverage.total) * 100).toFixed(2)) : "0";
  return (
    <span className="results-election-card__coverage">
      {coverage.entered} out of {coverage.total} ({pct}%) — {remaining} remaining ({remainingPct}%)
    </span>
  );
}

/** Renders leading aspirant (position, name, votes) for overview roles. Same data source as Election Details modal. */
function ElectionLeadingBadge({
  aspirantTotals,
}: {
  aspirantTotals?: AspirantTotalsShape | null;
}) {
  const totalsList = aspirantTotals?.aspirants ?? [];
  if (totalsList.length === 0) return null;
  const leader = totalsList[0];
  const leaderVotes = leader?.totalVotes ?? 0;
  if (leaderVotes === 0) return null;
  const name = leader?.aspirant?.name ?? "—";
  const positionLabel = leader?.positionLabel ?? "1st";
  return (
    <span className="results-election-card__leading">
      Leading ({positionLabel}): {name} — {leaderVotes.toLocaleString()} votes
    </span>
  );
}

export default function Results() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const role = useSelector(selectRole) ?? "";
  const [expandedElectionId, setExpandedElectionId] = useState<string | null>(null);
  const [aspirantVotes, setAspirantVotes] = useState<Record<string, Record<string, string>>>({});
  const [accordionMessage, setAccordionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [accordionSavingId, setAccordionSavingId] = useState<string | null>(null);
  const [accordionSavingAll, setAccordionSavingAll] = useState(false);

  const [puElectionId, setPuElectionId] = useState("");
  const [accreditedCountInput, setAccreditedCountInput] = useState("");
  const [puMessage, setPuMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [puBusy, setPuBusy] = useState(false);
  const [showAccreditedModal, setShowAccreditedModal] = useState(false);
  const [showVoteStartConfirm, setShowVoteStartConfirm] = useState(false);
  const [showVoteEndConfirm, setShowVoteEndConfirm] = useState(false);

  const organizationId = (user as { organization?: { _id?: string; id?: string } })?.organization?._id
    ?? (user as { organization?: { _id?: string; id?: string } })?.organization?.id
    ?? "";

  const u = user as {
    pollingUnit?: LocationRef;
    ward?: LocationRef;
    lga?: LocationRef;
    state?: LocationRef;
  } | null;
  const agentLevel = getAgentLevel(role);
  const level = agentLevel ? AGENT_ROLES[agentLevel] : null;
  const locationIdForRole =
    level === "polling_unit"
      ? getLocationId(u?.pollingUnit)
      : level === "ward"
      ? getLocationId(u?.ward)
      : level === "lga"
      ? getLocationId(u?.lga)
      : level === "state"
      ? getLocationId(u?.state)
      : null;
  const isOverview = isOverviewRole(role);
  const showElectionsAccordion = !!agentLevel || isOverview;

  const electionsFromResults = useSelector(selectElections) ?? [];
  const electionsWithTotals = useSelector(
    selectElectionsByOrganizationId(organizationId ?? "", { includeResults: true })
  ) ?? [];
  const elections = isOverview ? electionsWithTotals : electionsFromResults;
  const electionsLoading = useSelector(selectElectionsLoading);

  useEffect(() => {
    dispatch(getElections());
    dispatch(getParties());
  }, [dispatch]);

  useEffect(() => {
    if (isOverview && organizationId) {
      dispatch(getElectionsByOrganizationId({ organizationId, query: { includeResults: true } }));
    }
  }, [dispatch, isOverview, organizationId]);

  useEffect(() => {
    if (expandedElectionId) {
      dispatch(getAspirantsByElection(expandedElectionId));
      dispatch(getAspirantTotalsByElection(expandedElectionId));
    }
  }, [dispatch, expandedElectionId]);

  const electionsList = (elections as Array<{ _id: string; name?: string; status?: string }>).filter(
    (e) => e.status === "active"
  );
  useEffect(() => {
    if (!puElectionId && electionsList.length > 0) {
      setPuElectionId(electionsList[0]._id);
    }
  }, [electionsList.length, puElectionId]);
  useEffect(() => {
    if (isOverview && electionsList.length > 0) {
      electionsList.forEach((el) => {
        dispatch(getPollingUnitsCoverage({ electionId: el._id }));
      });
    }
  }, [dispatch, isOverview, electionsList.map((e) => e._id).join(",")]);

  const isPO = level === "polling_unit";
  const puViewElectionId = puElectionId;
  const puViewPollingUnitId = isPO ? locationIdForRole : "";
  const puPresenceParams = puViewElectionId && puViewPollingUnitId
    ? { pollingUnitId: puViewPollingUnitId, electionId: puViewElectionId }
    : null;
  useEffect(() => {
    if (puPresenceParams) {
      dispatch(listPresence(puPresenceParams));
    }
  }, [dispatch, puPresenceParams?.pollingUnitId, puPresenceParams?.electionId]);
  useEffect(() => {
    if (organizationId && puViewElectionId && puViewPollingUnitId) {
      dispatch(
        getAccreditedVotersByPollingUnit({
          organizationId,
          pollingUnitId: puViewPollingUnitId,
          electionId: puViewElectionId,
        })
      );
    }
  }, [dispatch, organizationId, puViewElectionId, puViewPollingUnitId]);

  const presenceData = puPresenceParams
    ? useSelector(selectListPresence(puPresenceParams))
    : undefined;
  const presenceList = (presenceData?.presence ?? []) as Array<{ user?: { _id?: string } }>;
  const currentUserId = (user as { _id?: string })?._id;
  const hasMarkedPresence =
    !!currentUserId &&
    presenceList.some((p) => String(p.user?._id) === String(currentUserId));

  const accreditationData = organizationId && puViewElectionId && puViewPollingUnitId
    ? useSelector(
        selectAccreditedVotersByPollingUnit(
          organizationId,
          puViewPollingUnitId,
          puViewElectionId
        )
      )
    : undefined;
  const accreditationLoading = organizationId && puViewElectionId && puViewPollingUnitId
    ? useSelector(
        selectAccreditedVotersByPollingUnitLoading(
          organizationId,
          puViewPollingUnitId,
          puViewElectionId
        )
      )
    : false;
  const accreditedCount = accreditationData?.accreditedCount ?? null;
  const votingStartedAt = accreditationData?.accreditation?.votingStartedAt;
  const votingEndedAt = accreditationData?.accreditation?.votingEndedAt;

  useEffect(() => {
    if (accreditedCount != null && accreditedCountInput === "")
      setAccreditedCountInput(String(accreditedCount));
  }, [accreditedCount]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAccreditedModal(false);
        setShowVoteStartConfirm(false);
        setShowVoteEndConfirm(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const handleMarkPresence = async () => {
    if (!locationIdForRole || !puElectionId) return;
    setPuBusy(true);
    setPuMessage(null);
    try {
      await dispatch(checkIn({ pollingUnitId: locationIdForRole, electionId: puElectionId })).unwrap();
      setPuMessage({ type: "success", text: "Presence marked. You can now enter accredited voters and use Vote started/ended." });
      if (puPresenceParams) dispatch(listPresence(puPresenceParams));
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "data" in err
        ? (err as { data?: { message?: string } }).data?.message
        : "Failed to mark presence.";
      setPuMessage({ type: "error", text: String(msg) });
    } finally {
      setPuBusy(false);
    }
  };

  const handleEnterAccreditedVoters = async () => {
    if (!organizationId || !(puViewPollingUnitId ?? locationIdForRole) || !puElectionId) return;
    const v = parseInt(accreditedCountInput.trim(), 10);
    if (isNaN(v) || v < 0) {
      setPuMessage({ type: "error", text: "Enter a non-negative number for accredited voters." });
      return;
    }
    setPuBusy(true);
    setPuMessage(null);
    try {
      await dispatch(
        enterAccreditedVotersByPollingUnit({
          organizationId,
          pollingUnitId: puViewPollingUnitId ?? locationIdForRole ?? "",
          electionId: puElectionId,
          accreditedCount: v,
        })
      ).unwrap();
      setPuMessage({ type: "success", text: "Accredited voters saved." });
      setShowAccreditedModal(false);
      dispatch(
        getAccreditedVotersByPollingUnit({
          organizationId,
          pollingUnitId: puViewPollingUnitId ?? locationIdForRole ?? "",
          electionId: puElectionId,
        })
      );
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "data" in err
        ? (err as { data?: { message?: string } }).data?.message
        : "Failed to save accredited voters.";
      setPuMessage({ type: "error", text: String(msg) });
    } finally {
      setPuBusy(false);
    }
  };

  const handleVoteStarted = async () => {
    if (!organizationId || !locationIdForRole || !puElectionId) return;
    setPuBusy(true);
    setPuMessage(null);
    try {
      await dispatch(
        startVotingAtPollingUnit({
          organizationId,
          pollingUnitId: locationIdForRole,
          electionId: puElectionId,
        })
      ).unwrap();
      setPuMessage({ type: "success", text: "Vote started recorded." });
      dispatch(
        getAccreditedVotersByPollingUnit({
          organizationId,
          pollingUnitId: locationIdForRole,
          electionId: puElectionId,
        })
      );
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "data" in err
        ? (err as { data?: { message?: string } }).data?.message
        : "Failed to record vote started.";
      setPuMessage({ type: "error", text: String(msg) });
    } finally {
      setPuBusy(false);
    }
  };

  const handleVoteEnded = async () => {
    if (!organizationId || !locationIdForRole || !puElectionId) return;
    setPuBusy(true);
    setPuMessage(null);
    try {
      await dispatch(
        endVotingAtPollingUnit({
          organizationId,
          pollingUnitId: locationIdForRole,
          electionId: puElectionId,
        })
      ).unwrap();
      setPuMessage({ type: "success", text: "Vote ended recorded." });
      dispatch(
        getAccreditedVotersByPollingUnit({
          organizationId,
          pollingUnitId: locationIdForRole,
          electionId: puElectionId,
        })
      );
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "data" in err
        ? (err as { data?: { message?: string } }).data?.message
        : "Failed to record vote ended.";
      setPuMessage({ type: "error", text: String(msg) });
    } finally {
      setPuBusy(false);
    }
  };

  const handleAccordionToggle = (id: string) => {
    setExpandedElectionId((prev) => (prev === id ? null : id));
    setAccordionMessage(null);
    if (isOverview && id) dispatch(getPollingUnitsCoverage({ electionId: id }));
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

  const enterResultThunk = (params: { electionId: string; aspirantId: string; votes: number }) => {
    if (level === "polling_unit" && locationIdForRole) {
      return enterResultByElectionAndAspirant({
        electionId: params.electionId,
        pollingUnitId: locationIdForRole,
        aspirantId: params.aspirantId,
        votes: params.votes,
      });
    }
    if (level === "ward" && locationIdForRole) {
      return enterResultByElectionAndWardAndAspirant({
        electionId: params.electionId,
        wardId: locationIdForRole,
        aspirantId: params.aspirantId,
        votes: params.votes,
      });
    }
    if (level === "lga" && locationIdForRole) {
      return enterResultByElectionAndLgaAndAspirant({
        electionId: params.electionId,
        lgaId: locationIdForRole,
        aspirantId: params.aspirantId,
        votes: params.votes,
      });
    }
    if (level === "state" && locationIdForRole) {
      return enterResultByElectionAndStateAndAspirant({
        electionId: params.electionId,
        stateId: locationIdForRole,
        aspirantId: params.aspirantId,
        votes: params.votes,
      });
    }
    throw new Error("No result entry API for your role.");
  };

  const handleSaveAspirantResult = async (electionId: string, aspirantId: string) => {
    if (!locationIdForRole) {
      setAccordionMessage({
        type: "error",
        text: `Your account is not assigned to a ${level ?? "location"}.`,
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
        enterResultThunk({ electionId, aspirantId, votes }) as ReturnType<typeof enterResultByElectionAndAspirant>
      ).unwrap();
      setAccordionMessage({ type: "success", text: "Result saved successfully." });
      if (isOverview) dispatch(getPollingUnitsCoverage({ electionId }));
      dispatch(getAspirantTotalsByElection(electionId));
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
          : "Failed to save result.";
      setAccordionMessage({ type: "error", text: String(msg) });
    } finally {
      setAccordionSavingId(null);
    }
  };

  const handleSaveAllAspirantResults = async (electionId: string) => {
    if (!locationIdForRole) {
      setAccordionMessage({
        type: "error",
        text: `Your account is not assigned to a ${level ?? "location"}.`,
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
          enterResultThunk({ electionId, aspirantId, votes: v }) as ReturnType<typeof enterResultByElectionAndAspirant>
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
          : `All ${ok} result(s) saved successfully.`,
      });
      if (isOverview) dispatch(getPollingUnitsCoverage({ electionId }));
      dispatch(getAspirantTotalsByElection(electionId));
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
  const expandedAspirantTotals = useSelector(
    selectAspirantTotalsByElection(expandedElectionId ?? "")
  ) as AspirantTotalsShape | undefined;

  return (
    <div className="results-page">
      <div>
        <p className="results-page__breadcrumb">EMS / Results</p>
        <h1 className="results-page__title">Enter Results</h1>
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
          <span className="results-polling-unit__label">
            {level === "polling_unit" ? "Polling Unit" : level === "ward" ? "Ward" : level === "lga" ? "LGA" : level === "state" ? "State" : "Assigned location"}
          </span>
          <span className="results-polling-unit__value">
            {level === "polling_unit" ? getLocationName(u?.pollingUnit) : level === "ward" ? getLocationName(u?.ward) : level === "lga" ? getLocationName(u?.lga) : level === "state" ? getLocationName(u?.state) : "—"}
          </span>
        </div>
      </div>

      {((isPO && locationIdForRole) || isOverview) && organizationId && (
        <div className="results-card results-pu-upper">
          <h2 className="results-card__heading">Polling Unit – Voting - Presence - Accreditation</h2>
          
          
          {!puElectionId && isPO ? (
            <p className="results-view__empty" style={{ margin: 0 }}>Select an election to continue.</p>
          ) : (
            <>
             
              <div className="results-pu-cards">
                {!hasMarkedPresence && isPO ? (
                  <div className="results-pu-card">
                    <span className="results-pu-card__label">Mark presence</span>
                    <p className="results-pu-card__hint">You must mark presence before other actions.</p>
                    <button
                      type="button"
                      className="results-btn results-btn--primary"
                      onClick={handleMarkPresence}
                      disabled={puBusy}
                    >
                      {puBusy ? "Marking…" : "Mark presence"}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="results-pu-card results-pu-card--presence">
                      <span className="results-pu-card__label">Presence</span>
                      <span className="results-pu-card__value">{presenceList.length}</span>
                      <span className="results-pu-card__sublabel">Users at polling unit</span>
                    </div>
                    <button
                      type="button"
                      className={`results-pu-card results-pu-card--clickable ${isOverview ? "results-pu-card--disabled" : ""}`}
                      onClick={() => {
                if (!isOverview) {
                  setAccreditedCountInput(accreditedCount != null ? String(accreditedCount) : "");
                  setShowAccreditedModal(true);
                }
              }}
                      disabled={isOverview}
                    >
                      <span className="results-pu-card__label">Accredited voters</span>
                      <span className="results-pu-card__value">{accreditedCount ?? "—"}</span>
                      <span className="results-pu-card__sublabel">{isOverview ? "View only" : "Click to enter"}</span>
                    </button>
                    <button
                      type="button"
                      className={`results-pu-card results-pu-card--clickable ${votingStartedAt ? "results-pu-card--done" : ""} ${(puBusy || !!votingStartedAt || isOverview) ? "results-pu-card--disabled" : ""}`}
                      onClick={() => !puBusy && !votingStartedAt && !isOverview && setShowVoteStartConfirm(true)}
                      disabled={puBusy || !!votingStartedAt || isOverview}
                    >
                      <span className="results-pu-card__label">Voting started</span>
                      <span className="results-pu-card__value">{votingStartedAt ? "✓ Recorded" : "—"}</span>
                      <span className="results-pu-card__sublabel">{votingStartedAt ? "Completed" : "Click to record"}</span>
                    </button>
                    <button
                      type="button"
                      className={`results-pu-card results-pu-card--clickable ${votingEndedAt ? "results-pu-card--done" : ""} ${(puBusy || !!votingEndedAt || isOverview) ? "results-pu-card--disabled" : ""}`}
                      onClick={() => !puBusy && !votingEndedAt && !isOverview && setShowVoteEndConfirm(true)}
                      disabled={puBusy || !!votingEndedAt || isOverview}
                    >
                      <span className="results-pu-card__label">Voting ended</span>
                      <span className="results-pu-card__value">{votingEndedAt ? "✓ Recorded" : "—"}</span>
                      <span className="results-pu-card__sublabel">{votingEndedAt ? "Completed" : "Click to record"}</span>
                    </button>
                  </>
                )}
              </div>
              {puMessage && (
                <div className={`results-message results-message--${puMessage.type}`} style={{ marginTop: "1rem" }}>
                  {puMessage.text}
                </div>
              )}
            </>
          )}

          {showAccreditedModal && (
            <div
              className="results-modal-backdrop"
              role="dialog"
              aria-modal="true"
              aria-labelledby="accredited-modal-title"
              onClick={() => setShowAccreditedModal(false)}
            >
              <div className="results-modal" onClick={(e) => e.stopPropagation()}>
                <h3 id="accredited-modal-title" className="results-modal__title">Enter accredited voters</h3>
                <p className="results-modal__subtitle">Enter the number of accredited voters at your polling unit.</p>
                <div className="results-modal__field">
                  <label htmlFor="accredited-modal-input" className="results-form__label">Number of accredited voters</label>
                  <input
                    id="accredited-modal-input"
                    type="number"
                    min={0}
                    className="results-form__input"
                    value={accreditedCountInput}
                    onChange={(e) => setAccreditedCountInput(e.target.value)}
                    placeholder={accreditedCount != null ? String(accreditedCount) : "0"}
                  />
                </div>
                <div className="results-modal__actions">
                  <button type="button" className="results-btn results-btn--outline" onClick={() => setShowAccreditedModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="results-btn results-btn--primary"
                    onClick={() => handleEnterAccreditedVoters()}
                    disabled={puBusy || accreditationLoading}
                  >
                    {puBusy ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showVoteStartConfirm && (
            <div
              className="results-modal-backdrop"
              role="alertdialog"
              aria-modal="true"
              onClick={() => setShowVoteStartConfirm(false)}
            >
              <div className="results-modal results-modal--warning" onClick={(e) => e.stopPropagation()}>
                <h3 className="results-modal__title">Record voting started?</h3>
                <p className="results-modal__subtitle">You are about to record that voting has started at this polling unit. This action cannot be undone. Do you want to proceed?</p>
                <div className="results-modal__actions">
                  <button type="button" className="results-btn results-btn--outline" onClick={() => setShowVoteStartConfirm(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="results-btn results-btn--primary"
                    onClick={async () => {
                      setShowVoteStartConfirm(false);
                      await handleVoteStarted();
                    }}
                    disabled={puBusy}
                  >
                    {puBusy ? "Recording…" : "Yes, record voting started"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showVoteEndConfirm && (
            <div
              className="results-modal-backdrop"
              role="alertdialog"
              aria-modal="true"
              onClick={() => setShowVoteEndConfirm(false)}
            >
              <div className="results-modal results-modal--warning" onClick={(e) => e.stopPropagation()}>
                <h3 className="results-modal__title">Record voting ended?</h3>
                <p className="results-modal__subtitle">You are about to record that voting has ended at this polling unit. This action cannot be undone. Do you want to proceed?</p>
                <div className="results-modal__actions">
                  <button type="button" className="results-btn results-btn--outline" onClick={() => setShowVoteEndConfirm(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="results-btn results-btn--primary"
                    onClick={async () => {
                      setShowVoteEndConfirm(false);
                      await handleVoteEnded();
                    }}
                    disabled={puBusy}
                  >
                    {puBusy ? "Recording…" : "Yes, record voting ended"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showElectionsAccordion && (isPO ? hasMarkedPresence && puElectionId : true) && (
      <div className="results-card results-elections-section">
        <h2 className="results-card__heading">Elections</h2>
        <p className="results-elections-section__hint">
          {isOverview
            ? "Click an election card to expand and view results. Result entry is disabled for your role."
            : `Click an election card to expand and enter results for each aspirant. Results are saved for your assigned ${level ?? "location"}.`}
        </p>
        {!isOverview && !locationIdForRole && (
          <p className="results-message results-message--error" style={{ marginBottom: "1rem" }}>
            Your account is not assigned to a {level ?? "location"}. Contact an administrator.
          </p>
        )}
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
            <div key={el._id} className="results-election-card">
              <button
                type="button"
                className={`results-election-card__header ${expandedElectionId === el._id ? "results-election-card__header--open" : ""}`}
                onClick={() => handleAccordionToggle(el._id)}
              >
                <div className="results-election-card__header-main">
                  <div className="results-election-card__header-top">
                    <span className="results-election-card__title">{el.name}</span>
                    {isOverview && (
                      <span className="results-election-card__header-coverage">
                        <ElectionCoverageBadge electionId={el._id} />
                      </span>
                    )}
                  </div>
                  {isOverview && (
                    <div className="results-election-card__header-meta">
                      <ElectionLeadingBadge aspirantTotals={(el as { aspirantTotals?: AspirantTotalsShape }).aspirantTotals} />
                    </div>
                  )}
                </div>
                <span className="results-election-card__chevron">
                  {expandedElectionId === el._id ? "▼" : "▶"}
                </span>
              </button>
              {expandedElectionId === el._id && (
                <div className="results-election-card__body">
                  {expandedAspirantsLoading ? (
                    <p className="results-view__empty" style={{ margin: 0 }}>Loading aspirants…</p>
                  ) : !expandedAspirants?.length ? (
                    <p className="results-view__empty" style={{ margin: 0 }}>No aspirants for this election.</p>
                  ) : (
                    <>
                      <div className="results-aspirants-list">
                        {expandedAspirants.map((a) => {
                          const aspirantTotalsForCard = el._id === expandedElectionId
                            ? (isOverview ? (el as { aspirantTotals?: AspirantTotalsShape }).aspirantTotals : expandedAspirantTotals)
                            : undefined;
                          const totalsEntry = aspirantTotalsForCard?.aspirants?.find(
                            (t) => String(t.aspirant?._id) === String(a._id)
                          );
                          const positionLabel = totalsEntry?.positionLabel ?? null;
                          const totalVotes = totalsEntry?.totalVotes ?? 0;
                          return (
                          <div key={a._id} className="results-aspirant-row">
                            <div className="results-aspirant-row__info">
                              {(a.partyCode || a.party?.acronym) && (
                                <span className="results-aspirant-row__party">
                                  {(a.partyCode ?? a.party?.acronym ?? "").toUpperCase()}
                                </span>
                              )}
                              <span className="results-aspirant-row__name">{a.name}</span>
                            </div>
                            <div className="results-aspirant-row__actions">
                              {(positionLabel != null || totalVotes > 0) && (
                                <div className="results-aspirant-row__meta">
                                  {positionLabel && (
                                    <span className="results-aspirant-row__position">{positionLabel}</span>
                                  )}
                                  <span className="results-aspirant-row__votes">
                                    {totalVotes.toLocaleString()} votes
                                  </span>
                                </div>
                              )}
                              <input
                                type="number"
                                min={0}
                                className="results-table__votes-input"
                                placeholder="0"
                                value={aspirantVotes[el._id]?.[a._id] ?? ""}
                                onChange={(e) => handleAspirantVoteChange(el._id, a._id, e.target.value)}
                                readOnly={isOverview}
                              />
                              <button
                                type="button"
                                className="results-table__save-btn"
                                onClick={() => handleSaveAspirantResult(el._id, a._id)}
                                disabled={accordionSavingId === a._id || accordionSavingAll || isOverview}
                              >
                                {accordionSavingId === a._id ? "Saving…" : "Save"}
                              </button>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                      <div className="results-actions" style={{ marginTop: "1rem" }}>
                        <button
                          type="button"
                          className="results-btn results-btn--primary"
                          onClick={() => handleSaveAllAspirantResults(el._id)}
                          disabled={accordionSavingAll || accordionSavingId !== null || isOverview}
                        >
                          {accordionSavingAll ? "Saving…" : "Save all"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {electionsList.length === 0 && !electionsLoading && (
          <p className="results-view__empty">No elections found.</p>
        )}
      </div>
      )}
    </div>
  );
}
