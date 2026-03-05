import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../app/store";
import { store } from "../app/store";
import {
  getMyMessages,
  getMessageById,
  getThread,
  replyToMessage,
  sendDirectMessage,
} from "../features/messages/messageApi";
import {
  selectInbox,
  selectInboxLoading,
  selectUnreadCount,
  selectOpenMessage,
  selectOpenMessageLoading,
  selectReplyError,
  selectThreads,
  selectThreadLoading,
  selectOnlineUserIds,
  selectTypingUserId,
  appendToThread,
  setOnlineUsers,
  setTypingUser,
  socketNewMessage,
  socketNewReply,
  clearOpenMessage,
} from "../features/messages";
import { getRegularAdminsByOrganizationId } from "../features/user/userApi";
import { selectRegularAdminsByOrganizationId } from "../features/user/userSelectors";
import { getSocket } from "../services/socket";
import { playMessageNotificationSound } from "../services/notificationSound";
import { FiSend } from "react-icons/fi";
import { MessageStatusIcon } from "./MessageStatusIcon";

type ResultsMessagesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
};

export function ResultsMessagesModal({
  isOpen,
  onClose,
  organizationId,
}: ResultsMessagesModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const currentUserId = String((user as { _id?: string })?._id ?? (user as { id?: string })?.id ?? "");

  const [replyText, setReplyText] = useState("");
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [showSidebarDrawer, setShowSidebarDrawer] = useState(false);
  const msgBottomRef = useRef<HTMLDivElement>(null);
  const composeInputRef = useRef<HTMLTextAreaElement>(null);

  const adjustComposeHeight = () => {
    const el = composeInputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxH = 140;
    el.style.overflowY = el.scrollHeight > maxH ? "auto" : "hidden";
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
  };

  const inbox = useSelector(selectInbox);
  const inboxLoading = useSelector(selectInboxLoading);
  const unreadCount = useSelector(selectUnreadCount);
  const readIds = useSelector((s: RootState) => s.messages.readIds);
  const openMessage = useSelector(selectOpenMessage);
  const openMsgLoading = useSelector(selectOpenMessageLoading);
  const replyError = useSelector(selectReplyError);
  const threads = useSelector(selectThreads);
  const threadLoading = useSelector(selectThreadLoading);
  const onlineUserIds = useSelector(selectOnlineUserIds);
  const typingUserId = useSelector(selectTypingUserId);

  const _selectRegularUsersMsg = useMemo(
    () => selectRegularAdminsByOrganizationId(organizationId || ""),
    [organizationId],
  );
  const regularUserListRaw = (useSelector(_selectRegularUsersMsg) ?? []) as {
    _id?: string;
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    photo?: string;
  }[];
  const regularUserList = useMemo(
    () => regularUserListRaw.filter((u) => String(u._id ?? u.id ?? "") !== String(currentUserId)),
    [regularUserListRaw, currentUserId],
  );

  const inboxFromOthers = useMemo(
    () =>
      inbox.filter((m) => {
        const sid = m.from ? String((m.from as { _id?: string })?._id ?? (m.from as { id?: string })?.id ?? "") : "";
        return sid !== currentUserId;
      }),
    [inbox, currentUserId],
  );

  const inboxConversations = useMemo(() => {
    const directOnly = inboxFromOthers.filter(
      (m) => (m as { targetType?: string }).targetType === "direct",
    );
    const bySender = new Map<string, { sender: unknown; messages: typeof inboxFromOthers }>();
    for (const m of directOnly) {
      const sid = m.from ? String((m.from as { _id?: string })?._id ?? (m.from as { id?: string })?.id ?? "") : "";
      if (!sid) continue;
      if (!bySender.has(sid)) bySender.set(sid, { sender: m.from, messages: [] });
      bySender.get(sid)!.messages.push(m);
    }
    return Array.from(bySender.entries())
      .map(([senderId, { sender, messages }]) => {
        const sorted = [...messages].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        const latest = sorted[0];
        const hasUnread = sorted.some((msg) =>
          msg.isRead !== undefined ? !msg.isRead : !readIds.includes(msg._id),
        );
        return { senderId, sender, latestMessage: latest, hasUnread };
      })
      .sort(
        (a, b) =>
          new Date(b.latestMessage.createdAt).getTime() -
          new Date(a.latestMessage.createdAt).getTime(),
      );
  }, [inboxFromOthers, readIds]);

  useEffect(() => {
    if (isOpen && organizationId) {
      dispatch(getMyMessages(organizationId));
      dispatch(getRegularAdminsByOrganizationId(organizationId));
    }
  }, [dispatch, isOpen, organizationId]);

  const handleClose = () => {
    dispatch(clearOpenMessage());
    setActiveUserId(null);
    setReplyText("");
    setShowSidebarDrawer(false);
    onClose();
  };

  const handleSelectUser = (userId: string) => {
    if (String(userId) === String(currentUserId)) return;
    setActiveUserId(userId);
    setShowSidebarDrawer(false);
    dispatch(clearOpenMessage());
    setReplyText("");
  };

  const handleSendReply = async () => {
    if (!organizationId || !replyText.trim()) return;
    if (activeUserId && String(activeUserId) === String(currentUserId)) return;
    const text = replyText.trim();
    setReplyText("");
    try {
      if (activeUserId && !openMessage) {
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
        await dispatch(
          sendDirectMessage({ organizationId, targetUserId: activeUserId, body: text }),
        ).unwrap();
      } else if (openMessage) {
        await dispatch(
          replyToMessage({ organizationId, messageId: openMessage._id, body: text }),
        ).unwrap();
        dispatch(getMessageById({ organizationId, messageId: openMessage._id }));
      }
    } catch {
      /* error handled by redux */
    }
    setTimeout(() => msgBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleMsgKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  useEffect(() => {
    adjustComposeHeight();
  }, [replyText]);

  useEffect(() => {
    if (!organizationId || !isOpen) return;
    const socket = getSocket();
    const uid = String(
      (user as { _id?: string; id?: string })?._id ??
        (user as { _id?: string; id?: string })?.id ??
        "",
    );
    socket.emit("join:org", { organizationId, userId: uid });

    socket.on("users:online", (payload: { userIds?: string[] }) => {
      dispatch(setOnlineUsers(payload.userIds ?? []));
    });
    const onNewMessage = (msg: Parameters<typeof socketNewMessage>[0]) => {
      dispatch(socketNewMessage(msg));
      const fromId = String((msg.from as { _id?: string })?._id ?? "");
      if (fromId && fromId !== uid) playMessageNotificationSound();
    };
    const onNewReply = (payload: Parameters<typeof socketNewReply>[0]) => {
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
      const { targetUserId, userId } = payload ?? {};
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
      } catch {
        /* ignore */
      }
    };
  }, [dispatch, organizationId, user, isOpen]);

  useEffect(() => {
    if (organizationId && activeUserId && !openMessage) {
      dispatch(getThread({ organizationId, agentId: activeUserId }));
    }
  }, [dispatch, organizationId, activeUserId, openMessage]);

  useEffect(() => {
    if (openMessage || (activeUserId && (threads[activeUserId] ?? []).length > 0)) {
      setTimeout(() => msgBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [openMessage, activeUserId, threads]);

  const typingStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!organizationId || !currentUserId || !activeUserId || openMessage) return;
    const socket = getSocket();
    const emitStop = () => {
      socket.emit("typing:stop", {
        organizationId,
        userId: currentUserId,
        targetUserId: activeUserId,
      });
    };
    if (replyText.trim()) {
      socket.emit("typing", {
        organizationId,
        userId: currentUserId,
        targetUserId: activeUserId,
      });
      if (typingStopRef.current) clearTimeout(typingStopRef.current);
      typingStopRef.current = setTimeout(emitStop, 2000);
    } else {
      emitStop();
    }
    return () => {
      if (typingStopRef.current) clearTimeout(typingStopRef.current);
    };
  }, [organizationId, currentUserId, activeUserId, openMessage, replyText]);

  if (!isOpen) return null;

  return (
    <div
      className="results-messages-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="messages-modal-title"
      onClick={handleClose}
    >
      <div
        className="results-messages-modal results-messages-modal--chat"
        onClick={(e) => e.stopPropagation()}
      >
        {showSidebarDrawer && (
          <div
            className="rmc-drawer-backdrop"
            onClick={() => setShowSidebarDrawer(false)}
            aria-hidden="true"
          />
        )}
        <div className={`rmc-sidebar${showSidebarDrawer ? " rmc-sidebar--drawer-open" : ""}`}>
          <div className="rmc-sidebar__header">
            <div className="rmc-sidebar__title-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <h2 id="messages-modal-title" className="rmc-sidebar__title">
                Messages
              </h2>
              {unreadCount > 0 && (
                <span className="rmc-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
              )}
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
            {regularUserList.length > 0 && <div className="rmc-section-label">Regular users</div>}
            {regularUserList.map((u, uIdx) => {
              const userId = String(u._id ?? u.id ?? "");
              const isActive = activeUserId === userId && !openMessage;
              const isOnline =
                onlineUserIds.includes(userId) || String(userId) === String(currentUserId);
              const initials =
                ((u.firstName?.[0] ?? "") + (u.lastName?.[0] ?? "")).toUpperCase() || "?";
              const name =
                [u.firstName, (u as { middleName?: string }).middleName, u.lastName]
                  .filter(Boolean)
                  .join(" ") || u.email || "User";
              return (
                <button
                  key={`user-${userId}-${uIdx}`}
                  type="button"
                  className={`rmc-item${isActive ? " rmc-item--active" : ""}`}
                  onClick={() => handleSelectUser(userId)}
                >
                  <div className="rmc-item__avatar-wrap">
                    {u.photo ? (
                      <img src={u.photo} alt={name} className="rmc-avatar" />
                    ) : (
                      <div className="rmc-avatar rmc-avatar--initials">{initials}</div>
                    )}
                    <span
                      className={`rmc-item__status rmc-item__status--${isOnline ? "online" : "offline"}`}
                      title={isOnline ? "Live" : "Offline"}
                    />
                  </div>
                  <div className="rmc-item__content">
                    <div className="rmc-item__top">
                      <span className="rmc-item__name">{name}</span>
                    </div>
                    <div className="rmc-item__bottom">
                      <span
                        className="rmc-item__preview"
                        style={{ fontStyle: "italic", color: "#6b7280" }}
                      >
                        Regular
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}

            {inboxConversations.length > 0 && <div className="rmc-section-label">Inbox</div>}
            {inboxConversations.map((conv) => {
              const senderId = conv.senderId;
              const isActive = activeUserId === senderId && !openMessage;
              const isOnline =
                onlineUserIds.includes(senderId) || senderId === currentUserId;
              const sender = conv.sender as {
                firstName?: string;
                lastName?: string;
                middleName?: string;
                email?: string;
                photo?: string;
              } | null;
              const name = sender
                ? [sender.firstName, sender.middleName, sender.lastName]
                    .filter(Boolean)
                    .join(" ") || sender.email || "Unknown"
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
                    {sender?.photo ? (
                      <img src={sender.photo} alt={name} className="rmc-avatar" />
                    ) : (
                      <div className="rmc-avatar rmc-avatar--initials">{initials}</div>
                    )}
                    <span
                      className={`rmc-item__status rmc-item__status--${isOnline ? "online" : "offline"}`}
                      title={isOnline ? "Live" : "Offline"}
                    />
                  </div>
                  <div className="rmc-item__content">
                    <div className="rmc-item__top">
                      <span className="rmc-item__name">{name}</span>
                      <span className="rmc-item__time">
                        {new Date(latest.createdAt).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="rmc-item__bottom">
                      <span className="rmc-item__preview">
                        {String(latest.body ?? "").slice(0, 45)}
                        {String(latest.body ?? "").length > 45 ? "…" : ""}
                      </span>
                      {conv.hasUnread && <span className="rmc-item__dot" />}
                    </div>
                  </div>
                </button>
              );
            })}
            {inboxLoading && inbox.length === 0 && regularUserList.length === 0 && (
              <div className="rmc-empty">
                <span className="rmc-spinner" />
                <span>Loading…</span>
              </div>
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

        <div className="rmc-chat">
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
              if (openMessage) {
                return (
                  <>
                    {openMessage.from?.photo ? (
                      <img src={openMessage.from.photo} alt="" className="rmc-avatar rmc-avatar--md" />
                    ) : (
                      <div className="rmc-avatar rmc-avatar--md rmc-avatar--initials">
                        {((openMessage.from?.firstName?.[0] ?? "") +
                          (openMessage.from?.lastName?.[0] ?? "")).toUpperCase() || "?"}
                      </div>
                    )}
                    <div className="rmc-chat__peer-info">
                      <span className="rmc-chat__peer-name">
                        {[openMessage.from?.firstName, (openMessage.from as { middleName?: string })?.middleName, openMessage.from?.lastName]
                          .filter(Boolean)
                          .join(" ") || openMessage.from?.email || "Unknown"}
                      </span>
                      {openMessage.from?.role && (
                        <span className="rmc-chat__peer-role">
                          {openMessage.from.role.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </>
                );
              }
              if (activeUserId) {
                const u = regularUserList.find((a) => String(a._id ?? a.id ?? "") === activeUserId);
                const inboxConv = inboxConversations.find((c) => c.senderId === activeUserId);
                const sender =
                  u ?? (inboxConv?.sender as { firstName?: string; lastName?: string; middleName?: string; email?: string; photo?: string } | undefined);
                const name = sender
                  ? [sender.firstName, (sender as { middleName?: string }).middleName, sender.lastName]
                      .filter(Boolean)
                      .join(" ") || (sender as { email?: string }).email || "User"
                  : "User";
                const initials = sender
                  ? ((sender.firstName?.[0] ?? "") + (sender.lastName?.[0] ?? "")).toUpperCase() || "?"
                  : "?";
                const roleLabel = u ? "Regular" : inboxConv ? "Inbox" : "";
                return (
                  <>
                    {sender?.photo ? (
                      <img src={sender.photo} alt={name} className="rmc-avatar rmc-avatar--md" />
                    ) : (
                      <div className="rmc-avatar rmc-avatar--md rmc-avatar--initials">{initials}</div>
                    )}
                    <div className="rmc-chat__peer-info">
                      <span className="rmc-chat__peer-name">{name}</span>
                      {roleLabel && <span className="rmc-chat__peer-role">{roleLabel}</span>}
                    </div>
                  </>
                );
              }
              return (
                <span className="rmc-chat__placeholder-title">Select a user or a message</span>
              );
            })()}
            <button
              type="button"
              className="rmc-chat__close"
              onClick={handleClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="rmc-chat__body">
            {!openMessage && !activeUserId && !openMsgLoading && (
              <div className="rmc-chat__empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" width="48" height="48">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p className="rmc-chat__empty-text-desktop">
                  Select a user or inbox conversation to view messages
                </p>
                <p className="rmc-chat__empty-text-mobile">Tap the menu icon above to open the user list</p>
              </div>
            )}
            {openMsgLoading && (
              <div className="rmc-chat__loading">
                <span className="rmc-spinner" />
                <span>Loading…</span>
              </div>
            )}

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
                      const isReadByRecipient =
                        isMine && activeUserId && readBy.some((id) => String(id) === activeUserId);
                      return (
                        <div
                          key={`dm-${msg._id}-${mIdx}`}
                          className={`rmc-bubble-wrap${isMine ? " rmc-bubble-wrap--mine" : ""}`}
                        >
                          {!isMine &&
                            (msg.from?.photo ? (
                              <img src={msg.from.photo} alt="" className="rmc-avatar rmc-avatar--sm" />
                            ) : (
                              <div className="rmc-avatar rmc-avatar--sm rmc-avatar--initials">
                                {peerInitials}
                              </div>
                            ))}
                          <div className={`rmc-bubble${isMine ? " rmc-bubble--mine" : " rmc-bubble--theirs"}`}>
                            <p className="rmc-bubble__text">{msg.body}</p>
                            <div className="rmc-bubble__meta">
                              <span className="rmc-bubble__time">
                                {new Date(msg.createdAt).toLocaleString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
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
                <div className="rmc-bubble-wrap">
                  {openMessage.from?.photo ? (
                    <img src={openMessage.from.photo} alt="" className="rmc-avatar rmc-avatar--sm" />
                  ) : (
                    <div className="rmc-avatar rmc-avatar--sm rmc-avatar--initials">
                      {((openMessage.from?.firstName?.[0] ?? "") + (openMessage.from?.lastName?.[0] ?? "")).toUpperCase() ||
                        "?"}
                    </div>
                  )}
                  <div className="rmc-bubble rmc-bubble--theirs">
                    <p className="rmc-bubble__text">{openMessage.body}</p>
                    <span className="rmc-bubble__time">
                      {new Date(openMessage.createdAt).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {(openMessage.replies ?? []).map((r, rIdx) => {
                  const myId = String((user as { _id?: string })?._id ?? "");
                  const fromId = String((r.from as { _id?: string })?._id ?? "");
                  const isMine = fromId === myId;
                  const openMsgFromId = openMessage.from
                    ? String((openMessage.from as { _id?: string })?._id ?? "")
                    : "";
                  const readBy = ((r as { readBy?: unknown[] }).readBy ?? []) as (string | { toString(): string })[];
                  const isReadByRecipient = isMine && readBy.some((id) => String(id) === openMsgFromId);
                  return (
                    <div
                      key={`reply-${r._id}-${rIdx}`}
                      className={`rmc-bubble-wrap${isMine ? " rmc-bubble-wrap--mine" : ""}`}
                    >
                      {!isMine &&
                        (r.from?.photo ? (
                          <img src={r.from.photo} alt="" className="rmc-avatar rmc-avatar--sm" />
                        ) : (
                          <div className="rmc-avatar rmc-avatar--sm rmc-avatar--initials">
                            {((r.from?.firstName?.[0] ?? "") + (r.from?.lastName?.[0] ?? "")).toUpperCase() || "?"}
                          </div>
                        ))}
                      <div className={`rmc-bubble${isMine ? " rmc-bubble--mine" : " rmc-bubble--theirs"}`}>
                        <p className="rmc-bubble__text">{r.body}</p>
                        <div className="rmc-bubble__meta">
                          <span className="rmc-bubble__time">
                            {new Date(r.createdAt).toLocaleString("en-GB", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
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

          {typingUserId &&
            typingUserId === activeUserId &&
            !openMessage &&
            (() => {
              const u = regularUserList.find((a) => String(a._id ?? a.id ?? "") === typingUserId);
              const conv = inboxConversations.find((c) => c.senderId === typingUserId);
              const sender =
                u ??
                (conv?.sender as {
                  firstName?: string;
                  lastName?: string;
                  middleName?: string;
                  email?: string;
                } | undefined);
              const name = sender
                ? [sender.firstName, (sender as { middleName?: string }).middleName, sender.lastName]
                    .filter(Boolean)
                    .join(" ") || sender.email || "Someone"
                : "Someone";
              return (
                <div className="rmc-chat__typing">
                  <span className="rmc-chat__typing-dots">
                    <span />
                    <span />
                    <span />
                  </span>
                  <span>{name} is typing…</span>
                </div>
              );
            })()}

          <div className="rmc-chat__compose">
            {replyError && <p className="rmc-chat__error">{replyError}</p>}
            <div
              className={`rmc-chat__compose-inner${!openMessage && !activeUserId ? " rmc-chat__compose-inner--disabled" : ""}`}
            >
              <textarea
                ref={composeInputRef}
                className="rmc-chat__input"
                rows={1}
                placeholder={
                  openMessage || activeUserId
                    ? "Type a message… (Enter to send)"
                    : "Select a user or message first"
                }
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
  );
}
