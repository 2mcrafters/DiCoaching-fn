import db from "../services/database.js";

async function listDatabases() {
  try {
    console.log("🔍 Listing all databases...\n");
    const databases = await db.query("SHOW DATABASES");
    console.table(databases);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

listDatabases();
