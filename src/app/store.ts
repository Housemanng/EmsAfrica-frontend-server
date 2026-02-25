import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import { userReducer } from "../features/user/userSlice";
import { adminReducer } from "../features/admin/adminSlice";
import { resultsReducer } from "../features/results/resultsSlice";
import { aspirantReducer } from "../features/aspirants/aspirantSlice";
import { electionReducer } from "../features/elections/electionSlice";
import { wardReducer } from "../features/wards/wardSlice";
import { lgaReducer } from "../features/lgas/lgaSlice";
import { pollingUnitReducer } from "../features/pollingUnits/pollingUnitSlice";
import { resultSheetReducer } from "../features/resultSheets/resultSheetSlice";
import { votingReducer } from "../features/voting/votingSlice";
import { stateReducer } from "../features/states/stateSlice";
import { presenceReducer } from "../features/presence/presenceSlice";
import { reportReducer } from "../features/reports/reportSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    admin: adminReducer,
    results: resultsReducer,
    aspirants: aspirantReducer,
    elections: electionReducer,
    wards: wardReducer,
    lgas: lgaReducer,
    states: stateReducer,
    pollingUnits: pollingUnitReducer,
    resultSheets: resultSheetReducer,
    voting: votingReducer,
    user: userReducer,
    presence: presenceReducer,
    reports: reportReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
