-- Migration 009: Force user status to 'active' and remove other states
-- Date: 2025-10-16

-- Normalize existing values
UPDATE users SET status = 'active' WHERE status IS NULL OR status <> 'active';

-- Restrict column to only 'active' going forward
ALTER TABLE users MODIFY COLUMN status ENUM('active') NOT NULL DEFAULT 'active';

-- Optional: keep index (no-op if already exists)
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
