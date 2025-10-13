import db from "../services/database.js";

async function checkSchema() {
  try {
    console.log("🔍 Checking table schema...\n");

    // Check terms table
    const termsSchema = await db.query("DESCRIBE terms");
    console.log("📋 Terms table:");
    console.table(termsSchema);

    // Check users table
    const usersSchema = await db.query("DESCRIBE users");
    console.log("\n📋 Users table:");
    console.table(usersSchema);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkSchema();
