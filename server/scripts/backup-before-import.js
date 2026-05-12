import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import { getDbPath, getBackupDir } from '../src/utils/config.js';

const dbPath = getDbPath();
const backupDir = getBackupDir();
if (!fs.existsSync(dbPath)) {
  console.error(`Base SQLite introuvable: ${dbPath}`);
  process.exit(1);
}
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = path.join(backupDir, `before-import-${stamp}.sqlite`);
fs.copyFileSync(dbPath, target);
console.log(`Sauvegarde avant import créée: ${target}`);
