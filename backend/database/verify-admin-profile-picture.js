import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from '../services/database.js';
import fs from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

async function verifyAdminProfilePicture() {
  try {
    console.log('🔍 Verifying Mohamed Rachid Belhadj profile picture...\n');

    // Get admin user
    const admins = await db.query(
      "SELECT id, email, firstname, lastname, sex, profile_picture FROM users WHERE email = 'admin@dictionnaire.fr'"
    );

    if (!admins || admins.length === 0) {
      console.error('❌ Admin user not found!');
      process.exit(1);
    }

    const admin = admins[0];
    console.log('✅ Admin user found:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Name: ${admin.firstname} ${admin.lastname}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Gender: ${admin.sex}`);
    console.log(`   Profile Picture: ${admin.profile_picture || 'not set'}\n`);

    // Check if profile picture file exists
    if (admin.profile_picture) {
      const profilePicturePath = join(__dirname, '..', 'uploads', 'profiles', admin.profile_picture);
      
      if (fs.existsSync(profilePicturePath)) {
        const stats = fs.statSync(profilePicturePath);
        console.log('✅ Profile picture file exists:');
        console.log(`   Path: uploads/profiles/${admin.profile_picture}`);
        console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log(`   Modified: ${stats.mtime.toLocaleString()}\n`);
        
        console.log('📸 Profile picture URL:');
        console.log(`   http://localhost:5000/uploads/profiles/${admin.profile_picture}\n`);
        
        console.log('✅ The profile picture is correctly set up!');
        console.log('\n📍 Where it displays:');
        console.log('   ✓ Dashboard - Top header with greeting');
        console.log('   ✓ Navbar - Profile dropdown menu');
        console.log('   ✓ Authors page - Author card with badge');
        console.log('   ✓ Comments - Author avatar');
        console.log('   ✓ User details dialog');
        
        console.log('\n💡 Tips:');
        console.log('   - Make sure the backend server is running on port 5000');
        console.log('   - Clear browser cache if changes don\'t appear (Ctrl + Shift + R)');
        console.log('   - Check browser console for any 404 errors on the image');
        
      } else {
        console.log('❌ Profile picture file not found at:');
        console.log(`   ${profilePicturePath}\n`);
        console.log('💡 Suggestion: Update profile picture to gender-based avatar');
        console.log(`   SQL: UPDATE users SET profile_picture = NULL WHERE id = ${admin.id};`);
        console.log('   This will fall back to the gender-based avatar system.');
      }
    } else {
      console.log('⚠️  Profile picture field is empty');
      console.log('\n💡 The system will use gender-based avatar:');
      const genderAvatar = `https://avatar.iran.liara.run/public/boy?username=user${admin.id}`;
      console.log(`   ${genderAvatar}`);
      console.log('\n📍 This avatar will display across the application automatically.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyAdminProfilePicture();
