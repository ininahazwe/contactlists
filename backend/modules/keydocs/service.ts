import { query } from "../../db/pool";
import { AppError } from "../../utils/AppError";
import {
  CreateActionInput,
  CreateKeyDocumentInput,
  CreateMembershipInput,
  ListKeyDocumentsQuery,
  ListMembershipsQuery,
  UpdateActionInput,
  UpdateKeyDocumentInput,
  UpdateMembershipInput,
} from "./schema";

export interface KeyDocumentRow {
  id: number;
  category_id: number;
  category_name: string;
  title: string;
  status: "available" | "outdated" | "in_review" | "missing";
  year_label: string | null;
  produced_label: string | null;
  produced_year: number | null;
  reviewed_on: string | null;
  reviewed_year: number | null;
  review_label: string | null;
  next_review_due: string | null;
  drive_url: string | null;
  comment: string | null;
  owner_staff_id: number | null;
  owner_name: string | null;
  open_actions: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface KeyDocumentActionRow {
  id: number;
  document_id: number;
  text: string;
  done: number;
  due_date: string | null;
  created_at: string;
}

export interface MembershipRow {
  id: number;
  institution: string;
  year_commenced: number | null;
  last_renewed_year: number | null;
  renewed_label: string | null;
  status: "active" | "renewal_due" | "lapsed" | "not_applicable" | "unknown";
  reporting_cycle: string | null;
  renewal_cycle: string | null;
  fee_amount: string | null;
  fee_currency: string;
  fee_period: "annual" | "multi_year" | "one_time" | null;
  renewal_due_on: string | null;
  last_report_on: string | null;
  organization_id: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** camelCase (API) -> colonne SQL. Sert à construire les INSERT/UPDATE dynamiques. */
const DOC_COLUMNS: Record<string, string> = {
  categoryId: "category_id",
  title: "title",
  status: "status",
  yearLabel: "year_label",
  producedLabel: "produced_label",
  producedYear: "produced_year",
  reviewedOn: "reviewed_on",
  reviewedYear: "reviewed_year",
  reviewLabel: "review_label",
  nextReviewDue: "next_review_due",
  driveUrl: "drive_url",
  comment: "comment",
  ownerStaffId: "owner_staff_id",
};

const MEMBERSHIP_COLUMNS: Record<string, string> = {
  institution: "institution",
  yearCommenced: "year_commenced",
  lastRenewedYear: "last_renewed_year",
  renewedLabel: "renewed_label",
  status: "status",
  reportingCycle: "reporting_cycle",
  renewalCycle: "renewal_cycle",
  feeAmount: "fee_amount",
  feeCurrency: "fee_currency",
  feePeriod: "fee_period",
  renewalDueOn: "renewal_due_on",
  lastReportOn: "last_report_on",
  organizationId: "organization_id",
  notes: "notes",
};

function pickColumns(
  input: Record<string, unknown>,
  mapping: Record<string, string>
): { columns: string[]; values: unknown[] } {
  const columns: string[] = [];
  const values: unknown[] = [];
  for (const [key, column] of Object.entries(mapping)) {
    const value = input[key];
    if (value !== undefined) {
      columns.push(column);
      values.push(value);
    }
  }
  return { columns, values };
}

function isDuplicateError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "ER_DUP_ENTRY";
}

// ---------------------------------------------------------------- catégories

export async function listCategories(): Promise<
  { id: number; name: string; sort_order: number; total: number }[]
> {
  return query(
    `SELECT c.id, c.name, c.sort_order, COUNT(d.id) AS total
     FROM key_document_categories c
     LEFT JOIN key_documents d ON d.category_id = c.id
     GROUP BY c.id, c.name, c.sort_order
     ORDER BY c.sort_order, c.name`
  );
}

export async function createCategory(name: string): Promise<{ id: number; name: string }> {
  try {
    const maxRows = await query<{ m: number | null }[]>(
      "SELECT MAX(sort_order) AS m FROM key_document_categories"
    );
    const result = await query<{ insertId: number }>(
      "INSERT INTO key_document_categories (name, sort_order) VALUES (?, ?)",
      [name, (maxRows[0]?.m ?? 0) + 1]
    );
    return { id: result.insertId, name };
  } catch (err) {
    if (isDuplicateError(err)) throw new AppError(`La catégorie "${name}" existe déjà`, 409);
    throw err;
  }
}

// ----------------------------------------------------------------- documents

const DOC_SELECT = `
  SELECT d.*, c.name AS category_name, s.full_name AS owner_name,
         (SELECT COUNT(*) FROM key_document_actions a WHERE a.document_id = d.id AND a.done = 0) AS open_actions
  FROM key_documents d
  JOIN key_document_categories c ON c.id = d.category_id
  LEFT JOIN staff s ON s.id = d.owner_staff_id`;

export async function listDocuments(
  filters: ListKeyDocumentsQuery
): Promise<{ items: KeyDocumentRow[]; total: number }> {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];

  if (filters.search) {
    conditions.push("(d.title LIKE ? OR d.comment LIKE ?)");
    const like = `%${filters.search}%`;
    params.push(like, like);
  }
  if (filters.categoryId) {
    conditions.push("d.category_id = ?");
    params.push(filters.categoryId);
  }
  if (filters.status) {
    conditions.push("d.status = ?");
    params.push(filters.status);
  }
  if (filters.noLink) {
    conditions.push("d.drive_url IS NULL AND d.status <> 'missing'");
  }
  if (filters.overdue) {
    conditions.push("d.next_review_due IS NOT NULL AND d.next_review_due < CURDATE()");
  }

  const where = conditions.join(" AND ");
  const offset = (filters.page - 1) * filters.pageSize;

  const items = await query<KeyDocumentRow[]>(
    `${DOC_SELECT} WHERE ${where}
     ORDER BY c.sort_order, d.sort_order, d.title
     LIMIT ? OFFSET ?`,
    [...params, filters.pageSize, offset]
  );
  const countRows = await query<{ total: number }[]>(
    `SELECT COUNT(*) AS total FROM key_documents d WHERE ${where}`,
    params
  );
  return { items, total: countRows[0]?.total ?? 0 };
}

export async function getDocument(
  id: number
): Promise<{ document: KeyDocumentRow; actions: KeyDocumentActionRow[] }> {
  const rows = await query<KeyDocumentRow[]>(`${DOC_SELECT} WHERE d.id = ?`, [id]);
  if (!rows[0]) throw AppError.notFound("Document");
  const actions = await query<KeyDocumentActionRow[]>(
    "SELECT id, document_id, text, done, due_date, created_at FROM key_document_actions WHERE document_id = ? ORDER BY done, id",
    [id]
  );
  return { document: rows[0], actions };
}

async function assertCategory(categoryId: number): Promise<void> {
  const rows = await query<{ id: number }[]>(
    "SELECT id FROM key_document_categories WHERE id = ?",
    [categoryId]
  );
  if (!rows[0]) throw new AppError("Catégorie inconnue", 400);
}

async function assertStaff(staffId: number): Promise<void> {
  const rows = await query<{ id: number }[]>("SELECT id FROM staff WHERE id = ?", [staffId]);
  if (!rows[0]) throw new AppError("Membre du staff inconnu", 400);
}

export async function createDocument(
  input: CreateKeyDocumentInput,
  createdBy: number
): Promise<KeyDocumentRow> {
  await assertCategory(input.categoryId);
  if (input.ownerStaffId) await assertStaff(input.ownerStaffId);

  const { columns, values } = pickColumns(input, DOC_COLUMNS);
  try {
    const result = await query<{ insertId: number }>(
      `INSERT INTO key_documents (${columns.join(", ")}, created_by)
       VALUES (${columns.map(() => "?").join(", ")}, ?)`,
      [...values, createdBy]
    );
    return (await getDocument(result.insertId)).document;
  } catch (err) {
    if (isDuplicateError(err)) {
      throw new AppError("Un document de ce titre existe déjà dans cette catégorie", 409);
    }
    throw err;
  }
}

export async function updateDocument(
  id: number,
  input: UpdateKeyDocumentInput
): Promise<{ before: KeyDocumentRow; after: KeyDocumentRow }> {
  const before = (await getDocument(id)).document;
  if (input.categoryId) await assertCategory(input.categoryId);
  if (input.ownerStaffId) await assertStaff(input.ownerStaffId);

  const { columns, values } = pickColumns(input, DOC_COLUMNS);
  if (columns.length > 0) {
    try {
      await query(
        `UPDATE key_documents SET ${columns.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`,
        [...values, id]
      );
    } catch (err) {
      if (isDuplicateError(err)) {
        throw new AppError("Un document de ce titre existe déjà dans cette catégorie", 409);
      }
      throw err;
    }
  }
  return { before, after: (await getDocument(id)).document };
}

export async function deleteDocument(id: number): Promise<KeyDocumentRow> {
  const before = (await getDocument(id)).document;
  await query("DELETE FROM key_documents WHERE id = ?", [id]);
  return before;
}

// ------------------------------------------------------------------- actions

export async function createAction(
  documentId: number,
  input: CreateActionInput,
  createdBy: number
): Promise<KeyDocumentActionRow> {
  await getDocument(documentId); // 404 si le document n'existe pas
  const result = await query<{ insertId: number }>(
    "INSERT INTO key_document_actions (document_id, text, due_date, created_by) VALUES (?, ?, ?, ?)",
    [documentId, input.text, input.dueDate ?? null, createdBy]
  );
  const rows = await query<KeyDocumentActionRow[]>(
    "SELECT id, document_id, text, done, due_date, created_at FROM key_document_actions WHERE id = ?",
    [result.insertId]
  );
  return rows[0];
}

export async function updateAction(
  documentId: number,
  actionId: number,
  input: UpdateActionInput
): Promise<KeyDocumentActionRow> {
  const sets: string[] = [];
  const params: unknown[] = [];
  if (input.text !== undefined) {
    sets.push("text = ?");
    params.push(input.text);
  }
  if (input.done !== undefined) {
    sets.push("done = ?");
    params.push(input.done ? 1 : 0);
  }
  if (input.dueDate !== undefined) {
    sets.push("due_date = ?");
    params.push(input.dueDate);
  }
  if (sets.length > 0) {
    await query(
      `UPDATE key_document_actions SET ${sets.join(", ")} WHERE id = ? AND document_id = ?`,
      [...params, actionId, documentId]
    );
  }
  const rows = await query<KeyDocumentActionRow[]>(
    "SELECT id, document_id, text, done, due_date, created_at FROM key_document_actions WHERE id = ? AND document_id = ?",
    [actionId, documentId]
  );
  if (!rows[0]) throw AppError.notFound("Action");
  return rows[0];
}

export async function deleteAction(documentId: number, actionId: number): Promise<void> {
  const result = await query<{ affectedRows: number }>(
    "DELETE FROM key_document_actions WHERE id = ? AND document_id = ?",
    [actionId, documentId]
  );
  if (result.affectedRows === 0) throw AppError.notFound("Action");
}

// --------------------------------------------------------------- adhésions

export async function listMemberships(filters: ListMembershipsQuery): Promise<MembershipRow[]> {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];
  if (filters.search) {
    conditions.push("institution LIKE ?");
    params.push(`%${filters.search}%`);
  }
  if (filters.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }
  return query<MembershipRow[]>(
    `SELECT * FROM memberships WHERE ${conditions.join(" AND ")}
     ORDER BY FIELD(status, 'renewal_due', 'lapsed', 'active', 'unknown', 'not_applicable'), institution`,
    params
  );
}

export async function getMembership(id: number): Promise<MembershipRow> {
  const rows = await query<MembershipRow[]>("SELECT * FROM memberships WHERE id = ?", [id]);
  if (!rows[0]) throw AppError.notFound("Membership");
  return rows[0];
}

export async function createMembership(
  input: CreateMembershipInput,
  createdBy: number
): Promise<MembershipRow> {
  const { columns, values } = pickColumns(input, MEMBERSHIP_COLUMNS);
  try {
    const result = await query<{ insertId: number }>(
      `INSERT INTO memberships (${columns.join(", ")}, created_by)
       VALUES (${columns.map(() => "?").join(", ")}, ?)`,
      [...values, createdBy]
    );
    return getMembership(result.insertId);
  } catch (err) {
    if (isDuplicateError(err)) {
      throw new AppError(`Une adhésion "${input.institution}" existe déjà`, 409);
    }
    throw err;
  }
}

export async function updateMembership(
  id: number,
  input: UpdateMembershipInput
): Promise<{ before: MembershipRow; after: MembershipRow }> {
  const before = await getMembership(id);
  const { columns, values } = pickColumns(input, MEMBERSHIP_COLUMNS);
  if (columns.length > 0) {
    try {
      await query(
        `UPDATE memberships SET ${columns.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`,
        [...values, id]
      );
    } catch (err) {
      if (isDuplicateError(err)) {
        throw new AppError("Une adhésion de ce nom existe déjà", 409);
      }
      throw err;
    }
  }
  return { before, after: await getMembership(id) };
}

export async function deleteMembership(id: number): Promise<MembershipRow> {
  const before = await getMembership(id);
  await query("DELETE FROM memberships WHERE id = ?", [id]);
  return before;
}

// ---------------------------------------------------------------- dashboard

export interface KeyDocsDashboard {
  documents: {
    total: number;
    byStatus: { status: string; total: number }[];
    byCategory: { category: string; total: number; available: number }[];
    availableWithoutLink: { id: number; title: string; category: string }[];
    missing: { id: number; title: string; category: string }[];
    reviewOverdue: { id: number; title: string; next_review_due: string }[];
    stale: { id: number; title: string; category: string; last_year: number }[];
  };
  openActions: {
    id: number;
    document_id: number;
    document_title: string;
    text: string;
    due_date: string | null;
  }[];
  memberships: {
    total: number;
    byStatus: { status: string; total: number }[];
    needingAttention: {
      id: number;
      institution: string;
      status: string;
      renewal_cycle: string | null;
      renewal_due_on: string | null;
    }[];
    annualFeeTotal: number;
  };
}

/**
 * Un document est "périmé" si sa dernière revue (ou à défaut sa production) a plus de N ans.
 * Seules les catégories `reviewable` comptent : un état financier audité de 2022 n'est pas
 * "à relire", c'est un document daté.
 */
const STALE_AFTER_YEARS = 3;

export async function getDashboard(): Promise<KeyDocsDashboard> {
  const [
    byStatus,
    byCategory,
    withoutLink,
    missing,
    overdue,
    stale,
    openActions,
    memberStatus,
    memberAttention,
    fees,
  ] = await Promise.all([
    query<{ status: string; total: number }[]>(
      "SELECT status, COUNT(*) AS total FROM key_documents GROUP BY status"
    ),
    query<{ category: string; total: number; available: number }[]>(
      `SELECT c.name AS category, COUNT(d.id) AS total,
              COALESCE(SUM(d.status = 'available'), 0) AS available
       FROM key_document_categories c
       LEFT JOIN key_documents d ON d.category_id = c.id
       GROUP BY c.id, c.name, c.sort_order
       ORDER BY c.sort_order`
    ),
    query<{ id: number; title: string; category: string }[]>(
      `SELECT d.id, d.title, c.name AS category
       FROM key_documents d JOIN key_document_categories c ON c.id = d.category_id
       WHERE d.drive_url IS NULL AND d.status <> 'missing'
       ORDER BY c.sort_order, d.title`
    ),
    query<{ id: number; title: string; category: string }[]>(
      `SELECT d.id, d.title, c.name AS category
       FROM key_documents d JOIN key_document_categories c ON c.id = d.category_id
       WHERE d.status = 'missing'
       ORDER BY c.sort_order, d.title`
    ),
    query<{ id: number; title: string; next_review_due: string }[]>(
      `SELECT id, title, next_review_due FROM key_documents
       WHERE next_review_due IS NOT NULL AND next_review_due < CURDATE()
       ORDER BY next_review_due LIMIT 20`
    ),
    query<{ id: number; title: string; category: string; last_year: number }[]>(
      `SELECT d.id, d.title, c.name AS category, COALESCE(d.reviewed_year, d.produced_year) AS last_year
       FROM key_documents d JOIN key_document_categories c ON c.id = d.category_id
       WHERE d.status = 'available'
         AND c.reviewable = 1
         AND COALESCE(d.reviewed_year, d.produced_year) IS NOT NULL
         AND COALESCE(d.reviewed_year, d.produced_year) <= YEAR(CURDATE()) - ${STALE_AFTER_YEARS}
       ORDER BY last_year, d.title LIMIT 20`
    ),
    query<KeyDocsDashboard["openActions"]>(
      `SELECT a.id, a.document_id, d.title AS document_title, a.text, a.due_date
       FROM key_document_actions a JOIN key_documents d ON d.id = a.document_id
       WHERE a.done = 0 ORDER BY a.due_date IS NULL, a.due_date, a.id`
    ),
    query<{ status: string; total: number }[]>(
      "SELECT status, COUNT(*) AS total FROM memberships GROUP BY status"
    ),
    query<KeyDocsDashboard["memberships"]["needingAttention"]>(
      `SELECT id, institution, status, renewal_cycle, renewal_due_on FROM memberships
       WHERE status IN ('renewal_due', 'lapsed') ORDER BY status = 'lapsed', institution`
    ),
    query<{ total: string | null }[]>(
      `SELECT SUM(fee_amount) AS total FROM memberships
       WHERE fee_period = 'annual' AND status IN ('active', 'renewal_due')`
    ),
  ]);

  return {
    documents: {
      total: byStatus.reduce((n, r) => n + Number(r.total), 0),
      byStatus,
      byCategory: byCategory.map((r) => ({
        category: r.category,
        total: Number(r.total),
        available: Number(r.available),
      })),
      availableWithoutLink: withoutLink,
      missing,
      reviewOverdue: overdue,
      stale,
    },
    openActions,
    memberships: {
      total: memberStatus.reduce((n, r) => n + Number(r.total), 0),
      byStatus: memberStatus,
      needingAttention: memberAttention,
      annualFeeTotal: Number(fees[0]?.total ?? 0),
    },
  };
}
