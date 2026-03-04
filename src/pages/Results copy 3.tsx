import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../app/store";
import {
  getElections,
  getParties,
  getPollingUnitsCoverage,
  getAspirantTotalsByElection,
  getResultsByElectionAndPollingUnit,
  getResultsByElectionAndWard,
  getResultsByElectionAndLga,
  getResultsByElectionAndState,
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
  selectResultsByPollingUnit,
  selectWardCollation,
  selectLgaCollation,
  selectStateCollation,
  selectParties,
} from "../features/results/resultsSelectors";
import { getElectionsByOrganizationId } from "../features/elections/electionApi";
import { selectElectionsByOrganizationId } from "../features/elections/electionSelectors";
import {
  getAspirantsByElection,
  selectAspirantsByElection,
  selectAspirantsByElectionLoading,
} from "../features/aspirants";
import { selectRole } from "../features/auth/authSelectors";
import { checkIn, listPresence } from "../features/presence/presenceApi";
import { selectListPresence } from "../features/presence/presenceSelectors";
import { clearCacheEntry } from "../features/presence/presenceSlice";
import {
  getAccreditedVotersByPollingUnit,
  enterAccreditedVotersByPollingUnit,
  startAccreditationAtPollingUnit,
  endAccreditationAtPollingUnit,
  getAllAccreditationByOrganization,
  getOverVotingByOrganization,
} from "../features/pollingUnits/pollingUnitApi";
import {
  startVotingAtPollingUnit,
  endVotingAtPollingUnit,
} from "../features/voting/votingApi";
import {
  selectAccreditedVotersByPollingUnit,
  selectAccreditedVotersByPollingUnitLoading,
  selectAllAccreditationByOrganization,
  selectOverVotingByOrganization,
  selectOverVotingByOrganizationLoading,
} from "../features/pollingUnits/pollingUnitSelectors";
import {
  uploadResultSheetByPollingUnit,
  getSheetsByElectionAndPollingUnit,
} from "../features/resultSheets/resultSheetApi";
import { selectSheetsByElectionAndPollingUnit } from "../features/resultSheets/resultSheetSelectors";
import { usePresenceSocket } from "../hooks/usePresenceSocket";
import { useResultSocket } from "../hooks/useResultSocket";
import {
  createReport,
  REPORT_CATEGORIES,
  REPORT_CATEGORY_LABELS,
  REPORT_ITEMS_BY_CATEGORY,
  type ReportCategory,
} from "../features/reports/reportApi";
import {
  getMyMessages,
  getMessageById,
  replyToMessage,
  markRead,
  clearOpenMessage,
  clearReplyError,
  selectInbox,
  selectInboxLoading,
  selectUnreadCount,
  selectOpenMessage,
  selectOpenMessageLoading,
  selectReplyLoading,
  selectReplyError,
} from "../features/messages";
import "./Results.css";

/* Icons for polling unit and election cards */
const IconLocation = () => (
  <svg
    className="results-pu-card__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconClipboard = () => (
  <svg
    className="results-pu-card__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);
const IconPlay = () => (
  <svg
    className="results-pu-card__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);
const IconFlag = () => (
  <svg
    className="results-pu-card__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);
const IconUserPlus = () => (
  <svg
    className="results-pu-card__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);
const IconCheckCircle = () => (
  <svg
    className="results-pu-card__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const IconAlertTriangle = () => (
  <svg
    className="results-pu-card__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconChevronDown = () => (
  <svg
    className="results-election-card__chevron"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);
const IconChevronRight = () => (
  <svg
    className="results-election-card__chevron"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const ordinalSuffix = (d: number): string => {
  const s = ["th", "st", "nd", "rd"];
  const v = d % 100;
  return d + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
};
const formatSheetDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = ordinalSuffix(d.getDate());
  const month = d.toLocaleString("en-GB", { month: "long" });
  const year = d.getFullYear();
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${day} ${month} ${year}, ${hour12}:${minutes}${ampm}`;
};

type LocationRef = { _id?: string; name?: string } | string;
const getLocationId = (loc: LocationRef | undefined | null): string | null => {
  if (!loc) return null;
  return typeof loc === "object" ? (loc._id ?? null) : loc;
};
const getLocationName = (loc: { name?: string } | string | undefined) =>
  !loc ? "—" : typeof loc === "object" ? (loc.name ?? "—") : loc;

const ROLE_LABELS: Record<string, string> = {
  regular: "Regular",
  superadmin: "Super Admin",
  executive: "Executive",
  presiding_officer_po_agent: "Presiding Officer (PO) Agent",
  ra_ward_collation_officer_agent: "RA / Ward Collation Officer Agent",
  lga_collation_officer_agent: "LGA Collation Officer Agent",
  state_constituency_returning_officer_agent:
    "State Constituency Returning Officer Agent",
  federal_constituency_returning_officer_agent:
    "Federal Constituency Returning Officer Agent",
  senatorial_district_agent: "Senatorial District Agent",
  state_returning_officer_agent: "State Returning Officer Agent",
  national_level_agent: "National Level Agent",
};

const AGENT_ROLES = {
  presiding_officer_po_agent: "polling_unit",
  ra_ward_collation_officer_agent: "ward",
  lga_collation_officer_agent: "lga",
  state_constituency_returning_officer_agent: "state",
} as const;
const getAgentLevel = (r: string): keyof typeof AGENT_ROLES | null =>
  r in AGENT_ROLES ? (r as keyof typeof AGENT_ROLES) : null;

type AspirantTotalsShape = {
  aspirants?: Array<{
    position?: number;
    positionLabel?: string;
    aspirant?: {
      _id?: string;
      name?: string;
      partyCode?: string;
      party?: { acronym?: string; logo?: string; color?: string };
    };
    totalVotes?: number;
  }>;
};

function ElectionCoverageBadge({ electionId }: { electionId: string }) {
  const coverage = useSelector(selectPollingUnitsCoverage(electionId));
  if (!coverage || coverage.total === 0) return null;
  const pct = ((coverage.entered / coverage.total) * 100).toFixed(1);
  const remaining = coverage.total - coverage.entered;
  return (
    <span className="results-election-card__coverage">
      {coverage.entered} of {coverage.total} PUs ({pct}%) — {remaining}{" "}
      remaining
    </span>
  );
}

type PoCollationResult = {
  _id: string;
  votes: number;
  aspirant: { _id: string; name: string; partyCode?: string };
};

function ElectionLeadingBadge({
  electionId,
  aspirantTotals,
  collationResults,
  parties,
  isViewOnly,
}: {
  electionId: string;
  aspirantTotals?: AspirantTotalsShape | null;
  collationResults?: PoCollationResult[];
  parties?: Array<{ acronym?: string; logo?: string; color?: string }>;
  isViewOnly: boolean;
}) {
  // Full aspirant docs (with party.logo) fetched for every election on page load
  const fullAspirants = useSelector(selectAspirantsByElection(electionId)) as
    | Array<{
        _id: string;
        name: string;
        partyCode?: string;
        party?: {
          name?: string;
          acronym?: string;
          logo?: string;
          color?: string;
        };
      }>
    | undefined;

  const resolveParty = (
    aspirantId?: string,
    partyCode?: string,
    partyObj?: { acronym?: string; logo?: string; color?: string },
  ) => {
    // First try the full aspirant doc which has the populated party.logo
    if (aspirantId && fullAspirants?.length) {
      const full = fullAspirants.find(
        (a) => String(a._id) === String(aspirantId),
      );
      if (full?.party?.logo)
        return {
          logo: full.party.logo,
          color: full.party.color ?? "#111827",
          code: (
            full.partyCode ??
            full.party.acronym ??
            partyCode ??
            ""
          ).toUpperCase(),
        };
    }
    // Fallback: embedded party object on aspirantTotals entry
    if (partyObj?.logo)
      return {
        logo: partyObj.logo,
        color: partyObj.color ?? "#111827",
        code: (partyObj.acronym ?? partyCode ?? "").toUpperCase(),
      };
    // Fallback: scan the parties list by acronym/partyCode
    const code = (partyCode ?? "").toUpperCase();
    const found = code
      ? (parties ?? []).find((p) => (p.acronym ?? "").toUpperCase() === code)
      : undefined;
    return {
      logo: found?.logo ?? null,
      color: found?.color ?? "#111827",
      code,
    };
  };

  const renderLogo = (logo: string | null, color: string, code: string) => {
    if (logo) {
      return (
        <img src={logo} alt={code} className="results-leading-badge__logo" />
      );
    }
    if (code) {
      return (
        <span
          className="results-leading-badge__logo results-leading-badge__logo--initials"
          style={{ background: color }}
        >
          {code.charAt(0)}
        </span>
      );
    }
    return null;
  };

  // PO agents: only show leading from their own polling-unit collation.
  // If they haven't entered any results yet, show nothing — never leak another PU's data.
  if (!isViewOnly) {
    if (!collationResults || collationResults.length === 0) return null;
    const sorted = [...collationResults]
      .filter((r) => (r.votes ?? 0) > 0)
      .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
    const leader = sorted[0];
    if (!leader) return null;
    const rawPartyCode = (leader.aspirant?.partyCode ?? "").toUpperCase();
    const { logo, color, code } = resolveParty(
      leader.aspirant?._id,
      rawPartyCode,
    );
    return (
      <span className="results-election-card__leading">
        {renderLogo(logo, color, code)}
        Leading: {leader.aspirant?.name ?? "—"} ({code}) —{" "}
        {leader.votes.toLocaleString()} votes
      </span>
    );
  }

  // Overview roles (regular / executive / superadmin): use org-wide aspirantTotals.
  const totalsList = aspirantTotals?.aspirants ?? [];
  if (totalsList.length > 0) {
    const leader = totalsList[0];
    const leaderVotes = leader?.totalVotes ?? 0;
    if (leaderVotes > 0) {
      const name = leader?.aspirant?.name ?? "—";
      const positionLabel = leader?.positionLabel ?? "1st";
      const rawPartyCode = (
        leader?.aspirant?.partyCode ??
        (leader?.aspirant?.party as unknown as { acronym?: string })?.acronym ??
        ""
      ).toUpperCase();
      const { logo, color, code } = resolveParty(
        leader?.aspirant?._id,
        rawPartyCode,
        leader?.aspirant?.party as
          | { acronym?: string; logo?: string; color?: string }
          | undefined,
      );
      return (
        <span className="results-election-card__leading">
          {renderLogo(logo, color, code)}
          Leading ({positionLabel}): {name} — {leaderVotes.toLocaleString()}{" "}
          votes
        </span>
      );
    }
  }
  return null;
}

function PoElectionCard({
  el,
  pollingUnitId,
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
  onUpload,
  parties,
  role,
  level,
  locationId,
}: {
  el: {
    _id: string;
    name: string;
    status?: string;
    aspirantTotals?: AspirantTotalsShape;
  };
  pollingUnitId: string;
  expandedElectionId: string | null;
  onToggle: (id: string) => void;
  expandedAspirants:
    | Array<{
        _id: string;
        name: string;
        partyCode?: string;
        party?: {
          name?: string;
          acronym?: string;
          logo?: string;
          color?: string;
        };
      }>
    | undefined;
  expandedAspirantsLoading: boolean;
  aspirantVotes: Record<string, Record<string, string>>;
  accordionSavingId: string | null;
  accordionSavingAll: boolean;
  onVoteChange: (electionId: string, aspirantId: string, value: string) => void;
  onSave: (electionId: string, aspirantId: string) => void;
  onSaveAll: (electionId: string) => void;
  onUpload: (
    electionId: string,
    pollingUnitId: string,
    file: File,
  ) => Promise<void>;
  parties?: Array<{ acronym?: string; logo?: string; color?: string }>;
  role?: string;
  level?: string | null;
  locationId?: string | null;
}) {
  const dispatch = useDispatch<AppDispatch>();

  // Sheet upload busy state per election
  const [uploadingSheet, setUploadingSheet] = useState(false);
  const [uploadSheetMsg, setUploadSheetMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const aspirantTotalsFromStore = useSelector(
    selectAspirantTotalsByElection(el._id),
  ) as AspirantTotalsShape | undefined;
  const aspirantTotals = (
    aspirantTotalsFromStore?.aspirants?.length
      ? aspirantTotalsFromStore
      : el.aspirantTotals
  ) as AspirantTotalsShape | undefined;

  // PU-level collation (polling_unit agent)
  const puCollationData = useSelector(
    selectResultsByPollingUnit(
      el._id,
      level === "polling_unit" ? (locationId ?? pollingUnitId) : pollingUnitId,
    ),
  );
  // Ward-level collation
  const wardCollationData = useSelector(
    selectWardCollation(el._id, level === "ward" ? (locationId ?? "") : ""),
  );
  // LGA-level collation
  const lgaCollationData = useSelector(
    selectLgaCollation(el._id, level === "lga" ? (locationId ?? "") : ""),
  );
  // State-level collation
  const stateCollationData = useSelector(
    selectStateCollation(el._id, level === "state" ? (locationId ?? "") : ""),
  );

  // Pick the right collation source based on level
  const collationResults: PoCollationResult[] = (() => {
    if (level === "ward")
      return (wardCollationData?.results ?? []) as PoCollationResult[];
    if (level === "lga")
      return (lgaCollationData?.results ?? []) as PoCollationResult[];
    if (level === "state")
      return (stateCollationData?.results ?? []) as PoCollationResult[];
    // default: polling_unit
    return (puCollationData?.results ?? []) as PoCollationResult[];
  })();

  // Existing uploaded sheets for this election + polling unit (used by PO agent)
  const existingSheets = useSelector(
    selectSheetsByElectionAndPollingUnit(el._id, pollingUnitId),
  ) as Array<{ _id: string; fileUrl?: string; createdAt?: string }> | undefined;
  const hasUploadedSheet = (existingSheets?.length ?? 0) > 0;

  const coverage = useSelector(selectPollingUnitsCoverage(el._id));

  const isExpanded = expandedElectionId === el._id;

  const getCollationEntry = (aspirantId: string) =>
    collationResults.find(
      (r) => String(r.aspirant?._id) === String(aspirantId),
    );

  // Overview roles (regular, executive, superadmin) can only VIEW results, not enter them
  const isViewOnly =
    role === "regular" || role === "executive" || role === "superadmin";

  const totalFromCollation = collationResults.reduce(
    (sum, r) => sum + (r.votes ?? 0),
    0,
  );
  const totalFromAggregated = (aspirantTotals?.aspirants ?? []).reduce(
    (sum, a) => sum + (a.totalVotes ?? 0),
    0,
  );
  // PO agents: only show their own PU total — never show the org-wide aggregate.
  // Overview roles: fall back to org-wide aggregate when no PU collation exists.
  const totalSubmitted = isViewOnly
    ? totalFromCollation > 0
      ? totalFromCollation
      : totalFromAggregated
    : totalFromCollation;

  // aspirantPollingUnitWins is org-wide — only meaningful for overview roles.
  const topPuWinner = isViewOnly
    ? (coverage?.aspirantPollingUnitWins?.[0] ?? null)
    : null;
  const leadingPollingUnitWins = topPuWinner?.pollingUnitsWon ?? null;

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
            {isViewOnly && (
              <span className="results-election-card__header-coverage">
                <ElectionCoverageBadge electionId={el._id} />
              </span>
            )}
          </div>
          <div className="results-election-card__header-meta results-election-card__header-meta--spaced">
            <ElectionLeadingBadge
              electionId={el._id}
              aspirantTotals={aspirantTotals}
              collationResults={collationResults}
              parties={parties}
              isViewOnly={isViewOnly}
            />
            {(totalSubmitted > 0 || leadingPollingUnitWins !== null) && (
              <span className="results-election-card__total-votes results-election-card__total-votes--right">
                {totalSubmitted > 0 && (
                  <>Total PU votes: {totalSubmitted.toLocaleString()}</>
                )}
                {leadingPollingUnitWins !== null && (
                  <span className="results-election-card__ward-wins">
                    {totalSubmitted > 0 && <>&nbsp;·&nbsp;</>}
                    Winning {leadingPollingUnitWins} PU
                    {leadingPollingUnitWins !== 1 ? "s" : ""}
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
            <p className="results-view__empty" style={{ margin: 0 }}>
              Loading aspirants…
            </p>
          ) : !expandedAspirants?.length ? (
            <p className="results-view__empty" style={{ margin: 0 }}>
              No aspirants for this election.
            </p>
          ) : (
            <>
              <div className="results-aspirants-list">
                {expandedAspirants.map((a) => {
                  // Overview roles always see leading; PO agents see leading once they have entered results.
                  const canSeeLeading =
                    role === "regular" ||
                    role === "executive" ||
                    role === "superadmin" ||
                    (role === "presiding_officer_po_agent" &&
                      collationResults.length > 0);
                  const totalsEntry = aspirantTotals?.aspirants?.find(
                    (t) => String(t.aspirant?._id) === String(a._id),
                  );
                  const collationEntry = getCollationEntry(a._id);
                  // submittedVotes must come ONLY from this user's own polling-unit collation entry.
                  // totalsEntry.totalVotes is an org-wide aggregate across all polling units — using it
                  // here would show another PU's result as "Saved" and lock this user's input field.
                  const submittedVotes = collationEntry?.votes ?? null;

                  // positionLabel: for PO agents derive rank from this PU's own collation results.
                  // For overview roles use the org-wide positionLabel from aspirantTotals.
                  const positionLabel = isViewOnly
                    ? (totalsEntry?.positionLabel ?? null)
                    : (() => {
                        if (collationResults.length === 0) return null;
                        const sorted = [...collationResults]
                          .filter((r) => (r.votes ?? 0) > 0)
                          .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
                        const rank = sorted.findIndex(
                          (r) => String(r.aspirant?._id) === String(a._id),
                        );
                        if (rank === -1) return null;
                        const ordinals = [
                          "1st",
                          "2nd",
                          "3rd",
                          "4th",
                          "5th",
                          "6th",
                          "7th",
                          "8th",
                          "9th",
                          "10th",
                        ];
                        return ordinals[rank] ?? `${rank + 1}th`;
                      })();
                  const partyCode = (
                    a.partyCode ??
                    a.party?.acronym ??
                    collationEntry?.aspirant?.partyCode ??
                    ""
                  ).toUpperCase();
                  const partyFromList = partyCode
                    ? (parties ?? []).find(
                        (p) => (p.acronym ?? "").toUpperCase() === partyCode,
                      )
                    : undefined;
                  const partyLogo =
                    a.party?.logo ?? partyFromList?.logo ?? null;
                  const partyColor =
                    a.party?.color ?? partyFromList?.color ?? "#111827";
                  // Leading highlight: use org-wide votes for overview roles, own PU votes for PO agents.
                  const myVotes = isViewOnly
                    ? (totalsEntry?.totalVotes ?? 0)
                    : (submittedVotes ?? 0);
                  const maxVotesInElection = Math.max(
                    0,
                    ...(aspirantTotals?.aspirants ?? []).map(
                      (t) => t.totalVotes ?? 0,
                    ),
                    ...collationResults.map((r) => r.votes ?? 0),
                  );
                  const isLeading =
                    canSeeLeading &&
                    myVotes > 0 &&
                    myVotes >= maxVotesInElection &&
                    (positionLabel === "1st" || positionLabel === null);

                  const isFirst = positionLabel === "1st";

                  return (
                    <div
                      key={a._id}
                      className={`results-aspirant-row${submittedVotes !== null ? " results-aspirant-row--submitted" : ""}${isLeading ? " results-aspirant-row--leading" : ""}${isFirst && !isLeading ? " results-aspirant-row--first" : ""}`}
                    >
                      <div className="results-aspirant-row__info">
                        {partyLogo ? (
                          <img
                            src={partyLogo}
                            alt={partyCode || "party logo"}
                            className="results-aspirant-row__logo"
                          />
                        ) : partyCode ? (
                          <span
                            className="results-aspirant-row__logo results-aspirant-row__logo--initials"
                            style={{ background: partyColor }}
                          >
                            {partyCode.charAt(0)}
                          </span>
                        ) : null}
                        {partyCode && (
                          <span
                            className="results-aspirant-row__party"
                            style={{ background: partyColor }}
                          >
                            {partyCode}
                          </span>
                        )}
                        <span className="results-aspirant-row__name">
                          {a.name}
                        </span>
                        {isLeading && (
                          <span className="results-aspirant-row__leading-badge">
                            Leading
                          </span>
                        )}
                      </div>
                      <div className="results-aspirant-row__actions">
                        {/* For overview roles show org-wide total votes; for PO agents show their own submitted votes */}
                        {(() => {
                          const displayVotes = isViewOnly
                            ? (totalsEntry?.totalVotes ?? null)
                            : submittedVotes;
                          return positionLabel || displayVotes !== null ? (
                            <div className="results-aspirant-row__meta">
                              {positionLabel && (
                                <span
                                  className={`results-aspirant-row__position${positionLabel === "1st" ? " results-aspirant-row__position--leading" : ""}`}
                                >
                                  {positionLabel}
                                </span>
                              )}
                              {displayVotes !== null && (
                                <span
                                  className={`results-aspirant-row__submitted${isLeading ? " results-aspirant-row__submitted--leading" : ""}`}
                                >
                                  {displayVotes.toLocaleString()} votes
                                </span>
                              )}
                            </div>
                          ) : null;
                        })()}
                        {!isViewOnly &&
                          (submittedVotes !== null ? (
                            <div className="results-aspirant-row__locked">
                              <span className="results-aspirant-row__locked-badge">
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  width="12"
                                  height="12"
                                >
                                  <rect
                                    x="3"
                                    y="11"
                                    width="18"
                                    height="11"
                                    rx="2"
                                    ry="2"
                                  />
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                Saved
                              </span>
                            </div>
                          ) : (
                            <>
                              <input
                                type="number"
                                min={0}
                                className="results-table__votes-input"
                                placeholder="0"
                                value={aspirantVotes[el._id]?.[a._id] ?? ""}
                                onChange={(e) =>
                                  onVoteChange(el._id, a._id, e.target.value)
                                }
                              />
                              <button
                                type="button"
                                className="results-table__save-btn"
                                onClick={() => onSave(el._id, a._id)}
                                disabled={
                                  accordionSavingId === a._id ||
                                  accordionSavingAll
                                }
                              >
                                {accordionSavingId === a._id
                                  ? "Saving…"
                                  : "Save"}
                              </button>
                            </>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!isViewOnly && (
                <div className="results-actions" style={{ marginTop: "1rem" }}>
                  {/* ── Upload zone ── always visible unless sheet already saved ── */}
                  {hasUploadedSheet ? (
                    <div className="results-upload-zone results-upload-zone--uploaded">
                      <span className="results-upload-zone__icon results-upload-zone__icon--done">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          width="20"
                          height="20"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <span className="results-upload-zone__label">
                        Result sheet uploaded
                      </span>
                      <span className="results-upload-zone__hint">
                        {existingSheets?.[0]?.createdAt
                          ? formatSheetDate(existingSheets[0].createdAt)
                          : "Sheet on record"}
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.375rem",
                        width: "100%",
                      }}
                    >
                      <label
                        className={`results-upload-zone${uploadingSheet ? " results-upload-zone--busy" : ""}${selectedFile ? " results-upload-zone--selected" : ""}`}
                      >
                        <span className="results-upload-zone__icon">
                          {uploadingSheet ? (
                            <span className="results-upload-zone__spinner" />
                          ) : (
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              width="20"
                              height="20"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                          )}
                        </span>
                        <span className="results-upload-zone__label">
                          {uploadingSheet
                            ? "Uploading…"
                            : selectedFile
                              ? selectedFile.name
                              : "Upload result sheet"}
                        </span>
                        <span className="results-upload-zone__hint">
                          {selectedFile
                            ? "File selected — click Save result sheet to upload"
                            : "PDF, JPG or PNG — click to browse"}
                        </span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          style={{ display: "none" }}
                          disabled={uploadingSheet}
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            setSelectedFile(file);
                            setUploadSheetMsg(null);
                          }}
                        />
                      </label>
                      {selectedFile && !uploadingSheet && (
                        <button
                          type="button"
                          className="results-btn results-btn--remove-sheet"
                          onClick={() => {
                            setSelectedFile(null);
                            setUploadSheetMsg(null);
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            width="14"
                            height="14"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                          Remove selected file
                        </button>
                      )}
                    </div>
                  )}

                  {uploadSheetMsg && (
                    <p
                      className={`results-upload-zone__msg results-upload-zone__msg--${uploadSheetMsg.type}`}
                    >
                      {uploadSheetMsg.text}
                    </p>
                  )}

                  {/* ── Action buttons row ── */}
                  {(() => {
                    const hasUnsavedAspirants = (expandedAspirants ?? []).some(
                      (a) => {
                        // Only check this PU's own collation — never fall back to org-wide totals,
                        // otherwise another PU's saved result would hide the Save All button here.
                        const collEntry = collationResults.find(
                          (r) => String(r.aspirant?._id) === String(a._id),
                        );
                        return (collEntry?.votes ?? null) === null;
                      },
                    );
                    if (!hasUnsavedAspirants && !selectedFile) return null;
                    return (
                      <div className="results-actions__btns">
                        {/* Save all votes button — only shown when there are unsaved aspirants */}
                        {hasUnsavedAspirants && (
                          <button
                            type="button"
                            className="results-btn results-btn--primary"
                            onClick={() => onSaveAll(el._id)}
                            disabled={
                              accordionSavingAll || accordionSavingId !== null
                            }
                          >
                            {accordionSavingAll ? "Saving…" : "Save all"}
                          </button>
                        )}

                        {/* Save result sheet button — only when a file has been picked and sheet not yet uploaded */}
                        {!hasUploadedSheet && selectedFile && (
                          <button
                            type="button"
                            className="results-btn results-btn--sheet"
                            disabled={uploadingSheet}
                            onClick={async () => {
                              if (!selectedFile || !pollingUnitId) return;
                              setUploadSheetMsg(null);
                              setUploadingSheet(true);
                              try {
                                await onUpload(
                                  el._id,
                                  pollingUnitId,
                                  selectedFile,
                                );
                                setUploadSheetMsg({
                                  type: "success",
                                  text: "Result sheet uploaded successfully.",
                                });
                                setSelectedFile(null);
                                if (fileInputRef.current)
                                  fileInputRef.current.value = "";
                                dispatch(
                                  getSheetsByElectionAndPollingUnit({
                                    electionId: el._id,
                                    pollingUnitId,
                                  }),
                                );
                              } catch {
                                setUploadSheetMsg({
                                  type: "error",
                                  text: "Failed to upload result sheet.",
                                });
                              } finally {
                                setUploadingSheet(false);
                              }
                            }}
                          >
                            {uploadingSheet ? (
                              <>
                                <span className="results-upload-zone__spinner results-upload-zone__spinner--inline" />
                                Uploading…
                              </>
                            ) : (
                              <>
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  width="14"
                                  height="14"
                                  style={{ flexShrink: 0 }}
                                >
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="17 8 12 3 7 8" />
                                  <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                Save result sheet
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Results() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const role = useSelector(selectRole) ?? "";
  const [expandedElectionId, setExpandedElectionId] = useState<string | null>(
    null,
  );
  const [aspirantVotes, setAspirantVotes] = useState<
    Record<string, Record<string, string>>
  >({});
  const [accordionMessage, setAccordionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [accordionSavingId, setAccordionSavingId] = useState<string | null>(
    null,
  );
  const [accordionSavingAll, setAccordionSavingAll] = useState(false);

  // Read elections from the store immediately so we can seed puElectionId on first render.
  // This prevents the one-frame flash where puElectionId="" when elections are already cached.
  const _electionsForInit = useSelector(selectElections) ?? [];
  const _activeForInit = (
    Array.isArray(_electionsForInit) ? _electionsForInit : []
  ).filter((e: { _id?: string; status?: string }) => e.status === "active");
  const [puElectionId, setPuElectionId] = useState(
    () => _activeForInit[0]?._id ?? "",
  );
  const [accreditedCountInput, setAccreditedCountInput] = useState("");
  const [puMessage, setPuMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [puBusy, setPuBusy] = useState(false);
  // presenceFetched: true once the server has responded to listPresence for current params.
  // hasMarkedPresence: true if server confirmed the user is in the presence list, OR after checkIn succeeds.
  const [presenceFetched, setPresenceFetched] = useState(false);
  const [hasMarkedPresence, setHasMarkedPresence] = useState(false);
  const [showAccreditedModal, setShowAccreditedModal] = useState(false);
  const [showVoteStartConfirm, setShowVoteStartConfirm] = useState(false);
  const [showVoteEndConfirm, setShowVoteEndConfirm] = useState(false);
  const [showAccStartConfirm, setShowAccStartConfirm] = useState(false);
  const [showAccEndConfirm, setShowAccEndConfirm] = useState(false);
  const [showOverVotingModal, setShowOverVotingModal] = useState(false);

  // ── Messages modal state ──────────────────────────────────────────────────
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [replyText, setReplyText] = useState("");

  // ── Report modal state ────────────────────────────────────────────────────
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportElectionId, setReportElectionId] = useState<string>("");
  const [reportCategory, setReportCategory] = useState<ReportCategory | "">("");
  const [reportSelectedItems, setReportSelectedItems] = useState<string[]>([]);
  const [reportNotes, setReportNotes] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportMsg, setReportMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const organizationId =
    (user as { organization?: { _id?: string; id?: string } })?.organization
      ?._id ??
    (user as { organization?: { _id?: string; id?: string } })?.organization
      ?.id ??
    "";

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
  const showElectionsAccordion = true;

  const electionsFromResults = useSelector(selectElections) ?? [];
  const electionsWithTotals =
    useSelector(
      selectElectionsByOrganizationId(organizationId ?? "", {
        includeResults: true,
      }),
    ) ?? [];
  const elections =
    (electionsWithTotals?.length
      ? electionsWithTotals
      : electionsFromResults) ??
    electionsFromResults ??
    [];
  const electionsLoading = useSelector(selectElectionsLoading);
  const parties = useSelector(selectParties) as
    | Array<{ acronym?: string; logo?: string; color?: string }>
    | undefined;

  const electionsList = (Array.isArray(elections) ? elections : []).filter(
    (e: { _id?: string; name?: string; status?: string }) =>
      e.status === "active",
  );

  useEffect(() => {
    dispatch(getElections());
    dispatch(getParties());
  }, [dispatch]);

  // Fetch inbox messages on mount whenever organizationId is known
  useEffect(() => {
    if (organizationId) {
      dispatch(getMyMessages(organizationId));
    }
  }, [dispatch, organizationId]);

  useEffect(() => {
    if (organizationId) {
      dispatch(
        getElectionsByOrganizationId({
          organizationId,
          query: { includeResults: true },
        }),
      );
    }
  }, [dispatch, organizationId]);

  useEffect(() => {
    if (expandedElectionId) {
      dispatch(getAspirantsByElection(expandedElectionId));
      dispatch(getAspirantTotalsByElection(expandedElectionId));
      if (locationIdForRole) {
        if (level === "ward") {
          dispatch(
            getResultsByElectionAndWard({
              electionId: expandedElectionId,
              wardId: locationIdForRole,
            }),
          );
        } else if (level === "lga") {
          dispatch(
            getResultsByElectionAndLga({
              electionId: expandedElectionId,
              lgaId: locationIdForRole,
            }),
          );
        } else if (level === "state") {
          dispatch(
            getResultsByElectionAndState({
              electionId: expandedElectionId,
              stateId: locationIdForRole,
            }),
          );
        } else {
          dispatch(
            getResultsByElectionAndPollingUnit({
              electionId: expandedElectionId,
              pollingUnitId: locationIdForRole,
            }),
          );
        }
      }
    }
  }, [dispatch, expandedElectionId, locationIdForRole]);

  useEffect(() => {
    if (!puElectionId && electionsList.length > 0) {
      setPuElectionId(electionsList[0]._id);
    }
  }, [electionsList.length, puElectionId]);
  useEffect(() => {
    if (electionsList.length > 0) {
      electionsList.forEach((el) => {
        dispatch(getPollingUnitsCoverage({ electionId: el._id }));
        dispatch(getAspirantTotalsByElection(el._id));
        dispatch(getAspirantsByElection(el._id));
        if (locationIdForRole) {
          if (level === "ward") {
            dispatch(
              getResultsByElectionAndWard({
                electionId: el._id,
                wardId: locationIdForRole,
              }),
            );
          } else if (level === "lga") {
            dispatch(
              getResultsByElectionAndLga({
                electionId: el._id,
                lgaId: locationIdForRole,
              }),
            );
          } else if (level === "state") {
            dispatch(
              getResultsByElectionAndState({
                electionId: el._id,
                stateId: locationIdForRole,
              }),
            );
          } else {
            dispatch(
              getResultsByElectionAndPollingUnit({
                electionId: el._id,
                pollingUnitId: locationIdForRole,
              }),
            );
          }
        }
      });
    }
  }, [dispatch, electionsList.map((e) => e._id).join(","), locationIdForRole]);

  const isPO = level === "polling_unit";
  const puViewElectionId = puElectionId;
  const puViewPollingUnitId = isPO ? locationIdForRole : "";
  const puPresenceParams =
    puViewElectionId && locationIdForRole
      ? level === "polling_unit"
        ? { pollingUnitId: locationIdForRole, electionId: puViewElectionId }
        : level === "ward"
          ? { wardId: locationIdForRole, electionId: puViewElectionId }
          : level === "lga"
            ? { lgaId: locationIdForRole, electionId: puViewElectionId }
            : level === "state"
              ? { stateId: locationIdForRole, electionId: puViewElectionId }
              : null
      : null;
  // On mount / when election+location params or user changes: fetch presence from server,
  // then check if THIS specific user is already in the list to seed hasMarkedPresence.
  // Runs once user is loaded so userId is always valid. Survives page reloads.
  const currentUserId =
    (user as { id?: string; _id?: string })?.id ??
    (user as { id?: string; _id?: string })?._id;

  useEffect(() => {
    if (!puPresenceParams || !currentUserId) return;
    setPresenceFetched(false);
    setHasMarkedPresence(false);
    dispatch(listPresence(puPresenceParams))
      .unwrap()
      .then((result) => {
        const list =
          (
            result as {
              presence?: Array<{ user?: { _id?: string; id?: string } }>;
            }
          )?.presence ?? [];
        const already = list.some((p) => {
          const entryId = p.user?._id ?? p.user?.id ?? "";
          return String(entryId) === String(currentUserId);
        });
        setHasMarkedPresence(already);
        setPresenceFetched(true);
      })
      .catch(() => {
        setPresenceFetched(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dispatch,
    puPresenceParams ? JSON.stringify(puPresenceParams) : null,
    currentUserId,
  ]);
  useEffect(() => {
    if (puElectionId) {
      dispatch(listPresence({ electionId: puElectionId }));
    }
  }, [dispatch, puElectionId]);

  // Real-time presence: refetch when another user marks presence
  usePresenceSocket(puElectionId ?? undefined, () => {
    if (puPresenceParams) dispatch(listPresence(puPresenceParams));
    if (puElectionId) dispatch(listPresence({ electionId: puElectionId }));
  });

  // Real-time results: refetch totals + collation whenever any result is saved
  const electionsListIds = electionsList.map((e) => e._id);
  useResultSocket(
    electionsListIds,
    // Per-election: immediate granular refresh (vote counts, coverage, collation)
    (electionId) => {
      dispatch(getAspirantTotalsByElection(electionId));
      dispatch(getPollingUnitsCoverage({ electionId }));
      if (locationIdForRole) {
        if (level === "ward") {
          dispatch(
            getResultsByElectionAndWard({
              electionId,
              wardId: locationIdForRole,
            }),
          );
        } else if (level === "lga") {
          dispatch(
            getResultsByElectionAndLga({
              electionId,
              lgaId: locationIdForRole,
            }),
          );
        } else if (level === "state") {
          dispatch(
            getResultsByElectionAndState({
              electionId,
              stateId: locationIdForRole,
            }),
          );
        } else {
          dispatch(
            getResultsByElectionAndPollingUnit({
              electionId,
              pollingUnitId: locationIdForRole,
            }),
          );
        }
      }
    },
    // Org-wide: debounced refresh of the elections list with embedded aspirantTotals
    // so overview roles (regular / executive / superadmin) see live totals without refreshing
    () => {
      if (organizationId) {
        dispatch(
          getElectionsByOrganizationId({
            organizationId,
            query: { includeResults: true },
          }),
        );
      }
    },
  );

  useEffect(() => {
    if (organizationId && puViewElectionId && puViewPollingUnitId) {
      dispatch(
        getAccreditedVotersByPollingUnit({
          organizationId,
          pollingUnitId: puViewPollingUnitId,
          electionId: puViewElectionId,
        }),
      );
    }
  }, [dispatch, organizationId, puViewElectionId, puViewPollingUnitId]);

  const allPresenceData = useSelector(
    selectListPresence(puElectionId ? { electionId: puElectionId } : {}),
  );
  const presenceCount = puElectionId
    ? (allPresenceData?.count ?? (allPresenceData?.presence ?? []).length)
    : 0;
  // hasMarkedPresence and presenceFetched are managed via direct .unwrap() promise above.

  const accreditationData = useSelector(
    selectAccreditedVotersByPollingUnit(
      organizationId || "",
      puViewPollingUnitId || "",
      puViewElectionId || "",
    ),
  );
  const accreditationLoading = useSelector(
    selectAccreditedVotersByPollingUnitLoading(
      organizationId || "",
      puViewPollingUnitId || "",
      puViewElectionId || "",
    ),
  );
  const accreditedCount = accreditationData?.accreditedCount ?? null;
  const votingStartedAt = accreditationData?.accreditation?.votingStartedAt;
  const votingEndedAt = accreditationData?.accreditation?.votingEndedAt;
  const accreditationStartedAt = accreditationData?.accreditation?.startedAt;
  const accreditationEndedAt = accreditationData?.accreditation?.endedAt;

  const isOverviewRole =
    role === "regular" || role === "executive" || role === "superadmin";

  // ── Messages selectors ────────────────────────────────────────────────────
  const inbox          = useSelector(selectInbox);
  const inboxLoading   = useSelector(selectInboxLoading);
  const unreadCount    = useSelector(selectUnreadCount);
  const readIds        = useSelector((s: RootState) => s.messages.readIds);
  const openMessage    = useSelector(selectOpenMessage);
  const openMsgLoading = useSelector(selectOpenMessageLoading);
  const replyLoading   = useSelector(selectReplyLoading);
  const replyError     = useSelector(selectReplyError);

  // Org-wide accreditation totals (for overview roles only)
  const orgAccreditationRaw = useSelector(
    selectAllAccreditationByOrganization(
      organizationId || "",
      puViewElectionId || "",
    ),
  ) as { totalAccreditedVoters?: number; total?: number } | undefined;
  const orgAccreditationData = isOverviewRole ? orgAccreditationRaw : undefined;

  useEffect(() => {
    if (isOverviewRole && organizationId && puViewElectionId) {
      dispatch(
        getAllAccreditationByOrganization({
          organizationId,
          electionId: puViewElectionId,
        }),
      );
    }
  }, [dispatch, isOverviewRole, organizationId, puViewElectionId]);

  // Total PUs from the first election's coverage (already fetched)
  const firstElectionCoverage = useSelector(
    selectPollingUnitsCoverage(puViewElectionId || ""),
  );
  const totalPUs = firstElectionCoverage?.total ?? null;
  const puWithAccreditation = orgAccreditationData?.total ?? 0;
  const remainingPUs = totalPUs != null ? totalPUs - puWithAccreditation : null;
  const totalAccreditedVotersOrg =
    orgAccreditationData?.totalAccreditedVoters ?? null;

  // Over-voting detail data (fetched on demand when modal is opened)
  const overVotingData = useSelector(
    selectOverVotingByOrganization(
      organizationId || "",
      puViewElectionId || "",
    ),
  );
  const overVotingLoading = useSelector(
    selectOverVotingByOrganizationLoading(
      organizationId || "",
      puViewElectionId || "",
    ),
  );

  // Total votes cast: sum of all aspirant totalVotes across all active elections
  const totalVotesCast = electionsList.reduce((sum, el) => {
    const totals = el.aspirantTotals as
      | { aspirants?: Array<{ totalVotes?: number }> }
      | undefined;
    const perElection = (totals?.aspirants ?? []).reduce(
      (s: number, a: { totalVotes?: number }) => s + (a.totalVotes ?? 0),
      0,
    );
    return sum + perElection;
  }, 0);
  // Over-voting flag: total votes cast exceeds total accredited voters
  const isOverVoting =
    isOverviewRole &&
    totalAccreditedVotersOrg != null &&
    totalAccreditedVotersOrg > 0 &&
    totalVotesCast > totalAccreditedVotersOrg;

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
        setShowAccStartConfirm(false);
        setShowAccEndConfirm(false);
        setShowOverVotingModal(false);
        setShowReportModal(false);
        setShowMessagesModal(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const handleOpenMessagesModal = () => {
    setReplyText("");
    dispatch(clearOpenMessage());
    if (organizationId) dispatch(getMyMessages(organizationId));
    setShowMessagesModal(true);
  };

  const handleOpenMessage = (messageId: string) => {
    if (!organizationId) return;
    dispatch(markRead(messageId));
    dispatch(getMessageById({ organizationId, messageId }));
    setReplyText("");
    dispatch(clearReplyError());
  };

  const handleSendReply = async () => {
    if (!organizationId || !openMessage || !replyText.trim()) return;
    await dispatch(replyToMessage({ organizationId, messageId: openMessage._id, body: replyText.trim() })).unwrap();
    setReplyText("");
  };

  const handleOpenReportModal = () => {
    const firstElectionId = electionsList[0]?._id ?? "";
    setReportElectionId(firstElectionId);
    setReportCategory("");
    setReportSelectedItems([]);
    setReportNotes("");
    setReportMsg(null);
    setShowReportModal(true);
  };

  const handleReportItemToggle = (item: string) => {
    setReportSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSubmitReport = async () => {
    if (!reportElectionId) { setReportMsg({ type: "error", text: "Please select an election." }); return; }
    if (!reportCategory)   { setReportMsg({ type: "error", text: "Please select a category." }); return; }
    if (reportSelectedItems.length === 0) { setReportMsg({ type: "error", text: "Please select at least one item." }); return; }

    const locationBody: Record<string, string> = {};
    if (level === "polling_unit" && locationIdForRole)     locationBody.pollingUnitId = locationIdForRole;
    else if (level === "ward" && locationIdForRole)        locationBody.wardId        = locationIdForRole;
    else if (level === "lga" && locationIdForRole)         locationBody.lgaId         = locationIdForRole;
    else if (level === "state" && locationIdForRole)       locationBody.stateId       = locationIdForRole;
    else if (isOverviewRole) {
      // Overview roles need at least one location — skip enforcement here; backend validates
    }

    setReportSubmitting(true);
    setReportMsg(null);
    try {
      await dispatch(
        createReport({
          electionId: reportElectionId,
          category: reportCategory as ReportCategory,
          items: reportSelectedItems,
          notes: reportNotes.trim() || undefined,
          ...locationBody,
        })
      ).unwrap();
      setReportMsg({ type: "success", text: "Report submitted successfully." });
      setReportCategory("");
      setReportSelectedItems([]);
      setReportNotes("");
    } catch (err: unknown) {
      const msg = typeof err === "string" ? err : (err as { message?: string })?.message ?? "Failed to submit report.";
      setReportMsg({ type: "error", text: msg });
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleOpenOverVotingModal = () => {
    setShowOverVotingModal(true);
    if (organizationId && puViewElectionId) {
      dispatch(
        getOverVotingByOrganization({
          organizationId,
          electionId: puViewElectionId,
        }),
      );
    }
  };

  const handleMarkPresence = async () => {
    if (!locationIdForRole || !puElectionId) return;
    setPuBusy(true);
    setPuMessage(null);
    try {
      await dispatch(
        checkIn({ pollingUnitId: locationIdForRole, electionId: puElectionId }),
      ).unwrap();
      setHasMarkedPresence(true);
      setPuMessage({
        type: "success",
        text: "Presence marked. You can now enter accredited voters and use Vote started/ended.",
      });
      if (puPresenceParams) dispatch(listPresence(puPresenceParams));
      dispatch(listPresence({ electionId: puElectionId }));
      // Invalidate presence caches so Presence page and Results show updated data
      if (organizationId) {
        const reportKey = `presence/getPresenceReport::${JSON.stringify({ organizationId, electionId: puElectionId })}`;
        dispatch(clearCacheEntry(reportKey));
      }
      const allPresenceKey = `presence/listPresence::${JSON.stringify({ electionId: puElectionId })}`;
      dispatch(clearCacheEntry(allPresenceKey));
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : "Failed to mark presence.";
      setPuMessage({ type: "error", text: String(msg) });
    } finally {
      setPuBusy(false);
    }
  };

  const handleEnterAccreditedVoters = async () => {
    if (
      !organizationId ||
      !(puViewPollingUnitId ?? locationIdForRole) ||
      !puElectionId
    )
      return;
    const v = parseInt(accreditedCountInput.trim(), 10);
    if (isNaN(v) || v < 0) {
      setPuMessage({
        type: "error",
        text: "Enter a non-negative number for accredited voters.",
      });
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
        }),
      ).unwrap();
      setPuMessage({ type: "success", text: "Accredited voters saved." });
      setShowAccreditedModal(false);
      dispatch(
        getAccreditedVotersByPollingUnit({
          organizationId,
          pollingUnitId: puViewPollingUnitId ?? locationIdForRole ?? "",
          electionId: puElectionId,
        }),
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
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
        }),
      ).unwrap();
      setPuMessage({ type: "success", text: "Vote started recorded." });
      dispatch(
        getAccreditedVotersByPollingUnit({
          organizationId,
          pollingUnitId: locationIdForRole,
          electionId: puElectionId,
        }),
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
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
        }),
      ).unwrap();
      setPuMessage({ type: "success", text: "Vote ended recorded." });
      dispatch(
        getAccreditedVotersByPollingUnit({
          organizationId,
          pollingUnitId: locationIdForRole,
          electionId: puElectionId,
        }),
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : "Failed to record vote ended.";
      setPuMessage({ type: "error", text: String(msg) });
    } finally {
      setPuBusy(false);
    }
  };

  const handleAccreditationStarted = async () => {
    if (!locationIdForRole || !puElectionId) return;
    setPuBusy(true);
    setPuMessage(null);
    try {
      await dispatch(
        startAccreditationAtPollingUnit({
          electionId: puElectionId,
          pollingUnitId: locationIdForRole,
        }),
      ).unwrap();
      setPuMessage({
        type: "success",
        text: "Accreditation started recorded.",
      });
      dispatch(
        getAccreditedVotersByPollingUnit({
          organizationId,
          pollingUnitId: locationIdForRole,
          electionId: puElectionId,
        }),
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : "Failed to record accreditation started.";
      setPuMessage({ type: "error", text: String(msg) });
    } finally {
      setPuBusy(false);
    }
  };

  const handleAccreditationEnded = async () => {
    if (!locationIdForRole || !puElectionId) return;
    setPuBusy(true);
    setPuMessage(null);
    try {
      await dispatch(
        endAccreditationAtPollingUnit({
          electionId: puElectionId,
          pollingUnitId: locationIdForRole,
        }),
      ).unwrap();
      setPuMessage({ type: "success", text: "Accreditation ended recorded." });
      dispatch(
        getAccreditedVotersByPollingUnit({
          organizationId,
          pollingUnitId: locationIdForRole,
          electionId: puElectionId,
        }),
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : "Failed to record accreditation ended.";
      setPuMessage({ type: "error", text: String(msg) });
    } finally {
      setPuBusy(false);
    }
  };

  const handleAccordionToggle = (id: string) => {
    setExpandedElectionId((prev) => (prev === id ? null : id));
    setAccordionMessage(null);
    if (id) {
      dispatch(getPollingUnitsCoverage({ electionId: id }));
      dispatch(getAspirantTotalsByElection(id));
      dispatch(getAspirantsByElection(id));
      if (locationIdForRole) {
        if (level === "ward") {
          dispatch(
            getResultsByElectionAndWard({
              electionId: id,
              wardId: locationIdForRole,
            }),
          );
        } else if (level === "lga") {
          dispatch(
            getResultsByElectionAndLga({
              electionId: id,
              lgaId: locationIdForRole,
            }),
          );
        } else if (level === "state") {
          dispatch(
            getResultsByElectionAndState({
              electionId: id,
              stateId: locationIdForRole,
            }),
          );
        } else {
          dispatch(
            getResultsByElectionAndPollingUnit({
              electionId: id,
              pollingUnitId: locationIdForRole,
            }),
          );
          dispatch(
            getSheetsByElectionAndPollingUnit({
              electionId: id,
              pollingUnitId: locationIdForRole,
            }),
          );
        }
      }
    }
  };

  const handleUploadSheet = async (
    electionId: string,
    pollingUnitId: string,
    file: File,
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    await dispatch(
      uploadResultSheetByPollingUnit({
        electionId,
        pollingUnitId,
        payload: formData,
      }),
    ).unwrap();
  };

  const handleAspirantVoteChange = (
    electionId: string,
    aspirantId: string,
    value: string,
  ) => {
    setAspirantVotes((prev) => ({
      ...prev,
      [electionId]: {
        ...(prev[electionId] ?? {}),
        [aspirantId]: value,
      },
    }));
    setAccordionMessage(null);
  };

  const enterResultThunk = (params: {
    electionId: string;
    aspirantId: string;
    votes: number;
  }) => {
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

  const handleSaveAspirantResult = async (
    electionId: string,
    aspirantId: string,
  ) => {
    if (!locationIdForRole) {
      setAccordionMessage({
        type: "error",
        text: `Your account is not assigned to a ${level ?? "location"}.`,
      });
      return;
    }
    const votesStr = aspirantVotes[electionId]?.[aspirantId]?.trim();
    if (!votesStr) {
      setAccordionMessage({
        type: "error",
        text: "Enter votes for this aspirant.",
      });
      return;
    }
    const votes = parseInt(votesStr, 10);
    if (isNaN(votes) || votes < 0) {
      setAccordionMessage({
        type: "error",
        text: "Votes must be a non-negative number.",
      });
      return;
    }
    setAccordionSavingId(aspirantId);
    setAccordionMessage(null);
    try {
      await dispatch(
        enterResultThunk({ electionId, aspirantId, votes }) as ReturnType<
          typeof enterResultByElectionAndAspirant
        >,
      ).unwrap();
      setAccordionMessage({
        type: "success",
        text: "Result saved successfully.",
      });
      dispatch(getPollingUnitsCoverage({ electionId }));
      dispatch(getAspirantTotalsByElection(electionId));
      if (locationIdForRole) {
        if (level === "ward") {
          dispatch(
            getResultsByElectionAndWard({
              electionId,
              wardId: locationIdForRole,
            }),
          );
        } else if (level === "lga") {
          dispatch(
            getResultsByElectionAndLga({
              electionId,
              lgaId: locationIdForRole,
            }),
          );
        } else if (level === "state") {
          dispatch(
            getResultsByElectionAndState({
              electionId,
              stateId: locationIdForRole,
            }),
          );
        } else {
          dispatch(
            getResultsByElectionAndPollingUnit({
              electionId,
              pollingUnitId: locationIdForRole,
            }),
          );
        }
      }
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
      ([_, v]) => v !== undefined && String(v).trim() !== "",
    );
    if (entries.length === 0) {
      setAccordionMessage({
        type: "error",
        text: "Enter votes for at least one aspirant.",
      });
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
          enterResultThunk({ electionId, aspirantId, votes: v }) as ReturnType<
            typeof enterResultByElectionAndAspirant
          >,
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
      dispatch(getPollingUnitsCoverage({ electionId }));
      dispatch(getAspirantTotalsByElection(electionId));
      if (locationIdForRole) {
        if (level === "ward") {
          dispatch(
            getResultsByElectionAndWard({
              electionId,
              wardId: locationIdForRole,
            }),
          );
        } else if (level === "lga") {
          dispatch(
            getResultsByElectionAndLga({
              electionId,
              lgaId: locationIdForRole,
            }),
          );
        } else if (level === "state") {
          dispatch(
            getResultsByElectionAndState({
              electionId,
              stateId: locationIdForRole,
            }),
          );
        } else {
          dispatch(
            getResultsByElectionAndPollingUnit({
              electionId,
              pollingUnitId: locationIdForRole,
            }),
          );
        }
      }
      setAspirantVotes((prev) => ({
        ...prev,
        [electionId]: {},
      }));
    }
    if (errMsg && ok === 0)
      setAccordionMessage({ type: "error", text: errMsg });
  };

  const expandedAspirants = useSelector(
    selectAspirantsByElection(expandedElectionId ?? ""),
  ) as
    | Array<{
        _id: string;
        name: string;
        partyCode?: string;
        party?: {
          name?: string;
          acronym?: string;
          logo?: string;
          color?: string;
        };
      }>
    | undefined;
  const expandedAspirantsLoading = useSelector(
    selectAspirantsByElectionLoading(expandedElectionId ?? ""),
  );

  return (
    <div className="results-page">
      <div className="results-page__header">
        <div>
          <p className="results-page__breadcrumb">EMS / Results</p>
          <h1 className="results-page__title">Enter Results</h1>
        </div>
        <div className="results-page__header-actions">
          <button
            type="button"
            className="results-btn results-btn--messages"
            onClick={handleOpenMessagesModal}
            title="View messages"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Messages
            {unreadCount > 0 && (
              <span className="results-btn__badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
            )}
          </button>
          <button
            type="button"
            className="results-btn results-btn--report"
            onClick={handleOpenReportModal}
            title="Submit an incident report"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Report
          </button>
        </div>
      </div>

      <div className="results-polling-unit">
        {/* <div className="results-polling-unit__item">
          <span className="results-polling-unit__label">User</span>
          <span className="results-polling-unit__value">
            {user?.username || "—"}
          </span>
        </div> */}
        <div className="results-polling-unit__item">
          <span className="results-polling-unit__label">Role</span>
          <span className="results-polling-unit__value">
            {role
              ? (ROLE_LABELS[role] ??
                role
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase()))
              : "—"}
          </span>
        </div>
        {/* {user?.phoneNumber && (
          <div className="results-polling-unit__item">
            <span className="results-polling-unit__label">Phone</span>
            <span className="results-polling-unit__value">
              {user.phoneNumber}
            </span>
          </div>
        )} */}
        {u?.lga && (
          <div className="results-polling-unit__item">
            <span className="results-polling-unit__label">LGA</span>
            <span className="results-polling-unit__value">
              {getLocationName(u.lga)}
            </span>
          </div>
        )}
        {u?.ward && (
          <div className="results-polling-unit__item">
            <span className="results-polling-unit__label">Ward</span>
            <span className="results-polling-unit__value">
              {getLocationName(u.ward)}
            </span>
          </div>
        )}
        <div className="results-polling-unit__item">
          <span className="results-polling-unit__label">
            {level === "polling_unit"
              ? "Polling Unit"
              : level === "ward"
                ? "Ward"
                : level === "lga"
                  ? "LGA"
                  : level === "state"
                    ? "State"
                    : "Assigned location"}
          </span>
          <span className="results-polling-unit__value">
            {level === "polling_unit"
              ? getLocationName(u?.pollingUnit)
              : level === "ward"
                ? getLocationName(u?.ward)
                : level === "lga"
                  ? getLocationName(u?.lga)
                  : level === "state"
                    ? getLocationName(u?.state)
                    : "—"}
          </span>
        </div>
      </div>

      {(organizationId || electionsList.length > 0 || isPO) && (
        <div className="results-card results-pu-upper">
          <h2 className="results-card__heading">
            Polling Unit – Voting - Presence - Accreditation
          </h2>

          {!puElectionId && !isPO ? (
            <p className="results-view__empty" style={{ margin: 0 }}>
              Select an election to continue.
            </p>
          ) : (
            <>
              {(hasMarkedPresence || isOverviewRole || isPO) && (
                <div className="results-pu-cards">
                  {/* Mark presence / Presence marked card — sits in the grid alongside other cards */}
                  {isPO && !presenceFetched && (
                    <div className="results-pu-card results-pu-card--mark-presence">
                      <div className="results-pu-card__body">
                        <span className="results-pu-card__sublabel">
                          Checking presence…
                        </span>
                      </div>
                    </div>
                  )}
                  {isPO && presenceFetched && !hasMarkedPresence && (
                    <div className="results-pu-card results-pu-card--mark-presence">
                      <span className="results-pu-card__icon-wrap results-pu-card__icon-wrap--amber">
                        <IconUserPlus />
                      </span>
                      <div className="results-pu-card__body">
                        <span className="results-pu-card__label">
                          Mark presence
                        </span>
                        <span className="results-pu-card__sublabel">
                          Mark your presence to unlock all options
                        </span>
                        <button
                          type="button"
                          className="results-btn results-btn--primary"
                          style={{
                            marginTop: "0.375rem",
                            padding: "0.3rem 0.75rem",
                            fontSize: "0.75rem",
                          }}
                          onClick={handleMarkPresence}
                          disabled={puBusy || !puElectionId}
                        >
                          {puBusy ? "Marking…" : "Mark presence"}
                        </button>
                      </div>
                    </div>
                  )}
                  {isPO && presenceFetched && hasMarkedPresence && (
                    <div className="results-pu-card results-pu-card--mark-presence results-pu-card--done">
                      <span className="results-pu-card__icon-wrap results-pu-card__icon-wrap--emerald">
                        <IconCheckCircle />
                      </span>
                      <div className="results-pu-card__body">
                        <span className="results-pu-card__label">
                          Presence
                        </span>
                        <span className="results-pu-card__value">
                          ✓
                        </span>
                        <span className="results-pu-card__sublabel">
                          Checked in
                        </span>
                      </div>
                    </div>
                  )}
                  {isOverviewRole && (
                    <div className="results-pu-card results-pu-card--presence">
                      <span className="results-pu-card__icon-wrap results-pu-card__icon-wrap--blue">
                        <IconLocation />
                      </span>
                      <div className="results-pu-card__body">
                        <span className="results-pu-card__label">Presence</span>
                        <span className="results-pu-card__value">
                          {presenceCount}
                        </span>
                        <span className="results-pu-card__sublabel">
                          Agents checked in
                        </span>
                      </div>
                    </div>
                  )}
                  {isOverviewRole && (
                    <div className="results-pu-card">
                      <span className="results-pu-card__icon-wrap results-pu-card__icon-wrap--emerald">
                        <IconClipboard />
                      </span>
                      <div className="results-pu-card__body">
                        <span className="results-pu-card__label">
                          Total Accredited Voters
                        </span>
                        <span className="results-pu-card__value">
                          {totalAccreditedVotersOrg != null
                            ? totalAccreditedVotersOrg.toLocaleString()
                            : "—"}
                        </span>
                        <span className="results-pu-card__sublabel">
                          {remainingPUs != null && remainingPUs > 0
                            ? `${remainingPUs} PU${remainingPUs !== 1 ? "s" : ""} yet to enter`
                            : remainingPUs === 0
                              ? "All PUs entered"
                              : "Across all polling units"}
                        </span>
                      </div>
                    </div>
                  )}
                  {isOverviewRole &&
                    (isOverVoting ? (
                      <button
                        type="button"
                        className="results-pu-card results-pu-card--overvote results-pu-card--clickable"
                        onClick={handleOpenOverVotingModal}
                        title="Click to view all over-voting polling units"
                      >
                        <span className="results-pu-card__icon-wrap results-pu-card__icon-wrap--rose">
                          <IconAlertTriangle />
                        </span>
                        <div className="results-pu-card__body">
                          <span className="results-pu-card__label">
                            Total Votes Cast
                          </span>
                          <span className="results-pu-card__value results-pu-card__value--overvote">
                            {totalVotesCast.toLocaleString()}
                          </span>
                          <span className="results-pu-card__sublabel">
                            Over-voting: +
                            {(
                              totalVotesCast - (totalAccreditedVotersOrg ?? 0)
                            ).toLocaleString()}{" "}
                            excess — click to view
                          </span>
                        </div>
                      </button>
                    ) : (
                      <div className="results-pu-card">
                        <span className="results-pu-card__icon-wrap results-pu-card__icon-wrap--violet">
                          <IconPlay />
                        </span>
                        <div className="results-pu-card__body">
                          <span className="results-pu-card__label">
                            Total Votes Cast
                          </span>
                          <span className="results-pu-card__value">
                            {totalVotesCast > 0
                              ? totalVotesCast.toLocaleString()
                              : "—"}
                          </span>
                          <span className="results-pu-card__sublabel">
                            {totalAccreditedVotersOrg != null &&
                            totalVotesCast > 0
                              ? `${((totalVotesCast / totalAccreditedVotersOrg) * 100).toFixed(1)}% turnout`
                              : "Across all elections"}
                          </span>
                        </div>
                      </div>
                    ))}
                  {/* Accreditation Started — visible only after presence is marked */}
                  {hasMarkedPresence && (
                    <button
                      type="button"
                      className={`results-pu-card results-pu-card--clickable ${accreditationStartedAt ? "results-pu-card--done" : ""} ${puBusy || !!accreditationStartedAt ? "results-pu-card--disabled" : ""}`}
                      onClick={() =>
                        !puBusy &&
                        !accreditationStartedAt &&
                        setShowAccStartConfirm(true)
                      }
                      disabled={puBusy || !!accreditationStartedAt}
                    >
                      <span className="results-pu-card__icon-wrap results-pu-card__icon-wrap--emerald">
                        <IconCheckCircle />
                      </span>
                      <div className="results-pu-card__body">
                        <span className="results-pu-card__label">
                          Accreditation Started
                        </span>
                        <span className="results-pu-card__value">
                          {accreditationStartedAt ? "✓" : "—"}
                        </span>
                        <span className="results-pu-card__sublabel">
                          {accreditationStartedAt
                            ? "Recorded"
                            : "Click to record"}
                        </span>
                      </div>
                    </button>
                  )}
                  {/* Accreditation Ended — visible only after accreditation has started */}
                  {hasMarkedPresence && !!accreditationStartedAt && (
                    <button
                      type="button"
                      className={`results-pu-card results-pu-card--clickable ${accreditationEndedAt ? "results-pu-card--done" : ""} ${puBusy || !!accreditationEndedAt ? "results-pu-card--disabled" : ""}`}
                      onClick={() =>
                        !puBusy &&
                        !accreditationEndedAt &&
                        setShowAccEndConfirm(true)
                      }
                      disabled={puBusy || !!accreditationEndedAt}
                    >
                      <span className="results-pu-card__icon-wrap results-pu-card__icon-wrap--amber">
                        <IconCheckCircle />
                      </span>
                      <div className="results-pu-card__body">
                        <span className="results-pu-card__label">
                          Accreditation Ended
                        </span>
                        <span className="results-pu-card__value">
                          {accreditationEndedAt ? "✓" : "—"}
                        </span>
                        <span className="results-pu-card__sublabel">
                          {accreditationEndedAt
                            ? "Recorded"
                            : "Click to record"}
                        </span>
                      </div>
                    </button>
                  )}
                  {/* Accredited Voters — visible only after accreditation has ended */}
                  {hasMarkedPresence && !!accreditationEndedAt && (
                    <button
                      type="button"
                      className={`results-pu-card results-pu-card--clickable ${accreditedCount != null ? "results-pu-card--done results-pu-card--disabled" : ""}`}
                      onClick={() => {
                        if (accreditedCount != null) return;
                        setAccreditedCountInput("");
                        setShowAccreditedModal(true);
                      }}
                      disabled={accreditedCount != null}
                    >
                      <span className="results-pu-card__icon-wrap results-pu-card__icon-wrap--emerald">
                        <IconClipboard />
                      </span>
                      <div className="results-pu-card__body">
                        <span className="results-pu-card__label">
                          Accredited Voters
                        </span>
                        <span className="results-pu-card__value">
                          {accreditedCount != null
                            ? accreditedCount.toLocaleString()
                            : "—"}
                        </span>
                        <span className="results-pu-card__sublabel">
                          {accreditedCount != null
                            ? "Recorded"
                            : "Click to enter"}
                        </span>
                      </div>
                    </button>
                  )}
                  {/* Voting Started — visible only after accredited voters is entered */}
                  {hasMarkedPresence &&
                    !!accreditationEndedAt &&
                    accreditedCount != null && (
                      <button
                        type="button"
                        className={`results-pu-card results-pu-card--clickable ${votingStartedAt ? "results-pu-card--done" : ""} ${puBusy || !!votingStartedAt ? "results-pu-card--disabled" : ""}`}
                        onClick={() =>
                          !puBusy &&
                          !votingStartedAt &&
                          setShowVoteStartConfirm(true)
                        }
                        disabled={puBusy || !!votingStartedAt}
                      >
                        <span className="results-pu-card__icon-wrap results-pu-card__icon-wrap--violet">
                          <IconPlay />
                        </span>
                        <div className="results-pu-card__body">
                          <span className="results-pu-card__label">
                            Voting started
                          </span>
                          <span className="results-pu-card__value">
                            {votingStartedAt ? "✓" : "—"}
                          </span>
                          <span className="results-pu-card__sublabel">
                            {votingStartedAt ? "Recorded" : "Click to record"}
                          </span>
                        </div>
                      </button>
                    )}
                  {/* Voting Ended — visible only after voting has started */}
                  {hasMarkedPresence &&
                    !!accreditationEndedAt &&
                    !!votingStartedAt && (
                      <button
                        type="button"
                        className={`results-pu-card results-pu-card--clickable ${votingEndedAt ? "results-pu-card--done" : ""} ${puBusy || !!votingEndedAt ? "results-pu-card--disabled" : ""}`}
                        onClick={() =>
                          !puBusy &&
                          !votingEndedAt &&
                          setShowVoteEndConfirm(true)
                        }
                        disabled={puBusy || !!votingEndedAt}
                      >
                        <span className="results-pu-card__icon-wrap results-pu-card__icon-wrap--rose">
                          <IconFlag />
                        </span>
                        <div className="results-pu-card__body">
                          <span className="results-pu-card__label">
                            Voting ended
                          </span>
                          <span className="results-pu-card__value">
                            {votingEndedAt ? "✓" : "—"}
                          </span>
                          <span className="results-pu-card__sublabel">
                            {votingEndedAt ? "Recorded" : "Click to record"}
                          </span>
                        </div>
                      </button>
                    )}
                </div>
              )}
              {puMessage && (
                <div
                  className={`results-message results-message--${puMessage.type}`}
                  style={{ marginTop: "1rem" }}
                >
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
              <div
                className="results-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <h3
                  id="accredited-modal-title"
                  className="results-modal__title"
                >
                  Enter accredited voters
                </h3>
                <p className="results-modal__subtitle">
                  Enter the number of accredited voters at your polling unit.
                </p>
                <div className="results-modal__field">
                  <label
                    htmlFor="accredited-modal-input"
                    className="results-form__label"
                  >
                    Number of accredited voters
                  </label>
                  <input
                    id="accredited-modal-input"
                    type="number"
                    min={0}
                    className="results-form__input"
                    value={accreditedCountInput}
                    onChange={(e) => setAccreditedCountInput(e.target.value)}
                    placeholder={
                      accreditedCount != null ? String(accreditedCount) : "0"
                    }
                  />
                </div>
                <div className="results-modal__actions">
                  <button
                    type="button"
                    className="results-btn results-btn--outline"
                    onClick={() => setShowAccreditedModal(false)}
                  >
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
              <div
                className="results-modal results-modal--warning"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="results-modal__title">Record voting started?</h3>
                <p className="results-modal__subtitle">
                  You are about to record that voting has started at this
                  polling unit. This action cannot be undone. Do you want to
                  proceed?
                </p>
                <div className="results-modal__actions">
                  <button
                    type="button"
                    className="results-btn results-btn--outline"
                    onClick={() => setShowVoteStartConfirm(false)}
                  >
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
              <div
                className="results-modal results-modal--warning"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="results-modal__title">Record voting ended?</h3>
                <p className="results-modal__subtitle">
                  You are about to record that voting has ended at this polling
                  unit. This action cannot be undone. Do you want to proceed?
                </p>
                <div className="results-modal__actions">
                  <button
                    type="button"
                    className="results-btn results-btn--outline"
                    onClick={() => setShowVoteEndConfirm(false)}
                  >
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

          {showAccStartConfirm && (
            <div
              className="results-modal-backdrop"
              role="alertdialog"
              aria-modal="true"
              onClick={() => setShowAccStartConfirm(false)}
            >
              <div
                className="results-modal results-modal--warning"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="results-modal__title">
                  Record accreditation started?
                </h3>
                <p className="results-modal__subtitle">
                  You are about to record that accreditation has started at this
                  polling unit. This action cannot be undone. Do you want to
                  proceed?
                </p>
                <div className="results-modal__actions">
                  <button
                    type="button"
                    className="results-btn results-btn--outline"
                    onClick={() => setShowAccStartConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="results-btn results-btn--primary"
                    onClick={async () => {
                      setShowAccStartConfirm(false);
                      await handleAccreditationStarted();
                    }}
                    disabled={puBusy}
                  >
                    {puBusy
                      ? "Recording…"
                      : "Yes, record accreditation started"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showAccEndConfirm && (
            <div
              className="results-modal-backdrop"
              role="alertdialog"
              aria-modal="true"
              onClick={() => setShowAccEndConfirm(false)}
            >
              <div
                className="results-modal results-modal--warning"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="results-modal__title">
                  Record accreditation ended?
                </h3>
                <p className="results-modal__subtitle">
                  You are about to record that accreditation has ended at this
                  polling unit. This action cannot be undone. Do you want to
                  proceed?
                </p>
                <div className="results-modal__actions">
                  <button
                    type="button"
                    className="results-btn results-btn--outline"
                    onClick={() => setShowAccEndConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="results-btn results-btn--primary"
                    onClick={async () => {
                      setShowAccEndConfirm(false);
                      await handleAccreditationEnded();
                    }}
                    disabled={puBusy}
                  >
                    {puBusy ? "Recording…" : "Yes, record accreditation ended"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showElectionsAccordion &&
        electionsList.length > 0 &&
        (role === "regular" ||
          role === "executive" ||
          role === "superadmin" ||
          (hasMarkedPresence && !!votingEndedAt)) && (
          <div className="results-card results-elections-section">
            <h2 className="results-card__heading">Elections</h2>
            <p className="results-elections-section__hint">
              Click an election card to expand and view or enter results for
              each aspirant.
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
                <PoElectionCard
                  key={el._id}
                  el={el}
                  pollingUnitId={locationIdForRole ?? ""}
                  expandedElectionId={expandedElectionId}
                  onToggle={handleAccordionToggle}
                  expandedAspirants={
                    expandedElectionId === el._id
                      ? expandedAspirants
                      : undefined
                  }
                  expandedAspirantsLoading={
                    expandedElectionId === el._id
                      ? expandedAspirantsLoading
                      : false
                  }
                  aspirantVotes={aspirantVotes}
                  accordionSavingId={accordionSavingId}
                  accordionSavingAll={accordionSavingAll}
                  onVoteChange={handleAspirantVoteChange}
                  onSave={handleSaveAspirantResult}
                  onSaveAll={handleSaveAllAspirantResults}
                  onUpload={handleUploadSheet}
                  parties={parties}
                  role={role}
                  level={level}
                  locationId={locationIdForRole}
                />
              ))}
            </div>
            {electionsList.length === 0 && !electionsLoading && (
              <p className="results-view__empty">No elections found.</p>
            )}
          </div>
        )}

      {/* ── Messages modal ────────────────────────────────────────────────── */}
      {showMessagesModal && (
        <div
          className="results-messages-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="messages-modal-title"
          onClick={() => { setShowMessagesModal(false); dispatch(clearOpenMessage()); }}
        >
          <div
            className="results-messages-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="results-messages-modal__header">
              <div className="results-messages-modal__header-left">
                {openMessage && (
                  <button
                    type="button"
                    className="results-messages-modal__back"
                    onClick={() => { dispatch(clearOpenMessage()); setReplyText(""); }}
                    aria-label="Back to inbox"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                )}
                <div className="results-messages-modal__header-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 id="messages-modal-title" className="results-messages-modal__title">
                    {openMessage ? openMessage.title : "Messages"}
                  </h2>
                  {!openMessage && (
                    <p className="results-messages-modal__subtitle">
                      {inbox.length} message{inbox.length !== 1 ? "s" : ""}{unreadCount > 0 ? ` · ${unreadCount} unread` : ""}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="results-messages-modal__close"
                onClick={() => { setShowMessagesModal(false); dispatch(clearOpenMessage()); }}
                aria-label="Close"
              >✕</button>
            </div>

            {/* Body */}
            <div className="results-messages-modal__body">
              {/* ── Inbox list ── */}
              {!openMessage && (
                <>
                  {inboxLoading && (
                    <div className="results-messages-modal__loading">
                      <span className="results-pu-cards-loading__spinner" />
                      <span>Loading messages…</span>
                    </div>
                  )}
                  {!inboxLoading && inbox.length === 0 && (
                    <div className="results-messages-modal__empty">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" width="40" height="40">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <p>No messages yet</p>
                    </div>
                  )}
                  {!inboxLoading && inbox.length > 0 && (
                    <ul className="results-messages-modal__list">
                      {inbox.map((msg) => {
                        const isUnread = !readIds.includes(msg._id);
                        const senderName = msg.from
                          ? [msg.from.firstName, msg.from.lastName].filter(Boolean).join(" ") || msg.from.email || "Unknown"
                          : "System";
                        const date = new Date(msg.createdAt);
                        const dateStr = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
                        const timeStr = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                        return (
                          <li key={msg._id}>
                            <button
                              type="button"
                              className={`results-messages-modal__item${isUnread ? " results-messages-modal__item--unread" : ""}`}
                              onClick={() => handleOpenMessage(msg._id)}
                            >
                              <div className="results-messages-modal__item-left">
                                {isUnread && <span className="results-messages-modal__unread-dot" />}
                                <div className="results-messages-modal__item-content">
                                  <span className="results-messages-modal__item-title">{msg.title}</span>
                                  <span className="results-messages-modal__item-sender">From: {senderName}</span>
                                  <span className="results-messages-modal__item-preview">{msg.body.slice(0, 80)}{msg.body.length > 80 ? "…" : ""}</span>
                                </div>
                              </div>
                              <div className="results-messages-modal__item-right">
                                <span className="results-messages-modal__item-date">{dateStr}</span>
                                <span className="results-messages-modal__item-time">{timeStr}</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" width="14" height="14">
                                  <polyline points="9 18 15 12 9 6" />
                                </svg>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}

              {/* ── Message detail ── */}
              {openMessage && (
                <div className="results-messages-modal__detail">
                  {openMsgLoading && (
                    <div className="results-messages-modal__loading">
                      <span className="results-pu-cards-loading__spinner" />
                      <span>Loading…</span>
                    </div>
                  )}
                  {!openMsgLoading && (
                    <>
                      <div className="results-messages-modal__detail-meta">
                        <span className="results-messages-modal__detail-from">
                          From: {openMessage.from
                            ? [openMessage.from.firstName, openMessage.from.lastName].filter(Boolean).join(" ") || openMessage.from.email || "Unknown"
                            : "System"}
                          {openMessage.from?.role && (
                            <span className="results-messages-modal__detail-role">
                              {" "}· {openMessage.from.role.replace(/_/g, " ")}
                            </span>
                          )}
                        </span>
                        <span className="results-messages-modal__detail-date">
                          {new Date(openMessage.createdAt).toLocaleString("en-GB", {
                            day: "numeric", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </span>
                      </div>
                      <div className="results-messages-modal__detail-body">
                        {openMessage.body}
                      </div>

                      {/* Replies thread */}
                      {(openMessage.replies ?? []).length > 0 && (
                        <div className="results-messages-modal__replies">
                          <p className="results-messages-modal__replies-label">
                            {openMessage.replies!.length} repl{openMessage.replies!.length === 1 ? "y" : "ies"}
                          </p>
                          {openMessage.replies!.map((r) => (
                            <div key={r._id} className="results-messages-modal__reply">
                              <div className="results-messages-modal__reply-meta">
                                <span className="results-messages-modal__reply-from">
                                  {r.from
                                    ? [r.from.firstName, r.from.lastName].filter(Boolean).join(" ") || r.from.email || "You"
                                    : "You"}
                                </span>
                                <span className="results-messages-modal__reply-time">
                                  {new Date(r.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <p className="results-messages-modal__reply-body">{r.body}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply compose */}
                      <div className="results-messages-modal__compose">
                        <textarea
                          className="results-messages-modal__compose-input"
                          rows={3}
                          placeholder="Write a reply…"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        />
                        {replyError && (
                          <p className="results-report-modal__msg results-report-modal__msg--error">{replyError}</p>
                        )}
                        <button
                          type="button"
                          className="results-btn results-btn--primary results-messages-modal__reply-btn"
                          onClick={handleSendReply}
                          disabled={replyLoading || !replyText.trim()}
                        >
                          {replyLoading ? "Sending…" : "Send Reply"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Incident Report modal ─────────────────────────────────────────── */}
      {showReportModal && (
        <div
          className="results-report-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
          onClick={() => setShowReportModal(false)}
        >
          <div
            className="results-report-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="results-report-modal__header">
              <div className="results-report-modal__header-left">
                <div className="results-report-modal__header-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div>
                  <h2 id="report-modal-title" className="results-report-modal__title">
                    Incident Report
                  </h2>
                  <p className="results-report-modal__subtitle">
                    Select the incident type(s) and submit a report for your assigned location
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="results-report-modal__close"
                onClick={() => setShowReportModal(false)}
                aria-label="Close"
              >✕</button>
            </div>

            {/* Scrollable body */}
            <div className="results-report-modal__body">

              {/* Election selector — only show if more than one active election */}
              {electionsList.length > 1 && (
                <div className="results-report-modal__field">
                  <label className="results-report-modal__label" htmlFor="report-election-select">
                    Election
                  </label>
                  <select
                    id="report-election-select"
                    className="results-report-modal__select"
                    value={reportElectionId}
                    onChange={(e) => setReportElectionId(e.target.value)}
                  >
                    <option value="">— Select election —</option>
                    {electionsList.map((el: { _id: string; name: string }) => (
                      <option key={el._id} value={el._id}>{el.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category + items */}
              <div className="results-report-modal__categories">
                {REPORT_CATEGORIES.map((cat) => {
                  const items = REPORT_ITEMS_BY_CATEGORY[cat];
                  const isActive = reportCategory === cat;
                  return (
                    <div
                      key={cat}
                      className={`results-report-modal__category${isActive ? " results-report-modal__category--active" : ""}`}
                    >
                      {/* Category header — click to expand/collapse */}
                      <button
                        type="button"
                        className="results-report-modal__category-header"
                        onClick={() => {
                          if (isActive) {
                            setReportCategory("");
                            setReportSelectedItems([]);
                          } else {
                            setReportCategory(cat);
                            setReportSelectedItems([]);
                          }
                        }}
                      >
                        <span className="results-report-modal__category-label">
                          {REPORT_CATEGORY_LABELS[cat]}
                        </span>
                        <span className="results-report-modal__category-chevron">
                          {isActive ? "▲" : "▼"}
                        </span>
                      </button>

                      {/* Items — only shown when this category is active */}
                      {isActive && (
                        <div className="results-report-modal__items">
                          {items.map((item) => {
                            const checked = reportSelectedItems.includes(item);
                            return (
                              <label
                                key={item}
                                className={`results-report-modal__item${checked ? " results-report-modal__item--checked" : ""}`}
                              >
                                <input
                                  type="checkbox"
                                  className="results-report-modal__checkbox"
                                  checked={checked}
                                  onChange={() => handleReportItemToggle(item)}
                                />
                                <span className="results-report-modal__item-text">{item}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Notes */}
              <div className="results-report-modal__field" style={{ marginTop: "1rem" }}>
                <label className="results-report-modal__label" htmlFor="report-notes">
                  Additional notes <span style={{ fontWeight: 400, color: "#9ca3af" }}>(optional)</span>
                </label>
                <textarea
                  id="report-notes"
                  className="results-report-modal__textarea"
                  rows={3}
                  placeholder="Describe what happened…"
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                />
              </div>

              {/* Selected summary */}
              {reportSelectedItems.length > 0 && (
                <div className="results-report-modal__selected-summary">
                  <span className="results-report-modal__selected-label">Selected:</span>
                  <div className="results-report-modal__selected-tags">
                    {reportSelectedItems.map((item) => (
                      <span key={item} className="results-report-modal__selected-tag">
                        {item}
                        <button
                          type="button"
                          className="results-report-modal__selected-tag-remove"
                          onClick={() => handleReportItemToggle(item)}
                          aria-label={`Remove ${item}`}
                        >×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Status message */}
              {reportMsg && (
                <p className={`results-report-modal__msg results-report-modal__msg--${reportMsg.type}`}>
                  {reportMsg.text}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="results-report-modal__footer">
              <button
                type="button"
                className="results-btn results-report-modal__cancel-btn"
                onClick={() => setShowReportModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="results-btn results-btn--primary results-report-modal__submit-btn"
                onClick={handleSubmitReport}
                disabled={reportSubmitting || reportSelectedItems.length === 0 || !reportElectionId}
              >
                {reportSubmitting ? "Submitting…" : `Submit Report${reportSelectedItems.length > 0 ? ` (${reportSelectedItems.length})` : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Over-voting full-page modal ───────────────────────────────────── */}
      {showOverVotingModal && (
        <div
          className="results-overvote-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="overvote-modal-title"
          onClick={() => setShowOverVotingModal(false)}
        >
          <div
            className="results-overvote-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Sticky header ── */}
            <div className="results-overvote-modal__header">
              <div className="results-overvote-modal__header-left">
                <div className="results-overvote-modal__header-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div>
                  <h2
                    id="overvote-modal-title"
                    className="results-overvote-modal__title"
                  >
                    Over-Voting Report
                  </h2>
                  <p className="results-overvote-modal__subtitle">
                    Polling units where total votes cast exceeds accredited voters
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="results-overvote-modal__close"
                onClick={() => setShowOverVotingModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="results-overvote-modal__body">
              {overVotingLoading ? (
                <div className="results-pu-cards-loading" style={{ padding: "3rem 0" }}>
                  <span className="results-pu-cards-loading__spinner" />
                  <span className="results-pu-cards-loading__text">
                    Loading over-voting data…
                  </span>
                </div>
              ) : !overVotingData || overVotingData.overVotingUnits.length === 0 ? (
                <div className="results-overvote-modal__empty">
                  <span className="results-overvote-modal__empty-icon">✓</span>
                  <p>No over-voting detected across all polling units.</p>
                </div>
              ) : (
                <>
                  {/* Summary bar */}
                  {(() => {
                    const totalExcess = overVotingData.overVotingUnits.reduce((s, u) => s + u.excess, 0);

                    // Tally total votes per aspirant across all affected polling units
                    const aspirantTally = new Map<string, {
                      aspirantName: string;
                      partyCode: string;
                      partyLogo: string | null;
                      partyColor: string | null;
                      totalVotes: number;
                    }>();
                    for (const unit of overVotingData.overVotingUnits) {
                      for (const a of unit.aspirants) {
                        const existing = aspirantTally.get(a.aspirantId);
                        if (existing) {
                          existing.totalVotes += a.votes;
                        } else {
                          aspirantTally.set(a.aspirantId, {
                            aspirantName: a.aspirantName,
                            partyCode: a.partyCode,
                            partyLogo: a.partyLogo,
                            partyColor: a.partyColor,
                            totalVotes: a.votes,
                          });
                        }
                      }
                    }
                    const beneficiary = [...aspirantTally.values()]
                      .filter((a) => a.totalVotes > 0)
                      .sort((a, b) => b.totalVotes - a.totalVotes)[0] ?? null;
                    const bColor = beneficiary?.partyColor ?? "#374151";

                    return (
                      <div className="results-overvote-modal__summary">
                        <div className="results-overvote-modal__summary-left">
                          <span className="results-overvote-modal__summary-badge">
                            {overVotingData.overVotingUnits.length} affected polling unit{overVotingData.overVotingUnits.length !== 1 ? "s" : ""}
                          </span>
                          <span className="results-overvote-modal__summary-excess">
                            Total excess:{" "}
                            <strong>+{totalExcess.toLocaleString()}</strong> votes
                          </span>
                        </div>

                        {beneficiary && (
                          <div className="results-overvote-modal__beneficiary">
                            <span className="results-overvote-modal__beneficiary-label">
                              Most benefiting:
                            </span>
                            {beneficiary.partyLogo ? (
                              <img
                                src={beneficiary.partyLogo}
                                alt={beneficiary.partyCode}
                                className="results-overvote-modal__beneficiary-logo"
                              />
                            ) : beneficiary.partyCode ? (
                              <span
                                className="results-overvote-modal__beneficiary-logo results-overvote-modal__beneficiary-logo--initials"
                                style={{ background: bColor }}
                              >
                                {beneficiary.partyCode.charAt(0)}
                              </span>
                            ) : null}
                            <span
                              className="results-overvote-modal__beneficiary-party"
                              style={{ background: bColor }}
                            >
                              {beneficiary.partyCode}
                            </span>
                            <span className="results-overvote-modal__beneficiary-name">
                              {beneficiary.aspirantName}
                            </span>
                            <span className="results-overvote-modal__beneficiary-votes">
                              {beneficiary.totalVotes.toLocaleString()} votes
                            </span>
                          </div>
                        )}

                        <span className="results-overvote-modal__summary-note">
                          Sorted by highest excess
                        </span>
                      </div>
                    );
                  })()}

                  {/* Cards list */}
                  <div className="results-overvote-modal__list">
                    {overVotingData.overVotingUnits.map((unit, idx) => (
                      <div key={unit.pollingUnitId} className="results-overvote-row">

                        {/* ── Card header: rank + PU name/code + excess badge ── */}
                        <div className="results-overvote-row__header">
                          <span className="results-overvote-row__rank">#{idx + 1}</span>
                          <div className="results-overvote-row__pu">
                            <span className="results-overvote-row__pu-name">
                              {unit.pollingUnitName}
                            </span>
                            {unit.pollingUnitCode && (
                              <span className="results-overvote-row__pu-code">
                                Code: {unit.pollingUnitCode}
                              </span>
                            )}
                          </div>
                          <span className="results-overvote-row__excess">
                            +{unit.excess.toLocaleString()} excess
                          </span>
                        </div>

                        {/* ── Stats row ── */}
                        <div className="results-overvote-row__stats">
                          <div className="results-overvote-row__stat">
                            <span className="results-overvote-row__stat-label">Accredited Voters</span>
                            <span className="results-overvote-row__stat-value">
                              {unit.accreditedCount.toLocaleString()}
                            </span>
                          </div>
                          <div className="results-overvote-row__stat">
                            <span className="results-overvote-row__stat-label">Total Votes Cast</span>
                            <span className="results-overvote-row__stat-value results-overvote-row__stat-value--alert">
                              {unit.totalVotesCast.toLocaleString()}
                            </span>
                          </div>
                          <div className="results-overvote-row__stat">
                            <span className="results-overvote-row__stat-label">Excess Votes</span>
                            <span className="results-overvote-row__stat-value results-overvote-row__stat-value--alert results-overvote-row__stat-value--diff">
                              +{unit.excess.toLocaleString()}
                            </span>
                          </div>
                          <div className="results-overvote-row__stat">
                            <span className="results-overvote-row__stat-label">Over-vote %</span>
                            <span className="results-overvote-row__stat-value results-overvote-row__stat-value--alert">
                              +{((unit.excess / unit.accreditedCount) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        {/* ── Presiding Officer details ── */}
                        <div className="results-overvote-row__section-label">Presiding Officer</div>
                        {unit.agent ? (
                          <div className="results-overvote-row__agent">
                            <div className="results-overvote-row__agent-avatar">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                              </svg>
                            </div>
                            <div className="results-overvote-row__agent-details">
                              <div className="results-overvote-row__agent-row">
                                <span className="results-overvote-row__agent-name">
                                  {unit.agent.name || "—"}
                                </span>
                                {unit.agent.role && (
                                  <span className="results-overvote-row__agent-role">
                                    {unit.agent.role.replace(/_/g, " ")}
                                  </span>
                                )}
                              </div>
                              <div className="results-overvote-row__agent-contacts">
                                {unit.agent.phone && (
                                  <span className="results-overvote-row__agent-contact">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
                                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1 19.79 19.79 0 0 1 1.61 4.49 2 2 0 0 1 3.6 2.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.07 6.07l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17z"/>
                                    </svg>
                                    {unit.agent.phone}
                                  </span>
                                )}
                                {unit.agent.email && (
                                  <span className="results-overvote-row__agent-contact">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
                                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                      <polyline points="22,6 12,13 2,6"/>
                                    </svg>
                                    {unit.agent.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="results-overvote-row__agent results-overvote-row__agent--none">
                            <div className="results-overvote-row__agent-avatar results-overvote-row__agent-avatar--none">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                              </svg>
                            </div>
                            <span className="results-overvote-row__agent-no-record">
                              No presiding officer on record
                            </span>
                          </div>
                        )}

                        {/* ── Aspirants breakdown ── */}
                        {unit.aspirants.length > 0 && (
                          <>
                            <div className="results-overvote-row__section-label">
                              Aspirant Votes Breakdown
                            </div>
                            <div className="results-overvote-row__aspirants">
                              {unit.aspirants.map((a, aIdx) => {
                                const color = a.partyColor ?? "#374151";
                                const isTopVoter = aIdx === 0 && a.votes > 0;
                                const posOrdinals = ["1st", "2nd", "3rd", "4th", "5th"];
                                const posLabel = aIdx < posOrdinals.length ? posOrdinals[aIdx] : `${aIdx + 1}th`;
                                const pct = unit.totalVotesCast > 0
                                  ? ((a.votes / unit.totalVotesCast) * 100).toFixed(1)
                                  : "0.0";
                                return (
                                  <div
                                    key={a.aspirantId}
                                    className={`results-overvote-row__aspirant${isTopVoter ? " results-overvote-row__aspirant--leading" : ""}`}
                                  >
                                    <span className={`results-overvote-row__aspirant-pos${isTopVoter ? " results-overvote-row__aspirant-pos--first" : ""}`}>
                                      {posLabel}
                                    </span>
                                    {a.partyLogo ? (
                                      <img
                                        src={a.partyLogo}
                                        alt={a.partyCode}
                                        className="results-overvote-row__aspirant-logo"
                                      />
                                    ) : a.partyCode ? (
                                      <span
                                        className="results-overvote-row__aspirant-logo results-overvote-row__aspirant-logo--initials"
                                        style={{ background: color }}
                                      >
                                        {a.partyCode.charAt(0)}
                                      </span>
                                    ) : null}
                                    {a.partyCode && (
                                      <span
                                        className="results-overvote-row__aspirant-party"
                                        style={{ background: color }}
                                      >
                                        {a.partyCode}
                                      </span>
                                    )}
                                    <span className="results-overvote-row__aspirant-name">
                                      {a.aspirantName}
                                    </span>
                                    <div className="results-overvote-row__aspirant-right">
                                      <span className={`results-overvote-row__aspirant-votes${isTopVoter ? " results-overvote-row__aspirant-votes--leading" : ""}`}>
                                        {a.votes.toLocaleString()} votes
                                      </span>
                                      <span className="results-overvote-row__aspirant-pct">
                                        {pct}%
                                      </span>
                                    </div>
                                    {isTopVoter && (
                                      <span className="results-aspirant-row__leading-badge">
                                        Leading
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
