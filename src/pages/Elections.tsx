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
import { getParties, getResultsByElection } from "../features/results/resultsApi";
import {
  selectParties,
  selectPartiesLoading,
  selectLoadingByKey,
} from "../features/results/resultsSelectors";
import {
  getOverVotingByOrganization,
  getPollingUnitsByWard,
} from "../features/pollingUnits/pollingUnitApi";
import {
  selectOverVotingByOrganization,
  selectOverVotingByOrganizationLoading,
  selectPollingUnitsByWard,
} from "../features/pollingUnits/pollingUnitSelectors";
import {
  getSheetsByElectionForUsers,
} from "../features/resultSheets/resultSheetApi";
import { selectSheetsByElectionForUsers } from "../features/resultSheets/resultSheetSelectors";
import {
  getReportsByElection,
  markReportReadApi,
  markReportUnreadApi,
  REPORT_CATEGORY_LABELS,
  type ReportCategory,
} from "../features/reports/reportApi";
import {
  selectReportsByElection,
  selectReportsByElectionLoading,
} from "../features/reports/reportSelectors";
import PartySelect from "../components/PartySelect";
import SearchableSelect from "../components/SearchableSelect";
import SearchableMultiSelect from "../components/SearchableMultiSelect";
import { getStatesByOrganizationId } from "../features/states/stateApi";
import { selectStatesByOrganizationId } from "../features/states/stateSelectors";
import { getLGAsByState } from "../features/lgas/lgaApi";
import { selectLGAsByState } from "../features/lgas/lgaSelectors";
import { getWardsByLGA } from "../features/wards/wardApi";
import { getConstituenciesByOrganization } from "../features/constituencies/constituencyApi";
import { selectWardsByLGA } from "../features/wards/wardSelectors";
import "./Dashboard.css";
import "./Results.css";
import "./Reports.css";

const ELECTION_TYPE_OPTIONS = [
  { value: "presidential", label: "Presidential" },
  { value: "governorship", label: "Governorship" },
  { value: "senate", label: "Senate" },
  { value: "house_of_rep", label: "House of Representatives" },
  { value: "state_assembly", label: "State Assembly" },
  { value: "state_house_of_assembly", label: "State House of Assembly" },
  { value: "local_government_chairman", label: "Local Government Chairman" },
  { value: "councillor", label: "Councillor" },
  { value: "councillorship", label: "Councillorship" },
];

/** Election types that require LGA constituency (select multiple LGAs) */
const TYPES_SELECT_LGAS = ["senate", "house_of_rep"];
/** Election types that require single LGA — all wards and PUs in that LGA see the election */
const TYPES_SELECT_SINGLE_LGA = [
  "local_government_chairman",
  "state_assembly",
  "state_house_of_assembly",
];
/** Election types that require LGA + wards (multi-ward selection) — not used currently */
const TYPES_SELECT_WARDS: string[] = [];
/** Election types that require LGA + single ward (Councillorship) */
const TYPES_SELECT_SINGLE_WARD = ["councillor", "councillorship"];

/** Election types that need constituency coverage (PU only sees election if under that constituency) */
const TYPES_NEED_CONSTITUENCY = [
  ...TYPES_SELECT_LGAS,
  ...TYPES_SELECT_SINGLE_LGA,
  ...TYPES_SELECT_SINGLE_WARD,
];

/** Map election type to constituency type for fetching from DB */
const ELECTION_TYPE_TO_CONSTITUENCY_TYPE: Record<string, string> = {
  senate: "senate",
  house_of_rep: "house_of_rep",
  state_assembly: "state_house_of_assembly",
  state_house_of_assembly: "state_house_of_assembly",
  local_government_chairman: "chairmanship",
  councillor: "councillorship",
  councillorship: "councillorship",
};

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

interface ReportDoc {
  _id: string;
  category: ReportCategory;
  items: string[];
  notes?: string;
  createdAt: string;
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
    lga?: { _id?: string; name?: string } | string;
  };
}

interface Election {
  _id: string;
  name: string;
  type: string;
  electionDate: string;
  createdAt?: string;
  status: "upcoming" | "active" | "concluded";
  electionGroup?: string;
  state?: { _id: string; name?: string; code?: string };
  organization?: { _id: string; name?: string; code?: string };
  votingStartedAt?: string;
  concludedAt?: string;
  aspirants?: Aspirant[];
  aspirantTotals?: AspirantTotals;
  coverage?: { type: string; ids: string[] };
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

const REPORT_CATEGORY_COLORS: Record<ReportCategory, { bg: string; text: string; border: string }> = {
  ELECTORAL_VIOLENCE: { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" },
  LOGISTICS:          { bg: "#fff7ed", text: "#9a3412", border: "#fed7aa" },
  MALPRACTICE:        { bg: "#fdf4ff", text: "#6b21a8", border: "#e9d5ff" },
  TECHNICAL:          { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  ADMINISTRATIVE:     { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" },
};
const formatReportDate = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const formatReportRole = (r?: string) =>
  r ? r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";
const getReportLocationLabel = (r: ReportDoc): string => {
  if (r.pollingUnit?.name) return `PU: ${r.pollingUnit.name}${r.pollingUnit.code ? ` (${r.pollingUnit.code})` : ""}`;
  if (r.ward?.name) return `Ward: ${r.ward.name}`;
  if (r.lga?.name) return `LGA: ${r.lga.name}`;
  if (r.state?.name) return `State: ${r.state.name}`;
  return "—";
};
const getReporterName = (r?: ReportDoc["reportedBy"]) => {
  if (!r) return "Unknown";
  const name = [r.firstName, r.lastName].filter(Boolean).join(" ");
  return name || r.email || "Unknown";
};
const resolveObjName = (field?: { name?: string } | string) =>
  field && typeof field === "object" ? field.name : undefined;
const getCardLocation = (r: ReportDoc) => {
  const lgaName = r.lga?.name ?? resolveObjName(r.reportedBy?.lga);
  const wardName = r.ward?.name ?? resolveObjName(r.reportedBy?.ward);
  const parts = [lgaName, wardName].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : undefined;
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
    stateId: "",
    constituencyId: "",
    coverageLgaIds: [] as string[],
    coverageLgaId: "",
    coverageWardIds: [] as string[],
    coverageWardId: "",
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
  const [createAspirantForm, setCreateAspirantForm] = useState({ name: "", partyId: "" });
  const [createAspirantError, setCreateAspirantError] = useState("");
  const [createAspirantLoading, setCreateAspirantLoading] = useState(false);
  const [actionsOpenId, setActionsOpenId] = useState<string | null>(null);
  const [showOverVotingModal, setShowOverVotingModal] = useState(false);
  const [overVotingElection, setOverVotingElection] = useState<Election | null>(null);
  const [showPollingUnitsModal, setShowPollingUnitsModal] = useState(false);
  const [pollingUnitsElection, setPollingUnitsElection] = useState<Election | null>(null);
  const [pollingUnitsFilter, setPollingUnitsFilter] = useState<{ lgaId: string; wardId: string; pollingUnitId: string }>({
    lgaId: "",
    wardId: "",
    pollingUnitId: "",
  });
  const [puRowActionsOpenId, setPuRowActionsOpenId] = useState<string | null>(null);
  const [viewWinnerPu, setViewWinnerPu] = useState<{ puId: string; lga: string; ward: string; pu: string; aspirants: Record<string, number>; total: number } | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportElection, setReportElection] = useState<Election | null>(null);
  const [detailReport, setDetailReport] = useState<ReportDoc | null>(null);
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
  const parties = useSelector((state: RootState) => selectParties(state));
  const partiesLoading = useSelector((state: RootState) => selectPartiesLoading(state));

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
    if (organizationId) dispatch(getParties());
  }, [dispatch, organizationId]);

  useEffect(() => {
    if (!actionsOpenId) return;
    const close = () => setActionsOpenId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [actionsOpenId]);

  useEffect(() => {
    if (!puRowActionsOpenId) return;
    const close = () => setPuRowActionsOpenId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [puRowActionsOpenId]);

  // Fetch over-voting data when modal opens
  useEffect(() => {
    if (showOverVotingModal && overVotingElection && organizationId) {
      dispatch(getOverVotingByOrganization({ organizationId, electionId: overVotingElection._id }));
    }
  }, [dispatch, showOverVotingModal, overVotingElection, organizationId]);

  // Fetch results and sheets for Polling Units modal
  const puElectionStateId = pollingUnitsElection?.state?._id ?? (pollingUnitsElection?.state as { id?: string })?.id ?? "";
  useEffect(() => {
    if (showPollingUnitsModal && pollingUnitsElection && organizationId) {
      const params: { lgaId?: string; wardId?: string; pollingUnitId?: string } = {};
      if (pollingUnitsFilter.pollingUnitId) params.pollingUnitId = pollingUnitsFilter.pollingUnitId;
      else if (pollingUnitsFilter.wardId) params.wardId = pollingUnitsFilter.wardId;
      else if (pollingUnitsFilter.lgaId) params.lgaId = pollingUnitsFilter.lgaId;
      dispatch(getResultsByElection({ electionId: pollingUnitsElection._id, params }));
      dispatch(getSheetsByElectionForUsers(pollingUnitsElection._id));
      dispatch(getParties());
    }
  }, [dispatch, showPollingUnitsModal, pollingUnitsElection, organizationId, pollingUnitsFilter]);

  // Load LGAs for Polling Units modal filter (election's state)
  useEffect(() => {
    if (puElectionStateId && showPollingUnitsModal) {
      dispatch(getLGAsByState(puElectionStateId));
    }
  }, [dispatch, puElectionStateId, showPollingUnitsModal]);

  // Load wards for Polling Units modal filter when LGA selected
  useEffect(() => {
    if (pollingUnitsFilter.lgaId) {
      dispatch(getWardsByLGA(pollingUnitsFilter.lgaId));
    }
  }, [dispatch, pollingUnitsFilter.lgaId]);

  // Load polling units for Polling Units modal filter when Ward selected
  useEffect(() => {
    if (organizationId && pollingUnitsFilter.wardId) {
      dispatch(getPollingUnitsByWard({ organizationId, wardId: pollingUnitsFilter.wardId }));
    }
  }, [dispatch, organizationId, pollingUnitsFilter.wardId]);

  // Fetch reports when Report modal opens
  useEffect(() => {
    if (showReportModal && reportElection && organizationId) {
      dispatch(getReportsByElection({ electionId: reportElection._id }));
    }
  }, [dispatch, showReportModal, reportElection, organizationId]);

  const filteredElections = (elections ?? [])
    .filter((e) => {
    const matchesStatus = !statusFilter || e.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (e.name ?? "").toLowerCase().includes(q) ||
      formatType(e.type).toLowerCase().includes(q) ||
      (e.electionGroup ?? "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
    })
    // Newest first (so newly created elections show at top)
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.electionDate ?? 0).getTime();
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.electionDate ?? 0).getTime();
      return bTime - aTime;
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
      stateId: "",
      constituencyId: "",
      coverageLgaIds: [],
      coverageLgaId: "",
      coverageWardIds: [],
      coverageWardId: "",
    });
    setCreateError("");
    setShowCreateModal(true);
  };

  useEffect(() => {
    if (showCreateModal && organizationId) {
      dispatch(getStatesByOrganizationId(organizationId));
    }
  }, [dispatch, showCreateModal, organizationId]);

  useEffect(() => {
    if (createForm.stateId) {
      dispatch(getLGAsByState(createForm.stateId));
    }
  }, [dispatch, createForm.stateId]);

  const constituenciesFetchParams =
    showCreateModal &&
    organizationId &&
    createForm.stateId &&
    TYPES_NEED_CONSTITUENCY.includes(createForm.type)
      ? {
          organizationId,
          stateId: createForm.stateId,
          type: ELECTION_TYPE_TO_CONSTITUENCY_TYPE[createForm.type] ?? createForm.type,
        }
      : null;

  useEffect(() => {
    if (constituenciesFetchParams) {
      dispatch(getConstituenciesByOrganization(constituenciesFetchParams));
    }
  }, [dispatch, showCreateModal, organizationId, createForm.stateId, createForm.type]);

  const constituenciesListKey = constituenciesFetchParams
    ? `constituencies/getConstituenciesByOrganization::${JSON.stringify(constituenciesFetchParams)}`
    : "";
  const constituenciesList = (useSelector((s: RootState) =>
    constituenciesListKey ? (s.constituencies as { cache: Record<string, unknown> }).cache[constituenciesListKey] : null
  ) ?? []) as Array<{
    _id: string;
    name?: string;
    type?: string;
    coverageType?: "lga" | "wards";
    coverageIds?: string[];
    coverageDetails?: Array<{ _id: string }>;
    state?: { _id?: string; name?: string };
  }>;

  useEffect(() => {
    const stateId = viewingElection?.state?._id ?? (viewingElection?.state as { id?: string })?.id;
    if (stateId && viewingElection?.coverage?.type === "lga") {
      dispatch(getLGAsByState(stateId));
    }
  }, [dispatch, viewingElection?.state, viewingElection?.coverage?.type]);

  const needsWardsLga =
    (TYPES_SELECT_WARDS.includes(createForm.type) || TYPES_SELECT_SINGLE_WARD.includes(createForm.type)) &&
    createForm.coverageLgaId;
  useEffect(() => {
    if (needsWardsLga) {
      dispatch(getWardsByLGA(createForm.coverageLgaId));
    }
  }, [dispatch, needsWardsLga, createForm.coverageLgaId]);

  const orgStates = (useSelector((s: RootState) => selectStatesByOrganizationId(organizationId ?? "")(s)) ??
    []) as Array<{ _id: string; name?: string; code?: string }>;
  const lgas =
    (useSelector((s: RootState) => selectLGAsByState(createForm.stateId)(s)) ?? []) as Array<{
      _id: string;
      name?: string;
      code?: string;
    }>;
  const wards =
    (useSelector((s: RootState) => selectWardsByLGA(createForm.coverageLgaId)(s)) ?? []) as Array<{
      _id: string;
      name?: string;
      code?: string;
    }>;
  const viewStateId = viewingElection?.state?._id ?? (viewingElection?.state as { id?: string })?.id ?? "";
  const viewLgas =
    (useSelector((s: RootState) => selectLGAsByState(viewStateId)(s)) ?? []) as Array<{
      _id: string;
      name?: string;
      code?: string;
    }>;
  const puLgas =
    (useSelector((s: RootState) => selectLGAsByState(puElectionStateId)(s)) ?? []) as Array<{
      _id: string;
      name?: string;
      code?: string;
    }>;
  const puWards =
    (useSelector((s: RootState) => selectWardsByLGA(pollingUnitsFilter.lgaId)(s)) ?? []) as Array<{
      _id: string;
      name?: string;
      code?: string;
    }>;
  const puPollingUnits =
    (useSelector((s: RootState) =>
      selectPollingUnitsByWard(organizationId ?? "", pollingUnitsFilter.wardId)(s)
    ) ?? []) as Array<{ _id: string; name?: string; code?: string }>;
  const buildResultsByElectionKey = () => {
    if (!pollingUnitsElection) return "";
    const params: Record<string, string> = {};
    if (pollingUnitsFilter.pollingUnitId) params.pollingUnitId = pollingUnitsFilter.pollingUnitId;
    else if (pollingUnitsFilter.wardId) params.wardId = pollingUnitsFilter.wardId;
    else if (pollingUnitsFilter.lgaId) params.lgaId = pollingUnitsFilter.lgaId;
    return `results/getResultsByElection::${JSON.stringify({
      electionId: pollingUnitsElection._id,
      params,
    })}`;
  };
  const pollingUnitsResults = useSelector((s: RootState) =>
    buildResultsByElectionKey()
      ? (s.results.cache[buildResultsByElectionKey()] as Array<{
          _id: string;
          pollingUnit?: { _id: string; name?: string; code?: string; ward?: { _id: string; name?: string; lga?: { _id: string; name?: string } } };
          aspirant?: { _id: string; name?: string; partyCode?: string };
          party?: { _id: string; acronym?: string };
          votes: number;
          source?: string;
        }>)
      : null
  ) ?? [];
  const pollingUnitsSheets = useSelector((s: RootState) =>
    pollingUnitsElection
      ? selectSheetsByElectionForUsers(pollingUnitsElection._id)(s)
      : []
  ) ?? [];
  const pollingUnitsResultsLoading = useSelector((s: RootState) =>
    buildResultsByElectionKey() ? selectLoadingByKey(buildResultsByElectionKey())(s) : false
  );
  const overVotingData = useSelector((s: RootState) =>
    overVotingElection && organizationId
      ? selectOverVotingByOrganization(organizationId, overVotingElection._id)(s)
      : undefined
  );
  const overVotingLoading = useSelector((s: RootState) =>
    overVotingElection && organizationId
      ? selectOverVotingByOrganizationLoading(organizationId, overVotingElection._id)(s)
      : false
  );
  const reportList = useSelector((s: RootState) =>
    reportElection
      ? selectReportsByElection({ electionId: reportElection._id })(s) as ReportDoc[] | undefined
      : undefined
  ) ?? [];
  const reportLoading = useSelector((s: RootState) =>
    reportElection
      ? selectReportsByElectionLoading({ electionId: reportElection._id })(s)
      : false
  );

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !createForm.name.trim() || !createForm.type || !createForm.electionDate) {
      setCreateError("Name, type and date are required.");
      return;
    }
    const needsConstituency = TYPES_NEED_CONSTITUENCY.includes(createForm.type);
    const needsLgas = TYPES_SELECT_LGAS.includes(createForm.type);
    const needsSingleLga = TYPES_SELECT_SINGLE_LGA.includes(createForm.type);
    const needsWards = TYPES_SELECT_WARDS.includes(createForm.type);
    const needsSingleWard = TYPES_SELECT_SINGLE_WARD.includes(createForm.type);

    if (needsConstituency) {
      const hasConstituency = !!createForm.constituencyId;
      const hasManual =
        (needsLgas && createForm.coverageLgaIds.length > 0) ||
        (needsSingleLga && !!createForm.coverageLgaId) ||
        (needsWards && createForm.coverageWardIds.length > 0) ||
        (needsSingleWard && !!createForm.coverageWardId);
      if (!hasConstituency && !hasManual) {
        setCreateError("Select a constituency from the database, or manually select LGAs/wards. Only polling units under that constituency will see this election.");
        return;
      }
    }

    setCreateError("");
    setCreateLoading(true);
    try {
      let coverage: { type: "state" | "lga" | "wards"; ids: string[] } | undefined;

      if (createForm.constituencyId) {
        const sel = constituenciesList.find((c) => c._id === createForm.constituencyId);
        if (sel?.coverageType && sel.coverageIds?.length) {
          coverage = { type: sel.coverageType, ids: sel.coverageIds.map(String) };
        }
      }

      if (!coverage) {
        if (needsLgas && createForm.coverageLgaIds.length > 0) {
          coverage = { type: "lga", ids: createForm.coverageLgaIds };
        } else if (needsSingleLga && createForm.coverageLgaId) {
          coverage = { type: "lga", ids: [createForm.coverageLgaId] };
        } else if (needsWards && createForm.coverageWardIds.length > 0) {
          coverage = { type: "wards", ids: createForm.coverageWardIds };
        } else if (needsSingleWard && createForm.coverageWardId) {
          coverage = { type: "wards", ids: [createForm.coverageWardId] };
        }
      }

      await dispatch(
        createElectionByOrganizationId({
          organizationId,
          body: {
            name: createForm.name.trim(),
            type: createForm.type,
            electionDate: createForm.electionDate,
            electionGroup: createForm.electionGroup.trim() || undefined,
            state: createForm.stateId || undefined,
            coverage: coverage?.ids?.length ? coverage : undefined,
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
    setCreateAspirantForm({ name: "", partyId: "" });
    setCreateAspirantError("");
    setShowCreateAspirantModal(true);
    dispatch(getParties());
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
    const partiesList = parties ?? [];
    const selectedParty = partiesList.find((p) => p._id === createAspirantForm.partyId);
    if (!createAspirantElection || !createAspirantForm.name.trim() || !createAspirantForm.partyId || !selectedParty) {
      setCreateAspirantError("Name and party are required.");
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
            partyCode: (selectedParty.acronym ?? "").trim().toUpperCase(),
            party: (selectedParty.name ?? "").trim(),
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
                              {e.status === "concluded" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPollingUnitsElection(e);
                                      setPollingUnitsFilter({ lgaId: "", wardId: "", pollingUnitId: "" });
                                      setShowPollingUnitsModal(true);
                                      setActionsOpenId(null);
                                    }}
                                  >
                                    Polling Units
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOverVotingElection(e);
                                      setShowOverVotingModal(true);
                                      setActionsOpenId(null);
                                    }}
                                  >
                                    Over Voting
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReportElection(e);
                                      setShowReportModal(true);
                                      setDetailReport(null);
                                      setActionsOpenId(null);
                                    }}
                                  >
                                    Report
                                  </button>
                                </>
                              )}
                              {canManage && (
                                <>
                                  {e.status !== "concluded" && (
                                    <button type="button" onClick={() => { handleOpenCreateAspirant(e); setActionsOpenId(null); }}>
                                      Add Aspirant
                                    </button>
                                  )}
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
                                  {e.status !== "concluded" && (
                                    <button type="button" onClick={() => { handleEdit(e); setActionsOpenId(null); }}>
                                      Edit
                                    </button>
                                  )}
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
          <div className="dash-modal dash-modal--form-large" onClick={(e) => e.stopPropagation()}>
            <h3 className="dash-modal__title">Create Election</h3>
            <p className="dash-modal__subtitle">
              Add a new election for <strong>{organizationName ?? "this organization"}</strong>.
            </p>
            <form onSubmit={handleCreateSubmit} className="dash-modal__form dash-modal__form--create-user">
            <div className="dash-modal__field dash-modal__field--full">
                <SearchableSelect
                  id="ce-type"
                  label="Type"
                  value={createForm.type}
                  onChange={(val) =>
                    setCreateForm((f) => ({
                      ...f,
                      type: val,
                      constituencyId: "",
                      coverageLgaIds: [],
                      coverageLgaId: "",
                      coverageWardIds: [],
                      coverageWardId: "",
                    }))
                  }
                  options={ELECTION_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
                  placeholder="Select type..."
                  required
                  searchable={false}
                />
              </div>
             
             
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
         

              {/* State selector — required for constituency-based elections */}
              {(TYPES_SELECT_LGAS.includes(createForm.type) ||
                TYPES_SELECT_SINGLE_LGA.includes(createForm.type) ||
                TYPES_SELECT_WARDS.includes(createForm.type) ||
                TYPES_SELECT_SINGLE_WARD.includes(createForm.type)) && (
                <div className="dash-modal__field dash-modal__field--full">
                  <SearchableSelect
                    id="ce-state"
                    label="State"
                    value={createForm.stateId}
                    onChange={(val) =>
                      setCreateForm((f) => ({
                        ...f,
                        stateId: val,
                        constituencyId: "",
                        coverageLgaIds: [],
                        coverageLgaId: "",
                        coverageWardIds: [],
                        coverageWardId: "",
                      }))
                    }
                    options={[
                      { value: "", label: "— Select state —" },
                      ...orgStates.map((s) => ({
                        value: s._id,
                        label: s.name ?? s.code ?? s._id,
                      })),
                    ]}
                    placeholder="Select state..."
                    required
                    searchable={false}
                  />
                </div>
              )}

              {/* Constituency: select from database (PU only sees election if under that constituency) */}
              {TYPES_NEED_CONSTITUENCY.includes(createForm.type) && createForm.stateId && (
                <div className="dash-modal__field dash-modal__field--full">
                  <p className="dash-modal__hint dash-modal__hint--state" style={{ marginBottom: "0.25rem" }}>
                    State: <strong>{orgStates.find((s) => s._id === createForm.stateId)?.name ?? orgStates.find((s) => s._id === createForm.stateId)?.code ?? "—"}</strong>
                  </p>
                  <p className="dash-modal__hint" style={{ marginBottom: "0.5rem" }}>
                    Select a constituency from the database. Only polling units under that constituency will see this election.
                  </p>
                  <SearchableSelect
                    id="ce-constituency"
                    label="Constituency"
                    value={createForm.constituencyId}
                    onChange={(val) =>
                      setCreateForm((f) => ({
                        ...f,
                        constituencyId: val,
                        coverageLgaIds: [],
                        coverageLgaId: "",
                        coverageWardIds: [],
                        coverageWardId: "",
                      }))
                    }
                    options={[
                      { value: "", label: "— Select constituency —" },
                      ...constituenciesList.map((c) => {
                        const suffix = c.coverageDetails?.length
                          ? ` (${c.coverageDetails.length} ${c.coverageType === "wards" ? "wards" : "LGAs"})`
                          : "";
                        return { value: c._id, label: (c.name ?? c._id) + suffix };
                      }),
                    ]}
                    placeholder="Select constituency..."
                  />
                  {constituenciesList.length === 0 && createForm.stateId && (
                    <p className="dash-modal__hint" style={{ marginTop: "0.25rem", color: "#6b7280" }}>
                      No constituencies for this type and state. Create them in the Constituency page first.
                    </p>
                  )}
                </div>
              )}

              {/* Senate / House of Rep: manual LGA select (fallback when no constituency selected) */}
              {TYPES_SELECT_LGAS.includes(createForm.type) && createForm.stateId && !createForm.constituencyId && (
                <div className="dash-modal__field dash-modal__field--full">
                  <p className="dash-modal__hint" style={{ marginBottom: "0.5rem" }}>
                    Or manually select LGAs. Only polling units in these LGAs will see this election.
                  </p>
                  <SearchableMultiSelect
                    id="ce-lgas"
                    label={`Constituency — Select LGAs${createForm.coverageLgaIds.length > 0 ? ` (${createForm.coverageLgaIds.length} selected)` : ""}`}
                    value={createForm.coverageLgaIds}
                    onChange={(ids) => setCreateForm((f) => ({ ...f, coverageLgaIds: ids }))}
                    options={lgas.map((l) => ({
                      value: l._id,
                      label: l.name ?? l.code ?? l._id,
                    }))}
                    placeholder="— Select LGAs —"
                  />
                </div>
              )}

              {/* LGA Chairman / House of Assembly: manual single LGA (fallback when no constituency) */}
              {TYPES_SELECT_SINGLE_LGA.includes(createForm.type) && createForm.stateId && !createForm.constituencyId && (
                <div className="dash-modal__field dash-modal__field--full">
                  <p className="dash-modal__hint dash-modal__hint--state" style={{ marginBottom: "0.25rem" }}>
                    State: <strong>{orgStates.find((s) => s._id === createForm.stateId)?.name ?? orgStates.find((s) => s._id === createForm.stateId)?.code ?? "—"}</strong>
                  </p>
                  <p className="dash-modal__hint" style={{ marginBottom: "0.5rem" }}>
                    Select the LGA. All wards and polling units in this LGA will see this election.
                  </p>
                  <SearchableSelect
                    id="ce-lga"
                    label={createForm.type === "local_government_chairman"
                      ? "LGA for Chairmanship"
                      : "LGA (State Constituency)"}
                    value={createForm.coverageLgaId}
                    onChange={(val) => setCreateForm((f) => ({ ...f, coverageLgaId: val }))}
                    options={[
                      { value: "", label: "— Select LGA —" },
                      ...lgas.map((l) => ({
                        value: l._id,
                        label: l.name ?? l.code ?? l._id,
                      })),
                    ]}
                    placeholder="Search or select LGA..."
                    required
                  />
                </div>
              )}

              {/* House of Assembly: manual LGA then wards (fallback when no constituency) */}
              {TYPES_SELECT_WARDS.includes(createForm.type) && createForm.stateId && !createForm.constituencyId && (
                <>
                  <div className="dash-modal__field dash-modal__field--full">
                    <p className="dash-modal__hint dash-modal__hint--state" style={{ marginBottom: "0.5rem" }}>
                      State: <strong>{orgStates.find((s) => s._id === createForm.stateId)?.name ?? orgStates.find((s) => s._id === createForm.stateId)?.code ?? "—"}</strong>
                    </p>
                    <SearchableSelect
                      id="ce-lga-wards"
                      label="LGA"
                      value={createForm.coverageLgaId}
                      onChange={(val) =>
                        setCreateForm((f) => ({
                          ...f,
                          coverageLgaId: val,
                          coverageWardIds: [],
                        }))
                      }
                      options={[
                        { value: "", label: "— Select LGA —" },
                        ...lgas.map((l) => ({
                          value: l._id,
                          label: l.name ?? l.code ?? l._id,
                        })),
                      ]}
                      placeholder="Search or select LGA..."
                      required
                    />
                  </div>
                  {createForm.coverageLgaId && (
                    <div className="dash-modal__field dash-modal__field--full">
                      <label>Constituency — Select Wards</label>
                      <p className="dash-modal__hint">
                        Select wards under this LGA. Only polling units in these wards will see this election.
                      </p>
                      <div className="dash-modal__checklist">
                        {wards.map((w) => (
                          <label key={w._id} className="dash-modal__checkbox-row">
                            <input
                              type="checkbox"
                              checked={createForm.coverageWardIds.includes(w._id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setCreateForm((f) => ({
                                  ...f,
                                  coverageWardIds: checked
                                    ? [...f.coverageWardIds, w._id]
                                    : f.coverageWardIds.filter((id) => id !== w._id),
                                }));
                              }}
                            />
                            <span>{w.name ?? w.code ?? w._id}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Councillorship: manual LGA then single ward (fallback when no constituency) */}
              {TYPES_SELECT_SINGLE_WARD.includes(createForm.type) && createForm.stateId && !createForm.constituencyId && (
                <>
                  <div className="dash-modal__field dash-modal__field--full">
                    <p className="dash-modal__hint dash-modal__hint--state" style={{ marginBottom: "0.5rem" }}>
                      State: <strong>{orgStates.find((s) => s._id === createForm.stateId)?.name ?? orgStates.find((s) => s._id === createForm.stateId)?.code ?? "—"}</strong>
                    </p>
                    <SearchableSelect
                      id="ce-lga-councillor"
                      label="LGA"
                      value={createForm.coverageLgaId}
                      onChange={(val) =>
                        setCreateForm((f) => ({
                          ...f,
                          coverageLgaId: val,
                          coverageWardId: "",
                        }))
                      }
                      options={[
                        { value: "", label: "— Select LGA —" },
                        ...lgas.map((l) => ({
                          value: l._id,
                          label: l.name ?? l.code ?? l._id,
                        })),
                      ]}
                      placeholder="Search or select LGA..."
                      required
                    />
                  </div>
                  {createForm.coverageLgaId && (
                    <div className="dash-modal__field dash-modal__field--full">
                      <p className="dash-modal__hint" style={{ marginBottom: "0.5rem" }}>
                        Select the ward. All polling units in this ward will see this councillorship election.
                      </p>
                      <SearchableSelect
                        id="ce-ward"
                        label="Ward for Councillorship"
                        value={createForm.coverageWardId}
                        onChange={(val) => setCreateForm((f) => ({ ...f, coverageWardId: val }))}
                        options={[
                          { value: "", label: "— Select Ward —" },
                          ...wards.map((w) => ({
                            value: w._id,
                            label: w.name ?? w.code ?? w._id,
                          })),
                        ]}
                        placeholder="Search or select ward..."
                        required
                      />
                    </div>
                  )}
                </>
              )}

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
                <SearchableSelect
                  id="edit-type"
                  label="Type"
                  value={editForm.type}
                  onChange={(val) => setEditForm((f) => ({ ...f, type: val }))}
                  options={ELECTION_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
                  placeholder="Select type..."
                  required
                  searchable={false}
                />
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
              {viewingElection.coverage?.type === "lga" &&
                Array.isArray(viewingElection.coverage.ids) &&
                viewingElection.coverage.ids.length > 0 && (
                  <div className="dash-modal__view-row dash-modal__view-row--stacked">
                    <span className="dash-modal__view-label">Constituency LGAs</span>
                    <span className="dash-modal__view-value">
                      {viewingElection.coverage.ids
                        .map((id) => {
                          const lga = viewLgas.find((l) => String(l._id) === String(id));
                          return lga?.name ?? lga?.code ?? id;
                        })
                        .join(", ")}
                    </span>
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
                <PartySelect
                  id="ca-party"
                  label="Party"
                  value={createAspirantForm.partyId}
                  onChange={(partyId) => setCreateAspirantForm((f) => ({ ...f, partyId }))}
                  parties={parties ?? []}
                  placeholder="Select party..."
                  required
                  loading={partiesLoading}
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

      {/* Over-Voting modal */}
      {showOverVotingModal && overVotingElection && (
        <div
          className="results-overvote-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="overvote-modal-title"
          onClick={() => { setShowOverVotingModal(false); setOverVotingElection(null); }}
        >
          <div
            className="results-overvote-modal"
            onClick={(e) => e.stopPropagation()}
          >
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
                  <h2 id="overvote-modal-title" className="results-overvote-modal__title">
                    Over-Voting Report — {overVotingElection.name}
                  </h2>
                  <p className="results-overvote-modal__subtitle">
                    Polling units where total votes cast exceeds accredited voters
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="results-overvote-modal__close"
                onClick={() => { setShowOverVotingModal(false); setOverVotingElection(null); }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="results-overvote-modal__body">
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
                    {(() => {
                      const totalExcess = overVotingData.overVotingUnits.reduce((s, u) => s + u.excess, 0);
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
                              partyLogo: a.partyLogo ?? null,
                              partyColor: a.partyColor ?? null,
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
                        <>
                          <div className="results-overvote-modal__summary-left">
                            <span className="results-overvote-modal__summary-badge">
                              {overVotingData.overVotingUnits.length} affected polling unit{overVotingData.overVotingUnits.length !== 1 ? "s" : ""}
                            </span>
                            <span className="results-overvote-modal__summary-excess">
                              Total excess: <strong>+{totalExcess.toLocaleString()}</strong> votes
                            </span>
                          </div>
                          {beneficiary && (
                            <div className="results-overvote-modal__beneficiary">
                              <span className="results-overvote-modal__beneficiary-label">Most benefiting:</span>
                              {beneficiary.partyLogo ? (
                                <img src={beneficiary.partyLogo} alt={beneficiary.partyCode} className="results-overvote-modal__beneficiary-logo" />
                              ) : beneficiary.partyCode ? (
                                <span className="results-overvote-modal__beneficiary-logo results-overvote-modal__beneficiary-logo--initials" style={{ background: bColor }}>
                                  {beneficiary.partyCode.charAt(0)}
                                </span>
                              ) : null}
                              <span className="results-overvote-modal__beneficiary-party" style={{ background: bColor }}>
                                {beneficiary.partyCode}
                              </span>
                              <span className="results-overvote-modal__beneficiary-name">{beneficiary.aspirantName}</span>
                              <span className="results-overvote-modal__beneficiary-votes">{beneficiary.totalVotes.toLocaleString()} votes</span>
                            </div>
                          )}
                          <span className="results-overvote-modal__summary-note">Sorted by highest excess</span>
                        </>
                      );
                    })()}
                  </div>
                  <div className="results-overvote-modal__list">
                    {overVotingData.overVotingUnits.map((unit, idx) => (
                      <div key={unit.pollingUnitId} className="results-overvote-row">
                        <div className="results-overvote-row__header">
                          <span className="results-overvote-row__rank">#{idx + 1}</span>
                          <div className="results-overvote-row__pu">
                            <span className="results-overvote-row__pu-name">{unit.pollingUnitName}</span>
                            {unit.pollingUnitCode && (
                              <span className="results-overvote-row__pu-code">Code: {unit.pollingUnitCode}</span>
                            )}
                          </div>
                          <span className="results-overvote-row__excess">+{unit.excess.toLocaleString()} excess</span>
                        </div>
                        <div className="results-overvote-row__stats">
                          <div className="results-overvote-row__stat">
                            <span className="results-overvote-row__stat-label">Accredited Voters</span>
                            <span className="results-overvote-row__stat-value">{unit.accreditedCount.toLocaleString()}</span>
                          </div>
                          <div className="results-overvote-row__stat">
                            <span className="results-overvote-row__stat-label">Total Votes Cast</span>
                            <span className="results-overvote-row__stat-value results-overvote-row__stat-value--alert">{unit.totalVotesCast.toLocaleString()}</span>
                          </div>
                          <div className="results-overvote-row__stat">
                            <span className="results-overvote-row__stat-label">Excess Votes</span>
                            <span className="results-overvote-row__stat-value results-overvote-row__stat-value--alert results-overvote-row__stat-value--diff">+{unit.excess.toLocaleString()}</span>
                          </div>
                        </div>
                        {unit.agent && (
                          <div className="results-overvote-row__section-label">Presiding Officer</div>
                        )}
                        {unit.agent ? (
                          <div className="results-overvote-row__agent">
                            <div className="results-overvote-row__agent-details">
                              <span className="results-overvote-row__agent-name">{unit.agent.name || "—"}</span>
                              {unit.agent.phone && <span className="results-overvote-row__agent-contact">{unit.agent.phone}</span>}
                              {unit.agent.email && <span className="results-overvote-row__agent-contact">{unit.agent.email}</span>}
                            </div>
                          </div>
                        ) : unit.agent === null ? (
                          <div className="results-overvote-row__agent results-overvote-row__agent--none">
                            <span className="results-overvote-row__agent-no-record">No presiding officer on record</span>
                          </div>
                        ) : null}
                        {unit.aspirants && unit.aspirants.length > 0 && (
                          <>
                            <div className="results-overvote-row__section-label">Aspirant Votes Breakdown</div>
                            <div className="results-overvote-row__aspirants">
                              {unit.aspirants.map((a, aIdx) => {
                                const color = a.partyColor ?? "#374151";
                                const isTopVoter = aIdx === 0 && a.votes > 0;
                                const pct = unit.totalVotesCast > 0 ? ((a.votes / unit.totalVotesCast) * 100).toFixed(1) : "0.0";
                                return (
                                  <div key={a.aspirantId} className={`results-overvote-row__aspirant${isTopVoter ? " results-overvote-row__aspirant--leading" : ""}`}>
                                    {a.partyLogo ? (
                                      <img src={a.partyLogo} alt={a.partyCode} className="results-overvote-row__aspirant-logo" />
                                    ) : a.partyCode ? (
                                      <span className="results-overvote-row__aspirant-logo results-overvote-row__aspirant-logo--initials" style={{ background: color }}>
                                        {a.partyCode.charAt(0)}
                                      </span>
                                    ) : null}
                                    {a.partyCode && (
                                      <span className="results-overvote-row__aspirant-party" style={{ background: color }}>{a.partyCode}</span>
                                    )}
                                    <span className="results-overvote-row__aspirant-name">{a.aspirantName}</span>
                                    <div className="results-overvote-row__aspirant-right">
                                      <span className={`results-overvote-row__aspirant-votes${isTopVoter ? " results-overvote-row__aspirant-votes--leading" : ""}`}>
                                        {a.votes.toLocaleString()} votes
                                      </span>
                                      <span className="results-overvote-row__aspirant-pct">{pct}%</span>
                                    </div>
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

      {/* Polling Units modal */}
      {showPollingUnitsModal && pollingUnitsElection && (
        <div
          className="dash-modal-backdrop"
          onClick={() => { setShowPollingUnitsModal(false); setPollingUnitsElection(null); }}
          onKeyDown={(e) => e.key === "Escape" && (setShowPollingUnitsModal(false), setPollingUnitsElection(null))}
          role="button"
          tabIndex={0}
        >
          <div className="dash-modal dash-modal--form-large" style={{ maxWidth: "95vw", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="dash-modal__title">Polling Units Results — {pollingUnitsElection.name}</h3>
            <p className="dash-modal__subtitle">All results including attached result sheets. Filter by LGA, Ward, or Polling Unit.</p>
            {(() => {
              const aspirantTally = new Map<string, { name: string; partyId: string; partyCode: string; partyLogo: string | null; totalVotes: number }>();
              for (const r of pollingUnitsResults) {
                const aid = r.aspirant?._id ?? `${r.aspirant?.name ?? ""}::${(r.aspirant?.partyCode ?? r.party?.acronym ?? "").toUpperCase()}`;
                if (!aid) continue;
                const partyFromResultObj = typeof r.party === "object" && r.party ? r.party : null;
                const partyFromAspirantObj = (r.aspirant as { party?: { _id?: string } })?.party;
                const partyId = (partyFromResultObj as { _id?: string })?._id ?? partyFromAspirantObj?._id ?? (typeof r.party === "string" ? r.party : "") ?? "";
                const partyCode = (r.aspirant?.partyCode ?? r.party?.acronym ?? "").toString().toUpperCase() || "—";
                const name = r.aspirant?.name ?? partyCode ?? "—";
                const partyFromResult = typeof r.party === "object" && r.party ? (r.party as { logo?: string }) : null;
                const partyFromAspirant = (r.aspirant as { party?: { logo?: string } })?.party;
                const partyLogo = partyFromResult?.logo ?? partyFromAspirant?.logo ?? null;
                const existing = aspirantTally.get(aid);
                if (existing) {
                  existing.totalVotes += r.votes ?? 0;
                } else {
                  aspirantTally.set(aid, { name, partyId, partyCode, partyLogo, totalVotes: r.votes ?? 0 });
                }
              }
              const overallWinner = [...aspirantTally.values()]
                .filter((a) => a.totalVotes > 0)
                .sort((a, b) => b.totalVotes - a.totalVotes)[0] ?? null;
              const partiesList = (parties ?? []) as { _id?: string; logo?: string; acronym?: string; color?: string }[];
              const winnerParty = overallWinner
                ? partiesList.find((p) =>
                    overallWinner.partyId
                      ? String(p._id) === String(overallWinner.partyId)
                      : (p.acronym || "").toUpperCase() === (overallWinner.partyCode || "").toUpperCase()
                  )
                : undefined;
              const winnerLogo = (overallWinner?.partyLogo || winnerParty?.logo || "").trim() || null;
              const winnerColor = winnerParty?.color ?? "#374151";
              if (!overallWinner) return null;
              return (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    marginBottom: "1rem",
                    background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
                    border: "1px solid #bbf7d0",
                    borderRadius: "8px",
                  }}
                >
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#166534" }}>Election Winner</span>
                  {winnerLogo ? (
                    <img src={winnerLogo} alt={overallWinner.partyCode} style={{ width: 36, height: 36, objectFit: "contain", borderRadius: "4px" }} />
                  ) : (
                    <span style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: winnerColor, color: "#fff", borderRadius: "4px", fontSize: "0.875rem", fontWeight: 700 }}>
                      {overallWinner.partyCode.charAt(0) || "?"}
                    </span>
                  )}
                  <span style={{ fontWeight: 700, fontSize: "1rem", color: "#14532d" }}>{overallWinner.name}</span>
                  <span style={{ fontSize: "0.875rem", color: "#166534", fontWeight: 500 }}>({overallWinner.partyCode})</span>
                  <span style={{ fontSize: "0.875rem", color: "#15803d" }}>{overallWinner.totalVotes.toLocaleString()} votes</span>
                </div>
              );
            })()}
            {puElectionStateId ? (
              <div
                className="dash-modal__field dash-modal__field--full"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  gap: "1.5rem",
                  marginBottom: "1rem",
                  flexWrap: "nowrap",
                }}
              >
                <div style={{ flex: "1 1 0", minWidth: 0 }}>
                  <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.25rem" }}>LGA</label>
                  <select
                    value={pollingUnitsFilter.lgaId}
                    onChange={(e) => setPollingUnitsFilter((f) => ({ ...f, lgaId: e.target.value, wardId: "", pollingUnitId: "" }))}
                    style={{ padding: "0.4rem 0.6rem", width: "100%" }}
                  >
                    <option value="">All LGAs</option>
                    {puLgas.map((l) => (
                      <option key={l._id} value={l._id}>{l.name ?? l.code ?? l._id}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: "1 1 0", minWidth: 0 }}>
                  <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.25rem" }}>Ward</label>
                  <select
                    value={pollingUnitsFilter.wardId}
                    onChange={(e) => setPollingUnitsFilter((f) => ({ ...f, wardId: e.target.value, pollingUnitId: "" }))}
                    style={{ padding: "0.4rem 0.6rem", width: "100%" }}
                    disabled={!pollingUnitsFilter.lgaId}
                  >
                    <option value="">All Wards</option>
                    {puWards.map((w) => (
                      <option key={w._id} value={w._id}>{w.name ?? w.code ?? w._id}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: "1 1 0", minWidth: 0 }}>
                  <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.25rem" }}>Polling Unit</label>
                  <select
                    value={pollingUnitsFilter.pollingUnitId}
                    onChange={(e) => setPollingUnitsFilter((f) => ({ ...f, pollingUnitId: e.target.value }))}
                    style={{ padding: "0.4rem 0.6rem", width: "100%" }}
                    disabled={!pollingUnitsFilter.wardId}
                  >
                    <option value="">All Polling Units</option>
                    {puPollingUnits.map((pu) => (
                      <option key={pu._id} value={pu._id}>{pu.name ?? pu.code ?? pu._id}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setPollingUnitsFilter({ lgaId: "", wardId: "", pollingUnitId: "" })}
                  style={{
                    flexShrink: 0,
                    padding: "0.4rem 0.75rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#6b7280",
                    background: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    cursor: "pointer",
                    alignSelf: "flex-end",
                  }}
                  disabled={!pollingUnitsFilter.lgaId && !pollingUnitsFilter.wardId && !pollingUnitsFilter.pollingUnitId}
                >
                  Clear
                </button>
              </div>
            ) : (
              <p className="dash-modal__hint" style={{ marginBottom: "1rem" }}>This election is not scoped to a state. LGA/Ward/PU filters are not available.</p>
            )}
            <div style={{ flex: 1, overflow: "auto" }}>
              {(() => {
                const puMap = new Map<string, { lga: string; ward: string; pu: string; aspirants: Record<string, number>; total: number; hasSheet: boolean }>();
                for (const r of pollingUnitsResults) {
                  const pu = r.pollingUnit as { _id?: string; name?: string; code?: string; ward?: { name?: string; code?: string; lga?: { name?: string; code?: string } } } | undefined;
                  if (!pu) continue;
                  const puId = String(pu._id ?? "");
                  const lga = pu.ward?.lga?.name ?? (pu.ward?.lga as { code?: string })?.code ?? "—";
                  const ward = pu.ward?.name ?? pu.ward?.code ?? "—";
                  const puName = pu.name ?? pu.code ?? puId;
                  const aspirantLabel = (r.aspirant?.partyCode ?? r.party?.acronym ?? r.aspirant?.name ?? "").toString().toUpperCase() || "—";
                  if (!puMap.has(puId)) {
                    puMap.set(puId, { lga, ward, pu: puName, aspirants: {}, total: 0, hasSheet: false });
                  }
                  const entry = puMap.get(puId)!;
                  if (aspirantLabel && aspirantLabel !== "—") entry.aspirants[aspirantLabel] = (entry.aspirants[aspirantLabel] ?? 0) + (r.votes ?? 0);
                  entry.total += r.votes ?? 0;
                }
                const hasFilter = !!(pollingUnitsFilter.lgaId || pollingUnitsFilter.wardId || pollingUnitsFilter.pollingUnitId);
                for (const s of pollingUnitsSheets) {
                  const pu = s?.pollingUnit as { _id?: string; name?: string; code?: string } | undefined;
                  const puId = pu ? String(pu._id ?? pu) : "";
                  if (!puId) continue;
                  if (hasFilter && !puMap.has(puId)) continue;
                  const lgaObj = s?.lga as { name?: string; code?: string } | undefined;
                  const wardObj = s?.ward as { name?: string; code?: string } | undefined;
                  const lga = lgaObj?.name ?? lgaObj?.code ?? "—";
                  const ward = wardObj?.name ?? wardObj?.code ?? "—";
                  const puName = pu?.name ?? pu?.code ?? puId;
                  if (!puMap.has(puId)) {
                    puMap.set(puId, { lga, ward, pu: puName, aspirants: {}, total: 0, hasSheet: true });
                  } else {
                    puMap.get(puId)!.hasSheet = true;
                  }
                }
                const rows = Array.from(puMap.entries()).map(([puId, data]) => ({ puId, ...data }));
                const aspirantCols = new Set<string>();
                rows.forEach((r) => Object.keys(r.aspirants).forEach((k) => aspirantCols.add(k)));
                const aspirantColList = Array.from(aspirantCols).sort().slice(0, 5);
                const sheetsByPu = new Map<string, Array<{ fileUrl?: string }>>();
                for (const s of pollingUnitsSheets) {
                  const pu = s?.pollingUnit as { _id?: string } | undefined;
                  const puId = pu ? String(pu._id ?? pu) : "";
                  if (!puId) continue;
                  const list = sheetsByPu.get(puId) ?? [];
                  list.push({ fileUrl: (s as { fileUrl?: string })?.fileUrl });
                  sheetsByPu.set(puId, list);
                }
                const getWinner = (row: typeof rows[0]) => {
                  const entries = Object.entries(row.aspirants).filter(([, v]) => v > 0);
                  if (entries.length === 0) return null;
                  return entries.reduce((a, b) => (a[1] >= b[1] ? a : b));
                };
                return (
                  <>
                    <div className="dash-table-wrapper">
                      <table className="dash-table">
                        <thead>
                          <tr>
                            <th style={{ minWidth: "100px" }}>LGA</th>
                            <th style={{ minWidth: "100px" }}>Ward</th>
                            <th style={{ minWidth: "120px" }}>Polling Unit</th>
                            {aspirantColList.map((ac) => <th key={ac}>{ac}</th>)}
                            <th>Total</th>
                            <th>Winner</th>
                            <th>Attached</th>
                            <th className="dash-table__actions-col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.length === 0 ? (
                            <tr>
                              <td colSpan={aspirantColList.length + 8} className="dash-table__empty">
                                {pollingUnitsResultsLoading ? (
                                  <div className="results-pu-cards-loading" style={{ padding: "2rem 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                                    <span className="results-pu-cards-loading__spinner" />
                                    <span className="results-pu-cards-loading__text">Loading results…</span>
                                  </div>
                                ) : (
                                  "No results found."
                                )}
                              </td>
                            </tr>
                          ) : (
                            rows.map((row) => {
                              const winner = getWinner(row);
                              const puSheets = sheetsByPu.get(row.puId) ?? [];
                              const firstSheetUrl = puSheets[0]?.fileUrl;
                              return (
                                <tr key={row.puId}>
                                  <td style={{ paddingRight: "1.25rem" }}>{row.lga}</td>
                                  <td style={{ paddingRight: "1.25rem" }}>{row.ward}</td>
                                  <td style={{ paddingRight: "1.25rem" }}>{row.pu}</td>
                                  {aspirantColList.map((ac) => <td key={ac}>{row.aspirants[ac]?.toLocaleString() ?? "—"}</td>)}
                                  <td>{row.total.toLocaleString()}</td>
                                  <td>
                                    {winner ? (
                                      <button
                                        type="button"
                                        className="dash-table__actions-trigger"
                                        style={{ background: "none", border: "none", padding: "0.25rem 0", cursor: "pointer", fontWeight: 600, color: "#059669" }}
                                        onClick={() => setViewWinnerPu(row)}
                                      >
                                        {winner[0]} ({winner[1].toLocaleString()})
                                      </button>
                                    ) : (
                                      "—"
                                    )}
                                  </td>
                                  <td>{row.hasSheet ? "✓" : "—"}</td>
                                  <td className="dash-table__actions-col">
                                    <div
                                      className="dash-table__actions-dropdown"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        type="button"
                                        className="dash-table__actions-trigger"
                                        onClick={() => setPuRowActionsOpenId(puRowActionsOpenId === row.puId ? null : row.puId)}
                                        aria-expanded={puRowActionsOpenId === row.puId}
                                      >
                                        Actions
                                        <IconChevronDown />
                                      </button>
                                      {puRowActionsOpenId === row.puId && (
                                        <div className="dash-table__actions-menu">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setPuRowActionsOpenId(null);
                                              if (firstSheetUrl) {
                                                window.open(firstSheetUrl, "_blank", "noopener,noreferrer");
                                              } else {
                                                Swal.fire({ icon: "info", title: "No Result Sheet", text: "No result sheet has been uploaded for this polling unit." });
                                              }
                                            }}
                                          >
                                            View Result Sheet
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="dash-modal__actions" style={{ marginTop: "1rem" }}>
              <button
                type="button"
                className="dash-page__btn dash-page__btn--outline"
                onClick={() => { setShowPollingUnitsModal(false); setPollingUnitsElection(null); setViewWinnerPu(null); }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report modal (for concluded elections) */}
      {showReportModal && reportElection && (
        <div
          className="dash-modal-backdrop"
          onClick={() => { setShowReportModal(false); setReportElection(null); setDetailReport(null); }}
        >
          <div className="dash-modal dash-modal--form-large" style={{ maxWidth: "95vw", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="dash-modal__title">Reports — {reportElection.name}</h3>
            <p className="dash-modal__subtitle">All incident reports for this concluded election.</p>
            <div style={{ flex: 1, overflow: "auto" }}>
              {reportLoading ? (
                <div className="rpt-loading" style={{ padding: "2rem" }}>
                  <span className="rpt-loading__spinner" />
                  <span>Loading reports…</span>
                </div>
              ) : reportList.length === 0 ? (
                <div className="rpt-empty" style={{ padding: "3rem" }}>
                  <p className="rpt-empty__title">No reports found</p>
                  <p className="rpt-empty__sub">No incident reports have been submitted for this election.</p>
                </div>
              ) : (
                <div className="rpt-grid" style={{ padding: "0.5rem 0" }}>
                  {reportList.map((report) => {
                    const colors = REPORT_CATEGORY_COLORS[report.category] ?? REPORT_CATEGORY_COLORS.ADMINISTRATIVE;
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
                        <div className="rpt-card__top">
                          <span className="rpt-card__category" style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}>
                            {REPORT_CATEGORY_LABELS[report.category]}
                          </span>
                          <div className="rpt-card__top-right">
                            {report.isRead ? <span className="rpt-card__status rpt-card__status--read">Read</span> : <span className="rpt-card__status rpt-card__status--unread">Unread</span>}
                            <span className="rpt-card__date">{formatReportDate(report.createdAt)}</span>
                          </div>
                        </div>
                        <p className="rpt-card__location">{getReportLocationLabel(report)}</p>
                        <div className="rpt-card__items">
                          {report.items.slice(0, 3).map((item) => (
                            <span key={item} className="rpt-card__item-tag">{item}</span>
                          ))}
                          {report.items.length > 3 && <span className="rpt-card__item-more">+{report.items.length - 3} more</span>}
                        </div>
                        {report.notes && <p className="rpt-card__notes">{report.notes}</p>}
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
                              <span className="rpt-card__reporter-role">{formatReportRole(report.reportedBy?.role)}</span>
                              {getCardLocation(report) && <span className="rpt-card__reporter-location">{getCardLocation(report)}</span>}
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
            <div className="dash-modal__actions" style={{ marginTop: "1rem" }}>
              <button type="button" className="dash-page__btn dash-page__btn--outline" onClick={() => { setShowReportModal(false); setReportElection(null); setDetailReport(null); }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report detail modal (from Report modal) */}
      {detailReport && (
        <div className="rpt-modal-backdrop" onClick={() => setDetailReport(null)} role="dialog" aria-modal="true" style={{ zIndex: 10002 }}>
          <div className="rpt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rpt-modal__header">
              <div className="rpt-modal__header-left">
                {(() => {
                  const colors = REPORT_CATEGORY_COLORS[detailReport.category] ?? REPORT_CATEGORY_COLORS.ADMINISTRATIVE;
                  return (
                    <span className="rpt-modal__category" style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}>
                      {REPORT_CATEGORY_LABELS[detailReport.category]}
                    </span>
                  );
                })()}
                <div>
                  <h2 className="rpt-modal__title">{getReportLocationLabel(detailReport)}</h2>
                  <p className="rpt-modal__meta">{formatReportDate(detailReport.createdAt)}</p>
                </div>
              </div>
              <div className="rpt-modal__header-actions">
                {detailReport.isRead ? (
                  <button type="button" className="rpt-modal__read-btn rpt-modal__read-btn--unread" onClick={() => dispatch(markReportUnreadApi(detailReport._id))}>● Mark Unread</button>
                ) : (
                  <button type="button" className="rpt-modal__read-btn rpt-modal__read-btn--read" onClick={() => dispatch(markReportReadApi(detailReport._id))}>✓ Mark as Read</button>
                )}
                <button type="button" className="rpt-modal__close" onClick={() => setDetailReport(null)} aria-label="Close">✕</button>
              </div>
            </div>
            <div className="rpt-modal__body">
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
                    <p className="rpt-modal__reporter-role">{formatReportRole(detailReport.reportedBy?.role)}</p>
                    {detailReport.reportedBy?.email && <p className="rpt-modal__reporter-email">{detailReport.reportedBy.email}</p>}
                    {detailReport.reportedBy?.phoneNumber && <p className="rpt-modal__reporter-phone">{detailReport.reportedBy.phoneNumber}</p>}
                    {getCardLocation(detailReport) && <p className="rpt-modal__reporter-location">{getCardLocation(detailReport)}</p>}
                  </div>
                </div>
              </div>
              <div className="rpt-modal__section">
                <h3 className="rpt-modal__section-title">Location</h3>
                <div className="rpt-modal__location-grid">
                  {detailReport.state?.name && <div className="rpt-modal__location-item"><span className="rpt-modal__location-label">State</span><span className="rpt-modal__location-value">{detailReport.state.name}</span></div>}
                  {detailReport.lga?.name && <div className="rpt-modal__location-item"><span className="rpt-modal__location-label">LGA</span><span className="rpt-modal__location-value">{detailReport.lga.name}</span></div>}
                  {detailReport.ward?.name && <div className="rpt-modal__location-item"><span className="rpt-modal__location-label">Ward</span><span className="rpt-modal__location-value">{detailReport.ward.name}</span></div>}
                  {detailReport.pollingUnit?.name && <div className="rpt-modal__location-item"><span className="rpt-modal__location-label">Polling Unit</span><span className="rpt-modal__location-value">{detailReport.pollingUnit.name}{detailReport.pollingUnit.code ? ` (${detailReport.pollingUnit.code})` : ""}</span></div>}
                  {detailReport.election?.name && <div className="rpt-modal__location-item"><span className="rpt-modal__location-label">Election</span><span className="rpt-modal__location-value">{detailReport.election.name}</span></div>}
                </div>
              </div>
              <div className="rpt-modal__section">
                <h3 className="rpt-modal__section-title">Incident Items</h3>
                <div className="rpt-modal__items">
                  {detailReport.items.map((item) => <span key={item} className="rpt-modal__item-tag">{item}</span>)}
                </div>
              </div>
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

      {/* View Winner modal (from Polling Units table) */}
      {viewWinnerPu && (
        <div
          className="dash-modal-backdrop"
          style={{ zIndex: 10001 }}
          onClick={() => setViewWinnerPu(null)}
        >
          <div className="dash-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px" }}>
            <h3 className="dash-modal__title">Polling Unit Results</h3>
            <p className="dash-modal__subtitle">
              {viewWinnerPu.lga} · {viewWinnerPu.ward} · {viewWinnerPu.pu}
            </p>
            <div className="dash-modal__view-grid">
              {Object.entries(viewWinnerPu.aspirants)
                .filter(([, v]) => v > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([party, votes], idx) => (
                  <div key={party} className="dash-modal__view-row">
                    <span className="dash-modal__view-label">{idx === 0 ? "Winner: " : ""}{party}</span>
                    <span className="dash-modal__view-value">{votes.toLocaleString()} votes</span>
                  </div>
                ))}
            </div>
            <div className="dash-modal__actions">
              <button type="button" className="dash-page__btn dash-page__btn--outline" onClick={() => setViewWinnerPu(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
