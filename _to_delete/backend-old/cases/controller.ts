import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { recordAudit } from "../../middleware/auditLogger";
import { addContactSchema, addMemberSchema, createCaseSchema, updateCaseSchema } from "./schema";
import * as service from "./service";

export async function list(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const items = await service.listCasesForUser(req.user.id, req.user.role === "admin");
  res.json({ items });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const caseItem = await service.getCaseById(Number(req.params.caseId));
  res.json({ case: caseItem });
}

export async function create(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const input = createCaseSchema.parse(req.body);
  const caseItem = await service.createCase(input, req.user.id);
  await recordAudit({
    userId: req.user.id,
    action: "create",
    entityType: "case",
    entityId: caseItem.id,
    after: caseItem,
    req,
  });
  res.status(201).json({ case: caseItem });
}

export async function update(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const id = Number(req.params.caseId);
  const input = updateCaseSchema.parse(req.body);
  const { before, after } = await service.updateCase(id, input);
  await recordAudit({
    userId: req.user.id,
    action: "update",
    entityType: "case",
    entityId: id,
    before,
    after,
    req,
  });
  res.json({ case: after });
}

export async function addMember(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const caseId = Number(req.params.caseId);
  const { userId } = addMemberSchema.parse(req.body);
  await service.addMember(caseId, userId, req.user.id);
  await recordAudit({
    userId: req.user.id,
    action: "update",
    entityType: "case_member",
    entityId: `${caseId}-${userId}`,
    after: { caseId, userId },
    req,
  });
  res.status(201).json({ success: true });
}

export async function removeMember(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const caseId = Number(req.params.caseId);
  const userId = Number(req.params.userId);
  await service.removeMember(caseId, userId);
  await recordAudit({
    userId: req.user.id,
    action: "delete",
    entityType: "case_member",
    entityId: `${caseId}-${userId}`,
    req,
  });
  res.status(204).send();
}

export async function addContact(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const caseId = Number(req.params.caseId);
  const { contactId } = addContactSchema.parse(req.body);
  await service.addContact(caseId, contactId, req.user.id);
  await recordAudit({
    userId: req.user.id,
    action: "update",
    entityType: "case_contact",
    entityId: `${caseId}-${contactId}`,
    after: { caseId, contactId },
    req,
  });
  res.status(201).json({ success: true });
}

export async function listContacts(req: Request, res: Response): Promise<void> {
  const caseId = Number(req.params.caseId);
  const items = await service.listCaseContacts(caseId);
  res.json({ items });
}
