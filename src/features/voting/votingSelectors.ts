import type { RootState } from "../../app/store";

const buildKey = (prefix: string, arg?: unknown) =>
  arg !== undefined ? `${prefix}::${JSON.stringify(arg)}` : prefix;

export const selectVotingCache = (state: RootState) => state.voting.cache;
export const selectVotingLoading = (state: RootState) => state.voting.loading;
export const selectVotingError = (state: RootState) => state.voting.error;

export const selectCached = (key: string) => (state: RootState) => state.voting.cache[key] ?? null;
export const selectLoading = (key: string) => (state: RootState) => state.voting.loading[key] ?? false;
export const selectError = (key: string) => (state: RootState) => state.voting.error[key] ?? null;

// Convenience selectors
export const selectVotingReport = (
  organizationId: string,
  electionId: string,
  query?: { stateId?: string; lgaId?: string; wardId?: string; pollingUnitId?: string }
) => (state: RootState) => {
  const arg = query ? { organizationId, electionId, query } : { organizationId, electionId };
  return state.voting.cache[buildKey("voting/getVotingReport", arg)] as
    | { organizationId: string; electionId: string; summary: any; voting: any[] }
    | undefined;
};
export const selectVotingReportLoading = (
  organizationId: string,
  electionId: string,
  query?: { stateId?: string; lgaId?: string; wardId?: string; pollingUnitId?: string }
) => (state: RootState) => {
  const arg = query ? { organizationId, electionId, query } : { organizationId, electionId };
  return state.voting.loading[buildKey("voting/getVotingReport", arg)] ?? false;
};

// Generic
export const selectByKey = (key: string) => (state: RootState) => state.voting.cache[key];
export const selectLoadingByKey = (key: string) => (state: RootState) =>
  state.voting.loading[key] ?? false;
export const selectErrorByKey = (key: string) => (state: RootState) =>
  state.voting.error[key] ?? null;
