import { EVENT_TYPE_LABELS, EventType } from "../types";
import { formatDate, formatYear } from "../utils/format";
import { IconCalendar, IconCash, IconPin, IconUser } from "./Icons";

export interface TimelineEntry {
  id: number;
  title: string;
  eventType: EventType;
  startDate: string;
  location: string | null;
  /** Role held during the event (participant, trainer...). */
  role?: string | null;
  /** Per diem for this participation, already formatted. */
  perDiem?: string | null;
}

interface Props {
  entries: TimelineEntry[];
  onSelect: (eventId: number) => void;
  emptyLabel?: string;
}

/**
 * Chronological timeline (most recent at top). Each milestone is
 * clickable and opens the corresponding event's detail view.
 */
export default function Timeline({ entries, onSelect, emptyLabel }: Props) {
  if (entries.length === 0) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "32px 20px" }}>
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>
          {emptyLabel ?? "No events recorded."}
        </p>
      </div>
    );
  }

  return (
    <div className="timeline">
      {entries.map((e) => (
        <button
          key={`${e.id}-${e.startDate}`}
          className="tl-item"
          onClick={() => onSelect(e.id)}
          title={`Open "${e.title}"`}
        >
          <span className="tl-rail">
            <span className="tl-line" />
            <span className="tl-dot" />
          </span>
          <span className="tl-card">
            <span className="tl-year">{formatYear(e.startDate)}</span>
            <span className="tl-title">{e.title}</span>
            <span className="tl-meta">
              <span className="tl-meta-item">
                <IconCalendar />
                {formatDate(e.startDate)}
              </span>
              {e.location && (
                <span className="tl-meta-item">
                  <IconPin />
                  {e.location}
                </span>
              )}
              {e.role && (
                <span className="tl-meta-item">
                  <IconUser />
                  {e.role}
                </span>
              )}
              {e.perDiem && (
                <span className="tl-meta-item">
                  <IconCash />
                  {e.perDiem}
                </span>
              )}
              <span className="badge">{EVENT_TYPE_LABELS[e.eventType] ?? e.eventType}</span>
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
