import { query } from "../../db/pool";
import { AppError } from "../../utils/AppError";
import { CreateContactInput, ListContactsQuery, UpdateContactInput } from "./schema";

export type ContactCategory =
  | "personal"
  | "diplomatic_corps"
  | "media"
  | "civil_society"
  | "state_institution"
  | "academia"
  | "political_party"
  | "stakeholder"
  | "company"
  | "other";

export interface ContactRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  gender: "male" | "female" | "other" | null;
  country: string | null;
  category: ContactCategory;
  facebook: string | null;
  twitter: string | null;
  organization_id: number | null;
  role_title: string | null;
  status: "active" | "archived";
  notes: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  /** Renseigné uniquement par getContactById (jointure), pas par la liste. */
  organization_name?: string | null;
}

export interface ContactTimelineEntry {
  event_id: number;
  title: string;
  event_type: "event" | "training" | "other";
  start_date: string;
  end_date: string | null;
  location: string | null;
  role: string | null;
  per_diem: string | null;
  currency: string | null;
}

export async function listContacts(
  filters: ListContactsQuery
): Promise<{ items: ContactRow[]; total: number }> {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];

  if (filters.search) {
    conditions.push("(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)");
    const like = `%${filters.search}%`;
    params.push(like, like, like);
  }

  if (filters.organizationId) {
    conditions.push("organization_id = ?");
    params.push(filters.organizationId);
  }

  if (filters.category) {
    conditions.push("category = ?");
    params.push(filters.category);
  }

  const where = conditions.join(" AND ");
  const offset = (filters.page - 1) * filters.pageSize;

  const items = await query<ContactRow[]>(
    `SELECT * FROM contacts WHERE ${where} ORDER BY last_name, first_name LIMIT ? OFFSET ?`,
    [...params, filters.pageSize, offset]
  );

  const countRows = await query<{ total: number }[]>(
    `SELECT COUNT(*) as total FROM contacts WHERE ${where}`,
    params
  );

  return { items, total: countRows[0]?.total ?? 0 };
}

export async function getContactById(id: number): Promise<ContactRow> {
  const rows = await query<ContactRow[]>(
    `SELECT c.*, o.name AS organization_name
     FROM contacts c
     LEFT JOIN organizations o ON o.id = c.organization_id
     WHERE c.id = ? LIMIT 1`,
    [id]
  );
  if (rows.length === 0) {
    throw AppError.notFound("Contact");
  }
  return rows[0];
}

/**
 * Every event this contact has taken part in, most recent first — the
 * data behind the timeline shown on the contact's detail panel.
 */
export async function getContactTimeline(contactId: number): Promise<ContactTimelineEntry[]> {
  return query<ContactTimelineEntry[]>(
    `SELECT
       e.id AS event_id, e.title, e.event_type, e.start_date, e.end_date, e.location,
       ec.role, ec.per_diem, ec.currency
     FROM event_contacts ec
     INNER JOIN events e ON e.id = ec.event_id
     WHERE ec.contact_id = ?
     ORDER BY e.start_date DESC`,
    [contactId]
  );
}

export async function createContact(
  input: CreateContactInput,
  createdBy: number
): Promise<ContactRow> {
  const result = await query<{ insertId: number }>(
    `INSERT INTO contacts
      (first_name, last_name, email, phone, gender, country, category, facebook, twitter,
       organization_id, role_title, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.firstName,
      input.lastName,
      input.email ?? null,
      input.phone ?? null,
      input.gender ?? null,
      input.country ?? null,
      input.category ?? "other",
      input.facebook ?? null,
      input.twitter ?? null,
      input.organizationId ?? null,
      input.roleTitle ?? null,
      input.notes ?? null,
      createdBy,
    ]
  );
  return getContactById(result.insertId);
}

export async function updateContact(
  id: number,
  input: UpdateContactInput
): Promise<{ before: ContactRow; after: ContactRow }> {
  const before = await getContactById(id);

  const map: Record<string, unknown> = {
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    phone: input.phone,
    gender: input.gender,
    country: input.country,
    category: input.category,
    facebook: input.facebook,
    twitter: input.twitter,
    organization_id: input.organizationId,
    role_title: input.roleTitle,
    status: input.status,
    notes: input.notes,
  };

  const fields: string[] = [];
  const params: unknown[] = [];
  for (const [column, value] of Object.entries(map)) {
    if (value !== undefined) {
      fields.push(`${column} = ?`);
      params.push(value);
    }
  }

  if (fields.length === 0) {
    return { before, after: before };
  }

  params.push(id);
  await query(`UPDATE contacts SET ${fields.join(", ")} WHERE id = ?`, params);

  const after = await getContactById(id);
  return { before, after };
}

export async function deleteContact(id: number): Promise<ContactRow> {
  const before = await getContactById(id);
  await query("DELETE FROM contacts WHERE id = ?", [id]);
  return before;
}
