require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const tables = ['staff', 'staff_role_history', 'staff_engagements', 'staff_sensitive'];
  for (const t of tables) {
    try {
      const [rows] = await pool.query(`SELECT COUNT(*) AS n FROM ${t}`);
      console.log(t, '->', rows[0].n, 'rows');
    } catch (e) {
      console.log(t, '-> ERROR:', e.code || e.message);
    }
  }
  process.exit(0);
}
main().catch(e => { console.log('FATAL:', e.code || e.message); process.exit(1); });
