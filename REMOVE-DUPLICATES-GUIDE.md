# Remove Duplicate Terms - Guide

## Problem
The `termes` table in the database contains duplicate entries where the same term name appears multiple times.

## Solution

### Option 1: Using Node.js Script (RECOMMENDED)

Run the automated script:

```bash
cd backend
node remove-duplicate-terms.js
```

**What it does:**
1. Shows preview of all duplicates
2. Shows which entries will be deleted
3. Shows which entries will be kept (oldest with lowest ID)
4. Waits 3 seconds before deletion
5. Deletes duplicates
6. Verifies the operation

**Rules:**
- Keeps the entry with the **lowest ID** (oldest entry)
- Deletes all newer duplicates

---

### Option 2: Manual SQL Query

If you prefer to run SQL manually:

#### Step 1: Preview what will be deleted
```sql
SELECT 
    t1.id as keep_id,
    t2.id as delete_id,
    t1.terme,
    t1.createdAt as keep_date,
    t2.createdAt as delete_date
FROM termes t1
INNER JOIN termes t2 
    ON t1.terme = t2.terme 
    AND t1.id < t2.id
ORDER BY t1.terme;
```

#### Step 2: Delete duplicates
```sql
DELETE t2 
FROM termes t1
INNER JOIN termes t2 
    ON t1.terme = t2.terme 
    AND t1.id < t2.id;
```

#### Step 3: Verify no duplicates remain
```sql
SELECT terme, COUNT(*) as count 
FROM termes 
GROUP BY terme 
HAVING count > 1;
```
Should return **0 rows** if successful.

---

## Understanding the Query

### How it works:
```sql
DELETE t2 
FROM termes t1
INNER JOIN termes t2 
    ON t1.terme = t2.terme    -- Match rows with same term name
    AND t1.id < t2.id         -- Keep the one with lower ID (older)
```

### Example:
If you have:
- ID: 1, terme: "ABRÉACTION", created: 2025-01-01
- ID: 5, terme: "ABRÉACTION", created: 2025-01-15

The query will:
- **KEEP** ID 1 (lower ID)
- **DELETE** ID 5 (higher ID)

---

## Prevention: Add UNIQUE Constraint (Optional)

To prevent future duplicates, add a unique constraint:

```sql
ALTER TABLE termes ADD UNIQUE KEY unique_terme (terme);
```

**Warning:** Only run this AFTER removing all duplicates.

---

## Safety Notes

### ⚠️ IMPORTANT - Backup First!

Before running the deletion script, create a backup:

```sql
-- Export the termes table
mysqldump -u root dict_coaching termes > termes_backup.sql

-- Or create a copy table
CREATE TABLE termes_backup AS SELECT * FROM termes;
```

### Restore from backup if needed:
```sql
-- Drop the current table
DROP TABLE termes;

-- Import from backup
mysql -u root dict_coaching < termes_backup.sql

-- Or restore from copy table
INSERT INTO termes SELECT * FROM termes_backup;
```

---

## Testing

### Count duplicates before:
```sql
SELECT COUNT(*) FROM (
    SELECT terme 
    FROM termes 
    GROUP BY terme 
    HAVING COUNT(*) > 1
) as duplicates;
```

### Count total terms before:
```sql
SELECT COUNT(*) FROM termes;
```

### After deletion, verify:
```sql
-- Should be 0
SELECT COUNT(*) FROM (
    SELECT terme 
    FROM termes 
    GROUP BY terme 
    HAVING COUNT(*) > 1
) as duplicates;

-- Check total terms
SELECT COUNT(*) FROM termes;
```

---

## Files Created

1. **remove-duplicate-terms.js** - Automated Node.js script with preview and safety checks
2. **remove-duplicates.sql** - SQL queries for manual execution
3. **REMOVE-DUPLICATES-GUIDE.md** - This documentation file

---

## Expected Results

Based on your screenshot showing ~25+ duplicate terms with count=2:
- **Before:** ~50+ duplicate entries
- **After:** ~25+ unique terms
- **Deleted:** ~25+ duplicate entries

---

## Troubleshooting

### Error: "Table has foreign keys"
If deletion fails due to foreign key constraints:

```sql
-- Temporarily disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Run the delete query
DELETE t2 
FROM termes t1
INNER JOIN termes t2 
    ON t1.terme = t2.terme 
    AND t1.id < t2.id;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
```

### Error: "Duplicate key constraint"
If the term has related records (likes, comments, etc.), you may need to:
1. Update related records to point to the kept ID
2. Or use CASCADE delete in foreign key definitions

---

## Next Steps

1. **Backup your database** (critical!)
2. Run `node remove-duplicate-terms.js` to see preview
3. Review the preview output
4. Wait for automatic deletion after 3 seconds
5. Verify results
6. (Optional) Add UNIQUE constraint to prevent future duplicates

---

Last updated: October 14, 2025
