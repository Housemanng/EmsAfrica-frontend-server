import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../app/store";
import {
  createReport,
  REPORT_CATEGORIES,
  REPORT_CATEGORY_LABELS,
  REPORT_ITEMS_BY_CATEGORY,
  type ReportCategory,
} from "../features/reports/reportApi";

export type ReportLocationBody = {
  wardId?: string;
  lgaId?: string;
  stateId?: string;
};

type ResultsReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  electionsList: Array<{ _id: string; name: string }>;
  locationBody: ReportLocationBody;
};

export function ResultsReportModal({
  isOpen,
  onClose,
  electionsList,
  locationBody,
}: ResultsReportModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [reportElectionId, setReportElectionId] = useState("");
  const [reportCategory, setReportCategory] = useState<ReportCategory | "">("");
  const [reportSelectedItems, setReportSelectedItems] = useState<string[]>([]);
  const [reportNotes, setReportNotes] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportMsg, setReportMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const first = electionsList[0]?._id ?? "";
      setReportElectionId(first);
      setReportCategory("");
      setReportSelectedItems([]);
      setReportNotes("");
      setReportMsg(null);
    }
  }, [isOpen, electionsList]);

  const handleReportItemToggle = (item: string) => {
    setReportSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = async () => {
    if (!reportElectionId) {
      setReportMsg({ type: "error", text: "Please select an election." });
      return;
    }
    if (!reportCategory) {
      setReportMsg({ type: "error", text: "Please select a category." });
      return;
    }
    if (reportSelectedItems.length === 0) {
      setReportMsg({ type: "error", text: "Please select at least one item." });
      return;
    }

    setReportSubmitting(true);
    setReportMsg(null);
    try {
      await dispatch(
        createReport({
          electionId: reportElectionId,
          category: reportCategory as ReportCategory,
          items: reportSelectedItems,
          notes: reportNotes.trim() || undefined,
          ...locationBody,
        })
      ).unwrap();
      setReportMsg({ type: "success", text: "Report submitted successfully." });
      setReportCategory("");
      setReportSelectedItems([]);
      setReportNotes("");
    } catch (err: unknown) {
      const msg =
        typeof err === "string" ? err : (err as { message?: string })?.message ?? "Failed to submit report.";
      setReportMsg({ type: "error", text: msg });
    } finally {
      setReportSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="results-report-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      onClick={onClose}
    >
      <div className="results-report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="results-report-modal__header">
          <div className="results-report-modal__header-left">
            <div className="results-report-modal__header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <h2 id="report-modal-title" className="results-report-modal__title">
                Incident Report
              </h2>
              <p className="results-report-modal__subtitle">
                Select the incident type(s) and submit a report for your assigned location
              </p>
            </div>
          </div>
          <button
            type="button"
            className="results-report-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="results-report-modal__body">
          {electionsList.length > 1 && (
            <div className="results-report-modal__field">
              <label className="results-report-modal__label" htmlFor="report-election-select">
                Election
              </label>
              <select
                id="report-election-select"
                className="results-report-modal__select"
                value={reportElectionId}
                onChange={(e) => setReportElectionId(e.target.value)}
              >
                <option value="">— Select election —</option>
                {electionsList.map((el) => (
                  <option key={el._id} value={el._id}>
                    {el.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="results-report-modal__categories">
            {REPORT_CATEGORIES.map((cat) => {
              const items = REPORT_ITEMS_BY_CATEGORY[cat];
              const isActive = reportCategory === cat;
              return (
                <div
                  key={cat}
                  className={`results-report-modal__category${isActive ? " results-report-modal__category--active" : ""}`}
                >
                  <button
                    type="button"
                    className="results-report-modal__category-header"
                    onClick={() => {
                      if (isActive) {
                        setReportCategory("");
                        setReportSelectedItems([]);
                      } else {
                        setReportCategory(cat);
                        setReportSelectedItems([]);
                      }
                    }}
                  >
                    <span className="results-report-modal__category-label">
                      {REPORT_CATEGORY_LABELS[cat]}
                    </span>
                    <span className="results-report-modal__category-chevron">
                      {isActive ? "▲" : "▼"}
                    </span>
                  </button>
                  {isActive && (
                    <div className="results-report-modal__items">
                      {items.map((item) => {
                        const checked = reportSelectedItems.includes(item);
                        return (
                          <label
                            key={item}
                            className={`results-report-modal__item${checked ? " results-report-modal__item--checked" : ""}`}
                          >
                            <input
                              type="checkbox"
                              className="results-report-modal__checkbox"
                              checked={checked}
                              onChange={() => handleReportItemToggle(item)}
                            />
                            <span className="results-report-modal__item-text">{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="results-report-modal__field" style={{ marginTop: "1rem" }}>
            <label className="results-report-modal__label" htmlFor="report-notes">
              Additional notes <span style={{ fontWeight: 400, color: "#9ca3af" }}>(optional)</span>
            </label>
            <textarea
              id="report-notes"
              className="results-report-modal__textarea"
              rows={3}
              placeholder="Describe what happened…"
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
            />
          </div>

          {reportSelectedItems.length > 0 && (
            <div className="results-report-modal__selected-summary">
              <span className="results-report-modal__selected-label">Selected:</span>
              <div className="results-report-modal__selected-tags">
                {reportSelectedItems.map((item) => (
                  <span key={item} className="results-report-modal__selected-tag">
                    {item}
                    <button
                      type="button"
                      className="results-report-modal__selected-tag-remove"
                      onClick={() => handleReportItemToggle(item)}
                      aria-label={`Remove ${item}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {reportMsg && (
            <p className={`results-report-modal__msg results-report-modal__msg--${reportMsg.type}`}>
              {reportMsg.text}
            </p>
          )}
        </div>

        <div className="results-report-modal__footer">
          <button
            type="button"
            className="results-btn results-report-modal__cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="results-btn results-btn--primary results-report-modal__submit-btn"
            onClick={handleSubmit}
            disabled={reportSubmitting || reportSelectedItems.length === 0 || !reportElectionId}
          >
            {reportSubmitting
              ? "Submitting…"
              : `Submit Report${reportSelectedItems.length > 0 ? ` (${reportSelectedItems.length})` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
