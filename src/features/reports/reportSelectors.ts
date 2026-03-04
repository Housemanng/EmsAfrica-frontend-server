import type { RootState } from "../../app/store";
import type { ReportCategory } from "./reportApi";

const buildKey = (prefix: string, arg?: unknown) =>
  arg !== undefined ? `${prefix}::${JSON.stringify(arg)}` : prefix;

// ── Generic helpers ───────────────────────────────────────────────────────────

export const selectReportCache   = (state: RootState) => state.reports.cache;
export const selectReportLoading = (state: RootState) => state.reports.loading;

// ── Read / unread ─────────────────────────────────────────────────────────────

/** Returns isRead from the server-returned report object stored in cache */
export const selectIsReportRead = (id: string) => (state: RootState) => {
  for (const list of Object.values(state.reports.cache)) {
    if (!Array.isArray(list)) continue;
    const found = (list as { _id?: string; isRead?: boolean }[]).find((r) => r._id === id);
    if (found) return !!found.isRead;
  }
  return false;
};

/** Count of reports across all cache entries that have isRead === false */
export const selectUnreadReportCount = () => (state: RootState) => {
  let count = 0;
  const seen = new Set<string>();
  for (const list of Object.values(state.reports.cache)) {
    if (!Array.isArray(list)) continue;
    for (const r of list as { _id?: string; isRead?: boolean }[]) {
      if (r._id && !seen.has(r._id) && !r.isRead) {
        seen.add(r._id);
        count++;
      }
    }
  }
  return count;
};
export const selectReportError   = (state: RootState) => state.reports.error;

export const selectCached  = (key: string) => (state: RootState) => state.reports.cache[key]   ?? null;
export const selectLoading = (key: string) => (state: RootState) => state.reports.loading[key] ?? false;
export const selectError   = (key: string) => (state: RootState) => state.reports.error[key]   ?? null;

// ── By election ───────────────────────────────────────────────────────────────

export const selectReportsByElection = (params: {
  electionId: string;
  pollingUnitId?: string;
  wardId?: string;
  lgaId?: string;
  stateId?: string;
  category?: ReportCategory;
}) => (state: RootState) =>
  state.reports.cache[buildKey("reports/getReportsByElection", params)] as unknown[] | undefined;

export const selectReportsByElectionLoading = (params: {
  electionId: string;
  pollingUnitId?: string;
  wardId?: string;
  lgaId?: string;
  stateId?: string;
  category?: ReportCategory;
}) => (state: RootState) =>
  state.reports.loading[buildKey("reports/getReportsByElection", params)] ?? false;

export const selectReportsByElectionError = (params: {
  electionId: string;
  pollingUnitId?: string;
  wardId?: string;
  lgaId?: string;
  stateId?: string;
  category?: ReportCategory;
}) => (state: RootState) =>
  state.reports.error[buildKey("reports/getReportsByElection", params)] ?? null;

// ── By polling unit ───────────────────────────────────────────────────────────

export const selectReportsByPollingUnit = (params: {
  pollingUnitId: string;
  electionId?: string;
  category?: ReportCategory;
}) => (state: RootState) =>
  state.reports.cache[buildKey("reports/getReportsByPollingUnit", params)] as unknown[] | undefined;

export const selectReportsByPollingUnitLoading = (params: {
  pollingUnitId: string;
  electionId?: string;
  category?: ReportCategory;
}) => (state: RootState) =>
  state.reports.loading[buildKey("reports/getReportsByPollingUnit", params)] ?? false;

// ── By ward ───────────────────────────────────────────────────────────────────

export const selectReportsByWard = (params: {
  wardId: string;
  electionId?: string;
  category?: ReportCategory;
}) => (state: RootState) =>
  state.reports.cache[buildKey("reports/getReportsByWard", params)] as unknown[] | undefined;

export const selectReportsByWardLoading = (params: {
  wardId: string;
  electionId?: string;
  category?: ReportCategory;
}) => (state: RootState) =>
  state.reports.loading[buildKey("reports/getReportsByWard", params)] ?? false;

// ── By LGA ────────────────────────────────────────────────────────────────────

export const selectReportsByLga = (params: {
  lgaId: string;
  electionId?: string;
  category?: ReportCategory;
}) => (state: RootState) =>
  state.reports.cache[buildKey("reports/getReportsByLga", params)] as unknown[] | undefined;

export const selectReportsByLgaLoading = (params: {
  lgaId: string;
  electionId?: string;
  category?: ReportCategory;
}) => (state: RootState) =>
  state.reports.loading[buildKey("reports/getReportsByLga", params)] ?? false;

// ── By state ──────────────────────────────────────────────────────────────────

export const selectReportsByState = (params: {
  stateId: string;
  electionId?: string;
  category?: ReportCategory;
}) => (state: RootState) =>
  state.reports.cache[buildKey("reports/getReportsByState", params)] as unknown[] | undefined;

export const selectReportsByStateLoading = (params: {
  stateId: string;
  electionId?: string;
  category?: ReportCategory;
}) => (state: RootState) =>
  state.reports.loading[buildKey("reports/getReportsByState", params)] ?? false;

// ── Create ────────────────────────────────────────────────────────────────────

export const selectCreateReportLoading = (state: RootState) =>
  Object.entries(state.reports.loading)
    .some(([k, v]) => k.startsWith("reports/createReport") && v);

export const selectCreateReportError = (state: RootState) => {
  const entry = Object.entries(state.reports.error)
    .find(([k]) => k.startsWith("reports/createReport"));
  return entry?.[1] ?? null;
};

// ── Generic by key ────────────────────────────────────────────────────────────
export const selectByKey        = (key: string) => (state: RootState) => state.reports.cache[key];
export const selectLoadingByKey = (key: string) => (state: RootState) => state.reports.loading[key] ?? false;
export const selectErrorByKey   = (key: string) => (state: RootState) => state.reports.error[key]   ?? null;
