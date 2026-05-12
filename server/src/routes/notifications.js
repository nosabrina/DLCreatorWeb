import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { assertPermission } from '../services/permissions-service.js';
import { writeAudit } from '../db/audit.js';
import { testSmtpConnection, sendMail, isDryRun } from '../services/mail-service.js';
import { runReminderJob } from '../services/reminder-service.js';

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);
function requireAdmin(req){ assertPermission(req.user, 'admin:dashboard'); }
const pageSchema = z.object({ limit:z.coerce.number().int().min(1).max(200).optional().default(50), offset:z.coerce.number().int().min(0).optional().default(0), status:z.string().trim().max(40).optional(), eventType:z.string().trim().max(80).optional() });

notificationsRouter.get('/email-log', (req,res,next)=>{ try{
  requireAdmin(req); const q=pageSchema.parse(req.query || {}); const where=[]; const params={ limit:q.limit, offset:q.offset };
  if (q.status) { where.push('status = @status'); params.status=q.status; }
  if (q.eventType) { where.push('event_type = @eventType'); params.eventType=q.eventType; }
  const items=getDb().prepare(`SELECT id,event_type,dl_id,recipient_user_id,recipient_email,subject,status,dry_run,error_message,sent_at,created_at,metadata_json FROM email_notifications ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY created_at DESC LIMIT @limit OFFSET @offset`).all(params);
  writeAudit({ userId:req.user.id, action:'notification.email_log', entityType:'email_notification', newValue:{ limit:q.limit, offset:q.offset, status:q.status || null, eventType:q.eventType || null }, req });
  res.json({ items });
}catch(err){ next(err); }});

notificationsRouter.post('/test-smtp', async (req,res,next)=>{ try{
  requireAdmin(req); const result=await testSmtpConnection();
  writeAudit({ userId:req.user.id, action:'notification.test_smtp', entityType:'notification', newValue:{ ok:result.ok, dryRun:result.dryRun }, req });
  res.json(result);
}catch(err){ writeAudit({ userId:req.user?.id || null, action:'notification.test_smtp', entityType:'notification', newValue:{ ok:false, error:err.message }, req }); next(err); }});

notificationsRouter.post('/test-email', async (req,res,next)=>{ try{
  requireAdmin(req);
  const body=z.object({ to:z.string().email(), subject:z.string().trim().min(1).max(200).optional().default('Test DL Creator Web'), text:z.string().trim().max(4000).optional().default('E-mail de test DL Creator Web.'), dryRun:z.boolean().optional().default(true) }).parse(req.body || {});
  const results=await sendMail({ to:body.to, subject:body.subject, text:body.text, html:null, templateKey:'notification.test_email', metadata:{ actorUserId:req.user.id, forcedDryRun:body.dryRun }, req });
  writeAudit({ userId:req.user.id, action:'notification.test_email', entityType:'notification', newValue:{ resultCount:results.length, dryRun:isDryRun() || body.dryRun }, req });
  res.json({ ok:true, dryRun:isDryRun() || body.dryRun, results });
}catch(err){ next(err); }});

notificationsRouter.post('/run-reminders', async (req,res,next)=>{ try{
  requireAdmin(req); const body=z.object({ dryRun:z.boolean().optional().nullable() }).parse(req.body || {});
  const result=await runReminderJob({ dryRun:body.dryRun, actorUser:req.user, req });
  res.json({ ok:true, item:result });
}catch(err){ next(err); }});

notificationsRouter.get('/reminder-runs', (req,res,next)=>{ try{
  requireAdmin(req); const q=pageSchema.parse(req.query || {});
  const items=getDb().prepare('SELECT * FROM reminder_runs ORDER BY started_at DESC LIMIT @limit OFFSET @offset').all({ limit:q.limit, offset:q.offset });
  res.json({ items });
}catch(err){ next(err); }});
