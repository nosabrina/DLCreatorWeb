import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '../..');
const isProd = process.env.NODE_ENV === 'production';
export function requiredEnv(name){ const value=process.env[name]; if(!value||!String(value).trim()) throw new Error(`Variable .env obligatoire manquante: ${name}`); return String(value).trim(); }
export function optionalEnv(name,fallback=''){ return String(process.env[name] ?? fallback).trim(); }
export function boolEnv(name,fallback=false){ const v=process.env[name]; if(v==null||v==='') return fallback; return ['1','true','yes','on'].includes(String(v).toLowerCase()); }
export function intEnv(name,fallback){ const n=Number(process.env[name]); return Number.isFinite(n)?n:fallback; }
export function getPort(){ return Number(process.env.SERVER_PORT || process.env.PORT || 3000); }
export function getJwtSecret(){ const secret=requiredEnv('JWT_SECRET'); if((isProd||secret.includes('change-me'))&&(secret.length<32||secret.includes('change-me'))) throw new Error('JWT_SECRET trop faible en production. Utiliser une valeur aléatoire d’au moins 32 caractères.'); return secret; }
export function getRefreshTokenDays(){ const raw=optionalEnv('REFRESH_TOKEN_EXPIRES_IN', optionalEnv('REFRESH_TOKEN_EXPIRES_DAYS','7d')); if(/^\d+d$/.test(raw)) return Number(raw.slice(0,-1)); const n=Number(raw); return Number.isFinite(n)?n:7; }
export function getDbPath(){ const raw=process.env.DATABASE_URL || './data/dl_creator.sqlite'; return path.isAbsolute(raw)?raw:path.resolve(serverRoot, raw.replace(/^\.\//,'')); }
export function getBackupDir(){ const raw=process.env.DATABASE_BACKUP_DIR || './backups'; return path.isAbsolute(raw)?raw:path.resolve(serverRoot, raw.replace(/^\.\//,'')); }
export function getCorsOrigin(){ const configured=optionalEnv('CORS_ORIGIN', optionalEnv('APP_ORIGIN','http://localhost:8080')); if(!isProd&&(!configured||configured==='*')) return true; return configured.split(',').map(s=>s.trim()).filter(Boolean); }
export const serverPaths = { serverRoot };
export const serverConfig = { isProd, trustProxy:boolEnv('TRUST_PROXY',false), rateLimitWindowMs:intEnv('RATE_LIMIT_WINDOW_MS',900000), rateLimitMax:intEnv('RATE_LIMIT_MAX',300), loginRateLimitMax:intEnv('LOGIN_RATE_LIMIT_MAX',5), jsonLimit:`${intEnv('UPLOAD_MAX_JSON_SIZE_MB',50)}mb`, passwordMinLength:intEnv('PASSWORD_MIN_LENGTH',12), auditRetentionDays:intEnv('AUDIT_RETENTION_DAYS',365) };
