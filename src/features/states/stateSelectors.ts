import type { RootState } from "../../app/store";

const buildKey = (prefix: string, arg?: unknown) =>
  arg !== undefined ? `${prefix}::${JSON.stringify(arg)}` : prefix;

export const selectStateCache = (state: RootState) => state.states.cache;
export const selectStateLoading = (state: RootState) => state.states.loading;
export const selectStateError = (state: RootState) => state.states.error;

export const selectCached = (key: string) => (state: RootState) => state.states.cache[key] ?? null;
export const selectLoading = (key: string) => (state: RootState) => state.states.loading[key] ?? false;
export const selectError = (key: string) => (state: RootState) => state.states.error[key] ?? null;

// Convenience selectors
export const selectAllStates = (state: RootState) =>
  state.states.cache[buildKey("states/getAllStates")] as any[] | undefined;
export const selectAllStatesLoading = (state: RootState) =>
  state.states.loading[buildKey("states/getAllStates")] ?? false;
export const selectAllStatesError = (state: RootState) =>
  state.states.error[buildKey("states/getAllStates")] ?? null;

export const selectStateById = (id: string) => (state: RootState) =>
  state.states.cache[buildKey("states/getStateById", id)] as any | undefined;
export const selectStateByIdLoading = (id: string) => (state: RootState) =>
  state.states.loading[buildKey("states/getStateById", id)] ?? false;

export const selectStatesByOrganizationId = (organizationId: string) => (state: RootState) =>
  state.states.cache[buildKey("states/getStatesByOrganizationId", organizationId)] as any[] | undefined;
export const selectStatesByOrganizationIdLoading = (organizationId: string) => (state: RootState) =>
  state.states.loading[buildKey("states/getStatesByOrganizationId", organizationId)] ?? false;
export const selectStatesByOrganizationIdError = (organizationId: string) => (state: RootState) =>
  state.states.error[buildKey("states/getStatesByOrganizationId", organizationId)] ?? null;

export const selectLGAsByState = (stateId: string) => (state: RootState) =>
  state.states.cache[buildKey("states/getLGAsByState", stateId)] as any[] | undefined;
export const selectLGAsByStateLoading = (stateId: string) => (state: RootState) =>
  state.states.loading[buildKey("states/getLGAsByState", stateId)] ?? false;

// Generic
export const selectByKey = (key: string) => (state: RootState) => state.states.cache[key];
export const selectLoadingByKey = (key: string) => (state: RootState) =>
  state.states.loading[key] ?? false;
export const selectErrorByKey = (key: string) => (state: RootState) =>
  state.states.error[key] ?? null;
