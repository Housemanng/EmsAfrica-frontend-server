import { useEffect, useRef, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../app/store";
import { store } from "../app/store";
import {
  getConversations,
  getThread,
  sendDirectMessage,
  getMyMessages,
  getMessageById,
  replyToMessage,
  createBroadcastMessage,
  type BroadcastTarget,
} from "../features/messages/messageApi";
import {
  appendToThread,
  clearOpenMessage,
  setActiveThread,
  setTypingUser,
  markRead,
  setOnlineUsers,
  socketNewMessage,
  socketNewReply,
  clearBroadcastError,
} from "../features/messages/messageSlice";
import { getSocket } from "../services/socket";
import { playMessageNotificationSound } from "../services/notificationSound";
import {
  selectConversations,
  selectConversationsLoading,
  selectThreads,
  selectThreadLoading,
  selectActiveThreadAgentId,
  selectInbox,
  selectInboxLoading,
  selectOpenMessage,
  selectOpenMessageLoading,
  selectReplyError,
  selectBroadcastLoading,
  selectBroadcastError,
  selectTotalConversationUnread,
  selectUnreadCount,
  selectOnlineUserIds,
  selectTypingUserId,
} from "../features/messages/messageSelectors";
import {
  getUsersByOrganizationId,
  getRegularAdminsByOrganizationId,
  getUsersByLgaId,
  getUsersByWardId,
  getUsersByPollingUnitId,
} from "../features/user/userApi";
import {
  selectUsersByOrganizationId,
  selectRegularAdminsByOrganizationId,
  selectUsersByLgaId,
  selectUsersByWardId,
  selectUsersByPollingUnitId,
} from "../features/user/userSelectors";
import { getStatesByOrganizationId } from "../features/states/stateApi";
import { selectStatesByOrganizationId } from "../features/states/stateSelectors";
import { getLGAsByState } from "../features/lgas/lgaApi";
import { selectLGAsByState } from "../features/lgas/lgaSelectors";
import { getWardsByLGA } from "../features/wards/wardApi";
import { selectWardsByLGA } from "../features/wards/wardSelectors";
import {
  getPollingUnitsByWard as getPUsByWard,
} from "../features/pollingUnits/pollingUnitApi";
import { selectPollingUnitsByWard as selectPUsByWard } from "../features/pollingUnits/pollingUnitSelectors";
import type { IMessage, IConversation, IMessageUser } from "../features/messages/messageApi";
import { FiSend } from "react-icons/fi";
import { MessageStatusIcon } from "../components/MessageStatusIcon";
import "./Messages.css";

/** Stable empty array for location selectors — avoids "different result" selector warnings */
const EMPTY_LOC_ITEMS: { _id?: string; id?: string; name?: string; lga_name?: string; ward_name?: string; polling_unit_name?: string }[] = [];

// ── helpers ──────────────────────────────────────────────────────────────────

// Extended user type that includes location refs populated from the backend
type AgentUser = IMessageUser & {
  lga?:         { name?: string; code?: string } | string | null;
  ward?:        { name?: string; code?: string } | string | null;
  pollingUnit?: { name?: string; code?: string } | string | null;
};

function locName(loc: AgentUser["lga"] | undefined): string {
  if (!loc) return "";
  if (typeof loc === "object" && loc !== null) return loc.name ?? "";
  return "";
}

function userName(user?: IMessageUser | null): string {
  if (!user) return "Unknown";
  const full = [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ");
  return full || user.email || "Unknown";
}

/** Resolve sender: if msg.from is incomplete (ObjectId or missing name), enrich from known users */
function resolveSender(
  from: IMessageUser | string | undefined,
  knownUsers: Map<string, IMessageUser>
): IMessageUser | undefined {
  if (!from) return undefined;
  const id = typeof from === "string" ? from : toId(from);
  if (!id) return typeof from === "object" ? from : undefined;
  const hasName = typeof from === "object" && (from.firstName || from.lastName || from.email);
  if (hasName) return from as IMessageUser;
  const known = knownUsers.get(id);
  if (known) return known;
  return typeof from === "object" ? (from as IMessageUser) : undefined;
}

function userInitials(user?: IMessageUser | null): string {
  if (!user) return "?";
  const f = user.firstName?.[0] ?? "";
  const l = user.lastName?.[0] ?? "";
  return (f + l).toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
}

function formatTime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const isThisYear = d.getFullYear() === now.getFullYear();
  if (isThisYear) return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatTimeDetailed(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function roleBadge(role?: string): string {
  if (!role) return "";
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function toId(val: unknown): string {
  if (!val) return "";
  if (typeof val === "object" && val !== null && "_id" in val)
    return String((val as { _id: unknown })._id);
  if (typeof val === "object" && val !== null && "id" in val)
    return String((val as { id: unknown }).id);
  return String(val);
}

function Avatar({ user, size = 40 }: { user?: IMessageUser | null; size?: number }) {
  const [imgError, setImgError] = useState(false);
  if (user?.photo && !imgError) {
    return (
      <img
        src={user.photo}
        alt={userName(user)}
        className="msg-avatar"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div className="msg-avatar msg-avatar--initials" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {userInitials(user)}
    </div>
  );
}

// Agent roles (non-overview)
const AGENT_ROLES = [
  "national_level_agent",
  "state_returning_officer_agent",
  "presiding_officer_po_agent",
  "ra_ward_collation_officer_agent",
  "lga_collation_officer_agent",
  "state_constituency_returning_officer_agent",
  "federal_constituency_returning_officer_agent",
  "senatorial_district_agent",
];

// Overview admin roles
const ADMIN_ROLES = ["regular", "superadmin", "executive"];

// ── Main component ────────────────────────────────────────────────────────────

type FilterMode = "all" | "lga" | "ward" | "polling_unit";

export default function Messages() {
  const dispatch = useDispatch<AppDispatch>();

  const authUser       = useSelector((s: RootState) => s.auth.user);
  const orgRaw         = authUser?.organization;
  const organizationId = useMemo(() => {
    if (typeof orgRaw === "object" && orgRaw !== null) {
      const o = orgRaw as { _id?: string; id?: string };
      return String(o._id ?? o.id ?? "");
    }
    return String(orgRaw ?? "");
  }, [orgRaw]);
  const role           = useSelector((s: RootState) => s.auth.role) ?? "";
  const isOverviewRole = useMemo(() => ADMIN_ROLES.includes(role.toLowerCase()), [role]);
  const myUserId       = useMemo(() => String((authUser as { _id?: string; id?: string })?._id ?? (authUser as { _id?: string; id?: string })?.id ?? ""), [authUser]);


  // Overview-side state
  const conversations  = useSelector(selectConversations);
  const convsLoading   = useSelector(selectConversationsLoading);
  const totalUnread    = useSelector(selectTotalConversationUnread);
  const threads        = useSelector(selectThreads);
  const threadLoading  = useSelector(selectThreadLoading);
  const activeAgentId  = useSelector(selectActiveThreadAgentId);

  // Agent-side state
  const inbox          = useSelector(selectInbox);
  const inboxLoading   = useSelector(selectInboxLoading);
  const openMessage    = useSelector(selectOpenMessage);
  const openMsgLoading = useSelector(selectOpenMessageLoading);
  const unreadCount    = useSelector(selectUnreadCount);

  const replyError     = useSelector(selectReplyError);
  const onlineUserIds  = useSelector(selectOnlineUserIds);
  const typingUserId   = useSelector(selectTypingUserId);
  const broadcastLoading = useSelector(selectBroadcastLoading);
  const broadcastError   = useSelector(selectBroadcastError);

  // ── Location data for cascade filters ───────────────────────────────────

  // State ID for LGA filter: user's state if set, else first org state (like Presence/Reports)
  const _selectStateIdForFilters = useMemo(
    () => (s: RootState) => {
      const u = s.auth.user as { state?: { _id?: string; id?: string } | string } | null;
      const sid = typeof u?.state === "object" && u?.state != null
        ? String((u.state as { _id?: string; id?: string })._id ?? (u.state as { _id?: string; id?: string }).id ?? "")
        : typeof u?.state === "string" ? String(u.state) : "";
      if (sid) return sid;
      const orgStates = organizationId ? (selectStatesByOrganizationId(organizationId)(s) as Array<{ _id?: string; id?: string }> | undefined) : undefined;
      const first = orgStates?.[0];
      return first ? String(first._id ?? first.id ?? "") : "";
    },
    [organizationId]
  );
  const stateIdForFilters = useSelector(_selectStateIdForFilters);
  const _selectOrgStates = useMemo(
    () => selectStatesByOrganizationId(organizationId),
    [organizationId]
  );
  const orgStates = useSelector(_selectOrgStates) as Array<{ _id?: string; id?: string; name?: string }> | undefined;

  // ── User lists (for sidebar) ──────────────────────────────────────────────

  // Overview filter state
  const [filterMode,  setFilterMode]  = useState<FilterMode>("all");
  const [filterLgaId,  setFilterLgaId]  = useState("");
  const [filterWardId, setFilterWardId] = useState("");
  const [filterPuId,   setFilterPuId]   = useState("");

  // Broadcast form state (overview roles only)
  type BroadcastTargetType = "all_agents" | "all_states" | "all_lgas_in_state" | "all_wards_in_lga" | "all_pus_in_ward" | "by_state" | "by_lga" | "by_ward" | "by_polling_unit" | "by_role";
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<BroadcastTargetType>("all_agents");
  const [broadcastStateId, setBroadcastStateId] = useState("");
  const [broadcastLgaId, setBroadcastLgaId] = useState("");
  const [broadcastWardId, setBroadcastWardId] = useState("");
  const [broadcastPuId, setBroadcastPuId] = useState("");
  const [broadcastRole, setBroadcastRole] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");

  // All org users (overview: fetch once)
  const _selectOrgUsers = useMemo(
    () => selectUsersByOrganizationId(organizationId),
    [organizationId]
  );
  const orgUsersRaw = useSelector(_selectOrgUsers) as { users?: unknown[] } | unknown[] | undefined;
  const orgUsers = useMemo<IMessageUser[]>(() => {
    if (!orgUsersRaw) return [];
    const arr = Array.isArray(orgUsersRaw) ? orgUsersRaw : (orgUsersRaw as { users?: unknown[] }).users ?? [];
    return arr as IMessageUser[];
  }, [orgUsersRaw]);

  // LGA-filtered users
  const _selectLgaUsers = useMemo(
    () => filterMode === "lga" && filterLgaId
      ? selectUsersByLgaId(organizationId, filterLgaId)
      : () => undefined,
    [organizationId, filterMode, filterLgaId]
  );
  const lgaUsersRaw = useSelector(_selectLgaUsers) as { users?: unknown[] } | undefined;
  const lgaUsers = useMemo<IMessageUser[]>(() => {
    if (!lgaUsersRaw) return [];
    const arr = Array.isArray(lgaUsersRaw) ? lgaUsersRaw : (lgaUsersRaw as { users?: unknown[] }).users ?? [];
    return arr as IMessageUser[];
  }, [lgaUsersRaw]);

  // Ward-filtered users
  const _selectWardUsers = useMemo(
    () => filterMode === "ward" && filterWardId
      ? selectUsersByWardId(organizationId, filterWardId)
      : () => undefined,
    [organizationId, filterMode, filterWardId]
  );
  const wardUsersRaw = useSelector(_selectWardUsers) as { users?: unknown[] } | undefined;
  const wardUsers = useMemo<IMessageUser[]>(() => {
    if (!wardUsersRaw) return [];
    const arr = Array.isArray(wardUsersRaw) ? wardUsersRaw : (wardUsersRaw as { users?: unknown[] }).users ?? [];
    return arr as IMessageUser[];
  }, [wardUsersRaw]);

  // PU-filtered users
  const _selectPuUsers = useMemo(
    () => filterMode === "polling_unit" && filterPuId
      ? selectUsersByPollingUnitId(organizationId, filterPuId)
      : () => undefined,
    [organizationId, filterMode, filterPuId]
  );
  const puUsersRaw = useSelector(_selectPuUsers) as { users?: unknown[] } | undefined;
  const puUsers = useMemo<IMessageUser[]>(() => {
    if (!puUsersRaw) return [];
    const arr = Array.isArray(puUsersRaw) ? puUsersRaw : (puUsersRaw as { users?: unknown[] }).users ?? [];
    return arr as IMessageUser[];
  }, [puUsersRaw]);

  // ── Cascade location lists ─────────────────────────────────────────────

  type LocItem = { _id?: string; id?: string; name?: string; lga_name?: string; ward_name?: string; polling_unit_name?: string };

  // LGAs for the selected state (user's state or first org state)
  const _selectLgas = useMemo(
    () => stateIdForFilters ? selectLGAsByState(stateIdForFilters) : () => EMPTY_LOC_ITEMS,
    [stateIdForFilters]
  );
  const lgaList = useSelector(_selectLgas) as LocItem[];

  // Wards for the selected LGA
  const _selectWards = useMemo(
    () => filterLgaId ? selectWardsByLGA(filterLgaId) : () => EMPTY_LOC_ITEMS,
    [filterLgaId]
  );
  const wardList = useSelector(_selectWards) as LocItem[];

  // Polling units for the selected ward
  const _selectPUs = useMemo(
    () => filterWardId ? selectPUsByWard(organizationId, filterWardId) : () => EMPTY_LOC_ITEMS,
    [organizationId, filterWardId]
  );
  const puList = useSelector(_selectPUs) as LocItem[];

  // Broadcast form: location lists (cascade by broadcastStateId, broadcastLgaId, broadcastWardId)
  const _selectBroadcastLgas = useMemo(
    () => broadcastStateId ? selectLGAsByState(broadcastStateId) : () => EMPTY_LOC_ITEMS,
    [broadcastStateId]
  );
  const broadcastLgaList = useSelector(_selectBroadcastLgas) as LocItem[];
  const _selectBroadcastWards = useMemo(
    () => broadcastLgaId ? selectWardsByLGA(broadcastLgaId) : () => EMPTY_LOC_ITEMS,
    [broadcastLgaId]
  );
  const broadcastWardList = useSelector(_selectBroadcastWards) as LocItem[];
  const _selectBroadcastPUs = useMemo(
    () => broadcastWardId ? selectPUsByWard(organizationId, broadcastWardId) : () => EMPTY_LOC_ITEMS,
    [organizationId, broadcastWardId]
  );
  const broadcastPuList = useSelector(_selectBroadcastPUs) as LocItem[];

  // Agents visible in overview sidebar
  const overviewAgentList = useMemo<IMessageUser[]>(() => {
    let base: IMessageUser[] = [];
    if (filterMode === "polling_unit" && filterPuId) base = puUsers;
    else if (filterMode === "ward" && filterWardId) base = wardUsers;
    else if (filterMode === "lga" && filterLgaId) base = lgaUsers;
    else base = orgUsers;
    // Show only agent roles, exclude self
    return base.filter((u) => {
      const r = (u as { role?: string }).role?.toLowerCase() ?? "";
      const id = toId(u);
      return AGENT_ROLES.includes(r) && id !== myUserId;
    });
  }, [filterMode, filterLgaId, filterWardId, filterPuId, lgaUsers, wardUsers, puUsers, orgUsers, myUserId]);

  // Regular admins — agents use a dedicated permitted endpoint
  const _selectRegularAdmins = useMemo(
    () => selectRegularAdminsByOrganizationId(organizationId),
    [organizationId]
  );
  const regularAdminsRaw = useSelector(_selectRegularAdmins) as IMessageUser[] | undefined;

  // Admins visible in agent sidebar (only regular admins, exclude self)
  const adminList = useMemo<IMessageUser[]>(() => {
    const base = !isOverviewRole
      ? (regularAdminsRaw ?? [])
      : orgUsers.filter((u) => {
          const r = (u as { role?: string }).role?.toLowerCase() ?? "";
          return r === "regular";
        });
    return base.filter((u) => toId(u) !== myUserId);
  }, [isOverviewRole, regularAdminsRaw, orgUsers, myUserId]);

  const [inputText, setInputText] = useState("");
  const [search,    setSearch]    = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  const adjustComposeHeight = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxH = 140;
    el.style.overflowY = el.scrollHeight > maxH ? "auto" : "hidden";
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
  };

  // ── Initial fetch ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!organizationId) return;
    if (isOverviewRole) {
      dispatch(getConversations(organizationId));
      dispatch(getUsersByOrganizationId(organizationId));
    } else {
      dispatch(getMyMessages(organizationId));
      // Agents only need the list of regular admins (the /regular-admins route allows all roles)
      dispatch(getRegularAdminsByOrganizationId(organizationId));
    }
  }, [dispatch, organizationId, isOverviewRole]);

  // Fetch org states (needed for state fallback when user has no state)
  useEffect(() => {
    if (isOverviewRole && organizationId) dispatch(getStatesByOrganizationId(organizationId));
  }, [dispatch, isOverviewRole, organizationId]);

  // Fetch LGAs when we have a state (user's state or first org state)
  useEffect(() => {
    if (isOverviewRole && stateIdForFilters) dispatch(getLGAsByState(stateIdForFilters));
  }, [dispatch, isOverviewRole, stateIdForFilters]);

  // Fetch wards when LGA is selected
  useEffect(() => {
    if (isOverviewRole && filterLgaId) dispatch(getWardsByLGA(filterLgaId));
  }, [dispatch, isOverviewRole, filterLgaId]);

  // Fetch polling units when ward is selected
  useEffect(() => {
    if (isOverviewRole && organizationId && filterWardId)
      dispatch(getPUsByWard({ organizationId, wardId: filterWardId }));
  }, [dispatch, isOverviewRole, organizationId, filterWardId]);

  // Broadcast form: fetch LGAs when state is selected
  useEffect(() => {
    const needsLgas = ["by_lga", "by_ward", "by_polling_unit", "all_lgas_in_state", "all_wards_in_lga", "all_pus_in_ward"];
    if (isOverviewRole && broadcastStateId && needsLgas.includes(broadcastTarget))
      dispatch(getLGAsByState(broadcastStateId));
  }, [dispatch, isOverviewRole, broadcastStateId, broadcastTarget]);

  // Broadcast form: fetch wards when LGA is selected
  useEffect(() => {
    const needsWards = ["by_ward", "by_polling_unit", "all_wards_in_lga", "all_pus_in_ward"];
    if (isOverviewRole && broadcastLgaId && needsWards.includes(broadcastTarget))
      dispatch(getWardsByLGA(broadcastLgaId));
  }, [dispatch, isOverviewRole, broadcastLgaId, broadcastTarget]);

  // Broadcast form: fetch polling units when ward is selected
  useEffect(() => {
    const needsPus = ["by_polling_unit", "all_pus_in_ward"];
    if (isOverviewRole && organizationId && broadcastWardId && needsPus.includes(broadcastTarget))
      dispatch(getPUsByWard({ organizationId, wardId: broadcastWardId }));
  }, [dispatch, isOverviewRole, organizationId, broadcastWardId, broadcastTarget]);

  // Fetch users filtered by LGA / ward / PU when filter selection changes
  useEffect(() => {
    if (!organizationId || !filterLgaId) return;
    if (filterMode === "lga") dispatch(getUsersByLgaId({ organizationId, lgaId: filterLgaId }));
  }, [dispatch, organizationId, filterMode, filterLgaId]);

  useEffect(() => {
    if (!organizationId || !filterWardId) return;
    if (filterMode === "ward") dispatch(getUsersByWardId({ organizationId, wardId: filterWardId }));
  }, [dispatch, organizationId, filterMode, filterWardId]);

  useEffect(() => {
    if (!organizationId || !filterPuId) return;
    if (filterMode === "polling_unit") dispatch(getUsersByPollingUnitId({ organizationId, pollingUnitId: filterPuId }));
  }, [dispatch, organizationId, filterMode, filterPuId]);

  // ── Real-time updates via Socket.io ──────────────────────────────────────

  useEffect(() => {
    if (!organizationId) return;
    const socket = getSocket();
    socket.emit("join:org", { organizationId, userId: myUserId });

    socket.on("users:online", (payload: { userIds?: string[] }) => {
      dispatch(setOnlineUsers(payload.userIds ?? []));
    });
    socket.on("new_message", (msg: IMessage) => {
      dispatch(socketNewMessage(msg));
      const fromId = String((msg.from as { _id?: string })?._id ?? "");
      if (fromId && fromId !== myUserId) playMessageNotificationSound();
    });
    socket.on("new_reply", ({ reply, parentId }: { reply: IMessage; parentId: string }) => {
      dispatch(socketNewReply({ reply, parentId }));
      const fromId = String((reply.from as { _id?: string })?._id ?? "");
      if (fromId && fromId !== myUserId) playMessageNotificationSound();
    });

    let typingClearTimer: ReturnType<typeof setTimeout> | null = null;
    socket.on("user_typing", (payload: { userId: string; targetUserId: string }) => {
      const { userId, targetUserId } = payload ?? {};
      if (targetUserId === myUserId) {
        dispatch(setTypingUser(userId ?? null));
        if (typingClearTimer) clearTimeout(typingClearTimer);
        typingClearTimer = setTimeout(() => dispatch(setTypingUser(null)), 3000);
      }
    });
    socket.on("user_typing_stop", (payload: { userId: string; targetUserId: string }) => {
      const { userId, targetUserId } = payload ?? {};
      const currentTyping = store.getState().messages.typingUserId;
      if (targetUserId === myUserId && currentTyping === userId) {
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
  }, [dispatch, organizationId, myUserId]);

  // ── Emit typing when user types (direct thread only) ─────────────────────
  const inDirectThread = (isOverviewRole && !!activeAgentId) || (!isOverviewRole && !!activeAgentId && !openMessage);
  const typingStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!organizationId || !myUserId || !activeAgentId || !inDirectThread) return;
    const socket = getSocket();
    const emitStop = () => {
      socket.emit("typing:stop", { organizationId, userId: myUserId, targetUserId: activeAgentId });
    };
    if (inputText.trim()) {
      socket.emit("typing", { organizationId, userId: myUserId, targetUserId: activeAgentId });
      if (typingStopRef.current) clearTimeout(typingStopRef.current);
      typingStopRef.current = setTimeout(emitStop, 2000);
    } else {
      emitStop();
    }
    return () => {
      if (typingStopRef.current) clearTimeout(typingStopRef.current);
    };
  }, [organizationId, myUserId, activeAgentId, inDirectThread, inputText]);

  // Clear typing indicator when switching away from thread
  useEffect(() => {
    if (activeAgentId && typingUserId && typingUserId !== activeAgentId) {
      dispatch(setTypingUser(null));
    }
  }, [activeAgentId, typingUserId, dispatch]);

  // ── Scroll to bottom on new messages ─────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeAgentId, threads, openMessage]);

  useEffect(() => {
    adjustComposeHeight();
  }, [inputText]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSelectAgent = (agentId: string) => {
    dispatch(setActiveThread(agentId));
    dispatch(getThread({ organizationId, agentId }));
    setInputText("");
  };

  const handleSelectInboxMessage = (msgId: string) => {
    dispatch(markRead(msgId));
    dispatch(getMessageById({ organizationId, messageId: msgId }));
    setInputText("");
  };

  const handleSendBroadcast = async () => {
    const title = broadcastTitle.trim();
    const body = broadcastBody.trim();
    if (!title || !body) return;
    let target: BroadcastTarget;
    switch (broadcastTarget) {
      case "all_agents":
        target = { type: "all_agents" };
        break;
      case "all_states":
        target = { type: "all_states" };
        break;
      case "all_lgas_in_state":
        if (!broadcastStateId) return;
        target = { type: "all_lgas_in_state", stateId: broadcastStateId };
        break;
      case "all_wards_in_lga":
        if (!broadcastLgaId) return;
        target = { type: "all_wards_in_lga", lgaId: broadcastLgaId };
        break;
      case "all_pus_in_ward":
        if (!broadcastWardId) return;
        target = { type: "all_pus_in_ward", wardId: broadcastWardId };
        break;
      case "by_state":
        if (!broadcastStateId) return;
        target = { type: "by_state", stateId: broadcastStateId };
        break;
      case "by_lga":
        if (!broadcastLgaId) return;
        target = { type: "by_lga", lgaId: broadcastLgaId };
        break;
      case "by_ward":
        if (!broadcastWardId) return;
        target = { type: "by_ward", wardId: broadcastWardId };
        break;
      case "by_polling_unit":
        if (!broadcastPuId) return;
        target = { type: "by_polling_unit", pollingUnitId: broadcastPuId };
        break;
      case "by_role":
        if (!broadcastRole) return;
        target = { type: "by_role", role: broadcastRole };
        break;
      default:
        return;
    }
    dispatch(clearBroadcastError());
    await dispatch(createBroadcastMessage({ organizationId, title, body, target }));
    setBroadcastTitle("");
    setBroadcastBody("");
    setShowBroadcastForm(false);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    if (activeAgentId && activeAgentId === myUserId) return; // never send to self
    setInputText("");

    if ((isOverviewRole || !openMessage) && activeAgentId) {
      const optMsg = {
        _id: `opt-${Date.now()}`,
        from: authUser ?? undefined,
        title: "Direct Message",
        body: text,
        createdAt: new Date().toISOString(),
        targetType: "direct" as const,
        targetId: activeAgentId,
      } as IMessage;
      dispatch(appendToThread({ agentId: activeAgentId, message: optMsg }));
      await dispatch(sendDirectMessage({ organizationId, targetUserId: activeAgentId, body: text }));
    } else if (!isOverviewRole && openMessage) {
      await dispatch(replyToMessage({ organizationId, messageId: openMessage._id, body: text }));
    }
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const activeThread = activeAgentId ? (threads[activeAgentId] ?? []) : [];
  const activeConv   = conversations.find((c) => c.agentId === activeAgentId);
  const openConvPeer = activeConv?.agentInfo;

  // Known users map for resolving sender display (avoids "Unknown" when from is unpopulated)
  const knownUsersMap = useMemo(() => {
    const m = new Map<string, IMessageUser>();
    const add = (u: IMessageUser | undefined) => {
      if (u && toId(u)) m.set(toId(u), u as IMessageUser);
    };
    [orgUsers, overviewAgentList, adminList, (regularAdminsRaw ?? [])].flat().forEach(add);
    conversations.forEach((c) => add(c.agentInfo as IMessageUser));
    if (authUser) add(authUser as IMessageUser);
    return m;
  }, [orgUsers, overviewAgentList, adminList, regularAdminsRaw, conversations, authUser]);

  // Peer for header — same method as Results modal: find from list or use openMessage.from
  const headerPeer = useMemo<IMessageUser | null>(() => {
    if (openMessage) {
      return (resolveSender(openMessage.from, knownUsersMap) ?? (openMessage.from as IMessageUser) ?? null) as IMessageUser | null;
    }
    if (activeAgentId) {
      let peer: IMessageUser | null = null;
      if (isOverviewRole) {
        if (openConvPeer && toId(openConvPeer) === activeAgentId) {
          // openConvPeer may be { _id } only when overview sent first — enrich from knownUsersMap
          peer = (resolveSender(openConvPeer, knownUsersMap) ?? openConvPeer) as IMessageUser;
        }
        if (!peer) peer = overviewAgentList.find((a) => toId(a) === activeAgentId) ?? null;
        if (!peer) peer = (knownUsersMap.get(activeAgentId) ?? null) as IMessageUser | null;
      } else {
        peer = adminList.find((a) => toId(a) === activeAgentId) ?? null;
        if (!peer) peer = (knownUsersMap.get(activeAgentId) ?? null) as IMessageUser | null;
      }
      // Fallback: get peer from thread messages (from populated by API)
      if (!peer || userName(peer) === "Unknown") {
        const thread = threads[activeAgentId] ?? [];
        const otherMsg = thread.find((m) => toId(m.from) !== myUserId);
        if (otherMsg?.from) {
          const resolved = resolveSender(otherMsg.from, knownUsersMap);
          if (resolved && userName(resolved) !== "Unknown") peer = resolved;
        }
      }
      return peer;
    }
    return null;
  }, [openMessage, activeAgentId, isOverviewRole, openConvPeer, overviewAgentList, adminList, knownUsersMap, threads, myUserId]);

  const showChatArea = isOverviewRole
    ? !!activeAgentId
    : !!(openMessage || activeAgentId);

  const searchLower = search.toLowerCase();

  const filteredAgentList = useMemo(() => overviewAgentList.filter((u) => {
    if (!searchLower) return true;
    return userName(u).toLowerCase().includes(searchLower)
      || ((u as { role?: string }).role ?? "").toLowerCase().includes(searchLower);
  }), [overviewAgentList, searchLower]);

  const filteredAdminList = useMemo(() => adminList.filter((u) => {
    if (!searchLower) return true;
    return userName(u).toLowerCase().includes(searchLower);
  }), [adminList, searchLower]);

  const filteredInbox = inbox
    .filter((m) => {
      const senderId = m.from ? toId(m.from) : "";
      return senderId !== myUserId; // never show self in sidebar
    })
    .filter((m) => {
    if (!searchLower) return true;
    const sender = userName(resolveSender(m.from, knownUsersMap)).toLowerCase();
    const body   = m.body.toLowerCase();
    const title  = m.title.toLowerCase();
    return sender.includes(searchLower) || body.includes(searchLower) || title.includes(searchLower);
  });

  // Unread count per conversation by agentId
  const convUnreadMap = useMemo(() => {
    const map: Record<string, number> = {};
    conversations.forEach((c) => { map[c.agentId] = c.unreadCount ?? 0; });
    return map;
  }, [conversations]);

  // Latest message per agentId from conversations (for preview in agent list)
  const convLatestMap = useMemo(() => {
    const map: Record<string, IConversation["latestMessage"]> = {};
    conversations.forEach((c) => { map[c.agentId] = c.latestMessage; });
    return map;
  }, [conversations]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="msg-page">
      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <aside className="msg-sidebar">
        <div className="msg-sidebar__header">
          <div className="msg-sidebar__title-row">
            <div className="msg-sidebar__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h1 className="msg-sidebar__title">
              {isOverviewRole ? "Agents" : "Admins"}
            </h1>
            {(isOverviewRole ? totalUnread : unreadCount) > 0 && (
              <span className="msg-sidebar__badge">
                {(isOverviewRole ? totalUnread : unreadCount) > 99 ? "99+" : (isOverviewRole ? totalUnread : unreadCount)}
              </span>
            )}
          </div>

          {/* Broadcast message (overview roles) */}
          {isOverviewRole && (
            <div className="msg-broadcast">
              <button
                type="button"
                className="msg-broadcast__toggle"
                onClick={() => {
                  setShowBroadcastForm((v) => !v);
                  if (!showBroadcastForm) dispatch(clearBroadcastError());
                }}
              >
                <FiSend size={16} />
                <span>Broadcast message</span>
                <svg className={`msg-broadcast__chevron${showBroadcastForm ? " msg-broadcast__chevron--open" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {showBroadcastForm && (
                <div className="msg-broadcast__form">
                  <label className="msg-broadcast__label">Target</label>
                  <select
                    className="msg-broadcast__select"
                    value={broadcastTarget}
                    onChange={(e) => {
                      const v = e.target.value as BroadcastTargetType;
                      setBroadcastTarget(v);
                      setBroadcastStateId("");
                      setBroadcastLgaId("");
                      setBroadcastWardId("");
                      setBroadcastPuId("");
                      setBroadcastRole("");
                    }}
                  >
                    <option value="all_agents">All agents</option>
                    <option value="all_states">All States</option>
                    <option value="all_lgas_in_state">All LGAs in State</option>
                    <option value="all_wards_in_lga">All Wards in LGA</option>
                    <option value="all_pus_in_ward">All Polling Units in Ward</option>
                    <option value="by_state">By State</option>
                    <option value="by_lga">By LGA</option>
                    <option value="by_ward">By Ward</option>
                    <option value="by_polling_unit">By Polling Unit</option>
                    <option value="by_role">By Role</option>
                  </select>

                  {broadcastTarget === "all_lgas_in_state" && (
                    <select
                      className="msg-broadcast__select"
                      value={broadcastStateId}
                      onChange={(e) => setBroadcastStateId(e.target.value)}
                    >
                      <option value="">Select State</option>
                      {(orgStates ?? []).map((s) => {
                        const id = String(s._id ?? s.id ?? "");
                        const name = (s as { name?: string }).name ?? id;
                        return <option key={id} value={id}>{name}</option>;
                      })}
                    </select>
                  )}

                  {broadcastTarget === "all_wards_in_lga" && (
                    <>
                      <select
                        className="msg-broadcast__select"
                        value={broadcastStateId}
                        onChange={(e) => {
                          setBroadcastStateId(e.target.value);
                          setBroadcastLgaId("");
                        }}
                      >
                        <option value="">Select State</option>
                        {(orgStates ?? []).map((s) => {
                          const id = String(s._id ?? s.id ?? "");
                          const name = (s as { name?: string }).name ?? id;
                          return <option key={id} value={id}>{name}</option>;
                        })}
                      </select>
                      <select
                        className="msg-broadcast__select"
                        value={broadcastLgaId}
                        onChange={(e) => setBroadcastLgaId(e.target.value)}
                      >
                        <option value="">Select LGA</option>
                        {(broadcastLgaList ?? []).map((lga) => {
                          const id = String(lga._id ?? lga.id ?? "");
                          const name = lga.lga_name ?? lga.name ?? id;
                          return <option key={id} value={id}>{name}</option>;
                        })}
                      </select>
                    </>
                  )}

                  {broadcastTarget === "all_pus_in_ward" && (
                    <>
                      <select
                        className="msg-broadcast__select"
                        value={broadcastStateId}
                        onChange={(e) => {
                          setBroadcastStateId(e.target.value);
                          setBroadcastLgaId("");
                          setBroadcastWardId("");
                        }}
                      >
                        <option value="">Select State</option>
                        {(orgStates ?? []).map((s) => {
                          const id = String(s._id ?? s.id ?? "");
                          const name = (s as { name?: string }).name ?? id;
                          return <option key={id} value={id}>{name}</option>;
                        })}
                      </select>
                      <select
                        className="msg-broadcast__select"
                        value={broadcastLgaId}
                        onChange={(e) => {
                          setBroadcastLgaId(e.target.value);
                          setBroadcastWardId("");
                        }}
                      >
                        <option value="">Select LGA</option>
                        {(broadcastLgaList ?? []).map((lga) => {
                          const id = String(lga._id ?? lga.id ?? "");
                          const name = lga.lga_name ?? lga.name ?? id;
                          return <option key={id} value={id}>{name}</option>;
                        })}
                      </select>
                      <select
                        className="msg-broadcast__select"
                        value={broadcastWardId}
                        onChange={(e) => setBroadcastWardId(e.target.value)}
                      >
                        <option value="">Select Ward</option>
                        {(broadcastWardList ?? []).map((ward) => {
                          const id = String(ward._id ?? ward.id ?? "");
                          const name = ward.ward_name ?? ward.name ?? id;
                          return <option key={id} value={id}>{name}</option>;
                        })}
                      </select>
                    </>
                  )}

                  {broadcastTarget === "by_state" && (
                    <select
                      className="msg-broadcast__select"
                      value={broadcastStateId}
                      onChange={(e) => setBroadcastStateId(e.target.value)}
                    >
                      <option value="">Select State</option>
                      {(orgStates ?? []).map((s) => {
                        const id = String(s._id ?? s.id ?? "");
                        const name = (s as { name?: string }).name ?? id;
                        return <option key={id} value={id}>{name}</option>;
                      })}
                    </select>
                  )}

                  {broadcastTarget === "by_lga" && (
                    <>
                      <select
                        className="msg-broadcast__select"
                        value={broadcastStateId}
                        onChange={(e) => {
                          setBroadcastStateId(e.target.value);
                          setBroadcastLgaId("");
                        }}
                      >
                        <option value="">Select State</option>
                        {(orgStates ?? []).map((s) => {
                          const id = String(s._id ?? s.id ?? "");
                          const name = (s as { name?: string }).name ?? id;
                          return <option key={id} value={id}>{name}</option>;
                        })}
                      </select>
                      <select
                        className="msg-broadcast__select"
                        value={broadcastLgaId}
                        onChange={(e) => setBroadcastLgaId(e.target.value)}
                      >
                        <option value="">Select LGA</option>
                        {(broadcastLgaList ?? []).map((lga) => {
                          const id = String(lga._id ?? lga.id ?? "");
                          const name = lga.lga_name ?? lga.name ?? id;
                          return <option key={id} value={id}>{name}</option>;
                        })}
                      </select>
                    </>
                  )}

                  {broadcastTarget === "by_ward" && (
                    <>
                      <select
                        className="msg-broadcast__select"
                        value={broadcastStateId}
                        onChange={(e) => {
                          setBroadcastStateId(e.target.value);
                          setBroadcastLgaId("");
                          setBroadcastWardId("");
                        }}
                      >
                        <option value="">Select State</option>
                        {(orgStates ?? []).map((s) => {
                          const id = String(s._id ?? s.id ?? "");
                          const name = (s as { name?: string }).name ?? id;
                          return <option key={id} value={id}>{name}</option>;
                        })}
                      </select>
                      <select
                        className="msg-broadcast__select"
                        value={broadcastLgaId}
                        onChange={(e) => {
                          setBroadcastLgaId(e.target.value);
                          setBroadcastWardId("");
                        }}
                      >
                        <option value="">Select LGA</option>
                        {(broadcastLgaList ?? []).map((lga) => {
                          const id = String(lga._id ?? lga.id ?? "");
                          const name = lga.lga_name ?? lga.name ?? id;
                          return <option key={id} value={id}>{name}</option>;
                        })}
                      </select>
                      <select
                        className="msg-broadcast__select"
                        value={broadcastWardId}
                        onChange={(e) => setBroadcastWardId(e.target.value)}
                      >
                        <option value="">Select Ward</option>
                        {(broadcastWardList ?? []).map((ward) => {
                          const id = String(ward._id ?? ward.id ?? "");
                          const name = ward.ward_name ?? ward.name ?? id;
                          return <option key={id} value={id}>{name}</option>;
                        })}
                      </select>
                    </>
                  )}

                  {broadcastTarget === "by_polling_unit" && (
                    <>
                      <select
                        className="msg-broadcast__select"
                        value={broadcastStateId}
                        onChange={(e) => {
                          setBroadcastStateId(e.target.value);
                          setBroadcastLgaId("");
                          setBroadcastWardId("");
                          setBroadcastPuId("");
                        }}
                      >
                        <option value="">Select State</option>
                        {(orgStates ?? []).map((s) => {
                          const id = String(s._id ?? s.id ?? "");
                          const name = (s as { name?: string }).name ?? id;
                          return <option key={id} value={id}>{name}</option>;
                        })}
                      </select>
                      <select
                        className="msg-broadcast__select"
                        value={broadcastLgaId}
                        onChange={(e) => {
                          setBroadcastLgaId(e.target.value);
                          setBroadcastWardId("");
                          setBroadcastPuId("");
                        }}
                      >
                        <option value="">Select LGA</option>
                        {(broadcastLgaList ?? []).map((lga) => {
                          const id = String(lga._id ?? lga.id ?? "");
                          const name = lga.lga_name ?? lga.name ?? id;
                          return <option key={id} value={id}>{name}</option>;
                        })}
                      </select>
                      <select
                        className="msg-broadcast__select"
                        value={broadcastWardId}
                        onChange={(e) => {
                          setBroadcastWardId(e.target.value);
                          setBroadcastPuId("");
                        }}
                      >
                        <option value="">Select Ward</option>
                        {(broadcastWardList ?? []).map((ward) => {
                          const id = String(ward._id ?? ward.id ?? "");
                          const name = ward.ward_name ?? ward.name ?? id;
                          return <option key={id} value={id}>{name}</option>;
                        })}
                      </select>
                      <select
                        className="msg-broadcast__select"
                        value={broadcastPuId}
                        onChange={(e) => setBroadcastPuId(e.target.value)}
                      >
                        <option value="">Select Polling Unit</option>
                        {(broadcastPuList ?? []).map((pu) => {
                          const id = String(pu._id ?? pu.id ?? "");
                          const name = pu.polling_unit_name ?? pu.name ?? id;
                          return <option key={id} value={id}>{name}</option>;
                        })}
                      </select>
                    </>
                  )}

                  {broadcastTarget === "by_role" && (
                    <select
                      className="msg-broadcast__select"
                      value={broadcastRole}
                      onChange={(e) => setBroadcastRole(e.target.value)}
                    >
                      <option value="">Select Role</option>
                      {AGENT_ROLES.map((r) => (
                        <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  )}

                  <label className="msg-broadcast__label">Title</label>
                  <input
                    className="msg-broadcast__input"
                    type="text"
                    placeholder="Message title"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                  />
                  <label className="msg-broadcast__label">Message</label>
                  <textarea
                    className="msg-broadcast__textarea"
                    placeholder="Message body"
                    value={broadcastBody}
                    onChange={(e) => setBroadcastBody(e.target.value)}
                    rows={3}
                  />
                  {broadcastError && (
                    <div className="msg-broadcast__error">{broadcastError}</div>
                  )}
                  <button
                    type="button"
                    className="msg-broadcast__submit"
                    onClick={handleSendBroadcast}
                    disabled={
                      broadcastLoading ||
                      !broadcastTitle.trim() ||
                      !broadcastBody.trim() ||
                      (broadcastTarget === "all_lgas_in_state" && !broadcastStateId) ||
                      (broadcastTarget === "all_wards_in_lga" && !broadcastLgaId) ||
                      (broadcastTarget === "all_pus_in_ward" && !broadcastWardId) ||
                      (broadcastTarget === "by_state" && !broadcastStateId) ||
                      (broadcastTarget === "by_lga" && !broadcastLgaId) ||
                      (broadcastTarget === "by_ward" && !broadcastWardId) ||
                      (broadcastTarget === "by_polling_unit" && !broadcastPuId) ||
                      (broadcastTarget === "by_role" && !broadcastRole)
                    }
                  >
                    {broadcastLoading ? "Sending…" : "Send broadcast"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Search */}
          <div className={`msg-sidebar__search-wrap${search.trim() ? " msg-sidebar__search-wrap--has-value" : ""}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15" className="msg-sidebar__search-icon">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="msg-sidebar__search"
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search.trim() && (
              <button
                type="button"
                className="msg-sidebar__search-clear"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                title="Clear search"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Overview: cascading location filters */}
          {isOverviewRole && (
            <div className="msg-sidebar__filters">
              {/* LGA select */}
              <select
                className="msg-filter-select"
                value={filterLgaId}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilterLgaId(val);
                  setFilterWardId("");
                  setFilterPuId("");
                  setFilterMode(val ? "lga" : "all");
                }}
              >
                <option value="">All LGAs</option>
                {(lgaList ?? []).map((lga) => {
                  const id = String(lga._id ?? lga.id ?? "");
                  const name = lga.lga_name ?? lga.name ?? id;
                  return <option key={id} value={id}>{name}</option>;
                })}
              </select>

              {/* Ward select — shown once an LGA is chosen */}
              {filterLgaId && (
                <select
                  className="msg-filter-select"
                  value={filterWardId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilterWardId(val);
                    setFilterPuId("");
                    setFilterMode(val ? "ward" : "lga");
                  }}
                >
                  <option value="">All Wards</option>
                  {(wardList ?? []).map((ward) => {
                    const id = String(ward._id ?? ward.id ?? "");
                    const name = ward.ward_name ?? ward.name ?? id;
                    return <option key={id} value={id}>{name}</option>;
                  })}
                </select>
              )}

              {/* Polling Unit select — shown once a ward is chosen */}
              {filterWardId && (
                <select
                  className="msg-filter-select"
                  value={filterPuId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilterPuId(val);
                    setFilterMode(val ? "polling_unit" : "ward");
                  }}
                >
                  <option value="">All Polling Units</option>
                  {(puList ?? []).map((pu) => {
                    const id = String(pu._id ?? pu.id ?? "");
                    const name = pu.polling_unit_name ?? pu.name ?? id;
                    return <option key={id} value={id}>{name}</option>;
                  })}
                </select>
              )}
            </div>
          )}
        </div>

        {/* ── List ── */}
        <div className="msg-sidebar__list">

          {/* OVERVIEW: Agent list */}
          {isOverviewRole && (
            <>
              {convsLoading && filteredAgentList.length === 0 && (
                <div className="msg-sidebar__empty"><span className="msg-spinner" /><span>Loading…</span></div>
              )}
              {!convsLoading && filteredAgentList.length === 0 && (
                <div className="msg-sidebar__empty">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" width="36" height="36">
                    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                  <p>No agents found</p>
                </div>
              )}
              {filteredAgentList.map((agent) => {
                const a       = agent as AgentUser;
                const agentId = toId(agent);
                const isActive = agentId === activeAgentId;
                const isOnline = onlineUserIds.includes(agentId) || agentId === myUserId;
                const unread   = convUnreadMap[agentId] ?? 0;
                const latest   = convLatestMap[agentId];
                const lgaN  = locName(a.lga);
                const wardN = locName(a.ward);
                const puN   = locName(a.pollingUnit);
                return (
                  <button
                    key={agentId}
                    type="button"
                    className={`msg-conv-item${isActive ? " msg-conv-item--active" : ""}${unread > 0 ? " msg-conv-item--unread" : ""}`}
                    onClick={() => handleSelectAgent(agentId)}
                  >
                    <div className="msg-conv-item__avatar-wrap">
                      <Avatar user={agent} size={42} />
                      <span className={`msg-conv-item__status msg-conv-item__status--${isOnline ? "online" : "offline"}`} title={isOnline ? "Live" : "Offline"} />
                    </div>
                    <div className="msg-conv-item__content">
                      <div className="msg-conv-item__top">
                        <span className="msg-conv-item__name">{userName(agent)}</span>
                        {latest?.createdAt && (
                          <span className="msg-conv-item__time">{formatTime(latest.createdAt)}</span>
                        )}
                      </div>
                      <div className="msg-conv-item__meta-row">
                        <span className="msg-conv-item__role">{roleBadge((agent as { role?: string }).role)}</span>
                        {lgaN  && <span className="msg-loc-chip msg-loc-chip--lga">{lgaN}</span>}
                        {wardN && <span className="msg-loc-chip msg-loc-chip--ward">{wardN}</span>}
                        {puN   && <span className="msg-loc-chip msg-loc-chip--pu">{puN}</span>}
                      </div>
                      {latest && (
                        <div className="msg-conv-item__bottom">
                          <span className="msg-conv-item__preview">
                            {String(latest.body ?? "").slice(0, 45)}{String(latest.body ?? "").length > 45 ? "…" : ""}
                          </span>
                          {unread > 0 && (
                            <span className="msg-conv-item__badge">{unread > 99 ? "99+" : unread}</span>
                          )}
                        </div>
                      )}
                      {!latest && unread > 0 && (
                        <div className="msg-conv-item__bottom">
                          <span className="msg-conv-item__badge">{unread > 99 ? "99+" : unread}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {/* AGENT: Admin list + inbox */}
          {!isOverviewRole && (
            <>
              {/* Regular admins to message */}
              {filteredAdminList.length > 0 && (
                <div className="msg-sidebar__section-label">Send a message to</div>
              )}
              {filteredAdminList.map((admin) => {
                const adminId  = toId(admin);
                const isActive = adminId === activeAgentId && !openMessage;
                const isOnline = onlineUserIds.includes(adminId) || adminId === myUserId;
                return (
                  <button
                    key={adminId}
                    type="button"
                    className={`msg-conv-item${isActive ? " msg-conv-item--active" : ""}`}
                    onClick={() => { dispatch(clearOpenMessage()); handleSelectAgent(adminId); }}
                  >
                    <div className="msg-conv-item__avatar-wrap">
                      <Avatar user={admin} size={42} />
                      <span className={`msg-conv-item__status msg-conv-item__status--${isOnline ? "online" : "offline"}`} title={isOnline ? "Live" : "Offline"} />
                    </div>
                    <div className="msg-conv-item__content">
                      <div className="msg-conv-item__top">
                        <span className="msg-conv-item__name">{userName(admin)}</span>
                      </div>
                      <div className="msg-conv-item__bottom">
                        <span className="msg-conv-item__role">{roleBadge((admin as { role?: string }).role)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Inbox: received messages */}
              {filteredInbox.length > 0 && (
                <div className="msg-sidebar__section-label">Inbox</div>
              )}
              {inboxLoading && inbox.length === 0 && (
                <div className="msg-sidebar__empty"><span className="msg-spinner" /><span>Loading…</span></div>
              )}
              {!inboxLoading && filteredInbox.length === 0 && adminList.length === 0 && (
                <div className="msg-sidebar__empty">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" width="36" height="36">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <p>No messages yet</p>
                </div>
              )}
              {filteredInbox.map((msg: IMessage) => {
                const isUnread = msg.isRead !== undefined ? !msg.isRead : true;
                const isActive = openMessage?._id === msg._id;
                const senderId = msg.from ? toId(msg.from) : "";
                const sender = resolveSender(msg.from, knownUsersMap);
                const isOnline = senderId && (onlineUserIds.includes(senderId) || senderId === myUserId);
                return (
                  <button
                    key={msg._id}
                    type="button"
                    className={`msg-conv-item${isActive ? " msg-conv-item--active" : ""}${isUnread ? " msg-conv-item--unread" : ""}`}
                    onClick={() => handleSelectInboxMessage(msg._id)}
                  >
                    <div className="msg-conv-item__avatar-wrap">
                      <Avatar user={sender} size={42} />
                      <span className={`msg-conv-item__status msg-conv-item__status--${isOnline ? "online" : "offline"}`} title={isOnline ? "Live" : "Offline"} />
                    </div>
                    <div className="msg-conv-item__content">
                      <div className="msg-conv-item__top">
                        <span className="msg-conv-item__name">{userName(sender)}</span>
                        <span className="msg-conv-item__time">{formatTime(msg.createdAt)}</span>
                      </div>
                      <div className="msg-conv-item__bottom">
                        <span className="msg-conv-item__preview">
                          {msg.body.slice(0, 55)}{msg.body.length > 55 ? "…" : ""}
                        </span>
                        {isUnread && <span className="msg-conv-item__dot" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </aside>

      {/* ── MAIN PANEL ─────────────────────────────────────────────────────── */}
      <main className="msg-main">
        {!showChatArea && (
          <div className="msg-main__empty">
            <div className="msg-main__empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="56" height="56">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="msg-main__empty-title">
              {isOverviewRole ? "Select an agent to message" : "Select an admin or message from the left"}
            </h2>
            <p className="msg-main__empty-sub">
              {isOverviewRole
                ? "Pick any agent from the list. Use the filters to narrow by LGA, Ward, or Polling Unit."
                : "Choose a Regular Admin on the left to start a conversation, or tap an inbox message to reply."}
            </p>
          </div>
        )}

        {showChatArea && (
          <div className="msg-chat">
            {/* Header */}
            <div className="msg-chat__header">
              {/* <button type="button" className="msg-chat__back" onClick={handleBack} aria-label="Back">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button> */}
              {headerPeer ? (
                <>
                  <Avatar user={headerPeer} size={40} />
                  <div className="msg-chat__header-info">
                    <span className="msg-chat__header-name">
                      {userName(headerPeer)}
                    </span>
                    <div className="msg-chat__header-meta">
                      {headerPeer.role && (
                        <span className="msg-chat__header-role">{roleBadge(headerPeer.role)}</span>
                      )}
                      {headerPeer.phoneNumber && (
                        <span className="msg-chat__header-phone">{headerPeer.phoneNumber}</span>
                      )}
                    </div>
                    {(() => {
                      const p = headerPeer as AgentUser;
                      const lgaN  = locName(p.lga);
                      const wardN = locName(p.ward);
                      const puN   = locName(p.pollingUnit);
                      if (!lgaN && !wardN && !puN) return null;
                      return (
                        <div className="msg-chat__header-locs">
                          {lgaN  && <span className="msg-loc-chip msg-loc-chip--lga">{lgaN}</span>}
                          {wardN && <span className="msg-loc-chip msg-loc-chip--ward">{wardN}</span>}
                          {puN   && <span className="msg-loc-chip msg-loc-chip--pu">{puN}</span>}
                        </div>
                      );
                    })()}
                  </div>
                </>
              ) : null}
            </div>

            {/* Messages body */}
            <div className="msg-chat__body">
              {(isOverviewRole ? threadLoading : openMsgLoading) && (
                <div className="msg-chat__loading">
                  <span className="msg-spinner" />
                  <span>Loading…</span>
                </div>
              )}

              {/* Overview: thread */}
              {isOverviewRole && !threadLoading && activeThread.length === 0 && activeAgentId && (
                <div className="msg-chat__empty">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" width="40" height="40">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <p>No messages yet. Send the first one!</p>
                </div>
              )}
              {isOverviewRole && !threadLoading && activeThread.map((msg: IMessage) => {
                const isMine = String((msg.from as { _id?: string })?._id ?? toId(msg.from) ?? "") === myUserId;
                const sender = resolveSender(msg.from, knownUsersMap);
                const readBy = (msg.readBy ?? []) as (string | { toString(): string })[];
                const isReadByRecipient = isMine && activeAgentId && readBy.some((id) => String(id) === activeAgentId);
                return (
                  <div key={msg._id} className={`msg-bubble-wrap${isMine ? " msg-bubble-wrap--mine" : ""}`}>
                    {!isMine ? <Avatar user={sender} size={30} /> : <Avatar user={authUser as IMessageUser} size={30} />}
                    <div className={`msg-bubble${isMine ? " msg-bubble--mine" : " msg-bubble--theirs"}`}>
                      <p className="msg-bubble__text">{msg.body}</p>
                      <div className="msg-bubble__meta">
                        <span className="msg-bubble__time">{formatTimeDetailed(msg.createdAt)}</span>
                        {isMine && <MessageStatusIcon read={!!isReadByRecipient} />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Agent: direct thread (when they initiated to an admin) */}
              {!isOverviewRole && activeAgentId && !openMessage && !openMsgLoading && (
                <>
                  {(threads[activeAgentId] ?? []).length === 0 && (
                    <div className="msg-chat__empty">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" width="40" height="40">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <p>No messages yet. Send the first one!</p>
                    </div>
                  )}
                  {(threads[activeAgentId] ?? []).map((msg: IMessage) => {
                    const isMine = String((msg.from as { _id?: string })?._id ?? toId(msg.from) ?? "") === myUserId;
                    const sender = resolveSender(msg.from, knownUsersMap);
                    return (
                      <div key={msg._id} className={`msg-bubble-wrap${isMine ? " msg-bubble-wrap--mine" : ""}`}>
                        {!isMine ? <Avatar user={sender} size={30} /> : <Avatar user={authUser as IMessageUser} size={30} />}
                        <div className={`msg-bubble${isMine ? " msg-bubble--mine" : " msg-bubble--theirs"}`}>
                          <p className="msg-bubble__text">{msg.body}</p>
                          <span className="msg-bubble__time">{formatTimeDetailed(msg.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Agent: inbox message + replies */}
              {!isOverviewRole && !openMsgLoading && openMessage && (
                <>
                  <div className="msg-bubble-wrap">
                    <Avatar user={resolveSender(openMessage.from, knownUsersMap)} size={30} />
                    <div className="msg-bubble msg-bubble--theirs">
                      <p className="msg-bubble__text">{openMessage.body}</p>
                      <span className="msg-bubble__time">{formatTimeDetailed(openMessage.createdAt)}</span>
                    </div>
                  </div>
                  {(openMessage.replies ?? []).map((r: IMessage, rIdx: number) => {
                    const isMine = String((r.from as { _id?: string })?._id ?? toId(r.from) ?? "") === myUserId;
                    const replySender = resolveSender(r.from, knownUsersMap);
                    const openMsgFromId = openMessage.from ? String((openMessage.from as { _id?: string })?._id ?? "") : "";
                    const readBy = (r.readBy ?? []) as (string | { toString(): string })[];
                    const isReadByRecipient = isMine && readBy.some((id) => String(id) === openMsgFromId);
                    return (
                      <div key={`reply-${r._id}-${rIdx}`} className={`msg-bubble-wrap${isMine ? " msg-bubble-wrap--mine" : ""}`}>
                        {!isMine ? <Avatar user={replySender} size={30} /> : <Avatar user={authUser as IMessageUser} size={30} />}
                        <div className={`msg-bubble${isMine ? " msg-bubble--mine" : " msg-bubble--theirs"}`}>
                          <p className="msg-bubble__text">{r.body}</p>
                          <div className="msg-bubble__meta">
                            <span className="msg-bubble__time">{formatTimeDetailed(r.createdAt)}</span>
                            {isMine && <MessageStatusIcon read={!!isReadByRecipient} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Typing indicator — show when other person is typing in this thread */}
            {typingUserId && typingUserId === activeAgentId && headerPeer && (
              <div className="msg-chat__typing">
                <span className="msg-chat__typing-dots">
                  <span /><span /><span />
                </span>
                <span>{userName(headerPeer)} is typing…</span>
              </div>
            )}

            {/* Compose bar — always active when a conversation is open */}
            <div className="msg-chat__compose">
              {replyError && <p className="msg-chat__error">{replyError}</p>}
              <div className="msg-chat__compose-inner">
                <Avatar user={authUser as IMessageUser} size={34} />
                <textarea
                  ref={inputRef}
                  className="msg-chat__input"
                  rows={1}
                  placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  className="msg-chat__send-btn"
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  aria-label="Send"
                >
                  <FiSend size={18} className="msg-chat__send-icon" color="currentColor" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


