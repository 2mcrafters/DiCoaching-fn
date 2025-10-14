const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'dict_coaching'
    });

    console.log('Connected to database\n');

    const [duplicates] = await conn.execute(`
      SELECT terme, COUNT(*) as count, GROUP_CONCAT(id) as ids
      FROM termes 
      GROUP BY terme 
      HAVING count > 1
    `);

    if (duplicates.length === 0) {
      console.log('No duplicate terms found');
    } else {
      console.log(`Found ${duplicates.length} duplicate terms:\n`);
      duplicates.forEach(dup => {
        console.log(`- "${dup.terme}": ${dup.count} times (IDs: ${dup.ids})`);
      });
    }

    await conn.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
