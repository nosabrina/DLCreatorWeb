import nodemailer from 'nodemailer';
import { nanoid } from 'nanoid';
import { getDb, nowIso } from '../db/database.js';
import { writeAudit } from '../db/audit.js';
import { renderMailTemplate } from './mail-templates.js';

const VALID_STATUSES = new Set(['queued','sent','dry_run','failed','skipped']);
function boolEnv(name, fallback = false){ const v = process.env[name]; if (v == null || v === '') return fallback; return ['1','true','yes','on'].includes(String(v).toLowerCase()); }
function intEnv(name, fallback){ const n = Number(process.env[name]); return Number.isFinite(n) ? n : fallback; }
export function isMailEnabled(){ return boolEnv('MAIL_ENABLED', false); }
export function isDryRun(){ return boolEnv('MAIL_DRY_RUN', true) || !isMailEnabled(); }
function validEmail(email){ return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()); }
function mask(email){ if (!email) return null; const [u,d] = String(email).split('@'); return `${u.slice(0,2)}***@${d || '***'}`; }
function normalizeRecipient(r){
  if (!r) return null;
  if (typeof r === 'string') return validEmail(r) ? { email:r.trim(), userId:null } : null;
  const email = r.email || r.recipient_email;
  if (!validEmail(email)) return null;
  return { email:String(email).trim(), userId:r.id || r.user_id || r.userId || null };
}
function normalizeRecipients(value){
  const raw = Array.isArray(value) ? value : (value ? [value] : []);
  const seen = new Set(); const out=[];
  for (const r of raw.map(normalizeRecipient).filter(Boolean)) { const k = r.email.toLowerCase(); if (!seen.has(k)) { seen.add(k); out.push(r); } }
  return out;
}
function getTransporter(){
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.local',
    port: intEnv('SMTP_PORT', 587),
    secure: boolEnv('SMTP_SECURE', false),
    auth: process.env.SMTP_USER ? { user:process.env.SMTP_USER, pass:process.env.SMTP_PASSWORD || '' } : undefined
  });
}
export function recordMailEvent({ eventType, dlId = null, recipientUserId = null, recipientEmail = null, subject, text, html = null, status, dryRun = null, errorMessage = null, metadata = null }){
  const finalStatus = VALID_STATUSES.has(status) ? status : 'failed';
  const id = nanoid();
  getDb().prepare(`INSERT INTO email_notifications (id,event_type,dl_id,recipient_user_id,recipient_email,subject,body_text,body_html,status,dry_run,error_message,sent_at,created_at,metadata_json)
    VALUES (@id,@eventType,@dlId,@recipientUserId,@recipientEmail,@subject,@bodyText,@bodyHtml,@status,@dryRun,@errorMessage,@sentAt,@createdAt,@metadataJson)`).run({
      id, eventType:eventType || 'manual', dlId, recipientUserId, recipientEmail, subject:subject || '(sans sujet)', bodyText:text || '', bodyHtml:html || null,
      status:finalStatus, dryRun:dryRun == null ? (isDryRun() ? 1 : 0) : (dryRun ? 1 : 0), errorMessage:errorMessage ? String(errorMessage).slice(0, 1000) : null,
      sentAt:finalStatus === 'sent' ? nowIso() : null, createdAt:nowIso(), metadataJson:metadata == null ? null : JSON.stringify(metadata)
    });
  return id;
}
export function renderTemplate(templateKey, data){ return renderMailTemplate(templateKey, data); }
export async function sendMail({ to, cc, bcc, subject, text, html, templateKey = 'manual', metadata = {}, req = null }){
  const recipients = normalizeRecipients(to);
  if (!recipients.length) {
    const id = recordMailEvent({ eventType:templateKey, subject:subject || '(sans destinataire)', text:text || '', html, status:'skipped', dryRun:isDryRun(), metadata:{ ...metadata, reason:'no_valid_recipient' } });
    writeAudit({ userId:metadata.actorUserId || null, action:'notification.skipped', entityType:'email_notification', entityId:id, newValue:{ eventType:templateKey, reason:'no_valid_recipient' }, req });
    return [{ status:'skipped', id }];
  }
  const dry = isDryRun() || metadata.forceDryRun === true || metadata.forcedDryRun === true;
  const results=[];
  for (const r of recipients) {
    if (!isMailEnabled() || dry) {
      const id = recordMailEvent({ eventType:templateKey, dlId:metadata.dlId || null, recipientUserId:r.userId, recipientEmail:r.email, subject, text, html, status:'dry_run', dryRun:true, metadata });
      writeAudit({ userId:metadata.actorUserId || null, action:'notification.dry_run', entityType:'email_notification', entityId:id, newValue:{ eventType:templateKey, to:mask(r.email), dlId:metadata.dlId || null }, req });
      results.push({ status:'dry_run', id }); continue;
    }
    try{
      await getTransporter().sendMail({ from:process.env.SMTP_FROM || 'DL Creator <no-reply@sdis.local>', replyTo:process.env.SMTP_REPLY_TO || undefined, to:r.email, cc, bcc, subject, text, html });
      const id = recordMailEvent({ eventType:templateKey, dlId:metadata.dlId || null, recipientUserId:r.userId, recipientEmail:r.email, subject, text, html, status:'sent', dryRun:false, metadata });
      writeAudit({ userId:metadata.actorUserId || null, action:'notification.sent', entityType:'email_notification', entityId:id, newValue:{ eventType:templateKey, to:mask(r.email), dlId:metadata.dlId || null }, req });
      results.push({ status:'sent', id });
    }catch(err){
      const id = recordMailEvent({ eventType:templateKey, dlId:metadata.dlId || null, recipientUserId:r.userId, recipientEmail:r.email, subject, text, html, status:'failed', dryRun:false, errorMessage:err.message, metadata });
      writeAudit({ userId:metadata.actorUserId || null, action:'notification.failed', entityType:'email_notification', entityId:id, newValue:{ eventType:templateKey, to:mask(r.email), dlId:metadata.dlId || null, error:err.message }, req });
      results.push({ status:'failed', id, error:err.message });
    }
  }
  return results;
}
export async function sendTemplateMail(templateKey, recipients, data = {}, metadata = {}){
  const rendered = renderTemplate(templateKey, data);
  return sendMail({ to:recipients, subject:rendered.subject, text:rendered.text, html:rendered.html, templateKey, metadata });
}
export async function testSmtpConnection(){
  if (!isMailEnabled()) return { ok:true, dryRun:true, message:'MAIL_ENABLED=false : test SMTP simulé, aucun secret exposé.' };
  if (isDryRun()) return { ok:true, dryRun:true, message:'MAIL_DRY_RUN=true : test SMTP simulé.' };
  await getTransporter().verify();
  return { ok:true, dryRun:false, message:'Connexion SMTP vérifiée.' };
}
export const maskEmail = mask;
