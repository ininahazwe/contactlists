import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import Avatar from "../components/Avatar";
import { IconTimeline, IconUsers } from "../components/Icons";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
  AuditAction,
  AuditEntry,
  AuditSummary,
  ManagedUser,
} from "../types";

const ACTIONS: AuditAction[] = ["create", "update", "delete", "read", "login"];

const ACTION_TONE: Record<AuditAction, string> = {
  create: " badge--lime",
  update: " badge--teal",
  delete: " badge--ink",
  login: " badge--mint",
  read: "",
};

const PAGE_SIZE = 50;

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function formatDateTime(value: string): string {
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** MySQL JSON columns come back parsed, but a string is handled too. */
function asObject(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return typeof value === "object" ? (value as Record<string, unknown>) : null;
}

/**
 * Which fields an edit actually touched. Far more useful in a list than
 * two blocks of JSON the reader has to compare by eye.
 */
function changedFields(entry: AuditEntry): string[] {
  const before = asObject(entry.before_data);
  const after = asObject(entry.after_data);
  if (!before || !after) return [];
  return Object.keys(after).filter(
    (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key])
  );
}

export default function AdminActivityPage() {
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [people, setPeople] = useState<ManagedUser[]>([]);

  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState("");
  const [action, setAction] = useState<AuditAction | "">("");
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const buildQuery = useCallback(
    (extra: Record<string, string> = {}) => {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (action) params.set("action", action);
      if (userId) params.set("userId", userId);
      Object.entries(extra).forEach(([key, value]) => params.set(key, value));
      return params.toString();
    },
    [from, to, action, userId]
  );

  useEffect(() => {
    api
      .get<{ items: ManagedUser[] }>("/users")
      .then((res) => setPeople(res.items))
      .catch(() => setPeople([]));
  }, []);

  // The filters describe one slice of the trail; the summary and the log
  // are two readings of it, so they are always refreshed together.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      api.get<AuditSummary>(`/audit/summary?${buildQuery()}`),
      api.get<{ items: AuditEntry[]; total: number }>(
        `/audit?${buildQuery({ page: String(page), pageSize: String(PAGE_SIZE) })}`
      ),
    ])
      .then(([summaryRes, listRes]) => {
        if (cancelled) return;
        setSummary(summaryRes);
        setItems(listRes.items);
        setTotal(listRes.total);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [buildQuery, page]);

  function applyFilter(next: () => void) {
    next();
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const countFor = (name: string) =>
    summary?.byAction.find((row) => row.action === name)?.total ?? 0;

  return (
    <>
      <div className="page-head">
        <div className="crumbs">
          <span className="crumb">
            <IconUsers />
            Administration
          </span>
          <span className="crumb crumb-muted">Activity</span>
        </div>
        <div className="title-row">
          <div>
            <h1 className="title">Activity report</h1>
            <p className="title-sub">
              {loading || !summary
                ? "Loading..."
                : `${summary.total} actions by ${summary.activeUsers} ${
                    summary.activeUsers === 1 ? "person" : "people"
                  } over the selected period`}
            </p>
          </div>
        </div>
      </div>

      <section className="card search-panel">
        <div className="form-row">
          <label className="field">
            <span className="label">From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => applyFilter(() => setFrom(e.target.value))}
            />
          </label>
          <label className="field">
            <span className="label">To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => applyFilter(() => setTo(e.target.value))}
            />
          </label>
          <label className="field">
            <span className="label">Person</span>
            <select
              value={userId}
              onChange={(e) => applyFilter(() => setUserId(e.target.value))}
            >
              <option value="">Everyone</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              applyFilter(() => {
                setFrom(daysAgo(30));
                setTo("");
                setAction("");
                setUserId("");
              })
            }
          >
            Reset
          </button>
        </div>

        <div className="seg" style={{ marginTop: 12 }}>
          {[
            { label: "Last 7 days", value: daysAgo(7) },
            { label: "Last 30 days", value: daysAgo(30) },
            { label: "Last 12 months", value: daysAgo(365) },
            { label: "All time", value: "" },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={`seg-btn${from === preset.value && !to ? " is-active" : ""}`}
              onClick={() =>
                applyFilter(() => {
                  setFrom(preset.value);
                  setTo("");
                })
              }
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      <div className="kpis">
        <button
          className={`card kpi${action === "" ? " is-active" : ""}`}
          onClick={() => applyFilter(() => setAction(""))}
          title="All actions"
        >
          <span className="kpi-top">
            <span className="label">All actions</span>
            <span className="kpi-icon">
              <IconTimeline />
            </span>
          </span>
          <span className="metric">
            <span className="metric-main">{summary ? summary.total : "—"}</span>
          </span>
        </button>

        {ACTIONS.map((name) => (
          <button
            key={name}
            className={`card kpi${action === name ? " is-active" : ""}`}
            onClick={() => applyFilter(() => setAction(action === name ? "" : name))}
            title={`Show ${AUDIT_ACTION_LABELS[name].toLowerCase()} only`}
          >
            <span className="kpi-top">
              <span className="label">{AUDIT_ACTION_LABELS[name]}</span>
            </span>
            <span className="metric">
              <span className="metric-main">{summary ? countFor(name) : "—"}</span>
            </span>
          </button>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}

      {summary && summary.topUsers.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Most active</h2>
          </div>
          <div className="list">
            {summary.topUsers.map((person) => (
              <div className="row" key={person.user_id ?? "deleted"}>
                <Avatar name={person.user_name ?? "?"} size="sm" tone="teal" />
                <div className="row-main">
                  <span className="row-name">{person.user_name ?? "Deleted account"}</span>
                  <span className="row-sub">{person.user_email ?? "—"}</span>
                </div>
                <div className="row-cell row-cell--sm">
                  <span className="metric-main">{person.total}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">Detailed log</h2>
          <span className="results-count">{total} entries</span>
        </div>

        {!loading && items.length === 0 && (
          <p className="empty">No activity recorded for these filters.</p>
        )}

        <div className="list">
          {items.map((entry) => {
            const fields = entry.action === "update" ? changedFields(entry) : [];
            const entity = AUDIT_ENTITY_LABELS[entry.entity_type] ?? entry.entity_type;
            const isOpen = expanded === entry.id;

            return (
              <div className="row" key={entry.id}>
                <Avatar name={entry.user_name ?? "?"} size="sm" tone="ink" />

                <div className="row-main">
                  <span className="row-name">
                    {entry.user_name ?? "Deleted account"}
                    <span
                      className={`badge${ACTION_TONE[entry.action] ?? ""}`}
                      style={{ marginLeft: 8 }}
                    >
                      {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                    </span>
                  </span>
                  <span className="row-sub">
                    {entry.action === "login"
                      ? "Signed in"
                      : `${entity}${entry.entity_id ? ` #${entry.entity_id}` : ""}`}
                    {fields.length > 0 && ` — changed ${fields.join(", ")}`}
                  </span>

                  {isOpen && (
                    <pre
                      className="mini"
                      style={{ whiteSpace: "pre-wrap", marginTop: 8, overflowX: "auto" }}
                    >
                      {JSON.stringify(
                        { before: asObject(entry.before_data), after: asObject(entry.after_data) },
                        null,
                        2
                      )}
                    </pre>
                  )}
                </div>

                <div className="row-cell row-cell--sm">
                  <span className="muted">{formatDateTime(entry.created_at)}</span>
                </div>

                {Boolean(entry.before_data || entry.after_data) && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setExpanded(isOpen ? null : entry.id)}
                  >
                    {isOpen ? "Hide" : "Details"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {pageCount > 1 && (
          <div className="pager">
            <button className="btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span className="pager-info">
              Page {page} of {pageCount}
            </span>
            <button
              className="btn"
              disabled={page >= pageCount}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </section>

      <p className="muted" style={{ marginTop: 12 }}>
        Opening a contact, an organization, an event or downloading a document is recorded. Searches
        and list views are not: they would bury the trail without saying who looked at what. A record
        reopened within a few minutes counts once.
      </p>
    </>
  );
}
