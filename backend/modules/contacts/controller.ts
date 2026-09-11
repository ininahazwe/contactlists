import { Request, Response } from "express";
import multer from "multer";
import { AppError } from "../../utils/AppError";
import { recordAudit, recordRead } from "../../middleware/auditLogger";
import {
  createContactSchema,
  importContactsSchema,
  listContactsQuerySchema,
  updateContactSchema,
} from "./schema";
import * as service from "./service";
import { buildTemplateWorkbook, importContactsFromWorkbook } from "./import";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/** Multipart middleware for the single "file" field on the import endpoint. */
export const importUpload = upload.single("file");

export async function list(req: Request, res: Response): Promise<void> {
  const filters = listContactsQuerySchema.parse(req.query);
  const { items, total } = await service.listContacts(filters);
  res.json({ items, total, page: filters.page, pageSize: filters.pageSize });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const contact = await service.getContactById(id);
  const timeline = await service.getContactTimeline(id);

  if (req.user) {
    await recordRead({ userId: req.user.id, entityType: "contact", entityId: id, req });
  }

  res.json({ contact, timeline });
}

export async function timeline(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const items = await service.getContactTimeline(id);
  res.json({ items });
}

export async function create(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const input = createContactSchema.parse(req.body);
  const contact = await service.createContact(input, req.user.id);

  await recordAudit({
    userId: req.user.id,
    action: "create",
    entityType: "contact",
    entityId: contact.id,
    after: contact,
    req,
  });

  res.status(201).json({ contact });
}

export async function update(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const id = Number(req.params.id);
  const input = updateContactSchema.parse(req.body);
  const { before, after } = await service.updateContact(id, input);

  await recordAudit({
    userId: req.user.id,
    action: "update",
    entityType: "contact",
    entityId: id,
    before,
    after,
    req,
  });

  res.json({ contact: after });
}

export async function remove(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const id = Number(req.params.id);
  const before = await service.deleteContact(id);

  await recordAudit({
    userId: req.user.id,
    action: "delete",
    entityType: "contact",
    entityId: id,
    before,
    req,
  });

  res.status(204).send();
}

export async function downloadImportTemplate(_req: Request, res: Response): Promise<void> {
  const buffer = await buildTemplateWorkbook();
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", 'attachment; filename="contact_import_template.xlsx"');
  res.send(buffer);
}

export async function importContacts(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  if (!req.file) throw new AppError("No file uploaded", 400);

  const input = importContactsSchema.parse(req.body);
  const summary = await importContactsFromWorkbook(
    req.file.buffer,
    { organizationId: input.organizationId, eventId: input.eventId },
    req.user.id
  );

  await recordAudit({
    userId: req.user.id,
    action: "create",
    entityType: "contact_import",
    entityId: `${Date.now()}`,
    after: {
      totalRows: summary.totalRows,
      created: summary.created,
      existing: summary.existing,
      errors: summary.errors,
      organizationId: input.organizationId,
      eventId: input.eventId,
    },
    req,
  });

  res.status(201).json(summary);
}
