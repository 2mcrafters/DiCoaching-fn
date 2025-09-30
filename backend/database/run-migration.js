import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
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

    // Étape 1: Créer la table categories
    console.log('🔄 Étape 1: Création de la table categories...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        libelle VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Étape 2: Insérer la catégorie "Coaching" par défaut
    console.log('🔄 Étape 2: Insertion de la catégorie Coaching...');
    await connection.execute(`
      INSERT IGNORE INTO categories (libelle, description) VALUES 
      ('Coaching', 'Catégorie principale pour les termes de coaching')
    `);

    // Étape 3: Ajouter la colonne author_id à la table termes
    console.log('🔄 Étape 3: Ajout de la colonne author_id...');
    try {
      await connection.execute(`
        ALTER TABLE termes ADD COLUMN author_id INT DEFAULT 1
      `);
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('⚠️ La colonne author_id existe déjà');
      } else {
        throw error;
      }
    }

    // Étape 4: Ajouter la colonne categorie_id à la table termes
    console.log('🔄 Étape 4: Ajout de la colonne categorie_id...');
    try {
      await connection.execute(`
        ALTER TABLE termes ADD COLUMN categorie_id INT DEFAULT 1
      `);
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('⚠️ La colonne categorie_id existe déjà');
      } else {
        throw error;
      }
    }

    // Étape 5: Mettre à jour tous les termes existants avec la catégorie "Coaching" (id=1)
    console.log('🔄 Étape 5: Mise à jour des termes existants...');
    await connection.execute(`
      UPDATE termes SET categorie_id = 1 WHERE categorie_id IS NULL OR categorie_id = 0
    `);

    // Étape 6: Ajouter les contraintes de clés étrangères
    console.log('🔄 Étape 6: Ajout des contraintes de clés étrangères...');
    try {
      await connection.execute(`
        ALTER TABLE termes ADD CONSTRAINT fk_termes_author 
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
      `);
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('⚠️ La contrainte fk_termes_author existe déjà');
      } else {
        throw error;
      }
    }

    try {
      await connection.execute(`
        ALTER TABLE termes ADD CONSTRAINT fk_termes_categorie 
        FOREIGN KEY (categorie_id) REFERENCES categories(id) ON DELETE SET NULL
      `);
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('⚠️ La contrainte fk_termes_categorie existe déjà');
      } else {
        throw error;
      }
    }

    // Étape 7: Créer des index pour améliorer les performances
    console.log('🔄 Étape 7: Création des index...');
    try {
      await connection.execute(`CREATE INDEX idx_termes_author_id ON termes(author_id)`);
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('⚠️ L\'index idx_termes_author_id existe déjà');
      } else {
        throw error;
      }
    }

    try {
      await connection.execute(`CREATE INDEX idx_termes_categorie_id ON termes(categorie_id)`);
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('⚠️ L\'index idx_termes_categorie_id existe déjà');
      } else {
        throw error;
      }
    }

    try {
      await connection.execute(`CREATE INDEX idx_termes_terme ON termes(terme)`);
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('⚠️ L\'index idx_termes_terme existe déjà');
      } else {
        throw error;
      }
    }

    console.log('✅ Migration 001 exécutée avec succès!');
    
    // Vérifier les résultats
    console.log('\n📊 Vérification des résultats:');
    
    const [categories] = await connection.execute('SELECT * FROM categories');
    console.log('Categories créées:', categories);
    
    const [tableInfo] = await connection.execute('DESCRIBE termes');
    console.log('\nStructure de la table termes après migration:');
    tableInfo.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    const [termCount] = await connection.execute('SELECT COUNT(*) as count FROM termes WHERE categorie_id = 1');
    console.log(`\nNombre de termes avec categorie_id = 1 (Coaching): ${termCount[0].count}`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter la migration
runMigration();