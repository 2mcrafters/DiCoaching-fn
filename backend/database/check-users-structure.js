import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from '../services/database.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

async function checkUsersTable() {
  try {
    console.log('🔍 Checking users table structure...\n');

    // Describe users table
    const columns = await db.query('DESCRIBE users');
    console.log('📋 Users table columns:');
    columns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });

    // Check admin user
    console.log('\n👤 Checking admin user...');
    const admins = await db.query(
      "SELECT * FROM users WHERE email = 'admin@dictionnaire.fr' LIMIT 1"
    );

    if (admins && admins.length > 0) {
      const admin = admins[0];
      console.log('\n✅ Found admin:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.firstname} ${admin.lastname}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Gender: ${admin.sex || 'not set'}`);
      
      // Check all profile picture related columns
      const profileFields = Object.keys(admin).filter(key => 
        key.toLowerCase().includes('profile') || 
        key.toLowerCase().includes('picture') ||
        key.toLowerCase().includes('photo') ||
        key.toLowerCase().includes('avatar')
      );
      
      if (profileFields.length > 0) {
        console.log('\n📸 Profile picture related fields:');
        profileFields.forEach(field => {
          console.log(`   - ${field}: ${admin[field] || 'null'}`);
        });
      } else {
        console.log('\n⚠️  No profile picture fields found in table!');
      }
    } else {
      console.log('❌ Admin user not found!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsersTable();
