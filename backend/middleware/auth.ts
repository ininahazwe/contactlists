import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { AuthenticatedUser, UserRole } from "../types/express";

interface AppJwtPayload {
  sub: number;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Verifies the app-issued JWT (set as an httpOnly cookie after the Google
 * OAuth handshake in modules/auth). Does not talk to Google on every
 * request — that only happens once, at login.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.access_token as string | undefined;

  if (!token) {
    next(AppError.unauthorized());
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwt.secret) as unknown as AppJwtPayload;
    const user: AuthenticatedUser = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
    req.user = user;
    next();
  } catch {
    next(AppError.unauthorized("Invalid or expired session"));
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
