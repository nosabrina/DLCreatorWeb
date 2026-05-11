import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '..');
const baseUrl = (process.env.SMOKE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const username = process.env.SMOKE_ADMIN_USERNAME || process.env.ADMIN_USERNAME || 'admin';
const password = process.env.SMOKE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

if (!password) {
  console.error('SMOKE_ADMIN_PASSWORD ou ADMIN_PASSWORD manquant. Exécuter seed:admin puis relancer le test avec le mot de passe Admin.');
  process.exit(2);
}

const state = { token:null, user:null, createdIds:[] };
const results = [];

function logStep(name, ok, details = {}) {
  results.push({ name, ok, ...details });
  const icon = ok ? 'OK' : 'FAIL';
  console.log(`[${icon}] ${name}${details.status ? ` (${details.status})` : ''}`);
}

async function request(method, path, body, expected = [200]) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(state.token ? { authorization: `Bearer ${state.token}` } : {})
    },
    body: body == null ? undefined : JSON.stringify(body)
  });
  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw:text }; }
  if (!expected.includes(res.status)) {
    const err = new Error(`${method} ${path} => HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return { status:res.status, data };
}

async function step(name, fn) {
  try {
    const details = await fn();
    logStep(name, true, details || {});
    return details;
  } catch (err) {
    logStep(name, false, { status:err.status || 'ERR', error:err.message, data:err.data });
    throw err;
  }
}

function sampleDl(title) {
  return {
    title,
    domain:'FOBA',
    theme:'Smoke test Phase 8',
    subtheme:'Pré-production',
    publicTarget:'Test API',
    jsonData:{
      meta:{ title, smokeTest:true, createdAt:new Date().toISOString() },
      generalites:{ domaine:'FOBA', theme:'Smoke test Phase 8' },
      filRouge:[]
    }
  };
}

async function main() {
  await step('health', async()=>{ const r=await request('GET','/health',null,[200]); return { service:r.data?.service, phase:r.data?.phase }; });
  await step('login admin', async()=>{ const r=await request('POST','/auth/login',{ username, password },[200]); state.token=r.data.accessToken; state.user=r.data.user; return { user:state.user?.username, role:state.user?.role }; });
  await step('/api/auth/me', async()=>{ const r=await request('GET','/auth/me',null,[200]); return { user:r.data.user?.username }; });

  let dl1;
  await step('création DL', async()=>{ const r=await request('POST','/dl',sampleDl(`Smoke Phase 8 privée ${Date.now()}`),[201]); dl1=r.data; state.createdIds.push(dl1.id); return { id:dl1.id, status:dl1.status }; });
  await step('liste DL', async()=>{ const r=await request('GET','/dl',null,[200]); return { count:r.data.items?.length || 0 }; });
  await step('lecture DL', async()=>{ const r=await request('GET',`/dl/${dl1.id}`,null,[200]); return { id:r.data.id, version:r.data.version }; });
  await step('assignation', async()=>{ const r=await request('POST',`/dl/${dl1.id}/assign`,{ assignedToUserId:state.user.id, comment:'Assignation smoke-test Phase 8' },[200]); return { status:r.data.item?.status }; });
  await step('modification DL', async()=>{ const payload=sampleDl(`Smoke Phase 8 privée modifiée ${Date.now()}`); const r=await request('PUT',`/dl/${dl1.id}`,payload,[200]); return { status:r.data.status, version:r.data.version }; });
  await step('soumission', async()=>{ const r=await request('POST',`/dl/${dl1.id}/submit`,{ comment:'Soumission smoke-test Phase 8' },[200]); return { status:r.data.item?.status }; });
  await step('refus sans commentaire = erreur attendue', async()=>{ const r=await request('POST',`/dl/${dl1.id}/reject`,{},[400]); return { expectedStatus:r.status }; });
  await step('refus avec commentaire', async()=>{ const r=await request('POST',`/dl/${dl1.id}/reject`,{ comment:'Refus volontaire smoke-test Phase 8' },[200]); return { status:r.data.item?.status }; });
  await step('nouvelle soumission après correction', async()=>{ const payload=sampleDl(`Smoke Phase 8 privée corrigée ${Date.now()}`); await request('PUT',`/dl/${dl1.id}`,payload,[200]); const r=await request('POST',`/dl/${dl1.id}/submit`,{ comment:'Nouvelle soumission smoke-test Phase 8' },[200]); return { status:r.data.item?.status }; });
  await step('validation privée', async()=>{ const r=await request('POST',`/dl/${dl1.id}/validate-private`,{ comment:'Validation privée smoke-test Phase 8' },[200]); return { status:r.data.item?.status }; });

  let dl2;
  await step('création seconde DL', async()=>{ const r=await request('POST','/dl',sampleDl(`Smoke Phase 8 bibliothèque ${Date.now()}`),[201]); dl2=r.data; state.createdIds.push(dl2.id); return { id:dl2.id, status:dl2.status }; });
  await step('validation bibliothèque', async()=>{ await request('POST',`/dl/${dl2.id}/assign`,{ assignedToUserId:state.user.id, comment:'Assignation bibliothèque smoke-test' },[200]); await request('PUT',`/dl/${dl2.id}`,sampleDl(`Smoke Phase 8 bibliothèque prête ${Date.now()}`),[200]); await request('POST',`/dl/${dl2.id}/submit`,{ comment:'Soumission bibliothèque smoke-test' },[200]); const r=await request('POST',`/dl/${dl2.id}/validate-library`,{ comment:'Publication bibliothèque smoke-test' },[200]); return { status:r.data.item?.status }; });
  await step('liste bibliothèque', async()=>{ const r=await request('GET','/library?limit=10',null,[200]); return { total:r.data.total, count:r.data.items?.length || 0 }; });
  await step('compteur nouveautés bibliothèque', async()=>{ const r=await request('GET','/library/stats/new-count',null,[200]); return { count:r.data.count }; });
  await step('dashboard summary', async()=>{ const r=await request('GET','/admin/dashboard/summary',null,[200]); return { totalDocuments:r.data.totalDocuments, submitted:r.data.submitted }; });
  await step('notifications dry-run', async()=>{ const r=await request('POST','/admin/notifications/test-email',{ to:state.user.email, subject:'Smoke test Phase 8', text:'Dry-run smoke-test Phase 8', dryRun:true },[200]); return { dryRun:r.data.dryRun, resultCount:r.data.results?.length || 0 }; });
  await step('run reminders dry-run', async()=>{ const r=await request('POST','/admin/notifications/run-reminders',{ dryRun:true },[200]); return { status:r.data.item?.status, scannedCount:r.data.item?.scannedCount }; });
  await step('backup check', async()=>{ execFileSync('npm',['run','backup'],{ cwd:serverRoot, stdio:'pipe', env:process.env }); return { ok:true }; });

  console.log('\nRésumé smoke-test Phase 8');
  console.log(JSON.stringify({ ok:true, apiBaseUrl:baseUrl, user:state.user?.username, createdTestDlIds:state.createdIds, steps:results }, null, 2));
}

main().catch(err => {
  console.error('\nSmoke-test interrompu:', err.message);
  console.error(JSON.stringify({ ok:false, apiBaseUrl:baseUrl, steps:results }, null, 2));
  process.exit(1);
});
