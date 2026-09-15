import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import DetailRouter from "../components/DetailRouter";
import FilterPill, { FilterOption } from "../components/FilterPill";
import {
  IconBuilding,
  IconCalendar,
  IconClose,
  IconDownload,
  IconGlobe,
  IconGrid,
  IconList,
  IconPlus,
  IconSearch,
  IconSort,
  IconTimeline,
  IconUpload,
  IconUser,
  IconUsers,
} from "../components/Icons";
import {
  ContactCard,
  ContactRow,
  EventCard,
  EventRow,
  OrganizationCard,
  OrganizationRow,
} from "../components/ResultCards";
import { useDetail } from "../hooks/useDetail";
import {
  CONTACT_CATEGORY_LABELS,
  ContactCategory,
  EVENT_TYPE_LABELS,
  Facets,
  GENDER_LABELS,
  SearchKind,
  SearchResponse,
} from "../types";
import { formatCount } from "../utils/format";

type View = "cards" | "list";

const VIEW_KEY = "cp.resultView";
const ALL_KINDS: SearchKind[] = ["contact", "organization", "event"];

const EMPTY_RESULTS: SearchResponse = {
  contacts: { items: [], total: 0 },
  organizations: { items: [], total: 0 },
  events: { items: [], total: 0 },
  page: 1,
  pageSize: 24,
};

function readStoredView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "cards";
  } catch {
    return "cards";
  }
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const { openContact, openOrganization, openEvent } = useDetail();

  // Criteria live in the URL: a search can be shared by link, the
  // Back button undoes the last filter, and a reload lands on exactly
  // the same list.
  const q = params.get("q") ?? "";
  const kindParam = params.get("kinds");
  const kinds = useMemo<SearchKind[]>(() => {
    const parsed = (kindParam ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is SearchKind => ALL_KINDS.includes(s as SearchKind));
    return parsed.length ? parsed : ALL_KINDS;
  }, [kindParam]);
  const category = params.get("category");
  const country = params.get("country");
  const year = params.get("year");
  const gender = params.get("gender");
  const eventType = params.get("eventType");
  const sort = params.get("sort") ?? "name";
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);

  const [text, setText] = useState(q);
  const [view, setView] = useState<View>(readStoredView);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [results, setResults] = useState<SearchResponse>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Writes a criterion to the URL and resets pagination to page one. */
  const setFilter = useCallback(
    (key: string, value: string | null, opts?: { replace?: boolean }) => {
      const next = new URLSearchParams(params);
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      if (key !== "page") next.delete("page");
      setParams(next, { replace: opts?.replace ?? false });
    },
    [params, setParams]
  );

  // The text field is driven locally then pushed to the URL after a
  // typing pause (via `replace`, so history doesn't stack an entry per
  // keystroke).
  useEffect(() => {
    if (text === q) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setFilter("q", text.trim() || null, { replace: true }), 320);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [text, q, setFilter]);

  // Browser back/forward: resync the visible field.
  useEffect(() => setText(q), [q]);

  useEffect(() => {
    api
      .get<Facets>("/search/facets")
      .then(setFacets)
      .catch(() => setFacets(null));
  }, []);

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (kinds.length !== ALL_KINDS.length) sp.set("kinds", kinds.join(","));
    if (category) sp.set("category", category);
    if (country) sp.set("country", country);
    if (year) sp.set("year", year);
    if (gender) sp.set("gender", gender);
    if (eventType) sp.set("eventType", eventType);
    sp.set("sort", sort);
    sp.set("page", String(page));
    return sp.toString();
  }, [q, kinds, category, country, year, gender, eventType, sort, page]);

  // Previous results stay displayed while the next batch loads: the
  // list refreshes without flickering.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api
      .get<SearchResponse>(`/search?${queryString}`)
      .then((res) => alive && setResults(res))
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Search error");
        setResults(EMPTY_RESULTS);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [queryString]);

  function changeView(v: View) {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* private mode: keep the preference in memory only */
    }
  }

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      await api.download(`/search/export?${queryString}`, "contact_directory_export.xlsx");
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  function toggleKind(kind: SearchKind) {
    const only = kinds.length === 1 && kinds[0] === kind;
    setFilter("kinds", only ? null : kind);
  }

  function resetAll() {
    setText("");
    setParams(new URLSearchParams(), { replace: false });
  }

  const categoryOptions: FilterOption[] = (facets?.categories ?? []).map((c) => ({
    value: c.value,
    label: CONTACT_CATEGORY_LABELS[c.value as ContactCategory] ?? c.value,
    count: c.count,
  }));
  const countryOptions: FilterOption[] = (facets?.countries ?? []).map((c) => ({
    value: c.value,
    label: c.value,
    count: c.count,
  }));
  const yearOptions: FilterOption[] = (facets?.years ?? []).map((y) => ({
    value: String(y.year),
    label: String(y.year),
    count: y.eventCount,
  }));
  const genderOptions: FilterOption[] = (["female", "male", "other"] as const).map((g) => ({
    value: g,
    label: GENDER_LABELS[g],
  }));
  const eventTypeOptions: FilterOption[] = (facets?.eventTypes ?? []).map((t) => ({
    value: t.value,
    label: EVENT_TYPE_LABELS[t.value] ?? t.value,
    count: t.count,
  }));

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (q) activeChips.push({ key: "q", label: `"${q}"`, onRemove: () => setText("") });
  if (kinds.length === 1) {
    const labels: Record<SearchKind, string> = {
      contact: "Contacts only",
      organization: "Organizations only",
      event: "Events only",
    };
    activeChips.push({
      key: "kinds",
      label: labels[kinds[0]],
      onRemove: () => setFilter("kinds", null),
    });
  }
  if (category)
    activeChips.push({
      key: "category",
      label: CONTACT_CATEGORY_LABELS[category as ContactCategory] ?? category,
      onRemove: () => setFilter("category", null),
    });
  if (country)
    activeChips.push({ key: "country", label: country, onRemove: () => setFilter("country", null) });
  if (year)
    activeChips.push({ key: "year", label: `Year ${year}`, onRemove: () => setFilter("year", null) });
  if (gender)
    activeChips.push({
      key: "gender",
      label: GENDER_LABELS[gender as keyof typeof GENDER_LABELS] ?? gender,
      onRemove: () => setFilter("gender", null),
    });
  if (eventType)
    activeChips.push({
      key: "eventType",
      label: EVENT_TYPE_LABELS[eventType as keyof typeof EVENT_TYPE_LABELS] ?? eventType,
      onRemove: () => setFilter("eventType", null),
    });

  const shown =
    results.contacts.items.length +
    results.organizations.items.length +
    results.events.items.length;
  const total = results.contacts.total + results.organizations.total + results.events.total;
  const maxTotal = Math.max(
    results.contacts.total,
    results.organizations.total,
    results.events.total
  );
  const pageCount = Math.max(1, Math.ceil(maxTotal / (results.pageSize || 24)));

  const isFiltered = activeChips.length > 0;

  return (
    <>
      <div className="page-head">
        <div className="crumbs">
          <span className="crumb">
            <IconGrid />
            Directory
          </span>
          <IconTimeline className="i" />
          <span className="crumb crumb-muted">Advanced search</span>
        </div>

        <div className="title-row">
          <div>
            <h1 className="title">Contact directory</h1>
            <p className="title-sub">
              Contacts, organizations and events collected by the foundation, searchable by
              name, country, category or year.
            </p>
          </div>
          <div className="actions">
            <Link to="/contacts/new" className="btn">
              <IconPlus />
              Contact
            </Link>
            <Link to="/contacts/import" className="btn">
              <IconUpload />
              Import
            </Link>
            <Link to="/events/new" className="btn">
              <IconPlus />
              Event
            </Link>
            <Link to="/organizations" className="btn btn-primary">
              <IconBuilding />
              Organizations
            </Link>
          </div>
        </div>
      </div>

      {/* ---------- KPIs: clickable, they narrow the result type ---------- */}
      <div className="kpis">
        <button
          className={`card kpi${kinds.length === 1 && kinds[0] === "contact" ? " is-active" : ""}`}
          onClick={() => toggleKind("contact")}
          title="Show contacts only"
        >
          <span className="kpi-top">
            <span className="label">Contacts</span>
            <span className="kpi-icon">
              <IconUsers />
            </span>
          </span>
          <span className="metric">
            <span className="metric-main">{facets ? formatCount(facets.totals.contacts) : "—"}</span>
          </span>
        </button>

        <button
          className={`card kpi${
            kinds.length === 1 && kinds[0] === "organization" ? " is-active" : ""
          }`}
          onClick={() => toggleKind("organization")}
          title="Show organizations only"
        >
          <span className="kpi-top">
            <span className="label">Organizations</span>
            <span className="kpi-icon">
              <IconBuilding />
            </span>
          </span>
          <span className="metric">
            <span className="metric-main">
              {facets ? formatCount(facets.totals.organizations) : "—"}
            </span>
          </span>
        </button>

        <button
          className={`card kpi${kinds.length === 1 && kinds[0] === "event" ? " is-active" : ""}`}
          onClick={() => toggleKind("event")}
          title="Show events only"
        >
          <span className="kpi-top">
            <span className="label">Events &amp; trainings</span>
            <span className="kpi-icon">
              <IconCalendar />
            </span>
          </span>
          <span className="metric">
            <span className="metric-main">{facets ? formatCount(facets.totals.events) : "—"}</span>
          </span>
        </button>

        <div className="card kpi kpi--accent" style={{ cursor: "default" }}>
          <span className="kpi-top">
            <span className="label">Participations</span>
            <span className="kpi-icon">
              <IconTimeline />
            </span>
          </span>
          <span className="metric">
            <span className="metric-main">
              {facets ? formatCount(facets.totals.participations) : "—"}
            </span>
          </span>
        </div>
      </div>

      {/* ---------- Search + filters ---------- */}
      <section className="card search-panel">
        <div className="search-row">
          <div className="search-field">
            <IconSearch className="i search-ico" />
            <input
              className="search-input"
              placeholder="Search by name, organization, event, location..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
              aria-label="Search"
            />
            {text && (
              <button className="search-clear" onClick={() => setText("")} aria-label="Clear">
                <IconClose />
              </button>
            )}
          </div>
          {loading && <span className="spinner" aria-label="Search in progress" />}
        </div>

        <div className="filters">
          <FilterPill
            label="Category"
            icon={<IconUser className="i" />}
            options={categoryOptions}
            value={category}
            onChange={(v) => setFilter("category", v)}
            allLabel="All categories"
          />
          <FilterPill
            label="Country"
            icon={<IconGlobe className="i" />}
            options={countryOptions}
            value={country}
            onChange={(v) => setFilter("country", v)}
            allLabel="All countries"
          />
          <FilterPill
            label="Year"
            icon={<IconCalendar className="i" />}
            options={yearOptions}
            value={year}
            onChange={(v) => setFilter("year", v)}
            allLabel="All years"
          />
          <FilterPill
            label="Gender"
            icon={<IconUsers className="i" />}
            options={genderOptions}
            value={gender}
            onChange={(v) => setFilter("gender", v)}
            allLabel="Tous"
          />
          <FilterPill
            label="Event type"
            icon={<IconCalendar className="i" />}
            options={eventTypeOptions}
            value={eventType}
            onChange={(v) => setFilter("eventType", v)}
            allLabel="All types"
          />
          <FilterPill
            label="Sort"
            icon={<IconSort className="i" />}
            options={[
              { value: "name", label: "Alphabetical" },
              { value: "recent", label: "Recent additions" },
            ]}
            value={sort === "name" ? null : sort}
            onChange={(v) => setFilter("sort", v ?? "name")}
            allLabel="Alphabetical"
          />
        </div>

        {isFiltered && (
          <div className="chips-active">
            {activeChips.map((chip) => (
              <span className="chip-active" key={chip.key}>
                {chip.label}
                <button className="chip-x" onClick={chip.onRemove} aria-label="Remove this filter">
                  <IconClose />
                </button>
              </span>
            ))}
            <button className="chips-reset" onClick={resetAll}>
              Clear all
            </button>
          </div>
        )}
      </section>

      {/* ---------- Results header + view toggle ---------- */}
      <div className="results-head">
        <div className="results-count">
          {formatCount(total)} result{total > 1 ? "s" : ""}{" "}
          <span>
            {total > shown ? `· ${formatCount(shown)} shown` : ""}
          </span>
        </div>
        <div className="results-tools">
          <button
            className="btn"
            onClick={handleExport}
            disabled={exporting || total === 0}
            title="Export the current results to an Excel file"
          >
            <IconDownload />
            {exporting ? "Exporting…" : "Export to Excel"}
          </button>
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
      </div>

      {exportError && <p className="error-text">{exportError}</p>}

      {error && (
        <div className="empty">
          <div className="empty-ico">
            <IconClose />
          </div>
          <h3>Search unavailable</h3>
          <p>{error}</p>
        </div>
      )}

      {!error && loading && shown === 0 && (
        <div className="cards-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="skeleton skeleton-card" key={i} />
          ))}
        </div>
      )}

      {!error && !loading && shown === 0 && (
        <div className="empty">
          <div className="empty-ico">
            <IconSearch />
          </div>
          <h3>No results</h3>
          <p>
            {isFiltered
              ? "Try widening the search by removing a filter."
              : "The directory is empty for now."}
          </p>
        </div>
      )}

      {!error && results.contacts.items.length > 0 && (
        <section className="group">
          <div className="group-head">
            <h2 className="group-title">Contacts</h2>
            <span className="group-count">{formatCount(results.contacts.total)}</span>
          </div>
          {view === "cards" ? (
            <div className="cards-grid">
              {results.contacts.items.map((c) => (
                <ContactCard key={c.id} c={c} onClick={() => openContact(c.id)} />
              ))}
            </div>
          ) : (
            <div className="list">
              {results.contacts.items.map((c) => (
                <ContactRow key={c.id} c={c} onClick={() => openContact(c.id)} />
              ))}
            </div>
          )}
        </section>
      )}

      {!error && results.organizations.items.length > 0 && (
        <section className="group">
          <div className="group-head">
            <h2 className="group-title">Organizations</h2>
            <span className="group-count">{formatCount(results.organizations.total)}</span>
          </div>
          {view === "cards" ? (
            <div className="cards-grid">
              {results.organizations.items.map((o) => (
                <OrganizationCard key={o.id} o={o} onClick={() => openOrganization(o.id)} />
              ))}
            </div>
          ) : (
            <div className="list">
              {results.organizations.items.map((o) => (
                <OrganizationRow key={o.id} o={o} onClick={() => openOrganization(o.id)} />
              ))}
            </div>
          )}
        </section>
      )}

      {!error && results.events.items.length > 0 && (
        <section className="group">
          <div className="group-head">
            <h2 className="group-title">Events &amp; trainings</h2>
            <span className="group-count">{formatCount(results.events.total)}</span>
          </div>
          {view === "cards" ? (
            <div className="cards-grid">
              {results.events.items.map((e) => (
                <EventCard key={e.id} e={e} onClick={() => openEvent(e.id)} />
              ))}
            </div>
          ) : (
            <div className="list">
              {results.events.items.map((e) => (
                <EventRow key={e.id} e={e} onClick={() => openEvent(e.id)} />
              ))}
            </div>
          )}
        </section>
      )}

      {!error && pageCount > 1 && (
        <div className="pager">
          <button
            className="btn"
            disabled={page <= 1}
            onClick={() => setFilter("page", String(page - 1))}
          >
            Previous
          </button>
          <span className="pager-info">
            Page {page} of {formatCount(pageCount)}
          </span>
          <button
            className="btn"
            disabled={page >= pageCount}
            onClick={() => setFilter("page", String(page + 1))}
          >
            Next
          </button>
        </div>
      )}

      <DetailRouter />
    </>
  );
}
