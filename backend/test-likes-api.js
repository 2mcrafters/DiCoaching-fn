import db from './services/database.js';

async function testLikesAPI() {
  try {
    console.log('🔍 Testing Likes API...\n');

    // Get all users
    const users = await db.query('SELECT id, email, firstname, lastname FROM users');
    console.log('📋 Users in database:');
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, Email: ${user.email}, Name: ${user.firstname} ${user.lastname}`);
    });

    console.log('\n🔍 Checking likes for each user...\n');

    for (const user of users) {
      console.log(`\n👤 User: ${user.firstname} ${user.lastname} (ID: ${user.id})`);
      
      // Get likes given by this user
      const [likesGivenCount] = await db.query(
        'SELECT COUNT(*) as count FROM likes WHERE user_id = ?',
        [user.id]
      );
      console.log(`  ❤️ Likes given: ${likesGivenCount.count}`);

      // Get detailed liked terms
      const likedTerms = await db.query(
        `SELECT 
          t.id,
          t.terme,
          t.definition,
          t.status,
          t.created_at,
          l.created_at as liked_at
         FROM likes l
         INNER JOIN termes t ON l.term_id = t.id
         WHERE l.user_id = ?
         ORDER BY l.created_at DESC`,
        [user.id]
      );

      if (likedTerms.length > 0) {
        console.log(`  📚 Liked terms:`);
        likedTerms.forEach(term => {
          console.log(`    - ${term.terme} (ID: ${term.id}) - Liked on: ${term.liked_at}`);
        });
      } else {
        console.log(`  📚 No liked terms`);
      }

      // Get likes received on user's terms
      const [likesReceivedCount] = await db.query(
        `SELECT COUNT(*) as count 
         FROM likes l 
         INNER JOIN termes t ON l.term_id = t.id 
         WHERE t.author_id = ?`,
        [user.id]
      );
      console.log(`  ⭐ Likes received on their terms: ${likesReceivedCount.count}`);
    }

    console.log('\n✅ Test completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testLikesAPI();
