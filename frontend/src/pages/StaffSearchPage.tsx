import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { IconSearch, IconUsers } from "../components/Icons";
import {
  STAFF_EMPLOYMENT_TYPE_LABELS,
  STAFF_STATUS_LABELS,
  StaffEmploymentType,
  StaffMember,
  StaffStatus,
} from "../types";

interface SearchFilters {
  search: string;
  department: string;
  seniorityLevel: string;
  status: StaffStatus | "";
  employmentType: StaffEmploymentType | "";
  yearJoinedFrom: string;
  yearJoinedTo: string;
}

interface SearchResult {
  items: StaffMember[];
  total: number;
  page: number;
  pageSize: number;
}

interface FacetsData {
  totals: { total: number; active: number; former: number };
  employmentTypes: { value: string; count: number }[];
  departments: { value: string; count: number }[];
  seniorityLevels: { value: string; count: number }[];
  countries: { value: string; count: number }[];
  engagementTypes: { value: string; count: number }[];
}

export default function StaffSearchPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SearchFilters>({
    search: "",
    department: "",
    seniorityLevel: "",
    status: "",
    employmentType: "",
    yearJoinedFrom: "",
    yearJoinedTo: "",
  });
  const [results, setResults] = useState<SearchResult | null>(null);
  const [facets, setFacets] = useState<FacetsData>({
    totals: { total: 0, active: 0, former: 0 },
    employmentTypes: [],
    departments: [],
    seniorityLevels: [],
    countries: [],
    engagementTypes: [],
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Load facets on mount
  useEffect(() => {
    api.get<FacetsData>("/staff/facets").then(setFacets).catch(() => {});
  }, []);

  // Search whenever filters or page changes
  useEffect(() => {
    handleSearch();
  }, [filters, page]);

  async function handleSearch() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.department) params.append("department", filters.department);
      if (filters.seniorityLevel) params.append("seniorityLevel", filters.seniorityLevel);
      if (filters.status) params.append("status", filters.status);
      if (filters.employmentType) params.append("employmentType", filters.employmentType);
      if (filters.yearJoinedFrom) params.append("yearJoinedFrom", filters.yearJoinedFrom);
      if (filters.yearJoinedTo) params.append("yearJoinedTo", filters.yearJoinedTo);
      params.append("page", String(page));
      params.append("pageSize", "25");

      const res = await api.get<SearchResult>(`/staff?${params}`);
      setResults(res);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setFilters({
      search: "",
      department: "",
      seniorityLevel: "",
      status: "",
      employmentType: "",
      yearJoinedFrom: "",
      yearJoinedTo: "",
    });
    setPage(1);
  }

  const hasActiveFilters = 
    filters.search || filters.department || filters.seniorityLevel || 
    filters.status || filters.employmentType || filters.yearJoinedFrom || filters.yearJoinedTo;

  return (
    <div className="page">
      <div className="page-head">
        <div className="crumbs">
          <span className="crumb">
            <IconUsers />
            Staff
          </span>
          <span className="crumb crumb-muted">Advanced search</span>
        </div>
      </div>

      <div style={{ maxWidth: "1200px" }}>
        {/* Filters Card */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-head">
            <h2 className="card-title">
              <IconSearch />
              Search & Filter
            </h2>
          </div>

          <div className="form" style={{ padding: "14px 22px" }}>
            {/* Search text */}
            <div className="field">
              <label>Full-text search</label>
              <input
                placeholder="Name, job title, nationality..."
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value });
                  setPage(1);
                }}
              />
            </div>

            {/* Filter rows */}
            <div className="form-row">
              <div className="field">
                <label>Department</label>
                <select
                  value={filters.department}
                  onChange={(e) => {
                    setFilters({ ...filters, department: e.target.value });
                    setPage(1);
                  }}
                >
                  <option value="">All departments</option>
                  {facets.departments.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Seniority level</label>
                <select
                  value={filters.seniorityLevel}
                  onChange={(e) => {
                    setFilters({ ...filters, seniorityLevel: e.target.value });
                    setPage(1);
                  }}
                >
                  <option value="">All levels</option>
                  {facets.seniorityLevels.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => {
                    setFilters({ ...filters, status: (e.target.value as any) || "" });
                    setPage(1);
                  }}
                >
                  <option value="">All statuses</option>
                  {Object.entries(STAFF_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>Employment type</label>
                <select
                  value={filters.employmentType}
                  onChange={(e) => {
                    setFilters({ ...filters, employmentType: (e.target.value as any) || "" });
                    setPage(1);
                  }}
                >
                  <option value="">All types</option>
                  {Object.entries(STAFF_EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Year joined (from)</label>
                <input
                  type="number"
                  min="1950"
                  max={new Date().getFullYear()}
                  value={filters.yearJoinedFrom}
                  onChange={(e) => {
                    setFilters({ ...filters, yearJoinedFrom: e.target.value });
                    setPage(1);
                  }}
                />
              </div>

              <div className="field">
                <label>Year joined (to)</label>
                <input
                  type="number"
                  min="1950"
                  max={new Date().getFullYear()}
                  value={filters.yearJoinedTo}
                  onChange={(e) => {
                    setFilters({ ...filters, yearJoinedTo: e.target.value });
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {hasActiveFilters && (
              <button
                className="btn btn-ghost"
                onClick={resetFilters}
                style={{ marginTop: "8px" }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="card">
          <div className="card-head">
            <h2 className="card-title">
              Results {results ? `(${results.total})` : ""}
            </h2>
          </div>

          {loading && <p className="muted" style={{ padding: "14px 22px" }}>Loading...</p>}

          {results && results.items.length === 0 && (
            <p className="muted" style={{ padding: "14px 22px" }}>No staff found matching your filters.</p>
          )}

          {results && results.items.length > 0 && (
            <>
              <div className="list">
                {results.items.map((staff) => (
                  <button
                    key={staff.id}
                    className="row"
                    onClick={() => navigate(`/staff?staffId=${staff.id}`)}
                    style={{ cursor: "pointer", gridTemplateColumns: "1fr auto auto" }}
                  >
                    <div>
                      <span className="row-name">{staff.full_name}</span>
                      <span className="row-sub">
                        {staff.job_title} · {staff.department}
                      </span>
                    </div>
                    <span className="row-cell row-cell--sm">{staff.status}</span>
                    <span className="row-cell row-cell--sm">{staff.year_joined}</span>
                  </button>
                ))}
              </div>

              {/* Pagination */}
              {results.total > 25 && (
                <div style={{ padding: "14px 22px", display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
                  <button
                    className="btn btn-ghost"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>
                  <span className="muted" style={{ fontSize: "12px" }}>
                    Page {page} of {Math.ceil(results.total / 25)}
                  </span>
                  <button
                    className="btn btn-ghost"
                    disabled={page * 25 >= results.total}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
