-- Cleanup Script for DiCoaching Database
-- Date: October 14, 2025
-- Purpose: Remove unused tables and optimize database

-- ==============================================
-- STEP 1: Backup unused 'documents' table (if has data)
-- ==============================================

CREATE TABLE IF NOT EXISTS documents_backup AS 
SELECT * FROM documents;

-- ==============================================
-- STEP 2: Drop unused 'documents' table
-- ==============================================

DROP TABLE IF EXISTS documents;

-- ==============================================
-- STEP 3: Verify user_documents table exists and is properly structured
-- ==============================================

-- This is the table we actually use
SHOW CREATE TABLE user_documents;

-- ==============================================
-- STEP 4: Add indexes for better performance (if not already present)
-- ==============================================

-- Add index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_id ON user_documents(user_id);

-- Add index on uploaded_at for sorting
CREATE INDEX IF NOT EXISTS idx_uploaded_at ON user_documents(uploaded_at);

-- ==============================================
-- STEP 5: Clean up any orphaned documents (optional)
-- ==============================================

-- Find documents for users that no longer exist
SELECT ud.id, ud.user_id, ud.filename 
FROM user_documents ud
LEFT JOIN users u ON ud.user_id = u.id
WHERE u.id IS NULL;

-- If you want to delete orphaned documents, uncomment:
-- DELETE ud FROM user_documents ud
-- LEFT JOIN users u ON ud.user_id = u.id
-- WHERE u.id IS NULL;

-- ==============================================
-- STEP 6: Verify all tables are optimized
-- ==============================================

OPTIMIZE TABLE users;
OPTIMIZE TABLE user_documents;
OPTIMIZE TABLE termes;
OPTIMIZE TABLE categories;

-- ==============================================
-- Done! Database cleaned and optimized.
-- ==============================================
