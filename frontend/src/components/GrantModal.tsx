import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import {
  Donor,
  GRANT_STATUS_BADGE,
  GRANT_STATUS_LABELS,
  Grant,
  GrantStatus,
  grantTitle,
  nullIfEmpty,
  numOrNull,
} from "../grants";
import Modal, { ModalHead } from "./Modal";

interface Props {
  /** null = new grant. */
  grant: Grant | null;
  /** Pre-selected donor when creating from a donor's own page. */
  defaultDonorId?: number;
  donors: Donor[];
  onClose: () => void;
  onChanged: () => void;
}

interface FormState {
  donorId: string;
  grantLabel: string;
  projectName: string;
  keyObjectives: string;
  implementedBy: string;
  budgetAmount: string;
  budgetCurrency: string;
  startLabel: string;
  startDate: string;
  endLabel: string;
  endDate: string;
  reportingCycle: string;
  status: GrantStatus;
  comment: string;
}

function toForm(g: Grant | null, defaultDonorId?: number): FormState {
  return {
    donorId: g ? String(g.donor_id) : defaultDonorId ? String(defaultDonorId) : "",
    grantLabel: g?.grant_label ?? "",
    projectName: g?.project_name ?? "",
    keyObjectives: g?.key_objectives ?? "",
    implementedBy: g?.implemented_by ?? "",
    budgetAmount: g?.budget_amount ?? "",
    budgetCurrency: g?.budget_currency ?? "",
    startLabel: g?.start_label ?? "",
    startDate: g?.start_date ?? "",
    endLabel: g?.end_label ?? "",
    endDate: g?.end_date ?? "",
    reportingCycle: g?.reporting_cycle ?? "",
    status: g?.status ?? "unknown",
    comment: g?.comment ?? "",
  };
}

export default function GrantModal({ grant, defaultDonorId, donors, onClose, onChanged }: Props) {
  const [form, setForm] = useState<FormState>(() => toForm(grant, defaultDonorId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setForm(toForm(grant, defaultDonorId)), [grant, defaultDonorId]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form.donorId) {
      setError("Pick a donor");
      return;
    }
    setSaving(true);
    setError(null);
    // A date typed in full replaces the free-text label with the clean,
    // sortable value; leaving the date blank keeps whatever label there was.
    const body = {
      donorId: Number(form.donorId),
      grantLabel: nullIfEmpty(form.grantLabel),
      projectName: nullIfEmpty(form.projectName),
      keyObjectives: nullIfEmpty(form.keyObjectives),
      implementedBy: nullIfEmpty(form.implementedBy),
      budgetAmount: numOrNull(form.budgetAmount),
      budgetCurrency: nullIfEmpty(form.budgetCurrency),
      startLabel: nullIfEmpty(form.startDate) ? null : nullIfEmpty(form.startLabel),
      startDate: nullIfEmpty(form.startDate),
      endLabel: nullIfEmpty(form.endDate) ? null : nullIfEmpty(form.endLabel),
      endDate: nullIfEmpty(form.endDate),
      reportingCycle: nullIfEmpty(form.reportingCycle),
      status: form.status,
      comment: nullIfEmpty(form.comment),
    };
    try {
      if (grant) await api.patch(`/grants/${grant.id}`, body);
      else await api.post("/grants", body);
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!grant) return;
    if (!window.confirm(`Delete "${grantTitle(grant)}"?`)) return;
    try {
      await api.delete(`/grants/${grant.id}`);
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <Modal onClose={onClose} label={grant ? grantTitle(grant) : "New grant"}>
      <ModalHead
        eyebrow={grant ? "Grant" : "New grant"}
        title={grant ? grantTitle(grant) : "Add a grant"}
        sub={grant?.donor_name}
        badges={
          grant && <span className={GRANT_STATUS_BADGE[grant.status]}>{GRANT_STATUS_LABELS[grant.status]}</span>
        }
        onClose={onClose}
      />
      <div className="modal-body">
        {error && <p className="error-text">{error}</p>}
        <form onSubmit={handleSave}>
          <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0 }}>
            <div className="form-row">
              <div className="field">
                <label>Donor</label>
                <select value={form.donorId} onChange={(e) => set("donorId", e.target.value)} required>
                  <option value="" disabled>
                    Select a donor…
                  </option>
                  {donors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Grant label</label>
                <input
                  placeholder="Grant 1, Grant 2…"
                  value={form.grantLabel}
                  onChange={(e) => set("grantLabel", e.target.value)}
                />
              </div>
              <div className="field">
                <label>Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value as GrantStatus)}>
                  {Object.entries(GRANT_STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label>Project name</label>
              <input value={form.projectName} onChange={(e) => set("projectName", e.target.value)} />
            </div>

            <div className="field">
              <label>Key objectives</label>
              <textarea
                rows={3}
                value={form.keyObjectives}
                onChange={(e) => set("keyObjectives", e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="field">
                <label>Implemented by</label>
                <input
                  placeholder="Unit / department"
                  value={form.implementedBy}
                  onChange={(e) => set("implementedBy", e.target.value)}
                />
              </div>
              <div className="field">
                <label>Reporting</label>
                <input
                  placeholder="Annual reporting…"
                  value={form.reportingCycle}
                  onChange={(e) => set("reportingCycle", e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>Budget</label>
                <input
                  inputMode="decimal"
                  value={form.budgetAmount}
                  onChange={(e) => set("budgetAmount", e.target.value)}
                />
              </div>
              <div className="field">
                <label>Currency</label>
                <input
                  placeholder="USD, EUR…"
                  value={form.budgetCurrency}
                  onChange={(e) => set("budgetCurrency", e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>Start date</label>
                <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
              </div>
              <div className="field">
                <label>Start (if no exact date)</label>
                <input
                  placeholder="2025, April 2026…"
                  value={form.startLabel}
                  disabled={!!form.startDate}
                  onChange={(e) => set("startLabel", e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>End date</label>
                <input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
              </div>
              <div className="field">
                <label>End (if no exact date)</label>
                <input
                  placeholder="2027, Dec 2025…"
                  value={form.endLabel}
                  disabled={!!form.endDate}
                  onChange={(e) => set("endLabel", e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label>Comments</label>
              <textarea rows={3} value={form.comment} onChange={(e) => set("comment", e.target.value)} />
            </div>
          </fieldset>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : grant ? "Save changes" : "Create grant"}
            </button>
            {grant && (
              <button type="button" className="btn btn-danger" onClick={handleDelete}>
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </Modal>
  );
}
