import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import FilterPill, { FilterOption } from "../components/FilterPill";
import { IconClose, IconFilter, IconList, IconPlus, IconSearch } from "../components/Icons";
import KeyDocumentModal from "../components/KeyDocumentModal";
import {
  KEY_DOC_STATUS_BADGE,
  KEY_DOC_STATUS_LABELS,
  KeyDocCategory,
  KeyDocStatus,
  KeyDocument,
  reviewText,
} from "../keydocs";

interface ListResponse {
  items: KeyDocument[];
  total: number;
}

export default function KeyDocsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [params, setParams] = useSearchParams();

  const q = params.get("q") ?? "";
  const status = params.get("status");
  const categoryId = params.get("category");
  const noLink = params.get("noLink") === "1";

  const [text, setText] = useState(q);
  const [categories, setCategories] = useState<KeyDocCategory[]>([]);
  const [data, setData] = useState<ListResponse>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [openId, setOpenId] = useState<number | "new" | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setFilter = useCallback(
    (key: string, value: string | null, replace = false) => {
      const next = new URLSearchParams(params);
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      setParams(next, { replace });
    },
    [params, setParams]
  );

  useEffect(() => {
    if (text === q) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setFilter("q", text.trim() || null, true), 320);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [text, q, setFilter]);
  useEffect(() => setText(q), [q]);

  useEffect(() => {
    api
      .get<{ items: KeyDocCategory[] }>("/keydocs/categories")
      .then((r) => setCategories(r.items))
      .catch(() => setCategories([]));
  }, [refresh]);

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    if (q) sp.set("search", q);
    if (status) sp.set("status", status);
    if (categoryId) sp.set("categoryId", categoryId);
    if (noLink) sp.set("noLink", "1");
    sp.set("pageSize", "200");
    return sp.toString();
  }, [q, status, categoryId, noLink]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api
      .get<ListResponse>(`/keydocs/documents?${queryString}`)
      .then((r) => alive && setData(r))
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Could not load documents");
        setData({ items: [], total: 0 });
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [queryString, refresh]);

  // Regroupement par catégorie, dans l'ordre du référentiel.
  const groups = useMemo(() => {
    const map = new Map<string, KeyDocument[]>();
    for (const d of data.items) {
      const list = map.get(d.category_name) ?? [];
      list.push(d);
      map.set(d.category_name, list);
    }
    return Array.from(map.entries());
  }, [data.items]);

  const statusOptions: FilterOption[] = (Object.keys(KEY_DOC_STATUS_LABELS) as KeyDocStatus[]).map(
    (s) => ({ value: s, label: KEY_DOC_STATUS_LABELS[s] })
  );
  const categoryOptions: FilterOption[] = categories.map((c) => ({
    value: String(c.id),
    label: c.name,
    count: c.total,
  }));

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (q) chips.push({ key: "q", label: `"${q}"`, onRemove: () => setText("") });
  if (status)
    chips.push({
      key: "status",
      label: KEY_DOC_STATUS_LABELS[status as KeyDocStatus] ?? status,
      onRemove: () => setFilter("status", null),
    });
  if (categoryId)
    chips.push({
      key: "category",
      label: categories.find((c) => String(c.id) === categoryId)?.name ?? "Category",
      onRemove: () => setFilter("category", null),
    });
  if (noLink)
    chips.push({ key: "noLink", label: "No link", onRemove: () => setFilter("noLink", null) });

  return (
    <>
      <div className="page-head">
        <div className="crumbs">
          <span className="crumb">
            <IconList />
            Key Docs
          </span>
          <span className="crumb crumb-muted">Documents</span>
        </div>
        <div className="title-row">
          <div>
            <h1 className="title">Institutional documents</h1>
            <p className="title-sub">
              Registration, policies, audited accounts and other documents MFWA must be able to
              produce on request.
            </p>
          </div>
          <div className="actions">
            {isAdmin && (
              <button className="btn" onClick={() => setOpenId("new")}>
                <IconPlus />
                Document
              </button>
            )}
          </div>
        </div>
      </div>


      <section className="card search-panel">
        <div className="search-row">
          <div className="search-field">
            <IconSearch className="i search-ico" />
            <input
              className="search-input"
              placeholder="Search by title or comment..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label="Search"
            />
            {text && (
              <button className="search-clear" onClick={() => setText("")} aria-label="Clear">
                <IconClose />
              </button>
            )}
          </div>
          {loading && <span className="spinner" aria-label="Loading" />}
        </div>

        <div className="filters">
          <FilterPill
            label="Status"
            icon={<IconFilter className="i" />}
            options={statusOptions}
            value={status}
            onChange={(v) => setFilter("status", v)}
            allLabel="All statuses"
          />
          <FilterPill
            label="Category"
            icon={<IconFilter className="i" />}
            options={categoryOptions}
            value={categoryId}
            onChange={(v) => setFilter("category", v)}
            allLabel="All categories"
          />
          <FilterPill
            label="Link"
            icon={<IconFilter className="i" />}
            options={[{ value: "1", label: "Declared but no link" }]}
            value={noLink ? "1" : null}
            onChange={(v) => setFilter("noLink", v)}
            allLabel="Any"
          />
        </div>

        {chips.length > 0 && (
          <div className="chips-active">
            {chips.map((c) => (
              <span className="chip-active" key={c.key}>
                {c.label}
                <button className="chip-x" onClick={c.onRemove} aria-label="Remove this filter">
                  <IconClose />
                </button>
              </span>
            ))}
            <button
              className="chips-reset"
              onClick={() => {
                setText("");
                setParams(new URLSearchParams());
              }}
            >
              Clear all
            </button>
          </div>
        )}
      </section>

      <div className="results-head">
        <div className="results-count">
          {data.total} document{data.total === 1 ? "" : "s"}
        </div>
      </div>

      {error && (
        <div className="empty">
          <div className="empty-ico">
            <IconClose />
          </div>
          <h3>Documents unavailable</h3>
          <p>{error}</p>
        </div>
      )}

      {!error && !loading && data.items.length === 0 && (
        <div className="empty">
          <div className="empty-ico">
            <IconSearch />
          </div>
          <h3>No documents</h3>
          <p>{chips.length > 0 ? "Try removing a filter." : "No key documents recorded yet."}</p>
        </div>
      )}

      {!error &&
        groups.map(([category, docs]) => (
          <div className="group" key={category}>
            <div className="group-head">
              <h2 className="group-title">{category}</h2>
              <span className="group-count">{docs.length}</span>
            </div>
            <div className="list">
              {docs.map((d) => (
                <div
                  key={d.id}
                  className="row row-grid"
                  style={{ gridTemplateColumns: "4fr 1fr 1fr 1fr", gap: 14, cursor: "pointer" }}
                  onClick={() => setOpenId(d.id)}
                >
                  <span className="row-main">
                    <span className="row-name" style={{ display: "block" }}>
                      {d.title}
                    </span>
                    <span className="row-sub" style={{ display: "block" }}>
                      {[
                        d.year_label && `Year ${d.year_label}`,
                        `Reviewed ${reviewText(d)}`,
                        d.open_actions > 0 && `${d.open_actions} to do`,
                        d.status !== "missing" && !d.drive_url && "no link",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className={KEY_DOC_STATUS_BADGE[d.status]}>{KEY_DOC_STATUS_LABELS[d.status]}</span>
                  <span className="row-cell row-cell--sm">{d.comment ?? ""}</span>
                  {d.drive_url ? (
                    <a
                      className="btn btn-ghost"
                      href={d.drive_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Open
                    </a>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

      {openId !== null && (
        <KeyDocumentModal
          documentId={openId === "new" ? null : openId}
          categories={categories}
          defaultCategoryId={categoryId ? Number(categoryId) : undefined}
          onClose={() => setOpenId(null)}
          onChanged={() => setRefresh((n) => n + 1)}
        />
      )}
    </>
  );
}
