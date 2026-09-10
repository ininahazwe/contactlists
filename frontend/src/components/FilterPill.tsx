import { useEffect, useRef, useState } from "react";
import { IconChevron } from "./Icons";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface Props {
  label: string;
  icon?: React.ReactNode;
  options: FilterOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  /** Label for the "all" option, at the top of the list. */
  allLabel?: string;
}

/**
 * Pill filter with a dropdown menu. The pill turns dark once a criterion
 * is set and shows the selected value instead of its label, so a glance
 * is enough to see what's filtering the list.
 */
export default function FilterPill({
  label,
  icon,
  options,
  value,
  onChange,
  allLabel = "All",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div className={`filter${open ? " is-open" : ""}`} ref={ref}>
      <button
        className={`filter-btn${value ? " is-set" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {icon}
        <span>{selected ? selected.label : label}</span>
        <IconChevron className="i chev" />
      </button>

      {open && (
        <div className="filter-menu" role="listbox">
          <button
            className={`filter-opt${!value ? " is-sel" : ""}`}
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            {allLabel}
          </button>
          {options.map((o) => (
            <button
              key={o.value}
              className={`filter-opt${o.value === value ? " is-sel" : ""}`}
              onClick={() => {
                onChange(o.value === value ? null : o.value);
                setOpen(false);
              }}
            >
              <span>{o.label}</span>
              {o.count !== undefined && <small>{o.count.toLocaleString("en-US")}</small>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
