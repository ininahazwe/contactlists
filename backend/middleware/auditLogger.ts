import { Request } from "express";
import { query } from "../db/pool";

export type AuditAction = "create" | "update" | "delete" | "login";

interface RecordAuditParams {
  userId: number | null;
  action: AuditAction;
  entityType: string;
  entityId: number | string | null;
  before?: unknown;
  after?: unknown;
  req?: Request;
}

/**
 * Append-only change history. Never update or delete rows in audit_log
 * from application code.
 */
export async function recordAudit({
  userId,
  action,
  entityType,
  entityId,
  before,
  after,
  req,
}: RecordAuditParams): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_log
        (user_id, action, entity_type, entity_id, before_data, after_data, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        action,
        entityType,
        entityId,
        before ? JSON.stringify(before) : null,
        after ? JSON.stringify(after) : null,
        req?.ip ?? null,
      ]
    );
  } catch (err) {
    // Audit logging must never break the primary request flow.
    console.error("[audit] failed to record entry", err);
  }
}
