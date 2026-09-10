import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import {
  CONTACT_CATEGORY_LABELS,
  Contact,
  ContactTimelineEntry,
  GENDER_LABELS,
} from "../types";
import { formatCount, formatPerDiem, formatYear, personName } from "../utils/format";
import Avatar from "./Avatar";
import { IconBuilding, IconEdit } from "./Icons";
import Modal, { ModalHead } from "./Modal";
import Timeline from "./Timeline";

interface Props {
  contactId: number;
  onClose: () => void;
  onOpenEvent: (id: number) => void;
  onOpenOrganization: (id: number) => void;
}

/**
 * Contact profile: identity on one side, timeline on the other. The
 * timeline is the whole point of this view — the list of events the
 * person has taken part in, most recent first, with their role and
 * the per diem paid for that participation.
 */
export default function ContactModal({
  contactId,
  onClose,
  onOpenEvent,
  onOpenOrganization,
}: Props) {
  const [data, setData] = useState<{ contact: Contact; timeline: ContactTimelineEntry[] } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError(null);
    api
      .get<{ contact: Contact; timeline: ContactTimelineEntry[] }>(`/contacts/${contactId}`)
      .then((res) => alive && setData(res))
      .catch((err) => alive && setError(err instanceof Error ? err.message : "Error"));
    return () => {
      alive = false;
    };
  }, [contactId]);

  const fullName = data ? personName(data.contact.first_name, data.contact.last_name) : "";

  // Timeline bounds and per diem total: two figures that are
  // systematically sought on this kind of detail view.
  const years = (data?.timeline ?? [])
    .map((t) => Number(formatYear(t.start_date)))
    .filter((y) => Number.isFinite(y));
  const span = years.length
    ? years.length === 1 || Math.min(...years) === Math.max(...years)
      ? String(years[0])
      : `${Math.min(...years)} – ${Math.max(...years)}`
    : "—";
  const perDiemTotal = (data?.timeline ?? []).reduce(
    (sum, t) => sum + (Number(t.per_diem) || 0),
    0
  );

  return (
    <Modal onClose={onClose} label={fullName || "Contact profile"}>
      <ModalHead
        eyebrow="Contact"
        title={fullName || "Loading..."}
        sub={data?.contact.role_title ?? undefined}
        avatar={fullName ? <Avatar name={fullName} size="lg" /> : undefined}
        onClose={onClose}
        extra={
          data && (
            <Link
              to={`/contacts/${data.contact.id}/edit`}
              className="btn"
              title="Edit this contact"
            >
              <IconEdit />
              Edit
            </Link>
          )
        }
        badges={
          data && (
            <>
              <span className="badge badge--ink">
                {CONTACT_CATEGORY_LABELS[data.contact.category] ?? data.contact.category}
              </span>
              {data.contact.country && <span className="badge">{data.contact.country}</span>}
              {data.contact.gender && (
                <span className="badge">{GENDER_LABELS[data.contact.gender]}</span>
              )}
              {data.contact.organization_name && (
                <button
                  className="badge badge--teal"
                  onClick={() =>
                    data.contact.organization_id &&
                    onOpenOrganization(data.contact.organization_id)
                  }
                  title="Open the organization"
                >
                  <IconBuilding className="i" />
                  <span style={{ marginLeft: 6 }}>{data.contact.organization_name}</span>
                </button>
              )}
            </>
          )
        }
      />

      <div className="modal-body">
        {error && <p className="error-text">{error}</p>}

        {!data && !error && (
          <>
            <div className="skeleton" style={{ height: 92 }} />
            <div className="skeleton" style={{ height: 180 }} />
          </>
        )}

        {data && (
          <>
            <div className="modal-stats">
              <div className="stat">
                <b>{formatCount(data.timeline.length)}</b>
                <span>Events</span>
              </div>
              <div className="stat">
                <b>{span}</b>
                <span>Period covered</span>
              </div>
              <div className="stat">
                <b>{perDiemTotal ? formatCount(Math.round(perDiemTotal)) : "—"}</b>
                <span>Total per diem</span>
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <h3 className="card-title">Identity</h3>
              </div>
              <dl className="info-grid" style={{ marginTop: 6 }}>
                <div className="info">
                  <dt>Email</dt>
                  <dd>
                    {data.contact.email ? (
                      <a href={`mailto:${data.contact.email}`}>{data.contact.email}</a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div className="info">
                  <dt>Phone</dt>
                  <dd>
                    {data.contact.phone ? (
                      <a href={`tel:${data.contact.phone.replace(/\s/g, "")}`}>
                        {data.contact.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div className="info">
                  <dt>Organization</dt>
                  <dd>{data.contact.organization_name ?? "—"}</dd>
                </div>
                <div className="info">
                  <dt>Title</dt>
                  <dd>{data.contact.role_title ?? "—"}</dd>
                </div>
                <div className="info">
                  <dt>Country</dt>
                  <dd>{data.contact.country ?? "—"}</dd>
                </div>
                <div className="info">
                  <dt>Category</dt>
                  <dd>
                    {CONTACT_CATEGORY_LABELS[data.contact.category] ?? data.contact.category}
                  </dd>
                </div>
                {data.contact.facebook && (
                  <div className="info">
                    <dt>Facebook</dt>
                    <dd>{data.contact.facebook}</dd>
                  </div>
                )}
                {data.contact.twitter && (
                  <div className="info">
                    <dt>Twitter / X</dt>
                    <dd>{data.contact.twitter}</dd>
                  </div>
                )}
                {data.contact.notes && (
                  <div className="info" style={{ gridColumn: "1 / -1" }}>
                    <dt>Notes</dt>
                    <dd>{data.contact.notes}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="card-head" style={{ marginTop: 8 }}>
              <h3 className="card-title">Timeline</h3>
              <span className="group-count">{data.timeline.length}</span>
            </div>

            <Timeline
              entries={data.timeline.map((t) => ({
                id: t.event_id,
                title: t.title,
                eventType: t.event_type,
                startDate: t.start_date,
                location: t.location,
                role: t.role,
                perDiem: formatPerDiem(t.per_diem, t.currency),
              }))}
              onSelect={onOpenEvent}
              emptyLabel="This contact is not yet linked to any event."
            />
          </>
        )}
      </div>
    </Modal>
  );
}
