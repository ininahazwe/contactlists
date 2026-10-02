import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import FilterPill, { FilterOption } from "../components/FilterPill";
import {
  IconCalendar,
  IconClose,
  IconFilter,
  IconGlobe,
  IconPlus,
  IconSearch,
  IconSort,
  IconUpload,
  IconUsers,
} from "../components/Icons";
import { StaffRow } from "../components/ResultCards";
import StaffModal from "../components/StaffModal";
import {
  Paginated,
  STAFF_EMPLOYMENT_TYPE_LABELS,
  STAFF_ENGAGEMENT_TYPE_LABELS,
  StaffFacets,
  StaffMember,
} from "../types";
import { formatCount } from "../utils/format";

const EMPTY_RESULTS: Paginated<StaffMember> = { items: [], total: 0, page: 1, pageSize: 25 };

/**
 * Staff directory: same shape as the contacts SearchPage (URL-driven
 * filters, facet pills, paginated list, a modal for the detail view), kept
 * as a module of its own rather than folded into /api/search -- see the
 * "pourquoi pas de q global unifié" rationale in
 * claude/staff-module-design.md.
 */
export default function StaffPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();

  const q = params.get("q") ?? "";
  const status = params.get("status");
  const employmentType = params.get("employmentType");
  const department = params.get("department");
  const country = params.get("country");
  const engagementType = params.get("engagementType");
  const sort = params.get("sort") ?? "name";
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
  const staffIdParam = params.get("staffId");
  const openStaffId = staffIdParam && Number.isFinite(Number(staffIdParam)) ? Number(staffIdParam) : null;

  const [text, setText] = useState(q);
  const [facets, setFacets] = useState<StaffFacets | null>(null);
  const [results, setResults] = useState<Paginated<StaffMember>>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setFilter = useCallback(
    (key: string, value: string | null, opts?: { replace?: boolean }) => {
      const next = new URLSearchParams(params);
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      if (key !== "page" && key !== "staffId") next.delete("page");
      setParams(next, { replace: opts?.replace ?? false });
    },
    [params, setParams]
  );

  function openStaff(id: number) {
    setFilter("staffId", String(id));
  }
  function closeStaff() {
    setFilter("staffId", null);
  }

  useEffect(() => {
    if (text === q) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setFilter("q", text.trim() || null, { replace: true }), 320);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [text, q, setFilter]);

  useEffect(() => setText(q), [q]);

  useEffect(() => {
    api
      .get<StaffFacets>("/staff/facets")
      .then(setFacets)
      .catch(() => setFacets(null));
  }, []);

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    if (q) sp.set("search", q);
    if (status) sp.set("status", status);
    if (employmentType) sp.set("employmentType", employmentType);
    if (department) sp.set("department", department);
    if (country) sp.set("country", country);
    if (engagementType) sp.set("engagementType", engagementType);
    sp.set("sort", sort);
    sp.set("page", String(page));
    return sp.toString();
  }, [q, status, employmentType, department, country, engagementType, sort, page]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api
      .get<Paginated<StaffMember>>(`/staff?${queryString}`)
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

  function resetAll() {
    setText("");
    const next = new URLSearchParams();
    const staffId = params.get("staffId");
    if (staffId) next.set("staffId", staffId);
    setParams(next, { replace: false });
  }

  const statusOptions: FilterOption[] = [
    { value: "active", label: "Active", count: facets?.totals.active },
    { value: "former", label: "Former", count: facets?.totals.former },
  ];
  const employmentOptions: FilterOption[] = (facets?.employmentTypes ?? []).map((t) => ({
    value: t.value,
    label: STAFF_EMPLOYMENT_TYPE_LABELS[t.value] ?? t.value,
    count: t.count,
  }));
  const departmentOptions: FilterOption[] = (facets?.departments ?? []).map((d) => ({
    value: d.value,
    label: d.value,
    count: d.count,
  }));
  const countryOptions: FilterOption[] = (facets?.countries ?? []).map((c) => ({
    value: c.value,
    label: c.value,
    count: c.count,
  }));
  const engagementOptions: FilterOption[] = (facets?.engagementTypes ?? []).map((t) => ({
    value: t.value,
    label: STAFF_ENGAGEMENT_TYPE_LABELS[t.value] ?? t.value,
    count: t.count,
  }));

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (q) activeChips.push({ key: "q", label: `"${q}"`, onRemove: () => setText("") });
  if (status)
    activeChips.push({
      key: "status",
      label: status === "active" ? "Active" : "Former",
      onRemove: () => setFilter("status", null),
    });
  if (employmentType)
    activeChips.push({
      key: "employmentType",
      label: STAFF_EMPLOYMENT_TYPE_LABELS[employmentType as keyof typeof STAFF_EMPLOYMENT_TYPE_LABELS] ?? employmentType,
      onRemove: () => setFilter("employmentType", null),
    });
  if (department)
    activeChips.push({ key: "department", label: department, onRemove: () => setFilter("department", null) });
  if (country)
    activeChips.push({ key: "country", label: country, onRemove: () => setFilter("country", null) });
  if (engagementType)
    activeChips.push({
      key: "engagementType",
      label: STAFF_ENGAGEMENT_TYPE_LABELS[engagementType as keyof typeof STAFF_ENGAGEMENT_TYPE_LABELS] ?? engagementType,
      onRemove: () => setFilter("engagementType", null),
    });

  const isFiltered = activeChips.length > 0;
  const pageCount = Math.max(1, Math.ceil(results.total / (results.pageSize || 25)));

  return (
    <>
      <div className="page-head">
        <div className="crumbs">
          <span className="crumb">
            <IconUsers />
            Staff
          </span>
          <span className="crumb crumb-muted">Directory</span>
        </div>
        <div className="title-row">
          <div>
            <h1 className="title">Staff directory</h1>
            <p className="title-sub">
              Current and former MFWA staff, searchable by name, department, country or
              engagement.
            </p>
          </div>
          <div className="actions">
            {user?.role === "admin" && (
              <Link to="/staff/new" className="btn">
                <IconPlus />
                Staff
              </Link>
            )}
            {user?.role === "admin" && (
              <Link to="/staff/import" className="btn">
                <IconUpload />
                Import
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="kpis">
        <button
          className={`card kpi${status === "active" ? " is-active" : ""}`}
          onClick={() => setFilter("status", status === "active" ? null : "active")}
          title="Show active staff only"
        >
          <span className="kpi-top">
            <span className="label">Active</span>
            <span className="kpi-icon">
              <IconUsers />
            </span>
          </span>
          <span className="metric">
            <span className="metric-main">{facets ? formatCount(facets.totals.active) : "—"}</span>
          </span>
        </button>

        <button
          className={`card kpi${status === "former" ? " is-active" : ""}`}
          onClick={() => setFilter("status", status === "former" ? null : "former")}
          title="Show former staff only"
        >
          <span className="kpi-top">
            <span className="label">Former</span>
            <span className="kpi-icon">
              <IconUsers />
            </span>
          </span>
          <span className="metric">
            <span className="metric-main">{facets ? formatCount(facets.totals.former) : "—"}</span>
          </span>
        </button>

        <div className="card kpi kpi--accent" style={{ cursor: "default" }}>
          <span className="kpi-top">
            <span className="label">Total staff</span>
            <span className="kpi-icon">
              <IconUsers />
            </span>
          </span>
          <span className="metric">
            <span className="metric-main">{facets ? formatCount(facets.totals.total) : "—"}</span>
          </span>
        </div>
      </div>

      <section className="card search-panel">
        <div className="search-row">
          <div className="search-field">
            <IconSearch className="i search-ico" />
            <input
              className="search-input"
              placeholder="Search by name or job title..."
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
            label="Status"
            icon={<IconUsers className="i" />}
            options={statusOptions}
            value={status}
            onChange={(v) => setFilter("status", v)}
            allLabel="All statuses"
          />
          <FilterPill
            label="Employment type"
            icon={<IconFilter className="i" />}
            options={employmentOptions}
            value={employmentType}
            onChange={(v) => setFilter("employmentType", v)}
            allLabel="All employment types"
          />
          <FilterPill
            label="Department"
            icon={<IconFilter className="i" />}
            options={departmentOptions}
            value={department}
            onChange={(v) => setFilter("department", v)}
            allLabel="All departments"
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
            label="Engagement type"
            icon={<IconCalendar className="i" />}
            options={engagementOptions}
            value={engagementType}
            onChange={(v) => setFilter("engagementType", v)}
            allLabel="All engagement types"
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

      <div className="results-head">
        <div className="results-count">
          {formatCount(results.total)} result{results.total > 1 ? "s" : ""}
        </div>
      </div>

      {error && (
        <div className="empty">
          <div className="empty-ico">
            <IconClose />
          </div>
          <h3>Search unavailable</h3>
          <p>{error}</p>
        </div>
      )}

      {!error && loading && results.items.length === 0 && (
        <div className="list">
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="skeleton" style={{ height: 56 }} key={i} />
          ))}
        </div>
      )}

      {!error && !loading && results.items.length === 0 && (
        <div className="empty">
          <div className="empty-ico">
            <IconSearch />
          </div>
          <h3>No results</h3>
          <p>
            {isFiltered
              ? "Try widening the search by removing a filter."
              : "The staff directory is empty for now."}
          </p>
        </div>
      )}

      {!error && results.items.length > 0 && (
        <div className="list">
          {results.items.map((s) => (
            <StaffRow key={s.id} s={s} onClick={() => openStaff(s.id)} />
          ))}
        </div>
      )}

      {!error && pageCount > 1 && (
        <div className="pager">
          <button className="btn" disabled={page <= 1} onClick={() => setFilter("page", String(page - 1))}>
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

      {openStaffId && <StaffModal staffId={openStaffId} onClose={closeStaff} />}
    </>
  );
}
