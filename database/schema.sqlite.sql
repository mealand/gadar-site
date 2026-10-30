-- SQLite version of schema.sql, used automatically for local testing only.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL, event_date TEXT NULL, location TEXT NOT NULL, guests TEXT NOT NULL,
  budget TEXT NULL, services TEXT NULL, notes TEXT NULL, name TEXT NOT NULL, phone TEXT NOT NULL,
  email TEXT NOT NULL, preferred_time TEXT NOT NULL, whatsapp_ok INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new', admin_note TEXT NULL, ip_hash TEXT NULL,
  created_at TEXT NOT NULL, updated_at TEXT NULL
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NULL, subject TEXT NULL, message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS experiences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, email TEXT NOT NULL, role TEXT NOT NULL, event_name TEXT NOT NULL, story TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', moderator_note TEXT NULL, ip_hash TEXT NULL,
  created_at TEXT NOT NULL, reviewed_at TEXT NULL, reviewed_by TEXT NULL
);
CREATE TABLE IF NOT EXISTS experience_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experience_id INTEGER NOT NULL REFERENCES experiences (id) ON DELETE CASCADE,
  type TEXT NOT NULL, path TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL, last_login TEXT NULL
);
CREATE TABLE IF NOT EXISTS rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_hash TEXT NOT NULL, action TEXT NOT NULL, created_at TEXT NOT NULL
);
