import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import Avatar from "../components/Avatar";
import DetailRouter from "../components/DetailRouter";
import { IconArrowUpRight, IconBuilding, IconPlus, IconSearch } from "../components/Icons";
import { useDetail } from "../hooks/useDetail";
import { Organization } from "../types";
import { formatCount } from "../utils/format";

export default function OrganizationsPage() {
  const [items, setItems] = useState<Organization[]>([]);
  const [filter, setFilter] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { openOrganization } = useDetail();

  function load() {
    setLoading(true);
    api
      .get<{ items: Organization[] }>("/organizations")
      .then((res) => setItems(res.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((o) =>
      `${o.name} ${o.type ?? ""} ${o.country ?? ""}`.toLowerCase().includes(q)
    );
  }, [items, filter]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.post("/organizations", {
        name: name.trim(),
        type: type.trim() || undefined,
        country: country.trim() || undefined,
      });
      setName("");
      setType("");
      setCountry("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="crumbs">
          <span className="crumb">
            <IconBuilding />
            Directory
          </span>
          <span className="crumb crumb-muted">Organizations</span>
        </div>
        <div className="title-row">
          <div>
            <h1 className="title">Organizations</h1>
            <p className="title-sub">
              {loading ? "Loading..." : `${formatCount(items.length)} organizations recorded`}
            </p>
          </div>
        </div>
      </div>

      <section className="card search-panel">
        <div className="search-field">
          <IconSearch className="i search-ico" />
          <input
            className="search-input"
            placeholder="Filter by name, type or country..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <form className="form-row" onSubmit={handleCreate} style={{ marginTop: 16 }}>
          <input
            placeholder="New organization name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input placeholder="Type" value={type} onChange={(e) => setType(e.target.value)} />
          <input
            placeholder="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>
            <IconPlus />
            {saving ? "Adding..." : "Add"}
          </button>
        </form>

        {error && <p className="error-text" style={{ marginTop: 10 }}>{error}</p>}
      </section>

      <div className="results-head">
        <div className="results-count">
          {formatCount(visible.length)} organization{visible.length > 1 ? "s" : ""}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          <div className="empty-ico">
            <IconBuilding />
          </div>
          <h3>No organization</h3>
          <p>{filter ? `Nothing matches "${filter}".` : "Add the first one above."}</p>
        </div>
      ) : (
        <div className="list">
          {visible.map((o) => (
            <button key={o.id} className="row" onClick={() => openOrganization(o.id)}>
              <Avatar name={o.name} tone="teal" />
              <span className="row-main">
                <span className="row-name">{o.name}</span>
                <span className="row-sub">{o.type ?? "—"}</span>
              </span>
              <span className="row-cell row-cell--sm">{o.country ?? "—"}</span>
              <span className="row-go">
                <IconArrowUpRight />
              </span>
            </button>
          ))}
        </div>
      )}

      <DetailRouter />
    </>
  );
}
