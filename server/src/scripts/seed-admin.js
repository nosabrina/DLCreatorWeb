import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { migrate, getDb, nowIso } from '../db/database.js';
import { requiredEnv, getJwtSecret } from '../utils/config.js';
import { assertPasswordPolicy } from '../routes/auth.js';
import { writeAudit } from '../db/audit.js';

getJwtSecret();
migrate();
const username = requiredEnv('ADMIN_USERNAME');
const email = requiredEnv('ADMIN_EMAIL');
const password = requiredEnv('ADMIN_PASSWORD');
const displayName = process.env.ADMIN_DISPLAY_NAME || 'Administrateur DL Creator';
if (password.includes('ChangerCeMotDePasse')) {
  throw new Error('ADMIN_PASSWORD doit être remplacé par une valeur institutionnelle forte.');
}
assertPasswordPolicy(password);
const db = getDb();
const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
if (existing) {
  console.log('Admin initial déjà présent. Aucun mot de passe affiché.');
  process.exit(0);
}
const id = nanoid();
const hash = await bcrypt.hash(password, 12);
const ts = nowIso();
db.prepare(`INSERT INTO users (id,username,email,display_name,password_hash,role,is_active,created_at,updated_at) VALUES (?,?,?,?,?,'admin',1,?,?)`)
  .run(id, username, email, displayName, hash, ts, ts);
writeAudit({ userId:id, action:'user.seed_admin', entityType:'user', entityId:id, newValue:{ username, email, role:'admin' } });
console.log(`Admin initial créé: ${username} (${email}). Mot de passe non affiché.`);
