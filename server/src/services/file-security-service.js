import path from 'node:path';
const DEFAULT_ALLOWED_MIME = new Set(['application/json','application/pdf','image/jpeg','image/png','image/webp','text/plain','text/csv']);
const DANGEROUS_EXTENSIONS = new Set(['.exe','.bat','.cmd','.com','.sh','.ps1','.js','.mjs','.vbs','.scr','.jar','.php','.asp','.aspx']);
function maxMb(){ return Number(process.env.UPLOAD_MAX_FILE_SIZE_MB || 25); }
export function sanitizeFileName(name){ const base=path.basename(String(name||'fichier')).normalize('NFKD').replace(/[\u0300-\u036f]/g,''); const clean=base.replace(/[^A-Za-z0-9._-]+/g,'_').replace(/_+/g,'_').slice(0,160)||'fichier'; const ext=path.extname(clean).toLowerCase(); if (DANGEROUS_EXTENSIONS.has(ext)) throw Object.assign(new Error('Extension de fichier interdite'),{status:415}); return clean; }
export function isAllowedMimeType(type){ return DEFAULT_ALLOWED_MIME.has(String(type||'').toLowerCase()); }
export function assertFileSize(size){ const max=maxMb()*1024*1024; if (!Number.isFinite(Number(size))||Number(size)<0) throw Object.assign(new Error('Taille fichier invalide'),{status:400}); if (Number(size)>max) throw Object.assign(new Error(`Fichier trop volumineux (max ${maxMb()} MB)`),{status:413}); return true; }
export function getSafeUploadPath(rootDir, dlId, fileName){ const safeDlId=String(dlId||'').replace(/[^A-Za-z0-9_-]/g,''); if (!safeDlId) throw Object.assign(new Error('Identifiant DL invalide'),{status:400}); return path.join(rootDir,safeDlId,sanitizeFileName(fileName)); }
