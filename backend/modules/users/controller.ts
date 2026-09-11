import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { recordAudit } from "../../middleware/auditLogger";
import { updateUserSchema } from "./schema";
import * as service from "./service";

export async function list(req: Request, res: Response): Promise<void> {
  const items = await service.listUsers(req.query.search as string | undefined);
  res.json({ items });
}

export async function update(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();

  const id = Number(req.params.id);
  const input = updateUserSchema.parse(req.body);
  const { before, after } = await service.updateUser(id, input, req.user.id);

  // Who granted which rights to whom is exactly the kind of change the
  // audit trail exists for.
  await recordAudit({
    userId: req.user.id,
    action: "update",
    entityType: "user",
    entityId: id,
    before: { email: before.email, role: before.role, is_active: before.is_active },
    after: { email: after.email, role: after.role, is_active: after.is_active },
    req,
  });

  res.json({ user: after });
}
