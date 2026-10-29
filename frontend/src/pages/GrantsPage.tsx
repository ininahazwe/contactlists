import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import Avatar from "../components/Avatar";
import { IconCash, IconChevron, IconGrid, IconList, IconPlus, IconSearch } from "../components/Icons";
import GrantModal from "../components/GrantModal";
import {
  budgetText,
  Donor,
  GRANT_STATUS_BADGE,
  GRANT_STATUS_LABELS,
  Grant,
  GrantStatus,
  grantTitle,
  periodText,
} from "../grants";

const STATUSES: GrantStatus[] = ["ongoing", "ended", "unknown"];

type View = "cards" | "list";
const VIEW_KEY = "cp.grantsView";

function readStoredView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "cards";
  } catch {
    return "cards";
  }
}

export default function GrantsPage() {
  const [items, setItems] = useState<Grant[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState<GrantStatus | "">("");
  const [view, setView] = useState<View>(readStoredView);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [open, setOpen] = useState<Grant | "new" | null>(null);
  // Donor groups a person opened by hand, kept open across a refetch even
  // when no filter is active. While a filter IS active, groups with a
  // match are shown open regardless of this set -- see `isOpen` below.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set("search", filter);
    if (status) params.set("status", status);
    Promise.all([
      api.get<{ items: Grant[] }>(`/grants?${params.toString()}`),
      api.get<{ items: Donor[] }>("/grants/donors"),
    ])
      .then(([grants, donorList]) => {
        if (!alive) return;
        setItems(grants.items);
        setDonors(donorList.items);
        setError(null);
      })
      .catch((err) => alive && setError(err instanceof Error ? err.message : "Could not load grants"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, status]);

  // Client-side debounce on free text, same pattern as the other search pages.
  useEffect(() => {
    const t = setTimeout(() => setRefresh((n) => n + 1), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  function changeView(v: View) {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* private mode: keep the preference in memory only */
    }
  }

  const grouped = useMemo(() => {
    const byDonor = new Map<string, Grant[]>();
    for (const g of items) {
      const list = byDonor.get(g.donor_name) ?? [];
      list.push(g);
      byDonor.set(g.donor_name, list);
    }
    return [...byDonor.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  const filtering = filter.trim() !== "" || status !== "";

  function toggle(donorName: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(donorName)) next.delete(donorName);
      else next.add(donorName);
      return next;
    });
  }

  function GrantsList({ grants }: { grants: Grant[] }) {
    return (
      <div className="list">
        {grants.map((g) => (
          <div
            key={g.id}
            className="row row-grid"
            style={{ gridTemplateColumns: "1fr auto minmax(140px, 220px)", gap: 14, cursor: "pointer" }}
            onClick={() => setOpen(g)}
          >
            <span className="row-main">
              <span className="row-name" style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span
                  style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {grantTitle(g)}
                </span>
                {g.grant_label && g.project_name && (
                  <span className="muted" style={{ fontWeight: 400, flex: "none" }}>
                    {g.grant_label}
                  </span>
                )}
              </span>
              <span className="row-sub" style={{ display: "block" }}>
                {[g.implemented_by, periodText(g), g.reporting_cycle].filter(Boolean).join(" · ")}
              </span>
            </span>
            <span className={GRANT_STATUS_BADGE[g.status]}>{GRANT_STATUS_LABELS[g.status]}</span>
            <span className="row-cell row-cell--sm">{budgetText(g)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div className="crumbs">
          <span className="crumb">
            <IconCash />
            Grants
          </span>
          <span className="crumb crumb-muted">Projects</span>
        </div>
        <div className="title-row">
          <div>
            <h1 className="title">Donors and funded projects</h1>
            <p className="title-sub">
              {loading ? "Loading..." : `${items.length} projects/grants across ${grouped.length} donors`}
            </p>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => setOpen("new")}>
              <IconPlus />
              Grant
            </button>
          </div>
        </div>
      </div>

      <section className="card search-panel">
        <div className="search-row">
          <div className="search-field">
            <IconSearch className="i search-ico" />
            <input
              className="search-input"
              placeholder="Search donor, project, objectives..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="seg">
            <button
              type="button"
              className={`seg-btn${status === "" ? " is-active" : ""}`}
              onClick={() => setStatus("")}
            >
              All
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                className={`seg-btn${status === s ? " is-active" : ""}`}
                onClick={() => setStatus(s)}
              >
                {GRANT_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="results-tools" style={{ marginTop: 14, justifyContent: "flex-end" }}>
        <div className="seg" role="group" aria-label="Result display">
          <button
            className={`seg-btn${view === "cards" ? " is-active" : ""}`}
            onClick={() => changeView("cards")}
            aria-pressed={view === "cards"}
          >
            <IconGrid />
            Cards
          </button>
          <button
            className={`seg-btn${view === "list" ? " is-active" : ""}`}
            onClick={() => changeView("list")}
            aria-pressed={view === "list"}
          >
            <IconList />
            List
          </button>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading && items.length === 0 && <div className="skeleton" style={{ height: 200 }} />}
      {!loading && items.length === 0 && <p className="empty">No project matches this filter.</p>}

      {view === "list" &&
        grouped.map(([donorName, grants]) => {
          // While filtering, every remaining group matched the query, so it
          // opens on its own -- no need to also have expanded it by hand.
          const isOpen = filtering || expanded.has(donorName);
          return (
            <section className="card donor-group" key={donorName}>
              <button
                type="button"
                className={`card-head donor-group-head${isOpen ? " is-open" : ""}`}
                onClick={() => toggle(donorName)}
                aria-expanded={isOpen}
              >
                <h2 className="card-title">{donorName}</h2>
                <span className="muted">
                  {grants.length} project{grants.length > 1 ? "s" : ""}
                </span>
                <IconChevron className="i chev" />
              </button>
              {isOpen && <GrantsList grants={grants} />}
            </section>
          );
        })}

      {view === "cards" && (
        <div className="cards-grid">
          {grouped.map(([donorName, grants]) => {
            const isOpen = filtering || expanded.has(donorName);
            const ongoing = grants.filter((g) => g.status === "ongoing").length;
            return (
              <div key={donorName} style={{ display: "contents" }}>
                <button
                  className={`mini card${isOpen ? " is-open" : ""}`}
                  onClick={() => toggle(donorName)}
                  aria-expanded={isOpen}
                  title={`${isOpen ? "Collapse" : "Expand"} ${donorName}`}
                >
                  <span className="mini-top">
                    <Avatar name={donorName} size="md" tone="teal" />
                    <span style={{ minWidth: 0 }}>
                      <span className="mini-name">{donorName}</span>
                      <span className="mini-sub">
                        {grants.length} project{grants.length > 1 ? "s" : ""}
                      </span>
                    </span>
                    <IconChevron className="i chev" />
                  </span>
                  <span className="mini-foot">
                    <span className="mini-meta">
                      <span className="badge badge--mint">{ongoing} ongoing</span>
                    </span>
                  </span>
                </button>
                {isOpen && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <GrantsList grants={grants} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {open !== null && (
        <GrantModal
          grant={open === "new" ? null : open}
          donors={donors}
          onClose={() => setOpen(null)}
          onChanged={() => setRefresh((n) => n + 1)}
        />
      )}
    </>
  );
}
