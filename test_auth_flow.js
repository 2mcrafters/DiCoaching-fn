import db from './backend/services/database.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

async function test() {
  try {
    console.log('🧪 Starting Auth Flow Test');
    const email = 'test_auth_flow@example.com';
    const password = 'password123';
    const newPassword = 'newpassword456';

    // 1. Cleanup
    await db.query('DELETE FROM users WHERE email = ?', [email]);

    // 2. Create User
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (email, password, firstname, lastname, role) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, 'Test', 'User', 'researcher']
    );
    const userId = result.insertId;
    console.log(`✅ User created with ID: ${userId}`);

    // 3. Login (Simulate)
    const users = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    console.log(`✅ Login check (original): ${valid}`);
    if (!valid) throw new Error('Login failed');

    // 4. Change Password (Simulate logic)
    // Verify old
    const validOld = await bcrypt.compare(password, user.password);
    if (!validOld) throw new Error('Old password verification failed');
    
    // Hash new
    const newHashed = await bcrypt.hash(newPassword, 10);
    // Update
    await db.query('UPDATE users SET password = ? WHERE id = ?', [newHashed, userId]);
    console.log('✅ Password updated in DB');

    // 5. Login with New Password (Simulate)
    const usersNew = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    const userNew = usersNew[0];
    const validNew = await bcrypt.compare(newPassword, userNew.password);
    console.log(`✅ Login check (new): ${validNew}`);
    
    if (!validNew) {
        console.error('❌ Login with new password FAILED');
        console.error('New Password:', newPassword);
        console.error('Hash in DB:', userNew.password);
    } else {
        console.log('🎉 Success! Auth flow works.');
    }

    // Cleanup
    await db.query('DELETE FROM users WHERE id = ?', [userId]);
    process.exit(0);

  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

test();
