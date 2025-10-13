import 'dotenv/config';
import db from './services/database.js';

async function checkTable() {
  try {
    console.log('DB_NAME from env:', process.env.DB_NAME);
    console.log('Checking termes table structure...\n');
    const columns = await db.query('DESCRIBE termes');
    console.log('Columns:', JSON.stringify(columns, null, 2));
    
    console.log('\nSample data (first row):');
    const [sample] = await db.query('SELECT * FROM termes LIMIT 1');
    console.log(JSON.stringify(sample, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkTable();
