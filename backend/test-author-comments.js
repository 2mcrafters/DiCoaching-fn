const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'dict_coaching'
    });

    console.log('Testing comments query for author...\n');

    // First, find the author ID (Mohamed Rachid Belhadj)
    const [users] = await conn.execute(`
      SELECT id, firstname, lastname, email 
      FROM users 
      WHERE email LIKE '%admin%' OR firstname LIKE '%Mohamed%'
      LIMIT 5
    `);
    
    console.log('Users found:');
    console.log(JSON.stringify(users, null, 2));

    if (users.length > 0) {
      const authorId = users[0].id;
      console.log(`\nChecking comments for author ID: ${authorId}\n`);

      // Test the exact query from the backend
      const [rows] = await conn.execute(`
        SELECT c.id, c.term_id AS termId, c.user_id AS authorId, c.content, c.created_at AS createdAt,
                u.firstname, u.lastname, u.name, u.email, u.role, u.sex, u.profile_picture AS profilePicture,
                t.term AS termTitle, t.slug AS termSlug, t.author_id AS termAuthorId
           FROM comments c
           LEFT JOIN users u ON u.id = c.user_id
           LEFT JOIN termes t ON t.id = c.term_id
          WHERE t.author_id = ?
          ORDER BY c.created_at DESC
      `, [authorId]);

      console.log(`Found ${rows.length} comments:\n`);
      console.log(JSON.stringify(rows, null, 2));
    }

    await conn.end();
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err);
  }
})();
