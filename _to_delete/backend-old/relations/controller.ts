import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { recordAudit } from "../../middleware/auditLogger";
import * as service from "./service";

export async function forContact(req: Request, res: Response): Promise<void> {
  const contactId = Number(req.params.contactId);
  const items = await service.getRelationsForContact(contactId);
  res.json({ items });
}

export async function remove(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();
  const id = Number(req.params.id);
  const before = await service.deleteRelation(id);
  if (!before) throw AppError.notFound("Relation");

  await recordAudit({
    userId: req.user.id,
    action: "delete",
    entityType: "contact_relation",
    entityId: id,
    before,
    req,
  });

  res.status(204).send();
}
