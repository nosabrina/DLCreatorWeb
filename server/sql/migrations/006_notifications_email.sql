PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS email_notifications (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  dl_id TEXT REFERENCES dl_documents(id) ON DELETE SET NULL,
  recipient_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  recipient_email TEXT,
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  body_html TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  dry_run INTEGER NOT NULL DEFAULT 1,
  error_message TEXT,
  sent_at TEXT,
  created_at TEXT NOT NULL,
  metadata_json TEXT
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, notification_type)
);

CREATE TABLE IF NOT EXISTS reminder_runs (
  id TEXT PRIMARY KEY,
  run_type TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  scanned_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_notifications_created ON email_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status, created_at);
CREATE INDEX IF NOT EXISTS idx_email_notifications_dl ON email_notifications(dl_id, created_at);
CREATE INDEX IF NOT EXISTS idx_email_notifications_recipient ON email_notifications(recipient_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_type ON notification_preferences(user_id, notification_type);
CREATE INDEX IF NOT EXISTS idx_reminder_runs_started ON reminder_runs(started_at);
