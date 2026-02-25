import { useState, useRef, useEffect } from "react";
import "./SearchableSelect.css";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
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
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const displayLabel = options.find((o) => o.value === value)?.label ?? value;

  const filtered = options.filter(
    (o) =>
      (o.label ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (o.value ?? "").toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (opt: Option) => {
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
      >
        {isOpen ? (
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
          <span className="searchable-select__value">
            {displayLabel || <span className="searchable-select__placeholder">{placeholder}</span>}
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
                {opt.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
