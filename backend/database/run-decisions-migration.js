import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import db from "../services/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log("🔄 Running decisions table migration...");

    const migrationPath = join(__dirname, "migrations", "006_create_decisions_table.sql");
    const sql = readFileSync(migrationPath, "utf-8");

    // Execute the migration
    await db.query(sql);

    console.log("✅ Decisions table created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

runMigration();
