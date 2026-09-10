import { useEffect, useState } from "react";
import { api } from "../api/client";
import {
  CONTACT_CATEGORY_LABELS,
  Organization,
  OrganizationContactEntry,
  OrganizationEventEntry,
} from "../types";
import { formatCount, personName } from "../utils/format";
import Avatar from "./Avatar";
import { IconArrowUpRight, IconCalendar, IconUsers } from "./Icons";
import Modal, { ModalHead } from "./Modal";
import Timeline from "./Timeline";

interface Props {
  organizationId: number;
  onClose: () => void;
  onOpenContact: (id: number) => void;
  onOpenEvent: (id: number) => void;
}

type Tab = "contacts" | "events";

/** Organization profile: its members on one side, its events on the other. */
export default function OrganizationModal({
  organizationId,
  onClose,
  onOpenContact,
  onOpenEvent,
}: Props) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [contacts, setContacts] = useState<OrganizationContactEntry[]>([]);
  const [events, setEvents] = useState<OrganizationEventEntry[]>([]);
  const [tab, setTab] = useState<Tab>("contacts");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([
      api.get<{ organization: Organization }>(`/organizations/${organizationId}`),
      api.get<{ items: OrganizationContactEntry[] }>(`/organizations/${organizationId}/contacts`),
      api.get<{ items: OrganizationEventEntry[] }>(`/organizations/${organizationId}/events`),
    ])
      .then(([o, c, e]) => {
        if (!alive) return;
        setOrg(o.organization);
        setContacts(c.items);
        setEvents(e.items);
      })
      .catch((err) => alive && setError(err instanceof Error ? err.message : "Error"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [organizationId]);

  return (
    <Modal onClose={onClose} label={org?.name ?? "Organization profile"}>
      <ModalHead
        eyebrow="Organization"
        title={org?.name ?? "Loading..."}
        sub={org?.type ?? undefined}
        avatar={org ? <Avatar name={org.name} size="lg" tone="teal" /> : undefined}
        onClose={onClose}
        badges={
          org && (
            <>
              {org.country && <span className="badge">{org.country}</span>}
              <span className="badge badge--ink">{formatCount(contacts.length)} contacts</span>
              <span className="badge">{formatCount(events.length)} events</span>
            </>
          )
        }
      />

      <div className="modal-body">
        {error && <p className="error-text">{error}</p>}
        {loading && !error && <div className="skeleton" style={{ height: 200 }} />}

        {!loading && org && (
          <>
            {org.notes && (
              <div className="card">
                <div className="card-head">
                  <h3 className="card-title">Profile</h3>
                </div>
                <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.6 }}>{org.notes}</p>
              </div>
            )}

            <div className="seg" style={{ alignSelf: "flex-start" }}>
              <button
                className={`seg-btn${tab === "contacts" ? " is-active" : ""}`}
                onClick={() => setTab("contacts")}
              >
                <IconUsers />
                Contacts ({contacts.length})
              </button>
              <button
                className={`seg-btn${tab === "events" ? " is-active" : ""}`}
                onClick={() => setTab("events")}
              >
                <IconCalendar />
                Events ({events.length})
              </button>
            </div>

            {tab === "contacts" &&
              (contacts.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "32px 20px" }}>
                  <p className="muted" style={{ margin: 0, fontSize: 14 }}>
                    No contact linked to this organization.
                  </p>
                </div>
              ) : (
                <div className="list">
                  {contacts.map((c) => (
                    <button
                      key={c.contact_id}
                      className="row"
                      onClick={() => onOpenContact(c.contact_id)}
                    >
                      <Avatar name={personName(c.first_name, c.last_name)} />
                      <span className="row-main">
                        <span className="row-name">{personName(c.first_name, c.last_name)}</span>
                        <span className="row-sub">
                          {c.role_title ?? CONTACT_CATEGORY_LABELS[c.category] ?? "—"}
                          {c.email ? ` · ${c.email}` : ""}
                        </span>
                      </span>
                      <span className="row-cell row-cell--sm">
                        {c.event_count} evt
                      </span>
                      <span className="row-go">
                        <IconArrowUpRight />
                      </span>
                    </button>
                  ))}
                </div>
              ))}

            {tab === "events" && (
              <Timeline
                entries={events.map((e) => ({
                  id: e.event_id,
                  title: e.title,
                  eventType: e.event_type,
                  startDate: e.start_date,
                  location: e.location,
                }))}
                onSelect={onOpenEvent}
                emptyLabel="This organization has no linked events."
              />
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
