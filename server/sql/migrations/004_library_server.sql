-- Phase 4 — Bibliothèque DL serveur
-- Phase 8 : migration rendue idempotente.
-- SQLite ne supporte pas ALTER TABLE ADD COLUMN IF NOT EXISTS sur toutes les versions.
-- Les colonnes sont donc garanties par server/src/db/database.js via addColumnIfMissing().
-- Ce fichier peut être relu sans casser une base existante : il ne contient plus d'ALTER destructeur.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user_library_views (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dl_id TEXT NOT NULL REFERENCES dl_documents(id) ON DELETE CASCADE,
  first_viewed_at TEXT NOT NULL,
  last_viewed_at TEXT NOT NULL,
  UNIQUE(user_id, dl_id)
);

CREATE TABLE IF NOT EXISTS library_events (
  id TEXT PRIMARY KEY,
  dl_id TEXT REFERENCES dl_documents(id) ON DELETE SET NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata_json TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dl_library ON dl_documents(status, library_visible, archived_at, published_at);
CREATE INDEX IF NOT EXISTS idx_user_library_views_user_dl ON user_library_views(user_id, dl_id);
CREATE INDEX IF NOT EXISTS idx_library_events_dl ON library_events(dl_id, created_at);
CREATE INDEX IF NOT EXISTS idx_library_events_user ON library_events(user_id, created_at);

UPDATE dl_documents
SET library_visible = 1,
    published_at = COALESCE(published_at, validated_at, updated_at)
WHERE status = 'validated_library';
