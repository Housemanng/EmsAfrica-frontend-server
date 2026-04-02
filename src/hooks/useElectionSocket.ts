import { useEffect, useRef } from "react";
import { getSocket } from "../services/socket";

/**
 * Subscribes to organization-wide election updates.
 * Backend emits: "election:updated" to room `org:<organizationId>`.
 */
export function useElectionSocket(
  organizationId: string | null | undefined,
  userId: string | null | undefined,
  onUpdate: () => void
): void {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!organizationId) return;

    const s = getSocket();
    if (!s.connected) s.connect();

    let timer: ReturnType<typeof setTimeout> | null = null;

    const join = () => {
      if (userId) s.emit("join:org", { organizationId, userId });
      else s.emit("join:org", organizationId);
    };

    const handler = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        onUpdateRef.current();
        timer = null;
      }, 500);
    };

    if (s.connected) join();
    else s.once("connect", join);

    s.on("election:updated", handler);
    s.io.on("reconnect", join);

    return () => {
      try {
        s.off("election:updated", handler);
        s.io?.off("reconnect", join);
        if (timer) clearTimeout(timer);
      } catch {
        /* ignore */
      }
    };
  }, [organizationId, userId]);
}

