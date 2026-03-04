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
  ] as { presence: unknown[]; count?: number } | undefined;

export const selectListPresenceLoading = (params: Record<string, unknown> = {}) => (
  state: RootState
) =>
  state.presence.loading[buildKey("presence/listPresence", params)] ?? false;

export const selectListPresenceError = (params: Record<string, unknown> = {}) => (
  state: RootState
) =>
  state.presence.error[buildKey("presence/listPresence", params)] ?? null;

export const selectPresenceReport = (params: {
  organizationId: string;
  electionId: string;
  query?: { stateId?: string; lgaId?: string; wardId?: string };
}) => (state: RootState) =>
  state.presence.cache[
    buildKey("presence/getPresenceReport", params)
  ] as {
    organizationId: string;
    electionId: string;
    summary: { total: number; present: number; notPresent: number; votingStarted: number; votingEnded: number };
    rows: Array<{
      pollingUnitId: string;
      pollingUnitName: string;
      pollingUnitCode: string;
      wardName: string;
      lgaName: string;
      poAgentName: string;
      poPhoneNumber: string;
      presence: string;
      presenceCheckedInAt?: string | null;
      accreditedCount: number | null;
      votingStarted: string;
      votingEnded: string;
      accreditationStarted: boolean;
      accreditationEnded: boolean;
      votingStartedAt?: string;
      votingEndedAt?: string;
      accreditationStartedAt?: string;
      accreditationEndedAt?: string;
    }>;
  } | undefined;

export const selectPresenceReportLoading = (params: {
  organizationId: string;
  electionId: string;
  query?: { stateId?: string; lgaId?: string; wardId?: string };
}) => (state: RootState) =>
  state.presence.loading[buildKey("presence/getPresenceReport", params)] ?? false;

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

export const selectListCollationPresence = (params: {
  electionId?: string;
  wardId?: string;
  lgaId?: string;
  stateId?: string;
}) => (state: RootState) =>
  state.presence.cache[
    buildKey("presence/listCollationPresence", params)
  ] as { presence: Array<{ user?: { _id?: string; id?: string } }>; count: number } | undefined;

export const selectListCollationPresenceLoading = (params: {
  electionId?: string;
  wardId?: string;
  lgaId?: string;
  stateId?: string;
}) => (state: RootState) =>
  state.presence.loading[buildKey("presence/listCollationPresence", params)] ?? false;

// Generic
export const selectByKey = (key: string) => (state: RootState) =>
  state.presence.cache[key];
export const selectLoadingByKey = (key: string) => (state: RootState) =>
  state.presence.loading[key] ?? false;
export const selectErrorByKey = (key: string) => (state: RootState) =>
  state.presence.error[key] ?? null;
