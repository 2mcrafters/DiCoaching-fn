-- Migration 003: Adaptation table users pour les étapes d'inscription et création table user_documents
-- Date: 2025-10-06

-- Modifier la table users pour inclure tous les champs des étapes d'inscription
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS name VARCHAR(255) AFTER lastname,
ADD COLUMN IF NOT EXISTS sex ENUM('homme', 'femme', 'autre') AFTER name,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) AFTER sex,
ADD COLUMN IF NOT EXISTS birth_date DATE AFTER phone,
ADD COLUMN IF NOT EXISTS professional_status VARCHAR(255) AFTER birth_date,
ADD COLUMN IF NOT EXISTS other_status VARCHAR(255) AFTER professional_status,
ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500) AFTER other_status,
ADD COLUMN IF NOT EXISTS presentation TEXT AFTER profile_picture,
ADD COLUMN IF NOT EXISTS biography TEXT AFTER presentation,
ADD COLUMN IF NOT EXISTS institution VARCHAR(255) AFTER biography,
ADD COLUMN IF NOT EXISTS specialization VARCHAR(255) AFTER institution,
ADD COLUMN IF NOT EXISTS socials JSON AFTER specialization,
ADD COLUMN IF NOT EXISTS status ENUM('pending', 'confirmed', 'rejected') DEFAULT 'pending' AFTER socials,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE AFTER status,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL AFTER email_verified;

-- Créer la table user_documents pour stocker les documents uploadés
CREATE TABLE IF NOT EXISTS user_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    purpose ENUM('cv', 'diploma', 'certificate', 'identity', 'other') DEFAULT 'other',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewer_id INT NULL,
    review_comment TEXT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_purpose (purpose)
);

-- Mettre à jour les rôles pour correspondre aux étapes
ALTER TABLE users MODIFY COLUMN role ENUM('user', 'author', 'researcher', 'admin', 'chercheur', 'auteur') DEFAULT 'user';

-- Créer la table reports pour les signalements
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    term_id INT NOT NULL,
    reporter_id INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    details TEXT NULL,
    status ENUM('pending', 'reviewed', 'ignored', 'resolved') DEFAULT 'pending',
    admin_comment TEXT NULL,
    reviewer_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_reports_status (status),
    INDEX idx_reports_term_id (term_id),
    INDEX idx_reports_reporter_id (reporter_id),
    INDEX idx_reports_created_at (created_at)
);

-- Créer la table proposed_modifications pour les modifications proposées
CREATE TABLE IF NOT EXISTS proposed_modifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    term_id INT NOT NULL,
    proposer_id INT NOT NULL,
    changes JSON NOT NULL,
    comment TEXT NULL,
    status ENUM('pending', 'approved', 'rejected', 'implemented') DEFAULT 'pending',
    admin_comment TEXT NULL,
    reviewer_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE,
    FOREIGN KEY (proposer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_modifications_status (status),
    INDEX idx_modifications_term_id (term_id),
    INDEX idx_modifications_proposer_id (proposer_id),
    INDEX idx_modifications_created_at (created_at)
);

-- Créer des index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_users_sex ON users(sex);
CREATE INDEX IF NOT EXISTS idx_users_professional_status ON users(professional_status);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_birth_date ON users(birth_date);

-- Ajouter une contrainte pour s'assurer que le téléphone est unique
ALTER TABLE users ADD UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique (phone);

-- Insérer un utilisateur de test avec les nouveaux champs
INSERT IGNORE INTO users (
    email, password, firstname, lastname, name, sex, phone, birth_date,
    professional_status, role, status, email_verified, created_at
) VALUES (
    'test.user@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewrBig/EWj6e2LPO',
    'Test',
    'User',
    'Test User',
    'homme',
    '0123456789',
    '1990-01-01',
    'Coach / Formateur',
    'author',
    'active',
    TRUE,
    NOW()
);

COMMIT;
