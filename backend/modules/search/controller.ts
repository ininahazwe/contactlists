import { Request, Response } from "express";
import { searchQuerySchema } from "./schema";
import * as service from "./service";
import { buildSearchExportWorkbook } from "./export";
import { recordAudit } from "../../middleware/auditLogger";

/** Hard cap on rows fetched for an export — comfortably above the directory's
 *  real size, just there so a pathological filter (or lack of one) can't
 *  turn a click into an unbounded query. */
const EXPORT_MAX_ROWS = 5000;

export async function search(req: Request, res: Response): Promise<void> {
  const filters = searchQuerySchema.parse(req.query);
  const results = await service.search(filters);
  res.json({ ...results, page: filters.page, pageSize: filters.pageSize });
}

export async function facets(_req: Request, res: Response): Promise<void> {
  res.json(await service.getFacets());
}

/**
 * Exports the current search results (same filters as GET /search, minus
 * pagination) as an .xlsx workbook — one sheet per requested kind, so the
 * file always matches what the user is looking at on screen.
 */
export async function exportXlsx(req: Request, res: Response): Promise<void> {
  const filters = searchQuerySchema.parse(req.query);
  const exportFilters = { ...filters, page: 1, pageSize: EXPORT_MAX_ROWS };
  const results = await service.search(exportFilters);
  const buffer = await buildSearchExportWorkbook(exportFilters, results);

  if (req.user) {
    await recordAudit({
      userId: req.user.id,
      action: "read",
      entityType: "contact_export",
      entityId: Date.now(),
      after: {
        filters: req.query,
        rowCounts: {
          contacts: results.contacts.items.length,
          organizations: results.organizations.items.length,
          events: results.events.items.length,
        },
      },
      req,
    });
  }

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", 'attachment; filename="contact_directory_export.xlsx"');
  res.send(buffer);
}
