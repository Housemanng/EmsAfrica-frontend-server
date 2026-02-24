import type { RootState } from "../../app/store";

const buildKey = (prefix: string, arg?: unknown) =>
  arg !== undefined ? `${prefix}::${JSON.stringify(arg)}` : prefix;

export const selectPollingUnitCache = (state: RootState) => state.pollingUnits.cache;
export const selectPollingUnitLoading = (state: RootState) => state.pollingUnits.loading;
export const selectPollingUnitError = (state: RootState) => state.pollingUnits.error;

export const selectCached = (key: string) => (state: RootState) => state.pollingUnits.cache[key] ?? null;
export const selectLoading = (key: string) => (state: RootState) => state.pollingUnits.loading[key] ?? false;
export const selectError = (key: string) => (state: RootState) => state.pollingUnits.error[key] ?? null;

// User-accessible
export const selectUsersByPollingUnitId = (
  organizationId: string,
  pollingUnitId: string
) => (state: RootState) =>
  state.pollingUnits.cache[
    buildKey("pollingUnits/getUsersByPollingUnitId", { organizationId, pollingUnitId })
  ] as any | undefined;
export const selectUsersByPollingUnitIdLoading = (
  organizationId: string,
  pollingUnitId: string
) => (state: RootState) =>
  state.pollingUnits.loading[
    buildKey("pollingUnits/getUsersByPollingUnitId", { organizationId, pollingUnitId })
  ] ?? false;

export const selectPollingUnitsByWard = (
  organizationId: string,
  wardId: string
) => (state: RootState) =>
  state.pollingUnits.cache[
    buildKey("pollingUnits/getPollingUnitsByWard", { organizationId, wardId })
  ] as any | undefined;
export const selectPollingUnitsByWardLoading = (
  organizationId: string,
  wardId: string
) => (state: RootState) =>
  state.pollingUnits.loading[
    buildKey("pollingUnits/getPollingUnitsByWard", { organizationId, wardId })
  ] ?? false;

export const selectAllAccreditationByOrganization = (
  organizationId: string,
  electionId: string,
  query?: { stateId?: string; lgaId?: string; wardId?: string }
) => (state: RootState) => {
  const arg = query ? { organizationId, electionId, query } : { organizationId, electionId };
  return state.pollingUnits.cache[
    buildKey("pollingUnits/getAllAccreditationByOrganization", arg)
  ] as any | undefined;
};
export const selectAllAccreditationByOrganizationLoading = (
  organizationId: string,
  electionId: string,
  query?: { stateId?: string; lgaId?: string; wardId?: string }
) => (state: RootState) => {
  const arg = query ? { organizationId, electionId, query } : { organizationId, electionId };
  return state.pollingUnits.loading[
    buildKey("pollingUnits/getAllAccreditationByOrganization", arg)
  ] ?? false;
};

export const selectAccreditedVotersByPollingUnit = (
  organizationId: string,
  pollingUnitId: string,
  electionId: string
) => (state: RootState) =>
  state.pollingUnits.cache[
    buildKey("pollingUnits/getAccreditedVotersByPollingUnit", {
      organizationId,
      pollingUnitId,
      electionId,
    })
  ] as any | undefined;
export const selectAccreditedVotersByPollingUnitLoading = (
  organizationId: string,
  pollingUnitId: string,
  electionId: string
) => (state: RootState) =>
  state.pollingUnits.loading[
    buildKey("pollingUnits/getAccreditedVotersByPollingUnit", {
      organizationId,
      pollingUnitId,
      electionId,
    })
  ] ?? false;

// Platform admin
export const selectAllPollingUnits = (state: RootState) =>
  state.pollingUnits.cache[buildKey("pollingUnits/getAllPollingUnits")] as any[] | undefined;
export const selectAllPollingUnitsLoading = (state: RootState) =>
  state.pollingUnits.loading[buildKey("pollingUnits/getAllPollingUnits")] ?? false;

export const selectPollingUnitsWithPresence = (
  params?: { electionId?: string; stateId?: string; lgaId?: string; wardId?: string }
) => (state: RootState) =>
  state.pollingUnits.cache[
    buildKey("pollingUnits/getPollingUnitsWithPresence", params)
  ] as any | undefined;
export const selectPollingUnitsWithPresenceLoading = (
  params?: { electionId?: string; stateId?: string; lgaId?: string; wardId?: string }
) => (state: RootState) =>
  state.pollingUnits.loading[
    buildKey("pollingUnits/getPollingUnitsWithPresence", params)
  ] ?? false;

export const selectPollingUnitsByWardAdmin = (wardId: string) => (state: RootState) =>
  state.pollingUnits.cache[buildKey("pollingUnits/getPollingUnitsByWardAdmin", wardId)] as any[] | undefined;
export const selectPollingUnitsByWardAdminLoading = (wardId: string) => (state: RootState) =>
  state.pollingUnits.loading[buildKey("pollingUnits/getPollingUnitsByWardAdmin", wardId)] ?? false;

export const selectPollingUnitById = (id: string) => (state: RootState) =>
  state.pollingUnits.cache[buildKey("pollingUnits/getPollingUnitById", id)] as any | undefined;
export const selectPollingUnitByIdLoading = (id: string) => (state: RootState) =>
  state.pollingUnits.loading[buildKey("pollingUnits/getPollingUnitById", id)] ?? false;

// Generic
export const selectByKey = (key: string) => (state: RootState) => state.pollingUnits.cache[key];
export const selectLoadingByKey = (key: string) => (state: RootState) =>
  state.pollingUnits.loading[key] ?? false;
export const selectErrorByKey = (key: string) => (state: RootState) =>
  state.pollingUnits.error[key] ?? null;
