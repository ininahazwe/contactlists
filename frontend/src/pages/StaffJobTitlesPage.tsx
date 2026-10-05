import { useEffect, useState } from "react";
import { api } from "../api/client";
import { IconPlus, IconClose } from "../components/Icons";

interface JobTitle {
  id: number;
  canonical_title: string;
  category: string;
  seniority_level: string | null;
  description?: string;
}

interface JobTitleDetail extends JobTitle {
  variants: { id: number; variant_title: string }[];
  staffCount: number;
}

interface FormState {
  canonicalTitle: string;
  category: string;
  seniorityLevel: string;
  description: string;
}

const emptyForm: FormState = {
  canonicalTitle: "",
  category: "",
  seniorityLevel: "",
  description: "",
};

export default function StaffJobTitlesPage() {
  const [titles, setTitles] = useState<JobTitle[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<JobTitleDetail | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [newVariant, setNewVariant] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = Array.from(new Set(titles.map((t) => t.category))).sort();
  const severities = ["Intern", "Staff", "Mid", "Senior", "Executive"];

  useEffect(() => {
    loadTitles();
  }, []);

  async function loadTitles() {
    try {
      const res = await api.get<{ titles: JobTitle[] }>("/staff/meta/job-titles");
      setTitles(res.titles);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading job titles");
      setLoading(false);
    }
  }

  async function loadTitleDetail(id: number) {
    try {
      const res = await api.get<JobTitleDetail>(`/staff/meta/job-titles/${id}`);
      setSelectedTitle(res);
      setForm({
        canonicalTitle: res.canonical_title,
        category: res.category,
        seniorityLevel: res.seniority_level || "",
        description: res.description || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading title");
    }
  }

  async function handleCreate() {
    if (!form.canonicalTitle || !form.category) {
      setError("Missing required fields");
      return;
    }
    try {
      setIsCreating(true);
      await api.post("/staff/meta/job-titles", {
        canonicalTitle: form.canonicalTitle,
        category: form.category,
        seniorityLevel: form.seniorityLevel || null,
        description: form.description || null,
      });
      await loadTitles();
      setForm(emptyForm);
      setSelectedTitle(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating title");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdate(id: number) {
    try {
      await api.patch(`/staff/meta/job-titles/${id}`, {
        canonicalTitle: form.canonicalTitle,
        category: form.category,
        seniorityLevel: form.seniorityLevel || null,
        description: form.description || null,
      });
      await loadTitles();
      if (selectedTitle?.id === id) {
        await loadTitleDetail(id);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating title");
    }
  }

  async function handleAddVariant(titleId: number) {
    if (!newVariant.trim()) {
      setError("Variant title cannot be empty");
      return;
    }
    try {
      await api.post(`/staff/meta/job-titles/${titleId}/variants`, {
        variantTitle: newVariant,
      });
      setNewVariant("");
      await loadTitleDetail(titleId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error adding variant");
    }
  }

  async function handleRemoveVariant(titleId: number, variantId: number) {
    try {
      await api.delete(`/staff/meta/job-titles/${variantId}/variants`);
      await loadTitleDetail(titleId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error removing variant");
    }
  }

  if (loading) return <div className="page">Loading...</div>;

  return (
    <div className="page">
      <div className="page-head">
        <h1>Job Titles Management</h1>
        <button className="btn" onClick={() => { setSelectedTitle(null); setForm(emptyForm); }}>
          <IconPlus /> New title
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "300px 1fr", gap: "24px" }}>
        {/* List */}
        <div className="list">
          {titles.map((t) => (
            <button
              key={t.id}
              className="row"
              onClick={() => loadTitleDetail(t.id)}
              style={{
                background: selectedTitle?.id === t.id ? "var(--soft)" : "transparent",
                cursor: "pointer",
                gridTemplateColumns: "1fr",
              }}
            >
              <span className="row-name">{t.canonical_title}</span>
              <span className="row-sub">{t.category}</span>
            </button>
          ))}
        </div>

        {/* Detail */}
        <div>
          {error && (
            <div style={{ padding: "12px", background: "#fee", borderRadius: "4px", marginBottom: "16px", color: "#c00" }}>
              {error}
            </div>
          )}

          <div className="card">
            <div className="card-head">
              <h2 className="card-title">{selectedTitle ? "Edit title" : "New title"}</h2>
            </div>

            <div className="form">
              <div className="field">
                <label>Canonical title *</label>
                <input
                  value={form.canonicalTitle}
                  onChange={(e) => setForm({ ...form, canonicalTitle: e.target.value })}
                  disabled={Boolean(selectedTitle)}
                />
              </div>

              <div className="form-row">
                <div className="field">
                  <label>Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="">Select category...</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="_new">+ Add new category</option>
                  </select>
                  {form.category === "_new" && (
                    <input
                      placeholder="New category name"
                      value={form.category === "_new" ? "" : form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      style={{ marginTop: "8px" }}
                    />
                  )}
                </div>

                <div className="field">
                  <label>Seniority level</label>
                  <select
                    value={form.seniorityLevel}
                    onChange={(e) => setForm({ ...form, seniorityLevel: e.target.value })}
                  >
                    <option value="">None</option>
                    {severities.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {selectedTitle ? (
                  <>
                    <button
                      className="btn"
                      onClick={() => handleUpdate(selectedTitle.id)}
                    >
                      Save
                    </button>
                    <span className="muted" style={{ fontSize: "12px", marginTop: "8px" }}>
                      {selectedTitle.staffCount} staff member{selectedTitle.staffCount !== 1 ? "s" : ""}
                    </span>
                  </>
                ) : (
                  <button
                    className="btn"
                    onClick={handleCreate}
                    disabled={isCreating || !form.canonicalTitle || !form.category}
                  >
                    Create
                  </button>
                )}
              </div>
            </div>
          </div>

          {selectedTitle && (
            <div className="card" style={{ marginTop: "16px" }}>
              <div className="card-head">
                <h3 className="card-title">Variants ({selectedTitle.variants.length})</h3>
              </div>

              <div className="list">
                {selectedTitle.variants.map((v) => (
                  <div key={v.id} className="row" style={{ gridTemplateColumns: "1fr auto" }}>
                    <span>{v.variant_title}</span>
                    <button
                      className="icon-btn icon-btn--soft"
                      onClick={() => handleRemoveVariant(selectedTitle.id, v.id)}
                    >
                      <IconClose />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ padding: "14px 22px", display: "flex", gap: "8px" }}>
                <input
                  placeholder="Add new variant..."
                  value={newVariant}
                  onChange={(e) => setNewVariant(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddVariant(selectedTitle.id);
                  }}
                />
                <button
                  className="btn btn-ghost"
                  onClick={() => handleAddVariant(selectedTitle.id)}
                >
                  <IconPlus />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
