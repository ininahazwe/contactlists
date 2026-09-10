import { query } from "../../db/pool";
import { AppError } from "../../utils/AppError";
import { CreateCaseInput, UpdateCaseInput } from "./schema";

export interface CaseRow {
  id: number;
  title: string;
  reference: string | null;
  status: "open" | "on_hold" | "closed";
  description: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

/**
 * Cases visible to a user: admins see everything, everyone else only
 * the cases they're a member of. Enforced here (not just in
 * middleware) so listing never leaks case titles the user shouldn't see.
 */
export async function listCasesForUser(userId: number, isAdmin: boolean): Promise<CaseRow[]> {
  if (isAdmin) {
    return query<CaseRow[]>("SELECT * FROM cases ORDER BY created_at DESC");
  }
  return query<CaseRow[]>(
    `SELECT c.* FROM cases c
     INNER JOIN case_members cm ON cm.case_id = c.id
     WHERE cm.user_id = ?
     ORDER BY c.created_at DESC`,
    [userId]
  );
}

export async function getCaseById(id: number): Promise<CaseRow> {
  const rows = await query<CaseRow[]>("SELECT * FROM cases WHERE id = ? LIMIT 1", [id]);
  if (rows.length === 0) throw AppError.notFound("Case");
  return rows[0];
}

export async function createCase(input: CreateCaseInput, createdBy: number): Promise<CaseRow> {
  const result = await query<{ insertId: number }>(
    `INSERT INTO cases (title, reference, description, created_by) VALUES (?, ?, ?, ?)`,
    [input.title, input.reference ?? null, input.description ?? null, createdBy]
  );

  // Creator is automatically a member of their own case.
  await query("INSERT INTO case_members (case_id, user_id, added_by) VALUES (?, ?, ?)", [
    result.insertId,
    createdBy,
    createdBy,
  ]);

  return getCaseById(result.insertId);
}

export async function updateCase(
  id: number,
  input: UpdateCaseInput
): Promise<{ before: CaseRow; after: CaseRow }> {
  const before = await getCaseById(id);

  const map: Record<string, unknown> = {
    title: input.title,
    reference: input.reference,
    description: input.description,
    status: input.status,
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
    await query(`UPDATE cases SET ${fields.join(", ")} WHERE id = ?`, params);
  }

  const after = await getCaseById(id);
  return { before, after };
}

export async function addMember(caseId: number, userId: number, addedBy: number): Promise<void> {
  await query(
    "INSERT IGNORE INTO case_members (case_id, user_id, added_by) VALUES (?, ?, ?)",
    [caseId, userId, addedBy]
  );
}

export async function removeMember(caseId: number, userId: number): Promise<void> {
  await query("DELETE FROM case_members WHERE case_id = ? AND user_id = ?", [caseId, userId]);
}

export async function addContact(caseId: number, contactId: number, addedBy: number): Promise<void> {
  await query(
    "INSERT IGNORE INTO case_contacts (case_id, contact_id, added_by) VALUES (?, ?, ?)",
    [caseId, contactId, addedBy]
  );
}

export async function listCaseContacts(caseId: number) {
  return query(
    `SELECT contacts.* FROM contacts
     INNER JOIN case_contacts cc ON cc.contact_id = contacts.id
     WHERE cc.case_id = ?
     ORDER BY contacts.last_name, contacts.first_name`,
    [caseId]
  );
}
