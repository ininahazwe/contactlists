import { query } from "../../db/pool";

export interface ContactRelationRow {
  id: number;
  contact_id_a: number;
  contact_id_b: number;
  relation_type: string;
  confidence: "low" | "medium" | "high";
  source: string | null;
  notes: string | null;
  created_by: number;
  created_at: string;
}

/**
 * Returns every relation touching a given contact, in either direction
 * (the edge table is unordered from the API's point of view).
 */
export async function getRelationsForContact(contactId: number): Promise<ContactRelationRow[]> {
  return query<ContactRelationRow[]>(
    `SELECT * FROM contact_relations
     WHERE contact_id_a = ? OR contact_id_b = ?
     ORDER BY created_at DESC`,
    [contactId, contactId]
  );
}

export async function deleteRelation(id: number): Promise<ContactRelationRow | null> {
  const rows = await query<ContactRelationRow[]>(
    "SELECT * FROM contact_relations WHERE id = ? LIMIT 1",
    [id]
  );
  if (rows.length === 0) return null;
  await query("DELETE FROM contact_relations WHERE id = ?", [id]);
  return rows[0];
}
