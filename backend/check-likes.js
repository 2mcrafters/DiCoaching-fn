import 'dotenv/config';
import db from './services/database.js';

async function checkLikes() {
  try {
    console.log('Checking likes data...\n');
    
    // Get all users
    const users = await db.query('SELECT id, email, firstname, lastname FROM users');
    console.log('📋 Users:');
    users.forEach(u => console.log(`   ID ${u.id}: ${u.email} (${u.firstname} ${u.lastname})`));
    
    console.log('\n📊 All Likes:');
    const allLikes = await db.query('SELECT * FROM likes ORDER BY created_at DESC');
    console.log(JSON.stringify(allLikes, null, 2));
    
    console.log('\n🔍 Likes Summary by User:');
    const likesSummary = await db.query(`
      SELECT 
        u.id as user_id,
        u.email,
        COUNT(l.id) as likes_given
      FROM users u
      LEFT JOIN likes l ON l.user_id = u.id
      GROUP BY u.id, u.email
      ORDER BY u.id
    `);
    console.log(JSON.stringify(likesSummary, null, 2));
    
    console.log('\n📝 Terms Authored and Likes Received:');
    for (const user of users) {
      const termsWithLikes = await db.query(`
        SELECT 
          t.id as term_id,
          t.terme,
          t.author_id,
          COUNT(l.id) as likes_count
        FROM termes t
        LEFT JOIN likes l ON l.term_id = t.id
        WHERE t.author_id = ?
        GROUP BY t.id, t.terme, t.author_id
        HAVING likes_count > 0
        ORDER BY likes_count DESC
        LIMIT 5
      `, [user.id]);
      
      if (termsWithLikes.length > 0) {
        console.log(`\n   User ${user.id} (${user.email}) - Terms with likes:`);
        termsWithLikes.forEach(t => {
          console.log(`     Term ${t.term_id} "${t.terme}": ${t.likes_count} likes`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkLikes();
