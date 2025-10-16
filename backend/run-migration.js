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
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "dictionnaire_ch",
      port: process.env.DB_PORT || 3306,
    });

    console.log("✅ Connexion à la base de données établie");

    // Lire tous les fichiers de migration dans l'ordre
    const migrationsDir = path.join(__dirname, "database/migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.toLowerCase().endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    console.log(`📦 ${files.length} fichiers de migration trouvés`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(filePath, "utf8");
      const commands = migrationSQL
        .split(";")
        .map((cmd) => cmd.trim())
        .filter((cmd) => cmd && !cmd.startsWith("--"));

      console.log(
        `\n📋 Exécution de ${commands.length} commandes depuis ${file}...`
      );
      for (const command of commands) {
        if (!command) continue;
        try {
          await connection.execute(command);
          console.log(
            "✅ Commande exécutée:",
            command.substring(0, 80).replace(/\s+/g, " ") + "..."
          );
        } catch (err) {
          console.warn(
            "⚠️  Échec commande (continuation):",
            command.substring(0, 120)
          );
          console.warn("   Raison:", err.message);
          // Continue with next commands/files to keep migrations idempotent
        }
      }
    }

    await connection.end();
    console.log("🎉 Migration terminée avec succès !");
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  }
}

runMigration();
