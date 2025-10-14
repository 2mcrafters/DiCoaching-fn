const mysql = require('mysql2/promise');

async function removeDuplicates() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'dict_coaching'
    });

    console.log('✓ Connected to database\n');

    // Step 1: Count current duplicates
    console.log('=== STEP 1: Checking for duplicates ===\n');
    const [duplicates] = await connection.execute(`
      SELECT terme, COUNT(*) as count, GROUP_CONCAT(id ORDER BY id) as ids
      FROM termes 
      GROUP BY terme 
      HAVING count > 1
      ORDER BY terme
    `);

    if (duplicates.length === 0) {
      console.log('✓ No duplicates found. Database is clean!');
      await connection.end();
      return;
    }

    console.log(`Found ${duplicates.length} duplicate terms\n`);
    console.log('Preview of duplicates (showing first 10):');
    duplicates.slice(0, 10).forEach(dup => {
      console.log(`  - "${dup.terme}": ${dup.count} times (IDs: ${dup.ids})`);
    });
    
    if (duplicates.length > 10) {
      console.log(`  ... and ${duplicates.length - 10} more`);
    }
    console.log('');

    // Step 2: Preview what will be deleted
    console.log('=== STEP 2: Preview of entries to be DELETED ===\n');
    const [toDelete] = await connection.execute(`
      SELECT 
        t2.id,
        t2.terme,
        t2.slug,
        t2.createdAt,
        t2.author_id
      FROM termes t1
      INNER JOIN termes t2 
        ON t1.terme = t2.terme 
        AND t1.id < t2.id
      ORDER BY t2.terme, t2.id
      LIMIT 20
    `);

    console.log(`Total entries to delete: ${toDelete.length}`);
    console.log('First 20 entries that will be deleted:');
    toDelete.forEach((entry, idx) => {
      console.log(`  ${idx + 1}. ID: ${entry.id} | "${entry.terme}" | Created: ${entry.createdAt}`);
    });
    console.log('');

    // Step 3: Preview what will be kept
    console.log('=== STEP 3: Preview of entries to be KEPT ===\n');
    const [toKeep] = await connection.execute(`
      SELECT DISTINCT
        t1.id,
        t1.terme,
        t1.slug,
        t1.createdAt,
        t1.author_id
      FROM termes t1
      INNER JOIN termes t2 
        ON t1.terme = t2.terme 
        AND t1.id < t2.id
      ORDER BY t1.terme, t1.id
      LIMIT 20
    `);

    console.log('First 20 entries that will be kept (oldest with lowest ID):');
    toKeep.forEach((entry, idx) => {
      console.log(`  ${idx + 1}. ID: ${entry.id} | "${entry.terme}" | Created: ${entry.createdAt}`);
    });
    console.log('');

    // Step 4: Execute deletion
    console.log('=== STEP 4: Executing deletion ===\n');
    console.log('⚠️  Starting deletion in 3 seconds...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    const [result] = await connection.execute(`
      DELETE t2 
      FROM termes t1
      INNER JOIN termes t2 
        ON t1.terme = t2.terme 
        AND t1.id < t2.id
    `);

    console.log(`✓ Successfully deleted ${result.affectedRows} duplicate entries\n`);

    // Step 5: Verify
    console.log('=== STEP 5: Verification ===\n');
    const [remainingDuplicates] = await connection.execute(`
      SELECT terme, COUNT(*) as count 
      FROM termes 
      GROUP BY terme 
      HAVING count > 1
    `);

    if (remainingDuplicates.length === 0) {
      console.log('✓ SUCCESS! No duplicates remaining');
    } else {
      console.log(`⚠️  Warning: ${remainingDuplicates.length} duplicates still exist`);
      remainingDuplicates.forEach(dup => {
        console.log(`  - "${dup.terme}": ${dup.count} times`);
      });
    }

    // Summary
    const [totalTerms] = await connection.execute('SELECT COUNT(*) as total FROM termes');
    console.log(`\nTotal terms in database: ${totalTerms[0].total}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Connection closed');
    }
  }
}

// Run the function
console.log('===========================================');
console.log('  DUPLICATE TERMS REMOVAL SCRIPT');
console.log('===========================================\n');
console.log('This script will:');
console.log('1. Find all duplicate terms');
console.log('2. Keep the OLDEST entry (lowest ID)');
console.log('3. Delete all newer duplicates\n');

removeDuplicates();
