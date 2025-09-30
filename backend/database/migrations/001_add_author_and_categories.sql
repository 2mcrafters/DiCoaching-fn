-- Migration 001: Ajouter author_id et restructurer les catégories
-- Date: 2025-09-29

-- 1. Créer la table categories
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    libelle VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Insérer la catégorie "Coaching" par défaut
INSERT INTO categories (libelle, description) VALUES 
('Coaching', 'Catégorie principale pour les termes de coaching');

-- 3. Ajouter la colonne author_id à la table termes
ALTER TABLE termes ADD COLUMN author_id INT DEFAULT 1;

-- 4. Ajouter la colonne categorie_id à la table termes
ALTER TABLE termes ADD COLUMN categorie_id INT DEFAULT 1;

-- 5. Mettre à jour tous les termes existants avec la catégorie "Coaching" (id=1)
UPDATE termes SET categorie_id = 1 WHERE categorie_id IS NULL OR categorie_id = 0;

-- 6. Ajouter les contraintes de clés étrangères
ALTER TABLE termes ADD CONSTRAINT fk_termes_author 
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE termes ADD CONSTRAINT fk_termes_categorie 
    FOREIGN KEY (categorie_id) REFERENCES categories(id) ON DELETE SET NULL;

-- 7. Optionnel: Supprimer l'ancienne colonne categorie (décommentez si vous voulez la supprimer)
-- ALTER TABLE termes DROP COLUMN categorie;

-- 8. Créer des index pour améliorer les performances
CREATE INDEX idx_termes_author_id ON termes(author_id);
CREATE INDEX idx_termes_categorie_id ON termes(categorie_id);
CREATE INDEX idx_termes_terme ON termes(terme);