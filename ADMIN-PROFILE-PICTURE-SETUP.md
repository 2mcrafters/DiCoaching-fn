# Admin Profile Picture Setup Guide

## 📋 Overview

This guide explains how to set up the profile picture for the admin user **Mohamed Rachid Belhadj** (admin@dictionnaire.fr).

## 🎯 Purpose

The admin user's profile picture will be displayed across the application:
- ✅ Dashboard header ("Bonjour, Mohamed Rachid Belhadj")
- ✅ Navbar dropdown menu
- ✅ Author Cards on Authors page
- ✅ Comment sections
- ✅ User detail dialogs

## 🖼️ Avatar System

The application has a sophisticated avatar system with fallback chain:

### 1. **Uploaded Profile Picture** (Highest Priority)
- User uploads their own photo via profile settings
- Stored in `backend/uploads/profiles/`
- Database field: `profile_picture`

### 2. **External Avatar URL** (Second Priority)
- Gender-based avatar from avatar.iran.liara.run
- Database field: `profile_picture_url`
- Automatically generated based on user ID and gender

### 3. **Initials Fallback** (Lowest Priority)
- Shows first letter of firstname + lastname
- Used when no picture or URL is available
- Colored background with white text

## 🚀 Setup Methods

### Method 1: Using Node.js Script (Recommended)

**Advantages:**
- Automatic user ID detection
- Consistent with frontend avatar system
- Progress reporting and verification
- Error handling

**Steps:**

1. **Navigate to backend directory:**
   ```powershell
   cd backend
   ```

2. **Run the setup script:**
   ```powershell
   node database/set-admin-profile-picture.js
   ```

3. **Expected output:**
   ```
   🖼️  Starting admin profile picture setup...
   
   ✅ Found admin user:
      ID: 1
      Name: Mohamed Rachid Belhadj
      Email: admin@dictionnaire.fr
      Gender: not set
      Current profile_picture: none
      Current profile_picture_url: none
   
   🎨 Generated avatar URL: https://avatar.iran.liara.run/public/boy?username=user1
   
   ✅ Successfully updated admin profile picture!
   
   📊 Updated admin profile:
      Name: Mohamed Rachid Belhadj
      Email: admin@dictionnaire.fr
      Gender: homme
      Profile Picture URL: https://avatar.iran.liara.run/public/boy?username=user1
   
   🎉 Admin profile picture setup complete!
      The avatar will now display on:
      - Dashboard
      - Navbar
      - Author Cards
      - Comments
      - User Details
   ```

### Method 2: Using SQL Script

**Advantages:**
- Direct database manipulation
- Can be run from any MySQL client

**Steps:**

1. **Connect to MySQL:**
   ```powershell
   mysql -u root -p dicoaching
   ```

2. **Run the SQL script:**
   ```sql
   source backend/database/set-admin-profile-picture.sql
   ```

   Or from PowerShell:
   ```powershell
   Get-Content backend/database/set-admin-profile-picture.sql | mysql -u root -p dicoaching
   ```

3. **Verify the results in the output**

### Method 3: Manual Update (Custom Photo)

If you have a custom photo for the admin user:

1. **Place the photo in uploads folder:**
   ```
   backend/uploads/profiles/admin-profile.jpg
   ```

2. **Update the database:**
   ```sql
   UPDATE users 
   SET profile_picture = 'admin-profile.jpg'
   WHERE email = 'admin@dictionnaire.fr';
   ```

## 📂 Files Created

### 1. `backend/database/set-admin-profile-picture.js`
- Node.js script for automated setup
- Queries admin user
- Generates gender-based avatar URL
- Updates database with verification

### 2. `backend/database/set-admin-profile-picture.sql`
- SQL script for manual setup
- Shows current profile status
- Updates gender and avatar URL
- Includes verification query

### 3. `ADMIN-PROFILE-PICTURE-SETUP.md` (this file)
- Complete documentation
- Multiple setup methods
- Troubleshooting guide

## 🔍 How Avatar System Works

### Frontend (avatarUtils.js)

```javascript
export const getProfilePictureUrl = (user = {}) => {
  const API_BASE_URL = "http://localhost:5000";
  
  // Priority 1: Check for uploaded picture or URL
  const storedPicture = user.profile_picture_url || user.profile_picture;
  
  if (storedPicture) {
    // Return full URL
    if (/^https?:\/\//i.test(storedPicture)) {
      return storedPicture;
    }
    // Return local uploaded file
    return `${API_BASE_URL}/uploads/${storedPicture}`;
  }
  
  // Priority 2: Gender-based avatar
  return getGenderAvatar(user.id, user.sex);
};

export const getGenderAvatar = (userId, gender) => {
  const seed = `user${userId}`;
  
  if (gender === 'femme') {
    return `https://avatar.iran.liara.run/public/girl?username=${seed}`;
  } else if (gender === 'homme') {
    return `https://avatar.iran.liara.run/public/boy?username=${seed}`;
  } else {
    return `https://avatar.iran.liara.run/public?username=${seed}`;
  }
};
```

### Component Usage (AuthorCard.jsx)

```jsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getProfilePictureUrl } from '@/lib/avatarUtils';

<Avatar className="h-24 w-24">
  <AvatarImage
    src={getProfilePictureUrl(author)}
    alt={`${author.firstname} ${author.lastname}`}
  />
  <AvatarFallback>
    <User className="h-12 w-12" />
  </AvatarFallback>
</Avatar>
```

## 🎨 Badge System Integration

The admin user also has a badge system based on score:

| Score Range | Badge | Icon | Color |
|-------------|-------|------|-------|
| 0-19 | Bronze | Shield | Orange |
| 20-49 | Argent | Star | Gray |
| 50-99 | Or | Gem | Yellow |
| 100+ | Expert | Crown | Red |

**Current Status:** Mohamed Rachid Belhadj has **Bronze** badge

## ✅ Verification Steps

After running the setup script:

1. **Check Database:**
   ```sql
   SELECT email, firstname, lastname, sex, profile_picture_url 
   FROM users 
   WHERE email = 'admin@dictionnaire.fr';
   ```

2. **Check Frontend:**
   - Login as admin@dictionnaire.fr
   - Open Dashboard → Should see avatar next to "Bonjour, Mohamed Rachid Belhadj"
   - Open Navbar → Click profile dropdown → Should see avatar
   - Go to Authors page → Should see admin's card with avatar + Bronze badge
   - Add comment → Should see avatar in comment author section

3. **Test Avatar URL:**
   - Copy the `profile_picture_url` from database
   - Paste in browser → Should load a consistent male avatar image

## 🐛 Troubleshooting

### Issue: Avatar shows "M" initial instead of image

**Causes:**
- Database fields `profile_picture` and `profile_picture_url` are NULL
- Avatar URL is not accessible

**Solutions:**
1. Run the setup script: `node backend/database/set-admin-profile-picture.js`
2. Check network connectivity to avatar.iran.liara.run
3. Verify browser console for 404 errors on avatar image

### Issue: Avatar URL returns 404

**Causes:**
- External avatar service is down
- Incorrect URL format

**Solutions:**
1. Use alternative service (dicebear.com):
   ```sql
   UPDATE users 
   SET profile_picture_url = CONCAT('https://api.dicebear.com/7.x/avataaars/svg?seed=user', id, '&gender=male')
   WHERE email = 'admin@dictionnaire.fr';
   ```

### Issue: Uploaded photo not displaying

**Causes:**
- File not in correct directory
- Incorrect permissions
- Wrong filename in database

**Solutions:**
1. Check file exists: `backend/uploads/profiles/admin-profile.jpg`
2. Verify permissions: File should be readable by Node.js process
3. Check database value matches filename exactly
4. Restart backend server: `npm run dev`

### Issue: Changes not reflected immediately

**Solutions:**
1. **Clear browser cache:** Ctrl + Shift + R (hard refresh)
2. **Restart backend server:** Stop and restart `npm run dev`
3. **Check Redux state:** Open Redux DevTools → Check user object
4. **Re-login:** Logout and login again to refresh user data

## 🔗 Related Files

### Backend Files
- `backend/services/database.js` - Database connection
- `backend/routes/auth.js` - User authentication
- `backend/routes/users.js` - User profile management
- `backend/uploads/profiles/` - Uploaded profile pictures directory

### Frontend Files
- `src/lib/avatarUtils.js` - Avatar URL generation logic
- `src/lib/badges.jsx` - Badge tier calculation
- `src/components/ui/avatar.jsx` - Avatar component (Radix UI)
- `src/components/authors/AuthorCard.jsx` - Author display with avatar + badge
- `src/components/Navbar.jsx` - Navigation with profile dropdown
- `src/pages/Dashboard.jsx` - Dashboard header with greeting

### Database Tables
- `users` table:
  - `id` - User ID (used in avatar URL seed)
  - `email` - User email identifier
  - `firstname`, `lastname` - Display name
  - `sex` - Gender ('homme', 'femme', 'autre')
  - `profile_picture` - Uploaded filename
  - `profile_picture_url` - External avatar URL
  - `score` - Used for badge calculation

## 📊 Database Schema

```sql
-- Relevant fields in users table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  firstname VARCHAR(100),
  lastname VARCHAR(100),
  sex ENUM('homme', 'femme', 'autre'),
  profile_picture VARCHAR(255),
  profile_picture_url VARCHAR(500),
  score INT DEFAULT 0,
  -- ... other fields
);
```

## 🎯 Next Steps

After setting up the admin profile picture:

1. **Test Across All Pages:**
   - ✅ Dashboard
   - ✅ Navbar dropdown
   - ✅ Authors page
   - ✅ Comments section
   - ✅ User details dialog

2. **Consider Custom Photo:**
   - If you have Mohamed Rachid Belhadj's actual photo
   - Upload via profile settings page
   - Or manually place in `backend/uploads/profiles/`

3. **Update Other Users:**
   - Encourage users to upload their own photos
   - Or run similar script for other key users

4. **Monitor Avatar Service:**
   - Check if avatar.iran.liara.run remains accessible
   - Have fallback service ready (dicebear.com)

## 📝 Summary

This setup ensures Mohamed Rachid Belhadj's profile picture displays consistently across the entire application using the gender-based avatar system. The avatar is generated from his user ID and gender, providing a consistent visual identity even without an uploaded photo.

**Key Benefits:**
- ✅ Consistent avatar across all pages
- ✅ No manual photo upload required initially
- ✅ Fallback system prevents broken images
- ✅ Easy to upgrade to custom photo later
- ✅ Works with existing badge system (Bronze)

---

*Created: January 2025*  
*For: DictCoaching Application*  
*Admin: Mohamed Rachid Belhadj (admin@dictionnaire.fr)*
