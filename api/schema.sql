CREATE TABLE IF NOT EXISTS social_counts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  social VARCHAR(50) NOT NULL,
  amount DECIMAL(20, 0) NOT NULL,
  type VARCHAR(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_social_counts_social (social)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
