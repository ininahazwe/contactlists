import mysql from "mysql2/promise";
import { env } from "../config/env";

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  dateStrings: true,
});

/**
 * Run a query with typed rows. Prefer this over the raw pool in
 * services so every call site stays a plain SQL string + params,
 * matching the "no ORM" approach from the reference project.
 */
export async function query<T>(sql: string, params: unknown[] = []): Promise<T> {
  const [rows] = await pool.execute(sql, params as unknown[] & mysql.ExecuteValues);
  return rows as T;
}

export async function withTransaction<T>(
  fn: (conn: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
