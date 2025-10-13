import db from './services/database.js';

async function checkStructure() {
  try {
    console.log('🔍 Checking termes table structure...\n');
    
    const columns = await db.query('DESCRIBE termes');
    
    console.log('📋 Columns in termes table:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `[${col.Key}]` : ''} ${col.Default !== null ? `DEFAULT: ${col.Default}` : ''}`);
    });
    
    console.log('\n✅ Check completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkStructure();
