import db from './services/database.js';

async function checkSchema() {
  try {
    await db.connect();
    
    console.log('\n=== Checking comments table ===');
    try {
      const commentsColumns = await db.query('SHOW COLUMNS FROM comments');
      console.log('comments columns:', commentsColumns.map(c => `${c.Field} (${c.Type})`));
    } catch (e) {
      console.log('❌ comments table error:', e.message);
    }
    
    console.log('\n=== Checking commentaires table ===');
    try {
      const commentairesColumns = await db.query('SHOW COLUMNS FROM commentaires');
      console.log('commentaires columns:', commentairesColumns.map(c => `${c.Field} (${c.Type})`));
    } catch (e) {
      console.log('❌ commentaires table error:', e.message);
    }
    
    console.log('\n=== Checking users table ===');
    try {
      const usersColumns = await db.query('SHOW COLUMNS FROM users');
      console.log('users columns:', usersColumns.map(c => `${c.Field} (${c.Type})`));
    } catch (e) {
      console.log('❌ users table error:', e.message);
    }
    
    console.log('\n=== Sample data from comments where term_id=2 ===');
    try {
      const rows = await db.query('SELECT * FROM comments WHERE term_id = 2');
      console.log('comments rows:', JSON.stringify(rows, null, 2));
    } catch (e) {
      console.log('❌ query error:', e.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

checkSchema();
