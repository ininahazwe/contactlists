import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { query } from "../db/pool";
import { AppError } from "../utils/AppError";
import { AuthenticatedUser, UserRole } from "../types/express";

interface AppJwtPayload {
  sub: number;
  email: string;
  name: string;
  role: UserRole;
}

interface AccountRow {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  is_active: number;
}

/**
 * Verifies the app-issued JWT (set as an httpOnly cookie after the Google
 * OAuth handshake in modules/auth). Does not talk to Google on every
 * request — that only happens once, at login.
 *
 * The token also carries a role, but it lives for hours: trusting it would
 * mean a demotion or a deactivation only takes effect at the next sign-in.
 * So the account is re-read from the database on every request — one
 * indexed lookup on a table that holds a handful of rows — and the token
 * is used for identity only.
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.access_token as string | undefined;

  if (!token) {
    next(AppError.unauthorized());
    return;
  }

  let payload: AppJwtPayload;
  try {
    payload = jwt.verify(token, env.jwt.secret) as unknown as AppJwtPayload;
  } catch {
    next(AppError.unauthorized("Invalid or expired session"));
    return;
  }

  try {
    const rows = await query<AccountRow[]>(
      "SELECT id, email, name, role, is_active FROM users WHERE id = ? LIMIT 1",
      [payload.sub]
    );
    const account = rows[0];

    if (!account) {
      next(AppError.unauthorized("This account no longer exists"));
      return;
    }

    if (!account.is_active) {
      next(AppError.forbidden("This account has been deactivated"));
      return;
    }

    const user: AuthenticatedUser = {
      id: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
    };
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Restrict a route to one or more roles. Use after requireAuth.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AppError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(AppError.forbidden());
      return;
    }
    next();
  };
}
