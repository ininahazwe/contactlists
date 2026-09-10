import { query } from "../../db/pool";
import { AppError } from "../../utils/AppError";
import { AddEventContactInput, CreateEventInput, ListEventsQuery, UpdateEventInput } from "./schema";

export interface EventRow {
  id: number;
  title: string;
  event_type: "event" | "training" | "other";
  start_date: string;
  end_date: string | null;
  location: string | null;
  description: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface EventContactEntry {
  contact_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  per_diem: string | null;
  currency: string | null;
  notes: string | null;
}

export interface EventOrganizationEntry {
  organization_id: number;
  name: string;
  type: string | null;
}

export async function listEvents(
  filters: ListEventsQuery
): Promise<{ items: EventRow[]; total: number }> {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];
  let joinClause = "";

  if (filters.search) {
    conditions.push("e.title LIKE ?");
    params.push(`%${filters.search}%`);
  }
  if (filters.year) {
    conditions.push("YEAR(e.start_date) = ?");
    params.push(filters.year);
  }
  if (filters.organizationId) {
    joinClause = "INNER JOIN event_organizations eo ON eo.event_id = e.id";
    conditions.push("eo.organization_id = ?");
    params.push(filters.organizationId);
  }

  const where = conditions.join(" AND ");
  const offset = (filters.page - 1) * filters.pageSize;

  const items = await query<EventRow[]>(
    `SELECT e.* FROM events e ${joinClause}
     WHERE ${where}
     ORDER BY e.start_date DESC
     LIMIT ? OFFSET ?`,
    [...params, filters.pageSize, offset]
  );

  const countRows = await query<{ total: number }[]>(
    `SELECT COUNT(DISTINCT e.id) as total FROM events e ${joinClause} WHERE ${where}`,
    params
  );

  return { items, total: countRows[0]?.total ?? 0 };
}

export async function getEventById(id: number): Promise<EventRow> {
  const rows = await query<EventRow[]>("SELECT * FROM events WHERE id = ? LIMIT 1", [id]);
  if (rows.length === 0) throw AppError.notFound("Event");
  return rows[0];
}

export async function createEvent(input: CreateEventInput, createdBy: number): Promise<EventRow> {
  const result = await query<{ insertId: number }>(
    `INSERT INTO events (title, event_type, start_date, end_date, location, description, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.title,
      input.eventType,
      input.startDate,
      input.endDate ?? null,
      input.location ?? null,
      input.description ?? null,
      createdBy,
    ]
  );

  if (input.organizationIds?.length) {
    for (const organizationId of input.organizationIds) {
      await query(
        "INSERT IGNORE INTO event_organizations (event_id, organization_id) VALUES (?, ?)",
        [result.insertId, organizationId]
      );
    }
  }

  return getEventById(result.insertId);
}

export async function updateEvent(
  id: number,
  input: UpdateEventInput
): Promise<{ before: EventRow; after: EventRow }> {
  const before = await getEventById(id);

  const map: Record<string, unknown> = {
    title: input.title,
    event_type: input.eventType,
    start_date: input.startDate,
    end_date: input.endDate,
    location: input.location,
    description: input.description,
  };

  const fields: string[] = [];
  const params: unknown[] = [];
  for (const [col, val] of Object.entries(map)) {
    if (val !== undefined) {
      fields.push(`${col} = ?`);
      params.push(val);
    }
  }

  if (fields.length > 0) {
    params.push(id);
    await query(`UPDATE events SET ${fields.join(", ")} WHERE id = ?`, params);
  }

  const after = await getEventById(id);
  return { before, after };
}

export async function deleteEvent(id: number): Promise<EventRow> {
  const before = await getEventById(id);
  await query("DELETE FROM events WHERE id = ?", [id]);
  return before;
}

export async function addOrganization(eventId: number, organizationId: number): Promise<void> {
  await query(
    "INSERT IGNORE INTO event_organizations (event_id, organization_id) VALUES (?, ?)",
    [eventId, organizationId]
  );
}

export async function removeOrganization(eventId: number, organizationId: number): Promise<void> {
  await query("DELETE FROM event_organizations WHERE event_id = ? AND organization_id = ?", [
    eventId,
    organizationId,
  ]);
}

export async function listEventOrganizations(eventId: number): Promise<EventOrganizationEntry[]> {
  return query<EventOrganizationEntry[]>(
    `SELECT o.id AS organization_id, o.name, o.type
     FROM event_organizations eo
     INNER JOIN organizations o ON o.id = eo.organization_id
     WHERE eo.event_id = ?
     ORDER BY o.name`,
    [eventId]
  );
}

/**
 * The right-panel contact list for an event: who took part, in what
 * role, and the per-diem paid for that specific participation.
 */
export async function listEventContacts(eventId: number): Promise<EventContactEntry[]> {
  return query<EventContactEntry[]>(
    `SELECT
       c.id AS contact_id, c.first_name, c.last_name, c.email, c.phone,
       ec.role, ec.per_diem, ec.currency, ec.notes
     FROM event_contacts ec
     INNER JOIN contacts c ON c.id = ec.contact_id
     WHERE ec.event_id = ?
     ORDER BY c.last_name, c.first_name`,
    [eventId]
  );
}

export async function addContact(
  eventId: number,
  input: AddEventContactInput,
  createdBy: number
): Promise<void> {
  await query(
    `INSERT INTO event_contacts (event_id, contact_id, role, per_diem, currency, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       role = VALUES(role), per_diem = VALUES(per_diem),
       currency = VALUES(currency), notes = VALUES(notes)`,
    [
      eventId,
      input.contactId,
      input.role ?? null,
      input.perDiem ?? null,
      input.currency ?? "USD",
      input.notes ?? null,
      createdBy,
    ]
  );
}

export async function removeContact(eventId: number, contactId: number): Promise<void> {
  await query("DELETE FROM event_contacts WHERE event_id = ? AND contact_id = ?", [
    eventId,
    contactId,
  ]);
}

/** Distinct years that have at least one event, most recent first. */
export async function listYears(): Promise<{ year: number; eventCount: number }[]> {
  const rows = await query<{ year: number; eventCount: number }[]>(
    `SELECT YEAR(start_date) AS year, COUNT(*) AS eventCount
     FROM events
     GROUP BY YEAR(start_date)
     ORDER BY year DESC`
  );
  return rows;
}
