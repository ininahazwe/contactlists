import { Request, Response } from "express";
import { env } from "../../config/env";
import { googleLoginSchema } from "./schema";
import { loginWithGoogle } from "./service";
import { recordAudit } from "../../middleware/auditLogger";

export async function googleLogin(req: Request, res: Response): Promise<void> {
  const { idToken } = googleLoginSchema.parse(req.body);
  const { token, user } = await loginWithGoogle(idToken);

  res.cookie("access_token", token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000,
  });

  await recordAudit({
    userId: user.id,
    action: "login",
    entityType: "user",
    entityId: user.id,
    req,
  });

  res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie("access_token");
  res.status(204).send();
}

export function me(req: Request, res: Response): void {
  res.json({ user: req.user });
}
