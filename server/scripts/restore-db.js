import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { getDbPath } from '../src/utils/config.js';
const backup=process.argv[2]; const force=process.argv.includes('--force');
if(!backup){ console.error('Usage: npm run restore -- <chemin-sauvegarde.sqlite> --force'); process.exit(1); }
const source=path.resolve(backup); if(!fs.existsSync(source)) throw new Error(`Sauvegarde introuvable: ${source}`);
if(!force){ console.error('Restauration refusée sans --force. Créez une sauvegarde de la base actuelle avant restauration.'); process.exit(1); }
const dbPath=getDbPath(); fs.mkdirSync(path.dirname(dbPath),{recursive:true});
if(fs.existsSync(dbPath)){ const safety=`${dbPath}.pre-restore-${new Date().toISOString().replace(/[:.]/g,'-')}`; fs.copyFileSync(dbPath,safety,fs.constants.COPYFILE_EXCL); console.log(`Copie de sécurité créée: ${safety}`); }
fs.copyFileSync(source,dbPath); console.log(`Base restaurée depuis: ${source}`);
