import type { RootState } from "../../app/store";

const buildKey = (prefix: string, arg?: unknown) =>
  arg !== undefined ? `${prefix}::${JSON.stringify(arg)}` : prefix;

export const selectReportCache = (state: RootState) => state.reports.cache;
export const selectReportLoading = (state: RootState) => state.reports.loading;
export const selectReportError = (state: RootState) => state.reports.error;

export const selectCached = (key: string) => (state: RootState) =>
  state.reports.cache[key] ?? null;
export const selectLoading = (key: string) => (state: RootState) =>
  state.reports.loading[key] ?? false;
export const selectError = (key: string) => (state: RootState) =>
  state.reports.error[key] ?? null;

// Convenience selectors
export const selectReportsByElection = (params: {
  electionId: string;
  pollingUnitId?: string;
  stateId?: string;
  lgaId?: string;
  wardId?: string;
}) => (state: RootState) =>
  state.reports.cache[
    buildKey("reports/getReportsByElection", params)
  ] as unknown[] | undefined;

export const selectReportsByElectionLoading = (params: {
  electionId: string;
  pollingUnitId?: string;
  stateId?: string;
  lgaId?: string;
  wardId?: string;
}) => (state: RootState) =>
  state.reports.loading[buildKey("reports/getReportsByElection", params)] ??
  false;

export const selectReportsByElectionError = (params: {
  electionId: string;
  pollingUnitId?: string;
  stateId?: string;
  lgaId?: string;
  wardId?: string;
}) => (state: RootState) =>
  state.reports.error[buildKey("reports/getReportsByElection", params)] ??
  null;

export const selectReportsByPollingUnit = (params: {
  pollingUnitId: string;
  electionId?: string;
}) => (state: RootState) =>
  state.reports.cache[
    buildKey("reports/getReportsByPollingUnit", params)
  ] as unknown[] | undefined;

export const selectReportsByPollingUnitLoading = (params: {
  pollingUnitId: string;
  electionId?: string;
}) => (state: RootState) =>
  state.reports.loading[buildKey("reports/getReportsByPollingUnit", params)] ??
  false;

export const selectReportsByPollingUnitError = (params: {
  pollingUnitId: string;
  electionId?: string;
}) => (state: RootState) =>
  state.reports.error[buildKey("reports/getReportsByPollingUnit", params)] ??
  null;

export const selectCreateReportResult = (params: {
  electionId: string;
  pollingUnitId: string;
  content: string;
}) => (state: RootState) =>
  state.reports.cache[
    buildKey("reports/createReport", params)
  ] as unknown | undefined;

export const selectCreateReportLoading = (params: {
  electionId: string;
  pollingUnitId: string;
  content: string;
}) => (state: RootState) =>
  state.reports.loading[buildKey("reports/createReport", params)] ?? false;

// Generic
export const selectByKey = (key: string) => (state: RootState) =>
  state.reports.cache[key];
export const selectLoadingByKey = (key: string) => (state: RootState) =>
  state.reports.loading[key] ?? false;
export const selectErrorByKey = (key: string) => (state: RootState) =>
  state.reports.error[key] ?? null;
