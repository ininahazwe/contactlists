import { query } from "../../db/pool";
import { AppError } from "../../utils/AppError";
import { UserRole } from "../../types/express";
import { UpdateUserInput } from "./schema";

export interface UserRow {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  is_active: number;
  created_at: string;
  last_login_at: string | null;
}

// Last sign-in is not a column on users: it is derived from the audit
// trail, which already records every login.
const SELECT_USER = `
  SELECT u.id, u.email, u.name, u.role, u.is_active, u.created_at,
         (SELECT MAX(a.created_at)
            FROM audit_log a
           WHERE a.user_id = u.id AND a.action = 'login') AS last_login_at
    FROM users u
`;

export async function listUsers(search?: string): Promise<UserRow[]> {
  if (search) {
    const like = `%${search}%`;
    return query<UserRow[]>(
      `${SELECT_USER} WHERE u.name LIKE ? OR u.email LIKE ? ORDER BY u.name ASC`,
      [like, like]
    );
  }
  return query<UserRow[]>(`${SELECT_USER} ORDER BY u.name ASC`);
}

export async function getUserById(id: number): Promise<UserRow> {
  const rows = await query<UserRow[]>(`${SELECT_USER} WHERE u.id = ? LIMIT 1`, [id]);
  const user = rows[0];
  if (!user) throw AppError.notFound("User");
  return user;
}

async function countOtherActiveAdmins(excludedId: number): Promise<number> {
  const rows = await query<{ total: number }[]>(
    "SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND is_active = TRUE AND id <> ?",
    [excludedId]
  );
  return rows[0]?.total ?? 0;
}

export async function updateUser(
  id: number,
  input: UpdateUserInput,
  actingUserId: number
): Promise<{ before: UserRow; after: UserRow }> {
  const before = await getUserById(id);

  // Changing your own role or switching yourself off is the easiest way
  // to lock yourself out by accident, so it is refused outright.
  if (id === actingUserId) {
    if (input.role !== undefined && input.role !== before.role) {
      throw new AppError("You cannot change your own role", 400);
    }
    if (input.isActive === false) {
      throw new AppError("You cannot deactivate your own account", 400);
    }
  }

  // At least one active administrator must remain, otherwise nobody can
  // ever grant rights again and the only way back is through the database.
  const losesAdmin =
    before.role === "admin" &&
    Boolean(before.is_active) &&
    ((input.role !== undefined && input.role !== "admin") || input.isActive === false);

  if (losesAdmin && (await countOtherActiveAdmins(id)) === 0) {
    throw new AppError("At least one active administrator must remain", 400);
  }

  const fields: string[] = [];
  const params: unknown[] = [];

  if (input.role !== undefined) {
    fields.push("role = ?");
    params.push(input.role);
  }
  if (input.isActive !== undefined) {
    fields.push("is_active = ?");
    params.push(input.isActive);
  }

  await query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, [...params, id]);

  return { before, after: await getUserById(id) };
}
