-- Script d'initialisation de la base de données pour le dictionnaire

-- Création de la base de données
CREATE DATABASE IF NOT EXISTS dicoaching CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dicoaching;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    role ENUM('user', 'author', 'researcher', 'admin') DEFAULT 'user',
    status ENUM('pending', 'active', 'suspended') DEFAULT 'pending',
    bio TEXT,
    institution VARCHAR(255),
    specialization VARCHAR(255),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Table des termes du dictionnaire
CREATE TABLE IF NOT EXISTS terms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    term VARCHAR(255) NOT NULL,
    definition TEXT NOT NULL,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    etymology TEXT,
    pronunciation VARCHAR(255),
    examples TEXT,
    synonyms TEXT,
    antonyms TEXT,
    related_terms TEXT,
    status ENUM('draft', 'pending', 'approved', 'rejected') DEFAULT 'draft',
    author_id INT NOT NULL,
    reviewer_id INT NULL,
    views_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_term (term),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_author (author_id)
);

-- Table des commentaires
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    term_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    parent_id INT NULL,
    status ENUM('active', 'hidden', 'deleted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_term_id (term_id),
    INDEX idx_user_id (user_id)
);

-- Table des modifications proposées
CREATE TABLE IF NOT EXISTS proposed_modifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    term_id INT NOT NULL,
    user_id INT NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    current_value TEXT,
    proposed_value TEXT NOT NULL,
    justification TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    reviewer_id INT NULL,
    review_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_term_id (term_id),
    INDEX idx_status (status)
);

-- Table des documents attachés
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    purpose ENUM('profile', 'verification', 'research', 'other') DEFAULT 'other',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des rapports/signalements
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id INT NOT NULL,
    reported_type ENUM('term', 'comment', 'user') NOT NULL,
    reported_id INT NOT NULL,
    reason ENUM('inappropriate', 'spam', 'copyright', 'inaccurate', 'other') NOT NULL,
    description TEXT,
    status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
    admin_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_reported_type (reported_type)
);

-- Table des likes/favoris
CREATE TABLE IF NOT EXISTS likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    term_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_term (user_id, term_id)
);

-- Table des sessions utilisateur
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- Table des statistiques
CREATE TABLE IF NOT EXISTS statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value INT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_metric_date (metric_name, date)
);

-- Insertion d'un utilisateur admin par défaut
INSERT INTO users (email, password, firstname, lastname, role, status, email_verified) 
VALUES ('admin@dictionnaire.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewrBig/EWj6e2LPO', 'Admin', 'System', 'admin', 'active', TRUE)
ON DUPLICATE KEY UPDATE id=id;

-- Création des index pour optimiser les performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_terms_search ON terms(term, definition(100));
CREATE FULLTEXT INDEX idx_terms_fulltext ON terms(term, definition, examples);

-- Insertion de quelques catégories de base
INSERT IGNORE INTO terms (term, definition, category, author_id, status) VALUES
('Linguistique', 'Science qui étudie le langage et les langues', 'Sciences', 1, 'approved'),
('Phonétique', 'Étude des sons du langage', 'Linguistique', 1, 'approved'),
('Morphologie', 'Étude de la structure interne des mots', 'Linguistique', 1, 'approved'),
('Syntaxe', 'Étude de la combinaison des mots en phrases', 'Linguistique', 1, 'approved');

COMMIT;