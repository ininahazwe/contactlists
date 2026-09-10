import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import {
  EVENT_TYPE_LABELS,
  EventContactEntry,
  EventItem,
  EventOrganizationEntry,
} from "../types";
import { formatCount, formatDate, formatPerDiem, personName } from "../utils/format";
import Avatar from "./Avatar";
import { IconArrowUpRight, IconCalendar, IconPin, IconSearch } from "./Icons";
import Modal, { ModalHead } from "./Modal";

interface Props {
  eventId: number;
  onClose: () => void;
  onOpenContact: (id: number) => void;
  onOpenOrganization: (id: number) => void;
}

/**
 * Event profile: its participants, with a local filter — real lists run
 * into the hundreds of people (402 for WAMECA 2023), so we search the
 * list rather than scroll through it.
 */
export default function EventModal({
  eventId,
  onClose,
  onOpenContact,
  onOpenOrganization,
}: Props) {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [organizations, setOrganizations] = useState<EventOrganizationEntry[]>([]);
  const [contacts, setContacts] = useState<EventContactEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [allOrgs, setAllOrgs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setFilter("");
    setAllOrgs(false);
    Promise.all([
      api.get<{ event: EventItem; organizations: EventOrganizationEntry[] }>(`/events/${eventId}`),
      api.get<{ items: EventContactEntry[] }>(`/events/${eventId}/contacts`),
    ])
      .then(([e, c]) => {
        if (!alive) return;
        setEvent(e.event);
        setOrganizations(e.organizations ?? []);
        setContacts(c.items);
      })
      .catch((err) => alive && setError(err instanceof Error ? err.message : "Error"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [eventId]);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      `${c.first_name} ${c.last_name} ${c.email ?? ""} ${c.role ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [contacts, filter]);

  const perDiemTotal = contacts.reduce((sum, c) => sum + (Number(c.per_diem) || 0), 0);

  return (
    <Modal onClose={onClose} label={event?.title ?? "Event profile"}>
      <ModalHead
        eyebrow={event ? EVENT_TYPE_LABELS[event.event_type] ?? "Event" : "Event"}
        title={event?.title ?? "Loading..."}
        sub={
          event && (
            <span style={{ display: "inline-flex", gap: 14, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <IconCalendar />
                {formatDate(event.start_date)}
                {event.end_date && event.end_date !== event.start_date
                  ? ` → ${formatDate(event.end_date)}`
                  : ""}
              </span>
              {event.location && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <IconPin />
                  {event.location}
                </span>
              )}
            </span>
          )
        }
        avatar={event ? <Avatar name={event.title} size="lg" tone="mint" /> : undefined}
        onClose={onClose}
        badges={
          organizations.length > 0 ? (
            <span className="badge badge--teal">
              {organizations.length} organization{organizations.length > 1 ? "s" : ""}
            </span>
          ) : undefined
        }
      />

      <div className="modal-body">
        {error && <p className="error-text">{error}</p>}
        {loading && !error && <div className="skeleton" style={{ height: 220 }} />}

        {!loading && event && (
          <>
            <div className="modal-stats">
              <div className="stat">
                <b>{formatCount(contacts.length)}</b>
                <span>Participants</span>
              </div>
              <div className="stat">
                <b>{formatCount(organizations.length)}</b>
                <span>Organizations</span>
              </div>
              <div className="stat">
                <b>{perDiemTotal ? formatCount(Math.round(perDiemTotal)) : "—"}</b>
                <span>Total per diem</span>
              </div>
            </div>

            {event.description && (
              <div className="card">
                <div className="card-head">
                  <h3 className="card-title">Description</h3>
                </div>
                <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.6 }}>
                  {event.description}
                </p>
              </div>
            )}

            {organizations.length > 0 && (
              <div className="card">
                <div className="card-head">
                  <h3 className="card-title">Represented organizations</h3>
                  <span className="group-count">{organizations.length}</span>
                </div>
                {/* Some editions gather 70 outlets: the list stays
                    collapsed so it doesn't drown out the participants. */}
                <div
                  className={`chip-cloud${
                    !allOrgs && organizations.length > 12 ? " chip-cloud--collapsed" : ""
                  }`}
                >
                  {organizations.map((o) => (
                    <button
                      key={o.organization_id}
                      className="badge badge--teal"
                      onClick={() => onOpenOrganization(o.organization_id)}
                      title="Open the organization"
                    >
                      {o.name}
                    </button>
                  ))}
                </div>
                {organizations.length > 12 && (
                  <button className="chip-more" onClick={() => setAllOrgs((v) => !v)}>
                    {allOrgs ? "Collapse" : `Show all ${organizations.length} organizations`}
                  </button>
                )}
              </div>
            )}

            <div className="card-head" style={{ marginTop: 4 }}>
              <h3 className="card-title">Participants</h3>
              <span className="group-count">{visible.length}</span>
            </div>

            {contacts.length > 8 && (
              <div className="search-field">
                <IconSearch className="i search-ico" />
                <input
                  className="search-input"
                  style={{ height: 48 }}
                  placeholder="Filter participants..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
            )}

            {visible.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "32px 20px" }}>
                <p className="muted" style={{ margin: 0, fontSize: 14 }}>
                  {contacts.length === 0
                    ? "No participant recorded for this event."
                    : `No participant matches "${filter}".`}
                </p>
              </div>
            ) : (
              <div className="list">
                {visible.map((c) => {
                  const perDiem = formatPerDiem(c.per_diem, c.currency);
                  return (
                    <button
                      key={c.contact_id}
                      className="row"
                      onClick={() => onOpenContact(c.contact_id)}
                    >
                      <Avatar name={personName(c.first_name, c.last_name)} />
                      <span className="row-main">
                        <span className="row-name">{personName(c.first_name, c.last_name)}</span>
                        <span className="row-sub">{c.email ?? c.phone ?? "—"}</span>
                      </span>
                      <span className="row-cell row-cell--sm">{c.role ?? "—"}</span>
                      <span className="row-cell row-cell--sm">
                        {perDiem ? <span className="badge badge--lime">{perDiem}</span> : "—"}
                      </span>
                      <span className="row-go">
                        <IconArrowUpRight />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
