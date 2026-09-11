import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { recordAudit, recordRead } from "../../middleware/auditLogger";
import { createOrganizationSchema, updateOrganizationSchema } from "./schema";
import * as service from "./service";

export async function list(req: Request, res: Response): Promise<void> {
  const items = await service.listOrganizations(req.query.search as string | undefined);
  res.json({ items });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const organization = await service.getOrganizationById(id);

  if (req.user) {
    await recordRead({ userId: req.user.id, entityType: "organization", entityId: id, req });
  }

  res.json({ organization });
}

export async function events(req: Request, res: Response): Promise<void> {
  const items = await service.getOrganizationEvents(Number(req.params.id));
  res.json({ items });
}

export async function contacts(req: Request, res: Response): Promise<void> {
  const items = await service.getOrganizationContacts(Number(req.params.id));
  res.json({ items });
}

export async function create(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const input = createOrganizationSchema.parse(req.body);
  const organization = await service.createOrganization(input, req.user.id);
  await recordAudit({
    userId: req.user.id,
    action: "create",
    entityType: "organization",
    entityId: organization.id,
    after: organization,
    req,
  });
  res.status(201).json({ organization });
}

export async function update(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const id = Number(req.params.id);
  const input = updateOrganizationSchema.parse(req.body);
  const { before, after } = await service.updateOrganization(id, input);
  await recordAudit({
    userId: req.user.id,
    action: "update",
    entityType: "organization",
    entityId: id,
    before,
    after,
    req,
  });
  res.json({ organization: after });
}

export async function remove(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const id = Number(req.params.id);
  const before = await service.deleteOrganization(id);
  await recordAudit({
    userId: req.user.id,
    action: "delete",
    entityType: "organization",
    entityId: id,
    before,
    req,
  });
  res.status(204).send();
}
