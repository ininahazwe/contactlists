import {
  CONTACT_CATEGORY_LABELS,
  ContactHit,
  EVENT_TYPE_LABELS,
  EventHit,
  OrganizationHit,
} from "../types";
import { formatDate, personName } from "../utils/format";
import Avatar from "./Avatar";
import {
  IconArrowUpRight,
  IconBuilding,
  IconCalendar,
  IconPin,
  IconTimeline,
  IconUsers,
} from "./Icons";

/* ============================================================
   Mini cards
   ============================================================ */

export function ContactCard({ c, onClick }: { c: ContactHit; onClick: () => void }) {
  const name = personName(c.first_name, c.last_name);
  return (
    <button className="mini card" onClick={onClick} title={`Open ${name}'s profile`}>
      <span className="mini-top">
        <Avatar name={name} size="md" />
        <span style={{ minWidth: 0 }}>
          <span className="mini-name">{name}</span>
          <span className="mini-sub">
            {c.role_title ?? CONTACT_CATEGORY_LABELS[c.category] ?? "—"}
          </span>
        </span>
      </span>
      <span className="mini-foot">
        <span className="mini-meta">
          {c.organization_name ? (
            <>
              <IconBuilding />
              <span>{c.organization_name}</span>
            </>
          ) : (
            <>
              <IconPin />
              <span>{c.country ?? "—"}</span>
            </>
          )}
        </span>
        <span className="badge">{c.event_count} evt</span>
      </span>
    </button>
  );
}

export function OrganizationCard({
  o,
  onClick,
}: {
  o: OrganizationHit;
  onClick: () => void;
}) {
  return (
    <button className="mini card" onClick={onClick} title={`Open ${o.name}`}>
      <span className="mini-top">
        <Avatar name={o.name} size="md" tone="teal" />
        <span style={{ minWidth: 0 }}>
          <span className="mini-name">{o.name}</span>
          <span className="mini-sub">{o.type ?? o.country ?? "Organization"}</span>
        </span>
      </span>
      <span className="mini-foot">
        <span className="mini-meta">
          <IconUsers />
          <span>{o.contact_count} contact{o.contact_count > 1 ? "s" : ""}</span>
        </span>
        <span className="badge">{o.event_count} evt</span>
      </span>
    </button>
  );
}

export function EventCard({ e, onClick }: { e: EventHit; onClick: () => void }) {
  return (
    <button className="mini card" onClick={onClick} title={`Open ${e.title}`}>
      <span className="mini-top">
        <Avatar name={e.title} size="md" tone="mint" />
        <span style={{ minWidth: 0 }}>
          <span className="mini-name">{e.title}</span>
          <span className="mini-sub">
            {EVENT_TYPE_LABELS[e.event_type] ?? e.event_type} · {formatDate(e.start_date)}
          </span>
        </span>
      </span>
      <span className="mini-foot">
        <span className="mini-meta">
          <IconPin />
          <span>{e.location ?? "Location not specified"}</span>
        </span>
        <span className="badge badge--lime">{e.contact_count} part.</span>
      </span>
    </button>
  );
}

/* ============================================================
   List rows
   ============================================================ */

export function ContactRow({ c, onClick }: { c: ContactHit; onClick: () => void }) {
  const name = personName(c.first_name, c.last_name);
  return (
    <button className="row" onClick={onClick} title={`Open ${name}'s profile`}>
      <Avatar name={name} />
      <span className="row-main">
        <span className="row-name">{name}</span>
        <span className="row-sub">
          {c.email ?? c.phone ?? c.role_title ?? "—"}
        </span>
      </span>
      <span className="row-cell">{c.organization_name ?? "—"}</span>
      <span className="row-cell row-cell--sm">{c.country ?? "—"}</span>
      <span className="row-cell row-cell--sm">
        {CONTACT_CATEGORY_LABELS[c.category] ?? c.category}
      </span>
      <span className="row-cell row-cell--sm">
        <span className="mini-meta">
          <IconTimeline />
          <span>{c.event_count}</span>
        </span>
      </span>
      <span className="row-go">
        <IconArrowUpRight />
      </span>
    </button>
  );
}

export function OrganizationRow({
  o,
  onClick,
}: {
  o: OrganizationHit;
  onClick: () => void;
}) {
  return (
    <button className="row" onClick={onClick} title={`Open ${o.name}`}>
      <Avatar name={o.name} tone="teal" />
      <span className="row-main">
        <span className="row-name">{o.name}</span>
        <span className="row-sub">{o.type ?? "—"}</span>
      </span>
      <span className="row-cell row-cell--sm">{o.country ?? "—"}</span>
      <span className="row-cell row-cell--sm">
        {o.contact_count} contact{o.contact_count > 1 ? "s" : ""}
      </span>
      <span className="row-cell row-cell--sm">{o.event_count} evt</span>
      <span className="row-go">
        <IconArrowUpRight />
      </span>
    </button>
  );
}

export function EventRow({ e, onClick }: { e: EventHit; onClick: () => void }) {
  return (
    <button className="row" onClick={onClick} title={`Open ${e.title}`}>
      <Avatar name={e.title} tone="mint" />
      <span className="row-main">
        <span className="row-name">{e.title}</span>
        <span className="row-sub">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <IconCalendar />
            {formatDate(e.start_date)}
          </span>
        </span>
      </span>
      <span className="row-cell">{e.location ?? "—"}</span>
      <span className="row-cell row-cell--sm">
        {EVENT_TYPE_LABELS[e.event_type] ?? e.event_type}
      </span>
      <span className="row-cell row-cell--sm">
        <span className="badge badge--lime">{e.contact_count} part.</span>
      </span>
      <span className="row-go">
        <IconArrowUpRight />
      </span>
    </button>
  );
}
