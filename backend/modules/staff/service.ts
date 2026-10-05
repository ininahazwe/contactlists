import { query } from "../../db/pool";
import { AppError } from "../../utils/AppError";
import {
  CreateEngagementInput,
  CreateStaffInput,
  CreateWelfareInput,
  ListStaffQuery,
  UpdateStaffInput,
  UpdateStaffSensitiveInput,
} from "./schema";

export type StaffEmploymentType = "full_time" | "part_time" | "contract" | "intern";
export type StaffStatus = "active" | "former";
export type EngagementType = "training" | "meeting" | "conference" | "travel";

export interface StaffRow {
  id: number;
  full_name: string;
  job_title: string | null;
  department: string | null;
  employment_type: StaffEmploymentType;
  nationality: string | null;
  year_joined: number | null;
  recruited_as: string | null;
  status: StaffStatus;
  exit_date: string | null;
  cv_updated: number | null;
  employee_info_sheet: number | null;
  total_years_served_raw: string | null;
  training_opportunities_raw: string | null;
  travel_opportunities_raw: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface RoleHistoryEntry {
  year_from: number | null;
  year_to: number | null;
  role_title: string;
  sort_order: number;
}

export interface EngagementEntry {
  id: number;
  engagement_type: EngagementType;
  country: string | null;
  place: string | null;
  start_date: string | null;
  end_date: string | null;
  date_text: string | null;
  purpose: string | null;
  role_in_engagement: string | null;
  source_sheet: string | null;
}

export interface StaffWelfareRow {
  id: number;
  event_name: string;
  event_date: string | null;
  amount: string | null;
  currency: string | null;
  notes: string | null;
  created_at: string;
}

export interface StaffSensitiveRow {
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  welfare_notes: string | null;
  exit_terms_notes: string | null;
  exit_interview_url: string | null;
}

export async function listStaff(
  filters: ListStaffQuery
): Promise<{ items: StaffRow[]; total: number }> {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];
  const joins: string[] = [];

  if (filters.search) {
    conditions.push("(s.full_name LIKE ? OR s.job_title LIKE ?)");
    const like = `%${filters.search}%`;
    params.push(like, like);
  }
  if (filters.status) {
    conditions.push("s.status = ?");
    params.push(filters.status);
  }
  if (filters.employmentType) {
    conditions.push("s.employment_type = ?");
    params.push(filters.employmentType);
  }
  if (filters.department) {
    conditions.push("s.department = ?");
    params.push(filters.department);
  }
  if (filters.country) {
    conditions.push("s.nationality = ?");
    params.push(filters.country);
  }
  if (filters.yearJoinedFrom) {
    conditions.push("s.year_joined >= ?");
    params.push(filters.yearJoinedFrom);
  }
  if (filters.yearJoinedTo) {
    conditions.push("s.year_joined <= ?");
    params.push(filters.yearJoinedTo);
  }

  // Un filtre d'engagement restreint aux staff ayant au moins une ligne
  // correspondante -- même principe que `year` sur /api/search qui joint
  // event_contacts.
  if (filters.engagementType || filters.engagementCountry || filters.engagementYear) {
    joins.push("INNER JOIN staff_engagements e ON e.staff_id = s.id");
    if (filters.engagementType) {
      conditions.push("e.engagement_type = ?");
      params.push(filters.engagementType);
    }
    if (filters.engagementCountry) {
      conditions.push("e.country = ?");
      params.push(filters.engagementCountry);
    }
    if (filters.engagementYear) {
      conditions.push("e.source_year = ?");
      params.push(filters.engagementYear);
    }
  }

  const where = conditions.join(" AND ");
  const joinSql = joins.join(" ");
  const orderBy = filters.sort === "recent" ? "s.created_at DESC, s.id DESC" : "s.full_name";
  const offset = (filters.page - 1) * filters.pageSize;

  // s.created_at doit être dans le SELECT pour pouvoir trier dessus sur une
  // requête DISTINCT (même contrainte MySQL que modules/search/service.ts),
  // puis il est retiré avant de renvoyer la ligne.
  const rows = await query<Array<StaffRow & { created_at: string }>>(
    `SELECT DISTINCT s.*
     FROM staff s ${joinSql}
     WHERE ${where}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, filters.pageSize, offset]
  );

  const countRows = await query<{ total: number }[]>(
    `SELECT COUNT(DISTINCT s.id) AS total FROM staff s ${joinSql} WHERE ${where}`,
    params
  );

  return { items: rows, total: countRows[0]?.total ?? 0 };
}

export async function getStaffById(id: number): Promise<StaffRow> {
  const rows = await query<StaffRow[]>("SELECT * FROM staff WHERE id = ? LIMIT 1", [id]);
  if (rows.length === 0) throw AppError.notFound("Staff member");
  return rows[0];
}

export async function getRoleHistory(staffId: number): Promise<RoleHistoryEntry[]> {
  return query<RoleHistoryEntry[]>(
    `SELECT year_from, year_to, role_title, sort_order
     FROM staff_role_history
     WHERE staff_id = ?
     ORDER BY year_from IS NULL, year_from, sort_order`,
    [staffId]
  );
}

export async function getEngagements(staffId: number): Promise<EngagementEntry[]> {
  return query<EngagementEntry[]>(
    `SELECT id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet
     FROM staff_engagements
     WHERE staff_id = ?
     ORDER BY start_date IS NULL, start_date DESC`,
    [staffId]
  );
}

/** Ajouté à la main après l'import -- voir modules/staff/controller.ts (createEngagement). */
export async function createEngagement(
  staffId: number,
  input: CreateEngagementInput,
  createdBy: number
): Promise<EngagementEntry> {
  await getStaffById(staffId); // 404 propre si le staff n'existe pas
  const result = await query<{ insertId: number }>(
    `INSERT INTO staff_engagements
       (staff_id, engagement_type, country, place, start_date, end_date, date_text,
        purpose, role_in_engagement, source_sheet, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      staffId,
      input.engagementType,
      input.country ?? null,
      input.place ?? null,
      input.startDate ?? null,
      input.endDate ?? null,
      input.dateText ?? null,
      input.purpose ?? null,
      input.roleInEngagement ?? null,
      "manual", // distingue des lignes importées depuis "Staff engages 2026"
      createdBy,
      createdBy,
    ]
  );
  const rows = await query<EngagementEntry[]>(
    `SELECT id, engagement_type, country, place, start_date, end_date, date_text, purpose, role_in_engagement, source_sheet
     FROM staff_engagements WHERE id = ?`,
    [result.insertId]
  );
  return rows[0];
}

/** Vérifie que l'engagement appartient bien à ce staff avant de le supprimer (évite qu'une
 * route /staff/:id/engagements/:engagementId supprime la ligne d'un autre staff). */
export async function deleteEngagement(staffId: number, engagementId: number): Promise<void> {
  const rows = await query<{ id: number }[]>(
    "SELECT id FROM staff_engagements WHERE id = ? AND staff_id = ?",
    [engagementId, staffId]
  );
  if (rows.length === 0) throw AppError.notFound("Engagement");
  await query("DELETE FROM staff_engagements WHERE id = ?", [engagementId]);
}


/** Récupérer le department depuis la category du job_title */
async function getDepartmentFromJobTitle(jobTitle: string | null | undefined): Promise<string | null> {
  if (!jobTitle) return null;
  try {
    const result = await query<{ category: string }[]>(
      "SELECT category FROM job_titles WHERE canonical_title = ?",
      [jobTitle]
    );
    return result.length > 0 ? result[0].category : null;
  } catch {
    return null;
  }
}

export async function createStaff(input: CreateStaffInput, createdBy: number): Promise<StaffRow> {
  // Calculer department depuis job_title (de job_titles.category)
  const department = (await getDepartmentFromJobTitle(input.jobTitle)) ?? undefined;

  const result = await query<{ insertId: number }>(
    `INSERT INTO staff
      (full_name, job_title, department, employment_type, nationality, year_joined,
       recruited_as, status, exit_date, cv_updated, employee_info_sheet, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.fullName,
      input.jobTitle ?? null,
      department,
      input.employmentType,
      input.nationality ?? null,
      input.yearJoined ?? null,
      input.recruitedAs ?? null,
      input.status ?? "active",
      input.exitDate ?? null,
      input.cvUpdated ?? null,
      input.employeeInfoSheet ?? null,
      createdBy,
    ]
  );
  return getStaffById(result.insertId);
}

export async function updateStaff(
  id: number,
  input: UpdateStaffInput
): Promise<{ before: StaffRow; after: StaffRow }> {
  const before = await getStaffById(id);

  // Si job_title change, créer une entrée dans role_history
  if (input.jobTitle !== undefined && input.jobTitle !== before.job_title) {
    const currentYear = new Date().getFullYear();
    await query(
      `INSERT INTO staff_role_history (staff_id, role_title, year_from, tracked_from_job_titles, created_by)
       VALUES (?, ?, ?, TRUE, ?)`,
      [id, input.jobTitle || null, currentYear, before.created_by]
    );
  }

  // Si jobTitle est fourni, calculer automatiquement department
  let department = input.department;
  if (input.jobTitle !== undefined) {
    department = (await getDepartmentFromJobTitle(input.jobTitle)) ?? undefined;
  }

  const map: Record<string, unknown> = {
    full_name: input.fullName,
    job_title: input.jobTitle,
    department,
    employment_type: input.employmentType,
    nationality: input.nationality,
    year_joined: input.yearJoined,
    recruited_as: input.recruitedAs,
    status: input.status,
    exit_date: input.exitDate,
    cv_updated: input.cvUpdated,
    employee_info_sheet: input.employeeInfoSheet,
  };

  const fields: string[] = [];
  const params: unknown[] = [];
  for (const [column, value] of Object.entries(map)) {
    if (value !== undefined) {
      fields.push(`${column} = ?`);
      params.push(value);
    }
  }

  if (fields.length === 0) return { before, after: before };

  params.push(id);
  await query(`UPDATE staff SET ${fields.join(", ")} WHERE id = ?`, params);

  return { before, after: await getStaffById(id) };
}

export async function deleteStaff(id: number): Promise<StaffRow> {
  const before = await getStaffById(id);
  await query("DELETE FROM staff WHERE id = ?", [id]);
  return before;
}

export interface Facets {
  totals: { total: number; active: number; former: number };
  employmentTypes: { value: StaffEmploymentType; count: number }[];
  departments: { value: string; count: number }[];
  countries: { value: string; count: number }[];
  engagementTypes: { value: EngagementType; count: number }[];
}

export async function getFacets(): Promise<Facets> {
  const [totalsRows, employmentTypes, departments, countries, engagementTypes] = await Promise.all([
    query<{ total: number; active: number; former: number }[]>(
      `SELECT COUNT(*) AS total,
              SUM(status = 'active') AS active,
              SUM(status = 'former') AS former
       FROM staff`
    ),
    query<{ value: StaffEmploymentType; count: number }[]>(
      "SELECT employment_type AS value, COUNT(*) AS count FROM staff GROUP BY employment_type ORDER BY count DESC"
    ),
    query<{ value: string; count: number }[]>(
      `SELECT department AS value, COUNT(*) AS count FROM staff
       WHERE department IS NOT NULL AND department <> ''
       GROUP BY department ORDER BY count DESC`
    ),
    query<{ value: string; count: number }[]>(
      `SELECT nationality AS value, COUNT(*) AS count FROM staff
       WHERE nationality IS NOT NULL AND nationality <> ''
       GROUP BY nationality ORDER BY count DESC`
    ),
    query<{ value: EngagementType; count: number }[]>(
      "SELECT engagement_type AS value, COUNT(*) AS count FROM staff_engagements GROUP BY engagement_type ORDER BY count DESC"
    ),
  ]);

  return {
    totals: totalsRows[0] ?? { total: 0, active: 0, former: 0 },
    employmentTypes,
    departments,
    countries,
    engagementTypes,
  };
}

// --- staff_welfare : même principe que staff_sensitive, jamais chargée par défaut ---

export async function listWelfare(staffId: number): Promise<StaffWelfareRow[]> {
  return query<StaffWelfareRow[]>(
    `SELECT id, event_name, event_date, amount, currency, notes, created_at
     FROM staff_welfare WHERE staff_id = ? ORDER BY event_date IS NULL, event_date DESC`,
    [staffId]
  );
}

export async function createWelfare(
  staffId: number,
  input: CreateWelfareInput,
  createdBy: number
): Promise<StaffWelfareRow> {
  await getStaffById(staffId);
  const result = await query<{ insertId: number }>(
    `INSERT INTO staff_welfare
       (staff_id, event_name, event_date, amount, currency, notes, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      staffId,
      input.eventName,
      input.eventDate ?? null,
      input.amount ?? null,
      input.currency ?? null,
      input.notes ?? null,
      createdBy,
      createdBy,
    ]
  );
  const rows = await query<StaffWelfareRow[]>(
    `SELECT id, event_name, event_date, amount, currency, notes, created_at
     FROM staff_welfare WHERE id = ?`,
    [result.insertId]
  );
  return rows[0];
}

export async function deleteWelfare(staffId: number, welfareId: number): Promise<void> {
  const rows = await query<{ id: number }[]>(
    "SELECT id FROM staff_welfare WHERE id = ? AND staff_id = ?",
    [welfareId, staffId]
  );
  if (rows.length === 0) throw AppError.notFound("Welfare entry");
  await query("DELETE FROM staff_welfare WHERE id = ?", [welfareId]);
}

// --- staff_sensitive : toujours une requête à part, jamais incluse dans getStaffById ---

export async function getStaffSensitive(staffId: number): Promise<StaffSensitiveRow> {
  const rows = await query<StaffSensitiveRow[]>(
    `SELECT emergency_contact_name, emergency_contact_phone, welfare_notes, exit_terms_notes, exit_interview_url
     FROM staff_sensitive WHERE staff_id = ? LIMIT 1`,
    [staffId]
  );
  return (
    rows[0] ?? {
      emergency_contact_name: null,
      emergency_contact_phone: null,
      welfare_notes: null,
      exit_terms_notes: null,
      exit_interview_url: null,
    }
  );
}

export async function upsertStaffSensitive(
  staffId: number,
  input: UpdateStaffSensitiveInput,
  updatedBy: number
): Promise<StaffSensitiveRow> {
  await getStaffById(staffId); // 404 si le staff n'existe pas

  await query(
    `INSERT INTO staff_sensitive
       (staff_id, emergency_contact_name, emergency_contact_phone, welfare_notes, exit_terms_notes, exit_interview_url, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       emergency_contact_name = COALESCE(VALUES(emergency_contact_name), emergency_contact_name),
       emergency_contact_phone = COALESCE(VALUES(emergency_contact_phone), emergency_contact_phone),
       welfare_notes = COALESCE(VALUES(welfare_notes), welfare_notes),
       exit_terms_notes = COALESCE(VALUES(exit_terms_notes), exit_terms_notes),
       exit_interview_url = COALESCE(VALUES(exit_interview_url), exit_interview_url),
       updated_by = VALUES(updated_by)`,
    [
      staffId,
      input.emergencyContactName ?? null,
      input.emergencyContactPhone ?? null,
      input.welfareNotes ?? null,
      input.exitTermsNotes ?? null,
      input.exitInterviewUrl ?? null,
      updatedBy,
    ]
  );

  return getStaffSensitive(staffId);
}
