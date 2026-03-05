import "dotenv/config";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

async function runMigrations() {
  const sql = postgres(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations complete");

  await sql.end();
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
