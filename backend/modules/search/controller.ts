import { Request, Response } from "express";
import { searchQuerySchema } from "./schema";
import * as service from "./service";

export async function search(req: Request, res: Response): Promise<void> {
  const filters = searchQuerySchema.parse(req.query);
  const results = await service.search(filters);
  res.json({ ...results, page: filters.page, pageSize: filters.pageSize });
}

export async function facets(_req: Request, res: Response): Promise<void> {
  res.json(await service.getFacets());
}
