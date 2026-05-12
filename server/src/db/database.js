import fs from 'node:fs';
import path from 'node:path';
import { openSqliteDatabase } from './sqlite-adapter.js';
import { getDbPath, serverPaths } from '../utils/config.js';

let db;

export function getDb() {
  if (db) return db;
  const dbPath = getDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = openSqliteDatabase(dbPath);
  db.pragma('foreign_keys = ON');
  return db;
}

function quoteIdent(identifier) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) throw new Error(`Identifiant SQL invalide: ${identifier}`);
  return `"${identifier}"`;
}

export function columnExists(table, column) {
  const rows = getDb().prepare(`PRAGMA table_info(${quoteIdent(table)})`).all();
  return rows.some(c => c.name === column);
}

export function addColumnIfMissing(table, column, definition) {
  if (!columnExists(table, column)) getDb().exec(`ALTER TABLE ${quoteIdent(table)} ADD COLUMN ${quoteIdent(column)} ${definition}`);
}

function ensurePhaseColumns() {
  addColumnIfMissing('users', 'failed_login_count', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing('users', 'locked_until', 'TEXT');
  addColumnIfMissing('users', 'password_changed_at', 'TEXT');
  addColumnIfMissing('audit_log', 'severity', "TEXT NOT NULL DEFAULT 'info'");
  addColumnIfMissing('audit_log', 'request_id', 'TEXT');
  addColumnIfMissing('dl_documents', 'assigned_to_user_id', 'TEXT REFERENCES users(id)');
  addColumnIfMissing('dl_documents', 'validator_user_id', 'TEXT REFERENCES users(id)');
  addColumnIfMissing('dl_documents', 'version', 'INTEGER NOT NULL DEFAULT 1');
  addColumnIfMissing('dl_documents', 'published_at', 'TEXT');
  addColumnIfMissing('dl_documents', 'published_by_user_id', 'TEXT REFERENCES users(id)');
  addColumnIfMissing('dl_documents', 'library_visible', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing('dl_documents', 'library_summary', 'TEXT');
  addColumnIfMissing('dl_documents', 'library_keywords', 'TEXT');
  addColumnIfMissing('dl_documents', 'archived_at', 'TEXT');
  addColumnIfMissing('dl_documents', 'submitted_at', 'TEXT');
  addColumnIfMissing('dl_documents', 'validated_at', 'TEXT');
  addColumnIfMissing('dl_documents', 'rejected_at', 'TEXT');
  addColumnIfMissing('dl_documents', 'due_at', 'TEXT');
  addColumnIfMissing('dl_documents', 'assigned_at', 'TEXT');
  addColumnIfMissing('dl_documents', 'first_saved_at', 'TEXT');
}

function normalizeExistingRows() {
  getDb().prepare("UPDATE dl_documents SET status = 'draft' WHERE status = 'server_saved'").run();
  getDb().prepare('UPDATE dl_documents SET version = 1 WHERE version IS NULL OR version < 1').run();
  getDb().prepare("UPDATE dl_documents SET library_visible = 1 WHERE status = 'validated_library' AND (library_visible IS NULL OR library_visible = 0)").run();
  getDb().prepare("UPDATE dl_documents SET published_at = COALESCE(published_at, validated_at, updated_at) WHERE status = 'validated_library' AND published_at IS NULL").run();
  getDb().prepare("UPDATE dl_documents SET assigned_at = COALESCE(assigned_at, updated_at, created_at) WHERE status = 'assigned' AND assigned_at IS NULL").run();
  getDb().prepare("UPDATE dl_documents SET first_saved_at = COALESCE(first_saved_at, updated_at) WHERE status = 'in_progress' AND first_saved_at IS NULL").run();
}

export function migrate() {
  const schemaPath = path.join(serverPaths.serverRoot, 'sql', 'schema.sql');
  getDb().exec(fs.readFileSync(schemaPath, 'utf8'));
  ensurePhaseColumns();
  normalizeExistingRows();
}

export function nowIso() { return new Date().toISOString(); }
