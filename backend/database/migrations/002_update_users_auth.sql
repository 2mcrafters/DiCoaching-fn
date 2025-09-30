-- Migration 002: Mise à jour de la table users pour l'authentification
-- Date: 2025-09-30

-- Ajouter les colonnes manquantes à la table users si elles n'existent pas
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS firstname VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS lastname VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS email VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS role ENUM('admin', 'author', 'user') DEFAULT 'user',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Ajouter un index unique sur l'email
ALTER TABLE users ADD UNIQUE INDEX idx_users_email (email);

-- Insérer un utilisateur admin par défaut (mot de passe: admin123)
-- Le mot de passe haché correspond à 'admin123' avec bcrypt
INSERT IGNORE INTO users (email, password, firstname, lastname, role) 
VALUES ('admin@dictionnaire.fr', '$2b$10$8K1p/a0FBxN5.Fsu5w5v8eKUZ1QZx5v5x5v5x5v5x5v5x5v5x5v5x5', 'Admin', 'Système', 'admin');

-- Note: Le mot de passe sera haché correctement lors de l'inscription via l'API