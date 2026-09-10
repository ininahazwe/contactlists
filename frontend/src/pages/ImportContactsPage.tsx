import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../api/client";
import EntityPicker from "../components/EntityPicker";
import { IconDownload, IconUpload, IconUsers } from "../components/Icons";
import { EventItem, ImportSummary, Organization } from "../types";
import { formatCount, formatDate } from "../utils/format";

export default function ImportContactsPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  async function searchOrganizations(q: string): Promise<Organization[]> {
    const res = await api.get<{ items: Organization[] }>(
      `/organizations?search=${encodeURIComponent(q)}`
    );
    return res.items;
  }

  async function searchEvents(q: string): Promise<EventItem[]> {
    const res = await api.get<{ items: EventItem[] }>(
      `/events?search=${encodeURIComponent(q)}&pageSize=20`
    );
    return res.items;
  }

  async function handleDownloadTemplate() {
    setDownloading(true);
    setError(null);
    try {
      await api.download("/contacts/import/template", "contact_import_template.xlsx");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not download the template");
    } finally {
      setDownloading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    setSummary(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (organization) formData.append("organizationId", String(organization.id));
      if (event) formData.append("eventId", String(event.id));

      const result = await api.upload<ImportSummary>("/contacts/import", formData);
      setSummary(result);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Import failed"
      );
    } finally {
      setUploading(false);
    }
  }

  const rowErrors = summary?.results.filter((r) => r.status === "error") ?? [];

  return (
    <div className="form-wrap">
      <div className="page-head">
        <div className="crumbs">
          <span className="crumb">
            <IconUsers />
            Directory
          </span>
          <span className="crumb crumb-muted">Import contacts</span>
        </div>
        <div className="title-row">
          <h1 className="title">Import contacts</h1>
        </div>
      </div>

      <div className="form-card">
        <p className="muted" style={{ margin: "0 0 16px", fontSize: 14.5, lineHeight: 1.6 }}>
          Upload an Excel file to add several contacts at once. A contact whose email already
          matches one in the directory is reused rather than duplicated. Linking to an
          organization or event is optional — it applies to every row that doesn't specify its
          own Organization column.
        </p>

        <button
          type="button"
          className="btn"
          onClick={handleDownloadTemplate}
          disabled={downloading}
          style={{ marginBottom: 24 }}
        >
          <IconDownload />
          {downloading ? "Preparing..." : "Download template"}
        </button>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Excel file</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="form-row">
            <div className="field">
              <label>Link to organization (optional)</label>
              <EntityPicker<Organization>
                placeholder="Search for an organization..."
                value={organization}
                onChange={setOrganization}
                search={searchOrganizations}
                getId={(o) => o.id}
                getLabel={(o) => o.name}
                getSub={(o) => o.country}
              />
            </div>
            <div className="field">
              <label>Link to event (optional)</label>
              <EntityPicker<EventItem>
                placeholder="Search for an event..."
                value={event}
                onChange={setEvent}
                search={searchEvents}
                getId={(e) => e.id}
                getLabel={(e) => e.title}
                getSub={(e) => formatDate(e.start_date)}
              />
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={uploading || !file}>
              <IconUpload />
              {uploading ? "Importing..." : "Import"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate("/")}>
              Cancel
            </button>
          </div>
        </form>

        {summary && (
          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-head">
              <h3 className="card-title">Import results</h3>
            </div>
            <div className="modal-stats" style={{ marginTop: 10 }}>
              <div className="stat">
                <b>{formatCount(summary.totalRows)}</b>
                <span>Rows read</span>
              </div>
              <div className="stat">
                <b>{formatCount(summary.created)}</b>
                <span>Created</span>
              </div>
              <div className="stat">
                <b>{formatCount(summary.existing)}</b>
                <span>Matched existing</span>
              </div>
              <div className="stat">
                <b>{formatCount(summary.errors)}</b>
                <span>Errors</span>
              </div>
            </div>

            {rowErrors.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p style={{ margin: "0 0 8px", fontSize: 13.5, fontWeight: 600 }}>
                  Rows that couldn't be imported
                </p>
                <div className="list">
                  {rowErrors.map((r) => (
                    <div
                      key={r.row}
                      className="row"
                      style={{ cursor: "default", gridTemplateColumns: "auto 1fr" }}
                    >
                      <span className="badge">Row {r.row}</span>
                      <span className="row-sub">{r.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.errors === 0 && (
              <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
                <Link to="/">Back to the directory</Link> to see the imported contacts.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
