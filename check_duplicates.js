import db from './backend/services/database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

async function check() {
  try {
    console.log('Checking for duplicate emails...');
    const rows = await db.query('SELECT email, COUNT(*) as count FROM users GROUP BY email HAVING count > 1');
    console.log('Duplicates:', rows);
    
    console.log('Checking for emails with spaces...');
    const spaceRows = await db.query("SELECT email FROM users WHERE email LIKE '% %'");
    console.log('Emails with spaces:', spaceRows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
