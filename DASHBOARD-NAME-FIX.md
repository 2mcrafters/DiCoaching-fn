# Dashboard Name Display Fix

## Issue
The dashboard sometimes didn't show the user's name after "Bonjour" for non-researcher users.

## Root Cause
In `Dashboard.jsx` line 1348-1349, the code was using:
```javascript
{isResearcher ? fullName : user.name}
```

This caused issues because:
- For researchers: Used `fullName` (which has proper fallbacks)
- For other users: Used `user.name` directly (which might not exist)

The `user.name` field is not always populated in the user object, especially when users are created with only `firstname` and `lastname` fields.

## Solution
Changed line 1348 to use `fullName` for ALL users:
```javascript
{fullName}
```

The `fullName` variable (defined on lines 217-225) has robust fallback logic:
1. Try `firstname + lastname` (trimmed)
2. If empty, try `user.name`
3. If empty, try `user.email`
4. If still empty, use `"Utilisateur"`

## Files Modified
- `src/pages/Dashboard.jsx` (line 1348)

## Testing
✅ Researchers will see their full name
✅ Authors will see their full name
✅ Users with only firstname/lastname will see both
✅ Users with only name field will see it
✅ Users with missing data will see their email
✅ As last resort, will show "Utilisateur"

## Result
The "Bonjour" greeting now always displays a name for every user type, regardless of which fields are populated in their user object.

---

*Fixed: October 14, 2025*
