import { useEffect, useState } from "react";
import { api } from "../api/client";
import { IconBuilding, IconCash, IconPlus } from "../components/Icons";
import DonorModal from "../components/DonorModal";
import { Donor } from "../grants";

export default function GrantsDonorsPage() {
  const [items, setItems] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [open, setOpen] = useState<Donor | "new" | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get<{ items: Donor[] }>("/grants/donors")
      .then((r) => {
        if (alive) {
          setItems(r.items);
          setError(null);
        }
      })
      .catch((err) => alive && setError(err instanceof Error ? err.message : "Could not load donors"))
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
            <IconCash />
            Grants
          </span>
          <span className="crumb crumb-muted">Donors</span>
        </div>
        <div className="title-row">
          <div>
            <h1 className="title">Donors</h1>
            <p className="title-sub">{loading ? "Loading..." : `${items.length} donors`}</p>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => setOpen("new")}>
              <IconPlus />
              Donor
            </button>
          </div>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading && items.length === 0 && <div className="skeleton" style={{ height: 200 }} />}

      <section className="card">
        <div className="list">
          {items.map((d) => (
            <div
              key={d.id}
              className="row row-grid"
              style={{ gridTemplateColumns: "1fr auto", gap: 14, cursor: "pointer" }}
              onClick={() => setOpen(d)}
            >
              <span className="row-main">
                <span className="row-name" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <IconBuilding className="i" />
                  {d.name}
                </span>
                {d.notes && <span className="row-sub">{d.notes}</span>}
              </span>
              <span className="row-cell row-cell--sm">
                {d.grant_total} project{d.grant_total !== 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>
      </section>

      {open !== null && (
        <DonorModal
          donor={open === "new" ? null : open}
          onClose={() => setOpen(null)}
          onChanged={() => setRefresh((n) => n + 1)}
        />
      )}
    </>
  );
}
