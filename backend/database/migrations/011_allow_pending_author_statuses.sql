-- Migration 011: Allow pending/review statuses for authors
-- Date: 2025-10-16

-- Widen users.status enum to support admin review workflow
ALTER TABLE users 
  MODIFY COLUMN status ENUM('active','pending','requested','en_attente','to_validate','rejected','confirmed') 
  NOT NULL DEFAULT 'active';

-- Optional indexes
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
