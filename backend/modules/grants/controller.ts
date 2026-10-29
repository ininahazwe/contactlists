import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { recordAudit, recordRead } from "../../middleware/auditLogger";
import {
  createDonorSchema,
  createGrantSchema,
  listGrantsQuerySchema,
  updateDonorSchema,
  updateGrantSchema,
} from "./schema";
import * as service from "./service";

function idParam(value: string | string[] | undefined, label = "id"): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new AppError(`Invalid parameter: ${label}`, 400);
  return n;
}

// ------------------------------------------------------------------ donors

export async function listDonors(req: Request, res: Response): Promise<void> {
  const items = await service.listDonors(req.query.search as string | undefined);
  res.json({ items });
}

export async function getDonor(req: Request, res: Response): Promise<void> {
  const id = idParam(req.params.id);
  const donor = await service.getDonor(id);
  res.json({ donor });
}

export async function createDonor(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const input = createDonorSchema.parse(req.body);
  const donor = await service.createDonor(input, req.user.id);
  await recordAudit({
    userId: req.user.id,
    action: "create",
    entityType: "donor",
    entityId: donor.id,
    after: donor,
    req,
  });
  res.status(201).json({ donor });
}

export async function updateDonor(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const id = idParam(req.params.id);
  const input = updateDonorSchema.parse(req.body);
  const { before, after } = await service.updateDonor(id, input);
  await recordAudit({
    userId: req.user.id,
    action: "update",
    entityType: "donor",
    entityId: id,
    before,
    after,
    req,
  });
  res.json({ donor: after });
}

export async function removeDonor(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const id = idParam(req.params.id);
  const before = await service.deleteDonor(id);
  await recordAudit({
    userId: req.user.id,
    action: "delete",
    entityType: "donor",
    entityId: id,
    before,
    req,
  });
  res.status(204).send();
}

// ------------------------------------------------------------------ grants

export async function listGrants(req: Request, res: Response): Promise<void> {
  const filters = listGrantsQuerySchema.parse(req.query);
  const items = await service.listGrants(filters);
  res.json({ items });
}

export async function getGrant(req: Request, res: Response): Promise<void> {
  const id = idParam(req.params.id);
  const grant = await service.getGrant(id);
  if (req.user) {
    await recordRead({ userId: req.user.id, entityType: "donor_grant", entityId: id, req });
  }
  res.json({ grant });
}

export async function createGrant(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const input = createGrantSchema.parse(req.body);
  const grant = await service.createGrant(input, req.user.id);
  await recordAudit({
    userId: req.user.id,
    action: "create",
    entityType: "donor_grant",
    entityId: grant.id,
    after: grant,
    req,
  });
  res.status(201).json({ grant });
}

export async function updateGrant(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const id = idParam(req.params.id);
  const input = updateGrantSchema.parse(req.body);
  const { before, after } = await service.updateGrant(id, input);
  await recordAudit({
    userId: req.user.id,
    action: "update",
    entityType: "donor_grant",
    entityId: id,
    before,
    after,
    req,
  });
  res.json({ grant: after });
}

export async function removeGrant(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const id = idParam(req.params.id);
  const before = await service.deleteGrant(id);
  await recordAudit({
    userId: req.user.id,
    action: "delete",
    entityType: "donor_grant",
    entityId: id,
    before,
    req,
  });
  res.status(204).send();
}

// ----------------------------------------------------------------- facets

export async function facets(_req: Request, res: Response): Promise<void> {
  res.json(await service.getFacets());
}
