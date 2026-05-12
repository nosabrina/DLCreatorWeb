import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { getDbPath, getBackupDir, intEnv } from '../src/utils/config.js';
const dbPath=getDbPath(); const backupDir=getBackupDir();
if(!fs.existsSync(dbPath)) throw new Error(`Base SQLite introuvable: ${dbPath}`);
fs.mkdirSync(backupDir,{recursive:true});
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const target=path.join(backupDir,`dl_creator_${stamp}.sqlite`);
fs.copyFileSync(dbPath,target,fs.constants.COPYFILE_EXCL);
const retentionDays=intEnv('DATABASE_BACKUP_RETENTION_DAYS',30);
if(retentionDays>0){ const cutoff=Date.now()-retentionDays*86400000; for(const file of fs.readdirSync(backupDir)){ if(!/^dl_creator_.*\.sqlite$/.test(file)) continue; const full=path.join(backupDir,file); if(fs.statSync(full).mtimeMs<cutoff) fs.unlinkSync(full); } }
console.log(`Sauvegarde créée: ${target}`);
