import type { RootState } from "../../app/store";

const buildKey = (prefix: string, arg?: unknown) =>
  arg !== undefined ? `${prefix}::${JSON.stringify(arg)}` : prefix;

export const selectLGACache = (state: RootState) => state.lgas.cache;
export const selectLGALoading = (state: RootState) => state.lgas.loading;
export const selectLGAError = (state: RootState) => state.lgas.error;

export const selectCached = (key: string) => (state: RootState) => state.lgas.cache[key] ?? null;
export const selectLoading = (key: string) => (state: RootState) => state.lgas.loading[key] ?? false;
export const selectError = (key: string) => (state: RootState) => state.lgas.error[key] ?? null;

// Convenience selectors
export const selectAllLGAs = (state: RootState) =>
  state.lgas.cache[buildKey("lgas/getAllLGAs")] as any[] | undefined;
export const selectAllLGAsLoading = (state: RootState) =>
  state.lgas.loading[buildKey("lgas/getAllLGAs")] ?? false;
export const selectAllLGAsError = (state: RootState) =>
  state.lgas.error[buildKey("lgas/getAllLGAs")] ?? null;

export const selectLGAsByState = (stateId: string) => (state: RootState) =>
  state.lgas.cache[buildKey("lgas/getLGAsByState", stateId)] as any[] | undefined;
export const selectLGAsByStateLoading = (stateId: string) => (state: RootState) =>
  state.lgas.loading[buildKey("lgas/getLGAsByState", stateId)] ?? false;

export const selectLGAsByStateName = (stateName: string) => (state: RootState) =>
  state.lgas.cache[buildKey("lgas/getLGAsByStateName", stateName)] as any[] | undefined;
export const selectLGAsByStateNameLoading = (stateName: string) => (state: RootState) =>
  state.lgas.loading[buildKey("lgas/getLGAsByStateName", stateName)] ?? false;

export const selectLGAById = (id: string) => (state: RootState) =>
  state.lgas.cache[buildKey("lgas/getLGAById", id)] as any | undefined;
export const selectLGAByIdLoading = (id: string) => (state: RootState) =>
  state.lgas.loading[buildKey("lgas/getLGAById", id)] ?? false;

// Generic
export const selectByKey = (key: string) => (state: RootState) => state.lgas.cache[key];
export const selectLoadingByKey = (key: string) => (state: RootState) =>
  state.lgas.loading[key] ?? false;
export const selectErrorByKey = (key: string) => (state: RootState) =>
  state.lgas.error[key] ?? null;
