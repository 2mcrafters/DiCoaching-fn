const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'dict_coaching'
    });

    console.log('Checking comments and terms join...\n');

    // Check if comments exist
    const [comments] = await conn.execute('SELECT COUNT(*) as count FROM comments');
    console.log(`Total comments: ${comments[0].count}`);

    // Check if termes exist
    const [termes] = await conn.execute('SELECT COUNT(*) as count FROM termes');
    console.log(`Total termes: ${termes[0].count}`);

    // Try joining with correct table name
    const [joined] = await conn.execute(`
      SELECT c.id, c.term_id, c.user_id, c.content, t.term, t.author_id, t.slug
      FROM comments c
      LEFT JOIN termes t ON t.id = c.term_id
      LIMIT 5
    `);

    console.log('\nComments with terms (first 5):');
    console.log(JSON.stringify(joined, null, 2));

    await conn.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
