import { query } from "../../db/pool";

export interface AuditLogRow {
  id: number;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
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
  action?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

export interface AuditSummary {
  total: number;
  activeUsers: number;
  byAction: { action: string; total: number }[];
  topUsers: {
    user_id: number | null;
    user_name: string | null;
    user_email: string | null;
    total: number;
  }[];
}

/**
 * Shared WHERE clause, so the list, its count and the summary always
 * describe the same slice of the trail.
 */
function buildConditions(filter: Partial<AuditFilter>): { where: string; params: unknown[] } {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];

  if (filter.entityType) {
    conditions.push("a.entity_type = ?");
    params.push(filter.entityType);
  }
  if (filter.entityId) {
    conditions.push("a.entity_id = ?");
    params.push(filter.entityId);
  }
  if (filter.userId) {
    conditions.push("a.user_id = ?");
    params.push(filter.userId);
  }
  if (filter.action) {
    conditions.push("a.action = ?");
    params.push(filter.action);
  }
  // Both bounds are inclusive: "to" covers the whole day it names, which is
  // what someone picking a date in a form means by it.
  if (filter.from) {
    conditions.push("a.created_at >= ?");
    params.push(`${filter.from} 00:00:00`);
  }
  if (filter.to) {
    conditions.push("a.created_at <= ?");
    params.push(`${filter.to} 23:59:59`);
  }

  return { where: conditions.join(" AND "), params };
}

/**
 * Read-only view over the audit trail. There is intentionally no
 * update/delete here — audit_log is append-only from the application's
 * perspective.
 */
export async function listAuditLog(
  filter: AuditFilter
): Promise<{ items: AuditLogRow[]; total: number }> {
  const { where, params } = buildConditions(filter);
  const offset = (filter.page - 1) * filter.pageSize;

  const items = await query<AuditLogRow[]>(
    `SELECT a.id, a.user_id, a.action, a.entity_type, a.entity_id,
            a.before_data, a.after_data, a.ip_address, a.created_at,
            u.name AS user_name, u.email AS user_email
       FROM audit_log a
       LEFT JOIN users u ON u.id = a.user_id
      WHERE ${where}
      ORDER BY a.created_at DESC, a.id DESC
      LIMIT ? OFFSET ?`,
    [...params, filter.pageSize, offset]
  );

  const countRows = await query<{ total: number }[]>(
    `SELECT COUNT(*) AS total FROM audit_log a WHERE ${where}`,
    params
  );

  return { items, total: Number(countRows[0]?.total ?? 0) };
}

export async function summarizeAuditLog(
  filter: Partial<AuditFilter>
): Promise<AuditSummary> {
  const { where, params } = buildConditions(filter);

  const byAction = await query<{ action: string; total: number }[]>(
    `SELECT a.action, COUNT(*) AS total
       FROM audit_log a
      WHERE ${where}
      GROUP BY a.action
      ORDER BY total DESC`,
    params
  );

  const topUsers = await query<AuditSummary["topUsers"]>(
    `SELECT a.user_id, u.name AS user_name, u.email AS user_email, COUNT(*) AS total
       FROM audit_log a
       LEFT JOIN users u ON u.id = a.user_id
      WHERE ${where}
      GROUP BY a.user_id, u.name, u.email
      ORDER BY total DESC
      LIMIT 8`,
    params
  );

  const distinctRows = await query<{ total: number }[]>(
    `SELECT COUNT(DISTINCT a.user_id) AS total FROM audit_log a WHERE ${where}`,
    params
  );

  return {
    total: byAction.reduce((sum, row) => sum + Number(row.total), 0),
    activeUsers: Number(distinctRows[0]?.total ?? 0),
    byAction: byAction.map((row) => ({ action: row.action, total: Number(row.total) })),
    topUsers: topUsers.map((row) => ({ ...row, total: Number(row.total) })),
  };
}
