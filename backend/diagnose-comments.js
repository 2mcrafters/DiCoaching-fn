const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'dict_coaching'
    });

    console.log('=== CHECKING COMMENTS ISSUE ===\n');

    // Check term ID 1 and its author
    const [terms] = await conn.execute('SELECT id, term, author_id FROM termes WHERE id = 1');
    console.log('Term ID 1:', terms[0]);

    const termAuthorId = terms[0]?.author_id;
    console.log('\nTerm Author ID:', termAuthorId);

    // Check who the admin user is
    const [users] = await conn.execute("SELECT id, email, firstname, lastname FROM users WHERE email LIKE '%admin%' OR id = 1");
    console.log('\nAdmin/User ID 1:', users[0]);

    // Check comments for term ID 1
    const [comments] = await conn.execute('SELECT id, term_id, user_id, content FROM comments WHERE term_id = 1');
    console.log('\nComments on term ID 1:', comments);

    // Test the exact query from the backend
    console.log('\n=== TESTING BACKEND QUERY ===');
    console.log(`Looking for comments where term author_id = ${termAuthorId}\n`);

    const [backendResult] = await conn.execute(`
      SELECT c.id, c.term_id AS termId, c.user_id AS authorId, c.content, c.created_at AS createdAt,
              u.firstname, u.lastname, u.name, u.email,
              t.term AS termTitle, t.slug AS termSlug, t.author_id AS termAuthorId
         FROM comments c
         LEFT JOIN users u ON u.id = c.user_id
         LEFT JOIN termes t ON t.id = c.term_id
        WHERE t.author_id = ?
        ORDER BY c.created_at DESC
    `, [termAuthorId]);

    console.log(`Found ${backendResult.length} comments:`);
    backendResult.forEach((row, i) => {
      console.log(`${i + 1}. Content: "${row.content}", Term: "${row.termTitle}", Author: ${row.firstname || 'Unknown'}`);
    });

    if (backendResult.length === 0) {
      console.log('\n❌ PROBLEM: Query returns 0 results!');
      console.log('This means the term author_id does not match the logged-in user');
    } else {
      console.log('\n✅ Query works! Backend should return these comments.');
    }

    await conn.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
