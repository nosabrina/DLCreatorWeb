import 'dotenv/config';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { migrate, getDb, nowIso } from '../src/db/database.js';
import { getJwtSecret } from '../src/utils/config.js';
import { assertPasswordPolicy } from '../src/routes/auth.js';
import { normalizeRole, ROLES } from '../src/services/permissions-service.js';
import { writeAudit } from '../src/db/audit.js';

function args(){ const out={}; const a=process.argv.slice(2); for(let i=0;i<a.length;i++){ if(a[i].startsWith('--')){ const k=a[i].slice(2); const v=a[i+1]&&!a[i+1].startsWith('--')?a[++i]:true; out[k]=v; } } return out; }
const opt=args();
if(!opt.username || !opt.email){ console.error('Usage: npm run create-user -- --username jdupont --email j.dupont@sdis.local --role responsible [--display-name "Jean Dupont"] [--password "..."]'); process.exit(1); }
getJwtSecret();
migrate();
const role=normalizeRole(opt.role||'creator');
if(!ROLES.includes(role)){ console.error(`Rôle invalide. Rôles autorisés: ${ROLES.join(', ')}`); process.exit(1); }
const password=String(opt.password || crypto.randomBytes(18).toString('base64url') + 'Aa1');
assertPasswordPolicy(password);
const db=getDb();
const existing=db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(opt.username,opt.email);
if(existing){ console.error('Utilisateur déjà existant pour ce username ou cet e-mail.'); process.exit(2); }
const ts=nowIso(); const id=nanoid(); const hash=await bcrypt.hash(password,12);
db.prepare(`INSERT INTO users (id,username,email,display_name,password_hash,role,is_active,password_changed_at,created_at,updated_at) VALUES (@id,@username,@email,@displayName,@hash,@role,1,NULL,@ts,@ts)`).run({id,username:opt.username,email:opt.email,displayName:opt['display-name']||opt.username,hash,role,ts});
writeAudit({ userId:id, action:'user.create_script', entityType:'user', entityId:id, newValue:{ username:opt.username, email:opt.email, role } });
console.log(`Utilisateur créé: ${opt.username} (${opt.email}) — rôle: ${role}`);
if(!opt.password) console.log(`Mot de passe temporaire à transmettre une seule fois: ${password}`); else console.log('Mot de passe fourni par variable/argument. Aucun hash affiché.');
