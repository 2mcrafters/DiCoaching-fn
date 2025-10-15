import db from './services/database.js';

async function testQuery() {
  try {
    await db.connect();
    
    console.log('\n=== Test 1: Simple query on comments ===');
    const simple = await db.query('SELECT * FROM comments WHERE term_id = ?', [2]);
    console.log('Result type:', typeof simple);
    console.log('Is array:', Array.isArray(simple));
    console.log('Length:', simple?.length);
    console.log('First item:', JSON.stringify(simple?.[0], null, 2));
    
    console.log('\n=== Test 2: UNION query with CAST (fixed) ===');
    try {
      const union = await db.query(
        `SELECT 
           c.id, c.term_id AS termId, c.user_id AS authorId, c.parent_id AS parentId,
           CAST(c.content AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS content,
           c.created_at AS createdAt,
           u.id AS u_id,
           CAST(u.firstname AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS firstname,
           CAST(u.lastname AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS lastname,
           u.sex, u.role, u.profile_picture
         FROM comments c
         LEFT JOIN users u ON u.id = c.user_id
         WHERE c.term_id = ?
         UNION ALL
         SELECT 
           c.id, c.term_id AS termId, c.author_id AS authorId, c.parent_id AS parentId,
           CAST(c.content AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS content,
           c.created_at AS createdAt,
           u.id AS u_id,
           CAST(u.firstname AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS firstname,
           CAST(u.lastname AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS lastname,
           u.sex, u.role, u.profile_picture
         FROM commentaires c
         LEFT JOIN users u ON u.id = c.author_id
         WHERE c.term_id = ?
         ORDER BY createdAt ASC`,
        [2, 2]
      );
      console.log('Union result type:', typeof union);
      console.log('Union is array:', Array.isArray(union));
      console.log('Union length:', union?.length);
      console.log('Union first item:', JSON.stringify(union?.[0], null, 2));
    } catch (e) {
      console.error('❌ UNION query failed:', e.message);
    }
    
    console.log('\n=== Test 3: Check if tables exist ===');
    const t1 = await db.query("SHOW TABLES LIKE 'comments'");
    console.log('comments exists:', t1.length > 0);
    const t2 = await db.query("SHOW TABLES LIKE 'commentaires'");
    console.log('commentaires exists:', t2.length > 0);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

testQuery();
