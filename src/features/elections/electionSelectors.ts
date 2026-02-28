import type { RootState } from "../../app/store";

const buildKey = (prefix: string, arg?: unknown) =>
  arg !== undefined ? `${prefix}::${JSON.stringify(arg)}` : prefix;

export const selectElectionCache = (state: RootState) => state.elections.cache;
export const selectElectionLoading = (state: RootState) => state.elections.loading;
export const selectElectionError = (state: RootState) => state.elections.error;

export const selectCached = (key: string) => (state: RootState) => state.elections.cache[key] ?? null;
export const selectLoading = (key: string) => (state: RootState) => state.elections.loading[key] ?? false;
export const selectError = (key: string) => (state: RootState) => state.elections.error[key] ?? null;

// Convenience selectors
export const selectAllElections = (params?: { state?: string; status?: string; group?: string }) => (state: RootState) =>
  state.elections.cache[buildKey("elections/getAllElections", params)] as any[] | undefined;
export const selectAllElectionsLoading = (params?: { state?: string; status?: string; group?: string }) => (state: RootState) =>
  state.elections.loading[buildKey("elections/getAllElections", params)] ?? false;
export const selectAllElectionsError = (params?: { state?: string; status?: string; group?: string }) => (state: RootState) =>
  state.elections.error[buildKey("elections/getAllElections", params)] ?? null;

export const selectElectionById = (id: string) => (state: RootState) =>
  state.elections.cache[buildKey("elections/getElectionById", id)] as any | undefined;
export const selectElectionByIdLoading = (id: string) => (state: RootState) =>
  state.elections.loading[buildKey("elections/getElectionById", id)] ?? false;

export const selectElectionsByOrganizationId = (
  organizationId: string,
  query?: { state?: string; status?: string; group?: string; includeResults?: boolean }
) => (state: RootState) => {
  const arg = query ? { organizationId, query } : { organizationId };
  return state.elections.cache[buildKey("elections/getElectionsByOrganizationId", arg)] as any[] | undefined;
};
export const selectElectionsByOrganizationIdLoading = (
  organizationId: string,
  query?: { state?: string; status?: string; group?: string; includeResults?: boolean }
) => (state: RootState) => {
  const arg = query ? { organizationId, query } : { organizationId };
  return state.elections.loading[buildKey("elections/getElectionsByOrganizationId", arg)] ?? false;
};
export const selectElectionsByOrganizationIdError = (
  organizationId: string,
  query?: { state?: string; status?: string; group?: string; includeResults?: boolean }
) => (state: RootState) => {
  const arg = query ? { organizationId, query } : { organizationId };
  return state.elections.error[buildKey("elections/getElectionsByOrganizationId", arg)] as string | null | undefined;
};

export const selectElectionsByLGAId = (
  lgaId: string,
  query?: { status?: string; group?: string }
) => (state: RootState) => {
  const arg = query ? { lgaId, query } : { lgaId };
  return state.elections.cache[buildKey("elections/getElectionsByLGAId", arg)] as any[] | undefined;
};
export const selectElectionsByLGAIdLoading = (
  lgaId: string,
  query?: { status?: string; group?: string }
) => (state: RootState) => {
  const arg = query ? { lgaId, query } : { lgaId };
  return state.elections.loading[buildKey("elections/getElectionsByLGAId", arg)] ?? false;
};

export const selectElectionSettings = (id: string) => (state: RootState) =>
  state.elections.cache[buildKey("elections/getElectionSettings", id)] as { settings: Record<string, unknown> } | undefined;
export const selectElectionSettingsLoading = (id: string) => (state: RootState) =>
  state.elections.loading[buildKey("elections/getElectionSettings", id)] ?? false;

export const selectAccreditation = (
  electionId: string,
  query?: { stateId?: string; lgaId?: string; wardId?: string; pollingUnitId?: string }
) => (state: RootState) => {
  const arg = query ? { electionId, query } : { electionId };
  return state.elections.cache[buildKey("elections/listAccreditation", arg)] as any[] | undefined;
};
export const selectAccreditationLoading = (
  electionId: string,
  query?: { stateId?: string; lgaId?: string; wardId?: string; pollingUnitId?: string }
) => (state: RootState) => {
  const arg = query ? { electionId, query } : { electionId };
  return state.elections.loading[buildKey("elections/listAccreditation", arg)] ?? false;
};

// Generic
export const selectByKey = (key: string) => (state: RootState) => state.elections.cache[key];
export const selectLoadingByKey = (key: string) => (state: RootState) =>
  state.elections.loading[key] ?? false;
export const selectErrorByKey = (key: string) => (state: RootState) =>
  state.elections.error[key] ?? null;
