-- Phase 5 — Dashboard Admin serveur / suivi opérationnel DL
-- Phase 8 : migration rendue idempotente.
-- Les colonnes due_at, assigned_at et first_saved_at sont garanties par database.js.

PRAGMA foreign_keys = ON;

CREATE INDEX IF NOT EXISTS idx_dl_due ON dl_documents(due_at);
CREATE INDEX IF NOT EXISTS idx_dl_assigned_at ON dl_documents(assigned_at);
CREATE INDEX IF NOT EXISTS idx_dl_first_saved_at ON dl_documents(first_saved_at);

UPDATE dl_documents
SET assigned_at = COALESCE(assigned_at, updated_at, created_at)
WHERE status = 'assigned' AND assigned_at IS NULL;

UPDATE dl_documents
SET first_saved_at = COALESCE(first_saved_at, updated_at)
WHERE status = 'in_progress' AND first_saved_at IS NULL;
