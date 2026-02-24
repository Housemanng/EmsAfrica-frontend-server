import type { RootState } from "../../app/store";

const buildKey = (prefix: string, arg?: unknown) =>
  arg !== undefined ? `${prefix}::${JSON.stringify(arg)}` : prefix;

export const selectAspirantCache = (state: RootState) => state.aspirants.cache;
export const selectAspirantLoading = (state: RootState) => state.aspirants.loading;
export const selectAspirantError = (state: RootState) => state.aspirants.error;

export const selectCached = (key: string) => (state: RootState) => state.aspirants.cache[key] ?? null;
export const selectLoading = (key: string) => (state: RootState) => state.aspirants.loading[key] ?? false;
export const selectError = (key: string) => (state: RootState) => state.aspirants.error[key] ?? null;

// Convenience selectors
export const selectAllAspirants = (state: RootState) =>
  state.aspirants.cache[buildKey("aspirants/getAllAspirants")] as any[] | undefined;
export const selectAllAspirantsLoading = (state: RootState) =>
  state.aspirants.loading[buildKey("aspirants/getAllAspirants")] ?? false;
export const selectAllAspirantsError = (state: RootState) =>
  state.aspirants.error[buildKey("aspirants/getAllAspirants")] ?? null;

export const selectOfficeCategories = (state: RootState) =>
  state.aspirants.cache[buildKey("aspirants/getOfficeCategories")] as { categories: Array<{ value: string; label: string }> } | undefined;
export const selectOfficeCategoriesLoading = (state: RootState) =>
  state.aspirants.loading[buildKey("aspirants/getOfficeCategories")] ?? false;

export const selectAspirantsByParty = (partyId: string) => (state: RootState) =>
  state.aspirants.cache[buildKey("aspirants/getAspirantsByParty", partyId)] as any[] | undefined;
export const selectAspirantsByPartyLoading = (partyId: string) => (state: RootState) =>
  state.aspirants.loading[buildKey("aspirants/getAspirantsByParty", partyId)] ?? false;

export const selectAspirantsByElection = (electionId: string) => (state: RootState) =>
  state.aspirants.cache[buildKey("aspirants/getAspirantsByElection", electionId)] as any[] | undefined;
export const selectAspirantsByElectionLoading = (electionId: string) => (state: RootState) =>
  state.aspirants.loading[buildKey("aspirants/getAspirantsByElection", electionId)] ?? false;

export const selectAspirantsByElectionAndOffice = (
  electionId: string,
  office: string
) => (state: RootState) =>
  state.aspirants.cache[
    buildKey("aspirants/getAspirantsByElectionAndOffice", { electionId, office })
  ] as any[] | undefined;
export const selectAspirantsByElectionAndOfficeLoading = (
  electionId: string,
  office: string
) => (state: RootState) =>
  state.aspirants.loading[
    buildKey("aspirants/getAspirantsByElectionAndOffice", { electionId, office })
  ] ?? false;

export const selectAspirantById = (id: string) => (state: RootState) =>
  state.aspirants.cache[buildKey("aspirants/getAspirantById", id)] as any | undefined;
export const selectAspirantByIdLoading = (id: string) => (state: RootState) =>
  state.aspirants.loading[buildKey("aspirants/getAspirantById", id)] ?? false;

// Generic
export const selectByKey = (key: string) => (state: RootState) => state.aspirants.cache[key];
export const selectLoadingByKey = (key: string) => (state: RootState) =>
  state.aspirants.loading[key] ?? false;
export const selectErrorByKey = (key: string) => (state: RootState) =>
  state.aspirants.error[key] ?? null;
