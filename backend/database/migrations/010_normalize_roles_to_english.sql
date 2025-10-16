-- Normalize legacy French roles to English and constrain enum
UPDATE users SET role = 'author' WHERE role = 'auteur';
UPDATE users SET role = 'researcher' WHERE role = 'chercheur';

-- Constrain enum to english-only set
ALTER TABLE users MODIFY COLUMN role ENUM('author','researcher','admin') NOT NULL DEFAULT 'researcher';

-- Optional: ensure all users are active (uncomment if desired)
-- UPDATE users SET status = 'active' WHERE status IS NULL OR status NOT IN ('active');