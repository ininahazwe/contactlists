import { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service";

const AUDIT_ACTIONS = ["create", "update", "delete", "login", "read"] as const;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const filterSchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  userId: z.coerce.number().int().positive().optional(),
  action: z.enum(AUDIT_ACTIONS).optional(),
  from: z.string().regex(DATE).optional(),
  to: z.string().regex(DATE).optional(),
});

const listSchema = filterSchema.extend({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

export async function list(req: Request, res: Response): Promise<void> {
  const filter = listSchema.parse(req.query);
  const { items, total } = await service.listAuditLog(filter);
  res.json({ items, total, page: filter.page, pageSize: filter.pageSize });
}

export async function summary(req: Request, res: Response): Promise<void> {
  const filter = filterSchema.parse(req.query);
  res.json(await service.summarizeAuditLog(filter));
}
