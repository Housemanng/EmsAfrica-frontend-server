import "./ShareResultModal.css";

export type ShareResultAspirant = {
  name: string;
  partyCode?: string;
  votes: number;
  positionLabel?: string;
};

type ShareResultModalProps = {
  isOpen: boolean;
  onClose: () => void;
  electionName: string;
  locationLabel: string;
  locationName: string;
  aspirants: ShareResultAspirant[];
  totalVotes: number;
  generatedAt: string;
};

export default function ShareResultModal({
  isOpen,
  onClose,
  electionName,
  locationLabel,
  locationName,
  aspirants,
  totalVotes,
  generatedAt,
}: ShareResultModalProps) {
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="share-result-backdrop" onClick={onClose}>
      <div
        className="share-result-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="share-result-modal__header">
          <h3 className="share-result-modal__title">Share / Print Result</h3>
          <button
            type="button"
            className="share-result-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="share-result-modal__preview">
          <div className="share-print">
            <div className="share-print__head">
              <div className="share-print__logo">EMS</div>
              <div className="share-print__election">{electionName}</div>
              <div className="share-print__meta">
                {locationLabel}: {locationName} · Generated {generatedAt}
              </div>
            </div>
            <div className="share-print__body">
              <table className="share-print__table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Aspirant</th>
                    <th style={{ textAlign: "right" }}>Votes</th>
                  </tr>
                </thead>
                <tbody>
                  {aspirants.map((a, i) => (
                    <tr
                      key={`${a.name}-${i}`}
                      className={a.positionLabel === "1st" ? "share-print__row--leading" : ""}
                    >
                      <td>{a.positionLabel ?? i + 1}</td>
                      <td>
                        {a.partyCode && (
                          <span className="share-print__party">{a.partyCode}</span>
                        )}
                        {a.name}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {a.votes.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="share-print__total">
                Total Votes: {totalVotes.toLocaleString()}
              </div>
            </div>
            <div className="share-print__footer">
              Election Management System · Official Result Sheet
            </div>
          </div>
        </div>
        <div className="share-result-modal__actions">
          <button
            type="button"
            className="results-btn results-btn--outline"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="results-btn results-btn--primary"
            onClick={handlePrint}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ flexShrink: 0 }}>
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
            Print / Share
          </button>
        </div>
      </div>
    </div>
  );
}
