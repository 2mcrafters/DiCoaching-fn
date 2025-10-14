const mysql = require('mysql2/promise');

async function checkDuplicates() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'dict_coaching'
    });

    console.log('Connected to database successfully\n');

    // Check for duplicate terms
    const [duplicates] = await connection.execute(`
      SELECT terme, COUNT(*) as count, GROUP_CONCAT(id) as ids
      FROM termes 
      GROUP BY terme 
      HAVING count > 1
      ORDER BY count DESC
    `);

    console.log(`=== DUPLICATE TERMS CHECK ===`);
    console.log(`Total duplicate terms found: ${duplicates.length}\n`);

    if (duplicates.length > 0) {
      console.log('Duplicates:');
      console.log('----------------------------------------');
      
      for (const dup of duplicates) {
        console.log(`Term: "${dup.terme}"`);
        console.log(`  Count: ${dup.count}`);
        console.log(`  IDs: ${dup.ids}`);
        
        // Get details for each duplicate
        const [details] = await connection.execute(
          'SELECT id, terme, slug, createdAt, author_id FROM termes WHERE terme = ? ORDER BY id',
          [dup.terme]
        );
        
        details.forEach((detail, index) => {
          console.log(`  ${index + 1}. ID: ${detail.id}, Slug: ${detail.slug}, Created: ${detail.createdAt}, Author: ${detail.author_id}`);
        });
        console.log('----------------------------------------');
      }
    } else {
      console.log('✓ No duplicate terms found');
    }

    // Also check for case-insensitive duplicates
    const [caseInsensitiveDups] = await connection.execute(`
      SELECT LOWER(terme) as terme_lower, COUNT(*) as count, GROUP_CONCAT(terme) as variations
      FROM termes 
      GROUP BY LOWER(terme)
      HAVING count > 1
      ORDER BY count DESC
    `);

    console.log(`\n=== CASE-INSENSITIVE DUPLICATES ===`);
    console.log(`Total case-insensitive duplicates: ${caseInsensitiveDups.length}\n`);

    if (caseInsensitiveDups.length > 0) {
      console.log('Case variations:');
      console.log('----------------------------------------');
      
      for (const dup of caseInsensitiveDups) {
        console.log(`Term: "${dup.terme_lower}" (lowercase)`);
        console.log(`  Count: ${dup.count}`);
        console.log(`  Variations: ${dup.variations}`);
        console.log('----------------------------------------');
      }
    } else {
      console.log('✓ No case-insensitive duplicates found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

checkDuplicates();
