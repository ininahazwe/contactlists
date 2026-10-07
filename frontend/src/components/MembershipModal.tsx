import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import {
  FEE_PERIOD_LABELS,
  FeePeriod,
  MEMBERSHIP_STATUS_BADGE,
  MEMBERSHIP_STATUS_LABELS,
  Membership,
  MembershipStatus,
  nullIfEmpty,
  numOrNull,
} from "../keydocs";
import Modal, { ModalHead } from "./Modal";

interface Props {
  /** null = nouvelle adhésion. */
  membership: Membership | null;
  onClose: () => void;
  onChanged: () => void;
}

interface FormState {
  institution: string;
  status: MembershipStatus;
  yearCommenced: string;
  lastRenewedYear: string;
  renewedLabel: string;
  reportingCycle: string;
  renewalCycle: string;
  feeAmount: string;
  feeCurrency: string;
  feePeriod: string;
  renewalDueOn: string;
  lastReportOn: string;
  notes: string;
}

function toForm(m: Membership | null): FormState {
  return {
    institution: m?.institution ?? "",
    status: m?.status ?? "unknown",
    yearCommenced: m?.year_commenced != null ? String(m.year_commenced) : "",
    lastRenewedYear: m?.last_renewed_year != null ? String(m.last_renewed_year) : "",
    renewedLabel: m?.renewed_label ?? "",
    reportingCycle: m?.reporting_cycle ?? "",
    renewalCycle: m?.renewal_cycle ?? "",
    feeAmount: m?.fee_amount ?? "",
    feeCurrency: m?.fee_currency ?? "USD",
    feePeriod: m?.fee_period ?? "",
    renewalDueOn: m?.renewal_due_on ?? "",
    lastReportOn: m?.last_report_on ?? "",
    notes: m?.notes ?? "",
  };
}

export default function MembershipModal({ membership, onClose, onChanged }: Props) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [form, setForm] = useState<FormState>(() => toForm(membership));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setForm(toForm(membership)), [membership]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = {
      institution: form.institution.trim(),
      status: form.status,
      yearCommenced: numOrNull(form.yearCommenced),
      lastRenewedYear: numOrNull(form.lastRenewedYear),
      renewedLabel: nullIfEmpty(form.renewedLabel),
      reportingCycle: nullIfEmpty(form.reportingCycle),
      renewalCycle: nullIfEmpty(form.renewalCycle),
      feeAmount: numOrNull(form.feeAmount),
      feeCurrency: form.feeCurrency.trim() || "USD",
      feePeriod: (nullIfEmpty(form.feePeriod) as FeePeriod | null),
      renewalDueOn: nullIfEmpty(form.renewalDueOn),
      lastReportOn: nullIfEmpty(form.lastReportOn),
      notes: nullIfEmpty(form.notes),
    };
    try {
      if (membership) await api.patch(`/keydocs/memberships/${membership.id}`, body);
      else await api.post("/keydocs/memberships", body);
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!membership) return;
    if (!window.confirm(`Delete the membership "${membership.institution}"?`)) return;
    try {
      await api.delete(`/keydocs/memberships/${membership.id}`);
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <Modal onClose={onClose} label={membership?.institution ?? "New membership"}>
      <ModalHead
        eyebrow={membership ? "Membership" : "New membership"}
        title={membership?.institution ?? "Add a membership"}
        badges={
          membership && (
            <span className={MEMBERSHIP_STATUS_BADGE[membership.status]}>
              {MEMBERSHIP_STATUS_LABELS[membership.status]}
            </span>
          )
        }
        onClose={onClose}
      />
      <div className="modal-body">
        {error && <p className="error-text">{error}</p>}
        <form onSubmit={handleSave}>
          <fieldset disabled={!isAdmin || saving} style={{ border: 0, padding: 0, margin: 0 }}>
            <div className="form-row">
              <div className="field">
                <label>Institution</label>
                <input
                  required
                  value={form.institution}
                  onChange={(e) => set("institution", e.target.value)}
                />
              </div>
              <div className="field">
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value as MembershipStatus)}
                >
                  {Object.entries(MEMBERSHIP_STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>Year commenced</label>
                <input
                  inputMode="numeric"
                  value={form.yearCommenced}
                  onChange={(e) => set("yearCommenced", e.target.value)}
                />
              </div>
              <div className="field">
                <label>Last renewed (year)</label>
                <input
                  inputMode="numeric"
                  value={form.lastRenewedYear}
                  onChange={(e) => set("lastRenewedYear", e.target.value)}
                />
              </div>
              <div className="field">
                <label>Renewal note</label>
                <input
                  placeholder="Never, -, …"
                  value={form.renewedLabel}
                  onChange={(e) => set("renewedLabel", e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>Reporting</label>
                <input
                  placeholder="Quadrennial, N/A…"
                  value={form.reportingCycle}
                  onChange={(e) => set("reportingCycle", e.target.value)}
                />
              </div>
              <div className="field">
                <label>Renewal cycle</label>
                <input
                  placeholder="Annual ($100)"
                  value={form.renewalCycle}
                  onChange={(e) => set("renewalCycle", e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>Fee</label>
                <input
                  inputMode="decimal"
                  value={form.feeAmount}
                  onChange={(e) => set("feeAmount", e.target.value)}
                />
              </div>
              <div className="field">
                <label>Currency</label>
                <input value={form.feeCurrency} onChange={(e) => set("feeCurrency", e.target.value)} />
              </div>
              <div className="field">
                <label>Fee period</label>
                <select value={form.feePeriod} onChange={(e) => set("feePeriod", e.target.value)}>
                  <option value="">—</option>
                  {Object.entries(FEE_PERIOD_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>Renewal due on</label>
                <input
                  type="date"
                  value={form.renewalDueOn}
                  onChange={(e) => set("renewalDueOn", e.target.value)}
                />
              </div>
              <div className="field">
                <label>Last report submitted</label>
                <input
                  type="date"
                  value={form.lastReportOn}
                  onChange={(e) => set("lastReportOn", e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label>Notes</label>
              <textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </fieldset>

          {isAdmin && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : membership ? "Save changes" : "Create membership"}
              </button>
              {membership && (
                <button type="button" className="btn btn-danger" onClick={handleDelete}>
                  Delete
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </Modal>
  );
}
