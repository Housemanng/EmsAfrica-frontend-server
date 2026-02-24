import type { RootState } from "../../app/store";

const buildKey = (prefix: string, arg?: unknown) =>
  arg !== undefined ? `${prefix}::${JSON.stringify(arg)}` : prefix;

export const selectWardCache = (state: RootState) => state.wards.cache;
export const selectWardLoading = (state: RootState) => state.wards.loading;
export const selectWardError = (state: RootState) => state.wards.error;

export const selectCached = (key: string) => (state: RootState) => state.wards.cache[key] ?? null;
export const selectLoading = (key: string) => (state: RootState) => state.wards.loading[key] ?? false;
export const selectError = (key: string) => (state: RootState) => state.wards.error[key] ?? null;

// Convenience selectors
export const selectAllWards = (state: RootState) =>
  state.wards.cache[buildKey("wards/getAllWards")] as any[] | undefined;
export const selectAllWardsLoading = (state: RootState) =>
  state.wards.loading[buildKey("wards/getAllWards")] ?? false;
export const selectAllWardsError = (state: RootState) =>
  state.wards.error[buildKey("wards/getAllWards")] ?? null;

export const selectWardsByLGA = (lgaId: string) => (state: RootState) =>
  state.wards.cache[buildKey("wards/getWardsByLGA", lgaId)] as any[] | undefined;
export const selectWardsByLGALoading = (lgaId: string) => (state: RootState) =>
  state.wards.loading[buildKey("wards/getWardsByLGA", lgaId)] ?? false;

export const selectWardById = (id: string) => (state: RootState) =>
  state.wards.cache[buildKey("wards/getWardById", id)] as any | undefined;
export const selectWardByIdLoading = (id: string) => (state: RootState) =>
  state.wards.loading[buildKey("wards/getWardById", id)] ?? false;

export const selectPollingUnitsByWard = (wardId: string) => (state: RootState) =>
  state.wards.cache[buildKey("wards/getPollingUnitsByWard", wardId)] as any[] | undefined;
export const selectPollingUnitsByWardLoading = (wardId: string) => (state: RootState) =>
  state.wards.loading[buildKey("wards/getPollingUnitsByWard", wardId)] ?? false;

// Generic
export const selectByKey = (key: string) => (state: RootState) => state.wards.cache[key];
export const selectLoadingByKey = (key: string) => (state: RootState) =>
  state.wards.loading[key] ?? false;
export const selectErrorByKey = (key: string) => (state: RootState) =>
  state.wards.error[key] ?? null;
