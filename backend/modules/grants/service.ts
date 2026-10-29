import { query } from "../../db/pool";
import { AppError } from "../../utils/AppError";
import {
  CreateDonorInput,
  CreateGrantInput,
  ListGrantsQuery,
  UpdateDonorInput,
  UpdateGrantInput,
} from "./schema";

export interface DonorRow {
  id: number;
  name: string;
  notes: string | null;
  grant_total: number;
  created_at: string;
  updated_at: string;
}

export interface GrantRow {
  id: number;
  donor_id: number;
  donor_name: string;
  grant_label: string | null;
  project_name: string | null;
  key_objectives: string | null;
  implemented_by: string | null;
  budget_amount: string | null;
  budget_currency: string | null;
  budget_label: string | null;
  start_label: string | null;
  start_date: string | null;
  start_year: number | null;
  end_label: string | null;
  end_date: string | null;
  end_year: number | null;
  reporting_cycle: string | null;
  status: "ongoing" | "ended" | "unknown";
  comment: string | null;
  created_at: string;
  updated_at: string;
}

/** camelCase (API) -> colonne SQL, pour les INSERT/UPDATE dynamiques. */
const GRANT_COLUMNS: Record<string, string> = {
  donorId: "donor_id",
  grantLabel: "grant_label",
  projectName: "project_name",
  keyObjectives: "key_objectives",
  implementedBy: "implemented_by",
  budgetAmount: "budget_amount",
  budgetCurrency: "budget_currency",
  budgetLabel: "budget_label",
  startLabel: "start_label",
  startDate: "start_date",
  startYear: "start_year",
  endLabel: "end_label",
  endDate: "end_date",
  endYear: "end_year",
  reportingCycle: "reporting_cycle",
  status: "status",
  comment: "comment",
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

// ------------------------------------------------------------------ donors

const DONOR_SELECT = `
  SELECT d.id, d.name, d.notes, d.created_at, d.updated_at,
         COUNT(g.id) AS grant_total
  FROM donors d
  LEFT JOIN donor_grants g ON g.donor_id = d.id
`;

export async function listDonors(search?: string): Promise<DonorRow[]> {
  const where = search ? "WHERE d.name LIKE ?" : "";
  const params = search ? [`%${search}%`] : [];
  return query<DonorRow[]>(
    `${DONOR_SELECT} ${where} GROUP BY d.id, d.name, d.notes, d.created_at, d.updated_at ORDER BY d.name`,
    params
  );
}

export async function getDonor(id: number): Promise<DonorRow> {
  const rows = await query<DonorRow[]>(
    `${DONOR_SELECT} WHERE d.id = ? GROUP BY d.id, d.name, d.notes, d.created_at, d.updated_at`,
    [id]
  );
  if (!rows[0]) throw AppError.notFound("Donor");
  return rows[0];
}

export async function createDonor(input: CreateDonorInput, createdBy: number): Promise<DonorRow> {
  try {
    const result = await query<{ insertId: number }>(
      "INSERT INTO donors (name, notes, created_by) VALUES (?, ?, ?)",
      [input.name, input.notes ?? null, createdBy]
    );
    return getDonor(result.insertId);
  } catch (err) {
    if (isDuplicateError(err)) {
      throw new AppError(`A donor named "${input.name}" already exists`, 409);
    }
    throw err;
  }
}

export async function updateDonor(
  id: number,
  input: UpdateDonorInput
): Promise<{ before: DonorRow; after: DonorRow }> {
  const before = await getDonor(id);
  const fields: string[] = [];
  const params: unknown[] = [];
  if (input.name !== undefined) {
    fields.push("name = ?");
    params.push(input.name);
  }
  if (input.notes !== undefined) {
    fields.push("notes = ?");
    params.push(input.notes);
  }
  if (fields.length > 0) {
    try {
      await query(`UPDATE donors SET ${fields.join(", ")} WHERE id = ?`, [...params, id]);
    } catch (err) {
      if (isDuplicateError(err)) {
        throw new AppError(`A donor named "${input.name}" already exists`, 409);
      }
      throw err;
    }
  }
  return { before, after: await getDonor(id) };
}

export async function deleteDonor(id: number): Promise<DonorRow> {
  const before = await getDonor(id);
  // ON DELETE CASCADE on donor_grants.donor_id: deleting a donor also
  // deletes every grant recorded under it. The frontend warns about this
  // before calling delete when the donor still has grants.
  await query("DELETE FROM donors WHERE id = ?", [id]);
  return before;
}

// ------------------------------------------------------------------ grants

const GRANT_SELECT = `
  SELECT g.*, d.name AS donor_name
  FROM donor_grants g
  JOIN donors d ON d.id = g.donor_id
`;

export async function listGrants(filters: ListGrantsQuery): Promise<GrantRow[]> {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];

  if (filters.search) {
    conditions.push("(d.name LIKE ? OR g.project_name LIKE ? OR g.key_objectives LIKE ?)");
    const like = `%${filters.search}%`;
    params.push(like, like, like);
  }
  if (filters.donorId) {
    conditions.push("g.donor_id = ?");
    params.push(filters.donorId);
  }
  if (filters.status) {
    conditions.push("g.status = ?");
    params.push(filters.status);
  }

  return query<GrantRow[]>(
    `${GRANT_SELECT} WHERE ${conditions.join(" AND ")} ORDER BY d.name, g.sort_order, g.id`,
    params
  );
}

export async function getGrant(id: number): Promise<GrantRow> {
  const rows = await query<GrantRow[]>(`${GRANT_SELECT} WHERE g.id = ?`, [id]);
  if (!rows[0]) throw AppError.notFound("Grant");
  return rows[0];
}

async function assertDonor(donorId: number): Promise<void> {
  const rows = await query<{ id: number }[]>("SELECT id FROM donors WHERE id = ?", [donorId]);
  if (!rows[0]) throw new AppError("Unknown donor", 400);
}

export async function createGrant(input: CreateGrantInput, createdBy: number): Promise<GrantRow> {
  await assertDonor(input.donorId);
  const { columns, values } = pickColumns(input, GRANT_COLUMNS);
  const result = await query<{ insertId: number }>(
    `INSERT INTO donor_grants (${columns.join(", ")}, created_by)
     VALUES (${columns.map(() => "?").join(", ")}, ?)`,
    [...values, createdBy]
  );
  return getGrant(result.insertId);
}

export async function updateGrant(
  id: number,
  input: UpdateGrantInput
): Promise<{ before: GrantRow; after: GrantRow }> {
  const before = await getGrant(id);
  if (input.donorId) await assertDonor(input.donorId);

  const { columns, values } = pickColumns(input, GRANT_COLUMNS);
  if (columns.length > 0) {
    await query(
      `UPDATE donor_grants SET ${columns.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`,
      [...values, id]
    );
  }
  return { before, after: await getGrant(id) };
}

export async function deleteGrant(id: number): Promise<GrantRow> {
  const before = await getGrant(id);
  await query("DELETE FROM donor_grants WHERE id = ?", [id]);
  return before;
}

// ---------------------------------------------------------------- facets

export interface GrantsFacets {
  totals: { donors: number; grants: number };
  byStatus: { status: string; total: number }[];
  budgetByCurrency: { currency: string; total: number; ongoingTotal: number }[];
}

export async function getFacets(): Promise<GrantsFacets> {
  const [totals, byStatus, byCurrency] = await Promise.all([
    query<{ donors: number; grants: number }[]>(
      "SELECT (SELECT COUNT(*) FROM donors) AS donors, (SELECT COUNT(*) FROM donor_grants) AS grants"
    ),
    query<{ status: string; total: number }[]>(
      "SELECT status, COUNT(*) AS total FROM donor_grants GROUP BY status"
    ),
    query<{ currency: string; total: string | null; ongoingTotal: string | null }[]>(
      `SELECT budget_currency AS currency, SUM(budget_amount) AS total,
              SUM(CASE WHEN status = 'ongoing' THEN budget_amount ELSE 0 END) AS ongoingTotal
       FROM donor_grants
       WHERE budget_currency IS NOT NULL AND budget_amount IS NOT NULL
       GROUP BY budget_currency`
    ),
  ]);

  return {
    totals: totals[0] ?? { donors: 0, grants: 0 },
    byStatus,
    budgetByCurrency: byCurrency.map((r) => ({
      currency: r.currency,
      total: Number(r.total ?? 0),
      ongoingTotal: Number(r.ongoingTotal ?? 0),
    })),
  };
}
