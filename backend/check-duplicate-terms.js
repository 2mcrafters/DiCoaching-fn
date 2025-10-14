import mysql from 'mysql2/promise';

async function checkDuplicateTerms() {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'dict_coaching',
      port: 3306
    });

    console.log('✓ Connected to database\n');

    // Check for exact duplicate terms
    console.log('=== CHECKING FOR DUPLICATE TERMS ===\n');
    
    const [duplicates] = await connection.execute(`
      SELECT 
        terme, 
        COUNT(*) as count, 
        GROUP_CONCAT(id ORDER BY id) as ids
      FROM termes 
      GROUP BY terme 
      HAVING count > 1
      ORDER BY count DESC, terme
    `);

    if (duplicates.length === 0) {
      console.log('✓ No exact duplicate terms found\n');
    } else {
      console.log(`⚠ Found ${duplicates.length} duplicate term(s):\n`);
      
      for (const dup of duplicates) {
        console.log(`Term: "${dup.terme}"`);
        console.log(`  Occurrences: ${dup.count}`);
        console.log(`  IDs: ${dup.ids}\n`);
        
        // Get full details
        const [details] = await connection.execute(
          `SELECT id, terme, slug, definition, createdAt, author_id, status 
           FROM termes 
           WHERE terme = ? 
           ORDER BY createdAt`,
          [dup.terme]
        );
        
        details.forEach((detail, idx) => {
          console.log(`  Entry ${idx + 1}:`);
          console.log(`    ID: ${detail.id}`);
          console.log(`    Slug: ${detail.slug}`);
          console.log(`    Status: ${detail.status}`);
          console.log(`    Author ID: ${detail.author_id}`);
          console.log(`    Created: ${detail.createdAt}`);
          console.log(`    Definition: ${detail.definition ? detail.definition.substring(0, 80) + '...' : 'N/A'}`);
          console.log('');
        });
        
        console.log('  ---\n');
      }
    }

    // Check for case-insensitive duplicates
    console.log('=== CHECKING FOR CASE-INSENSITIVE DUPLICATES ===\n');
    
    const [caseDuplicates] = await connection.execute(`
      SELECT 
        LOWER(terme) as terme_lower, 
        COUNT(*) as count,
        GROUP_CONCAT(terme ORDER BY terme) as variations,
        GROUP_CONCAT(id ORDER BY id) as ids
      FROM termes 
      GROUP BY LOWER(terme)
      HAVING count > 1
      ORDER BY count DESC
    `);

    if (caseDuplicates.length === 0) {
      console.log('✓ No case-insensitive duplicates found\n');
    } else {
      console.log(`⚠ Found ${caseDuplicates.length} case-insensitive duplicate(s):\n`);
      
      for (const dup of caseDuplicates) {
        console.log(`Term (lowercase): "${dup.terme_lower}"`);
        console.log(`  Occurrences: ${dup.count}`);
        console.log(`  Variations: ${dup.variations}`);
        console.log(`  IDs: ${dup.ids}\n`);
      }
    }

    // Summary
    console.log('=== SUMMARY ===');
    const [total] = await connection.execute('SELECT COUNT(*) as total FROM termes');
    console.log(`Total terms in database: ${total[0].total}`);
    console.log(`Exact duplicates: ${duplicates.length}`);
    console.log(`Case-insensitive duplicates: ${caseDuplicates.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Connection closed');
    }
  }
}

checkDuplicateTerms();
