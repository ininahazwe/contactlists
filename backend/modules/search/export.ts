import ExcelJS from "exceljs";
import { ContactHit, EventHit, OrganizationHit, SearchResults } from "./service";
import { SearchQuery } from "./schema";

/** "diplomatic_corps" -> "Diplomatic corps" (good enough for an export; the UI's own label map lives client-side). */
function humanize(value: string): string {
  const spaced = value.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const CONTACT_COLUMNS: { header: string; width: number }[] = [
  { header: "First name", width: 18 },
  { header: "Last name", width: 18 },
  { header: "Email", width: 26 },
  { header: "Phone", width: 18 },
  { header: "Gender", width: 12 },
  { header: "Country", width: 16 },
  { header: "Category", width: 20 },
  { header: "Title", width: 22 },
  { header: "Organization", width: 26 },
  { header: "Events", width: 10 },
];

const ORGANIZATION_COLUMNS: { header: string; width: number }[] = [
  { header: "Name", width: 30 },
  { header: "Type", width: 20 },
  { header: "Country", width: 16 },
  { header: "Contacts", width: 12 },
  { header: "Events", width: 10 },
];

const EVENT_COLUMNS: { header: string; width: number }[] = [
  { header: "Title", width: 32 },
  { header: "Type", width: 14 },
  { header: "Start date", width: 14 },
  { header: "End date", width: 14 },
  { header: "Location", width: 22 },
  { header: "Contacts", width: 12 },
];

/** Keeps the cell a real Excel date when the value parses; falls back to the raw string otherwise. */
function excelDate(value: string | null): Date | string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d;
}

function withHeaderAndFilter(
  sheet: ExcelJS.Worksheet,
  columns: { header: string; width: number }[]
): void {
  sheet.columns = columns.map((c) => ({ header: c.header, width: c.width }));
  sheet.getRow(1).font = { bold: true };
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

function addContactsSheet(workbook: ExcelJS.Workbook, items: ContactHit[]): void {
  const sheet = workbook.addWorksheet("Contacts");
  withHeaderAndFilter(sheet, CONTACT_COLUMNS);
  for (const c of items) {
    sheet.addRow([
      c.first_name,
      c.last_name,
      c.email ?? "",
      c.phone ?? "",
      c.gender ? humanize(c.gender) : "",
      c.country ?? "",
      humanize(c.category),
      c.role_title ?? "",
      c.organization_name ?? "",
      c.event_count,
    ]);
  }
}

function addOrganizationsSheet(workbook: ExcelJS.Workbook, items: OrganizationHit[]): void {
  const sheet = workbook.addWorksheet("Organizations");
  withHeaderAndFilter(sheet, ORGANIZATION_COLUMNS);
  for (const o of items) {
    sheet.addRow([o.name, o.type ?? "", o.country ?? "", o.contact_count, o.event_count]);
  }
}

function addEventsSheet(workbook: ExcelJS.Workbook, items: EventHit[]): void {
  const sheet = workbook.addWorksheet("Events");
  withHeaderAndFilter(sheet, EVENT_COLUMNS);
  for (const e of items) {
    const row = sheet.addRow([
      e.title,
      humanize(e.event_type),
      excelDate(e.start_date),
      excelDate(e.end_date),
      e.location ?? "",
      e.contact_count,
    ]);
    if (e.start_date) row.getCell(3).numFmt = "yyyy-mm-dd";
    if (e.end_date) row.getCell(4).numFmt = "yyyy-mm-dd";
  }
}

/**
 * One workbook, one sheet per requested kind (`contact`, `organization`,
 * `event`), built from the same rows the advanced search already
 * returned — so an export always matches what's on screen. Sheets are
 * created even when empty (still a usable, correctly-headed file), but
 * only for kinds the caller actually asked for.
 */
export async function buildSearchExportWorkbook(
  filters: SearchQuery,
  results: SearchResults
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();

  if (filters.kinds.includes("contact")) addContactsSheet(workbook, results.contacts.items);
  if (filters.kinds.includes("organization"))
    addOrganizationsSheet(workbook, results.organizations.items);
  if (filters.kinds.includes("event")) addEventsSheet(workbook, results.events.items);

  if (workbook.worksheets.length === 0) {
    // Defensive: kinds is never empty in practice (the schema defaults it
    // to all three), but an export must never come back with zero sheets.
    addContactsSheet(workbook, []);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
