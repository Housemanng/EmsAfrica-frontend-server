import { useEffect } from "react";
import type { ConstituencyType, ConstituencyCoverageType, ConstituencyForm } from "../features/constituencies/constituencyApi";
import "./ConstituencyModal.css";

interface ConstituencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: ConstituencyForm;
  setForm: React.Dispatch<React.SetStateAction<ConstituencyForm>>;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string;
  editingId?: string | null;
  states: { _id: string; name?: string; code?: string }[];
  lgas: { _id: string; name?: string; code?: string }[];
  wards: { _id: string; name?: string; code?: string }[];
  onStateChange: (stateId: string) => void;
  selectedLgaForWards?: string;
  onLgaChange?: (lgaId: string) => void;
}

const TYPE_LABELS: Record<ConstituencyType, string> = {
  governorship: "Governorship",
  senate: "Senate",
  house_of_rep: "House of Rep",
  state_house_of_assembly: "State Assembly",
  chairmanship: "Chairmanship",
  councillorship: "Councillorship",
};

export default function ConstituencyModal({
  isOpen,
  onClose,
  form,
  setForm,
  onSubmit,
  loading,
  error,
  editingId,
  states,
  lgas,
  wards,
  onStateChange,
  selectedLgaForWards = "",
  onLgaChange,
}: ConstituencyModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCouncillorship = form.type === "councillorship";
  const isChairmanship = form.type === "chairmanship";
  const coverageOptions = isCouncillorship ? wards : lgas;
  const coverageLabel = isCouncillorship ? "Wards" : "LGAs";
  const selectMultiple = !isChairmanship;

  const handleTypeChange = (type: ConstituencyType) => {
    const coverageType: ConstituencyCoverageType = type === "councillorship" ? "wards" : "lga";
    setForm((f) => ({ ...f, type, coverageType, coverageIds: [] }));
    if (type === "councillorship" && form.state) onStateChange(form.state);
    else if (form.state) onStateChange(form.state);
  };

  const handleStateChange = (stateId: string) => {
    setForm((f) => ({ ...f, state: stateId, coverageIds: [] }));
    onStateChange(stateId);
  };

  const handleCoverageToggle = (id: string) => {
    setForm((f) => {
      const ids = f.coverageIds ?? [];
      const exists = ids.includes(id);
      if (isChairmanship) return { ...f, coverageIds: exists ? [] : [id] };
      if (exists) return { ...f, coverageIds: ids.filter((x) => x !== id) };
      return { ...f, coverageIds: [...ids, id] };
    });
  };

  return (
    <div className="constituency-modal__backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="constituency-modal">
        <div className="constituency-modal__head">
          <h2 className="constituency-modal__title">
            {editingId ? "Edit Constituency" : "Create Constituency"}
          </h2>
          <button type="button" className="constituency-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={onSubmit} className="constituency-modal__body">
          {error && (
            <div className="constituency-modal__error" role="alert">
              {error}
            </div>
          )}

          <div className="constituency-modal__field">
            <label htmlFor="const-name">Name</label>
            <input
              id="const-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Imo East Senatorial District"
              required
            />
          </div>

          <div className="constituency-modal__field">
            <label htmlFor="const-type">Type</label>
            <select
              id="const-type"
              value={form.type}
              onChange={(e) => handleTypeChange(e.target.value as ConstituencyType)}
              required
            >
              {Object.entries(TYPE_LABELS).map(([v, lbl]) => (
                <option key={v} value={v}>
                  {lbl}
                </option>
              ))}
            </select>
          </div>

          <div className="constituency-modal__field">
            <label htmlFor="const-state">State</label>
            <select
              id="const-state"
              value={form.state}
              onChange={(e) => handleStateChange(e.target.value)}
              required
            >
              <option value="">Select state</option>
              {states.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name ?? s.code ?? s._id}
                </option>
              ))}
            </select>
          </div>

          {form.state && (
            <div className="constituency-modal__field">
              <label>
                {coverageLabel} {selectMultiple ? "(select one or more)" : isChairmanship ? "(select one LGA)" : ""}
              </label>
              {isCouncillorship && onLgaChange && (
                <select
                  value={selectedLgaForWards}
                  onChange={(e) => onLgaChange(e.target.value)}
                >
                  <option value="">Select LGA to show wards</option>
                  {lgas.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.name ?? l.code ?? l._id}
                    </option>
                  ))}
                </select>
              )}
              <div className="constituency-modal__coverage-box">
                {coverageOptions.length === 0 ? (
                  <p className="constituency-modal__coverage-empty">
                    {isCouncillorship && !form.state
                      ? "Select state first"
                      : isCouncillorship
                        ? "Select LGA to load wards"
                        : "No options in this state"}
                  </p>
                ) : (
                  coverageOptions.map((opt) => (
                    <label key={opt._id} className="constituency-modal__coverage-option">
                      <input
                        type={selectMultiple ? "checkbox" : "radio"}
                        name="coverage"
                        checked={(form.coverageIds ?? []).includes(opt._id)}
                        onChange={() => handleCoverageToggle(opt._id)}
                      />
                      <span>{opt.name ?? opt.code ?? opt._id}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="constituency-modal__footer">
            <button type="button" className="constituency-modal__btn constituency-modal__btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="constituency-modal__btn constituency-modal__btn--primary" disabled={loading}>
              {loading ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
