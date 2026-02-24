import type { RootState } from "../../app/store";

const buildKey = (prefix: string, arg?: unknown) =>
  arg !== undefined ? `${prefix}::${JSON.stringify(arg)}` : prefix;

export const selectUserCache = (state: RootState) => state.user.cache;
export const selectUserLoading = (state: RootState) => state.user.loading;
export const selectUserError = (state: RootState) => state.user.error;

export const selectCached = (key: string) => (state: RootState) => state.user.cache[key] ?? null;
export const selectLoading = (key: string) => (state: RootState) => state.user.loading[key] ?? false;
export const selectError = (key: string) => (state: RootState) => state.user.error[key] ?? null;

// Convenience selectors
export const selectAllUsers = (state: RootState) =>
  state.user.cache[buildKey("user/getAllUsers")] as any[] | undefined;
export const selectAllUsersLoading = (state: RootState) =>
  state.user.loading[buildKey("user/getAllUsers")] ?? false;
export const selectAllUsersError = (state: RootState) =>
  state.user.error[buildKey("user/getAllUsers")] ?? null;

export const selectUserById = (id: string) => (state: RootState) =>
  state.user.cache[buildKey("user/getUserById", id)] as any | undefined;
export const selectUserByIdLoading = (id: string) => (state: RootState) =>
  state.user.loading[buildKey("user/getUserById", id)] ?? false;

export const selectUsersByOrganizationId = (organizationId: string) => (state: RootState) =>
  state.user.cache[buildKey("user/getUsersByOrganizationId", organizationId)] as any[] | undefined;
export const selectUsersByOrganizationIdLoading = (organizationId: string) => (state: RootState) =>
  state.user.loading[buildKey("user/getUsersByOrganizationId", organizationId)] ?? false;

export const selectLgaCollationOfficers = (organizationId: string) => (state: RootState) =>
  state.user.cache[buildKey("user/getLgaCollationOfficersByOrganizationId", organizationId)] as any[] | undefined;
export const selectLgaCollationOfficersLoading = (organizationId: string) => (state: RootState) =>
  state.user.loading[buildKey("user/getLgaCollationOfficersByOrganizationId", organizationId)] ?? false;

export const selectUsersByPollingUnitId = (
  organizationId: string,
  pollingUnitId: string
) => (state: RootState) =>
  state.user.cache[
    buildKey("user/getUsersByPollingUnitId", { organizationId, pollingUnitId })
  ] as any[] | undefined;
export const selectUsersByPollingUnitIdLoading = (
  organizationId: string,
  pollingUnitId: string
) => (state: RootState) =>
  state.user.loading[
    buildKey("user/getUsersByPollingUnitId", { organizationId, pollingUnitId })
  ] ?? false;

// Generic
export const selectByKey = (key: string) => (state: RootState) => state.user.cache[key];
export const selectLoadingByKey = (key: string) => (state: RootState) =>
  state.user.loading[key] ?? false;
export const selectErrorByKey = (key: string) => (state: RootState) =>
  state.user.error[key] ?? null;
