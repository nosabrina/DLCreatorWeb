import { nanoid } from 'nanoid';
import { getDb, nowIso } from '../db/database.js';
import { writeAudit } from '../db/audit.js';
import { notifyWorkflowEvent } from './notification-service.js';

const FINAL = new Set(['validated_private','validated_library','archived']);
function daysSince(iso){ const t = new Date(iso || 0).getTime(); return Number.isFinite(t) ? Math.floor((Date.now()-t)/86400000) : 0; }
function envInt(name, fallback){ const n = Number(process.env[name]); return Number.isFinite(n) ? n : fallback; }
function alreadyRemindedToday(dlId, eventType){
  const start = new Date(); start.setHours(0,0,0,0);
  const row = getDb().prepare('SELECT 1 FROM email_notifications WHERE dl_id = ? AND event_type = ? AND created_at >= ? LIMIT 1').get(dlId, eventType, start.toISOString());
  return !!row;
}
export function findNotStartedDocuments(){
  const threshold = envInt('REMINDER_NOT_STARTED_DAYS', 7);
  return getDb().prepare(`SELECT * FROM dl_documents WHERE deleted_at IS NULL AND status = 'assigned' AND first_saved_at IS NULL AND assigned_at IS NOT NULL`).all()
    .filter(d => daysSince(d.assigned_at) >= threshold && !alreadyRemindedToday(d.id, 'dl_not_started_reminder'));
}
export function findLateDocuments(){
  const grace = envInt('REMINDER_LATE_DAYS', 1);
  return getDb().prepare(`SELECT * FROM dl_documents WHERE deleted_at IS NULL`).all()
    .filter(d => !FINAL.has(d.status) && d.due_at && (Date.now() - new Date(d.due_at).getTime()) / 86400000 >= grace && !alreadyRemindedToday(d.id, 'dl_late_reminder'));
}
async function sendForDocs(docs, templateKey, actorUser, req){
  let sent=0, errors=0;
  for (const dl of docs) {
    const res = await notifyWorkflowEvent(templateKey, dl, actorUser, { req, daysLate:dl.due_at ? Math.max(1, Math.ceil((Date.now()-new Date(dl.due_at).getTime())/86400000)) : null, daysSinceAssigned:daysSince(dl.assigned_at), includeAdmins:templateKey === 'dl_late_reminder' });
    sent += res.filter(r => ['sent','dry_run'].includes(r.status)).length;
    errors += res.filter(r => r.status === 'failed').length;
  }
  return { sent, errors };
}
export async function sendNotStartedReminders({ actorUser = null, req = null } = {}){ const docs=findNotStartedDocuments(); const r=await sendForDocs(docs,'dl_not_started_reminder',actorUser,req); return { scanned:docs.length, ...r }; }
export async function sendLateReminders({ actorUser = null, req = null } = {}){ const docs=findLateDocuments(); const r=await sendForDocs(docs,'dl_late_reminder',actorUser,req); return { scanned:docs.length, ...r }; }
export async function runReminderJob({ dryRun = null, actorUser = null, req = null } = {}){
  const id = nanoid(); const startedAt=nowIso();
  getDb().prepare(`INSERT INTO reminder_runs (id,run_type,started_at,status,metadata_json) VALUES (?,?,?,?,?)`).run(id,'manual',startedAt,'running',JSON.stringify({ dryRun, actorUserId:actorUser?.id || null }));
  writeAudit({ userId:actorUser?.id || null, action:'reminder.run_started', entityType:'reminder_run', entityId:id, newValue:{ dryRun }, req });
  let scanned=0, sent=0, errors=0, status='finished';
  try{
    const a=await sendNotStartedReminders({ actorUser, req });
    const b=await sendLateReminders({ actorUser, req });
    scanned=a.scanned+b.scanned; sent=a.sent+b.sent; errors=a.errors+b.errors;
    if (errors) status='finished_with_errors';
  }catch(err){ status='failed'; errors += 1; }
  getDb().prepare(`UPDATE reminder_runs SET finished_at=?, status=?, scanned_count=?, sent_count=?, error_count=? WHERE id=?`).run(nowIso(),status,scanned,sent,errors,id);
  writeAudit({ userId:actorUser?.id || null, action:'reminder.run_finished', entityType:'reminder_run', entityId:id, newValue:{ status, scanned, sent, errors }, req });
  return { id, status, scannedCount:scanned, sentCount:sent, errorCount:errors };
}
