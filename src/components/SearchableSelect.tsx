import { useState, useRef, useEffect, type ReactNode } from "react";
import "./SearchableSelect.css";

export interface SearchableSelectOption {
  value: string;
  label: string;
  /** With `electionStatus`, shown as main text while status is colored separately */
  primaryLabel?: string;
  /** When set with `primaryLabel`, status is shown in active (green) / concluded (blue) / upcoming (amber) */
  electionStatus?: string;
}

function electionStatusBadgeClass(status: string | undefined): string {
  const s = (status ?? "").toLowerCase();
  if (s === "active") return "searchable-select__option-badge searchable-select__option-badge--active";
  if (s === "concluded") return "searchable-select__option-badge searchable-select__option-badge--concluded";
  if (s === "upcoming") return "searchable-select__option-badge searchable-select__option-badge--upcoming";
  return "searchable-select__option-badge searchable-select__option-badge--muted";
}

function renderOptionVisual(opt: SearchableSelectOption): ReactNode {
  if (opt.electionStatus) {
    const title = opt.primaryLabel ?? opt.label;
    return (
      <span className="searchable-select__option-row">
        <span className="searchable-select__option-title">{title}</span>
        <span className={electionStatusBadgeClass(opt.electionStatus)}>
          ({String(opt.electionStatus).toUpperCase()})
        </span>
      </span>
    );
  }
  return opt.label;
}

interface SearchableSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
}

export default function SearchableSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Search or select...",
  required = false,
  disabled = false,
  searchable = true,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filtered =
    searchable
      ? options.filter(
          (o) =>
            (o.label ?? "").toLowerCase().includes(search.toLowerCase()) ||
            (o.value ?? "").toLowerCase().includes(search.toLowerCase())
        )
      : options;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (opt: SearchableSelectOption) => {
    onChange(opt.value);
    setSearch("");
    setIsOpen(false);
  };

  return (
    <div className="searchable-select" ref={containerRef}>
      <label htmlFor={id}>{label}</label>
      <div
        className={`searchable-select__trigger ${isOpen ? "searchable-select__trigger--open" : ""} ${disabled ? "searchable-select__trigger--disabled" : ""}`}
        onClick={() => !disabled && setIsOpen((o) => !o)}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-required={required}
      >
        {isOpen && searchable ? (
          <input
            type="text"
            className="searchable-select__input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setIsOpen(false);
            }}
            placeholder={placeholder}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="searchable-select__value searchable-select__value--multiline">
            {selectedOption ? (
              renderOptionVisual(selectedOption)
            ) : value ? (
              value
            ) : (
              <span className="searchable-select__placeholder">{placeholder}</span>
            )}
          </span>
        )}
        <span className="searchable-select__chevron">▼</span>
      </div>
      {isOpen && (
        <ul className="searchable-select__dropdown" role="listbox">
          {filtered.length === 0 ? (
            <li className="searchable-select__option searchable-select__option--empty">No matches</li>
          ) : (
            filtered.map((opt) => (
              <li
                key={opt.value}
                className={`searchable-select__option ${opt.value === value ? "searchable-select__option--selected" : ""}`}
                role="option"
                aria-selected={opt.value === value}
                onClick={() => handleSelect(opt)}
              >
                {renderOptionVisual(opt)}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
