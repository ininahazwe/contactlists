import ExcelJS from "exceljs";
import { query, withTransaction } from "../../db/pool";

/**
 * Import ponctuel de "MFWA Institutional Development Documents.xlsx" (onglets
 * "MFWA Staff Details" et "Staff engages 2026") vers staff / staff_role_history /
 * staff_engagements.
 *
 * "Staff Travels and Trainings" (l'autre feuille de voyages/formations, 2022-2026, à deux
 * niveaux d'en-têtes imbriqués par personne) n'est volontairement PAS importée : sa structure
 * est trop irrégulière pour un parsing fiable. "Staff engages 2026" est la seule source de
 * vérité pour les engagements à partir de maintenant.
 *
 * Logique testée contre le fichier réel avant d'être portée ici (voir MIGRATION_NOTES.md
 * livré avec ce module) : 67 lignes staff, 144 étapes de carrière, 49 engagements.
 */

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  "full time": "full_time",
  "part-time": "part_time",
  "part time": "part_time",
  "part-time/contract": "part_time",
  contract: "contract",
  intern: "intern",
};

function clean(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    // richText direct (ex: une cellule en gras/italique mélangés sans lien).
    if ("richText" in (v as Record<string, unknown>)) {
      return (v as { richText: { text: string }[] }).richText.map((r) => r.text).join("");
    }
    // Cellule avec hyperlien : { text, hyperlink }. `text` est le plus souvent une
    // chaîne, mais ExcelJS le renvoie en richText dès que la cellule a plusieurs styles
    // de police (texte normal + segment souligné bleu, ex. un nom d'organisation lié) --
    // trouvé en relisant pour de vrai la feuille "Staff engages 2026" (une ligne
    // stockée comme "[object Object]" avant ce correctif). D'où la récursion ici plutôt
    // qu'un simple `String(...)`.
    if ("text" in (v as Record<string, unknown>)) return clean((v as { text: unknown }).text);
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return "";
  }
  return String(v).replace(/\s+/g, " ").trim();
}

function normalizeEmploymentType(raw: string): string {
  return EMPLOYMENT_TYPE_MAP[raw.toLowerCase().trim()] ?? "full_time";
}

function rowValues(sheet: ExcelJS.Worksheet, rowNumber: number): string[] {
  const row = sheet.getRow(rowNumber);
  const values: string[] = [];
  // row.values est en base 1 (index 0 = undefined) ; on réaligne en base 0.
  const raw = row.values as ExcelJS.CellValue[];
  for (let c = 1; c < Math.max(raw.length, 16); c++) {
    values[c - 1] = clean(raw[c]);
  }
  return values;
}

function isHeaderRow(r: string[]): boolean {
  const a = (r[0] || "").toLowerCase();
  const b = (r[1] || "").toLowerCase();
  return a === "no" || b === "name" || b === "names";
}

interface ParsedStaffRow {
  sourceRow: number;
  section: "current" | "former";
  fullName: string;
  jobTitle: string;
  employmentType: string;
  yearJoinedRaw: string;
  recruitedAs: string;
  promotionsRaw: string;
  cvUpdated: boolean;
  employeeInfoSheet: boolean;
  totalYearsServedRaw: string;
  trainingOpportunitiesRaw: string;
  travelOpportunitiesRaw: string;
  welfareOrExitRaw: string; // sens différent selon section -- voir upsertStaffSensitive ci-dessous
  lastColRaw: string; // "Status" (actif) ou une URL "Exit Interview Report" (ancien)
}

interface ParsedRoleHistoryRow {
  sourceRow: number;
  yearFrom: number | null;
  yearTo: number | null;
  roleTitle: string;
  note: string | null;
  sortOrder: number;
}

function parsePromotions(sourceRow: number, text: string): ParsedRoleHistoryRow[] {
  if (!text) return [];
  const re = /(\d{4}(?:\s*-\s*\d{4})?|20\.\.)\s*[:\-]\s*/g;
  const matches = [...text.matchAll(re)];
  if (matches.length === 0) {
    return [{ sourceRow, yearFrom: null, yearTo: null, roleTitle: text, note: "UNPARSED", sortOrder: 0 }];
  }
  return matches.map((m, idx) => {
    const yearTok = m[1];
    const start = m.index! + m[0].length;
    const end = idx + 1 < matches.length ? matches[idx + 1].index! : text.length;
    const title = clean(text.slice(start, end)).replace(/[;,.]+$/, "").replace(/\|$/, "").trim();

    let yearFrom: number | null = null;
    let yearTo: number | null = null;
    let note: string | null = null;
    if (/^\d{4}\s*-\s*\d{4}$/.test(yearTok)) {
      const [a, b] = yearTok.split("-").map((s) => s.trim());
      yearFrom = Number(a);
      yearTo = Number(b);
    } else if (/^\d{4}$/.test(yearTok)) {
      yearFrom = Number(yearTok);
    } else {
      note = `UNPARSEABLE_YEAR_TOKEN:${yearTok}`;
    }
    return { sourceRow, yearFrom, yearTo, roleTitle: title, note, sortOrder: idx };
  });
}

function parseStaffSheet(workbook: ExcelJS.Workbook): {
  staff: ParsedStaffRow[];
  roleHistory: ParsedRoleHistoryRow[];
} {
  const sheet = workbook.getWorksheet("MFWA Staff Details");
  if (!sheet) throw new Error('Onglet "MFWA Staff Details" introuvable dans le classeur.');

  const staff: ParsedStaffRow[] = [];
  const roleHistory: ParsedRoleHistoryRow[] = [];
  let section: "current" | "former" = "current";

  for (let i = 7; i <= sheet.rowCount; i++) {
    const r = rowValues(sheet, i);
    if (r.every((c) => !c)) continue;
    if (isHeaderRow(r)) continue;

    const name = r[1] || "";
    const jobTitle = r[2] || "";
    const empType = r[3] || "";

    // Marqueur de section "Former staff" : testé contre le fichier réel (ligne 58), cette
    // ligne répète "Former staff" dans plusieurs colonnes (nom, intitulé, type d'emploi,
    // année...) plutôt que de les laisser vides -- la détection générique ci-dessous (basée
    // sur des colonnes vides) ne la capte donc pas et la ligne finissait importée comme un
    // vrai employé nommé "Former staff" (bug trouvé après un premier import réel : staff
    // créés et étapes de carrière en trop). Détectée sur le nom seul, en priorité.
    if (/^former staff$/i.test(name)) {
      section = "former";
      continue;
    }
    // Autres lignes de section ("The Fourth Estate Team"...) : nom présent mais
    // jobTitle/empType/year_joined tous vides.
    if (name && !jobTitle && !empType && !r[4]) {
      continue;
    }
    if (!name) continue;

    staff.push({
      sourceRow: i,
      section,
      fullName: name,
      jobTitle,
      employmentType: normalizeEmploymentType(empType),
      yearJoinedRaw: r[4] || "",
      recruitedAs: r[5] || "",
      promotionsRaw: r[6] || "",
      cvUpdated: /true/i.test(r[7] || ""),
      employeeInfoSheet: /true/i.test(r[8] || ""),
      totalYearsServedRaw: r[9] || "",
      trainingOpportunitiesRaw: r[10] || "",
      travelOpportunitiesRaw: r[11] || "",
      welfareOrExitRaw: r[12] || "",
      lastColRaw: r[14] || "",
    });

    roleHistory.push(...parsePromotions(i, r[6] || ""));
  }

  return { staff, roleHistory };
}

interface ParsedEngagementRow {
  staffName: string;
  engagementType: string;
  place: string;
  dateText: string;
  purpose: string;
  roleInEngagement: string;
}

function parseEngagementsSheet(workbook: ExcelJS.Workbook): ParsedEngagementRow[] {
  const sheet = workbook.getWorksheet("Staff engages 2026");
  if (!sheet) return []; // feuille optionnelle : pas d'erreur si absente du classeur

  const engagements: ParsedEngagementRow[] = [];
  let currentName: string | null = null;

  for (let i = 4; i <= sheet.rowCount; i++) {
    const r = rowValues(sheet, i);
    if (r.every((c) => !c)) continue;
    if ((r[0] || "").toLowerCase() === "name" && (r[1] || "").toLowerCase() === "place") continue;
    if (r[0]) currentName = r[0];
    if (!currentName) continue;

    const place = r[1] || "";
    const meeting = r[2] || "";
    const training = r[3] || "";
    const conference = r[4] || "";
    const dateText = r[5] || "";
    const purpose = r[6] || "";
    const roleInEngagement = r[7] || "";
    if (!place && !meeting && !training && !conference && !dateText && !purpose) continue;

    let engagementType: string;
    if (training) engagementType = "training";
    else if (meeting) engagementType = "meeting";
    else if (conference) engagementType = "conference";
    else engagementType = "travel";

    engagements.push({ staffName: currentName, engagementType, place, dateText, purpose, roleInEngagement });
  }

  return engagements;
}

export interface StaffImportSummary {
  counts: {
    staffCreated: number;
    roleHistoryCreated: number;
    engagementsCreated: number;
    engagementsSkipped: number;
    roleHistoryFlagged: number;
  };
  flaggedRoleHistory: { sourceRow: number; roleTitle: string; note: string }[];
}

export async function importStaffFromWorkbook(
  buffer: Buffer,
  createdBy: number
): Promise<StaffImportSummary> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const { staff, roleHistory } = parseStaffSheet(workbook);
  const engagements = parseEngagementsSheet(workbook);

  const staffIdBySourceRow = new Map<number, number>();
  const staffIdByName = new Map<string, number>();
  let engagementsSkipped = 0;

  await withTransaction(async (conn) => {
    for (const s of staff) {
      const [result] = await conn.query(
        `INSERT INTO staff
           (full_name, job_title, employment_type, year_joined, recruited_as, status,
            cv_updated, employee_info_sheet, total_years_served_raw,
            training_opportunities_raw, travel_opportunities_raw, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          s.fullName,
          s.jobTitle || null,
          s.employmentType,
          /^\d{4}$/.test(s.yearJoinedRaw) ? Number(s.yearJoinedRaw) : null,
          s.recruitedAs || null,
          s.section === "former" ? "former" : "active",
          s.cvUpdated,
          s.employeeInfoSheet,
          s.totalYearsServedRaw || null,
          s.trainingOpportunitiesRaw || null,
          s.travelOpportunitiesRaw || null,
          createdBy,
        ]
      );
      // mysql2 typing via conn.query renvoie un ResultSetHeader en premier élément.
      const staffId = (result as unknown as { insertId: number }).insertId;
      staffIdBySourceRow.set(s.sourceRow, staffId);
      staffIdByName.set(s.fullName, staffId);

      // La colonne source "Welfare Benefits & Purpose" sert à deux choses selon la
      // section (voir MIGRATION_NOTES.md) : récit de bien-être pour les actifs,
      // statut du solde de départ pour les anciens.
      if (s.section === "former") {
        await conn.query(
          `INSERT INTO staff_sensitive (staff_id, exit_terms_notes, exit_interview_url, updated_by)
           VALUES (?, ?, ?, ?)`,
          [staffId, s.welfareOrExitRaw || null, s.lastColRaw || null, createdBy]
        );
      } else if (s.welfareOrExitRaw) {
        await conn.query(
          `INSERT INTO staff_sensitive (staff_id, welfare_notes, updated_by) VALUES (?, ?, ?)`,
          [staffId, s.welfareOrExitRaw, createdBy]
        );
      }
    }

    for (const rh of roleHistory) {
      const staffId = staffIdBySourceRow.get(rh.sourceRow);
      if (!staffId) continue;
      await conn.query(
        `INSERT INTO staff_role_history (staff_id, year_from, year_to, role_title, note, sort_order, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [staffId, rh.yearFrom, rh.yearTo, rh.roleTitle, rh.note, rh.sortOrder, createdBy]
      );
    }

    for (const e of engagements) {
      const staffId = staffIdByName.get(e.staffName);
      if (!staffId) {
        engagementsSkipped++;
        continue;
      }
      await conn.query(
        `INSERT INTO staff_engagements
           (staff_id, engagement_type, place, date_text, purpose, role_in_engagement, source_sheet, source_year, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [staffId, e.engagementType, e.place || null, e.dateText || null, e.purpose || null, e.roleInEngagement || null, "Staff engages 2026", 2026, createdBy]
      );
    }
  });

  const flagged = roleHistory.filter((r) => r.note);

  return {
    counts: {
      staffCreated: staff.length,
      roleHistoryCreated: roleHistory.length,
      engagementsCreated: engagements.length - engagementsSkipped,
      engagementsSkipped,
      roleHistoryFlagged: flagged.length,
    },
    flaggedRoleHistory: flagged.map((r) => ({
      sourceRow: r.sourceRow,
      roleTitle: r.roleTitle,
      note: r.note!,
    })),
  };
}

// Exporté pour un éventuel script de vérification ponctuel (voir MIGRATION_NOTES.md) :
// relit les compteurs après import sans tout retraiter.
export async function countImportedRows(): Promise<Record<string, number>> {
  const tables = ["staff", "staff_role_history", "staff_engagements", "staff_sensitive"];
  const counts: Record<string, number> = {};
  for (const t of tables) {
    const rows = await query<{ n: number }[]>(`SELECT COUNT(*) AS n FROM ${t}`);
    counts[t] = rows[0]?.n ?? 0;
  }
  return counts;
}
