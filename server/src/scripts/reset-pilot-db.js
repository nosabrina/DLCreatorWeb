import 'dotenv/config';
import fs from 'node:fs';
import { getDbPath } from '../utils/config.js';
const dbPath = getDbPath();
for (const p of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
  if (fs.existsSync(p)) fs.rmSync(p, { force:true });
}
console.log(`Base pilote supprimée: ${dbPath}`);
