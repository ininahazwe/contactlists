import { query } from "../../db/pool";

export interface AuditLogRow {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_data: unknown;
  after_data: unknown;
  ip_address: string | null;
  created_at: string;
}

export interface AuditFilter {
  entityType?: string;
  entityId?: string;
  userId?: number;
  page: number;
  pageSize: number;
}

/**
 * Read-only view over the audit trail. There is intentionally no
 * update/delete here — audit_log is append-only from the application's
 * perspective.
 */
export async function listAuditLog(filter: AuditFilter): Promise<{ items: AuditLogRow[]; total: number }> {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];

  if (filter.entityType) {
    conditions.push("entity_type = ?");
    params.push(filter.entityType);
  }
  if (filter.entityId) {
    conditions.push("entity_id = ?");
    params.push(filter.entityId);
  }
  if (filter.userId) {
    conditions.push("user_id = ?");
    params.push(filter.userId);
  }

  const where = conditions.join(" AND ");
  const offset = (filter.page - 1) * filter.pageSize;

  const items = await query<AuditLogRow[]>(
    `SELECT * FROM audit_log WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, filter.pageSize, offset]
  );

  const countRows = await query<{ total: number }[]>(
    `SELECT COUNT(*) as total FROM audit_log WHERE ${where}`,
    params
  );

  return { items, total: countRows[0]?.total ?? 0 };
}
