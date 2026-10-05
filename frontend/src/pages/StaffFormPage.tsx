import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { IconUsers } from "../components/Icons";
import {
  STAFF_EMPLOYMENT_TYPE_LABELS,
  STAFF_STATUS_LABELS,
  StaffDetail,
  StaffEmploymentType,
  StaffMember,
  StaffStatus,
} from "../types";

interface FormState {
  fullName: string;
  jobTitle: string;
  department: string;
  employmentType: StaffEmploymentType;
  nationality: string;
  yearJoined: string;
  recruitedAs: string;
  status: StaffStatus;
  exitDate: string;
  cvUpdated: boolean;
  employeeInfoSheet: boolean;
}

const emptyForm: FormState = {
  fullName: "",
  jobTitle: "",
  department: "",
  employmentType: "full_time",
  nationality: "",
  yearJoined: "",
  recruitedAs: "",
  status: "active",
  exitDate: "",
  cvUpdated: false,
  employeeInfoSheet: false,
};

/**
 * Create/edit a staff member's core record (identity + employment). The
 * confidential fields (emergency contact, welfare/exit notes) are edited
 * from StaffModal instead -- a different endpoint, a different permission
 * story, and a form the admin opens deliberately, not on every profile.
 */
export default function StaffFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [jobTitles, setJobTitles] = useState<string[]>([]);

  useEffect(() => {
    api.get<{ titles: { canonical_title: string }[] }>("/staff/meta/job-titles")
      .then(res => setJobTitles(res.titles.map(t => t.canonical_title)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get<StaffDetail>(`/staff/${id}`).then((res) => {
      const s = res.staff;
      setForm({
        fullName: s.full_name,
        jobTitle: s.job_title ?? "",
        department: s.department ?? "",
        employmentType: s.employment_type,
        nationality: s.nationality ?? "",
        yearJoined: s.year_joined ? String(s.year_joined) : "",
        recruitedAs: s.recruited_as ?? "",
        status: s.status,
        exitDate: s.exit_date ?? "",
        cvUpdated: Boolean(s.cv_updated),
        employeeInfoSheet: Boolean(s.employee_info_sheet),
      });
    });
  }, [id, isEdit]);
  // Auto-update department when jobTitle changes
  useEffect(() => {
    if (!form.jobTitle) {
      setForm((prev) => ({ ...prev, department: "" }));
      return;
    }
    const searchParams = new URLSearchParams({ title: form.jobTitle });
    api
      .get<{ category: string | null }>(`/staff/meta/job-title-category?${searchParams}`)
      .then((res) => {
        setForm((prev) => ({ ...prev, department: res.category ?? "" }));
      })
      .catch(() => {
        // Si pas trouvé, laisser vide
        setForm((prev) => ({ ...prev, department: "" }));
      });
  }, [form.jobTitle]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      fullName: form.fullName,
      jobTitle: form.jobTitle || undefined,
      department: form.department || undefined,
      employmentType: form.employmentType,
      nationality: form.nationality || undefined,
      yearJoined: form.yearJoined ? Number(form.yearJoined) : undefined,
      recruitedAs: form.recruitedAs || undefined,
      status: form.status,
      exitDate: form.exitDate || undefined,
      cvUpdated: form.cvUpdated,
      employeeInfoSheet: form.employeeInfoSheet,
    };

    try {
      const res = isEdit
        ? await api.patch<{ staff: StaffMember }>(`/staff/${id}`, payload)
        : await api.post<{ staff: StaffMember }>("/staff", payload);
      navigate(`/staff?staffId=${res.staff.id}`);
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
            <IconUsers />
            Staff
          </span>
          <span className="crumb crumb-muted">{isEdit ? "Edit staff" : "New staff"}</span>
        </div>
        <div className="title-row">
          <h1 className="title">{isEdit ? "Edit staff" : "New staff"}</h1>
        </div>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="field">
            <label>Full name</label>
            <input
              required
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Job title</label>
            <input 
              list="job-titles-list"
              value={form.jobTitle} 
              onChange={(e) => update("jobTitle", e.target.value)}
              placeholder="Type to search or select..."
            />
            <datalist id="job-titles-list">
              {jobTitles.map((title) => <option key={title} value={title} />)}
            </datalist>
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label>Employment type</label>
            <select
              value={form.employmentType}
              onChange={(e) => update("employmentType", e.target.value as StaffEmploymentType)}
            >
              {Object.entries(STAFF_EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value as StaffStatus)}
            >
              {Object.entries(STAFF_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          {/* Department is auto-calculated from job_title → job_titles.category.
              It's read-only and updated automatically when job_title changes. */}
          <div className="field">
            <label>Department</label>
            <input 
              value={form.department} 
              readOnly 
              disabled 
              title="Auto-calculated from job title"
              className="muted"
            />
          </div>
          <div className="field">
            <label>Nationality</label>
            <input
              value={form.nationality}
              onChange={(e) => update("nationality", e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label>Year joined</label>
            <input
              type="number"
              min={1950}
              max={2100}
              value={form.yearJoined}
              onChange={(e) => update("yearJoined", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Recruited as</label>
            <input
              value={form.recruitedAs}
              onChange={(e) => update("recruitedAs", e.target.value)}
            />
          </div>
        </div>

        {form.status === "former" && (
          <div className="field">
            <label>Exit date</label>
            <input
              type="date"
              value={form.exitDate}
              onChange={(e) => update("exitDate", e.target.value)}
            />
          </div>
        )}

        <div className="checkbox-list">
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={form.cvUpdated}
              onChange={(e) => update("cvUpdated", e.target.checked)}
            />
            CV up to date
          </label>
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={form.employeeInfoSheet}
              onChange={(e) => update("employeeInfoSheet", e.target.checked)}
            />
            Employee information sheet on file
          </label>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate("/staff")}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
