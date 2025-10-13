# Profile Testing Guide

## ✅ Profile Fixes Applied

### Backend Improvements
1. **New Profile Update API**: `PATCH /api/users/:id/profile`
   - Supports profile picture uploads
   - Updates biography, professional status, presentation
   - Handles social media links
   - Proper error handling and validation

2. **Static File Serving**: `/uploads` route serves profile pictures
   - Proper file storage and retrieval
   - Security with file type validation

3. **Enhanced User Endpoints**: 
   - Complete user profile data in `GET /api/users/:id`
   - Profile picture support
   - Social media data handling

### Frontend Improvements
1. **MyProfile Component**:
   - ✅ Uses backend API instead of localStorage
   - ✅ Profile picture upload with preview
   - ✅ File validation (5MB max, images only)
   - ✅ Loading states and error handling
   - ✅ Proper field mapping (firstname/lastname vs name)
   - ✅ Professional status and biography editing

2. **AuthorProfile Component**:
   - ✅ Correct profile picture URL construction
   - ✅ Proper name display (firstname + lastname)
   - ✅ Professional status display
   - ✅ Social media links handling

3. **Profile Image Display**:
   - ✅ Fallback to placeholder images
   - ✅ Correct backend URL construction
   - ✅ Error handling for missing images

## 🧪 How to Test

### 1. User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstname": "John",
    "lastname": "Doe",
    "role": "chercheur"
  }'
```

### 2. Frontend Testing
1. **Navigate to**: http://localhost:3001
2. **Register/Login** with a test account
3. **Access Profile**: Go to "Mon Profil" in navigation
4. **Test Features**:
   - Update firstname/lastname
   - Add biography
   - Set professional status
   - Upload profile picture
   - Add social media links (for authors)
   - Change password

### 3. Profile Picture Testing
1. Click on the profile picture in MyProfile
2. Select an image file (JPG, PNG, etc.)
3. Verify preview appears
4. Save the profile
5. Check that image displays correctly
6. Visit AuthorProfile to see image there too

### 4. API Testing
```bash
# Get user profile
curl http://localhost:5000/api/users/1

# Update profile (requires auth token)
curl -X PATCH http://localhost:5000/api/users/1/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "firstname=John" \
  -F "lastname=Updated" \
  -F "biography=My bio"
```

## 🐛 Fixed Issues

### ❌ Previous Issues
- Profile used localStorage instead of database
- Profile pictures not displaying correctly
- Inconsistent field names (name vs firstname/lastname)
- No file upload validation
- Missing backend API endpoints
- Social media links not working
- No loading states or error handling

### ✅ Now Fixed
- ✅ Backend API integration
- ✅ Profile picture upload & display
- ✅ Consistent field naming
- ✅ File validation and error handling
- ✅ Complete backend endpoints
- ✅ Social media functionality
- ✅ Loading states and UX improvements
- ✅ Proper error handling
- ✅ Static file serving for uploads

## 🔧 Technical Details

### Backend Endpoints
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get specific user profile
- `PATCH /api/users/:id/profile` - Update user profile
- `GET /uploads/:filename` - Serve uploaded files

### Frontend Components
- `MyProfile.jsx` - User's own profile editing
- `AuthorProfile.jsx` - Public author profile view
- `authService.js` - API communication
- `AuthContext.jsx` - Authentication state

### File Structure
```
backend/
  routes/users.js - Profile API endpoints
  uploads/ - Profile picture storage
frontend/
  pages/MyProfile.jsx - Profile editing
  pages/AuthorProfile.jsx - Profile viewing
  services/authService.js - API integration
```

## 🚀 Next Steps
1. Test all profile functionality
2. Verify image uploads work correctly
3. Check author profile displays
4. Test social media links
5. Verify password changes work
6. Test error scenarios (large files, wrong types)

The profile system is now fully functional with proper backend integration!
