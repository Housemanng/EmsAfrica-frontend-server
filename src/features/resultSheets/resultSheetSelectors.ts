import type { RootState } from "../../app/store";

const buildKey = (prefix: string, arg?: unknown) =>
  arg !== undefined ? `${prefix}::${JSON.stringify(arg)}` : prefix;

export const selectResultSheetCache = (state: RootState) => state.resultSheets.cache;
export const selectResultSheetLoading = (state: RootState) => state.resultSheets.loading;
export const selectResultSheetError = (state: RootState) => state.resultSheets.error;

export const selectCached = (key: string) => (state: RootState) => state.resultSheets.cache[key] ?? null;
export const selectLoading = (key: string) => (state: RootState) => state.resultSheets.loading[key] ?? false;
export const selectError = (key: string) => (state: RootState) => state.resultSheets.error[key] ?? null;

// Convenience selectors
export const selectSheetsByElection = (
  electionId: string,
  query?: { pollingUnitId?: string; wardId?: string; lgaId?: string; stateId?: string }
) => (state: RootState) => {
  const arg = query ? { electionId, query } : { electionId };
  return state.resultSheets.cache[buildKey("resultSheets/getSheetsByElection", arg)] as any[] | undefined;
};
export const selectSheetsByElectionLoading = (
  electionId: string,
  query?: { pollingUnitId?: string; wardId?: string; lgaId?: string; stateId?: string }
) => (state: RootState) => {
  const arg = query ? { electionId, query } : { electionId };
  return state.resultSheets.loading[buildKey("resultSheets/getSheetsByElection", arg)] ?? false;
};

export const selectSheetsByElectionAndPollingUnit = (
  electionId: string,
  pollingUnitId: string
) => (state: RootState) =>
  state.resultSheets.cache[
    buildKey("resultSheets/getSheetsByElectionAndPollingUnit", { electionId, pollingUnitId })
  ] as any[] | undefined;

export const selectSheetsByElectionAndWard = (
  electionId: string,
  wardId: string
) => (state: RootState) =>
  state.resultSheets.cache[
    buildKey("resultSheets/getSheetsByElectionAndWard", { electionId, wardId })
  ] as any[] | undefined;

export const selectSheetsByElectionAndLga = (
  electionId: string,
  lgaId: string
) => (state: RootState) =>
  state.resultSheets.cache[
    buildKey("resultSheets/getSheetsByElectionAndLga", { electionId, lgaId })
  ] as any[] | undefined;

export const selectSheetsByElectionAndState = (
  electionId: string,
  stateId: string
) => (state: RootState) =>
  state.resultSheets.cache[
    buildKey("resultSheets/getSheetsByElectionAndState", { electionId, stateId })
  ] as any[] | undefined;

export const selectSheetsByPollingUnit = (pollingUnitId: string) => (state: RootState) =>
  state.resultSheets.cache[buildKey("resultSheets/getSheetsByPollingUnit", pollingUnitId)] as any[] | undefined;
export const selectSheetsByPollingUnitLoading = (pollingUnitId: string) => (state: RootState) =>
  state.resultSheets.loading[buildKey("resultSheets/getSheetsByPollingUnit", pollingUnitId)] ?? false;

// Scan result
export const selectScanResult = (formDataKey: string) => (state: RootState) =>
  state.resultSheets.cache[buildKey("resultSheets/scanResultSheet", formDataKey)] as any | undefined;

// Generic
export const selectByKey = (key: string) => (state: RootState) => state.resultSheets.cache[key];
export const selectLoadingByKey = (key: string) => (state: RootState) =>
  state.resultSheets.loading[key] ?? false;
export const selectErrorByKey = (key: string) => (state: RootState) =>
  state.resultSheets.error[key] ?? null;
