import { createApp } from "./app";
import { env } from "./config/env";
import { pool } from "./db/pool";

async function main(): Promise<void> {
  // Fail fast if the database is unreachable rather than starting an
  // API that will error on the first request.
  await pool.query("SELECT 1");

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Contact platform API listening on port ${env.port} (${env.nodeEnv})`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
