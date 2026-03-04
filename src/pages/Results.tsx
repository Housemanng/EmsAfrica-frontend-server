import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../app/store";
import { store } from "../app/store";
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
  getThread,
  replyToMessage,
  sendDirectMessage,
  clearOpenMessage,
  selectInbox,
  selectInboxLoading,
  selectThreads,
  selectThreadLoading,
  selectUnreadCount,
  selectOpenMessage,
  selectOpenMessageLoading,
  selectReplyError,
  selectOnlineUserIds,
  selectTypingUserId,
  appendToThread,
  setOnlineUsers,
  setTypingUser,
  socketNewMessage,
  socketNewReply,
} from "../features/messages";
import { getSocket } from "../services/socket";
import { playMessageNotificationSound } from "../services/notificationSound";
import { getRegularAdminsByOrganizationId } from "../features/user/userApi";
import { selectRegularAdminsByOrganizationId } from "../features/user/userSelectors";
import { FiSend } from "react-icons/fi";
import { MessageStatusIcon } from "../components/MessageStatusIcon";
import ShareResultModal from "../components/ShareResultModal";
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
const IconShare = () => (
  <svg
    className="results-pu-card__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
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
  onSharePrint,
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
  onSharePrint?: (electionId: string) => void;
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
                    const hasResultsToShare =
                      (collationResults.some((r) => (r.votes ?? 0) > 0) ||
                        (aspirantTotals?.aspirants ?? []).some((a) => (a.totalVotes ?? 0) > 0)) &&
                      (expandedAspirants?.length ?? 0) > 0;
                    if (!hasUnsavedAspirants && !selectedFile && !hasResultsToShare) return null;
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
                        {/* Share / Print result — when we have results to display */}
                        {hasResultsToShare && onSharePrint && (
                          <button
                            type="button"
                            className="results-btn results-btn--share-print"
                            onClick={() => onSharePrint(el._id)}
                            title="Share / Print result"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              width="14"
                              height="14"
                              style={{ flexShrink: 0 }}
                            >
                              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                              <path d="M4 22h16" />
                              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                            </svg>
                            Share / Print result
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
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [showSidebarDrawer, setShowSidebarDrawer] = useState(false);
  const msgBottomRef = useRef<HTMLDivElement>(null);

  // ── Share / Print result modal ─────────────────────────────────────────────
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareElectionIdForModal, setShareElectionIdForModal] = useState<string | null>(null);

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
  // Pass location so backend filters to elections that apply to this agent
  const electionsQuery = useMemo(() => {
    const q: { includeResults: boolean; lgaId?: string; wardId?: string; pollingUnitId?: string } = {
      includeResults: true,
    };
    if (level === "polling_unit" && locationIdForRole) {
      q.pollingUnitId = locationIdForRole;
    } else if (level === "ward" && locationIdForRole) {
      q.wardId = locationIdForRole;
    } else if (level === "lga" && locationIdForRole) {
      q.lgaId = locationIdForRole;
    }
    return q;
  }, [level, locationIdForRole]);
  const _selectElectionsByOrg = useMemo(
    () => selectElectionsByOrganizationId(organizationId ?? "", electionsQuery),
    [organizationId, electionsQuery],
  );
  const electionsWithTotals = useSelector(_selectElectionsByOrg) ?? [];
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

  const electionsList = useMemo(
    () =>
      (Array.isArray(elections) ? elections : []).filter(
        (e: { _id?: string; name?: string; status?: string }) => e.status === "active",
      ),
    // elections is a direct Redux cache reference — stable unless data changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [elections],
  );

  useEffect(() => {
    dispatch(getElections());
    dispatch(getParties());
  }, [dispatch]);

  // Messages are loaded on-demand when the user opens the modal — no background fetch.

  useEffect(() => {
    if (organizationId) {
      dispatch(
        getElectionsByOrganizationId({
          organizationId,
          query: electionsQuery,
        }),
      );
    }
  }, [dispatch, organizationId, JSON.stringify(electionsQuery)]);

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
    String((user as { _id?: string; id?: string })?._id ?? (user as { _id?: string; id?: string })?.id ?? "");

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
  const electionsListIds = useMemo(() => electionsList.map((e: { _id?: string }) => e._id as string), [electionsList]);
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
            query: electionsQuery,
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

  const _selectAllPresence = useMemo(
    () => selectListPresence(puElectionId ? { electionId: puElectionId } : {}),
    [puElectionId],
  );
  const allPresenceData = useSelector(_selectAllPresence);
  const presenceCount = puElectionId
    ? (allPresenceData?.count ?? (allPresenceData?.presence ?? []).length)
    : 0;
  // hasMarkedPresence and presenceFetched are managed via direct .unwrap() promise above.

  const _selectAccreditation = useMemo(
    () => selectAccreditedVotersByPollingUnit(organizationId || "", puViewPollingUnitId || "", puViewElectionId || ""),
    [organizationId, puViewPollingUnitId, puViewElectionId],
  );
  const _selectAccreditationLoading = useMemo(
    () => selectAccreditedVotersByPollingUnitLoading(organizationId || "", puViewPollingUnitId || "", puViewElectionId || ""),
    [organizationId, puViewPollingUnitId, puViewElectionId],
  );
  const accreditationData    = useSelector(_selectAccreditation);
  const accreditationLoading = useSelector(_selectAccreditationLoading);
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
  const replyError     = useSelector(selectReplyError);

  // ── Org regular-admins for the message modal ─────────────────────────────
  const _selectRegularUsersMsg = useMemo(
    () => selectRegularAdminsByOrganizationId(organizationId || ""),
    [organizationId],
  );
  const regularUserListRaw = (useSelector(_selectRegularUsersMsg) ?? []) as {
    _id?: string; id?: string; firstName?: string; lastName?: string;
    email?: string; role?: string; photo?: string;
  }[];
  // Exclude current user so we never show "chat with self"
  const regularUserList = useMemo(
    () => regularUserListRaw.filter((u) => String(u._id ?? u.id ?? "") !== String(currentUserId)),
    [regularUserListRaw, currentUserId],
  );

  // Inbox messages from others (not self)
  const inboxFromOthers = useMemo(
    () => inbox.filter((m) => {
      const sid = m.from ? String((m.from as { _id?: string })?._id ?? (m.from as { id?: string })?.id ?? "") : "";
      return sid !== currentUserId;
    }),
    [inbox, currentUserId],
  );

  // Inbox conversations: one per sender (direct messages only), with latest message (like Regular users)
  const inboxConversations = useMemo(() => {
    const directOnly = inboxFromOthers.filter((m) => (m as { targetType?: string }).targetType === "direct");
    const bySender = new Map<string, { sender: unknown; messages: typeof inboxFromOthers }>();
    for (const m of directOnly) {
      const sid = m.from ? String((m.from as { _id?: string })?._id ?? (m.from as { id?: string })?.id ?? "") : "";
      if (!sid) continue;
      if (!bySender.has(sid)) {
        bySender.set(sid, { sender: m.from, messages: [] });
      }
      bySender.get(sid)!.messages.push(m);
    }
    return Array.from(bySender.entries())
      .map(([senderId, { sender, messages }]) => {
        const sorted = [...messages].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const latest = sorted[0];
        const hasUnread = sorted.some((msg) => msg.isRead !== undefined ? !msg.isRead : !readIds.includes(msg._id));
        return { senderId, sender, latestMessage: latest, hasUnread };
      })
      .sort((a, b) =>
        new Date(b.latestMessage.createdAt).getTime() - new Date(a.latestMessage.createdAt).getTime()
      );
  }, [inboxFromOthers, readIds]);

  const threads = useSelector(selectThreads);
  const threadLoading = useSelector(selectThreadLoading);
  const onlineUserIds = useSelector(selectOnlineUserIds);
  const typingUserId = useSelector(selectTypingUserId);

  // Org-wide accreditation totals (for overview roles only)
  const _selectOrgAccreditation = useMemo(
    () => selectAllAccreditationByOrganization(organizationId || "", puViewElectionId || ""),
    [organizationId, puViewElectionId],
  );
  const orgAccreditationRaw = useSelector(_selectOrgAccreditation) as
    | { totalAccreditedVoters?: number; total?: number }
    | undefined;
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
  const _selectFirstCoverage = useMemo(
    () => selectPollingUnitsCoverage(puViewElectionId || ""),
    [puViewElectionId],
  );
  const firstElectionCoverage = useSelector(_selectFirstCoverage);
  const totalPUs = firstElectionCoverage?.total ?? null;
  const puWithAccreditation = orgAccreditationData?.total ?? 0;
  const remainingPUs = totalPUs != null ? totalPUs - puWithAccreditation : null;
  const totalAccreditedVotersOrg =
    orgAccreditationData?.totalAccreditedVoters ?? null;

  // Over-voting detail data (fetched on demand when modal is opened)
  const _selectOverVoting = useMemo(
    () => selectOverVotingByOrganization(organizationId || "", puViewElectionId || ""),
    [organizationId, puViewElectionId],
  );
  const _selectOverVotingLoading = useMemo(
    () => selectOverVotingByOrganizationLoading(organizationId || "", puViewElectionId || ""),
    [organizationId, puViewElectionId],
  );
  const overVotingData    = useSelector(_selectOverVoting);
  const overVotingLoading = useSelector(_selectOverVotingLoading);

  // Share/Print: collation data for current election + location (use shareElectionIdForModal when modal opened from card)
  const shareElectionIdEffective = shareElectionIdForModal ?? puElectionId ?? "";
  const _selectShareCollation = useMemo(() => {
    if (!shareElectionIdEffective || !locationIdForRole) return (_s: RootState) => [] as Array<{ aspirant?: { name?: string; partyCode?: string }; votes?: number }>;
    if (level === "polling_unit") {
      const sel = selectResultsByPollingUnit(shareElectionIdEffective, locationIdForRole);
      return (s: RootState) => ((sel(s) as { results?: unknown[] })?.results ?? []) as Array<{ aspirant?: { name?: string; partyCode?: string }; votes?: number }>;
    }
    if (level === "ward") {
      const sel = selectWardCollation(shareElectionIdEffective, locationIdForRole);
      return (s: RootState) => ((sel(s) as { results?: unknown[] })?.results ?? []) as Array<{ aspirant?: { name?: string; partyCode?: string }; votes?: number }>;
    }
    if (level === "lga") {
      const sel = selectLgaCollation(shareElectionIdEffective, locationIdForRole);
      return (s: RootState) => ((sel(s) as { results?: unknown[] })?.results ?? []) as Array<{ aspirant?: { name?: string; partyCode?: string }; votes?: number }>;
    }
    if (level === "state") {
      const sel = selectStateCollation(shareElectionIdEffective, locationIdForRole);
      return (s: RootState) => ((sel(s) as { results?: unknown[] })?.results ?? []) as Array<{ aspirant?: { name?: string; partyCode?: string }; votes?: number }>;
    }
    return (_s: RootState) => [] as Array<{ aspirant?: { name?: string; partyCode?: string }; votes?: number }>;
  }, [shareElectionIdEffective, locationIdForRole, level]);
  const shareCollationRaw = useSelector(_selectShareCollation);
  const shareElection = electionsList.find((e: { _id?: string }) => e._id === shareElectionIdEffective);
  const shareLocationName =
    level === "polling_unit"
      ? getLocationName(u?.pollingUnit)
      : level === "ward"
        ? getLocationName(u?.ward)
        : level === "lga"
          ? getLocationName(u?.lga)
          : level === "state"
            ? getLocationName(u?.state)
            : "—";
  const shareLocationLabel =
    level === "polling_unit"
      ? "Polling Unit"
      : level === "ward"
        ? "Ward"
        : level === "lga"
          ? "LGA"
          : level === "state"
            ? "State"
            : "Location";
  const shareAspirants = (() => {
    const sorted = [...shareCollationRaw].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
    const ordinals = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
    return sorted.map((r, i) => ({
      name: r.aspirant?.name ?? "—",
      partyCode: r.aspirant?.partyCode ?? "",
      votes: r.votes ?? 0,
      positionLabel: ordinals[i] ?? `${i + 1}th`,
    }));
  })();
  const shareTotalVotes = shareAspirants.reduce((s, a) => s + a.votes, 0);
  const canShare =
    !!shareElectionIdEffective &&
    !!locationIdForRole &&
    shareAspirants.length > 0 &&
    shareTotalVotes > 0;

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
        if (showSidebarDrawer) {
          setShowSidebarDrawer(false);
        } else {
          setShowAccreditedModal(false);
          setShowVoteStartConfirm(false);
          setShowVoteEndConfirm(false);
          setShowAccStartConfirm(false);
          setShowAccEndConfirm(false);
          setShowOverVotingModal(false);
          setShowReportModal(false);
          setShowShareModal(false);
          setShowMessagesModal(false);
        }
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showSidebarDrawer]);

  const handleOpenMessagesModal = () => {
    setReplyText("");
    setActiveUserId(null);
    setShowSidebarDrawer(false);
    dispatch(clearOpenMessage());
    if (organizationId) {
      dispatch(getMyMessages(organizationId));
      dispatch(getRegularAdminsByOrganizationId(organizationId));
    }
    setShowMessagesModal(true);
  };

  const handleSelectUser = (userId: string) => {
    if (String(userId) === String(currentUserId)) return; // never select self
    setActiveUserId(userId);
    setShowSidebarDrawer(false);
    dispatch(clearOpenMessage());
    setReplyText("");
  };

  const handleSendReply = async () => {
    if (!organizationId || !replyText.trim()) return;
    if (activeUserId && String(activeUserId) === String(currentUserId)) return; // never send to self
    const text = replyText.trim();
    setReplyText("");
    try {
      if (activeUserId && !openMessage) {
        // Optimistic: show message immediately
        const optMsg = {
          _id: `opt-${Date.now()}`,
          from: user ?? undefined,
          title: "Direct Message",
          body: text,
          createdAt: new Date().toISOString(),
          targetType: "direct" as const,
          targetId: activeUserId,
        } as import("../features/messages/messageApi").IMessage;
        dispatch(appendToThread({ agentId: activeUserId, message: optMsg }));
        await dispatch(sendDirectMessage({ organizationId, targetUserId: activeUserId, body: text })).unwrap();
      } else if (openMessage) {
        await dispatch(replyToMessage({ organizationId, messageId: openMessage._id, body: text })).unwrap();
        dispatch(getMessageById({ organizationId, messageId: openMessage._id }));
      }
    } catch { /* error handled by redux */ }
    setTimeout(() => msgBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleMsgKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // Real-time messages via Socket.io — no polling
  useEffect(() => {
    if (!organizationId) return;
    const socket = getSocket();
    const uid = String((user as { _id?: string; id?: string })?._id ?? (user as { _id?: string; id?: string })?.id ?? "");
    socket.emit("join:org", { organizationId, userId: uid });

    socket.on("users:online", (payload: { userIds?: string[] }) => {
      dispatch(setOnlineUsers(payload.userIds ?? []));
    });
    const onNewMessage = (msg: { _id: string; targetType?: string; targetId?: string; from?: { _id?: string } | unknown; body?: string; title?: string; createdAt?: string; updatedAt?: string; isRead?: boolean }) => {
      dispatch(socketNewMessage(msg as Parameters<typeof socketNewMessage>[0]));
      const fromId = String((msg.from as { _id?: string })?._id ?? "");
      if (fromId && fromId !== uid) playMessageNotificationSound();
    };
    const onNewReply = (payload: { reply: Parameters<typeof socketNewReply>[0]["reply"]; parentId: string }) => {
      dispatch(socketNewReply(payload));
      const fromId = String((payload.reply?.from as { _id?: string })?._id ?? "");
      if (fromId && fromId !== uid) playMessageNotificationSound();
    };

    socket.on("new_message", onNewMessage);
    socket.on("new_reply", onNewReply);

    let typingClearTimer: ReturnType<typeof setTimeout> | null = null;
    socket.on("user_typing", (payload: { userId: string; targetUserId: string }) => {
      const { userId, targetUserId } = payload ?? {};
      if (targetUserId === uid) {
        dispatch(setTypingUser(userId ?? null));
        if (typingClearTimer) clearTimeout(typingClearTimer);
        typingClearTimer = setTimeout(() => dispatch(setTypingUser(null)), 3000);
      }
    });
    socket.on("user_typing_stop", (payload: { userId: string; targetUserId: string }) => {
      const { userId, targetUserId } = payload ?? {};
      const currentTyping = store.getState().messages.typingUserId;
      if (targetUserId === uid && currentTyping === userId) {
        if (typingClearTimer) clearTimeout(typingClearTimer);
        dispatch(setTypingUser(null));
      }
    });

    return () => {
      if (typingClearTimer) clearTimeout(typingClearTimer);
      try {
        socket.off("users:online");
        socket.off("new_message");
        socket.off("new_reply");
        socket.off("user_typing");
        socket.off("user_typing_stop");
      } catch (_) {
        /* ignore */
      }
    };
  }, [dispatch, organizationId, user]);

  // Fetch thread when selecting a regular user for direct message
  useEffect(() => {
    if (organizationId && activeUserId && !openMessage) {
      dispatch(getThread({ organizationId, agentId: activeUserId }));
    }
  }, [dispatch, organizationId, activeUserId, openMessage]);

  // Scroll to bottom when thread or open message updates
  useEffect(() => {
    if (openMessage || (activeUserId && (threads[activeUserId] ?? []).length > 0)) {
      setTimeout(() => msgBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [openMessage, activeUserId, threads]);

  // Emit typing when user types (direct thread only)
  const typingStopRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!organizationId || !currentUserId || !activeUserId || openMessage) return;
    const socket = getSocket();
    const emitStop = () => {
      socket.emit("typing:stop", { organizationId, userId: currentUserId, targetUserId: activeUserId });
    };
    if (replyText.trim()) {
      socket.emit("typing", { organizationId, userId: currentUserId, targetUserId: activeUserId });
      if (typingStopRef.current) clearTimeout(typingStopRef.current);
      typingStopRef.current = setTimeout(emitStop, 2000);
    } else {
      emitStop();
    }
    return () => {
      if (typingStopRef.current) clearTimeout(typingStopRef.current);
    };
  }, [organizationId, currentUserId, activeUserId, openMessage, replyText]);

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

  const _selectExpandedAspirants = useMemo(
    () => selectAspirantsByElection(expandedElectionId ?? ""),
    [expandedElectionId],
  );
  const _selectExpandedAspirantsLoading = useMemo(
    () => selectAspirantsByElectionLoading(expandedElectionId ?? ""),
    [expandedElectionId],
  );
  const expandedAspirants = useSelector(_selectExpandedAspirants) as
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
  const expandedAspirantsLoading = useSelector(_selectExpandedAspirantsLoading);

  return (
    <div className="results-page">
      <div className="results-page__header">
        <div>
          <p className="results-page__breadcrumb">EMS / Results</p>
          <h1 className="results-page__title">Enter Results</h1>
        </div>
        {!isOverviewRole && (
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
              className="results-btn results-btn--share"
              onClick={() => setShowShareModal(true)}
              disabled={!canShare}
              title={canShare ? "Share / Print result" : "Select an election with results to share"}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15" aria-hidden="true">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
              Share Result
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
        )}
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

      {isPO && electionsList.length === 0 ? (
        <p className="results-view__empty" style={{ margin: 0 }}>There is no election</p>
      ) : (organizationId || electionsList.length > 0 || isPO) ? (
        <div className="results-card results-pu-upper">
          <h2 className="results-card__heading">
            Polling Unit – Voting - Presence - Accreditation
          </h2>

          {/* Progress bar: Mark presence → Voting ended (PO agents only) */}
          {isPO && puElectionId && (hasMarkedPresence || presenceFetched) && (
            <div className="results-pu-progress">
              <div className="results-pu-progress__header">
                <span className="results-pu-progress__label">Election progress</span>
                <span className="results-pu-progress__count">
                  {(() => {
                    const n = [
                      hasMarkedPresence,
                      !!accreditationStartedAt,
                      !!accreditationEndedAt,
                      accreditedCount != null,
                      !!votingStartedAt,
                      !!votingEndedAt,
                    ].filter(Boolean).length;
                    return n === 6 ? "Completed" : `${n}/6 steps`;
                  })()}
                </span>
              </div>
              <div className="results-pu-progress__bar">
                <div
                  className="results-pu-progress__fill"
                  style={{
                    width: `${([
                      hasMarkedPresence,
                      !!accreditationStartedAt,
                      !!accreditationEndedAt,
                      accreditedCount != null,
                      !!votingStartedAt,
                      !!votingEndedAt,
                    ].filter(Boolean).length /
                      6) *
                      100}%`,
                  }}
                />
              </div>
              {/* <div className="results-pu-progress__steps">
                {[
                  { key: "presence", label: "Presence", done: hasMarkedPresence },
                  { key: "acc-start", label: "Accreditation started", done: !!accreditationStartedAt },
                  { key: "acc-end", label: "Accreditation ended", done: !!accreditationEndedAt },
                  { key: "accredited", label: "Accredited voters", done: accreditedCount != null },
                  { key: "vote-start", label: "Voting started", done: !!votingStartedAt },
                  { key: "vote-end", label: "Voting ended", done: !!votingEndedAt },
                ].map((step) => (
                  <span
                    key={step.key}
                    className={`results-pu-progress__step${step.done ? " results-pu-progress__step--done" : ""}`}
                    title={step.done ? `✓ ${step.label}` : step.label}
                  >
                    {step.done ? "✓" : "○"} {step.label}
                  </span>
                ))}
              </div> */}
            </div>
          )}

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
                  {/* Share Result — visible when voting ended (PO agents only) */}
                  {(isPO && !!votingEndedAt) && canShare && (
                    <button
                      type="button"
                      className="results-pu-card results-pu-card--clickable"
                      onClick={() => setShowShareModal(true)}
                      title="Share / Print result"
                    >
                      <span className="results-pu-card__icon-wrap results-pu-card__icon-wrap--blue">
                        <IconShare />
                      </span>
                      <div className="results-pu-card__body">
                        <span className="results-pu-card__label">
                          Share Result
                        </span>
                        <span className="results-pu-card__value">
                          Print / Share
                        </span>
                        <span className="results-pu-card__sublabel">
                          View and print result sheet
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
      ) : null}

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
                  onSharePrint={!isOverviewRole ? (id) => { setShareElectionIdForModal(id); setShowShareModal(true); } : undefined}
                />
              ))}
            </div>
            {electionsList.length === 0 && !electionsLoading && (
              <p className="results-view__empty">No elections found.</p>
            )}
          </div>
        )}

      {/* ── Messages modal (agents only) ───────────────────────────────────── */}
      {!isOverviewRole && showMessagesModal && (
        <div
          className="results-messages-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="messages-modal-title"
                  onClick={() => { setShowMessagesModal(false); dispatch(clearOpenMessage()); setActiveUserId(null); }}
        >
          <div
            className="results-messages-modal results-messages-modal--chat"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Two-panel chat layout ── */}
            {showSidebarDrawer && (
              <div
                className="rmc-drawer-backdrop"
                onClick={() => setShowSidebarDrawer(false)}
                aria-hidden="true"
              />
            )}
            {/* LEFT: Regular users + Inbox — drawer on mobile */}
            <div className={`rmc-sidebar${showSidebarDrawer ? " rmc-sidebar--drawer-open" : ""}`}>
              <div className="rmc-sidebar__header">
                <div className="rmc-sidebar__title-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <h2 id="messages-modal-title" className="rmc-sidebar__title">Messages</h2>
                  {unreadCount > 0 && <span className="rmc-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
                </div>
                <div className="rmc-sidebar__header-actions">
                  <div className="rmc-sidebar__live">
                    <span className="rmc-live-dot" />
                    Live
                  </div>
                  <button
                    type="button"
                    className="rmc-sidebar__drawer-close"
                    onClick={() => setShowSidebarDrawer(false)}
                    aria-label="Close user list"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="rmc-sidebar__list">
                {/* Regular-role users — always shown at top so agent can initiate */}
                {regularUserList.length > 0 && (
                  <div className="rmc-section-label">Regular users</div>
                )}
                {regularUserList.map((u, uIdx) => {
                  const userId = String(u._id ?? u.id ?? "");
                  const isActive = activeUserId === userId && !openMessage;
                  // Online: current user, or the user we're actively chatting with
                  const isOnline = onlineUserIds.includes(userId) || String(userId) === String(currentUserId);
                  const initials = ((u.firstName?.[0] ?? "") + (u.lastName?.[0] ?? "")).toUpperCase() || "?";
                  const name = [u.firstName, (u as { middleName?: string }).middleName, u.lastName].filter(Boolean).join(" ") || u.email || "User";
                  return (
                    <button
                      key={`user-${userId}-${uIdx}`}
                      type="button"
                      className={`rmc-item${isActive ? " rmc-item--active" : ""}`}
                      onClick={() => handleSelectUser(userId)}
                    >
                      <div className="rmc-item__avatar-wrap">
                        {u.photo
                          ? <img src={u.photo} alt={name} className="rmc-avatar" />
                          : <div className="rmc-avatar rmc-avatar--initials">{initials}</div>
                        }
                        <span className={`rmc-item__status rmc-item__status--${isOnline ? "online" : "offline"}`} title={isOnline ? "Live" : "Offline"} />
                      </div>
                      <div className="rmc-item__content">
                        <div className="rmc-item__top">
                          <span className="rmc-item__name">{name}</span>
                        </div>
                        <div className="rmc-item__bottom">
                          <span className="rmc-item__preview" style={{ fontStyle: "italic", color: "#6b7280" }}>Regular</span>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Inbox — conversations by sender, same layout as Regular users; click shows full chat history */}
                {inboxConversations.length > 0 && (
                  <div className="rmc-section-label">Inbox</div>
                )}
                {inboxConversations.map((conv) => {
                  const senderId = conv.senderId;
                  const isActive = activeUserId === senderId && !openMessage;
                  const isOnline = onlineUserIds.includes(senderId) || senderId === currentUserId;
                  const sender = conv.sender as { firstName?: string; lastName?: string; middleName?: string; email?: string; photo?: string } | null;
                  const name = sender
                    ? [sender.firstName, sender.middleName, sender.lastName].filter(Boolean).join(" ") || sender.email || "Unknown"
                    : "Unknown";
                  const initials = sender
                    ? ((sender.firstName?.[0] ?? "") + (sender.lastName?.[0] ?? "")).toUpperCase() || "?"
                    : "?";
                  const latest = conv.latestMessage;
                  return (
                    <button
                      key={`inbox-${senderId}`}
                      type="button"
                      className={`rmc-item${isActive ? " rmc-item--active" : ""}${conv.hasUnread ? " rmc-item--unread" : ""}`}
                      onClick={() => handleSelectUser(senderId)}
                    >
                      <div className="rmc-item__avatar-wrap">
                        {sender?.photo
                          ? <img src={sender.photo} alt={name} className="rmc-avatar" />
                          : <div className="rmc-avatar rmc-avatar--initials">{initials}</div>
                        }
                        <span className={`rmc-item__status rmc-item__status--${isOnline ? "online" : "offline"}`} title={isOnline ? "Live" : "Offline"} />
                      </div>
                      <div className="rmc-item__content">
                        <div className="rmc-item__top">
                          <span className="rmc-item__name">{name}</span>
                          <span className="rmc-item__time">
                            {new Date(latest.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className="rmc-item__bottom">
                          <span className="rmc-item__preview">
                            {String(latest.body ?? "").slice(0, 45)}{String(latest.body ?? "").length > 45 ? "…" : ""}
                          </span>
                          {conv.hasUnread && <span className="rmc-item__dot" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {inboxLoading && inbox.length === 0 && regularUserList.length === 0 && (
                  <div className="rmc-empty"><span className="rmc-spinner" /><span>Loading…</span></div>
                )}
                {!inboxLoading && inbox.length === 0 && regularUserList.length === 0 && (
                  <div className="rmc-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" width="32" height="32">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <p>No messages yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Chat window */}
            <div className="rmc-chat">
              {/* Chat top bar */}
              <div className="rmc-chat__topbar">
                <button
                  type="button"
                  className="rmc-chat__drawer-toggle"
                  onClick={() => setShowSidebarDrawer(true)}
                  aria-label="Open user list"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
                {(() => {
                  // Determine the peer to show in the header
                  if (openMessage) {
                    return (
                      <>
                        {openMessage.from?.photo
                          ? <img src={openMessage.from.photo} alt="" className="rmc-avatar rmc-avatar--md" />
                          : (
                            <div className="rmc-avatar rmc-avatar--md rmc-avatar--initials">
                              {((openMessage.from?.firstName?.[0] ?? "") + (openMessage.from?.lastName?.[0] ?? "")).toUpperCase() || "?"}
                            </div>
                          )
                        }
                        <div className="rmc-chat__peer-info">
                          <span className="rmc-chat__peer-name">
                            {[openMessage.from?.firstName, (openMessage.from as { middleName?: string })?.middleName, openMessage.from?.lastName].filter(Boolean).join(" ") || openMessage.from?.email || "Unknown"}
                          </span>
                          {openMessage.from?.role && (
                            <span className="rmc-chat__peer-role">{openMessage.from.role.replace(/_/g, " ")}</span>
                          )}
                        </div>
                      </>
                    );
                  }
                  if (activeUserId) {
                    const u = regularUserList.find((a) => String(a._id ?? a.id ?? "") === activeUserId);
                    const inboxConv = inboxConversations.find((c) => c.senderId === activeUserId);
                    const sender = u ?? (inboxConv?.sender as { firstName?: string; lastName?: string; middleName?: string; email?: string; photo?: string } | undefined);
                    const name = sender
                      ? ([sender.firstName, (sender as { middleName?: string }).middleName, sender.lastName].filter(Boolean).join(" ") || (sender as { email?: string }).email || "User")
                      : "User";
                    const initials = sender ? ((sender.firstName?.[0] ?? "") + (sender.lastName?.[0] ?? "")).toUpperCase() || "?" : "?";
                    const roleLabel = u ? "Regular" : (inboxConv ? "Inbox" : "");
                    return (
                      <>
                        {sender?.photo
                          ? <img src={sender.photo} alt={name} className="rmc-avatar rmc-avatar--md" />
                          : <div className="rmc-avatar rmc-avatar--md rmc-avatar--initials">{initials}</div>
                        }
                        <div className="rmc-chat__peer-info">
                          <span className="rmc-chat__peer-name">{name}</span>
                          {roleLabel && <span className="rmc-chat__peer-role">{roleLabel}</span>}
                        </div>
                      </>
                    );
                  }
                  return <span className="rmc-chat__placeholder-title">Select a user or a message</span>;
                })()}
                <button
                  type="button"
                  className="rmc-chat__close"
                  onClick={() => { setShowMessagesModal(false); dispatch(clearOpenMessage()); setActiveUserId(null); }}
                  aria-label="Close"
                >✕</button>
              </div>

              {/* Messages body */}
              <div className="rmc-chat__body">
                {!openMessage && !activeUserId && !openMsgLoading && (
                  <div className="rmc-chat__empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" width="48" height="48">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <p className="rmc-chat__empty-text-desktop">Select a user or inbox conversation to view messages</p>
                    <p className="rmc-chat__empty-text-mobile">Tap the menu icon above to open the user list</p>
                  </div>
                )}
                {openMsgLoading && (
                  <div className="rmc-chat__loading">
                    <span className="rmc-spinner" />
                    <span>Loading…</span>
                  </div>
                )}

                {/* Direct message thread — user selected, show conversation */}
                {!openMsgLoading && activeUserId && !openMessage && (
                  <>
                    {threadLoading ? (
                      <div className="rmc-chat__loading">
                        <span className="rmc-spinner" />
                        <span>Loading…</span>
                      </div>
                    ) : (threads[activeUserId] ?? []).length === 0 ? (
                      <div className="rmc-chat__empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" width="40" height="40">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <p>Type your message below to start a conversation</p>
                      </div>
                    ) : (
                      <>
                        {(threads[activeUserId] ?? []).map((msg, mIdx) => {
                          const myId = String((user as { _id?: string })?._id ?? (user as { id?: string })?.id ?? "");
                          const fromId = String((msg.from as { _id?: string })?._id ?? (msg.from as { id?: string })?.id ?? "");
                          const isMine = fromId === myId;
                          const peerInitials = msg.from
                            ? ((msg.from.firstName?.[0] ?? "") + (msg.from.lastName?.[0] ?? "")).toUpperCase() || "?"
                            : "?";
                          const readBy = ((msg as { readBy?: unknown[] }).readBy ?? []) as (string | { toString(): string })[];
                          const isReadByRecipient = isMine && activeUserId && readBy.some((id) => String(id) === activeUserId);
                          return (
                            <div key={`dm-${msg._id}-${mIdx}`} className={`rmc-bubble-wrap${isMine ? " rmc-bubble-wrap--mine" : ""}`}>
                              {!isMine && (
                                msg.from?.photo
                                  ? <img src={msg.from.photo} alt="" className="rmc-avatar rmc-avatar--sm" />
                                  : <div className="rmc-avatar rmc-avatar--sm rmc-avatar--initials">{peerInitials}</div>
                              )}
                              <div className={`rmc-bubble${isMine ? " rmc-bubble--mine" : " rmc-bubble--theirs"}`}>
                                <p className="rmc-bubble__text">{msg.body}</p>
                                <div className="rmc-bubble__meta">
                                  <span className="rmc-bubble__time">
                                    {new Date(msg.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                  {isMine && <MessageStatusIcon read={!!isReadByRecipient} />}
                                </div>
                              </div>
                              {isMine && <div className="rmc-avatar rmc-avatar--sm rmc-avatar--mine-placeholder" />}
                            </div>
                          );
                        })}
                        <div ref={msgBottomRef} />
                      </>
                    )}
                  </>
                )}

                {!openMsgLoading && openMessage && (
                  <>
                    {/* Original message as a bubble */}
                    <div className="rmc-bubble-wrap">
                      {openMessage.from?.photo
                        ? <img src={openMessage.from.photo} alt="" className="rmc-avatar rmc-avatar--sm" />
                        : <div className="rmc-avatar rmc-avatar--sm rmc-avatar--initials">
                            {((openMessage.from?.firstName?.[0] ?? "") + (openMessage.from?.lastName?.[0] ?? "")).toUpperCase() || "?"}
                          </div>
                      }
                      <div className="rmc-bubble rmc-bubble--theirs">
                        <p className="rmc-bubble__text">{openMessage.body}</p>
                        <span className="rmc-bubble__time">
                          {new Date(openMessage.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>

                    {/* Replies as chat bubbles */}
                    {(openMessage.replies ?? []).map((r, rIdx) => {
                      const myId = String((user as { _id?: string })?._id ?? "");
                      const fromId = String((r.from as { _id?: string })?._id ?? "");
                      const isMine = fromId === myId;
                      const openMsgFromId = openMessage.from ? String((openMessage.from as { _id?: string })?._id ?? "") : "";
                      const readBy = ((r as { readBy?: unknown[] }).readBy ?? []) as (string | { toString(): string })[];
                      const isReadByRecipient = isMine && readBy.some((id) => String(id) === openMsgFromId);
                      return (
                        <div key={`reply-${r._id}-${rIdx}`} className={`rmc-bubble-wrap${isMine ? " rmc-bubble-wrap--mine" : ""}`}>
                          {!isMine && (
                            r.from?.photo
                              ? <img src={r.from.photo} alt="" className="rmc-avatar rmc-avatar--sm" />
                              : <div className="rmc-avatar rmc-avatar--sm rmc-avatar--initials">
                                  {((r.from?.firstName?.[0] ?? "") + (r.from?.lastName?.[0] ?? "")).toUpperCase() || "?"}
                                </div>
                          )}
                          <div className={`rmc-bubble${isMine ? " rmc-bubble--mine" : " rmc-bubble--theirs"}`}>
                            <p className="rmc-bubble__text">{r.body}</p>
                            <div className="rmc-bubble__meta">
                              <span className="rmc-bubble__time">
                                {new Date(r.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </span>
                              {isMine && <MessageStatusIcon read={!!isReadByRecipient} />}
                            </div>
                          </div>
                          {isMine && <div className="rmc-avatar rmc-avatar--sm rmc-avatar--mine-placeholder" />}
                        </div>
                      );
                    })}
                    <div ref={msgBottomRef} />
                  </>
                )}
              </div>

              {/* Typing indicator */}
              {typingUserId && typingUserId === activeUserId && !openMessage && (() => {
                const u = regularUserList.find((a) => String(a._id ?? a.id ?? "") === typingUserId);
                const conv = inboxConversations.find((c) => c.senderId === typingUserId);
                const sender = u ?? conv?.sender as { firstName?: string; lastName?: string; middleName?: string; email?: string } | undefined;
                const name = sender
                  ? ([sender.firstName, (sender as { middleName?: string }).middleName, sender.lastName].filter(Boolean).join(" ") || sender.email || "Someone")
                  : "Someone";
                return (
                  <div className="rmc-chat__typing">
                    <span className="rmc-chat__typing-dots"><span /><span /><span /></span>
                    <span>{name} is typing…</span>
                  </div>
                );
              })()}

              {/* Fixed compose bar — active whenever a user is selected OR a message is open */}
              <div className="rmc-chat__compose">
                {replyError && <p className="rmc-chat__error">{replyError}</p>}
                <div className={`rmc-chat__compose-inner${(!openMessage && !activeUserId) ? " rmc-chat__compose-inner--disabled" : ""}`}>
                  <textarea
                    className="rmc-chat__input"
                    rows={1}
                    placeholder={openMessage || activeUserId ? "Type a message… (Enter to send)" : "Select a user or message first"}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleMsgKeyDown}
                    disabled={!openMessage && !activeUserId}
                  />
                  <button
                    type="button"
                    className="rmc-chat__send-btn"
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || (!openMessage && !activeUserId)}
                    aria-label="Send"
                  >
                    <FiSend size={18} className="rmc-chat__send-icon" color="currentColor" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Incident Report modal (agents only) ────────────────────────────── */}
      {!isOverviewRole && showReportModal && (
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

      {/* ── Share / Print result modal (agents only) ───────────────────────── */}
      {!isOverviewRole && (
      <ShareResultModal
        isOpen={showShareModal}
        onClose={() => { setShowShareModal(false); setShareElectionIdForModal(null); }}
        electionName={shareElection?.name ?? "Election"}
        locationLabel={shareLocationLabel}
        locationName={shareLocationName}
        aspirants={shareAspirants}
        totalVotes={shareTotalVotes}
        generatedAt={new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
      />
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
