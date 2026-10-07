import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { recordAudit, recordRead } from "../../middleware/auditLogger";
import {
  createActionSchema,
  createCategorySchema,
  createKeyDocumentSchema,
  createMembershipSchema,
  listKeyDocumentsQuerySchema,
  listMembershipsQuerySchema,
  updateActionSchema,
  updateKeyDocumentSchema,
  updateMembershipSchema,
} from "./schema";
import * as service from "./service";

function idParam(value: string | string[] | undefined, label = "id"): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new AppError(`Paramètre ${label} invalide`, 400);
  return n;
}

// ---------------------------------------------------------------- catégories

export async function listCategories(_req: Request, res: Response): Promise<void> {
  res.json({ items: await service.listCategories() });
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const { name } = createCategorySchema.parse(req.body);
  const category = await service.createCategory(name);
  await recordAudit({
    userId: req.user.id,
    action: "create",
    entityType: "key_document_category",
    entityId: category.id,
    after: category,
    req,
  });
  res.status(201).json({ category });
}

// ----------------------------------------------------------------- documents

export async function listDocuments(req: Request, res: Response): Promise<void> {
  const filters = listKeyDocumentsQuerySchema.parse(req.query);
  const { items, total } = await service.listDocuments(filters);
  res.json({ items, total, page: filters.page, pageSize: filters.pageSize });
}

export async function getDocument(req: Request, res: Response): Promise<void> {
  const id = idParam(req.params.id);
  const result = await service.getDocument(id);
  if (req.user) {
    await recordRead({ userId: req.user.id, entityType: "key_document", entityId: id, req });
  }
  res.json(result);
}

export async function createDocument(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const input = createKeyDocumentSchema.parse(req.body);
  const document = await service.createDocument(input, req.user.id);
  await recordAudit({
    userId: req.user.id,
    action: "create",
    entityType: "key_document",
    entityId: document.id,
    after: document,
    req,
  });
  res.status(201).json({ document });
}

export async function updateDocument(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const id = idParam(req.params.id);
  const input = updateKeyDocumentSchema.parse(req.body);
  const { before, after } = await service.updateDocument(id, input);
  await recordAudit({
    userId: req.user.id,
    action: "update",
    entityType: "key_document",
    entityId: id,
    before,
    after,
    req,
  });
  res.json({ document: after });
}

export async function removeDocument(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const id = idParam(req.params.id);
  const before = await service.deleteDocument(id);
  await recordAudit({
    userId: req.user.id,
    action: "delete",
    entityType: "key_document",
    entityId: id,
    before,
    req,
  });
  res.status(204).send();
}

// ------------------------------------------------------------------- actions

export async function createAction(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const documentId = idParam(req.params.id);
  const input = createActionSchema.parse(req.body);
  const action = await service.createAction(documentId, input, req.user.id);
  await recordAudit({
    userId: req.user.id,
    action: "create",
    entityType: "key_document_action",
    entityId: action.id,
    after: action,
    req,
  });
  res.status(201).json({ action });
}

export async function updateAction(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const documentId = idParam(req.params.id);
  const actionId = idParam(req.params.actionId, "actionId");
  const input = updateActionSchema.parse(req.body);
  const action = await service.updateAction(documentId, actionId, input);
  await recordAudit({
    userId: req.user.id,
    action: "update",
    entityType: "key_document_action",
    entityId: actionId,
    after: action,
    req,
  });
  res.json({ action });
}

export async function removeAction(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const documentId = idParam(req.params.id);
  const actionId = idParam(req.params.actionId, "actionId");
  await service.deleteAction(documentId, actionId);
  await recordAudit({
    userId: req.user.id,
    action: "delete",
    entityType: "key_document_action",
    entityId: actionId,
    req,
  });
  res.status(204).send();
}

// --------------------------------------------------------------- adhésions

export async function listMemberships(req: Request, res: Response): Promise<void> {
  const filters = listMembershipsQuerySchema.parse(req.query);
  res.json({ items: await service.listMemberships(filters) });
}

export async function createMembership(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const input = createMembershipSchema.parse(req.body);
  const membership = await service.createMembership(input, req.user.id);
  await recordAudit({
    userId: req.user.id,
    action: "create",
    entityType: "membership",
    entityId: membership.id,
    after: membership,
    req,
  });
  res.status(201).json({ membership });
}

export async function updateMembership(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const id = idParam(req.params.id);
  const input = updateMembershipSchema.parse(req.body);
  const { before, after } = await service.updateMembership(id, input);
  await recordAudit({
    userId: req.user.id,
    action: "update",
    entityType: "membership",
    entityId: id,
    before,
    after,
    req,
  });
  res.json({ membership: after });
}

export async function removeMembership(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const id = idParam(req.params.id);
  const before = await service.deleteMembership(id);
  await recordAudit({
    userId: req.user.id,
    action: "delete",
    entityType: "membership",
    entityId: id,
    before,
    req,
  });
  res.status(204).send();
}

// ---------------------------------------------------------------- dashboard

export async function dashboard(_req: Request, res: Response): Promise<void> {
  res.json(await service.getDashboard());
}
