-- Gadar Events database (MySQL / MariaDB).
-- Import once in cPanel > phpMyAdmin > your database > Import.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS bookings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(80) NOT NULL,
  event_date DATE NULL,
  location VARCHAR(160) NOT NULL,
  guests VARCHAR(40) NOT NULL,
  budget VARCHAR(80) NULL,
  services VARCHAR(255) NULL,
  notes TEXT NULL,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  email VARCHAR(160) NOT NULL,
  preferred_time VARCHAR(60) NOT NULL,
  whatsapp_ok TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  admin_note TEXT NULL,
  ip_hash CHAR(64) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  INDEX idx_bookings_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(40) NULL,
  subject VARCHAR(160) NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS experiences (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  role VARCHAR(20) NOT NULL,
  event_name VARCHAR(160) NOT NULL,
  story TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  moderator_note TEXT NULL,
  ip_hash CHAR(64) NULL,
  created_at DATETIME NOT NULL,
  reviewed_at DATETIME NULL,
  reviewed_by VARCHAR(60) NULL,
  INDEX idx_experiences_status (status, reviewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS experience_media (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  experience_id INT UNSIGNED NOT NULL,
  type VARCHAR(10) NOT NULL,
  path VARCHAR(255) NOT NULL,
  mime VARCHAR(60) NOT NULL,
  size INT UNSIGNED NOT NULL,
  sort SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  INDEX idx_media_experience (experience_id),
  CONSTRAINT fk_media_experience FOREIGN KEY (experience_id) REFERENCES experiences (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admins (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(60) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL,
  last_login DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rate_limits (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ip_hash CHAR(64) NOT NULL,
  action VARCHAR(40) NOT NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_rate (ip_hash, action, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
