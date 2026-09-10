import { NextFunction, Request, Response } from "express";
import { query } from "../db/pool";
import { AppError } from "../utils/AppError";

interface CaseMemberRow {
  case_id: number;
}

/**
 * Need-to-know access control: an admin can access any case, everyone
 * else must appear in case_members for the :caseId in the route params.
 * Mount after requireAuth. Expects the route to have a `:caseId` param,
 * or override via paramName for nested routes (e.g. contacts scoped
 * to a case through a query string).
 */
export function requireCaseAccess(paramName = "caseId") {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      next(AppError.unauthorized());
      return;
    }

    if (req.user.role === "admin") {
      next();
      return;
    }

    const caseId = Number(req.params[paramName] ?? req.query[paramName]);
    if (!caseId || Number.isNaN(caseId)) {
      next(new AppError(`Missing or invalid ${paramName}`, 400));
      return;
    }

    const rows = await query<CaseMemberRow[]>(
      "SELECT case_id FROM case_members WHERE case_id = ? AND user_id = ? LIMIT 1",
      [caseId, req.user.id]
    );

    if (rows.length === 0) {
      next(AppError.forbidden("You are not assigned to this case"));
      return;
    }

    next();
  };
}
