import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
const SENSITIVE_KEYS = ['password','password_hash','token','accessToken','refreshToken','jwt','secret','smtp_password','SMTP_PASSWORD','authorization','cookie'];
const LEVELS = { error:0, warn:1, info:2, debug:3 };
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const LOG_DIR = process.env.LOG_DIR || './logs';
const isProd = process.env.NODE_ENV === 'production';
function shouldLog(level){ return (LEVELS[level] ?? 2) <= (LEVELS[LOG_LEVEL] ?? 2); }
function resolveLogDir(){ return path.isAbsolute(LOG_DIR) ? LOG_DIR : path.resolve(process.cwd(), LOG_DIR); }
function safeValue(value, depth = 0){
  if (depth > 5) return '[MaxDepth]';
  if (value instanceof Error) return { name:value.name, message:value.message, stack:isProd ? undefined : value.stack, status:value.status || value.statusCode };
  if (Array.isArray(value)) return value.map(v => safeValue(v, depth + 1));
  if (value && typeof value === 'object') { const out = {}; for (const [key,val] of Object.entries(value)) { const lower=key.toLowerCase(); out[key] = SENSITIVE_KEYS.some(s => lower.includes(s.toLowerCase())) ? '[MASKED]' : safeValue(val, depth + 1); } return out; }
  return value;
}
function write(entry){ const line=JSON.stringify(entry); if (!isProd) console[entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : 'log'](line); if (isProd) { const dir=resolveLogDir(); fs.mkdirSync(dir,{recursive:true}); fs.appendFileSync(path.join(dir,'dl-creator-web.log'), line+'\n','utf8'); } }
function log(level, message, meta = {}){ if (!shouldLog(level)) return; write({ ts:new Date().toISOString(), level, message, ...safeValue(meta) }); }
export function requestIdMiddleware(req, res, next){ req.requestId = req.headers['x-request-id'] || randomUUID(); res.setHeader('X-Request-Id', req.requestId); next(); }
export const logger = { info:(m,meta)=>log('info',m,meta), warn:(m,meta)=>log('warn',m,meta), error:(m,meta)=>log('error',m,meta), audit:(m,meta)=>log('info',m,{audit:true,...meta}), mask:safeValue };
