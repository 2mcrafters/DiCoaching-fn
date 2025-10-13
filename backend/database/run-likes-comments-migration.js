import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import db from "../services/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log("🔄 Running likes and comments migration...");

    const migrationPath = join(__dirname, "migrations", "005_create_likes_and_comments.sql");
    const sql = readFileSync(migrationPath, "utf-8");

    // Split by semicolon and execute each statement
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await db.query(statement);
    }

    console.log("✅ Likes and comments tables created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

runMigration();
