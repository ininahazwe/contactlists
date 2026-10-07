import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { IconList } from "../components/Icons";
import {
  KEY_DOC_STATUS_LABELS,
  KeyDocsDashboard,
  MEMBERSHIP_STATUS_BADGE,
  MEMBERSHIP_STATUS_LABELS,
} from "../keydocs";

function Block({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="card-head">
        <h3 className="card-title">
          {title}
          {count !== undefined && <span className="muted"> · {count}</span>}
        </h3>
      </div>
      <div style={{ padding: "6px 22px 18px" }}>{children}</div>
    </div>
  );
}

function Line({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "9px 0",
        borderBottom: "1px solid var(--line)",
        fontSize: 14,
      }}
    >
      <span>{left}</span>
      {right !== undefined && <span className="muted">{right}</span>}
    </div>
  );
}

export default function KeyDocsDashboardPage() {
  const [d, setD] = useState<KeyDocsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<KeyDocsDashboard>("/keydocs/dashboard")
      .then(setD)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load the dashboard"));
  }, []);

  const head = (
    <div className="page-head">
      <div className="crumbs">
        <span className="crumb">
          <IconList />
          Key Docs
        </span>
        <span className="crumb crumb-muted">Compliance</span>
      </div>
      <div className="title-row">
        <div>
          <h1 className="title">Compliance overview</h1>
          <p className="title-sub">What is on file, what is missing, and what needs attention soon.</p>
        </div>
      </div>
    </div>
  );

  if (error)
    return (
      <>
        {head}
        <p className="error-text">{error}</p>
      </>
    );
  if (!d)
    return (
      <>
        {head}
        <div className="skeleton" style={{ height: 240 }} />
      </>
    );

  const count = (s: string) => d.documents.byStatus.find((x) => x.status === s)?.total ?? 0;
  const available = count("available");
  const rate = d.documents.total ? Math.round((available / d.documents.total) * 100) : 0;
  const attention =
    d.documents.missing.length +
    d.documents.availableWithoutLink.length +
    d.documents.stale.length +
    d.documents.reviewOverdue.length;

  const kpis = [
    { label: "Documents on file", value: `${available} / ${d.documents.total}`, sub: `${rate}%`, accent: true },
    { label: "Missing", value: String(d.documents.missing.length), to: "/keydocs?status=missing" },
    { label: "Declared, no link", value: String(d.documents.availableWithoutLink.length), to: "/keydocs?noLink=1" },
    { label: "Open to-dos", value: String(d.openActions.length) },
    {
      label: "Annual fees (USD)",
      value: d.memberships.annualFeeTotal.toLocaleString("en-US"),
      sub: "active memberships",
    },
  ];

  return (
    <>
      {head}

      <div className="kpis">
        {kpis.map((k) => {
          const inner = (
            <>
              <span className="kpi-top">
                <span className="label">{k.label}</span>
              </span>
              <span className="metric">
                <span className="metric-main">{k.value}</span>
                {k.sub && <span className="metric-unit">{k.sub}</span>}
              </span>
            </>
          );
          return k.to ? (
            <Link key={k.label} to={k.to} className="card kpi">
              {inner}
            </Link>
          ) : (
            <div key={k.label} className={`card kpi${k.accent ? " kpi--accent" : ""}`}>
              {inner}
            </div>
          );
        })}
      </div>

      {attention === 0 && d.openActions.length === 0 && d.memberships.needingAttention.length === 0 && (
        <p className="muted">Nothing needs attention right now.</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
        <Block title="By category">
          {d.documents.byCategory.map((c) => {
            const pct = c.total ? Math.round((c.available / c.total) * 100) : 0;
            return (
              <div key={c.category} style={{ padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span>{c.category}</span>
                  <span className="muted">
                    {c.available} / {c.total}
                  </span>
                </div>
                <div
                  style={{ height: 6, borderRadius: 3, background: "var(--soft-2)", marginTop: 6 }}
                  role="img"
                  aria-label={`${pct}% available`}
                >
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: "var(--teal, #46bec4)" }} />
                </div>
              </div>
            );
          })}
        </Block>

        <Block title="Missing documents" count={d.documents.missing.length}>
          {d.documents.missing.length === 0 && <p className="muted">None.</p>}
          {d.documents.missing.map((m) => (
            <Line key={m.id} left={m.title} right={m.category} />
          ))}
        </Block>

        <Block title="Declared but no link" count={d.documents.availableWithoutLink.length}>
          {d.documents.availableWithoutLink.length === 0 && <p className="muted">None.</p>}
          {d.documents.availableWithoutLink.map((m) => (
            <Line key={m.id} left={m.title} right={m.category} />
          ))}
        </Block>

        <Block title="Not reviewed for 3+ years" count={d.documents.stale.length}>
          {d.documents.stale.length === 0 && <p className="muted">None.</p>}
          {d.documents.stale.map((m) => (
            <Line key={m.id} left={m.title} right={`last: ${m.last_year}`} />
          ))}
        </Block>

        {d.documents.reviewOverdue.length > 0 && (
          <Block title="Review overdue" count={d.documents.reviewOverdue.length}>
            {d.documents.reviewOverdue.map((m) => (
              <Line key={m.id} left={m.title} right={`due ${m.next_review_due}`} />
            ))}
          </Block>
        )}

        <Block title="Open to-dos" count={d.openActions.length}>
          {d.openActions.length === 0 && <p className="muted">None.</p>}
          {d.openActions.map((a) => (
            <Line
              key={a.id}
              left={
                <>
                  <strong>{a.document_title}</strong> — {a.text}
                </>
              }
              right={a.due_date ?? ""}
            />
          ))}
        </Block>

        <Block title="Memberships needing attention" count={d.memberships.needingAttention.length}>
          {d.memberships.needingAttention.length === 0 && <p className="muted">None.</p>}
          {d.memberships.needingAttention.map((m) => (
            <Line
              key={m.id}
              left={m.institution}
              right={
                <span className={MEMBERSHIP_STATUS_BADGE[m.status]}>{MEMBERSHIP_STATUS_LABELS[m.status]}</span>
              }
            />
          ))}
        </Block>

        <Block title="Documents by status">
          {(["available", "in_review", "outdated", "missing"] as const).map((s) => (
            <Line key={s} left={KEY_DOC_STATUS_LABELS[s]} right={count(s)} />
          ))}
        </Block>
      </div>
    </>
  );
}
