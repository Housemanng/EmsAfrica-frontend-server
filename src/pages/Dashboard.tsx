import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../app/store";
import {
  getStatesByOrganizationId,
  selectStatesByOrganizationId,
  selectStatesByOrganizationIdLoading,
  selectStatesByOrganizationIdError,
} from "../features/states";
import "./Dashboard.css";

/* eslint-disable max-len */
const IconChevronCard = () => (
  <svg className="dash-card__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
);
const IconChevronFeature = () => (
  <svg className="dash-feature__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
);
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
);
const IconFile = () => (
  <svg className="dash-feature__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
);
const IconCheck = () => (
  <svg className="dash-feature__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>
);
const IconMapPin = () => (
  <svg className="dash-feature__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);
const IconBarChart = () => (
  <svg className="dash-feature__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
);
/* eslint-enable max-len */

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const [search, setSearch] = useState("");
  const organizationName = useSelector((state: RootState) => state.auth.user?.organization?.name);
  const stateName = useSelector((state: RootState) => state.auth.user?.state?.name);
  const organizationId = useSelector((state: RootState) => state.auth.user?.organization?._id ?? state.auth.user?.organization?.id);
  const orgStates = useSelector(selectStatesByOrganizationId(organizationId ?? ""));
  const orgStatesLoading = useSelector(selectStatesByOrganizationIdLoading(organizationId ?? ""));
  const orgStatesError = useSelector(selectStatesByOrganizationIdError(organizationId ?? ""));

  useEffect(() => {
    if (organizationId) dispatch(getStatesByOrganizationId(organizationId));
  }, [dispatch, organizationId]);

  const filteredStates = (orgStates ?? []).filter(
    (s: { name?: string; code?: string }) =>
      (s.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.code ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dash-page">
      <div className="dash-page__top">
        <div>
          <p className="dash-page__breadcrumb">
            EMS
            {organizationName ? ` / ${organizationName}` : ""}
            {stateName ? ` / ${stateName}` : ""}
            {" / Dashboard"}
          </p>
          <h1 className="dash-page__title">Dashboard</h1>
        </div>
        <div className="dash-page__actions">
          <button type="button" className="dash-page__btn dash-page__btn--outline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Filter date
          </button>
          <button type="button" className="dash-page__btn dash-page__btn--solid">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
        </div>
      </div>

      <div className="dash-cards">
        <div className="dash-card">
          <h3 className="dash-card__title">States</h3>
          <p className="dash-card__value">{(orgStates ?? []).length}</p>
          <p className="dash-card__meta">Under this organization</p>
          <div className="dash-card__row">
            <span />
            <IconChevronCard />
          </div>
        </div>
        <div className="dash-card">
          <h3 className="dash-card__title">Polling Units</h3>
          <p className="dash-card__value">1,247</p>
          <p className="dash-card__meta">Last Update: 2hrs ago</p>
          <div className="dash-card__row">
            <span />
            <IconChevronCard />
          </div>
        </div>
        <div className="dash-card">
          <h3 className="dash-card__title">Wards</h3>
          <p className="dash-card__value">—</p>
          <p className="dash-card__meta dash-card__meta--muted">Coming soon</p>
          <div className="dash-card__row">
            <span />
            <IconChevronCard />
          </div>
        </div>
        <div className="dash-card dash-card--banner">
          <h3 className="dash-card__title">LGa</h3>
          <p className="dash-card__value">—</p>
          <p className="dash-card__meta dash-card__meta--muted">Coming soon</p>
          <div className="dash-card__row">
            <span />
            <IconChevronCard />
          </div>
        </div>
      </div>

      <div className="dash-features">
        <a href="#reports" className="dash-feature">
          <div className="dash-feature__row">
            <IconFile />
            <IconChevronFeature />
          </div>
          <h3 className="dash-feature__title">Reports</h3>
          <p className="dash-feature__desc">Create and view election reports</p>
        </a>
        <a href="#results" className="dash-feature">
          <div className="dash-feature__row">
            <IconBarChart />
            <IconChevronFeature />
          </div>
          <h3 className="dash-feature__title">Results</h3>
          <p className="dash-feature__desc">Collate and manage result sheets</p>
        </a>
        <a href="#accreditation" className="dash-feature">
          <div className="dash-feature__row">
            <IconCheck />
            <IconChevronFeature />
          </div>
          <h3 className="dash-feature__title">Accreditation</h3>
          <p className="dash-feature__desc">Track voter accreditation status</p>
        </a>
        <a href="#polling" className="dash-feature">
          <div className="dash-feature__row">
            <IconMapPin />
            <IconChevronFeature />
          </div>
          <h3 className="dash-feature__title">Polling Units</h3>
          <p className="dash-feature__desc">View and manage polling unit data</p>
        </a>
      </div>

      <section className="dash-table-section">
        <div className="dash-table-section__head">
          <h2 className="dash-table-section__title">
            States under {organizationName ?? "Organization"}
          </h2>
          <div className="dash-table-section__tools">
            <div className="dash-table-section__search">
              <IconSearch />
              <input
                type="text"
                placeholder="Search states..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {orgStatesLoading ? (
          <p className="dash-table-section__meta">Loading states...</p>
        ) : orgStatesError ? (
          <p className="dash-page__error">{orgStatesError}</p>
        ) : (
          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>State name</th>
                  <th>Code</th>
                </tr>
              </thead>
              <tbody>
                {filteredStates.map((s: { _id?: string; name?: string; code?: string }) => (
                  <tr key={s._id ?? s.name ?? s.code ?? ""}>
                    <td>
                      <div className="dash-table__product">
                        <div className="dash-table__thumb">
                          {(s.name ?? "?").slice(0, 2).toUpperCase()}
                        </div>
                        {s.name ?? "—"}
                      </div>
                    </td>
                    <td>{s.code ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredStates.length === 0 && !orgStatesLoading && (
              <p className="dash-table-section__empty">No states found for this organization.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
