import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkUsers() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });
    
    console.log('=== Structure de la table users ===');
    const [columns] = await connection.execute('DESCRIBE users');
    columns.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n=== Utilisateurs existants ===');
    const [users] = await connection.execute('SELECT id, email, firstname, lastname, role FROM users');
    console.log(users);
    
    console.log('\n=== Test de requête pour admin ===');
    const [adminUser] = await connection.execute('SELECT * FROM users WHERE email = ?', ['admin@dictionnaire.fr']);
    if (adminUser.length > 0) {
      console.log('Admin trouvé:', adminUser[0]);
    } else {
      console.log('Admin non trouvé');
    }
    
    await connection.end();
    console.log('✅ Vérification terminée');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkUsers();