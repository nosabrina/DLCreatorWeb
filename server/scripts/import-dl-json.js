import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import { nanoid } from 'nanoid';
import { migrate, getDb, nowIso } from '../src/db/database.js';
import { getJwtSecret } from '../src/utils/config.js';
import { writeAudit } from '../src/db/audit.js';

function args(){ const out={}; const a=process.argv.slice(2); for(let i=0;i<a.length;i++){ if(a[i].startsWith('--')){ const k=a[i].slice(2); const v=a[i+1]&&!a[i+1].startsWith('--')?a[++i]:true; out[k]=v; } } return out; }
function readJson(file){ const raw=fs.readFileSync(file,'utf8'); return JSON.parse(raw); }
function pick(dl, keys, fallback=''){ for(const k of keys){ const v=k.split('.').reduce((o,p)=>o?.[p],dl); if(v!=null && String(v).trim()) return String(v).trim(); } return fallback; }
function minimalValidate(dl){ if(!dl || typeof dl!=='object' || Array.isArray(dl)) throw new Error('JSON racine invalide'); const title=pick(dl,['identification.theme','theme','titre','title','referenceDL'],'DL importée'); return { title:title.slice(0,250), domain:pick(dl,['identification.domaine','domaine','domain'],null), theme:pick(dl,['identification.theme','theme'],title), subtheme:pick(dl,['identification.sousTheme','sousTheme','subtheme'],null), publicTarget:pick(dl,['identification.publicCible','publicCible','publicTarget'],null), reference:pick(dl,['referenceDL','reference','id'],null) }; }
function collectFiles(opt){ if(opt.file) return [path.resolve(opt.file)]; if(opt.dir) return fs.readdirSync(opt.dir).filter(f=>f.toLowerCase().endsWith('.json')).map(f=>path.resolve(opt.dir,f)); throw new Error('Utiliser --file <fichier.json> ou --dir <dossier>'); }
const opt=args();
if(!opt.owner){ console.error('Usage: npm run import-dl-json -- --file ../exports/dl.json --owner admin [--status draft|in_progress] [--overwrite]'); process.exit(1); }
const status=String(opt.status||'draft');
if(!['draft','in_progress'].includes(status)){ console.error('Statut autorisé: draft ou in_progress'); process.exit(1); }
getJwtSecret(); migrate();
const db=getDb();
const owner=db.prepare('SELECT id, username, email FROM users WHERE (username = ? OR email = ?) AND is_active = 1').get(opt.owner,opt.owner);
if(!owner){ console.error(`Propriétaire introuvable ou inactif: ${opt.owner}`); process.exit(1); }
const files=collectFiles(opt); const report=[]; const ts0=nowIso();
for(const file of files){
  try{
    const dl=readJson(file); const meta=minimalValidate(dl); const jsonText=JSON.stringify(dl);
    const importKey=meta.reference || path.basename(file);
    const existing=db.prepare(`SELECT id,title FROM dl_documents WHERE owner_user_id=? AND deleted_at IS NULL AND title = ?`).get(owner.id, meta.title);
    if(existing && !opt.overwrite){ report.push({file,status:'skipped',reason:'existing',existingId:existing.id,title:existing.title}); continue; }
    const ts=nowIso(); const id=existing?.id || nanoid();
    if(existing){
      db.prepare(`UPDATE dl_documents SET title=@title,domain=@domain,theme=@theme,subtheme=@subtheme,public_target=@publicTarget,status=@status,version=version+1,json_data=@jsonData,updated_at=@ts WHERE id=@id`).run({id,title:meta.title,domain:meta.domain,theme:meta.theme,subtheme:meta.subtheme,publicTarget:meta.publicTarget,status,jsonData:jsonText,ts});
    }else{
      db.prepare(`INSERT INTO dl_documents (id,owner_user_id,title,domain,theme,subtheme,public_target,status,version,json_data,first_saved_at,created_at,updated_at) VALUES (@id,@owner,@title,@domain,@theme,@subtheme,@publicTarget,@status,1,@jsonData,@firstSavedAt,@ts,@ts)`).run({id,owner:owner.id,title:meta.title,domain:meta.domain,theme:meta.theme,subtheme:meta.subtheme,publicTarget:meta.publicTarget,status,jsonData:jsonText,firstSavedAt:status==='in_progress'?ts:null,ts});
    }
    db.prepare(`INSERT INTO dl_versions (id,dl_id,version,json_data,created_by_user_id,change_reason,created_at) VALUES (@vid,@id,(SELECT version FROM dl_documents WHERE id=@id),@jsonData,@owner,'Import Phase 10 JSON réel',@ts)`).run({vid:nanoid(),id,jsonData:jsonText,owner:owner.id,ts});
    writeAudit({ userId:owner.id, action:existing?'dl.import_json.overwrite':'dl.import_json', entityType:'dl_document', entityId:id, newValue:{ file, status, importKey } });
    report.push({file,status:existing?'overwritten':'imported',id,title:meta.title});
  }catch(e){ report.push({file,status:'error',reason:e.message}); }
}
const out={startedAt:ts0,finishedAt:nowIso(),owner:owner.username,count:report.length,items:report};
const reportFile=path.resolve(process.cwd(),`import-dl-json-report-${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
fs.writeFileSync(reportFile, JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
console.log(`Rapport écrit: ${reportFile}`);
if(report.some(r=>r.status==='error')) process.exitCode=2;
