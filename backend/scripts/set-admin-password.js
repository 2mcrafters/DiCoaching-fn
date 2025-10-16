#!/usr/bin/env node
import 'dotenv/config';
import bcrypt from 'bcrypt';
import db from '../services/database.js';

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@dictionnaire.fr';
  const newPassword = process.env.ADMIN_PASSWORD || 'admin123';

  try {
    await db.connect();
    let users = await db.query('SELECT id, email FROM users WHERE email = ?', [email]);
    if (!users || users.length === 0) {
      // Try to find any admin
      users = await db.query("SELECT id, email FROM users WHERE role = 'admin' LIMIT 1");
      if (!users || users.length === 0) {
        // Create an admin if none
        const hashNew = await bcrypt.hash(newPassword, 12);
        const result = await db.query(
          "INSERT INTO users (email, password, firstname, lastname, role, status, email_verified, created_at) VALUES (?, ?, 'Admin', 'System', 'admin', 'active', TRUE, NOW())",
          [email, hashNew]
        );
        console.log(`✅ Admin created: ${email}`);
        return process.exit(0);
      }
    }
    const adminId = users[0].id;
    const hash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password = ?, role = "admin", status = COALESCE(status, "active") WHERE id = ?', [hash, adminId]);
    console.log(`✅ Admin password updated for ${users[0].email}`);
    process.exit(0);
  } catch (e) {
    console.error('❌ Failed to set admin password:', e.message);
    process.exit(1);
  }
}

main();
