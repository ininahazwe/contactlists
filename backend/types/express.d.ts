import "express";

export type UserRole = "admin" | "editor" | "read_only";

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
