import db from '../services/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runLikesMigration() {
  try {
    console.log('Running likes migration...');
    
    const migrationPath = path.join(__dirname, 'migrations', '003_create_term_likes_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await db.query(sql);
    
    console.log('✅ Likes migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running likes migration:', error);
    process.exit(1);
  }
}

runLikesMigration();
