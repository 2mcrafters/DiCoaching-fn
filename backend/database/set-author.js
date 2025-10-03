import db from '../services/database.js';
import bcrypt from 'bcryptjs';

async function ensureConnected() {
  const ok = await db.connect();
  if (!ok) throw new Error('Unable to connect to DB');
}

async function findOrCreateAuthor() {
  // Try to find by name
  const firstname = 'Mohamed';
  const lastname = 'Rachid Belhadj';
  try {
    const rows = await db.query('SELECT id, email FROM users WHERE firstname LIKE ? AND lastname LIKE ? LIMIT 1', [`%${firstname}%`, `%${lastname}%`]);
    if (rows && rows.length > 0) {
      console.log('Found existing user:', rows[0]);
      return rows[0].id;
    }
  } catch (e) {
    // ignore
  }

  // Not found — create a user with a safe default password (please change later)
  const email = 'mr.rachid@example.com';
  const passwordPlain = 'change_me_please';
  const passwordHash = bcrypt.hashSync(passwordPlain, 10);

  try {
    const result = await db.query(
      `INSERT INTO users (email, password, firstname, lastname, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [email, passwordHash, firstname, lastname, 'auteur', 'active']
    );
    const insertId = result.insertId || result.insert_id || null;
    if (insertId) {
      console.log('Created user', { id: insertId, email });
      return insertId;
    }
  } catch (err) {
    // Some schemas might require different column names; try a safer upsert fallback
    console.error('Error creating user:', err.message || err);
    throw err;
  }

  throw new Error('Could not create or find author user');
}

async function updateTermsAuthor(authorId) {
  // Try to update French table name 'termes' first, then fallback to English 'terms'
  let updated = 0;
  try {
    const res = await db.query('UPDATE termes SET author_id = ? WHERE author_id IS NULL OR author_id = 0', [authorId]);
    // mysql2 returns an object with affectedRows
    updated = res && (res.affectedRows || res.affected_rows || res.changedRows) ? (res.affectedRows || res.affected_rows || res.changedRows) : 0;
    console.log(`Updated ${updated} rows in 'termes'`);
  } catch (e) {
    console.log("'termes' table not present or update failed, trying 'terms'...", e.message || e);
    try {
      const res2 = await db.query('UPDATE terms SET author_id = ? WHERE author_id IS NULL OR author_id = 0', [authorId]);
      updated = res2 && (res2.affectedRows || res2.affected_rows || res2.changedRows) ? (res2.affectedRows || res2.affected_rows || res2.changedRows) : 0;
      console.log(`Updated ${updated} rows in 'terms'`);
    } catch (err2) {
      console.error('Failed to update terms tables:', err2.message || err2);
      throw err2;
    }
  }

  return updated;
}

async function main() {
  try {
    await ensureConnected();
    const authorId = await findOrCreateAuthor();
    const updated = await updateTermsAuthor(authorId);
    console.log('Done. Terms updated:', updated);
    process.exit(0);
  } catch (err) {
    console.error('Error in set-author:', err.message || err);
    process.exit(1);
  }
}

main();
