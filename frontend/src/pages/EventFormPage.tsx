import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { IconCalendar, IconSearch } from "../components/Icons";
import { EventItem, EventType, Organization } from "../types";

export default function EventFormPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<EventType>("event");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgFilter, setOrgFilter] = useState("");
  const [selectedOrgIds, setSelectedOrgIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ items: Organization[] }>("/organizations")
      .then((res) => setOrganizations(res.items))
      .catch(() => setOrganizations([]));
  }, []);

  // The directory has close to 1,500 organizations: the checkbox list
  // is only usable with a filter above it.
  const visibleOrgs = useMemo(() => {
    const q = orgFilter.trim().toLowerCase();
    const base = q
      ? organizations.filter((o) => o.name.toLowerCase().includes(q))
      : organizations;
    return base.slice(0, 200);
  }, [organizations, orgFilter]);

  function toggleOrg(id: number) {
    setSelectedOrgIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await api.post<{ event: EventItem }>("/events", {
        title,
        eventType,
        startDate,
        endDate: endDate || undefined,
        location: location || undefined,
        description: description || undefined,
        organizationIds: selectedOrgIds.length ? selectedOrgIds : undefined,
      });
      navigate(`/?event=${res.event.id}`);
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
            <IconCalendar />
            Directory
          </span>
          <span className="crumb crumb-muted">New event</span>
        </div>
        <div className="title-row">
          <h1 className="title">New event</h1>
        </div>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="field">
          <label>Title</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="form-row">
          <div className="field">
            <label>Type</label>
            <select value={eventType} onChange={(e) => setEventType(e.target.value as EventType)}>
              <option value="event">Event</option>
              <option value="training">Training</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="field">
            <label>Start date</label>
            <input
              required
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label>End date (optional)</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        <div className="field">
          <label>Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="field">
          <label>
            Involved organization(s)
            {selectedOrgIds.length > 0 && (
              <span className="badge badge--lime" style={{ marginLeft: 8 }}>
                {selectedOrgIds.length} selected
              </span>
            )}
          </label>

          <div className="search-field" style={{ marginBottom: 8 }}>
            <IconSearch className="i search-ico" />
            <input
              className="search-input"
              style={{ height: 46 }}
              placeholder="Search for an organization..."
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
            />
          </div>

          <div className="checkbox-list">
            {organizations.length === 0 && (
              <p className="muted" style={{ margin: 6, fontSize: 13.5 }}>
                No organization recorded yet.
              </p>
            )}
            {organizations.length > 0 && visibleOrgs.length === 0 && (
              <p className="muted" style={{ margin: 6, fontSize: 13.5 }}>
                No organization matches "{orgFilter}".
              </p>
            )}
            {visibleOrgs.map((o) => (
              <label key={o.id} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={selectedOrgIds.includes(o.id)}
                  onChange={() => toggleOrg(o.id)}
                />
                {o.name}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Create event"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate("/")}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
