import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { recordAudit, recordRead } from "../../middleware/auditLogger";
import { confirmUploadSchema, requestUploadSchema } from "./schema";
import * as service from "./service";

export async function requestUpload(req: Request, res: Response): Promise<void> {
  const input = requestUploadSchema.parse(req.body);
  const { storageKey, uploadUrl } = await service.createUploadUrl(input);
  res.json({ storageKey, uploadUrl });
}

export async function confirmUpload(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const input = confirmUploadSchema.parse(req.body);
  const document = await service.confirmUpload(input, req.user.id);

  await recordAudit({
    userId: req.user.id,
    action: "create",
    entityType: "document",
    entityId: document.id,
    after: document,
    req,
  });

  res.status(201).json({ document });
}

export async function list(req: Request, res: Response): Promise<void> {
  const items = await service.listDocuments({
    eventId: req.query.eventId ? Number(req.query.eventId) : undefined,
    contactId: req.query.contactId ? Number(req.query.contactId) : undefined,
    organizationId: req.query.organizationId ? Number(req.query.organizationId) : undefined,
  });
  res.json({ items });
}

export async function download(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const { document, url } = await service.getDocumentDownloadUrl(id);

  // Who downloaded which attachment is the most sensitive read there is.
  if (req.user) {
    await recordRead({ userId: req.user.id, entityType: "document", entityId: id, req });
  }

  res.json({ document, url });
}

export async function remove(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const id = Number(req.params.id);
  const before = await service.deleteDocument(id);

  await recordAudit({
    userId: req.user.id,
    action: "delete",
    entityType: "document",
    entityId: id,
    before,
    req,
  });

  res.status(204).send();
}
