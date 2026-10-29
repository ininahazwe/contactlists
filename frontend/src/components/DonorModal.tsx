import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { Donor, nullIfEmpty } from "../grants";
import Modal, { ModalHead } from "./Modal";

interface Props {
  /** null = new donor. */
  donor: Donor | null;
  onClose: () => void;
  onChanged: () => void;
}

interface FormState {
  name: string;
  notes: string;
}

function toForm(d: Donor | null): FormState {
  return { name: d?.name ?? "", notes: d?.notes ?? "" };
}

export default function DonorModal({ donor, onClose, onChanged }: Props) {
  const [form, setForm] = useState<FormState>(() => toForm(donor));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setForm(toForm(donor)), [donor]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = { name: form.name.trim(), notes: nullIfEmpty(form.notes) };
    try {
      if (donor) await api.patch(`/grants/donors/${donor.id}`, body);
      else await api.post("/grants/donors", body);
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!donor) return;
    const warning =
      donor.grant_total > 0
        ? `Delete "${donor.name}"? This also deletes its ${donor.grant_total} project${
            donor.grant_total > 1 ? "s" : ""
          }/grant${donor.grant_total > 1 ? "s" : ""}.`
        : `Delete the donor "${donor.name}"?`;
    if (!window.confirm(warning)) return;
    try {
      await api.delete(`/grants/donors/${donor.id}`);
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <Modal onClose={onClose} label={donor?.name ?? "New donor"}>
      <ModalHead
        eyebrow={donor ? "Donor" : "New donor"}
        title={donor?.name ?? "Add a donor"}
        onClose={onClose}
      />
      <div className="modal-body">
        {error && <p className="error-text">{error}</p>}
        <form onSubmit={handleSave}>
          <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0 }}>
            <div className="field">
              <label>Name</label>
              <input required value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </fieldset>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : donor ? "Save changes" : "Create donor"}
            </button>
            {donor && (
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
