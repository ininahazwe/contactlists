// Script de diagnostic temporaire — à lancer avec: node check-db-access.js
// depuis le dossier backend/ (utilise le même .env que le serveur).
// Ne sélectionne AUCUNE base, pour isoler le problème de droits.

require("dotenv").config();
const mysql = require("mysql2/promise");

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
    console.log("✅ Connexion au serveur MySQL réussie (sans sélectionner de base)");

    const [grants] = await conn.query("SHOW GRANTS FOR CURRENT_USER()");
    console.log("\n--- Droits actuels de l'utilisateur ---");
    grants.forEach((row) => console.log(Object.values(row)[0]));

    const [dbs] = await conn.query("SHOW DATABASES");
    console.log("\n--- Bases visibles par cet utilisateur ---");
    dbs.forEach((row) => console.log(Object.values(row)[0]));

    await conn.end();
  } catch (err) {
    console.error("❌ Échec de connexion:", err.code, err.sqlMessage || err.message);
  }
})();
