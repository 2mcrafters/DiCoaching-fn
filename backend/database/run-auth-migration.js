import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runAuthMigration() {
  let connection;
  
  try {
    // Connexion à la base de données
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'dict',
      port: process.env.DB_PORT || 3307
    });

    console.log('✅ Connexion à la base de données établie');

    // Étape 1: Vérifier la structure actuelle de la table users
    console.log('🔄 Étape 1: Vérification de la structure de la table users...');
    const [tableInfo] = await connection.execute('DESCRIBE users');
    console.log('Structure actuelle:', tableInfo.map(col => col.Field));

    // Étape 2: Ajouter les colonnes manquantes
    const requiredColumns = ['password', 'firstname', 'lastname', 'email', 'role', 'created_at', 'updated_at'];
    const existingColumns = tableInfo.map(col => col.Field);

    for (const column of requiredColumns) {
      if (!existingColumns.includes(column)) {
        console.log(`🔄 Ajout de la colonne: ${column}`);
        
        switch (column) {
          case 'password':
            await connection.execute('ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT ""');
            break;
          case 'firstname':
            await connection.execute('ALTER TABLE users ADD COLUMN firstname VARCHAR(100) NOT NULL DEFAULT ""');
            break;
          case 'lastname':
            await connection.execute('ALTER TABLE users ADD COLUMN lastname VARCHAR(100) NOT NULL DEFAULT ""');
            break;
          case 'email':
            await connection.execute('ALTER TABLE users ADD COLUMN email VARCHAR(255) NOT NULL DEFAULT ""');
            break;
          case 'role':
            await connection.execute("ALTER TABLE users ADD COLUMN role ENUM('admin', 'author', 'user') DEFAULT 'user'");
            break;
          case 'created_at':
            await connection.execute('ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
            break;
          case 'updated_at':
            await connection.execute('ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
            break;
        }
      } else {
        console.log(`✅ La colonne ${column} existe déjà`);
      }
    }

    // Étape 3: Ajouter l'index unique sur l'email
    console.log('🔄 Étape 3: Ajout de l\'index unique sur l\'email...');
    try {
      await connection.execute('ALTER TABLE users ADD UNIQUE INDEX idx_users_email (email)');
      console.log('✅ Index unique ajouté sur l\'email');
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('⚠️ L\'index sur l\'email existe déjà');
      } else {
        throw error;
      }
    }

    // Étape 4: Créer un utilisateur admin par défaut
    console.log('🔄 Étape 4: Création de l\'utilisateur admin par défaut...');
    const adminEmail = 'admin@dictionnaire.fr';
    const adminPassword = 'admin123';
    
    // Vérifier si l'admin existe déjà
    const [existingAdmin] = await connection.execute('SELECT id FROM users WHERE email = ?', [adminEmail]);
    
    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await connection.execute(`
        INSERT INTO users (email, password, firstname, lastname, role) 
        VALUES (?, ?, ?, ?, ?)
      `, [adminEmail, hashedPassword, 'Admin', 'Système', 'admin']);
      
      console.log('✅ Utilisateur admin créé avec succès');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Mot de passe: ${adminPassword}`);
    } else {
      console.log('⚠️ L\'utilisateur admin existe déjà');
    }

    console.log('✅ Migration d\'authentification terminée avec succès!');
    
    // Vérification finale
    console.log('\n📊 Vérification des résultats:');
    const [finalTableInfo] = await connection.execute('DESCRIBE users');
    console.log('Structure finale de la table users:');
    finalTableInfo.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`\nNombre total d'utilisateurs: ${userCount[0].count}`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration d\'authentification:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter la migration
runAuthMigration();