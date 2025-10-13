-- Create decisions table for tracking term decisions/reviews
CREATE TABLE IF NOT EXISTS decisions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  term_id INT NOT NULL,
  user_id INT NOT NULL,
  decision_type ENUM('approved', 'rejected', 'pending', 'revision_requested') NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (term_id) REFERENCES termes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_term_id (term_id),
  INDEX idx_user_id (user_id),
  INDEX idx_decision_type (decision_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
