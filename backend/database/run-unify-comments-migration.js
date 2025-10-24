import db from "../services/database.js";

async function columnExists(table, column) {
  try {
    const rows = await db.query(
      "SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
      [table, column]
    );
    return Array.isArray(rows) && rows[0] && Number(rows[0].cnt) > 0;
  } catch {
    return false;
  }
}

async function tableExists(table) {
  try {
    const rows = await db.query("SHOW TABLES LIKE ?", [table]);
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}

async function ensureCommentsSchema() {
  // Create table if not exists (with parent_id)
  await db
    .query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        term_id INT NOT NULL,
        user_id INT NOT NULL,
        parent_id INT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)
    .catch(() => {});

  // Ensure parent_id exists
  const hasParent = await columnExists("comments", "parent_id");
  if (!hasParent) {
    await db
      .query("ALTER TABLE comments ADD COLUMN parent_id INT NULL AFTER user_id")
      .catch(() => {});
  }

  // Ensure content has utf8mb4 collation (best-effort)
  await db
    .query(
      "ALTER TABLE comments MODIFY content TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    )
    .catch(() => {});
}

async function copyCommentairesToComments() {
  const hasFR = await tableExists("commentaires");
  if (!hasFR) {
    console.log("No 'commentaires' table found. Nothing to migrate.");
    return;
  }

  await ensureCommentsSchema();

  // Insert rows from commentaires into comments, preserving IDs where possible
  // Skip IDs already present in comments
  await db.query(
    `INSERT INTO comments (id, term_id, user_id, parent_id, content, created_at)
     SELECT c.id, c.term_id, c.author_id AS user_id, c.parent_id, c.content, c.created_at
     FROM commentaires c
     LEFT JOIN comments e ON e.id = c.id
     WHERE e.id IS NULL`
  );

  // Align AUTO_INCREMENT to max(id)+1
  const [maxRow] = await db.query("SELECT COALESCE(MAX(id), 0) AS maxId FROM comments");
  const nextId = Number(maxRow.maxId || 0) + 1;
  await db.query(`ALTER TABLE comments AUTO_INCREMENT = ${nextId}`);

  // Drop old table
  await db.query("DROP TABLE IF EXISTS commentaires");

  console.log("✅ Unified: migrated 'commentaires' into 'comments' and dropped 'commentaires'.");
}

copyCommentairesToComments()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Unify comments migration failed:", err.message);
    process.exit(1);
  });
