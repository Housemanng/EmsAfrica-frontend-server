import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
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

const MOCK_RECENT_REPORTS = [
  { id: 1, name: "Abia North - Accreditation Summary", location: "Abia", date: "21st Feb, 2026", status: "Completed" },
  { id: 2, name: "Lagos Central - Voting Status", location: "Lagos", date: "20th Feb, 2026", status: "In Progress" },
  { id: 3, name: "Kano - Result Collation", location: "Kano", date: "19th Feb, 2026", status: "Completed" },
  { id: 4, name: "Rivers State - Incident Report", location: "Rivers", date: "18th Feb, 2026", status: "Pending" },
];

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const organizationName = useSelector((state: RootState) => state.auth.user?.organization?.name);
  const stateName = useSelector((state: RootState) => state.auth.user?.state?.name);

  const filteredReports = MOCK_RECENT_REPORTS.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.location.toLowerCase().includes(search.toLowerCase())
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
          <h3 className="dash-card__title">Polling Units</h3>
          <p className="dash-card__value">1,247</p>
          <p className="dash-card__meta">Last Update: 2hrs ago</p>
          <div className="dash-card__row">
            <span />
            <IconChevronCard />
          </div>
        </div>
        <div className="dash-card">
          <h3 className="dash-card__title">Accredited Voters</h3>
          <p className="dash-card__value">847,203</p>
          <p className="dash-card__meta dash-card__meta--muted">Active this election</p>
          <div className="dash-card__row">
            <span />
            <IconChevronCard />
          </div>
        </div>
        <div className="dash-card dash-card--banner">
          <div>
            <h3 className="dash-card__title">Monitor Elections on the GO!</h3>
            <p className="dash-card__meta">Access EMS from your mobile device</p>
          </div>
          <button type="button" className="dash-card__cta">
            Download Mobile App
          </button>
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
          <h2 className="dash-table-section__title">All States</h2>
          <div className="dash-table-section__tools">
            <div className="dash-table-section__search">
              <IconSearch />
              <input
                type="text"
                placeholder="Search reports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="button" className="dash-page__btn dash-page__btn--outline">
              Filter by
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="dash-table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th>State name</th>
                <th>Location</th>
                <th>Date Added</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <div className="dash-table__product">
                      <div className="dash-table__thumb">RP</div>
                      {report.name}
                    </div>
                  </td>
                  <td>{report.location}</td>
                  <td>{report.date}</td>
                  <td>
                    <span
                      className={`dash-table__status ${
                        report.status === "Pending" ? "dash-table__status--warning" : ""
                      }`}
                    >
                      {report.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
