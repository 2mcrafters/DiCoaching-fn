import mysql from 'mysql2/promise';

async function checkTables() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'dictionnaire_ch'
    });

    console.log('✅ Connexion réussie\n');

    // Check all tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('📋 Tables existantes:');
    tables.forEach(row => {
      const tableName = Object.values(row)[0];
      console.log(`  - ${tableName}`);
    });

    console.log('\n🔍 Vérification des tables critiques:');
    
    const criticalTables = ['users', 'termes', 'terms', 'categories', 'likes', 'commentaires'];
    for (const table of criticalTables) {
      const [result] = await connection.query(
        `SELECT COUNT(*) as count FROM information_schema.tables 
         WHERE table_schema = 'dictionnaire_ch' AND table_name = ?`,
        [table]
      );
      const exists = result[0].count > 0;
      console.log(`  ${exists ? '✅' : '❌'} ${table}: ${exists ? 'existe' : 'manquant'}`);
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkTables();
