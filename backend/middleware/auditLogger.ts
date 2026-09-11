import { Request } from "express";
import { query } from "../db/pool";

export type AuditAction = "create" | "update" | "delete" | "login" | "read";

// Opening a record often re-fetches it: a modal reopened, a jump from a
// contact to an event and back. Logging each of those would bury real
// activity under duplicates, so an identical read by the same person
// within this window counts once.
const READ_DEDUPE_MINUTES = 5;

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

interface RecordReadParams {
  userId: number;
  entityType: string;
  entityId: number | string;
  req?: Request;
}

/**
 * Logs a record consultation. Deliberately not called for searches and
 * lists: the search box fires on every keystroke, and logging that would
 * produce volume without telling anyone who looked at what.
 */
export async function recordRead({
  userId,
  entityType,
  entityId,
  req,
}: RecordReadParams): Promise<void> {
  try {
    const recent = await query<{ id: number }[]>(
      `SELECT id FROM audit_log
        WHERE user_id = ?
          AND action = 'read'
          AND entity_type = ?
          AND entity_id = ?
          AND created_at > DATE_SUB(NOW(), INTERVAL ${READ_DEDUPE_MINUTES} MINUTE)
        LIMIT 1`,
      [userId, entityType, String(entityId)]
    );
    if (recent.length > 0) return;
  } catch (err) {
    // A failed de-duplication check must not cost us the entry itself.
    console.error("[audit] failed to check for a recent read", err);
  }

  await recordAudit({ userId, action: "read", entityType, entityId, req });
}
