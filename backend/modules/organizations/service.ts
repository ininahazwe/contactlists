import { query } from "../../db/pool";
import { AppError } from "../../utils/AppError";
import { CreateOrganizationInput, UpdateOrganizationInput } from "./schema";

export interface OrganizationRow {
  id: number;
  name: string;
  type: string | null;
  country: string | null;
  notes: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationEventEntry {
  event_id: number;
  title: string;
  event_type: "event" | "training" | "other";
  start_date: string;
  end_date: string | null;
  location: string | null;
}

export async function listOrganizations(search?: string): Promise<OrganizationRow[]> {
  if (search) {
    return query<OrganizationRow[]>(
      "SELECT * FROM organizations WHERE name LIKE ? ORDER BY name LIMIT 100",
      [`%${search}%`]
    );
  }
  return query<OrganizationRow[]>("SELECT * FROM organizations ORDER BY name LIMIT 100");
}

export async function getOrganizationById(id: number): Promise<OrganizationRow> {
  const rows = await query<OrganizationRow[]>(
    "SELECT * FROM organizations WHERE id = ? LIMIT 1",
    [id]
  );
  if (rows.length === 0) throw AppError.notFound("Organization");
  return rows[0];
}

/**
 * Timeline of events this organization has been involved in, most
 * recent first — shown when the user clicks an organization result.
 */
export async function getOrganizationEvents(organizationId: number): Promise<OrganizationEventEntry[]> {
  return query<OrganizationEventEntry[]>(
    `SELECT e.id AS event_id, e.title, e.event_type, e.start_date, e.end_date, e.location
     FROM event_organizations eo
     INNER JOIN events e ON e.id = eo.event_id
     WHERE eo.organization_id = ?
     ORDER BY e.start_date DESC`,
    [organizationId]
  );
}

export interface OrganizationContactEntry {
  contact_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role_title: string | null;
  category: string;
  country: string | null;
  event_count: number;
}

/** Members of this organization, shown on its detail card. */
export async function getOrganizationContacts(
  organizationId: number
): Promise<OrganizationContactEntry[]> {
  return query<OrganizationContactEntry[]>(
    `SELECT
       c.id AS contact_id, c.first_name, c.last_name, c.email, c.phone,
       c.role_title, c.category, c.country,
       (SELECT COUNT(*) FROM event_contacts ec WHERE ec.contact_id = c.id) AS event_count
     FROM contacts c
     WHERE c.organization_id = ?
     ORDER BY c.last_name, c.first_name
     LIMIT 500`,
    [organizationId]
  );
}

export async function createOrganization(
  input: CreateOrganizationInput,
  createdBy: number
): Promise<OrganizationRow> {
  const result = await query<{ insertId: number }>(
    `INSERT INTO organizations (name, type, country, notes, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [input.name, input.type ?? null, input.country ?? null, input.notes ?? null, createdBy]
  );
  return getOrganizationById(result.insertId);
}

export async function updateOrganization(
  id: number,
  input: UpdateOrganizationInput
): Promise<{ before: OrganizationRow; after: OrganizationRow }> {
  const before = await getOrganizationById(id);

  const map: Record<string, unknown> = {
    name: input.name,
    type: input.type,
    country: input.country,
    notes: input.notes,
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
    await query(`UPDATE organizations SET ${fields.join(", ")} WHERE id = ?`, params);
  }

  const after = await getOrganizationById(id);
  return { before, after };
}

export async function deleteOrganization(id: number): Promise<OrganizationRow> {
  const before = await getOrganizationById(id);
  await query("DELETE FROM organizations WHERE id = ?", [id]);
  return before;
}
