#!/usr/bin/env node
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '.env') });

async function runMigration() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'dictionnaire_ch',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connexion à la base de données établie');

    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, 'database/migrations/003_update_users_for_registration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Diviser les commandes SQL
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--'));

    console.log(`📋 Exécution de ${commands.length} commandes de migration...`);

    // Exécuter chaque commande
    for (const command of commands) {
      if (command.trim()) {
        await connection.execute(command);
        console.log('✅ Commande exécutée:', command.substring(0, 50) + '...');
      }
    }

    await connection.end();
    console.log('🎉 Migration terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  }
}

runMigration();
