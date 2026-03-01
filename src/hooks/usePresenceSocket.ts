import { useEffect, useRef } from "react";
import { getSocket } from "../services/socket";

/**
 * Subscribes to real-time presence updates for an election.
 * When another user marks presence, onUpdate is called so the page can refetch.
 */
export function usePresenceSocket(
  electionId: string | undefined,
  onUpdate: () => void
): void {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!electionId) return;

    const s = getSocket();
    if (!s.connected) s.connect();

    const joinRoom = () => s.emit("join:election", electionId);
    const handler = () => onUpdateRef.current();

    if (s.connected) {
      joinRoom();
    } else {
      s.once("connect", joinRoom);
    }
    s.on("presence:updated", handler);
    s.io.on("reconnect", joinRoom);

    return () => {
      s.off("presence:updated", handler);
      s.io.off("reconnect", joinRoom);
      s.off("connect", joinRoom);
    };
  }, [electionId]);
}
