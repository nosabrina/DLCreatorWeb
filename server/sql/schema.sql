PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'creator',
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT,
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  password_changed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dl_documents (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  assigned_to_user_id TEXT REFERENCES users(id),
  validator_user_id TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  domain TEXT,
  theme TEXT,
  subtheme TEXT,
  public_target TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  json_data TEXT NOT NULL,
  published_at TEXT,
  published_by_user_id TEXT REFERENCES users(id),
  library_visible INTEGER NOT NULL DEFAULT 0,
  library_summary TEXT,
  library_keywords TEXT,
  archived_at TEXT,
  submitted_at TEXT,
  validated_at TEXT,
  rejected_at TEXT,
  due_at TEXT,
  assigned_at TEXT,
  first_saved_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS dl_status_history (
  id TEXT PRIMARY KEY,
  dl_id TEXT NOT NULL REFERENCES dl_documents(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  comment TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dl_comments (
  id TEXT PRIMARY KEY,
  dl_id TEXT NOT NULL REFERENCES dl_documents(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  comment_type TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dl_versions (
  id TEXT PRIMARY KEY,
  dl_id TEXT NOT NULL REFERENCES dl_documents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  json_data TEXT NOT NULL,
  created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  change_reason TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS login_events (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  success INTEGER NOT NULL DEFAULT 0,
  failure_reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  request_id TEXT,
  created_at TEXT NOT NULL
);

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

CREATE INDEX IF NOT EXISTS idx_dl_owner ON dl_documents(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_dl_assigned ON dl_documents(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_dl_status ON dl_documents(status);
CREATE INDEX IF NOT EXISTS idx_dl_deleted ON dl_documents(deleted_at);
CREATE INDEX IF NOT EXISTS idx_dl_due ON dl_documents(due_at);
CREATE INDEX IF NOT EXISTS idx_dl_assigned_at ON dl_documents(assigned_at);
CREATE INDEX IF NOT EXISTS idx_dl_first_saved_at ON dl_documents(first_saved_at);
CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_dl_status_history_dl ON dl_status_history(dl_id, created_at);
CREATE INDEX IF NOT EXISTS idx_dl_comments_dl ON dl_comments(dl_id, created_at);
CREATE INDEX IF NOT EXISTS idx_dl_versions_dl ON dl_versions(dl_id, version);

CREATE INDEX IF NOT EXISTS idx_dl_library ON dl_documents(status, library_visible, archived_at, published_at);
CREATE INDEX IF NOT EXISTS idx_user_library_views_user_dl ON user_library_views(user_id, dl_id);
CREATE INDEX IF NOT EXISTS idx_library_events_dl ON library_events(dl_id, created_at);
CREATE INDEX IF NOT EXISTS idx_library_events_user ON library_events(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_email_notifications_created ON email_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status, created_at);
CREATE INDEX IF NOT EXISTS idx_email_notifications_dl ON email_notifications(dl_id, created_at);
CREATE INDEX IF NOT EXISTS idx_email_notifications_recipient ON email_notifications(recipient_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_type ON notification_preferences(user_id, notification_type);
CREATE INDEX IF NOT EXISTS idx_reminder_runs_started ON reminder_runs(started_at);

CREATE INDEX IF NOT EXISTS idx_login_events_username ON login_events(username, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON audit_log(severity, created_at);
