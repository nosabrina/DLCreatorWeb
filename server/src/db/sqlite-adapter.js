import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let warnedBuiltinSqlite = false;
function createBuiltinSqliteDatabase(dbPath, options = {}) {
  const { DatabaseSync } = require('node:sqlite');
  if (!warnedBuiltinSqlite) {
    warnedBuiltinSqlite = true;
    process.emitWarning('better-sqlite3 indisponible: utilisation du fallback node:sqlite pour validation runtime Node 22. En production Node 20 LTS, installer better-sqlite3 normalement.', { code:'DL_CREATOR_SQLITE_FALLBACK' });
  }
  const db = new DatabaseSync(dbPath, { readOnly:Boolean(options.readonly || options.readOnly) });
  return { exec:sql=>db.exec(sql), prepare:sql=>db.prepare(sql), pragma:(sql, opts={})=>{ const rows=db.prepare(`PRAGMA ${String(sql||'').trim()}`).all(); if(opts.simple){ const first=rows?.[0]; return first ? Object.values(first)[0] : undefined; } return rows; }, close:()=>db.close() };
}
export function openSqliteDatabase(dbPath, options = {}) {
  try { const BetterSqlite3 = require('better-sqlite3'); return new BetterSqlite3(dbPath, options); }
  catch (error) { try { return createBuiltinSqliteDatabase(dbPath, options); } catch (fallbackError) { fallbackError.message = `SQLite indisponible. Erreur better-sqlite3: ${error.message}. Erreur fallback node:sqlite: ${fallbackError.message}`; throw fallbackError; } }
}
