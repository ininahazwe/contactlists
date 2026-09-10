import { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service";

const querySchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  userId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

export async function list(req: Request, res: Response): Promise<void> {
  const filter = querySchema.parse(req.query);
  const { items, total } = await service.listAuditLog(filter);
  res.json({ items, total, page: filter.page, pageSize: filter.pageSize });
}
