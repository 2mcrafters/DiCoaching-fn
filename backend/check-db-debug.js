import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkDatabaseAndUsers() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    console.log('✅ Connexion à la base de données établie');
    
    console.log('\n=== Structure de la table users ===');
    const [columns] = await connection.execute('DESCRIBE users');
    columns.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('\n=== Utilisateurs existants ===');
    const [users] = await connection.execute('SELECT id, email, firstname, lastname, role FROM users');
    console.log('Nombre d\'utilisateurs:', users.length);
    users.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}, Nom: ${user.firstname} ${user.lastname}, Role: ${user.role}`);
    });

    console.log('\n=== Test de récupération d\'un utilisateur par email ===');
    const [adminUser] = await connection.execute('SELECT * FROM users WHERE email = ?', ['admin@dictionnaire.fr']);
    if (adminUser.length > 0) {
      console.log('✅ Utilisateur admin trouvé:', {
        id: adminUser[0].id,
        email: adminUser[0].email,
        firstname: adminUser[0].firstname,
        lastname: adminUser[0].lastname,
        role: adminUser[0].role,
        hasPassword: !!adminUser[0].password
      });
    } else {
      console.log('❌ Utilisateur admin non trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

checkDatabaseAndUsers();