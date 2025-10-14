import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from '../services/database.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

/**
 * Sets profile picture for admin user Mohamed Rachid Belhadj
 * Uses gender-based avatar as profile picture
 */

async function setAdminProfilePicture() {
  try {
    console.log('🖼️  Starting admin profile picture setup...\n');

    // Step 1: Find admin user
    const adminUsers = await db.query(
      "SELECT id, email, firstname, lastname, sex, profile_picture, profile_picture_url FROM users WHERE email = 'admin@dictionnaire.fr'"
    );

    if (!adminUsers || adminUsers.length === 0) {
      console.error('❌ Admin user not found! Please create admin@dictionnaire.fr first.');
      process.exit(1);
    }

    const admin = adminUsers[0];
    console.log('✅ Found admin user:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Name: ${admin.firstname} ${admin.lastname}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Gender: ${admin.sex || 'not set'}`);
    console.log(`   Current profile_picture: ${admin.profile_picture || 'none'}`);
    console.log(`   Current profile_picture_url: ${admin.profile_picture_url || 'none'}\n`);

    // Step 2: Determine if we need to update
    if (admin.profile_picture || admin.profile_picture_url) {
      console.log('ℹ️  Admin already has a profile picture set.');
      console.log('   Do you want to update it? (This script will proceed)\n');
    }

    // Step 3: Set gender-based avatar URL
    // Based on the name "Mohamed Rachid Belhadj" - typically male name
    const gender = admin.sex || 'homme'; // Default to 'homme' if not set
    const userId = admin.id;
    
    // Generate gender-appropriate avatar URL (consistent with avatarUtils.js)
    let avatarUrl;
    if (gender === 'femme') {
      avatarUrl = `https://avatar.iran.liara.run/public/girl?username=user${userId}`;
    } else if (gender === 'homme') {
      avatarUrl = `https://avatar.iran.liara.run/public/boy?username=user${userId}`;
    } else {
      avatarUrl = `https://avatar.iran.liara.run/public?username=user${userId}`;
    }

    console.log('🎨 Generated avatar URL:', avatarUrl);

    // Step 4: Update admin user with avatar
    await db.query(
      'UPDATE users SET sex = ?, profile_picture_url = ? WHERE id = ?',
      [gender, avatarUrl, admin.id]
    );

    console.log('\n✅ Successfully updated admin profile picture!');
    
    // Step 5: Verify the update
    const updatedAdmin = await db.query(
      "SELECT id, email, firstname, lastname, sex, profile_picture_url FROM users WHERE email = 'admin@dictionnaire.fr'"
    );

    const updated = updatedAdmin[0];
    console.log('\n📊 Updated admin profile:');
    console.log(`   Name: ${updated.firstname} ${updated.lastname}`);
    console.log(`   Email: ${updated.email}`);
    console.log(`   Gender: ${updated.sex}`);
    console.log(`   Profile Picture URL: ${updated.profile_picture_url}`);
    
    console.log('\n🎉 Admin profile picture setup complete!');
    console.log('   The avatar will now display on:');
    console.log('   - Dashboard');
    console.log('   - Navbar');
    console.log('   - Author Cards');
    console.log('   - Comments');
    console.log('   - User Details');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error setting admin profile picture:', error);
    process.exit(1);
  }
}

// Run the script
setAdminProfilePicture();
