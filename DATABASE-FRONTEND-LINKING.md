# Database-Frontend Linking Verification

## ✅ All Database Tables and Their Connections

### 1. **users** Table
- **Backend Routes:** `auth.js`, `users.js`, `dashboard.js`, `stats.js`
- **Frontend:** 
  - Redux Slice: `src/features/users/usersSlice.js`
  - Auth Context: `src/contexts/AuthContext.jsx`
  - Services: `src/services/authService.js`, `src/services/api.js`
  - Pages: `Login.jsx`, `Register.jsx`, `MyProfile.jsx`, `Dashboard.jsx`
  - Components: `UsersManagement.jsx`, `UserDetailsDialog.jsx`, `PendingAuthors.jsx`
- **API Endpoints:**
  - `GET /api/users` - Get all users
  - `GET /api/users/:id` - Get user by ID
  - `GET /api/users/:id/stats` - Get user statistics
  - `POST /api/users` - Create user
  - `PUT /api/users/:id` - Update user
  - `DELETE /api/users/:id` - Delete user
  - `POST /api/auth/login` - User login
  - `POST /api/auth/register` - User registration
- **Status:** ✅ Fully Connected

---

### 2. **terms** Table
- **Backend Routes:** `terms.js`, `stats.js`, `dashboard.js`
- **Frontend:**
  - Redux Slice: `src/features/terms/termsSlice.js`
  - Pages: `Home.jsx`, `Search.jsx`, `Fiche.jsx`, `Submit.jsx`, `EditTerm.jsx`
  - Components: `TermCard.jsx`, `TermsList.jsx`, `UserTermsList.jsx`, `TermsManagement.jsx`
- **API Endpoints:**
  - `GET /api/terms` - Get all terms with filters
  - `GET /api/terms/:id` - Get term by ID
  - `POST /api/terms` - Create term
  - `PUT /api/terms/:id` - Update term
  - `DELETE /api/terms/:id` - Delete term
  - `POST /api/terms/:id/like` - Like a term
- **Status:** ✅ Fully Connected

---

### 3. **categories** Table
- **Backend Routes:** `categories.js`, `stats.js`, `dashboard.js`
- **Frontend:**
  - Redux Slice: `src/features/categories/categoriesSlice.js`
  - Pages: `Submit.jsx`, `EditTerm.jsx`, `Search.jsx`
  - Components: Used in term forms and filters
- **API Endpoints:**
  - `GET /api/categories` - Get all categories
  - `POST /api/categories` - Create category
  - `PUT /api/categories/:id` - Update category
  - `DELETE /api/categories/:id` - Delete category
- **Status:** ✅ Fully Connected

---

### 4. **comments** Table
- **Backend Routes:** `comments.js`
- **Frontend:**
  - Pages: `Fiche.jsx`
  - Components: `FicheComments.jsx`, `CommentsList.jsx`
- **API Endpoints:**
  - `GET /api/comments/:termId` - Get comments for a term
  - `POST /api/comments` - Create comment
  - `PUT /api/comments/:id` - Update comment
  - `DELETE /api/comments/:id` - Delete comment
- **Status:** ✅ Fully Connected

---

### 5. **likes** Table
- **Backend Routes:** `likes.js`, `users.js` (for stats)
- **Frontend:**
  - Pages: `Fiche.jsx`
  - Components: `LikeButton.jsx`, `FicheLikes.jsx`
  - Services: `src/services/api.js`
- **API Endpoints:**
  - `GET /api/likes/:termId` - Get likes count for term
  - `POST /api/likes/:termId` - Like a term
  - `DELETE /api/likes/:termId` - Unlike a term
  - `GET /api/likes/user/:userId` - Get user's liked terms
- **Status:** ✅ Fully Connected

---

### 6. **proposed_modifications** Table
- **Backend Routes:** `modifications.js`, `users.js` (for stats), `dashboard.js`, `stats.js`
- **Frontend:**
  - Pages: `Modifications.jsx`, `ModificationDetails.jsx`, `ProposeModification.jsx`, `Dashboard.jsx`
  - Components: `ModificationsList.jsx`, `ModificationCard.jsx`
- **API Endpoints:**
  - `GET /api/modifications` - Get all modifications
  - `GET /api/modifications/:id` - Get modification by ID
  - `POST /api/modifications` - Create modification proposal
  - `PUT /api/modifications/:id` - Update modification status
  - `DELETE /api/modifications/:id` - Delete modification
- **Status:** ✅ Fully Connected

---

### 7. **reports** Table
- **Backend Routes:** `reports.js`, `stats.js`, `dashboard.js`
- **Frontend:**
  - Pages: `Reports.jsx` (admin page), `Dashboard.jsx`
  - Components: `ReportsList.jsx`, `ReportDialog.jsx`
- **API Endpoints:**
  - `GET /api/reports` - Get all reports
  - `POST /api/reports` - Create report
  - `PUT /api/reports/:id` - Update report status
  - `DELETE /api/reports/:id` - Delete report
- **Status:** ✅ Fully Connected

---

### 8. **user_documents** Table
- **Backend Routes:** `documents.js`, `users.js` (for stats), `auth.js` (for registration)
- **Frontend:**
  - Pages: `MyProfile.jsx`, `AuthorProfile.jsx`, `Register.jsx`
  - Components: `DocumentUpload.jsx`, `UserDetailsDialog.jsx`
- **API Endpoints:**
  - `GET /api/documents/user/:userId` - Get user's documents
  - `POST /api/documents/upload` - Upload document
  - `GET /api/documents/download/:id` - Download document
  - `DELETE /api/documents/:id` - Delete document
  - `PUT /api/documents/:id/status` - Update document status (admin)
- **Status:** ✅ Fully Connected
- **Note:** This is the ACTIVE documents table (not the old `documents` table which will be removed)

---

### 9. **decisions** Table
- **Backend Routes:** `decisions.js`, `dashboard.js`
- **Frontend:**
  - Pages: `Dashboard.jsx` (researcher dashboard)
  - Components: `DecisionsList.jsx`, `DecisionCard.jsx`
- **API Endpoints:**
  - `GET /api/decisions` - Get all decisions
  - `GET /api/decisions/:id` - Get decision by ID
  - `POST /api/decisions` - Create decision
  - `PUT /api/decisions/:id` - Update decision
  - `DELETE /api/decisions/:id` - Delete decision
  - `GET /api/decisions/stats` - Get decisions statistics
- **Status:** ✅ Fully Connected

---

### 10. ~~**documents** Table~~ (DEPRECATED - TO BE REMOVED)
- **Status:** ⚠️ **UNUSED - Scheduled for deletion**
- **Action:** Run `cleanup-database.sql` to remove this table
- **Note:** Replaced by `user_documents` table
- **Current Usage:** Only 1 reference in `users.js` line 535 (already fixed to use `user_documents`)

---

### 11. **user_sessions** Table
- **Backend Routes:** Not directly exposed via API (internal use)
- **Frontend:** No direct connection (handled automatically by backend JWT)
- **Status:** ✅ Backend Internal Table (No frontend connection needed)
- **Purpose:** Session management for tracking user logins

---

### 12. **statistics** Table
- **Backend Routes:** Not directly exposed yet
- **Frontend:** No direct connection
- **Status:** ⚠️ **Table exists but not actively used**
- **Recommendation:** Consider implementing for analytics dashboard or remove if not needed

---

## 📊 Summary

### ✅ Fully Connected (9 tables):
1. users
2. terms
3. categories
4. comments
5. likes
6. proposed_modifications
7. reports
8. user_documents
9. decisions

### ⚠️ Internal/Backend Only (1 table):
10. user_sessions - No frontend connection needed

### ❌ To Be Removed (1 table):
11. documents - Replaced by user_documents

### ⚠️ Unused (1 table):
12. statistics - Created but not actively used

---

## 🔍 Verification Steps Completed

1. ✅ Checked all backend routes in `backend/routes/` directory
2. ✅ Verified all frontend API calls in `src/services/api.js`
3. ✅ Confirmed Redux slices for data management
4. ✅ Verified frontend pages using each API endpoint
5. ✅ Checked database schema in `init.sql` and migrations
6. ✅ Confirmed all foreign key relationships are respected

---

## 🚀 Action Items

### High Priority:
1. **Execute database cleanup script** to remove unused `documents` table:
   ```bash
   cd backend/database
   mysql -u root -p dicoaching < cleanup-database.sql
   ```

### Medium Priority:
2. **Decide on statistics table**: Either implement analytics or remove the table
   - If keeping: Create `/api/statistics` route and frontend dashboard
   - If removing: Add `DROP TABLE statistics;` to cleanup script

### Low Priority:
3. **Document optimization**: The cleanup script already adds indexes to `user_documents`
4. **Testing**: Verify all API endpoints work correctly after database cleanup

---

## 🎯 Conclusion

**All active database tables are properly connected to the frontend!** 

The only issues are:
- ⚠️ `documents` table needs to be removed (cleanup script ready)
- ⚠️ `statistics` table exists but is not used (decision needed)
- ✅ Everything else is fully functional and properly linked

---

## 📝 Frontend-Backend Connection Map

```
Frontend (React)           →   Backend API Route        →   Database Table
─────────────────────────────────────────────────────────────────────────────
AuthContext.jsx            →   /api/auth/*              →   users
usersSlice.js              →   /api/users/*             →   users
termsSlice.js              →   /api/terms/*             →   terms
categoriesSlice.js         →   /api/categories/*        →   categories
Fiche.jsx (Comments)       →   /api/comments/*          →   comments
Fiche.jsx (Likes)          →   /api/likes/*             →   likes
Modifications.jsx          →   /api/modifications/*     →   proposed_modifications
Reports.jsx                →   /api/reports/*           →   reports
MyProfile.jsx (Docs)       →   /api/documents/*         →   user_documents
Dashboard.jsx (Decisions)  →   /api/decisions/*         →   decisions
Dashboard.jsx (Stats)      →   /api/stats/*             →   Multiple tables
```

---

*Generated: October 14, 2025*
*Last Updated: After comprehensive database-frontend audit*
