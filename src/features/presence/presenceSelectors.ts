import type { RootState } from "../../app/store";

const buildKey = (prefix: string, arg?: unknown) =>
  arg !== undefined ? `${prefix}::${JSON.stringify(arg)}` : prefix;

export const selectPresenceCache = (state: RootState) => state.presence.cache;
export const selectPresenceLoading = (state: RootState) => state.presence.loading;
export const selectPresenceError = (state: RootState) => state.presence.error;

export const selectCached = (key: string) => (state: RootState) =>
  state.presence.cache[key] ?? null;
export const selectLoading = (key: string) => (state: RootState) =>
  state.presence.loading[key] ?? false;
export const selectError = (key: string) => (state: RootState) =>
  state.presence.error[key] ?? null;

// Convenience selectors (params must match what you passed to listPresence; use {} when called with no args)
export const selectListPresence = (params: Record<string, unknown> = {}) => (
  state: RootState
) =>
  state.presence.cache[
    buildKey("presence/listPresence", params)
  ] as { presence: unknown[]; cutoff: string } | undefined;

export const selectListPresenceLoading = (params: Record<string, unknown> = {}) => (
  state: RootState
) =>
  state.presence.loading[buildKey("presence/listPresence", params)] ?? false;

export const selectListPresenceError = (params: Record<string, unknown> = {}) => (
  state: RootState
) =>
  state.presence.error[buildKey("presence/listPresence", params)] ?? null;

export const selectCheckInResult = (
  pollingUnitId: string,
  electionId: string
) => (state: RootState) =>
  state.presence.cache[
    buildKey("presence/checkIn", {
      pollingUnitId,
      electionId,
    })
  ] as { success: boolean; presence: unknown; locationVerified?: boolean } | undefined;

export const selectCheckInLoading = (
  pollingUnitId: string,
  electionId: string
) => (state: RootState) =>
  state.presence.loading[
    buildKey("presence/checkIn", { pollingUnitId, electionId })
  ] ?? false;

export const selectReportPresenceResult = (
  pollingUnitId: string,
  electionId: string
) => (state: RootState) =>
  state.presence.cache[
    buildKey("presence/reportMyPresence", {
      pollingUnitId,
      electionId,
    })
  ] as unknown | undefined;

export const selectReportPresenceLoading = (
  pollingUnitId: string,
  electionId: string
) => (state: RootState) =>
  state.presence.loading[
    buildKey("presence/reportMyPresence", { pollingUnitId, electionId })
  ] ?? false;

// Generic
export const selectByKey = (key: string) => (state: RootState) =>
  state.presence.cache[key];
export const selectLoadingByKey = (key: string) => (state: RootState) =>
  state.presence.loading[key] ?? false;
export const selectErrorByKey = (key: string) => (state: RootState) =>
  state.presence.error[key] ?? null;
