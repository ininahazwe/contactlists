import { useEffect, useRef, useState } from "react";
import { IconClose, IconSearch } from "./Icons";

interface Props<T> {
  placeholder: string;
  value: T | null;
  onChange: (item: T | null) => void;
  search: (query: string) => Promise<T[]>;
  getId: (item: T) => number;
  getLabel: (item: T) => string;
  getSub?: (item: T) => string | null | undefined;
}

/**
 * Single-item search-to-select field. Used where a form needs one
 * existing organization or event picked out of a list too long for a
 * plain <select> (the directory runs into the thousands of contacts and
 * hundreds of organizations).
 */
export default function EntityPicker<T>({
  placeholder,
  value,
  onChange,
  search,
  getId,
  getLabel,
  getSub,
}: Props<T>) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounce.current = setTimeout(() => {
      setLoading(true);
      search(query.trim())
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query, search]);

  if (value) {
    return (
      <div className="badge badge--teal" style={{ padding: "8px 12px", fontSize: 14 }}>
        <span>{getLabel(value)}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Clear selection"
          style={{
            display: "inline-flex",
            marginLeft: 8,
            fontSize: 12,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "inherit",
          }}
        >
          <IconClose className="i" />
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div className="search-field" style={{ marginBottom: 0 }}>
        <IconSearch className="i search-ico" />
        <input
          className="search-input"
          style={{ height: 44 }}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && query.trim() && (
        <div className="filter-menu" style={{ position: "absolute", top: "100%", zIndex: 5 }}>
          {loading && (
            <div className="filter-opt" style={{ cursor: "default" }}>
              Searching...
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="filter-opt" style={{ cursor: "default" }}>
              No match
            </div>
          )}
          {!loading &&
            results.map((item) => (
              <button
                key={getId(item)}
                className="filter-opt"
                onClick={() => {
                  onChange(item);
                  setQuery("");
                  setResults([]);
                  setOpen(false);
                }}
              >
                <span>
                  {getLabel(item)}
                  {getSub?.(item) && <small style={{ marginLeft: 6 }}>{getSub(item)}</small>}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
