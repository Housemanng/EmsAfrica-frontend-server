import { useEffect, useRef } from "react";
import { getSocket } from "../services/socket";

/**
 * Subscribes to real-time result updates for one or more elections.
 *
 * onUpdate  – called immediately with the specific electionId so the caller
 *             can refresh per-election data (totals, collation, coverage).
 * onBulkUpdate – called (debounced, 800 ms) after any result event so the
 *             caller can re-fetch organisation-wide / elections-list data that
 *             is too expensive to re-fetch on every single save.
 */
export function useResultSocket(
  electionIds: string[],
  onUpdate: (electionId: string) => void,
  onBulkUpdate?: () => void
): void {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const onBulkUpdateRef = useRef(onBulkUpdate);
  onBulkUpdateRef.current = onBulkUpdate;

  const key = electionIds.join(",");

  useEffect(() => {
    if (!key) return;

    const ids = key.split(",").filter(Boolean);
    const s = getSocket();
    if (!s.connected) s.connect();

    // Debounce timer for the bulk (org-wide) refetch
    let bulkTimer: ReturnType<typeof setTimeout> | null = null;

    const joinRooms = () => {
      ids.forEach((id) => s.emit("join:election", id));
    };

    const handler = (payload: unknown) => {
      const p = payload as { election?: string | { _id?: string; id?: string } };
      const rawId =
        typeof p?.election === "string"
          ? p.election
          : (p?.election?._id ?? p?.election?.id ?? "");

      // Per-election immediate update
      const matched = ids.find((id) => id === rawId);
      const target = matched ?? rawId;
      if (target) onUpdateRef.current(target);

      // Org-wide debounced update (coalesces rapid back-to-back saves)
      if (onBulkUpdateRef.current) {
        if (bulkTimer) clearTimeout(bulkTimer);
        bulkTimer = setTimeout(() => {
          onBulkUpdateRef.current?.();
          bulkTimer = null;
        }, 800);
      }
    };

    if (s.connected) {
      joinRooms();
    } else {
      s.once("connect", joinRooms);
    }

    s.on("result", handler);
    s.io.on("reconnect", joinRooms);

    return () => {
      try {
        s.off("result");
        s.io?.off("reconnect");
        if (bulkTimer) clearTimeout(bulkTimer);
      } catch (_) {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
