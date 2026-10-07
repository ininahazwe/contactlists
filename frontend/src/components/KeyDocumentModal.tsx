import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import {
  KEY_DOC_STATUS_BADGE,
  KEY_DOC_STATUS_LABELS,
  KeyDocAction,
  KeyDocCategory,
  KeyDocStatus,
  KeyDocument,
  nullIfEmpty,
  numOrNull,
} from "../keydocs";
import { IconClose, IconPlus } from "./Icons";
import Modal, { ModalHead } from "./Modal";

interface Props {
  /** null = création d'un nouveau document. */
  documentId: number | null;
  categories: KeyDocCategory[];
  defaultCategoryId?: number;
  onClose: () => void;
  /** Appelé après toute écriture, pour que la liste se rafraîchisse. */
  onChanged: () => void;
}

interface FormState {
  categoryId: string;
  title: string;
  status: KeyDocStatus;
  yearLabel: string;
  producedLabel: string;
  producedYear: string;
  reviewedOn: string;
  reviewedYear: string;
  reviewLabel: string;
  nextReviewDue: string;
  driveUrl: string;
  comment: string;
}

function toForm(d: KeyDocument | null, defaultCategoryId?: number): FormState {
  return {
    categoryId: String(d?.category_id ?? defaultCategoryId ?? ""),
    title: d?.title ?? "",
    status: d?.status ?? "available",
    yearLabel: d?.year_label ?? "",
    producedLabel: d?.produced_label ?? "",
    producedYear: d?.produced_year != null ? String(d.produced_year) : "",
    reviewedOn: d?.reviewed_on ?? "",
    reviewedYear: d?.reviewed_year != null ? String(d.reviewed_year) : "",
    reviewLabel: d?.review_label ?? "",
    nextReviewDue: d?.next_review_due ?? "",
    driveUrl: d?.drive_url ?? "",
    comment: d?.comment ?? "",
  };
}

export default function KeyDocumentModal({
  documentId,
  categories,
  defaultCategoryId,
  onClose,
  onChanged,
}: Props) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [doc, setDoc] = useState<KeyDocument | null>(null);
  const [actions, setActions] = useState<KeyDocAction[]>([]);
  const [form, setForm] = useState<FormState>(() => toForm(null, defaultCategoryId));
  const [loading, setLoading] = useState(documentId !== null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newAction, setNewAction] = useState("");
  const [newActionDue, setNewActionDue] = useState("");

  const load = useCallback(async () => {
    if (documentId === null) return;
    try {
      const res = await api.get<{ document: KeyDocument; actions: KeyDocAction[] }>(
        `/keydocs/documents/${documentId}`
      );
      setDoc(res.document);
      setActions(res.actions);
      setForm(toForm(res.document));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this document");
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    void load();
  }, [load]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = {
      categoryId: Number(form.categoryId),
      title: form.title.trim(),
      status: form.status,
      yearLabel: nullIfEmpty(form.yearLabel),
      producedLabel: nullIfEmpty(form.producedLabel),
      producedYear: numOrNull(form.producedYear),
      reviewedOn: nullIfEmpty(form.reviewedOn),
      reviewedYear: numOrNull(form.reviewedYear),
      reviewLabel: nullIfEmpty(form.reviewLabel),
      nextReviewDue: nullIfEmpty(form.nextReviewDue),
      driveUrl: nullIfEmpty(form.driveUrl),
      comment: nullIfEmpty(form.comment),
    };
    try {
      if (documentId === null) {
        await api.post("/keydocs/documents", body);
        onChanged();
        onClose();
        return;
      }
      await api.patch(`/keydocs/documents/${documentId}`, body);
      onChanged();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (documentId === null) return;
    if (!window.confirm(`Delete "${doc?.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/keydocs/documents/${documentId}`);
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleAddAction(e: FormEvent) {
    e.preventDefault();
    if (documentId === null || !newAction.trim()) return;
    try {
      await api.post(`/keydocs/documents/${documentId}/actions`, {
        text: newAction.trim(),
        dueDate: nullIfEmpty(newActionDue),
      });
      setNewAction("");
      setNewActionDue("");
      onChanged();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the action");
    }
  }

  async function toggleAction(a: KeyDocAction) {
    try {
      await api.patch(`/keydocs/documents/${a.document_id}/actions/${a.id}`, { done: !a.done });
      onChanged();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the action");
    }
  }

  async function removeAction(a: KeyDocAction) {
    try {
      await api.delete(`/keydocs/documents/${a.document_id}/actions/${a.id}`);
      onChanged();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the action");
    }
  }

  const creating = documentId === null;

  return (
    <Modal onClose={onClose} label={creating ? "New document" : (doc?.title ?? "Document")}>
      <ModalHead
        eyebrow={creating ? "New document" : (doc?.category_name ?? "Document")}
        title={creating ? "Add a key document" : (doc?.title ?? "Loading…")}
        badges={
          doc && <span className={KEY_DOC_STATUS_BADGE[doc.status]}>{KEY_DOC_STATUS_LABELS[doc.status]}</span>
        }
        onClose={onClose}
        extra={
          doc?.drive_url && (
            <a className="btn" href={doc.drive_url} target="_blank" rel="noopener noreferrer">
              Open copy
            </a>
          )
        }
      />

      <div className="modal-body">
        {loading && <div className="skeleton" style={{ height: 120 }} />}
        {error && <p className="error-text">{error}</p>}

        {!loading && (
          <form onSubmit={handleSave}>
            <fieldset disabled={!isAdmin || saving} style={{ border: 0, padding: 0, margin: 0 }}>
              <div className="form-row">
                <div className="field">
                  <label>Title</label>
                  <input required value={form.title} onChange={(e) => set("title", e.target.value)} />
                </div>
                <div className="field">
                  <label>Category</label>
                  <select
                    required
                    value={form.categoryId}
                    onChange={(e) => set("categoryId", e.target.value)}
                  >
                    <option value="">Select…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => set("status", e.target.value as KeyDocStatus)}>
                    {Object.entries(KEY_DOC_STATUS_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Year (as written)</label>
                  <input
                    placeholder="2025 or 2025-2029"
                    value={form.yearLabel}
                    onChange={(e) => set("yearLabel", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label>Produced (as written)</label>
                  <input
                    placeholder="1997/2016"
                    value={form.producedLabel}
                    onChange={(e) => set("producedLabel", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Produced year</label>
                  <input
                    inputMode="numeric"
                    value={form.producedYear}
                    onChange={(e) => set("producedYear", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label>Last reviewed on</label>
                  <input
                    type="date"
                    value={form.reviewedOn}
                    onChange={(e) => set("reviewedOn", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Last reviewed year</label>
                  <input
                    inputMode="numeric"
                    value={form.reviewedYear}
                    onChange={(e) => set("reviewedYear", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Next review due</label>
                  <input
                    type="date"
                    value={form.nextReviewDue}
                    onChange={(e) => set("nextReviewDue", e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label>Review note (when not a date)</label>
                <input
                  placeholder="No longer in use"
                  value={form.reviewLabel}
                  onChange={(e) => set("reviewLabel", e.target.value)}
                />
              </div>

              <div className="field">
                <label>Link to the copy (Google Drive)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/…"
                  value={form.driveUrl}
                  onChange={(e) => set("driveUrl", e.target.value)}
                />
              </div>

              <div className="field">
                <label>Comment</label>
                <textarea
                  rows={3}
                  value={form.comment}
                  onChange={(e) => set("comment", e.target.value)}
                />
              </div>
            </fieldset>

            {isAdmin && (
              <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving…" : creating ? "Create document" : "Save changes"}
                </button>
                {!creating && (
                  <button type="button" className="btn btn-danger" onClick={handleDelete}>
                    Delete
                  </button>
                )}
              </div>
            )}
          </form>
        )}

        {!creating && !loading && (
          <section style={{ marginTop: 28 }}>
            <h3 className="card-title" style={{ marginBottom: 10 }}>
              To do ({actions.filter((a) => !a.done).length} open)
            </h3>

            {actions.length === 0 && <p className="muted">Nothing to do on this document.</p>}

            <div className="list">
              {actions.map((a) => (
                <div
                  key={a.id}
                  className="row row-grid"
                  style={{ gridTemplateColumns: "auto 1fr auto auto", gap: 12 }}
                >
                  <input
                    type="checkbox"
                    checked={!!a.done}
                    disabled={!isAdmin}
                    onChange={() => toggleAction(a)}
                    aria-label="Mark as done"
                  />
                  <span
                    className="row-name"
                    style={a.done ? { textDecoration: "line-through", opacity: 0.55 } : undefined}
                  >
                    {a.text}
                  </span>
                  <span className="row-cell row-cell--sm">{a.due_date ?? ""}</span>
                  {isAdmin && (
                    <button
                      className="icon-btn icon-btn--soft"
                      onClick={() => removeAction(a)}
                      aria-label="Delete this action"
                    >
                      <IconClose />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isAdmin && (
              <form onSubmit={handleAddAction} className="form-row" style={{ marginTop: 12 }}>
                <div className="field" style={{ flex: 3 }}>
                  <input
                    placeholder="Add something to do…"
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                  />
                </div>
                <div className="field">
                  <input
                    type="date"
                    value={newActionDue}
                    onChange={(e) => setNewActionDue(e.target.value)}
                    aria-label="Due date"
                  />
                </div>
                <button className="btn" type="submit" disabled={!newAction.trim()}>
                  <IconPlus />
                  Add
                </button>
              </form>
            )}
          </section>
        )}
      </div>
    </Modal>
  );
}
