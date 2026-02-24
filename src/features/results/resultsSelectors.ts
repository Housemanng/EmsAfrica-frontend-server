import type { RootState } from "../../app/store";

const buildKey = (prefix: string, arg?: unknown) =>
  arg !== undefined ? `${prefix}::${JSON.stringify(arg)}` : prefix;

export const selectResultsCache = (state: RootState) => state.results.cache;
export const selectResultsLoading = (state: RootState) => state.results.loading;
export const selectResultsError = (state: RootState) => state.results.error;

export const selectCached = (key: string) => (state: RootState) => state.results.cache[key] ?? null;
export const selectLoading = (key: string) => (state: RootState) => state.results.loading[key] ?? false;
export const selectError = (key: string) => (state: RootState) => state.results.error[key] ?? null;

// Convenience selectors per thunk
export const selectElections = (state: RootState) =>
  state.results.cache[buildKey("results/getElections")] as any[] | undefined;
export const selectParties = (state: RootState) =>
  state.results.cache[buildKey("results/getParties")] as any[] | undefined;
export const selectElectionsLoading = (state: RootState) =>
  state.results.loading[buildKey("results/getElections")] ?? false;
export const selectPartiesLoading = (state: RootState) =>
  state.results.loading[buildKey("results/getParties")] ?? false;
export const selectElectionsError = (state: RootState) =>
  state.results.error[buildKey("results/getElections")] ?? null;
export const selectPartiesError = (state: RootState) =>
  state.results.error[buildKey("results/getParties")] ?? null;

export const selectResultsByPollingUnit = (
  electionId: string,
  pollingUnitId: string,
  params?: { source?: string }
) => (state: RootState) => {
  const arg = params ? { electionId, pollingUnitId, params } : { electionId, pollingUnitId };
  return state.results.cache[buildKey("results/getResultsByElectionAndPollingUnit", arg)] as
    | { results: any[]; declaredWinner: any }
    | undefined;
};
export const selectResultsByPollingUnitLoading = (
  electionId: string,
  pollingUnitId: string,
  params?: { source?: string }
) => (state: RootState) => {
  const arg = params ? { electionId, pollingUnitId, params } : { electionId, pollingUnitId };
  return state.results.loading[buildKey("results/getResultsByElectionAndPollingUnit", arg)] ?? false;
};
export const selectResultsByPollingUnitError = (
  electionId: string,
  pollingUnitId: string,
  params?: { source?: string }
) => (state: RootState) => {
  const arg = params ? { electionId, pollingUnitId, params } : { electionId, pollingUnitId };
  return state.results.error[buildKey("results/getResultsByElectionAndPollingUnit", arg)] ?? null;
};

export const selectAspirantTotalsByElection = (electionId: string) => (state: RootState) =>
  state.results.cache[buildKey("results/getAspirantTotalsByElection", electionId)] as any;
export const selectAspirantTotalsByElectionLoading = (electionId: string) => (state: RootState) =>
  state.results.loading[buildKey("results/getAspirantTotalsByElection", electionId)] ?? false;

export const selectResultsOverview = (electionId: string) => (state: RootState) =>
  state.results.cache[buildKey("results/getResultsOverview", electionId)] as any;
export const selectResultsOverviewLoading = (electionId: string) => (state: RootState) =>
  state.results.loading[buildKey("results/getResultsOverview", electionId)] ?? false;

export const selectDashboardSummary = (electionId: string) => (state: RootState) =>
  state.results.cache[buildKey("results/getDashboardSummary", electionId)] as any;

export const selectMyPartyOverview = (
  electionId: string,
  params?: { source?: string }
) => (state: RootState) => {
  const arg = params ? { electionId, params } : { electionId };
  return state.results.cache[buildKey("results/getMyPartyOverview", arg)] as any;
};
export const selectMyPartyAreasLosing = (
  electionId: string,
  params?: { source?: string }
) => (state: RootState) => {
  const arg = params ? { electionId, params } : { electionId };
  return state.results.cache[buildKey("results/getMyPartyAreasLosing", arg)] as any;
};
export const selectMyPartyNeedsAttention = (
  electionId: string,
  params?: { source?: string; marginThreshold?: number }
) => (state: RootState) => {
  const arg = params ? { electionId, params } : { electionId };
  return state.results.cache[buildKey("results/getMyPartyNeedsAttention", arg)] as any;
};

export const selectResultsByState = (
  electionId: string,
  stateId: string
) => (state: RootState) =>
  state.results.cache[buildKey("results/getResultsByState", { electionId, stateId })] as any;
export const selectAspirantTotalsByState = (
  electionId: string,
  stateId: string
) => (state: RootState) =>
  state.results.cache[
    buildKey("results/getAspirantTotalsByElectionAndState", { electionId, stateId })
  ] as any;
export const selectResultsByLga = (
  electionId: string,
  lgaId: string
) => (state: RootState) =>
  state.results.cache[buildKey("results/getResultsByLGA", { electionId, lgaId })] as any;
export const selectAspirantTotalsByLga = (
  electionId: string,
  lgaId: string
) => (state: RootState) =>
  state.results.cache[
    buildKey("results/getAspirantTotalsByElectionAndLga", { electionId, lgaId })
  ] as any;
export const selectResultsByWard = (
  electionId: string,
  wardId: string
) => (state: RootState) =>
  state.results.cache[buildKey("results/getResultsByWard", { electionId, wardId })] as any;
export const selectAspirantTotalsByWard = (
  electionId: string,
  wardId: string
) => (state: RootState) =>
  state.results.cache[
    buildKey("results/getAspirantTotalsByElectionAndWard", { electionId, wardId })
  ] as any;

// Generic: get cached data by thunk + arg
export const selectByKey = (key: string) => (state: RootState) => state.results.cache[key];
export const selectLoadingByKey = (key: string) => (state: RootState) =>
  state.results.loading[key] ?? false;
export const selectErrorByKey = (key: string) => (state: RootState) =>
  state.results.error[key] ?? null;
