import { useState, useRef, useEffect } from "react";
import "./SearchableSelect.css";

interface Option {
  value: string;
  label: string;
}

interface SearchableMultiSelectProps {
  id: string;
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
}

export default function SearchableMultiSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Search or select...",
  disabled = false,
}: SearchableMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter(
    (o) =>
      (o.label ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (o.value ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedItems = value
    .map((v) => {
      const opt = options.find((o) => o.value === v);
      return opt ? { value: opt.value, label: opt.label } : null;
    })
    .filter((x): x is { value: string; label: string } => x != null);


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (optValue: string) => {
    const checked = value.includes(optValue);
    onChange(
      checked ? value.filter((v) => v !== optValue) : [...value, optValue]
    );
  };

  const handleRemove = (e: React.MouseEvent, optValue: string) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optValue));
  };

  return (
    <div className="searchable-select" ref={containerRef}>
      <label htmlFor={id}>{label}</label>
      <div
        className={`searchable-select__trigger ${isOpen ? "searchable-select__trigger--open" : ""} ${disabled ? "searchable-select__trigger--disabled" : ""} ${isOpen && selectedItems.length > 0 ? "searchable-select__trigger--has-selected" : ""}`}
        onClick={() => !disabled && setIsOpen((o) => !o)}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {isOpen ? (
          <div className="searchable-select__open-wrap">
            {selectedItems.length > 0 && (
              <div className="searchable-select__selected-chips">
                {selectedItems.map((item) => (
                  <span key={item.value} className="searchable-select__chip">
                    {item.label}
                    <button
                      type="button"
                      className="searchable-select__chip-remove"
                      onClick={(e) => handleRemove(e, item.value)}
                      aria-label={`Remove ${item.label}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
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
          </div>
        ) : (
          <span className="searchable-select__value">
            {value.length === 0 ? (
              <span className="searchable-select__placeholder">{placeholder}</span>
            ) : (
              <div className="searchable-select__selected-chips">
                {selectedItems.map((item) => (
                  <span key={item.value} className="searchable-select__chip">
                    {item.label}
                  </span>
                ))}
              </div>
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
                className={`searchable-select__option searchable-select__option--multi ${value.includes(opt.value) ? "searchable-select__option--selected" : ""}`}
                role="option"
                aria-selected={value.includes(opt.value)}
                onClick={() => handleToggle(opt.value)}
              >
                <span className="searchable-select__check">{value.includes(opt.value) ? "✓" : ""}</span>
                <span>{opt.label}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
