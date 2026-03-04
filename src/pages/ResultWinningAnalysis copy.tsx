import { useState } from "react";
import "./ResultWinningAnalysis.css";

const WINNING_PARTIES = [
  {
    id: 1,
    name: "Peoples Democratic Party",
    short: "PDP",
    votes: "124,560",
    pct: "42%",
    status: "Leading",
    color: "#0ea5e9",
    image: "https://placehold.co/56x56/0ea5e9/fff?text=PDP",
  },
  {
    id: 2,
    name: "All Progressives Congress",
    short: "APC",
    votes: "98,340",
    pct: "33%",
    status: "Runner-up",
    color: "#22c55e",
    image: "https://placehold.co/56x56/22c55e/fff?text=APC",
  },
  {
    id: 3,
    name: "Labour Party",
    short: "LP",
    votes: "45,200",
    pct: "15%",
    status: "Third",
    color: "#eab308",
    image: "https://placehold.co/56x56/eab308/fff?text=LP",
  },
  {
    id: 4,
    name: "New Nigeria Peoples Party",
    short: "NNPP",
    votes: "28,100",
    pct: "10%",
    status: "Fourth",
    color: "#ef4444",
    image: "https://placehold.co/56x56/ef4444/fff?text=NNPP",
  },
];

const CHART_DAYS = ["Tue", "Wed", "Thu", "Fri", "Sat", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CHART_VALUES = [65, 82, 45, 78, 90, 95, 70, 88, 62, 85, 72];
const HIGHLIGHT_INDEX = 5; // "Mon" in the sequence

function PartyThumb({ party }: { party: (typeof WINNING_PARTIES)[0] }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div
      className="result-list__thumb"
      style={{ background: party.color, color: "#fff" }}
      title={party.name}
    >
      {!imgError ? (
        <img src={party.image} alt={party.short} onError={() => setImgError(true)} />
      ) : (
        <span>{party.short}</span>
      )}
    </div>
  );
}

export default function ResultWinningAnalysis() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  const maxChartVal = Math.max(...CHART_VALUES);

  return (
    <div className="result-page-wrap">
      <div>
        <p className="dash-page__breadcrumb">EMS / Result Winning Analysis</p>
        <h1 className="dash-page__title">Result Winning Analysis</h1>
      </div>

      <div className="result-page">
        {/* Left: Winning Parties list */}
        <aside className="result-list">
          <h2 className="result-list__title">Winning Parties</h2>
          {WINNING_PARTIES.map((party) => (
            <div key={party.id} className="result-list__item">
              <PartyThumb party={party} />
              <div className="result-list__info">
                <p className="result-list__name">{party.name}</p>
                <p className="result-list__meta">
                  {party.votes} votes · {party.pct}
                </p>
                <span className="result-list__status">{party.status}</span>
              </div>
            </div>
          ))}
        </aside>

        {/* Right: Chart section */}
        <section className="result-chart">
          <div className="result-chart__header">
            <div className="result-chart__period">
              <button
                type="button"
                className={`result-chart__period-btn ${period === "week" ? "result-chart__period-btn--active" : ""}`}
                onClick={() => setPeriod("week")}
              >
                Week
              </button>
              <button
                type="button"
                className={`result-chart__period-btn ${period === "month" ? "result-chart__period-btn--active" : ""}`}
                onClick={() => setPeriod("month")}
              >
                Month
              </button>
              <button
                type="button"
                className={`result-chart__period-btn ${period === "year" ? "result-chart__period-btn--active" : ""}`}
                onClick={() => setPeriod("year")}
              >
                Year
              </button>
            </div>
          </div>

          <span className="result-chart__label">
            {period === "week" ? "Weekly votes" : period === "month" ? "Monthly votes" : "Yearly votes"}
          </span>

          <div className="result-chart__stats">
            <div className="result-chart__stat">
              <span className="result-chart__stat-dot result-chart__stat-dot--cream" />
              <div>
                <div className="result-chart__stat-label">Total Votes</div>
                <div className="result-chart__stat-value">296,200</div>
              </div>
            </div>
            <div className="result-chart__stat">
              <span className="result-chart__stat-dot result-chart__stat-dot--amber" />
              <div>
                <div className="result-chart__stat-label">Valid Votes</div>
                <div className="result-chart__stat-value">287,450</div>
              </div>
            </div>
          </div>

          <div className="result-chart__chart">
            <div className="result-chart__bars">
              {CHART_DAYS.map((day, i) => (
                <div key={`${day}-${i}`} className="result-chart__bar-wrap">
                  <div
                    className={`result-chart__bar ${
                      i === HIGHLIGHT_INDEX ? "result-chart__bar--highlight" : "result-chart__bar--default"
                    }`}
                    style={{
                      height: `${(CHART_VALUES[i] / maxChartVal) * 100}%`,
                    }}
                  />
                  <span className="result-chart__axis">{day}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
