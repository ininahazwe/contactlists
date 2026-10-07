import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { IconList, IconPlus } from "../components/Icons";
import MembershipModal from "../components/MembershipModal";
import {
  FEE_PERIOD_LABELS,
  MEMBERSHIP_STATUS_BADGE,
  MEMBERSHIP_STATUS_LABELS,
  Membership,
} from "../keydocs";

export default function KeyDocsMembershipsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [items, setItems] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [open, setOpen] = useState<Membership | "new" | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get<{ items: Membership[] }>("/keydocs/memberships")
      .then((r) => {
        if (alive) {
          setItems(r.items);
          setError(null);
        }
      })
      .catch((err) => alive && setError(err instanceof Error ? err.message : "Could not load memberships"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [refresh]);

  return (
    <>
      <div className="page-head">
        <div className="crumbs">
          <span className="crumb">
            <IconList />
            Key Docs
          </span>
          <span className="crumb crumb-muted">Memberships</span>
        </div>
        <div className="title-row">
          <div>
            <h1 className="title">Memberships and renewals</h1>
            <p className="title-sub">
              Networks, registries and platforms MFWA belongs to, with their renewal and
              reporting cycle.
            </p>
          </div>
          <div className="actions">
            {isAdmin && (
              <button className="btn" onClick={() => setOpen("new")}>
                <IconPlus />
                Membership
              </button>
            )}
          </div>
        </div>
      </div>


      {error && <p className="error-text">{error}</p>}
      {loading && items.length === 0 && <div className="skeleton" style={{ height: 200 }} />}

      <div className="list">
        {items.map((m) => (
          <div
            key={m.id}
            className="row row-grid"
            style={{ gridTemplateColumns: "1fr auto minmax(120px, 220px)", gap: 14, cursor: "pointer" }}
            onClick={() => setOpen(m)}
          >
            <span className="row-main">
              <span className="row-name" style={{ display: "block" }}>
                {m.institution}
              </span>
              <span className="row-sub" style={{ display: "block" }}>
                {[
                  m.year_commenced && `Since ${m.year_commenced}`,
                  m.last_renewed_year
                    ? `Renewed ${m.last_renewed_year}`
                    : m.renewed_label && `Renewed: ${m.renewed_label}`,
                  m.reporting_cycle && m.reporting_cycle !== "N/A" && `Reports: ${m.reporting_cycle}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
            <span className={MEMBERSHIP_STATUS_BADGE[m.status]}>{MEMBERSHIP_STATUS_LABELS[m.status]}</span>
            <span className="row-cell row-cell--sm">
              {m.fee_amount
                ? `${m.fee_currency} ${Number(m.fee_amount).toLocaleString("en-US")}${
                    m.fee_period ? ` ${FEE_PERIOD_LABELS[m.fee_period]}` : ""
                  }`
                : (m.renewal_cycle ?? "")}
            </span>
          </div>
        ))}
      </div>

      {open !== null && (
        <MembershipModal
          membership={open === "new" ? null : open}
          onClose={() => setOpen(null)}
          onChanged={() => setRefresh((n) => n + 1)}
        />
      )}
    </>
  );
}
