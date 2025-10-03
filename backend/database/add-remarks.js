import db from '../services/database.js';

async function ensureConnected() {
  const ok = await db.connect();
  if (!ok) throw new Error('Unable to connect to DB');
}

async function addRemarqueColumn() {
  // Try French table first, then English
  try {
    await db.query("ALTER TABLE termes ADD COLUMN IF NOT EXISTS remarque TEXT NULL");
    console.log("Ensured 'remarque' column exists on 'termes'");
  } catch (e) {
    console.log("Could not alter 'termes' (will try 'terms'):", e.message || e);
    try {
      await db.query("ALTER TABLE terms ADD COLUMN IF NOT EXISTS remarque TEXT NULL");
      console.log("Ensured 'remarque' column exists on 'terms'");
    } catch (err2) {
      console.error("Failed to add 'remarque' column on both 'termes' and 'terms':", err2.message || err2);
      throw err2;
    }
  }

  // Ensure non-null rows have empty string not NULL for consistency
  try {
    await db.query("UPDATE termes SET remarque = '' WHERE remarque IS NULL");
  } catch (e) {}
  try {
    await db.query("UPDATE terms SET remarque = '' WHERE remarque IS NULL");
  } catch (e) {}

  return true;
}

async function main() {
  try {
    await ensureConnected();
    await addRemarqueColumn();
    console.log('Done. remarque column ensured.');
    process.exit(0);
  } catch (err) {
    console.error('Error in add-remarks:', err.message || err);
    process.exit(1);
  }
}

main();
