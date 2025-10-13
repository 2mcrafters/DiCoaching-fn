import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend/.env if present
dotenv.config({ path: path.join(__dirname, '../.env') });

async function ensureProposedModifications() {
  let connection;
  try {
    const host = process.env.DB_HOST || 'localhost';
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const database = process.env.DB_NAME || 'dict';

    const configuredPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : null;
    const portsToTry = [];
    if (configuredPort) portsToTry.push(configuredPort);
    [3306, 3307].forEach(p => { if (!portsToTry.includes(p)) portsToTry.push(p); });

    let lastErr = null;
    for (const port of portsToTry) {
      try {
        connection = await mysql.createConnection({ host, user, password, database, port, charset: 'utf8mb4', timezone: '+00:00' });
        console.log(`✅ Connected to MySQL on port ${port}`);
        break;
      } catch (e) {
        console.warn(`⚠️ Connection failed on port ${port}: ${e.message}`);
        lastErr = e;
      }
    }
    if (!connection) throw lastErr || new Error('Unable to connect to MySQL');

    // Helper: does table exist?
    const tableExists = async (name) => {
      const [rows] = await connection.execute(
        `SELECT COUNT(*) AS cnt FROM information_schema.tables WHERE table_schema = ? AND table_name = ?`,
        [database, name]
      );
      return rows[0].cnt > 0;
    };

    // Determine terms table name
    const hasTerms = await tableExists('terms');
    const hasTermes = await tableExists('termes');
    const termsTable = hasTerms ? 'terms' : (hasTermes ? 'termes' : null);
    if (!termsTable) {
      console.warn('⚠️ Neither "terms" nor "termes" table exists. The FK to term_id will be skipped.');
    }

    const hasUsers = await tableExists('users');
    if (!hasUsers) {
      console.warn('⚠️ "users" table not found. The FK to users will be skipped.');
    }

    const hasProposed = await tableExists('proposed_modifications');
    if (hasProposed) {
      console.log('ℹ️ Table proposed_modifications already exists. Nothing to do.');
      await connection.end();
      return;
    }

    console.log('🔧 Creating table proposed_modifications...');

    // Create base table first (without FKs to avoid cross-schema issues), then add FKs conditionally
    await connection.execute(`
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

    // Try to add FK to users
    if (hasUsers) {
      try {
        await connection.execute(`
          ALTER TABLE proposed_modifications
          ADD CONSTRAINT fk_modifications_proposer
          FOREIGN KEY (proposer_id) REFERENCES users(id) ON DELETE CASCADE
        `);
      } catch (e) {
        if (!/Duplicate|errno: 121|foreign key constraint fails/i.test(e.message)) {
          console.warn('⚠️ Could not add FK to users (proposer_id):', e.message);
        }
      }
      try {
        await connection.execute(`
          ALTER TABLE proposed_modifications
          ADD CONSTRAINT fk_modifications_reviewer
          FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL
        `);
      } catch (e) {
        if (!/Duplicate|errno: 121|foreign key constraint fails/i.test(e.message)) {
          console.warn('⚠️ Could not add FK to users (reviewer_id):', e.message);
        }
      }
    }

    // Try to add FK to the term table we have
    if (termsTable) {
      try {
        await connection.execute(`
          ALTER TABLE proposed_modifications
          ADD CONSTRAINT fk_modifications_term
          FOREIGN KEY (term_id) REFERENCES ${termsTable}(id) ON DELETE CASCADE
        `);
      } catch (e) {
        if (!/Duplicate|errno: 121|foreign key constraint fails/i.test(e.message)) {
          console.warn(`⚠️ Could not add FK to ${termsTable}(id):`, e.message);
        }
      }
    }

    console.log('✅ proposed_modifications table created/ensured successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err.stack);
  } finally {
    try { if (connection) await connection.end(); } catch {}
  }
}

ensureProposedModifications();
