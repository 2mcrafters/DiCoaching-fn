-- Migration: Ensure socials column exists in users table
-- Date: 2025-01-15
-- Description: Adds socials (JSON) column to users table if not exists

USE dicoaching;

-- Add socials column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS socials LONGTEXT AFTER specialization;

-- Add comment to document the column
ALTER TABLE users MODIFY COLUMN socials LONGTEXT COMMENT 'JSON array of social media links: [{"platform":"LinkedIn","url":"https://..."}]';

-- Create index for better performance when querying users with socials
CREATE INDEX IF NOT EXISTS idx_users_socials ON users((CAST(socials AS CHAR(255))));

-- Sample data structure for socials:
-- [
--   {"platform": "LinkedIn", "url": "https://linkedin.com/in/username"},
--   {"platform": "Twitter", "url": "https://twitter.com/username"},
--   {"platform": "Facebook", "url": "https://facebook.com/username"},
--   {"platform": "Instagram", "url": "https://instagram.com/username"}
-- ]

-- Verify the column exists
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dicoaching'
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'socials';
