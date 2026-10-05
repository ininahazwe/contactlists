import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import {
  STAFF_EMPLOYMENT_TYPE_LABELS,
  STAFF_ENGAGEMENT_TYPE_LABELS,
  STAFF_STATUS_LABELS,
  StaffDetail,
  StaffEngagementEntry,
  StaffEngagementType,
  StaffSensitive,
  StaffWelfareEntry,
} from "../types";
import { formatCount, formatDate } from "../utils/format";
import Avatar from "./Avatar";
import { IconClose, IconEdit, IconLock, IconPlus } from "./Icons";
import Modal, { ModalHead } from "./Modal";

interface Props {
  staffId: number;
  onClose: () => void;
}

interface SensitiveFormState {
  emergencyContactName: string;
  emergencyContactPhone: string;
  welfareNotes: string;
  exitTermsNotes: string;
  exitInterviewUrl: string;
}

const emptySensitiveForm: SensitiveFormState = {
  emergencyContactName: "",
  emergencyContactPhone: "",
  welfareNotes: "",
  exitTermsNotes: "",
  exitInterviewUrl: "",
};

function toForm(s: StaffSensitive): SensitiveFormState {
  return {
    emergencyContactName: s.emergency_contact_name ?? "",
    emergencyContactPhone: s.emergency_contact_phone ?? "",
    welfareNotes: s.welfare_notes ?? "",
    exitTermsNotes: s.exit_terms_notes ?? "",
    exitInterviewUrl: s.exit_interview_url ?? "",
  };
}

interface EngagementFormState {
  engagementType: StaffEngagementType;
  country: string;
  place: string;
  startDate: string;
  endDate: string;
  purpose: string;
  roleInEngagement: string;
}

const emptyEngagementForm: EngagementFormState = {
  engagementType: "training",
  country: "",
  place: "",
  startDate: "",
  endDate: "",
  purpose: "",
  roleInEngagement: "",
};

interface WelfareFormState {
  eventName: string;
  eventDate: string;
  amount: string;
  currency: string;
  notes: string;
}

const emptyWelfareForm: WelfareFormState = {
  eventName: "",
  eventDate: "",
  amount: "",
  currency: "USD",
  notes: "",
};

/**
 * Staff profile: identity, career history and engagements are fetched with
 * the rest of the profile (GET /api/staff/:id). staff_sensitive and
 * staff_welfare are deliberately NOT fetched along with it -- they sit
 * behind one "Show" button, fetched only on demand (and only rendered for
 * admins), so opening a staff profile to check someone's job title doesn't
 * by itself read their emergency contact, welfare payments or exit notes.
 * See the design rationale in claude/staff-module-design.md.
 */
export default function StaffModal({ staffId, onClose }: Props) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [data, setData] = useState<StaffDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Engagements: add / remove ---
  const [addingEngagement, setAddingEngagement] = useState(false);
  const [engagementForm, setEngagementForm] = useState<EngagementFormState>(emptyEngagementForm);
  const [engagementSaving, setEngagementSaving] = useState(false);
  const [engagementError, setEngagementError] = useState<string | null>(null);

  // --- Confidential: sensitive fields + welfare, shown together behind one gate ---
  const [showSensitive, setShowSensitive] = useState(false);
  const [sensitive, setSensitive] = useState<StaffSensitive | null>(null);
  const [welfare, setWelfare] = useState<StaffWelfareEntry[] | null>(null);
  const [sensitiveError, setSensitiveError] = useState<string | null>(null);
  const [sensitiveLoading, setSensitiveLoading] = useState(false);
  const [form, setForm] = useState<SensitiveFormState>(emptySensitiveForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [addingWelfare, setAddingWelfare] = useState(false);
  const [welfareForm, setWelfareForm] = useState<WelfareFormState>(emptyWelfareForm);
  const [welfareSaving, setWelfareSaving] = useState(false);
  const [welfareError, setWelfareError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError(null);
    setShowSensitive(false);
    setSensitive(null);
    setWelfare(null);
    setAddingEngagement(false);
    setAddingWelfare(false);
    api
      .get<StaffDetail>(`/staff/${staffId}`)
      .then((res) => alive && setData(res))
      .catch((err) => alive && setError(err instanceof Error ? err.message : "Error"));
    return () => {
      alive = false;
    };
  }, [staffId]);

  async function handleAddEngagement(e: FormEvent) {
    e.preventDefault();
    setEngagementSaving(true);
    setEngagementError(null);
    const payload = {
      engagementType: engagementForm.engagementType,
      country: engagementForm.country || undefined,
      place: engagementForm.place || undefined,
      startDate: engagementForm.startDate || undefined,
      endDate: engagementForm.endDate || undefined,
      purpose: engagementForm.purpose || undefined,
      roleInEngagement: engagementForm.roleInEngagement || undefined,
    };
    try {
      const res = await api.post<{ engagement: StaffEngagementEntry }>(
        `/staff/${staffId}/engagements`,
        payload
      );
      setData((d) => (d ? { ...d, engagements: [res.engagement, ...d.engagements] } : d));
      setEngagementForm(emptyEngagementForm);
      setAddingEngagement(false);
    } catch (err) {
      setEngagementError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not add this engagement"
      );
    } finally {
      setEngagementSaving(false);
    }
  }

  async function handleRemoveEngagement(engagementId: number) {
    try {
      await api.delete(`/staff/${staffId}/engagements/${engagementId}`);
      setData((d) =>
        d ? { ...d, engagements: d.engagements.filter((e) => e.id !== engagementId) } : d
      );
    } catch (err) {
      setEngagementError(err instanceof Error ? err.message : "Could not remove this engagement");
    }
  }

  function loadSensitive() {
    setShowSensitive(true);
    if (sensitive) return;
    setSensitiveLoading(true);
    setSensitiveError(null);
    Promise.all([
      api.get<{ sensitive: StaffSensitive }>(`/staff/${staffId}/sensitive`),
      api.get<{ items: StaffWelfareEntry[] }>(`/staff/${staffId}/welfare`),
    ])
      .then(([sensitiveRes, welfareRes]) => {
        setSensitive(sensitiveRes.sensitive);
        setForm(toForm(sensitiveRes.sensitive));
        setWelfare(welfareRes.items);
      })
      .catch((err) => setSensitiveError(err instanceof Error ? err.message : "Error"))
      .finally(() => setSensitiveLoading(false));
  }

  async function handleSaveSensitive(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    const payload = {
      emergencyContactName: form.emergencyContactName || undefined,
      emergencyContactPhone: form.emergencyContactPhone || undefined,
      welfareNotes: form.welfareNotes || undefined,
      exitTermsNotes: form.exitTermsNotes || undefined,
      exitInterviewUrl: form.exitInterviewUrl || undefined,
    };
    try {
      const res = await api.patch<{ sensitive: StaffSensitive }>(
        `/staff/${staffId}/sensitive`,
        payload
      );
      setSensitive(res.sensitive);
      setForm(toForm(res.sensitive));
    } catch (err) {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Save failed"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAddWelfare(e: FormEvent) {
    e.preventDefault();
    setWelfareSaving(true);
    setWelfareError(null);
    const payload = {
      eventName: welfareForm.eventName,
      eventDate: welfareForm.eventDate || undefined,
      amount: welfareForm.amount ? Number(welfareForm.amount) : undefined,
      currency: welfareForm.currency || undefined,
      notes: welfareForm.notes || undefined,
    };
    try {
      const res = await api.post<{ welfare: StaffWelfareEntry }>(
        `/staff/${staffId}/welfare`,
        payload
      );
      setWelfare((w) => (w ? [res.welfare, ...w] : [res.welfare]));
      setWelfareForm(emptyWelfareForm);
      setAddingWelfare(false);
    } catch (err) {
      setWelfareError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not add this entry"
      );
    } finally {
      setWelfareSaving(false);
    }
  }

  async function handleRemoveWelfare(welfareId: number) {
    try {
      await api.delete(`/staff/${staffId}/welfare/${welfareId}`);
      setWelfare((w) => (w ? w.filter((item) => item.id !== welfareId) : w));
    } catch (err) {
      setWelfareError(err instanceof Error ? err.message : "Could not remove this entry");
    }
  }

  const staff = data?.staff;

  return (
    <Modal onClose={onClose} label={staff?.full_name || "Staff profile"}>
      <ModalHead
        eyebrow="Staff"
        title={staff?.full_name || "Loading..."}
        sub={staff?.job_title ?? undefined}
        avatar={staff ? <Avatar name={staff.full_name} size="lg" /> : undefined}
        onClose={onClose}
        extra={
          isAdmin && staff && (
            <Link to={`/staff/${staff.id}/edit`} className="btn" title="Edit this staff member">
              <IconEdit />
              Edit
            </Link>
          )
        }
        badges={
          staff && (
            <>
              <span className="badge badge--ink">{STAFF_STATUS_LABELS[staff.status]}</span>
              <span className="badge">{STAFF_EMPLOYMENT_TYPE_LABELS[staff.employment_type]}</span>
              {staff.department && <span className="badge">{staff.department}</span>}
              {staff.nationality && <span className="badge">{staff.nationality}</span>}
            </>
          )
        }
      />

      <div className="modal-body">
        {error && <p className="error-text">{error}</p>}

        {!data && !error && (
          <>
            <div className="skeleton" style={{ height: 92 }} />
            <div className="skeleton" style={{ height: 180 }} />
          </>
        )}

        {data && staff && (
          <>
            <div className="modal-stats">
              <div className="stat">
                <b>{staff.year_joined ?? "—"}</b>
                <span>Year joined</span>
              </div>
              <div className="stat">
                <b>{formatCount(data.roleHistory.length)}</b>
                <span>Career steps</span>
              </div>
              <div className="stat">
                <b>{formatCount(data.engagements.length)}</b>
                <span>Engagements</span>
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <h3 className="card-title">Identity</h3>
              </div>
              <dl className="info-grid" style={{ marginTop: 6 }}>
                <div className="info">
                  <dt>Recruited as</dt>
                  <dd>{staff.recruited_as ?? "—"}</dd>
                </div>
                <div className="info">
                  <dt>Total years served</dt>
                  <dd>{staff.total_years_served_raw ?? "—"}</dd>
                </div>
                <div className="info">
                  <dt>Exit date</dt>
                  <dd>{staff.exit_date ? formatDate(staff.exit_date) : "—"}</dd>
                </div>
                <div className="info">
                  <dt>CV up to date</dt>
                  <dd>{staff.cv_updated ? "Yes" : "No"}</dd>
                </div>
                <div className="info">
                  <dt>Training opportunities</dt>
                  <dd>{staff.training_opportunities_raw ?? "—"}</dd>
                </div>
                <div className="info">
                  <dt>Travel opportunities</dt>
                  <dd>{staff.travel_opportunities_raw ?? "—"}</dd>
                </div>
              </dl>
            </div>

            <div className="card-head" style={{ marginTop: 8 }}>
              <h3 className="card-title">Career history</h3>
              <span className="group-count">{data.roleHistory.length}</span>
            </div>
            <div className="list">
              {data.roleHistory.length === 0 && (
                <p className="muted" style={{ fontSize: 14 }}>
                  No career history on file.
                </p>
              )}
              {data.roleHistory.map((r, i) => (
                <div key={i} className="row row-grid" style={{ cursor: "default", gridTemplateColumns: "auto 1fr" }}>
                  <span className="badge">
                    {r.year_from ? (r.year_to && r.year_to !== r.year_from ? `${r.year_from}–${r.year_to}` : r.year_from) : "—"}
                  </span>
                  <span className="row-sub">{r.role_title}</span>
                </div>
              ))}
            </div>

            <div className="card-head" style={{ marginTop: 8 }}>
              <h3 className="card-title">Engagements</h3>
              <span className="group-count">{data.engagements.length}</span>
              {isAdmin && !addingEngagement && (
                <button className="btn" onClick={() => setAddingEngagement(true)}>
                  <IconPlus />
                  Add
                </button>
              )}
            </div>

            {isAdmin && addingEngagement && (
              <form
                onSubmit={handleAddEngagement}
                className="card"
                style={{ marginBottom: 10, padding: 14 }}
              >
                <div className="form-row">
                  <div className="field">
                    <label>Type</label>
                    <select
                      value={engagementForm.engagementType}
                      onChange={(e) =>
                        setEngagementForm((p) => ({
                          ...p,
                          engagementType: e.target.value as StaffEngagementType,
                        }))
                      }
                    >
                      {Object.entries(STAFF_ENGAGEMENT_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Country</label>
                    <input
                      value={engagementForm.country}
                      onChange={(e) =>
                        setEngagementForm((p) => ({ ...p, country: e.target.value }))
                      }
                    />
                  </div>
                  <div className="field">
                    <label>Place</label>
                    <input
                      value={engagementForm.place}
                      onChange={(e) => setEngagementForm((p) => ({ ...p, place: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>Start date</label>
                    <input
                      type="date"
                      value={engagementForm.startDate}
                      onChange={(e) =>
                        setEngagementForm((p) => ({ ...p, startDate: e.target.value }))
                      }
                    />
                  </div>
                  <div className="field">
                    <label>End date</label>
                    <input
                      type="date"
                      value={engagementForm.endDate}
                      onChange={(e) =>
                        setEngagementForm((p) => ({ ...p, endDate: e.target.value }))
                      }
                    />
                  </div>
                  <div className="field">
                    <label>Role</label>
                    <input
                      placeholder="panelist, facilitator..."
                      value={engagementForm.roleInEngagement}
                      onChange={(e) =>
                        setEngagementForm((p) => ({ ...p, roleInEngagement: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Purpose</label>
                  <textarea
                    rows={2}
                    value={engagementForm.purpose}
                    onChange={(e) =>
                      setEngagementForm((p) => ({ ...p, purpose: e.target.value }))
                    }
                  />
                </div>

                {engagementError && <p className="error-text">{engagementError}</p>}

                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" className="btn btn-primary" disabled={engagementSaving}>
                    {engagementSaving ? "Saving..." : "Add engagement"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setAddingEngagement(false);
                      setEngagementError(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="list">
              {data.engagements.length === 0 && (
                <p className="muted" style={{ fontSize: 14 }}>
                  No recorded travel, training or meeting.
                </p>
              )}
              {data.engagements.map((e) => (
                <div
                  key={e.id}
                  className="row row-grid"
                  style={{
                    cursor: "default",
                    gridTemplateColumns: "auto 1fr auto auto",
                  }}
                >
                  <span className="badge">
                    {STAFF_ENGAGEMENT_TYPE_LABELS[e.engagement_type] ?? e.engagement_type}
                  </span>
                  <span className="row-sub">
                    {e.purpose || e.place || "—"}
                    {e.role_in_engagement ? ` · ${e.role_in_engagement}` : ""}
                  </span>
                  <span className="row-cell row-cell--sm">
                    {e.date_text || (e.start_date ? formatDate(e.start_date) : "—")}
                  </span>
                  {isAdmin && (
                    <button
                      className="icon-btn icon-btn--soft"
                      onClick={() => handleRemoveEngagement(e.id)}
                      aria-label="Remove this engagement"
                      title="Remove this engagement"
                    >
                      <IconClose />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isAdmin && (
              <div className="card" style={{ marginTop: 8 }}>
                <div className="card-head">
                  <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <IconLock className="i" />
                    Confidential
                  </h3>
                  {!showSensitive && (
                    <button className="btn" onClick={loadSensitive}>
                      Show
                    </button>
                  )}
                </div>

                {showSensitive && (
                  <>
                    {sensitiveLoading && <div className="skeleton" style={{ height: 120 }} />}
                    {sensitiveError && <p className="error-text">{sensitiveError}</p>}

                    {!sensitiveLoading && sensitive && (
                      <>
                        <form onSubmit={handleSaveSensitive}>
                          <div className="form-row">
                            <div className="field">
                              <label>Emergency contact name</label>
                              <input
                                value={form.emergencyContactName}
                                onChange={(e) =>
                                  setForm((p) => ({ ...p, emergencyContactName: e.target.value }))
                                }
                              />
                            </div>
                            <div className="field">
                              <label>Emergency contact phone</label>
                              <input
                                value={form.emergencyContactPhone}
                                onChange={(e) =>
                                  setForm((p) => ({ ...p, emergencyContactPhone: e.target.value }))
                                }
                              />
                            </div>
                          </div>

                          {staff.status === "active" ? (
                            <div className="field">
                              <label>Welfare notes</label>
                              <textarea
                                rows={3}
                                value={form.welfareNotes}
                                onChange={(e) =>
                                  setForm((p) => ({ ...p, welfareNotes: e.target.value }))
                                }
                              />
                            </div>
                          ) : (
                            <>
                              <div className="field">
                                <label>Exit terms</label>
                                <textarea
                                  rows={2}
                                  value={form.exitTermsNotes}
                                  onChange={(e) =>
                                    setForm((p) => ({ ...p, exitTermsNotes: e.target.value }))
                                  }
                                />
                              </div>
                              <div className="field">
                                <label>Exit interview report (URL)</label>
                                <input
                                  value={form.exitInterviewUrl}
                                  onChange={(e) =>
                                    setForm((p) => ({ ...p, exitInterviewUrl: e.target.value }))
                                  }
                                />
                              </div>
                            </>
                          )}

                          {saveError && <p className="error-text">{saveError}</p>}

                          <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? "Saving..." : "Save"}
                          </button>
                        </form>

                        <div
                          className="card-head"
                          style={{ marginTop: 16, borderTop: "1px solid var(--border, #e5e7eb)", paddingTop: 12 }}
                        >
                          <h3 className="card-title">Welfare</h3>
                          <span className="group-count">{welfare?.length ?? 0}</span>
                          {!addingWelfare && (
                            <button className="btn" onClick={() => setAddingWelfare(true)}>
                              <IconPlus />
                              Add
                            </button>
                          )}
                        </div>

                        {addingWelfare && (
                          <form
                            onSubmit={handleAddWelfare}
                            className="card"
                            style={{ marginBottom: 10, padding: 14 }}
                          >
                            <div className="form-row">
                              <div className="field">
                                <label>Event name</label>
                                <input
                                  required
                                  placeholder="Father's funeral, Naming ceremony, Wedding gift..."
                                  value={welfareForm.eventName}
                                  onChange={(e) =>
                                    setWelfareForm((p) => ({ ...p, eventName: e.target.value }))
                                  }
                                />
                              </div>
                              <div className="field">
                                <label>Date</label>
                                <input
                                  type="date"
                                  value={welfareForm.eventDate}
                                  onChange={(e) =>
                                    setWelfareForm((p) => ({ ...p, eventDate: e.target.value }))
                                  }
                                />
                              </div>
                            </div>
                            <div className="form-row">
                              <div className="field">
                                <label>Amount paid</label>
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={welfareForm.amount}
                                  onChange={(e) =>
                                    setWelfareForm((p) => ({ ...p, amount: e.target.value }))
                                  }
                                />
                              </div>
                              <div className="field">
                                <label>Currency</label>
                                <input
                                  value={welfareForm.currency}
                                  onChange={(e) =>
                                    setWelfareForm((p) => ({ ...p, currency: e.target.value }))
                                  }
                                />
                              </div>
                            </div>
                            <div className="field">
                              <label>Notes</label>
                              <textarea
                                rows={2}
                                value={welfareForm.notes}
                                onChange={(e) =>
                                  setWelfareForm((p) => ({ ...p, notes: e.target.value }))
                                }
                              />
                            </div>

                            {welfareError && <p className="error-text">{welfareError}</p>}

                            <div style={{ display: "flex", gap: 10 }}>
                              <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={welfareSaving}
                              >
                                {welfareSaving ? "Saving..." : "Add entry"}
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => {
                                  setAddingWelfare(false);
                                  setWelfareError(null);
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}

                        <div className="list">
                          {(welfare?.length ?? 0) === 0 && !addingWelfare && (
                            <p className="muted" style={{ fontSize: 14 }}>
                              No welfare payment on file.
                            </p>
                          )}
                          {welfare?.map((w) => (
                            <div
                              key={w.id}
                              className="row row-grid"
                              style={{ cursor: "default", gridTemplateColumns: "1fr auto auto" }}
                            >
                              <span className="row-sub">
                                {w.event_name}
                                {w.notes ? ` · ${w.notes}` : ""}
                              </span>
                              <span className="row-cell row-cell--sm">
                                {w.event_date ? formatDate(w.event_date) : "—"}
                                {w.amount ? ` · ${w.amount} ${w.currency ?? ""}` : ""}
                              </span>
                              <button
                                className="icon-btn icon-btn--soft"
                                onClick={() => handleRemoveWelfare(w.id)}
                                aria-label="Remove this entry"
                                title="Remove this entry"
                              >
                                <IconClose />
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
