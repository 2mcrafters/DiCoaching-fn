import db from "../services/database.js";

const FK_DUPLICATE_REGEX = /errno:\s*121|duplicate|already exists/i;

async function tableExists(tableName) {
  try {
    const rows = await db.query(
      `SELECT COUNT(*) AS cnt
       FROM information_schema.tables
       WHERE table_schema = DATABASE() AND table_name = ?`,
      [tableName]
    );
    return Array.isArray(rows) && rows[0]?.cnt > 0;
  } catch (error) {
    console.warn(`[migration] Unable to verify table "${tableName}": ${error.message}`);
    return false;
  }
}

async function constraintExists(tableName, constraintName) {
  try {
    const rows = await db.query(
      `SELECT CONSTRAINT_NAME
       FROM information_schema.TABLE_CONSTRAINTS
       WHERE table_schema = DATABASE()
         AND table_name = ?
         AND constraint_name = ?`,
      [tableName, constraintName]
    );
    return rows.length > 0;
  } catch (error) {
    console.warn(
      `[migration] Unable to verify constraint "${constraintName}" on "${tableName}": ${error.message}`
    );
    return false;
  }
}

async function ensureLikesTable() {
  const likesExists = await tableExists("likes");
  if (!likesExists) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        term_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_term (user_id, term_id),
        INDEX idx_likes_user_id (user_id),
        INDEX idx_likes_term_id (term_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("[migration] likes table created");
  }

  const hasUsers = await tableExists("users");
  const hasTerms = await tableExists("terms");
  const hasTermes = await tableExists("termes");
  const termTable = hasTerms ? "terms" : hasTermes ? "termes" : null;

  if (hasUsers && !(await constraintExists("likes", "fk_likes_user"))) {
    try {
      await db.query(`
        ALTER TABLE likes
        ADD CONSTRAINT fk_likes_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `);
    } catch (error) {
      if (!FK_DUPLICATE_REGEX.test(error.message)) {
        console.warn("[migration] Could not add FK likes.user_id -> users(id):", error.message);
      }
    }
  } else {
    console.warn("[migration] users table missing; skipping likes.user_id foreign key");
  }

  if (termTable && !(await constraintExists("likes", "fk_likes_term"))) {
    try {
      await db.query(`
        ALTER TABLE likes
        ADD CONSTRAINT fk_likes_term
        FOREIGN KEY (term_id) REFERENCES ${termTable}(id) ON DELETE CASCADE
      `);
    } catch (error) {
      if (!FK_DUPLICATE_REGEX.test(error.message)) {
        console.warn(`[migration] Could not add FK likes.term_id -> ${termTable}(id):`, error.message);
      }
    }
  } else {
    console.warn("[migration] No terms/termes table found; skipping likes.term_id foreign key");
  }
}

async function ensureProposedModificationsTable() {
  const exists = await tableExists("proposed_modifications");
  if (!exists) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS proposed_modifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        term_id INT NOT NULL,
        proposer_id INT NOT NULL,
        changes JSON NOT NULL,
        comment TEXT NULL,
        status ENUM('pending', 'approved', 'rejected', 'implemented') DEFAULT 'pending',
        admin_comment TEXT NULL,
        reviewer_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP NULL,
        INDEX idx_modifications_status (status),
        INDEX idx_modifications_term_id (term_id),
        INDEX idx_modifications_proposer_id (proposer_id),
        INDEX idx_modifications_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("[migration] proposed_modifications table created");
  }

  const hasUsers = await tableExists("users");
  const hasTerms = await tableExists("terms");
  const hasTermes = await tableExists("termes");
  const termTable = hasTerms ? "terms" : hasTermes ? "termes" : null;

  if (termTable && !(await constraintExists("proposed_modifications", "fk_modifications_term"))) {
    try {
      await db.query(`
        ALTER TABLE proposed_modifications
        ADD CONSTRAINT fk_modifications_term
        FOREIGN KEY (term_id) REFERENCES ${termTable}(id) ON DELETE CASCADE
      `);
    } catch (error) {
      if (!FK_DUPLICATE_REGEX.test(error.message)) {
        console.warn(`[migration] Could not add FK proposed_modifications.term_id -> ${termTable}(id):`, error.message);
      }
    }
  } else {
    console.warn("[migration] No terms/termes table found; skipping proposed_modifications.term_id foreign key");
  }

  if (hasUsers) {
    const fks = [
      { name: "fk_modifications_proposer", column: "proposer_id", action: "ON DELETE CASCADE" },
      { name: "fk_modifications_reviewer", column: "reviewer_id", action: "ON DELETE SET NULL" },
    ];

    for (const fk of fks) {
      if (await constraintExists("proposed_modifications", fk.name)) {
        continue;
      }
      try {
        await db.query(`
          ALTER TABLE proposed_modifications
          ADD CONSTRAINT ${fk.name}
          FOREIGN KEY (${fk.column}) REFERENCES users(id) ${fk.action}
        `);
      } catch (error) {
        if (!FK_DUPLICATE_REGEX.test(error.message)) {
          console.warn(`[migration] Could not add FK ${fk.name}:`, error.message);
        }
      }
    }
  } else {
    console.warn("[migration] users table missing; skipping proposed_modifications user foreign keys");
  }
}

async function ensureDocumentsTable() {
  const exists = await tableExists("documents");
  if (!exists) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        purpose ENUM('profile', 'verification', 'research', 'other') DEFAULT 'other',
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_documents_user_id (user_id),
        INDEX idx_documents_purpose (purpose)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("[migration] documents table created");
  }

  const hasUsers = await tableExists("users");
  if (hasUsers && !(await constraintExists("documents", "fk_documents_user"))) {
    try {
      await db.query(`
        ALTER TABLE documents
        ADD CONSTRAINT fk_documents_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `);
    } catch (error) {
      if (!FK_DUPLICATE_REGEX.test(error.message)) {
        console.warn("[migration] Could not add FK documents.user_id -> users(id):", error.message);
      }
    }
  } else {
    console.warn("[migration] users table missing; skipping documents.user_id foreign key");
  }
}

async function seedSampleLikes() {
  const countRows = await db.query("SELECT COUNT(*) AS cnt FROM likes");
  const existingLikes = countRows[0]?.cnt ?? 0;
  if (existingLikes > 0) {
    return;
  }

  const hasTerms = await tableExists("terms");
  const hasTermes = await tableExists("termes");
  const termTable = hasTerms ? "terms" : hasTermes ? "termes" : null;
  if (!termTable) {
    return;
  }

  const terms = await db.query(`SELECT id FROM ${termTable} LIMIT 5`);
  if (!terms.length) {
    return;
  }

  const researchers = await db.query(
    `SELECT id FROM users WHERE role IN ('chercheur', 'researcher') LIMIT 3`
  );
  if (!researchers.length) {
    return;
  }

  console.log("[migration] Seeding sample likes for researchers...");
  for (const researcher of researchers) {
    for (const term of terms.slice(0, 3)) {
      try {
        await db.query(
          "INSERT IGNORE INTO likes (user_id, term_id) VALUES (?, ?)",
          [researcher.id, term.id]
        );
      } catch (_) {
        // ignore individual insertion errors
      }
    }
  }
}

export async function ensureResearcherTables() {
  try {
    console.log("[migration] Ensuring researcher tables...");
    await ensureLikesTable();
    await ensureProposedModificationsTable();
    await ensureDocumentsTable();

    try {
      await seedSampleLikes();
    } catch (error) {
      console.warn("[migration] Could not seed sample likes:", error.message);
    }

    console.log("[migration] Researcher tables ensured successfully");
    return true;
  } catch (error) {
    console.error("[migration] Error ensuring researcher tables:", error.message);
    throw error;
  }
}

export default ensureResearcherTables;
