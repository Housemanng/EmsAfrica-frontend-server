import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../app/store";
import {
  getElections,
  getPollingUnitsCoverage,
} from "../features/results/resultsApi";
import {
  selectElections,
  selectPollingUnitsCoverage,
} from "../features/results/resultsSelectors";
import {
  getElectionsByOrganizationId,
} from "../features/elections/electionApi";
import {
  selectElectionsByOrganizationId,
} from "../features/elections/electionSelectors";
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
import { usePresenceSocket } from "../hooks/usePresenceSocket";
import { useResultSocket } from "../hooks/useResultSocket";
import "./Results.css";

/* Icons for polling unit and election cards */
const IconLocation = () => (
  <svg className="results-pu-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconClipboard = () => (
  <svg className="results-pu-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);
const IconPlay = () => (
  <svg className="results-pu-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);
const IconFlag = () => (
  <svg className="results-pu-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);
const IconUserPlus = () => (
  <svg className="results-pu-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);
const IconCheckCircle = () => (
  <svg className="results-pu-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const IconAlertTriangle = () => (
  <svg className="results-pu-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);


type LocationRef = { _id?: string; name?: string } | string;
const getLocationId = (loc: LocationRef | undefined | null): string | null => {
  if (!loc) return null;
  return typeof loc === "object" ? (loc._id ?? null) ?? null : loc;
};
const getLocationName = (loc: { name?: string } | string | undefined) =>
  !loc ? "—" : typeof loc === "object" ? loc.name ?? "—" : loc;

const ROLE_LABELS: Record<string, string> = {
  regular: "Regular",
  superadmin: "Super Admin",
  executive: "Executive",
  presiding_officer_po_agent: "Presiding Officer (PO) Agent",
  ra_ward_collation_officer_agent: "RA / Ward Collation Officer Agent",
  lga_collation_officer_agent: "LGA Collation Officer Agent",
  state_constituency_returning_officer_agent: "State Constituency Returning Officer Agent",
  federal_constituency_returning_officer_agent: "Federal Constituency Returning Officer Agent",
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



export default function Accreditation() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const role = useSelector(selectRole) ?? "";

  // Read elections from the store immediately so we can seed puElectionId on first render.
  // This prevents the one-frame flash where puElectionId="" when elections are already cached.
  const _electionsForInit = useSelector(selectElections) ?? [];
  const _activeForInit = (Array.isArray(_electionsForInit) ? _electionsForInit : [])
    .filter((e: { _id?: string; status?: string }) => e.status === "active");
  const [puElectionId, setPuElectionId] = useState(() => _activeForInit[0]?._id ?? "");
  const [accreditedCountInput, setAccreditedCountInput] = useState("");
  const [puMessage, setPuMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
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
  const electionsQuery = useMemo(() => {
    const q: { includeResults: boolean; lgaId?: string; wardId?: string; pollingUnitId?: string } = { includeResults: true };
    if (level === "polling_unit" && locationIdForRole) q.pollingUnitId = locationIdForRole;
    else if (level === "ward" && locationIdForRole) q.wardId = locationIdForRole;
    else if (level === "lga" && locationIdForRole) q.lgaId = locationIdForRole;
    return q;
  }, [level, locationIdForRole]);
  const electionsFromResults = useSelector(selectElections) ?? [];
  const electionsWithTotals = useSelector(
    selectElectionsByOrganizationId(organizationId ?? "", electionsQuery)
  ) ?? [];
  const elections = (electionsWithTotals?.length ? electionsWithTotals : electionsFromResults) ?? electionsFromResults ?? [];

  const electionsList = (Array.isArray(elections) ? elections : []).filter(
    (e: { _id?: string; name?: string; status?: string }) => e.status === "active"
  );

  useEffect(() => {
    dispatch(getElections());
  }, [dispatch]);

  useEffect(() => {
    if (organizationId) {
      dispatch(getElectionsByOrganizationId({ organizationId, query: electionsQuery }));
    }
  }, [dispatch, organizationId, JSON.stringify(electionsQuery)]);


  useEffect(() => {
    if (!puElectionId && electionsList.length > 0) {
      setPuElectionId(electionsList[0]._id);
    }
  }, [electionsList.length, puElectionId]);
  useEffect(() => {
    if (electionsList.length > 0) {
      electionsList.forEach((el) => {
        dispatch(getPollingUnitsCoverage({ electionId: el._id }));
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
        const list = (result as { presence?: Array<{ user?: { _id?: string; id?: string } }> })?.presence ?? [];
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
  }, [dispatch, puPresenceParams ? JSON.stringify(puPresenceParams) : null, currentUserId]);
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
    (electionId) => {
      dispatch(getPollingUnitsCoverage({ electionId }));
    },
    // Org-wide: debounced refresh of the elections list with embedded aspirantTotals
    // so overview roles (regular / executive / superadmin) see live totals without refreshing
    () => {
      if (organizationId) {
        dispatch(getElectionsByOrganizationId({ organizationId, query: electionsQuery }));
      }
    }
  );

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

  const allPresenceData = useSelector(selectListPresence(puElectionId ? { electionId: puElectionId } : {}));
  const presenceCount = puElectionId
    ? (allPresenceData?.count ?? (allPresenceData?.presence ?? []).length)
    : 0;
  // hasMarkedPresence and presenceFetched are managed via direct .unwrap() promise above.

  const accreditationData = useSelector(
    selectAccreditedVotersByPollingUnit(
      organizationId || "",
      puViewPollingUnitId || "",
      puViewElectionId || ""
    )
  );
  const accreditationLoading = useSelector(
    selectAccreditedVotersByPollingUnitLoading(
      organizationId || "",
      puViewPollingUnitId || "",
      puViewElectionId || ""
    )
  );
  const accreditedCount = accreditationData?.accreditedCount ?? null;
  const votingStartedAt = accreditationData?.accreditation?.votingStartedAt;
  const votingEndedAt = accreditationData?.accreditation?.votingEndedAt;
  const accreditationStartedAt = accreditationData?.accreditation?.startedAt;
  const accreditationEndedAt = accreditationData?.accreditation?.endedAt;


  const isOverviewRole = role === "regular" || role === "executive" || role === "superadmin";

  // Org-wide accreditation totals (for overview roles only)
  const orgAccreditationRaw = useSelector(
    selectAllAccreditationByOrganization(organizationId || "", puViewElectionId || "")
  ) as { totalAccreditedVoters?: number; total?: number } | undefined;
  const orgAccreditationData = isOverviewRole ? orgAccreditationRaw : undefined;

  useEffect(() => {
    if (isOverviewRole && organizationId && puViewElectionId) {
      dispatch(getAllAccreditationByOrganization({ organizationId, electionId: puViewElectionId }));
    }
  }, [dispatch, isOverviewRole, organizationId, puViewElectionId]);

  // Total PUs from the first election's coverage (already fetched)
  const firstElectionCoverage = useSelector(selectPollingUnitsCoverage(puViewElectionId || ""));
  const totalPUs = firstElectionCoverage?.total ?? null;
  const puWithAccreditation = orgAccreditationData?.total ?? 0;
  const remainingPUs = totalPUs != null ? totalPUs - puWithAccreditation : null;
  const totalAccreditedVotersOrg = orgAccreditationData?.totalAccreditedVoters ?? null;

  // Over-voting detail data (fetched on demand when modal is opened)
  const overVotingData = useSelector(
    selectOverVotingByOrganization(organizationId || "", puViewElectionId || "")
  );
  const overVotingLoading = useSelector(
    selectOverVotingByOrganizationLoading(organizationId || "", puViewElectionId || "")
  );

  // Total votes cast: sum of all aspirant totalVotes across all active elections
  const totalVotesCast = electionsList.reduce((sum, el) => {
    const totals = el.aspirantTotals as { aspirants?: Array<{ totalVotes?: number }> } | undefined;
    const perElection = (totals?.aspirants ?? []).reduce(
      (s: number, a: { totalVotes?: number }) => s + (a.totalVotes ?? 0),
      0
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
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const handleOpenOverVotingModal = () => {
    setShowOverVotingModal(true);
    if (organizationId && puViewElectionId) {
      dispatch(getOverVotingByOrganization({ organizationId, electionId: puViewElectionId }));
    }
  };

  const handleMarkPresence = async () => {
    if (!locationIdForRole || !puElectionId) return;
    setPuBusy(true);
    setPuMessage(null);
    try {
      await dispatch(checkIn({ pollingUnitId: locationIdForRole, electionId: puElectionId })).unwrap();
      setHasMarkedPresence(true);
      setPuMessage({ type: "success", text: "Presence marked. You can now enter accredited voters and use Vote started/ended." });
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

  const handleAccreditationStarted = async () => {
    if (!locationIdForRole || !puElectionId) return;
    setPuBusy(true);
    setPuMessage(null);
    try {
      await dispatch(
        startAccreditationAtPollingUnit({
          electionId: puElectionId,
          pollingUnitId: locationIdForRole,
        })
      ).unwrap();
      setPuMessage({ type: "success", text: "Accreditation started recorded." });
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
        })
      ).unwrap();
      setPuMessage({ type: "success", text: "Accreditation ended recorded." });
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
        : "Failed to record accreditation ended.";
      setPuMessage({ type: "error", text: String(msg) });
    } finally {
      setPuBusy(false);
    }
  };


  return (
    <div className="results-page">
      <div>
        <p className="results-page__breadcrumb">EMS / Accreditation</p>
        <h1 className="results-page__title">Accreditation</h1>
      </div>

      <div className="results-polling-unit">
        <div className="results-polling-unit__item">
          <span className="results-polling-unit__label">User</span>
          <span className="results-polling-unit__value">{user?.username || "—"}</span>
        </div>
        <div className="results-polling-unit__item">
          <span className="results-polling-unit__label">Role</span>
          <span className="results-polling-unit__value">{role ? (ROLE_LABELS[role] ?? role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())) : "—"}</span>
        </div>
        {user?.phoneNumber && (
          <div className="results-polling-unit__item">
            <span className="results-polling-unit__label">Phone</span>
            <span className="results-polling-unit__value">{user.phoneNumber}</span>
          </div>
        )}
        {u?.lga && (
          <div className="results-polling-unit__item">
            <span className="results-polling-unit__label">LGA</span>
            <span className="results-polling-unit__value">{getLocationName(u.lga)}</span>
          </div>
        )}
        {u?.ward && (
          <div className="results-polling-unit__item">
            <span className="results-polling-unit__label">Ward</span>
            <span className="results-polling-unit__value">{getLocationName(u.ward)}</span>
          </div>
        )}
        <div className="results-polling-unit__item">
          <span className="results-polling-unit__label">
            {level === "polling_unit" ? "Polling Unit" : level === "ward" ? "Ward" : level === "lga" ? "LGA" : level === "state" ? "State" : "Assigned location"}
          </span>
          <span className="results-polling-unit__value">
            {level === "polling_unit" ? getLocationName(u?.pollingUnit) : level === "ward" ? getLocationName(u?.ward) : level === "lga" ? getLocationName(u?.lga) : level === "state" ? getLocationName(u?.state) : "—"}
          </span>
        </div>
      </div>

      {isPO && electionsList.length === 0 ? (
        <p className="results-view__empty" style={{ margin: 0 }}>There is no election</p>
      ) : (organizationId || electionsList.length > 0 || isPO) ? (
        <div className="results-card results-pu-upper">
          <h2 className="results-card__heading">Polling Unit – Voting - Presence - Accreditation</h2>

          {!puElectionId && !isPO ? (
            <p className="results-view__empty" style={{ margin: 0 }}>Select an election to continue.</p>
          ) : (
            <>
              {(hasMarkedPresence || isOverviewRole || isPO) && (
              <div className="results-pu-cards">
                {/* Mark presence / Presence marked card — sits in the grid alongside other cards */}
                {isPO && !presenceFetched && (
                  <div className="results-pu-card results-pu-card--mark-presence">
                    <div className="results-pu-card__body">
                      <span className="results-pu-card__sublabel">Checking presence…</span>
                    </div>
                  </div>
                )}
                {isPO && presenceFetched && !hasMarkedPresence && (
                  <div className="results-pu-card results-pu-card--mark-presence">
                    <span className="results-pu-card__icon-wrap results-pu-card__icon-wrap--amber">
                      <IconUserPlus />
                    </span>
                    <div className="results-pu-card__body">
                      <span className="results-pu-card__label">Mark presence</span>
                      <span className="results-pu-card__sublabel">Mark your presence to unlock all options</span>
                      <button
                        type="button"
                        className="results-btn results-btn--primary"
                        style={{ marginTop: "0.375rem", padding: "0.3rem 0.75rem", fontSize: "0.75rem" }}
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
                      <span className="results-pu-card__label">Presence marked</span>
                      <span className="results-pu-card__sublabel">You are checked in for this election</span>
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
                      <span className="results-pu-card__value">{presenceCount}</span>
                      <span className="results-pu-card__sublabel">Agents checked in</span>
                    </div>
                  </div>
                )}
                {isOverviewRole && (
                  <div className="results-pu-card">
                    <span className="results-pu-card__icon-wrap results-pu-card__icon-wrap--emerald">
                      <IconClipboard />
                    </span>
                    <div className="results-pu-card__body">
                      <span className="results-pu-card__label">Total Accredited Voters</span>
                      <span className="results-pu-card__value">
                        {totalAccreditedVotersOrg != null ? totalAccreditedVotersOrg.toLocaleString() : "—"}
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
                {isOverviewRole && (
                  isOverVoting ? (
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
                        <span className="results-pu-card__label">Total Votes Cast</span>
                        <span className="results-pu-card__value results-pu-card__value--overvote">
                          {totalVotesCast.toLocaleString()}
                        </span>
                        <span className="results-pu-card__sublabel">
                          Over-voting: +{(totalVotesCast - (totalAccreditedVotersOrg ?? 0)).toLocaleString()} excess — click to view
                        </span>
                      </div>
                    </button>
                  ) : (
                    <div className="results-pu-card">
                      <span className="results-pu-card__icon-wrap results-pu-card__icon-wrap--violet">
                        <IconPlay />
                      </span>
                      <div className="results-pu-card__body">
                        <span className="results-pu-card__label">Total Votes Cast</span>
                        <span className="results-pu-card__value">
                          {totalVotesCast > 0 ? totalVotesCast.toLocaleString() : "—"}
                        </span>
                        <span className="results-pu-card__sublabel">
                          {totalAccreditedVotersOrg != null && totalVotesCast > 0
                            ? `${((totalVotesCast / totalAccreditedVotersOrg) * 100).toFixed(1)}% turnout`
                            : "Across all elections"}
                        </span>
                      </div>
                    </div>
                  )
                )}
                {/* Accreditation Started — visible only after presence is marked */}
                {hasMarkedPresence && (
                  <button
                    type="button"
                    className={`results-pu-card results-pu-card--clickable ${accreditationStartedAt ? "results-pu-card--done" : ""} ${(puBusy || !!accreditationStartedAt) ? "results-pu-card--disabled" : ""}`}
                    onClick={() => !puBusy && !accreditationStartedAt && setShowAccStartConfirm(true)}
                    disabled={puBusy || !!accreditationStartedAt}
                  >
                    <span className="results-pu-card__icon-wrap results-pu-card__icon-wrap--emerald">
                      <IconCheckCircle />
                    </span>
                    <div className="results-pu-card__body">
                      <span className="results-pu-card__label">Accreditation Started</span>
                      <span className="results-pu-card__value">{accreditationStartedAt ? "✓" : "—"}</span>
                      <span className="results-pu-card__sublabel">{accreditationStartedAt ? "Recorded" : "Click to record"}</span>
                    </div>
                  </button>
                )}
                {/* Accreditation Ended — visible only after accreditation has started */}
                {hasMarkedPresence && !!accreditationStartedAt && (
                  <button
                    type="button"
                    className={`results-pu-card results-pu-card--clickable ${accreditationEndedAt ? "results-pu-card--done" : ""} ${(puBusy || !!accreditationEndedAt) ? "results-pu-card--disabled" : ""}`}
                    onClick={() => !puBusy && !accreditationEndedAt && setShowAccEndConfirm(true)}
                    disabled={puBusy || !!accreditationEndedAt}
                  >
                    <span className="results-pu-card__icon-wrap results-pu-card__icon-wrap--amber">
                      <IconCheckCircle />
                    </span>
                    <div className="results-pu-card__body">
                      <span className="results-pu-card__label">Accreditation Ended</span>
                      <span className="results-pu-card__value">{accreditationEndedAt ? "✓" : "—"}</span>
                      <span className="results-pu-card__sublabel">{accreditationEndedAt ? "Recorded" : "Click to record"}</span>
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
                      <span className="results-pu-card__label">Accredited Voters</span>
                      <span className="results-pu-card__value">{accreditedCount != null ? accreditedCount.toLocaleString() : "—"}</span>
                      <span className="results-pu-card__sublabel">{accreditedCount != null ? "Recorded" : "Click to enter"}</span>
                    </div>
                  </button>
                )}
                {/* Voting Started — visible only after accredited voters is entered */}
                {hasMarkedPresence && !!accreditationEndedAt && accreditedCount != null && (
                  <button
                    type="button"
                    className={`results-pu-card results-pu-card--clickable ${votingStartedAt ? "results-pu-card--done" : ""} ${(puBusy || !!votingStartedAt) ? "results-pu-card--disabled" : ""}`}
                    onClick={() => !puBusy && !votingStartedAt && setShowVoteStartConfirm(true)}
                    disabled={puBusy || !!votingStartedAt}
                  >
                    <span className="results-pu-card__icon-wrap results-pu-card__icon-wrap--violet">
                      <IconPlay />
                    </span>
                    <div className="results-pu-card__body">
                      <span className="results-pu-card__label">Voting started</span>
                      <span className="results-pu-card__value">{votingStartedAt ? "✓" : "—"}</span>
                      <span className="results-pu-card__sublabel">{votingStartedAt ? "Recorded" : "Click to record"}</span>
                    </div>
                  </button>
                )}
                {/* Voting Ended — visible only after voting has started */}
                {hasMarkedPresence && !!accreditationEndedAt && !!votingStartedAt && (
                  <button
                    type="button"
                    className={`results-pu-card results-pu-card--clickable ${votingEndedAt ? "results-pu-card--done" : ""} ${(puBusy || !!votingEndedAt) ? "results-pu-card--disabled" : ""}`}
                    onClick={() => !puBusy && !votingEndedAt && setShowVoteEndConfirm(true)}
                    disabled={puBusy || !!votingEndedAt}
                  >
                    <span className="results-pu-card__icon-wrap results-pu-card__icon-wrap--rose">
                      <IconFlag />
                    </span>
                    <div className="results-pu-card__body">
                      <span className="results-pu-card__label">Voting ended</span>
                      <span className="results-pu-card__value">{votingEndedAt ? "✓" : "—"}</span>
                      <span className="results-pu-card__sublabel">{votingEndedAt ? "Recorded" : "Click to record"}</span>
                    </div>
                  </button>
                )}
              </div>
              )}
              {puMessage && (
                <div className={`results-message results-message--${puMessage.type}`} style={{ marginTop: "0.5rem" }}>
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

          {showAccStartConfirm && (
            <div
              className="results-modal-backdrop"
              role="alertdialog"
              aria-modal="true"
              onClick={() => setShowAccStartConfirm(false)}
            >
              <div className="results-modal results-modal--warning" onClick={(e) => e.stopPropagation()}>
                <h3 className="results-modal__title">Record accreditation started?</h3>
                <p className="results-modal__subtitle">You are about to record that accreditation has started at this polling unit. This action cannot be undone. Do you want to proceed?</p>
                <div className="results-modal__actions">
                  <button type="button" className="results-btn results-btn--outline" onClick={() => setShowAccStartConfirm(false)}>
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
                    {puBusy ? "Recording…" : "Yes, record accreditation started"}
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
              <div className="results-modal results-modal--warning" onClick={(e) => e.stopPropagation()}>
                <h3 className="results-modal__title">Record accreditation ended?</h3>
                <p className="results-modal__subtitle">You are about to record that accreditation has ended at this polling unit. This action cannot be undone. Do you want to proceed?</p>
                <div className="results-modal__actions">
                  <button type="button" className="results-btn results-btn--outline" onClick={() => setShowAccEndConfirm(false)}>
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


      {/* ── Over-voting full-page modal ───────────────────────────────────── */}
      {showOverVotingModal && (
        <div
          className="results-overvote-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="overvote-modal-title"
          onClick={() => setShowOverVotingModal(false)}
        >
          <div className="results-overvote-modal" onClick={(e) => e.stopPropagation()}>
            <div className="results-overvote-modal__header">
              <div>
                <h2 id="overvote-modal-title" className="results-overvote-modal__title">
                  Over-Voting Report
                </h2>
                <p className="results-overvote-modal__subtitle">
                  Polling units where total votes cast exceeds accredited voters
                </p>
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

            {overVotingLoading ? (
              <div className="results-pu-cards-loading" style={{ padding: "3rem 0" }}>
                <span className="results-pu-cards-loading__spinner" />
                <span className="results-pu-cards-loading__text">Loading over-voting data…</span>
              </div>
            ) : !overVotingData || overVotingData.overVotingUnits.length === 0 ? (
              <div className="results-overvote-modal__empty">
                <span className="results-overvote-modal__empty-icon">✓</span>
                <p>No over-voting detected across all polling units.</p>
              </div>
            ) : (
              <>
                <div className="results-overvote-modal__summary">
                  <span className="results-overvote-modal__summary-badge">
                    {overVotingData.overVotingUnits.length} affected polling unit{overVotingData.overVotingUnits.length !== 1 ? "s" : ""}
                  </span>
                  <span className="results-overvote-modal__summary-excess">
                    Total excess:{" "}
                    <strong>
                      +{overVotingData.overVotingUnits.reduce((s, u) => s + u.excess, 0).toLocaleString()}
                    </strong>{" "}
                    votes
                  </span>
                </div>

                <div className="results-overvote-modal__list">
                  {overVotingData.overVotingUnits.map((unit, idx) => (
                    <div key={unit.pollingUnitId} className="results-overvote-row">
                      {/* Header: rank + PU name + excess */}
                      <div className="results-overvote-row__header">
                        <span className="results-overvote-row__rank">#{idx + 1}</span>
                        <div className="results-overvote-row__pu">
                          <span className="results-overvote-row__pu-name">{unit.pollingUnitName}</span>
                          {unit.pollingUnitCode && (
                            <span className="results-overvote-row__pu-code">{unit.pollingUnitCode}</span>
                          )}
                        </div>
                        <span className="results-overvote-row__excess">
                          +{unit.excess.toLocaleString()} excess
                        </span>
                      </div>

                      {/* Agent info */}
                      {unit.agent ? (
                        <div className="results-overvote-row__agent">
                          <span className="results-overvote-row__agent-icon">👤</span>
                          <div className="results-overvote-row__agent-info">
                            <span className="results-overvote-row__agent-name">{unit.agent.name || "—"}</span>
                            {unit.agent.phone && (
                              <span className="results-overvote-row__agent-phone">{unit.agent.phone}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="results-overvote-row__agent results-overvote-row__agent--none">
                          <span className="results-overvote-row__agent-icon">👤</span>
                          <span className="results-overvote-row__agent-name" style={{ color: "#9ca3af" }}>No agent on record</span>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="results-overvote-row__stats">
                        <div className="results-overvote-row__stat">
                          <span className="results-overvote-row__stat-label">Accredited</span>
                          <span className="results-overvote-row__stat-value">{unit.accreditedCount.toLocaleString()}</span>
                        </div>
                        <div className="results-overvote-row__stat">
                          <span className="results-overvote-row__stat-label">Votes Cast</span>
                          <span className="results-overvote-row__stat-value results-overvote-row__stat-value--alert">{unit.totalVotesCast.toLocaleString()}</span>
                        </div>
                        <div className="results-overvote-row__stat">
                          <span className="results-overvote-row__stat-label">Difference</span>
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

                      {/* Aspirants with party logo */}
                      {unit.aspirants.length > 0 && (
                        <div className="results-overvote-row__aspirants">
                          {unit.aspirants.map((a, aIdx) => {
                            const color = a.partyColor ?? "#374151";
                            const isTopVoter = aIdx === 0 && a.votes > 0;
                            const posOrdinals = ["1st", "2nd", "3rd"];
                            const posLabel = aIdx < 3 ? posOrdinals[aIdx] : `${aIdx + 1}th`;
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
                                <span className="results-overvote-row__aspirant-name">{a.aspirantName}</span>
                                <span className={`results-overvote-row__aspirant-votes${isTopVoter ? " results-overvote-row__aspirant-votes--leading" : ""}`}>
                                  {a.votes.toLocaleString()} votes
                                </span>
                                {isTopVoter && (
                                  <span className="results-aspirant-row__leading-badge">Leading</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
