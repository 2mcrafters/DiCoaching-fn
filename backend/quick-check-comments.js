const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '',
    database: 'dict_coaching'
  });

  // Get admin user
  const [admin] = await conn.execute("SELECT id FROM users WHERE email LIKE '%admin%' LIMIT 1");
  const authorId = admin[0]?.id || 1;
  
  console.log('Author ID:', authorId);

  // Check comments
  const [result] = await conn.execute(`
    SELECT COUNT(*) as count
    FROM comments c
    JOIN termes t ON t.id = c.term_id
    WHERE t.author_id = ?
  `, [authorId]);

  console.log('Comments count:', result[0].count);

  // Get sample
  const [comments] = await conn.execute(`
    SELECT c.id, c.content, t.term, t.author_id
    FROM comments c
    JOIN termes t ON t.id = c.term_id
    WHERE t.author_id = ?
    LIMIT 3
  `, [authorId]);

  console.log('Sample comments:', JSON.stringify(comments, null, 2));

  await conn.end();
})().catch(console.error);
