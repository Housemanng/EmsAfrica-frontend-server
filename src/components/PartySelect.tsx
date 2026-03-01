import { useState, useRef, useEffect } from "react";
import "./PartySelect.css";

export interface Party {
  _id: string;
  name: string;
  acronym: string;
  logo?: string;
  color?: string;
}

interface PartySelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (partyId: string) => void;
  parties: Party[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

function PartyOption({ party, isSelected }: { party: Party; isSelected: boolean }) {
  return (
    <div className="party-select__option-content">
      <div className="party-select__option-logo">
        {party.logo ? (
          <img src={party.logo} alt="" />
        ) : (
          <span className="party-select__option-initials">
            {(party.acronym ?? party.name?.slice(0, 2) ?? "?").slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <div className="party-select__option-text">
        <span className="party-select__option-name">{party.name}</span>
        <span className="party-select__option-acronym">({(party.acronym ?? "").toUpperCase()})</span>
      </div>
    </div>
  );
}

export default function PartySelect({
  id,
  label,
  value,
  onChange,
  parties,
  placeholder = "Select party...",
  required = false,
  disabled = false,
  loading = false,
}: PartySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedParty = parties.find((p) => p._id === value);

  const filtered = parties.filter(
    (p) =>
      (p.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.acronym ?? "").toLowerCase().includes(search.toLowerCase())
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

  const handleSelect = (party: Party) => {
    onChange(party._id);
    setSearch("");
    setIsOpen(false);
  };

  return (
    <div className="party-select" ref={containerRef}>
      <label htmlFor={id}>{label}</label>
      <div
        className={`party-select__trigger ${isOpen ? "party-select__trigger--open" : ""} ${disabled ? "party-select__trigger--disabled" : ""}`}
        onClick={() => !disabled && !loading && setIsOpen((o) => !o)}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-required={required}
      >
        {loading ? (
          <span className="party-select__loading">Loading parties...</span>
        ) : isOpen ? (
          <input
            type="text"
            className="party-select__input"
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
          <span className="party-select__value">
            {selectedParty ? (
              <PartyOption party={selectedParty} isSelected />
            ) : (
              <span className="party-select__placeholder">{placeholder}</span>
            )}
          </span>
        )}
        <span className="party-select__chevron">▼</span>
      </div>
      {isOpen && (
        <ul className="party-select__dropdown" role="listbox">
          {filtered.length === 0 ? (
            <li className="party-select__option party-select__option--empty">No parties found</li>
          ) : (
            filtered.map((party) => (
              <li
                key={party._id}
                className={`party-select__option ${party._id === value ? "party-select__option--selected" : ""}`}
                role="option"
                aria-selected={party._id === value}
                onClick={() => handleSelect(party)}
              >
                <PartyOption party={party} isSelected={party._id === value} />
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
