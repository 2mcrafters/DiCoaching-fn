import db from "../services/database.js";

async function testConnections() {
  try {
    console.log("🔍 Testing Complete System Connection...\n");

    // Test 1: Database Connection
    console.log("1️⃣  Testing Database Connection...");
    const testQuery = await db.query("SELECT 1 + 1 AS result");
    console.log("   ✅ Database responding:", testQuery[0].result === 2 ? "OK" : "FAIL");

    // Test 2: Check all required tables
    console.log("\n2️⃣  Checking Database Tables...");
    const tables = await db.query("SHOW TABLES");
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    const requiredTables = [
      'users', 'termes', 'categories', 'comments', 
      'decisions', 'likes', 'documents', 'reports'
    ];
    
    requiredTables.forEach(table => {
      const exists = tableNames.includes(table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    });

    // Test 3: Check data counts
    console.log("\n3️⃣  Data Statistics...");
    
    const [userCount] = await db.query("SELECT COUNT(*) as count FROM users");
    console.log(`   👥 Users: ${userCount.count}`);
    
    const [termCount] = await db.query("SELECT COUNT(*) as count FROM termes");
    console.log(`   📖 Terms: ${termCount.count}`);
    
    const [categoryCount] = await db.query("SELECT COUNT(*) as count FROM categories");
    console.log(`   📁 Categories: ${categoryCount.count}`);
    
    const [commentCount] = await db.query("SELECT COUNT(*) as count FROM comments");
    console.log(`   💬 Comments: ${commentCount.count}`);
    
    const [decisionCount] = await db.query("SELECT COUNT(*) as count FROM decisions");
    console.log(`   ⚖️  Decisions: ${decisionCount.count}`);
    
    const [likeCount] = await db.query("SELECT COUNT(*) as count FROM likes");
    console.log(`   ❤️  Likes: ${likeCount.count}`);

    // Test 4: Check table structures
    console.log("\n4️⃣  Verifying Table Structures...");
    
    // Check comments table
    const commentsColumns = await db.query("DESCRIBE comments");
    const hasCommentColumns = commentsColumns.some(c => c.Field === 'content') &&
                             commentsColumns.some(c => c.Field === 'term_id') &&
                             commentsColumns.some(c => c.Field === 'user_id');
    console.log(`   ${hasCommentColumns ? '✅' : '❌'} Comments table structure`);
    
    // Check decisions table
    const decisionsColumns = await db.query("DESCRIBE decisions");
    const hasDecisionColumns = decisionsColumns.some(c => c.Field === 'decision_type') &&
                               decisionsColumns.some(c => c.Field === 'term_id') &&
                               decisionsColumns.some(c => c.Field === 'user_id');
    console.log(`   ${hasDecisionColumns ? '✅' : '❌'} Decisions table structure`);

    // Test 5: Sample queries
    console.log("\n5️⃣  Testing Sample Queries...");
    
    try {
      const sampleTerm = await db.query("SELECT id, terme FROM termes LIMIT 1");
      console.log(`   ✅ Can query terms: ${sampleTerm.length > 0 ? sampleTerm[0].terme : 'No data'}`);
    } catch (err) {
      console.log(`   ❌ Error querying terms:`, err.message);
    }
    
    try {
      const sampleUser = await db.query("SELECT id, email, role FROM users LIMIT 1");
      console.log(`   ✅ Can query users: ${sampleUser.length > 0 ? sampleUser[0].email : 'No data'}`);
    } catch (err) {
      console.log(`   ❌ Error querying users:`, err.message);
    }

    // Test 6: Foreign key relationships
    console.log("\n6️⃣  Testing Foreign Key Relationships...");
    
    try {
      // Try to join comments with users and terms
      const joinTest = await db.query(`
        SELECT c.id, c.content, u.email, t.terme 
        FROM comments c 
        LEFT JOIN users u ON c.user_id = u.id 
        LEFT JOIN termes t ON c.term_id = t.id 
        LIMIT 1
      `);
      console.log(`   ✅ Comments join works (${joinTest.length} records)`);
    } catch (err) {
      console.log(`   ❌ Comments join failed:`, err.message);
    }
    
    try {
      // Try to join decisions with users and terms
      const joinTest2 = await db.query(`
        SELECT d.id, d.decision_type, u.email, t.terme 
        FROM decisions d 
        LEFT JOIN users u ON d.user_id = u.id 
        LEFT JOIN termes t ON d.term_id = t.id 
        LIMIT 1
      `);
      console.log(`   ✅ Decisions join works (${joinTest2.length} records)`);
    } catch (err) {
      console.log(`   ❌ Decisions join failed:`, err.message);
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ DATABASE CONNECTION TEST COMPLETE");
    console.log("=".repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error.message);
    process.exit(1);
  }
}

testConnections();
