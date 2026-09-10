import ExcelJS from "exceljs";
import { query } from "../../db/pool";
import { ContactCategory } from "./service";

/**
 * Bulk contact import from an Excel file. A row becomes a new contact, or
 * is matched to an existing one by email; either way it can optionally be
 * attached to one organization and/or one event for the whole batch, with
 * per-row overrides (an "Organization" column, or per-event "Event role" /
 * "Per diem" / "Currency" columns).
 */

interface ParsedRow {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  country?: string;
  category?: string;
  organization?: string;
  roleTitle?: string;
  facebook?: string;
  twitter?: string;
  notes?: string;
  eventRole?: string;
  perDiem?: string;
  currency?: string;
}

type ParsedField = keyof ParsedRow;

/** Column header aliases, normalized (lowercase, accents and spaces stripped). */
const HEADER_ALIASES: Record<string, ParsedField> = {
  firstname: "firstName",
  prenom: "firstName",
  lastname: "lastName",
  nom: "lastName",
  email: "email",
  mail: "email",
  courriel: "email",
  phone: "phone",
  phonenumber: "phone",
  telephone: "phone",
  tel: "phone",
  gender: "gender",
  genre: "gender",
  sexe: "gender",
  country: "country",
  pays: "country",
  category: "category",
  categorie: "category",
  organization: "organization",
  organisation: "organization",
  title: "roleTitle",
  roletitle: "roleTitle",
  fonction: "roleTitle",
  titre: "roleTitle",
  facebook: "facebook",
  twitter: "twitter",
  twitterx: "twitter",
  x: "twitter",
  notes: "notes",
  remarques: "notes",
  commentaire: "notes",
  commentaires: "notes",
  eventrole: "eventRole",
  roleatevent: "eventRole",
  perdiem: "perDiem",
  perdiemamount: "perDiem",
  currency: "currency",
  devise: "currency",
};

const CATEGORY_ALIASES: Record<string, ContactCategory> = {
  personal: "personal",
  personalcontact: "personal",
  contactpersonnel: "personal",
  diplomaticcorps: "diplomatic_corps",
  corpsdiplomatique: "diplomatic_corps",
  media: "media",
  civilsociety: "civil_society",
  societecivile: "civil_society",
  stateinstitution: "state_institution",
  institutionetatique: "state_institution",
  academia: "academia",
  milieuacademique: "academia",
  politicalparty: "political_party",
  partipolitique: "political_party",
  stakeholder: "stakeholder",
  partieprenante: "stakeholder",
  company: "company",
  entreprise: "company",
  other: "other",
  autre: "other",
};

const GENDER_ALIASES: Record<string, "male" | "female" | "other"> = {
  male: "male",
  homme: "male",
  m: "male",
  female: "female",
  femme: "female",
  f: "female",
  other: "other",
  autre: "other",
};

function normalizeKey(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    // Rich text / hyperlink cells: fall back to their plain text form.
    if ("text" in value && typeof (value as { text?: unknown }).text === "string") {
      return (value as { text: string }).text;
    }
    if ("richText" in value) {
      return (value as { richText: { text: string }[] }).richText.map((r) => r.text).join("");
    }
    return "";
  }
  return String(value).trim();
}

async function parseWorkbook(buffer: Buffer): Promise<ParsedRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headerRow = sheet.getRow(1);
  const columns: (ParsedField | null)[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const header = cellText(cell.value);
    columns[colNumber] = header ? HEADER_ALIASES[normalizeKey(header)] ?? null : null;
  });

  const rows: ParsedRow[] = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    if (row.cellCount === 0) continue;
    const parsed: ParsedRow = {};
    let hasValue = false;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const field = columns[colNumber];
      if (!field) return;
      const text = cellText(cell.value);
      if (text) {
        parsed[field] = text;
        hasValue = true;
      }
    });
    if (hasValue) rows.push(parsed);
  }

  return rows;
}

function resolveCategory(raw?: string): ContactCategory | undefined {
  if (!raw) return undefined;
  return CATEGORY_ALIASES[normalizeKey(raw)];
}

function resolveGender(raw?: string): "male" | "female" | "other" | undefined {
  if (!raw) return undefined;
  return GENDER_ALIASES[normalizeKey(raw)];
}

async function findOrCreateOrganization(name: string, createdBy: number): Promise<number> {
  const existing = await query<{ id: number }[]>(
    "SELECT id FROM organizations WHERE LOWER(name) = LOWER(?) LIMIT 1",
    [name]
  );
  if (existing.length > 0) return existing[0].id;

  const result = await query<{ insertId: number }>(
    "INSERT INTO organizations (name, created_by) VALUES (?, ?)",
    [name, createdBy]
  );
  return result.insertId;
}

export interface ImportRowResult {
  row: number;
  status: "created" | "existing" | "error";
  contactId?: number;
  message?: string;
}

export interface ImportSummary {
  totalRows: number;
  created: number;
  existing: number;
  errors: number;
  results: ImportRowResult[];
}

export async function importContactsFromWorkbook(
  buffer: Buffer,
  opts: { organizationId?: number; eventId?: number },
  createdBy: number
): Promise<ImportSummary> {
  const rows = await parseWorkbook(buffer);
  const results: ImportRowResult[] = [];
  let created = 0;
  let existing = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // header occupies row 1
    const row = rows[i];

    try {
      if (!row.firstName?.trim() || !row.lastName?.trim()) {
        throw new Error("First name and last name are required");
      }

      let organizationId = opts.organizationId;
      if (row.organization?.trim()) {
        organizationId = await findOrCreateOrganization(row.organization.trim(), createdBy);
      }

      const category = resolveCategory(row.category) ?? "other";
      const gender = resolveGender(row.gender) ?? null;

      let contactId: number | undefined;
      let status: "created" | "existing" = "created";

      if (row.email?.trim()) {
        const matches = await query<{ id: number; organization_id: number | null }[]>(
          "SELECT id, organization_id FROM contacts WHERE email = ? LIMIT 1",
          [row.email.trim()]
        );
        if (matches.length > 0) {
          contactId = matches[0].id;
          status = "existing";
          if (!matches[0].organization_id && organizationId) {
            await query("UPDATE contacts SET organization_id = ? WHERE id = ?", [
              organizationId,
              contactId,
            ]);
          }
        }
      }

      if (contactId === undefined) {
        const result = await query<{ insertId: number }>(
          `INSERT INTO contacts
            (first_name, last_name, email, phone, gender, country, category, facebook, twitter,
             organization_id, role_title, notes, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            row.firstName.trim(),
            row.lastName.trim(),
            row.email?.trim() || null,
            row.phone?.trim() || null,
            gender,
            row.country?.trim() || null,
            category,
            row.facebook?.trim() || null,
            row.twitter?.trim() || null,
            organizationId ?? null,
            row.roleTitle?.trim() || null,
            row.notes?.trim() || null,
            createdBy,
          ]
        );
        contactId = result.insertId;
      }

      if (opts.eventId) {
        const perDiemValue = row.perDiem ? Number(row.perDiem.replace(",", ".")) : null;
        await query(
          `INSERT INTO event_contacts (event_id, contact_id, role, per_diem, currency, notes, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             role = VALUES(role), per_diem = VALUES(per_diem), currency = VALUES(currency)`,
          [
            opts.eventId,
            contactId,
            row.eventRole?.trim() || null,
            Number.isFinite(perDiemValue) ? perDiemValue : null,
            row.currency?.trim() || (perDiemValue ? "USD" : null),
            row.notes?.trim() || null,
            createdBy,
          ]
        );
      }

      if (status === "created") created++;
      else existing++;
      results.push({ row: rowNum, status, contactId });
    } catch (err) {
      errors++;
      results.push({
        row: rowNum,
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return { totalRows: rows.length, created, existing, errors, results };
}

const TEMPLATE_HEADERS: { header: string; width: number }[] = [
  { header: "First name", width: 18 },
  { header: "Last name", width: 18 },
  { header: "Email", width: 26 },
  { header: "Phone", width: 18 },
  { header: "Gender", width: 12 },
  { header: "Country", width: 16 },
  { header: "Category", width: 20 },
  { header: "Organization", width: 26 },
  { header: "Title", width: 20 },
  { header: "Facebook", width: 20 },
  { header: "Twitter", width: 16 },
  { header: "Notes", width: 30 },
  { header: "Event role", width: 16 },
  { header: "Per diem", width: 12 },
  { header: "Currency", width: 10 },
];

const TEMPLATE_EXAMPLE_ROW = [
  "Jane",
  "Doe",
  "jane.doe@example.org",
  "+233 20 000 0000",
  "Female",
  "Ghana",
  "Media",
  "Example Media House",
  "Editor",
  "",
  "",
  "",
  "Trainer",
  "150",
  "USD",
];

export async function buildTemplateWorkbook(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet("Contacts");
  sheet.columns = TEMPLATE_HEADERS.map((h) => ({ header: h.header, width: h.width }));
  sheet.getRow(1).font = { bold: true };
  sheet.addRow(TEMPLATE_EXAMPLE_ROW);
  sheet.getRow(2).font = { italic: true, color: { argb: "FF888888" } };

  const guide = workbook.addWorksheet("Guide");
  guide.columns = [{ width: 26 }, { width: 70 }];
  guide.addRows([
    ["First name / Last name", "Required. Everything else is optional."],
    ["Email", "If it matches an existing contact, that contact is reused instead of duplicated."],
    ["Gender", "Male, Female, or Other."],
    [
      "Category",
      "Personal contact, Diplomatic corps, Media, Civil society, State institution, Academia, " +
        "Political party, Stakeholder, Company, or Other. Defaults to Other if left blank.",
    ],
    [
      "Organization",
      "Matched by name to an existing organization (case-insensitive), or created if none matches. " +
        "Leave blank to use the organization selected on the import screen, if any.",
    ],
    [
      "Event role / Per diem / Currency",
      "Only used when this import is linked to an event on the import screen — these describe each " +
        "contact's participation in that event.",
    ],
  ]);
  guide.getColumn(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
