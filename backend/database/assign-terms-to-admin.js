import db from '../services/database.js';

/**
 * Assigns all existing terms in the database to the admin user
 * Admin: Mohamed Rachid Belhadj (admin@dictionnaire.fr)
 */

async function assignTermsToAdmin() {
  try {
    console.log('🔄 Starting term assignment process...\n');

    // Step 1: Find admin user
    const adminUsers = await db.query(
      "SELECT id, email, firstname, lastname, role FROM users WHERE email = 'admin@dictionnaire.fr'"
    );

    if (!adminUsers || adminUsers.length === 0) {
      console.error('❌ Admin user not found! Please create admin@dictionnaire.fr first.');
      process.exit(1);
    }

    const admin = adminUsers[0];
    console.log('✅ Found admin user:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Name: ${admin.firstname} ${admin.lastname}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}\n`);

    // Step 2: Check current term ownership
    const statsBeforeAll = await db.query('SELECT COUNT(*) as count FROM terms');
    const statsBeforeAdmin = await db.query(
      'SELECT COUNT(*) as count FROM terms WHERE author_id = ?',
      [admin.id]
    );
    const statsBeforeOthers = await db.query(
      'SELECT COUNT(*) as count FROM terms WHERE author_id != ? OR author_id IS NULL',
      [admin.id]
    );

    const totalTerms = statsBeforeAll[0]?.count || 0;
    const adminTerms = statsBeforeAdmin[0]?.count || 0;
    const otherTerms = statsBeforeOthers[0]?.count || 0;

    console.log('📊 Current term ownership:');
    console.log(`   Total terms: ${totalTerms}`);
    console.log(`   Admin-owned: ${adminTerms}`);
    console.log(`   Others/Unassigned: ${otherTerms}\n`);

    if (otherTerms === 0) {
      console.log('✅ All terms are already owned by admin. Nothing to update.');
      process.exit(0);
    }

    // Step 3: Update all terms to admin
    console.log('🔄 Updating term ownership...');
    const result = await db.query(
      'UPDATE terms SET author_id = ? WHERE author_id != ? OR author_id IS NULL',
      [admin.id, admin.id]
    );

    console.log(`✅ Updated ${result.affectedRows} terms\n`);

    // Step 4: Verify the update
    const statsAfter = await db.query(
      'SELECT COUNT(*) as count FROM terms WHERE author_id = ?',
      [admin.id]
    );
    const newAdminTerms = statsAfter[0]?.count || 0;

    console.log('📊 Final term ownership:');
    console.log(`   Total terms: ${totalTerms}`);
    console.log(`   Admin-owned: ${newAdminTerms}\n`);

    // Step 5: Show sample of updated terms
    console.log('📝 Sample of terms now owned by admin:');
    const sampleTerms = await db.query(
      `SELECT id, term, status, created_at 
       FROM terms 
       WHERE author_id = ? 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [admin.id]
    );

    sampleTerms.forEach((term, index) => {
      console.log(`   ${index + 1}. ${term.term} (ID: ${term.id}, Status: ${term.status})`);
    });

    console.log('\n✅ Term assignment completed successfully!');
    console.log(`   ${newAdminTerms} terms are now owned by ${admin.firstname} ${admin.lastname}`);

  } catch (error) {
    console.error('❌ Error assigning terms:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
assignTermsToAdmin();
