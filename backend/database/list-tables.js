import db from "../services/database.js";

async function listTables() {
  try {
    console.log("🔍 Listing all tables in dictionnaire_ch...\n");
    const tables = await db.query("SHOW TABLES");
    if (tables.length === 0) {
      console.log("⚠️  No tables found. You need to run the init.sql script first.");
    } else {
      console.table(tables);
    }
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

listTables();
