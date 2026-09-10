import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { IconUser } from "../components/Icons";
import {
  CONTACT_CATEGORY_LABELS,
  Contact,
  ContactCategory,
  ContactGender,
  Organization,
} from "../types";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: ContactGender | "";
  country: string;
  category: ContactCategory;
  facebook: string;
  twitter: string;
  roleTitle: string;
  organizationId: string;
  notes: string;
}

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  gender: "",
  country: "",
  category: "other",
  facebook: "",
  twitter: "",
  roleTitle: "",
  organizationId: "",
  notes: "",
};

export default function ContactFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ items: Organization[] }>("/organizations")
      .then((res) => setOrganizations(res.items))
      .catch(() => setOrganizations([]));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get<{ contact: Contact }>(`/contacts/${id}`).then((res) => {
      const c = res.contact;
      setForm({
        firstName: c.first_name,
        lastName: c.last_name,
        email: c.email ?? "",
        phone: c.phone ?? "",
        gender: c.gender ?? "",
        country: c.country ?? "",
        category: c.category,
        facebook: c.facebook ?? "",
        twitter: c.twitter ?? "",
        roleTitle: c.role_title ?? "",
        organizationId: c.organization_id ? String(c.organization_id) : "",
        notes: c.notes ?? "",
      });
    });
  }, [id, isEdit]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email || undefined,
      phone: form.phone || undefined,
      gender: form.gender || undefined,
      country: form.country || undefined,
      category: form.category,
      facebook: form.facebook || undefined,
      twitter: form.twitter || undefined,
      roleTitle: form.roleTitle || undefined,
      organizationId: form.organizationId ? Number(form.organizationId) : undefined,
      notes: form.notes || undefined,
    };

    try {
      const res = isEdit
        ? await api.patch<{ contact: Contact }>(`/contacts/${id}`, payload)
        : await api.post<{ contact: Contact }>("/contacts", payload);
      // Back to the directory with the contact's detail view open.
      navigate(`/?contact=${res.contact.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error while saving");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="form-wrap">
      <div className="page-head">
        <div className="crumbs">
          <span className="crumb">
            <IconUser />
            Directory
          </span>
          <span className="crumb crumb-muted">
            {isEdit ? "Edit contact" : "New contact"}
          </span>
        </div>
        <div className="title-row">
          <h1 className="title">{isEdit ? "Edit contact" : "New contact"}</h1>
        </div>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="field">
            <label>First name</label>
            <input
              required
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Last name</label>
            <input
              required
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>Organization</label>
          <select
            value={form.organizationId}
            onChange={(e) => update("organizationId", e.target.value)}
          >
            <option value="">— None —</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Title</label>
          <input value={form.roleTitle} onChange={(e) => update("roleTitle", e.target.value)} />
        </div>

        <div className="form-row">
          <div className="field">
            <label>Category</label>
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value as ContactCategory)}
            >
              {Object.entries(CONTACT_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Gender</label>
            <select
              value={form.gender}
              onChange={(e) => update("gender", e.target.value as ContactGender | "")}
            >
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="field">
            <label>Country</label>
            <input value={form.country} onChange={(e) => update("country", e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label>Facebook</label>
            <input value={form.facebook} onChange={(e) => update("facebook", e.target.value)} />
          </div>
          <div className="field">
            <label>Twitter / X</label>
            <input value={form.twitter} onChange={(e) => update("twitter", e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>Notes</label>
          <textarea rows={4} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate("/")}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
