import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { IconUpload, IconUsers } from "../components/Icons";
import { StaffImportSummary } from "../types";
import { formatCount } from "../utils/format";

/**
 * Admin-only one-shot import: reads "MFWA Staff Details" + "Staff engages 2026"
 * from the source workbook and populates staff / staff_role_history /
 * staff_engagements / staff_sensitive. Mirrors ImportContactsPage, without a
 * template download (the staff import has no generated template, unlike
 * contacts) since the source file is the existing HR workbook, not a blank
 * form to fill in.
 */
export default function ImportStaffPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<StaffImportSummary | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    setSummary(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await api.upload<StaffImportSummary>("/staff/import", formData);
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

  return (
    <div className="form-wrap">
      <div className="page-head">
        <div className="crumbs">
          <span className="crumb">
            <IconUsers />
            Staff
          </span>
          <span className="crumb crumb-muted">Import staff</span>
        </div>
        <div className="title-row">
          <h1 className="title">Import staff</h1>
        </div>
      </div>

      <div className="form-card">
        <p className="muted" style={{ margin: "0 0 16px", fontSize: 14.5, lineHeight: 1.6 }}>
          Upload the MFWA staff workbook (sheets "MFWA Staff Details" and "Staff engages 2026").
          This is meant to be run once to seed the staff tables; running it again will create
          duplicate staff rows rather than update existing ones.
        </p>

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

          {error && <p className="error-text">{error}</p>}

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={uploading || !file}>
              <IconUpload />
              {uploading ? "Importing..." : "Import"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate("/staff")}>
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
                <b>{formatCount(summary.counts.staffCreated)}</b>
                <span>Staff created</span>
              </div>
              <div className="stat">
                <b>{formatCount(summary.counts.roleHistoryCreated)}</b>
                <span>Career steps</span>
              </div>
              <div className="stat">
                <b>{formatCount(summary.counts.engagementsCreated)}</b>
                <span>Engagements</span>
              </div>
              <div className="stat">
                <b>{formatCount(summary.counts.engagementsSkipped)}</b>
                <span>Engagements skipped</span>
              </div>
              <div className="stat">
                <b>{formatCount(summary.counts.roleHistoryFlagged)}</b>
                <span>Flagged (unclear year)</span>
              </div>
            </div>

            {summary.flaggedRoleHistory.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p style={{ margin: "0 0 8px", fontSize: 13.5, fontWeight: 600 }}>
                  Career entries with an unclear year — worth checking by hand
                </p>
                <div className="list">
                  {summary.flaggedRoleHistory.map((r) => (
                    <div
                      key={r.sourceRow}
                      className="row"
                      style={{ cursor: "default", gridTemplateColumns: "auto 1fr" }}
                    >
                      <span className="badge">Row {r.sourceRow}</span>
                      <span className="row-sub">
                        {r.roleTitle} — {r.note}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.counts.engagementsSkipped === 0 && summary.flaggedRoleHistory.length === 0 && (
              <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
                Import complete with no rows needing review.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
