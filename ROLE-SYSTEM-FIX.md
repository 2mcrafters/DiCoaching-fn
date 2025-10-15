# 🔐 ROLE SYSTEM STANDARDIZATION - COMPLETE FIX

## 📋 Current Issues Found

### Multiple Role Names
- ❌ "auteur" (French) vs "author" (English)
- ❌ "chercheur" vs "researcher"  
- ❌ "user" role exists in some places
- ❌ Inconsistent role checking logic

### Permission Logic Issues
- ⚠️ Admin doesn't get author badge
- ⚠️ Author can accept their own modification proposals
- ⚠️ Chercheur role sometimes called "researcher"

---

## ✅ STANDARDIZED ROLE SYSTEM

### 3 Roles Only:
1. **chercheur** - Researcher/User role
2. **author** - Author/Contributor role  
3. **admin** - Administrator role

---

## 🎯 PERMISSIONS MATRIX

| Permission | chercheur | author | admin |
|------------|-----------|--------|-------|
| **View terms** | ✅ | ✅ | ✅ |
| **Like terms** | ✅ | ✅ | ✅ |
| **Comment** | ✅ | ✅ | ✅ |
| **Signal/Report** | ✅ | ✅ | ✅ |
| **Propose modification** | ✅ | ✅ | ✅ |
| **Create new term** | ❌ | ✅ (if status=active/confirmed) | ✅ |
| **Edit own term** | ❌ | ✅ | ✅ |
| **Edit any term** | ❌ | ❌ | ✅ |
| **Validate modification (own term)** | ❌ | ✅ (NOT own modification) | ✅ |
| **Validate modification (any term)** | ❌ | ❌ | ✅ |
| **Delete comments (own)** | ✅ | ✅ | ✅ |
| **Delete comments (any)** | ❌ | ❌ | ✅ |
| **Access admin panel** | ❌ | ❌ | ✅ |
| **Has author badge** | ❌ | ✅ | ✅ (admin gets badge too) |

---

## 🛠️ FILES TO FIX

### Frontend Files:
1. ✅ `src/contexts/AuthContext.jsx` - Remove "auteur" normalization
2. ✅ `src/pages/Fiche.jsx` - Standardize role checks
3. ✅ `src/components/fiche/FicheComments.jsx` - Fix permission logic
4. ✅ `src/components/Navbar.jsx` - Update role checks
5. ✅ `src/pages/Dashboard.jsx` - Fix role display
6. ✅ `src/pages/Submit.jsx` - Update author permissions
7. ✅ `src/components/admin/UsersManagement.jsx` - Remove "user" role
8. ✅ `src/lib/constants.js` - Update ROLES constant
9. ✅ `src/pages/AuthorProfile.jsx` - Fix role display
10. ✅ `src/components/dashboard/UserTermsList.jsx` - Fix role checks
11. ✅ `src/pages/Modifications.jsx` - Add logic to prevent accepting own modifications

### Backend Files:
12. ✅ `backend/routes/auth.js` - Standardize registration roles
13. ✅ `backend/routes/comments.js` - Fix role permission checks
14. ✅ `backend/routes/terms.js` - Update modification validation logic
15. ✅ `backend/routes/users.js` - Fix role checks
16. ✅ `backend/routes/decisions.js` - Remove "researcher", use "chercheur"

---

## 📝 KEY CHANGES

### 1. Role Normalization in AuthContext
```javascript
// REMOVE THIS:
role: (userData?.role || "").toLowerCase() === "auteur" ? "author" : userData?.role

// USE THIS:
role: userData?.role // Keep as-is from backend
```

### 2. hasAuthorPermissions Logic
```javascript
const hasAuthorPermissions = () => {
  if (!user) return false;
  
  // Admins have ALL permissions including author permissions
  if (user.role === "admin") return true;
  
  // Authors need confirmed status
  const isAuthorRole = user.role === "author";
  const isConfirmed = user.status === "confirmed" || user.status === "active";
  
  return isAuthorRole && isConfirmed;
};
```

### 3. Badge Logic for Admin
```javascript
// Admin should ALSO get author badge based on term count
const canGetAuthorBadge = user && (user.role === "author" || user.role === "admin");
```

### 4. Modification Validation Logic
```javascript
// Author CAN validate modifications on their terms
// BUT NOT their own modification proposals
const canValidate = 
  user.role === "admin" || 
  (user.role === "author" && 
   term.authorId === user.id && 
   modification.authorId !== user.id); // NOT their own modification
```

---

## 🔒 Security Rules

### Backend Validation:
1. **All endpoints** - Check role from JWT token
2. **Terms endpoints** - Admin can edit any, Author only own
3. **Modifications** - Admin validates any, Author validates own terms (except own modifications)
4. **Comments** - Admin deletes any, users delete own
5. **Reports** - All logged-in users can report

---

## ✨ Implementation Order

1. Update `lib/constants.js` - Define ROLES
2. Update `AuthContext.jsx` - Remove normalization
3. Update `Fiche.jsx` - Fix permissions
4. Update `FicheComments.jsx` - Fix delete logic
5. Update `Modifications.jsx` - Add validation logic
6. Update all admin components - Remove "user" role option
7. Update backend routes - Standardize checks
8. Test all scenarios

---

## 🧪 Testing Checklist

### As chercheur:
- [ ] Can view all terms
- [ ] Can like, comment, report
- [ ] Can propose modifications
- [ ] Cannot create terms
- [ ] Cannot edit any terms
- [ ] Cannot validate modifications
- [ ] Cannot access admin panel

### As author (confirmed):
- [ ] Can create new terms
- [ ] Can edit own terms only
- [ ] Cannot edit other's terms
- [ ] Can validate modifications on own terms
- [ ] Cannot validate own modification proposals
- [ ] Gets author badge
- [ ] Cannot access admin panel

### As admin:
- [ ] Can do EVERYTHING author can do
- [ ] Can edit ANY term
- [ ] Can validate ANY modification
- [ ] Gets author badge based on term count
- [ ] Can access admin panel
- [ ] Can manage all users

---

**Status**: Ready to implement
**Created**: October 15, 2025
