import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { query } from "../../db/pool";
import { AppError } from "../../utils/AppError";
import { UserRole } from "../../types/express";

const googleClient = new OAuth2Client(env.google.clientId);

interface UserRow {
  id: number;
  google_sub: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: number;
}

/**
 * Verifies a Google ID token from the frontend's Sign in with Google
 * flow, restricts to the configured workspace domain, upserts the user,
 * and returns a signed app JWT. Mirrors the google-auth-library usage
 * from the reference project.
 */
export async function loginWithGoogle(idToken: string): Promise<{ token: string; user: UserRow }> {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.google.clientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.email || !payload.sub) {
    throw AppError.unauthorized("Invalid Google token");
  }

  if (
    env.google.allowedWorkspaceDomain &&
    payload.hd !== env.google.allowedWorkspaceDomain
  ) {
    throw AppError.forbidden("This account is not part of the authorized organization");
  }

  const displayName = payload.name ?? payload.email;
  const SELECT_USER =
    "SELECT id, google_sub, email, name, role, is_active FROM users WHERE";

  const bySub = await query<UserRow[]>(`${SELECT_USER} google_sub = ? LIMIT 1`, [payload.sub]);

  let user: UserRow;

  if (bySub.length > 0) {
    user = bySub[0];
  } else {
    // The account may exist without ever having signed in via Google:
    // a row created by hand to seed the import, for example. We link it
    // to the Google account instead of inserting a duplicate — email has
    // a unique index, and above all this id is already referenced by
    // created_by across all the imported data.
    const byEmail = await query<UserRow[]>(`${SELECT_USER} email = ? LIMIT 1`, [payload.email]);

    if (byEmail.length > 0) {
      await query("UPDATE users SET google_sub = ?, name = ? WHERE id = ?", [
        payload.sub,
        displayName,
        byEmail[0].id,
      ]);
      // The existing role is preserved: signing in must not be able to
      // downgrade or promote an account.
      user = { ...byEmail[0], google_sub: payload.sub, name: displayName };
    } else {
      // First sign-in: account created as read_only. An admin promotes it
      // afterwards — no self-service privilege escalation.
      const result = await query<{ insertId: number }>(
        "INSERT INTO users (google_sub, email, name, role) VALUES (?, ?, ?, 'read_only')",
        [payload.sub, payload.email, displayName]
      );
      user = {
        id: result.insertId,
        google_sub: payload.sub,
        email: payload.email,
        name: displayName,
        role: "read_only",
        is_active: 1,
      };
    }
  }

  if (!user.is_active) {
    throw AppError.forbidden("This account has been deactivated");
  }

  const token = jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn as jwt.SignOptions["expiresIn"] }
  );

  return { token, user };
}
